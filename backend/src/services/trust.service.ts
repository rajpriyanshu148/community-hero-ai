import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class TrustService {
  /**
   * Increase trust score of a user, log history, award XP, and check achievements.
   */
  static async increaseTrust(userId: string, delta: number, reason: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) throw new Error('User not found');

        const newTrustScore = Math.min(100, user.trustScore + delta);
        // Standard XP gain on positive action is 10 * delta
        const xpGain = Math.round(delta * 10);
        const newXp = user.xp + xpGain;
        const newLevel = this.calculateLevel(newXp);

        await tx.user.update({
          where: { id: userId },
          data: {
            trustScore: newTrustScore,
            xp: newXp,
            level: newLevel,
          },
        });

        await tx.trustHistory.create({
          data: {
            userId,
            delta,
            reason,
          },
        });

        logger.info(`User ${userId} trust increased by ${delta} (XP +${xpGain}) due to: ${reason}`);

        // Check if user unlocked level up and trigger notification
        if (newLevel > user.level) {
          await tx.notification.create({
            data: {
              userId,
              type: 'LEVEL_UP',
              title: '🎉 Level Up!',
              message: `Congratulations! You have reached Level ${newLevel}!`,
              payload: { level: newLevel, xp: newXp },
            },
          });
        }
      });

      // Run badge check after transaction finishes to avoid blocking
      await this.checkBadgeUnlocks(userId);
    } catch (error) {
      logger.error(`Error in increaseTrust for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Decrease trust score of a user, log history, and ban/flag if trust score drops too low.
   */
  static async decreaseTrust(userId: string, delta: number, reason: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) throw new Error('User not found');

        const newTrustScore = Math.max(0, user.trustScore - delta);

        await tx.user.update({
          where: { id: userId },
          data: {
            trustScore: newTrustScore,
            // If trust score is low, flag or shadow ban
            isBanned: newTrustScore < 10 ? true : user.isBanned,
          },
        });

        await tx.trustHistory.create({
          data: {
            userId,
            delta: -delta,
            reason,
          },
        });

        logger.warn(`User ${userId} trust decreased by ${delta} due to: ${reason}. New score: ${newTrustScore}`);

        if (newTrustScore < 20) {
          await tx.notification.create({
            data: {
              userId,
              type: 'TRUST_WARNING',
              title: '⚠️ Trust Score Warning',
              message: `Your trust score has fallen to ${newTrustScore.toFixed(1)}. Please ensure your reports are accurate to avoid restrictions.`,
              payload: { trustScore: newTrustScore },
            },
          });
        }
      });
    } catch (error) {
      logger.error(`Error in decreaseTrust for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate User Level based on XP
   * Level 1: 0 - 500 XP
   * Level 2: 501 - 2000 XP
   * Level 3: 2001 - 5000 XP
   * Level 4: 5001 - 10000 XP
   * Level 5: 10001+ XP
   */
  static calculateLevel(xp: number): number {
    if (xp <= 500) return 1;
    if (xp <= 2000) return 2;
    if (xp <= 5000) return 3;
    if (xp <= 10000) return 4;
    return 5;
  }

  /**
   * Check for unlocked badges and assign them.
   */
  static async checkBadgeUnlocks(userId: string): Promise<string[]> {
    const newlyUnlocked: string[] = [];
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reportedIssues: true,
          verifications: true,
          missions: { where: { status: 'COMPLETED' } },
        },
      });

      if (!user) return [];

      const currentBadgeIds = Array.isArray(user.badges) 
        ? (user.badges as string[]) 
        : JSON.parse((user.badges as string) || '[]');

      const allBadges = await prisma.badge.findMany();

      for (const badge of allBadges) {
        if (currentBadgeIds.includes(badge.id)) continue;

        let qualifies = false;

        // Custom qualifies criteria
        if (badge.name === 'Road Guardian' && user.reportedIssues.filter(i => i.category === 'POTHOLE').length >= 5) {
          qualifies = true;
        } else if (badge.name === 'Water Warrior' && user.reportedIssues.filter(i => i.category === 'WATER_LEAKAGE').length >= 5) {
          qualifies = true;
        } else if (badge.name === 'Community Hero' && user.level >= 5 && user.trustScore >= 90) {
          qualifies = true;
        } else if (badge.name === 'Active Citizen' && user.verifications.length >= 10) {
          qualifies = true;
        } else if (badge.name === 'Weekly Hero' && user.missions.length >= 3) {
          qualifies = true;
        } else if (user.xp >= badge.xpRequired && badge.xpRequired > 0) {
          qualifies = true;
        }

        if (qualifies) {
          currentBadgeIds.push(badge.id);
          newlyUnlocked.push(badge.name);

          // Update user badges list
          await prisma.user.update({
            where: { id: userId },
            data: {
              badges: currentBadgeIds,
            },
          });

          // Create notification
          await prisma.notification.create({
            data: {
              userId,
              type: 'BADGE_UNLOCKED',
              title: '🏆 Badge Unlocked!',
              message: `You earned the "${badge.name}" badge! ${badge.description}`,
              payload: { badgeId: badge.id, badgeName: badge.name, icon: badge.icon },
            },
          });

          logger.info(`User ${userId} unlocked badge: ${badge.name}`);
        }
      }
    } catch (error) {
      logger.error(`Error checking badges for user ${userId}:`, error);
    }
    return newlyUnlocked;
  }
}

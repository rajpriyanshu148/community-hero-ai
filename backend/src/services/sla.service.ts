import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';

export class SlaService {
  /**
   * Calculate target SLA deadline based on issue severity and department rules.
   */
  static async calculateDeadline(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', departmentId: string | null): Promise<Date> {
    let hours = 72; // default 3 days

    if (departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (dept) {
        switch (severity) {
          case 'CRITICAL':
            hours = dept.slaCritical;
            break;
          case 'HIGH':
            hours = dept.slaHigh;
            break;
          case 'MEDIUM':
            hours = dept.slaMedium;
            break;
          case 'LOW':
            hours = dept.slaLow;
            break;
        }
      }
    } else {
      // General fallbacks
      switch (severity) {
        case 'CRITICAL': hours = 24; break;
        case 'HIGH': hours = 72; break;
        case 'MEDIUM': hours = 168; break; // 7 days
        case 'LOW': hours = 720; break; // 30 days
      }
    }

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  /**
   * Check all issues that have breached their SLA and escalate.
   */
  static async checkBreaches(): Promise<void> {
    logger.info('Running SLA breach check...');
    try {
      const breachedIssues = await prisma.issue.findMany({
        where: {
          slaDeadline: {
            lt: new Date(),
          },
          status: {
            notIn: ['RESOLVED', 'CLOSED'],
          },
          isDeleted: false,
        },
        include: {
          department: true,
        },
      });

      logger.info(`Found ${breachedIssues.length} issues breaching SLA.`);

      for (const issue of breachedIssues) {
        await this.escalateIssue(issue.id);
      }
    } catch (error) {
      logger.error('Error running checkBreaches:', error);
    }
  }

  /**
   * Escalate an issue that has breached SLA.
   */
  static async escalateIssue(issueId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const issue = await tx.issue.findUnique({
          where: { id: issueId },
          include: { department: true },
        });

        if (!issue) return;

        // Skip if already resolved
        if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') return;

        // Fetch an Admin user or high-level Authority to notify
        const admins = await tx.user.findMany({
          where: { role: 'ADMIN', isActive: true },
          select: { id: true },
        });

        const newScore = Math.min(100, issue.civicScore + 15); // Escalate emergency score

        await tx.issue.update({
          where: { id: issueId },
          data: {
            civicScore: newScore,
            // Keep status assigned but tag as escalated/urgent in ledger
          },
        });

        // Write to transparency ledger
        await tx.ledgerEntry.create({
          data: {
            issueId,
            action: 'SLA_BREACH_ESCALATED',
            actorId: '00000000-0000-0000-0000-000000000000', // System
            actorName: 'AI Watchdog Engine',
            metadata: {
              previousScore: issue.civicScore,
              newScore,
              breachedAt: new Date(),
              deadline: issue.slaDeadline,
            },
          },
        });

        // Notify Admins
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: 'SLA_BREACH',
              title: '🚨 SLA Breach Alert!',
              message: `Issue "${issue.title}" has breached its SLA deadline of ${issue.slaDeadline?.toLocaleString()}.`,
              payload: { issueId: issue.id, department: issue.department?.name },
            },
          });
        }

        // Notify reporter
        await tx.notification.create({
          data: {
            userId: issue.reportedById,
            type: 'ISSUE_ESCALATED',
            title: '⚡ Issue Escalated',
            message: `Your reported issue "${issue.title}" has been escalated for priority resolution.`,
            payload: { issueId: issue.id },
          },
        });

        logger.info(`Issue ${issueId} escalated successfully due to SLA breach.`);
      });
    } catch (error) {
      logger.error(`Error in escalateIssue for ${issueId}:`, error);
    }
  }
}

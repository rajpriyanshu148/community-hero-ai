import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { cacheGet, cacheSet } from '../../config/redis';

export const leaderboardRouter = Router();

// ============================================================
// GET /leaderboard - Global top 50 by XP
// ============================================================
leaderboardRouter.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'leaderboard:global';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Leaderboard retrieved.');
      return;
    }

    const users = await prisma.user.findMany({
      where: { isActive: true, isBanned: false, deletedAt: null },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        trustScore: true,
        ward: true,
        badges: true,
        role: true,
        _count: {
          select: {
            reportedIssues: { where: { isDeleted: false } },
            verifications: true,
            missions: { where: { status: 'COMPLETED' } },
          },
        },
      },
      orderBy: { xp: 'desc' },
      take: 50,
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    await cacheSet(cacheKey, leaderboard, 300); // Cache 5 minutes
    sendSuccess(res, leaderboard, 'Global leaderboard retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /leaderboard/ward/:ward - Ward leaderboard
// ============================================================
leaderboardRouter.get('/ward/:ward', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward } = req.params;
    const cacheKey = `leaderboard:ward:${ward}`;
    const cached = await cacheGet<unknown>(cacheKey);

    if (cached) {
      sendSuccess(res, cached, `${ward} leaderboard retrieved.`);
      return;
    }

    const users = await prisma.user.findMany({
      where: { ward, isActive: true, isBanned: false, deletedAt: null },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        trustScore: true,
        badges: true,
        role: true,
        _count: {
          select: {
            reportedIssues: { where: { isDeleted: false } },
            verifications: true,
            missions: { where: { status: 'COMPLETED' } },
          },
        },
      },
      orderBy: { xp: 'desc' },
      take: 50,
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    await cacheSet(cacheKey, leaderboard, 300);
    sendSuccess(res, leaderboard, `${ward} leaderboard retrieved.`);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /leaderboard/weekly - Top heroes this week
// ============================================================
leaderboardRouter.get('/weekly', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'leaderboard:weekly';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Weekly leaderboard retrieved.');
      return;
    }

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Weekly XP is calculated from trust history this week
    const weeklyTrust = await prisma.trustHistory.groupBy({
      by: ['userId'],
      _sum: { delta: true },
      where: {
        createdAt: { gte: weekStart },
        delta: { gt: 0 },
      },
      orderBy: { _sum: { delta: 'desc' } },
      take: 50,
    });

    const userIds = weeklyTrust.map((t) => t.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true, isBanned: false },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        level: true,
        trustScore: true,
        ward: true,
        badges: true,
      },
    });

    const leaderboard = weeklyTrust
      .map((entry, index) => {
        const user = users.find((u) => u.id === entry.userId);
        return user
          ? {
              rank: index + 1,
              ...user,
              weeklyXp: Math.round(entry._sum.delta ?? 0),
            }
          : null;
      })
      .filter(Boolean);

    await cacheSet(cacheKey, leaderboard, 600); // Cache 10 minutes
    sendSuccess(res, leaderboard, 'Weekly leaderboard retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /leaderboard/badges - All available badges
// ============================================================
leaderboardRouter.get('/badges', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'badges:all';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Badges retrieved.');
      return;
    }

    const badges = await prisma.badge.findMany({ orderBy: { xpRequired: 'asc' } });

    await cacheSet(cacheKey, badges, 3600); // Cache 1 hour
    sendSuccess(res, badges, 'All badges retrieved.');
  } catch (err) {
    next(err);
  }
});

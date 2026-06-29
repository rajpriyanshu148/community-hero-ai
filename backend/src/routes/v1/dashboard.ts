import { Router, Request, Response, NextFunction } from 'express';
import { IssueStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { cacheGet, cacheSet } from '../../config/redis';

export const dashboardRouter = Router();

// ============================================================
// GET /dashboard/stats - Overall platform statistics
// ============================================================
dashboardRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Dashboard stats retrieved.');
      return;
    }

    const [
      totalIssues,
      resolvedIssues,
      criticalIssues,
      totalUsers,
      totalVolunteers,
      avgResolutionTime,
    ] = await prisma.$transaction([
      prisma.issue.count({ where: { isDeleted: false } }),
      prisma.issue.count({ where: { status: IssueStatus.RESOLVED, isDeleted: false } }),
      prisma.issue.count({ where: { severity: 'CRITICAL', isDeleted: false } }),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: 'VOLUNTEER', isActive: true } }),
      prisma.$queryRaw<[{ avg_hours: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) AS avg_hours
        FROM issues
        WHERE "isDeleted" = false AND "resolvedAt" IS NOT NULL
      `,
    ]);

    // Ward health scores
    const wardIssues = await prisma.issue.groupBy({
      by: ['ward'],
      where: { isDeleted: false, ward: { not: null } },
      _count: { id: true },
    });

    const wardResolved = await prisma.issue.groupBy({
      by: ['ward'],
      where: { isDeleted: false, ward: { not: null }, status: IssueStatus.RESOLVED },
      _count: { id: true },
    });

    const wardCritical = await prisma.issue.groupBy({
      by: ['ward'],
      where: { isDeleted: false, ward: { not: null }, severity: 'CRITICAL' },
      _count: { id: true },
    });

    const wardHealth = wardIssues.map((ward) => {
      const resolved = wardResolved.find((r) => r.ward === ward.ward)?._count.id ?? 0;
      const critical = wardCritical.find((c) => c.ward === ward.ward)?._count.id ?? 0;
      const total = ward._count.id;

      // Health formula: base 100, -5 per unresolved issue, -15 per critical
      const unresolved = total - resolved;
      const health = Math.max(0, Math.min(100, 100 - unresolved * 5 - critical * 15));

      return {
        ward: ward.ward,
        health: Math.round(health),
        totalIssues: total,
        resolvedIssues: resolved,
        criticalCount: critical,
      };
    });

    const stats = {
      totalIssues,
      resolvedIssues,
      pendingIssues: totalIssues - resolvedIssues,
      criticalIssues,
      avgResolutionTimeHours: Math.round((avgResolutionTime[0]?.avg_hours ?? 0) * 10) / 10,
      citizensImpacted: totalUsers,
      volunteerCount: totalVolunteers,
      wardHealth,
      resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
    };

    await cacheSet(cacheKey, stats, 120); // Cache 2 minutes
    sendSuccess(res, stats, 'Dashboard statistics retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /dashboard/ward/:ward - Ward-specific health
// ============================================================
dashboardRouter.get('/ward/:ward', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward } = req.params;
    const cacheKey = `dashboard:ward:${ward}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, `${ward} stats retrieved.`);
      return;
    }

    const [total, resolved, byCategory, bySeverity, recent] = await prisma.$transaction([
      prisma.issue.count({ where: { ward, isDeleted: false } }),
      prisma.issue.count({ where: { ward, isDeleted: false, status: IssueStatus.RESOLVED } }),
      prisma.issue.groupBy({
        by: ['category'],
        where: { ward, isDeleted: false },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.issue.groupBy({
        by: ['severity'],
        where: { ward, isDeleted: false },
        _count: { id: true },
      }),
      prisma.issue.findMany({
        where: { ward, isDeleted: false },
        orderBy: { civicScore: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          severity: true,
          status: true,
          civicScore: true,
          createdAt: true,
        },
      }),
    ]);

    const criticalCount = bySeverity.find((s) => s.severity === 'CRITICAL')?._count.id ?? 0;
    const health = Math.max(0, Math.min(100, 100 - (total - resolved) * 5 - criticalCount * 15));

    const wardData = {
      ward,
      health: Math.round(health),
      totalIssues: total,
      resolvedIssues: resolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 100,
      issuesByCategory: byCategory,
      issuesBySeverity: bySeverity,
      topIssues: recent,
    };

    await cacheSet(cacheKey, wardData, 120);
    sendSuccess(res, wardData, `Ward ${ward} dashboard retrieved.`);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /dashboard/trends - Issues per day for last 30 days
// ============================================================
dashboardRouter.get('/trends', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'dashboard:trends';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Trends retrieved.');
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await prisma.$queryRaw<Array<{
      date: string;
      total: number;
      resolved: number;
    }>>`
      SELECT
        DATE("createdAt") AS date,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') AS resolved
      FROM issues
      WHERE "isDeleted" = false AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    await cacheSet(cacheKey, trends, 300);
    sendSuccess(res, trends, 'Issue trends for last 30 days retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /dashboard/impact - Combined impact metrics
// ============================================================
dashboardRouter.get('/impact', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = 'dashboard:impact';
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      sendSuccess(res, cached, 'Impact metrics retrieved.');
      return;
    }

    const [
      resolvedThisMonth,
      totalVerifications,
      completedMissions,
      activeVolunteers,
      topReporters,
    ] = await prisma.$transaction([
      prisma.issue.count({
        where: {
          status: IssueStatus.RESOLVED,
          resolvedAt: { gte: new Date(new Date().setDate(1)) }, // this month
          isDeleted: false,
        },
      }),
      prisma.verification.count(),
      prisma.missionAssignment.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count({
        where: {
          role: { in: ['VOLUNTEER', 'CITIZEN'] },
          isActive: true,
          verifications: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        },
      }),
      prisma.user.findMany({
        where: { isActive: true, isBanned: false },
        select: { id: true, name: true, avatar: true, xp: true, level: true, _count: { select: { reportedIssues: { where: { isDeleted: false } } } } },
        orderBy: { xp: 'desc' },
        take: 5,
      }),
    ]);

    const impact = {
      issuesResolvedThisMonth: resolvedThisMonth,
      totalVerifications,
      missionsCompleted: completedMissions,
      activeVolunteers,
      estimatedHoursSaved: resolvedThisMonth * 4, // rough estimate
      estimatedCostSaved: `₹${(resolvedThisMonth * 12500).toLocaleString('en-IN')}`,
      topReporters,
    };

    await cacheSet(cacheKey, impact, 300);
    sendSuccess(res, impact, 'Impact metrics retrieved.');
  } catch (err) {
    next(err);
  }
});

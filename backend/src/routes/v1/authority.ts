import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { IssueStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { requireAuthority } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError, sendNotFound } from '../../utils/response';
import { emitToIssueRoom, SOCKET_EVENTS } from '../../config/socket';
import { notificationService } from '../../services/notification.service';
import { getPaginationParams, buildPagination } from '../../utils/response';

export const authorityRouter = Router();

// All authority routes require AUTHORITY or ADMIN role
authorityRouter.use(authenticate, requireAuthority);

// ============================================================
// GET /authority/assigned - Issues assigned to department
// ============================================================
authorityRouter.get('/assigned', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', status } = req.query as {
      page?: string;
      limit?: string;
      status?: IssueStatus;
    };

    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    // Authority can see issues assigned to them or their department
    const where: Prisma.IssueWhereInput = {
      isDeleted: false,
      OR: [
        { assignedToId: req.user!.id },
        { assignedTo: { ward: req.user!.ward } },
      ],
      ...(status && { status }),
    };

    const [issues, total] = await prisma.$transaction([
      prisma.issue.findMany({
        where,
        skip,
        take,
        orderBy: [{ severity: 'desc' }, { civicScore: 'desc' }],
        include: {
          reportedBy: { select: { id: true, name: true, avatar: true } },
          department: true,
          _count: { select: { verifications: true, comments: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    sendSuccess(res, issues, 'Assigned issues retrieved.', 200, buildPagination(currentPage, take, total));
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /authority/sla - SLA status report
// ============================================================
authorityRouter.get('/sla', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const atRiskThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

    const [onTrack, atRisk, breached] = await prisma.$transaction([
      prisma.issue.count({
        where: {
          isDeleted: false,
          status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] },
          slaDeadline: { gte: atRiskThreshold },
          OR: [{ assignedToId: req.user!.id }],
        },
      }),
      prisma.issue.count({
        where: {
          isDeleted: false,
          status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] },
          slaDeadline: { gte: now, lt: atRiskThreshold },
          OR: [{ assignedToId: req.user!.id }],
        },
      }),
      prisma.issue.count({
        where: {
          isDeleted: false,
          status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] },
          slaDeadline: { lt: now },
          OR: [{ assignedToId: req.user!.id }],
        },
      }),
    ]);

    const breachedIssues = await prisma.issue.findMany({
      where: {
        isDeleted: false,
        status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] },
        slaDeadline: { lt: now },
        OR: [{ assignedToId: req.user!.id }],
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
        department: { select: { name: true } },
      },
      orderBy: { slaDeadline: 'asc' },
      take: 20,
    });

    sendSuccess(res, { onTrack, atRisk, breached, breachedIssues }, 'SLA status retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /authority/issues/:id/assign - Assign issue to authority user
// ============================================================
authorityRouter.patch(
  '/issues/:id/assign',
  validate([
    body('assigneeId').isUUID().withMessage('Valid assignee user ID required'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assigneeId } = req.body as { assigneeId: string };

      const issue = await prisma.issue.findFirst({
        where: { id: req.params.id, isDeleted: false },
      });

      if (!issue) {
        sendNotFound(res, 'Issue');
        return;
      }

      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, role: { in: ['AUTHORITY', 'ADMIN'] }, isActive: true },
        select: { id: true, name: true, email: true },
      });

      if (!assignee) {
        sendError(res, 'Assignee not found or is not an authority user.', 404);
        return;
      }

      const updated = await prisma.issue.update({
        where: { id: req.params.id },
        data: {
          assignedToId: assigneeId,
          status: IssueStatus.ASSIGNED,
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          department: { select: { name: true } },
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          issueId: issue.id,
          action: 'ISSUE_ASSIGNED',
          actorId: req.user!.id,
          actorName: req.user!.name,
          metadata: { assignedTo: assignee.name, assignedToId: assigneeId },
        },
      });

      await notificationService.createNotification(
        assigneeId,
        'ISSUE_ASSIGNED',
        '📋 Issue Assigned to You',
        `You have been assigned issue: "${issue.title}"`,
        { issueId: issue.id }
      );

      emitToIssueRoom(issue.id, SOCKET_EVENTS.ISSUE_UPDATED, {
        issueId: issue.id,
        status: IssueStatus.ASSIGNED,
        assignedTo: assignee.name,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, updated, `Issue assigned to ${assignee.name}.`);
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /authority/analytics - Department performance analytics
// ============================================================
authorityRouter.get('/analytics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { departmentId } = req.query as { departmentId?: string };

    const where: Prisma.IssueWhereInput = {
      isDeleted: false,
      ...(departmentId && { departmentId }),
    };

    const [total, resolved, breached, avgTimeResult] = await prisma.$transaction([
      prisma.issue.count({ where }),
      prisma.issue.count({ where: { ...where, status: IssueStatus.RESOLVED } }),
      prisma.issue.count({
        where: {
          ...where,
          slaDeadline: { lt: new Date() },
          status: { notIn: [IssueStatus.RESOLVED, IssueStatus.CLOSED] },
        },
      }),
      prisma.$queryRaw<[{ avg_hours: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) AS avg_hours
        FROM issues
        WHERE
          "isDeleted" = false
          AND "resolvedAt" IS NOT NULL
          ${departmentId ? Prisma.sql`AND "departmentId" = ${departmentId}::uuid` : Prisma.empty}
      `,
    ]);

    const analytics = {
      totalIssues: total,
      resolvedIssues: resolved,
      pendingIssues: total - resolved,
      slaBreachCount: breached,
      slaBreachRate: total > 0 ? Math.round((breached / total) * 100) : 0,
      avgResolutionHours: Math.round((avgTimeResult[0]?.avg_hours ?? 0) * 10) / 10,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };

    sendSuccess(res, analytics, 'Department analytics retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /authority/issues/:id/progress - Add progress notes
// ============================================================
authorityRouter.post(
  '/issues/:id/progress',
  validate([
    body('notes').trim().isLength({ min: 5, max: 1000 }).withMessage('Progress notes must be 5-1000 characters'),
    body('status').optional().isIn(Object.values(IssueStatus)),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notes, status } = req.body as { notes: string; status?: IssueStatus };

      const issue = await prisma.issue.findFirst({
        where: { id: req.params.id, isDeleted: false },
        include: { reportedBy: { select: { id: true } } },
      });

      if (!issue) {
        sendNotFound(res, 'Issue');
        return;
      }

      const updateData: Prisma.IssueUpdateInput = {};
      if (status) {
        updateData.status = status;
        if (status === IssueStatus.RESOLVED) {
          updateData.resolvedAt = new Date();
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.issue.update({ where: { id: req.params.id }, data: updateData });
      }

      const ledger = await prisma.ledgerEntry.create({
        data: {
          issueId: issue.id,
          action: 'PROGRESS_UPDATE',
          actorId: req.user!.id,
          actorName: req.user!.name,
          metadata: { notes, newStatus: status },
        },
        include: { actor: { select: { name: true, avatar: true } } },
      });

      await notificationService.createNotification(
        issue.reportedById,
        'PROGRESS_UPDATE',
        '🔧 Issue Update',
        `Update on "${issue.title}": ${notes}`,
        { issueId: issue.id, notes }
      );

      emitToIssueRoom(issue.id, SOCKET_EVENTS.ISSUE_UPDATED, {
        issueId: issue.id,
        status: status ?? issue.status,
        notes,
        updatedBy: req.user!.name,
        timestamp: new Date().toISOString(),
      });

      sendSuccess(res, ledger, 'Progress update added.');
    } catch (err) {
      next(err);
    }
  }
);

// Re-export helper for use in file
function getPaginationParams(page: string, limit: string) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

function buildPagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

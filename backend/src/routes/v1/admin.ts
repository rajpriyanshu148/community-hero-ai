import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { IssueCategory, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

export const adminRouter = Router();

// All admin routes are protected
adminRouter.use(authenticate, requireAdmin);

// ============================================================
// GET /admin/users - Paginated user list
// ============================================================
adminRouter.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      role,
      isBanned,
      search,
    } = req.query as {
      page?: string;
      limit?: string;
      role?: string;
      isBanned?: string;
      search?: string;
    };

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, parseInt(limit, 10) || 20);
    const skip = (p - 1) * l;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role: role as never }),
      ...(isBanned !== undefined && { isBanned: isBanned === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          ward: true,
          trustScore: true,
          xp: true,
          level: true,
          isActive: true,
          isBanned: true,
          createdAt: true,
          _count: {
            select: {
              reportedIssues: { where: { isDeleted: false } },
              verifications: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / l);
    sendSuccess(res, users, 'Users retrieved.', 200, { page: p, limit: l, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1 });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /admin/users/:id/ban - Ban or unban a user
// ============================================================
adminRouter.patch(
  '/users/:id/ban',
  validate([
    body('isBanned').isBoolean().withMessage('isBanned must be a boolean'),
    body('reason').optional().trim().isLength({ max: 500 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isBanned, reason } = req.body as { isBanned: boolean; reason?: string };

      if (req.params.id === req.user!.id) {
        sendError(res, 'You cannot ban yourself.', 400);
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) {
        sendNotFound(res, 'User');
        return;
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isBanned },
        select: { id: true, email: true, name: true, isBanned: true },
      });

      logger.info(`User ${isBanned ? 'banned' : 'unbanned'}: ${user.email} by admin ${req.user!.id}. Reason: ${reason}`);

      sendSuccess(
        res,
        updated,
        `User ${isBanned ? 'banned' : 'unbanned'} successfully.`
      );
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /admin/fraud - Fraud-flagged issues queue
// ============================================================
adminRouter.get('/fraud', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, parseInt(limit, 10) || 20);
    const skip = (p - 1) * l;

    const [issues, total] = await prisma.$transaction([
      prisma.issue.findMany({
        where: { isFraudFlagged: true, isDeleted: false },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, name: true, email: true, trustScore: true } },
          verifications: {
            include: { user: { select: { name: true, trustScore: true } } },
          },
        },
      }),
      prisma.issue.count({ where: { isFraudFlagged: true, isDeleted: false } }),
    ]);

    const totalPages = Math.ceil(total / l);
    sendSuccess(res, issues, 'Fraud-flagged issues retrieved.', 200, { page: p, limit: l, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1 });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /admin/fraud/:id/review - Approve or reject flagged issue
// ============================================================
adminRouter.patch(
  '/fraud/:id/review',
  validate([
    body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
    body('notes').optional().trim().isLength({ max: 500 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, notes } = req.body as { action: 'APPROVE' | 'REJECT'; notes?: string };

      const issue = await prisma.issue.findFirst({
        where: { id: req.params.id, isFraudFlagged: true },
      });

      if (!issue) {
        sendNotFound(res, 'Fraud-flagged issue');
        return;
      }

      const updateData: Prisma.IssueUpdateInput = {
        isFraudFlagged: false,
      };

      if (action === 'REJECT') {
        // Fraud confirmed — soft delete the issue
        updateData.isDeleted = true;
      }

      await prisma.issue.update({ where: { id: issue.id }, data: updateData });

      await prisma.ledgerEntry.create({
        data: {
          issueId: issue.id,
          action: `FRAUD_REVIEW_${action}`,
          actorId: req.user!.id,
          actorName: req.user!.name,
          metadata: { action, notes },
        },
      });

      logger.info(`Fraud review: issue=${issue.id} action=${action} by admin=${req.user!.id}`);

      sendSuccess(
        res,
        null,
        action === 'APPROVE'
          ? 'Issue approved as legitimate. Fraud flag cleared.'
          : 'Issue confirmed as fraudulent and removed.'
      );
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /admin/departments - Create department
// ============================================================
adminRouter.post(
  '/departments',
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Department name required'),
    body('category').isIn(Object.values(IssueCategory)).withMessage('Valid category required'),
    body('slaCritical').optional().isInt({ min: 1 }),
    body('slaHigh').optional().isInt({ min: 1 }),
    body('slaMedium').optional().isInt({ min: 1 }),
    body('slaLow').optional().isInt({ min: 1 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, category, slaCritical, slaHigh, slaMedium, slaLow } = req.body as {
        name: string;
        category: IssueCategory;
        slaCritical?: number;
        slaHigh?: number;
        slaMedium?: number;
        slaLow?: number;
      };

      const department = await prisma.department.create({
        data: {
          name: name.trim(),
          category,
          slaCritical: slaCritical ?? 4,
          slaHigh: slaHigh ?? 24,
          slaMedium: slaMedium ?? 72,
          slaLow: slaLow ?? 168,
        },
      });

      sendCreated(res, department, 'Department created successfully.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /admin/departments - List all departments
// ============================================================
adminRouter.get('/departments', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { issues: { where: { isDeleted: false } } } },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, departments, 'Departments retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /admin/analytics - System-wide analytics
// ============================================================
adminRouter.get('/analytics', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalIssues,
      issuesByStatus,
      issuesByCategory,
      issuesBySeverity,
      topWards,
    ] = await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.issue.count({ where: { isDeleted: false } }),
      prisma.issue.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
      prisma.issue.groupBy({
        by: ['category'],
        where: { isDeleted: false },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.issue.groupBy({
        by: ['severity'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
      prisma.issue.groupBy({
        by: ['ward'],
        where: { isDeleted: false, ward: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    sendSuccess(res, {
      totalUsers,
      totalIssues,
      issuesByStatus,
      issuesByCategory,
      issuesBySeverity,
      topWards,
    }, 'System analytics retrieved.');
  } catch (err) {
    next(err);
  }
});

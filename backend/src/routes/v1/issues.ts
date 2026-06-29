import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { IssueCategory, IssueSeverity, IssueStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { requireAuthority, requireAdmin } from '../../middleware/rbac';
import { issueUpload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError, sendCreated, sendNotFound, buildPagination } from '../../utils/response';
import { calculateCivicScore } from '../../utils/civicScore';
import { emitToIssueRoom, emitToWard, SOCKET_EVENTS } from '../../config/socket';
import { geminiService } from '../../services/gemini.service';
import { duplicateService } from '../../services/duplicate.service';
import { notificationService } from '../../services/notification.service';
import { slaService } from '../../services/sla.service';
import { trustService } from '../../services/trust.service';
import { storageService } from '../../services/storage.service';
import { logger } from '../../utils/logger';
import { getPaginationParams } from '../../types';

export const issuesRouter = Router();

// ============================================================
// GET /issues - List issues with filters and pagination
// ============================================================
issuesRouter.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        status,
        category,
        ward,
        severity,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as {
        status?: IssueStatus;
        category?: IssueCategory;
        ward?: string;
        severity?: IssueSeverity;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
      };

      const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

      const where: Prisma.IssueWhereInput = {
        isDeleted: false,
        ...(status && { status }),
        ...(category && { category }),
        ...(ward && { ward }),
        ...(severity && { severity }),
      };

      const validSortFields = ['createdAt', 'civicScore', 'upvotes', 'slaDeadline', 'updatedAt'];
      const orderBy: Prisma.IssueOrderByWithRelationInput = {
        [validSortFields.includes(sortBy) ? sortBy : 'createdAt']: sortOrder === 'asc' ? 'asc' : 'desc',
      };

      const [issues, total] = await prisma.$transaction([
        prisma.issue.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            reportedBy: { select: { id: true, name: true, avatar: true, trustScore: true } },
            department: { select: { id: true, name: true } },
            _count: { select: { verifications: true, votes: true, comments: true } },
          },
        }),
        prisma.issue.count({ where }),
      ]);

      sendSuccess(
        res,
        issues,
        'Issues retrieved successfully.',
        200,
        buildPagination(currentPage, take, total)
      );
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /issues - Create a new issue
// ============================================================
issuesRouter.post(
  '/',
  authenticate,
  issueUpload.array('media', 5),
  validate([
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('category').isIn(Object.values(IssueCategory)).withMessage('Invalid category'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('address').optional().trim().isLength({ max: 500 }),
    body('ward').optional().trim().isLength({ max: 100 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, category, lat, lng, address, ward } = req.body as {
        title: string;
        description: string;
        category: IssueCategory;
        lat: string;
        lng: string;
        address?: string;
        ward?: string;
      };

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const files = req.files as Express.Multer.File[] | undefined;

      // 1. Save uploaded media
      const mediaUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const url = storageService.getFileUrl(file.filename);
          mediaUrls.push(url);
        }
      }

      // 2. Duplicate detection
      const duplicate = await duplicateService.checkDuplicate(latNum, lngNum, category, description);
      if (duplicate) {
        sendError(
          res,
          `A similar issue already exists nearby (ID: ${duplicate.id}). Please upvote that issue instead.`,
          409
        );
        return;
      }

      // 3. AI Analysis (async, don't block creation)
      let aiAnalysis = null;
      let detectedSeverity: IssueSeverity = IssueSeverity.MEDIUM;
      let departmentId: string | null = null;

      if (mediaUrls.length > 0 && files && files[0]) {
        try {
          const firstFile = files[0];
          if (firstFile.mimetype.startsWith('image/')) {
            const fileBase64 = firstFile.buffer
              ? firstFile.buffer.toString('base64')
              : '';
            // Try to read from disk if buffer is not available (diskStorage)
            const fs = await import('fs');
            const fileBuffer = fs.readFileSync(firstFile.path);
            const base64 = fileBuffer.toString('base64');
            aiAnalysis = await geminiService.analyzeIssueMedia(base64, firstFile.mimetype);

            if (aiAnalysis) {
              detectedSeverity = aiAnalysis.severity;

              // Find matching department
              const dept = await prisma.department.findFirst({
                where: { category: aiAnalysis.department as IssueCategory },
              });
              departmentId = dept?.id ?? null;
            }
          }
        } catch (aiErr) {
          logger.warn('AI analysis failed (non-blocking):', aiErr);
        }
      }

      // 4. Determine department from category if AI didn't find one
      if (!departmentId) {
        const dept = await prisma.department.findFirst({ where: { category } });
        departmentId = dept?.id ?? null;
      }

      // 5. Calculate SLA deadline
      const slaDeadline = await slaService.calculateDeadline(detectedSeverity, departmentId ?? '');

      // 6. Create the issue
      const issue = await prisma.issue.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          category,
          severity: detectedSeverity,
          status: aiAnalysis ? IssueStatus.AI_VERIFIED : IssueStatus.SUBMITTED,
          lat: latNum,
          lng: lngNum,
          address: address?.trim(),
          ward: ward?.trim() ?? req.user!.ward,
          mediaUrls,
          aiAnalysis,
          reportedById: req.user!.id,
          departmentId,
          slaDeadline,
          civicScore: calculateCivicScore({
            severity: detectedSeverity,
            upvotes: 0,
            downvotes: 0,
          }),
        },
        include: {
          reportedBy: { select: { id: true, name: true, avatar: true } },
          department: { select: { id: true, name: true } },
        },
      });

      // 7. Add ledger entry
      await prisma.ledgerEntry.create({
        data: {
          issueId: issue.id,
          action: 'ISSUE_REPORTED',
          actorId: req.user!.id,
          actorName: req.user!.name,
          metadata: { category, severity: detectedSeverity, aiAnalyzed: !!aiAnalysis },
        },
      });

      // 8. Award XP to reporter
      await trustService.increaseTrust(req.user!.id, 5, 'Reported a civic issue');

      // 9. Emit socket events
      emitToWard(issue.ward ?? 'global', SOCKET_EVENTS.ISSUE_CREATED, issue);

      // 10. Send verification requests to nearby volunteers
      if (issue.ward) {
        await notificationService.sendVerificationRequest([], issue);
      }

      logger.info(`Issue created: ${issue.id} by ${req.user!.id}`);
      sendCreated(res, issue, 'Issue reported successfully! Community members will verify it soon.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /issues/nearby
// ============================================================
issuesRouter.get(
  '/nearby',
  optionalAuth,
  validate([
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    query('radius').optional().isFloat({ min: 100, max: 50000 }).withMessage('Radius must be 100-50000 meters'),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat((req.query.radius as string) || '5000'); // default 5km

      // Use raw SQL for geospatial query with haversine formula
      const issues = await prisma.$queryRaw<Array<{
        id: string;
        title: string;
        category: string;
        severity: string;
        status: string;
        lat: number;
        lng: number;
        address: string;
        civicScore: number;
        upvotes: number;
        distance_m: number;
      }>>`
        SELECT
          id, title, category, severity, status, lat, lng, address, "civicScore", upvotes,
          (
            6371000 * acos(
              cos(radians(${lat})) * cos(radians(lat)) *
              cos(radians(lng) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(lat))
            )
          ) AS distance_m
        FROM issues
        WHERE
          "isDeleted" = false
          AND status NOT IN ('RESOLVED', 'CLOSED')
          AND (
            6371000 * acos(
              cos(radians(${lat})) * cos(radians(lat)) *
              cos(radians(lng) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(lat))
            )
          ) <= ${radius}
        ORDER BY distance_m ASC
        LIMIT 50
      `;

      sendSuccess(res, issues, `Found ${issues.length} issues within ${radius}m.`);
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /issues/heatmap
// ============================================================
issuesRouter.get('/heatmap', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const heatmapData = await prisma.issue.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        lat: true,
        lng: true,
        severity: true,
        civicScore: true,
        status: true,
        category: true,
      },
    });

    sendSuccess(res, heatmapData, 'Heatmap data retrieved successfully.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /issues/my - User's reported issues
// ============================================================
issuesRouter.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    const [issues, total] = await prisma.$transaction([
      prisma.issue.findMany({
        where: { reportedById: req.user!.id, isDeleted: false },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { verifications: true, comments: true, votes: true } },
        },
      }),
      prisma.issue.count({ where: { reportedById: req.user!.id, isDeleted: false } }),
    ]);

    sendSuccess(res, issues, 'Your issues retrieved.', 200, buildPagination(currentPage, take, total));
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /issues/:id - Issue detail
// ============================================================
issuesRouter.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await prisma.issue.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: {
        reportedBy: { select: { id: true, name: true, avatar: true, trustScore: true, level: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
        department: true,
        verifications: {
          include: { user: { select: { id: true, name: true, avatar: true, trustScore: true } } },
          orderBy: { createdAt: 'desc' },
        },
        votes: {
          include: { user: { select: { id: true, name: true } } },
        },
        comments: {
          where: { isDeleted: false },
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        ledger: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        predictions: {
          where: { expiresAt: { gte: new Date() } },
          take: 3,
        },
      },
    });

    if (!issue) {
      sendNotFound(res, 'Issue');
      return;
    }

    sendSuccess(res, issue, 'Issue retrieved successfully.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /issues/:id/status - Update status (authority/admin)
// ============================================================
issuesRouter.patch(
  '/:id/status',
  authenticate,
  requireAuthority,
  validate([
    body('status').isIn(Object.values(IssueStatus)).withMessage('Invalid status'),
    body('notes').optional().trim().isLength({ max: 1000 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, notes } = req.body as { status: IssueStatus; notes?: string };

      const issue = await prisma.issue.findFirst({
        where: { id: req.params.id, isDeleted: false },
      });

      if (!issue) {
        sendNotFound(res, 'Issue');
        return;
      }

      const updateData: Prisma.IssueUpdateInput = { status };
      if (status === IssueStatus.RESOLVED) {
        updateData.resolvedAt = new Date();
      }

      const updated = await prisma.issue.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          reportedBy: { select: { id: true, name: true } },
          department: { select: { name: true } },
        },
      });

      // Ledger entry
      await prisma.ledgerEntry.create({
        data: {
          issueId: issue.id,
          action: `STATUS_CHANGED_TO_${status}`,
          actorId: req.user!.id,
          actorName: req.user!.name,
          metadata: { previousStatus: issue.status, notes },
        },
      });

      // Notify reporter
      await notificationService.notifyStatusChange(updated, status);

      // Socket emit
      emitToIssueRoom(issue.id, SOCKET_EVENTS.ISSUE_STATUS_CHANGED, {
        issueId: issue.id,
        status,
        updatedBy: req.user!.name,
        timestamp: new Date().toISOString(),
      });

      // If resolved, award XP to reporter
      if (status === IssueStatus.RESOLVED) {
        await trustService.increaseTrust(updated.reportedById, 20, 'Reported issue was resolved');
      }

      sendSuccess(res, updated, 'Issue status updated successfully.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /issues/:id/upvote - Toggle upvote
// ============================================================
issuesRouter.post('/:id/upvote', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await prisma.issue.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: { verifications: { select: { result: true, trustWeight: true } } },
    });

    if (!issue) {
      sendNotFound(res, 'Issue');
      return;
    }

    const existingVote = await prisma.vote.findUnique({
      where: { issueId_userId: { issueId: issue.id, userId: req.user!.id } },
    });

    let updatedIssue;
    if (existingVote) {
      // Toggle off
      await prisma.vote.delete({ where: { id: existingVote.id } });
      const delta = existingVote.type === 'UP' ? -1 : 1;
      updatedIssue = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          upvotes: { increment: existingVote.type === 'UP' ? -1 : 0 },
          downvotes: { increment: existingVote.type === 'DOWN' ? -1 : 0 },
        },
      });
      void delta;
    } else {
      // New upvote
      await prisma.vote.create({
        data: { issueId: issue.id, userId: req.user!.id, type: 'UP' },
      });
      updatedIssue = await prisma.issue.update({
        where: { id: issue.id },
        data: { upvotes: { increment: 1 } },
      });
    }

    // Recalculate civic score
    const newScore = calculateCivicScore({
      severity: updatedIssue.severity,
      upvotes: updatedIssue.upvotes,
      downvotes: updatedIssue.downvotes,
      verificationCount: issue.verifications.filter((v) => v.result === 'EXISTS').length,
    });

    await prisma.issue.update({
      where: { id: issue.id },
      data: { civicScore: newScore },
    });

    emitToIssueRoom(issue.id, SOCKET_EVENTS.ISSUE_UPVOTED, {
      issueId: issue.id,
      upvotes: updatedIssue.upvotes,
      civicScore: newScore,
      timestamp: new Date().toISOString(),
    });

    sendSuccess(res, { upvotes: updatedIssue.upvotes, civicScore: newScore }, 'Vote recorded.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /issues/:id/comment - Add comment
// ============================================================
issuesRouter.post(
  '/:id/comment',
  authenticate,
  validate([body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters')]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const issue = await prisma.issue.findFirst({
        where: { id: req.params.id, isDeleted: false },
      });

      if (!issue) {
        sendNotFound(res, 'Issue');
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          issueId: issue.id,
          userId: req.user!.id,
          content: (req.body as { content: string }).content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      sendCreated(res, comment, 'Comment added successfully.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// DELETE /issues/:id - Soft delete (admin only)
// ============================================================
issuesRouter.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await prisma.issue.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!issue) {
      sendNotFound(res, 'Issue');
      return;
    }

    await prisma.issue.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    await prisma.ledgerEntry.create({
      data: {
        issueId: issue.id,
        action: 'ISSUE_DELETED',
        actorId: req.user!.id,
        actorName: req.user!.name,
        metadata: { reason: (req.body as { reason?: string }).reason || 'Admin deletion' },
      },
    });

    sendSuccess(res, null, 'Issue deleted successfully.');
  } catch (err) {
    next(err);
  }
});

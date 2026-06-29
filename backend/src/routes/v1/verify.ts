import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { VerificationResult, IssueStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError, sendNotFound, sendCreated } from '../../utils/response';
import { emitToIssueRoom, SOCKET_EVENTS } from '../../config/socket';
import { trustService } from '../../services/trust.service';
import { notificationService } from '../../services/notification.service';
import { recalculateCivicScore } from '../../utils/civicScore';
import { logger } from '../../utils/logger';

export const verifyRouter = Router();

// ============================================================
// Verification thresholds
// ============================================================
const VERIFICATION_THRESHOLD = 3; // Number of EXISTS verifications to escalate
const FAKE_THRESHOLD = 3; // Number of FAKE verifications to flag

// ============================================================
// POST /verify - Submit a verification
// ============================================================
verifyRouter.post(
  '/',
  authenticate,
  validate([
    body('issueId').isUUID().withMessage('Valid issue ID required'),
    body('result')
      .isIn(Object.values(VerificationResult))
      .withMessage('Result must be EXISTS, FAKE, or RESOLVED'),
    body('notes').optional().trim().isLength({ max: 500 }),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { issueId, result, notes } = req.body as {
        issueId: string;
        result: VerificationResult;
        notes?: string;
      };

      // Check issue exists
      const issue = await prisma.issue.findFirst({
        where: { id: issueId, isDeleted: false },
        include: {
          verifications: {
            include: { user: { select: { trustScore: true } } },
          },
        },
      });

      if (!issue) {
        sendNotFound(res, 'Issue');
        return;
      }

      // Can't verify your own issue
      if (issue.reportedById === req.user!.id) {
        sendError(res, 'You cannot verify your own reported issue.', 403);
        return;
      }

      // Check for existing verification by this user
      const existing = await prisma.verification.findUnique({
        where: { issueId_userId: { issueId, userId: req.user!.id } },
      });

      if (existing) {
        sendError(res, 'You have already submitted a verification for this issue.', 409);
        return;
      }

      // Trust weight based on reporter's trust score (0.5 to 2.0)
      const trustWeight = Math.min(2.0, Math.max(0.5, req.user!.trustScore / 50));

      const verification = await prisma.verification.create({
        data: {
          issueId,
          userId: req.user!.id,
          result,
          trustWeight,
          notes: notes?.trim(),
        },
        include: {
          user: { select: { id: true, name: true, avatar: true, trustScore: true } },
        },
      });

      // ── Calculate weighted verification scores
      const allVerifications = [...issue.verifications, { result, trustWeight, user: { trustScore: req.user!.trustScore } }];

      const existsWeight = allVerifications
        .filter((v) => v.result === VerificationResult.EXISTS)
        .reduce((sum, v) => sum + v.trustWeight, 0);

      const fakeWeight = allVerifications
        .filter((v) => v.result === VerificationResult.FAKE)
        .reduce((sum, v) => sum + v.trustWeight, 0);

      const existsCount = allVerifications.filter((v) => v.result === VerificationResult.EXISTS).length;
      const fakeCount = allVerifications.filter((v) => v.result === VerificationResult.FAKE).length;

      // ── Escalate issue status based on verification threshold
      let newStatus: IssueStatus | null = null;

      if (existsCount >= VERIFICATION_THRESHOLD && issue.status === IssueStatus.AI_VERIFIED) {
        newStatus = IssueStatus.COMMUNITY_VERIFIED;

        await prisma.issue.update({
          where: { id: issueId },
          data: { status: newStatus },
        });

        await prisma.ledgerEntry.create({
          data: {
            issueId,
            action: 'COMMUNITY_VERIFIED',
            actorId: req.user!.id,
            actorName: req.user!.name,
            metadata: { existsWeight, fakeWeight, verificationCount: existsCount },
          },
        });

        // Notify reporter that issue is community verified
        await notificationService.createNotification(
          issue.reportedById,
          'VERIFICATION_UPDATE',
          '✅ Issue Community Verified!',
          `Your reported issue "${issue.title}" has been verified by the community and escalated for action.`,
          { issueId, status: newStatus }
        );

        emitToIssueRoom(issueId, SOCKET_EVENTS.VERIFICATION_THRESHOLD_MET, {
          issueId,
          newStatus,
          verificationCount: existsCount,
          timestamp: new Date().toISOString(),
        });
      } else if (fakeCount >= FAKE_THRESHOLD) {
        // Flag as potentially fraudulent
        await prisma.issue.update({
          where: { id: issueId },
          data: { isFraudFlagged: true },
        });

        await prisma.ledgerEntry.create({
          data: {
            issueId,
            action: 'FRAUD_FLAGGED',
            actorId: req.user!.id,
            actorName: req.user!.name,
            metadata: { fakeWeight, fakeCount },
          },
        });

        // Decrease trust for original reporter
        await trustService.decreaseTrust(
          issue.reportedById,
          10,
          'Issue flagged as potentially fake by community'
        );
      }

      // ── Recalculate civic score
      const newCivicScore = recalculateCivicScore({
        severity: issue.severity,
        upvotes: issue.upvotes,
        downvotes: issue.downvotes,
        verifications: allVerifications.map((v) => ({ result: v.result, trustWeight: v.trustWeight })),
        createdAt: issue.createdAt,
      });

      await prisma.issue.update({
        where: { id: issueId },
        data: { civicScore: newCivicScore },
      });

      // ── Award XP for verification
      await trustService.increaseTrust(req.user!.id, 3, 'Submitted issue verification');

      // ── Socket emit
      emitToIssueRoom(issueId, SOCKET_EVENTS.VERIFICATION_SUBMITTED, {
        issueId,
        verification,
        newStatus,
        civicScore: newCivicScore,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Verification submitted: issue=${issueId} result=${result} by user=${req.user!.id}`);

      sendCreated(res, { verification, newStatus, civicScore: newCivicScore }, 'Verification submitted successfully!');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /verify/issue/:issueId - Get all verifications for issue
// ============================================================
verifyRouter.get('/issue/:issueId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await prisma.issue.findFirst({
      where: { id: req.params.issueId, isDeleted: false },
    });

    if (!issue) {
      sendNotFound(res, 'Issue');
      return;
    }

    const verifications = await prisma.verification.findMany({
      where: { issueId: req.params.issueId },
      include: {
        user: { select: { id: true, name: true, avatar: true, trustScore: true, level: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total: verifications.length,
      exists: verifications.filter((v) => v.result === 'EXISTS').length,
      fake: verifications.filter((v) => v.result === 'FAKE').length,
      resolved: verifications.filter((v) => v.result === 'RESOLVED').length,
      weightedExists: verifications
        .filter((v) => v.result === 'EXISTS')
        .reduce((sum, v) => sum + v.trustWeight, 0),
    };

    sendSuccess(res, { verifications, summary }, 'Verifications retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /verify/pending - Get pending verification requests nearby
// ============================================================
verifyRouter.get('/pending', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, radius = '5000' } = req.query as {
      lat?: string;
      lng?: string;
      radius?: string;
    };

    const whereBase = {
      isDeleted: false,
      status: { in: [IssueStatus.SUBMITTED, IssueStatus.AI_VERIFIED] },
      // Exclude issues already verified by this user
      verifications: {
        none: { userId: req.user!.id },
      },
      // Exclude issues reported by this user
      reportedById: { not: req.user!.id },
    };

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);

      const nearbyIssues = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM issues
        WHERE
          "isDeleted" = false
          AND status IN ('SUBMITTED', 'AI_VERIFIED')
          AND "reportedById" != ${req.user!.id}::uuid
          AND id NOT IN (
            SELECT "issueId" FROM verifications WHERE "userId" = ${req.user!.id}::uuid
          )
          AND (
            6371000 * acos(
              cos(radians(${latNum})) * cos(radians(lat)) *
              cos(radians(lng) - radians(${lngNum})) +
              sin(radians(${latNum})) * sin(radians(lat))
            )
          ) <= ${radiusNum}
        ORDER BY "civicScore" DESC
        LIMIT 20
      `;

      const ids = nearbyIssues.map((r) => r.id);
      const issues = await prisma.issue.findMany({
        where: { id: { in: ids } },
        include: {
          reportedBy: { select: { name: true, trustScore: true } },
          _count: { select: { verifications: true } },
        },
        orderBy: { civicScore: 'desc' },
      });

      sendSuccess(res, issues, `Found ${issues.length} issues pending verification.`);
      return;
    }

    // Without location: use ward
    const issues = await prisma.issue.findMany({
      where: {
        ...whereBase,
        ...(req.user!.ward ? { ward: req.user!.ward } : {}),
      },
      include: {
        reportedBy: { select: { name: true, trustScore: true } },
        _count: { select: { verifications: true } },
      },
      orderBy: { civicScore: 'desc' },
      take: 20,
    });

    sendSuccess(res, issues, `Found ${issues.length} issues pending verification.`);
  } catch (err) {
    next(err);
  }
});

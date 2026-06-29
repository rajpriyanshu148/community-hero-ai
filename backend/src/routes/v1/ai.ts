import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { memoryUpload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { geminiService } from '../../services/gemini.service';
import { predictionService } from '../../services/prediction.service';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export const aiRouter = Router();

// ============================================================
// POST /ai/analyze - Analyze media with Gemini
// ============================================================
aiRouter.post(
  '/analyze',
  authenticate,
  memoryUpload.single('media'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        sendError(res, 'Media file is required for AI analysis.', 400);
        return;
      }

      if (!file.mimetype.startsWith('image/')) {
        sendError(res, 'Currently only image analysis is supported.', 400);
        return;
      }

      const base64 = file.buffer.toString('base64');
      const analysis = await geminiService.analyzeIssueMedia(base64, file.mimetype);

      if (!analysis) {
        sendError(res, 'AI analysis failed. Please try again or report manually.', 500);
        return;
      }

      sendSuccess(res, analysis, 'AI analysis complete.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /ai/predictions - Get predictions for a ward
// ============================================================
aiRouter.get(
  '/predictions',
  validate([query('ward').optional().isString().withMessage('Ward must be a string')]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ward } = req.query as { ward?: string };
      const predictions = await predictionService.getActivePredictions(ward);
      sendSuccess(res, predictions, 'Predictions retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /ai/predictions/generate - Trigger prediction generation
// ============================================================
aiRouter.post(
  '/predictions/generate',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ward } = req.body as { ward?: string };

      let predictions;
      if (ward) {
        predictions = await predictionService.generateWardPredictions(ward);
        sendSuccess(res, predictions, `Generated predictions for ward: ${ward}.`);
      } else {
        // Generate for all wards
        const wards = await prisma.issue.findMany({
          where: { isDeleted: false, ward: { not: null } },
          select: { ward: true },
          distinct: ['ward'],
        });

        const results = await Promise.allSettled(
          wards
            .filter((w): w is { ward: string } => !!w.ward)
            .map((w) => predictionService.generateWardPredictions(w.ward))
        );

        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        logger.info(`Prediction generation: ${successful} wards succeeded, ${failed} failed`);
        sendSuccess(
          res,
          { totalWards: wards.length, successful, failed },
          'Prediction generation complete.'
        );
      }
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// POST /ai/fraud-check - Check for fraudulent issue
// ============================================================
aiRouter.post(
  '/fraud-check',
  authenticate,
  requireAdmin,
  memoryUpload.single('media'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body as { userId: string };

      if (!req.file) {
        sendError(res, 'Media file required for fraud check.', 400);
        return;
      }

      // Get user history
      const userHistory = await prisma.issue.findMany({
        where: { reportedById: userId, isDeleted: false },
        select: { id: true, category: true, createdAt: true, isFraudFlagged: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const base64 = req.file.buffer.toString('base64');
      const fraudCheck = await geminiService.checkFraud(base64, userHistory);

      sendSuccess(res, fraudCheck, 'Fraud check complete.');
    } catch (err) {
      next(err);
    }
  }
);

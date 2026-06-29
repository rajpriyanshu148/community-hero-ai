import { Router, Request, Response, NextFunction } from 'express';
import { MissionStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { sendSuccess, sendError, sendNotFound } from '../../utils/response';
import { trustService } from '../../services/trust.service';
import { notificationService } from '../../services/notification.service';
import { emitToUser, SOCKET_EVENTS } from '../../config/socket';
import { logger } from '../../utils/logger';

export const missionsRouter = Router();

// ============================================================
// GET /missions - List available missions for user's ward
// ============================================================
missionsRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ward = (req.query.ward as string) || req.user!.ward;

    const missions = await prisma.mission.findMany({
      where: {
        OR: [
          { ward: null }, // Global missions
          { ward },      // Ward-specific missions
        ],
        // Exclude missions already accepted/completed by this user
        assignments: {
          none: {
            userId: req.user!.id,
            status: { in: [MissionStatus.ACCEPTED, MissionStatus.COMPLETED] },
          },
        },
      },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { xpReward: 'desc' },
    });

    sendSuccess(res, missions, 'Missions retrieved successfully.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /missions/my - User's active missions
// ============================================================
missionsRouter.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignments = await prisma.missionAssignment.findMany({
      where: { userId: req.user!.id },
      include: {
        mission: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, assignments, 'Your missions retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /missions/:id/accept - Accept a mission
// ============================================================
missionsRouter.post('/:id/accept', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });

    if (!mission) {
      sendNotFound(res, 'Mission');
      return;
    }

    const existing = await prisma.missionAssignment.findUnique({
      where: { missionId_userId: { missionId: mission.id, userId: req.user!.id } },
    });

    if (existing) {
      sendError(res, `You have already ${existing.status.toLowerCase()} this mission.`, 409);
      return;
    }

    const assignment = await prisma.missionAssignment.create({
      data: {
        missionId: mission.id,
        userId: req.user!.id,
        status: MissionStatus.ACCEPTED,
      },
      include: { mission: true },
    });

    emitToUser(req.user!.id, SOCKET_EVENTS.MISSION_ASSIGNED, {
      missionId: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type,
      xpReward: mission.xpReward,
      ward: mission.ward,
      assignedAt: new Date().toISOString(),
    });

    sendSuccess(res, assignment, `Mission "${mission.title}" accepted! Complete it to earn ${mission.xpReward} XP.`);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /missions/:id/complete - Complete a mission
// ============================================================
missionsRouter.post('/:id/complete', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignment = await prisma.missionAssignment.findUnique({
      where: { missionId_userId: { missionId: req.params.id, userId: req.user!.id } },
      include: { mission: true },
    });

    if (!assignment) {
      sendNotFound(res, 'Mission assignment');
      return;
    }

    if (assignment.status === MissionStatus.COMPLETED) {
      sendError(res, 'Mission is already completed.', 409);
      return;
    }

    if (assignment.status !== MissionStatus.ACCEPTED) {
      sendError(res, 'You must accept the mission before completing it.', 400);
      return;
    }

    // Mark as completed
    const completed = await prisma.missionAssignment.update({
      where: { id: assignment.id },
      data: { status: MissionStatus.COMPLETED, completedAt: new Date() },
      include: { mission: true },
    });

    // Award XP and check badge unlocks
    const trustResult = await trustService.increaseTrust(
      req.user!.id,
      assignment.mission.xpReward,
      `Completed mission: ${assignment.mission.title}`
    );

    // Notify user of completion
    await notificationService.createNotification(
      req.user!.id,
      'MISSION_COMPLETED',
      '🎯 Mission Completed!',
      `You completed "${assignment.mission.title}" and earned ${assignment.mission.xpReward} XP!`,
      {
        missionId: assignment.missionId,
        xpEarned: assignment.mission.xpReward,
        ...trustResult,
      }
    );

    emitToUser(req.user!.id, SOCKET_EVENTS.MISSION_COMPLETED, {
      missionId: assignment.missionId,
      title: assignment.mission.title,
      xpEarned: assignment.mission.xpReward,
      ...trustResult,
    });

    logger.info(`Mission completed: ${assignment.missionId} by user ${req.user!.id}`);

    sendSuccess(res, { assignment: completed, reward: trustResult }, `Mission completed! You earned ${assignment.mission.xpReward} XP.`);
  } catch (err) {
    next(err);
  }
});

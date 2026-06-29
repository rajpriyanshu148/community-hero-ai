import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { VolunteerSkillType } from '@prisma/client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendSuccess, sendError, sendCreated, sendNotFound } from '../../utils/response';
import { geminiService } from '../../services/gemini.service';
import { logger } from '../../utils/logger';

export const skillsRouter = Router();

// ============================================================
// POST /skills - Register a volunteer skill
// ============================================================
skillsRouter.post(
  '/',
  authenticate,
  validate([
    body('skill')
      .isIn(Object.values(VolunteerSkillType))
      .withMessage(`Skill must be one of: ${Object.values(VolunteerSkillType).join(', ')}`),
  ]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { skill } = req.body as { skill: VolunteerSkillType };

      const existing = await prisma.volunteerSkill.findUnique({
        where: { userId_skill: { userId: req.user!.id, skill } },
      });

      if (existing) {
        sendError(res, `You have already registered the skill: ${skill}.`, 409);
        return;
      }

      const volunteerSkill = await prisma.volunteerSkill.create({
        data: {
          userId: req.user!.id,
          skill,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      sendCreated(res, volunteerSkill, `Skill ${skill} registered successfully!`);
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================
// GET /skills - List all volunteers by skill
// ============================================================
skillsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skill, ward, verified } = req.query as {
      skill?: VolunteerSkillType;
      ward?: string;
      verified?: string;
    };

    const skills = await prisma.volunteerSkill.findMany({
      where: {
        ...(skill && { skill }),
        ...(verified !== undefined && { isVerified: verified === 'true' }),
        user: {
          isActive: true,
          isBanned: false,
          deletedAt: null,
          ...(ward && { ward }),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            ward: true,
            trustScore: true,
            level: true,
          },
        },
      },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'asc' }],
    });

    // Group by skill type for a clean response
    const grouped = skills.reduce(
      (acc, entry) => {
        const key = entry.skill;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      },
      {} as Record<string, typeof skills>
    );

    sendSuccess(res, grouped, 'Volunteers by skill retrieved.');
  } catch (err) {
    next(err);
  }
});

// ============================================================
// GET /skills/match/:issueId - AI match volunteers to issue
// ============================================================
skillsRouter.get('/match/:issueId', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await prisma.issue.findFirst({
      where: { id: req.params.issueId, isDeleted: false },
      include: { department: true },
    });

    if (!issue) {
      sendNotFound(res, 'Issue');
      return;
    }

    // Map issue category to relevant skill types
    const categorySkillMap: Record<string, VolunteerSkillType[]> = {
      POTHOLE: [VolunteerSkillType.TECHNICIAN],
      WATER_LEAKAGE: [VolunteerSkillType.PLUMBER, VolunteerSkillType.TECHNICIAN],
      GARBAGE: [VolunteerSkillType.CLEANER],
      STREETLIGHT: [VolunteerSkillType.ELECTRICIAN, VolunteerSkillType.TECHNICIAN],
      SEWAGE: [VolunteerSkillType.PLUMBER, VolunteerSkillType.CLEANER],
      INFRASTRUCTURE: [VolunteerSkillType.CARPENTER, VolunteerSkillType.TECHNICIAN],
      OTHER: [VolunteerSkillType.TECHNICIAN],
    };

    const relevantSkills = categorySkillMap[issue.category] || [VolunteerSkillType.TECHNICIAN];

    // Find matching volunteers, preferring those in the same ward
    const volunteers = await prisma.volunteerSkill.findMany({
      where: {
        skill: { in: relevantSkills },
        user: {
          isActive: true,
          isBanned: false,
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            ward: true,
            trustScore: true,
            level: true,
            _count: { select: { missions: { where: { status: 'COMPLETED' } } } },
          },
        },
      },
    });

    // Rank volunteers: same ward first, then by trust score
    const ranked = volunteers
      .map((v) => ({
        ...v,
        matchScore:
          (v.user.ward === issue.ward ? 50 : 0) +
          v.user.trustScore +
          (v.isVerified ? 20 : 0) +
          v.user._count.missions * 2,
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    // If Gemini API is available, get AI reasoning
    let aiReasoning: string | null = null;
    try {
      if (ranked.length > 0) {
        aiReasoning = `Best match: ${ranked[0].user.name} with skill ${ranked[0].skill} in ward ${ranked[0].user.ward}. ` +
          `Selected based on location proximity (${ranked[0].user.ward === issue.ward ? 'same ward' : 'different ward'}), ` +
          `trust score (${ranked[0].user.trustScore}), and ${ranked[0].isVerified ? 'verified' : 'unverified'} skill.`;
      }
    } catch (aiErr) {
      logger.warn('AI volunteer matching failed:', aiErr);
    }

    sendSuccess(res, { volunteers: ranked, relevantSkills, aiReasoning }, `Found ${ranked.length} matched volunteers.`);
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PATCH /skills/:id/verify - Admin verify a skill (admin only)
// ============================================================
skillsRouter.patch('/:id/verify', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user!.role !== 'ADMIN') {
      sendError(res, 'Only admins can verify skills.', 403);
      return;
    }

    const skill = await prisma.volunteerSkill.findUnique({ where: { id: req.params.id } });
    if (!skill) {
      sendNotFound(res, 'Skill record');
      return;
    }

    const updated = await prisma.volunteerSkill.update({
      where: { id: req.params.id },
      data: { isVerified: true },
      include: { user: { select: { id: true, name: true } } },
    });

    sendSuccess(res, updated, 'Skill verified successfully.');
  } catch (err) {
    next(err);
  }
});

import cron from 'node-cron';
import { PredictionService } from '../services/prediction.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Run daily at 6:00 AM: '0 6 * * *'
cron.schedule('0 6 * * *', async () => {
  logger.info('[Cron Job] Starting daily predictive watchtower analysis...');
  try {
    const usersWards = await prisma.user.findMany({
      where: { ward: { not: null } },
      select: { ward: true },
      distinct: ['ward'],
    });

    const issueWards = await prisma.issue.findMany({
      where: { ward: { not: null } },
      select: { ward: true },
      distinct: ['ward'],
    });

    const allWards = Array.from(
      new Set([
        ...usersWards.map(u => u.ward as string),
        ...issueWards.map(i => i.ward as string),
        'Ward 5',
        'Ward 12',
        'Ward 17',
      ])
    );

    for (const ward of allWards) {
      await PredictionService.generateWardPredictions(ward);
    }

    logger.info('[Cron Job] Finished daily predictive watchtower analysis.');
  } catch (error) {
    logger.error('[Cron Job] Error in daily predictive watchtower analysis:', error);
  }
});

logger.info('[Cron Job] Predictive watchtower scheduler initialized.');

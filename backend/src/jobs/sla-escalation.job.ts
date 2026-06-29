import cron from 'node-cron';
import { SlaService } from '../services/sla.service';
import { logger } from '../utils/logger';

// Run every hour: '0 * * * *'
cron.schedule('0 * * * *', async () => {
  logger.info('[Cron Job] Starting SLA escalation checks...');
  try {
    await SlaService.checkBreaches();
    logger.info('[Cron Job] Finished SLA escalation checks successfully.');
  } catch (error) {
    logger.error('[Cron Job] Error in SLA escalation checks:', error);
  }
});

logger.info('[Cron Job] SLA escalation scheduler initialized.');

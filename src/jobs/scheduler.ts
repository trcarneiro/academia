
import cron from 'node-cron';
import { RecurrenceService } from '@/services/recurrenceService';
import { logger } from '@/utils/logger';

export function initializeScheduler() {
    logger.info('⏳ Initializing Cron Scheduler...');

    // Run every day at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
        logger.info('⏰ Running scheduled job: RecurrenceService.processAllActiveTurmas');
        try {
            await RecurrenceService.processAllActiveTurmas();
            logger.info('✅ Scheduled job completed: RecurrenceService.processAllActiveTurmas');
        } catch (error) {
            logger.error({ error }, '❌ Scheduled job failed: RecurrenceService.processAllActiveTurmas');
        }
    });

    logger.info('✅ Cron Scheduler initialized (Daily at 02:00 AM)');
}

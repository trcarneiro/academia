import { buildApp } from './app';
import { appConfig } from '@/config';
import logger from '@/utils/logger';
import { initializeScheduler } from '@/jobs/scheduler';

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  logger.error({ error }, '💥 Uncaught Exception');
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '💥 Unhandled Rejection');
  console.error('UNHANDLED REJECTION:', reason);
});

const start = async () => {
  try {
    const server = await buildApp();

    await server.listen({ port: appConfig.server.port, host: appConfig.server.host });
    logger.info(`Server running at http://${appConfig.server.host}:${appConfig.server.port}`);
    logger.info(`✅ HTTP Server is ready and accepting connections`);

    // Initialize cron jobs (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      initializeScheduler();
    } else {
      logger.info('Skipping Cron Scheduler initialization in test environment');
    }

    // Keep-alive: log a cada 30 segundos para garantir que processo está vivo
    setInterval(() => {
      logger.debug(`Server alive - Uptime: ${Math.floor(process.uptime())}s`);
    }, 30000);

    // Manter processo vivo indefinidamente
    const keepAlivePromise = new Promise((resolve) => {
      setInterval(() => { }, 10000);
    });

    await keepAlivePromise;

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    console.error('FATAL ERROR:', error);
    process.exit(1);
  }
};

start();

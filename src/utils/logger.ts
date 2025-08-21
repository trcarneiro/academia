import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino(
  isDevelopment ? {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss',
      },
    },
  } : {
    level: process.env.LOG_LEVEL || 'info',
  }
);

// Minimal Fastify logger options wrapper (pino instance works directly)
export const fastifyLoggerOptions: any = {
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname', translateTime: 'yyyy-mm-dd HH:MM:ss' },
  } : undefined,
};

export { logger };
export default logger;
import pino from 'pino';
import { appConfig } from '@/config';

const logger = pino({
  level: appConfig.logging.level,
  transport: appConfig.server.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss',
    },
  } : undefined,
});

export { logger };
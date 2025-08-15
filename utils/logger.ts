import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Pino instance (for direct usage)
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

// Fastify logger options (object), compatible with Fastify v5
const fastifyLoggerOptions = isDevelopment ? {
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
};

export { logger, fastifyLoggerOptions };
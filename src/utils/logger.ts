import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER;

// Use simple JSON logging in serverless, pretty logging in development
const logger = pino(
  isDevelopment && !isServerless ? {
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
  transport: (isDevelopment && !isServerless) ? {
    target: 'pino-pretty',
    options: { colorize: true, ignore: 'pid,hostname', translateTime: 'yyyy-mm-dd HH:MM:ss' },
  } : undefined,
};

export { logger };
export default logger;
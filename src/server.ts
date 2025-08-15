// Register tsconfig path aliases at runtime
import 'tsconfig-paths/register';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import path from 'path';

import { appConfig } from '@/config';
import { errorHandler } from '@/middlewares/error';
import { logger, fastifyLoggerOptions } from '@/utils/logger';
import { prisma } from '@/utils/database';

// Routes
import authRoutes from '@/routes/auth';
import attendanceRoutes from '@/routes/attendance';
import classRoutes from '@/routes/class';
import analyticsRoutes from '@/routes/analytics';
import { pedagogicalRoutes } from '@/routes/pedagogical';
import { coursesRoutes } from '@/routes/courses';
import progressRoutes from '@/routes/progress';
import financialResponsibleRoutes from '@/routes/financialResponsible';
import financialRoutes from '@/routes/financial';
import studentsRoutes from '@/routes/students';
import organizationsRoutes from '@/routes/organizations';
import activitiesRoutes from '@/routes/activities';
import asaasSimpleRoutes from '@/routes/asaas-simple';
import billingPlanRoutes from '@/routes/billingPlans';
import techniqueRoutes from '@/routes/techniques';
import { diagnosticRoutes } from '@/routes/diagnostic';
import { lessonPlansRoutes } from './routes/lessonPlans';
import planCoursesRoutes from '@/routes/planCourses';
import assessmentsRoutes from '@/routes/assessments';
import feedbackRoutes from '@/routes/feedback';
import gamificationRoutes from '@/routes/gamification';

const server = Fastify({
  logger: fastifyLoggerOptions,
});

const start = async (): Promise<void> => {
  try {
    // Register plugins
    await server.register(helmet, {
      contentSecurityPolicy: false,
    });

    await server.register(cors, {
      origin: appConfig.cors.origin,
      credentials: true,
    });

    await server.register(rateLimit, {
      max: appConfig.rateLimit.max,
      timeWindow: appConfig.rateLimit.window,
    });

    await server.register(jwt, {
      secret: appConfig.jwt.secret,
      sign: {
        expiresIn: appConfig.jwt.expiresIn,
      },
    });


    // Serve static files
    await server.register(staticFiles, {
      root: path.join(__dirname, '..', 'public'),
      prefix: '/',
    });

    // Health check
    server.get('/health', async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
        };
      } catch (error) {
        throw new Error('Database connection failed');
      }
    });

    // Serve dashboard at root
    server.get('/', async (_, reply) => {
      return reply.sendFile('index.html');
    });

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(attendanceRoutes, { prefix: '/api/attendance' });
    await server.register(classRoutes, { prefix: '/api/classes' });
    await server.register(analyticsRoutes, { prefix: '/api/analytics' });
    await server.register(pedagogicalRoutes, { prefix: '/api/pedagogical' });
    await server.register(coursesRoutes, { prefix: '/api/courses' });
    await server.register(progressRoutes, { prefix: '/api' });
    await server.register(financialResponsibleRoutes, { prefix: '/api/financial-responsible' });
    await server.register(financialRoutes, { prefix: '/api/financial' });
    await server.register(studentsRoutes, { prefix: '/api/students' });
    await server.register(organizationsRoutes, { prefix: '/api/organizations' });
    await server.register(activitiesRoutes, { prefix: '/api/activities' });
    await server.register(asaasSimpleRoutes, { prefix: '/api/asaas' });
    await server.register(billingPlanRoutes); // exposes /api/billing-plans
    await server.register(planCoursesRoutes, { prefix: '/api' });
    await server.register(lessonPlansRoutes, { prefix: '/api/lesson-plans' });
    await server.register(assessmentsRoutes, { prefix: '/api/assessments' });
    await server.register(feedbackRoutes, { prefix: '/api/feedback' });
    await server.register(gamificationRoutes, { prefix: '/api/gamification' });
    await server.register(techniqueRoutes);
    await server.register(diagnosticRoutes);

    // Error handler
    server.setErrorHandler(errorHandler);

    // Start server
    await server.listen({
      port: appConfig.server.port,
      host: appConfig.server.host,
    });

    logger.info(
      `Server running at http://${appConfig.server.host}:${appConfig.server.port}`
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    try {
      await prisma.$disconnect();
      await server.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });
});

start();

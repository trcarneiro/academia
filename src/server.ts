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
import logger, { fastifyLoggerOptions } from '@/utils/logger';
import { prisma } from '@/utils/database';

function normalizePlugin(mod: any, name: string): any {
  if (typeof mod === 'function') return mod as any;
  if (mod && typeof mod.default === 'function') return mod.default as any;
  const type = mod === null ? 'null' : typeof mod;
  throw Object.assign(new Error(`Invalid Fastify plugin for ${name}. Expected function, got ${type}.`), { plugin: name, received: mod });
}

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
import studentCoursesRoutes from '@/routes/studentCourses';
import organizationsRoutes from '@/routes/organizations';
import activitiesRoutes from '@/routes/activities';
import asaasSimpleRoutes from '@/routes/asaas-simple';
import billingPlanRoutes from '@/routes/billingPlans';
import techniqueRoutes from '@/routes/techniques';
import { lessonPlansRoutes } from './routes/lessonPlans';
import planCoursesRoutes from '@/routes/planCourses';
import assessmentsRoutes from '@/routes/assessments';
import feedbackRoutes from '@/routes/feedback';
import gamificationRoutes from '@/routes/gamification';
import { aiRoutes } from '@/routes/ai';
import { ragRoutes } from '@/routes/rag';
import turmasRoutes from '@/routes/turmas';
import testRoutes from '@/routes/test';
import usersRoutes from '@/routes/users';
import instructorsRoutes from '@/routes/instructors';
import unitsRoutes from '@/routes/units';
import trainingAreasRoutes from '@/routes/trainingAreas';
import agendaRoutes from '@/routes/agenda';
import settingsRoutes from '@/routes/settings';
import crmRoutes from '@/routes/crm';
import googleAdsRoutes from '@/routes/googleAds';
import devAuthRoutes from '@/routes/dev-auth';
// import packagesRoutes from '@/routes/packages';

const server = Fastify({ logger: fastifyLoggerOptions });

const start = async (): Promise<void> => {
  try {
    await server.register(normalizePlugin(helmet, 'helmet'), { contentSecurityPolicy: false } as any);
    await server.register(normalizePlugin(cors, 'cors'), { origin: appConfig.cors.origin, credentials: true } as any);
    await server.register(normalizePlugin(rateLimit, 'rateLimit'), { max: appConfig.rateLimit.max, timeWindow: appConfig.rateLimit.window } as any);
    await server.register(normalizePlugin(jwt, 'jwt'), { secret: appConfig.jwt.secret, sign: { expiresIn: appConfig.jwt.expiresIn } } as any);

    await server.register(normalizePlugin(staticFiles, 'static'), { root: path.join(__dirname, '..', 'public'), prefix: '/' } as any);

    // Debug hook to track response serialization
    server.addHook('onSend', async (request, reply, payload) => {
      if (request.url.includes('/api/attendance/student/')) {
        console.log('🔧 onSend hook - URL:', request.url);
        console.log('🔧 onSend hook - Payload type:', typeof payload);
        console.log('🔧 onSend hook - Payload:', payload);
      }
      return payload;
    });

    server.get('/health', async () => {
      try { await prisma.$queryRaw`SELECT 1`; return { status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' }; }
      catch { throw new Error('Database connection failed'); }
    });

    server.get('/', async (_: any, reply: any) => reply.sendFile('index.html'));

    await server.register(normalizePlugin(authRoutes, 'authRoutes'), { prefix: '/api/auth' } as any);
    await server.register(normalizePlugin(attendanceRoutes, 'attendanceRoutes'), { prefix: '/api/attendance' } as any);
    await server.register(normalizePlugin(classRoutes, 'classRoutes'), { prefix: '/api/classes' } as any);
    await server.register(normalizePlugin(analyticsRoutes, 'analyticsRoutes'), { prefix: '/api/analytics' } as any);
    await server.register(normalizePlugin(pedagogicalRoutes, 'pedagogicalRoutes'));
    await server.register(normalizePlugin(coursesRoutes, 'coursesRoutes'), { prefix: '/api/courses' } as any);
    await server.register(normalizePlugin(progressRoutes, 'progressRoutes'), { prefix: '/api' } as any);
    await server.register(normalizePlugin(financialResponsibleRoutes, 'financialResponsibleRoutes'), { prefix: '/api/financial-responsible' } as any);
    await server.register(normalizePlugin(financialRoutes, 'financialRoutes'), { prefix: '/api/financial' } as any);
    await server.register(normalizePlugin(studentsRoutes, 'studentsRoutes'), { prefix: '/api/students' } as any);
  // Student Courses sub-resource routes (activate/list/deactivate)
  await server.register(normalizePlugin(studentCoursesRoutes, 'studentCoursesRoutes'), { prefix: '/api/students' } as any);
    await server.register(normalizePlugin(organizationsRoutes, 'organizationsRoutes'), { prefix: '/api/organizations' } as any);
    await server.register(normalizePlugin(activitiesRoutes, 'activitiesRoutes'), { prefix: '/api/activities' } as any);
    await server.register(normalizePlugin(asaasSimpleRoutes, 'asaasSimpleRoutes'), { prefix: '/api/asaas' } as any);
    await server.register(normalizePlugin(billingPlanRoutes, 'billingPlanRoutes'));
    await server.register(normalizePlugin(planCoursesRoutes, 'planCoursesRoutes'), { prefix: '/api' } as any);
    await server.register(normalizePlugin(lessonPlansRoutes, 'lessonPlansRoutes'), { prefix: '/api/lesson-plans' } as any);
    await server.register(normalizePlugin(assessmentsRoutes, 'assessmentsRoutes'), { prefix: '/api/assessments' } as any);
    await server.register(normalizePlugin(feedbackRoutes, 'feedbackRoutes'), { prefix: '/api/feedback' } as any);
    await server.register(normalizePlugin(gamificationRoutes, 'gamificationRoutes'), { prefix: '/api/gamification' } as any);
    await server.register(normalizePlugin(techniqueRoutes, 'techniqueRoutes'));
    await server.register(normalizePlugin(aiRoutes, 'aiRoutes'), { prefix: '/api/ai' } as any);
    await server.register(normalizePlugin(ragRoutes, 'ragRoutes'), { prefix: '/api/rag' } as any);
  await server.register(normalizePlugin(turmasRoutes, 'turmasRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(testRoutes, 'testRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(usersRoutes, 'usersRoutes'), { prefix: '/api/users' } as any);
  await server.register(normalizePlugin(instructorsRoutes, 'instructorsRoutes'), { prefix: '/api/instructors' } as any);
  await server.register(normalizePlugin(unitsRoutes, 'unitsRoutes'), { prefix: '/api/units' } as any);
  await server.register(normalizePlugin(trainingAreasRoutes, 'trainingAreasRoutes'), { prefix: '/api/training-areas' } as any);
  await server.register(normalizePlugin(agendaRoutes, 'agendaRoutes'), { prefix: '/api/agenda' } as any);
  await server.register(normalizePlugin(settingsRoutes, 'settingsRoutes'), { prefix: '/api/settings' } as any);
  await server.register(normalizePlugin(crmRoutes, 'crmRoutes'), { prefix: '/api/crm' } as any);
  await server.register(normalizePlugin(googleAdsRoutes, 'googleAdsRoutes'), { prefix: '/api/google-ads' } as any);
  await server.register(normalizePlugin(devAuthRoutes, 'devAuthRoutes'), { prefix: '/api/dev-auth' } as any);
  // await server.register(normalizePlugin(packagesRoutes, 'packagesRoutes'), { prefix: '/api/packages' } as any);

    server.setErrorHandler(errorHandler);

    await server.listen({ port: appConfig.server.port, host: appConfig.server.host });
    logger.info(`Server running at http://${appConfig.server.host}:${appConfig.server.port}`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    try { await prisma.$disconnect(); await server.close(); logger.info('Server closed successfully'); process.exit(0); }
    catch (error) { logger.error({ error }, 'Error during shutdown'); process.exit(1); }
  });
});

start();

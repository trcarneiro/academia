// Register tsconfig path aliases at runtime
import 'tsconfig-paths/register';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import path from 'path';
import { readFileSync } from 'fs';

import { appConfig } from '@/config';
import { errorHandler } from '@/middlewares/error';
import logger, { fastifyLoggerOptions } from '@/utils/logger';
import { prisma } from '@/utils/database';
import { initializeGemini } from '@/services/geminiService';
import { extractTenantContext } from '@/middlewares/tenant';
import { ResponseHelper } from '@/utils/response';

function normalizePlugin(mod: any, name: string): any {
  if (typeof mod === 'function') return mod as any;
  if (mod && typeof mod.default === 'function') return mod.default as any;
  const type = mod === null ? 'null' : typeof mod;
  throw Object.assign(new Error(`Invalid Fastify plugin for ${name}. Expected function, got ${type}.`), { plugin: name, received: mod });
}

// ✅ HTTPS Configuration
const useHTTPS = process.env.USE_HTTPS === 'true';
let httpsOptions = {};

if (useHTTPS) {
  try {
    const certsPath = path.join(__dirname, '..', 'certs');
    httpsOptions = {
      https: {
        key: readFileSync(path.join(certsPath, 'server.key')),
        cert: readFileSync(path.join(certsPath, 'server.pem'))
      }
    };
    logger.info('🔒 HTTPS enabled with self-signed certificate');
  } catch (error) {
    logger.warn('⚠️ HTTPS certificates not found, falling back to HTTP');
    logger.warn('   Run: npm run cert:generate');
    logger.warn('   Error:', error instanceof Error ? error.message : String(error));
  }
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
import asaasIntegrationRoutes from '@/routes/asaas-integration';
import billingPlanRoutes from '@/routes/billingPlans';
import techniqueRoutes from '@/routes/techniques';
import { lessonPlansRoutes } from './routes/lessonPlans';
import planCoursesRoutes from '@/routes/planCourses';
import assessmentsRoutes from '@/routes/assessments';
import feedbackRoutes from '@/routes/feedback';
import gamificationRoutes from '@/routes/gamification';
import { aiRoutes } from '@/routes/ai';
import { ragRoutes } from '@/routes/rag';
import { agentOrchestratorRoutes } from '@/routes/agentOrchestrator';
import agentsRoutes from '@/routes/agents';
import agentTasksRoutes from '@/routes/agentTasks';
import agentInsightsRoutes from '@/routes/agentInsights';
import curriculumAgentRoutes from '@/routes/curriculum-agent';
import turmasRoutes from '@/routes/turmas';
import testRoutes from '@/routes/test';
import usersRoutes from '@/routes/users';
import activityExecutionsRoutes from '@/routes/activityExecutions';
import progressionRoutes from '@/routes/progression';
import instructorsRoutes from '@/routes/instructors';
import instructorCoursesRoutes from '@/routes/instructor-courses';
import courseProgressRoutes from '@/routes/course-progress';
import turmasAvailableRoutes from '@/routes/turmas-available';
import unitsRoutes from '@/routes/units';
import trainingAreasRoutes from '@/routes/trainingAreas';
import agendaRoutes from '@/routes/agenda';
import settingsRoutes from '@/routes/settings';
import crmRoutes from '@/routes/crm';
import googleAdsRoutes from '@/routes/googleAds';
import devAuthRoutes from '@/routes/dev-auth';
import packagesRoutes from '@/routes/packages-simple';
import subscriptionsRoutes from '@/routes/subscriptions';
import graduationRoutes from '@/routes/graduation';
import creditsRoutes from '@/routes/credits';
import biometricRoutes from '@/routes/biometric';
import jobsRoutes from '@/routes/jobs';
const frequencyRoutes = require('./routes/frequency');
// import packagesRoutes from '@/routes/packages';

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  logger.error({ error }, '💥 Uncaught Exception');
  console.error('UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '💥 Unhandled Rejection');
  console.error('UNHANDLED REJECTION:', reason);
});

const server = Fastify({

  trustProxy: true,
  ...httpsOptions  // ✅ Apply HTTPS options if available
});

const start = async (): Promise<void> => {
  try {
    // Inicializar Gemini AI
    const geminiInitialized = initializeGemini();
    if (geminiInitialized) {
      logger.info('✅ Gemini AI Service initialized successfully');
    } else {
      logger.warn('⚠️ Gemini AI Service running in mock mode (no API key)');
    }

    // Inicializar TaskScheduler (restaura jobs recorrentes do banco)
    // ⚠️ DESABILITADO: Modelo AgentTask não existe no schema
    /*
    try {
      const { taskSchedulerService } = await import('@/services/taskSchedulerService');
      await taskSchedulerService.initialize();
      logger.info('✅ TaskScheduler initialized with recurring tasks restored');
    } catch (error) {
      logger.error('❌ Failed to initialize TaskScheduler:', error);
    }
    */
    logger.warn('⚠️ TaskScheduler disabled (AgentTask model not in schema)');

    const isProd = appConfig.server.nodeEnv === 'production';
    await server.register(normalizePlugin(helmet, 'helmet'), {
      contentSecurityPolicy: isProd ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"]
        }
      } : false,
      hsts: isProd && useHTTPS // Only enable HSTS if actually using HTTPS
    } as any);
    await server.register(normalizePlugin(cors, 'cors'), { origin: appConfig.cors.origin, credentials: true } as any);
    await server.register(normalizePlugin(rateLimit, 'rateLimit'), { max: appConfig.rateLimit.max, timeWindow: appConfig.rateLimit.window } as any);
    await server.register(normalizePlugin(jwt, 'jwt'), { secret: appConfig.jwt.secret, sign: { expiresIn: appConfig.jwt.expiresIn } } as any);

    await server.register(normalizePlugin(staticFiles, 'static'), { root: path.join(__dirname, '..', 'public'), prefix: '/' } as any);

    // Tenant extraction for API routes (skip auth and health)
    server.addHook('onRequest', async (request, reply) => {
      const url = request.url || '';
      if (url.startsWith('/api/') && !url.startsWith('/api/auth') && !url.startsWith('/health')) {
        try {
          await extractTenantContext(request as any, reply as any);
        } catch (_) {
          // extractTenantContext already replied on failure
        }
      }
    });

    // Enforce org consistency when user is authenticated
    server.addHook('preHandler', async (request, reply) => {
      const url = request.url || '';
      if (url.startsWith('/api/') && !url.startsWith('/api/auth')) {
        const user: any = (request as any).user;
        const tenant: any = (request as any).tenant;
        if (user?.organizationId && tenant?.organizationId && user.organizationId !== tenant.organizationId) {
          return ResponseHelper.error(reply as any, 'Access denied to this organization', 403);
        }
      }
    });

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
    // 🆕 Alias: /api/checkin → /api/attendance (para compatibilidade com Kiosk)
    await server.register(normalizePlugin(attendanceRoutes, 'attendanceRoutesAlias'), { prefix: '/api/checkin' } as any);
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
  // ✅ Course Progress route (GET /api/students/:id/course-progress)
  await server.register(normalizePlugin(courseProgressRoutes, 'courseProgressRoutes'), { prefix: '/api/students' } as any);
    await server.register(normalizePlugin(organizationsRoutes, 'organizationsRoutes'), { prefix: '/api/organizations' } as any);
    await server.register(normalizePlugin(activitiesRoutes, 'activitiesRoutes'), { prefix: '/api/activities' } as any);
    await server.register(normalizePlugin(asaasSimpleRoutes, 'asaasSimpleRoutes'), { prefix: '/api/asaas' } as any);
    await server.register(normalizePlugin(asaasIntegrationRoutes, 'asaasIntegrationRoutes'), { prefix: '/api/asaas' } as any);
    await server.register(normalizePlugin(billingPlanRoutes, 'billingPlanRoutes'));
    await server.register(normalizePlugin(planCoursesRoutes, 'planCoursesRoutes'), { prefix: '/api' } as any);
    await server.register(normalizePlugin(lessonPlansRoutes, 'lessonPlansRoutes'), { prefix: '/api/lesson-plans' } as any);
    await server.register(normalizePlugin(assessmentsRoutes, 'assessmentsRoutes'), { prefix: '/api/assessments' } as any);
    await server.register(normalizePlugin(feedbackRoutes, 'feedbackRoutes'), { prefix: '/api/feedback' } as any);
    await server.register(normalizePlugin(gamificationRoutes, 'gamificationRoutes'), { prefix: '/api/gamification' } as any);
    await server.register(normalizePlugin(techniqueRoutes, 'techniqueRoutes'));
    // await server.register(normalizePlugin(aiRoutes, 'aiRoutes'), { prefix: '/api/ai' } as any);
    await server.register(normalizePlugin(ragRoutes, 'ragRoutes'), { prefix: '/api/rag' } as any);
    await server.register(normalizePlugin(agentOrchestratorRoutes, 'agentOrchestratorRoutes'), { prefix: '/api/agents' } as any);
    await server.register(normalizePlugin(agentsRoutes, 'agentsRoutes'), { prefix: '/api/agents' } as any);
    await server.register(normalizePlugin(agentTasksRoutes, 'agentTasksRoutes'), { prefix: '/api/agent-tasks' } as any);
    await server.register(normalizePlugin(agentInsightsRoutes, 'agentInsightsRoutes'), { prefix: '/api/agent-insights' } as any);
    await server.register(normalizePlugin(curriculumAgentRoutes, 'curriculumAgentRoutes'), { prefix: '/api/agents/curriculum' } as any);
  await server.register(normalizePlugin(turmasRoutes, 'turmasRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(testRoutes, 'testRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(usersRoutes, 'usersRoutes'), { prefix: '/api/users' } as any);
  await server.register(normalizePlugin(activityExecutionsRoutes, 'activityExecutionsRoutes'), { prefix: '/api/lesson-activity-executions' } as any);
  await server.register(normalizePlugin(progressionRoutes, 'progressionRoutes'), { prefix: '/api/progression' } as any);
  await server.register(normalizePlugin(instructorsRoutes, 'instructorsRoutes'), { prefix: '/api/instructors' } as any);
  await server.register(normalizePlugin(instructorCoursesRoutes, 'instructorCoursesRoutes'), { prefix: '/api/instructors' } as any);
  await server.register(normalizePlugin(turmasAvailableRoutes, 'turmasAvailableRoutes'), { prefix: '/api/turmas' } as any);
  await server.register(normalizePlugin(unitsRoutes, 'unitsRoutes'), { prefix: '/api/units' } as any);
  await server.register(normalizePlugin(trainingAreasRoutes, 'trainingAreasRoutes'), { prefix: '/api/training-areas' } as any);
  await server.register(normalizePlugin(agendaRoutes, 'agendaRoutes'), { prefix: '/api/agenda' } as any);
  await server.register(normalizePlugin(settingsRoutes, 'settingsRoutes'), { prefix: '/api/settings' } as any);
  await server.register(normalizePlugin(crmRoutes, 'crmRoutes'), { prefix: '/api/crm' } as any);
  await server.register(normalizePlugin(googleAdsRoutes, 'googleAdsRoutes'), { prefix: '/api/google-ads' } as any);
  await server.register(normalizePlugin(devAuthRoutes, 'devAuthRoutes'), { prefix: '/api/dev-auth' } as any);

  logger.info('📊 Registrando frequency routes...');
  const frequencyRoutesFunction = frequencyRoutes.default || frequencyRoutes;
  console.log('frequencyRoutes type:', typeof frequencyRoutesFunction);
  await server.register(normalizePlugin(frequencyRoutesFunction, 'frequencyRoutes'), { prefix: '/api/frequency' } as any);
  logger.info('✅ Frequency routes registered');

  logger.info('📦 Registrando packages routes...');
  await server.register(normalizePlugin(packagesRoutes, 'packagesRoutes'), { prefix: '/api/packages' } as any);
  logger.info('✅ Packages routes registered');

  logger.info('📅 Registrando subscriptions routes...');
  await server.register(normalizePlugin(subscriptionsRoutes, 'subscriptionsRoutes'), { prefix: '/api/subscriptions' } as any);
  logger.info('✅ Subscriptions routes registered');

  logger.info('🎓 Registrando graduation routes...');
  await server.register(normalizePlugin(graduationRoutes, 'graduationRoutes'), { prefix: '/api/graduation' } as any);
  logger.info('✅ Graduation routes registered');

  logger.info('💳 Registrando credits routes...');
  await server.register(normalizePlugin(creditsRoutes, 'creditsRoutes'), { prefix: '/api/credits' } as any);
  logger.info('✅ Credits routes registered');

  logger.info('📸 Registrando biometric routes...');
  await server.register(normalizePlugin(biometricRoutes, 'biometricRoutes'), { prefix: '/api/biometric' } as any);
  logger.info('✅ Biometric routes registered');

  logger.info('💼 Registrando jobs routes...');
  await server.register(normalizePlugin(jobsRoutes, 'jobsRoutes'), { prefix: '/api/jobs' } as any);
  logger.info('✅ Jobs routes registered');

    server.setErrorHandler(errorHandler);

    await server.listen({ port: appConfig.server.port, host: appConfig.server.host });
    logger.info(`Server running at http://${appConfig.server.host}:${appConfig.server.port}`);
    logger.info(`✅ HTTP Server is ready and accepting connections`);

    // Inicializar WebSocket Service (real-time notifications)
    // ⚠️ DESABILITADO TEMPORARIAMENTE
    /*
    try {
      const { websocketService } = await import('@/services/websocketService');
      websocketService.initialize(server.server);
      logger.info('✅ WebSocket Service initialized on ws://localhost:' + appConfig.server.port + '/ws/agents');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket Service:', error);
    }
    */
    logger.warn('⚠️ WebSocket Service disabled temporarily');
    logger.info('📝 Step 1: WebSocket skipped');

    // 🆕 TEMPORARIAMENTE DESABILITADO - TaskOrchestrator causando travamento
    // const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
    // await taskOrchestratorService.start();
    // logger.info('🎭 Task Orchestrator started');
    logger.info('⏸️ Task Orchestrator disabled temporarily (focus on check-in)');
    logger.info('📝 Step 2: Task Orchestrator skipped');

    // Keep-alive: log a cada 30 segundos para garantir que processo está vivo
    setInterval(() => {
      logger.debug(`Server alive - Uptime: ${Math.floor(process.uptime())}s`);
    }, 30000);
    logger.info('📝 Step 3: Keep-alive configured');

    logger.info('🎉 SERVER INITIALIZATION COMPLETE - Ready to serve requests');

    // Manter processo vivo indefinidamente com diferentes estratégias
    // Estratégia 1: Promise que nunca resolve
    const keepAlivePromise = new Promise((resolve) => {
      // Estratégia 2: Interval que mantém event loop ativo
      setInterval(() => {
        // Apenas mantém o event loop ativo, não precisa fazer nada
      }, 10000);
      
      // Estratégia 3: Listener de eventos do processo
      process.on('beforeExit', (code) => {
        logger.warn(`Process attempting to exit with code ${code}, preventing...`);
        // Restart interval se necessário
        setInterval(() => {}, 10000);
      });
    });

    await keepAlivePromise;

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    console.error('FATAL ERROR:', error);
    process.exit(1);
  }
};

// ⚠️ SIGNAL HANDLERS TEMPORARIAMENTE DESABILITADOS
// (Estavam causando crash ao importar serviços desabilitados)
/*
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    try {
      // 🆕 Parar Task Orchestrator antes de desligar
      const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
      taskOrchestratorService.stop();

      // 🆕 Shutdown WebSocket Service
      const { websocketService } = await import('@/services/websocketService');
      websocketService.shutdown();

      // 🆕 Shutdown TaskScheduler
      const { taskSchedulerService } = await import('@/services/taskSchedulerService');
      taskSchedulerService.shutdown();

      await prisma.$disconnect();
      await server.close();
      logger.info('Server closed successfully');
      process.exit(0);
    }
    catch (error) { logger.error({ error }, 'Error during shutdown'); process.exit(1); }
  });
});
*/

start();

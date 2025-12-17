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
import logger from '@/utils/logger';
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

// Routes
import authRoutes from '@/routes/auth';
import attendanceRoutes from '@/routes/attendance';
import classRoutes from '@/routes/class';
import analyticsRoutes from '@/routes/analytics';
import { pedagogicalRoutes } from '@/routes/pedagogical';
import { coursesRoutes } from '@/routes/courses';
import { martialArtsRoutes } from '@/routes/martialArts';
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
import discountsRoutes from '@/routes/discounts';
import techniqueRoutes from '@/routes/techniques';
import { lessonPlansRoutes } from './routes/lessonPlans';
import planCoursesRoutes from '@/routes/planCourses';
import assessmentsRoutes from '@/routes/assessments';
import feedbackRoutes from '@/routes/feedback';
import gamificationRoutes from '@/routes/gamification';
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
import marketingRoutes from '@/routes/marketing';
import landingPublicRoutes from '@/routes/landing-public';
import devAuthRoutes from '@/routes/dev-auth';
import packagesRoutes from '@/routes/packages-simple';
import subscriptionsRoutes from '@/routes/subscriptions';
import graduationRoutes from '@/routes/graduation';
import creditsRoutes from '@/routes/credits';
import biometricRoutes from '@/routes/biometric';
import jobsRoutes from '@/routes/jobs';
import healthRoutes from '@/routes/health';
import portalRoutes from '@/routes/portal';
import permissionsRoutes from '@/routes/permissions';
import horariosSugeridosRoutes from '@/routes/horarios-sugeridos';
import deploySessionsRoutes from '@/routes/ops/deploySessions';
const frequencyRoutes = require('./routes/frequency');

export const buildApp = async () => {
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
    }
  }

  const server = Fastify({
    trustProxy: true,
    ...httpsOptions
  });

  // Inicializar Gemini AI
  const geminiInitialized = initializeGemini();
  if (geminiInitialized) {
    logger.info('✅ Gemini AI Service initialized successfully');
  } else {
    logger.warn('⚠️ Gemini AI Service running in mock mode (no API key)');
  }

  const isProd = appConfig.server.nodeEnv === 'production';
  await server.register(normalizePlugin(helmet, 'helmet'), {
    contentSecurityPolicy: false,
    hsts: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
  } as any);
  await server.register(normalizePlugin(cors, 'cors'), { origin: appConfig.cors.origin, credentials: true } as any);
  await server.register(normalizePlugin(rateLimit, 'rateLimit'), { max: appConfig.rateLimit.max, timeWindow: appConfig.rateLimit.window } as any);
  await server.register(normalizePlugin(jwt, 'jwt'), { secret: appConfig.jwt.secret, sign: { expiresIn: appConfig.jwt.expiresIn } } as any);

  // Static files (skip in serverless environment)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (!isServerless) {
    const publicPath = path.join(__dirname, '..', 'public');
    const publicPathDist = path.join(__dirname, 'public');
    const staticPath = require('fs').existsSync(publicPathDist) ? publicPathDist : publicPath;
    
    logger.info(`📁 Serving static files from: ${staticPath}`);
    await server.register(normalizePlugin(staticFiles, 'static'), { root: staticPath, prefix: '/' } as any);
  } else {
    logger.info('⚡ Running in serverless mode - static files disabled');
  }

  // Tenant extraction
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

  // Enforce org consistency
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

  // Health check endpoints (registered before tenant middleware)
  await server.register(normalizePlugin(healthRoutes, 'healthRoutes'));

  // Root route only when not in serverless (handled by serverless.ts in Vercel)
  if (!isServerless) {
    server.get('/', async (_: any, reply: any) => reply.sendFile('index.html'));
  }

  // Register Routes
  await server.register(normalizePlugin(authRoutes, 'authRoutes'), { prefix: '/api/auth' } as any);
  await server.register(normalizePlugin(attendanceRoutes, 'attendanceRoutes'), { prefix: '/api/attendance' } as any);
  await server.register(normalizePlugin(attendanceRoutes, 'attendanceRoutesAlias'), { prefix: '/api/checkin' } as any);
  await server.register(normalizePlugin(classRoutes, 'classRoutes'), { prefix: '/api/classes' } as any);
  await server.register(normalizePlugin(analyticsRoutes, 'analyticsRoutes'), { prefix: '/api/analytics' } as any);
  await server.register(normalizePlugin(pedagogicalRoutes, 'pedagogicalRoutes'));
  await server.register(normalizePlugin(coursesRoutes, 'coursesRoutes'), { prefix: '/api/courses' } as any);
  await server.register(normalizePlugin(martialArtsRoutes, 'martialArtsRoutes'), { prefix: '/api/martial-arts' } as any);
  await server.register(normalizePlugin(progressRoutes, 'progressRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(financialResponsibleRoutes, 'financialResponsibleRoutes'), { prefix: '/api/financial-responsible' } as any);
  await server.register(normalizePlugin(financialRoutes, 'financialRoutes'), { prefix: '/api/financial' } as any);
  await server.register(normalizePlugin(studentsRoutes, 'studentsRoutes'), { prefix: '/api/students' } as any);
  await server.register(normalizePlugin(studentCoursesRoutes, 'studentCoursesRoutes'), { prefix: '/api/students' } as any);
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
  await server.register(normalizePlugin(ragRoutes, 'ragRoutes'), { prefix: '/api/rag' } as any);
  await server.register(normalizePlugin(agentOrchestratorRoutes, 'agentOrchestratorRoutes'), { prefix: '/api/agents' } as any);
  await server.register(normalizePlugin(agentsRoutes, 'agentsRoutes'), { prefix: '/api/agents' } as any);
  await server.register(normalizePlugin(agentTasksRoutes, 'agentTasksRoutes'), { prefix: '/api/agent-tasks' } as any);
  await server.register(normalizePlugin(agentInsightsRoutes, 'agentInsightsRoutes'), { prefix: '/api/agent-insights' } as any);
  await server.register(normalizePlugin(curriculumAgentRoutes, 'curriculumAgentRoutes'), { prefix: '/api/agents/curriculum' } as any);
  await server.register(normalizePlugin(turmasRoutes, 'turmasRoutes'), { prefix: '/api' } as any);
  await server.register(normalizePlugin(horariosSugeridosRoutes, 'horariosSugeridosRoutes'), { prefix: '/api/horarios-sugeridos' } as any);
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
  await server.register(normalizePlugin(marketingRoutes, 'marketingRoutes'), { prefix: '/api/marketing' } as any);
  await server.register(normalizePlugin(landingPublicRoutes, 'landingPublicRoutes'), { prefix: '/lp' } as any);
  await server.register(normalizePlugin(devAuthRoutes, 'devAuthRoutes'), { prefix: '/api/dev-auth' } as any);
  
  const frequencyRoutesFunction = frequencyRoutes.default || frequencyRoutes;
  await server.register(normalizePlugin(frequencyRoutesFunction, 'frequencyRoutes'), { prefix: '/api/frequency' } as any);
  await server.register(normalizePlugin(packagesRoutes, 'packagesRoutes'), { prefix: '/api/packages' } as any);
  await server.register(normalizePlugin(subscriptionsRoutes, 'subscriptionsRoutes'), { prefix: '/api/subscriptions' } as any);
  await server.register(normalizePlugin(graduationRoutes, 'graduationRoutes'), { prefix: '/api/graduation' } as any);
  await server.register(normalizePlugin(creditsRoutes, 'creditsRoutes'), { prefix: '/api/credits' } as any);
  await server.register(normalizePlugin(biometricRoutes, 'biometricRoutes'), { prefix: '/api/biometric' } as any);
  await server.register(normalizePlugin(jobsRoutes, 'jobsRoutes'), { prefix: '/api/jobs' } as any);
  await server.register(normalizePlugin(portalRoutes, 'portalRoutes'), { prefix: '/api/portal' } as any);
  await server.register(normalizePlugin(permissionsRoutes, 'permissionsRoutes'), { prefix: '/api/auth' } as any);

  server.setErrorHandler(errorHandler);

  return server;
};

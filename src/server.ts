import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import staticFiles from '@fastify/static';
import path from 'path';

import { appConfig } from '@/config';
import { errorHandler } from '@/middlewares/error';
import { logger } from '@/utils/logger';
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

const server = Fastify({
  logger: logger,
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

    // Swagger documentation
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'Krav Maga Academy API',
          description: 'Sistema de gestão para academia de Krav Maga com IA integrada',
          version: '1.0.0',
        },
        host: `${appConfig.server.host}:${appConfig.server.port}`,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
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
    await server.register(coursesRoutes, { prefix: '/api/courses-management' });
    await server.register(progressRoutes, { prefix: '/api' });
    await server.register(financialResponsibleRoutes, { prefix: '/api/financial-responsible' });
    await server.register(financialRoutes, { prefix: '/api/financial' });
    await server.register(studentsRoutes, { prefix: '/api/students' });
    await server.register(organizationsRoutes, { prefix: '/api/organizations' });
    await server.register(activitiesRoutes, { prefix: '/api/activities' });
    await server.register(asaasSimpleRoutes, { prefix: '/api/asaas' });
    await server.register(billingPlanRoutes);
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
    logger.info(
      `Swagger docs available at http://${appConfig.server.host}:${appConfig.server.port}/docs`
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
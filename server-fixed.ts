import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Fastify
const server = Fastify({
  logger: {
    level: 'info'
  }
});

const start = async (): Promise<void> => {
  try {
    // Register CORS
    await server.register(cors, {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    });

    // Register static files
    await server.register(fastifyStatic, {
      root: path.join(process.cwd(), 'public'),
      prefix: '/',
    });

    // Serve dashboard on root
    server.get('/', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    // Alternative dashboard routes
    server.get('/dashboard', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    server.get('/ultimate', async (request, reply) => {
      return reply.sendFile('index.html');
    });

    // Health check
    server.get('/health', async (request, reply) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected',
          message: '🥋 Krav Maga Academy API is running!'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Students API
    server.get('/api/students', async (request, reply) => {
      try {
        const students = await prisma.student.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            financialResponsible: {
              select: {
                id: true,
                name: true,
                email: true,
                relationshipType: true
              }
            }
          },
          take: 50
        });

        return {
          success: true,
          data: students,
          count: students.length,
          message: 'Students retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch students',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Organizations API
    server.get('/api/organizations', async (request, reply) => {
      try {
        const organizations = await prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            contactEmail: true,
            contactPhone: true,
            isActive: true,
            createdAt: true
          }
        });

        return {
          success: true,
          data: organizations,
          count: organizations.length,
          message: 'Organizations retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch organizations',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Techniques API
    server.get('/api/techniques', async (request, reply) => {
      try {
        const techniques = await prisma.technique.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            difficulty: true,
            createdAt: true
          },
          take: 20
        });

        return {
          success: true,
          data: techniques,
          count: techniques.length,
          message: 'Techniques retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch techniques',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Billing Plans API - THIS WAS MISSING
    server.get('/api/billing-plans', async (request, reply) => {
      try {
        const billingPlans = await prisma.billingPlan.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            billingType: true,
            isActive: true,
            features: true,
            classesPerWeek: true,
            hasPersonalTraining: true,
            hasNutrition: true,
            allowFreeze: true,
            createdAt: true,
            updatedAt: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            price: 'asc'
          }
        });

        return {
          success: true,
          data: billingPlans,
          count: billingPlans.length,
          message: 'Billing plans retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch billing plans',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Financial Responsibles API
    server.get('/api/financial-responsibles', async (request, reply) => {
      try {
        const responsibles = await prisma.financialResponsible.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            relationshipType: true,
            isActive: true,
            createdAt: true
          },
          take: 20
        });

        return {
          success: true,
          data: responsibles,
          count: responsibles.length,
          message: 'Financial responsibles retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch financial responsibles',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Courses API
    server.get('/api/courses', async (request, reply) => {
      try {
        const courses = await prisma.course.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            isActive: true,
            createdAt: true
          },
          take: 20
        });

        return {
          success: true,
          data: courses,
          count: courses.length,
          message: 'Courses retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch courses',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Classes API
    server.get('/api/classes', async (request, reply) => {
      try {
        const classes = await prisma.class.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            schedule: true,
            maxCapacity: true,
            isActive: true,
            createdAt: true
          },
          take: 20
        });

        return {
          success: true,
          data: classes,
          count: classes.length,
          message: 'Classes retrieved successfully'
        };
      } catch (error) {
        reply.code(500);
        return {
          success: false,
          error: 'Failed to fetch classes',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Start server
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    
    await server.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Server is running at http://localhost:${port}`);
    console.log(`📊 Dashboard: http://localhost:${port}/`);
    console.log(`👥 Students: http://localhost:${port}/api/students`);
    console.log(`🏢 Organizations: http://localhost:${port}/api/organizations`);
    console.log(`💰 Billing Plans: http://localhost:${port}/api/billing-plans`);
    console.log(`🥋 Techniques: http://localhost:${port}/api/techniques`);
    console.log(`👨‍👩‍👧‍👦 Responsibles: http://localhost:${port}/api/financial-responsibles`);
    console.log(`📚 Courses: http://localhost:${port}/api/courses`);
    console.log(`🏫 Classes: http://localhost:${port}/api/classes`);
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

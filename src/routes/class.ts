import { FastifyInstance } from 'fastify';
import { ClassController } from '@/controllers/classController';
import { validateQuery, validateParams, validateBody } from '@/middlewares/validation';
import { authenticateToken, instructorOrAdmin, adminOnly, allRoles } from '@/middlewares/auth';
import { upcomingClassesQuerySchema, classIdParamsSchema, createClassSchema, updateClassSchema } from '@/schemas/class';
import { prisma } from '@/utils/database';

export default async function classRoutes(fastify: FastifyInstance) {
  // Root endpoint for diagnostic - Get all classes
  fastify.get('/', {
    schema: {
      tags: ['Classes'],
      summary: 'Get all classes',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async () => {
      try {
        const classes = await prisma.class.findMany({
          orderBy: { createdAt: 'desc' }
        });

        return {
          success: true,
          data: classes.map(classItem => ({
            id: classItem.id,
            title: classItem.title,
            description: classItem.description,
            date: classItem.date,
            startTime: classItem.startTime,
            endTime: classItem.endTime,
            status: classItem.status,
            actualStudents: classItem.actualStudents,
            maxStudents: classItem.maxStudents,
            instructorId: classItem.instructorId,
            courseId: classItem.courseId,
            createdAt: classItem.createdAt
          })),
          message: 'Classes retrieved successfully'
        };
      } catch (error) {
        fastify.log.error({ error }, 'Failed to fetch classes');
        return {
          success: false,
          error: 'Failed to fetch classes',
          data: []
        };
      }
    },
  });

  // Get upcoming classes
  fastify.get('/upcoming', {
    schema: {
      tags: ['Classes'],
      summary: 'Get upcoming classes',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          date: { type: 'string', format: 'date-time' },
          instructorId: { type: 'string', format: 'uuid' },
          courseProgramId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: { type: 'object' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, allRoles, validateQuery(upcomingClassesQuerySchema)],
    handler: ClassController.getUpcomingClasses,
  });

  // Get class by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Classes'],
      summary: 'Get class details by ID',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, allRoles, validateParams(classIdParamsSchema)],
    handler: ClassController.getClassById,
  });

  // Generate QR code for class
  fastify.post('/:id/qrcode', {
    schema: {
      tags: ['Classes'],
      summary: 'Generate QR code for class check-in',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                classId: { type: 'string' },
                qrCode: { type: 'string' },
                validUntil: { type: 'string' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, instructorOrAdmin, validateParams(classIdParamsSchema)],
    handler: ClassController.generateQRCode,
  });

  // === Class Activities runtime ===
  const db: any = prisma as any;

  // List activities for class
  fastify.get('/:id/activities', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const items = await db.classActivity.findMany({
        where: { classId: id },
        orderBy: { ord: 'asc' },
        include: { activity: true }
      });
      return { success: true, data: items };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to list class activities' };
    }
  });

  // Replace activities for class
  fastify.post('/:id/activities', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) || {};
      const items = Array.isArray(body.items) ? body.items : [];
      await prisma.$transaction(async (tx) => {
        const t: any = tx as any;
        await t.classActivity.deleteMany({ where: { classId: id } });
        if (items.length) {
          await t.classActivity.createMany({
            data: items.map((it: any, idx: number) => ({
              classId: id,
              activityId: it.activityId,
              segment: it.segment || 'TECHNIQUE',
              ord: typeof it.ord === 'number' ? it.ord : idx + 1,
              paramsUsed: it.paramsUsed ?? null,
              completed: !!it.completed,
              adaptationsUsed: it.adaptationsUsed ?? null,
            }))
          });
        }
      });
      return { success: true };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to save class activities' };
    }
  });

  // Mark activity as complete
  fastify.post('/:id/activities/:itemId/complete', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id, itemId } = request.params as any;
      const body = (request.body as any) || {};
      // Ensure item belongs to class
      const item = await db.classActivity.findFirst({ where: { id: itemId, classId: id } });
      if (!item) {
        reply.code(404);
        return { success: false, error: 'Item not found' };
      }
      const updated = await db.classActivity.update({
        where: { id: itemId },
        data: {
          completed: true,
          paramsUsed: body.paramsUsed ?? item.paramsUsed ?? null,
          adaptationsUsed: body.adaptationsUsed ?? item.adaptationsUsed ?? null,
        }
      });
      return { success: true, data: updated };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to complete class activity' };
    }
  });

  // Create new class (admin only)
  fastify.post('/', {
    schema: {
      tags: ['Classes'],
      summary: 'Create a new class',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['scheduleId', 'instructorId', 'courseProgramId', 'date'],
        properties: {
          scheduleId: { type: 'string', format: 'uuid' },
          instructorId: { type: 'string', format: 'uuid' },
          courseProgramId: { type: 'string', format: 'uuid' },
          lessonPlanId: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, adminOnly, validateBody(createClassSchema)],
    handler: ClassController.createClass,
  });

  // Update class
  fastify.put('/:id', {
    schema: {
      tags: ['Classes'],
      summary: 'Update class details',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          instructorId: { type: 'string', format: 'uuid' },
          lessonPlanId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          notes: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [
      authenticateToken,
      instructorOrAdmin,
      validateParams(classIdParamsSchema),
      validateBody(updateClassSchema),
    ],
    handler: ClassController.updateClass,
  });

  // Cancel class
  fastify.delete('/:id', {
    schema: {
      tags: ['Classes'],
      summary: 'Cancel a class',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, instructorOrAdmin, validateParams(classIdParamsSchema)],
    handler: ClassController.cancelClass,
  });
}
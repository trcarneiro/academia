import { FastifyInstance } from 'fastify';
import { ClassController } from '@/controllers/classController';
import { validateQuery, validateParams, validateBody } from '@/middlewares/validation';
import { authenticateToken, instructorOrAdmin, adminOnly, allRoles } from '@/middlewares/auth';
import { upcomingClassesQuerySchema, classIdParamsSchema, createClassSchema, updateClassSchema } from '@/schemas/class';
import { prisma } from '@/utils/database';

export default async function classRoutes(fastify: FastifyInstance) {
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
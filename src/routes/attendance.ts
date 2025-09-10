import { FastifyInstance } from 'fastify';
import { AttendanceController } from '@/controllers/attendanceController';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validation';
import { authenticateToken, instructorOrAdmin, allRoles } from '@/middlewares/auth';
import { checkInSchema, attendanceHistoryQuerySchema, updateAttendanceSchema, attendanceStatsQuerySchema } from '@/schemas/attendance';
import { z } from 'zod';

const studentIdParamsSchema = z.object({
  studentId: z.string().uuid('ID do estudante inválido'),
});

const attendanceIdParamsSchema = z.object({
  id: z.string().uuid('ID da presença inválido'),
});

export default async function attendanceRoutes(fastify: FastifyInstance) {
  // Check in to class
  fastify.post('/checkin', {
    schema: {
      tags: ['Attendance'],
      summary: 'Check in to a class',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['classId'],
        properties: {
          classId: { type: 'string', format: 'uuid' },
          method: { type: 'string', enum: ['QR_CODE', 'MANUAL', 'GEOLOCATION'] },
          location: { type: 'string' },
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
    preHandler: [authenticateToken, allRoles, validateBody(checkInSchema)],
    handler: AttendanceController.checkIn,
  });

  // Get attendance history
  fastify.get('/history', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get attendance history',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['PRESENT', 'LATE', 'ABSENT'] },
          classId: { type: 'string', format: 'uuid' },
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
    preHandler: [authenticateToken, allRoles, validateQuery(attendanceHistoryQuerySchema)],
    handler: AttendanceController.getHistory,
  });

  // Update attendance (admin/instructor only)
  fastify.put('/:id', {
    schema: {
      tags: ['Attendance'],
      summary: 'Update attendance record',
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
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['PRESENT', 'LATE', 'ABSENT'] },
          notes: { type: 'string' },
          checkInTime: { type: 'string', format: 'date-time' },
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
      validateParams(attendanceIdParamsSchema),
      validateBody(updateAttendanceSchema),
    ],
    handler: AttendanceController.updateAttendance,
  });

  // Get attendance statistics
  fastify.get('/stats', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get attendance statistics',
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          studentId: { type: 'string', format: 'uuid' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
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
    preHandler: [authenticateToken, allRoles, validateQuery(attendanceStatsQuerySchema)],
    handler: AttendanceController.getStats,
  });

  // Get student by registration number for check-in
  fastify.get('/student/:registrationNumber', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get student by registration number or name for check-in',
      params: {
        type: 'object',
        required: ['registrationNumber'],
        properties: {
          registrationNumber: { type: 'string' },
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
    handler: AttendanceController.getStudentByRegistration,
  });

  // Search students by name or registration (multiple results)
  fastify.get('/students/search/:query', {
    schema: {
      tags: ['Attendance'],
      summary: 'Search students by name or registration for check-in',
      params: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 20, default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: AttendanceController.searchStudents,
  });

  // Get all active students for kiosk cache
  fastify.get('/students/all', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get all active students for kiosk cache',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: AttendanceController.getAllStudents,
  });

  // Get available classes for check-in
  fastify.get('/classes/available', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get available classes for check-in',
      querystring: {
        type: 'object',
        properties: {
          studentId: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    handler: AttendanceController.getAvailableClasses,
  });

  // Student dashboard data
  fastify.get('/dashboard/:studentId', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get student dashboard data',
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
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
    preHandler: [validateParams(studentIdParamsSchema)],
    handler: AttendanceController.getStudentDashboard,
  });

  // Get student attendance pattern (admin/instructor only)
  fastify.get('/pattern/:studentId', {
    schema: {
      tags: ['Attendance'],
      summary: 'Get student attendance pattern',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' },
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
      validateParams(studentIdParamsSchema),
    ],
    handler: AttendanceController.getStudentPattern,
  });
}
import { FastifyInstance } from 'fastify';
import { AuthController } from '@/controllers/authController';
import { validateBody } from '@/middlewares/validation';
import { authenticateToken } from '@/middlewares/auth';
import { registerSchema, loginSchema } from '@/schemas/auth';
import { z } from 'zod';

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Get user by email (for organization sync)
  fastify.get('/users/by-email', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get user organization by email',
      querystring: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                organizationId: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, AuthController.getUserByEmail);

  // Register
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          phone: { type: 'string' },
          emergencyContact: { type: 'string' },
          birthDate: { type: 'string', format: 'date-time' },
          medicalConditions: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                token: { type: 'string' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [validateBody(registerSchema)],
    handler: AuthController.register,
  });

  // Login
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'Login user',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
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
                user: { type: 'object' },
                token: { type: 'string' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [validateBody(loginSchema)],
    handler: AuthController.login,
  });

  // Get profile
  fastify.get('/profile', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      security: [{ Bearer: [] }],
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
    preHandler: [authenticateToken],
    handler: AuthController.profile,
  });

  // Update password
  fastify.put('/password', {
    schema: {
      tags: ['Authentication'],
      summary: 'Update user password',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken, validateBody(updatePasswordSchema)],
    handler: AuthController.updatePassword,
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh JWT token',
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                token: { type: 'string' },
              },
            },
            message: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    preHandler: [authenticateToken],
    handler: AuthController.refresh,
  });
}
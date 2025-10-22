import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GraduationService } from '@/services/graduationService';
import { logger } from '@/utils/logger';

/**
 * Rotas para gerenciar progressão de alunos e graduação
 * Prefix: /api/progression
 */
export default async function progressionRoutes(fastify: FastifyInstance) {
  /**
   * GET /students/:studentId/courses/:courseId
   * Buscar progressão atual de um aluno em um curso
   */
  fastify.get('/students/:studentId/courses/:courseId', {
    schema: {
      description: 'Get student progression in a course',
      tags: ['Progression'],
      params: {
        type: 'object',
        required: ['studentId', 'courseId'],
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' }
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
                studentId: { type: 'string' },
                courseId: { type: 'string' },
                studentName: { type: 'string' },
                courseName: { type: 'string' },
                currentBelt: { type: 'string' },
                totalLessonsInCourse: { type: 'number' },
                completedLessons: { type: 'number' },
                progressPercentage: { type: 'number' },
                currentDegree: { type: 'number' },
                degreePercentage: { type: 'number' },
                nextDegree: { type: ['number', 'null'] },
                lessonsForNextDegree: { type: ['number', 'null'] },
                percentageForNextDegree: { type: ['number', 'null'] },
                isEligibleForBeltChange: { type: 'boolean' },
                eligibilityDetails: { type: 'object' },
                degreeHistory: { type: 'array' }
              }
            }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Params: { studentId: string; courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId, courseId } = request.params;

        const progression = await GraduationService.calculateProgression(
          studentId,
          courseId
        );

        return reply.send({
          success: true,
          data: progression
        });
      } catch (error: any) {
        logger.error('Error fetching progression:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to fetch progression'
        });
      }
    }
  });

  /**
   * POST /students/:studentId/degrees
   * Registrar conquista de novo grau
   * (Geralmente chamado automaticamente após check-in)
   */
  fastify.post('/students/:studentId/degrees', {
    schema: {
      description: 'Record degree achievement',
      tags: ['Progression'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['courseId', 'degree'],
        properties: {
          courseId: { type: 'string' },
          degree: { 
            type: 'number',
            minimum: 1,
            maximum: 4,
            description: 'Degree number (1-4)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Params: { studentId: string };
        Body: { courseId: string; degree: number };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId } = request.params;
        const { courseId, degree } = request.body;

        // Validar degree
        if (degree < 1 || degree > 4) {
          return reply.code(400).send({
            success: false,
            message: 'Degree must be between 1 and 4'
          });
        }

        // Buscar progressão atual
        const progression = await GraduationService.calculateProgression(
          studentId,
          courseId
        );

        // Verificar se aluno já atingiu esse grau
        if (progression.currentDegree < degree) {
          return reply.code(400).send({
            success: false,
            message: `Student has not yet achieved degree ${degree} (current: ${progression.currentDegree})`
          });
        }

        // Registrar conquista
        await GraduationService.recordDegreeAchievement(
          studentId,
          courseId,
          degree,
          progression
        );

        return reply.send({
          success: true,
          message: `Degree ${degree} recorded successfully`
        });
      } catch (error: any) {
        logger.error('Error recording degree:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to record degree'
        });
      }
    }
  });

  /**
   * GET /students/:studentId/courses/:courseId/eligibility
   * Verificar elegibilidade para graduação (mudança de faixa)
   */
  fastify.get('/students/:studentId/courses/:courseId/eligibility', {
    schema: {
      description: 'Check if student is eligible for belt graduation',
      tags: ['Progression'],
      params: {
        type: 'object',
        required: ['studentId', 'courseId'],
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' }
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
                isEligible: { type: 'boolean' },
                currentBelt: { type: 'string' },
                currentDegree: { type: 'number' },
                requirements: { type: 'object' }
              }
            }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Params: { studentId: string; courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId, courseId } = request.params;

        const progression = await GraduationService.calculateProgression(
          studentId,
          courseId
        );

        return reply.send({
          success: true,
          data: {
            isEligible: progression.isEligibleForBeltChange,
            currentBelt: progression.currentBelt,
            currentDegree: progression.currentDegree,
            requirements: progression.eligibilityDetails
          }
        });
      } catch (error: any) {
        logger.error('Error checking eligibility:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to check eligibility'
        });
      }
    }
  });

  /**
   * POST /students/:studentId/graduation
   * Aprovar graduação de faixa (instrutor)
   */
  fastify.post('/students/:studentId/graduation', {
    schema: {
      description: 'Approve belt graduation',
      tags: ['Progression'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['courseId', 'instructorId', 'toBelt'],
        properties: {
          courseId: { type: 'string' },
          instructorId: { type: 'string' },
          toBelt: { 
            type: 'string',
            description: 'New belt (e.g., "Faixa Amarela")'
          },
          ceremonyDate: { 
            type: 'string',
            format: 'date-time',
            description: 'Date of graduation ceremony'
          },
          ceremonyNotes: { 
            type: 'string',
            description: 'Notes about the ceremony'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Params: { studentId: string };
        Body: {
          courseId: string;
          instructorId: string;
          toBelt: string;
          ceremonyDate?: string;
          ceremonyNotes?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId } = request.params;
        const { courseId, instructorId, toBelt, ceremonyDate, ceremonyNotes } = request.body;

        await GraduationService.approveGraduation(
          studentId,
          courseId,
          instructorId,
          {
            toBelt,
            ceremonyDate: ceremonyDate ? new Date(ceremonyDate) : undefined,
            ceremonyNotes
          }
        );

        return reply.send({
          success: true,
          message: `Graduation to ${toBelt} approved successfully`
        });
      } catch (error: any) {
        logger.error('Error approving graduation:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to approve graduation'
        });
      }
    }
  });

  /**
   * GET /courses/:courseId/eligible-students
   * Listar alunos elegíveis para graduação em um curso
   */
  fastify.get('/courses/:courseId/eligible-students', {
    schema: {
      description: 'List students eligible for belt graduation in a course',
      tags: ['Progression'],
      params: {
        type: 'object',
        required: ['courseId'],
        properties: {
          courseId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'object' }
            },
            total: { type: 'number' }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Params: { courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { courseId } = request.params;

        const eligibleStudents = await GraduationService.getEligibleStudents(courseId);

        return reply.send({
          success: true,
          data: eligibleStudents,
          total: eligibleStudents.length
        });
      } catch (error: any) {
        logger.error('Error fetching eligible students:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to fetch eligible students'
        });
      }
    }
  });

  /**
   * POST /check-degrees
   * Verificar e registrar graus automaticamente (chamado após check-in)
   */
  fastify.post('/check-degrees', {
    schema: {
      description: 'Check and record degree achievements automatically',
      tags: ['Progression'],
      body: {
        type: 'object',
        required: ['studentId', 'courseId'],
        properties: {
          studentId: { type: 'string' },
          courseId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (
      request: FastifyRequest<{
        Body: { studentId: string; courseId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { studentId, courseId } = request.body;

        await GraduationService.checkAndRecordDegrees(studentId, courseId);

        return reply.send({
          success: true,
          message: 'Degree check completed'
        });
      } catch (error: any) {
        logger.error('Error checking degrees:', error);
        return reply.code(500).send({
          success: false,
          message: error.message || 'Failed to check degrees'
        });
      }
    }
  });
}

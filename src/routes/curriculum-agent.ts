import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { curriculumAgentService } from '../services/CurriculumAgentService';
import { logger } from '@/utils/logger';
import { z } from 'zod';

/**
 * Curriculum Agent Routes
 * 
 * Endpoints para interagir com o agente educador especialista em artes marciais
 */

// Schemas de validação
const analyzeCourseSchema = z.object({
  courseId: z.string().uuid(),
  organizationId: z.string().uuid()
});

const createLessonSchema = z.object({
  courseId: z.string().uuid(),
  lessonNumber: z.number().int().positive(),
  organizationId: z.string().uuid(),
  userRequirements: z.string().optional()
});

const evaluateLessonSchema = z.object({
  lessonPlanId: z.string().uuid(),
  organizationId: z.string().uuid()
});

export default async function curriculumAgentRoutes(fastify: FastifyInstance) {
  
  /**
   * POST /api/agents/curriculum/analyze-course
   * Analisa um curso completo e fornece recomendações pedagógicas
   */
  fastify.post('/analyze-course', {
    schema: {
      // description: 'Analisa um curso e fornece recomendações pedagógicas do agente educador',
      // tags: ['AI Agents', 'Curriculum'],
      body: {
        type: 'object',
        required: ['courseId', 'organizationId'],
        properties: {
          courseId: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            course: { type: 'object' },
            metrics: { type: 'object' },
            analysis: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = analyzeCourseSchema.parse(request.body);
      
      logger.info(`Analyzing course ${body.courseId} via curriculum agent`);
      
      const result = await curriculumAgentService.analyzeCourse(
        body.courseId,
        body.organizationId
      );

      return reply.code(200).send(result);
      
    } catch (error: any) {
      logger.error('Error analyzing course:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to analyze course'
      });
    }
  });

  /**
   * POST /api/agents/curriculum/create-lesson
   * Cria um novo plano de aula com assistência da IA
   */
  fastify.post('/create-lesson', {
    schema: {
      // description: 'Cria um plano de aula com sugestões do agente educador',
      // tags: ['AI Agents', 'Curriculum'],
      body: {
        type: 'object',
        required: ['courseId', 'lessonNumber', 'organizationId'],
        properties: {
          courseId: { type: 'string', format: 'uuid' },
          lessonNumber: { type: 'number', minimum: 1 },
          organizationId: { type: 'string', format: 'uuid' },
          userRequirements: { type: 'string', description: 'Requisitos específicos do instrutor' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            suggestion: { type: 'object' },
            raw: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createLessonSchema.parse(request.body);
      
      logger.info(`Creating lesson ${body.lessonNumber} for course ${body.courseId} via curriculum agent`);
      
      const result = await curriculumAgentService.createLessonPlan(
        body.courseId,
        body.lessonNumber,
        body.organizationId,
        body.userRequirements
      );

      return reply.code(200).send(result);
      
    } catch (error: any) {
      logger.error('Error creating lesson plan:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to create lesson plan'
      });
    }
  });

  /**
   * POST /api/agents/curriculum/evaluate-lesson
   * Avalia um plano de aula existente e sugere melhorias
   */
  fastify.post('/evaluate-lesson', {
    schema: {
      // description: 'Avalia um plano de aula e fornece feedback do agente educador',
      // tags: ['AI Agents', 'Curriculum'],
      body: {
        type: 'object',
        required: ['lessonPlanId', 'organizationId'],
        properties: {
          lessonPlanId: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            lessonPlan: { type: 'object' },
            metrics: { type: 'object' },
            evaluation: { type: 'string' },
            score: { type: 'number' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = evaluateLessonSchema.parse(request.body);
      
      logger.info(`Evaluating lesson plan ${body.lessonPlanId} via curriculum agent`);
      
      const result = await curriculumAgentService.evaluateLessonPlan(
        body.lessonPlanId,
        body.organizationId
      );

      return reply.code(200).send(result);
      
    } catch (error: any) {
      logger.error('Error evaluating lesson plan:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
      }

      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to evaluate lesson plan'
      });
    }
  });

  /**
   * GET /api/agents/curriculum/mcp-tools
   * Lista ferramentas MCP disponíveis para o agente
   */
  fastify.get('/mcp-tools', {
    schema: {
      // description: 'Lista ferramentas MCP disponíveis para o curriculum agent',
      // tags: ['AI Agents', 'Curriculum'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  parameters: { type: 'object' }
                }
              }
            },
            total: { type: 'number' }
          }
        }
      }
    }
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { listMCPTools } = await import('../services/curriculumMCPTools');
      const tools = listMCPTools();

      return reply.code(200).send({
        success: true,
        tools,
        total: tools.length
      });
      
    } catch (error: any) {
      logger.error('Error listing MCP tools:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to list MCP tools'
      });
    }
  });

  /**
   * POST /api/agents/curriculum/execute-tool
   * Executa uma ferramenta MCP específica
   */
  fastify.post('/execute-tool', {
    schema: {
      // description: 'Executa uma ferramenta MCP do curriculum agent',
      // tags: ['AI Agents', 'Curriculum'],
      body: {
        type: 'object',
        required: ['toolName', 'params'],
        properties: {
          toolName: { type: 'string' },
          params: { type: 'object' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { toolName, params } = request.body as any;
      
      const { executeMCPTool } = await import('../services/curriculumMCPTools');
      const result = await executeMCPTool(toolName, params);

      return reply.code(200).send({
        success: true,
        tool: toolName,
        result
      });
      
    } catch (error: any) {
      logger.error('Error executing MCP tool:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to execute MCP tool'
      });
    }
  });

}

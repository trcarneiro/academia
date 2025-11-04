import type { FastifyInstance } from 'fastify';
import { ActivityExecutionController } from '@/controllers/activityExecutionController';

/**
 * Rotas para gerenciar execução de atividades do plano de aula
 * Prefix: /api/lesson-activity-executions
 */
export default async function activityExecutionsRoutes(fastify: FastifyInstance) {
  /**
   * POST /
   * Registrar ou atualizar execução de uma atividade
   */
  fastify.post('/', {
    schema: {
      description: 'Record or update activity execution',
      tags: ['Activity Executions'],
      body: {
        type: 'object',
        required: ['attendanceId', 'activityId', 'completed'],
        properties: {
          attendanceId: { 
            type: 'string',
            description: 'ID da presença do aluno (TurmaAttendance)'
          },
          activityId: { 
            type: 'string',
            description: 'ID da atividade (LessonPlanActivity)'
          },
          completed: { 
            type: 'boolean',
            description: 'Se a atividade foi completada'
          },
          performanceRating: { 
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Avaliação de performance (1-5 estrelas)'
          },
          actualDuration: { 
            type: 'integer',
            description: 'Duração real em minutos'
          },
          actualReps: { 
            type: 'integer',
            description: 'Repetições reais executadas'
          },
          notes: { 
            type: 'string',
            description: 'Observações do instrutor'
          },
          recordedBy: { 
            type: 'string',
            description: 'ID do instrutor que registrou'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: ActivityExecutionController.recordExecution
  });

  /**
   * GET /lesson/:lessonId
   * Buscar execuções de uma aula (visão do instrutor)
   */
  fastify.get('/lesson/:lessonId', {
    schema: {
      description: 'Get all activity executions for a lesson (instructor view)',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          lessonId: { 
            type: 'string',
            description: 'ID da aula (TurmaLesson)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    },
    handler: ActivityExecutionController.getLessonExecutions
  });

  /**
   * GET /student/:studentId/heatmap
   * Buscar dados para heatmap de execuções do aluno
   */
  fastify.get('/student/:studentId/heatmap', {
    schema: {
      description: 'Get heatmap data for student activity executions',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          studentId: { 
            type: 'string',
            description: 'ID do aluno'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          courseId: { 
            type: 'string',
            description: 'ID do curso (slug)'
          },
          startDate: { 
            type: 'string',
            format: 'date',
            description: 'Data inicial (ISO 8601)'
          },
          endDate: { 
            type: 'string',
            format: 'date',
            description: 'Data final (ISO 8601)'
          }
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
                uniqueActivities: { type: 'array', items: { type: 'string' } },
                uniqueDates: { type: 'array', items: { type: 'string' } },
                heatmapData: { type: 'object' }
              }
            }
          }
        }
      }
    },
    handler: ActivityExecutionController.getStudentHeatmap
  });

  /**
   * GET /student/:studentId/stats
   * Buscar estatísticas de performance de um aluno
   */
  fastify.get('/student/:studentId/stats', {
    schema: {
      description: 'Get student performance statistics',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          studentId: { 
            type: 'string',
            description: 'ID do aluno'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          startDate: { 
            type: 'string',
            format: 'date',
            description: 'Data inicial (filtro)'
          },
          endDate: { 
            type: 'string',
            format: 'date',
            description: 'Data final (filtro)'
          },
          courseId: { 
            type: 'string',
            description: 'ID do curso (filtro)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    },
    handler: ActivityExecutionController.getStudentStats
  });

  /**
   * PATCH /:id
   * Atualizar execução existente
   */
  fastify.patch('/:id', {
    schema: {
      description: 'Update existing activity execution',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string',
            description: 'ID da execução'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          completed: { type: 'boolean' },
          performanceRating: { type: 'integer', minimum: 1, maximum: 5 },
          actualDuration: { type: 'integer' },
          actualReps: { type: 'integer' },
          notes: { type: 'string' },
          recordedBy: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: ActivityExecutionController.updateExecution
  });

  /**
   * DELETE /:id
   * Deletar execução
   */
  fastify.delete('/:id', {
    schema: {
      description: 'Delete activity execution',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          id: { 
            type: 'string',
            description: 'ID da execução'
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
    handler: ActivityExecutionController.deleteExecution
  });

  /**
   * GET /settings/:organizationId
   * Buscar configurações de rastreamento de atividades
   */
  fastify.get('/settings/:organizationId', {
    schema: {
      description: 'Get activity tracking settings for organization',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          organizationId: { 
            type: 'string',
            description: 'ID da organização'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    },
    handler: ActivityExecutionController.getSettings
  });

  /**
   * PUT /settings/:organizationId
   * Atualizar configurações de rastreamento
   */
  fastify.put('/settings/:organizationId', {
    schema: {
      description: 'Update activity tracking settings',
      tags: ['Activity Executions'],
      params: {
        type: 'object',
        properties: {
          organizationId: { 
            type: 'string',
            description: 'ID da organização'
          }
        }
      },
      body: {
        type: 'object',
        properties: {
          autoCompleteOnCheckin: { 
            type: 'boolean',
            description: 'Marcar atividades automaticamente no check-in'
          },
          requireInstructorValidation: { 
            type: 'boolean',
            description: 'Exigir validação manual do professor'
          },
          enablePerformanceRating: { 
            type: 'boolean',
            description: 'Habilitar avaliação de performance (1-5)'
          },
          enableVideos: { 
            type: 'boolean',
            description: 'Habilitar suporte a vídeos'
          },
          defaultActivityDuration: { 
            type: 'integer',
            description: 'Duração padrão por atividade (minutos)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: ActivityExecutionController.updateSettings
  });
}

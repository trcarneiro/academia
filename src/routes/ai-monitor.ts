import { FastifyInstance } from 'fastify';
import { AIMonitorController } from '../controllers/aiMonitorController.js';

export async function aiMonitorRoutes(fastify: FastifyInstance) {
  // Registrar schema de autenticação se necessário
  const authHook = {
    preHandler: fastify.authenticate
  };

  // Health check (sem autenticação para monitoramento)
  fastify.get('/health', {
    schema: {
      description: 'Health check do serviço de monitoramento',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                services: { type: 'object' },
                basicMetrics: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.healthCheck);

  // Endpoint de teste simples
  fastify.get('/test-simple', {
    schema: {
      description: 'Teste simples para debug',
      tags: ['AI Monitor']
    }
  }, async (request, reply) => {
    return reply.send({ 
      success: true, 
      message: 'Teste funcionando',
      data: {
        timestamp: new Date().toISOString(),
        test: 'OK'
      }
    });
  });

  // Teste com dados mock
  fastify.get('/test-mock', {
    schema: {
      description: 'Teste com dados simulados para debug',
      tags: ['AI Monitor']
    }
  }, async (request, reply) => {
    const mockData = {
      courses: 5,
      plans: 15,
      activities: 45,
      orphanActivities: 8,
      plansCoverage: 75
    };
    return { 
      success: true, 
      message: 'Dados mock gerados com sucesso',
      data: mockData
    };
  });

  // Teste mínimo com banco
  fastify.get('/test-db', {
    schema: {
      description: 'Teste mínimo com banco de dados',
      tags: ['AI Monitor']
    }
  }, async (request, reply) => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Teste com processamento similar ao service
      const courses = await prisma.course.findMany({
        select: {
          id: true,
          name: true,
          totalClasses: true,
          lessonPlans: {
            select: {
              id: true
            }
          }
        },
        take: 1
      });

      // Processar os dados como no service
      const analysis = courses.map(course => {
        const totalClassesPlanned = course.totalClasses || 0;
        const lessonPlansCount = course.lessonPlans ? course.lessonPlans.length : 0;
        const plansCoverage = totalClassesPlanned > 0 ? 
          Math.round((lessonPlansCount / totalClassesPlanned) * 100) : 0;
        const missingPlansEstimate = Math.max(0, totalClassesPlanned - lessonPlansCount);

        return {
          courseId: course.id,
          courseName: course.name,
          totalClassesPlanned,
          lessonPlansCount,
          plansCoverage,
          missingPlansEstimate
        };
      });
      
      await prisma.$disconnect();
      
      return { 
        success: true, 
        message: 'Análise processada com sucesso',
        data: analysis
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Erro no acesso ao banco',
        error: error.message 
      };
    }
  });

  // Métricas rápidas
  fastify.get('/metrics/quick', {
    ...authHook,
    schema: {
      description: 'Obtém métricas rápidas do sistema de planos de aula',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                courses: { type: 'number' },
                lessons: { type: 'number' },
                plans: { type: 'number' },
                activities: { type: 'number' },
                orphanActivities: { type: 'number' },
                plansCoverage: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.getQuickMetrics);

  // Análise completa
  fastify.get('/analysis/full', {
    ...authHook,
    schema: {
      description: 'Executa análise completa do sistema de planos de aula',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                coursesAnalysis: { type: 'array' },
                orphanActivities: { type: 'array' },
                suggestions: { type: 'array' },
                summary: {
                  type: 'object',
                  properties: {
                    totalCourses: { type: 'number' },
                    coursesWithMissingPlans: { type: 'number' },
                    totalOrphanActivities: { type: 'number' },
                    overallCoverage: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.runFullAnalysis);

  // Cursos com planos faltando
  fastify.get('/courses/missing-plans', {
    ...authHook,
    schema: {
      description: 'Obtém cursos com planos de aula faltando',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  courseId: { type: 'string' },
                  courseName: { type: 'string' },
                  totalClassesPlanned: { type: 'number' },
                  lessonPlansCount: { type: 'number' },
                  plansCoverage: { type: 'number' },
                  missingPlansEstimate: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.getCoursesWithoutPlans);

  // Atividades órfãs
  fastify.get('/activities/orphan', {
    ...authHook,
    schema: {
      description: 'Obtém atividades órfãs (sem associação a planos de aula)',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activityId: { type: 'string' },
                  activityName: { type: 'string' },
                  activityType: { type: 'string' },
                  technique: { type: 'string' },
                  category: { type: 'string' },
                  suggestedCourses: { type: 'array' }
                }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.getOrphanActivities);

  // Análise de curso específico
  fastify.get('/courses/:courseId/analysis', {
    ...authHook,
    schema: {
      description: 'Obtém análise detalhada de um curso específico',
      tags: ['AI Monitor'],
      params: {
        type: 'object',
        properties: {
          courseId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['courseId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                courseId: { type: 'number' },
                courseName: { type: 'string' },
                lessonsTotal: { type: 'number' },
                lessonsWithPlans: { type: 'number' },
                lessonsWithoutPlans: { type: 'number' },
                coverage: { type: 'number' },
                missingLessons: { type: 'array' },
                suggestions: { type: 'array' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, AIMonitorController.getCourseAnalysis);

  // Análise de atividade específica
  fastify.get('/activities/:activityId/analysis', {
    ...authHook,
    schema: {
      description: 'Obtém análise detalhada de uma atividade específica',
      tags: ['AI Monitor'],
      params: {
        type: 'object',
        properties: {
          activityId: { type: 'string', pattern: '^[0-9]+$' }
        },
        required: ['activityId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                activityId: { type: 'number' },
                activityName: { type: 'string' },
                technique: { type: 'string' },
                category: { type: 'string' },
                suggestedCourses: { type: 'array' },
                suggestions: { type: 'array' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, AIMonitorController.getActivityAnalysis);

  // Relatório de monitoramento
  fastify.get('/report/summary', {
    ...authHook,
    schema: {
      description: 'Gera relatório de monitoramento em formato resumido',
      tags: ['AI Monitor'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                generatedAt: { type: 'string' },
                summary: { type: 'object' },
                topIssues: { type: 'object' },
                recommendations: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, AIMonitorController.getMonitoringReport);
}
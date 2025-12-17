import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

/**
 * MCP Tools for Curriculum Agent
 * 
 * Ferramentas que permitem ao agente acessar dados reais da base de dados
 * para tomar decisões pedagógicas informadas
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * Busca dados completos de um curso
 */
export const getCourseData: MCPTool = {
  name: 'getCourseData',
  description: 'Busca informações completas de um curso incluindo planos de aula, atividades, técnicas e sistema de graduação',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      },
      organizationId: {
        type: 'string',
        description: 'ID da organização'
      }
    },
    required: ['courseId', 'organizationId']
  },
  execute: async ({ courseId, organizationId }) => {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId, organizationId },
        include: {
          graduationLevels: {
            orderBy: { requiredProgressPercentage: 'asc' }
          },
          activityCategories: {
            include: {
              activities: true
            }
          },
          lessonPlans: {
            include: {
              activityItems: {
                include: {
                  technique: true
                }
              }
            },
            orderBy: { lessonNumber: 'asc' }
          },
          students: {
            select: {
              id: true,
              currentGradeLevel: true,
              progressPercentage: true
            }
          },
          _count: {
            select: {
              students: true,
              lessonPlans: true
            }
          }
        }
      });

      if (!course) {
        throw new Error(`Course ${courseId} not found`);
      }

      logger.info(`MCP: Retrieved course data for ${course.name}`);
      return course;
    } catch (error) {
      logger.error('MCP getCourseData error:', error);
      throw error;
    }
  }
};

/**
 * Busca técnicas disponíveis
 */
export const getTechniques: MCPTool = {
  name: 'getTechniques',
  description: 'Lista todas as técnicas disponíveis filtradas por categoria',
  parameters: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'ID da organização'
      },
      category: {
        type: 'string',
        enum: ['POSTURAS', 'SOCOS', 'CHUTES', 'DEFESAS', 'QUEDAS', 'COMBINAÇÕES', 'OUTROS'],
        description: 'Categoria da técnica (opcional)'
      },
      limit: {
        type: 'number',
        description: 'Número máximo de resultados (padrão: 50)'
      }
    },
    required: ['organizationId']
  },
  execute: async ({ organizationId, category, limit = 50 }) => {
    try {
      const techniques = await prisma.technique.findMany({
        where: {
          organizationId,
          ...(category && { category })
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ],
        take: limit
      });

      logger.info(`MCP: Retrieved ${techniques.length} techniques`);
      return techniques;
    } catch (error) {
      logger.error('MCP getTechniques error:', error);
      throw error;
    }
  }
};

/**
 * Busca planos de aula de um curso
 */
export const getLessonPlans: MCPTool = {
  name: 'getLessonPlans',
  description: 'Busca planos de aula de um curso específico',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      },
      lessonNumber: {
        type: 'number',
        description: 'Número específico da aula (opcional)'
      }
    },
    required: ['courseId']
  },
  execute: async ({ courseId, lessonNumber }) => {
    try {
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: {
          courseId,
          ...(lessonNumber && { lessonNumber })
        },
        include: {
          activities: {
            include: {
              technique: true
            }
          }
        },
        orderBy: { lessonNumber: 'asc' }
      });

      logger.info(`MCP: Retrieved ${lessonPlans.length} lesson plans`);
      return lessonPlans;
    } catch (error) {
      logger.error('MCP getLessonPlans error:', error);
      throw error;
    }
  }
};

/**
 * Busca estatísticas de execução de atividades
 */
export const getActivityExecutionStats: MCPTool = {
  name: 'getActivityExecutionStats',
  description: 'Busca estatísticas de execução de atividades por alunos (completion rate, ratings médios)',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      },
      lessonNumber: {
        type: 'number',
        description: 'Número da aula (opcional)'
      },
      limit: {
        type: 'number',
        description: 'Número de resultados (padrão: 100)'
      }
    },
    required: ['courseId']
  },
  execute: async ({ courseId, lessonNumber, limit = 100 }) => {
    try {
      const executions = await prisma.lessonActivityExecution.findMany({
        where: {
          lessonPlan: {
            courseId,
            ...(lessonNumber && { lessonNumber })
          },
          status: 'COMPLETED'
        },
        include: {
          activity: {
            include: {
              technique: true
            }
          },
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: limit
      });

      // Agregar estatísticas por atividade
      const stats: Record<string, any> = {};
      
      executions.forEach(exec => {
        const key = exec.activity.technique?.name || 'Unknown';
        if (!stats[key]) {
          stats[key] = {
            technique: exec.activity.technique,
            totalExecutions: 0,
            totalRating: 0,
            avgRating: 0,
            completionRate: 0,
            students: new Set()
          };
        }

        stats[key].totalExecutions += 1;
        if (exec.rating) {
          stats[key].totalRating += exec.rating;
        }
        stats[key].students.add(exec.studentId);
      });

      // Calcular médias
      Object.keys(stats).forEach(key => {
        const stat = stats[key];
        stat.avgRating = stat.totalRating / stat.totalExecutions;
        stat.uniqueStudents = stat.students.size;
        delete stat.students; // Remover Set antes de serializar
      });

      logger.info(`MCP: Retrieved execution stats for ${Object.keys(stats).length} activities`);
      return {
        totalExecutions: executions.length,
        activitiesStats: stats
      };
    } catch (error) {
      logger.error('MCP getActivityExecutionStats error:', error);
      throw error;
    }
  }
};

/**
 * Busca categorias de atividades e requisitos mínimos
 */
export const getActivityCategories: MCPTool = {
  name: 'getActivityCategories',
  description: 'Busca categorias de atividades definidas no curso com requisitos mínimos para graduação',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      }
    },
    required: ['courseId']
  },
  execute: async ({ courseId }) => {
    try {
      const categories = await prisma.activityCategory.findMany({
        where: { courseId },
        include: {
          activities: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      logger.info(`MCP: Retrieved ${categories.length} activity categories`);
      return categories;
    } catch (error) {
      logger.error('MCP getActivityCategories error:', error);
      throw error;
    }
  }
};

/**
 * Busca sistema de graduação do curso
 */
export const getGraduationSystem: MCPTool = {
  name: 'getGraduationSystem',
  description: 'Busca o sistema de graduação (graus e faixas) configurado para o curso',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      }
    },
    required: ['courseId']
  },
  execute: async ({ courseId }) => {
    try {
      const graduationLevels = await prisma.courseGraduationLevel.findMany({
        where: { courseId },
        orderBy: { requiredProgressPercentage: 'asc' }
      });

      logger.info(`MCP: Retrieved ${graduationLevels.length} graduation levels`);
      return graduationLevels;
    } catch (error) {
      logger.error('MCP getGraduationSystem error:', error);
      throw error;
    }
  }
};

/**
 * Busca progresso de alunos no curso
 */
export const getStudentProgress: MCPTool = {
  name: 'getStudentProgress',
  description: 'Busca dados de progresso de alunos matriculados no curso',
  parameters: {
    type: 'object',
    properties: {
      courseId: {
        type: 'string',
        description: 'ID do curso'
      },
      limit: {
        type: 'number',
        description: 'Número de alunos (padrão: 50)'
      }
    },
    required: ['courseId']
  },
  execute: async ({ courseId, limit = 50 }) => {
    try {
      const students = await prisma.studentCourse.findMany({
        where: {
          courseId,
          status: 'ACTIVE'
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { progressPercentage: 'desc' },
        take: limit
      });

      logger.info(`MCP: Retrieved progress data for ${students.length} students`);
      return students;
    } catch (error) {
      logger.error('MCP getStudentProgress error:', error);
      throw error;
    }
  }
};

/**
 * Executa query customizada (uso avançado)
 */
export const executeCustomQuery: MCPTool = {
  name: 'executeCustomQuery',
  description: 'Executa query SQL customizada (SOMENTE LEITURA) para análises complexas',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Query SQL SELECT (apenas leitura)'
      }
    },
    required: ['query']
  },
  execute: async ({ query }) => {
    try {
      // Validar que é apenas SELECT
      if (!query.trim().toUpperCase().startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed');
      }

      const result = await prisma.$queryRawUnsafe(query);
      
      logger.info(`MCP: Executed custom query, returned ${Array.isArray(result) ? result.length : 1} rows`);
      return result;
    } catch (error) {
      logger.error('MCP executeCustomQuery error:', error);
      throw error;
    }
  }
};

/**
 * Registrar todas as ferramentas MCP
 */
export const curriculumMCPTools: MCPTool[] = [
  getCourseData,
  getTechniques,
  getLessonPlans,
  getActivityExecutionStats,
  getActivityCategories,
  getGraduationSystem,
  getStudentProgress,
  executeCustomQuery
];

/**
 * Executar ferramenta MCP pelo nome
 */
export async function executeMCPTool(toolName: string, params: any) {
  const tool = curriculumMCPTools.find(t => t.name === toolName);
  
  if (!tool) {
    throw new Error(`MCP Tool '${toolName}' not found`);
  }

  logger.info(`Executing MCP tool: ${toolName}`, { params });
  return await tool.execute(params);
}

/**
 * Listar ferramentas disponíveis para o agente
 */
export function listMCPTools() {
  return curriculumMCPTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

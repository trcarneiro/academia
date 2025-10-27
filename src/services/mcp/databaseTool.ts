/**
 * Database Tool - MCP Tool for Agents
 * Permite que agentes executem queries READ-ONLY no banco de dados
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export class DatabaseTool {
  /**
   * Queries pré-aprovadas que os agentes podem executar
   */
  private static readonly APPROVED_QUERIES = {
    // Pagamentos atrasados
    overdue_payments: {
      description: 'Listar alunos com pagamentos atrasados',
      query: async (organizationId: string, params?: { days?: number }) => {
        const days = params?.days || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return prisma.studentSubscription.findMany({
          where: {
            organizationId,
            status: 'OVERDUE',
            updatedAt: {
              lte: cutoffDate,
            },
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            plan: true,
          },
          take: 100,
        });
      },
    },

    // Alunos inativos
    inactive_students: {
      description: 'Listar alunos sem check-in nos últimos N dias',
      query: async (organizationId: string, params?: { days?: number }) => {
        const days = params?.days || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return prisma.student.findMany({
          where: {
            organizationId,
            lastCheckinDate: {
              lte: cutoffDate,
            },
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          take: 100,
        });
      },
    },

    // Novos cadastros
    new_students: {
      description: 'Listar novos alunos cadastrados nos últimos N dias',
      query: async (organizationId: string, params?: { days?: number }) => {
        const days = params?.days || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return prisma.student.findMany({
          where: {
            organizationId,
            enrollmentDate: {
              gte: cutoffDate,
            },
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            enrollmentDate: 'desc',
          },
        });
      },
    },

    // Taxa de frequência
    attendance_rate: {
      description: 'Calcular taxa de frequência nos últimos N dias',
      query: async (organizationId: string, params?: { days?: number }) => {
        const days = params?.days || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [totalClasses, totalAttendances] = await Promise.all([
          prisma.turma.count({
            where: {
              organizationId,
              startTime: {
                gte: startDate,
              },
            },
          }),
          prisma.attendance.count({
            where: {
              organizationId,
              checkinAt: {
                gte: startDate,
              },
            },
          }),
        ]);

        return {
          totalClasses,
          totalAttendances,
          rate: totalClasses > 0 ? (totalAttendances / totalClasses) * 100 : 0,
          period: `${days} days`,
        };
      },
    },

    // Planos mais vendidos
    popular_plans: {
      description: 'Listar planos mais vendidos',
      query: async (organizationId: string) => {
        return prisma.billingPlan.findMany({
          where: {
            organizationId,
            isActive: true,
          },
          include: {
            _count: {
              select: {
                subscriptions: true,
              },
            },
          },
          orderBy: {
            subscriptions: {
              _count: 'desc',
            },
          },
          take: 10,
        });
      },
    },

    // Leads não convertidos
    unconverted_leads: {
      description: 'Listar leads não convertidos há mais de N dias',
      query: async (organizationId: string, params?: { days?: number }) => {
        const days = params?.days || 14;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return prisma.lead.findMany({
          where: {
            organizationId,
            status: {
              notIn: ['CONVERTED', 'LOST'],
            },
            createdAt: {
              lte: cutoffDate,
            },
          },
          include: {
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          take: 100,
        });
      },
    },
  };

  /**
   * Executar query pré-aprovada
   */
  static async executeQuery(
    queryName: string,
    organizationId: string,
    params?: any
  ) {
    try {
      const query = this.APPROVED_QUERIES[queryName as keyof typeof this.APPROVED_QUERIES];

      if (!query) {
        return {
          success: false,
          error: `Query '${queryName}' não encontrada. Queries disponíveis: ${Object.keys(this.APPROVED_QUERIES).join(', ')}`,
        };
      }

      logger.info('Executing database query for agent:', {
        queryName,
        organizationId,
        params,
      });

      const result = await query.query(organizationId, params);

      return {
        success: true,
        data: result,
        description: query.description,
      };
    } catch (error) {
      logger.error('Error executing database query:', error);
      return {
        success: false,
        error: 'Failed to execute query',
      };
    }
  }

  /**
   * Listar queries disponíveis
   */
  static listAvailableQueries() {
    return Object.entries(this.APPROVED_QUERIES).map(([name, query]) => ({
      name,
      description: query.description,
    }));
  }

  /**
   * Validar se query é permitida (para uso futuro com queries customizadas)
   */
  private static validateQuery(sql: string): boolean {
    const sql_lower = sql.toLowerCase();

    // Bloquear operações de escrita
    const forbidden = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate'];

    for (const keyword of forbidden) {
      if (sql_lower.includes(keyword)) {
        return false;
      }
    }

    // Deve começar com SELECT
    if (!sql_lower.trim().startsWith('select')) {
      return false;
    }

    return true;
  }
}

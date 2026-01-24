import { FastifyInstance } from 'fastify';
import { FrequencyStatsService } from '../services/frequencyStatsService';
import { logger } from '../utils/logger';

async function frequencyRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/frequency/dashboard-stats
   * Obter estatísticas agregadas para o dashboard
   */
  fastify.get<{ Querystring: { organizationId?: string } }>('/dashboard-stats', async (request, reply) => {
    try {
      // TODO: Pegar organizationId do token JWT autenticado
      const organizationId =
        request.query.organizationId || 'a55ad715-2eb0-493c-996c-bb0f60bacec9';

      const stats = await FrequencyStatsService.getDashboardStats(organizationId);

      return reply.send(stats);
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar estatísticas',
      });
    }
  });

  /**
   * GET /api/frequency/charts-data
   * Obter dados para gráficos do dashboard
   */
  fastify.get<{ Querystring: { organizationId?: string } }>('/charts-data', async (request, reply) => {
    try {
      const organizationId =
        request.query.organizationId || 'a55ad715-2eb0-493c-996c-bb0f60bacec9';

      const charts = await FrequencyStatsService.getChartsData(organizationId);

      return reply.send(charts);
    } catch (error) {
      logger.error('Error fetching charts data:', error);
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar dados de gráficos',
      });
    }
  });

  /**
   * GET /api/frequency/students-missing-with-active-plans
   * Obter lista de alunos com planos ativos mas sem check-in recente
   */
  fastify.get<{ Querystring: { organizationId?: string; daysThreshold?: string } }>('/students-missing-with-active-plans', async (request, reply) => {
    try {
      const organizationId =
        request.query.organizationId || 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
      const daysThreshold = request.query.daysThreshold
        ? parseInt(request.query.daysThreshold, 10)
        : 7;

      const students =
        await FrequencyStatsService.getStudentsMissingWithActivePlans(
          organizationId,
          daysThreshold
        );

      return reply.send({
        success: true,
        data: students,
        total: students.length,
      });
    } catch (error) {
      logger.error('Error fetching students missing:', error);
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar alunos faltosos',
      });
    }
  });

  /**
   * GET /api/frequency/lessons-history
   * Obter histórico de aulas com participantes (paginado)
   */
  fastify.get<{
    Querystring: {
      organizationId?: string;
      page?: string;
      pageSize?: string;
      turmaId?: string;
      status?: any; // ClassStatus enum?
      startDate?: string;
      endDate?: string;
    }
  }>('/lessons-history', async (request, reply) => {
    try {
      const organizationId =
        request.query.organizationId || 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
      const page = request.query.page ? parseInt(request.query.page, 10) : 1;
      const pageSize = request.query.pageSize ? parseInt(request.query.pageSize, 10) : 20;
      const turmaId = request.query.turmaId;
      const status = request.query.status;
      const startDate = request.query.startDate;
      const endDate = request.query.endDate;

      const result = await FrequencyStatsService.getLessonsHistory(
        organizationId,
        { page, pageSize, turmaId, status, startDate, endDate }
      );

      return reply.send({
        success: true,
        data: result.lessons,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Error fetching lessons history:', error);
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar histórico de aulas',
      });
    }
  });
}

export default frequencyRoutes;

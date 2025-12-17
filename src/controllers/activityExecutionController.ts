import type { FastifyRequest, FastifyReply } from 'fastify';
import { ActivityExecutionService } from '@/services/activityExecService';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';

/**
 * Controller para gerenciar execução de atividades do plano de aula
 */
export class ActivityExecutionController {
  /**
   * POST /api/lesson-activity-executions
   * Registrar ou atualizar execução de uma atividade
   */
  static async recordExecution(
    request: FastifyRequest<{
      Body: {
        attendanceId: string;
        activityId: string;
        completed: boolean;
        performanceRating?: number;
        actualDuration?: number;
        actualReps?: number;
        notes?: string;
        recordedBy?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const execution = await ActivityExecutionService.recordExecution(request.body);

      return reply.code(200).send({
        success: true,
        data: execution,
        message: 'Activity execution recorded successfully'
      });
    } catch (error: any) {
      logger.error('Error in recordExecution controller:', error);
      return reply.code(400).send({
        success: false,
        message: error.message || 'Failed to record activity execution'
      });
    }
  }

  /**
   * GET /api/lesson-activity-executions/lesson/:lessonId
   * Buscar execuções de uma aula (visão do instrutor)
   */
  static async getLessonExecutions(
    request: FastifyRequest<{
      Params: {
        lessonId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { lessonId } = request.params;
      const data = await ActivityExecutionService.findByLesson(lessonId);

      return reply.code(200).send({
        success: true,
        data
      });
    } catch (error: any) {
      logger.error('Error in getLessonExecutions controller:', error);
      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch lesson executions'
      });
    }
  }

  /**
   * GET /api/lesson-activity-executions/student/:studentId/stats
   * Buscar estatísticas de performance de um aluno
   */
  static async getStudentStats(
    request: FastifyRequest<{
      Params: {
        studentId: string;
      };
      Querystring: {
        startDate?: string;
        endDate?: string;
        courseId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { studentId } = request.params;
      const { startDate, endDate, courseId } = request.query;

      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (courseId) filters.courseId = courseId;

      const stats = await ActivityExecutionService.getStudentStats(studentId, filters);

      return reply.code(200).send({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Error in getStudentStats controller:', error);
      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        message: error.message || 'Failed to fetch student stats'
      });
    }
  }

  /**
   * PATCH /api/lesson-activity-executions/:id
   * Atualizar execução existente
   */
  static async updateExecution(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        completed?: boolean;
        performanceRating?: number | null;
        actualDuration?: number | null;
        actualReps?: number | null;
        notes?: string | null;
        recordedBy?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const execution = await ActivityExecutionService.updateExecution(id, request.body);

      return reply.code(200).send({
        success: true,
        data: execution,
        message: 'Activity execution updated successfully'
      });
    } catch (error: any) {
      logger.error('Error in updateExecution controller:', error);
      return reply.code(error.message.includes('not found') ? 404 : 400).send({
        success: false,
        message: error.message || 'Failed to update activity execution'
      });
    }
  }

  /**
   * DELETE /api/lesson-activity-executions/:id
   * Deletar execução
   */
  static async deleteExecution(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      await ActivityExecutionService.deleteExecution(id);

      return reply.code(200).send({
        success: true,
        message: 'Activity execution deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error in deleteExecution controller:', error);
      return reply.code(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        message: error.message || 'Failed to delete activity execution'
      });
    }
  }

  /**
   * GET /api/lesson-activity-executions/settings/:organizationId
   * Buscar configurações de rastreamento de atividades
   */
  static async getSettings(
    request: FastifyRequest<{
      Params: {
        organizationId: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { organizationId } = request.params;
      let settings = await ActivityExecutionService.getSettings(organizationId);

      // Se não existir, criar configurações padrão
      if (!settings) {
        settings = await ActivityExecutionService.createDefaultSettings(organizationId);
      }

      return reply.code(200).send({
        success: true,
        data: settings
      });
    } catch (error: any) {
      logger.error('Error in getSettings controller:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch settings'
      });
    }
  }

  /**
   * PUT /api/lesson-activity-executions/settings/:organizationId
   * Atualizar configurações de rastreamento
   */
  static async updateSettings(
    request: FastifyRequest<{
      Params: {
        organizationId: string;
      };
      Body: {
        autoCompleteOnCheckin?: boolean;
        requireInstructorValidation?: boolean;
        enablePerformanceRating?: boolean;
        enableVideos?: boolean;
        defaultActivityDuration?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { organizationId } = request.params;
      
      const settings = await prisma.activityTrackingSettings.upsert({
        where: { organizationId },
        update: request.body,
        create: {
          organizationId,
          ...request.body
        }
      });

      return reply.code(200).send({
        success: true,
        data: settings,
        message: 'Settings updated successfully'
      });
    } catch (error: any) {
      logger.error('Error in updateSettings controller:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to update settings'
      });
    }
  }

  /**
   * GET /api/lesson-activity-executions/student/:studentId/heatmap
   * Buscar dados para heatmap de execuções do aluno
   */
  static async getStudentHeatmap(
    request: FastifyRequest<{
      Params: {
        studentId: string;
      };
      Querystring: {
        courseId?: string;
        startDate?: string;
        endDate?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { studentId } = request.params;
      const { courseId, startDate, endDate } = request.query;

      const filters = {
        courseId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };

      const heatmapData = await ActivityExecutionService.getStudentHeatmap(studentId, filters);

      return reply.code(200).send({
        success: true,
        data: heatmapData
      });
    } catch (error: any) {
      logger.error('Error in getStudentHeatmap controller:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Failed to fetch heatmap data'
      });
    }
  }
}


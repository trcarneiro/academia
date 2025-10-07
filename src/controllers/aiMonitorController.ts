import { FastifyRequest, FastifyReply } from 'fastify';
import { lessonPlanMonitorAgent } from '../services/lessonPlanMonitorAgent.js';
import { ResponseHelper } from '@/utils/response.js';

export class AIMonitorController {
  /**
   * Executa análise completa do sistema de planos de aula
   * GET /api/ai-monitor/analysis/full
   */
  static async runFullAnalysis(request: FastifyRequest, reply: FastifyReply) {
    try {
      const analysis = await lessonPlanMonitorAgent.runFullAnalysis();
      
      return ResponseHelper.success(reply, analysis, 'Análise completa executada com sucesso');
    } catch (error) {
      console.error('Erro na análise completa:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao executar análise completa', 500);
    }
  }

  /**
   * Obtém cursos com planos de aula faltando
   * GET /api/ai-monitor/courses/missing-plans
   */
  static async getCoursesWithoutPlans(request: FastifyRequest, reply: FastifyReply) {
    try {
      const coursesAnalysis = await lessonPlanMonitorAgent.analyzeCoursesWithoutPlans();
      
      // Retorno direto sem ResponseHelper para debug
      return reply.send({
        success: true,
        message: 'Análise de cursos executada com sucesso',
        data: coursesAnalysis
      });
    } catch (error) {
      console.error('Erro na análise de cursos:', error);
      return reply.code(500).send({
        success: false,
        message: 'Erro interno do servidor ao analisar cursos',
        error: error.message
      });
    }
  }

  /**
   * Obtém atividades órfãs (sem associação a planos de aula)
   * GET /api/ai-monitor/activities/orphan
   */
  static async getOrphanActivities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const orphanActivities = await lessonPlanMonitorAgent.findOrphanActivities();
      
      return ResponseHelper.success(reply, orphanActivities, 'Atividades órfãs identificadas com sucesso');
    } catch (error) {
      console.error('Erro ao identificar atividades órfãs:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao identificar atividades órfãs', 500);
    }
  }

  /**
   * Obtém métricas rápidas para dashboard
   * GET /api/ai-monitor/metrics/quick
   */
  static async getQuickMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const metrics = await lessonPlanMonitorAgent.getQuickMetrics();
      
      return ResponseHelper.success(reply, metrics, 'Métricas obtidas com sucesso');
    } catch (error) {
      console.error('Erro ao obter métricas rápidas:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao obter métricas', 500);
    }
  }

  /**
   * Obtém análise detalhada de um curso específico
   * GET /api/ai-monitor/courses/:courseId/analysis
   */
  static async getCourseAnalysis(request: FastifyRequest<{
    Params: { courseId: string }
  }>, reply: FastifyReply) {
    try {
      const courseId = parseInt(request.params.courseId);
      
      if (isNaN(courseId)) {
        return ResponseHelper.error(reply, 'ID do curso deve ser um número válido', 400);
      }

      // Executar análise completa e filtrar pelo curso específico
      const fullAnalysis = await lessonPlanMonitorAgent.runFullAnalysis();
      const courseAnalysis = fullAnalysis.coursesAnalysis.find(c => c.courseId === courseId);
      
      if (!courseAnalysis) {
        return ResponseHelper.error(reply, 'Curso não encontrado', 404);
      }

      // Incluir sugestões relacionadas a este curso
      const courseSuggestions = fullAnalysis.suggestions.filter(s => 
        s.metadata.courseId === courseId || s.metadata.suggestedCourseId === courseId
      );

      const result = {
        ...courseAnalysis,
        suggestions: courseSuggestions
      };
      
      return ResponseHelper.success(reply, result, 'Análise do curso obtida com sucesso');
    } catch (error) {
      console.error('Erro na análise do curso:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao analisar curso', 500);
    }
  }

  /**
   * Obtém análise detalhada de uma atividade específica
   * GET /api/ai-monitor/activities/:activityId/analysis
   */
  static async getActivityAnalysis(request: FastifyRequest<{
    Params: { activityId: string }
  }>, reply: FastifyReply) {
    try {
      const activityId = parseInt(request.params.activityId);
      
      if (isNaN(activityId)) {
        return ResponseHelper.error(reply, 'ID da atividade deve ser um número válido', 400);
      }

      // Executar análise completa e filtrar pela atividade específica
      const fullAnalysis = await lessonPlanMonitorAgent.runFullAnalysis();
      const activityAnalysis = fullAnalysis.orphanActivities.find(a => a.activityId === activityId);
      
      if (!activityAnalysis) {
        return ResponseHelper.error(reply, 'Atividade não encontrada ou não é órfã', 404);
      }

      // Incluir sugestões relacionadas a esta atividade
      const activitySuggestions = fullAnalysis.suggestions.filter(s => 
        s.metadata.activityId === activityId
      );

      const result = {
        ...activityAnalysis,
        suggestions: activitySuggestions
      };
      
      return ResponseHelper.success(reply, result, 'Análise da atividade obtida com sucesso');
    } catch (error) {
      console.error('Erro na análise da atividade:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao analisar atividade', 500);
    }
  }

  /**
   * Gera relatório de monitoramento em formato resumido
   * GET /api/ai-monitor/report/summary
   */
  static async getMonitoringReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const fullAnalysis = await lessonPlanMonitorAgent.runFullAnalysis();
      
      // Criar relatório resumido
      const report = {
        generatedAt: new Date().toISOString(),
        summary: fullAnalysis.summary,
        topIssues: {
          coursesWithLowestCoverage: fullAnalysis.coursesAnalysis
            .slice(0, 5)
            .map(c => ({ name: c.courseName, coverage: c.coverage })),
          mostUrgentSuggestions: fullAnalysis.suggestions
            .filter(s => s.priority === 'high')
            .slice(0, 5)
            .map(s => ({ title: s.title, type: s.type })),
          orphanActivitiesCount: fullAnalysis.orphanActivities.length
        },
        recommendations: {
          immediate: fullAnalysis.suggestions.filter(s => s.priority === 'high').length,
          shortTerm: fullAnalysis.suggestions.filter(s => s.priority === 'medium').length,
          longTerm: fullAnalysis.suggestions.filter(s => s.priority === 'low').length
        }
      };
      
      return ResponseHelper.success(reply, report, 'Relatório de monitoramento gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return ResponseHelper.error(reply, 'Erro interno do servidor ao gerar relatório', 500);
    }
  }

  /**
   * Health check do serviço de monitoramento
   * GET /api/ai-monitor/health
   */
  static async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Teste básico de conectividade com o banco
      const metrics = await lessonPlanMonitorAgent.getQuickMetrics();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          monitoring: 'operational'
        },
        basicMetrics: {
          coursesCount: metrics.courses,
          plansCount: metrics.plans
        }
      };
      
      return ResponseHelper.success(reply, health, 'Serviço de monitoramento operacional');
    } catch (error) {
      console.error('Erro no health check:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      return reply.status(503).send({
        success: false,
        error: 'Serviço de monitoramento indisponível',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'error',
            monitoring: 'error'
          },
          error: errorMessage
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}
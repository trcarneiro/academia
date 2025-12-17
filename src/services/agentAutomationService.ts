/**
 * Agent Automation Service
 * Gerencia triggers e automações para execução de agentes
 */

import { logger } from '@/utils/logger';
import { prisma } from '@/utils/database';
import { AgentOrchestratorService } from './agentOrchestratorService';
import { DatabaseTool } from './mcp/databaseTool';
import { NotificationTool } from './mcp/notificationTool';
import { AgentInteractionService } from './agentInteractionService';

export type TriggerType = 
  | 'payment_overdue'
  | 'student_inactive'
  | 'new_lead_created'
  | 'low_attendance'
  | 'course_ending'
  | 'cron';

export interface TriggerEvent {
  type: TriggerType;
  organizationId: string;
  data?: any;
}

export class AgentAutomationService {
  
  /**
   * Processar trigger e executar agentes associados
   */
  static async processTrigger(event: TriggerEvent) {
    try {
      logger.info('Processing trigger:', event);

      // Buscar agentes com automation rules para este trigger
      const agents = await prisma.aIAgent.findMany({
        where: {
          organizationId: event.organizationId,
          isActive: true,
          automationRules: {
            path: '$[*].trigger',
            array_contains: event.type,
          },
        },
      });

      if (agents.length === 0) {
        logger.info('No agents found for trigger:', event.type);
        return { success: true, message: 'No agents to execute' };
      }

      logger.info(`Found ${agents.length} agent(s) for trigger ${event.type}`);

      // Executar cada agente
      for (const agent of agents) {
        await this.executeAgentForTrigger(agent, event);
      }

      return { success: true, executed: agents.length };
    } catch (error) {
      logger.error('Error processing trigger:', error);
      return { success: false, error: 'Failed to process trigger' };
    }
  }

  /**
   * Executar agente específico para um trigger
   */
  private static async executeAgentForTrigger(agent: any, event: TriggerEvent) {
    try {
      let task = '';
      let context: any = { trigger: event.type };

      // Construir tarefa baseada no tipo de trigger
      switch (event.type) {
        case 'payment_overdue':
          task = this.buildPaymentOverdueTask(event);
          context.data = event.data;
          break;

        case 'student_inactive':
          task = this.buildStudentInactiveTask(event);
          context.data = event.data;
          break;

        case 'new_lead_created':
          task = this.buildNewLeadTask(event);
          context.lead = event.data;
          break;

        case 'low_attendance':
          task = this.buildLowAttendanceTask(event);
          context.data = event.data;
          break;

        case 'course_ending':
          task = this.buildCourseEndingTask(event);
          context.course = event.data;
          break;

        default:
          task = `Trigger ${event.type} acionado. Analise a situação e tome ação apropriada.`;
      }

      logger.info(`Executing agent ${agent.name} for trigger ${event.type}`);

      // Executar agente
      const result = await AgentOrchestratorService.executeAgent(
        agent.id,
        task,
        context
      );

      if (result.success) {
        logger.info(`Agent ${agent.name} executed successfully`);
      } else {
        logger.error(`Agent ${agent.name} execution failed:`, result.error);
      }

      return result;
    } catch (error) {
      logger.error('Error executing agent for trigger:', error);
      return { success: false, error: 'Execution failed' };
    }
  }

  /**
   * Trigger: Payment Overdue
   * Detecta pagamentos atrasados e aciona agente financeiro
   */
  static async checkPaymentOverdue(organizationId: string, daysOverdue: number = 7) {
    try {
      logger.info(`Checking for payments overdue > ${daysOverdue} days`);

      // Buscar alunos com pagamentos atrasados usando DatabaseTool
      const result = await DatabaseTool.executeQuery(
        'overdue_payments',
        organizationId,
        { days: daysOverdue }
      );

      if (!result.success || !result.data || (result.data as any[]).length === 0) {
        logger.info('No overdue payments found');
        return { success: true, overdueCount: 0 };
      }

      const overdueStudents = result.data as any[];
      logger.info(`Found ${overdueStudents.length} students with overdue payments`);

      // Criar interação para dashboard
      await AgentInteractionService.create({
        organizationId,
        agentId: await this.getFinancialAgentId(organizationId),
        type: 'REPORT',
        message: `📊 Detectados ${overdueStudents.length} alunos com pagamentos atrasados há mais de ${daysOverdue} dias`,
        action: {
          label: 'Ver alunos',
          url: '#students?filter=payment-overdue',
        },
      });

      // Processar trigger
      return await this.processTrigger({
        type: 'payment_overdue',
        organizationId,
        data: { students: overdueStudents, daysOverdue },
      });
    } catch (error) {
      logger.error('Error checking payment overdue:', error);
      return { success: false, error: 'Failed to check overdue payments' };
    }
  }

  /**
   * Trigger: Student Inactive
   * Detecta alunos inativos e aciona agente de atendimento
   */
  static async checkStudentInactive(organizationId: string, daysInactive: number = 30) {
    try {
      logger.info(`Checking for students inactive > ${daysInactive} days`);

      const result = await DatabaseTool.executeQuery(
        'inactive_students',
        organizationId,
        { days: daysInactive }
      );

      if (!result.success || !result.data || result.data.length === 0) {
        logger.info('No inactive students found');
        return { success: true, inactiveCount: 0 };
      }

      const inactiveStudents = result.data;
      logger.info(`Found ${inactiveStudents.length} inactive students`);

      // Criar interação
      await AgentInteractionService.create({
        organizationId,
        agentId: await this.getSupportAgentId(organizationId),
        type: 'SUGGESTION',
        message: `💡 ${inactiveStudents.length} alunos sem check-in há mais de ${daysInactive} dias. Considere enviar mensagem de re-engajamento.`,
        action: {
          label: 'Ver alunos',
          url: '#students?filter=inactive',
        },
      });

      return await this.processTrigger({
        type: 'student_inactive',
        organizationId,
        data: { students: inactiveStudents, daysInactive },
      });
    } catch (error) {
      logger.error('Error checking inactive students:', error);
      return { success: false, error: 'Failed to check inactive students' };
    }
  }

  /**
   * Agendar verificações automáticas (cron)
   */
  static async scheduleAutomations(organizationId: string) {
    // TODO: Implementar com node-cron ou similar
    // Exemplo:
    // cron.schedule('0 9 * * *', () => {
    //   this.checkPaymentOverdue(organizationId);
    //   this.checkStudentInactive(organizationId);
    // });

    logger.info('Automation scheduling not yet implemented (requires cron library)');
    return { success: true, message: 'Manual triggers available' };
  }

  /**
   * Helper: Build task messages
   */
  private static buildPaymentOverdueTask(event: TriggerEvent): string {
    const count = event.data?.students?.length || 0;
    return `Detectei ${count} alunos com pagamentos atrasados. Analise a lista e sugira ações de cobrança apropriadas. Se necessário, solicite permissão para enviar SMS ou email.`;
  }

  private static buildStudentInactiveTask(event: TriggerEvent): string {
    const count = event.data?.students?.length || 0;
    return `Há ${count} alunos inativos sem check-in recente. Analise os motivos e sugira estratégias de re-engajamento.`;
  }

  private static buildNewLeadTask(event: TriggerEvent): string {
    const leadName = event.data?.name || 'novo lead';
    return `Um novo lead foi criado: ${leadName}. Faça o primeiro contato e tente agendar uma visita.`;
  }

  private static buildLowAttendanceTask(event: TriggerEvent): string {
    return `A taxa de frequência está abaixo do esperado. Analise os dados e sugira melhorias.`;
  }

  private static buildCourseEndingTask(event: TriggerEvent): string {
    const courseName = event.data?.name || 'um curso';
    return `O curso "${courseName}" está próximo do fim. Prepare relatório de progresso dos alunos.`;
  }

  /**
   * Helper: Get agent IDs by type
   */
  private static async getFinancialAgentId(organizationId: string): Promise<string> {
    const agent = await prisma.aIAgent.findFirst({
      where: { organizationId, type: 'FINANCIAL', isActive: true },
      select: { id: true },
    });
    return agent?.id || 'unknown-agent';
  }

  private static async getSupportAgentId(organizationId: string): Promise<string> {
    const agent = await prisma.aIAgent.findFirst({
      where: { organizationId, type: 'SUPPORT', isActive: true },
      select: { id: true },
    });
    return agent?.id || 'unknown-agent';
  }

  private static async getMarketingAgentId(organizationId: string): Promise<string> {
    const agent = await prisma.aIAgent.findFirst({
      where: { organizationId, type: 'MARKETING', isActive: true },
      select: { id: true },
    });
    return agent?.id || 'unknown-agent';
  }
}

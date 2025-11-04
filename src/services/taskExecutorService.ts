/**
 * 🤖 Task Executor Service
 * 
 * RESPONSABILIDADE:
 * - Executar tarefas aprovadas (AGENT, USER, SYSTEM)
 * - Implementar ações específicas por categoria
 * - Registrar logs de execução
 * - Gerenciar retry em caso de falha
 * 
 * INTEGRAÇÃO:
 * - WhatsApp Tool (envio de mensagens via Twilio)
 * - Database Tool (queries e updates seguros)
 * - Email Service (envio de emails via SendGrid)
 * - SMS Service (envio de SMS via Twilio)
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { twilioService } from '@/integrations/twilioService';
import { sendGridService } from '@/integrations/sendgridService';

interface ExecutionContext {
  taskId: string;
  executorType: 'AGENT' | 'USER' | 'SYSTEM';
  executorId?: string;
  userId?: string; // Para audit trail
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  metadata?: any;
}

export class TaskExecutorService {
  /**
   * Executar uma tarefa aprovada
   */
  async executeTask(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Buscar tarefa
      const task = await prisma.agentTask.findUnique({
        where: { id: context.taskId },
        include: {
          agent: true,
          organization: true
        }
      });

      if (!task) {
        throw new Error(`Task ${context.taskId} not found`);
      }

      // 2. Validar se pode executar
      if (task.approvalStatus !== 'APPROVED') {
        throw new Error(`Task ${context.taskId} is not approved (status: ${task.approvalStatus})`);
      }

      if (task.status === 'COMPLETED') {
        throw new Error(`Task ${context.taskId} is already completed`);
      }

      // 3. Criar registro de execução
      const execution = await prisma.taskExecution.create({
        data: {
          taskId: context.taskId,
          attemptNumber: task.retryCount + 1,
          executorType: context.executorType,
          executorId: context.executorId,
          status: 'STARTED',
          startedAt: new Date(),
          metadata: {
            userId: context.userId,
            category: task.category,
            actionType: task.actionType
          }
        }
      });

      // 4. Atualizar status da task
      await prisma.agentTask.update({
        where: { id: context.taskId },
        data: {
          status: 'IN_PROGRESS',
          retryCount: task.retryCount + 1,
          lastRetryAt: new Date()
        }
      });

      logger.info(`[TaskExecutor] Executing task ${context.taskId} (${task.category})`);

      // 5. Executar ação baseada na categoria
      let result: any;
      
      switch (task.category) {
        case 'WHATSAPP_MESSAGE':
          result = await this.executeWhatsAppMessage(task);
          break;
        
        case 'EMAIL':
          result = await this.executeEmail(task);
          break;
        
        case 'SMS':
          result = await this.executeSMS(task);
          break;
        
        case 'DATABASE_CHANGE':
          result = await this.executeDatabaseChange(task);
          break;
        
        case 'MARKETING':
          result = await this.executeMarketing(task);
          break;
        
        case 'BILLING':
          result = await this.executeBilling(task);
          break;
        
        case 'ENROLLMENT':
          result = await this.executeEnrollment(task);
          break;
        
        default:
          throw new Error(`Unsupported category: ${task.category}`);
      }

      // 6. Calcular duração
      const duration = Date.now() - startTime;

      // 7. Atualizar task como concluída
      await prisma.agentTask.update({
        where: { id: context.taskId },
        data: {
          status: 'COMPLETED',
          approvalStatus: 'EXECUTED',
          executedAt: new Date(),
          executionResult: result,
          errorMessage: null
        }
      });

      // 8. Atualizar registro de execução
      await prisma.taskExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          result
        }
      });

      logger.info(`[TaskExecutor] Task ${context.taskId} completed successfully (${duration}ms)`);

      return {
        success: true,
        result,
        duration,
        metadata: {
          executionId: execution.id,
          taskTitle: task.title
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[TaskExecutor] Error executing task ${context.taskId}:`, error);

      // Atualizar task com erro
      const task = await prisma.agentTask.findUnique({
        where: { id: context.taskId }
      });

      if (task) {
        const shouldRetry = task.retryCount < task.maxRetries;
        
        await prisma.agentTask.update({
          where: { id: context.taskId },
          data: {
            status: shouldRetry ? 'PENDING' : 'FAILED',
            approvalStatus: shouldRetry ? 'APPROVED' : 'FAILED',
            errorMessage: error.message,
            nextRetryAt: shouldRetry ? this.calculateNextRetry(task.retryCount + 1) : null
          }
        });

        // Atualizar execution log
        const execution = await prisma.taskExecution.findFirst({
          where: { taskId: context.taskId },
          orderBy: { startedAt: 'desc' }
        });

        if (execution) {
          await prisma.taskExecution.update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              duration,
              errorMessage: error.message,
              errorStack: error.stack
            }
          });
        }
      }

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Executar mensagem WhatsApp
   */
  private async executeWhatsAppMessage(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Sending WhatsApp to ${payload.phone}: ${payload.message}`);
    
    try {
      // Integração real com Twilio WhatsApp API
      if (twilioService.isReady()) {
        const result = await twilioService.sendWhatsApp({
          phone: payload.phone,
          message: payload.message,
          mediaUrl: payload.mediaUrl
        });

        if (result.status === 'failed') {
          throw new Error(result.errorMessage || 'WhatsApp send failed');
        }

        return {
          sent: true,
          messageId: result.messageId,
          status: result.status,
          phone: payload.phone,
          cost: result.cost,
          sentAt: result.sentAt
        };
      } else {
        // Modo simulado (sem credenciais)
        logger.warn('[TaskExecutor] Twilio not configured, using simulated mode');
        return twilioService.simulateSend('whatsapp', {
          phone: payload.phone,
          message: payload.message,
          mediaUrl: payload.mediaUrl
        });
      }
    } catch (error: any) {
      logger.error('[TaskExecutor] WhatsApp send failed:', error);
      throw new Error(`WhatsApp send failed: ${error.message}`);
    }
  }

  /**
   * Executar envio de email
   */
  private async executeEmail(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Sending email to ${payload.email}: ${payload.subject}`);
    
    try {
      // Integração real com SendGrid
      if (sendGridService.isReady()) {
        const result = await sendGridService.sendEmail({
          to: payload.email,
          subject: payload.subject,
          html: payload.html || payload.body,
          text: payload.text,
          replyTo: payload.replyTo,
          cc: payload.cc,
          bcc: payload.bcc,
          attachments: payload.attachments
        });

        if (result.status === 'failed') {
          throw new Error(result.errorMessage || 'Email send failed');
        }

        return {
          sent: true,
          messageId: result.messageId,
          status: result.status,
          email: payload.email,
          subject: payload.subject,
          sentAt: result.sentAt
        };
      } else {
        // Modo simulado (sem credenciais)
        logger.warn('[TaskExecutor] SendGrid not configured, using simulated mode');
        return sendGridService.simulateSend({
          to: payload.email,
          subject: payload.subject,
          html: payload.html || payload.body
        });
      }
    } catch (error: any) {
      logger.error('[TaskExecutor] Email send failed:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Executar envio de SMS
   */
  private async executeSMS(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Sending SMS to ${payload.phone}: ${payload.message}`);
    
    try {
      // Integração real com Twilio SMS
      if (twilioService.isReady()) {
        const result = await twilioService.sendSMS({
          phone: payload.phone,
          message: payload.message
        });

        if (result.status === 'failed') {
          throw new Error(result.errorMessage || 'SMS send failed');
        }

        return {
          sent: true,
          messageId: result.messageId,
          status: result.status,
          phone: payload.phone,
          cost: result.cost,
          sentAt: result.sentAt
        };
      } else {
        // Modo simulado (sem credenciais)
        logger.warn('[TaskExecutor] Twilio not configured, using simulated mode');
        return twilioService.simulateSend('sms', {
          phone: payload.phone,
          message: payload.message
        });
      }
    } catch (error: any) {
      logger.error('[TaskExecutor] SMS send failed:', error);
      throw new Error(`SMS send failed: ${error.message}`);
    }
  }

  /**
   * Executar mudança no banco de dados
   */
  private async executeDatabaseChange(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Executing database change: ${payload.operation} on ${payload.table}`);
    
    // IMPORTANTE: Validar query antes de executar
    // Apenas operações pré-aprovadas devem ser permitidas
    
    // TODO: Implementar execução segura de queries
    return {
      executed: true,
      operation: payload.operation,
      table: payload.table,
      rowsAffected: 0,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Executar ação de marketing
   */
  private async executeMarketing(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Executing marketing action: ${payload.action}`);
    
    // TODO: Implementar ações de marketing (campanhas, posts, etc)
    return {
      executed: true,
      action: payload.action,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Executar ação de cobrança
   */
  private async executeBilling(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Executing billing action: ${payload.action}`);
    
    // TODO: Integrar com sistema de cobrança (Asaas, Stripe, etc)
    return {
      executed: true,
      action: payload.action,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Executar matrícula/desmatrícula
   */
  private async executeEnrollment(task: any): Promise<any> {
    const payload = task.actionPayload as any;
    
    logger.info(`[TaskExecutor] Executing enrollment action: ${payload.action}`);
    
    // TODO: Implementar lógica de matrícula/desmatrícula
    return {
      executed: true,
      action: payload.action,
      studentId: payload.studentId,
      courseId: payload.courseId,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Calcular próxima tentativa (exponential backoff)
   */
  private calculateNextRetry(attemptNumber: number): Date {
    // Exponential backoff: 2^attempt minutos
    const minutesDelay = Math.pow(2, attemptNumber);
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + minutesDelay);
    return nextRetry;
  }

  /**
   * Buscar tarefas agendadas que devem ser executadas agora
   */
  async getScheduledTasks(organizationId: string): Promise<any[]> {
    const now = new Date();
    
    return prisma.agentTask.findMany({
      where: {
        organizationId,
        approvalStatus: 'APPROVED',
        status: 'PENDING',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        agent: true
      },
      orderBy: {
        priority: 'desc'
      }
    });
  }

  /**
   * Buscar tarefas com retry pendente
   */
  async getRetryPendingTasks(organizationId: string): Promise<any[]> {
    const now = new Date();
    
    return prisma.agentTask.findMany({
      where: {
        organizationId,
        approvalStatus: 'APPROVED',
        status: 'PENDING',
        nextRetryAt: {
          lte: now
        },
        retryCount: {
          lt: prisma.agentTask.fields.maxRetries
        }
      },
      include: {
        agent: true
      },
      orderBy: {
        priority: 'desc'
      }
    });
  }

  /**
   * Cancelar execução de uma tarefa
   */
  async cancelTask(taskId: string, reason: string): Promise<void> {
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
        errorMessage: `Cancelled: ${reason}`,
        updatedAt: new Date()
      }
    });
    
    logger.info(`[TaskExecutor] Task ${taskId} cancelled: ${reason}`);
  }
}

export const taskExecutorService = new TaskExecutorService();

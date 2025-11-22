/**
 * 🎭 Task Orchestrator Service
 * 
 * RESPONSABILIDADE:
 * - Gerenciar fila de execução de tarefas
 * - Coordenar TaskExecutorService e TaskSchedulerService
 * - Processar tarefas aprovadas automaticamente
 * - Gerenciar prioridades e concorrência
 * 
 * PADRÃO: Worker queue com processamento assíncrono
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { taskExecutorService } from './taskExecutorService';
import { taskSchedulerService } from './taskSchedulerService';

interface OrchestratorStats {
  pendingTasks: number;
  inProgressTasks: number;
  completedTasksToday: number;
  failedTasksToday: number;
  scheduledTasks: number;
  recurringTasks: number;
}

export class TaskOrchestratorService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly MAX_CONCURRENT = 3; // Máximo de tarefas simultâneas

  /**
   * Iniciar orquestrador (chamado no server.ts)
   */
  async start(): Promise<void> {
    logger.info('[TaskOrchestrator] Starting orchestrator...');

    // Inicializar scheduler
    await taskSchedulerService.initialize();

    // Processar fila a cada 30 segundos
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 30000);

    // Primeira execução imediata
    await this.processQueue();

    logger.info('[TaskOrchestrator] Orchestrator started');
  }

  /**
   * Parar orquestrador
   */
  stop(): void {
    logger.info('[TaskOrchestrator] Stopping orchestrator...');
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    taskSchedulerService.shutdown();
    
    logger.info('[TaskOrchestrator] Orchestrator stopped');
  }

  /**
   * Processar fila de tarefas
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      logger.debug('[TaskOrchestrator] Already processing queue, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // 1. Verificar tarefas em progresso
      const inProgress = await this.getInProgressCount();
      
      if (inProgress >= this.MAX_CONCURRENT) {
        logger.debug(`[TaskOrchestrator] Max concurrent tasks reached (${inProgress}/${this.MAX_CONCURRENT})`);
        return;
      }

      // 2. Buscar tarefas prontas para execução
      const availableSlots = this.MAX_CONCURRENT - inProgress;
      const tasks = await this.getReadyTasks(availableSlots);

      if (tasks.length === 0) {
        logger.debug('[TaskOrchestrator] No tasks ready for execution');
        return;
      }

      logger.info(`[TaskOrchestrator] Processing ${tasks.length} tasks (${inProgress} in progress, ${availableSlots} slots available)`);

      // 3. Executar tarefas em paralelo
      const promises = tasks.map(task => this.executeTaskSafely(task));
      await Promise.allSettled(promises);

    } catch (error: any) {
      logger.error('[TaskOrchestrator] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Executar tarefa com tratamento de erros
   */
  private async executeTaskSafely(task: any): Promise<void> {
    try {
      logger.info(`[TaskOrchestrator] Executing task ${task.id}: ${task.title}`);

      const result = await taskExecutorService.executeTask({
        taskId: task.id,
        executorType: task.executorType || 'AGENT',
        executorId: task.executorId || task.agentId
      });

      if (result.success) {
        logger.info(`[TaskOrchestrator] Task ${task.id} completed successfully`);
      } else {
        logger.warn(`[TaskOrchestrator] Task ${task.id} failed: ${result.error}`);
      }

    } catch (error: any) {
      logger.error(`[TaskOrchestrator] Error executing task ${task.id}:`, error);
    }
  }

  /**
   * Buscar tarefas prontas para execução
   */
  private async getReadyTasks(limit: number): Promise<any[]> {
    const now = new Date();

    return prisma.agentTask.findMany({
      where: {
        approvalStatus: 'APPROVED',
        status: 'PENDING',
        OR: [
          // Tarefas sem agendamento (executar imediatamente)
          { scheduledFor: null },
          // Tarefas agendadas cujo horário já passou
          { scheduledFor: { lte: now } },
          // Tarefas com retry pendente
          {
            AND: [
              { nextRetryAt: { lte: now } },
              { retryCount: { lt: prisma.agentTask.fields.maxRetries } }
            ]
          }
        ]
      },
      include: {
        agent: true,
        organization: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit
    });
  }

  /**
   * Contar tarefas em progresso
   */
  private async getInProgressCount(): Promise<number> {
    return prisma.agentTask.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });
  }

  /**
   * Processar tarefa específica manualmente
   */
  async executeTaskNow(taskId: string, userId?: string): Promise<void> {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId },
      include: { agent: true }
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.approvalStatus !== 'APPROVED') {
      throw new Error(`Task ${taskId} is not approved`);
    }

    logger.info(`[TaskOrchestrator] Manual execution requested for task ${taskId} by user ${userId}`);

    await this.executeTaskSafely(task);
  }

  /**
   * Aprovar e executar tarefa
   */
  async approveAndExecute(taskId: string, userId: string): Promise<void> {
    // 1. Aprovar tarefa
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date()
      }
    });

    logger.info(`[TaskOrchestrator] Task ${taskId} approved by ${userId}`);

    // 2. Se autoExecute = true, executar imediatamente
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId }
    });

    if (task?.autoExecute) {
      await this.executeTaskNow(taskId, userId);
    }
  }

  /**
   * Agendar tarefa aprovada
   */
  async scheduleApprovedTask(
    taskId: string,
    scheduledFor: Date,
    recurrenceRule?: string
  ): Promise<void> {
    const task = await prisma.agentTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.approvalStatus !== 'APPROVED') {
      throw new Error(`Task ${taskId} must be approved before scheduling`);
    }

    await taskSchedulerService.scheduleTask({
      taskId,
      scheduledFor,
      recurrenceRule
    });

    logger.info(`[TaskOrchestrator] Task ${taskId} scheduled for ${scheduledFor.toISOString()}`);
  }

  /**
   * Obter estatísticas do orquestrador
   */
  async getStats(organizationId: string): Promise<OrchestratorStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
      failedTasksToday,
      scheduledTasks,
      recurringTasks
    ] = await Promise.all([
      prisma.agentTask.count({
        where: { organizationId, status: 'PENDING' }
      }),
      prisma.agentTask.count({
        where: { organizationId, status: 'IN_PROGRESS' }
      }),
      prisma.agentTask.count({
        where: {
          organizationId,
          status: 'COMPLETED',
          executedAt: { gte: today }
        }
      }),
      prisma.agentTask.count({
        where: {
          organizationId,
          status: 'FAILED',
          updatedAt: { gte: today }
        }
      }),
      prisma.agentTask.count({
        where: {
          organizationId,
          scheduledFor: { not: null },
          status: 'PENDING'
        }
      }),
      prisma.agentTask.count({
        where: {
          organizationId,
          recurrenceRule: { not: null },
          status: { not: 'CANCELLED' }
        }
      })
    ]);

    return {
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
      failedTasksToday,
      scheduledTasks,
      recurringTasks
    };
  }

  /**
   * Obter log de execuções de uma tarefa
   */
  async getTaskExecutionLog(taskId: string): Promise<any[]> {
    return prisma.taskExecution.findMany({
      where: { taskId },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });
  }

  /**
   * Cancelar todas as tarefas pendentes de um agente
   */
  async cancelAgentTasks(agentId: string, reason: string): Promise<number> {
    const result = await prisma.agentTask.updateMany({
      where: {
        agentId,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      data: {
        status: 'CANCELLED',
        errorMessage: `Cancelled: ${reason}`,
        updatedAt: new Date()
      }
    });

    logger.info(`[TaskOrchestrator] Cancelled ${result.count} tasks for agent ${agentId}`);
    return result.count;
  }

  /**
   * Limpar tarefas antigas (mais de 30 dias completadas/falhadas)
   */
  async cleanupOldTasks(organizationId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.agentTask.deleteMany({
      where: {
        organizationId,
        status: {
          in: ['COMPLETED', 'FAILED', 'CANCELLED']
        },
        updatedAt: {
          lt: cutoffDate
        }
      }
    });

    logger.info(`[TaskOrchestrator] Cleaned up ${result.count} old tasks for organization ${organizationId}`);
    return result.count;
  }
}

export const taskOrchestratorService = new TaskOrchestratorService();

/**
 * 📅 Task Scheduler Service
 * 
 * RESPONSABILIDADE:
 * - Agendar tarefas para execução futura
 * - Gerenciar tarefas recorrentes (cron-like)
 * - Processar regras de recorrência
 * - Criar instâncias de tarefas recorrentes
 * 
 * INTEGRAÇÃO:
 * - node-cron (para scheduling)
 * - TaskExecutorService (para execução)
 */

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import cron, { ScheduledTask } from 'node-cron';

interface ScheduleTaskInput {
  taskId: string;
  scheduledFor: Date;
  recurrenceRule?: string; // Cron format: "0 9 * * 1" = Every Monday at 9am
}

interface RecurringTaskConfig {
  organizationId: string;
  agentId: string;
  title: string;
  description: string;
  category: string;
  actionPayload: any;
  recurrenceRule: string;
  priority?: string;
  executorType?: string;
}

export class TaskSchedulerService {
  private scheduledJobs: Map<string, ScheduledTask> = new Map();

  /**
   * Agendar tarefa para execução futura
   */
  async scheduleTask(input: ScheduleTaskInput): Promise<void> {
    const task = await prisma.agentTask.update({
      where: { id: input.taskId },
      data: {
        scheduledFor: input.scheduledFor,
        recurrenceRule: input.recurrenceRule,
        status: 'PENDING',
        updatedAt: new Date()
      }
    });

    logger.info(`[TaskScheduler] Task ${input.taskId} scheduled for ${input.scheduledFor.toISOString()}`);

    // Se tem regra de recorrência, configurar cron job
    if (input.recurrenceRule) {
      this.setupRecurringTask(task);
    }
  }

  /**
   * Configurar tarefa recorrente (cron job)
   */
  private setupRecurringTask(task: any): void {
    const cronExpression = task.recurrenceRule;

    // Validar expressão cron
    if (!cron.validate(cronExpression)) {
      logger.error(`[TaskScheduler] Invalid cron expression: ${cronExpression}`);
      return;
    }

    // Se já existe job para esta tarefa, cancelar
    if (this.scheduledJobs.has(task.id)) {
      this.scheduledJobs.get(task.id)?.stop();
      this.scheduledJobs.delete(task.id);
    }

    // Criar novo cron job
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`[TaskScheduler] Executing recurring task ${task.id}: ${task.title}`);
      
      try {
        // Criar nova instância da tarefa
        await this.createRecurringTaskInstance(task);
      } catch (error: any) {
        logger.error(`[TaskScheduler] Error creating recurring task instance:`, error);
      }
    });

    this.scheduledJobs.set(task.id, job);
    logger.info(`[TaskScheduler] Recurring task ${task.id} configured with cron: ${cronExpression}`);
  }

  /**
   * Criar nova instância de tarefa recorrente
   */
  private async createRecurringTaskInstance(originalTask: any): Promise<void> {
    const newTask = await prisma.agentTask.create({
      data: {
        organizationId: originalTask.organizationId,
        agentId: originalTask.agentId,
        createdByUserId: originalTask.createdByUserId,
        title: `[RECORRENTE] ${originalTask.title}`,
        description: originalTask.description,
        category: originalTask.category,
        actionType: originalTask.actionType,
        targetEntity: originalTask.targetEntity,
        actionPayload: originalTask.actionPayload,
        reasoning: originalTask.reasoning,
        requiresApproval: originalTask.requiresApproval,
        autoExecute: originalTask.autoExecute,
        automationLevel: originalTask.automationLevel,
        approvalStatus: originalTask.autoExecute ? 'APPROVED' : 'PENDING',
        status: 'PENDING',
        priority: originalTask.priority,
        executorType: originalTask.executorType,
        executorId: originalTask.executorId,
        maxRetries: originalTask.maxRetries,
        metadata: {
          ...originalTask.metadata,
          recurringTaskId: originalTask.id,
          createdByScheduler: true,
          instanceCreatedAt: new Date().toISOString()
        }
      }
    });

    logger.info(`[TaskScheduler] Created recurring task instance: ${newTask.id} from ${originalTask.id}`);
  }

  /**
   * Criar tarefa recorrente (configuração inicial)
   */
  async createRecurringTask(config: RecurringTaskConfig): Promise<any> {
    // Validar cron expression
    if (!cron.validate(config.recurrenceRule)) {
      throw new Error(`Invalid cron expression: ${config.recurrenceRule}`);
    }

    const task = await prisma.agentTask.create({
      data: {
        organizationId: config.organizationId,
        agentId: config.agentId,
        title: config.title,
        description: config.description,
        category: config.category,
        actionType: 'RECURRING',
        actionPayload: config.actionPayload,
        recurrenceRule: config.recurrenceRule,
        requiresApproval: false, // Tarefas recorrentes são pré-aprovadas
        autoExecute: true,
        automationLevel: 'AUTO_LOW_RISK',
        approvalStatus: 'APPROVED',
        status: 'PENDING',
        priority: config.priority || 'MEDIUM',
        executorType: config.executorType || 'AGENT',
        executorId: config.agentId,
        metadata: {
          isRecurringTemplate: true,
          createdAt: new Date().toISOString()
        }
      }
    });

    // Configurar cron job
    this.setupRecurringTask(task);

    logger.info(`[TaskScheduler] Recurring task created: ${task.id} with cron: ${config.recurrenceRule}`);
    return task;
  }

  /**
   * Remover tarefa recorrente
   */
  async removeRecurringTask(taskId: string): Promise<void> {
    // Parar cron job
    if (this.scheduledJobs.has(taskId)) {
      this.scheduledJobs.get(taskId)?.stop();
      this.scheduledJobs.delete(taskId);
      logger.info(`[TaskScheduler] Stopped recurring task: ${taskId}`);
    }

    // Marcar como cancelada
    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });
  }

  /**
   * Reagendar tarefa falhada
   */
  async rescheduleFailedTask(taskId: string, delayMinutes: number = 15): Promise<void> {
    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);

    await prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'PENDING',
        scheduledFor,
        nextRetryAt: scheduledFor,
        updatedAt: new Date()
      }
    });

    logger.info(`[TaskScheduler] Task ${taskId} rescheduled for ${scheduledFor.toISOString()}`);
  }

  /**
   * Listar tarefas agendadas de uma organização
   */
  async listScheduledTasks(organizationId: string): Promise<any[]> {
    return prisma.agentTask.findMany({
      where: {
        organizationId,
        scheduledFor: {
          not: null
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      },
      include: {
        agent: true
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });
  }

  /**
   * Listar tarefas recorrentes ativas
   */
  async listRecurringTasks(organizationId: string): Promise<any[]> {
    return prisma.agentTask.findMany({
      where: {
        organizationId,
        recurrenceRule: {
          not: null
        },
        status: {
          not: 'CANCELLED'
        }
      },
      include: {
        agent: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Processar tarefas agendadas (chamado periodicamente)
   */
  async processPendingScheduledTasks(): Promise<void> {
    const now = new Date();
    
    try {
      // Timeout de 15s para evitar conexões travadas
      const tasks = await prisma.$transaction(async (tx) => {
        return await tx.agentTask.findMany({
          where: {
            scheduledFor: {
              lte: now
            },
            status: 'PENDING',
            approvalStatus: 'APPROVED'
          },
          include: {
            agent: true
          },
          take: 50 // Limitar para evitar sobrecarga
        });
      }, {
        timeout: 15000 // 15 segundos
      });

      if (tasks.length === 0) {
        return; // Sem tarefas, liberar conexão rapidamente
      }

      for (const task of tasks) {
        try {
          logger.info(`[TaskScheduler] Processing scheduled task: ${task.id}`);
          
          // Marcar como pronta para execução (com timeout)
          await prisma.$transaction(async (tx) => {
            await tx.agentTask.update({
              where: { id: task.id },
              data: {
                scheduledFor: null, // Limpar agendamento após processar
                updatedAt: new Date()
              }
            });
          }, {
            timeout: 10000 // 10 segundos por task
          });
        } catch (error) {
          logger.error(`[TaskScheduler] Error processing task ${task.id}:`, error);
          // Continuar processando outras tasks
        }
      }

      logger.info(`[TaskScheduler] Processed ${tasks.length} scheduled tasks`);
    } catch (error) {
      logger.error('[TaskScheduler] Error in processPendingScheduledTasks:', error);
      // Não propagar erro - deixar o cron job continuar
    }
  }

  /**
   * Inicializar scheduler (chamado no server.ts)
   */
  async initialize(): Promise<void> {
    logger.info('[TaskScheduler] Initializing scheduler...');

    // Carregar tarefas recorrentes existentes
    const recurringTasks = await prisma.agentTask.findMany({
      where: {
        recurrenceRule: {
          not: null
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    for (const task of recurringTasks) {
      this.setupRecurringTask(task);
    }

    // Configurar processamento periódico de tarefas agendadas
    cron.schedule('*/5 * * * *', async () => {
      // A cada 5 minutos, processar tarefas agendadas
      await this.processPendingScheduledTasks();
    });

    logger.info(`[TaskScheduler] Initialized with ${recurringTasks.length} recurring tasks`);
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    logger.info('[TaskScheduler] Shutting down...');
    
    for (const [taskId, job] of this.scheduledJobs.entries()) {
      job.stop();
      logger.info(`[TaskScheduler] Stopped job for task ${taskId}`);
    }
    
    this.scheduledJobs.clear();
  }

  /**
   * Utilitário: Parsear cron em texto legível
   */
  parseCronToHuman(cronExpression: string): string {
    // Implementação simples - pode ser expandida
    const parts = cronExpression.split(' ');
    
    if (parts.length !== 5) {
      return 'Invalid cron expression';
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Exemplos simples
    if (cronExpression === '0 9 * * 1') return 'Every Monday at 9:00 AM';
    if (cronExpression === '0 8 * * *') return 'Every day at 8:00 AM';
    if (cronExpression === '0 0 1 * *') return 'First day of every month at midnight';
    
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }
}

export const taskSchedulerService = new TaskSchedulerService();

import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import type { AgentTask, Prisma } from '@prisma/client';

export class AgentTaskService {
  /**
   * Criar nova task (via agente ou usuário)
   */
  async createTask(data: {
    organizationId: string;
    agentId?: string;
    createdByUserId?: string;
    assignedToUserId?: string;
    title: string;
    description: string;
    category: string;
    actionType: string;
    targetEntity?: string;
    actionPayload: any;
    reasoning?: any;
    requiresApproval?: boolean;
    autoExecute?: boolean;
    automationLevel?: string;
    priority?: string;
    dueDate?: Date;
  }): Promise<AgentTask> {
    try {
      const task = await prisma.agentTask.create({
        data: {
          organizationId: data.organizationId,
          agentId: data.agentId,
          createdByUserId: data.createdByUserId,
          assignedToUserId: data.assignedToUserId,
          title: data.title,
          description: data.description,
          category: data.category,
          actionType: data.actionType,
          targetEntity: data.targetEntity,
          actionPayload: data.actionPayload,
          reasoning: data.reasoning,
          requiresApproval: data.requiresApproval ?? true,
          autoExecute: data.autoExecute ?? false,
          automationLevel: data.automationLevel ?? 'MANUAL',
          priority: data.priority ?? 'MEDIUM',
          dueDate: data.dueDate,
          approvalStatus: 'PENDING',
          status: 'PENDING',
        },
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      logger.info(`[AgentTaskService] Task created: ${task.id} - ${task.title}`);
      return task;
    } catch (error) {
      logger.error('[AgentTaskService] Error creating task:', error);
      throw error;
    }
  }

  /**
   * Listar tasks com filtros
   */
  async listTasks(filters: {
    organizationId: string;
    agentId?: string;
    approvalStatus?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedToUserId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: AgentTask[]; total: number }> {
    try {
      const where: Prisma.AgentTaskWhereInput = {
        organizationId: filters.organizationId,
      };

      if (filters.agentId) where.agentId = filters.agentId;
      if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.category) where.category = filters.category;
      if (filters.assignedToUserId) where.assignedToUserId = filters.assignedToUserId;

      const [tasks, total] = await Promise.all([
        prisma.agentTask.findMany({
          where,
          include: {
            agent: { select: { id: true, name: true, specialization: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' },
          ],
          take: filters.limit ?? 50,
          skip: filters.offset ?? 0,
        }),
        prisma.agentTask.count({ where }),
      ]);

      return { tasks, total };
    } catch (error) {
      logger.error('[AgentTaskService] Error listing tasks:', error);
      throw error;
    }
  }

  /**
   * Buscar task por ID
   */
  async getTaskById(taskId: string, organizationId: string): Promise<AgentTask | null> {
    try {
      return await prisma.agentTask.findFirst({
        where: { id: taskId, organizationId },
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          approver: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    } catch (error) {
      logger.error('[AgentTaskService] Error getting task:', error);
      throw error;
    }
  }

  /**
   * Aprovar task
   */
  async approveTask(taskId: string, organizationId: string, userId: string | null): Promise<AgentTask> {
    try {
      // Preparar dados de update (não incluir approvedBy se userId é null)
      const updateData: any = {
        approvalStatus: 'APPROVED',
        status: 'IN_PROGRESS',
        approvedAt: new Date(),
      };
      
      // Só incluir approvedBy se userId for fornecido (evita FK constraint violation)
      if (userId) {
        updateData.approvedBy = userId;
      }

      const task = await prisma.agentTask.update({
        where: { id: taskId, organizationId },
        data: updateData,
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          approver: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      logger.info(`[AgentTaskService] Task approved: ${taskId} by user ${userId}`);

      // Se autoExecute = true, executar imediatamente
      if (task.autoExecute) {
        await this.executeTask(taskId, organizationId);
      }

      return task;
    } catch (error) {
      logger.error('[AgentTaskService] Error approving task:', error);
      throw error;
    }
  }

  /**
   * Rejeitar task
   */
  async rejectTask(taskId: string, organizationId: string, userId: string | null, reason: string): Promise<AgentTask> {
    try {
      // Preparar dados de update (não incluir approvedBy se userId é null)
      const updateData: any = {
        approvalStatus: 'REJECTED',
        status: 'CANCELLED',
        approvedAt: new Date(),
        rejectedReason: reason,
      };
      
      // Só incluir approvedBy se userId for fornecido (evita FK constraint violation)
      if (userId) {
        updateData.approvedBy = userId;
      }

      const task = await prisma.agentTask.update({
        where: { id: taskId, organizationId },
        data: updateData,
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      logger.info(`[AgentTaskService] Task rejected: ${taskId} by user ${userId}`);
      return task;
    } catch (error) {
      logger.error('[AgentTaskService] Error rejecting task:', error);
      throw error;
    }
  }

  /**
   * Cancelar execução de task em progresso
   */
  async cancelTask(taskId: string, organizationId: string, userId: string | null, reason: string): Promise<AgentTask> {
    try {
      const task = await prisma.agentTask.findFirst({
        where: { id: taskId, organizationId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.status !== 'IN_PROGRESS') {
        throw new Error('Only tasks in progress can be cancelled');
      }

      // Atualizar task para cancelada
      const updatedTask = await prisma.agentTask.update({
        where: { id: taskId, organizationId },
        data: {
          status: 'CANCELLED',
          rejectedReason: reason, // Usar campo existente para motivo do cancelamento
          executionResult: {
            cancelled: true,
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            reason: reason,
          },
        },
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      logger.info(`[AgentTaskService] Task cancelled: ${taskId} by user ${userId}`);
      return updatedTask;
    } catch (error) {
      logger.error('[AgentTaskService] Error cancelling task:', error);
      throw error;
    }
  }

  /**
   * Executar task (após aprovação ou automática)
   */
  async executeTask(taskId: string, organizationId: string): Promise<AgentTask> {
    try {
      const task = await prisma.agentTask.findFirst({
        where: { id: taskId, organizationId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      if (task.requiresApproval && task.approvalStatus !== 'APPROVED') {
        throw new Error('Task requires approval before execution');
      }

      // TODO: Implementar lógica de execução baseada no actionType
      // Por enquanto, apenas marcar como executada
      const executionResult = {
        success: true,
        executedAt: new Date().toISOString(),
        message: 'Task execution simulated (implementation pending)',
      };

      const updatedTask = await prisma.agentTask.update({
        where: { id: taskId },
        data: {
          approvalStatus: 'EXECUTED',
          status: 'COMPLETED',
          executedAt: new Date(),
          executionResult,
        },
        include: {
          agent: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      logger.info(`[AgentTaskService] Task executed: ${taskId}`);
      return updatedTask;
    } catch (error) {
      logger.error('[AgentTaskService] Error executing task:', error);

      // Marcar task como FAILED
      await prisma.agentTask.update({
        where: { id: taskId },
        data: {
          approvalStatus: 'FAILED',
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Deletar task
   */
  async deleteTask(taskId: string, organizationId: string): Promise<void> {
    try {
      await prisma.agentTask.delete({
        where: { id: taskId, organizationId },
      });

      logger.info(`[AgentTaskService] Task deleted: ${taskId}`);
    } catch (error) {
      logger.error('[AgentTaskService] Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Contar tasks pendentes por organização
   */
  async countPendingTasks(organizationId: string): Promise<number> {
    try {
      return await prisma.agentTask.count({
        where: {
          organizationId,
          approvalStatus: 'PENDING',
          status: 'PENDING',
        },
      });
    } catch (error) {
      logger.error('[AgentTaskService] Error counting pending tasks:', error);
      throw error;
    }
  }

  /**
   * Estatísticas de tasks
   */
  async getTaskStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    executed: number;
    failed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    try {
      const [total, pending, approved, rejected, executed, failed, allTasks] = await Promise.all([
        prisma.agentTask.count({ where: { organizationId } }),
        prisma.agentTask.count({ where: { organizationId, approvalStatus: 'PENDING' } }),
        prisma.agentTask.count({ where: { organizationId, approvalStatus: 'APPROVED' } }),
        prisma.agentTask.count({ where: { organizationId, approvalStatus: 'REJECTED' } }),
        prisma.agentTask.count({ where: { organizationId, approvalStatus: 'EXECUTED' } }),
        prisma.agentTask.count({ where: { organizationId, approvalStatus: 'FAILED' } }),
        prisma.agentTask.findMany({ where: { organizationId }, select: { category: true, priority: true } }),
      ]);

      const byCategory: Record<string, number> = {};
      const byPriority: Record<string, number> = {};

      allTasks.forEach(task => {
        byCategory[task.category] = (byCategory[task.category] || 0) + 1;
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      });

      return {
        total,
        pending,
        approved,
        rejected,
        executed,
        failed,
        byCategory,
        byPriority,
      };
    } catch (error) {
      logger.error('[AgentTaskService] Error getting task stats:', error);
      throw error;
    }
  }
}

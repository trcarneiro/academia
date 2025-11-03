import type { FastifyRequest, FastifyReply } from 'fastify';
import { AgentTaskService } from '@/services/agentTaskService';
import { logger } from '@/utils/logger';

const taskService = new AgentTaskService();

export class AgentTaskController {
  /**
   * POST /api/agent-tasks - Criar nova task
   */
  async createTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const body = request.body as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const task = await taskService.createTask({
        organizationId,
        agentId: body.agentId,
        createdByUserId: body.createdByUserId,
        assignedToUserId: body.assignedToUserId,
        title: body.title,
        description: body.description,
        category: body.category,
        actionType: body.actionType,
        targetEntity: body.targetEntity,
        actionPayload: body.actionPayload,
        reasoning: body.reasoning,
        requiresApproval: body.requiresApproval,
        autoExecute: body.autoExecute,
        automationLevel: body.automationLevel,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      });

      return reply.code(201).send({
        success: true,
        data: task,
        message: 'Task created successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error creating task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks - Listar tasks com filtros
   */
  async listTasks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const query = request.query as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const { tasks, total } = await taskService.listTasks({
        organizationId,
        agentId: query.agentId,
        approvalStatus: query.approvalStatus,
        status: query.status,
        priority: query.priority,
        category: query.category,
        assignedToUserId: query.assignedToUserId,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      });

      return reply.send({
        success: true,
        data: tasks,
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error listing tasks:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to list tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/:id - Buscar task por ID
   */
  async getTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const task = await taskService.getTaskById(id, organizationId);

      if (!task) {
        return reply.code(404).send({
          success: false,
          message: 'Task not found',
        });
      }

      return reply.send({
        success: true,
        data: task,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error getting task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/agent-tasks/:id/approve - Aprovar task
   */
  async approveTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      // ⚠️ TEMPORÁRIO: userId opcional para testes (deve vir do auth depois)
      const userId = body.userId || null;

      const task = await taskService.approveTask(id, organizationId, userId);

      return reply.send({
        success: true,
        data: task,
        message: 'Task approved successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error approving task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to approve task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/agent-tasks/:id/reject - Rejeitar task
   */
  async rejectTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      // ⚠️ TEMPORÁRIO: userId opcional para testes (deve vir do auth depois)
      const userId = body.userId || null;

      if (!body.reason) {
        return reply.code(400).send({
          success: false,
          message: 'Rejection reason is required',
        });
      }

      const task = await taskService.rejectTask(id, organizationId, userId, body.reason);

      return reply.send({
        success: true,
        data: task,
        message: 'Task rejected successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error rejecting task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to reject task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/agent-tasks/:id/cancel - Cancelar execução de task
   */
  async cancelTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const userId = (request.headers['x-user-id'] as string) || body.userId || null;
      const reason = body.reason || 'Cancelled by user';

      const task = await taskService.cancelTask(id, organizationId, userId, reason);

      return reply.send({
        success: true,
        data: task,
        message: 'Task cancelled successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error cancelling task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to cancel task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/agent-tasks/:id/execute - Executar task manualmente
   */
  async executeTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const task = await taskService.executeTask(id, organizationId);

      return reply.send({
        success: true,
        data: task,
        message: 'Task executed successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error executing task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to execute task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/agent-tasks/:id - Deletar task
   */
  async deleteTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      await taskService.deleteTask(id, organizationId);

      return reply.send({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error deleting task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to delete task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/stats - Estatísticas de tasks
   */
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const stats = await taskService.getTaskStats(organizationId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error getting stats:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/pending/count - Contar tasks pendentes
   */
  async countPending(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const count = await taskService.countPendingTasks(organizationId);

      return reply.send({
        success: true,
        data: { count },
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error counting pending tasks:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to count pending tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/agent-tasks/:id/execute - Executar tarefa agora
   */
  async executeTaskNow(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = request.headers['x-user-id'] as string;
      
      const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
      
      await taskOrchestratorService.executeTaskNow(id, userId);

      return reply.send({
        success: true,
        message: 'Task execution started',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error executing task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to execute task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/agent-tasks/:id/execute-mcp - Executar tarefa via MCP (AI-mediated execution)
   */
  async executeTaskViaMCP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required'
        });
      }
      
      const userId = (request.headers['x-user-id'] as string) || body.userId || null;
      
      // Get agentId: use from body if provided, otherwise use task's agentId
      const task = await taskService.getTaskById(id, organizationId);
      if (!task) {
        return reply.code(404).send({
          success: false,
          message: 'Task not found'
        });
      }
      
      const agentId = body.agentId || task.agentId;
      if (!agentId) {
        return reply.code(400).send({
          success: false,
          message: 'Agent ID is required (either in body or task must have agentId)'
        });
      }
      
      // Execute via MCP
      const { MCPTaskExecutor } = await import('@/services/mcpTaskExecutor');
      const executor = new MCPTaskExecutor();
      const result = await executor.executeTask({
        taskId: id,
        agentId: agentId,
        userId: userId,
        conversationMode: body.conversationMode || false
      });
      
      if (result.success) {
        return reply.send({
          success: true,
          data: {
            interactionId: result.interactionId,
            agentResponse: result.agentResponse,
            toolsUsed: result.toolsUsed,
            result: result.result,
            reasoning: result.reasoning,
            duration: result.duration,
            requiresApproval: result.requiresApproval
          },
          message: 'Task executed via MCP successfully'
        });
      } else {
        return reply.code(500).send({
          success: false,
          message: 'Task execution via MCP failed',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('[AgentTaskController] Error executing task via MCP:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to execute task via MCP',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/agent-tasks/:id/schedule - Agendar tarefa
   */
  async scheduleTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
      
      await taskOrchestratorService.scheduleApprovedTask(
        id,
        new Date(body.scheduledFor),
        body.recurrenceRule
      );

      return reply.send({
        success: true,
        message: 'Task scheduled successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error scheduling task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to schedule task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/:id/executions - Obter log de execuções
   */
  async getTaskExecutions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
      
      const executions = await taskOrchestratorService.getTaskExecutionLog(id);

      return reply.send({
        success: true,
        data: executions,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error getting task executions:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get task executions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/orchestrator/stats - Estatísticas do orquestrador
   */
  async getOrchestratorStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }
      
      const { taskOrchestratorService } = await import('@/services/taskOrchestratorService');
      
      const stats = await taskOrchestratorService.getStats(organizationId);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error getting orchestrator stats:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to get orchestrator stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/agent-tasks/recurring - Criar tarefa recorrente
   */
  async createRecurringTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;
      const body = request.body as any;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }
      
      const { taskSchedulerService } = await import('@/services/taskSchedulerService');
      
      const task = await taskSchedulerService.createRecurringTask({
        organizationId,
        agentId: body.agentId,
        title: body.title,
        description: body.description,
        category: body.category,
        actionPayload: body.actionPayload,
        recurrenceRule: body.recurrenceRule,
        priority: body.priority,
        executorType: body.executorType,
      });

      return reply.code(201).send({
        success: true,
        data: task,
        message: 'Recurring task created successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error creating recurring task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to create recurring task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/agent-tasks/:id/schedule - Agendar task para execução futura com cron
   * Body: { recurrenceRule: '0 8 * * *' } (cron expression)
   */
  async scheduleTaskRecurring(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const { taskSchedulerService } = await import('@/services/taskSchedulerService');

      await taskSchedulerService.scheduleTask({
        taskId: id,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : new Date(),
        recurrenceRule: body.recurrenceRule
      });

      return reply.code(200).send({
        success: true,
        message: `Task scheduled successfully with cron: ${body.recurrenceRule}`,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error scheduling task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to schedule task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/agent-tasks/:id/schedule/recurring - Cancelar agendamento recorrente
   */
  async unscheduleRecurringTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const { taskSchedulerService } = await import('@/services/taskSchedulerService');

      await taskSchedulerService.removeRecurringTask(id);

      return reply.code(200).send({
        success: true,
        message: 'Recurring task unscheduled successfully',
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error unscheduling recurring task:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to unscheduled recurring task',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/agent-tasks/recurring - Listar tasks recorrentes ativas
   */
  async getRecurringTasks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = request.headers['x-organization-id'] as string;

      if (!organizationId) {
        return reply.code(400).send({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const { taskSchedulerService } = await import('@/services/taskSchedulerService');

      const tasks = await taskSchedulerService.listRecurringTasks(organizationId);

      return reply.code(200).send({
        success: true,
        data: tasks,
        total: tasks.length,
      });
    } catch (error) {
      logger.error('[AgentTaskController] Error listing recurring tasks:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to list recurring tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

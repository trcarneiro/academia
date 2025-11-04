import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AgentTaskController } from '@/controllers/agentTaskController';
import { authorizationService } from '@/services/authorizationService';
import { prisma } from '@/utils/database';

const controller = new AgentTaskController();

export default async function agentTasksRoutes(fastify: FastifyInstance) {
  // POST /api/agent-tasks - Criar nova task
  fastify.post('/', async (request, reply) => {
    return controller.createTask(request, reply);
  });

  // GET /api/agent-tasks - Listar tasks com filtros
  fastify.get('/', async (request, reply) => {
    return controller.listTasks(request, reply);
  });

  // GET /api/agent-tasks/stats - Estatísticas
  fastify.get('/stats', async (request, reply) => {
    return controller.getStats(request, reply);
  });

  // GET /api/agent-tasks/pending/count - Contar pendentes
  fastify.get('/pending/count', async (request, reply) => {
    return controller.countPending(request, reply);
  });

  // GET /api/agent-tasks/:id - Buscar task por ID
  fastify.get('/:id', async (request, reply) => {
    return controller.getTask(request, reply);
  });

  // PATCH /api/agent-tasks/:id/approve - Aprovar task
  fastify.patch('/:id/approve', async (request, reply) => {
    // 🔒 AUTHORIZATION CHECK
    const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Buscar task para validar permissões
    const task = await prisma.agentTask.findUnique({
      where: { id: (request.params as any).id }
    });
    
    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Verificar permissão de aprovação
    const authCheck = await authorizationService.canApproveTask(userId, task);
    
    if (!authCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: authCheck.reason,
        requiredRole: authCheck.requiredRole,
        requiredPermission: authCheck.requiredPermission
      });
    }
    
    return controller.approveTask(request, reply);
  });

  // PATCH /api/agent-tasks/:id/reject - Rejeitar task
  fastify.patch('/:id/reject', async (request, reply) => {
    return controller.rejectTask(request, reply);
  });

  // PATCH /api/agent-tasks/:id/cancel - Cancelar execução de task
  fastify.patch('/:id/cancel', async (request, reply) => {
    // 🔒 AUTHORIZATION CHECK
    const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Buscar task para validar permissões
    const task = await prisma.agentTask.findUnique({
      where: { id: (request.params as any).id }
    });
    
    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Verificar se task está em execução
    if (task.status !== 'IN_PROGRESS') {
      return reply.code(400).send({
        success: false,
        error: 'Only tasks in progress can be cancelled'
      });
    }
    
    // Verificar permissão (mesmo nível que executar)
    const authCheck = await authorizationService.canExecuteTask(userId, task);
    
    if (!authCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: authCheck.reason,
        requiredRole: authCheck.requiredRole,
        requiredPermission: authCheck.requiredPermission
      });
    }
    
    return controller.cancelTask(request, reply);
  });

  // PATCH /api/agent-tasks/:id/execute - Executar task
  fastify.patch('/:id/execute', async (request, reply) => {
    // 🔒 AUTHORIZATION CHECK
    const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Buscar task para validar permissões
    const task = await prisma.agentTask.findUnique({
      where: { id: (request.params as any).id }
    });
    
    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Verificar permissão de execução
    const authCheck = await authorizationService.canExecuteTask(userId, task);
    
    if (!authCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: authCheck.reason,
        requiredRole: authCheck.requiredRole,
        requiredPermission: authCheck.requiredPermission
      });
    }
    
    return controller.executeTask(request, reply);
  });

  // DELETE /api/agent-tasks/:id - Deletar task
  fastify.delete('/:id', async (request, reply) => {
    return controller.deleteTask(request, reply);
  });

  // 🆕 NOVOS ENDPOINTS - EXECUÇÃO E AGENDAMENTO

  // POST /api/agent-tasks/:id/execute-now - Executar tarefa imediatamente
  fastify.post('/:id/execute-now', async (request, reply) => {
    // 🔒 AUTHORIZATION CHECK
    const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Buscar task para validar permissões
    const task = await prisma.agentTask.findUnique({
      where: { id: (request.params as any).id }
    });
    
    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Verificar permissão de execução
    const authCheck = await authorizationService.canExecuteTask(userId, task);
    
    if (!authCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: authCheck.reason,
        requiredRole: authCheck.requiredRole,
        requiredPermission: authCheck.requiredPermission
      });
    }
    
    return controller.executeTaskNow(request, reply);
  });

  // POST /api/agent-tasks/:id/execute-mcp - Executar via MCP (agente AI decide como executar)
  fastify.post('/:id/execute-mcp', async (request, reply) => {
    // 🔒 AUTHORIZATION CHECK
    const userId = (request.headers['x-user-id'] as string) || (request as any).user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        success: false,
        error: 'User authentication required'
      });
    }
    
    // Buscar task para validar permissões
    const task = await prisma.agentTask.findUnique({
      where: { id: (request.params as any).id }
    });
    
    if (!task) {
      return reply.code(404).send({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Verificar permissão de execução
    const authCheck = await authorizationService.canExecuteTask(userId, task);
    
    if (!authCheck.allowed) {
      return reply.code(403).send({
        success: false,
        error: authCheck.reason,
        requiredRole: authCheck.requiredRole,
        requiredPermission: authCheck.requiredPermission
      });
    }
    
    return controller.executeTaskViaMCP(request, reply);
  });

  // POST /api/agent-tasks/:id/schedule - Agendar tarefa para execução futura
  fastify.post('/:id/schedule', async (request, reply) => {
    return controller.scheduleTask(request, reply);
  });

  // GET /api/agent-tasks/:id/executions - Obter log de execuções
  fastify.get('/:id/executions', async (request, reply) => {
    return controller.getTaskExecutions(request, reply);
  });

  // GET /api/agent-tasks/orchestrator/stats - Estatísticas do orquestrador
  fastify.get('/orchestrator/stats', async (request, reply) => {
    return controller.getOrchestratorStats(request, reply);
  });

  // POST /api/agent-tasks/recurring - Criar tarefa recorrente
  fastify.post('/recurring', async (request, reply) => {
    return controller.createRecurringTask(request, reply);
  });

  // POST /api/agent-tasks/:id/schedule/recurring - Agendar tarefa recorrente com cron
  fastify.post('/:id/schedule/recurring', async (request, reply) => {
    return controller.scheduleTaskRecurring(request, reply);
  });

  // DELETE /api/agent-tasks/:id/schedule/recurring - Cancelar agendamento recorrente
  fastify.delete('/:id/schedule/recurring', async (request, reply) => {
    return controller.unscheduleRecurringTask(request, reply);
  });

  // GET /api/agent-tasks/recurring - Listar tarefas recorrentes ativas
  fastify.get('/recurring', async (request, reply) => {
    return controller.getRecurringTasks(request, reply);
  });
}

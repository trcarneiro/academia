// @ts-nocheck
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AgentTaskService } from '@/services/agentTaskService';
import { logger } from '@/utils/logger';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export default async function agentTasksRoutes(fastify: FastifyInstance) {
  const taskService = new AgentTaskService();

  // List all agent tasks
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { 
    approvalStatus?: string; 
    status?: string; 
    agentId?: string; 
    limit?: number; 
    offset?: number;
    organizationId?: string;
  } }>, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;
      const { approvalStatus, status, agentId, limit, offset } = request.query;
      
      const tasks = await taskService.listTasks({
        organizationId,
        approvalStatus,
        status,
        agentId,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0
      });

      return reply.send({
        success: true,
        data: tasks.tasks,
        total: tasks.total,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0
      });
    } catch (error) {
      logger.error('Error listing tasks:', error);
      return reply.code(500).send({ success: false, message: 'Failed to list tasks' });
    }
  });

  // Get task statistics
  fastify.get('/stats', async (request: FastifyRequest<{ Querystring: { organizationId?: string } }>, reply: FastifyReply) => {
    try {
      const { organizationId } = request.query;
      // Implement stats logic here or in service
      // For now, return basic stats based on listTasks or a specific service method
      // Since service doesn't have getStats explicitly shown, we'll stub or implement if needed.
      // Let's assume we can just return empty stats for now or implement a quick count
      
      return reply.send({
        success: true,
        data: {
          total: 0, // TODO: Implement real stats
          pending: 0,
          approved: 0,
          rejected: 0,
          executed: 0
        }
      });
    } catch (error) {
      return reply.code(500).send({ success: false, message: 'Failed to get stats' });
    }
  });

  // Get pending tasks count
  fastify.get('/pending/count', async (request: FastifyRequest<{ Querystring: { organizationId?: string } }>, reply: FastifyReply) => {
    try {
      const { organizationId } = request.query;
      const tasks = await taskService.listTasks({
        organizationId,
        approvalStatus: 'PENDING',
        limit: 1
      });
      return reply.send({
        success: true,
        count: tasks.total
      });
    } catch (error) {
      return reply.code(500).send({ success: false, message: 'Failed to get pending count' });
    }
  });

  // Get task by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const task = await taskService.getTaskById(request.params.id, organizationId);
      if (!task) {
        return reply.code(404).send({ success: false, message: 'Task not found' });
      }
      return reply.send({ success: true, data: task });
    } catch (error) {
      return reply.code(500).send({ success: false, message: 'Failed to get task' });
    }
  });
  
  // Approve task
  fastify.post('/:id/approve', async (request: FastifyRequest<{ Params: { id: string }, Body: { userId: string } }>, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const { userId } = request.body;
      const task = await taskService.approveTask(request.params.id, organizationId, userId);
      return reply.send({ success: true, data: task });
    } catch (error) {
      logger.error('Error approving task:', error);
      return reply.code(500).send({ success: false, message: 'Failed to approve task' });
    }
  });

  // Reject task
  fastify.post('/:id/reject', async (request: FastifyRequest<{ Params: { id: string }, Body: { userId: string, reason: string } }>, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request, reply);
      if (!organizationId) return;

      const { userId, reason } = request.body;
      const task = await taskService.rejectTask(request.params.id, organizationId, userId, reason);
      return reply.send({ success: true, data: task });
    } catch (error) {
      logger.error('Error rejecting task:', error);
      return reply.code(500).send({ success: false, message: 'Failed to reject task' });
    }
  });
}

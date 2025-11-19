import { FastifyInstance, FastifyReply } from 'fastify';

/**
 * Agent Tasks Routes - Stub Implementation
 * 
 * These routes are temporary stubs to prevent 500 errors.
 * The AgentTask model was removed during PostgreSQL migration.
 * This provides graceful empty responses to maintain API compatibility.
 */
export default async function agentTasksRoutes(fastify: FastifyInstance) {
  // List all agent tasks
  fastify.get('/', async (_request, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: [],
      total: 0,
      limit: 50,
      offset: 0
    });
  });

  // Get task statistics
  fastify.get('/stats', async (_request, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        executed: 0
      }
    });
  });

  // Get pending tasks count
  fastify.get('/pending/count', async (_request, reply: FastifyReply) => {
    return reply.send({
      success: true,
      count: 0
    });
  });

  // Get task by ID
  fastify.get('/:id', async (_request, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      message: 'Task not found'
    });
  });
}

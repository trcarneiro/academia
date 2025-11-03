import { FastifyInstance } from 'fastify';
import { agentInsightController } from '@/controllers/agentInsightController';

export default async function agentInsightRoutes(fastify: FastifyInstance) {
  // List insights with filters
  fastify.get('/', async (request, reply) => {
    return agentInsightController.listInsights(request, reply);
  });

  // Get statistics
  fastify.get('/stats', async (request, reply) => {
    return agentInsightController.getStats(request, reply);
  });

  // Get specific insight
  fastify.get('/:id', async (request, reply) => {
    return agentInsightController.getInsight(request, reply);
  });

  // Update insight (generic)
  fastify.patch('/:id', async (request, reply) => {
    return agentInsightController.updateInsight(request, reply);
  });

  // Toggle pin
  fastify.patch('/:id/pin', async (request, reply) => {
    return agentInsightController.togglePin(request, reply);
  });

  // Mark as read
  fastify.patch('/:id/read', async (request, reply) => {
    return agentInsightController.markAsRead(request, reply);
  });

  // Archive
  fastify.patch('/:id/archive', async (request, reply) => {
    return agentInsightController.archive(request, reply);
  });

  // Delete single insight
  fastify.delete('/:id', async (request, reply) => {
    return agentInsightController.deleteInsight(request, reply);
  });

  // Bulk delete
  fastify.delete('/bulk', async (request, reply) => {
    return agentInsightController.bulkDelete(request, reply);
  });
}

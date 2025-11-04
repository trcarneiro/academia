import { FastifyInstance } from 'fastify';
import { HybridAgendaControllerSimple } from '@/controllers/hybridAgendaControllerSimple';

export default async function hybridAgendaRoutes(fastify: FastifyInstance) {
  // CRUD endpoints for hybrid agenda
  fastify.get('/', HybridAgendaControllerSimple.list);
  fastify.post('/', HybridAgendaControllerSimple.create);
  fastify.get('/:id', HybridAgendaControllerSimple.getById);
  fastify.put('/:id', HybridAgendaControllerSimple.update);
  fastify.delete('/:id', HybridAgendaControllerSimple.delete);
}

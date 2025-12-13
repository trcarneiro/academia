import { FastifyInstance } from 'fastify';
import { HorariosSugeridosController } from '@/controllers/horariosSugeridosController';

export default async function horariosSugeridosRoutes(fastify: FastifyInstance) {
  const controller = new HorariosSugeridosController();

  fastify.post('/', controller.create.bind(controller));
  fastify.get('/', controller.list.bind(controller));
  fastify.post('/:id/support', controller.support.bind(controller));
  fastify.delete('/:id/support/:studentId', controller.removeSupport.bind(controller));
  fastify.post('/:id/approve', controller.approve.bind(controller));
  fastify.post('/:id/reject', controller.reject.bind(controller));
}

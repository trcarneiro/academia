/**
 * Portal Routes Index
 * Registra todas as rotas do Portal do Aluno
 */

import { FastifyInstance } from 'fastify';
import portalAuthRoutes from './auth';
import portalPaymentsRoutes from './payments';
import portalWebhookRoutes from './webhook';

export default async function portalRoutes(fastify: FastifyInstance) {
  // Registrar sub-rotas
  fastify.register(portalAuthRoutes, { prefix: '/auth' });
  fastify.register(portalPaymentsRoutes, { prefix: '/payments' });
  fastify.register(portalWebhookRoutes, { prefix: '/webhook' });
  
  // TODO: Adicionar mais rotas conforme implementação
  // fastify.register(portalProfileRoutes, { prefix: '/profile' });
  // fastify.register(portalScheduleRoutes, { prefix: '/schedule' });
  // fastify.register(portalCoursesRoutes, { prefix: '/courses' });
  // fastify.register(portalChatRoutes, { prefix: '/chat' });
  // fastify.register(portalNotificationsRoutes, { prefix: '/notifications' });
}

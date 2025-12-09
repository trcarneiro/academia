/**
 * Portal Routes Index
 * Registra todas as rotas do Portal do Aluno
 */

import { FastifyInstance } from 'fastify';
import portalAuthRoutes from './auth';
import portalPaymentsRoutes from './payments';
import portalWebhookRoutes from './webhook';
import portalDashboardRoutes from './dashboard';
import portalFinancialRoutes from './financial';
import portalAcademicRoutes from './academic';
import portalProfileRoutes from './profile';
import portalScheduleRoutes from './schedule';
import portalCoursesRoutes from './courses';
import portalChatRoutes from './chat';
import portalNotificationsRoutes from './notifications';

export default async function portalRoutes(fastify: FastifyInstance) {
  // Registrar sub-rotas
  fastify.register(portalAuthRoutes, { prefix: '/auth' });
  fastify.register(portalPaymentsRoutes, { prefix: '/payments' });
  fastify.register(portalWebhookRoutes, { prefix: '/webhook' });
  fastify.register(portalDashboardRoutes, { prefix: '/dashboard' });
  fastify.register(portalFinancialRoutes, { prefix: '/financial' });
  fastify.register(portalAcademicRoutes, { prefix: '/academic' });
  fastify.register(portalProfileRoutes, { prefix: '/profile' });
  fastify.register(portalScheduleRoutes, { prefix: '/schedule' });
  fastify.register(portalCoursesRoutes, { prefix: '/courses' });
  fastify.register(portalChatRoutes, { prefix: '/chat' });
  fastify.register(portalNotificationsRoutes, { prefix: '/notifications' });
}

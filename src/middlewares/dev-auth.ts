import { FastifyRequest, FastifyReply } from 'fastify';
import { DEV_CONFIG } from '@/config/dev';

/**
 * Middleware de desenvolvimento - Define usuário padrão automaticamente
 * Útil para desenvolvimento sem necessidade de login
 */
export const devAutoAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // Só aplicar em desenvolvimento
  if (!DEV_CONFIG.IS_DEVELOPMENT) {
    return;
  }

  // Se já há um usuário autenticado, não fazer nada
  if ((request as any).user) {
    return;
  }

  // Definir usuário padrão para desenvolvimento
  const defaultUser = {
    ...DEV_CONFIG.DEFAULT_USER,
    isActive: true
  };

  // Anexar usuário à requisição
  (request as any).user = defaultUser;

  console.log('🔧 [DEV] Usuário padrão definido automaticamente:', defaultUser.email);
};
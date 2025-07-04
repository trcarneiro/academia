import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, AuthenticatedUser } from '@/types';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}

export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch (error) {
    logger.warn({ error }, 'JWT verification failed');
    return ResponseHelper.error(reply, 'Token inválido ou expirado', 401);
  }
};

export const authorizeRoles = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      logger.warn(
        { userId: request.user.id, role: request.user.role, allowedRoles },
        'Insufficient permissions'
      );
      return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
    }
  };
};

export const adminOnly = authorizeRoles([UserRole.ADMIN]);
export const instructorOrAdmin = authorizeRoles([UserRole.INSTRUCTOR, UserRole.ADMIN]);
export const allRoles = authorizeRoles([UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN]);
// Remove declare module to avoid conflicts with Supabase types
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole, AuthenticatedUser } from '@/types';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { serverSupabase } from '@/utils/supabase'; // Server-side Supabase client

export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify with Supabase server client
    try {
      const { data: { user }, error } = await serverSupabase.auth.getUser(token);
      if (error || !user) throw new Error('Invalid Supabase token');

      // Map Supabase user to AuthenticatedUser
      (request as any).user = {
        id: user.id,
        email: user.email || '',
        role: (user.app_metadata?.role as UserRole) || 'STUDENT',
        organizationId: (user.app_metadata?.orgId as string) || '',
      };
    } catch (supabaseError) {
      // Fallback: Verify as local JWT (for dev-auth)
      try {
        const decoded = (request.server as any).jwt.verify(token) as any;
        (request as any).user = {
          id: decoded.userId || decoded.sub,
          email: decoded.email,
          role: decoded.role,
          organizationId: decoded.organizationId
        };
        // logger.info('✅ Local JWT verified');
      } catch (localError) {
        throw new Error('Invalid token (Supabase & Local)');
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Authentication failed');
    return ResponseHelper.error(reply, 'Token inválido ou expirado', 401);
  }
};

export const authorizeRoles = (allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
    }

    const user = request.user as AuthenticatedUser;
    if (!allowedRoles.includes(user.role)) {
      logger.warn(
        { userId: user.id, role: user.role, allowedRoles },
        'Insufficient permissions'
      );
      return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
    }
  };
};

export const adminOnly = authorizeRoles([UserRole.ADMIN]);
export const instructorOrAdmin = authorizeRoles([UserRole.INSTRUCTOR, UserRole.ADMIN]);
export const allRoles = authorizeRoles([UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN]);
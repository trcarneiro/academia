import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@/services/authService';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { RegisterInput, LoginInput } from '@/schemas/auth';

export class AuthController {
  static async getUserByEmail(
    request: FastifyRequest<{ Querystring: { email: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { email } = request.query;
      
      const user = await AuthService.findUserByEmail(email);
      
      if (!user) {
        return ResponseHelper.error(reply, 'Usuário não encontrado', 404);
      }

      return ResponseHelper.success(
        reply,
        {
          id: user.id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
        },
        'Usuário encontrado'
      );
    } catch (error) {
      logger.error({ error, email: request.query.email }, 'Get user by email failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    try {
      const userData = await AuthService.register(request.body);
      
      // Return Supabase session token instead of local JWT
      return ResponseHelper.success(
        reply,
        {
          user: userData,
          token: userData.token, // Supabase session.access_token from AuthService
        },
        'Usuário registrado com sucesso',
        201
      );
    } catch (error) {
      logger.error({ error, body: request.body }, 'Registration failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async login(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) {
    try {
      const userData = await AuthService.login(request.body);
      
      // Return Supabase session token
      return ResponseHelper.success(
        reply,
        {
          user: userData,
          token: userData.token, // Supabase session.access_token
        },
        'Login realizado com sucesso'
      );
    } catch (error) {
      logger.error({ error, email: request.body.email }, 'Login failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 401);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async profile(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      const userData = await AuthService.findUserById(request.user.id);

      return ResponseHelper.success(
        reply,
        userData,
        'Perfil recuperado com sucesso'
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id }, 'Profile fetch failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 404);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async updatePassword(
    request: FastifyRequest<{
      Body: { currentPassword: string; newPassword: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      const { currentPassword, newPassword } = request.body;

      await AuthService.updatePassword(
        request.user.id,
        currentPassword,
        newPassword
      );

      return ResponseHelper.success(
        reply,
        null,
        'Senha atualizada com sucesso'
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id }, 'Password update failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async refresh(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Token inválido', 401);
      }

      const userData = await AuthService.findUserById(request.user.id);
      
      // For Supabase, refresh is handled client-side; here return user data for session update
      // Frontend calls Supabase refreshSession
      return ResponseHelper.success(
        reply,
        {
          user: userData,
          // No new token, frontend handles refresh
        },
        'Sessão renovada com sucesso'
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id }, 'Token refresh failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 404);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }
}
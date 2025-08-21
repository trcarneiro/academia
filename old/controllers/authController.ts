import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@/services/authService';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { RegisterInput, LoginInput } from '@/schemas/auth';

export class AuthController {
  static async register(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply
  ) {
    try {
      const userData = await AuthService.register(request.body);
      
      // Generate JWT token
      const token = await reply.jwtSign(
        AuthService.createJWTPayload(userData)
      );

      return ResponseHelper.success(
        reply,
        {
          user: userData,
          token,
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
      
      // Generate JWT token
      const token = await reply.jwtSign(
        AuthService.createJWTPayload(userData)
      );

      return ResponseHelper.success(
        reply,
        {
          user: userData,
          token,
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
      
      // Generate new JWT token
      const token = await reply.jwtSign(
        AuthService.createJWTPayload(userData)
      );

      return ResponseHelper.success(
        reply,
        {
          user: userData,
          token,
        },
        'Token renovado com sucesso'
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
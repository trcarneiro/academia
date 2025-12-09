/**
 * Portal do Aluno - Auth Routes
 * Endpoints de autenticação para alunos
 * 
 * Endpoints:
 * - POST /register - Cadastro de novo aluno
 * - POST /login - Login com email/senha
 * - POST /magic-link/request - Solicitar magic link (code via WhatsApp)
 * - POST /magic-link/verify - Verificar magic code
 * - POST /verify-token - Verificar token JWT
 * - POST /logout - Encerrar sessão
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  registerStudent, 
  loginWithPassword, 
  requestMagicLink, 
  validateMagicCode as validateMagicCodeService, 
  validateToken,
  revokeSession
} from '@/services/portal/authService';
import { logger } from '@/utils/logger';

// Type definitions for request bodies
interface RegisterBody {
  cpf: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  organizationId: string;
}

interface LoginBody {
  email: string;
  password: string;
  organizationId: string;
}

interface MagicLinkRequestBody {
  phone: string;
  organizationId: string;
}

interface MagicLinkVerifyBody {
  phone: string;
  code: string;
  organizationId: string;
}

interface VerifyTokenBody {
  token: string;
}

// Rate limit config for auth endpoints (more restrictive than global)
const authRateLimitConfig = {
  max: 10,           // 10 requests
  timeWindow: '1 minute'
};

const loginRateLimitConfig = {
  max: 5,            // 5 login attempts
  timeWindow: '5 minutes'
};

export default async function portalAuthRoutes(fastify: FastifyInstance) {
  /**
   * POST /register
   * Cadastro de novo aluno no portal
   */
  fastify.post('/register', {
    config: {
      rateLimit: authRateLimitConfig  // T064: Rate limiting for auth
    },
    schema: {
      body: {
        type: 'object',
        required: ['cpf', 'email', 'password', 'name', 'organizationId'],
        properties: {
          cpf: { type: 'string', minLength: 11, maxLength: 14 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 2 },
          phone: { type: 'string' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            student: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const { cpf, email, password, name, phone, organizationId } = request.body;

      logger.info('[Portal Auth] Tentativa de cadastro', { cpf, email, organizationId });

      const result = await registerStudent({
        cpf,
        email,
        password,
        name,
        phone: phone || '',
        organizationId
      });

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.error || 'Erro no cadastro'
        });
      }

      logger.info('[Portal Auth] Cadastro realizado com sucesso', { studentId: result.student?.id });

      return reply.status(201).send({
        success: true,
        token: result.token,
        student: result.student,
        message: 'Cadastro realizado com sucesso'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro no cadastro:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });

  /**
   * POST /login
   * Login com email e senha
   */
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'organizationId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            student: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { email, password, organizationId } = request.body;

      logger.info('[Portal Auth] Tentativa de login', { email, organizationId });

      const result = await loginWithPassword({
        email,
        password,
        organizationId
      });

      if (!result.success) {
        return reply.status(401).send({
          success: false,
          message: result.error || 'Credenciais inválidas'
        });
      }

      logger.info('[Portal Auth] Login realizado com sucesso', { studentId: result.student?.id });

      return reply.status(200).send({
        success: true,
        token: result.token,
        student: result.student,
        message: 'Login realizado com sucesso'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro no login:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });

  /**
   * POST /magic-link/request
   * Solicita um magic code para login via WhatsApp
   */
  fastify.post('/magic-link/request', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'organizationId'],
        properties: {
          phone: { type: 'string' },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            expiresAt: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: MagicLinkRequestBody }>, reply: FastifyReply) => {
    try {
      const { phone, organizationId } = request.body;

      logger.info('[Portal Auth] Solicitação de magic code', { phone, organizationId });

      const result = await requestMagicLink(phone, organizationId);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.error || 'Erro ao gerar código'
        });
      }

      // TODO: Enviar código via WhatsApp quando integrado
      // Por enquanto, loga o código para testes
      logger.info('[Portal Auth] Magic code gerado', { 
        phone, 
        code: result.code, 
        expiresAt: result.expiresAt 
      });

      return reply.status(200).send({
        success: true,
        expiresAt: result.expiresAt?.toISOString(),
        message: 'Código de acesso gerado. Verifique seu WhatsApp.'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro ao gerar magic code:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });

  /**
   * POST /magic-link/verify
   * Verifica o magic code e retorna token
   */
  fastify.post('/magic-link/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['phone', 'code', 'organizationId'],
        properties: {
          phone: { type: 'string' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          organizationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            student: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: MagicLinkVerifyBody }>, reply: FastifyReply) => {
    try {
      const { phone, code, organizationId } = request.body;

      logger.info('[Portal Auth] Verificação de magic code', { phone, organizationId });

      const result = await validateMagicCodeService(phone, code, organizationId);

      if (!result.success) {
        return reply.status(401).send({
          success: false,
          message: result.error || 'Código inválido'
        });
      }

      logger.info('[Portal Auth] Magic code verificado com sucesso', { studentId: result.student?.id });

      return reply.status(200).send({
        success: true,
        token: result.token,
        student: result.student,
        message: 'Autenticação realizada com sucesso'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro ao verificar magic code:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });

  /**
   * POST /verify-token
   * Verifica se um token JWT é válido
   */
  fastify.post('/verify-token', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            valid: { type: 'boolean' },
            payload: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: VerifyTokenBody }>, reply: FastifyReply) => {
    try {
      const { token } = request.body;

      const result = await validateToken(token);

      if (!result.valid) {
        return reply.status(401).send({
          success: false,
          valid: false,
          message: result.error || 'Token inválido'
        });
      }

      return reply.status(200).send({
        success: true,
        valid: true,
        payload: result.payload,
        message: 'Token válido'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro ao verificar token:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });

  /**
   * POST /logout
   * Encerra a sessão atual
   */
  fastify.post('/logout', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: VerifyTokenBody }>, reply: FastifyReply) => {
    try {
      const { token } = request.body;

      const revoked = await revokeSession(token);

      if (!revoked) {
        return reply.status(400).send({
          success: false,
          message: 'Erro ao encerrar sessão'
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Sessão encerrada com sucesso'
      });

    } catch (error) {
      logger.error('[Portal Auth] Erro ao fazer logout:', error);
      return reply.status(500).send({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  });
}

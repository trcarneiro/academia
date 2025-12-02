/**
 * Portal Auth Middleware
 * Middleware de autenticação para rotas protegidas do Portal do Aluno
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/portal/authService';

declare module 'fastify' {
  interface FastifyRequest {
    studentId?: string;
    organizationId?: string;
    portalUser?: {
      studentId: string;
      email: string;
      name: string;
      organizationId: string;
    };
  }
}

/**
 * Middleware que valida JWT do Portal e injeta dados no request
 */
export async function portalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractToken(request);

  if (!token) {
    reply.code(401).send({
      success: false,
      error: 'Token de autenticação não fornecido',
    });
    return;
  }

  const validation = await authService.validateToken(token);

  if (!validation.valid || !validation.payload) {
    reply.code(401).send({
      success: false,
      error: validation.error || 'Token inválido ou expirado',
    });
    return;
  }

  // Injetar dados no request
  request.studentId = validation.payload.sub;
  request.organizationId = validation.payload.orgId;
  request.portalUser = {
    studentId: validation.payload.sub,
    email: validation.payload.email,
    name: validation.payload.name,
    organizationId: validation.payload.orgId,
  };
}

/**
 * Middleware opcional que tenta validar token mas não bloqueia se ausente
 */
export async function portalAuthOptional(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractToken(request);

  if (!token) {
    return; // Continua sem autenticação
  }

  const validation = await authService.validateToken(token);

  if (validation.valid && validation.payload) {
    request.studentId = validation.payload.sub;
    request.organizationId = validation.payload.orgId;
    request.portalUser = {
      studentId: validation.payload.sub,
      email: validation.payload.email,
      name: validation.payload.name,
      organizationId: validation.payload.orgId,
    };
  }
}

function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth) return null;

  if (auth.startsWith('Bearer ')) {
    return auth.substring(7);
  }

  return auth;
}

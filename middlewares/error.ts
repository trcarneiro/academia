import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { Prisma } from '@prisma/client';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  }, 'Request error');

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return ResponseHelper.error(reply, 'Registro já existe', 409);
      case 'P2025':
        return ResponseHelper.error(reply, 'Registro não encontrado', 404);
      case 'P2003':
        return ResponseHelper.error(reply, 'Violação de restrição de chave estrangeira', 400);
      default:
        return ResponseHelper.error(reply, 'Erro na base de dados', 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ResponseHelper.error(reply, 'Dados inválidos', 400);
  }

  // JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return ResponseHelper.error(reply, 'Token de autorização não fornecido', 401);
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return ResponseHelper.error(reply, 'Token de autorização inválido', 401);
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return ResponseHelper.error(reply, 'Muitas tentativas. Tente novamente mais tarde.', 429);
  }

  // Validation errors
  if (error.validation) {
    return ResponseHelper.error(reply, 'Dados de entrada inválidos', 400, JSON.stringify(error.validation));
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno do servidor' : error.message;
  
  return ResponseHelper.error(reply, message, statusCode);
};
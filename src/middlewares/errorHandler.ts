import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  
  let response;
  if (statusCode === 400) {
    // Erros de validação
    response = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      errors: error.validation || []
    };
  } else if (statusCode === 409) {
    // Conflitos
    response = {
      status: 'error',
      code: 'CONFLICT_ERROR',
      message: error.message || 'Conflito de dados'
    };
  } else {
    // Erros genéricos
    response = {
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Erro interno do servidor'
    };
  }

  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${request.id}] ${request.method} ${request.url}`, {
      error: {
        message: error.message,
        stack: error.stack,
        validation: error.validation
      }
    });
  }

  reply.status(statusCode).send(response);
}
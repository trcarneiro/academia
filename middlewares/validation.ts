import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn({ validationErrors }, 'Request body validation failed');
        
        return ResponseHelper.error(
          reply,
          'Dados de entrada inválidos',
          400,
          JSON.stringify(validationErrors)
        );
      }
      
      logger.error({ error }, 'Unexpected validation error');
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn({ validationErrors }, 'Request query validation failed');
        
        return ResponseHelper.error(
          reply,
          'Parâmetros de consulta inválidos',
          400,
          JSON.stringify(validationErrors)
        );
      }
      
      logger.error({ error }, 'Unexpected validation error');
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn({ validationErrors }, 'Request params validation failed');
        
        return ResponseHelper.error(
          reply,
          'Parâmetros da URL inválidos',
          400,
          JSON.stringify(validationErrors)
        );
      }
      
      logger.error({ error }, 'Unexpected validation error');
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  };
};
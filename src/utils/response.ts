import { FastifyReply } from 'fastify';

export class ResponseHelper {
  static success<T>(
    reply: FastifyReply,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): FastifyReply {
    if (process.env.NODE_ENV === 'development') {
      console.log('? ResponseHelper.success - Input data:', data);
    }
    
        const response = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    } as any;

    if (process.env.NODE_ENV === 'development') {
      console.log('? ResponseHelper.success - Input data:', data);
    }
    
        return reply.status(statusCode).send(response);
  }

  static error(
    reply: FastifyReply,
    error: string,
    statusCode: number = 400,
    message?: string
  ): FastifyReply {
    const response = {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    } as any;

    return reply.status(statusCode).send(response);
  }

  static paginated<T>(
    reply: FastifyReply,
    items: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): FastifyReply {
    const totalPages = Math.ceil(total / limit);
    const paginatedResponse = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    } as any;

    const response = {
      success: true,
      data: paginatedResponse,
      message,
      timestamp: new Date().toISOString(),
    } as any;

    return reply.status(200).send(response);
  }

  // Helper to return a standard response when a requested frontend module/view is not found
  static moduleNotFound(reply: FastifyReply, moduleName: string): FastifyReply {
    const message = `Módulo desconhecido: ${moduleName}`;
    const response = {
      success: false,
      error: 'MODULE_NOT_FOUND',
      message,
      timestamp: new Date().toISOString(),
    } as any;

    return reply.status(404).send(response);
  }

  static created<T>(reply: FastifyReply, data?: T, message?: string): FastifyReply {
    return this.success(reply, data, message, 201);
  }

  static notFound(reply: FastifyReply, message: string = 'Recurso não encontrado'): FastifyReply {
    return this.error(reply, message, 404);
  }

  static badRequest(reply: FastifyReply, message: string, details?: any): FastifyReply {
    const response = {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    } as any;

    return reply.status(400).send(response);
  }
}



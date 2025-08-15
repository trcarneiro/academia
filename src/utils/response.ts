import { FastifyReply } from 'fastify';

export class ResponseHelper {
  static success<T>(
    reply: FastifyReply,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): FastifyReply {
    const response = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    } as any;

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
}

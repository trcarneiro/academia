import { FastifyReply } from 'fastify';
import { ApiResponse, PaginatedResponse } from '@/types';

export class ResponseHelper {
  static success<T>(
    reply: FastifyReply,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return reply.status(statusCode).send(response);
  }

  static error(
    reply: FastifyReply,
    error: string,
    statusCode: number = 400,
    message?: string
  ): FastifyReply {
    const response: ApiResponse = {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString(),
    };

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
    
    const paginatedResponse: PaginatedResponse<T> = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: paginatedResponse,
      message,
      timestamp: new Date().toISOString(),
    };

    return reply.status(200).send(response);
  }
}
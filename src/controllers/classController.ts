import { FastifyRequest, FastifyReply } from 'fastify';
import { ClassService } from '@/services/classService';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { UpcomingClassesQuery, ClassIdParams, CreateClassInput, UpdateClassInput } from '@/schemas/class';
import { AuthenticatedUser } from '@/types';

export class ClassController {
  static async getUpcomingClasses(
    request: FastifyRequest<{ Querystring: UpcomingClassesQuery }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const result = await ClassService.getUpcomingClasses(
        user.id,
        user.role,
        request.query
      );

      return ResponseHelper.paginated(
        reply,
        result.classes,
        result.page,
        result.limit,
        result.total,
        'Aulas próximas recuperadas com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        query: request.query,
      }, 'Get upcoming classes failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getClassById(
    request: FastifyRequest<{ Params: ClassIdParams }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const classInfo = await ClassService.getClassById(
        request.params.id,
        user.id,
        user.role
      );

      return ResponseHelper.success(
        reply,
        classInfo,
        'Detalhes da aula recuperados com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        classId: request.params.id,
      }, 'Get class by ID failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 404);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async generateQRCode(
    request: FastifyRequest<{ Params: ClassIdParams }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const qrCodeData = await ClassService.generateClassQRCode(
        request.params.id,
        user.id,
        user.role
      );

      return ResponseHelper.success(
        reply,
        qrCodeData,
        'QR Code gerado com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        classId: request.params.id,
      }, 'Generate QR code failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async createClass(
    request: FastifyRequest<{ Body: CreateClassInput }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const newClass = await ClassService.createClass(
        request.body,
        user.role
      );

      return ResponseHelper.success(
        reply,
        newClass,
        'Aula criada com sucesso',
        201
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        body: request.body,
      }, 'Create class failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async updateClass(
    request: FastifyRequest<{
      Params: ClassIdParams;
      Body: UpdateClassInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const updatedClass = await ClassService.updateClass(
        request.params.id,
        request.body,
        user.role
      );

      return ResponseHelper.success(
        reply,
        updatedClass,
        'Aula atualizada com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        classId: request.params.id,
        body: request.body,
      }, 'Update class failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async cancelClass(
    request: FastifyRequest<{ Params: ClassIdParams }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      const cancelledClass = await ClassService.cancelClass(
        request.params.id,
        user.role
      );

      return ResponseHelper.success(
        reply,
        cancelledClass,
        'Aula cancelada com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        classId: request.params.id,
      }, 'Cancel class failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }
}
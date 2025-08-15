import { FastifyRequest, FastifyReply } from 'fastify';
import { AttendanceService } from '@/services/attendanceService';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { CheckInInput, AttendanceHistoryQuery, UpdateAttendanceInput, AttendanceStatsQuery } from '@/schemas/attendance';
import { UserRole } from '@/types';
import { prisma } from '@/utils/database';

export class AttendanceController {
  static async checkIn(
    request: FastifyRequest<{ Body: CheckInInput }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      // Only students can check in
      if (request.user.role !== UserRole.STUDENT) {
        return ResponseHelper.error(reply, 'Apenas estudantes podem fazer check-in', 403);
      }

      // Get student ID from user
      const student = await prisma.student.findUnique({
        where: { userId: request.user.id },
      });

      if (!student) {
        return ResponseHelper.error(reply, 'Estudante não encontrado', 404);
      }

      const attendance = await AttendanceService.checkInToClass(
        student.id,
        request.body
      );

      return ResponseHelper.success(
        reply,
        attendance,
        'Check-in realizado com sucesso',
        201
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id, body: request.body }, 'Check-in failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getHistory(
    request: FastifyRequest<{ Querystring: AttendanceHistoryQuery }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      const result = await AttendanceService.getAttendanceHistory(
        request.user.id,
        request.user.role,
        request.query
      );

      return ResponseHelper.paginated(
        reply,
        result.attendances,
        result.page,
        result.limit,
        result.total,
        'Histórico de presença recuperado com sucesso'
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id, query: request.query }, 'Get attendance history failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async updateAttendance(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateAttendanceInput;
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      const updatedAttendance = await AttendanceService.updateAttendance(
        request.params.id,
        request.body,
        request.user.role
      );

      return ResponseHelper.success(
        reply,
        updatedAttendance,
        'Presença atualizada com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: request.user?.id,
        attendanceId: request.params.id,
        body: request.body,
      }, 'Update attendance failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getStats(
    request: FastifyRequest<{ Querystring: AttendanceStatsQuery }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      // Students can only see their own stats
      let queryData = request.query;
      if (request.user.role === UserRole.STUDENT) {
        const student = await prisma.student.findUnique({
          where: { userId: request.user.id },
        });

        if (!student) {
          return ResponseHelper.error(reply, 'Estudante não encontrado', 404);
        }

        queryData = { ...request.query, studentId: student.id };
      }

      const stats = await AttendanceService.getAttendanceStats(queryData);

      return ResponseHelper.success(
        reply,
        stats,
        'Estatísticas de presença recuperadas com sucesso'
      );
    } catch (error) {
      logger.error({ error, userId: request.user?.id, query: request.query }, 'Get attendance stats failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getStudentPattern(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }

      // Only admins and instructors can see student patterns
      if (request.user.role === UserRole.STUDENT) {
        return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
      }

      const pattern = await prisma.attendancePattern.findUnique({
        where: { studentId: request.params.studentId },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      });

      if (!pattern) {
        return ResponseHelper.error(reply, 'Padrão de presença não encontrado', 404);
      }

      return ResponseHelper.success(
        reply,
        pattern,
        'Padrão de presença recuperado com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        userId: request.user?.id,
        studentId: request.params.studentId,
      }, 'Get student pattern failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }
}
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

  static async getStudentByRegistration(
    request: FastifyRequest<{ Params: { registrationNumber: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await AttendanceService.findStudentByRegistration(
        request.params.registrationNumber
      );

      console.log('🔍 Student from service:', student);

      if (!student) {
        return ResponseHelper.error(reply, 'Aluno não encontrado com esta matrícula ou nome', 404);
      }

      const message = student.searchedBy === 'registration' 
        ? 'Aluno encontrado por matrícula' 
        : 'Aluno encontrado por nome';

      console.log('📤 Sending response with:', student);

      // Create the response object explicitly
      const responseObj = {
        success: true,
        data: student,
        message: message,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Response object before send:', responseObj);
      console.log('📤 Response object JSON:', JSON.stringify(responseObj, null, 2));

      // Send as string to ensure proper serialization
      return reply.type('application/json').send(JSON.stringify(responseObj));
    } catch (error) {
      logger.error({
        error,
        registrationNumber: request.params.registrationNumber,
      }, 'Find student by registration failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getStudentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    console.log('🔥 getStudentById called with ID:', request.params.id);
    
    try {
      const student = await AttendanceService.findStudentById(
        request.params.id
      );

      console.log('🔥 Raw student from service:', student);

      if (!student) {
        return ResponseHelper.error(reply, 'Aluno não encontrado', 404);
      }

      // NUCLEAR SERIALIZATION: Convert to JSON and back to ensure clean object
      const cleanStudent = JSON.parse(JSON.stringify(student));
      console.log('🔥 Clean student after JSON roundtrip:', cleanStudent);
      console.log('🔥 Clean student keys:', Object.keys(cleanStudent));
      console.log('🔥 Clean student as JSON string:', JSON.stringify(cleanStudent));

      const result = ResponseHelper.success(reply, cleanStudent, 'Aluno encontrado');
      console.log('🔥 ResponseHelper.success returned:', result);
      return result;
    } catch (error) {
      logger.error({
        error,
        studentId: request.params.id,
      }, 'Find student by ID failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async searchStudents(
    request: FastifyRequest<{ 
      Params: { query: string }; 
      Querystring: { limit?: number } 
    }>,
    reply: FastifyReply
  ) {
    try {
      const students = await AttendanceService.searchStudents(
        request.params.query,
        request.query.limit || 10
      );

      return ResponseHelper.success(
        reply,
        students,
        `${students.length} aluno(s) encontrado(s)`
      );
    } catch (error) {
      logger.error({
        error,
        query: request.params.query,
      }, 'Search students failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getAllStudents(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const students = await AttendanceService.getAllActiveStudents();

      return ResponseHelper.success(
        reply,
        students,
        `${students.length} alunos ativos carregados`
      );
    } catch (error) {
      logger.error({
        error,
      }, 'Get all students failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getAvailableClasses(
    request: FastifyRequest<{ Querystring: { studentId?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const classes = await AttendanceService.getAvailableClasses(
        request.query.studentId
      );

      return ResponseHelper.success(
        reply,
        classes,
        'Aulas disponíveis recuperadas com sucesso'
      );
    } catch (error) {
      logger.error({
        error,
        studentId: request.query.studentId,
      }, 'Get available classes failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getStudentDashboard(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const dashboard = await AttendanceService.getStudentDashboard(
        request.params.studentId
      );

      // Manual JSON serialization to fix Fastify serialization issues
      const response = {
        success: true,
        data: dashboard,
        message: 'Dashboard do aluno recuperado com sucesso',
        timestamp: new Date().toISOString()
      };

      reply.header('Content-Type', 'application/json; charset=utf-8');
      return reply.send(JSON.stringify(response));
    } catch (error: any) {
      logger.error({
        error,
        studentId: request.params.studentId,
      }, 'Get student dashboard failed');

      // If database is unreachable, return a minimal dashboard so the kiosk UI still works
      if (error?.code === 'P1001') {
        const minimal = {
          student: { name: '', avatar: null, registrationNumber: '', graduationLevel: null, joinDate: null },
          plan: null,
          currentCourse: null,
          currentTurma: null,
          payments: { overdueCount: 0, overdueAmount: 0, lastPayment: null, nextDueDate: null },
          stats: { attendanceThisMonth: 0, totalClassesThisMonth: 0, attendanceRate: 0 },
          recentAttendances: [],
          upcomingClasses: [],
          enrollments: [],
        };
        const response = { success: true, data: minimal, message: 'Dashboard parcial (offline DB)', timestamp: new Date().toISOString() };
        reply.header('Content-Type', 'application/json; charset=utf-8');
        return reply.send(JSON.stringify(response));
      }

      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }

      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }
}
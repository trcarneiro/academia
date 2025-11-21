import { FastifyRequest, FastifyReply } from 'fastify';
import { AIService } from '@/services/aiService';
import { ResponseHelper } from '@/utils/response';
import { logger } from '@/utils/logger';
import { UserRole, AuthenticatedUser } from '@/types';
import { prisma } from '@/utils/database';

export class AnalyticsController {
  static async getDropoutRisk(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      // Only admins and instructors can access dropout risk analysis
      if (user.role === UserRole.STUDENT) {
        return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
      }

      const analysis = await AIService.analyzeDropoutRisk(request.params.studentId);

      return ResponseHelper.success(
        reply,
        analysis,
        'Análise de risco de evasão concluída'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        studentId: request.params.studentId,
      }, 'Dropout risk analysis failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getProgressAnalysis(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      // Students can only see their own progress
      if (user.role === UserRole.STUDENT) {
        const student = await prisma.student.findUnique({
          where: { userId: user.id },
        });

        if (!student || student.id !== request.params.studentId) {
          return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
        }
      }

      const analysis = await AIService.analyzeMartialArtsProgress(request.params.studentId);

      return ResponseHelper.success(
        reply,
        analysis,
        'Análise de progresso concluída'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        studentId: request.params.studentId,
      }, 'Progress analysis failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getClassRecommendations(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      // Students can only get their own recommendations
      if (user.role === UserRole.STUDENT) {
        const student = await prisma.student.findUnique({
          where: { userId: user.id },
        });

        if (!student || student.id !== request.params.studentId) {
          return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
        }
      }

      const recommendations = await AIService.generateClassRecommendations(request.params.studentId);

      return ResponseHelper.success(
        reply,
        recommendations,
        'Recomendações de aulas geradas'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        studentId: request.params.studentId,
      }, 'Class recommendations failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }

  static async getAttendancePatterns(
    request: FastifyRequest<{
      Querystring: {
        period?: 'week' | 'month' | 'quarter' | 'year';
        instructorId?: string;
        courseProgramId?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return ResponseHelper.error(reply, 'Usuário não autenticado', 401);
      }
      const user = request.user as AuthenticatedUser;

      // Only admins and instructors can see overall patterns
      if (user.role === UserRole.STUDENT) {
        return ResponseHelper.error(reply, 'Permissões insuficientes', 403);
      }

      const { period = 'month', instructorId, courseProgramId } = request.query;

      // Build date filter based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Build where clause
      let whereClause: any = {
        checkInTime: {
          gte: startDate,
          lte: now,
        },
      };

      if (instructorId) {
        whereClause.class = {
          instructorId,
        };
      }

      if (courseProgramId) {
        whereClause.class = {
          ...whereClause.class,
          courseProgramId,
        };
      }

      // Get attendance data
      const [
        totalAttendances,
        attendancesByStatus,
        attendancesByDay,
        attendancesByHour,
        topStudents,
      ] = await Promise.all([
        prisma.attendance.count({ where: whereClause }),
        
        prisma.attendance.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        
        prisma.attendance.findMany({
          where: whereClause,
          select: {
            checkInTime: true,
          },
        }),
        
        prisma.attendance.findMany({
          where: whereClause,
          select: {
            checkInTime: true,
          },
        }),
        
        prisma.attendance.groupBy({
          by: ['studentId'],
          where: whereClause,
          _count: true,
          orderBy: {
            _count: {
              studentId: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      // Process attendance by day of week
      const dayFrequency: { [key: number]: number } = {};
      attendancesByDay.forEach(attendance => {
        if (attendance.checkInTime) {
          const dayOfWeek = attendance.checkInTime.getDay();
          dayFrequency[dayOfWeek] = (dayFrequency[dayOfWeek] || 0) + 1;
        }
      });

      // Process attendance by hour
      const hourFrequency: { [key: number]: number } = {};
      attendancesByHour.forEach(attendance => {
        if (attendance.checkInTime) {
          const hour = attendance.checkInTime.getHours();
          hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
        }
      });

      // Get student details for top students
      const topStudentsWithDetails = await Promise.all(
        topStudents.map(async (item) => {
          const student = await prisma.student.findUnique({
            where: { id: item.studentId },
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            },
          });
          return {
            ...item,
            student,
          };
        })
      );

      const patterns = {
        totalAttendances,
        period,
        statusDistribution: attendancesByStatus.map(item => ({
          status: item.status,
          count: item._count,
          percentage: Math.round((item._count / totalAttendances) * 100 * 100) / 100,
        })),
        dayOfWeekPattern: Object.entries(dayFrequency).map(([day, count]) => ({
          dayOfWeek: parseInt(day),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
          count,
          percentage: Math.round((count / totalAttendances) * 100 * 100) / 100,
        })),
        hourOfDayPattern: Object.entries(hourFrequency).map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
          percentage: Math.round((count / totalAttendances) * 100 * 100) / 100,
        })),
        topStudents: topStudentsWithDetails.map(item => ({
          studentName: `${item.student?.user?.firstName || ''} ${item.student?.user?.lastName || ''}`,
          attendanceCount: item._count,
        })),
      };

      return ResponseHelper.success(
        reply,
        patterns,
        'Padrões de frequência analisados'
      );
    } catch (error) {
      logger.error({
        error,
        userId: (request.user as AuthenticatedUser)?.id,
        query: request.query,
      }, 'Attendance patterns analysis failed');
      
      if (error instanceof Error) {
        return ResponseHelper.error(reply, error.message, 400);
      }
      
      return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
    }
  }
}
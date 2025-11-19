import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import dayjs from 'dayjs';

/**
 * FrequencyStatsService - Serviço de estatísticas de frequência
 * Foco em métricas quantitativas (presença/ausência) para o dashboard
 */
export class FrequencyStatsService {
  /**
   * Obter estatísticas do dashboard
   * @param organizationId - ID da organização
   * @returns Estatísticas agregadas para cards do dashboard
   */
  static async getDashboardStats(organizationId: string) {
    try {
      const today = dayjs().startOf('day').toDate();
      const todayEnd = dayjs().endOf('day').toDate();
      const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
      const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();

      // Buscar check-ins de hoje
      const todayCheckinsPromise = prisma.turmaAttendance.findMany({
        where: {
          turma: { organizationId },
          createdAt: { gte: today, lte: todayEnd },
          present: true,
        },
        include: {
          student: { include: { user: true } },
        },
      });

      // Buscar check-ins de ontem
      const yesterdayCheckinsPromise = prisma.turmaAttendance.findMany({
        where: {
          turma: { organizationId },
          createdAt: { gte: yesterday, lte: yesterdayEnd },
          present: true,
        },
      });

      // Buscar aulas ativas (hoje)
      const activeClassesPromise = prisma.turmaLesson.findMany({
        where: {
          turma: { organizationId },
          scheduledDate: { gte: today, lte: todayEnd },
          status: 'SCHEDULED',
        },
        include: {
          turma: { include: { course: true } },
        },
      });

      // Buscar alunos com planos ativos mas sem check-in recente
      const studentsWithActivePlansPromise = this.getStudentsMissingWithActivePlans(
        organizationId,
        7
      );

      // Executar queries em paralelo
      const [todayCheckins, yesterdayCheckins, activeClasses, studentsMissing] =
        await Promise.all([
          todayCheckinsPromise,
          yesterdayCheckinsPromise,
          activeClassesPromise,
          studentsWithActivePlansPromise,
        ]);

      // Calcular alunos únicos presentes hoje
      const uniqueStudentsToday = new Set(
        todayCheckins.map((c) => c.studentId)
      ).size;

      // Calcular mudança percentual vs ontem
      const yesterdayCount = yesterdayCheckins.length;
      const todayCount = todayCheckins.length;
      const checkinsChangePercent =
        yesterdayCount > 0
          ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
          : 0;

      // Calcular taxa de presença (alunos presentes / total esperado)
      const totalExpectedToday = activeClasses.length * 30; // Default 30 alunos por turma
      const attendanceRate =
        totalExpectedToday > 0
          ? (uniqueStudentsToday / totalExpectedToday) * 100
          : 0;

      return {
        success: true,
        data: {
          todayCheckins: todayCount,
          presentStudents: uniqueStudentsToday,
          activeClasses: activeClasses.length,
          studentsWithPlansMissing: {
            count: studentsMissing.length,
            list: studentsMissing.slice(0, 5), // Top 5 para preview
          },
          comparisonYesterday: {
            checkinsChange: Math.round(checkinsChangePercent * 10) / 10,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
          },
        },
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw new Error('Falha ao buscar estatísticas do dashboard');
    }
  }

  /**
   * Obter dados para gráficos do dashboard
   * @param organizationId - ID da organização
   * @returns Dados formatados para Chart.js
   */
  static async getChartsData(organizationId: string) {
    try {
      const thirtyDaysAgo = dayjs().subtract(30, 'day').startOf('day').toDate();

      // 1. Frequência por dia da semana (últimos 30 dias)
      const weeklyStatsPromise = this.getWeeklyStats(organizationId, thirtyDaysAgo);

      // 2. Top 10 alunos mais assíduos (últimos 30 dias)
      const topStudentsPromise = this.getTopStudents(organizationId, thirtyDaysAgo);

      // 3. Taxa de presença por turma (últimos 30 dias)
      const classesByAttendancePromise = this.getClassesByAttendance(
        organizationId,
        thirtyDaysAgo
      );

      const [weeklyStats, topStudents, classesByAttendance] = await Promise.all([
        weeklyStatsPromise,
        topStudentsPromise,
        classesByAttendancePromise,
      ]);

      return {
        success: true,
        data: {
          weeklyStats,
          topStudents,
          classesByAttendance,
        },
      };
    } catch (error) {
      logger.error('Error fetching charts data:', error);
      throw new Error('Falha ao buscar dados de gráficos');
    }
  }

  /**
   * Obter estatísticas por dia da semana
   */
  private static async getWeeklyStats(
    organizationId: string,
    startDate: Date
  ): Promise<Array<{ day: string; avgCheckins: number }>> {
    const checkins = await prisma.turmaAttendance.findMany({
      where: {
        turma: { organizationId },
        createdAt: { gte: startDate },
        present: true,
      },
      select: { createdAt: true },
    });

    // Agrupar por dia da semana
    const dayGroups: Record<number, number[]> = {
      0: [], // Domingo
      1: [], // Segunda
      2: [], // Terça
      3: [], // Quarta
      4: [], // Quinta
      5: [], // Sexta
      6: [], // Sábado
    };

    const dayCounts: Record<string, Record<number, number>> = {};

    checkins.forEach((checkin) => {
      const date = dayjs(checkin.createdAt);
      const dayOfWeek = date.day();
      const dateKey = date.format('YYYY-MM-DD');

      if (!dayCounts[dateKey]) {
        dayCounts[dateKey] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      }
      dayCounts[dateKey][dayOfWeek] = (dayCounts[dateKey][dayOfWeek] || 0) + 1;
    });

    // Calcular média por dia da semana
    Object.values(dayCounts).forEach((counts) => {
      Object.entries(counts).forEach(([day, count]) => {
        const dayIndex = parseInt(day);
        if (dayGroups[dayIndex]) {
          dayGroups[dayIndex].push(count);
        }
      });
    });

    const dayNames = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    return dayNames.map((day, index) => {
      const counts = dayGroups[index] || [];
      const avg = counts && counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
      return {
        day,
        avgCheckins: Math.round(avg * 10) / 10,
      };
    });
  }

  /**
   * Obter top 10 alunos mais assíduos
   */
  private static async getTopStudents(
    organizationId: string,
    startDate: Date
  ): Promise<
    Array<{
      id: string;
      name: string;
      attendanceRate: number;
      avatar?: string;
      totalPresences: number;
    }>
  > {
    // Buscar todos os check-ins do período
    const checkins = await prisma.turmaAttendance.findMany({
      where: {
        turma: { organizationId },
        createdAt: { gte: startDate },
      },
      select: {
        studentId: true,
        present: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Agrupar por aluno
    const studentStats: Record<
      string,
      { name: string; avatar?: string; present: number; total: number }
    > = {};

    checkins.forEach((checkin) => {
      const studentId = checkin.studentId;
      if (!studentStats[studentId]) {
        const firstName = checkin.student.user.firstName || '';
        const lastName = checkin.student.user.lastName || '';
        studentStats[studentId] = {
          name: `${firstName} ${lastName}`.trim(),
          avatar: checkin.student.user.avatarUrl || undefined,
          present: 0,
          total: 0,
        };
      }
      studentStats[studentId].total++;
      if (checkin.present) {
        studentStats[studentId].present++;
      }
    });

    // Calcular taxa e ordenar
    const studentsArray = Object.entries(studentStats)
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        avatar: stats.avatar || undefined,
        totalPresences: stats.present,
        attendanceRate:
          stats.total > 0
            ? Math.round((stats.present / stats.total) * 100 * 10) / 10
            : 0,
      }))
      .filter((s) => s.totalPresences > 0) // Apenas com presenças
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10);

    return studentsArray;
  }

  /**
   * Obter taxa de presença por turma
   */
  private static async getClassesByAttendance(
    organizationId: string,
    startDate: Date
  ): Promise<
    Array<{ classId: string; className: string; attendanceRate: number }>
  > {
    const turmas = await prisma.turma.findMany({
      where: { organizationId, isActive: true },
      include: {
        course: { select: { name: true } },
        attendances: {
          where: { createdAt: { gte: startDate } },
          select: { present: true },
        },
      },
    });

    return turmas
      .map((turma) => {
        const total = turma.attendances.length;
        const present = turma.attendances.filter((a) => a.present).length;
        const rate = total > 0 ? (present / total) * 100 : 0;

        return {
          classId: turma.id,
          className: `${turma.course.name} - ${turma.name}`,
          attendanceRate: Math.round(rate * 10) / 10,
        };
      })
      .filter((c) => c.attendanceRate > 0) // Apenas com dados
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  /**
   * Obter alunos com planos ativos mas sem check-in recente
   * @param organizationId - ID da organização
   * @param daysThreshold - Dias sem check-in (default: 7)
   */
  static async getStudentsMissingWithActivePlans(
    organizationId: string,
    daysThreshold = 7
  ): Promise<
    Array<{
      id: string;
      name: string;
      avatar?: string;
      planName: string;
      planExpiresAt: Date;
      lastAttendance: Date | null;
      daysAgo: number;
      contactEmail?: string;
      contactPhone?: string;
    }>
  > {
    try {
      const cutoffDate = dayjs().subtract(daysThreshold, 'day').toDate();

      // Buscar alunos com planos ativos
      const students = await prisma.student.findMany({
        where: {
          organizationId,
          subscriptions: {
            some: {
              status: 'ACTIVE',
              OR: [
                { endDate: { gte: new Date() } }, // Plano ainda válido
                { endDate: null }, // Plano sem data de término
              ],
            },
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              plan: { select: { name: true } },
            },
          },
          attendances: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, status: true },
          },
        },
      });

      // Filtrar apenas quem não tem attendance recente
      const result = students
        .filter((student) => {
          const lastAttendance = student.attendances.find(a => a.status === 'PRESENT');
          const lastAttendanceDate = lastAttendance?.createdAt;
          return !lastAttendanceDate || dayjs(lastAttendanceDate).isBefore(cutoffDate);
        })
        .map((student) => {
          const lastAttendance = student.attendances.find(a => a.status === 'PRESENT');
          const lastAttendanceDate = lastAttendance?.createdAt || null;
          const daysAgo = lastAttendanceDate
            ? dayjs().diff(dayjs(lastAttendanceDate), 'day')
            : 999;

          const firstName = student.user.firstName || '';
          const lastName = student.user.lastName || '';

          return {
            id: student.id,
            name: `${firstName} ${lastName}`.trim(),
            avatar: student.user.avatarUrl || undefined,
            planName:
              student.subscriptions[0]?.plan?.name || 'Plano Ativo',
            planExpiresAt: student.subscriptions[0]?.endDate || new Date(),
            lastAttendance: lastAttendanceDate,
            daysAgo,
            contactEmail: student.user.email || undefined,
            contactPhone: student.user.phone || undefined,
          };
        })
        .sort((a, b) => b.daysAgo - a.daysAgo); // Mais tempo sem aparecer primeiro

      return result;
    } catch (error) {
      logger.error('Error fetching students missing with active plans:', error);
      return [];
    }
  }
}

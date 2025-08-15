import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { QRCodeService } from '@/utils/qrcode';
import { CheckInInput, AttendanceHistoryQuery, UpdateAttendanceInput, AttendanceStatsQuery } from '@/schemas/attendance';
import { AttendanceStatus, CheckInMethod, UserRole } from '@/types';
import dayjs from 'dayjs';

export class AttendanceService {
  static async checkInToClass(studentId: string, data: CheckInInput) {
    const { classId, method, location, notes } = data;

    // Verify class exists and is active
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: { schedule: true, courseProgram: true },
    });

    if (!classInfo) {
      throw new Error('Aula não encontrada');
    }

    // Check if class is today and within check-in window
    const now = new Date();
    const classDate = dayjs(classInfo.date);
    const today = dayjs();

    if (!classDate.isSame(today, 'day')) {
      throw new Error('Check-in só é permitido no dia da aula');
    }

    // Check if within check-in window (30 minutes before to 15 minutes after start time)
    const startTime = dayjs(classInfo.startTime);
    const checkInStart = startTime.subtract(30, 'minute');
    const checkInEnd = startTime.add(15, 'minute');
    const currentTime = dayjs();

    if (currentTime.isBefore(checkInStart) || currentTime.isAfter(checkInEnd)) {
      throw new Error('Check-in fora do horário permitido');
    }

    // Verify student exists and is active
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.isActive) {
      throw new Error('Estudante não encontrado ou inativo');
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });

    if (existingAttendance) {
      throw new Error('Check-in já realizado para esta aula');
    }

    // Handle QR Code validation if method is QR_CODE
    if (method === CheckInMethod.QR_CODE && notes) {
      const qrData = QRCodeService.parseQRCode(notes);
      if (!qrData || qrData.classId !== classId) {
        throw new Error('QR Code inválido');
      }

      if (!QRCodeService.isQRCodeValid(qrData.timestamp)) {
        throw new Error('QR Code expirado');
      }
    }

    // Determine attendance status based on check-in time
    let status = AttendanceStatus.PRESENT;
    if (currentTime.isAfter(startTime)) {
      status = AttendanceStatus.LATE;
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        status,
        checkInTime: now,
        checkInMethod: method,
        location,
        notes: method === CheckInMethod.QR_CODE ? 'Check-in via QR Code' : notes,
      },
      include: {
        class: {
          include: {
            courseProgram: true,
            instructor: true,
          },
        },
        student: true,
      },
    });

    // Update class actual students count
    await prisma.class.update({
      where: { id: classId },
      data: {
        actualStudents: {
          increment: 1,
        },
      },
    });

    // Update attendance pattern (async)
    this.updateAttendancePattern(studentId).catch((error) => {
      logger.error({ error, studentId }, 'Failed to update attendance pattern');
    });

    logger.info(
      {
        studentId,
        classId,
        method,
        status,
        checkInTime: now,
      },
      'Student checked in successfully'
    );

    return attendance;
  }

  static async getAttendanceHistory(
    userId: string,
    userRole: UserRole,
    query: AttendanceHistoryQuery
  ) {
    const { page, limit, startDate, endDate, status, classId } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {};

    if (userRole === UserRole.STUDENT) {
      // Students can only see their own attendance
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        throw new Error('Estudante não encontrado');
      }

      whereClause.studentId = student.id;
    } else if (userRole === UserRole.INSTRUCTOR) {
      // Instructors can see attendance for their classes
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor) {
        throw new Error('Instrutor não encontrado');
      }

      whereClause.class = {
        instructorId: instructor.id,
      };
    }
    // Admins can see all attendance (no additional filter)

    // Add date filters
    if (startDate || endDate) {
      whereClause.checkInTime = {};
      if (startDate) {
        whereClause.checkInTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.checkInTime.lte = new Date(endDate);
      }
    }

    // Add status filter
    if (status) {
      whereClause.status = status;
    }

    // Add class filter
    if (classId) {
      whereClause.classId = classId;
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          class: {
            include: {
              courseProgram: {
                select: {
                  name: true,
                  level: true,
                },
              },
              instructor: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          checkInTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where: whereClause }),
    ]);

    return {
      attendances,
      total,
      page,
      limit,
    };
  }

  static async updateAttendance(
    attendanceId: string,
    data: UpdateAttendanceInput,
    userRole: UserRole
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
      throw new Error('Permissões insuficientes');
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { class: true },
    });

    if (!attendance) {
      throw new Error('Registro de presença não encontrado');
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: data.status,
        notes: data.notes,
        checkInTime: data.checkInTime ? new Date(data.checkInTime) : attendance.checkInTime,
      },
      include: {
        student: true,
        class: {
          include: {
            courseProgram: true,
            instructor: true,
          },
        },
      },
    });

    logger.info(
      {
        attendanceId,
        newStatus: data.status,
        updatedBy: userRole,
      },
      'Attendance record updated'
    );

    return updatedAttendance;
  }

  static async getAttendanceStats(query: AttendanceStatsQuery) {
    const { studentId, startDate, endDate, period } = query;

    let dateFilter: any = {};
    
    if (startDate || endDate) {
      dateFilter.checkInTime = {};
      if (startDate) {
        dateFilter.checkInTime.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.checkInTime.lte = new Date(endDate);
      }
    } else {
      // Default to current period if no dates provided
      const now = dayjs();
      switch (period) {
        case 'week':
          dateFilter.checkInTime = {
            gte: now.startOf('week').toDate(),
            lte: now.endOf('week').toDate(),
          };
          break;
        case 'month':
          dateFilter.checkInTime = {
            gte: now.startOf('month').toDate(),
            lte: now.endOf('month').toDate(),
          };
          break;
        case 'quarter':
          dateFilter.checkInTime = {
            gte: now.startOf('quarter').toDate(),
            lte: now.endOf('quarter').toDate(),
          };
          break;
        case 'year':
          dateFilter.checkInTime = {
            gte: now.startOf('year').toDate(),
            lte: now.endOf('year').toDate(),
          };
          break;
      }
    }

    const whereClause = {
      ...dateFilter,
      ...(studentId && { studentId }),
    };

    const [
      totalAttendances,
      presentCount,
      lateCount,
      absentCount,
      attendanceByDay,
    ] = await Promise.all([
      prisma.attendance.count({ where: whereClause }),
      prisma.attendance.count({ where: { ...whereClause, status: AttendanceStatus.PRESENT } }),
      prisma.attendance.count({ where: { ...whereClause, status: AttendanceStatus.LATE } }),
      prisma.attendance.count({ where: { ...whereClause, status: AttendanceStatus.ABSENT } }),
      prisma.attendance.groupBy({
        by: ['checkInTime'],
        where: whereClause,
        _count: true,
        orderBy: {
          checkInTime: 'asc',
        },
      }),
    ]);

    const attendanceRate = totalAttendances > 0 ? (presentCount + lateCount) / totalAttendances * 100 : 0;

    return {
      total: totalAttendances,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      attendanceByDay: attendanceByDay.map(item => ({
        date: dayjs(item.checkInTime).format('YYYY-MM-DD'),
        count: item._count,
      })),
    };
  }

  private static async updateAttendancePattern(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        attendances: {
          orderBy: { checkInTime: 'desc' },
          take: 50, // Last 50 attendances for pattern analysis
        },
      },
    });

    if (!student) return;

    const attendances = student.attendances;
    const totalClasses = attendances.length;
    const attendedClasses = attendances.filter(
      a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length;
    
    const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    // Calculate consecutive absences
    let consecutiveAbsences = 0;
    for (const attendance of attendances) {
      if (attendance.status === AttendanceStatus.ABSENT) {
        consecutiveAbsences++;
      } else {
        break;
      }
    }

    // Calculate preferred days (most frequent days of the week)
    const dayFrequency: { [key: number]: number } = {};
    attendances.forEach(attendance => {
      if (attendance.checkInTime) {
        const dayOfWeek = dayjs(attendance.checkInTime).day();
        dayFrequency[dayOfWeek] = (dayFrequency[dayOfWeek] || 0) + 1;
      }
    });

    const preferredDays = Object.entries(dayFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[parseInt(day)];
      });

    // Calculate average check-in time
    const checkInTimes = attendances
      .filter(a => a.checkInTime)
      .map(a => dayjs(a.checkInTime!));
    
    let averageCheckInTime = '';
    if (checkInTimes.length > 0) {
      const totalMinutes = checkInTimes.reduce((sum, time) => {
        return sum + time.hour() * 60 + time.minute();
      }, 0);
      const avgMinutes = Math.round(totalMinutes / checkInTimes.length);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
      averageCheckInTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Determine recent trend (last 10 classes)
    const recentAttendances = attendances.slice(0, 10);
    const recentAttendanceRate = recentAttendances.length > 0 
      ? (recentAttendances.filter(a => a.status !== AttendanceStatus.ABSENT).length / recentAttendances.length) * 100
      : 0;

    let recentTrend = 'STABLE';
    if (recentAttendanceRate > attendanceRate + 10) {
      recentTrend = 'IMPROVING';
    } else if (recentAttendanceRate < attendanceRate - 10) {
      recentTrend = 'DECLINING';
    }

    // Update or create attendance pattern
    await prisma.attendancePattern.upsert({
      where: { studentId },
      update: {
        totalClasses,
        attendedClasses,
        attendanceRate,
        consecutiveAbsences,
        averageCheckInTime,
        preferredDays,
        recentTrend,
        lastCalculated: new Date(),
      },
      create: {
        studentId,
        totalClasses,
        attendedClasses,
        attendanceRate,
        consecutiveAbsences,
        averageCheckInTime,
        preferredDays,
        recentTrend,
      },
    });

    logger.info({ studentId, attendanceRate, recentTrend }, 'Attendance pattern updated');
  }
}
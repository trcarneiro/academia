import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { QRCodeService } from '@/utils/qrcode';
import { CheckInInput, AttendanceHistoryQuery, UpdateAttendanceInput, AttendanceStatsQuery } from '@/schemas/attendance';
import { AttendanceStatus, CheckInMethod, UserRole, ClassStatus } from '@/types';
import dayjs from 'dayjs';

export class AttendanceService {
  static async checkInToClass(studentId: string, data: CheckInInput) {
    const { classId, method, location, notes } = data;

    // Verify class exists and is active
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: { schedule: true, course: true },
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
            course: true,
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
              course: {
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
            course: true,
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

  static async findStudentByRegistration(registrationNumber: string) {
    // Try to find by registration number first
    let student = await prisma.student.findFirst({
      where: {
        registrationNumber: registrationNumber,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // If not found by registration, try to find by name (partial match)
    if (!student) {
      const searchTerm = registrationNumber.toLowerCase();
      
      student = await prisma.student.findFirst({
        where: {
          isActive: true,
          user: {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                // Full name search (first + last)
                AND: [
                  {
                    OR: [
                      { firstName: { contains: searchTerm.split(' ')[0] || '', mode: 'insensitive' } },
                      { lastName: { contains: searchTerm.split(' ')[0] || '', mode: 'insensitive' } },
                    ],
                  },
                  searchTerm.split(' ').length > 1 ? {
                    OR: [
                      { firstName: { contains: searchTerm.split(' ')[1] || '', mode: 'insensitive' } },
                      { lastName: { contains: searchTerm.split(' ')[1] || '', mode: 'insensitive' } },
                    ],
                  } : {},
                ],
              },
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });
    }

    if (!student) {
      return null;
    }

    // Create a simple, serializable object
    const result = {
      id: (student as any).id,
      registrationNumber: (student as any).registrationNumber,
      user: {
        id: (student as any).user.id,
        firstName: (student as any).user.firstName,
        lastName: (student as any).user.lastName,
        email: (student as any).user.email,
        avatarUrl: (student as any).user.avatarUrl || null,
      },
      enrollments: (student as any).enrollments || [],
      graduationLevel: (student as any).graduationLevel || null,
      joinDate: (student as any).createdAt ? new Date((student as any).createdAt).toISOString() : null,
      searchedBy: (student as any).registrationNumber === registrationNumber ? 'registration' : 'name',
    };

    return result;
  }

  static async getAvailableClasses(studentId?: string) {
    const now = new Date();
    const today = dayjs();
    const startOfDay = today.startOf('day').toDate();
    const endOfDay = today.endOf('day').toDate();

    // Get classes for today
    const classes = await prisma.class.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS]
        },
      },
      include: {
        schedule: true,
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            name: true,
            level: true,
          },
        },
        attendances: studentId ? {
          where: { studentId },
        } : false,
      },
    });

    return classes.map(classInfo => {
      const hasCheckedIn = studentId && classInfo.attendances?.length > 0;
      const startTime = dayjs(classInfo.startTime);
      const checkInStart = startTime.subtract(30, 'minute');
      const checkInEnd = startTime.add(15, 'minute');
      const currentTime = dayjs();
      
      const canCheckIn = !hasCheckedIn && 
        currentTime.isAfter(checkInStart) && 
        currentTime.isBefore(checkInEnd);

      return {
        id: classInfo.id,
        name: classInfo.title || classInfo.course?.name,
        startTime: classInfo.startTime,
        endTime: classInfo.endTime,
        instructor: classInfo.instructor ? {
          name: `${classInfo.instructor.user.firstName} ${classInfo.instructor.user.lastName}`,
        } : null,
        course: classInfo.course,
        capacity: classInfo.maxStudents,
        enrolled: classInfo.attendances?.length || 0,
        canCheckIn,
        hasCheckedIn,
        status: hasCheckedIn ? 'CHECKED_IN' : 
               canCheckIn ? 'AVAILABLE' : 
               currentTime.isBefore(checkInStart) ? 'NOT_YET' : 'EXPIRED',
      };
    });
  }

  static async getStudentDashboard(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error('Aluno não encontrado');
    }

    // Get recent attendance (last 10)
    const recentAttendances = await prisma.attendance.findMany({
      where: { studentId },
      take: 10,
      orderBy: { checkInTime: 'desc' },
      include: {
        class: {
          select: {
            title: true,
            date: true,
            startTime: true,
          },
        },
      },
    });

    // Get attendance stats for current month
    const currentMonth = dayjs().startOf('month');
    const attendanceStats = await prisma.attendance.count({
      where: {
        studentId,
        checkInTime: {
          gte: currentMonth.toDate(),
        },
        status: AttendanceStatus.PRESENT,
      },
    });

    // Get total classes this month
    const totalClassesThisMonth = await prisma.class.count({
      where: {
        date: {
          gte: currentMonth.toDate(),
          lte: dayjs().endOf('month').toDate(),
        },
        status: {
          in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS, ClassStatus.COMPLETED]
        },
      },
    });

    // Get next classes (upcoming 5)
    const upcomingClasses = await prisma.class.findMany({
      where: {
        date: {
          gte: new Date(),
        },
        status: {
          in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS]
        },
      },
      take: 5,
      orderBy: { date: 'asc' },
      include: {
        schedule: true,
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        avatar: student.user.avatar || null,
        registrationNumber: student.registrationNumber,
        graduationLevel: student.graduationLevel || null,
        joinDate: student.createdAt,
      },
      stats: {
        attendanceThisMonth: attendanceStats,
        totalClassesThisMonth,
        attendanceRate: totalClassesThisMonth > 0 ? 
          Math.round((attendanceStats / totalClassesThisMonth) * 100) : 0,
      },
      recentAttendances: recentAttendances.map(att => ({
        id: att.id,
        className: att.class.title || 'Aula sem título',
        date: att.class.date,
        checkInTime: att.checkInTime,
        status: att.status,
      })),
      upcomingClasses: upcomingClasses.map(cls => ({
        id: cls.id,
        name: cls.title || cls.course?.name || 'Aula sem título',
        date: cls.date,
        startTime: cls.startTime,
        instructor: cls.instructor ? 
          `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}` : 
          'Instrutor não definido',
      })),
      enrollments: student.enrollments.map(enrollment => ({
        course: enrollment.package.name,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
        isActive: enrollment.isActive,
      })),
    };
  }

  static async searchStudents(query: string, limit: number = 10) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
      return [];
    }

    const students = await prisma.student.findMany({
      where: {
        isActive: true,
        OR: [
          {
            registrationNumber: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            user: {
              OR: [
                {
                  firstName: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      take: limit,
      orderBy: [
        {
          // Prioritize exact registration number matches
          registrationNumber: 'asc',
        },
        {
          user: {
            firstName: 'asc',
          },
        },
      ],
    });

    return students.map(student => ({
      id: student.id,
      registrationNumber: student.registrationNumber,
      name: `${student.user.firstName} ${student.user.lastName}`,
      email: student.user.email,
      avatar: student.user.avatar,
      graduationLevel: student.graduationLevel,
      matchType: student.registrationNumber.toLowerCase().includes(searchTerm) 
        ? 'registration' 
        : 'name',
    }));
  }

  static async getAllActiveStudents() {
    const students = await prisma.student.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        {
          registrationNumber: 'asc',
        },
        {
          user: {
            firstName: 'asc',
          },
        },
      ],
    });

    return students.map(student => ({
      id: student.id,
      registrationNumber: student.registrationNumber,
      name: `${student.user.firstName} ${student.user.lastName}`,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      avatar: student.user.avatar,
      graduationLevel: student.graduationLevel,
      // Pre-computed search strings for faster client-side filtering
      searchString: [
        student.registrationNumber,
        student.user.firstName.toLowerCase(),
        student.user.lastName.toLowerCase(),
        student.user.email.toLowerCase(),
        `${student.user.firstName} ${student.user.lastName}`.toLowerCase()
      ].join(' '),
    }));
  }
}

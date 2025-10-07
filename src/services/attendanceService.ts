import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { QRCodeService } from '@/utils/qrcode';
import { CheckInInput, AttendanceHistoryQuery, UpdateAttendanceInput, AttendanceStatsQuery } from '@/schemas/attendance';
import { AttendanceStatus, CheckInMethod, UserRole, ClassStatus } from '@/types';
import { EnrollmentStatus, SubscriptionStatus } from '@prisma/client';
import dayjs from 'dayjs';

export class AttendanceService {
  // Helper: course eligibility for a student based on active enrollments and active turma associations
  private static async getEligibleCourseIds(studentId: string): Promise<string[]> {
    try {
      const [studentCourses, turmaLinks] = await Promise.all([
        // ✅ FIX: Use StudentCourse (correct table) instead of CourseEnrollment (legacy)
        prisma.studentCourse.findMany({
          where: { 
            studentId, 
            status: EnrollmentStatus.ACTIVE,
            isActive: true 
          },
          select: { courseId: true },
        }),
        prisma.turmaStudent.findMany({
          where: { studentId, isActive: true },
          select: {
            turma: {
              select: {
                courseId: true,
                courses: { select: { courseId: true } },
              },
            },
          },
        }),
      ]);

      const courseIds = new Set<string>();
      // Add courses from StudentCourse table
      studentCourses.forEach((sc) => sc.courseId && courseIds.add(sc.courseId));
      // Add courses from Turma associations
      turmaLinks.forEach((ts) => {
        const t: any = ts.turma;
        if (!t) return;
        if (t.courseId) courseIds.add(t.courseId);
        (t.courses || []).forEach((c: any) => c?.courseId && courseIds.add(c.courseId));
      });

      return Array.from(courseIds);
    } catch (err) {
      logger.warn({ err, studentId }, 'Failed to derive eligible course IDs');
      return [];
    }
  }
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

    // If student provided, restrict classes by eligible courses
    let eligibleCourseIds: string[] = [];
    if (studentId) {
      eligibleCourseIds = await this.getEligibleCourseIds(studentId);
    }

    // 🔍 DEBUG: Log date filters
    logger.info('🔍 [DEBUG] getAvailableClasses filters', {
      now: now.toISOString(),
      today: today.format('YYYY-MM-DD HH:mm:ss'),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      studentId,
      eligibleCourseIds,
      eligibleCoursesCount: eligibleCourseIds.length
    });

    // ✅ BUSCAR EM TURMALESSON (aulas de Turmas) - onde as aulas realmente estão!
    const turmaLessons = await prisma.turmaLesson.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
        status: 'SCHEDULED', // ✅ CORRIGIDO: Apenas SCHEDULED (TurmaStatus válido)
        // Filtrar por curso se aluno fornecido
        ...(studentId && eligibleCourseIds.length > 0
          ? {
              turma: {
                courseId: { in: eligibleCourseIds },
              },
            }
          : {}),
      },
      include: {
        turma: {
          include: {
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
          },
        },
        attendances: studentId
          ? {
              where: { studentId },
            }
          : false,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    // 🔍 DEBUG: Log TurmaLessons found
    logger.info('🔍 [DEBUG] TurmaLessons found from database', {
      turmaLessonsCount: turmaLessons.length,
      turmaLessons: turmaLessons.map((t) => ({
        id: t.id,
        title: t.title,
        scheduledDate: t.scheduledDate?.toISOString(),
        status: t.status,
        turmaId: t.turmaId,
        courseId: t.turma.courseId,
      })),
    });

    // Mapear TurmaLessons para o formato esperado
    return turmaLessons.map((turmaLesson) => {
      const hasCheckedIn = studentId && turmaLesson.attendances && turmaLesson.attendances.length > 0;
      const startTime = dayjs(turmaLesson.scheduledDate);
      const checkInStart = startTime.subtract(60, 'minute'); // ✅ 1 hora antes da aula
      const checkInEnd = startTime.add(15, 'minute');
      const currentTime = dayjs();

      const canCheckIn =
        !hasCheckedIn &&
        currentTime.isAfter(checkInStart) &&
        currentTime.isBefore(checkInEnd);

      return {
        id: turmaLesson.id,
        name: turmaLesson.title || turmaLesson.turma.course?.name || 'Aula',
        startTime: turmaLesson.scheduledDate,
        endTime: dayjs(turmaLesson.scheduledDate).add(turmaLesson.duration || 60, 'minute').toDate(),
        instructor: turmaLesson.turma.instructor
          ? {
              name: `${turmaLesson.turma.instructor.user.firstName} ${turmaLesson.turma.instructor.user.lastName}`,
            }
          : null,
        course: turmaLesson.turma.course,
        capacity: null, // TurmaLesson não tem capacity
        enrolled: turmaLesson.attendances ? turmaLesson.attendances.length : 0,
        canCheckIn,
        hasCheckedIn,
        status: hasCheckedIn
          ? 'CHECKED_IN'
          : canCheckIn
          ? 'AVAILABLE'
          : currentTime.isBefore(checkInStart)
          ? 'NOT_YET'
          : 'EXPIRED',
      };
    });
  }

  static async getStudentDashboard(studentId: string) {
    // Fetch student basic profile first
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        // 🔥 FIX: Use correct relation name 'studentCourses' instead of 'enrollments'
        studentCourses: { 
          include: { 
            course: { 
              select: { id: true, name: true, level: true }
            } 
          } 
        },
      },
    });

    if (!student) {
      throw new Error('Aluno não encontrado');
    }

    // 🔥 DEBUG: Log ALL studentCourses found (without filter)
    logger.info({ 
      studentId, 
      studentCoursesFound: student.studentCourses?.length || 0,
      studentCourses: student.studentCourses?.map(e => ({ 
        courseId: e.course.id, 
        courseName: e.course.name,
        status: (e as any).status,
        isActive: (e as any).isActive
      }))
    }, '🔍 [DEBUG] StudentCourses loaded from database (correct relation)');

    // Parallel with resilience: allow partial failures without aborting the whole dashboard
    const currentMonth = dayjs().startOf('month');
    const settled = await Promise.allSettled([
      prisma.attendance.findMany({
        where: { studentId },
        take: 10,
        orderBy: { checkInTime: 'desc' },
        include: { class: { select: { title: true, date: true, startTime: true } } },
      }),
      prisma.attendance.count({
        where: { studentId, checkInTime: { gte: currentMonth.toDate() }, status: AttendanceStatus.PRESENT },
      }),
      prisma.class.count({
        where: {
          date: { gte: currentMonth.toDate(), lte: dayjs().endOf('month').toDate() },
          status: { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS, ClassStatus.COMPLETED] },
        },
      }),
      (async () => {
        try {
          const nowTs = new Date();
          const [overduePayments, pendingPayments, lastPaid] = await Promise.all([
            prisma.payment.findMany({ where: { studentId, status: 'PENDING', dueDate: { lt: nowTs } }, select: { amount: true, dueDate: true } }),
            prisma.payment.findMany({ where: { studentId, status: 'PENDING', dueDate: { gte: nowTs } }, select: { amount: true, dueDate: true }, orderBy: { dueDate: 'asc' }, take: 1 }),
            prisma.payment.findFirst({ where: { studentId, status: 'PAID' }, orderBy: { paidDate: 'desc' }, select: { amount: true, paidDate: true, description: true } }),
          ]);
          return { overduePayments, pendingPayments, lastPaid };
        } catch (e) {
          logger.warn({ e, studentId }, 'Payments lookup failed; continuing with empty payments');
          return { overduePayments: [], pendingPayments: [], lastPaid: null } as any;
        }
      })(),
      (async () => {
        try {
          return await prisma.studentSubscription.findFirst({
            where: { 
              studentId, 
              status: SubscriptionStatus.ACTIVE,
              isActive: true
            },
            include: { plan: { select: { id: true, name: true, billingType: true, classesPerWeek: true, hasPersonalTraining: true, hasNutrition: true } } },
            orderBy: { createdAt: 'desc' },
          });
        } catch (e) {
          logger.warn({ e, studentId }, 'Subscription lookup failed; continuing without plan');
          return null as any;
        }
      })(),
      this.getEligibleCourseIds(studentId),
      (async () => {
        try {
          return await prisma.turmaStudent.findMany({ where: { studentId, isActive: true }, select: { turmaId: true } });
        } catch (e) {
          logger.warn({ e, studentId }, 'Turma links lookup failed; assuming none');
          return [] as any[];
        }
      })(),
      (async () => {
        try {
          return await prisma.turmaStudent.findFirst({
            where: { studentId, isActive: true },
            include: { turma: { include: { courses: { include: { course: true } } } } },
            orderBy: { createdAt: 'desc' },
          });
        } catch (e) {
          logger.warn({ e, studentId }, 'Turma enrollment lookup failed; continuing without turma');
          return null as any;
        }
      })(),
    ]);

    const get = <T>(idx: number, def: T): T => {
      const r = settled[idx];
      if (!r) return def;
      if (r.status === 'fulfilled') {
        return r.value as T;
      }
      return def;
    };

    const recentAttendances = get<any[]>(0, []);
    const attendanceStats = get<number>(1, 0);
    const totalClassesThisMonth = get<number>(2, 0);
    const paymentsTuple = get<{ overduePayments: any[]; pendingPayments: any[]; lastPaid: any | null }>(3, { overduePayments: [], pendingPayments: [], lastPaid: null });
    const subscription = get<any | null>(4, null);
    const eligibleCourseIds = get<string[]>(5, []);
    const studentTurmas = get<any[]>(6, []);
    const turmaEnrollment = get<any | null>(7, null);

    // Debug logs para auditoria
    logger.info({ 
      studentId, 
      enrollmentsCount: student.studentCourses?.length || 0,
      hasPlan: !!subscription,
      planName: subscription?.plan?.name,
      eligibleCourseIds: eligibleCourseIds.length,
      studentTurmasCount: studentTurmas.length,
      hasTurmaEnrollment: !!turmaEnrollment
    }, '📊 Dashboard data loaded');

    // Unlimited plan support: if plan is unlimited and no explicit course enrollments, allow all courses
    const unlimitedPlan = !!(subscription && (
      subscription.billingType === 'UNLIMITED' ||
      subscription.isActive === true ||
      (subscription.plan?.name && String(subscription.plan.name).toLowerCase().includes('ilimit'))
    ));

    logger.info({ unlimitedPlan, billingType: subscription?.billingType }, '🔓 Plan type detection');

  // Determine eligibility upfront (already fetched in parallel)

    // Next classes (up to 5), filtered by eligibility
  let upcomingClasses: any[] = [];
    try {
      const classWhere: any = {
        date: { gte: new Date() },
        status: { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS] },
      };

      // Se não é plano ilimitado E tem courseIds elegíveis, filtrar por eles
      if (!unlimitedPlan && eligibleCourseIds.length > 0) {
        classWhere.courseId = { in: eligibleCourseIds };
      }

      upcomingClasses = await prisma.class.findMany({
        where: classWhere,
        take: 5,
        orderBy: { date: 'asc' },
        include: {
          instructor: { include: { user: { select: { firstName: true, lastName: true } } } },
          course: { select: { id: true, name: true } },
        },
      });

      logger.info({ 
        studentId, 
        upcomingClassesCount: upcomingClasses.length,
        unlimitedPlan,
        eligibleCourseIds: eligibleCourseIds.length 
      }, '📅 Upcoming classes loaded');
    } catch (e) {
      logger.warn({ e, studentId }, 'Upcoming classes query failed; continuing empty');
    }

    let upcomingTurmaLessons: any[] = [];
    if (studentTurmas.length > 0) {
      try {
        const turmaIds = studentTurmas.map((t: any) => t.turmaId);
        upcomingTurmaLessons = await prisma.turmaLesson.findMany({
          where: {
            turmaId: { in: turmaIds },
            scheduledDate: { gte: new Date() },
            status: 'SCHEDULED',
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
          include: {
            turma: {
              include: {
                instructor: { select: { firstName: true, lastName: true } },
                course: { select: { id: true, name: true } },
              },
            },
          },
        });
      } catch (e) {
        logger.warn({ e, studentId }, 'Upcoming turma lessons query failed; continuing empty');
      }
    }

    // Fallback: if the student isn't linked to a turma (or too few upcoming), derive by eligible courses
    if (upcomingTurmaLessons.length < 5 && (eligibleCourseIds.length > 0 || unlimitedPlan)) {
      try {
        const fill = 5 - upcomingTurmaLessons.length;
        // Find turmas matching eligible courses (or any if unlimited)
        const turmasByCourse = await prisma.turma.findMany({
          where: {
            ...(unlimitedPlan || eligibleCourseIds.length === 0
              ? {}
              : { OR: [
                  { courseId: { in: eligibleCourseIds } },
                  { courses: { some: { courseId: { in: eligibleCourseIds } } } as any },
                ]
                }
            ),
            status: { in: ['SCHEDULED', 'ACTIVE', 'RESCHEDULED'] as any },
            isActive: true as any,
          },
          select: { id: true },
          take: 10,
        });

        const turmaIdsByCourse = turmasByCourse.map((t) => t.id);
        if (turmaIdsByCourse.length > 0) {
          const extraLessons = await prisma.turmaLesson.findMany({
            where: {
              turmaId: { in: turmaIdsByCourse },
              scheduledDate: { gte: new Date() },
              status: 'SCHEDULED',
            },
            orderBy: { scheduledDate: 'asc' },
            take: fill,
            include: {
              turma: {
                include: {
                  instructor: { select: { firstName: true, lastName: true } },
                  course: { select: { id: true, name: true } },
                },
              },
            },
          });

          // Merge without duplicates
          const seen = new Set(upcomingTurmaLessons.map((l: any) => l.id));
          for (const l of extraLessons) {
            if (!seen.has(l.id)) {
              upcomingTurmaLessons.push(l);
              seen.add(l.id);
            }
          }
        }
      } catch (e) {
        logger.warn({ e, studentId }, 'Fallback turma lessons query failed; continuing');
      }
    }

    // Payments summary
  const { overduePayments, pendingPayments, lastPaid } = paymentsTuple;

    const overdueAmount = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const nextDue = pendingPayments[0]?.dueDate || null;

    // Get current active subscription/plan
  // subscription already loaded

    // Derive current course and turma
  const currentEnrollment = student.studentCourses?.[0];
    let currentCourse = currentEnrollment?.course ? {
      id: currentEnrollment.course.id,
      name: currentEnrollment.course.name,
      level: (currentEnrollment.course as any).level ?? null,
    } : null;

    // If course missing, try from active turma enrollment
  // turmaEnrollment already loaded

    const currentTurma = turmaEnrollment?.turma ? {
      id: turmaEnrollment.turma.id,
      name: turmaEnrollment.turma.name,
      status: turmaEnrollment.turma.status,
      startDate: turmaEnrollment.turma.startDate,
      endDate: turmaEnrollment.turma.endDate,
    } : null;

    if (!currentCourse && turmaEnrollment?.turma?.courses?.length) {
      const c = turmaEnrollment.turma.courses[0].course;
      currentCourse = c ? { id: c.id, name: c.name, level: (c as any).level ?? null } : null;
    }

    return {
      student: {
        name: `${student.user.firstName} ${student.user.lastName}`,
  avatar: (student.user as any).avatarUrl || null,
        registrationNumber: student.registrationNumber,
  graduationLevel: (student as any).graduationLevel || null,
        joinDate: student.createdAt,
      },
      plan: subscription ? {
        id: subscription.planId,
        name: subscription.plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        billingType: subscription.billingType,
        nextBillingDate: subscription.nextBillingDate,
        isActive: subscription.isActive,
        classesPerWeek: subscription.plan.classesPerWeek,
      } : null,
  currentCourse,
  currentTurma,
      payments: {
        overdueCount: overduePayments.length,
        overdueAmount,
        lastPayment: lastPaid ? {
          amount: Number(lastPaid.amount),
          paidDate: lastPaid.paidDate,
          description: lastPaid.description,
        } : null,
        nextDueDate: nextDue,
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
  upcomingClasses: [
        // From Class model
        ...upcomingClasses.map(cls => ({
          id: cls.id,
          name: cls.title || cls.course?.name || 'Aula sem título',
          date: cls.date,
          startTime: cls.startTime,
          instructor: cls.instructor ? 
            `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}` : 
            'Instrutor não definido',
        })),
        // From TurmaLesson model
        ...upcomingTurmaLessons.map(les => ({
          id: les.id,
          name: les.title || les.turma?.course?.name || les.turma?.name || 'Aula da turma',
          date: les.scheduledDate,
          startTime: les.scheduledDate,
          instructor: les.turma?.instructor ? 
            `${les.turma.instructor.firstName} ${les.turma.instructor.lastName}` : 
            'Instrutor não definido',
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5),
      // 🔥 FIX: Filter ACTIVE studentCourses manually and map with proper fields
      enrollments: student.studentCourses
        .filter(e => (e as any).status === 'ACTIVE' && (e as any).isActive === true)
        .map(enrollment => ({
          course: enrollment.course?.name,
          courseId: enrollment.course?.id,
          courseLevel: (enrollment.course as any)?.level || null,
          startDate: (enrollment as any).startDate ?? null,
          endDate: (enrollment as any).endDate ?? null,
          status: (enrollment as any).status,
          isActive: (enrollment as any).isActive ?? true,
        })),
    };
  }

  static async searchStudents(query: string, limit: number = 10) {
    try {
      const searchTerm = query?.toLowerCase()?.trim();
      
      if (!searchTerm || searchTerm.length < 2) {
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
          // 🔥 FIX: Use correct relation 'studentCourses' instead of 'enrollments'
          studentCourses: {
            where: {
              status: 'ACTIVE',
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                },
              },
            },
          },
          // 🔥 FIX: Include subscriptions to show plan info in kiosk
          subscriptions: {
            where: {
              status: 'ACTIVE',
              endDate: {
                gte: new Date(),
              },
            },
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              package: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              endDate: 'desc',
            },
            take: 1,
          },
        },
        take: limit,
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
        registrationNumber: student.registrationNumber || 'N/A',
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        avatar: student.user.avatarUrl,
        matchType: student.registrationNumber?.toLowerCase().includes(searchTerm) 
          ? 'registration' 
          : 'name',
        // 🔥 FIX: Add enrollment and subscription info for kiosk
        hasActiveEnrollment: student.studentCourses && student.studentCourses.length > 0,
        enrollments: student.studentCourses?.map(e => ({
          courseId: e.course.id,
          courseName: e.course.name,
          courseLevel: e.course.level,
          status: e.status,
        })) || [],
        hasActivePlan: student.subscriptions && student.subscriptions.length > 0,
        activePlan: student.subscriptions?.[0] ? {
          id: student.subscriptions[0].id,
          name: student.subscriptions[0].package.name,
          status: student.subscriptions[0].status,
          startDate: student.subscriptions[0].startDate,
          endDate: student.subscriptions[0].endDate,
        } : null,
      }));
    } catch (error) {
      logger.error({ error, query }, 'Error in searchStudents');
      return [];
    }
  }

  static async findStudentById(studentId: string) {
    try {
      const student = await prisma.student.findUnique({
        where: {
          id: studentId,
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
      });

      if (!student) {
        return null;
      }

      return {
        id: student.id,
        registrationNumber: student.registrationNumber || 'N/A',
        name: `${student.user.firstName} ${student.user.lastName}`,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        avatar: student.user.avatarUrl,
        userId: student.userId,
        category: student.category,
        isActive: student.isActive,
      };
    } catch (error) {
      logger.error({ error, studentId }, 'Error in findStudentById');
      return null;
    }
  }

  static async getAllActiveStudents() {
    try {
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
        registrationNumber: student.registrationNumber || 'N/A',
        name: `${student.user.firstName} ${student.user.lastName}`,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        avatar: student.user.avatarUrl,
        // Pre-computed search strings for faster client-side filtering
        searchString: [
          student.registrationNumber || '',
          student.user.firstName?.toLowerCase() || '',
          student.user.lastName?.toLowerCase() || '',
          student.user.email?.toLowerCase() || '',
          `${student.user.firstName} ${student.user.lastName}`.toLowerCase()
        ].join(' '),
      }));
    } catch (error) {
      logger.error({ error }, 'Error in getAllActiveStudents');
      return [];
    }
  }
}

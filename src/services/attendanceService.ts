import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { QRCodeService } from '@/utils/qrcode';
import { CheckInInput, AttendanceHistoryQuery, UpdateAttendanceInput, AttendanceStatsQuery } from '@/schemas/attendance';
import { AttendanceStatus, CheckInMethod, UserRole, ClassStatus } from '@/types';
import { EnrollmentStatus, SubscriptionStatus, AttendanceTrend } from '@prisma/client';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

export class AttendanceService {
  // Helper: course eligibility for a student based on active enrollments and active turma associations
  private static async getEligibleCourseIds(studentId: string): Promise<string[]> {
    try {
      const [studentCourses, turmaLinks] = await Promise.all([
        // âœ… FIX: Use StudentCourse (correct table) instead of CourseEnrollment (legacy)
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

    // âœ… DETECTAR TIPO DE AULA: Class (legacy) ou TurmaLesson (novo)
    let classInfo: any = null;
    let isTurmaLesson = false;

    // Tentar buscar como Class primeiro
    classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: { schedule: true, course: true },
    });

    // Se nÃ£o encontrou em Class, buscar em TurmaLesson
    if (!classInfo) {
      const turmaLesson = await prisma.turmaLesson.findUnique({
        where: { id: classId },
        include: {
          turma: {
            include: {
              course: true,
              instructor: { select: { firstName: true, lastName: true } },
            },
          },
          lessonPlan: true,
        },
      });

      if (turmaLesson) {
        isTurmaLesson = true;
        // Mapear TurmaLesson para formato Class (compatibilidade)
        classInfo = {
          id: turmaLesson.id,
          date: turmaLesson.scheduledDate,
          startTime: turmaLesson.scheduledDate,
          endTime: dayjs(turmaLesson.scheduledDate).add(turmaLesson.duration || 60, 'minute').toDate(),
          course: turmaLesson.turma.course,
          instructor: turmaLesson.turma.instructor,
          status: turmaLesson.status,
        };
      }
    }

    if (!classInfo) {
      throw new Error('Aula nÃ£o encontrada');
    }

    // Check if class is today and within check-in window
    const now = new Date();
    const classDate = dayjs(classInfo.date);
    const today = dayjs();

    if (!classDate.isSame(today, 'day')) {
      throw new Error('Check-in sÃ³ Ã© permitido no dia da aula');
    }

    // Check if within check-in window (30 minutes before to 15 minutes after start time)
    const startTime = dayjs(classInfo.startTime);
    const checkInStart = startTime.subtract(30, 'minute');
    const checkInEnd = startTime.add(15, 'minute');
    const currentTime = dayjs();

    if (currentTime.isBefore(checkInStart) || currentTime.isAfter(checkInEnd)) {
      throw new Error('Check-in fora do horÃ¡rio permitido');
    }

    // Verify student exists and is active
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.isActive) {
      throw new Error('Estudante nÃ£o encontrado ou inativo');
    }

    // âš ï¸ CRITICAL: Check for conflicting check-ins (prevent overlapping class attendance)
    const currentClassStart = startTime.toDate();
    const currentClassEnd = startTime.add(classInfo.duration || 60, 'minute').toDate();

    // Get all check-ins for this student today
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const existingCheckIns = await prisma.turmaAttendance.findMany({
      where: {
        studentId: studentId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        lesson: {
          select: {
            scheduledDate: true,
            duration: true,
            turma: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Check for time overlap: (currentStart < existingEnd) AND (currentEnd > existingStart)
    for (const existingCheckIn of existingCheckIns) {
      if (existingCheckIn.lesson) {
        const existingStart = dayjs(existingCheckIn.lesson.scheduledDate);
        const existingEnd = existingStart.add(existingCheckIn.lesson.duration || 60, 'minute');
        
        // Check overlap: (currentStart < existingEnd) AND (currentEnd > existingStart)
        if (startTime.isBefore(existingEnd.toDate()) && dayjs(currentClassEnd).isAfter(existingStart.toDate())) {
          return {
            allowed: false,
            reason: 'OVERLAP',
            message: `Conflito: vocÃª jÃ¡ tem check-in na aula "${existingCheckIn.lesson.turma.name}" que termina Ã s ${existingEnd.format('HH:mm')}`,
            existingCheckIn: {
              classId: existingCheckIn.lessonId,
              className: existingCheckIn.lesson.turma.name,
              startTime: existingStart.toISOString(),
              endTime: existingEnd.toISOString(),
            },
          };
        }
      }
    }
    // âš ï¸ RATE LIMITING: Prevent spam/abuse (max 3 check-ins per minute)
    const oneMinuteAgo = dayjs().subtract(1, 'minute').toDate();
    const recentCheckIns = existingCheckIns.filter(checkIn => 
      dayjs(checkIn.createdAt).isAfter(oneMinuteAgo)
    );

    if (recentCheckIns.length >= 3) {
      throw new Error(
        'Limite de check-ins atingido. Aguarde um minuto antes de tentar novamente.'
      );
    }

    // Determine attendance status based on check-in time
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (currentTime.isAfter(startTime)) {
      status = AttendanceStatus.LATE;
    }

    // âœ… CRIAR ATTENDANCE: TurmaAttendance (novo) ou Attendance (legacy)
    let attendance: any;

    if (isTurmaLesson) {
      // âœ… CHECK-IN EM TURMALESSON (sistema novo) - criar TurmaAttendance
      
      // Buscar turmaId da TurmaLesson
      const turmaLesson = await prisma.turmaLesson.findUnique({
        where: { id: classId },
        select: { turmaId: true },
      });

      if (!turmaLesson) {
        throw new Error('TurmaLesson nÃ£o encontrada');
      }

      // Verificar se jÃ¡ fez check-in (antes de criar TurmaStudent)
      const existingTurmaAttendance = await prisma.turmaAttendance.findUnique({
        where: {
          turmaLessonId_studentId: {
            turmaLessonId: classId,
            studentId: studentId,
          },
        },
      });

      if (existingTurmaAttendance) {
        throw new Error('Check-in jÃ¡ realizado para esta aula');
      }

      // Verificar se aluno estÃ¡ matriculado na Turma (TurmaStudent)
      let turmaStudent = await prisma.turmaStudent.findFirst({
        where: {
          turmaId: turmaLesson.turmaId,
          studentId: studentId,
          isActive: true,
        },
      });

      if (!turmaStudent) {
        // Se nÃ£o tem TurmaStudent, criar automaticamente (kiosk permite check-in avulso)
        turmaStudent = await prisma.turmaStudent.create({
          data: {
            turmaId: turmaLesson.turmaId,
            studentId: studentId,
            enrolledAt: now,
            isActive: true,
          },
        });
        logger.info(
          { studentId, turmaId: turmaLesson.turmaId },
          'TurmaStudent criado automaticamente para check-in via kiosk'
        );
      }

      // Criar TurmaAttendance
      attendance = await prisma.turmaAttendance.create({
        data: {
          turmaId: turmaLesson.turmaId,
          turmaLessonId: classId,
          turmaStudentId: turmaStudent.id,
          studentId: studentId,
          present: status === AttendanceStatus.PRESENT,
          late: status === AttendanceStatus.LATE,
          notes: method === CheckInMethod.QR_CODE ? 'Check-in via QR Code' : notes,
          checkedAt: now,
        },
      });

      // âœ… AUTO-COMPLETAR ATIVIDADES SE CONFIGURADO
      try {
        const { ActivityExecutionService } = await import('@/services/activityExecutionService');
        const student_full = await prisma.student.findUnique({
          where: { id: studentId },
          select: { organizationId: true }
        });
        
        if (student_full) {
          const settings = await ActivityExecutionService.getSettings(student_full.organizationId);
          if (settings?.autoCompleteOnCheckin) {
            await ActivityExecutionService.autoCompleteOnCheckin(attendance.id);
            logger.info(`Auto-completed activities for attendance ${attendance.id}`);
          }
        }
      } catch (error) {
        logger.error('Error auto-completing activities:', error);
        // NÃ£o falhar o check-in se auto-complete falhar
      }

      // âœ… VERIFICAR E REGISTRAR CONQUISTAS DE GRAUS
      try {
        const { GraduationService } = await import('@/services/graduationService');
        const turmaLesson = await prisma.turmaLesson.findUnique({
          where: { id: classId },
          include: {
            turma: {
              select: { courseId: true }
            }
          }
        });
        
        if (turmaLesson?.turma.courseId) {
          await GraduationService.checkAndRecordDegrees(studentId, turmaLesson.turma.courseId);
          logger.info(`Checked and recorded degrees for student ${studentId} in course ${turmaLesson.turma.courseId}`);
        }
      } catch (error) {
        logger.error('Error checking degrees:', error);
        // NÃ£o falhar o check-in se verificaÃ§Ã£o de graus falhar
      }
    } else {
      // âŒ CHECK-IN EM CLASS (sistema legacy) - manter cÃ³digo original
      
      // Check if already checked in (legacy)
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          studentId_classId: {
            studentId,
            classId,
          },
        },
      });

      if (existingAttendance) {
        throw new Error('Check-in jÃ¡ realizado para esta aula');
      }

      // Create attendance record (legacy)
      attendance = await prisma.attendance.create({
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

      // Update class actual students count (legacy)
      await prisma.class.update({
        where: { id: classId },
        data: {
          actualStudents: {
            increment: 1,
          },
        },
      });
    }

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
    const { page, limit, startDate, endDate, status, classId, studentId } = query;
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
    } else {
      // Admins and Instructors can filter by studentId
      if (studentId) {
        whereClause.studentId = studentId;
      }

      if (userRole === UserRole.INSTRUCTOR) {
        // Instructors can see attendance for their classes
        const instructor = await prisma.instructor.findUnique({
          where: { userId },
        });
  
        if (!instructor) {
          throw new Error('Instrutor não encontrado');
        }
  
        // ✅ FIX: Use TurmaAttendance relation path
        whereClause.turmaLesson = {
          turma: {
            instructorId: instructor.id,
          },
        };
      }
    }
    // Admins can see all attendance (no additional filter)

    // Add date filters
    if (startDate || endDate) {
      whereClause.checkedAt = {};
      if (startDate) {
        whereClause.checkedAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.checkedAt.lte = new Date(endDate);
      }
    }

    // Add status filter
    if (status) {
      if (status === 'PRESENT') whereClause.present = true;
      if (status === 'ABSENT') whereClause.present = false;
      if (status === 'LATE') whereClause.late = true;
    }

    // Add class filter
    if (classId) {
      whereClause.turmaLessonId = classId;
    }

    // ✅ FIX: Query TurmaAttendance (New Table) instead of Attendance (Legacy)
    const [turmaAttendances, total] = await Promise.all([
      prisma.turmaAttendance.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          lesson: {
            include: {
              turma: {
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
          },
        },
        orderBy: {
          checkedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.turmaAttendance.count({ where: whereClause }),
    ]);

    // ✅ FIX: Map to legacy format expected by frontend
    const attendances = turmaAttendances.map((ta) => ({
      id: ta.id,
      studentId: ta.studentId,
      classId: ta.turmaLessonId,
      checkInTime: ta.checkedAt,
      status: ta.late ? 'LATE' : ta.present ? 'PRESENT' : 'ABSENT',
      notes: ta.notes,
      student: {
        id: ta.student.id,
        firstName: ta.student.user.firstName,
        lastName: ta.student.user.lastName,
      },
      class: {
        id: ta.turmaLessonId,
        date: ta.lesson.scheduledDate,
        startTime: ta.lesson.scheduledDate,
        endTime: dayjs(ta.lesson.scheduledDate)
          .add(ta.lesson.duration || 60, 'minute')
          .toDate(),
        course: ta.lesson.turma.course,
        instructor: ta.lesson.turma.instructor,
      },
    }));

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
      throw new Error('PermissÃµes insuficientes');
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { class: true },
    });

    if (!attendance) {
      throw new Error('Registro de presenÃ§a nÃ£o encontrado');
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

    let recentTrend: AttendanceTrend = AttendanceTrend.STABLE;
    if (recentAttendanceRate > attendanceRate + 10) {
      recentTrend = AttendanceTrend.IMPROVING;
    } else if (recentAttendanceRate < attendanceRate - 10) {
      recentTrend = AttendanceTrend.DECLINING;
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
        lastAnalyzed: new Date(),
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

    // If student provided, restrict classes to eligible courses
    let eligibleCourseIds: string[] = [];
    if (studentId) {
      eligibleCourseIds = await this.getEligibleCourseIds(studentId);
    }

    // ðŸ” DEBUG: Log date filters
    logger.info('ðŸ” [DEBUG] getAvailableClasses filters', {
      now: now.toISOString(),
      today: today.format('YYYY-MM-DD HH:mm:ss'),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      studentId,
      eligibleCourseIds,
      eligibleCoursesCount: eligibleCourseIds.length,
      willFilterByCourse: studentId && eligibleCourseIds.length > 0
    });

    // âœ… BUSCAR EM TURMALESSON (aulas de Turmas) - onde as aulas realmente estÃ£o!
    const turmaLessons = await prisma.turmaLesson.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
        status: 'SCHEDULED', // âœ… CORRIGIDO: Apenas SCHEDULED (TurmaStatus vÃ¡lido)
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
              select: {
                firstName: true,
                lastName: true,
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

    // ðŸ” DEBUG: Log TurmaLessons found
    logger.info('ðŸ” [DEBUG] TurmaLessons found from database', {
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
      const checkInStart = startTime.subtract(30, 'minute'); // âœ… ALINHADO: 30 minutos antes (igual ao checkInToClass)
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
              name: `${turmaLesson.turma.instructor.firstName} ${turmaLesson.turma.instructor.lastName}`,
            }
          : null,
        course: turmaLesson.turma.course,
        capacity: null, // TurmaLesson nÃ£o tem capacity
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
        // ðŸ”¥ FIX: Use correct relation 'studentCourses' instead of 'enrollments'
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
      throw new Error('Aluno nÃ£o encontrado');
    }

    // ðŸ”¥ DEBUG: Log ALL studentCourses found (without filter)
    logger.info({ 
      studentId, 
      studentCoursesFound: student.studentCourses?.length || 0,
      studentCourses: student.studentCourses?.map(e => ({ 
        courseId: e.course.id, 
        courseName: e.course.name,
        status: (e as any).status,
        isActive: (e as any).isActive
      }))
    }, 'ðŸ” [DEBUG] StudentCourses loaded from database (correct relation)');

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
    }, 'ðŸ“Š Dashboard data loaded');

    // Unlimited plan support: if plan is unlimited and no explicit course enrollments, allow all courses
    const unlimitedPlan = !!(subscription && (
      subscription.billingType === 'UNLIMITED' ||
      subscription.isActive === true ||
      (subscription.plan?.name && String(subscription.plan.name).toLowerCase().includes('ilimit'))
    ));

    logger.info({ unlimitedPlan, billingType: subscription?.billingType }, 'ðŸ”“ Plan type detection');

  // Determine eligibility upfront (already fetched in parallel)

    // Next classes (up to 5), filtered by eligibility
  let upcomingClasses: any[] = [];
    try {
      const classWhere: any = {
        date: { gte: new Date() },
        status: { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS] },
      };

      // Se nÃ£o Ã© plano ilimitado E tem courseIds elegÃ­veis, filtrar por eles
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
      }, 'ðŸ“… Upcoming classes loaded');
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
        className: att.class.title || 'Aula sem tÃ­tulo',
        date: att.class.date,
        checkInTime: att.checkInTime,
        status: att.status,
      })),
      upcomingClasses: [
        // From Class model
        ...upcomingClasses.map(cls => ({
          id: cls.id,
          name: cls.title || cls.course?.name || 'Aula sem tÃ­tulo',
          date: cls.date,
          startTime: cls.startTime,
          instructor: cls.instructor ? 
            `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}` : 
            'Instrutor nÃ£o definido',
        })),
        // From TurmaLesson model
        ...upcomingTurmaLessons.map(les => ({
          id: les.id,
          name: les.title || les.turma?.course?.name || les.turma?.name || 'Aula da turma',
          date: les.scheduledDate,
          startTime: les.scheduledDate,
          instructor: les.turma?.instructor ? 
            `${les.turma.instructor.firstName} ${les.turma.instructor.lastName}` : 
            'Instrutor nÃ£o definido',
        }))
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5),
      // ðŸ”¥ FIX: Filter ACTIVE studentCourses manually and map with proper fields
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
          // ðŸ”¥ FIX: Use correct relation 'studentCourses' instead of 'enrollments'
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
          // ðŸ”¥ FIX: Include subscriptions to show plan info in kiosk
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
              plan: {
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
        // ðŸ”¥ FIX: Add enrollment and subscription info for kiosk
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
          name: student.subscriptions[0].plan.name,
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

  /**
   * Get full class roll (enrolled students + attendance status)
   */
  static async getClassRoll(lessonId: string) {
    // 1. Get Lesson info
    const lesson = await prisma.turmaLesson.findUnique({
      where: { id: lessonId },
      include: {
        turma: {
          include: {
            course: true,
            instructor: true,
          },
        },
      },
    });

    if (!lesson) throw new Error('Aula não encontrada');

    // 2. Get all enrolled students (Active)
    const enrolledStudents = await prisma.turmaStudent.findMany({
      where: {
        turmaId: lesson.turmaId,
        isActive: true,
      },
      include: {
        student: {
          select: {
            id: true,
            registrationNumber: true,
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

    // 3. Get attendance records for this lesson
    const attendanceRecords = await prisma.turmaAttendance.findMany({
      where: {
        turmaLessonId: lessonId,
      },
    });

    // 4. Merge data
    const roll = enrolledStudents.map((enrollment) => {
      const attendance = attendanceRecords.find(
        (a) => a.studentId === enrollment.studentId
      );
      return {
        student: {
          id: enrollment.student.id,
          firstName: enrollment.student.user.firstName,
          lastName: enrollment.student.user.lastName,
          photoUrl: enrollment.student.user.avatarUrl,
          registrationNumber: enrollment.student.registrationNumber,
        },
        status: attendance
          ? attendance.late
            ? 'LATE'
            : attendance.present
            ? 'PRESENT'
            : 'ABSENT'
          : 'NONE',
        attendanceId: attendance?.id,
        checkInTime: attendance?.checkedAt,
        notes: attendance?.notes,
      };
    });

    // 5. Add students who are NOT enrolled but attended (e.g. drop-ins)
    const enrolledStudentIds = new Set(enrolledStudents.map((e) => e.studentId));
    const dropIns = await Promise.all(
      attendanceRecords
        .filter((a) => !enrolledStudentIds.has(a.studentId))
        .map(async (a) => {
          const student = await prisma.student.findUnique({
            where: { id: a.studentId },
            select: {
              id: true,
              registrationNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          });

          if (!student) return null;

          return {
            student: {
              id: student.id,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              photoUrl: student.user.avatarUrl,
              registrationNumber: student.registrationNumber,
            },
            status: a.late ? 'LATE' : a.present ? 'PRESENT' : 'ABSENT',
            attendanceId: a.id,
            checkInTime: a.checkedAt,
            notes: a.notes,
            isDropIn: true,
          };
        })
    );

    return {
      lesson: {
        id: lesson.id,
        date: lesson.scheduledDate,
        topic: lesson.topic,
        turmaName: lesson.turma.name,
        courseName: lesson.turma.course?.name,
        instructorName: `${lesson.turma.instructor?.firstName} ${lesson.turma.instructor?.lastName}`,
      },
      students: [...roll, ...dropIns.filter((d) => d !== null)],
    };
  }

  /**
   * Update class roll (bulk update)
   */
  static async updateClassRoll(
    lessonId: string,
    updates: { studentId: string; status: string; notes?: string }[]
  ) {
    await prisma.$transaction(async (tx) => {
      const lesson = await tx.turmaLesson.findUnique({
        where: { id: lessonId },
      });
      if (!lesson) throw new Error('Aula não encontrada');

      for (const update of updates) {
        if (update.status === 'NONE') {
          // Remove attendance record if set to NONE
          await tx.turmaAttendance.deleteMany({
            where: {
              turmaLessonId: lessonId,
              studentId: update.studentId,
            },
          });
          continue;
        }

        // Find or create TurmaStudent (for drop-ins)
        let turmaStudent = await tx.turmaStudent.findFirst({
          where: {
            turmaId: lesson.turmaId,
            studentId: update.studentId,
          },
        });

        if (!turmaStudent) {
          turmaStudent = await tx.turmaStudent.create({
            data: {
              turmaId: lesson.turmaId,
              studentId: update.studentId,
              isActive: true,
            },
          });
        }

        // Upsert Attendance
        await tx.turmaAttendance.upsert({
          where: {
            turmaLessonId_studentId: {
              turmaLessonId: lessonId,
              studentId: update.studentId,
            },
          },
          create: {
            turmaLessonId: lessonId,
            studentId: update.studentId,
            turmaStudentId: turmaStudent.id,
            turmaId: lesson.turmaId,
            present: update.status === 'PRESENT' || update.status === 'LATE',
            late: update.status === 'LATE',
            notes: update.notes,
            checkedAt: new Date(),
          },
          update: {
            present: update.status === 'PRESENT' || update.status === 'LATE',
            late: update.status === 'LATE',
            notes: update.notes,
          },
        });
      }
    });
  }
}

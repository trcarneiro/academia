// @ts-nocheck
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { QRCodeService } from '@/utils/qrcode';
import { UpcomingClassesQuery, CreateClassInput, UpdateClassInput } from '@/schemas/class';
import { ClassStatus, UserRole } from '@/types';
import dayjs from 'dayjs';

export class ClassService {
  static async getUpcomingClasses(
    userId: string,
    userRole: UserRole,
    query: UpcomingClassesQuery
  ) {
    const { page, limit, date, instructorId, courseProgramId, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    let whereClause: any = {
      date: {
        gte: date ? new Date(date) : new Date(),
      },
    };

    if (userRole === UserRole.INSTRUCTOR) {
      // Instructors can only see their own classes
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor) {
        throw new Error('Instrutor não encontrado');
      }

      whereClause.instructorId = instructor.id;
    }
    // Students and admins can see all upcoming classes

    // Add additional filters
    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    if (courseProgramId) {
      whereClause.courseProgramId = courseProgramId;
    }

    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show scheduled and in-progress classes
      whereClause.status = {
        in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS],
      };
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          schedule: true,
          instructor: {
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
          courseProgram: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          lessonPlan: {
            select: {
              id: true,
              title: true,
              description: true,
              objectives: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.class.count({ where: whereClause }),
    ]);

    return {
      classes,
      total,
      page,
      limit,
    };
  }

  static async getClassById(classId: string, userId: string, userRole: UserRole) {
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        schedule: true,
        instructor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            specializations: true,
          },
        },
        courseProgram: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
          },
        },
        lessonPlan: {
          select: {
            id: true,
            title: true,
            description: true,
            objectives: true,
            techniques: true,
            equipment: true,
            duration: true,
          },
        },
        attendances: {
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
          },
          orderBy: {
            checkInTime: 'desc',
          },
        },
      },
    });

    if (!classInfo) {
      throw new Error('Aula não encontrada');
    }

    // Check permissions for instructor-specific classes
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (instructor && classInfo.instructorId !== instructor.id) {
        throw new Error('Permissões insuficientes');
      }
    }

    return classInfo;
  }

  static async generateClassQRCode(classId: string, userId: string, userRole: UserRole) {
    // Only instructors and admins can generate QR codes
    if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) {
      throw new Error('Permissões insuficientes');
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        instructor: true,
      },
    });

    if (!classInfo) {
      throw new Error('Aula não encontrada');
    }

    // Check if instructor is the owner of the class
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor || classInfo.instructorId !== instructor.id) {
        throw new Error('Permissões insuficientes');
      }
    }

    // Check if class is today
    const classDate = dayjs(classInfo.date);
    const today = dayjs();

    if (!classDate.isSame(today, 'day')) {
      throw new Error('QR Code só pode ser gerado no dia da aula');
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCodeService.generateClassQRCode(classId);

    // Update class with QR code
    await prisma.class.update({
      where: { id: classId },
      data: { qrCode: qrCodeDataUrl },
    });

    logger.info(
      { classId, instructorId: classInfo.instructorId },
      'QR Code generated for class'
    );

    return {
      classId,
      qrCode: qrCodeDataUrl,
      validUntil: dayjs().add(30, 'minutes').toISOString(),
    };
  }

  static async createClass(data: CreateClassInput, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem criar aulas');
    }

    // Validate that schedule, instructor, and course program exist
    const [schedule, instructor, courseProgram] = await Promise.all([
      prisma.classSchedule.findUnique({ where: { id: data.scheduleId } }),
      prisma.instructor.findUnique({ where: { id: data.instructorId } }),
      prisma.courseProgram.findUnique({ where: { id: data.courseProgramId } }),
    ]);

    if (!schedule) {
      throw new Error('Horário não encontrado');
    }

    if (!instructor || !instructor.isActive) {
      throw new Error('Instrutor não encontrado ou inativo');
    }

    if (!courseProgram || !courseProgram.isActive) {
      throw new Error('Programa do curso não encontrado ou inativo');
    }

    // Check for conflicts with existing classes
    const classDate = new Date(data.date);
    const conflictingClass = await prisma.class.findFirst({
      where: {
        instructorId: data.instructorId,
        date: {
          gte: dayjs(classDate).startOf('day').toDate(),
          lte: dayjs(classDate).endOf('day').toDate(),
        },
        status: {
          in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS],
        },
      },
    });

    if (conflictingClass) {
      throw new Error('Instrutor já possui uma aula agendada neste horário');
    }

    const newClass = await prisma.class.create({
      data: {
        schedule: { connect: { id: data.scheduleId } },
        instructor: { connect: { id: data.instructorId } },
        courseProgram: { connect: { id: data.courseProgramId } },
        lessonPlan: { connect: { id: data.lessonPlanId } },
        date: classDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        notes: data.notes,
      },
      include: {
        schedule: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        courseProgram: {
          select: {
            name: true,
            level: true,
          },
        },
        lessonPlan: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    logger.info(
      {
        classId: newClass.id,
        instructorId: data.instructorId,
        date: data.date,
      },
      'New class created'
    );

    return newClass;
  }

  static async updateClass(
    classId: string,
    data: UpdateClassInput,
    userRole: UserRole
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
      throw new Error('Permissões insuficientes');
    }

    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      include: { instructor: true },
    });

    if (!existingClass) {
      throw new Error('Aula não encontrada');
    }

    // If user is instructor, check if they own the class
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({
        where: { userId: existingClass.instructor.userId },
      });

      if (!instructor) {
        throw new Error('Permissões insuficientes');
      }
    }

    // Validate instructor if being updated
    if (data.instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: data.instructorId },
      });

      if (!instructor || !instructor.isActive) {
        throw new Error('Instrutor não encontrado ou inativo');
      }
    }

    // Validate lesson plan if being updated
    if (data.lessonPlanId) {
      const lessonPlan = await prisma.lessonPlan.findUnique({
        where: { id: data.lessonPlanId },
      });

      if (!lessonPlan) {
        throw new Error('Plano de aula não encontrado');
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
      include: {
        schedule: true,
        instructor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        courseProgram: {
          select: {
            name: true,
            level: true,
          },
        },
        lessonPlan: {
          select: {
            title: true,
            description: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    logger.info(
      {
        classId,
        updatedFields: Object.keys(data),
      },
      'Class updated'
    );

    return updatedClass;
  }

  static async cancelClass(classId: string, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
      throw new Error('Permissões insuficientes');
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: { instructor: true },
    });

    if (!classInfo) {
      throw new Error('Aula não encontrada');
    }

    if (classInfo.status === ClassStatus.COMPLETED) {
      throw new Error('Aula já foi finalizada');
    }

    if (classInfo.status === ClassStatus.CANCELLED) {
      throw new Error('Aula já foi cancelada');
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { status: ClassStatus.CANCELLED },
    });

    logger.info({ classId }, 'Class cancelled');

    return updatedClass;
  }
}
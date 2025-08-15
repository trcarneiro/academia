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
    const whereClause: any = { date: { gte: date ? new Date(date) : new Date() } };
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({ where: { userId } });
      if (!instructor) throw new Error('Instrutor não encontrado');
      whereClause.instructorId = instructor.id;
    }
    if (instructorId) whereClause.instructorId = instructorId;
    if (courseProgramId) whereClause.courseId = courseProgramId; // alias legado
    if (status) whereClause.status = status; else whereClause.status = { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS] };

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          schedule: true,
          instructor: { include: { user: true } },
          course: true,
          lessonPlan: true,
          _count: { select: { attendances: true } }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.class.count({ where: whereClause })
    ]);
    return { classes, total, page, limit };
  }

  static async getClassById(classId: string, userId: string, userRole: UserRole) {
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        schedule: true,
        instructor: { include: { user: true } },
        course: true,
        lessonPlan: true,
        attendances: { include: { student: { include: { user: true } } }, orderBy: { checkInTime: 'desc' } }
      }
    });
    if (!classInfo) throw new Error('Aula não encontrada');
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({ where: { userId } });
      if (instructor && classInfo.instructorId !== instructor.id) throw new Error('Permissões insuficientes');
    }
    return classInfo;
  }

  static async generateClassQRCode(classId: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) throw new Error('Permissões insuficientes');
    const classInfo = await prisma.class.findUnique({ where: { id: classId }, include: { instructor: true } });
    if (!classInfo) throw new Error('Aula não encontrada');
    if (userRole === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.findUnique({ where: { userId } });
      if (!instructor || classInfo.instructorId !== instructor.id) throw new Error('Permissões insuficientes');
    }
    if (!dayjs(classInfo.date).isSame(dayjs(), 'day')) throw new Error('QR Code só pode ser gerado no dia da aula');
    const qrCodeDataUrl = await QRCodeService.generateClassQRCode(classId);
    await prisma.class.update({ where: { id: classId }, data: { qrCode: qrCodeDataUrl } });
    logger.info({ classId, instructorId: classInfo.instructorId }, 'QR Code generated for class');
    return { classId, qrCode: qrCodeDataUrl, validUntil: dayjs().add(30, 'minutes').toISOString() };
  }

  static async createClass(data: CreateClassInput, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) throw new Error('Apenas administradores podem criar aulas');
    const courseId = data.courseId || data.courseProgramId;
    if (!courseId) throw new Error('courseId obrigatório');

    const [schedule, instructor, course, unit, mat] = await Promise.all([
      prisma.classSchedule.findUnique({ where: { id: data.scheduleId } }),
      prisma.instructor.findUnique({ where: { id: data.instructorId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
      data.unitId ? prisma.unit.findUnique({ where: { id: data.unitId } }) : Promise.resolve(null),
      data.matId ? prisma.mat.findUnique({ where: { id: data.matId } }) : Promise.resolve(null),
    ]);
    if (!schedule) throw new Error('Horário não encontrado');
    if (!instructor || !instructor.isActive) throw new Error('Instrutor não encontrado ou inativo');
    if (!course || !course.isActive) throw new Error('Curso não encontrado ou inativo');
    const orgId = course.organizationId;
    if (unit && unit.organizationId !== orgId) throw new Error('Unidade fora da organização do curso');
    if (mat && mat.organizationId !== orgId) throw new Error('Tatame fora da organização do curso');

    const classDate = dayjs(data.date).toDate();
    const dayStart = dayjs(classDate).startOf('day').toDate();
    const dayEnd = dayjs(classDate).endOf('day').toDate();

    const overlap = await prisma.class.findFirst({
      where: {
        date: { gte: dayStart, lte: dayEnd },
        status: { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS] },
        organizationId: orgId,
        OR: [
          { instructorId: data.instructorId },
          data.matId ? { matId: data.matId } : undefined,
          (!data.matId && data.unitId) ? { unitId: data.unitId } : undefined
        ].filter(Boolean) as any,
        startTime: { lt: schedule.endTime },
        endTime: { gt: schedule.startTime },
      }
    });
    if (overlap) throw new Error('Conflito de horário: instrutor ou recurso já alocado');

    // Normaliza opcionais (Prisma espera null, não undefined)
    const newClass = await prisma.class.create({
      data: {
        organizationId: orgId,
        scheduleId: data.scheduleId,
        instructorId: data.instructorId,
        courseId,
        lessonPlanId: data.lessonPlanId ?? null,
        date: classDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        notes: data.notes ?? null,
        unitId: data.unitId ?? null,
        matId: data.matId ?? null,
        maxStudents: data.maxStudents ?? 20,
      },
      include: { schedule: true, instructor: { include: { user: true } }, course: true, lessonPlan: true }
    });
    logger.info({ classId: newClass.id, instructorId: data.instructorId, date: data.date }, 'New class created');
    return newClass;
  }

  static async updateClass(classId: string, data: UpdateClassInput, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) throw new Error('Permissões insuficientes');
    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) throw new Error('Aula não encontrada');

    // Validação de curso (não permitir trocar organização)
    if (data.courseId) {
      const newCourse = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!newCourse || !newCourse.isActive) throw new Error('Curso inválido');
      if (newCourse.organizationId !== existing.organizationId) throw new Error('Não é permitido mover aula para curso de outra organização');
    }
    if (data.unitId) {
      const newUnit = await prisma.unit.findUnique({ where: { id: data.unitId } });
      if (!newUnit || newUnit.organizationId !== existing.organizationId) throw new Error('Unidade inválida para organização');
    }
    if (data.matId) {
      const newMat = await prisma.mat.findUnique({ where: { id: data.matId } });
      if (!newMat || newMat.organizationId !== existing.organizationId) throw new Error('Tatame inválido para organização');
    }

    if (data.instructorId) {
      const inst = await prisma.instructor.findUnique({ where: { id: data.instructorId } });
      if (!inst || !inst.isActive) throw new Error('Instrutor inválido');
    }
    if (data.lessonPlanId) {
      const lp = await prisma.lessonPlan.findUnique({ where: { id: data.lessonPlanId } });
      if (!lp) throw new Error('Plano de aula não encontrado');
    }
    if (data.courseId) {
      const c = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!c || !c.isActive) throw new Error('Curso inválido');
    }

    if (data.instructorId || data.unitId || data.matId) {
      const conflict = await prisma.class.findFirst({
        where: {
          id: { not: classId },
          date: existing.date,
          status: { in: [ClassStatus.SCHEDULED, ClassStatus.IN_PROGRESS] },
          OR: [
            data.instructorId ? { instructorId: data.instructorId } : undefined,
            data.matId ? { matId: data.matId } : undefined,
            (!data.matId && data.unitId) ? { unitId: data.unitId } : undefined
          ].filter(Boolean) as any,
          startTime: { lt: existing.endTime },
          endTime: { gt: existing.startTime },
        }
      });
      if (conflict) throw new Error('Conflito de horário após atualização');
    }

    const updateData: any = {};
    ['instructorId','lessonPlanId','status','notes','unitId','matId','maxStudents','courseId'].forEach(k => {
      if (k in data) {
        const value = (data as any)[k];
        if (['lessonPlanId','notes','unitId','matId'].includes(k)) {
          updateData[k] = value ?? null; // normaliza para null
        } else {
          updateData[k] = value;
        }
      }
    });

    const updated = await prisma.class.update({
      where: { id: classId },
      data: updateData,
      include: { schedule: true, instructor: { include: { user: true } }, course: true, lessonPlan: true, _count: { select: { attendances: true } } }
    });
    logger.info({ classId, updatedFields: Object.keys(updateData) }, 'Class updated');
    return updated;
  }

  static async cancelClass(classId: string, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) throw new Error('Permissões insuficientes');
    const classInfo = await prisma.class.findUnique({ where: { id: classId } });
    if (!classInfo) throw new Error('Aula não encontrada');
    if (classInfo.status === ClassStatus.COMPLETED) throw new Error('Aula já foi finalizada');
    if (classInfo.status === ClassStatus.CANCELLED) throw new Error('Aula já foi cancelada');
    const updatedClass = await prisma.class.update({ where: { id: classId }, data: { status: ClassStatus.CANCELLED } });
    logger.info({ classId }, 'Class cancelled');
    return updatedClass;
  }
}
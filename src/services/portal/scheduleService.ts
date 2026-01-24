import { prisma } from '@/utils/database';

export class ScheduleService {
  async listAvailableClasses(organizationId: string) {
    const turmas = await prisma.turma.findMany({
      where: {
        organizationId,
        isActive: true,
        // status: 'ACTIVE' // Assuming ACTIVE is the status for running classes
      },
      include: {
        instructor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        unit: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Add vacancy information
    return turmas.map(turma => ({
      ...turma,
      vacancies: turma.maxStudents - turma._count.students,
      hasVacancy: turma._count.students < turma.maxStudents
    }));
  }

  async listMyClasses(studentId: string) {
    return prisma.turmaStudent.findMany({
      where: {
        studentId,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        turma: {
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            unit: true
          }
        }
      }
    });
  }

  async listUpcomingLessons(studentId: string) {
    // Find active enrollments
    const enrollments = await prisma.turmaStudent.findMany({
      where: { studentId, isActive: true, status: 'ACTIVE' },
      select: { turmaId: true }
    });

    const turmaIds = enrollments.map(e => e.turmaId);

    if (turmaIds.length === 0) return [];

    // Find future lessons for these turmas
    return prisma.turmaLesson.findMany({
      where: {
        turmaId: { in: turmaIds },
        scheduledDate: { gte: new Date() },
        isActive: true
      },
      orderBy: { scheduledDate: 'asc' },
      take: 20,
      include: {
        turma: {
          select: {
            name: true,
            unit: { select: { name: true } },
            instructor: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
  }

  async enroll(studentId: string, turmaId: string, organizationId: string) {
    // Verify if turma belongs to organization
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: { organizationId: true, maxStudents: true, _count: { select: { students: true } } }
    });

    if (!turma) throw new Error('Turma não encontrada');
    if (turma.organizationId !== organizationId) throw new Error('Turma não pertence à organização do aluno');

    // Check vacancies (T063)
    if (turma._count.students >= turma.maxStudents) {
      throw new Error('Turma lotada');
    }

    // Check if already enrolled
    const existing = await prisma.turmaStudent.findUnique({
      where: {
        turmaId_studentId: { turmaId, studentId }
      }
    });

    if (existing) {
      if (existing.isActive && existing.status === 'ACTIVE') {
        throw new Error('Aluno já matriculado nesta turma');
      }
      // Reactivate
      return prisma.turmaStudent.update({
        where: { id: existing.id },
        data: { isActive: true, status: 'ACTIVE' }
      });
    }

    return prisma.turmaStudent.create({
      data: {
        turmaId,
        studentId,
        status: 'ACTIVE'
      }
    });
  }
  async getHistory(studentId: string) {
    // 1. Get explicit attendance records (Present or Late)
    const attendances = await prisma.turmaAttendance.findMany({
      where: { studentId },
      include: {
        turmaLesson: {
          include: {
            turma: {
              select: {
                name: true,
                unit: { select: { name: true } },
                instructor: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform to unified history view
    return attendances.map(att => ({
      id: att.id,
      lessonId: att.turmaLessonId,
      date: att.turmaLesson.scheduledDate,
      title: att.turmaLesson.title,
      turmaName: att.turmaLesson.turma.name,
      unitName: att.turmaLesson.turma.unit?.name,
      instructorName: att.turmaLesson.turma.instructor ? `${att.turmaLesson.turma.instructor.firstName} ${att.turmaLesson.turma.instructor.lastName}` : 'N/A',
      status: att.present ? (att.late ? 'LATE' : 'PRESENT') : 'ABSENT',
      notes: att.notes
    }));
  }
}

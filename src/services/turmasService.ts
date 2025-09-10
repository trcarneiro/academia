import { PrismaClient } from '@prisma/client';
import { addDays, format, parseISO, isAfter, isBefore } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateTurmaData {
  name: string;
  courseId?: string; // Keep for backward compatibility
  courseIds?: string[]; // New field for multiple courses
  type: 'COLLECTIVE' | 'PRIVATE';
  startDate: string;
  endDate?: string;
  maxStudents?: number;
  instructorId: string;
  organizationId: string;
  unitId: string;
  schedule: {
    daysOfWeek: number[];
    time: string;
    duration: number;
  };
}

export interface TurmaFilters {
  organizationId?: string;
  unitId?: string;
  status?: string;
  type?: string;
}

export interface AttendanceFilters {
  lessonId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MarkAttendanceData {
  lessonId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface ReportFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export class TurmasService {
  async list(filters: TurmaFilters = {}) {
    const where: any = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    return await prisma.turma.findMany({
      where,
      include: {
        course: true,
        instructor: true,
        organization: true,
        unit: true,
        courses: {
          include: {
            course: true
          }
        },
        students: {
          include: {
            student: true
          }
        },
        lessons: {
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getById(id: string) {
    return await prisma.turma.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            lessonPlans: {
              orderBy: {
                lessonNumber: 'asc'
              }
            }
          }
        },
        instructor: true,
        organization: true,
        unit: true,
        students: {
          include: {
            student: true
          }
        },
        lessons: {
          include: {
            lessonPlan: true,
            attendances: {
              include: {
                student: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      }
    });
  }

  async create(data: CreateTurmaData) {
    // Handle courseIds (multiple courses) or fallback to single courseId
    const courseIds = data.courseIds && data.courseIds.length > 0 ? data.courseIds : (data.courseId ? [data.courseId] : []);
    
    if (courseIds.length === 0) {
      throw new Error('At least one course must be provided');
    }

    // Use the first course as the primary course for backward compatibility
    const primaryCourseId = courseIds[0];

    const turma = await prisma.$transaction(async (tx) => {
      // Create the turma
      const createdTurma = await tx.turma.create({
        data: {
          name: data.name,
          classType: data.type, // Map 'type' to 'classType'
          status: 'SCHEDULED',
          startDate: parseISO(data.startDate),
          endDate: data.endDate ? parseISO(data.endDate) : null,
          maxStudents: data.maxStudents || 20,
          schedule: data.schedule,
          courseId: primaryCourseId, // Set primary course for backward compatibility
          instructorId: data.instructorId,
          organizationId: data.organizationId,
          unitId: data.unitId
        }
      });

      // Create course associations in TurmaCourse table
      for (const courseId of courseIds) {
        await tx.turmaCourse.create({
          data: {
            turmaId: createdTurma.id,
            courseId: courseId
          }
        });
      }

      return createdTurma;
    });

    // Fetch the complete turma with all relationships
    const completeTurma = await prisma.turma.findUnique({
      where: { id: turma.id },
      include: {
        course: true,
        instructor: true,
        organization: true,
        unit: true,
        courses: {
          include: {
            course: true
          }
        }
      }
    });

    // Gerar cronograma automaticamente (não falhar se não conseguir)
    try {
      await this.generateSchedule(turma.id);
    } catch (error) {
      console.error('Erro ao gerar cronograma da turma:', error);
      // Não falhar a criação da turma por causa do cronograma
    }

    return completeTurma;
  }

  async update(id: string, data: Partial<CreateTurmaData>) {
    try {
      console.log('[TurmasService] Update request for ID:', id);
      console.log('[TurmasService] Update data received:', JSON.stringify(data, null, 2));
      
      const updateData: any = {};

      if (data.name) updateData.name = data.name;
      if (data.type) updateData.classType = data.type; // Map 'type' to 'classType'
      if (data.startDate) {
        console.log('[TurmasService] Processing startDate:', data.startDate);
        updateData.startDate = parseISO(data.startDate);
      }
      if (data.endDate) {
        console.log('[TurmasService] Processing endDate:', data.endDate);
        updateData.endDate = parseISO(data.endDate);
      }
      if (data.maxStudents) updateData.maxStudents = data.maxStudents;
      if (data.schedule) {
        console.log('[TurmasService] Processing schedule:', JSON.stringify(data.schedule));
        updateData.schedule = data.schedule;
      }
      if (data.instructorId) updateData.instructorId = data.instructorId;

      console.log('[TurmasService] Final update data:', JSON.stringify(updateData, null, 2));

      const turma = await prisma.turma.update({
        where: { id },
        data: updateData,
        include: {
          course: true,
          instructor: true,
          organization: true,
          unit: true
        }
      });

      console.log('[TurmasService] Update successful');

      // Regenerar cronograma se as datas ou horários mudaram
      // Temporariamente comentado para debug
      // if (data.startDate || data.endDate || data.schedule) {
      //   console.log('[TurmasService] Regenerating schedule...');
      //   await this.regenerateSchedule(id);
      // }

      return turma;
    } catch (error) {
      console.error('[TurmasService] Update error:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await prisma.turma.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateSchedule(turmaId: string) {
    const turma = await this.getById(turmaId);
    if (!turma) throw new Error('Turma não encontrada');

    const { course, schedule, startDate, endDate } = turma;
    const lessonPlans = course.lessonPlans;

    // Limpar cronograma existente
    await prisma.turmaLesson.deleteMany({
      where: { turmaId }
    });

    // If no lesson plans, skip schedule generation
    if (!lessonPlans || lessonPlans.length === 0) {
      console.log(`Turma ${turmaId} has no lesson plans, skipping schedule generation`);
      return [];
    }

    // Cast schedule to proper type
    const scheduleData = schedule as { daysOfWeek: number[]; time: string; duration: number };

    const lessons: any[] = [];
    let currentDate = new Date(startDate);
    let lessonIndex = 0;

    // Determinar data limite
    const maxDate = endDate ? new Date(endDate) : addDays(currentDate, 365);

    while (lessonIndex < lessonPlans.length && isBefore(currentDate, maxDate)) {
      const dayOfWeek = currentDate.getDay();

      if (scheduleData.daysOfWeek.includes(dayOfWeek)) {
        const lessonPlan = lessonPlans[lessonIndex];

        lessons.push({
          turmaId,
          lessonPlanId: lessonPlan?.id || null,
          lessonNumber: lessonIndex + 1,
          title: lessonPlan?.title || `Aula ${lessonIndex + 1}`,
          scheduledDate: new Date(currentDate),
          status: 'SCHEDULED',
          duration: scheduleData.duration || 60
        });

        lessonIndex++;
      }

      currentDate = addDays(currentDate, 1);
    }

    // Criar todas as aulas
    if (lessons.length > 0) {
      await prisma.turmaLesson.createMany({
        data: lessons
      });
    }

    return lessons;
  }

  async regenerateSchedule(turmaId: string) {
    return await this.generateSchedule(turmaId);
  }

  async getLessons(turmaId: string, filters: { status?: string } = {}) {
    const where: any = { turmaId };
    if (filters.status) where.status = filters.status;

    return await prisma.turmaLesson.findMany({
      where,
      include: {
        lessonPlan: true,
        attendances: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });
  }

  async updateLessonStatus(lessonId: string, status: string) {
    return await prisma.turmaLesson.update({
      where: { id: lessonId },
      data: { status },
      include: {
        lessonPlan: true,
        attendances: {
          include: {
            student: true
          }
        }
      }
    });
  }

  async getStudents(turmaId: string) {
    return await prisma.turmaStudent.findMany({
      where: { turmaId },
      include: {
        student: true
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });
  }

  async addStudent(turmaId: string, studentId: string) {
    // Verificar se o aluno já está na turma
    const existing = await prisma.turmaStudent.findUnique({
      where: {
        turmaId_studentId: {
          turmaId,
          studentId
        }
      }
    });

    if (existing) {
      throw new Error('Aluno já está matriculado nesta turma');
    }

    // Verificar limite de alunos
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        students: true
      }
    });

    if (turma?.maxStudents && turma.students.length >= turma.maxStudents) {
      throw new Error('Turma já atingiu o limite máximo de alunos');
    }

    return await prisma.turmaStudent.create({
      data: {
        turmaId,
        studentId,
        joinedAt: new Date()
      },
      include: {
        student: true
      }
    });
  }

  async removeStudent(turmaId: string, studentId: string) {
    try {
      await prisma.turmaStudent.delete({
        where: {
          turmaId_studentId: {
            turmaId,
            studentId
          }
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAttendance(turmaId: string, filters: AttendanceFilters = {}) {
    const where: any = { turmaId };

    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.startDate || filters.endDate) {
      where.lesson = {
        scheduledDate: {}
      };
      if (filters.startDate) {
        where.lesson.scheduledDate.gte = parseISO(filters.startDate);
      }
      if (filters.endDate) {
        where.lesson.scheduledDate.lte = parseISO(filters.endDate);
      }
    }

    return await prisma.turmaAttendance.findMany({
      where,
      include: {
        student: true,
        lesson: {
          include: {
            lessonPlan: true
          }
        }
      },
      orderBy: [
        { lesson: { scheduledDate: 'desc' } },
        { student: { name: 'asc' } }
      ]
    });
  }

  async markAttendance(turmaId: string, data: MarkAttendanceData) {
    return await prisma.turmaAttendance.upsert({
      where: {
        lessonId_studentId: {
          lessonId: data.lessonId,
          studentId: data.studentId
        }
      },
      update: {
        status: data.status,
        markedAt: new Date()
      },
      create: {
        turmaId,
        lessonId: data.lessonId,
        studentId: data.studentId,
        status: data.status,
        markedAt: new Date()
      },
      include: {
        student: true,
        lesson: {
          include: {
            lessonPlan: true
          }
        }
      }
    });
  }

  async getReports(turmaId: string, filters: ReportFilters = {}) {
    const turma = await this.getById(turmaId);
    if (!turma) throw new Error('Turma não encontrada');

    // Estatísticas gerais
    const totalLessons = await prisma.turmaLesson.count({
      where: { turmaId }
    });

    const completedLessons = await prisma.turmaLesson.count({
      where: { turmaId, status: 'COMPLETED' }
    });

    const totalStudents = await prisma.turmaStudent.count({
      where: { turmaId }
    });

    // Frequência por aluno
    const attendanceByStudent = await prisma.turmaAttendance.groupBy({
      by: ['studentId', 'status'],
      where: { turmaId },
      _count: true
    });

    // Relatório de progresso
    const progressReport = {
      turma: {
        id: turma.id,
        name: turma.name,
        course: turma.course.name,
        instructor: `${turma.instructor.firstName} ${turma.instructor.lastName}`
      },
      statistics: {
        totalLessons,
        completedLessons,
        progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        totalStudents
      },
      attendance: this.formatAttendanceReport(attendanceByStudent),
      lessons: turma.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.lessonPlan?.title,
        scheduledDate: lesson.scheduledDate,
        status: lesson.status,
        attendanceCount: lesson.attendances.length
      }))
    };

    return progressReport;
  }

  private formatAttendanceReport(attendanceData: any[]) {
    const byStudent: { [key: string]: any } = {};

    attendanceData.forEach(item => {
      if (!byStudent[item.studentId]) {
        byStudent[item.studentId] = {
          studentId: item.studentId,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }

      byStudent[item.studentId][item.status.toLowerCase()] = item._count;
      byStudent[item.studentId].total += item._count;
    });

    return Object.values(byStudent).map((student: any) => ({
      ...student,
      attendanceRate: student.total > 0 ? (student.present / student.total) * 100 : 0
    }));
  }

  async search(query: string, filters: any = {}) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { course: { name: { contains: query, mode: 'insensitive' } } },
        { instructor: { name: { contains: query, mode: 'insensitive' } } }
      ]
    };

    // Aplicar filtros adicionais
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    return await prisma.turma.findMany({
      where,
      include: {
        course: true,
        instructor: true,
        organization: true,
        unit: true,
        students: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async getByInstructor(instructorId: string, filters: { status?: string } = {}) {
    const where: any = { instructorId };
    if (filters.status) where.status = filters.status;

    return await prisma.turma.findMany({
      where,
      include: {
        course: true,
        organization: true,
        unit: true,
        students: {
          include: {
            student: true
          }
        },
        lessons: {
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });
  }

  // ===== Gestão de Cursos da Turma =====

  async getTurmaCourses(turmaId: string) {
    return await prisma.turmaCourse.findMany({
      where: { turmaId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true
          }
        }
      }
    });
  }

  async addCourseToTurma(turmaId: string, courseId: string) {
    // Verificar se a turma existe
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId }
    });

    if (!turma) {
      throw new Error('Turma não encontrada');
    }

    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new Error('Curso não encontrado');
    }

    // Verificar se já existe a associação
    const existing = await prisma.turmaCourse.findUnique({
      where: {
        turmaId_courseId: {
          turmaId,
          courseId
        }
      }
    });

    if (existing) {
      throw new Error('Curso já está associado à turma');
    }

    // Criar associação
    return await prisma.turmaCourse.create({
      data: {
        turmaId,
        courseId
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            description: true,
            level: true
          }
        }
      }
    });
  }

  async removeCourseFromTurma(turmaId: string, courseId: string) {
    await prisma.turmaCourse.deleteMany({
      where: {
        turmaId,
        courseId
      }
    });
  }
}

import { PrismaClient, Prisma } from '@prisma/client';
import { addDays, parseISO } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateTurmaData {
  name: string;
  courseId?: string | undefined; // Keep for backward compatibility
  courseIds?: string[] | undefined; // New field for multiple courses
  type: 'COLLECTIVE' | 'PRIVATE' | 'SEMI_PRIVATE';
  startDate: string;
  endDate?: string | null | undefined;
  maxStudents?: number | undefined;
  instructorId: string;
  organizationId: string;
  unitId: string;
  trainingAreaId?: string | undefined;
  room?: string | null | undefined;
  price?: number | null | undefined;
  description?: string | undefined;
  schedule: {
    daysOfWeek: number[];
    time: string;
    duration: number;
  };
  requireAttendanceForProgress?: boolean | undefined;
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
  /**
   * Helper method to convert Instructor.id to User.id
   * Frontend sends Instructor.id, but Turma FK expects User.id
   */
  async getInstructorUserId(instructorId: string) {
    // Try to find by Instructor.id first
    let instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { userId: true, id: true }
    });
    
    // If not found, try finding by User.id (fallback for frontend sending userId)
    if (!instructor) {
      instructor = await prisma.instructor.findFirst({
        where: { userId: instructorId },
        select: { userId: true, id: true }
      });
    }
    
    return instructor;
  }

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
        courses: {
          include: { course: true }
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
    console.log('[TurmasService] Create method called with data:', JSON.stringify(data, null, 2));
    
  // Handle courseIds (multiple courses) or fallback to single courseId
  const courseIds = data.courseIds && data.courseIds.length > 0 ? data.courseIds : (data.courseId ? [data.courseId] : []);
    console.log('[TurmasService] Processed courseIds:', courseIds);
    
    if (courseIds.length === 0) {
      console.error('[TurmasService] No courses provided');
      throw new Error('At least one course must be provided');
    }

    // Use the first course as the primary course for backward compatibility
    const primaryCourseId = courseIds[0];
    console.log('[TurmasService] Primary course ID:', primaryCourseId);

    try {
      console.log('[TurmasService] Starting transaction...');
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
          courseId: primaryCourseId!, // Set primary course for backward compatibility (validated earlier)
          instructorId: data.instructorId,
          organizationId: data.organizationId,
          unitId: data.unitId,
          trainingAreaId: data.trainingAreaId || null,
          room: data.room || null,
          // Prisma expects Decimal for price; allow null if absent
          price: typeof data.price === 'number' ? new Prisma.Decimal(data.price) : null,
          description: data.description || null,
          // requireAttendanceForProgress may not exist in current Prisma client; set via update if needed
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
    } catch (error) {
      console.error('[TurmasService] Error in create method:', error);
      throw error;
    }
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
      if ('endDate' in data) {
        if (data.endDate) {
          console.log('[TurmasService] Processing endDate:', data.endDate);
          updateData.endDate = parseISO(data.endDate);
        } else {
          // explicit null clears endDate
          updateData.endDate = null;
        }
      }
      if (typeof data.maxStudents !== 'undefined') updateData.maxStudents = data.maxStudents;
      if (data.schedule) {
        console.log('[TurmasService] Processing schedule:', JSON.stringify(data.schedule));
        updateData.schedule = data.schedule;
      }
      if (data.instructorId) updateData.instructorId = data.instructorId;
      if (data.unitId) updateData.unitId = data.unitId;
      if (data.trainingAreaId !== undefined) updateData.trainingAreaId = data.trainingAreaId || null;
      if (data.room !== undefined) updateData.room = data.room || null;
      if ('price' in data) {
        updateData.price = data.price === undefined || data.price === null ? null : new Prisma.Decimal(data.price);
      }
      if (data.description !== undefined) updateData.description = data.description || null;
      if (typeof data.requireAttendanceForProgress !== 'undefined') {
        updateData.requireAttendanceForProgress = Boolean(data.requireAttendanceForProgress);
      }

      console.log('[TurmasService] Final update data:', JSON.stringify(updateData, null, 2));

      // If courseIds were provided, set primary courseId to the first item
      if (data.courseIds && data.courseIds.length > 0) {
        updateData.courseId = data.courseIds[0];
      }
      // Or if a single courseId is provided, also update
      if (data.courseId) {
        updateData.courseId = data.courseId;
      }

      // Run update and optional course-relations sync in a transaction
      const turma = await prisma.$transaction(async (tx) => {
        const updated = await tx.turma.update({
          where: { id },
          data: updateData,
          include: {
            course: true,
            courses: { include: { course: true } },
            instructor: true,
            organization: true,
            unit: true,
          }
        });

        // Sync TurmaCourse relations if courseIds provided
        if (data.courseIds) {
          const desired = new Set(data.courseIds);
          const existing = await tx.turmaCourse.findMany({ where: { turmaId: id } });
          const existingSet = new Set(existing.map(e => e.courseId));

          // Add missing
          const toAdd = [...desired].filter(c => !existingSet.has(c));
          if (toAdd.length) {
            await tx.turmaCourse.createMany({
              data: toAdd.map(courseId => ({ turmaId: id, courseId }))
            });
          }

          // Remove extras
          const toRemove = [...existingSet].filter(c => !desired.has(c));
          if (toRemove.length) {
            await tx.turmaCourse.deleteMany({
              where: { turmaId: id, courseId: { in: toRemove } }
            });
          }
        }

        // After syncing relations, refetch the complete turma within the transaction
        // ❌ REMOVIDO lessons do include para evitar timeout - 53+ aulas com attendances causam query N+1
        const refreshed = await tx.turma.findUnique({
          where: { id },
          include: {
            course: true,
            courses: { include: { course: true } },
            instructor: true,
            organization: true,
            unit: true,
            students: { include: { student: true } }
            // lessons removido - frontend carrega separadamente se necessário
          }
        });

        // Fallback to the previously updated object if refetch somehow fails
        return refreshed ?? updated;
      },
      {
        maxWait: 5000, // Reduzido de 10000 - sem lessons o query é rápido
        timeout: 8000, // Reduzido de 15000
      });

      console.log('[TurmasService] Update successful');

      // Regenerate schedule if course or timing changed
      // 🔥 FIX: Run in background to avoid timeout (53+ lessons = 10s+)
      if (data.courseIds || data.schedule || data.startDate || data.endDate) {
        console.log('[TurmasService] Schedule regeneration queued (will run in background)...');
        // Fire and forget - não bloqueia o response
        this.regenerateSchedule(id).catch(err => {
          console.error('[TurmasService] Background schedule regeneration failed:', err);
        });
      }

      // Regenerar cronograma se as datas ou horários mudaram
      // Temporariamente comentado para debug
      // if (data.startDate || data.endDate || data.schedule) {
      //   console.log('[TurmasService] Regenerating schedule...');
      //   await this.regenerateSchedule(id);
      // }

      return turma;
    } catch (error) {
      console.error('[TurmasService] Update error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target && target.includes('name') && target.includes('organizationId')) {
            // Lançar um erro específico que o controller pode capturar
            throw new Error('DUPLICATE_TURMA_NAME');
          }
        }
      }
      throw error;
    }
  }  
  
  async delete(id: string) {
    try {
      console.log(`[TurmasService] Deleting turma ${id}...`);
      
      // 🔥 DELETE OPTIMIZATION: Delete in transaction with explicit cascade
      await prisma.$transaction(async (tx) => {
        // 1. Delete attendances first (most records)
        const attendanceCount = await tx.turmaAttendance.deleteMany({
          where: { turmaId: id }
        });
        console.log(`[TurmasService] Deleted ${attendanceCount.count} attendances`);
        
        // 2. Delete lessons (potentially many records)
        const lessonCount = await tx.turmaLesson.deleteMany({
          where: { turmaId: id }
        });
        console.log(`[TurmasService] Deleted ${lessonCount.count} lessons`);
        
        // 3. Delete student enrollments
        const studentCount = await tx.turmaStudent.deleteMany({
          where: { turmaId: id }
        });
        console.log(`[TurmasService] Deleted ${studentCount.count} student enrollments`);
        
        // 4. Delete course associations
        const courseCount = await tx.turmaCourse.deleteMany({
          where: { turmaId: id }
        });
        console.log(`[TurmasService] Deleted ${courseCount.count} course associations`);
        
        // 5. Finally delete the turma itself
        await tx.turma.delete({
          where: { id }
        });
        console.log(`[TurmasService] Turma ${id} deleted successfully`);
      }, {
        timeout: 30000 // 30 seconds timeout for large deletes
      });
      
      return true;
    } catch (error) {
      console.error(`[TurmasService] Error deleting turma ${id}:`, error);
      return false;
    }
  }

  async generateSchedule(turmaId: string) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: {
        course: {
          include: {
            lessonPlans: true
          }
        }
      }
    });
    
    if (!turma) throw new Error('Turma não encontrada');

    const { course, schedule, startDate, endDate } = turma;
    const lessonPlans = course?.lessonPlans || [];

    // Limpar cronograma existente
    // 🔥 OPTIMIZATION: Only delete if we're actually going to create new lessons
    const existingCount = await prisma.turmaLesson.count({ where: { turmaId } });
    
    if (existingCount > 0) {
      console.log(`[TurmasService] Deleting ${existingCount} existing lessons for turma ${turmaId}...`);
      await prisma.turmaLesson.deleteMany({
        where: { turmaId }
      });
    }

    // If no lesson plans, skip schedule generation
    if (!lessonPlans || lessonPlans.length === 0) {
      console.log(`Turma ${turmaId} has no lesson plans, skipping schedule generation`);
      return [];
    }

    // Cast schedule to proper type
    const scheduleData = schedule as { daysOfWeek: number[]; time: string; duration: number };

    if (!scheduleData?.daysOfWeek || scheduleData.daysOfWeek.length === 0) {
      console.warn(`Turma ${turmaId} possui cronograma sem dias da semana definidos. Ignorando geração de aulas.`);
      return [];
    }

    const lessons: any[] = [];

    const toLocalDate = (value: Date | string | null | undefined) => {
      if (!value) return null;
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    };

    const startLocal = toLocalDate(startDate);
    if (!startLocal) {
      console.warn(`Turma ${turmaId} possui startDate inválida. Ignorando geração de aulas.`);
      return [];
    }

    const endLocal = toLocalDate(endDate);
    if (endLocal) {
      endLocal.setHours(23, 59, 59, 999);
    }

    const maxDate = endLocal ? new Date(endLocal) : addDays(new Date(startLocal), 365);
    const rawDays = Array.isArray(scheduleData.daysOfWeek) ? scheduleData.daysOfWeek : [];
    const scheduleDays = rawDays
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

    if (scheduleDays.length === 0) {
      console.warn(`Turma ${turmaId} possui cronograma sem dias válidos. Ignorando geração de aulas.`);
      return [];
    }

    const timeParts = (scheduleData.time || '00:00').split(':');
    const scheduleHour = Number.parseInt(timeParts[0] ?? '0', 10);
    const scheduleMinute = Number.parseInt(timeParts[1] ?? '0', 10);

    // Encontrar o primeiro dia alinhado ao cronograma a partir da data inicial
    let currentDate = new Date(startLocal);
    let alignmentGuard = 0;
    while (!scheduleDays.includes(currentDate.getDay()) && currentDate <= maxDate) {
      currentDate = addDays(currentDate, 1);
      alignmentGuard += 1;
      if (alignmentGuard > 14) {
        console.warn(`Turma ${turmaId} não possui correspondência de dia da semana dentro das duas primeiras semanas. Abortando geração.`);
        return [];
      }
    }

    let lessonIndex = 0;
    const lessonLimit = lessonPlans.length > 0 ? lessonPlans.length * 104 : 0;

    while (currentDate <= maxDate) {
      if (scheduleDays.includes(currentDate.getDay())) {
        const lessonPlan = lessonPlans.length
          ? lessonPlans[lessonIndex % lessonPlans.length]
          : null;

        const scheduledDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          Number.isFinite(scheduleHour) ? scheduleHour : 0,
          Number.isFinite(scheduleMinute) ? scheduleMinute : 0,
          0,
          0
        );

        lessons.push({
          turmaId,
          lessonPlanId: lessonPlan?.id || null,
          lessonNumber: lessonIndex + 1,
          title: this.buildLessonTitle(lessonPlan?.title, lessonIndex + 1),
          scheduledDate,
          status: 'SCHEDULED',
          duration: scheduleData.duration || 60
        });

        lessonIndex += 1;

        if (!endLocal && lessonLimit && lessonIndex >= lessonLimit) {
          break;
        }
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
    // If trying to complete a lesson, and turma requires attendance progression and is personal/semi-private, enforce rule
    if (status === 'COMPLETED') {
      const lesson = await prisma.turmaLesson.findUnique({
        where: { id: lessonId },
        include: {
          turma: { include: { students: true } },
          attendances: true,
        }
      });

      if (lesson && lesson.turma) {
        const turma = lesson.turma as any;
        const requires = Boolean(turma.requireAttendanceForProgress) && (turma.classType === 'PRIVATE' || turma.classType === 'SEMI_PRIVATE');
        if (requires) {
          const totalStudents = (turma.students || []).length;
          const presentCount = (lesson.attendances || []).filter((a: any) => a.present).length;
          if (totalStudents > 0 && presentCount < totalStudents) {
            throw new Error('ATTENDANCE_REQUIRED');
          }
        }
      }
    }

    return await prisma.turmaLesson.update({
      where: { id: lessonId },
      data: { status: status as any },
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

  // ===== Operações administrativas =====
  async clearAllEndDates() {
    const result = await prisma.turma.updateMany({
      data: { endDate: null }
    });
    return result; // { count: number }
  }

  async getStudents(turmaId: string) {
    return await prisma.turmaStudent.findMany({
      where: { turmaId },
      include: {
        student: true
      },
      // No explicit order because TurmaStudent doesn't have joinedAt in schema
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
        studentId
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
        { lesson: { scheduledDate: 'desc' } }
      ]
    });
  }

  
    async markAttendance(turmaId: string, data: MarkAttendanceData) {
      // Map status string to boolean flags
      const present = data.status === 'PRESENT' || data.status === 'LATE' || data.status === 'EXCUSED';
      const late = data.status === 'LATE';
      const justified = data.status === 'EXCUSED';

      // Find TurmaStudentId (required by schema)
      const turmaStudent = await prisma.turmaStudent.findUnique({
        where: {
          turmaId_studentId: { turmaId, studentId: data.studentId }
        }
      });

      if (!turmaStudent) {
        throw new Error('Aluno não está matriculado nesta turma');
      }

      return await prisma.turmaAttendance.upsert({
        where: {
          turmaLessonId_studentId: {
            turmaLessonId: data.lessonId,
            studentId: data.studentId
          }
        },
        update: {
          present,
          late,
          justified,
          checkedAt: new Date()
        },
        create: {
          turmaId,
          turmaLessonId: data.lessonId,
          turmaStudentId: turmaStudent.id,
          studentId: data.studentId,
          present,
          late,
          justified,
          checkedAt: new Date()
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

  async getReports(turmaId: string, _filters: ReportFilters = {}) {
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
    // Frequência por aluno (compute from boolean flags)
    const attendances = await prisma.turmaAttendance.findMany({
      where: { turmaId }
    });

    const attendanceMap: Record<string, { studentId: string; present: number; absent: number; late: number; excused: number; total: number }> = {};
    for (const a of attendances) {
      const rec = attendanceMap[a.studentId] || { studentId: a.studentId, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      if (a.present) rec.present += 1; else rec.absent += 1;
      if (a.late) rec.late += 1;
      if (a.justified) rec.excused += 1;
      rec.total += 1;
      attendanceMap[a.studentId] = rec;
    }
    const attendanceReport = Object.values(attendanceMap).map(s => ({
      ...s,
      attendanceRate: s.total > 0 ? (s.present / s.total) * 100 : 0
    }));

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
      attendance: attendanceReport,
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

  private buildLessonTitle(rawTitle: string | null | undefined, lessonNumber: number) {
    const normalizedNumber = Number.isFinite(lessonNumber) ? Number(lessonNumber) : null;
    const baseTitle = (rawTitle ?? '').trim();

    if (!normalizedNumber) {
      return baseTitle || 'Aula';
    }

    if (!baseTitle) {
      return `Aula ${normalizedNumber}`;
    }

    const match = baseTitle.match(/^Aula\s+\d+\s*[-:–]?\s*(.*)$/i);
    if (match) {
      const suffix = match[1]?.trim();
      return suffix ? `Aula ${normalizedNumber} - ${suffix}` : `Aula ${normalizedNumber}`;
    }

    return `Aula ${normalizedNumber} - ${baseTitle}`;
  }
}

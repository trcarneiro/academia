import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/types';

interface ClassFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  instructor?: string;
  course?: string;
  status?: string;
  type?: 'CLASS' | 'PERSONAL_SESSION' | 'TURMA';
  limit: number;
  offset: number;
  organizationId?: string;
}

export class AgendaController {
  private prisma: PrismaClient;

  constructor(private fastify: FastifyInstance) {
    this.prisma = new PrismaClient();
  }

  /**
   * Parse a YYYY-MM-DD string to a local Date (midnight local time)
   */
  private parseLocalDate(dateStr: string): Date {
    const parts = (dateStr || '').split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    // Fallbacks to avoid passing undefined; if invalid, Date will become Invalid Date
    return new Date(isNaN(y) ? 0 : y, (isNaN(m) ? 1 : m) - 1, isNaN(d) ? 1 : d, 0, 0, 0, 0);
  }

  /**
   * Format a Date to local YYYY-MM-DD (no timezone shifts)
   */
  private formatLocalYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Buscar aulas com filtros
   */
  async getClasses(filters: ClassFilters & { organizationId?: string }, user?: { id: string; role: string }) {
    try {
      const whereClause: any = {};
      if (filters.organizationId) {
        whereClause.organizationId = filters.organizationId;
      }

      // Filtro por data (suporte para data única ou intervalo)
      if (filters.startDate && filters.endDate) {
        // Usar intervalo de datas — tratar como datas locais (evitar deslocamento por timezone)
        const startDate = this.parseLocalDate(filters.startDate);
        const endDate = this.parseLocalDate(filters.endDate);
        // Incluir o dia completo no final
        endDate.setHours(23, 59, 59, 999);

        whereClause.startTime = { gte: startDate, lte: endDate };
      } else if (filters.date) {
        // Usar dia único (00:00 até 23:59 local)
        const startDate = this.parseLocalDate(filters.date);
        const endDate = this.parseLocalDate(filters.date);
        endDate.setHours(23, 59, 59, 999);

        whereClause.startTime = { gte: startDate, lte: endDate };
      }

      // Filtro por instrutor
      if (filters.instructor) {
        whereClause.instructorId = filters.instructor;
      }

      // Filtro por curso
      if (filters.course) {
        whereClause.courseId = filters.course;
      }

      // Filtro por status
      if (filters.status) {
        whereClause.status = filters.status;
      }

      const classes = await this.prisma.class.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          attendances: {
            select: {
              id: true,
              studentId: true,
              status: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        take: filters.limit,
        skip: filters.offset
      });

      // Manual serialization para evitar problemas do Fastify
      const serializedClasses = classes.map(cls => ({
        id: cls.id,
        title: cls.title,
        startTime: cls.startTime.toISOString(),
        endTime: cls.endTime.toISOString(),
        status: cls.status,
        maxStudents: cls.maxStudents,
        actualStudents: cls.actualStudents,
        description: cls.description,
        notes: cls.notes,
        type: 'CLASS',
        course: cls.course ? {
          id: cls.course.id,
          name: cls.course.name,
          category: cls.course.category
        } : null,
        instructor: cls.instructor ? {
          id: cls.instructor.id,
          name: `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}`.trim(),
          email: cls.instructor.user.email
        } : null,
        attendanceCount: cls.attendances.length,
        attendances: cls.attendances.map(att => ({
          id: att.id,
          studentId: att.studentId,
          status: att.status
        }))
      }));

      // Also fetch personal training sessions in the same time window to unify agenda
      let personalSessions: any[] = [];
      try {
        const psWhere: any = {};
        if (whereClause.startTime?.gte && whereClause.startTime?.lt) {
          psWhere.startTime = { gte: whereClause.startTime.gte, lt: whereClause.startTime.lt };
        } else if (whereClause.startTime?.gte && whereClause.startTime?.lte) {
          psWhere.startTime = { gte: whereClause.startTime.gte, lte: whereClause.startTime.lte };
        }
        if (filters.status) {
          psWhere.status = filters.status as any;
        }
        if (filters.course) {
          psWhere.courseId = filters.course;
        }
        if (filters.instructor) {
          psWhere.personalClass = { ...(psWhere.personalClass || {}), instructorId: filters.instructor };
        }

        // --- VISIBILITY FILTER ---
        if (user) {
          if (user.role === UserRole.STUDENT) {
            // Student can ONLY see their own personal sessions
            const student = await this.prisma.student.findFirst({ where: { userId: user.id } });
            if (student) {
              psWhere.personalClass = { ...(psWhere.personalClass || {}), studentId: student.id };
            } else {
              // If valid student record not found, likely inconsistent state. Better safe than sorry.
              // Prevent showing ANY personal session.
              psWhere.id = '00000000-0000-0000-0000-000000000000';
            }
          } else if (user.role === UserRole.INSTRUCTOR) {
            // Instructor can ONLY see sessions they teach (OR maybe their own if they are a student too? Access hierarchy?)
            // Assuming strict instructor view for now.
            const instructor = await this.prisma.instructor.findFirst({ where: { userId: user.id } });
            if (instructor) {
              psWhere.personalClass = { ...(psWhere.personalClass || {}), instructorId: instructor.id };
            }
          }
          // ADMIN / MANAGER / SUPER_ADMIN see all (no extra filter)
        }

        personalSessions = await this.prisma.personalTrainingSession.findMany({
          where: psWhere,
          include: {
            course: { select: { id: true, name: true, category: true } },
            personalClass: {
              include: {
                instructor: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
                student: { include: { user: { select: { firstName: true, lastName: true } } } }
              }
            }
          },
          orderBy: { startTime: 'asc' },
          take: filters.limit,
          skip: filters.offset
        });
      } catch (e) {
        this.fastify.log.warn({ e }, 'Failed to fetch personal sessions for unified agenda');
      }

      const serializedSessions = personalSessions.map((s: any) => ({
        id: s.id,
        title: s.personalClass?.title || s.course?.name || 'Sessão Personal',
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        status: s.status,
        maxStudents: 1,
        actualStudents: s.attendanceConfirmed ? 1 : 0,
        description: s.instructorNotes || s.feedback || null,
        notes: s.progressNotes || null,
        type: 'PERSONAL_SESSION',
        course: s.course ? { id: s.course.id, name: s.course.name, category: s.course.category } : null,
        instructor: s.personalClass?.instructor ? {
          id: s.personalClass.instructor.id,
          name: `${s.personalClass.instructor.user.firstName} ${s.personalClass.instructor.user.lastName}`.trim(),
          email: s.personalClass.instructor.user.email
        } : null,
        student: s.personalClass?.student ? {
          id: s.personalClass.student.id,
          name: `${s.personalClass.student.user.firstName} ${s.personalClass.student.user.lastName}`.trim()
        } : null,
        attendanceCount: s.attendanceConfirmed ? 1 : 0,
        attendances: []
      }));

      // Apply type filtering semantics
      let turmaClasses: any[] = [];

      if (filters.type === 'TURMA') {
        const vf: ClassFilters = { ...filters } as any;
        if (!vf.startDate || !vf.endDate) {
          if (vf.date) {
            vf.startDate = vf.date;
            vf.endDate = vf.date;
          } else {
            const today = new Date();
            const monday = new Date(today);
            monday.setDate(today.getDate() - today.getDay() + 1);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            vf.startDate = this.formatLocalYMD(monday);
            vf.endDate = this.formatLocalYMD(sunday);
          }
        }

        turmaClasses = await this.generateVirtualClassesFromTurmas(vf);
        return {
          success: true,
          data: turmaClasses,
          total: turmaClasses.length,
          source: 'turma_lessons'
        };
      }

      if (filters.type === 'CLASS') {
        const sorted = serializedClasses.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return { success: true, data: sorted, total: sorted.length, source: 'classes_only' };
      }

      if (filters.type === 'PERSONAL_SESSION') {
        const sorted = serializedSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return { success: true, data: sorted, total: sorted.length, source: 'personal_only' };
      }

      if (!filters.type && filters.startDate && filters.endDate) {
        turmaClasses = await this.generateVirtualClassesFromTurmas(filters);
      }

      const unified = [...serializedClasses, ...serializedSessions, ...turmaClasses]
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Se não há itens reais, gerar classes virtuais das turmas para o período solicitado
      if (unified.length === 0 && (filters.startDate && filters.endDate)) {
        const virtualClasses = turmaClasses.length ? turmaClasses : await this.generateVirtualClassesFromTurmas(filters);
        return {
          success: true,
          data: virtualClasses,
          total: virtualClasses.length,
          source: 'turma_lessons'
        };
      }

      return {
        success: true,
        data: unified,
        total: unified.length,
        source: turmaClasses.length && serializedClasses.length === 0 && serializedSessions.length === 0
          ? 'turma_lessons'
          : 'unified'
      };
    } catch (error) {
      this.fastify.log.error({
        err: error,
        filters
      }, 'Error in getClasses');
      throw error;
    }
  }

  /**
   * Gerar classes virtuais a partir das turmas para uma data específica
   */
  private async generateVirtualClassesFromTurmas(filters: ClassFilters & { organizationId?: string }) {
    try {
      if (!filters.startDate || !filters.endDate) {
        return [];
      }

      const startDate = this.parseLocalDate(filters.startDate);
      const endDate = this.parseLocalDate(filters.endDate);
      endDate.setHours(23, 59, 59, 999);

      // 1. Buscar turmas ativas
      const turmaConditions: any = {
        isActive: true
      };

      if (filters.organizationId) {
        turmaConditions.organizationId = filters.organizationId;
      }

      if (filters.instructor) {
        turmaConditions.instructorId = filters.instructor;
      }

      if (filters.course) {
        turmaConditions.courseId = filters.course;
      }

      const turmas = await this.prisma.turma.findMany({
        where: turmaConditions,
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unit: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 2. Buscar lições existentes (exceções ou confirmações)
      const lessonWhere: any = {
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        turma: turmaConditions
      };

      if (filters.status) {
        lessonWhere.status = filters.status as any;
      }

      const existingLessons = await this.prisma.turmaLesson.findMany({
        where: lessonWhere,
        include: {
          turma: {
            include: {
              course: true,
              instructor: true,
              unit: true
            }
          },
          lessonPlan: {
            select: {
              id: true,
              title: true,
              description: true
            }
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
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Mapa de lições existentes: turmaId-YYYY-MM-DD -> Lesson
      const lessonMap = new Map<string, any>();
      existingLessons.forEach(lesson => {
        const dateKey = this.formatLocalYMD(lesson.scheduledDate);
        lessonMap.set(`${lesson.turmaId}-${dateKey}`, lesson);
      });

      const virtualClasses: any[] = [];

      // 3. Iterar dias e turmas
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0-6
        const dateKey = this.formatLocalYMD(currentDate);

        for (const turma of turmas) {
          // Check turma validity dates
          if (turma.startDate && currentDate < turma.startDate) continue;
          if (turma.endDate && currentDate > turma.endDate) continue;

          // Parse schedule
          const schedule = turma.schedule as any;
          if (!schedule || !Array.isArray(schedule.daysOfWeek)) continue;

          if (schedule.daysOfWeek.includes(dayOfWeek)) {
            // Check if concrete lesson exists
            const existing = lessonMap.get(`${turma.id}-${dateKey}`);

            if (existing) {
              // Use existing lesson
              const startTime = existing.scheduledDate;
              const endTime = new Date(startTime.getTime() + (existing.duration || 60) * 60 * 1000);
              const instructor = existing.turma?.instructor || turma.instructor;
              const instructorName = instructor
                ? `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim()
                : '';

              virtualClasses.push({
                id: `turmaLesson-${existing.id}`,
                type: 'TURMA',
                title: this.formatTurmaLessonTitle(existing.title, existing.lessonNumber),
                lessonNumber: existing.lessonNumber,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                status: existing.status,
                maxStudents: turma.maxStudents ?? 0,
                actualStudents: existing.attendances.length,
                description: existing.lessonPlan?.description || existing.notes || turma.description || `Aula da turma ${turma.name}`,
                notes: existing.notes || null,
                course: turma.course ? {
                  id: turma.course.id,
                  name: turma.course.name,
                  category: turma.course.category
                } : null,
                instructor: instructor ? {
                  id: turma.instructorId,
                  name: instructorName || instructor.email || 'Instrutor',
                  email: instructor.email ?? ''
                } : null,
                attendanceCount: existing.attendances.length,
                attendances: [],
                isVirtual: false,
                turmaId: existing.turmaId,
                unit: turma.unit ? {
                  id: turma.unit.id,
                  name: turma.unit.name
                } : null
              });
            } else {
              // Create virtual lesson
              if (filters.status && filters.status !== 'SCHEDULED') continue;

              const timeParts = (schedule.time || '00:00').split(':');
              const hour = parseInt(timeParts[0]);
              const minute = parseInt(timeParts[1]);

              const startTime = new Date(currentDate);
              startTime.setHours(hour, minute, 0, 0);

              const duration = parseInt(schedule.duration || '60');
              const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

              const instructor = turma.instructor;
              const instructorName = instructor
                ? `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim()
                : '';

              virtualClasses.push({
                id: `virtual-${turma.id}-${dateKey}`,
                type: 'TURMA',
                title: turma.name,
                lessonNumber: null,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                status: 'SCHEDULED',
                maxStudents: turma.maxStudents ?? 0,
                actualStudents: 0,
                description: turma.description || `Aula da turma ${turma.name}`,
                notes: null,
                course: turma.course ? {
                  id: turma.course.id,
                  name: turma.course.name,
                  category: turma.course.category
                } : null,
                instructor: instructor ? {
                  id: turma.instructorId,
                  name: instructorName || instructor.email || 'Instrutor',
                  email: instructor.email ?? ''
                } : null,
                attendanceCount: 0,
                attendances: [],
                isVirtual: true,
                turmaId: turma.id,
                unit: turma.unit ? {
                  id: turma.unit.id,
                  name: turma.unit.name
                } : null
              });
            }
          }
        }

        // Next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return virtualClasses.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    } catch (error) {
      console.error('Error generating turma lessons:', error);
      return [];
    }
  }

  /**
   * Estatísticas do dia
   */
  async getDayStats(ctx?: { organizationId?: string }) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [
        totalClasses,
        inProgressClasses,
        completedClasses,
        totalAttendances,
        activeInstructorsCount
      ] = await Promise.all([
        this.prisma.class.count({
          where: {
            ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        this.prisma.class.count({
          where: {
            ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'IN_PROGRESS'
          }
        }),
        this.prisma.class.count({
          where: {
            ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'COMPLETED'
          }
        }),
        this.prisma.attendance.count({
          where: {
            class: {
              ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
              startTime: {
                gte: startOfDay,
                lt: endOfDay
              }
            },
            status: 'PRESENT'
          }
        }),
        this.prisma.class.findMany({
          where: {
            ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          },
          select: {
            instructorId: true
          },
          distinct: ['instructorId']
        }).then(results => results.length)
      ]);

      // Add virtual turmas count for today to totalClasses (so cards align with virtual listing)
      let virtualCount = 0;
      try {
        const weekDay = startOfDay.getDay();
        const turmas = await this.prisma.turma.findMany({
          where: { isActive: true, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } as any },
          select: { schedule: true },
        });
        virtualCount = turmas.filter((t: any) => {
          const days = Array.isArray(t.schedule?.daysOfWeek)
            ? (t.schedule.daysOfWeek as any[]).map((v) => Number(v)).filter((n) => !Number.isNaN(n))
            : [];
          return days.includes(weekDay);
        }).length;
      } catch (e) {
        this.fastify.log.warn({ e }, 'Failed to compute virtual turmas count');
      }

      return {
        success: true,
        data: {
          totalClasses: totalClasses + virtualCount,
          inProgressClasses,
          completedClasses,
          totalAttendances,
          activeInstructors: activeInstructorsCount,
          checkedIn: totalAttendances // Alias for consistency
        }
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getDayStats');
      throw error;
    }
  }

  /**
   * Aulas de hoje
   */
  async getTodayClasses(ctx?: { organizationId?: string }) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const classes = await this.prisma.class.findMany({
        where: {
          ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
          // Use calendar day (class.date) as the single source of truth to avoid timezone drift
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          },
          attendances: {
            select: {
              id: true,
              studentId: true,
              status: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Agrupar por horário
      const groupedClasses = classes.reduce((acc: Record<string, any[]>, cls) => {
        const timeKey = cls.startTime.toTimeString().slice(0, 5); // HH:MM
        if (!acc[timeKey]) {
          acc[timeKey] = [];
        }
        acc[timeKey].push({
          id: cls.id,
          title: cls.title,
          startTime: cls.startTime.toISOString(),
          endTime: cls.endTime.toISOString(),
          status: cls.status,
          maxStudents: cls.maxStudents,
          description: cls.description,
          location: cls.location,
          course: (cls as any).course ? {
            id: (cls as any).course.id,
            name: (cls as any).course.name,
            category: (cls as any).course.category
          } : null,
          instructor: (cls as any).instructor ? {
            id: (cls as any).instructor.id,
            name: `${(cls as any).instructor.user.firstName} ${(cls as any).instructor.user.lastName}`.trim(),
            email: (cls as any).instructor.user.email
          } : null,
          attendanceCount: (cls as any).attendances.length
        });
        return acc;
      }, {});

      return {
        success: true,
        data: groupedClasses
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getTodayClasses');
      throw error;
    }
  }

  /**
   * Aulas da semana
   */
  async getWeekClasses(ctx?: { organizationId?: string }) {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const classes = await this.prisma.class.findMany({
        where: {
          ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
          startTime: {
            gte: startOfWeek,
            lt: endOfWeek
          }
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Agrupar por dia da semana
      const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'] as const;
      const groupedClasses = classes.reduce((acc: Record<string, any[]>, cls) => {
        const dayIndex = cls.startTime.getDay();
        const dayName: string = (weekDays[dayIndex] as unknown as string) ?? String(dayIndex);

        if (!acc[dayName]) {
          acc[dayName] = [];
        }

        acc[dayName].push({
          id: cls.id,
          title: cls.title,
          startTime: cls.startTime.toISOString(),
          endTime: cls.endTime.toISOString(),
          status: cls.status,
          course: (cls as any).course ? {
            id: (cls as any).course.id,
            name: (cls as any).course.name,
            category: (cls as any).course.category
          } : null,
          instructor: (cls as any).instructor ? {
            id: (cls as any).instructor.id,
            name: `${(cls as any).instructor.user.firstName} ${(cls as any).instructor.user.lastName}`.trim()
          } : null
        });

        return acc;
      }, {});

      return {
        success: true,
        data: groupedClasses
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getWeekClasses');
      throw error;
    }
  }

  /**
   * Lista de instrutores
   */
  async getInstructors(ctx?: { organizationId?: string }) {
    try {
      const instructors = await this.prisma.instructor.findMany({
        where: ctx?.organizationId ? { organizationId: ctx.organizationId } : {},
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          specializations: true
        },
        orderBy: {
          user: { firstName: 'asc' }
        }
      });

      return {
        success: true,
        data: instructors.map((i) => ({
          id: i.id,
          name: `${(i as any).user.firstName} ${(i as any).user.lastName}`.trim(),
          email: (i as any).user.email,
          specializations: i.specializations,
        }))
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getInstructors');
      throw error;
    }
  }

  /**
   * Lista de cursos
   */
  async getCourses(ctx?: { organizationId?: string }) {
    try {
      const courses = await this.prisma.course.findMany({
        where: ctx?.organizationId ? { organizationId: ctx.organizationId } : {},
        select: {
          id: true,
          name: true,
          category: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        success: true,
        data: courses
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getCourses:');
      throw error;
    }
  }

  /**
   * Atualizar status da aula
   */
  async updateClassStatus(classId: string, status: string, ctx?: { organizationId?: string }) {
    try {
      const updatedClass = await this.prisma.class.update({
        where: { id: classId },
        data: { status: status as any },
        include: {
          course: {
            select: {
              id: true,
              name: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } }
            }
          }
        }
      });

      return {
        success: true,
        data: {
          id: updatedClass.id,
          title: updatedClass.title,
          status: updatedClass.status,
          startTime: updatedClass.startTime.toISOString(),
          endTime: updatedClass.endTime.toISOString(),
          course: (updatedClass as any).course,
          instructor: (updatedClass as any).instructor ? {
            id: (updatedClass as any).instructor.id,
            name: `${(updatedClass as any).instructor.user.firstName} ${(updatedClass as any).instructor.user.lastName}`.trim(),
          } : null
        }
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in updateClassStatus');
      throw error;
    }
  }

  /**
   * Detalhes da aula
   */
  async getClassDetails(classId: string, ctx?: { organizationId?: string }) {
    try {
      // Verificar se é uma classe virtual (formato: turma-{id}-{date})
      if (classId.startsWith('turma-')) {
        return await this.getVirtualClassDetails(classId);
      }

      if (classId.startsWith('turmaLesson-')) {
        const lessonId = classId.replace('turmaLesson-', '');
        return await this.getTurmaLessonDetails(lessonId);
      }

      // Buscar classe real no banco
      const classDetails = await this.prisma.class.findFirst({
        where: { id: classId, ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}) },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
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
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!classDetails) {
        return {
          success: false,
          error: 'Aula não encontrada'
        };
      }

      return {
        success: true,
        data: {
          id: classDetails.id,
          title: classDetails.title,
          description: classDetails.description,
          startTime: classDetails.startTime.toISOString(),
          endTime: classDetails.endTime.toISOString(),
          status: classDetails.status,
          maxStudents: classDetails.maxStudents,
          location: classDetails.location,
          course: classDetails.course,
          instructor: {
            id: classDetails.instructor.id,
            name: `${classDetails.instructor.user.firstName} ${classDetails.instructor.user.lastName}`.trim(),
            email: classDetails.instructor.user.email
          },
          attendances: classDetails.attendances.map(att => ({
            id: att.id,
            status: att.status,
            checkInTime: att.checkInTime?.toISOString() || null,
            student: {
              id: att.student.id,
              name: `${att.student.user.firstName} ${att.student.user.lastName}`.trim(),
              email: att.student.user.email
            }
          }))
        }
      };
    } catch (error) {
      console.error('Error in getClassDetails:', error);
      throw error;
    }
  }

  /**
   * Detalhes de uma classe virtual gerada a partir de turma
   */
  private async getVirtualClassDetails(classId: string) {
    try {
      // Parse do ID da classe virtual: turma-{turmaId}-{YYYY-MM-DD}
      // Usa regex para evitar problemas com hífens no UUID
      const match = classId.match(/^turma-(.+)-(\d{4}-\d{2}-\d{2})$/);
      if (!match) {
        return {
          success: false,
          error: 'ID de classe virtual inválido'
        };
      }

      const turmaId = match[1] as string;
      const dateStr = match[2] as string;

      // Buscar a turma
      const turma = await this.prisma.turma.findFirst({
        where: { id: turmaId },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          unit: {
            select: {
              id: true,
              name: true,
              address: true
            }
          },
          trainingArea: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!turma) {
        return {
          success: false,
          error: 'Turma não encontrada'
        };
      }

      // Gerar informações da classe virtual
      const schedule = turma.schedule as any;
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const classDate = this.parseLocalDate(dateStr as string);
      const startTime = new Date(classDate);
      startTime.setHours(hours, minutes, 0, 0);

      const duration = schedule.duration || 60;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      return {
        success: true,
        data: {
          id: classId,
          title: turma.name,
          description: turma.description || `Aula da turma ${turma.name}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: 'SCHEDULED',
          maxStudents: turma.maxStudents,
          location: (turma as any).unit?.name || 'Local não definido',
          trainingArea: (turma as any).trainingArea?.name || null,
          course: (turma as any).course,
          instructor: (turma as any).instructor ? {
            id: (turma as any).instructor.id,
            name: `${(turma as any).instructor.firstName} ${(turma as any).instructor.lastName}`.trim(),
            email: (turma as any).instructor.email
          } : null,
          attendances: [],
          isVirtual: true,
          turmaId: turma.id,
          notes: 'Esta é uma aula gerada automaticamente da turma. Para registrar presenças, é necessário criar a aula real no sistema.'
        }
      };
    } catch (error) {
      console.error('Error in getVirtualClassDetails:', error);
      return {
        success: false,
        error: 'Erro ao buscar detalhes da classe virtual'
      };
    }
  }

  private async getTurmaLessonDetails(lessonId: string) {
    try {
      const lesson = await this.prisma.turmaLesson.findUnique({
        where: { id: lessonId },
        include: {
          turma: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true
                }
              },
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              unit: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          lessonPlan: {
            select: {
              id: true,
              title: true,
              description: true
            }
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
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!lesson || !lesson.turma) {
        return {
          success: false,
          error: 'Aula da turma não encontrada'
        };
      }

      const turma = lesson.turma;
      const startTime = lesson.scheduledDate;
      const endTime = new Date(startTime.getTime() + (lesson.duration || 60) * 60 * 1000);
      const instructor = turma.instructor;
      const instructorName = instructor ? `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim() : '';

      const mapAttendanceStatus = (attendance: any) => {
        if (attendance.present && attendance.late) return 'LATE';
        if (attendance.present) return 'PRESENT';
        if (attendance.justified) return 'EXCUSED';
        return 'ABSENT';
      };

      return {
        success: true,
        data: {
          id: `turmaLesson-${lesson.id}`,
          title: lesson.title,
          description: lesson.lessonPlan?.description || lesson.notes || turma.description || `Aula da turma ${turma.name}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: lesson.status,
          maxStudents: turma.maxStudents ?? 0,
          course: turma.course ? {
            id: turma.course.id,
            name: turma.course.name,
            category: turma.course.category,
            description: turma.course.description
          } : null,
          instructor: instructor ? {
            id: turma.instructorId,
            name: instructorName || instructor.email || 'Instrutor',
            email: instructor.email ?? ''
          } : null,
          attendances: lesson.attendances.map((att: any) => ({
            id: att.id,
            status: mapAttendanceStatus(att),
            checkInTime: att.checkedAt?.toISOString() ?? null,
            student: att.student ? {
              id: att.student.id,
              name: `${att.student.user?.firstName ?? ''} ${att.student.user?.lastName ?? ''}`.trim(),
              email: att.student.user?.email ?? ''
            } : null
          })),
          isVirtual: true,
          turmaId: lesson.turmaId,
          lessonNumber: lesson.lessonNumber,
          lessonPlan: lesson.lessonPlan ? {
            id: lesson.lessonPlan.id,
            title: lesson.lessonPlan.title,
            description: lesson.lessonPlan.description
          } : null
        }
      };
    } catch (error) {
      console.error('Error fetching turma lesson details:', error);
      return {
        success: false,
        error: 'Erro ao carregar detalhes da aula da turma'
      };
    }
  }

  /**
   * Agenda de uma data específica
   */
  async getScheduleByDate(date: string, ctx?: { organizationId?: string }) {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      const classes = await this.prisma.class.findMany({
        where: {
          ...(ctx?.organizationId ? { organizationId: ctx.organizationId } : {}),
          startTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          attendances: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      const schedule = classes.map((cls: any) => ({
        id: cls.id,
        title: cls.title,
        startTime: cls.startTime.toISOString(),
        endTime: cls.endTime.toISOString(),
        status: cls.status,
        maxStudents: cls.maxStudents,
        location: cls.location,
        course: cls.course,
        instructor: cls.instructor ? {
          id: cls.instructor.id,
          name: `${cls.instructor.user.firstName} ${cls.instructor.user.lastName}`.trim()
        } : null,
        attendanceCount: cls.attendances.length
      }));

      return {
        success: true,
        data: {
          date: date,
          classes: schedule,
          total: schedule.length
        }
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getScheduleByDate');
      throw error;
    }
  }

  /**
   * Get turmas with their schedules
   */
  async getTurmasWithSchedules(ctx?: { organizationId?: string }) {
    try {
      const turmas = await this.prisma.turma.findMany({
        include: {
          course: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const serializedTurmas = turmas.map(turma => ({
        id: turma.id,
        name: turma.name,
        description: turma.description,
        maxStudents: turma.maxStudents,
        // currentStudents is not tracked in Turma; can be derived from students length if needed
        isActive: turma.isActive,
        course: (turma as any).course ? {
          id: (turma as any).course.id,
          name: (turma as any).course.name,
          category: (turma as any).course.category
        } : null,
        instructor: (turma as any).instructor ? {
          id: (turma as any).instructor.id,
          name: `${(turma as any).instructor.firstName} ${(turma as any).instructor.lastName}`.trim()
        } : null,
        // Turma does not have a direct classes relation in Prisma schema here
        schedule: []
      }));

      return {
        success: true,
        data: serializedTurmas
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getTurmasWithSchedules:');
      throw error;
    }
  }

  /**
   * Get check-ins by date
   */
  async getCheckinsByDate(date: string, ctx?: { organizationId?: string }) {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      const checkins = await this.prisma.attendance.findMany({
        where: {
          checkInTime: {
            gte: startOfDay,
            lt: endOfDay
          },
          status: 'PRESENT'
        },
        orderBy: {
          checkInTime: 'desc'
        }
      });

      // Minimal payload to avoid Prisma include type issues; UI can hydrate details if needed
      const serializedCheckins = checkins.map((checkin: any) => ({
        id: checkin.id,
        checkInTime: checkin.checkInTime ? checkin.checkInTime.toISOString() : null,
        status: checkin.status,
        studentId: checkin.studentId,
        classId: checkin.classId
      }));

      return {
        success: true,
        data: serializedCheckins,
        total: serializedCheckins.length
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getCheckinsByDate:');
      throw error;
    }
  }

  private formatTurmaLessonTitle(rawTitle: string | null | undefined, lessonNumber?: number | null) {
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


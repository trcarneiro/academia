import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

interface ClassFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  instructor?: string;
  course?: string;
  status?: string;
  limit: number;
  offset: number;
}

export class AgendaController {
  private prisma: PrismaClient;

  constructor(private fastify: FastifyInstance) {
    this.prisma = new PrismaClient();
  }

  /**
   * Buscar aulas com filtros
   */
  async getClasses(filters: ClassFilters) {
    try {
      const whereClause: any = {};

      // Filtro por data (suporte para data única ou intervalo)
      if (filters.startDate && filters.endDate) {
        // Usar intervalo de datas
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        // Ajustar endDate para incluir o dia completo
        endDate.setHours(23, 59, 59, 999);

        whereClause.startTime = {
          gte: startDate,
          lte: endDate
        };
      } else if (filters.date) {
        // Usar data única
        const startDate = new Date(filters.date);
        const endDate = new Date(filters.date);
        endDate.setDate(endDate.getDate() + 1);

        whereClause.startTime = {
          gte: startDate,
          lt: endDate
        };
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

      return {
        success: true,
        data: serializedClasses,
        total: serializedClasses.length
      };
    } catch (error) {
      this.fastify.log.error('Error in getClasses:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters
      });
      throw error;
    }
  }

  /**
   * Estatísticas do dia
   */
  async getDayStats() {
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
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),
        this.prisma.class.count({
          where: {
            startTime: {
              gte: startOfDay,
              lt: endOfDay
            },
            status: 'IN_PROGRESS'
          }
        }),
        this.prisma.class.count({
          where: {
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

      return {
        success: true,
        data: {
          totalClasses,
          inProgressClasses,
          completedClasses,
          totalAttendances,
          activeInstructors: activeInstructorsCount,
          checkedIn: totalAttendances // Alias for consistency
        }
      };
    } catch (error) {
      this.fastify.log.error('Error in getDayStats:', error);
      throw error;
    }
  }

  /**
   * Aulas de hoje
   */
  async getTodayClasses() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const classes = await this.prisma.class.findMany({
        where: {
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
              name: true,
              email: true
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
      const groupedClasses = classes.reduce((acc: any, cls) => {
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
          course: cls.course ? {
            id: cls.course.id,
            name: cls.course.name,
            category: cls.course.category
          } : null,
          instructor: cls.instructor ? {
            id: cls.instructor.id,
            name: cls.instructor.name,
            email: cls.instructor.email
          } : null,
          attendanceCount: cls.attendances.length
        });
        return acc;
      }, {});

      return {
        success: true,
        data: groupedClasses
      };
    } catch (error) {
      this.fastify.log.error('Error in getTodayClasses:', error);
      throw error;
    }
  }

  /**
   * Aulas da semana
   */
  async getWeekClasses() {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const classes = await this.prisma.class.findMany({
        where: {
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
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Agrupar por dia da semana
      const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const groupedClasses = classes.reduce((acc: any, cls) => {
        const dayIndex = cls.startTime.getDay();
        const dayName = weekDays[dayIndex];
        
        if (!acc[dayName]) {
          acc[dayName] = [];
        }
        
        acc[dayName].push({
          id: cls.id,
          title: cls.title,
          startTime: cls.startTime.toISOString(),
          endTime: cls.endTime.toISOString(),
          status: cls.status,
          course: cls.course ? {
            id: cls.course.id,
            name: cls.course.name,
            category: cls.course.category
          } : null,
          instructor: cls.instructor ? {
            id: cls.instructor.id,
            name: cls.instructor.name
          } : null
        });
        
        return acc;
      }, {});

      return {
        success: true,
        data: groupedClasses
      };
    } catch (error) {
      this.fastify.log.error('Error in getWeekClasses:', error);
      throw error;
    }
  }

  /**
   * Lista de instrutores
   */
  async getInstructors() {
    try {
      const instructors = await this.prisma.instructor.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          specializations: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        success: true,
        data: instructors
      };
    } catch (error) {
      this.fastify.log.error('Error in getInstructors:', error);
      throw error;
    }
  }

  /**
   * Lista de cursos
   */
  async getCourses() {
    try {
      const courses = await this.prisma.course.findMany({
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
      this.fastify.log.error('Error in getCourses:', error);
      throw error;
    }
  }

  /**
   * Atualizar status da aula
   */
  async updateClassStatus(classId: string, status: string) {
    try {
      const updatedClass = await this.prisma.class.update({
        where: { id: classId },
        data: { status },
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
              name: true
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
          course: updatedClass.course,
          instructor: updatedClass.instructor
        }
      };
    } catch (error) {
      this.fastify.log.error('Error in updateClassStatus:', error);
      throw error;
    }
  }

  /**
   * Detalhes da aula
   */
  async getClassDetails(classId: string) {
    try {
      const classDetails = await this.prisma.class.findUnique({
        where: { id: classId },
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
              name: true,
              email: true,
              specializations: true
            }
          },
          attendances: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  registrationNumber: true
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
          instructor: classDetails.instructor,
          attendances: classDetails.attendances.map(att => ({
            id: att.id,
            status: att.status,
            checkInTime: att.checkInTime?.toISOString() || null,
            student: att.student
          }))
        }
      };
    } catch (error) {
      this.fastify.log.error('Error in getClassDetails:', error);
      throw error;
    }
  }

  /**
   * Agenda de uma data específica
   */
  async getScheduleByDate(date: string) {
    try {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      const classes = await this.prisma.class.findMany({
        where: {
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
              name: true
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

      const schedule = classes.map(cls => ({
        id: cls.id,
        title: cls.title,
        startTime: cls.startTime.toISOString(),
        endTime: cls.endTime.toISOString(),
        status: cls.status,
        maxStudents: cls.maxStudents,
        location: cls.location,
        course: cls.course,
        instructor: cls.instructor,
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
      this.fastify.log.error('Error in getScheduleByDate:', error);
      throw error;
    }
  }

  /**
   * Get turmas with their schedules
   */
  async getTurmasWithSchedules() {
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
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          classes: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true
            },
            orderBy: {
              startTime: 'asc'
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
        currentStudents: turma.currentStudents,
        isActive: turma.isActive,
        course: turma.course ? {
          id: turma.course.id,
          name: turma.course.name,
          category: turma.course.category
        } : null,
        instructor: turma.instructor ? {
          id: turma.instructor.id,
          name: `${turma.instructor.user.firstName} ${turma.instructor.user.lastName}`.trim()
        } : null,
        schedule: turma.classes.map(cls => ({
          id: cls.id,
          startTime: cls.startTime.toISOString(),
          endTime: cls.endTime.toISOString(),
          status: cls.status
        }))
      }));

      return {
        success: true,
        data: serializedTurmas
      };
    } catch (error) {
      this.fastify.log.error('Error in getTurmasWithSchedules:', error);
      throw error;
    }
  }

  /**
   * Get check-ins by date
   */
  async getCheckinsByDate(date: string) {
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
        include: {
          student: {
            select: {
              id: true,
              name: true,
              registrationNumber: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              course: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          checkInTime: 'desc'
        }
      });

      const serializedCheckins = checkins.map(checkin => ({
        id: checkin.id,
        checkInTime: checkin.checkInTime?.toISOString(),
        status: checkin.status,
        student: checkin.student,
        class: checkin.class ? {
          id: checkin.class.id,
          title: checkin.class.title,
          startTime: checkin.class.startTime.toISOString(),
          endTime: checkin.class.endTime.toISOString(),
          courseName: checkin.class.course?.name
        } : null
      }));

      return {
        success: true,
        data: serializedCheckins,
        total: serializedCheckins.length
      };
    } catch (error) {
      this.fastify.log.error('Error in getCheckinsByDate:', error);
      throw error;
    }
  }
}

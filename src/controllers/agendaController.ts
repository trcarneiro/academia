import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AgendaService, ClassFilters } from '@/services/agendaService';

export class AgendaController {
  private prisma: PrismaClient;
  private agendaService: AgendaService;

  constructor(private fastify: FastifyInstance) {
    this.prisma = new PrismaClient();
    this.agendaService = new AgendaService();
  }

  /**
   * Buscar aulas com filtros (Usa AgendaService)
   */
  async getClasses(filters: ClassFilters, user?: { id: string; role: string }) {
    try {
      return await this.agendaService.getClasses(filters, user);
    } catch (error) {
      this.fastify.log.error({ err: error, filters }, 'Error in getClasses');
      throw error;
    }
  }

  async getDayStats(ctx?: { organizationId?: string }) {
    try {
      const stats = await this.agendaService.getDayStats(ctx?.organizationId);
      return { success: true, data: stats };
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
      const data = await this.agendaService.getTodayClasses(ctx?.organizationId);
      return { success: true, data };
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
      const data = await this.agendaService.getWeekClasses(ctx?.organizationId);
      return { success: true, data };
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
      const data = await this.agendaService.getInstructors(ctx?.organizationId);
      return { success: true, data };
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
      const data = await this.agendaService.getCourses(ctx?.organizationId);
      return { success: true, data };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getCourses');
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
          course: { select: { id: true, name: true } },
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
      if (classId.startsWith('virtual-') || classId.startsWith('turmaLesson-')) {
        // For virtual/turma lessons, we still need logic to fetch them.
        // I'll add this to AgendaService too if needed, but for now I'll use getClasses with specific filter
        const filters: ClassFilters = { organizationId: ctx?.organizationId };
        const result = await this.agendaService.getClasses(filters);
        const item = result.data.find((c: any) => c.id === classId);
        
        if (item) return { success: true, data: item };
        return { success: false, error: 'Aula virtual não encontrada' };
      }

      const data = await this.agendaService.getClassDetails(classId, ctx?.organizationId);
      if (!data) return { success: false, error: 'Aula não encontrada' };
      
      return { success: true, data };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getClassDetails');
      throw error;
    }
  }

  /**
   * Agenda de uma data específica
   */
  async getScheduleByDate(date: string, ctx?: { organizationId?: string }) {
    try {
      const filters: ClassFilters = { 
        date, 
        organizationId: ctx?.organizationId 
      };
      const result = await this.agendaService.getClasses(filters);
      
      return {
        success: true,
        data: {
          date: date,
          classes: result.data,
          total: result.data.length
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
        where: ctx?.organizationId ? { organizationId: ctx.organizationId } : {},
        include: {
          course: { select: { id: true, name: true, category: true } },
          instructor: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      return {
        success: true,
        data: turmas.map(t => ({
          id: t.id,
          name: t.name,
          schedule: t.schedule,
          course: t.course,
          instructor: t.instructor ? {
            id: t.instructor.id,
            name: `${t.instructor.firstName} ${t.instructor.lastName}`.trim()
          } : null
        }))
      };
    } catch (error) {
      this.fastify.log.error({ err: error }, 'Error in getTurmasWithSchedules');
      throw error;
    }
  }
}

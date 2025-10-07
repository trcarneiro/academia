import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ResponseHelper } from '@/utils/response';

const prisma = new PrismaClient();

export class HybridAgendaControllerSimple {
  static async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔧 Starting hybrid agenda list...');
  const { startDate, endDate, tzOffsetMinutes, all, horizonDays } = (request.query || {}) as { startDate?: string; endDate?: string; tzOffsetMinutes?: string; all?: string; horizonDays?: string };
      let rangeStart = startDate ? new Date(startDate) : null;
      let rangeEnd = endDate ? new Date(endDate) : null;
  const offsetMin = typeof tzOffsetMinutes === 'string' ? parseInt(tzOffsetMinutes, 10) : 0; // minutes to add to convert local->UTC
      const requestAll = all === '1' || all === 'true';
      const horizon = horizonDays ? Math.max(1, parseInt(horizonDays, 10)) : 180;
      if (requestAll) {
        // Build a safe horizon around today for expansion
        const today = new Date();
        rangeStart = new Date(today.getTime() - horizon * 24 * 60 * 60 * 1000);
        rangeEnd = new Date(today.getTime() + horizon * 24 * 60 * 60 * 1000);
      }
      if ((rangeStart && isNaN(rangeStart.getTime())) || (rangeEnd && isNaN(rangeEnd.getTime()))) {
        console.warn('⚠️ Invalid startDate/endDate in query, ignoring range filter');
      }
      
      // Get AgendaItems (Personal Sessions)
      const agendaFindArgs: any = {
        orderBy: { startTime: 'asc' },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          unit: { select: { name: true } },
          trainingArea: { select: { name: true } }
        }
      };
      if (!requestAll && rangeStart && rangeEnd) {
        agendaFindArgs.where = {
          AND: [
            { startTime: { lt: rangeEnd } },
            { endTime: { gt: rangeStart } }
          ]
        };
      }
      const agendaItems = await prisma.agendaItem.findMany(agendaFindArgs);
      
      console.log(`📋 Found ${agendaItems.length} agenda items`);

      // Get Turmas (Classes) with instructor relation  
      const turmasFindArgs: any = {
        orderBy: { startDate: 'asc' },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          unit: { select: { name: true } },
          trainingArea: { select: { name: true } },
          course: { select: { name: true } }
        }
      };
      if (rangeStart && rangeEnd) {
        turmasFindArgs.where = {
          AND: [
            { startDate: { lt: rangeEnd } },
            { OR: [ { endDate: null }, { endDate: { gt: rangeStart } } ] }
          ]
        };
      }
      const turmas = await prisma.turma.findMany(turmasFindArgs);
      
      console.log(`📋 Found ${turmas.length} turmas`);

      // Transform AgendaItems to standard format
      const transformedAgendaItems = agendaItems.map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
        status: item.status,
        instructor: {
          name: `${item.instructor.firstName} ${item.instructor.lastName}`
        },
        unit: item.unit ? { name: item.unit.name } : null,
        trainingArea: item.trainingArea ? { name: item.trainingArea.name } : null,
        maxStudents: item.maxStudents,
        actualStudents: item.actualStudents,
        isRecurring: item.isRecurring,
        color: item.color,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }));

      // Transform Turmas to instances within range if schedule exists
      const transformedTurmas = turmas.flatMap((turma: any) => {
        const schedule: any = turma.schedule as any;
        const daysOfWeek: number[] | undefined = schedule?.daysOfWeek;
        const timeStr: string | undefined = schedule?.time; // e.g., "19:00"
        const durationMin: number = typeof schedule?.duration === 'number' ? schedule.duration : 60;

        // Helper to build one unified item
        const buildItem = (start: Date) => {
          const end = new Date(start.getTime() + durationMin * 60 * 1000);
          return {
            id: turma.id,
            type: 'TURMA' as const,
            title: turma.name || `${turma.course?.name || 'Turma'} - ${turma.name}`,
            description: turma.description || 'Aula coletiva',
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: turma.status,
            instructor: { name: `${turma.instructor.firstName} ${turma.instructor.lastName}` },
            unit: turma.unit ? { name: turma.unit.name } : null,
            trainingArea: turma.trainingArea ? { name: turma.trainingArea.name } : null,
            maxStudents: turma.maxStudents,
            actualStudents: 0,
            isRecurring: !!daysOfWeek?.length,
            color: '#667eea',
            notes: turma.description,
            createdAt: turma.createdAt.toISOString(),
            updatedAt: turma.updatedAt.toISOString()
          };
        };

        // If no range provided, or schedule missing, fallback to single item at startDate
        if (!(rangeStart && rangeEnd) || !daysOfWeek || !timeStr) {
          const fallbackStart = new Date(turma.startDate);
          // If turma has endDate, derive duration from difference; else 60 min
          const durationFromDates = turma.endDate ? Math.max(1, Math.round((new Date(turma.endDate).getTime() - fallbackStart.getTime()) / (60 * 1000))) : durationMin;
          const end = new Date(fallbackStart.getTime() + durationFromDates * 60 * 1000);
          return [
            {
              id: turma.id,
              type: 'TURMA' as const,
              title: turma.name || `${turma.course?.name || 'Turma'} - ${turma.name}`,
              description: turma.description || 'Aula coletiva',
              startTime: fallbackStart.toISOString(),
              endTime: end.toISOString(),
              status: turma.status,
              instructor: { name: `${turma.instructor.firstName} ${turma.instructor.lastName}` },
              unit: turma.unit ? { name: turma.unit.name } : null,
              trainingArea: turma.trainingArea ? { name: turma.trainingArea.name } : null,
              maxStudents: turma.maxStudents,
              actualStudents: 0,
              isRecurring: false,
              color: '#667eea',
              notes: turma.description,
              createdAt: turma.createdAt.toISOString(),
              updatedAt: turma.updatedAt.toISOString()
            }
          ];
        }

        // Expand by range using schedule.daysOfWeek + schedule.time
        const items: any[] = [];
        const iter = new Date(rangeStart);
        const [hh, mm] = timeStr.split(':').map((s: string) => parseInt(s, 10));
        const offsetMs = offsetMin * 60000;
        while (iter <= (rangeEnd as Date)) {
          // Compute client's local date components for this iter
          const localProbe = new Date(iter.getTime() - offsetMs);
          const localDow = localProbe.getUTCDay();
          if (daysOfWeek.includes(localDow)) {
            const y = localProbe.getUTCFullYear();
            const m = localProbe.getUTCMonth();
            const d = localProbe.getUTCDate();
            // Build UTC instant that corresponds to local HH:mm on local Y-M-D
            const utcStartMs = Date.UTC(y, m, d, hh || 0, mm || 0) + offsetMs;
            const utcStart = new Date(utcStartMs);
            // Respect turma window
            const turmaStart = new Date(turma.startDate);
            const turmaEnd = turma.endDate ? new Date(turma.endDate) : null;
            if (utcStart >= turmaStart && (!turmaEnd || utcStart <= turmaEnd)) {
              items.push(buildItem(utcStart));
            }
          }
          // Advance UTC date by one day
          iter.setUTCDate(iter.getUTCDate() + 1);
        }
        return items;
      });

      // Combine both types and sort by start time
      const allItems = [...transformedAgendaItems, ...transformedTurmas]
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const summary = {
        totalItems: allItems.length,
        totalTurmas: transformedTurmas.length,
        totalPersonalSessions: transformedAgendaItems.filter(item => item.type === 'PERSONAL_SESSION').length,
        totalScheduled: allItems.filter(item => item.status === 'SCHEDULED').length,
        totalConfirmed: allItems.filter(item => item.status === 'CONFIRMED').length
      };

      console.log(`✅ Combined agenda: ${transformedAgendaItems.length} personal sessions + ${transformedTurmas.length} turmas = ${allItems.length} total items`);
      
      return ResponseHelper.success(reply, {
        items: allItems,
        summary,
        pagination: {
          total: allItems.length,
          page: 1,
          limit: 50,
          pages: Math.ceil(allItems.length / 50)
        }
      }, 'Agenda carregada com sucesso', 200);

    } catch (error) {
      console.error('❌ Error in hybrid agenda list:', error);
      return ResponseHelper.error(reply, 'Erro ao buscar agenda', 500);
    }
  }

  static async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔧 Creating new agenda item...');
      const body = request.body as any;
      
      console.log('📝 Request body:', JSON.stringify(body, null, 2));

      // Validate required fields
      if (!body.type || !body.title || !body.startTime || !body.instructorId) {
        return ResponseHelper.error(reply, 'Campos obrigatórios: type, title, startTime, instructorId', 400);
      }

      // Validate instructor exists
      const instructor = await prisma.user.findUnique({
        where: { id: body.instructorId }
      });

      if (!instructor) {
        return ResponseHelper.error(reply, 'Instrutor não encontrado', 404);
      }

      // Create agenda item
      const agendaItem = await prisma.agendaItem.create({
        data: {
          type: body.type,
          title: body.title,
          description: body.description || '',
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
          instructorId: body.instructorId,
          unitId: body.unitId || null,
          trainingAreaId: body.trainingAreaId || null,
          maxStudents: body.maxStudents || (body.type === 'PERSONAL_SESSION' ? 1 : 20),
          actualStudents: 0,
          status: body.status || 'SCHEDULED',
          isRecurring: body.isRecurring || false,
          recurrenceRule: body.isRecurring ? JSON.stringify({
            type: body.recurrenceRule || 'WEEKLY',
            daysOfWeek: body.daysOfWeek || [],
            endDate: body.endRecurrence || null
          }) : null,
          color: body.color || (body.type === 'PERSONAL_SESSION' ? '#764ba2' : '#667eea'),
          notes: body.notes || null,
          referenceId: body.referenceId || `auto-${Date.now()}`, // Generate reference ID if not provided
          organizationId: instructor.organizationId || '95d0e5e3-1234-5678-9012-123456789012' // Use instructor's org or default
        },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          unit: {
            select: {
              name: true
            }
          },
          trainingArea: {
            select: {
              name: true
            }
          }
        }
      });

      console.log('✅ Agenda item created:', agendaItem.id);

      // Transform response
      const response = {
        id: agendaItem.id,
        type: agendaItem.type,
        title: agendaItem.title,
        description: agendaItem.description,
        startTime: agendaItem.startTime.toISOString(),
        endTime: agendaItem.endTime.toISOString(),
        status: agendaItem.status,
        instructor: {
          name: `${agendaItem.instructor.firstName} ${agendaItem.instructor.lastName}`
        },
        unit: agendaItem.unit ? { name: agendaItem.unit.name } : null,
        trainingArea: agendaItem.trainingArea ? { name: agendaItem.trainingArea.name } : null,
        maxStudents: agendaItem.maxStudents,
        actualStudents: agendaItem.actualStudents,
        isRecurring: agendaItem.isRecurring,
        color: agendaItem.color,
        notes: agendaItem.notes,
        createdAt: agendaItem.createdAt.toISOString(),
        updatedAt: agendaItem.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, response, 'Agendamento criado com sucesso', 201);

    } catch (error) {
      console.error('❌ Error creating agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao criar agendamento: ' + (error instanceof Error ? error.message : String(error)), 500);
    }
  }

  static async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      console.log('🔧 Updating agenda item:', id);
      console.log('🔧 Request body received:', JSON.stringify(body, null, 2));
      console.log('🔧 UnitId in body:', body.unitId);

      // First try to update AgendaItem (Personal Session)
      const existingItem = await prisma.agendaItem.findUnique({ where: { id } });

      if (existingItem) {
        const updatedItem = await prisma.agendaItem.update({
          where: { id },
          data: {
            type: body.type || existingItem.type,
            title: body.title || existingItem.title,
            description: body.description || existingItem.description,
            startTime: body.startTime ? new Date(body.startTime) : existingItem.startTime,
            endTime: body.endTime ? new Date(body.endTime) : existingItem.endTime,
            instructorId: body.instructorId || existingItem.instructorId,
            unitId: body.unitId !== undefined ? body.unitId : existingItem.unitId,
            trainingAreaId: body.trainingAreaId !== undefined ? body.trainingAreaId : existingItem.trainingAreaId,
            maxStudents: body.maxStudents || existingItem.maxStudents,
            status: body.status || existingItem.status,
            isRecurring: body.isRecurring !== undefined ? body.isRecurring : existingItem.isRecurring,
            recurrenceRule: body.isRecurring ? JSON.stringify({
              type: body.recurrenceRule || 'WEEKLY',
              daysOfWeek: body.daysOfWeek || [],
              endDate: body.endRecurrence || null
            }) : null,
            color: body.color || existingItem.color,
            notes: body.notes !== undefined ? body.notes : existingItem.notes
          },
          include: {
            instructor: { select: { firstName: true, lastName: true } },
            unit: { select: { name: true } },
            trainingArea: { select: { name: true } }
          }
        });

        console.log('✅ Agenda item updated:', updatedItem.id);

        const response = {
          id: updatedItem.id,
          type: updatedItem.type,
          title: updatedItem.title,
          description: updatedItem.description,
          startTime: updatedItem.startTime.toISOString(),
          endTime: updatedItem.endTime.toISOString(),
          status: updatedItem.status,
          instructor: { name: `${updatedItem.instructor.firstName} ${updatedItem.instructor.lastName}` },
          unit: updatedItem.unit ? { name: updatedItem.unit.name } : null,
          trainingArea: updatedItem.trainingArea ? { name: updatedItem.trainingArea.name } : null,
          maxStudents: updatedItem.maxStudents,
          actualStudents: updatedItem.actualStudents,
          isRecurring: updatedItem.isRecurring,
          color: updatedItem.color,
          notes: updatedItem.notes,
          createdAt: updatedItem.createdAt.toISOString(),
          updatedAt: updatedItem.updatedAt.toISOString()
        };

        return ResponseHelper.success(reply, response, 'Agendamento atualizado com sucesso', 200);
      }

      // If not an AgendaItem, try to update a Turma
      const existingTurma = await prisma.turma.findUnique({ where: { id } });
      if (!existingTurma) {
        return ResponseHelper.error(reply, 'Agendamento não encontrado', 404);
      }

      const updatedTurma = await prisma.turma.update({
        where: { id },
        data: {
          // Map unified payload to Turma fields, preserving existing when undefined
          name: body.title || existingTurma.name,
          description: body.description !== undefined ? body.description : existingTurma.description,
          instructorId: body.instructorId || existingTurma.instructorId,
          unitId: body.unitId !== undefined ? body.unitId : existingTurma.unitId,
          trainingAreaId: body.trainingAreaId !== undefined ? body.trainingAreaId : existingTurma.trainingAreaId,
          maxStudents: body.maxStudents || existingTurma.maxStudents,
          status: body.status || existingTurma.status,
          startDate: body.startTime ? new Date(body.startTime) : existingTurma.startDate,
          endDate: body.endTime ? new Date(body.endTime) : existingTurma.endDate,
          // Explicitly bump updatedAt to reflect the edit (schema lacks @updatedAt)
          updatedAt: new Date()
          // Keep courseId and schedule as-is
        },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          unit: { select: { name: true } },
          trainingArea: { select: { name: true } },
          course: { select: { name: true } }
        }
      });

      console.log('✅ Turma updated:', updatedTurma.id);

      // Transform to unified response
      const startTime = new Date(updatedTurma.startDate);
      const endTime = updatedTurma.endDate ? new Date(updatedTurma.endDate) : new Date(startTime.getTime() + 60 * 60 * 1000);

      const turmaResponse = {
        id: updatedTurma.id,
        type: 'TURMA' as const,
        title: updatedTurma.name || `${updatedTurma.course?.name || 'Turma'} - ${updatedTurma.name}`,
        description: updatedTurma.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: updatedTurma.status,
        instructor: { name: `${updatedTurma.instructor.firstName} ${updatedTurma.instructor.lastName}` },
        unit: updatedTurma.unit ? { name: updatedTurma.unit.name } : null,
        trainingArea: updatedTurma.trainingArea ? { name: updatedTurma.trainingArea.name } : null,
        maxStudents: updatedTurma.maxStudents,
        actualStudents: 0,
        isRecurring: true,
        color: '#667eea',
        notes: updatedTurma.description,
        createdAt: updatedTurma.createdAt.toISOString(),
        updatedAt: updatedTurma.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, turmaResponse, 'Agendamento atualizado com sucesso', 200);

    } catch (error) {
      console.error('❌ Error updating agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao atualizar agendamento: ' + (error instanceof Error ? error.message : String(error)), 500);
    }
  }

  static async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      console.log('🔧 Deleting hybrid agenda item:', id);

      // First try to find and delete from AgendaItem (Personal Sessions)
      const existingAgendaItem = await prisma.agendaItem.findUnique({
        where: { id }
      });

      if (existingAgendaItem) {
        await prisma.agendaItem.delete({
          where: { id }
        });
        console.log('✅ Personal Session deleted:', id);
        return ResponseHelper.success(reply, { id, type: 'PERSONAL_SESSION' }, 'Agendamento removido com sucesso', 200);
      }

      // If not found in AgendaItem, try to find and delete from Turma (Classes)
      const existingTurma = await prisma.turma.findUnique({
        where: { id }
      });

      if (existingTurma) {
        await prisma.turma.delete({
          where: { id }
        });
        console.log('✅ Turma deleted:', id);
        return ResponseHelper.success(reply, { id, type: 'TURMA' }, 'Turma removida com sucesso', 200);
      }

      // If not found in either table
      console.log('❌ Item not found for deletion:', id);
      return ResponseHelper.error(reply, 'Agendamento não encontrado', 404);

    } catch (error) {
      console.error('❌ Error deleting hybrid agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao remover agendamento: ' + (error instanceof Error ? error.message : String(error)), 500);
    }
  }

  static async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      console.log('🔧 Getting hybrid agenda item by ID:', id);

      // First try to find in AgendaItem (Personal Sessions)
      let item = await prisma.agendaItem.findUnique({
        where: { id },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          unit: {
            select: {
              name: true
            }
          },
          trainingArea: {
            select: {
              name: true
            }
          }
        }
      });

      if (item) {
        console.log('✅ Found Personal Session:', item.id);
        // Transform to unified format
        const transformedItem = {
          id: item.id,
          type: 'PERSONAL_SESSION',
          title: item.title,
          description: item.description,
          startTime: item.startTime.toISOString(),
          endTime: item.endTime.toISOString(),
          status: item.status,
          instructorId: item.instructorId,
          instructor: {
            name: `${item.instructor.firstName} ${item.instructor.lastName}`
          },
          unitId: item.unitId,
          unit: item.unit ? { name: item.unit.name } : null,
          trainingAreaId: item.trainingAreaId,
          trainingArea: item.trainingArea ? { name: item.trainingArea.name } : null,
          maxStudents: item.maxStudents,
          actualStudents: item.actualStudents,
          isRecurring: item.isRecurring,
          color: '#764ba2',
          notes: item.notes,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        };
        
        return ResponseHelper.success(reply, transformedItem, 'Agendamento encontrado');
      }

      // If not found in AgendaItem, try to find in Turma (Classes)
      const turma = await prisma.turma.findUnique({
        where: { id },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          unit: {
            select: {
              name: true
            }
          },
          trainingArea: {
            select: {
              name: true
            }
          },
          course: {
            select: {
              name: true
            }
          }
        }
      });

      if (turma) {
        console.log('✅ Found Turma:', turma.id);
        // Transform Turma to unified format
        const startTime = new Date(turma.startDate);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour class
        
        const transformedTurma = {
          id: turma.id,
          type: 'TURMA',
          title: turma.name || `${turma.course?.name || 'Turma'} - ${turma.name}`,
          description: turma.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: turma.status,
          instructorId: turma.instructorId,
          instructor: {
            name: `${turma.instructor.firstName} ${turma.instructor.lastName}`
          },
          unitId: turma.unitId,
          unit: turma.unit ? { name: turma.unit.name } : null,
          trainingAreaId: turma.trainingAreaId,
          trainingArea: turma.trainingArea ? { name: turma.trainingArea.name } : null,
          maxStudents: turma.maxStudents,
          actualStudents: 0, // Turmas não têm esse campo
          isRecurring: true,
          color: '#667eea',
          notes: turma.description,
          createdAt: turma.createdAt.toISOString(),
          updatedAt: turma.updatedAt.toISOString()
        };
        
        return ResponseHelper.success(reply, transformedTurma, 'Agendamento encontrado');
      }

      // If not found in either table
      console.log('❌ Item not found in AgendaItem or Turma tables');
      return ResponseHelper.error(reply, 'Agendamento não encontrado', 404);

    } catch (error) {
      console.error('❌ Error getting agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao buscar agendamento: ' + (error instanceof Error ? error.message : String(error)), 500);
    }
  }
}
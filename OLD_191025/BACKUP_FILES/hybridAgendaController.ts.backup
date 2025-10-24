import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ResponseHelper } from '@/utils/response';

const prisma = new PrismaClient();

export class HybridAgendaController {
  // Listar itens da agenda (turmas + sessões de personal training)
  static async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      // const { organizationId } = request as any; // Será usado na implementação real
      const querySchema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        instructorId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        type: z.enum(['TURMA', 'PERSONAL_SESSION']).optional(),
        status: z.string().optional(),
        page: z.string().transform(Number).default('1'),
        limit: z.string().transform(Number).default('20'),
      });

      const query = querySchema.parse(request.query);

      // Buscar agenda items reais do banco de dados
      const whereClause: any = {};

      // Aplicar filtros
      if (query.type) {
        whereClause.type = query.type;
      }

      if (query.instructorId) {
        whereClause.instructorId = query.instructorId;
      }

      if (query.unitId) {
        whereClause.unitId = query.unitId;
      }

      if (query.status) {
        whereClause.status = query.status;
      }

      // Filtros de data
      if (query.startDate || query.endDate) {
        whereClause.startTime = {};
        if (query.startDate) {
          whereClause.startTime.gte = new Date(query.startDate);
        }
        if (query.endDate) {
          whereClause.startTime.lte = new Date(query.endDate);
        }
      }

      // Buscar itens com paginação
      const [items, total] = await Promise.all([
        prisma.agendaItem.findMany({
          where: whereClause,
          include: {
            instructor: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
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
          },
          orderBy: {
            startTime: 'asc'
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        prisma.agendaItem.count({
          where: whereClause
        })
      ]);

      // Transformar dados para o formato esperado pelo frontend
      const transformedItems = items.map(item => ({
        id: item.id,
        type: item.type,
        referenceId: item.referenceId,
        title: item.title,
        description: item.description,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
        instructor: {
          name: `${item.instructor.user.firstName} ${item.instructor.user.lastName}`
        },
        unit: item.unit ? { name: item.unit.name } : null,
        trainingArea: item.trainingArea ? { name: item.trainingArea.name } : null,
        status: item.status,
        maxStudents: item.maxStudents,
        actualStudents: item.actualStudents,
        isRecurring: item.isRecurring,
        recurrenceRule: item.recurrenceRule,
        color: item.color,
        notes: item.notes,
        isVirtual: item.isVirtual,
        meetingUrl: item.meetingUrl,
      }));

      const totalPages = Math.ceil(total / query.limit);

      // Calcular estatísticas
      const allItems = await prisma.agendaItem.findMany({
        select: {
          type: true,
          status: true
        }
      });

      const summary = {
        totalTurmas: allItems.filter(item => item.type === 'TURMA').length,
        totalPersonalSessions: allItems.filter(item => item.type === 'PERSONAL_SESSION').length,
        totalScheduled: allItems.filter(item => item.status === 'SCHEDULED').length,
        totalConfirmed: allItems.filter(item => item.status === 'CONFIRMED').length,
      };

      return ResponseHelper.success(reply, {
        items: transformedItems,
        total,
        page: query.page,
        totalPages,
        summary
      });
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar agenda', 500);
    }
  }

  // Obter estatísticas da agenda por data
  static async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      // const { organizationId } = request as any; // Será usado na implementação real
      const querySchema = z.object({
        date: z.string().optional()
      });

      const query = querySchema.parse(request.query);
      const currentDate = query.date || new Date().toISOString().split('T')[0];

      // Mock stats para o sistema híbrido
      const mockStats = {
        date: currentDate,
        turmas: {
          total: 5,
          scheduled: 3,
          inProgress: 1,
          completed: 1,
          cancelled: 0
        },
        personalSessions: {
          total: 8,
          scheduled: 4,
          confirmed: 2,
          completed: 2,
          cancelled: 0
        },
        instructors: {
          active: 3,
          totalHours: 12.5,
          avgUtilization: 75
        },
        students: {
          totalAttendances: 45,
          totalPersonalSessions: 8,
          avgAttendanceRate: 82
        },
        facilities: {
          totalAreas: 4,
          utilizationRate: 68,
          peakHours: ['08:00-09:00', '19:00-20:00']
        }
      };

      return ResponseHelper.success(reply, mockStats);
    } catch (error) {
      return ResponseHelper.error(reply, 'Erro ao buscar estatísticas', 500);
    }
  }

  // Criar item na agenda (automaticamente baseado no tipo)
  static async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Obter organização do contexto (substituir por middleware real)
      const organization = await prisma.organization.findFirst();
      if (!organization) {
        return ResponseHelper.error(reply, 'Organização não encontrada', 404);
      }

      const createSchema = z.object({
        type: z.enum(['TURMA', 'PERSONAL_SESSION']),
        title: z.string(),
        description: z.string().optional(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        instructorId: z.string().uuid(),
        unitId: z.string().uuid().optional(),
        trainingAreaId: z.string().uuid().optional(),
        maxStudents: z.number().int().positive().optional(),
        isRecurring: z.boolean().default(false),
        recurrenceRule: z.string().optional(),
        color: z.string().optional(),
        notes: z.string().optional(),
        referenceId: z.string().optional() // ID da turma ou personal session específica
      });

      const data = createSchema.parse(request.body);

      // Criar novo AgendaItem
      const agendaItem = await prisma.agendaItem.create({
        data: {
          organizationId: organization.id,
          type: data.type,
          referenceId: data.referenceId || `generated-${Date.now()}`,
          title: data.title,
          description: data.description,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          instructorId: data.instructorId,
          unitId: data.unitId,
          trainingAreaId: data.trainingAreaId,
          maxStudents: data.maxStudents,
          actualStudents: 0,
          isRecurring: data.isRecurring,
          recurrenceRule: data.recurrenceRule,
          color: data.color || (data.type === 'TURMA' ? '#667eea' : '#764ba2'),
          notes: data.notes,
          status: 'SCHEDULED',
          isVirtual: false,
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

      // Transformar dados para o formato esperado pelo frontend
      const transformedItem = {
        id: agendaItem.id,
        type: agendaItem.type,
        referenceId: agendaItem.referenceId,
        title: agendaItem.title,
        description: agendaItem.description,
        startTime: agendaItem.startTime.toISOString(),
        endTime: agendaItem.endTime.toISOString(),
        instructor: {
          name: `${agendaItem.instructor.firstName} ${agendaItem.instructor.lastName}`
        },
        unit: agendaItem.unit ? { name: agendaItem.unit.name } : null,
        trainingArea: agendaItem.trainingArea ? { name: agendaItem.trainingArea.name } : null,
        status: agendaItem.status,
        maxStudents: agendaItem.maxStudents,
        actualStudents: agendaItem.actualStudents,
        isRecurring: agendaItem.isRecurring,
        recurrenceRule: agendaItem.recurrenceRule,
        color: agendaItem.color,
        notes: agendaItem.notes,
        isVirtual: agendaItem.isVirtual,
        meetingUrl: agendaItem.meetingUrl,
        createdAt: agendaItem.createdAt.toISOString(),
        updatedAt: agendaItem.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, transformedItem, 'Item da agenda criado com sucesso', 201);
    } catch (error) {
      console.error('Erro ao criar agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao criar item da agenda', 400);
    }
  }

  // Atualizar item da agenda
  static async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.string().datetime().optional(),
        endTime: z.string().datetime().optional(),
        instructorId: z.string().uuid().optional(),
        unitId: z.string().uuid().optional(),
        trainingAreaId: z.string().uuid().optional(),
        status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED']).optional(),
        maxStudents: z.number().int().positive().optional(),
        actualStudents: z.number().int().nonnegative().optional(),
        color: z.string().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().optional(),
        recurrenceRule: z.string().optional()
      });

      const data = updateSchema.parse(request.body);

      // Verificar se o item existe
      const existingItem = await prisma.agendaItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return ResponseHelper.error(reply, 'Item da agenda não encontrado', 404);
      }

      // Preparar dados para atualização
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
      if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
      if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
      if (data.unitId !== undefined) updateData.unitId = data.unitId;
      if (data.trainingAreaId !== undefined) updateData.trainingAreaId = data.trainingAreaId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
      if (data.actualStudents !== undefined) updateData.actualStudents = data.actualStudents;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
      if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule;

      // Atualizar no banco
      const updatedItem = await prisma.agendaItem.update({
        where: { id },
        data: updateData,
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

      // Transformar dados para o formato esperado pelo frontend
      const transformedItem = {
        id: updatedItem.id,
        type: updatedItem.type,
        referenceId: updatedItem.referenceId,
        title: updatedItem.title,
        description: updatedItem.description,
        startTime: updatedItem.startTime.toISOString(),
        endTime: updatedItem.endTime.toISOString(),
        instructor: {
          name: `${updatedItem.instructor.firstName} ${updatedItem.instructor.lastName}`
        },
        unit: updatedItem.unit ? { name: updatedItem.unit.name } : null,
        trainingArea: updatedItem.trainingArea ? { name: updatedItem.trainingArea.name } : null,
        status: updatedItem.status,
        maxStudents: updatedItem.maxStudents,
        actualStudents: updatedItem.actualStudents,
        isRecurring: updatedItem.isRecurring,
        recurrenceRule: updatedItem.recurrenceRule,
        color: updatedItem.color,
        notes: updatedItem.notes,
        isVirtual: updatedItem.isVirtual,
        meetingUrl: updatedItem.meetingUrl,
        updatedAt: updatedItem.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, transformedItem, 'Item da agenda atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao atualizar item da agenda', 400);
    }
  }

  // Cancelar item da agenda
  static async cancel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { reason } = request.body as { reason?: string };

      // Verificar se o item existe
      const existingItem = await prisma.agendaItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return ResponseHelper.error(reply, 'Item da agenda não encontrado', 404);
      }

      // Atualizar status para cancelado
      const cancelledItem = await prisma.agendaItem.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${existingItem.notes || ''}\nCancelado: ${reason}`.trim() : existingItem.notes
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

      // Transformar dados para o formato esperado pelo frontend
      const transformedItem = {
        id: cancelledItem.id,
        type: cancelledItem.type,
        referenceId: cancelledItem.referenceId,
        title: cancelledItem.title,
        description: cancelledItem.description,
        startTime: cancelledItem.startTime.toISOString(),
        endTime: cancelledItem.endTime.toISOString(),
        instructor: {
          name: `${cancelledItem.instructor.firstName} ${cancelledItem.instructor.lastName}`
        },
        unit: cancelledItem.unit ? { name: cancelledItem.unit.name } : null,
        trainingArea: cancelledItem.trainingArea ? { name: cancelledItem.trainingArea.name } : null,
        status: cancelledItem.status,
        maxStudents: cancelledItem.maxStudents,
        actualStudents: cancelledItem.actualStudents,
        isRecurring: cancelledItem.isRecurring,
        recurrenceRule: cancelledItem.recurrenceRule,
        color: cancelledItem.color,
        notes: cancelledItem.notes,
        isVirtual: cancelledItem.isVirtual,
        meetingUrl: cancelledItem.meetingUrl,
        updatedAt: cancelledItem.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, transformedItem, 'Item da agenda cancelado com sucesso');
    } catch (error) {
      console.error('Erro ao cancelar agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao cancelar item da agenda', 500);
    }
  }

  // Buscar item específico da agenda por ID
  static async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const agendaItem = await prisma.agendaItem.findUnique({
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

      if (!agendaItem) {
        return ResponseHelper.error(reply, 'Item da agenda não encontrado', 404);
      }

      // Transformar dados para o formato esperado pelo frontend
      const transformedItem = {
        id: agendaItem.id,
        type: agendaItem.type,
        referenceId: agendaItem.referenceId,
        title: agendaItem.title,
        description: agendaItem.description,
        startTime: agendaItem.startTime.toISOString(),
        endTime: agendaItem.endTime.toISOString(),
        instructor: {
          name: `${agendaItem.instructor.firstName} ${agendaItem.instructor.lastName}`
        },
        unit: agendaItem.unit ? { name: agendaItem.unit.name } : null,
        trainingArea: agendaItem.trainingArea ? { name: agendaItem.trainingArea.name } : null,
        status: agendaItem.status,
        maxStudents: agendaItem.maxStudents,
        actualStudents: agendaItem.actualStudents,
        isRecurring: agendaItem.isRecurring,
        recurrenceRule: agendaItem.recurrenceRule,
        color: agendaItem.color,
        notes: agendaItem.notes,
        isVirtual: agendaItem.isVirtual,
        meetingUrl: agendaItem.meetingUrl,
        createdAt: agendaItem.createdAt.toISOString(),
        updatedAt: agendaItem.updatedAt.toISOString()
      };

      return ResponseHelper.success(reply, transformedItem);
    } catch (error) {
      console.error('Erro ao buscar agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao buscar item da agenda', 500);
    }
  }

  // Deletar item da agenda
  static async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Verificar se o item existe
      const existingItem = await prisma.agendaItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return ResponseHelper.error(reply, 'Item da agenda não encontrado', 404);
      }

      // Deletar o item
      await prisma.agendaItem.delete({
        where: { id }
      });

      return ResponseHelper.success(reply, { id }, 'Item da agenda deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar agenda item:', error);
      return ResponseHelper.error(reply, 'Erro ao deletar item da agenda', 500);
    }
  }

  // Obter disponibilidade de horários (útil para agendamentos)
  static async getAvailability(request: FastifyRequest, reply: FastifyReply) {
    try {
      const querySchema = z.object({
        date: z.string(),
        instructorId: z.string().uuid().optional(),
        trainingAreaId: z.string().uuid().optional(),
        duration: z.string().transform(Number).default('60') // minutos
      });

      const query = querySchema.parse(request.query);
      const targetDate = new Date(query.date);
      
      // Buscar conflitos existentes para a data
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const whereClause: any = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      };

      if (query.instructorId) {
        whereClause.instructorId = query.instructorId;
      }

      if (query.trainingAreaId) {
        whereClause.trainingAreaId = query.trainingAreaId;
      }

      const conflicts = await prisma.agendaItem.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          type: true,
          startTime: true,
          endTime: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Gerar slots de horário (8h às 21h, de hora em hora)
      const availableSlots = [];
      for (let hour = 8; hour <= 20; hour++) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(targetDate);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Verificar se há conflito neste horário
        const hasConflict = conflicts.some(conflict => {
          const conflictStart = new Date(conflict.startTime);
          const conflictEnd = new Date(conflict.endTime);
          
          return (
            (slotStart >= conflictStart && slotStart < conflictEnd) ||
            (slotEnd > conflictStart && slotEnd <= conflictEnd) ||
            (slotStart <= conflictStart && slotEnd >= conflictEnd)
          );
        });

        const conflictReason = hasConflict 
          ? conflicts.find(conflict => {
              const conflictStart = new Date(conflict.startTime);
              const conflictEnd = new Date(conflict.endTime);
              return (
                (slotStart >= conflictStart && slotStart < conflictEnd) ||
                (slotEnd > conflictStart && slotEnd <= conflictEnd) ||
                (slotStart <= conflictStart && slotEnd >= conflictEnd)
              );
            })?.title
          : undefined;

        availableSlots.push({
          start: String(hour).padStart(2, '0') + ':00',
          end: String(hour + 1).padStart(2, '0') + ':00',
          available: !hasConflict,
          reason: conflictReason
        });
      }

      // Formatar conflitos para retorno
      const formattedConflicts = conflicts.map(conflict => ({
        time: `${conflict.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}-${conflict.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        type: conflict.type,
        title: conflict.title
      }));

      const availability = {
        date: query.date,
        availableSlots,
        conflicts: formattedConflicts
      };

      return ResponseHelper.success(reply, availability);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return ResponseHelper.error(reply, 'Erro ao verificar disponibilidade', 500);
    }
  }
}
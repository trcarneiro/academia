import { prisma } from '@/utils/database';

export class HorariosSugeridosService {
  async create(data: {
    studentId: string;
    organizationId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    courseType?: string;
    level?: string;
    preferredUnit?: string;
    notes?: string;
  }) {
    return await prisma.horarioSugerido.create({
      data: {
        ...data,
        supporters: {
          create: {
            studentId: data.studentId
          }
        }
      }
    });
  }

  async list(filters: {
    organizationId?: string;
    status?: string;
    dayOfWeek?: number;
    minVotes?: number;
  }) {
    const where: any = {};

    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.status) where.status = filters.status;
    if (filters.dayOfWeek !== undefined) where.dayOfWeek = filters.dayOfWeek;
    if (filters.minVotes) where.votes = { gte: filters.minVotes };

    return await prisma.horarioSugerido.findMany({
      where,
      include: {
        student: {
          include: { user: true }
        },
        supporters: {
          include: { student: { include: { user: true } } }
        },
        createdTurma: true
      },
      orderBy: {
        votes: 'desc'
      }
    });
  }

  async support(id: string, studentId: string) {
    const suggestion = await prisma.horarioSugerido.findUnique({ where: { id } });
    if (!suggestion) throw new Error('Suggestion not found');

    // Check if already supported
    const existing = await prisma.horarioSupporter.findUnique({
      where: {
        horarioId_studentId: {
          horarioId: id,
          studentId
        }
      }
    });

    if (existing) return existing;

    // Transaction to add supporter and increment votes
    return await prisma.$transaction(async (tx) => {
      const supporter = await tx.horarioSupporter.create({
        data: {
          horarioId: id,
          studentId
        }
      });

      await tx.horarioSugerido.update({
        where: { id },
        data: {
          votes: { increment: 1 }
        }
      });

      return supporter;
    });
  }

  async removeSupport(id: string, studentId: string) {
    const existing = await prisma.horarioSupporter.findUnique({
      where: {
        horarioId_studentId: {
          horarioId: id,
          studentId
        }
      }
    });

    if (!existing) return;

    return await prisma.$transaction(async (tx) => {
      await tx.horarioSupporter.delete({
        where: {
          horarioId_studentId: {
            horarioId: id,
            studentId
          }
        }
      });

      await tx.horarioSugerido.update({
        where: { id },
        data: {
          votes: { decrement: 1 }
        }
      });
    });
  }
  
  async updateStatus(id: string, status: string, adminId: string, createdTurmaId?: string) {
      return await prisma.horarioSugerido.update({
          where: { id },
          data: {
              status,
              reviewedBy: adminId,
              reviewedAt: new Date(),
              createdTurmaId
          }
      });
  }

  async approve(id: string, adminId: string, createTurmaData?: any) {
    return await prisma.$transaction(async (tx) => {
      const suggestion = await tx.horarioSugerido.findUnique({ where: { id } });
      if (!suggestion) throw new Error('Suggestion not found');

      let turmaId = null;

      if (createTurmaData) {
        const turma = await tx.turma.create({
          data: {
            ...createTurmaData,
            organizationId: suggestion.organizationId,
            dayOfWeek: suggestion.dayOfWeek,
            startTime: suggestion.startTime,
            endTime: suggestion.endTime,
            isActive: createTurmaData.isActive ?? false, // Default to inactive if not specified
            minimumStudents: createTurmaData.minimumStudents ?? 5
          }
        });
        turmaId = turma.id;
      }

      const updated = await tx.horarioSugerido.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminId,
          createdTurmaId: turmaId
        }
      });

      return updated;
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    const current = await prisma.horarioSugerido.findUnique({ where: { id } });
    return await prisma.horarioSugerido.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        notes: reason ? `[REJEITADO: ${reason}] ${current?.notes || ''}` : undefined
      }
    });
  }
}

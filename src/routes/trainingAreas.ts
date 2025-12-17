// @ts-nocheck
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';
import { z } from 'zod';

// Validation schemas
const createTrainingAreaSchema = z.object({
  unitId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  capacity: z.number().int().min(1).default(20),
  areaType: z.enum(['DOJO', 'OUTDOOR', 'WEIGHT_ROOM', 'CARDIO', 'CROSSTRAINING', 'FUNCTIONAL', 'OTHER']).default('DOJO'),
  dimensions: z.string().optional(),
  equipment: z.array(z.string()).default([]),
  flooring: z.enum(['TATAMI', 'WOOD', 'CONCRETE', 'RUBBER', 'SYNTHETIC', 'GRASS', 'OTHER']).optional(),
  isActive: z.boolean().default(true)
});

const updateTrainingAreaSchema = createTrainingAreaSchema.partial();

const querySchema = z.object({
  unitId: z.string().uuid().optional(),
  areaType: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export default async function trainingAreasRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // Get all training areas
  fastify.get('/', async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);
      
      const where: any = {};
      
      if (query.unitId) {
        where.unitId = query.unitId;
      }
      
      if (query.areaType) {
        where.areaType = query.areaType;
      }
      
      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }
      
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }
      
      const skip = (query.page - 1) * query.limit;
      
      const [trainingAreas, total] = await Promise.all([
        prisma.trainingArea.findMany({
          where,
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                organization: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            _count: {
              select: {
                classes: true,
                turmas: true
              }
            }
          },
          orderBy: [
            { isActive: 'desc' },
            { name: 'asc' }
          ],
          skip,
          take: query.limit
        }),
        prisma.trainingArea.count({ where })
      ]);
      
      return {
        success: true,
        data: trainingAreas,
        pagination: {
          total,
          page: query.page,
          limit: query.limit,
          pages: Math.ceil(total / query.limit)
        }
      };
    } catch (error) {
      fastify.log.error('Error fetching training areas:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Get training area by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const trainingArea = await prisma.trainingArea.findUnique({
        where: { id },
        include: {
          unit: {
            include: {
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          classes: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
              status: true
            },
            orderBy: {
              startTime: 'desc'
            },
            take: 10
          },
          turmas: {
            select: {
              id: true,
              name: true,
              status: true,
              maxStudents: true
            }
          }
        }
      });
      
      if (!trainingArea) {
        return reply.code(404).send({
          success: false,
          error: 'Área de treino não encontrada'
        });
      }
      
      return {
        success: true,
        data: trainingArea
      };
    } catch (error) {
      fastify.log.error('Error fetching training area:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Create training area
  fastify.post('/', async (request, reply) => {
    try {
      const data = createTrainingAreaSchema.parse(request.body);
      
      // Check if unit exists
      const unit = await prisma.unit.findUnique({
        where: { id: data.unitId }
      });
      
      if (!unit) {
        return reply.code(400).send({
          success: false,
          error: 'Unidade não encontrada'
        });
      }
      
      // Check for duplicate name in the same unit
      const existing = await prisma.trainingArea.findFirst({
        where: {
          unitId: data.unitId,
          name: data.name
        }
      });
      
      if (existing) {
        return reply.code(400).send({
          success: false,
          error: 'Já existe uma área de treino com este nome nesta unidade'
        });
      }
      
      const trainingArea = await prisma.trainingArea.create({
        data,
        include: {
          unit: {
            select: {
              id: true,
              name: true,
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      return reply.code(201).send({
        success: true,
        data: trainingArea
      });
    } catch (error) {
      fastify.log.error('Error creating training area:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Update training area
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateTrainingAreaSchema.parse(request.body);
      
      // Check if training area exists
      const existing = await prisma.trainingArea.findUnique({
        where: { id }
      });
      
      if (!existing) {
        return reply.code(404).send({
          success: false,
          error: 'Área de treino não encontrada'
        });
      }
      
      // Check for duplicate name if name is being updated
      if (data.name && data.name !== existing.name) {
        const duplicate = await prisma.trainingArea.findFirst({
          where: {
            unitId: existing.unitId,
            name: data.name,
            NOT: { id }
          }
        });
        
        if (duplicate) {
          return reply.code(400).send({
            success: false,
            error: 'Já existe uma área de treino com este nome nesta unidade'
          });
        }
      }
      
      const trainingArea = await prisma.trainingArea.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          unit: {
            select: {
              id: true,
              name: true,
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      return {
        success: true,
        data: trainingArea
      };
    } catch (error) {
      fastify.log.error('Error updating training area:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Delete training area
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Check if training area exists
      const trainingArea = await prisma.trainingArea.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              classes: true,
              turmas: true
            }
          }
        }
      });
      
      if (!trainingArea) {
        return reply.code(404).send({
          success: false,
          error: 'Área de treino não encontrada'
        });
      }
      
      // Check if there are active references
      if (trainingArea._count.classes > 0 || trainingArea._count.turmas > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Não é possível excluir esta área de treino pois ela está sendo utilizada por turmas ou aulas'
        });
      }
      
      await prisma.trainingArea.delete({
        where: { id }
      });
      
      return {
        success: true,
        message: 'Área de treino excluída com sucesso'
      };
    } catch (error) {
      fastify.log.error('Error deleting training area:', error);
      return reply.code(500).send({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });
}

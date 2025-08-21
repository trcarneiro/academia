import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { z } from 'zod';

// Helper function to get organization ID
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

// Validation schemas
const lessonPlanSchema = z.object({
  courseId: z.string().min(1, 'Curso é obrigatório').uuid('ID do curso deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  lessonNumber: z.number().int().positive('Número da aula deve ser positivo'),
  weekNumber: z.number().int().positive('Número da semana deve ser positivo'),
  unit: z.string().optional(),
  level: z.number().int().min(1).max(5).default(1),
  duration: z.number().int().positive('Duração deve ser positiva').default(60),
  difficulty: z.number().int().min(1).max(5).default(1),
  objectives: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  warmup: z.any().optional(),
  techniques: z.any().optional(),
  simulations: z.any().optional(),
  cooldown: z.any().optional(),
  mentalModule: z.any().optional(),
  tacticalModule: z.string().optional(),
  adaptations: z.any().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
});

const updateLessonPlanSchema = lessonPlanSchema.partial();

export const lessonPlanController = {
  // GET /api/lesson-plans - List all lesson plans
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = await getOrganizationId();
      const query = request.query as any || {};
      
      // Filters
      const where: any = { course: { organizationId } };
      if (query.courseId) where.courseId = query.courseId;
      if (query.level) where.level = parseInt(query.level);
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } }
        ];
      }

      // Pagination
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
      const skip = (page - 1) * pageSize;

      // Sorting
      const sortField = String(query.sortField || '').trim();
      const sortOrder = String((query.sortOrder || 'asc')).toLowerCase() === 'desc' ? 'desc' : 'asc';
      const allowedSortFields: Record<string, any> = {
        'lessonNumber': { lessonNumber: sortOrder },
        'weekNumber': { weekNumber: sortOrder },
        'title': { title: sortOrder },
        'createdAt': { createdAt: sortOrder }
      };
      const orderBy = allowedSortFields[sortField] || { lessonNumber: 'asc' };

      const [lessonPlans, count] = await Promise.all([
        prisma.lessonPlan.findMany({
          where,
          include: {
            course: {
              select: { id: true, name: true, level: true }
            },
            activityItems: {
              include: {
                activity: {
                  select: { id: true, title: true, type: true, difficulty: true }
                }
              },
              orderBy: { ord: 'asc' }
            }
          },
          orderBy,
          skip,
          take: pageSize
        }),
        prisma.lessonPlan.count({ where })
      ]);

      return reply.send({
        success: true,
        data: lessonPlans,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      console.error('Get lesson plans error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar planos de aula'
      });
    }
  },

  // GET /api/lesson-plans/:id - Get single lesson plan
  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const organizationId = await getOrganizationId();

      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        },
        include: {
          course: {
            select: { id: true, name: true, level: true }
          },
          activityItems: {
            include: {
              activity: {
                select: { id: true, title: true, type: true, difficulty: true, description: true }
              }
            },
            orderBy: { ord: 'asc' }
          }
        }
      });

      if (!lessonPlan) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      return reply.send({
        success: true,
        data: lessonPlan
      });
    } catch (error) {
      console.error('Get lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar plano de aula'
      });
    }
  },

  // POST /api/lesson-plans - Create lesson plan
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📋 Creating lesson plan with body:', request.body);
      
      const validation = lessonPlanSchema.safeParse(request.body);
      if (!validation.success) {
        console.error('❌ Validation failed:', validation.error.errors);
        return reply.status(400).send({
          success: false,
          error: validation.error.errors?.[0]?.message || 'Dados inválidos',
          details: validation.error.errors
        });
      }

      const data = validation.data;
      console.log('✅ Validated data:', data);
      console.log('🎓 Course ID from data:', data.courseId);
      
      const organizationId = await getOrganizationId();

      // Verify course exists and belongs to organization
      const course = await prisma.course.findFirst({
        where: { id: data.courseId, organizationId }
      });

      if (!course) {
        return reply.status(404).send({
          success: false,
          error: 'Curso não encontrado'
        });
      }

      // Check for duplicate lesson number in course
      const existing = await prisma.lessonPlan.findFirst({
        where: {
          courseId: data.courseId,
          lessonNumber: data.lessonNumber
        }
      });

      if (existing) {
        return reply.status(409).send({
          success: false,
          error: 'Já existe uma aula com este número neste curso'
        });
      }

      const lessonPlan = await prisma.lessonPlan.create({
        data: {
          ...data,
          description: data.description ?? null,
          unit: data.unit ?? null,
          mentalModule: data.mentalModule ?? null,
          tacticalModule: data.tacticalModule ?? null,
          adaptations: data.adaptations ?? null,
          videoUrl: data.videoUrl ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
          warmup: data.warmup || {},
          techniques: data.techniques || {},
          simulations: data.simulations || {},
          cooldown: data.cooldown || {}
        },
        include: {
          course: {
            select: { id: true, name: true, level: true }
          }
        }
      });

      return reply.status(201).send({
        success: true,
        data: lessonPlan,
        message: 'Plano de aula criado com sucesso'
      });
    } catch (error) {
      console.error('Create lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao criar plano de aula'
      });
    }
  },

  // PUT /api/lesson-plans/:id - Update lesson plan
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const validation = updateLessonPlanSchema.safeParse(request.body);
      
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: validation.error.errors?.[0]?.message || 'Dados inválidos'
        });
      }

      const data = validation.data;
      const organizationId = await getOrganizationId();

      // Verify lesson plan exists and belongs to organization
      const existing = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        }
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      // Check for lesson number conflicts if being updated
      if (data.lessonNumber && data.lessonNumber !== existing.lessonNumber) {
        const conflict = await prisma.lessonPlan.findFirst({
          where: {
            courseId: existing.courseId,
            lessonNumber: data.lessonNumber,
            NOT: { id }
          }
        });

        if (conflict) {
          return reply.status(409).send({
            success: false,
            error: 'Já existe uma aula com este número neste curso'
          });
        }
      }

      // Prepare update data, filtering out undefined values and excluding courseId
      const { courseId, ...updateData } = data;
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).map(([key, value]) => [
          key,
          value === undefined ? null : value
        ])
      );

      const lessonPlan = await prisma.lessonPlan.update({
        where: { id },
        data: cleanUpdateData,
        include: {
          course: {
            select: { id: true, name: true, level: true }
          },
          activityItems: {
            include: {
              activity: {
                select: { id: true, title: true, type: true }
              }
            },
            orderBy: { ord: 'asc' }
          }
        }
      });

      return reply.send({
        success: true,
        data: lessonPlan,
        message: 'Plano de aula atualizado com sucesso'
      });
    } catch (error) {
      console.error('Update lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao atualizar plano de aula'
      });
    }
  },

  // DELETE /api/lesson-plans/:id - Delete lesson plan
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const organizationId = await getOrganizationId();

      // Verify lesson plan exists and belongs to organization
      const existing = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        }
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      // Check if lesson plan is being used in classes
      const classCount = await prisma.class.count({
        where: { lessonPlanId: id }
      });

      if (classCount > 0) {
        return reply.status(409).send({
          success: false,
          error: 'Não é possível excluir plano de aula que está sendo usado em aulas'
        });
      }

      await prisma.lessonPlan.delete({
        where: { id }
      });

      return reply.status(204).send();
    } catch (error) {
      console.error('Delete lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao excluir plano de aula'
      });
    }
  },

  // GET /api/lesson-plans/:id/activities - Get lesson plan activities
  async getActivities(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const organizationId = await getOrganizationId();

      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        },
        include: {
          activityItems: {
            include: {
              activity: true
            },
            orderBy: { ord: 'asc' }
          }
        }
      });

      if (!lessonPlan) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      return reply.send({
        success: true,
        data: lessonPlan.activityItems
      });
    } catch (error) {
      console.error('Get lesson plan activities error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao buscar atividades do plano de aula'
      });
    }
  },

  // POST /api/lesson-plans/:id/activities - Add activity to lesson plan
  async addActivity(request: FastifyRequest<{ 
    Params: { id: string }, 
    Body: { activityId: string, segment: string, ord?: number } 
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { activityId, segment, ord } = request.body;
      const organizationId = await getOrganizationId();

      // Verify lesson plan exists
      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        }
      });

      if (!lessonPlan) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      // Verify activity exists
      const activity = await prisma.activity.findFirst({
        where: { 
          id: activityId,
          organizationId 
        }
      });

      if (!activity) {
        return reply.status(404).send({
          success: false,
          error: 'Atividade não encontrada'
        });
      }

      // Get next order if not provided
      const nextOrd = ord || (await prisma.lessonPlanActivity.count({
        where: { lessonPlanId: id }
      })) + 1;

      const lessonPlanActivity = await prisma.lessonPlanActivity.create({
        data: {
          lessonPlanId: id,
          activityId,
          segment: segment as any,
          ord: nextOrd
        },
        include: {
          activity: {
            select: { id: true, title: true, type: true, difficulty: true }
          }
        }
      });

      return reply.status(201).send({
        success: true,
        data: lessonPlanActivity,
        message: 'Atividade adicionada ao plano de aula'
      });
    } catch (error) {
      console.error('Add activity to lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao adicionar atividade ao plano de aula'
      });
    }
  },

  // DELETE /api/lesson-plans/:id/activities/:activityId - Remove activity from lesson plan
  async removeActivity(request: FastifyRequest<{ 
    Params: { id: string, activityId: string } 
  }>, reply: FastifyReply) {
    try {
      const { id, activityId } = request.params;
      const organizationId = await getOrganizationId();

      // Verify lesson plan exists
      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        }
      });

      if (!lessonPlan) {
        return reply.status(404).send({
          success: false,
          error: 'Plano de aula não encontrado'
        });
      }

      // Remove activity from lesson plan
      const deleted = await prisma.lessonPlanActivity.deleteMany({
        where: {
          lessonPlanId: id,
          activityId
        }
      });

      if (deleted.count === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Atividade não encontrada no plano de aula'
        });
      }

      return reply.status(204).send();
    } catch (error) {
      console.error('Remove activity from lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao remover atividade do plano de aula'
      });
    }
  },

  // POST /api/lesson-plans/import - Import lesson plan
  async import(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const organizationId = await getOrganizationId();

      // Validate required fields
      const title = body.title?.toString().trim();
      const courseId = body.courseId?.toString().trim();
      
      if (!title) {
        return reply.status(400).send({
          success: false,
          error: 'Título é obrigatório'
        });
      }

      if (!courseId) {
        return reply.status(400).send({
          success: false,
          error: 'ID do curso é obrigatório'
        });
      }

      // Verify course exists and belongs to organization
      const course = await prisma.course.findFirst({
        where: { 
          id: courseId,
          organizationId
        }
      });

      if (!course) {
        return reply.status(404).send({
          success: false,
          error: 'Curso não encontrado'
        });
      }

      // Prepare lesson plan data
      const lessonNumber = Number(body.lessonNumber || 1);
      const weekNumber = Number(body.weekNumber || 1);
      
      // Check for duplicate lesson number in course
      const existing = await prisma.lessonPlan.findFirst({
        where: {
          courseId,
          lessonNumber
        }
      });

      let lessonPlan;
      if (existing) {
        // Update existing lesson plan
        lessonPlan = await prisma.lessonPlan.update({
          where: { id: existing.id },
          data: {
            title,
            description: body.description ?? null,
            weekNumber,
            unit: body.unit ?? null,
            level: Number(body.level || 1),
            duration: Number(body.duration || 60),
            difficulty: Number(body.difficulty || 1),
            objectives: Array.isArray(body.objectives) ? body.objectives : [],
            equipment: Array.isArray(body.equipment) ? body.equipment : [],
            activities: Array.isArray(body.activities) ? body.activities : [],
            warmup: body.warmup || {},
            techniques: body.techniques || {},
            simulations: body.simulations || {},
            cooldown: body.cooldown || {},
            mentalModule: body.mentalModule ?? null,
            tacticalModule: body.tacticalModule ?? null,
            adaptations: body.adaptations ?? null,
            videoUrl: body.videoUrl ?? null,
            thumbnailUrl: body.thumbnailUrl ?? null
          },
          include: {
            course: {
              select: { id: true, name: true, level: true }
            }
          }
        });
      } else {
        // Create new lesson plan
        lessonPlan = await prisma.lessonPlan.create({
          data: {
            courseId,
            title,
            description: body.description ?? null,
            lessonNumber,
            weekNumber,
            unit: body.unit ?? null,
            level: Number(body.level || 1),
            duration: Number(body.duration || 60),
            difficulty: Number(body.difficulty || 1),
            objectives: Array.isArray(body.objectives) ? body.objectives : [],
            equipment: Array.isArray(body.equipment) ? body.equipment : [],
            activities: Array.isArray(body.activities) ? body.activities : [],
            warmup: body.warmup || {},
            techniques: body.techniques || {},
            simulations: body.simulations || {},
            cooldown: body.cooldown || {},
            mentalModule: body.mentalModule ?? null,
            tacticalModule: body.tacticalModule ?? null,
            adaptations: body.adaptations ?? null,
            videoUrl: body.videoUrl ?? null,
            thumbnailUrl: body.thumbnailUrl ?? null
          },
          include: {
            course: {
              select: { id: true, name: true, level: true }
            }
          }
        });
      }

      return reply.send({
        success: true,
        data: lessonPlan,
        message: existing ? 'Plano de aula atualizado com sucesso' : 'Plano de aula importado com sucesso'
      });
    } catch (error) {
      console.error('Import lesson plan error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Falha ao importar plano de aula'
      });
    }
  }
};

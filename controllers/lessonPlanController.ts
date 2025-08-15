import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para obter o ID da organização (simulado por enquanto)
const getOrganizationId = (request: FastifyRequest): string => {
  // Em um app real, isso viria do token JWT do usuário autenticado
  // request.user.organizationId
  return '0fef3e41-018d-4cd2-afbc-bbfe81baa90b'; // Academia Teste
};

// Esquema de validação para criação de lesson plan
const createLessonPlanSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1, 'O título do plano de aula é obrigatório'),
  description: z.string().optional(),
  lessonNumber: z.number().int().positive('O número da aula deve ser um número positivo'),
  weekNumber: z.number().int().positive('O número da semana deve ser um número positivo'),
  unit: z.string().optional(),
  level: z.number().int().min(1).max(5).default(1),
  warmup: z.any(), // JSON
  techniques: z.any(), // JSON
  simulations: z.any(), // JSON
  cooldown: z.any(), // JSON
  mentalModule: z.any().optional(), // JSON
  tacticalModule: z.string().optional(),
  adaptations: z.any().optional(), // JSON
  duration: z.number().int().positive('A duração deve ser um número positivo').default(60),
  difficulty: z.number().int().min(1).max(5).default(1),
  objectives: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
});

// Esquema de validação para atualização (todos os campos são opcionais)
const updateLessonPlanSchema = createLessonPlanSchema.partial();

export const lessonPlanController = {
  // Listar todos os lesson plans de um curso
  async listByCourse(request: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { courseId } = request.params;
      
      // Verificar se o curso pertence à organização
      const course = await prisma.course.findFirst({
        where: { id: courseId, organizationId },
      });
      
      if (!course) {
        return reply.status(404).send({ success: false, error: 'Curso não encontrado' });
      }
      
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: { courseId },
        orderBy: { lessonNumber: 'asc' },
      });
      
      reply.send({ success: true, data: lessonPlans });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao buscar planos de aula' });
    }
  },

  // Obter um lesson plan específico por ID
  async show(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      
      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        },
      });

      if (!lessonPlan) {
        return reply.status(404).send({ success: false, error: 'Plano de aula não encontrado' });
      }

      reply.send({ success: true, data: lessonPlan });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao buscar plano de aula' });
    }
  },

  // Criar um novo lesson plan
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const input = createLessonPlanSchema.parse(request.body);

      // Verificar se o curso pertence à organização
      const course = await prisma.course.findFirst({
        where: { id: input.courseId, organizationId },
      });
      
      if (!course) {
        return reply.status(404).send({ success: false, error: 'Curso não encontrado' });
      }

      // Validar se já existe um lesson plan com o mesmo número de aula para este curso
      const existingLessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          courseId: input.courseId,
          lessonNumber: input.lessonNumber
        },
      });
      
      if (existingLessonPlan) {
        return reply.status(409).send({ success: false, error: 'Já existe um plano de aula com este número para este curso' });
      }

      const newLessonPlan = await prisma.lessonPlan.create({
        data: {
          ...input,
          // Garantir que campos obrigatórios estejam presentes
          warmup: input.warmup ?? [],
          techniques: input.techniques ?? [],
          simulations: input.simulations ?? [],
          cooldown: input.cooldown ?? [],
          // Tratar campos opcionais que podem ser undefined
          description: input.description ?? null,
          unit: input.unit ?? null,
          mentalModule: input.mentalModule ?? null,
          tacticalModule: input.tacticalModule ?? null,
          adaptations: input.adaptations ?? null,
          videoUrl: input.videoUrl ?? null,
          thumbnailUrl: input.thumbnailUrl ?? null,
        },
      });

      reply.status(201).send({ success: true, data: newLessonPlan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      reply.status(500).send({ success: false, error: 'Erro ao criar plano de aula' });
    }
  },

  // Atualizar um lesson plan existente
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      const input = updateLessonPlanSchema.parse(request.body);

      // Verificar se o lesson plan pertence à organização
      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        },
      });
      
      if (!lessonPlan) {
        return reply.status(404).send({ success: false, error: 'Plano de aula não encontrado' });
      }

      // Se o número da aula for alterado, validar se já existe outro lesson plan com o novo número
      if (input.lessonNumber && input.lessonNumber !== lessonPlan.lessonNumber) {
        const existingLessonPlan = await prisma.lessonPlan.findFirst({
          where: { 
            courseId: lessonPlan.courseId,
            lessonNumber: input.lessonNumber,
            NOT: { id }
          },
        });
        
        if (existingLessonPlan) {
          return reply.status(409).send({ success: false, error: 'Já existe um plano de aula com este número para este curso' });
        }
      }

      // Remover campos que não podem ser atualizados
      const { courseId, ...updateData } = input;
      
      // Preparar dados para atualização, tratando campos opcionais
      const preparedUpdateData: any = {};
      
      // Campos que podem ser atualizados diretamente
      if (updateData.title !== undefined) preparedUpdateData.title = updateData.title;
      if (updateData.description !== undefined) preparedUpdateData.description = updateData.description ?? null;
      if (updateData.lessonNumber !== undefined) preparedUpdateData.lessonNumber = updateData.lessonNumber;
      if (updateData.weekNumber !== undefined) preparedUpdateData.weekNumber = updateData.weekNumber;
      if (updateData.unit !== undefined) preparedUpdateData.unit = updateData.unit ?? null;
      if (updateData.level !== undefined) preparedUpdateData.level = updateData.level;
      if (updateData.warmup !== undefined) preparedUpdateData.warmup = updateData.warmup;
      if (updateData.techniques !== undefined) preparedUpdateData.techniques = updateData.techniques;
      if (updateData.simulations !== undefined) preparedUpdateData.simulations = updateData.simulations;
      if (updateData.cooldown !== undefined) preparedUpdateData.cooldown = updateData.cooldown;
      if (updateData.mentalModule !== undefined) preparedUpdateData.mentalModule = updateData.mentalModule ?? null;
      if (updateData.tacticalModule !== undefined) preparedUpdateData.tacticalModule = updateData.tacticalModule ?? null;
      if (updateData.adaptations !== undefined) preparedUpdateData.adaptations = updateData.adaptations ?? null;
      if (updateData.duration !== undefined) preparedUpdateData.duration = updateData.duration;
      if (updateData.difficulty !== undefined) preparedUpdateData.difficulty = updateData.difficulty;
      if (updateData.objectives !== undefined) preparedUpdateData.objectives = updateData.objectives;
      if (updateData.equipment !== undefined) preparedUpdateData.equipment = updateData.equipment;
      if (updateData.activities !== undefined) preparedUpdateData.activities = updateData.activities;
      if (updateData.videoUrl !== undefined) preparedUpdateData.videoUrl = updateData.videoUrl ?? null;
      if (updateData.thumbnailUrl !== undefined) preparedUpdateData.thumbnailUrl = updateData.thumbnailUrl ?? null;
      
      const updatedLessonPlan = await prisma.lessonPlan.update({
        where: { id },
        data: preparedUpdateData,
      });
      
      reply.send({ success: true, data: updatedLessonPlan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      reply.status(500).send({ success: false, error: 'Erro ao atualizar plano de aula' });
    }
  },

  // Deletar um lesson plan
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      
      // Verificar se o lesson plan pertence à organização
      const lessonPlan = await prisma.lessonPlan.findFirst({
        where: { 
          id,
          course: { organizationId }
        },
      });
      
      if (!lessonPlan) {
        return reply.status(404).send({ success: false, error: 'Plano de aula não encontrado' });
      }
      
      await prisma.lessonPlan.delete({
        where: { id },
      });
      
      reply.status(204).send(); // Resposta sem conteúdo
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao deletar plano de aula' });
    }
  },
  
  // Listar todos os lesson plans
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      
      const lessonPlans = await prisma.lessonPlan.findMany({
        where: { 
          course: { organizationId }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
      
      reply.send({ success: true, data: lessonPlans });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao buscar planos de aula' });
    }
  },
};

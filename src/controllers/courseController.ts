import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { courseService, CourseData, UpdateCourseData } from '../services/courseService';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';

// Esquema de validação para criação de curso  
const createCourseSchema = z.object({
  name: z.string().min(3, 'O nome do curso é obrigatório'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  duration: z.number().int().positive('A duração deve ser um número positivo'),
  isActive: z.boolean().default(true),
  // Extended fields for complex course structure
  objectives: z.array(z.string()).optional(),
  generalObjectives: z.array(z.string()).optional(),
  specificObjectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  methodology: z.string().optional(),
  teachingStyle: z.string().optional(),
  evaluation: z.object({
    criteria: z.array(z.string()).optional(),
    methods: z.array(z.string()).optional(),
    requirements: z.string().optional()
  }).optional(),
  evaluationCriteria: z.array(z.string()).optional()
});

// Esquema de validação para atualização
const updateCourseSchema = createCourseSchema.partial();

// Função dinâmica para resolver organizationId
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  console.log('🔍 getOrganizationId - Starting resolution...');
  
  // 1) Body: organizationId (prioritário)
  const bodyOrgId = (request.body as any)?.organizationId as string | undefined;
  console.log('🔍 Body organizationId:', bodyOrgId);
  if (bodyOrgId) {
    const org = await prisma.organization.findUnique({ where: { id: bodyOrgId } });
    if (org) {
      console.log('✅ Organization found via body:', org.id);
      return org.id;
    }
    throw new Error('Organization not found for provided organizationId');
  }

  const headers = request.headers as Record<string, string | undefined>;
  const headerId = headers['x-organization-id'] || headers['x-organizationid'] || headers['organization-id'];
  const headerSlug = headers['x-organization-slug'] || headers['organization-slug'];
  console.log('🔍 Header organizationId:', headerId);
  console.log('🔍 Header organizationSlug:', headerSlug);

  // 2) Header: X-Organization-Id
  if (headerId) {
    const org = await prisma.organization.findUnique({ where: { id: headerId } });
    if (org) {
      console.log('✅ Organization found via header ID:', org.id);
      return org.id;
    }
  }

  // 3) Header: X-Organization-Slug
  if (headerSlug) {
    const org = await prisma.organization.findUnique({ where: { slug: headerSlug } });
    if (org) {
      console.log('✅ Organization found via header slug:', org.id);
      return org.id;
    }
  }

  // 4) Fallback flexível: sempre usar a primeira organização disponível para desenvolvimento
  console.log('🔍 Using fallback strategy - finding first available organization...');
  const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
  if (firstOrg?.id) {
    console.log('⚠️ Using first available organization as fallback:', firstOrg.id);
    return firstOrg.id;
  }

  console.error('❌ No organization found at all');
  throw new Error('No organization found in database');
}

// Resolver (buscar/criar) arte marcial válida
async function resolveMartialArtId(organizationId: string, desiredName?: string) {
  const name = desiredName || 'Krav Maga';
  let art = await prisma.martialArt.findFirst({ where: { organizationId, name } });
  if (!art) {
    art = await prisma.martialArt.create({ data: { organizationId, name } });
  }
  return art.id;
}

export const courseController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;
      
      // Get query parameters
      const query = request.query as { active?: string };
      const activeFilter = query.active === 'true' ? true : query.active === 'false' ? false : undefined;
      
      const courses = await courseService.getAllCourses(organizationId, activeFilter);
      reply.send({ success: true, data: courses });
    } catch (error) {
      console.error('❌ list courses error', error);
      reply.status(500).send({ success: false, error: 'Erro ao buscar cursos' });
    }
  },

  async show(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;
      const { id } = request.params;
      const course = await courseService.getCourseById(id, organizationId);
      if (!course) {
        return reply.status(404).send({ success: false, error: 'Curso não encontrado' });
      }
      reply.send({ success: true, data: course });
    } catch (error) {
      console.error('❌ show course error', error);
      reply.status(500).send({ success: false, error: 'Erro ao buscar curso' });
    }
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;
      const input = createCourseSchema.parse(request.body);

      const existingCourse = await courseService.findCourseByName(input.name, organizationId);
      if (existingCourse) {
        return reply.status(409).send({ success: false, error: 'Já existe um curso com este nome' });
      }

      const martialArtId = await resolveMartialArtId(organizationId, (request.body as any)?.martialArt);

      const courseData: CourseData = {
        ...input,
        organizationId,
        martialArtId,
        level: input.level,
        description: input.description ?? null,
      };

      const newCourse = await courseService.createCourse(courseData);
      reply.status(201).send({ success: true, data: newCourse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      console.error('❌ create course error', error);
      reply.status(500).send({ success: false, error: 'Erro ao criar curso' });
    }
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;
      const { id } = request.params;
      const input = updateCourseSchema.parse(request.body);

      if (input.name) {
        const existingCourse = await courseService.findCourseByName(input.name, organizationId, id);
        if (existingCourse) {
          return reply.status(409).send({ success: false, error: 'Já existe um curso com este nome' });
        }
      }

      const updateData: UpdateCourseData = { ...input };
      const updatedCourse = await courseService.updateCourse(id, updateData, organizationId);
      reply.send({ success: true, data: updatedCourse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      console.error('❌ update course error', error);
      reply.status(500).send({ success: false, error: 'Erro ao atualizar curso' });
    }
  },

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      console.log('🗑️ Delete course request - ID:', request.params.id);
      console.log('🗑️ Delete course headers:', request.headers);
      console.log('🗑️ Delete course body:', request.body);
      
      const { id } = request.params;
      console.log('🗑️ Attempting to delete course:', id);
      
      // Verificar se o curso existe primeiro
      const existingCourse = await prisma.course.findFirst({
        where: { id, organizationId },
        select: { id: true, name: true }
      });

      if (!existingCourse) {
        console.log('❌ Course not found:', id);
        return reply.status(404).send({ 
          success: false, 
          error: 'Curso não encontrado' 
        });
      }

      console.log('✅ Course found:', existingCourse.name);
      
      // Primeiro deletar todas as classes relacionadas
      console.log('🗑️ Deleting related classes first...');
      const deleteClassesResult = await prisma.class.deleteMany({
        where: {
          courseId: id
        }
      });
      console.log(`✅ Deleted ${deleteClassesResult.count} related classes`);

      // Agora deletar o curso
      console.log('🗑️ Deleting course...');
      await prisma.course.delete({
        where: { id }
      });
      
      console.log('✅ Course deleted successfully');
      reply.status(200).send({ 
        success: true, 
        message: 'Curso e aulas relacionadas deletados com sucesso' 
      });
    } catch (error) {
      const e = error as Error;
      console.error('❌ Delete course error details:', e);
      console.error('❌ Error message:', e.message);
      console.error('❌ Error stack:', e.stack);
      
      if (e.message.includes('não encontrado')) {
        return reply.status(404).send({ success: false, error: e.message });
      }
      if (e.message.includes('foreign key') || e.message.includes('constraint')) {
        return reply.status(400).send({ 
          success: false, 
          error: 'Não é possível deletar este curso pois ele possui dados associados (alunos, aulas, etc.)' 
        });
      }
      console.error('❌ delete course error', error);
      reply.status(500).send({ 
        success: false, 
        error: 'Erro interno do servidor ao deletar curso' 
      });
    }
  },
};

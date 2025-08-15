import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { courseService, CourseData, UpdateCourseData } from '../services/courseService';
import { prisma } from '@/utils/database';

// Esquema de validação para criação de curso
const createCourseSchema = z.object({
  name: z.string().min(3, 'O nome do curso é obrigatório'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  duration: z.number().int().positive('A duração deve ser um número positivo'),
  isActive: z.boolean().default(true),
});

// Esquema de validação para atualização
const updateCourseSchema = createCourseSchema.partial();

// Função dinâmica para resolver organizationId
async function getOrganizationId(request: FastifyRequest): Promise<string> {
  // 1) Body: organizationId (prioritário)
  const bodyOrgId = (request.body as any)?.organizationId as string | undefined;
  if (bodyOrgId) {
    const org = await prisma.organization.findUnique({ where: { id: bodyOrgId } });
    if (org) return org.id;
    throw new Error('Organization not found for provided organizationId');
  }

  const headers = request.headers as Record<string, string | undefined>;
  const headerId = headers['x-organization-id'] || headers['x-organizationid'] || headers['organization-id'];
  const headerSlug = headers['x-organization-slug'] || headers['organization-slug'];

  // 2) Header: X-Organization-Id
  if (headerId) {
    const org = await prisma.organization.findUnique({ where: { id: headerId } });
    if (org) return org.id;
  }

  // 3) Header: X-Organization-Slug
  if (headerSlug) {
    const org = await prisma.organization.findUnique({ where: { slug: headerSlug } });
    if (org) return org.id;
  }

  // 4) Fallback: se houver exatamente 1 organização, usar ela
  const count = await prisma.organization.count();
  if (count === 1) {
    const only = await prisma.organization.findFirst({ select: { id: true } });
    if (only?.id) return only.id;
  }

  throw new Error('Organization not resolved. Provide organizationId in body, X-Organization-Id or X-Organization-Slug header, or ensure exactly one organization exists.');
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
      const organizationId = await getOrganizationId(request);
      const courses = await courseService.getAllCourses(organizationId);
      reply.send({ success: true, data: courses });
    } catch (error) {
      console.error('❌ list courses error', error);
      reply.status(500).send({ success: false, error: 'Erro ao buscar cursos' });
    }
  },

  async show(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = await getOrganizationId(request);
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
      const organizationId = await getOrganizationId(request);
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
      const organizationId = await getOrganizationId(request);
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
      const organizationId = await getOrganizationId(request);
      const { id } = request.params;
      await courseService.deleteCourse(id, organizationId);
      reply.status(204).send();
    } catch (error) {
      const e = error as Error;
      if (e.message.includes('não encontrado')) {
        return reply.status(404).send({ success: false, error: e.message });
      }
      console.error('❌ delete course error', error);
      reply.status(500).send({ success: false, error: 'Erro ao deletar curso' });
    }
  },
};

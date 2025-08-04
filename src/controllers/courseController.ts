
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { courseService, CourseData, UpdateCourseData } from '../services/courseService';

// Esquema de validação para criação de curso
const createCourseSchema = z.object({
  name: z.string().min(3, 'O nome do curso é obrigatório'),
  description: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']),
  duration: z.number().int().positive('A duração deve ser um número positivo'),
  isActive: z.boolean().default(true),
});

// Esquema de validação para atualização (todos os campos são opcionais)
const updateCourseSchema = createCourseSchema.partial();

// Função para obter o ID da organização (simulado por enquanto)
const getOrganizationId = (request: FastifyRequest): string => {
  // Em um app real, isso viria do token JWT do usuário autenticado
  // request.user.organizationId
  return '1e053e35-a3a8-4d29-a51e-1b78346a4b66'; // Elite Krav Maga Academy
};

// Função para obter o ID da arte marcial (simulado por enquanto)
const getMartialArtId = (request: FastifyRequest): string => {
    return 'default-martial-art';
}

export const courseController = {
  // Listar todos os cursos
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const courses = await courseService.getAllCourses(organizationId);
      reply.send({ success: true, data: courses });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao buscar cursos' });
    }
  },

  // Obter um curso específico por ID
  async show(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      const course = await courseService.getCourseById(id, organizationId);

      if (!course) {
        return reply.status(404).send({ success: false, error: 'Curso não encontrado' });
      }

      reply.send({ success: true, data: course });
    } catch (error) {
      reply.status(500).send({ success: false, error: 'Erro ao buscar curso' });
    }
  },

  // Criar um novo curso
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const martialArtId = getMartialArtId(request);
      const input = createCourseSchema.parse(request.body);

      // Validar se já existe um curso com o mesmo nome
      const existingCourse = await courseService.findCourseByName(input.name, organizationId);
      if (existingCourse) {
        return reply.status(409).send({ success: false, error: 'Já existe um curso com este nome' });
      }

      const courseData: CourseData = { ...input, organizationId, martialArtId };
      const newCourse = await courseService.createCourse(courseData);

      reply.status(201).send({ success: true, data: newCourse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      reply.status(500).send({ success: false, error: 'Erro ao criar curso' });
    }
  },

  // Atualizar um curso existente
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      const input = updateCourseSchema.parse(request.body);

      // Se o nome for alterado, validar se já existe outro curso com o novo nome
      if (input.name) {
        const existingCourse = await courseService.findCourseByName(input.name, organizationId, id);
        if (existingCourse) {
          return reply.status(409).send({ success: false, error: 'Já existe um curso com este nome' });
        }
      }

      const updatedCourse = await courseService.updateCourse(id, input, organizationId);
      reply.send({ success: true, data: updatedCourse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ success: false, error: error.flatten().fieldErrors });
      }
      reply.status(500).send({ success: false, error: 'Erro ao atualizar curso' });
    }
  },

  // Deletar um curso
  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const organizationId = getOrganizationId(request);
      const { id } = request.params;
      await courseService.deleteCourse(id, organizationId);
      reply.status(204).send(); // Resposta sem conteúdo
    } catch (error) {
        const e = error as Error;
        if (e.message.includes('não encontrado')) {
            return reply.status(404).send({ success: false, error: e.message });
        }
        reply.status(500).send({ success: false, error: 'Erro ao deletar curso' });
    }
  },
};

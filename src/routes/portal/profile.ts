import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';
import { z } from 'zod';

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalConditions: z.string().optional()
});

export default async function portalProfileRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', portalAuthMiddleware);

  fastify.get('/', async (request, reply) => {
    const studentId = request.studentId;
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        return ResponseHelper.error(reply, 'Aluno não encontrado', 404);
      }

      return ResponseHelper.success(reply, {
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        phone: student.user.phone,
        cpf: student.user.cpf,
        birthDate: student.user.birthDate,
        emergencyContact: student.emergencyContact,
        medicalConditions: student.medicalConditions
      });

    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao carregar perfil', 500);
    }
  });

  fastify.put('/', async (request, reply) => {
    const studentId = request.studentId;
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      const data = updateProfileSchema.parse(request.body);

      const student = await prisma.student.update({
        where: { id: studentId },
        data: {
          emergencyContact: data.emergencyContact,
          medicalConditions: data.medicalConditions,
          user: {
            update: {
              phone: data.phone
            }
          }
        }
      });

      return ResponseHelper.success(reply, student, 'Perfil atualizado com sucesso');

    } catch (error) {
      if (error instanceof z.ZodError) {
        return ResponseHelper.error(reply, error.errors.map(e => e.message).join(', '), 400);
      }
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao atualizar perfil', 500);
    }
  });
}

import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { ScheduleService } from '@/services/portal/scheduleService';
import { ResponseHelper } from '@/utils/response';
import { prisma } from '@/utils/database';

export default async function portalScheduleRoutes(fastify: FastifyInstance) {
  const service = new ScheduleService();
  fastify.addHook('preHandler', portalAuthMiddleware);

  // Get upcoming lessons (My Agenda)
  fastify.get('/', async (request, reply) => {
    try {
      const lessons = await service.listUpcomingLessons(request.studentId);
      return ResponseHelper.success(reply, lessons);
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar agenda', 500);
    }
  });

  // Get available classes to join
  fastify.get('/available', async (request, reply) => {
    try {
      const student = await prisma.student.findUnique({
          where: { id: request.studentId },
          select: { organizationId: true }
      });
      
      if (!student) return ResponseHelper.error(reply, 'Aluno não encontrado', 404);

      const classes = await service.listAvailableClasses(student.organizationId);
      return ResponseHelper.success(reply, classes);
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar turmas disponíveis', 500);
    }
  });

  // Enroll in a class
  fastify.post('/enroll/:turmaId', async (request, reply) => {
    const { turmaId } = request.params as { turmaId: string };
    try {
      await service.enroll(request.studentId, turmaId);
      return ResponseHelper.success(reply, { message: 'Matrícula realizada com sucesso' });
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, error.message || 'Erro ao realizar matrícula', 400);
    }
  });
}

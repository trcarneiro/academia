import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { CourseService } from '@/services/portal/courseService';
import { ResponseHelper } from '@/utils/response';
import { prisma } from '@/utils/database';

export default async function portalCoursesRoutes(fastify: FastifyInstance) {
  const service = new CourseService();
  fastify.addHook('preHandler', portalAuthMiddleware);

  fastify.get('/current', async (request, reply) => {
    try {
      const course = await service.getCurrentCourse(request.studentId);
      if (!course) return ResponseHelper.error(reply, 'Nenhum curso ativo encontrado', 404);
      return ResponseHelper.success(reply, course);
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar curso', 500);
    }
  });

  fastify.get('/:courseId/journey', async (request, reply) => {
    const { courseId } = request.params as { courseId: string };
    try {
      const journey = await service.getCourseJourney(courseId, request.studentId);
      return ResponseHelper.success(reply, journey);
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar jornada', 500);
    }
  });

  fastify.get('/technique/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const details = await service.getTechniqueDetails(id, request.studentId);
      return ResponseHelper.success(reply, details);
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar técnica', 500);
    }
  });

  fastify.get('/ranking', async (request, reply) => {
    try {
      const organizationId = request.organizationId;
      if (!organizationId) return ResponseHelper.error(reply, 'Organização não identificada', 400);

      const result = await service.getRanking(organizationId);
      
      // Find user's rank
      const userRank = result.ranking.find((r: any) => r.id === request.studentId);
      
      return ResponseHelper.success(reply, {
        ranking: result.ranking,
        userRank: userRank || null
      });
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao buscar ranking', 500);
    }
  });

  // Mark technique as completed
  fastify.post('/technique/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = request.studentId;

    try {
      // Check if technique exists
      const technique = await prisma.technique.findUnique({
        where: { id }
      });

      if (!technique) {
        return ResponseHelper.error(reply, 'Técnica não encontrada', 404);
      }

      // Upsert progress
      await prisma.studentTechniqueProgress.upsert({
        where: {
          studentId_techniqueId: { studentId, techniqueId: id }
        },
        create: {
          studentId,
          techniqueId: id,
          completed: true,
          completedAt: new Date()
        },
        update: {
          completed: true,
          completedAt: new Date()
        }
      });

      return ResponseHelper.success(reply, { message: 'Técnica marcada como concluída' });
    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao atualizar progresso', 500);
    }
  });
}

import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { prisma } from '@/utils/database';
import { ResponseHelper } from '@/utils/response';

export default async function portalAcademicRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', portalAuthMiddleware);

  fastify.get('/', async (request, reply) => {
    const studentId = request.studentId;
    
    if (!studentId) {
      return ResponseHelper.error(reply, 'Aluno não identificado', 400);
    }

    try {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId, status: 'ACTIVE' },
        include: {
          course: {
            include: {
              techniques: {
                include: {
                  technique: true
                },
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      });

      const progress = await prisma.studentTechniqueProgress.findMany({
        where: { studentId }
      });

      const courses = enrollments.map(enrollment => {
        const course = enrollment.course;
        const totalTechniques = course.techniques.length;
        const completedTechniques = progress.filter(p => 
          course.techniques.some(t => t.techniqueId === p.techniqueId && p.completed === true)
        ).length;

        return {
          id: course.id,
          name: course.name,
          description: course.description,
          progress: Math.round((completedTechniques / (totalTechniques || 1)) * 100),
          techniques: course.techniques.map(ct => {
            const prog = progress.find(p => p.techniqueId === ct.techniqueId);
            return {
              id: ct.technique.id,
              name: ct.technique.name,
              description: ct.technique.description,
              status: prog?.completed ? 'MASTERED' : 'PENDING'
            };
          })
        };
      });

      return ResponseHelper.success(reply, { courses });

    } catch (error) {
      console.error(error);
      return ResponseHelper.error(reply, 'Erro ao carregar dados acadêmicos', 500);
    }
  });
}

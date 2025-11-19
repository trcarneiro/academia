/**
 * GET /api/students/:id/course-progress
 * Retorna progresso do aluno em um curso específico
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

interface ProgressParams {
  id: string;
}

interface ProgressQuery {
  courseId?: string;
}

export default async function courseProgressRoutes(fastify: FastifyInstance) {
  // GET /api/students/:id/course-progress
  // (registrado com prefix /api/students, então o path é apenas /:id/course-progress)
  fastify.get<{ Params: ProgressParams; Querystring: ProgressQuery }>(
    '/:id/course-progress',
    async (request, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { courseId } = request.query;

        // Se não passou courseId, buscar curso atual do aluno
        let targetCourseId = courseId;

        if (!targetCourseId) {
          // ✅ CORRIGIDO: usar studentCourse ao invés de courseEnrollment
          const enrollment = await prisma.studentCourse.findFirst({
            where: {
              studentId: id,
              status: 'ACTIVE',
              isActive: true,
            },
            orderBy: { startDate: 'desc' },
          });

          if (!enrollment) {
            return reply.send({
              success: true,
              data: {
                hasCourse: false,
                message: 'Aluno não está matriculado em nenhum curso',
              },
            });
          }

          targetCourseId = enrollment.courseId;
        }

        // Buscar curso
        const course = await prisma.course.findUnique({
          where: { id: targetCourseId },
        });

        if (!course) {
          return reply.code(404).send({
            success: false,
            message: 'Curso não encontrado',
          });
        }

        // Buscar progresso do aluno (modelo simplificado)
        const allProgress = await prisma.studentProgress.findMany({
          where: {
            studentId: id,
            courseId: targetCourseId,
          },
        });

        // Calcular estatísticas
        const totalActivities = allProgress.length;
        const completedActivities = allProgress.filter(
          (p) => p.completionPercentage >= 100
        ).length;

        // Calcular média das avaliações qualitativas
        const qualAssessments = await prisma.qualitativeAssessment.findMany({
          where: {
            studentProgress: {
              studentId: id,
              courseId: targetCourseId
            }
          }
        });

        const averageRating =
          qualAssessments.length > 0
            ? qualAssessments.reduce((sum, a) => sum + a.rating, 0) / qualAssessments.length
            : 0;

        // Critérios de graduação: 80% das atividades completas E média >= 7.0
        const percentage =
          totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
        const isEligibleForGraduation = percentage >= 80 && averageRating >= 7.0;

        return reply.send({
          success: true,
          data: {
            hasCourse: true,
            course: {
              id: course.id,
              name: course.name,
              level: course.level,
              totalClasses: course.totalClasses,
            },
            totalActivities,
            completedActivities,
            percentage: Math.round(percentage),
            averageRating: Math.round(averageRating * 10) / 10,
            isEligibleForGraduation,
            remainingActivities: totalActivities - completedActivities,
            eligibilityStatus: isEligibleForGraduation
              ? 'READY_FOR_EXAM'
              : percentage >= 80
              ? 'NEEDS_BETTER_GRADES'
              : 'NEEDS_MORE_ACTIVITIES',
          },
        });
      } catch (error) {
        logger.error('Error fetching course progress:', error);
        return reply.code(500).send({
          success: false,
          message: 'Failed to fetch course progress',
        });
      }
    }
  );
}

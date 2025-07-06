import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';

export const diagnosticRoutes = async (fastify: FastifyInstance) => {
  // Route alias for diagnostic: /api/courses
  fastify.get('/api/courses', async () => {
    try {
      const courses = await prisma.course.findMany({
        include: {
          martialArt: true,
          _count: {
            select: {
              enrollments: true,
              classes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: courses.map(course => ({
          id: course.id,
          name: course.name,
          description: course.description,
          level: course.level,
          category: course.category,
          duration: course.duration,
          classesPerWeek: course.classesPerWeek,
          totalClasses: course.totalClasses,
          minAge: course.minAge,
          maxAge: course.maxAge,
          martialArt: course.martialArt,
          enrollments: course._count.enrollments,
          classes: course._count.classes,
          createdAt: course.createdAt
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch courses');
      return {
        success: false,
        error: 'Failed to fetch courses',
        data: []
      };
    }
  });

  // Route alias for diagnostic: /api/financial-responsibles
  fastify.get('/api/financial-responsibles', async () => {
    try {
      const responsibles = await prisma.financialResponsible.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: responsibles.map(responsible => ({
          id: responsible.id,
          name: responsible.name,
          cpfCnpj: responsible.cpfCnpj,
          email: responsible.email,
          phone: responsible.phone,
          relationshipType: responsible.relationshipType,
          createdAt: responsible.createdAt
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch financial responsibles');
      return {
        success: false,
        error: 'Failed to fetch financial responsibles',
        data: []
      };
    }
  });
};

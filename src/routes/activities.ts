import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';

// Helper function to get organization ID dynamically
async function getOrganizationId(): Promise<string> {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('No organization found');
  }
  return org.id;
}

export default async function activitiesRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  
  // GET /api/activities/recent - Get recent activities
  fastify.get('/recent', {
    schema: {
      description: 'Get recent activities',
      tags: ['Activities']
    }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      
      // Get recent attendances as activities
      const recentAttendances = await prisma.attendance.findMany({
        where: {
          student: {
            organizationId
          },
          status: 'PRESENT',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      const activities = recentAttendances.map(attendance => ({
        id: attendance.id,
        studentName: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
        description: 'novo check-in registrado',
        createdAt: attendance.createdAt,
        type: 'attendance'
      }));

      return {
        success: true,
        data: activities
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: 'Failed to fetch activities',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}
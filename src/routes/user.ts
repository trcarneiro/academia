import { FastifyInstance } from 'fastify';
import { AuthService } from '@/services/authService';
import { ResponseHelper } from '@/utils/response';
import { prisma } from '@/utils/database';
import { authenticateToken } from '@/middlewares/auth';

export default async function userRoutes(fastify: FastifyInstance) {
  // Get or create default org for user
  fastify.post('/user/org', {
    preHandler: [authenticateToken],
    handler: async (request, reply) => {
      const userId = request.user.id;

      try {
        // Check if user has org
        let user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true }
        });

        if (!user.organizationId) {
          // Create default org
          const defaultOrg = await prisma.organization.create({
            data: {
              name: `Organização de ${user.firstName || 'Usuário'} ${user.lastName || ''}`,
              slug: `org-${userId.substring(0, 8)}`,
              isActive: true,
              // Other default fields
            }
          });

          // Update user with org
          user = await prisma.user.update({
            where: { id: userId },
            data: { organizationId: defaultOrg.id },
          });
        }

        return ResponseHelper.success(reply, { orgId: user.organizationId });
      } catch (error) {
        console.error('Org association failed:', error);
        return ResponseHelper.error(reply, 'Falha ao associar organização', 500);
      }
    }
  });
}
import { FastifyInstance } from 'fastify';
import { AuthService } from '@/services/authService';
import { ResponseHelper } from '@/utils/response';
import { prisma } from '@/utils/database';
import { authenticateToken } from '@/middlewares/auth';

// Type for authenticated request
interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: string;
  email: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  // Get or create default org for user
  fastify.post('/user/org', {
    preHandler: [authenticateToken],
    handler: async (request, reply) => {
      const userId = (request.user as AuthenticatedUser).id;

      try {
        // Check if user has org
        let user = await prisma.user.findUnique({
          where: { id: userId },
          include: { organization: true }
        });

        if (!user) {
          return ResponseHelper.error(reply, 'Usuário não encontrado', 404);
        }

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
            include: { organization: true }
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
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '@/utils/database';

export default async function usersRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /api/users - optional ?role=INSTRUCTOR to filter instructors
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as any;
      if (query && query.role === 'INSTRUCTOR') {
        // Return users that have role INSTRUCTOR or linked instructors
        let users = await prisma.user.findMany({
          where: { role: 'INSTRUCTOR' },
          select: { id: true, firstName: true, lastName: true, email: true }
        });
        
        // If no instructors exist, create default ones
        if (users.length === 0) {
          // Get or create default organization
          let defaultOrg = await prisma.organization.findFirst();
          if (!defaultOrg) {
            defaultOrg = await prisma.organization.create({
              data: {
                name: 'Academia Krav Maga',
                slug: 'academia-krav-maga',
                email: 'contato@academiakravmaga.com.br',
                isActive: true
              }
            });
          }
          
          // Create default instructor
          const instructor = await prisma.user.create({
            data: {
              firstName: 'Professor',
              lastName: 'Marcus',
              email: 'instructor@academiakravmaga.com.br',
              password: 'instructor123',
              role: 'INSTRUCTOR',
              organizationId: defaultOrg.id,
              isActive: true
            }
          });
          
          users = [instructor];
        }
        
        const data = users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email }));
        return { success: true, data };
      }

      // Default: return basic users list (limited)
      const users = await prisma.user.findMany({ take: 50, select: { id: true, firstName: true, lastName: true, email: true, role: true } });
      const data = users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role }));
      return { success: true, data };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { success: false, error: 'Failed to fetch users' };
    }
  });
}

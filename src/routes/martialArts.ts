import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@/utils/database';
import { requireOrganizationId } from '@/utils/tenantHelpers';

export async function martialArtsRoutes(app: FastifyInstance) {
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const organizationId = requireOrganizationId(request as any, reply as any) as string;
      if (!organizationId) return;

      const martialArts = await prisma.martialArt.findMany({
        where: { organizationId, isActive: true },
        orderBy: { name: 'asc' }
      });

      return reply.send({ success: true, data: martialArts });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Erro ao buscar artes marciais' });
    }
  });
}

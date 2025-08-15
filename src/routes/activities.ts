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
  _options: FastifyPluginOptions
) {
  const db: any = prisma as any;
  
  // GET /api/activities - List catalog activities (supports filtering, search, pagination)
  fastify.get('/', async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const query = request.query as any || {};
      const type = query.type;
      const q = query.q;
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const pageSize = Math.min(500, Math.max(1, parseInt(query.pageSize, 10) || 50));
      const skip = (page - 1) * pageSize;

      const where: any = { organizationId };
      if (type) where.type = type;
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ];
      }

      // Sorting
      const sortField = String(query.sortField || '').trim();
      const sortOrder = String((query.sortOrder || 'desc')).toLowerCase() === 'asc' ? 'asc' : 'desc';
      const allowedSortFields: Record<string, any> = {
        'createdAt': { createdAt: sortOrder },
        'title': { title: sortOrder },
        'difficulty': { difficulty: sortOrder }
      };
      const orderBy = allowedSortFields[sortField] || { createdAt: 'desc' };
      
      const [items, count] = await Promise.all([
        db.activity.findMany({ where, orderBy, skip, take: pageSize }),
        db.activity.count({ where })
      ]);

      return { success: true, data: items, count, page, pageSize };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to fetch activities' };
    }
  });

  // POST /api/activities - Create activity
  fastify.post('/', {
    schema: { tags: ['Activities'] }
  }, async (request, reply) => {
    try {
      const organizationId = await getOrganizationId();
      const body = request.body as any;

      // Normalize / validate incoming fields
      const typeMap: Record<string, string> = {
        'Postura': 'TECHNIQUE',
        'Soco': 'TECHNIQUE',
        'Cotovelada': 'TECHNIQUE',
        'Chute': 'TECHNIQUE',
        'Combinação': 'TECHNIQUE',
        'Defesa Estrangulamento': 'TECHNIQUE',
        'Defesa Geral': 'TECHNIQUE',
        'Queda': 'DRILL',
        'Rolamento': 'DRILL'
      };
      const validTypes = ['TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT'];

      const difficultyMap: Record<string, number> = {
        'Iniciante': 1,
        'Intermediário': 2,
        'Avançado': 3,
        'Especialista': 4,
        'Mestre': 5
      };

      // Type normalization
      let type: string = 'TECHNIQUE';
      if (typeof body.type === 'string') {
        const t = body.type.trim();
        if (validTypes.includes(t)) type = t;
        else if (validTypes.includes(t.toUpperCase())) type = t.toUpperCase();
        else if (typeMap[t]) type = typeMap[t];
      }

      // Difficulty normalization
      let difficulty: number | null = null;
      if (typeof body.difficulty === 'number') {
        difficulty = body.difficulty;
      } else if (typeof body.difficulty === 'string') {
        const d = body.difficulty.trim();
        difficulty = difficultyMap[d] ?? (Number.isFinite(Number(d)) ? Number(d) : null);
      }

      // refTechniqueId normalization (accept array or string)
      let refTechniqueId: string | null = null;
      if (Array.isArray(body.refTechniqueId) && body.refTechniqueId.length > 0) {
        refTechniqueId = String(body.refTechniqueId[0]);
      } else if (typeof body.refTechniqueId === 'string' && body.refTechniqueId.trim()) {
        refTechniqueId = body.refTechniqueId.trim();
      }

      // Normalize arrays
      const equipment = Array.isArray(body.equipment) ? body.equipment : (body.equipment ? [body.equipment] : []);
      const adaptations = Array.isArray(body.adaptations) ? body.adaptations : (body.adaptations ? [body.adaptations] : []);

      const title = (body.title || body.name || '').toString().trim();
      if (!title) {
        reply.code(400);
        return { success: false, error: 'Missing required field: title' };
      }

      const payload: any = {
        organizationId,
        // only include id if provided (used to decide update vs create)
        ...(body.id ? { id: body.id } : {}),
        type,
        title,
        description: body.description ?? null,
        equipment,
        safety: body.safety ?? null,
        adaptations,
        difficulty,
        refTechniqueId,
        defaultParams: body.defaultParams ?? null,
      };

      // If client provided an id, prefer safe update-if-exists behavior
      if (payload.id) {
        const existing = await db.activity.findFirst({ where: { id: payload.id } });
        if (existing) {
          if (existing.organizationId !== organizationId) {
            reply.code(403);
            return { success: false, error: 'Forbidden' };
          }
          const toUpdate = { ...payload };
          delete toUpdate.id; // cannot update primary key
          const updated = await db.activity.update({ where: { id: existing.id }, data: toUpdate });
          return { success: true, data: updated };
        }
        // else fallthrough to create with the provided id
      }

      const created = await db.activity.create({ data: payload });
      reply.code(201);
      return { success: true, data: created };
    } catch (error: any) {
      // Prisma error handling (common cases)
      const code = error?.code;
      if (code === 'P2002') { // Unique constraint failed
        reply.code(409);
        return { success: false, error: 'Unique constraint failed', detail: error.meta };
      }
      if (code === 'P2003') { // Foreign key constraint failed
        reply.code(422);
        return { success: false, error: 'Foreign key constraint failed', detail: error.meta };
      }
      if (code === 'P2025') { // Record not found (update/delete)
        reply.code(404);
        return { success: false, error: 'Referenced record not found', detail: error.meta };
      }

      // Generic fallback
      reply.code(500);
      return { success: false, error: 'Failed to create activity' };
    }
  });

  // GET /api/activities/:id - Get one
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const organizationId = await getOrganizationId();
      const item = await db.activity.findFirst({ where: { id, organizationId } });
      if (!item) { reply.code(404); return { success: false, error: 'Not found' }; }
      return { success: true, data: item };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to fetch activity' };
    }
  });

  // PUT /api/activities/:id - Update
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = request.body as any;
      const organizationId = await getOrganizationId();
      // Ensure ownership
      const exists = await db.activity.findFirst({ where: { id, organizationId } });
      if (!exists) { reply.code(404); return { success: false, error: 'Not found' }; }
      const updated = await db.activity.update({
        where: { id },
        data: {
          type: body.type ?? exists.type,
          title: body.title ?? exists.title,
          description: body.description ?? null,
          equipment: body.equipment ?? exists.equipment,
          safety: body.safety ?? null,
          adaptations: body.adaptations ?? exists.adaptations,
          difficulty: body.difficulty ?? exists.difficulty,
          refTechniqueId: body.refTechniqueId ?? null,
          defaultParams: body.defaultParams ?? exists.defaultParams,
        }
      });
      return { success: true, data: updated };
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to update activity' };
    }
  });

  // DELETE /api/activities/:id - Delete
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const organizationId = await getOrganizationId();
      const exists = await db.activity.findFirst({ where: { id, organizationId } });
      if (!exists) { reply.code(404); return { success: false, error: 'Not found' }; }
      await db.activity.delete({ where: { id } });
      reply.code(204);
      return null as any;
    } catch (error) {
      reply.code(500);
      return { success: false, error: 'Failed to delete activity' };
    }
  });
  
  // GET /api/activities/recent - Get recent activities (feed)
  fastify.get('/recent', async (_request, reply) => {
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

      const activities = recentAttendances.map((attendance: any) => ({
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

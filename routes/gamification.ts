import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';
import { authenticateToken, instructorOrAdmin, allRoles } from '@/middlewares/auth';

export default async function gamificationRoutes(app: FastifyInstance) {
  const db: any = prisma as any;

  // === Badges ===
  app.get('/badges', { preHandler: [authenticateToken, allRoles] }, async (_req, reply) => {
    try {
      const items = await db.badge.findMany({ orderBy: { name: 'asc' } });
      return { success: true, data: items };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to list badges' }; }
  });

  app.post('/badges', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const created = await db.badge.create({ data: {
        organizationId: b.organizationId,
        name: b.name,
        criteria: b.criteria ?? null,
        iconUrl: b.iconUrl ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to create badge' }; }
  });

  app.put('/badges/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const updated = await db.badge.update({ where: { id }, data: b });
      return { success: true, data: updated };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to update badge' }; }
  });

  app.delete('/badges/:id', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      await db.badge.delete({ where: { id } });
      return { success: true };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to delete badge' }; }
  });

  // Unlocks
  app.post('/badges/:id/unlock', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const b = (request.body as any) || {};
      const created = await db.badgeUnlock.create({ data: {
        badgeId: id,
        studentId: b.studentId,
        reason: b.reason ?? null,
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to unlock badge' }; }
  });

  // === Points ===
  app.get('/points', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      const where: any = {};
      if (q.studentId) where.studentId = q.studentId;
      const items = await db.pointsTransaction.findMany({ where, orderBy: { occurredAt: 'desc' } });
      return { success: true, data: items };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to list points' }; }
  });

  app.post('/points', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const created = await db.pointsTransaction.create({ data: {
        studentId: b.studentId,
        amount: b.amount,
        source: b.source,
        refType: b.refType ?? null,
        refId: b.refId ?? null,
        occurredAt: b.occurredAt ? new Date(b.occurredAt) : new Date(),
      }});
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to create points transaction' }; }
  });
}

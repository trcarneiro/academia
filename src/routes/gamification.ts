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
      const created = await db.badge.create({
        data: {
          organizationId: b.organizationId,
          name: b.name,
          criteria: b.criteria ?? null,
          iconUrl: b.iconUrl ?? null,
        }
      });
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
      const created = await db.badgeUnlock.create({
        data: {
          badgeId: id,
          studentId: b.studentId,
          reason: b.reason ?? null,
        }
      });
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
      const created = await db.pointsTransaction.create({
        data: {
          studentId: b.studentId,
          amount: b.amount,
          source: b.source,
          refType: b.refType ?? null,
          refId: b.refId ?? null,
          occurredAt: b.occurredAt ? new Date(b.occurredAt) : new Date(),
        }
      });
      reply.code(201); return { success: true, data: created };
    } catch (e) { reply.code(500); return { success: false, error: 'Failed to create points transaction' }; }
  });

  // === GAMIFICATION SERVICE ENDPOINTS ===

  const { GamificationService } = await import('@/services/gamificationService');

  // GET /api/gamification/profile/:studentId - Perfil completo de gamificação
  app.get('/profile/:studentId', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { studentId } = request.params as any;
      const profile = await GamificationService.getGamificationProfile(studentId);
      return { success: true, data: profile };
    } catch (e: any) {
      if (e.message === 'Student not found') {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }
      reply.code(500);
      return { success: false, error: 'Failed to get gamification profile' };
    }
  });

  // GET /api/gamification/stats/:studentId - Estatísticas do aluno
  app.get('/stats/:studentId', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { studentId } = request.params as any;
      const stats = await GamificationService.getStudentStats(studentId);
      return { success: true, data: stats };
    } catch (e: any) {
      if (e.message === 'Student not found') {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }
      reply.code(500);
      return { success: false, error: 'Failed to get gamification stats' };
    }
  });

  // GET /api/gamification/leaderboard - Ranking por XP
  app.get('/leaderboard', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const q = (request.query as any) || {};
      if (!q.organizationId) {
        reply.code(400);
        return { success: false, error: 'organizationId is required' };
      }
      const limit = parseInt(q.limit || '10', 10);
      const leaderboard = await GamificationService.getLeaderboard(q.organizationId, limit);
      return { success: true, data: leaderboard };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to get leaderboard' };
    }
  });

  // GET /api/gamification/achievements/:studentId - Conquistas do aluno
  app.get('/achievements/:studentId', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { studentId } = request.params as any;

      const student = await db.student.findUnique({
        where: { id: studentId },
        select: {
          achievements: { include: { achievement: true }, orderBy: { unlockedAt: 'desc' } },
          organizationId: true,
        },
      });

      if (!student) {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }

      const allAchievements = await db.achievement.findMany({
        where: { organizationId: student.organizationId },
        orderBy: { rarity: 'asc' },
      });

      const unlockedIds = new Set(student.achievements.map((a: any) => a.achievementId));

      const achievements = allAchievements.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        rarity: a.rarity,
        xpReward: a.xpReward,
        badgeImageUrl: a.badgeImageUrl,
        isHidden: a.isHidden && !unlockedIds.has(a.id),
        unlocked: unlockedIds.has(a.id),
        unlockedAt: student.achievements.find((sa: any) => sa.achievementId === a.id)?.unlockedAt,
      }));

      return {
        success: true,
        data: {
          unlocked: achievements.filter((a: any) => a.unlocked),
          locked: achievements.filter((a: any) => !a.unlocked && !a.isHidden),
          totalUnlocked: achievements.filter((a: any) => a.unlocked).length,
          totalAvailable: achievements.length,
        },
      };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to get achievements' };
    }
  });

  // POST /api/gamification/bonus - Conceder XP bônus (instrutor)
  app.post('/bonus', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};
      const grantedByUserId = (request as any).userId || 'system';

      if (!b.studentId || !b.amount || !b.reason) {
        reply.code(400);
        return { success: false, error: 'studentId, amount and reason are required' };
      }

      if (b.amount < 1 || b.amount > 500) {
        reply.code(400);
        return { success: false, error: 'Bonus amount must be between 1 and 500 XP' };
      }

      const result = await GamificationService.grantInstructorBonus(
        b.studentId,
        b.amount,
        b.reason,
        grantedByUserId
      );

      return { success: true, data: result, message: `${b.amount} XP awarded to student` };
    } catch (e: any) {
      if (e.message === 'Student not found') {
        reply.code(404);
        return { success: false, error: 'Student not found' };
      }
      reply.code(500);
      return { success: false, error: 'Failed to grant bonus XP' };
    }
  });

  // GET /api/gamification/xp-history/:studentId - Histórico de XP
  app.get('/xp-history/:studentId', { preHandler: [authenticateToken, allRoles] }, async (request, reply) => {
    try {
      const { studentId } = request.params as any;
      const q = (request.query as any) || {};
      const limit = parseInt(q.limit || '20', 10);
      const offset = parseInt(q.offset || '0', 10);

      const transactions = await db.pointsTransaction.findMany({
        where: { studentId },
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await db.pointsTransaction.count({ where: { studentId } });

      return {
        success: true,
        data: transactions.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          source: t.source,
          refType: t.refType,
          occurredAt: t.occurredAt,
        })),
        pagination: { total, limit, offset },
      };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to get XP history' };
    }
  });

  // POST /api/gamification/seed-achievements - Criar conquistas padrão (admin)
  app.post('/seed-achievements', { preHandler: [authenticateToken, instructorOrAdmin] }, async (request, reply) => {
    try {
      const b = (request.body as any) || {};

      if (!b.organizationId) {
        reply.code(400);
        return { success: false, error: 'organizationId is required' };
      }

      const existingCount = await db.achievement.count({ where: { organizationId: b.organizationId } });

      if (existingCount > 0) {
        reply.code(400);
        return { success: false, error: `Organization already has ${existingCount} achievements` };
      }

      await GamificationService.createDefaultAchievements(b.organizationId);

      const newCount = await db.achievement.count({ where: { organizationId: b.organizationId } });

      return { success: true, message: `Created ${newCount} default achievements` };
    } catch (e) {
      reply.code(500);
      return { success: false, error: 'Failed to seed achievements' };
    }
  });
}


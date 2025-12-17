import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DeployLogLevel, HealthCheckResult } from '@prisma/client';
import { ResponseHelper } from '@/utils/response';
import logger from '@/utils/logger';
import { deployOpsService } from '@/services/deployOpsService';
import { prisma } from '@/utils/database';

export default async function deploySessionsRoutes(fastify: FastifyInstance) {
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      if (!body?.artifactId || !body?.operator || !body?.targetEnvironment) {
        return ResponseHelper.badRequest(reply, 'artifactId, operator and targetEnvironment are required');
      }

      const session = await deployOpsService.createSession({
        artifactId: body.artifactId,
        operator: body.operator,
        targetEnvironment: body.targetEnvironment,
        notes: body.notes,
      });

      return ResponseHelper.success(reply, { sessionId: session.id, status: session.status });
    } catch (error) {
      logger.error({ error }, 'Failed to create deploy session');
      return ResponseHelper.error(reply, 'Failed to create deploy session', 500);
    }
  });

  fastify.post('/:sessionId/health-checks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;

      const sessionExists = await prisma.deploySession.findUnique({ where: { id: sessionId } });
      if (!sessionExists) {
        return ResponseHelper.notFound(reply, 'Deploy session not found');
      }

      if (!body?.endpoint || body.httpStatus === undefined || body.latencyMs === undefined || body.restartsObserved === undefined || !body?.result) {
        return ResponseHelper.badRequest(reply, 'endpoint, httpStatus, latencyMs, restartsObserved, result are required');
      }

      const resultEnum = HealthCheckResult[body.result as keyof typeof HealthCheckResult];
      if (!resultEnum) {
        return ResponseHelper.badRequest(reply, 'Invalid result');
      }

      const health = await deployOpsService.recordHealth(sessionId, {
        endpoint: body.endpoint,
        httpStatus: Number(body.httpStatus),
        latencyMs: Number(body.latencyMs),
        stabilityWindowMinutes: body.stabilityWindowMinutes ? Number(body.stabilityWindowMinutes) : undefined,
        restartsObserved: Number(body.restartsObserved),
        result: resultEnum,
        logExcerpt: body.logExcerpt,
      });

      return ResponseHelper.success(reply, { sessionId, result: health.result });
    } catch (error) {
      logger.error({ error }, 'Failed to record health check');
      return ResponseHelper.error(reply, 'Failed to record health check', 500);
    }
  });

  fastify.post('/:sessionId/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;

      const sessionExists = await prisma.deploySession.findUnique({ where: { id: sessionId } });
      if (!sessionExists) {
        return ResponseHelper.notFound(reply, 'Deploy session not found');
      }

      if (!body?.level || !body?.message) {
        return ResponseHelper.badRequest(reply, 'level and message are required');
      }

      const levelEnum = DeployLogLevel[body.level as keyof typeof DeployLogLevel];
      if (!levelEnum) {
        return ResponseHelper.badRequest(reply, 'Invalid level');
      }

      const log = await deployOpsService.appendLog(sessionId, {
        level: levelEnum,
        message: body.message,
        data: body.data,
      });

      return ResponseHelper.success(reply, { sessionId, logId: log.id });
    } catch (error) {
      logger.error({ error }, 'Failed to append deploy log');
      return ResponseHelper.error(reply, 'Failed to append deploy log', 500);
    }
  });

  fastify.post('/:sessionId/rollback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const body = request.body as any;

      const sessionExists = await prisma.deploySession.findUnique({ where: { id: sessionId } });
      if (!sessionExists) {
        return ResponseHelper.notFound(reply, 'Deploy session not found');
      }

      if (!body?.reason) {
        return ResponseHelper.badRequest(reply, 'reason is required');
      }

      const result = await deployOpsService.markRollback(sessionId, body.reason);
      return ResponseHelper.success(reply, { sessionId, status: result.session.status });
    } catch (error) {
      logger.error({ error }, 'Failed to mark rollback');
      return ResponseHelper.error(reply, 'Failed to mark rollback', 500);
    }
  });

  fastify.get('/:sessionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const session = await deployOpsService.getSession(sessionId);
      if (!session) {
        return ResponseHelper.notFound(reply, 'Deploy session not found');
      }
      return ResponseHelper.success(reply, { session });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch deploy session');
      return ResponseHelper.error(reply, 'Failed to fetch deploy session', 500);
    }
  });
}

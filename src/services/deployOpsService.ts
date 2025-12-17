import { prisma } from '@/utils/database';
import logger from '@/utils/logger';
import { DeployLogLevel, DeploySessionStatus, HealthCheckResult } from '@prisma/client';

export interface CreateSessionInput {
  artifactId: string;
  operator: string;
  targetEnvironment: string;
  notes?: string;
}

export interface HealthCheckInput {
  endpoint: string;
  httpStatus: number;
  latencyMs: number;
  stabilityWindowMinutes?: number;
  restartsObserved: number;
  result: HealthCheckResult;
  logExcerpt?: string;
}

export interface AppendLogInput {
  level: DeployLogLevel;
  message: string;
  data?: Record<string, any>;
}

export const deployOpsService = {
  async createSession(payload: CreateSessionInput) {
    logger.info({ payload }, 'Creating deploy session');
    return prisma.deploySession.create({
      data: {
        artifactId: payload.artifactId,
        operator: payload.operator,
        targetEnvironment: payload.targetEnvironment,
        notes: payload.notes,
        status: DeploySessionStatus.PENDING,
      },
    });
  },

  async recordHealth(sessionId: string, payload: HealthCheckInput) {
    logger.info({ sessionId, payload }, 'Recording deploy health check');
    const stabilityWindowMinutes = payload.stabilityWindowMinutes ?? 30;

    const health = await prisma.healthCheck.upsert({
      where: { sessionId },
      create: {
        sessionId,
        endpoint: payload.endpoint,
        httpStatus: payload.httpStatus,
        latencyMs: payload.latencyMs,
        stabilityWindowMinutes,
        restartsObserved: payload.restartsObserved,
        result: payload.result,
        logExcerpt: payload.logExcerpt,
      },
      update: {
        endpoint: payload.endpoint,
        httpStatus: payload.httpStatus,
        latencyMs: payload.latencyMs,
        stabilityWindowMinutes,
        restartsObserved: payload.restartsObserved,
        result: payload.result,
        logExcerpt: payload.logExcerpt,
        completedAt: new Date(),
      },
    });

    await prisma.deploySession.update({
      where: { id: sessionId },
      data: {
        status: payload.result === HealthCheckResult.PASS ? DeploySessionStatus.SUCCESS : DeploySessionStatus.FAILED,
        completedAt: new Date(),
      },
    });

    return health;
  },

  async appendLog(sessionId: string, payload: AppendLogInput) {
    logger.info({ sessionId, payload }, 'Appending deploy log');
    return prisma.deployLog.create({
      data: {
        sessionId,
        level: payload.level,
        message: payload.message,
        data: payload.data,
      },
    });
  },

  async markRollback(sessionId: string, reason: string) {
    logger.warn({ sessionId, reason }, 'Marking deploy rollback');
    const log = await prisma.deployLog.create({
      data: {
        sessionId,
        level: DeployLogLevel.WARN,
        message: `Rollback: ${reason}`,
      },
    });

    const session = await prisma.deploySession.update({
      where: { id: sessionId },
      data: {
        status: DeploySessionStatus.ROLLED_BACK,
        completedAt: new Date(),
      },
    });

    return { log, session };
  },

  async getSession(sessionId: string) {
    return prisma.deploySession.findUnique({
      where: { id: sessionId },
      include: {
        artifact: true,
        healthCheck: true,
        logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  },
};

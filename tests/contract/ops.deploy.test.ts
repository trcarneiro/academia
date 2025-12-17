/**
 * Contract/Integration Tests for Deploy Operations
 * Feature: 001-deploy-server-update
 * 
 * Tests POST /api/ops/deploy-sessions endpoints
 * Validates session creation, health checks, logs, and rollback
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../src/utils/database';

describe('Deploy Operations API', () => {
  let app: FastifyInstance;
  let testSessionId: string;
  let authToken: string;

  beforeAll(async () => {
    app = await build();
    await app.ready();

    // Create test user and get auth token
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'test123'
      }
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      authToken = data.token;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testSessionId) {
      await prisma.deploySession.deleteMany({
        where: { id: testSessionId }
      });
    }
    
    await app.close();
  });

  describe('POST /api/ops/deploy-sessions', () => {
    it('should create a new deploy session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.0-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.0.tar.gz',
          deployedBy: 'test-user',
          notes: 'Test deployment session'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.version).toBe('1.0.0-test');
      expect(data.data.environment).toBe('staging');
      expect(data.data.status).toBe('IN_PROGRESS');
      
      testSessionId = data.data.id;
    });

    it('should reject deploy session with missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.0-test'
          // Missing environment, artifactUrl, deployedBy
        }
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('should reject deploy session without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        payload: {
          version: '1.0.0-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact.tar.gz',
          deployedBy: 'test-user'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/ops/deploy-sessions/:id/health-checks', () => {
    it('should append health check to existing session', async () => {
      // First create a session
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.1-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.1.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      // Now append health check
      const response = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/health-checks`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          result: 'PASS',
          httpStatus: 200,
          responseTime: 145,
          details: { endpoint: '/api/health', method: 'GET' }
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.result).toBe('PASS');
      expect(data.data.httpStatus).toBe(200);
      expect(data.data.responseTime).toBe(145);

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should handle FAIL health check result', async () => {
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.2-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.2.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/health-checks`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          result: 'FAIL',
          httpStatus: 500,
          responseTime: 3000,
          errorMessage: 'Internal Server Error',
          details: { endpoint: '/api/health' }
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.result).toBe('FAIL');
      expect(data.data.httpStatus).toBe(500);
      expect(data.data.errorMessage).toBe('Internal Server Error');

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should reject health check for non-existent session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions/non-existent-id/health-checks',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          result: 'PASS',
          httpStatus: 200,
          responseTime: 100
        }
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/ops/deploy-sessions/:id/logs', () => {
    it('should append log entry to session', async () => {
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.3-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.3.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Deployment started successfully',
          source: 'activate-artifact.sh'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.level).toBe('INFO');
      expect(data.data.message).toBe('Deployment started successfully');
      expect(data.data.source).toBe('activate-artifact.sh');

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should handle different log levels', async () => {
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.4-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.4.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      
      for (const level of logLevels) {
        const response = await app.inject({
          method: 'POST',
          url: `/api/ops/deploy-sessions/${sessionId}/logs`,
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            timestamp: new Date().toISOString(),
            level,
            message: `Test ${level} message`,
            source: 'test-script'
          }
        });

        expect(response.statusCode).toBe(201);
        const data = JSON.parse(response.body);
        expect(data.data.level).toBe(level);
      }

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });
  });

  describe('POST /api/ops/deploy-sessions/:id/rollback', () => {
    it('should rollback a deploy session', async () => {
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.5-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.5.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/rollback`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          reason: 'Health checks failed',
          rolledBackBy: 'test-user'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ROLLED_BACK');
      expect(data.data.rollbackReason).toBe('Health checks failed');

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should reject rollback without reason', async () => {
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.6-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.6.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      const response = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/rollback`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          rolledBackBy: 'test-user'
          // Missing reason
        }
      });

      expect(response.statusCode).toBe(400);
      
      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });
  });

  describe('GET /api/ops/deploy-sessions/:id', () => {
    it('should retrieve deploy session with all related data', async () => {
      // Create session
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.7-test',
          environment: 'staging',
          artifactUrl: 'https://example.com/artifact-1.0.7.tar.gz',
          deployedBy: 'test-user'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      // Add health check
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/health-checks`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          result: 'PASS',
          httpStatus: 200,
          responseTime: 100
        }
      });

      // Add log entry
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Deployment completed',
          source: 'activate-artifact.sh'
        }
      });

      // Retrieve session
      const response = await app.inject({
        method: 'GET',
        url: `/api/ops/deploy-sessions/${sessionId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', sessionId);
      expect(data.data).toHaveProperty('version', '1.0.7-test');
      expect(data.data).toHaveProperty('healthChecks');
      expect(data.data.healthChecks).toHaveLength(1);
      expect(data.data).toHaveProperty('logs');
      expect(data.data.logs).toHaveLength(1);

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should return 404 for non-existent session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/ops/deploy-sessions/non-existent-id',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('Integration: Complete Deploy Flow', () => {
    it('should handle complete deploy lifecycle', async () => {
      // 1. Create session
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.8-test',
          environment: 'production',
          artifactUrl: 'https://example.com/artifact-1.0.8.tar.gz',
          deployedBy: 'deploy-bot',
          notes: 'Full integration test'
        }
      });

      expect(sessionResponse.statusCode).toBe(201);
      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      // 2. Add initial log
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Starting deployment',
          source: 'package-artifact.ps1'
        }
      });

      // 3. Add multiple health checks (simulating monitoring)
      for (let i = 0; i < 3; i++) {
        await app.inject({
          method: 'POST',
          url: `/api/ops/deploy-sessions/${sessionId}/health-checks`,
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            timestamp: new Date().toISOString(),
            result: 'PASS',
            httpStatus: 200,
            responseTime: 100 + i * 10
          }
        });
      }

      // 4. Add completion log
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Deployment completed successfully',
          source: 'monitor-health.sh'
        }
      });

      // 5. Verify final state
      const finalResponse = await app.inject({
        method: 'GET',
        url: `/api/ops/deploy-sessions/${sessionId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(finalResponse.statusCode).toBe(200);
      const finalData = JSON.parse(finalResponse.body);
      expect(finalData.data.healthChecks).toHaveLength(3);
      expect(finalData.data.logs).toHaveLength(2);
      expect(finalData.data.healthChecks.every((hc: any) => hc.result === 'PASS')).toBe(true);

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });

    it('should handle failed deploy with rollback', async () => {
      // 1. Create session
      const sessionResponse = await app.inject({
        method: 'POST',
        url: '/api/ops/deploy-sessions',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          version: '1.0.9-test',
          environment: 'production',
          artifactUrl: 'https://example.com/artifact-1.0.9.tar.gz',
          deployedBy: 'deploy-bot'
        }
      });

      const sessionData = JSON.parse(sessionResponse.body);
      const sessionId = sessionData.data.id;

      // 2. Add failing health check
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/health-checks`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          result: 'FAIL',
          httpStatus: 503,
          responseTime: 5000,
          errorMessage: 'Service Unavailable'
        }
      });

      // 3. Add error log
      await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/logs`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Health check failed after 5 seconds',
          source: 'monitor-health.sh'
        }
      });

      // 4. Rollback
      const rollbackResponse = await app.inject({
        method: 'POST',
        url: `/api/ops/deploy-sessions/${sessionId}/rollback`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          reason: 'Service failed health checks',
          rolledBackBy: 'deploy-bot'
        }
      });

      expect(rollbackResponse.statusCode).toBe(200);
      const rollbackData = JSON.parse(rollbackResponse.body);
      expect(rollbackData.data.status).toBe('ROLLED_BACK');

      // 5. Verify rollback was recorded
      const finalResponse = await app.inject({
        method: 'GET',
        url: `/api/ops/deploy-sessions/${sessionId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      const finalData = JSON.parse(finalResponse.body);
      expect(finalData.data.status).toBe('ROLLED_BACK');
      expect(finalData.data.rollbackReason).toBe('Service failed health checks');
      expect(finalData.data.healthChecks.some((hc: any) => hc.result === 'FAIL')).toBe(true);

      // Cleanup
      await prisma.deploySession.delete({ where: { id: sessionId } });
    });
  });
});

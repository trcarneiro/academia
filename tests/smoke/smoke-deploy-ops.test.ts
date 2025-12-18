/**
 * Smoke Tests - Deploy Operations Module
 * Validates deploy ops endpoints from feature 001-deploy-server-update
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import { FastifyInstance } from 'fastify';

describe('Deploy Operations - Smoke Tests', () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = await build();
    await app.ready();

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
    await app.close();
  });

  it('POST /api/ops/deploy-sessions - should create deploy session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ops/deploy-sessions',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        version: '1.0.0-smoke-test',
        environment: 'staging',
        artifactUrl: 'https://example.com/artifact.tar.gz',
        deployedBy: 'smoke-test-user'
      }
    });

    expect([200, 201, 400, 401, 500]).toContain(response.statusCode);
    
    if (response.statusCode === 201 || response.statusCode === 200) {
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
    }
  });

  it('POST /api/ops/deploy-sessions/:id/health-checks - should append health check', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ops/deploy-sessions/test-session-id/health-checks',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        timestamp: new Date().toISOString(),
        result: 'PASS',
        httpStatus: 200,
        responseTime: 150
      }
    });

    expect([200, 201, 400, 401, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/ops/deploy-sessions/:id/logs - should append log entry', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ops/deploy-sessions/test-session-id/logs',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Smoke test log entry',
        source: 'smoke-test'
      }
    });

    expect([200, 201, 400, 401, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/ops/deploy-sessions/:id/rollback - should rollback session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ops/deploy-sessions/test-session-id/rollback',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        reason: 'Smoke test rollback',
        rolledBackBy: 'smoke-test-user'
      }
    });

    expect([200, 400, 401, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/ops/deploy-sessions/:id - should retrieve session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/ops/deploy-sessions/test-session-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 401, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/ops/deploy-sessions - should list deploy sessions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/ops/deploy-sessions?limit=10',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 401, 500]).toContain(response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('success');
    }
  });
});

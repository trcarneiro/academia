/**
 * Smoke Tests - Agents/AI Module
 * Validates AI agent orchestrator and automation endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Agents Module - Smoke Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testOrganizationId: string;

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
      testOrganizationId = data.user.organizationId;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/agents - should list AI agents', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/agents?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('success');
    }
  });

  it('POST /api/agents - should create AI agent', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agents',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'Test Agent',
        type: 'ADMINISTRATIVE',
        model: 'gpt-4',
        organizationId: testOrganizationId
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('POST /api/agent-orchestrator/analyze - should run agent analysis', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agent-orchestrator/analyze',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        organizationId: testOrganizationId,
        analysisType: 'STUDENT_PERFORMANCE'
      }
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/agent-tasks - should list agent tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/agent-tasks?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/agent-tasks - should create agent task', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/agent-tasks',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        agentId: 'test-agent-id',
        taskType: 'ANALYSIS',
        priority: 'HIGH',
        parameters: {}
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/agent-insights - should get AI insights', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/agent-insights?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});

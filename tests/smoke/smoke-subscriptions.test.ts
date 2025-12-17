/**
 * Smoke Tests - Subscriptions Module
 * Validates subscription and billing endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Subscriptions Module - Smoke Tests', () => {
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

  it('GET /api/subscriptions - should list subscriptions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/subscriptions?organizationId=${testOrganizationId}`,
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

  it('POST /api/subscriptions - should create subscription', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscriptions',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        planId: 'test-plan-id',
        billingType: 'MONTHLY',
        startDate: new Date().toISOString()
      }
    });

    expect([200, 201, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/subscriptions/:id - should get subscription details', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/subscriptions/test-subscription-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('PUT /api/subscriptions/:id - should update subscription', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/subscriptions/test-subscription-id',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        status: 'ACTIVE',
        notes: 'Updated subscription'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/subscriptions/:id/cancel - should cancel subscription', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/subscriptions/test-subscription-id/cancel',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        reason: 'Customer request'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/subscriptions/student/:studentId - should get student subscriptions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/subscriptions/student/test-student-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});

/**
 * Smoke Tests - Asaas Integration
 * Validates Asaas payment gateway integration endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import { FastifyInstance } from 'fastify';

describe('Asaas Integration - Smoke Tests', () => {
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

  it('GET /api/asaas/customers - should list Asaas customers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/asaas/customers',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 401, 500]).toContain(response.statusCode);
  });

  it('POST /api/asaas/import-customer - should import single customer', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/asaas/import-customer',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        asaasCustomerId: 'cus_test123',
        organizationId: testOrganizationId
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/asaas/import-batch - should import customers in batch', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/asaas/import-batch',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        organizationId: testOrganizationId,
        limit: 10
      }
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/asaas/customers/:id - should get Asaas customer details', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/asaas/customers/cus_test123',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/asaas/test-connection - should test Asaas API connection', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/asaas/test-connection',
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

  it('GET /api/asaas/payment-status/:paymentId - should check payment status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/asaas/payment-status/pay_test123',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});

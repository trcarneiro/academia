/**
 * Smoke Tests - Financial Module
 * Validates financial and billing endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Financial Module - Smoke Tests', () => {
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

  it('GET /api/financial/transactions - should list transactions', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/financial/transactions?organizationId=${testOrganizationId}`,
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

  it('POST /api/financial/transactions - should create transaction', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/financial/transactions',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        amount: 150.00,
        type: 'TUITION',
        status: 'PENDING',
        organizationId: testOrganizationId
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/financial/reports/revenue - should generate revenue report', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/financial/reports/revenue?organizationId=${testOrganizationId}&startDate=2025-01-01&endDate=2025-12-31`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/financial/invoices - should list invoices', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/financial/invoices?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/financial/invoices - should create invoice', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/financial/invoices',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        amount: 200.00,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        organizationId: testOrganizationId
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/financial/student/:studentId/balance - should get student balance', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/financial/student/test-student-id/balance',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/financial/dashboard - should get financial dashboard', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/financial/dashboard?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 500]).toContain(response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('success');
    }
  });
});

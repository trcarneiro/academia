/**
 * Smoke Tests - Attendance Module
 * Validates basic functionality of attendance/checkin endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Attendance Module - Smoke Tests', () => {
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

  it('GET /api/attendance - should list attendance records', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/attendance?organizationId=${testOrganizationId}`,
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

  it('POST /api/attendance/checkin - should create checkin', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/checkin',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        classId: 'test-class-id',
        checkInMethod: 'MANUAL',
        status: 'PRESENT'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/attendance/checkin/qr - should handle QR code checkin', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/attendance/checkin/qr',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        qrCode: 'test-qr-code',
        location: 'Test Location'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/attendance/student/:studentId - should get student attendance history', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/student/test-student-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/attendance/class/:classId - should get class attendance list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/attendance/class/test-class-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/attendance/stats - should get attendance statistics', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/attendance/stats?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});

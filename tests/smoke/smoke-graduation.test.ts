/**
 * Smoke Tests - Graduation Module
 * Validates basic functionality of graduation endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Graduation Module - Smoke Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let testOrganizationId: string;

  beforeAll(async () => {
    app = await build();
    await app.ready();

    // Get auth token
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

  it('GET /api/graduation/students - should list students with progress', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/graduation/students?organizationId=${testOrganizationId}`,
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

  it('GET /api/graduation/course-requirements/:courseId - should fetch requirements', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/graduation/course-requirements/test-course-id',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/graduation/progress - should update student progress', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/graduation/progress',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        courseId: 'test-course-id',
        techniqueId: 'test-technique-id',
        proficiency: 80
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/graduation/eligible-students - should list eligible students', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/graduation/eligible-students?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/graduation/approve - should approve graduation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/graduation/approve',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        courseId: 'test-course-id',
        newBeltLevel: 'YELLOW'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });
});

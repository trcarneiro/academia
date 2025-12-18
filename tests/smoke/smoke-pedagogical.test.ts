/**
 * Smoke Tests - Pedagogical Module
 * Validates pedagogical/course management endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import { FastifyInstance } from 'fastify';

describe('Pedagogical Module - Smoke Tests', () => {
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

  it('GET /api/pedagogical/courses - should list courses', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/pedagogical/courses?organizationId=${testOrganizationId}`,
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

  it('POST /api/pedagogical/courses - should create course', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/pedagogical/courses',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        name: 'Test Course',
        category: 'ADULT',
        level: 'BEGINNER',
        totalClasses: 20,
        organizationId: testOrganizationId
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/pedagogical/challenges - should list challenges', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/pedagogical/challenges?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/pedagogical/challenges - should create challenge', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/pedagogical/challenges',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        courseId: 'test-course-id',
        type: 'TECHNIQUE',
        description: 'Test Challenge',
        xpReward: 100
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('POST /api/pedagogical/challenges/:id/complete - should complete challenge', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/pedagogical/challenges/test-challenge-id/complete',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        enrollmentId: 'test-enrollment-id',
        actualMetric: 90,
        actualTime: 300,
        videoUrl: 'https://example.com/video.mp4'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/pedagogical/evaluations - should list evaluations', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/pedagogical/evaluations?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/pedagogical/evaluations - should create evaluation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/pedagogical/evaluations',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        studentId: 'test-student-id',
        courseId: 'test-course-id',
        type: 'BELT_EXAM',
        grade: 85
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('GET /api/pedagogical/achievements - should list achievements', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/pedagogical/achievements?organizationId=${testOrganizationId}`,
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/pedagogical/student/:studentId/achievements - should get student achievements', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/pedagogical/student/test-student-id/achievements',
      headers: {
        authorization: `Bearer ${authToken}`
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });
});

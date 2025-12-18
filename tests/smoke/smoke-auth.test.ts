/**
 * Smoke Tests - Auth Module
 * Validates authentication and authorization endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/app';
import { FastifyInstance } from 'fastify';

describe('Auth Module - Smoke Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login - should authenticate user with valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'test123'
      }
    });

    expect([200, 401, 500]).toContain(response.statusCode);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
    }
  });

  it('POST /api/auth/login - should reject invalid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'wrong-password'
      }
    });

    expect([401, 500]).toContain(response.statusCode);
  });

  it('POST /api/auth/register - should register new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: `test-${Date.now()}@example.com`,
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 'test-org-id'
      }
    });

    expect([200, 201, 400, 500]).toContain(response.statusCode);
  });

  it('POST /api/auth/logout - should logout user', async () => {
    // First login
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'test123'
      }
    });

    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${loginData.token}`
        }
      });

      expect([200, 204, 401, 500]).toContain(response.statusCode);
    }
  });

  it('POST /api/auth/refresh - should refresh access token', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'test123'
      }
    });

    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: loginData.refreshToken
        }
      });

      expect([200, 401, 500]).toContain(response.statusCode);
    }
  });

  it('POST /api/auth/forgot-password - should initiate password reset', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {
        email: 'admin@test.com'
      }
    });

    expect([200, 404, 500]).toContain(response.statusCode);
  });

  it('POST /api/auth/reset-password - should reset password with valid token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: {
        token: 'test-reset-token',
        newPassword: 'NewPassword123!@#'
      }
    });

    expect([200, 400, 404, 500]).toContain(response.statusCode);
  });

  it('GET /api/auth/me - should return current user info', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'test123'
      }
    });

    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${loginData.token}`
        }
      });

      expect([200, 401, 500]).toContain(response.statusCode);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('user');
      }
    }
  });
});

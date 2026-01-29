
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/app';

describe('Auth and Course Visibility Flow', () => {
    let app: any;
    let request: any;
    let token: string;
    let organizationId = 'b03d6cc5-7d58-437e-87a7-834226931d2a'; // Academia Demo

    beforeAll(async () => {
        app = await buildApp();
        await app.ready();
        request = supertest(app.server);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should login and return a token', async () => {
        // Mock AuthService.login to bypass real Supabase call
        const { AuthService } = await import('../../src/services/authService');
        const loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({
            id: 'mock-user-id',
            email: 'trcampos@gmail.com',
            role: 'ADMIN',
            organizationId: organizationId,
            profile: { id: 'mock-profile-id', name: 'Mock Instructor' } as any,
            token: 'mock-jwt-token'
        });

        const response = await request.post('/api/auth/login')
            .send({
                email: 'trcampos@gmail.com',
                password: 'password123'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBe('mock-jwt-token');

        token = response.body.data.token;
        loginSpy.mockRestore();
    });

    it('should fetch courses WITH auth headers', async () => {
        const response = await request.get('/api/courses')
            .set('Authorization', `Bearer ${token}`)
            .set('x-organization-id', organizationId);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Expect at least one course (the one we debugged)
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);

        const course = response.body.data.find((c: any) => c.id === 'krav-maga-faixa-branca-2025');
        expect(course).toBeDefined();
    });

    it('should fail or return empty/error WITHOUT headers (Strict Mode)', async () => {
        const response = await request.get('/api/courses'); // No headers

        // Depending on how strict we made it. Middleware might return 400 or just empty tenant.
        // Since we removed fallback, it likely returns 400 "Organization context required" 
        // OR if tenant middleware passes but context is empty, controller depends on it.

        // In strict mode (middleware/tenant.ts), we log debug but don't error immediately?
        // But tenantHelpers.ts 'requireOrganizationId' throws 400 if not found.

        expect([400, 403]).toContain(response.status);
    });
});

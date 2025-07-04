import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/services/authService';
import { UserRole } from '@/types';
import { prisma } from '../setup';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  describe('register', () => {
    it('should successfully register a new student', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Test',
        lastName: 'User',
        phone: '+55 11 99999-9999',
      };

      const result = await AuthService.register(userData);

      expect(result).toMatchObject({
        email: userData.email,
        role: userData.role,
      });
      expect(result.id).toBeDefined();
      expect(result.profile).toBeDefined();
    });

    it('should hash the password correctly', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Test',
        lastName: 'User',
      };

      await AuthService.register(userData);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user!.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user!.password)).toBe(true);
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Test',
        lastName: 'User',
      };

      await AuthService.register(userData);

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Usuário já existe com este email'
      );
    });

    it('should create instructor profile for instructor role', async () => {
      const userData = {
        email: 'instructor@example.com',
        password: 'password123',
        role: UserRole.INSTRUCTOR,
        firstName: 'Instructor',
        lastName: 'User',
      };

      const result = await AuthService.register(userData);

      expect(result.role).toBe(UserRole.INSTRUCTOR);
      expect(result.profile).toBeDefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await AuthService.register({
        email: 'login@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Login',
        lastName: 'User',
      });
    });

    it('should successfully login with correct credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'password123',
      };

      const result = await AuthService.login(loginData);

      expect(result).toMatchObject({
        email: loginData.email,
        role: UserRole.STUDENT,
      });
      expect(result.id).toBeDefined();
      expect(result.profile).toBeDefined();
    });

    it('should throw error with incorrect email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      await expect(AuthService.login(loginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error with incorrect password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      await expect(AuthService.login(loginData)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw error for inactive user', async () => {
      // Create an inactive student
      const user = await AuthService.register({
        email: 'inactive@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Inactive',
        lastName: 'User',
      });

      // Deactivate the student
      await prisma.student.update({
        where: { id: user.profile!.id },
        data: { isActive: false },
      });

      const loginData = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      await expect(AuthService.login(loginData)).rejects.toThrow(
        'Conta desativada. Entre em contato com o administrador.'
      );
    });
  });

  describe('findUserById', () => {
    it('should find user by ID', async () => {
      const userData = await AuthService.register({
        email: 'finduser@example.com',
        password: 'password123',
        role: UserRole.STUDENT,
        firstName: 'Find',
        lastName: 'User',
      });

      const result = await AuthService.findUserById(userData.id);

      expect(result).toMatchObject({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
    });

    it('should throw error if user not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(AuthService.findUserById(nonExistentId)).rejects.toThrow(
        'Usuário não encontrado'
      );
    });
  });

  describe('createJWTPayload', () => {
    it('should create correct JWT payload', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        role: UserRole.STUDENT,
      };

      const payload = AuthService.createJWTPayload(user);

      expect(payload).toEqual({
        sub: user.id,
        email: user.email,
        role: user.role,
      });
    });
  });
});
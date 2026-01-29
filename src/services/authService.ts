// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { UserRole, JWTPayload } from '@/types';
import { RegisterInput, LoginInput } from '@/schemas/auth';
import { supabase, serverSupabase } from '@/utils/supabase';

export class AuthService {
  static async register(data: RegisterInput) {
    const { email, password, role, firstName, lastName, phone, emergencyContact, birthDate, medicalConditions, organizationId } = data;

    const supabaseData = await supabase.auth.signUp({
      email,
      password,
      options: { data: { orgId: organizationId, role } }
    });
    if (!supabaseData.data.user) {
      throw new Error('Falha no registro Supabase');
    }

    const supabaseUserId = supabaseData.data.user.id;

    const baseData = {
      id: supabaseUserId,
      email,
      role,
      password, // Include password
      organizationId,
    };

    let userData: any = { ...baseData };

    if (role === 'STUDENT') {
      userData.student = {
        create: {
          id: uuidv4(),
          firstName,
          lastName,
          phone,
          emergencyContact,
          birthDate: birthDate ? new Date(birthDate) : null,
          medicalConditions,
        },
      };
    } else if (role === 'INSTRUCTOR') {
      userData.instructor = {
        create: {
          id: uuidv4(),
          firstName,
          lastName,
          phone,
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        student: true,
        instructor: true,
      },
    });

    const token = supabaseData.data.session?.access_token || null;

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User registered with Supabase sync');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId,
      profile: user.student || user.instructor,
      token,
      needsConfirmation: !token,
    };
  }

  static async login(data: LoginInput) {
    const { email, password } = data;

    const supabaseData = await supabase.auth.signInWithPassword({ email, password });
    if (!supabaseData.data.user) {
      throw new Error('Credenciais invalidas');
    }

    let user = await prisma.user.findUnique({
      where: { id: supabaseData.data.user.id },
      include: { student: true, instructor: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email },
        include: { student: true, instructor: true },
      });
    }

    if (!user) {
      const DEFAULT_ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
      user = await prisma.user.create({
        data: {
          id: supabaseData.data.user.id,
          email,
          password, // Include password
          role: 'ADMIN',
          organizationId: DEFAULT_ORG_ID,
        },
        include: { student: true, instructor: true },
      });
      logger.info({ email, userId: user.id }, 'Created new user from Supabase login');
    }

    const profile = user.student || user.instructor;
    if (profile && !profile.isActive) {
      throw new Error('Conta desativada.');
    }

    const token = supabaseData.data.session.access_token;

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User logged in');
    const result = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profile,
      token,
    };
    console.log('DEBUG: AuthService.login returning:', JSON.stringify(result, null, 2));
    return result;
  }

  static async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { student: true, instructor: true },
    });

    if (!user) {
      throw new Error('Usuario nao encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profile: user.student || user.instructor,
    };
  }

  static async findUserByEmail(email: string) {

    const user = await prisma.user.findFirst({
      where: { email },
      include: { student: true, instructor: true },
    });

    if (!user) {
      throw new Error('Usuario nao encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profile: user.student || user.instructor,
    };
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const { data, error } = await serverSupabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error('Falha ao atualizar senha');

    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });

    logger.info({ userId }, 'Password updated');
  }

  static createJWTPayload(user: { id: string; email: string; role: UserRole; organizationId: string }): JWTPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}

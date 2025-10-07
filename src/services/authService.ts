import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { UserRole, JWTPayload } from '@/types';
import { RegisterInput, LoginInput } from '@/schemas/auth';
import { supabase, serverSupabase } from '@/utils/supabase';

export class AuthService {
  static async register(data: RegisterInput) {
    const { email, password, role, firstName, lastName, phone, emergencyContact, birthDate, medicalConditions, organizationId } = data;

    // Use Supabase for auth
    const supabaseData = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: { orgId: organizationId, role } } 
    });
    if (!supabaseData.data.user) {
      throw new Error('Falha no registro Supabase');
    }

    const supabaseUserId = supabaseData.data.user.id;

    // Sync profile to Prisma (student/instructor based on role)
    const baseData = {
      id: supabaseUserId, // Use Supabase ID
      email,
      role,
      organizationId,
    };

    let userData: any = { ...baseData };

    if (role === 'STUDENT') {
      userData.student = {
        create: {
          id: uuidv4(), // Local ID for student
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
          id: uuidv4(), // Local ID for instructor
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

    // Token from session if available (for auto-confirm dev mode)
    const token = supabaseData.data.session?.access_token || null;

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User registered with Supabase sync');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId,
      profile: user.student || user.instructor,
      token,
      needsConfirmation: !token, // If no token, email confirmation needed
    };
  }

  static async login(data: LoginInput) {
    const { email, password } = data;

    // Use Supabase for auth
    const supabaseData = await supabase.auth.signInWithPassword({ email, password });
    if (!supabaseData.data.user) {
      throw new Error('Credenciais inválidas');
    }

    // Fetch Prisma profile
    const user = await prisma.user.findUnique({
      where: { id: supabaseData.data.user.id },
      include: {
        student: true,
        instructor: true,
      },
    });

    if (!user) {
      throw new Error('Perfil não encontrado no sistema local');
    }

    // Check if profile is active
    const profile = user.student || user.instructor;
    if (profile && !profile.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }

    const token = supabaseData.data.session.access_token;

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User logged in with Supabase');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profile,
      token,
    };
  }

  static async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        instructor: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
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
    // Use serverSupabase admin to update password (backend)
    const { data, error } = await serverSupabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error('Falha ao atualizar senha no Supabase');

    // Update local if needed (e.g., other fields)
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }, // Example update
    });

    logger.info({ userId }, 'Password updated with Supabase');
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
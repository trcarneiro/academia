import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/utils/database';
import { logger } from '@/utils/logger';
import { UserRole, JWTPayload } from '@/types';
import { RegisterInput, LoginInput } from '@/schemas/auth';

export class AuthService {
  static async register(data: RegisterInput) {
    const { email, password, role, firstName, lastName, phone, emergencyContact, birthDate, medicalConditions } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with related student/instructor record
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: hashedPassword,
        role,
        ...(role === UserRole.STUDENT && {
          student: {
            create: {
              id: uuidv4(),
              firstName,
              lastName,
              phone,
              emergencyContact,
              birthDate: birthDate ? new Date(birthDate) : null,
              medicalConditions,
            },
          },
        }),
        ...(role === UserRole.INSTRUCTOR && {
          instructor: {
            create: {
              id: uuidv4(),
              firstName,
              lastName,
              phone,
            },
          },
        }),
      },
      include: {
        student: true,
        instructor: true,
      },
    });

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User registered successfully');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.student || user.instructor,
    };
  }

  static async login(data: LoginInput) {
    const { email, password } = data;

    // Find user with profile data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        instructor: true,
      },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Check if profile is active
    const profile = user.student || user.instructor;
    if (profile && !profile.isActive) {
      throw new Error('Conta desativada. Entre em contato com o administrador.');
    }

    logger.info({ userId: user.id, email: user.email, role: user.role }, 'User logged in successfully');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile,
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
      profile: user.student || user.instructor,
    };
  }

  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    logger.info({ userId }, 'Password updated successfully');
  }

  static createJWTPayload(user: { id: string; email: string; role: UserRole }): JWTPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
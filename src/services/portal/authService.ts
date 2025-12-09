/**
 * Portal Auth Service
 * Gerencia autenticação do Portal do Aluno
 * 
 * Features:
 * - Cadastro de novo aluno
 * - Login com email/senha
 * - Magic Link via WhatsApp (quando configurado)
 * - JWT com refresh
 */

import { prisma } from '@/utils/database';
import { appConfig } from '@/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';

// Configurações
const JWT_SECRET = appConfig.jwt.secret;
const JWT_EXPIRES_IN = '7d';
const MAGIC_CODE_EXPIRES_MINUTES = 5;
const SALT_ROUNDS = 10;

// Tipos
export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password?: string;
  birthDate?: string;
  organizationId: string;
  planId?: string;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password?: string;
  magicCode?: string;
  organizationId: string;
}

export interface JwtPayload {
  sub: string;         // studentId
  email: string;
  name: string;
  orgId: string;       // organizationId
  type: 'portal';      // Diferencia de admin
  iat: number;
  exp: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  student?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
  error?: string;
}

/**
 * Registra um novo aluno no sistema
 */
export async function registerStudent(input: RegisterInput): Promise<AuthResult> {
  const { name, email, phone, cpf, password, birthDate, organizationId, planId } = input;

  try {
    // 1. Validar se CPF já existe na organização
    const existingByCpf = await prisma.user.findFirst({
      where: {
        cpf,
        organizationId,
      },
    });

    if (existingByCpf) {
      return {
        success: false,
        error: 'CPF já cadastrado nesta academia',
      };
    }

    // 2. Validar se email já existe na organização
    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: {
          email,
          organizationId,
        },
      });

      if (existingByEmail) {
        return {
          success: false,
          error: 'Email já cadastrado nesta academia',
        };
      }
    }

    // 3. Gerar hash da senha (se fornecida)
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // 4. Separar nome em firstName e lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // 5. Criar User e Student em transação
    const result = await prisma.$transaction(async (tx) => {
      // Criar User
      const user = await tx.user.create({
        data: {
          organizationId,
          email,
          password: passwordHash || '', // Vazio se usar magic link
          role: 'STUDENT',
          firstName,
          lastName,
          phone,
          cpf,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          isActive: true,
          emailVerified: false,
        },
      });

      // Criar Student
      const student = await tx.student.create({
        data: {
          organizationId,
          userId: user.id,
          category: 'ADULT',
          isActive: true,
          enrollmentDate: new Date(),
        },
      });

      return { user, student };
    });

    // 6. Gerar JWT
    const token = generateToken({
      studentId: result.student.id,
      email: email || '',
      name,
      organizationId,
    });

    // 7. Criar sessão
    await createSession({
      studentId: result.student.id,
      token,
      userAgent: undefined,
      ipAddress: undefined,
    });

    // 8. Criar notificação de boas-vindas
    await prisma.studentNotification.create({
      data: {
        studentId: result.student.id,
        type: 'WELCOME',
        title: 'Bem-vindo à academia! 🥋',
        message: `Olá ${firstName}! Seu cadastro foi realizado com sucesso. Estamos felizes em ter você conosco!`,
        priority: 'NORMAL',
      },
    });

    return {
      success: true,
      token,
      student: {
        id: result.student.id,
        name,
        email: email || '',
        phone,
      },
    };
  } catch (error) {
    console.error('Erro ao registrar aluno:', error);
    return {
      success: false,
      error: 'Erro interno ao criar cadastro',
    };
  }
}

/**
 * Login com email e senha
 */
export async function loginWithPassword(input: LoginInput): Promise<AuthResult> {
  const { email, password, organizationId } = input;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email e senha são obrigatórios',
    };
  }

  try {
    // 1. Buscar usuário
    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId,
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        student: true,
      },
    });

    if (!user || !user.student) {
      return {
        success: false,
        error: 'Email ou senha inválidos',
      };
    }

    // 2. Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return {
        success: false,
        error: 'Email ou senha inválidos',
      };
    }

    // 3. Gerar token
    const token = generateToken({
      studentId: user.student.id,
      email: user.email || '',
      name: `${user.firstName} ${user.lastName}`.trim(),
      organizationId,
    });

    // 4. Criar sessão
    await createSession({
      studentId: user.student.id,
      token,
    });

    // 5. Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      token,
      student: {
        id: user.student.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || '',
        phone: user.phone || '',
      },
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: 'Erro interno no login',
    };
  }
}

/**
 * Inicia processo de Magic Link
 * Gera código de 6 dígitos e salva na sessão
 */
export async function requestMagicLink(phone: string, organizationId: string): Promise<{
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    // 1. Buscar aluno por telefone
    const user = await prisma.user.findFirst({
      where: {
        phone,
        organizationId,
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        student: true,
      },
    });

    if (!user || !user.student) {
      return {
        success: false,
        error: 'Telefone não encontrado',
      };
    }

    // 2. Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + MAGIC_CODE_EXPIRES_MINUTES * 60 * 1000);

    // 3. Criar sessão pendente com código
    const token = randomBytes(32).toString('hex');
    
    await prisma.studentSession.create({
      data: {
        studentId: user.student.id,
        token,
        magicCode: code,
        codeExpires: expiresAt,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        isActive: false, // Inativa até validar código
      },
    });

    return {
      success: true,
      code,
      expiresAt,
    };
  } catch (error) {
    console.error('Erro ao gerar magic link:', error);
    return {
      success: false,
      error: 'Erro ao gerar código',
    };
  }
}

/**
 * Valida código do Magic Link e retorna token
 */
export async function validateMagicCode(phone: string, code: string, organizationId: string): Promise<AuthResult> {
  try {
    // 1. Buscar aluno por telefone
    const user = await prisma.user.findFirst({
      where: {
        phone,
        organizationId,
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        student: true,
      },
    });

    if (!user || !user.student) {
      return {
        success: false,
        error: 'Telefone não encontrado',
      };
    }

    // 2. Buscar sessão com código válido
    const session = await prisma.studentSession.findFirst({
      where: {
        studentId: user.student.id,
        magicCode: code,
        codeExpires: { gt: new Date() },
        isActive: false,
      },
    });

    if (!session) {
      return {
        success: false,
        error: 'Código inválido ou expirado',
      };
    }

    // 3. Ativar sessão
    await prisma.studentSession.update({
      where: { id: session.id },
      data: {
        isActive: true,
        magicCode: null,
        codeExpires: null,
      },
    });

    // 4. Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      token: session.token,
      student: {
        id: user.student.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || '',
        phone: user.phone || '',
      },
    };
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return {
      success: false,
      error: 'Erro ao validar código',
    };
  }
}

/**
 * Valida um token JWT
 */
export async function validateToken(token: string): Promise<{
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Verificar se tipo é portal
    if (payload.type !== 'portal') {
      return {
        valid: false,
        error: 'Token inválido para portal',
      };
    }

    // Verificar se sessão ainda está ativa
    const session = await prisma.studentSession.findFirst({
      where: {
        token,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return {
        valid: false,
        error: 'Sessão expirada ou inválida',
      };
    }

    // Atualizar último uso
    await prisma.studentSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Token inválido',
    };
  }
}

/**
 * Revoga uma sessão (logout)
 */
export async function revokeSession(token: string): Promise<boolean> {
  try {
    await prisma.studentSession.updateMany({
      where: { token },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Erro ao revogar sessão:', error);
    return false;
  }
}

/**
 * Revoga todas as sessões de um aluno
 */
export async function revokeAllSessions(studentId: string): Promise<boolean> {
  try {
    await prisma.studentSession.updateMany({
      where: { studentId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error('Erro ao revogar sessões:', error);
    return false;
  }
}

// ============================================================================
// Funções auxiliares
// ============================================================================

function generateToken(data: {
  studentId: string;
  email: string;
  name: string;
  organizationId: string;
}): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: data.studentId,
    email: data.email,
    name: data.name,
    orgId: data.organizationId,
    type: 'portal',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function createSession(data: {
  studentId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  await prisma.studentSession.create({
    data: {
      studentId: data.studentId,
      token: data.token,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      isActive: true,
    },
  });
}

/**
 * Gera um QR Code para acesso ao Totem
 * O QR Code contém um token JWT de curta duração (5 min)
 */
export async function generateAccessQrCode(studentId: string, organizationId: string): Promise<string> {
  // 1. Gerar token de acesso curto
  const accessToken = jwt.sign(
    { 
      sub: studentId,
      orgId: organizationId,
      type: 'access_token',
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '5m' }
  );

  // 2. Gerar QR Code
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(accessToken, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Falha ao gerar QR Code de acesso');
  }
}

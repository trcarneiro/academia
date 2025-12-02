/**
 * Script para aplicar migração do Portal do Aluno via Prisma
 * Cria tabelas: student_sessions, student_notifications
 * 
 * Uso: node scripts/apply-portal-migration-v2.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Aplicando migração Portal do Aluno...\n');

  try {
    // 1. Criar enum StudentNotificationType
    console.log('📝 Criando enum StudentNotificationType...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "StudentNotificationType" AS ENUM (
          'PAYMENT_DUE',
          'PAYMENT_OVERDUE', 
          'PAYMENT_CONFIRMED',
          'CLASS_REMINDER',
          'CLASS_CANCELLED',
          'CLASS_RESCHEDULED',
          'ACHIEVEMENT_UNLOCKED',
          'LEVEL_UP',
          'BELT_PROMOTION',
          'SYSTEM',
          'WELCOME',
          'REMINDER'
        )
      `);
      console.log('   ✅ Enum StudentNotificationType criado');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  Enum já existe, pulando...');
      } else {
        throw e;
      }
    }

    // 2. Criar enum NotificationPriority
    console.log('📝 Criando enum NotificationPriority...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "NotificationPriority" AS ENUM (
          'LOW',
          'NORMAL',
          'HIGH',
          'URGENT'
        )
      `);
      console.log('   ✅ Enum NotificationPriority criado');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  Enum já existe, pulando...');
      } else {
        throw e;
      }
    }

    // 3. Criar tabela student_sessions
    console.log('📝 Criando tabela student_sessions...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "student_sessions" (
          "id" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "magicCode" TEXT,
          "codeExpires" TIMESTAMP(3),
          "userAgent" TEXT,
          "ipAddress" TEXT,
          "deviceType" TEXT,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "revokedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "student_sessions_pkey" PRIMARY KEY ("id")
        )
      `);
      console.log('   ✅ Tabela student_sessions criada');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  Tabela já existe, pulando...');
      } else {
        throw e;
      }
    }

    // 4. Criar tabela student_notifications
    console.log('📝 Criando tabela student_notifications...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "student_notifications" (
          "id" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "type" "StudentNotificationType" NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "link" TEXT,
          "icon" TEXT,
          "read" BOOLEAN NOT NULL DEFAULT false,
          "readAt" TIMESTAMP(3),
          "dismissed" BOOLEAN NOT NULL DEFAULT false,
          "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
          "metadata" JSONB,
          "expiresAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "student_notifications_pkey" PRIMARY KEY ("id")
        )
      `);
      console.log('   ✅ Tabela student_notifications criada');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  Tabela já existe, pulando...');
      } else {
        throw e;
      }
    }

    // 5. Criar índices para student_sessions
    console.log('📝 Criando índices para student_sessions...');
    const sessionIndexes = [
      { name: 'student_sessions_token_key', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "student_sessions_token_key" ON "student_sessions"("token")` },
      { name: 'student_sessions_studentId_idx', sql: `CREATE INDEX IF NOT EXISTS "student_sessions_studentId_idx" ON "student_sessions"("studentId")` },
      { name: 'student_sessions_magicCode_idx', sql: `CREATE INDEX IF NOT EXISTS "student_sessions_magicCode_idx" ON "student_sessions"("magicCode")` },
      { name: 'student_sessions_expiresAt_idx', sql: `CREATE INDEX IF NOT EXISTS "student_sessions_expiresAt_idx" ON "student_sessions"("expiresAt")` },
    ];
    
    for (const idx of sessionIndexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql);
        console.log(`   ✅ Índice ${idx.name} criado`);
      } catch (e) {
        console.log(`   ⏭️  Índice ${idx.name} já existe`);
      }
    }

    // 6. Criar índices para student_notifications
    console.log('📝 Criando índices para student_notifications...');
    const notificationIndexes = [
      { name: 'student_notifications_studentId_read_idx', sql: `CREATE INDEX IF NOT EXISTS "student_notifications_studentId_read_idx" ON "student_notifications"("studentId", "read")` },
      { name: 'student_notifications_studentId_type_idx', sql: `CREATE INDEX IF NOT EXISTS "student_notifications_studentId_type_idx" ON "student_notifications"("studentId", "type")` },
      { name: 'student_notifications_createdAt_idx', sql: `CREATE INDEX IF NOT EXISTS "student_notifications_createdAt_idx" ON "student_notifications"("createdAt")` },
    ];
    
    for (const idx of notificationIndexes) {
      try {
        await prisma.$executeRawUnsafe(idx.sql);
        console.log(`   ✅ Índice ${idx.name} criado`);
      } catch (e) {
        console.log(`   ⏭️  Índice ${idx.name} já existe`);
      }
    }

    // 7. Criar Foreign Keys
    console.log('📝 Criando Foreign Keys...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "student_sessions" 
        ADD CONSTRAINT "student_sessions_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "students"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('   ✅ FK student_sessions_studentId_fkey criada');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  FK já existe, pulando...');
      } else {
        throw e;
      }
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "student_notifications" 
        ADD CONSTRAINT "student_notifications_studentId_fkey" 
        FOREIGN KEY ("studentId") REFERENCES "students"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log('   ✅ FK student_notifications_studentId_fkey criada');
    } catch (e) {
      if (e.message?.includes('already exists')) {
        console.log('   ⏭️  FK já existe, pulando...');
      } else {
        throw e;
      }
    }

    console.log('\n✅ Migração Portal do Aluno concluída com sucesso!\n');

    // Verificar contagem
    const sessionsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM student_sessions`;
    const notificationsCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM student_notifications`;

    console.log('📊 Resumo:');
    console.log(`   - student_sessions: ${sessionsCount[0].count} registros`);
    console.log(`   - student_notifications: ${notificationsCount[0].count} registros`);

  } catch (error) {
    console.error('\n❌ Erro na migração:', error.message);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

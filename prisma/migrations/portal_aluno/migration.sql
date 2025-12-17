-- Portal do Aluno - Migration
-- Tabelas: StudentSession, StudentNotification
-- Data: 2024-11-30

-- Enum para tipos de notificação do aluno
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
);

-- Enum para prioridade de notificação
CREATE TYPE "NotificationPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- Tabela: student_sessions
-- Sessões de autenticação do Portal do Aluno (Magic Link + JWT)
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
);

-- Tabela: student_notifications
-- Notificações do Portal do Aluno
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
);

-- Índices para student_sessions
CREATE UNIQUE INDEX IF NOT EXISTS "student_sessions_token_key" ON "student_sessions"("token");
CREATE INDEX IF NOT EXISTS "student_sessions_studentId_idx" ON "student_sessions"("studentId");
CREATE INDEX IF NOT EXISTS "student_sessions_token_idx" ON "student_sessions"("token");
CREATE INDEX IF NOT EXISTS "student_sessions_magicCode_idx" ON "student_sessions"("magicCode");
CREATE INDEX IF NOT EXISTS "student_sessions_expiresAt_idx" ON "student_sessions"("expiresAt");

-- Índices para student_notifications
CREATE INDEX IF NOT EXISTS "student_notifications_studentId_read_idx" ON "student_notifications"("studentId", "read");
CREATE INDEX IF NOT EXISTS "student_notifications_studentId_type_idx" ON "student_notifications"("studentId", "type");
CREATE INDEX IF NOT EXISTS "student_notifications_createdAt_idx" ON "student_notifications"("createdAt");

-- Foreign Keys
ALTER TABLE "student_sessions" ADD CONSTRAINT "student_sessions_studentId_fkey" 
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_notifications" ADD CONSTRAINT "student_notifications_studentId_fkey" 
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentários
COMMENT ON TABLE "student_sessions" IS 'Sessões de autenticação do Portal do Aluno - suporta Magic Link e JWT';
COMMENT ON TABLE "student_notifications" IS 'Notificações do Portal do Aluno - pagamentos, aulas, conquistas';

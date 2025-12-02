/**
 * Script para aplicar migração do Portal do Aluno
 * Cria tabelas: student_sessions, student_notifications
 * 
 * Uso: node scripts/apply-portal-migration.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Aplicando migração Portal do Aluno...\n');

  try {
    // Verificar se as tabelas já existem
    const tablesExist = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_sessions'
      ) as sessions_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_notifications'
      ) as notifications_exists
    `;

    console.log('📊 Status das tabelas:');
    console.log(`   - student_sessions: ${tablesExist[0].sessions_exists ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   - student_notifications: ${tablesExist[0].notifications_exists ? '✅ Existe' : '❌ Não existe'}`);

    if (tablesExist[0].sessions_exists && tablesExist[0].notifications_exists) {
      console.log('\n✅ Tabelas já existem! Nada a fazer.');
      return;
    }

    // Ler e executar SQL de migração
    const migrationPath = path.join(__dirname, '../prisma/migrations/portal_aluno/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Executar cada statement separadamente
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📝 Executando ${statements.length} statements SQL...\n`);

    for (const statement of statements) {
      try {
        // Pular comentários
        if (statement.startsWith('--') || statement.startsWith('COMMENT')) {
          continue;
        }
        
        await prisma.$executeRawUnsafe(statement);
        
        // Log do tipo de operação
        if (statement.startsWith('CREATE TYPE')) {
          const match = statement.match(/CREATE TYPE "(\w+)"/);
          console.log(`   ✅ Enum criado: ${match?.[1]}`);
        } else if (statement.startsWith('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE.*"(\w+)"/);
          console.log(`   ✅ Tabela criada: ${match?.[1]}`);
        } else if (statement.startsWith('CREATE INDEX') || statement.startsWith('CREATE UNIQUE INDEX')) {
          const match = statement.match(/INDEX.*"(\w+)"/);
          console.log(`   ✅ Índice criado: ${match?.[1]}`);
        } else if (statement.startsWith('ALTER TABLE')) {
          const match = statement.match(/CONSTRAINT "(\w+)"/);
          console.log(`   ✅ FK criada: ${match?.[1]}`);
        }
      } catch (error) {
        // Ignorar erros de "já existe"
        if (error.message?.includes('already exists')) {
          console.log(`   ⏭️  Já existe, pulando...`);
        } else {
          console.error(`   ❌ Erro: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migração Portal do Aluno aplicada com sucesso!');

    // Verificar contagem
    const sessionsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM student_sessions`;
    const notificationsCount = await prisma.$queryRaw`SELECT COUNT(*) FROM student_notifications`;

    console.log('\n📊 Resumo:');
    console.log(`   - student_sessions: ${sessionsCount[0].count} registros`);
    console.log(`   - student_notifications: ${notificationsCount[0].count} registros`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

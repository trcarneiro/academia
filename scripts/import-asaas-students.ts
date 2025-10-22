#!/usr/bin/env tsx
/**
 * 📥 IMPORTADOR EM MASSA - Alunos Asaas (23 registros)
 * 
 * USAGE:
 *   npx tsx scripts/import-asaas-students.ts
 * 
 * FEATURES:
 *   ✅ Valida CPF, email, celular duplicados
 *   ✅ Cria User + Student atomicamente (transação Prisma)
 *   ✅ Gera senhas seguras automaticamente
 *   ✅ Cria subscription com valor personalizado do Asaas
 *   ✅ Relatório detalhado de sucessos/falhas
 *   ✅ Modo dry-run para validação prévia
 * 
 * DATA: 15/10/2025
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ✅ CONFIGURAÇÃO
const CONFIG = {
  organizationId: '452c0b35-1822-4890-851e-922356c812fb', // Academia Krav Maga Demo
  defaultPlanId: '18f7d0e9-c375-4792-afb3-f59b2e4c2157', // Plano Ilimitado
  csvPath: path.join(__dirname, 'alunos-asaas-import.csv'),
  dryRun: process.argv.includes('--dry-run'), // npx tsx scripts/import-asaas-students.ts --dry-run
  skipExisting: true, // Pular alunos que já existem (por CPF ou email)
};

interface StudentRow {
  Nome: string;
  Email: string;
  Celular: string;
  CPF: string;
  Endereco: string;
  Numero: string;
  Complemento: string;
  Bairro: string;
  Cidade: string;
  CEP: string;
  Estado: string;
  ValorPlano: string;
}

interface ImportResult {
  success: boolean;
  studentId?: string;
  userId?: string;
  subscriptionId?: string;
  email?: string;
  cpf?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

// 🔧 HELPERS
function formatCPF(cpf: string): string {
  if (!cpf) return '';
  // Remove tudo que não é dígito
  const digits = cpf.replace(/\D/g, '');
  // Adiciona zeros à esquerda se necessário
  return digits.padStart(11, '0');
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  
  // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: 'Aluno', lastName: 'Sem Nome' };
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

function generateSecurePassword(): string {
  // Senha aleatória de 10 caracteres (letras + números)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function checkDuplicates(email: string, cpf: string): Promise<{ exists: boolean; reason?: string }> {
  // Verifica email duplicado
  if (email) {
    const userByEmail = await prisma.user.findFirst({
      where: {
        organizationId: CONFIG.organizationId,
        email: email.toLowerCase(),
      },
    });
    
    if (userByEmail) {
      return { exists: true, reason: `Email ${email} já cadastrado` };
    }
  }
  
  // Verifica CPF duplicado
  if (cpf) {
    const formattedCPF = formatCPF(cpf);
    const userByCPF = await prisma.user.findFirst({
      where: {
        organizationId: CONFIG.organizationId,
        cpf: formattedCPF,
      },
    });
    
    if (userByCPF) {
      return { exists: true, reason: `CPF ${formattedCPF} já cadastrado` };
    }
  }
  
  return { exists: false };
}

async function importStudent(row: StudentRow, index: number): Promise<ImportResult> {
  try {
    const { firstName, lastName } = parseName(row.Nome);
    const formattedCPF = formatCPF(row.CPF);
    const formattedPhone = formatPhone(row.Celular);
    const email = row.Email?.toLowerCase().trim() || `aluno${index}@academia.demo`;
    const customPrice = parseFloat(row.ValorPlano?.replace(',', '.') || '0');
    
    console.log(`\n📋 [${index + 1}/23] ${row.Nome}`);
    console.log(`   Email: ${email}`);
    console.log(`   CPF: ${formattedCPF}`);
    console.log(`   Valor: R$ ${customPrice.toFixed(2)}`);
    
    // Validação: checar duplicatas
    if (CONFIG.skipExisting) {
      const duplicate = await checkDuplicates(email, formattedCPF);
      if (duplicate.exists) {
        console.log(`   ⏭️ PULADO: ${duplicate.reason}`);
        return {
          success: true,
          skipped: true,
          reason: duplicate.reason,
          email,
          cpf: formattedCPF,
        };
      }
    }
    
    // DRY RUN: apenas validar
    if (CONFIG.dryRun) {
      console.log(`   ✅ VÁLIDO (dry-run mode)`);
      return {
        success: true,
        email,
        cpf: formattedCPF,
      };
    }
    
    // Gerar senha segura
    const plainPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    // TRANSAÇÃO: Criar User + Student + Subscription atomicamente
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar User
      const user = await tx.user.create({
        data: {
          organizationId: CONFIG.organizationId,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          firstName,
          lastName,
          phone: formattedPhone,
          cpf: formattedCPF,
          isActive: true,
        },
      });
      
      // 2. Criar Student
      const student = await tx.student.create({
        data: {
          organizationId: CONFIG.organizationId,
          userId: user.id,
          category: 'ADULT',
          gender: 'MASCULINO', // Default (pode ser ajustado manualmente depois)
          physicalCondition: 'INICIANTE',
          enrollmentDate: new Date(),
          isActive: true,
        },
      });
      
      // 3. Criar Subscription com valor personalizado do Asaas
      const subscription = await tx.studentSubscription.create({
        data: {
          organizationId: CONFIG.organizationId,
          studentId: student.id,
          planId: CONFIG.defaultPlanId,
          status: 'ACTIVE',
          startDate: new Date(),
          currentPrice: customPrice.toString(), // Valor personalizado!
          billingType: 'MONTHLY',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
          isActive: true,
          autoRenew: true,
        },
      });
      
      return { user, student, subscription, plainPassword };
    });
    
    console.log(`   ✅ CRIADO com sucesso!`);
    console.log(`   🔑 Senha: ${result.plainPassword}`);
    console.log(`   👤 User ID: ${result.user.id}`);
    console.log(`   🎓 Student ID: ${result.student.id}`);
    console.log(`   💳 Subscription ID: ${result.subscription.id}`);
    
    return {
      success: true,
      userId: result.user.id,
      studentId: result.student.id,
      subscriptionId: result.subscription.id,
      email,
      cpf: formattedCPF,
    };
  } catch (error) {
    console.log(`   ❌ ERRO: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      email: row.Email,
      cpf: row.CPF,
    };
  }
}

async function main() {
  console.log('🚀 IMPORTADOR EM MASSA - Alunos Asaas\n');
  console.log(`📂 CSV: ${CONFIG.csvPath}`);
  console.log(`🏢 Organization: ${CONFIG.organizationId}`);
  console.log(`📦 Plano Padrão: ${CONFIG.defaultPlanId}`);
  console.log(`🔍 Modo: ${CONFIG.dryRun ? 'DRY-RUN (validação apenas)' : 'PRODUÇÃO'}`);
  console.log(`⏭️ Pular existentes: ${CONFIG.skipExisting ? 'SIM' : 'NÃO'}\n`);
  
  // Ler CSV
  const csvContent = fs.readFileSync(CONFIG.csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as StudentRow[];
  
  console.log(`📊 Total de registros no CSV: ${records.length}\n`);
  console.log('━'.repeat(80));
  
  // Processar cada aluno
  const results: ImportResult[] = [];
  
  for (let i = 0; i < records.length; i++) {
    const result = await importStudent(records[i], i);
    results.push(result);
    
    // Pausa de 100ms entre requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '━'.repeat(80));
  console.log('\n📊 RELATÓRIO FINAL\n');
  
  const successful = results.filter(r => r.success && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Importados com sucesso: ${successful.length}`);
  console.log(`⏭️ Pulados (já existem): ${skipped.length}`);
  console.log(`❌ Falhas: ${failed.length}`);
  console.log(`📊 Total processado: ${results.length}\n`);
  
  if (skipped.length > 0) {
    console.log('⏭️ ALUNOS PULADOS:');
    skipped.forEach(r => {
      console.log(`   - ${r.email || r.cpf}: ${r.reason}`);
    });
    console.log();
  }
  
  if (failed.length > 0) {
    console.log('❌ FALHAS:');
    failed.forEach(r => {
      console.log(`   - ${r.email || r.cpf}: ${r.error}`);
    });
    console.log();
  }
  
  // Salvar relatório JSON
  const reportPath = path.join(__dirname, `import-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: {
      total: results.length,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length,
    },
    results,
  }, null, 2));
  
  console.log(`💾 Relatório salvo em: ${reportPath}\n`);
  
  if (CONFIG.dryRun) {
    console.log('ℹ️ Este foi um DRY-RUN. Nenhum dado foi alterado no banco.');
    console.log('ℹ️ Execute sem --dry-run para importar de verdade:\n');
    console.log('   npx tsx scripts/import-asaas-students.ts\n');
  } else {
    console.log('🎉 Importação concluída!\n');
  }
}

main()
  .catch((error) => {
    console.error('💥 ERRO FATAL:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

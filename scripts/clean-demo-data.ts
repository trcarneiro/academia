#!/usr/bin/env npx tsx

/**
 * 🧹 SCRIPT DE LIMPEZA DE DADOS DEMO
 * ==================================
 * 
 * Remove apenas os dados demo mantendo a estrutura da organização.
 * Use para limpar dados antes de recriar ou quando quiser resetar.
 * 
 * COMO USAR:
 * npm run clean:demo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';

async function cleanDemoData() {
  console.log('🧹 Limpando dados demo da organização...');
  
  try {
    // Deletar em ordem para respeitar foreign keys
    const operations = [
      // Dependências dos estudantes
      { table: 'attendances', desc: 'Presenças' },
      { table: 'student_subscriptions', desc: 'Assinaturas' },
      { table: 'payments', desc: 'Pagamentos' },
      { table: 'student_achievements', desc: 'Conquistas' },
      { table: 'student_progressions', desc: 'Progressões' },
      
      // Aulas e relacionamentos
      { table: 'classes', desc: 'Aulas' },
      { table: 'lesson_plans', desc: 'Planos de aula' },
      { table: 'course_techniques', desc: 'Técnicas do curso' },
      
      // Entidades principais
      { table: 'students', desc: 'Estudantes' },
      { table: 'instructors', desc: 'Instrutores' },
      { table: 'billing_plans', desc: 'Planos de cobrança' },
      { table: 'courses', desc: 'Cursos' },
      { table: 'activities', desc: 'Atividades' },
      { table: 'techniques', desc: 'Técnicas' },
      { table: 'martial_arts', desc: 'Artes marciais' },
      
      // Usuários (exceto admin)  
      { 
        table: 'users', 
        desc: 'Usuários demo',
        condition: `WHERE "organizationId" = $1 AND role != 'ADMIN'`
      }
    ];

    let totalDeleted = 0;

    for (const op of operations) {
      try {
        const condition = op.condition || `WHERE "organizationId" = $1`;
        const query = `DELETE FROM ${op.table} ${condition}`;
        
        const result = await prisma.$executeRawUnsafe(query, ORG_ID);
        
        if (result > 0) {
          console.log(`   ✅ ${op.desc}: ${result} registros removidos`);
          totalDeleted += result;
        } else {
          console.log(`   ➖ ${op.desc}: nenhum registro encontrado`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${op.desc}: ${error.message}`);
      }
    }

    console.log(`\n🎯 Limpeza concluída!`);
    console.log(`📊 Total de registros removidos: ${totalDeleted}`);
    console.log(`🏢 Organização mantida: Academia Krav Maga Demo`);
    console.log(`\n💡 Para recriar dados demo, execute:`);
    console.log(`   npm run seed:quick  (dados básicos)`);
    console.log(`   npm run seed:demo   (dados completos)`);

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  cleanDemoData().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

export { cleanDemoData };

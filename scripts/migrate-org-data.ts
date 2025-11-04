#!/usr/bin/env npx tsx

/**
 * 🔄 Migrate Organization Data
 * Migra todos os dados da organização secundária para a principal e depois deleta
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_ORG_ID = '6fad4290-c504-46e7-ab60-afb76363b1a9'; // Academia Demo
const TARGET_ORG_ID = '452c0b35-1822-4890-851e-922356c812fb'; // Academia Krav Maga Demo

async function main() {
  console.log('🔄 INICIANDO MIGRAÇÃO DE DADOS\n');
  console.log(`📤 De: Academia Demo (${SOURCE_ORG_ID})`);
  console.log(`📥 Para: Academia Krav Maga Demo (${TARGET_ORG_ID})\n`);
  
  try {
    // 1. Migrar Students
    const studentsUpdated = await prisma.student.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Alunos migrados: ${studentsUpdated.count}`);
    
    // 2. Migrar Instructors
    const instructorsUpdated = await prisma.instructor.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Instrutores migrados: ${instructorsUpdated.count}`);
    
    // 3. Migrar Courses
    const coursesUpdated = await prisma.course.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Cursos migrados: ${coursesUpdated.count}`);
    
    // 4. Migrar Units
    const unitsUpdated = await prisma.unit.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Unidades migradas: ${unitsUpdated.count}`);
    
    // 5. Migrar Billing Plans (se houver)
    const plansUpdated = await prisma.billingPlan.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Planos migrados: ${plansUpdated.count}`);
    
    // 6. Migrar Turmas (se houver)
    const turmasUpdated = await prisma.turma.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Turmas migradas: ${turmasUpdated.count}`);
    
    // 7. Verificar se ainda há dependências
    const remainingDeps = await prisma.student.count({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    if (remainingDeps === 0) {
      console.log('\n✅ Todas as dependências foram migradas!');
      console.log('\n🗑️  Deletando organização secundária...');
      
      await prisma.organization.delete({
        where: { id: SOURCE_ORG_ID }
      });
      
      console.log('✅ Organização deletada com sucesso!\n');
      console.log('🎉 MIGRAÇÃO COMPLETA!');
    } else {
      console.log(`\n⚠️  Ainda há ${remainingDeps} dependência(s)`);
      console.log('❌ Organização NÃO foi deletada por segurança');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

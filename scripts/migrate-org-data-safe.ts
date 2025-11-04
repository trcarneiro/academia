#!/usr/bin/env npx tsx

/**
 * 🔄 Migrate Organization Data (Safe Version)
 * Migra dados evitando conflitos de unique constraints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_ORG_ID = '6fad4290-c504-46e7-ab60-afb76363b1a9'; // Academia Demo
const TARGET_ORG_ID = '452c0b35-1822-4890-851e-922356c812fb'; // Academia Krav Maga Demo

async function main() {
  console.log('🔄 INICIANDO MIGRAÇÃO SEGURA DE DADOS\n');
  console.log(`📤 De: Academia Demo (${SOURCE_ORG_ID})`);
  console.log(`📥 Para: Academia Krav Maga Demo (${TARGET_ORG_ID})\n`);
  
  try {
    // 1. Verificar cursos duplicados
    const sourceCourses = await prisma.course.findMany({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    const targetCourses = await prisma.course.findMany({
      where: { organizationId: TARGET_ORG_ID },
      select: { name: true }
    });
    
    const targetCourseNames = targetCourses.map(c => c.name);
    
    console.log('📚 Analisando cursos...');
    for (const course of sourceCourses) {
      if (targetCourseNames.includes(course.name)) {
        console.log(`  ⚠️  Curso duplicado encontrado: "${course.name}" - DELETANDO`);
        await prisma.course.delete({ where: { id: course.id } });
      } else {
        console.log(`  ✅ Curso único: "${course.name}" - MIGRANDO`);
        await prisma.course.update({
          where: { id: course.id },
          data: { organizationId: TARGET_ORG_ID }
        });
      }
    }
    
    // 2. Migrar Students (já foi feito, mas garantindo)
    const studentsUpdated = await prisma.student.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Alunos migrados: ${studentsUpdated.count}`);
    
    // 3. Migrar Instructors (já foi feito, mas garantindo)
    const instructorsUpdated = await prisma.instructor.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Instrutores migrados: ${instructorsUpdated.count}`);
    
    // 4. Migrar Units
    const unitsUpdated = await prisma.unit.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Unidades migradas: ${unitsUpdated.count}`);
    
    // 5. Migrar Billing Plans
    const plansUpdated = await prisma.billingPlan.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Planos migrados: ${plansUpdated.count}`);
    
    // 6. Migrar Turmas
    const turmasUpdated = await prisma.turma.updateMany({
      where: { organizationId: SOURCE_ORG_ID },
      data: { organizationId: TARGET_ORG_ID }
    });
    console.log(`✅ Turmas migradas: ${turmasUpdated.count}`);
    
    // 7. Verificar se ainda há dependências críticas
    const remainingStudents = await prisma.student.count({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    const remainingInstructors = await prisma.instructor.count({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    const remainingCourses = await prisma.course.count({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    const remainingUnits = await prisma.unit.count({
      where: { organizationId: SOURCE_ORG_ID }
    });
    
    const totalRemaining = remainingStudents + remainingInstructors + remainingCourses + remainingUnits;
    
    if (totalRemaining === 0) {
      console.log('\n✅ Todas as dependências foram migradas/removidas!');
      console.log('\n🗑️  Deletando organização secundária...');
      
      await prisma.organization.delete({
        where: { id: SOURCE_ORG_ID }
      });
      
      console.log('✅ Organização deletada com sucesso!\n');
      console.log('🎉 MIGRAÇÃO COMPLETA!');
      console.log('\n📊 Resumo:');
      console.log(`  👥 Alunos: ${studentsUpdated.count}`);
      console.log(`  👨‍🏫 Instrutores: ${instructorsUpdated.count}`);
      console.log(`  📚 Cursos: ${sourceCourses.length}`);
      console.log(`  🏢 Unidades: ${unitsUpdated.count}`);
    } else {
      console.log(`\n⚠️  Ainda há ${totalRemaining} dependência(s):`);
      console.log(`  - Alunos: ${remainingStudents}`);
      console.log(`  - Instrutores: ${remainingInstructors}`);
      console.log(`  - Cursos: ${remainingCourses}`);
      console.log(`  - Unidades: ${remainingUnits}`);
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

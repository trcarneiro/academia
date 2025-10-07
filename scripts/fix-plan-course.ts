import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlanCourse() {
  try {
    console.log('\n🔧 CORRIGINDO CURSO DO PLANO ILIMIADO\n');
    
    // 1. Find the plan
    const plan = await prisma.billingPlan.findFirst({
      where: { name: 'Ilimiado' }
    });
    
    if (!plan) {
      console.log('❌ Plano Ilimiado não encontrado!');
      return;
    }
    
    console.log(`✅ Plano encontrado: ${plan.name}`);
    
    // 2. Find Krav Maga base course
    const allCourses = await prisma.course.findMany({
      where: {
        organizationId: plan.organizationId,
        isActive: true
      },
      include: {
        martialArt: true
      }
    });
    
    // Filter for base course
    const baseCourse = allCourses.find((c: any) => 
      c.isBaseCourse === true && 
      c.name.includes('Faixa Branca')
    );
    
    if (!baseCourse) {
      console.log('❌ Curso base Krav Maga - Faixa Branca não encontrado!');
      console.log('\n📚 Cursos disponíveis:');
      allCourses.forEach((c: any) => {
        console.log(`   - ${c.name} (base: ${c.isBaseCourse}, art: ${c.martialArt?.name})`);
      });
      return;
    }
    
    console.log(`✅ Curso base encontrado: ${baseCourse.name} (${baseCourse.martialArt?.name})`);
    console.log(`   isBaseCourse: ${(baseCourse as any).isBaseCourse}`);
    
    // 3. Update plan features
    const updatedPlan = await prisma.billingPlan.update({
      where: { id: plan.id },
      data: {
        features: {
          courseIds: [baseCourse.id]
        }
      }
    });
    
    console.log('\n✅ Plano atualizado com sucesso!');
    console.log(`   Curso antigo removido: Krav Maga Kids`);
    console.log(`   Curso novo adicionado: ${baseCourse.name}`);
    console.log(`\n📦 Features atualizadas:`, updatedPlan.features);
    
    console.log('\n🎯 Agora o sistema de auto-matrícula funcionará corretamente!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlanCourse();

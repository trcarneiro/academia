import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPlanDirectly() {
  try {
    console.log('\n🔧 CORRIGINDO PLANO ILIMIADO\n');
    
    // Get organization ID from plan
    const plan: any = await prisma.$queryRaw`
      SELECT id, organization_id, name, features
      FROM billing_plan
      WHERE name = 'Ilimiado'
      LIMIT 1
    `;
    
    if (!plan || plan.length === 0) {
      console.log('❌ Plano não encontrado!');
      return;
    }
    
    const planData = plan[0];
    console.log(`✅ Plano: ${planData.name}`);
    console.log(`   Org ID: ${planData.organization_id}`);
    
    // Get Krav Maga - Faixa Branca course
    const courses: any = await prisma.$queryRaw`
      SELECT c.id, c.name, c.is_base_course, ma.name as martial_art_name
      FROM course c
      LEFT JOIN martial_art ma ON c.martial_art_id = ma.id
      WHERE c.organization_id = ${planData.organization_id}
        AND c.name = 'Krav Maga - Faixa Branca'
        AND c.is_active = true
      LIMIT 1
    `;
    
    if (!courses || courses.length === 0) {
      console.log('❌ Curso Krav Maga - Faixa Branca não encontrado!');
      return;
    }
    
    const course = courses[0];
    console.log(`✅ Curso: ${course.name}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   isBaseCourse: ${course.is_base_course}`);
    console.log(`   Arte: ${course.martial_art_name}`);
    
    // Update plan
    await prisma.$queryRaw`
      UPDATE billing_plan
      SET features = jsonb_build_object('courseIds', jsonb_build_array(${course.id}::text))
      WHERE id = ${planData.id}
    `;
    
    console.log('\n✅ Plano atualizado com sucesso!');
    console.log(`   Novo curso: ${course.name}`);
    
    // Verify
    const updated: any = await prisma.$queryRaw`
      SELECT features FROM billing_plan WHERE id = ${planData.id}
    `;
    
    console.log('\n📦 Features atualizadas:', updated[0].features);
    console.log('\n🎯 Sistema pronto para auto-matrícula!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPlanDirectly();

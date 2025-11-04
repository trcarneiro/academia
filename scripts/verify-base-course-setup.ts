import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBaseCourseSetup() {
  try {
    console.log('\n🔍 VERIFICANDO CONFIGURAÇÃO DE CURSOS BASE\n');
    console.log('='.repeat(60));

    // 1. Check organizations
    const orgs = await prisma.organization.findMany({
      select: { id: true, name: true }
    });
    
    if (orgs.length === 0) {
      console.log('❌ Nenhuma organização encontrada!');
      return;
    }
    
    console.log(`\n✅ Organizações encontradas: ${orgs.length}`);
    orgs.forEach(org => console.log(`   - ${org.name} (${org.id})`));

    const orgId = orgs[0].id;

    // 2. Check martial arts
    console.log('\n📚 ARTES MARCIAIS:');
    const martialArts = await prisma.martialArt.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true }
    });
    
    if (martialArts.length === 0) {
      console.log('❌ Nenhuma arte marcial encontrada!');
      return;
    }
    
    martialArts.forEach(ma => {
      console.log(`   ✅ ${ma.name}`);
    });

    // 3. Check courses and base courses
    console.log('\n🎓 CURSOS E CURSOS BASE:');
    const courses = await prisma.course.findMany({
      where: { organizationId: orgId },
      include: {
        martialArt: { select: { name: true } }
      },
      orderBy: [
        { martialArt: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    if (courses.length === 0) {
      console.log('❌ Nenhum curso encontrado!');
      return;
    }

    const coursesByArt = courses.reduce((acc: any, course: any) => {
      const artName = course.martialArt?.name || 'Sem Arte Marcial';
      if (!acc[artName]) acc[artName] = [];
      acc[artName].push(course);
      return acc;
    }, {});

    Object.entries(coursesByArt).forEach(([artName, artCourses]: [string, any]) => {
      console.log(`\n   ${artName}:`);
      artCourses.forEach((course: any) => {
        const isBase = (course as any).isBaseCourse;
        const sequence = (course as any).sequence || 0;
        const baseIcon = isBase ? '🏆' : '  ';
        const active = course.isActive ? '✅' : '❌';
        console.log(`      ${baseIcon} ${course.name} (seq: ${sequence}, ativo: ${active})`);
      });
    });

    // 4. Check billing plans
    console.log('\n💳 PLANOS DE PAGAMENTO:');
    const plans = await prisma.billingPlan.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        features: true
      }
    });

    if (plans.length === 0) {
      console.log('❌ Nenhum plano encontrado!');
      return;
    }

    for (const plan of plans) {
      const features = plan.features as any;
      const courseIds = features?.courseIds || [];
      
      console.log(`\n   📦 ${plan.name} - R$ ${plan.price}`);
      console.log(`      Status: ${plan.isActive ? '✅ Ativo' : '❌ Inativo'}`);
      console.log(`      Cursos no plano: ${courseIds.length}`);

      if (courseIds.length > 0) {
        const planCourses = await prisma.course.findMany({
          where: {
            id: { in: courseIds },
            organizationId: orgId
          },
          include: {
            martialArt: { select: { name: true } }
          }
        });

        planCourses.forEach((course: any) => {
          const isBase = course.isBaseCourse;
          const baseIcon = isBase ? '🏆 CURSO BASE' : '📘 Curso Paralelo';
          console.log(`         ${baseIcon}: ${course.name} (${course.martialArt?.name})`);
        });

        // Check if plan has base course
        const hasBaseCourse = planCourses.some((c: any) => c.isBaseCourse === true);
        if (hasBaseCourse) {
          console.log(`      ✅ Plano tem curso base configurado!`);
        } else {
          console.log(`      ⚠️  ATENÇÃO: Plano não tem curso base!`);
        }
      } else {
        console.log(`      ⚠️  ATENÇÃO: Plano sem cursos configurados!`);
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    const totalCourses = courses.length;
    const baseCourses = courses.filter((c: any) => c.isBaseCourse === true);
    const activeCourses = courses.filter(c => c.isActive);
    
    console.log(`   Total de cursos: ${totalCourses}`);
    console.log(`   Cursos base: ${baseCourses.length}`);
    console.log(`   Cursos ativos: ${activeCourses.length}`);
    console.log(`   Planos cadastrados: ${plans.length}`);
    
    const plansWithBaseCourse = await Promise.all(
      plans.map(async plan => {
        const features = plan.features as any;
        const courseIds = features?.courseIds || [];
        if (courseIds.length === 0) return false;
        
        const planCourses = await prisma.course.findMany({
          where: { id: { in: courseIds } }
        });
        
        return planCourses.some((c: any) => c.isBaseCourse === true);
      })
    );
    
    const plansOk = plansWithBaseCourse.filter(Boolean).length;
    console.log(`   Planos com curso base: ${plansOk}/${plans.length}`);

    if (baseCourses.length > 0 && plansOk > 0) {
      console.log('\n✅ SISTEMA CONFIGURADO CORRETAMENTE!');
      console.log('   O fluxo de auto-matrícula está pronto para uso.');
    } else {
      console.log('\n⚠️  SISTEMA PRECISA DE AJUSTES:');
      if (baseCourses.length === 0) {
        console.log('   - Nenhum curso base encontrado (rode: npx tsx scripts/setup-base-courses.ts)');
      }
      if (plansOk === 0) {
        console.log('   - Nenhum plano com curso base (adicione cursos aos planos)');
      }
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBaseCourseSetup();

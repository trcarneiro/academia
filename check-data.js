const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const [org, users, students, courses, techniques, lessons, plans] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.student.count(),
    prisma.course.count(),
    prisma.technique.count(),
    prisma.lessonPlan.count(),
    prisma.billingPlan.count()
  ]);
  
  console.log('\n📊 DADOS NO SUPABASE POSTGRESQL:');
  console.log('════════════════════════════════');
  console.log(`✅ Organizações:     ${org}`);
  console.log(`✅ Usuários:         ${users}`);
  console.log(`✅ Estudantes:       ${students}`);
  console.log(`✅ Cursos:           ${courses}`);
  console.log(`✅ Técnicas:         ${techniques}`);
  console.log(`✅ Planos de Aula:   ${lessons}`);
  console.log(`✅ Planos de Cobrança: ${plans}`);
  console.log('════════════════════════════════\n');
  
  await prisma.$disconnect();
})();

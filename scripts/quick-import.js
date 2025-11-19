const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Import iniciado\n');

  const org = await prisma.organization.findUnique({
    where: { id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472' }
  });

  const course = await prisma.course.findFirst({
    where: {
      name: 'Krav Maga - Faixa Branca',
      organizationId: org.id
    }
  });

  const techniques = JSON.parse(fs.readFileSync('cursos/Tecnicas_Krav_Maga_Faixa_Branca.json', 'utf-8'));

  console.log(`✅ Organização: ${org.name}`);
  console.log(`✅ Curso: ${course.name}`);
  console.log(`📚 Técnicas: ${techniques.length}\n`);

  let count = 0;
  for (const tech of techniques) {
    try {
      await prisma.activity.create({
        data: {
          organizationId: org.id,
          title: tech.title,
          type: 'TECHNIQUE',
          description: tech.description
        }
      });
      count++;
      console.log(`  ✓ ${tech.title}`);
    } catch (e) {
      console.log(`  ❌ ${tech.title}: ${e.message}`);
    }
  }

  console.log(`\n✅ ${count} atividades criadas!`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

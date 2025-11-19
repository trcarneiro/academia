import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    where: {
      organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
    },
    include: {
      user: true
    },
  });

  console.log(`\n🔍 Total de alunos: ${students.length}\n`);
  
  students.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}. ${s.user?.name || 'SEM NOME'}`);
    console.log(`   ID: ${s.id}`);
    console.log(`   Email: ${s.user?.email || 'SEM EMAIL'}`);
    console.log(`   Status: ${s.status}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

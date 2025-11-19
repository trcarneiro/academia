import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTurmas() {
  console.log('\n===== VERIFICANDO TURMAS =====\n');
  
  const turmas = await prisma.turma.findMany({
    where: {
      organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
      isActive: true
    },
    select: {
      id: true,
      name: true,
      schedule: true,
      isActive: true,
      instructor: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    },
    take: 5
  });

  console.log(`Total de turmas ativas: ${turmas.length}\n`);

  turmas.forEach((turma, index) => {
    console.log(`\n${index + 1}. ${turma.name}`);
    console.log(`   Instrutor: ${turma.instructor.firstName} ${turma.instructor.lastName}`);
    console.log(`   Schedule JSON:`, JSON.stringify(turma.schedule, null, 2));
  });

  // Check today
  const today = new Date();
  const dayOfWeek = today.getDay();
  console.log(`\n\nHoje é dia da semana: ${dayOfWeek} (0=Domingo, 1=Segunda, etc.)`);

  await prisma.$disconnect();
}

checkTurmas().catch(console.error);

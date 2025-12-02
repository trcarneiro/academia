import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTurmas() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  const turmas = await prisma.turma.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      name: true,
      schedule: true,
      room: true
    },
    orderBy: { name: 'asc' }
  });
  
  console.log('📋 Turmas encontradas:');
  console.log('='.repeat(100));
  turmas.forEach((t, i) => {
    const scheduleStr = t.schedule ? JSON.stringify(t.schedule) : '';
    console.log(`${i+1}. ${t.name.padEnd(40)} | ${scheduleStr.substring(0,30).padEnd(30)} | ${(t.room || '').padEnd(15)} | ${t.id}`);
  });
  
  console.log('\nTotal:', turmas.length, 'turmas');
  
  await prisma.$disconnect();
}

listTurmas().catch(console.error);

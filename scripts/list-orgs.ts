import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  console.log('Organizações:', JSON.stringify(orgs, null, 2));
  
  for (const org of orgs) {
    const count = await prisma.student.count({ where: { organizationId: org.id } });
    console.log(`  ${org.name}: ${count} alunos`);
  }
  
  await prisma.$disconnect();
}

main();

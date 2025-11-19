import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countTechniques() {
  const count = await prisma.technique.count();
  console.log(`✅ ${count} técnicas ainda no banco`);
  await prisma.$disconnect();
}

countTechniques();

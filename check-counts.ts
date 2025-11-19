import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  console.log('Organization ID:', org?.id);
  console.log('Organization Name:', org?.name);
  
  const studentCount = await prisma.student.count();
  console.log('Current students in database:', studentCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

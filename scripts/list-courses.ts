import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  const courses = await prisma.course.findMany({
    where: { organizationId: ORG_ID },
    select: { id: true, name: true, level: true }
  });
  console.log('Cursos existentes:');
  console.log(JSON.stringify(courses, null, 2));
  await prisma.$disconnect();
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for "Defesa Pessoal" turmas and courses...');

  const courses = await prisma.course.findMany({
    where: {
      name: { contains: 'Defesa', mode: 'insensitive' }
    }
  });

  console.log(`Found ${courses.length} courses with "Defesa" in name.`);
  courses.forEach(c => {
    console.log(`- [Course] [${c.id}] ${c.name}`);
  });

  const turmas = await prisma.turma.findMany({
    where: {
      OR: [
        { name: { contains: 'Defesa', mode: 'insensitive' } },
        { course: { name: { contains: 'Defesa', mode: 'insensitive' } } }
      ]
    },
    include: {
      course: true,
      instructor: true,
      unit: true
    }
  });

  console.log(`Found ${turmas.length} turmas with "Defesa" in name or course name.`);
  
  turmas.forEach(t => {
    console.log(`- [Turma] [${t.id}] ${t.name} (Course: ${t.course?.name}) - Status: ${t.status}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

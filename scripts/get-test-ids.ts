import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTestIds() {
  console.log('🔍 Buscando IDs para testes...\n');

  // Organização
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'Krav Maga' } }
  });
  console.log('🏢 Organization ID:', org?.id || 'NOT FOUND');
  console.log('   Nome:', org?.name);

  // Curso
  const course = await prisma.course.findFirst({
    where: { 
      organizationId: org?.id,
      name: { contains: 'Iniciante' }
    }
  });
  console.log('\n📚 Course ID:', course?.id || 'NOT FOUND');
  console.log('   Nome:', course?.name);

  // Instrutor
  const instructor = await prisma.instructor.findFirst({
    where: { organizationId: org?.id }
  });
  console.log('\n👨‍🏫 Instructor ID:', instructor?.id || 'NOT FOUND');
  console.log('   Nome:', instructor?.firstName, instructor?.lastName);

  await prisma.$disconnect();
}

getTestIds();

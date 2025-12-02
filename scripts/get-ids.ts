import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getIds() {
  const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  // Buscar cursos
  const courses = await prisma.course.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true }
  });
  console.log('Cursos:');
  courses.forEach(c => console.log('  -', c.id, c.name));
  
  // Buscar instrutores
  const instructors = await prisma.user.findMany({
    where: { 
      organizationId: orgId,
      role: { in: ['ADMIN', 'INSTRUCTOR'] }
    },
    select: { id: true, firstName: true, lastName: true, role: true }
  });
  console.log('\nInstrutores:');
  instructors.forEach(i => console.log('  -', i.id, i.firstName, i.lastName, '(' + i.role + ')'));
  
  await prisma.$disconnect();
}

getIds().catch(console.error);

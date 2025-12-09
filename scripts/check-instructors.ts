import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  // Listar usuários que são instrutores ou admins
  const users = await prisma.user.findMany({
    where: { 
      organizationId: ORG_ID,
      role: { in: ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'] }
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: true }
  });
  console.log('Usuários com role INSTRUCTOR/ADMIN:');
  users.forEach(u => console.log(`  - ${u.id}: ${u.firstName} ${u.lastName} (${u.role})`));
  
  // Listar instrutores da tabela instructors
  const instructors = await prisma.instructor.findMany({
    where: { organizationId: ORG_ID },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }
  });
  console.log('\nInstrutores na tabela instructors:');
  instructors.forEach(i => console.log(`  - ${i.userId}: ${i.user.firstName} ${i.user.lastName}`));
  
  await prisma.$disconnect();
}

main();

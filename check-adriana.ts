import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: { user: true },
    where: {
      user: {
        OR: [
          { firstName: { contains: 'Adriana', mode: 'insensitive' } },
          { lastName: { contains: 'Kattah', mode: 'insensitive' } }
        ]
      }
    }
  });

  console.log('Found students:', students.length);
  students.forEach(s => {
    console.log(`- ${s.user.firstName} ${s.user.lastName} (${s.user.email})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

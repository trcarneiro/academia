const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    const turmas = await prisma.turma.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        startDate: true,
        schedule: true,
        lessons: {
          select: {
            lessonNumber: true,
            scheduledDate: true
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10
        }
      }
    });

    console.log(JSON.stringify(turmas, null, 2));
  } catch (error) {
    console.error('Error querying turmas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando TurmaLessons de hoje...\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Buscar TurmaLessons de hoje
  const lessons = await prisma.turmaLesson.findMany({
    where: {
      scheduledDate: {
        gte: today,
        lt: tomorrow
      }
    },
    select: {
      id: true,
      title: true,
      scheduledDate: true,
      turma: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  console.log(`📚 Total de TurmaLessons hoje: ${lessons.length}\n`);

  if (lessons.length === 0) {
    console.log('✅ Nenhuma TurmaLesson encontrada!\n');
    return;
  }

  for (const lesson of lessons) {
    const time = lesson.scheduledDate.toLocaleTimeString('pt-BR');
    console.log(`🕐 ${time} - ${lesson.turma.name}`);
    console.log(`   ID: ${lesson.id}`);
    console.log(`   Title: ${lesson.title}\n`);
  }

  // Deletar TODAS
  console.log('🗑️ Deletando todas...\n');
  
  const ids = lessons.map(l => l.id);
  const result = await prisma.turmaLesson.deleteMany({
    where: {
      id: { in: ids }
    }
  });

  console.log(`✅ ${result.count} TurmaLessons deletadas!`);
  console.log('💡 Agora execute: node create-now-turma-lessons.mjs');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

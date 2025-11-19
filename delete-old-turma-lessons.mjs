import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('🗑️ Deletando TurmaLessons antigas de hoje...\n');

  // Pegar hoje 00:00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Pegar amanhã 00:00:00
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log(`📅 Período: ${today.toLocaleDateString()} até ${tomorrow.toLocaleDateString()}\n`);

  // Buscar todas as turmas da organização
  const turmas = await prisma.turma.findMany({
    where: { organizationId: ORG_ID },
    select: { id: true }
  });

  console.log(`📚 Turmas na organização: ${turmas.length}\n`);

  // Deletar TurmaLessons de hoje
  const result = await prisma.turmaLesson.deleteMany({
    where: {
      turmaId: { in: turmas.map(t => t.id) },
      scheduledDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  console.log(`✅ ${result.count} TurmaLessons deletadas!\n`);
  console.log('💡 Agora execute: node create-now-turma-lessons.mjs');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

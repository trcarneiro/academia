// Check TurmaLessons
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const turmaId = '473c68fc-094d-4f10-94f5-053d0d8b89f5';

prisma.turmaLesson.findMany({
  where: { turmaId: turmaId }
}).then(lessons => {
  console.log(`TurmaLessons encontradas para turma ${turmaId}:`, lessons.length);
  
  if (lessons.length === 0) {
    console.log('\n❌ Nenhuma TurmaLesson encontrada!');
    console.log('O check-in precisa de um TurmaLesson específico para hoje.');
  } else {
    lessons.forEach(l => {
      const date = new Date(l.scheduledDate);
      const isToday = date.toDateString() === new Date().toDateString();
      console.log(`  ${isToday ? '✅ HOJE' : '  '} - ID: ${l.id}`);
      console.log(`       Data: ${date.toLocaleString()}`);
    });
  }
}).finally(() => prisma.$disconnect());

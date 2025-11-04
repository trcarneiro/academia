import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function createExtendedTestLessons() {
  const turmaId = '44c93476-bffd-4701-9570-80074a5a913a';
  const today = dayjs().format('YYYY-MM-DD');

  const lastLesson = await prisma.turmaLesson.findFirst({
    where: { turmaId },
    orderBy: { lessonNumber: 'desc' },
    select: { lessonNumber: true }
  });

  let nextLessonNumber = (lastLesson?.lessonNumber || 0) + 1;

  const schedules = [
    { hour: 6, minute: 15, duration: 45 },
    { hour: 7, minute: 30, duration: 60 },
    { hour: 8, minute: 45, duration: 45 },
    { hour: 9, minute: 20, duration: 50 },
    { hour: 10, minute: 10, duration: 60 },
    { hour: 11, minute: 40, duration: 70 },
    { hour: 12, minute: 25, duration: 45 },
    { hour: 13, minute: 15, duration: 60 },
    { hour: 14, minute: 35, duration: 55 },
    { hour: 15, minute: 50, duration: 45 },
    { hour: 16, minute: 20, duration: 60 },
    { hour: 17, minute: 5, duration: 50 },
    { hour: 18, minute: 45, duration: 75 },
    { hour: 19, minute: 15, duration: 60 },
    { hour: 20, minute: 30, duration: 45 },
    { hour: 21, minute: 40, duration: 55 },
    { hour: 22, minute: 10, duration: 50 },
    { hour: 23, minute: 25, duration: 60 },
    { hour: 0, minute: 15, duration: 45 },
    { hour: 1, minute: 0, duration: 60 }
  ];

  let count = 0;

  for (const s of schedules) {
    const h = s.hour.toString().padStart(2, '0');
    const m = s.minute.toString().padStart(2, '0');
    const dateStr = today + ' ' + h + ':' + m + ':00';
    const scheduledDate = dayjs(dateStr).toDate();

    try {
      const lesson = await prisma.turmaLesson.create({
        data: {
          turmaId: turmaId,
          lessonNumber: nextLessonNumber,
          scheduledDate: scheduledDate,
          duration: s.duration,
          title: 'Aula Teste ' + nextLessonNumber,
          objectives: ['Teste check-in']
        }
      });

      console.log('OK Aula ' + nextLessonNumber + ' - ' + h + ':' + m + ' - ID: ' + lesson.id);
      nextLessonNumber++;
      count++;
    } catch (error) {
      console.error('ERRO: ', error);
    }
  }

  console.log('Total criado: ' + count);
}

createExtendedTestLessons().catch(console.error).finally(() => prisma.$disconnect());

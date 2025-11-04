import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
const prisma = new PrismaClient();
const today = dayjs();
const startOfDay = today.startOf('day').toDate();
const endOfDay = today.endOf('day').toDate();
console.log('Verificando TurmaLesson...');
const lessons = await prisma.turmaLesson.findMany({
  where: { scheduledDate: { gte: startOfDay, lte: endOfDay }, isActive: true },
  include: { turma: { include: { course: true } } }
});
console.log('Total:', lessons.length);
lessons.forEach((l,i) => console.log(${i+1}.  - ));
await prisma.();

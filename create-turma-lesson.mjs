// Create TurmaLesson for today's 17h turma
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const turmaId = '473c68fc-094d-4f10-94f5-053d0d8b89f5';
const today = new Date();
today.setHours(17, 0, 0, 0); // 17:00 hoje

console.log('📅 Criando TurmaLesson para hoje...');
console.log('Turma ID:', turmaId);
console.log('Data/Hora:', today.toLocaleString());

prisma.turmaLesson.create({
  data: {
    turmaId: turmaId,
    lessonNumber: 1,
    title: 'Aula de Krav Maga - Teste Check-in',
    scheduledDate: today,
    duration: 90,
    status: 'SCHEDULED',
    notes: 'Aula de teste para check-in',
  }
}).then(lesson => {
  console.log('\n✅ TurmaLesson criada com sucesso!');
  console.log('ID:', lesson.id);
  console.log('Data:', new Date(lesson.scheduledDate).toLocaleString());
  console.log('\n🎯 Use este ID no check-in:', lesson.id);
}).catch(error => {
  console.error('\n❌ Erro:', error.message);
}).finally(() => prisma.$disconnect());

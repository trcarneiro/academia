// Create multiple TurmaLessons for today - comprehensive check-in testing
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const today = new Date();
const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

// Todas as turmas existentes
const turmas = [
  { id: '9e3193a5-62c1-4c83-9ed8-64c9e2b42fab', name: 'Defesa Pessoal Adulto - Ter/Qui 18:00', hour: 18, minute: 0, duration: 60 },
  { id: 'f09ed5e8-8cad-4d05-89f2-b67c9e7bb5c5', name: 'Combate Avançado - Seg/Qua/Sex 19:00', hour: 19, minute: 0, duration: 60 },
  { id: '473c68fc-094d-4f10-94f5-053d0d8b89f5', name: '⚡ Krav Maga Intensivo - Tarde 17h', hour: 17, minute: 0, duration: 90 },
  { id: '4f76cbec-59e1-41e7-a533-dd44a71f3cb4', name: 'Kids Krav Maga - Ter/Qui 16:00', hour: 16, minute: 0, duration: 60 },
  { id: '5ca8889e-4cf8-44f2-b05e-5f1aa7afacc3', name: 'Krav Maga Feminino - Qua 20:00', hour: 20, minute: 0, duration: 60 },
  { id: 'ed8bc782-73c3-4d8e-a4c5-ed632c27d825', name: 'Defesa Pessoal Executivos - Seg/Qua 07:00', hour: 7, minute: 0, duration: 60 },
  { id: '7c46ea8b-c88d-41cd-a71d-b5c0e9a8da57', name: 'Treino Funcional + Krav - Seg/Qua/Sex 06:00', hour: 6, minute: 0, duration: 90 },
  // Turmas de teste criadas
  { id: '0ec85f7f-bf39-43ae-80ee-4c37f03a83c1', name: '🥋 Defesa Pessoal - Tarde 14h', hour: 14, minute: 0, duration: 60 },
  { id: '5bfc1f14-1a6c-46ae-86c2-c36ca1c5c66f', name: '💪 Combate Avançado - Tarde 15h', hour: 15, minute: 0, duration: 60 },
  { id: '3e0a50ae-1ad9-494d-931e-4d95f4d02c14', name: '🎯 Técnicas Especiais - Tarde 16h', hour: 16, minute: 0, duration: 60 },
  { id: '01526483-a34d-411c-a7a5-91005b2ad09d', name: '🔥 Treino Livre - Tarde 18h', hour: 18, minute: 0, duration: 60 },
];

console.log('📅 Criando TurmaLessons para hoje...');
console.log('Data:', today.toLocaleDateString());
console.log('Total de turmas:', turmas.length);
console.log('');

const lessons = [];

for (const turma of turmas) {
  const scheduledDate = new Date(baseDate);
  scheduledDate.setHours(turma.hour, turma.minute, 0, 0);
  
  try {
    const lesson = await prisma.turmaLesson.create({
      data: {
        turmaId: turma.id,
        lessonNumber: 1,
        title: `${turma.name} - Aula Teste`,
        scheduledDate: scheduledDate,
        duration: turma.duration,
        status: 'SCHEDULED',
        notes: 'Aula criada automaticamente para testes de check-in',
      }
    });
    
    lessons.push(lesson);
    
    const now = new Date();
    const isOpen = now >= new Date(scheduledDate.getTime() - 30 * 60000) && 
                   now <= new Date(scheduledDate.getTime() + 15 * 60000);
    
    console.log(`${isOpen ? '✅ ABERTO' : '⏰ AGENDADO'} ${turma.hour.toString().padStart(2, '0')}:${turma.minute.toString().padStart(2, '0')} - ${turma.name}`);
    console.log(`   ID: ${lesson.id}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log(`⚠️  ${turma.hour.toString().padStart(2, '0')}:${turma.minute.toString().padStart(2, '0')} - ${turma.name} (já existe)`);
    } else {
      console.error(`❌ Erro criando ${turma.name}:`, error.message);
    }
  }
}

console.log('');
console.log('═════════════════════════════════════════');
console.log(`✅ ${lessons.length} TurmaLessons criadas com sucesso!`);
console.log('═════════════════════════════════════════');
console.log('');
console.log('🧪 TESTANDO CHECK-IN:');
console.log('');
console.log('1. Acesse: http://localhost:3000/#/checkin-kiosk');
console.log('2. Busque por "PEDRO" no campo de pesquisa');
console.log('3. Selecione "Pedro Teste"');
console.log('4. Veja as turmas disponíveis com botões verdes');
console.log('5. Clique no botão "FAZER CHECK-IN" de qualquer turma');
console.log('6. Verifique a tela de sucesso! ✅');
console.log('');

await prisma.$disconnect();

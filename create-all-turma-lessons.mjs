// Find all real turmas and create TurmaLessons
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const today = new Date();
const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

console.log('🔍 Buscando turmas reais no banco...');
console.log('');

const turmas = await prisma.turma.findMany({
  where: {
    isActive: true,
    organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
  },
  select: {
    id: true,
    name: true,
    startTime: true,
    duration: true,
  }
});

console.log(`✅ Encontradas ${turmas.length} turmas ativas`);
console.log('');

const lessons = [];

for (const turma of turmas) {
  // Parse startTime (formato "HH:MM")
  const [hour, minute] = turma.startTime.split(':').map(Number);
  
  const scheduledDate = new Date(baseDate);
  scheduledDate.setHours(hour, minute, 0, 0);
  
  try {
    const lesson = await prisma.turmaLesson.create({
      data: {
        turmaId: turma.id,
        lessonNumber: 1,
        title: `${turma.name} - Aula Teste Check-in`,
        scheduledDate: scheduledDate,
        duration: turma.duration || 60,
        status: 'SCHEDULED',
        notes: 'Aula criada automaticamente para testes de check-in',
      }
    });
    
    lessons.push(lesson);
    
    const now = new Date();
    const checkInStart = new Date(scheduledDate.getTime() - 30 * 60000);
    const checkInEnd = new Date(scheduledDate.getTime() + 15 * 60000);
    const isOpen = now >= checkInStart && now <= checkInEnd;
    
    const status = isOpen ? '🟢 CHECK-IN ABERTO' : 
                   now < checkInStart ? '⏰ AGUARDANDO' : '🔴 ENCERRADO';
    
    console.log(`${status} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    console.log(`   📝 ${turma.name}`);
    console.log(`   🆔 TurmaLesson ID: ${lesson.id}`);
    console.log(`   ⏱️  Check-in: ${checkInStart.toLocaleTimeString()} - ${checkInEnd.toLocaleTimeString()}`);
    console.log('');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log(`⚠️  ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} - ${turma.name} (TurmaLesson já existe)`);
      console.log('');
    } else {
      console.error(`❌ Erro criando ${turma.name}:`, error.message);
      console.log('');
    }
  }
}

console.log('═════════════════════════════════════════════════════════');
console.log(`✅ CRIADAS: ${lessons.length} TurmaLessons`);
console.log(`⚠️  TOTAL: ${turmas.length} turmas processadas`);
console.log('═════════════════════════════════════════════════════════');
console.log('');
console.log('🎯 INSTRUÇÕES PARA TESTAR:');
console.log('');
console.log('1. Acesse: http://localhost:3000/#/checkin-kiosk');
console.log('2. Digite "PEDRO" no campo de busca');
console.log('3. Selecione "Pedro Teste" da lista');
console.log('4. Veja TODAS as turmas com check-in disponível');
console.log('5. Clique no botão verde "FAZER CHECK-IN"');
console.log('6. Confirme o sucesso! 🎉');
console.log('');
console.log('💡 DICA: Turmas com 🟢 estão com check-in aberto AGORA!');
console.log('');

await prisma.$disconnect();

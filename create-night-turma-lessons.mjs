// Create TurmaLessons for night hours (00:30, 00:45, 01:00) for testing
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ORGANIZATION_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

console.log('🌙 Criando TurmaLessons para horários noturnos de teste...\n');

try {
  // Get 3 different turmas to use
  const turmas = await prisma.turma.findMany({
    where: {
      isActive: true,
      organizationId: ORGANIZATION_ID
    },
    select: {
      id: true,
      name: true
    },
    take: 3
  });

  if (turmas.length < 3) {
    console.log('❌ Não há turmas suficientes no banco');
    process.exit(1);
  }

  const nightTimes = ['00:30', '00:45', '01:00'];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Próximo dia após meia-noite
  
  const results = [];

  for (let i = 0; i < nightTimes.length; i++) {
    const turma = turmas[i];
    const timeStr = nightTimes[i];
    const [hour, minute] = timeStr.split(':').map(Number);
    
    try {
      // Create scheduled date for tomorrow at this time
      const scheduledDate = new Date(tomorrow);
      scheduledDate.setHours(hour, minute, 0, 0);
      
      // Calculate check-in window (30min before to 15min after)
      const checkInStart = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
      const checkInEnd = new Date(scheduledDate.getTime() + 15 * 60 * 1000);
      const now = new Date();
      const isOpen = now >= checkInStart && now <= checkInEnd;
      
      // Status indicator
      let status = '⏰ AGUARDANDO';
      if (isOpen) {
        status = '🟢 CHECK-IN ABERTO';
      } else if (now > checkInEnd) {
        status = '🔴 ENCERRADO';
      }
      
      // Create TurmaLesson
      const lesson = await prisma.turmaLesson.create({
        data: {
          turmaId: turma.id,
          lessonNumber: 99, // Special number for test lessons
          title: `${turma.name} - TESTE NOTURNO ${timeStr}`,
          scheduledDate: scheduledDate,
          duration: 60,
          status: 'SCHEDULED',
          notes: `Aula de teste criada para horário noturno ${timeStr} - ${now.toLocaleString('pt-BR')}`
        }
      });
      
      results.push({
        turma: turma.name,
        time: timeStr,
        status,
        lessonId: lesson.id,
        success: true
      });
      
      console.log(`✅ ${turma.name}`);
      console.log(`   Horário: ${timeStr} (${scheduledDate.toLocaleString('pt-BR')})`);
      console.log(`   Status: ${status}`);
      console.log(`   TurmaLesson ID: ${lesson.id}`);
      console.log('');
      
    } catch (error) {
      if (error.code === 'P2002') {
        results.push({
          turma: turma.name,
          time: timeStr,
          status: '⚠️ JÁ EXISTE',
          success: false,
          error: 'Duplicate'
        });
        console.log(`⚠️ ${turma.name} (${timeStr}) - JÁ EXISTE`);
        console.log('');
      } else {
        results.push({
          turma: turma.name,
          time: timeStr,
          status: '❌ ERRO',
          success: false,
          error: error.message
        });
        console.log(`❌ ${turma.name} (${timeStr}) - Erro: ${error.message}`);
        console.log('');
      }
    }
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const successCount = results.filter(r => r.success).length;
  const duplicateCount = results.filter(r => r.error === 'Duplicate').length;
  const errorCount = results.filter(r => !r.success && r.error !== 'Duplicate').length;
  
  console.log(`✅ Criadas: ${successCount}`);
  console.log(`⚠️ Já existiam: ${duplicateCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('');
  
  // Show available turmas NOW
  const availableNow = results.filter(r => r.status === '🟢 CHECK-IN ABERTO');
  if (availableNow.length > 0) {
    console.log('🎯 TURMAS COM CHECK-IN ABERTO AGORA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const turma of availableNow) {
      console.log(`   🟢 ${turma.turma} - ${turma.time}`);
      console.log(`      TurmaLesson ID: ${turma.lessonId}`);
    }
    console.log('');
  }
  
  console.log('🧪 COMO TESTAR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Recarregue o frontend do Check-in Kiosk (F5)');
  console.log('2. Digite "Pedro Teste" no autocomplete');
  console.log('3. Selecione o aluno');
  console.log('4. Você verá as turmas com horários 00:30, 00:45, 01:00');
  console.log('5. Clique nos botões verdes "FAZER CHECK-IN"');
  console.log('6. Teste múltiplos check-ins em sequência!');
  console.log('');
  console.log(`📅 Total de TurmaLessons disponíveis: ${11 + successCount}`);
  console.log('');
  
} catch (error) {
  console.error('❌ Erro fatal:', error);
} finally {
  await prisma.$disconnect();
}

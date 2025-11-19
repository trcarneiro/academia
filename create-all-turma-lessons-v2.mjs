// Find all real turmas and create TurmaLessons for today
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ORGANIZATION_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

console.log('🔍 Buscando turmas reais no banco...\n');

try {
  const turmas = await prisma.turma.findMany({
    where: {
      isActive: true,
      organizationId: ORGANIZATION_ID
    },
    select: {
      id: true,
      name: true,
      schedule: true  // JSON: { time: '17:00', duration: 60, daysOfWeek: [2] }
    }
  });

  console.log(`✅ Encontradas ${turmas.length} turmas ativas\n`);

  const today = new Date();
  const results = [];

  for (const turma of turmas) {
    const schedule = turma.schedule; // Parse schedule JSON at top of loop
    const timeStr = schedule.time || 'N/A'; // "17:00"
    
    try {
      const duration = parseInt(schedule.duration) || 60; // Pode ser number ou string "60min"
      
      // Parse time
      const [hour, minute] = timeStr.split(':').map(Number);
      
      // Create scheduled date for today
      const scheduledDate = new Date(today);
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
      
      // Try to create TurmaLesson
      const lesson = await prisma.turmaLesson.create({
        data: {
          turmaId: turma.id,
          lessonNumber: 1,
          title: `${turma.name} - Check-in ${today.toLocaleDateString('pt-BR')}`,
          scheduledDate: scheduledDate,
          duration: duration,
          status: 'SCHEDULED',
          notes: `Aula criada automaticamente para testes de check-in - ${today.toLocaleString('pt-BR')}`
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
      console.log(`   Horário: ${timeStr}`);
      console.log(`   Status: ${status}`);
      console.log(`   TurmaLesson ID: ${lesson.id}`);
      console.log('');
      
    } catch (error) {
      if (error.code === 'P2002') {
        // Já existe TurmaLesson para esta turma hoje
        results.push({
          turma: turma.name,
          time: timeStr,
          status: '⚠️ JÁ EXISTE',
          success: false,
          error: 'Duplicate'
        });
        console.log(`⚠️ ${turma.name} - JÁ EXISTE TurmaLesson para hoje`);
        console.log('');
      } else {
        results.push({
          turma: turma.name,
          time: timeStr,
          status: '❌ ERRO',
          success: false,
          error: error.message
        });
        console.log(`❌ ${turma.name} - Erro: ${error.message}`);
        console.log('');
      }
    }
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DA CRIAÇÃO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const successCount = results.filter(r => r.success).length;
  const duplicateCount = results.filter(r => r.error === 'Duplicate').length;
  const errorCount = results.filter(r => !r.success && r.error !== 'Duplicate').length;
  
  console.log(`✅ Criadas com sucesso: ${successCount}`);
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
      if (turma.lessonId) {
        console.log(`      TurmaLesson ID: ${turma.lessonId}`);
      }
    }
    console.log('');
  }
  
  console.log('');
  console.log('🧪 COMO TESTAR:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Recarregue o frontend do Check-in Kiosk');
  console.log('2. Digite "Pedro Teste" no autocomplete');
  console.log('3. Selecione o aluno');
  console.log('4. Você verá as turmas disponíveis com botões verdes "FAZER CHECK-IN"');
  console.log('5. Clique em qualquer botão verde para testar o check-in');
  console.log('6. Verifique o console para confirmar sucesso');
  console.log('');
  console.log('💡 Dica: Turmas com status 🟢 CHECK-IN ABERTO estão dentro da janela de check-in (30min antes a 15min depois)');
  console.log('');
  
} catch (error) {
  console.error('❌ Erro fatal:', error);
} finally {
  await prisma.$disconnect();
}

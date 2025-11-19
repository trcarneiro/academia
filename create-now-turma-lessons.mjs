import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  console.log('⏰ Criando TurmaLessons para AGORA (dentro da janela de check-in)...\n');

  // Pegar 3 turmas ativas
  const turmas = await prisma.turma.findMany({
    where: { isActive: true, organizationId: ORG_ID },
    select: { id: true, name: true },
    take: 3
  });

  console.log(`📚 Turmas encontradas: ${turmas.length}\n`);

  const now = new Date();
  const results = { created: 0, alreadyExists: 0, errors: 0 };

  // Criar 3 turmas: +10min, +15min, +20min
  const offsets = [10, 15, 20];

  for (let i = 0; i < turmas.length && i < offsets.length; i++) {
    const turma = turmas[i];
    const offset = offsets[i];
    
    // Calcular horário: AGORA + offset minutos
    const scheduledDate = new Date(now.getTime() + offset * 60 * 1000);
    
    // Janela de check-in: 30min antes até 15min depois
    const checkInStart = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
    const checkInEnd = new Date(scheduledDate.getTime() + 15 * 60 * 1000);
    
    // Verificar se AGORA está dentro da janela
    const isOpen = now >= checkInStart && now <= checkInEnd;
    
    console.log(`🕐 Turma ${i + 1}: ${turma.name}`);
    console.log(`   Horário agendado: ${scheduledDate.toLocaleTimeString('pt-BR')}`);
    console.log(`   Check-in abre: ${checkInStart.toLocaleTimeString('pt-BR')}`);
    console.log(`   Check-in fecha: ${checkInEnd.toLocaleTimeString('pt-BR')}`);
    console.log(`   Status: ${isOpen ? '✅ ABERTO AGORA' : '⏸️ Fechado'}`);

    try {
      // DELETAR qualquer TurmaLesson existente para esta turma hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await prisma.turmaLesson.deleteMany({
        where: {
          turmaId: turma.id,
          scheduledDate: {
            gte: today,
            lt: tomorrow
          }
        }
      });
      
      // Criar nova
      await prisma.turmaLesson.create({
        data: {
          turmaId: turma.id,
          title: `${turma.name} - Check-in Teste`,
          scheduledDate,
          duration: 90,
          lessonNumber: 9000 + i // Número alto para não conflitar
        }
      });
      
      console.log(`   ✅ TurmaLesson criada com sucesso!\n`);
      results.created++;
      
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}\n`);
      results.errors++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Criadas: ${results.created}`);
  console.log(`⚠️ Já existiam: ${results.alreadyExists}`);
  console.log(`❌ Erros: ${results.errors}`);
  console.log(`📚 Total: ${results.created + results.alreadyExists}`);
  console.log('\n💡 Agora recarregue o kiosk e selecione Pedro Teste!');
  console.log('   As turmas devem aparecer com botão verde "FAZER CHECK-IN"');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Diagnosticando Turmas de Teste...');

  // 1. Verificar Hora do Servidor
  const now = new Date();
  console.log(`🕒 Hora do Servidor (new Date()): ${now.toString()}`);
  console.log(`🕒 Hora do Servidor (ISO): ${now.toISOString()}`);

  // 2. Listar Organizações
  const orgs = await prisma.organization.findMany();
  console.log(`🏢 Organizações encontradas: ${orgs.length}`);
  orgs.forEach(org => console.log(`   - [${org.id}] ${org.name}`));

  // 3. Buscar a Turma de Teste criada
  const turma = await prisma.turma.findFirst({
    where: { name: 'TURMA TESTE CHECKIN (15min)' },
    include: { lessons: true }
  });

  if (!turma) {
    console.log('❌ Turma de teste NÃO encontrada no banco.');
    return;
  }

  console.log(`✅ Turma encontrada: ${turma.name} (${turma.id})`);
  console.log(`   - OrganizationId: ${turma.organizationId}`);
  console.log(`   - Status: ${turma.status}`);
  console.log(`   - IsActive: ${turma.isActive}`);

  // 4. Verificar Aulas (Lessons)
  console.log(`📚 Aulas associadas: ${turma.lessons.length}`);
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const lessonsToday = turma.lessons.filter(l => 
    l.scheduledDate >= todayStart && l.scheduledDate <= todayEnd
  );

  console.log(`📅 Aulas agendadas para HOJE (${todayStart.toISOString()} - ${todayEnd.toISOString()}): ${lessonsToday.length}`);

  lessonsToday.slice(0, 5).forEach(l => {
    console.log(`   - [${l.id}] ${l.title} | Data: ${l.scheduledDate.toISOString()} | Status: ${l.status}`);
  });

  // 5. Simular Lógica de Disponibilidade
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  console.log(`⏱️ Hora atual para comparação: ${currentTimeStr}`);

  lessonsToday.forEach(lesson => {
    const scheduledDate = new Date(lesson.scheduledDate);
    const startTime = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
    
    // Check-in window logic from route
    const checkInOpensTime = subtractMinutes(startTime, 30);
    const checkInClosesTime = addMinutes(startTime, 15);

    const isCheckInOpen = currentTimeStr >= checkInOpensTime && currentTimeStr <= checkInClosesTime;

    if (isCheckInOpen) {
      console.log(`   ✅ CHECK-IN ABERTO para aula das ${startTime} (Janela: ${checkInOpensTime} - ${checkInClosesTime})`);
    } else {
      // console.log(`   ❌ Check-in fechado para aula das ${startTime} (Janela: ${checkInOpensTime} - ${checkInClosesTime})`);
    }
  });
}

function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m - minutes);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m + minutes);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

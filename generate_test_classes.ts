
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando geração de turmas de teste...');

  // 1. Buscar dados necessários
  const organization = await prisma.organization.findFirst();
  if (!organization) throw new Error('Nenhuma organização encontrada');

  const course = await prisma.course.findFirst();
  if (!course) throw new Error('Nenhum curso encontrado');

  const instructor = await prisma.user.findFirst({
    where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } }
  });
  if (!instructor) throw new Error('Nenhum instrutor encontrado');

  console.log(`Usando: Org=${organization.name}, Curso=${course.name}, Instrutor=${instructor.firstName}`);

  // 2. Criar Turma de Teste
  const turma = await prisma.turma.create({
    data: {
      organizationId: organization.id,
      courseId: course.id,
      instructorId: instructor.id,
      name: 'TURMA TESTE CHECKIN (15min)',
      description: 'Turma gerada automaticamente para testes de check-in',
      startDate: new Date(),
      schedule: { days: [new Date().getDay()], time: '00:00' }, // Dummy schedule
      isActive: true,
      status: 'SCHEDULED'
    }
  });

  console.log(`Turma criada: ${turma.name} (${turma.id})`);

  // 3. Gerar Aulas (Lessons) de 15 em 15 min até 23:00
  const now = new Date();
  // Começar do próximo intervalo de 15 min
  const startMinutes = Math.ceil(now.getMinutes() / 15) * 15;
  now.setMinutes(startMinutes, 0, 0);

  const endTime = new Date();
  endTime.setHours(23, 0, 0, 0);

  let currentTime = new Date(now);
  let lessonCount = 1;

  while (currentTime <= endTime) {
    const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
    
    await prisma.turmaLesson.create({
      data: {
        turmaId: turma.id,
        lessonNumber: lessonCount,
        title: `Aula Teste ${timeString}`,
        scheduledDate: new Date(currentTime),
        status: 'SCHEDULED',
        duration: 15, // 15 min de duração
        isActive: true
      }
    });

    console.log(`Aula criada: ${timeString}`);
    
    // Avançar 15 min
    currentTime.setMinutes(currentTime.getMinutes() + 15);
    lessonCount++;
  }

  console.log('Geração concluída!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

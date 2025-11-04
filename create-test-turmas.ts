/**
 * Script para criar turmas de teste para validação do check-in
 * 
 * Cria múltiplas turmas com diferentes horários para testar:
 * - Janela de check-in (30 minutos antes)
 * - Status AVAILABLE, NOT_YET, EXPIRED
 * - Auto-enrollment no check-in
 * - Múltiplas turmas para o mesmo aluno
 */

import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

// IDs fixos do sistema
const ORGANIZATION_ID = 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
const STUDENT_ID = '93c60d89-c610-4948-87fc-23b0e7925ab1';
const INSTRUCTOR_ID = '65577494-1b8b-42d9-9264-ce61e3a3652e';
const COURSE_ID = 'krav-maga-faixa-branca-2025';
const UNIT_ID = '840518cb-f116-472f-95f3-bd9f137dff07';

interface TestTurma {
  name: string;
  description: string;
  time: string; // HH:mm formato 24h
  dayOfWeek: number; // 0=domingo, 1=segunda, ..., 6=sábado
  duration: number; // minutos
  maxStudents: number;
  expectedStatus: 'NOT_YET' | 'AVAILABLE' | 'EXPIRED';
}

async function main() {
  console.log('🏗️  CRIANDO TURMAS DE TESTE PARA CHECK-IN\n');
  console.log('📅 Data/Hora atual:', dayjs().format('DD/MM/YYYY HH:mm:ss'));
  console.log('🌍 Timezone:', dayjs.tz.guess());
  console.log('');

  // Obter hora atual em Brasília
  const now = dayjs().tz('America/Sao_Paulo');
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const todayDayOfWeek = now.day(); // 0=domingo, 6=sábado

  console.log(`⏰ Hora atual: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
  console.log(`📆 Dia da semana: ${todayDayOfWeek} (0=dom, 1=seg, ..., 6=sáb)`);
  console.log('');

  // Definir turmas de teste com horários relativos à hora atual
  const testTurmas: TestTurma[] = [
    // 1. EXPIRED - Aula que já passou (2 horas atrás)
    {
      name: 'Teste Check-in - EXPIRED',
      description: 'Turma para testar status EXPIRED (aula já passou há 2 horas)',
      time: dayjs().subtract(2, 'hour').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'EXPIRED'
    },

    // 2. NOT_YET - Aula daqui a 1 hora (fora da janela de 30min)
    {
      name: 'Teste Check-in - NOT_YET (1h)',
      description: 'Turma para testar status NOT_YET (aula em 1 hora, janela abre em 30min)',
      time: dayjs().add(1, 'hour').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'NOT_YET'
    },

    // 3. AVAILABLE - Aula daqui a 20 minutos (dentro da janela)
    {
      name: 'Teste Check-in - AVAILABLE (20min)',
      description: 'Turma para testar status AVAILABLE (aula em 20 minutos, dentro da janela)',
      time: dayjs().add(20, 'minute').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'AVAILABLE'
    },

    // 4. AVAILABLE - Aula AGORA (início exato)
    {
      name: 'Teste Check-in - AVAILABLE (NOW)',
      description: 'Turma para testar check-in no horário exato de início',
      time: dayjs().format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'AVAILABLE'
    },

    // 5. AVAILABLE - Aula iniciada há 10 minutos (late check-in)
    {
      name: 'Teste Check-in - LATE',
      description: 'Turma para testar check-in atrasado (aula iniciou há 10 minutos)',
      time: dayjs().subtract(10, 'minute').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'AVAILABLE'
    },

    // 6. NOT_YET - Aula daqui a 2 horas
    {
      name: 'Teste Check-in - NOT_YET (2h)',
      description: 'Turma para testar status NOT_YET (aula em 2 horas)',
      time: dayjs().add(2, 'hour').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'NOT_YET'
    },

    // 7. AVAILABLE - Aula daqui a 25 minutos (limite da janela)
    {
      name: 'Teste Check-in - AVAILABLE (25min)',
      description: 'Turma para testar status AVAILABLE no limite da janela (25 minutos antes)',
      time: dayjs().add(25, 'minute').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'AVAILABLE'
    },

    // 8. NOT_YET - Aula daqui a 35 minutos (fora da janela por 5min)
    {
      name: 'Teste Check-in - NOT_YET (35min)',
      description: 'Turma para testar status NOT_YET (35 minutos antes, janela abre em 5min)',
      time: dayjs().add(35, 'minute').format('HH:mm'),
      dayOfWeek: todayDayOfWeek,
      duration: 60,
      maxStudents: 20,
      expectedStatus: 'NOT_YET'
    },
  ];

  console.log('📋 TURMAS A SEREM CRIADAS:\n');
  testTurmas.forEach((turma, index) => {
    const turmaTime = dayjs().set('hour', parseInt(turma.time.split(':')[0])).set('minute', parseInt(turma.time.split(':')[1]));
    const diffMinutes = turmaTime.diff(now, 'minute');
    const diffText = diffMinutes > 0 ? `em ${diffMinutes} minutos` : `há ${Math.abs(diffMinutes)} minutos`;
    
    console.log(`${index + 1}. ${turma.name}`);
    console.log(`   Horário: ${turma.time} (${diffText})`);
    console.log(`   Status Esperado: ${turma.expectedStatus}`);
    console.log(`   Descrição: ${turma.description}`);
    console.log('');
  });

  // Confirmar antes de criar
  console.log('⚠️  ATENÇÃO: Esse script vai criar turmas de teste no banco de dados!');
  console.log('');

  // Criar turmas
  let createdCount = 0;
  let errorCount = 0;

  for (const turma of testTurmas) {
    try {
      console.log(`🔨 Criando turma: ${turma.name}...`);

      // Criar Turma
      const createdTurma = await prisma.turma.create({
        data: {
          organizationId: ORGANIZATION_ID,
          courseId: COURSE_ID,
          name: turma.name,
          description: turma.description,
          classType: 'COLLECTIVE',
          status: 'SCHEDULED',
          instructorId: INSTRUCTOR_ID,
          maxStudents: turma.maxStudents,
          startDate: dayjs().toDate(),
          endDate: null,
          schedule: {
            time: turma.time,
            duration: turma.duration,
            daysOfWeek: [turma.dayOfWeek]
          },
          unitId: UNIT_ID,
          requireAttendanceForProgress: false,
          isActive: true
        }
      });

      console.log(`   ✅ Turma criada: ${createdTurma.id}`);

      // Associar curso à turma
      await prisma.turmaCourse.create({
        data: {
          turmaId: createdTurma.id,
          courseId: COURSE_ID
        }
      });

      console.log(`   ✅ Curso associado`);

      // Criar aula de hoje
      const lessonDate = dayjs()
        .set('hour', parseInt(turma.time.split(':')[0]))
        .set('minute', parseInt(turma.time.split(':')[1]))
        .set('second', 0)
        .set('millisecond', 0)
        .toDate();

      const lesson = await prisma.turmaLesson.create({
        data: {
          turmaId: createdTurma.id,
          lessonPlanId: null,
          lessonNumber: 1,
          title: `Aula Teste - ${turma.name}`,
          scheduledDate: lessonDate,
          status: 'SCHEDULED',
          duration: turma.duration
        }
      });

      console.log(`   ✅ Aula criada: ${lesson.id} às ${turma.time}`);
      console.log(`   📅 scheduledDate: ${dayjs(lesson.scheduledDate).format('DD/MM/YYYY HH:mm:ss')}`);
      console.log('');

      createdCount++;
    } catch (error) {
      console.error(`   ❌ Erro ao criar turma ${turma.name}:`, error);
      errorCount++;
    }
  }

  console.log('');
  console.log('📊 RESUMO:');
  console.log(`   ✅ Turmas criadas: ${createdCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('   1. Acesse o Check-in Kiosk: http://localhost:3000/views/checkin-kiosk.html');
  console.log('   2. Selecione o aluno: Thiago Carneiro');
  console.log('   3. Verifique os status das aulas:');
  console.log('      - EXPIRED (vermelho): Aula já passou');
  console.log('      - NOT_YET (amarelo): Aula futura, check-in ainda não disponível');
  console.log('      - AVAILABLE (verde): Check-in disponível AGORA');
  console.log('');
  console.log('🧪 TESTES A VALIDAR:');
  console.log('   ✅ Status corretos (AVAILABLE, NOT_YET, EXPIRED)');
  console.log('   ✅ Janela de 30 minutos antes funcionando');
  console.log('   ✅ Check-in atrasado marcado como LATE');
  console.log('   ✅ Auto-enrollment criando TurmaStudent');
  console.log('   ✅ Múltiplas turmas visíveis para o mesmo aluno');
  console.log('');
  console.log('🧹 PARA LIMPAR DEPOIS:');
  console.log('   npx tsx cleanup-test-turmas.ts');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay, setHours, setMinutes, getDay, format } from 'date-fns';

const prisma = new PrismaClient();

const ORGANIZATION_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
const STUDENT_ID = '0d198d92-c51d-4532-962e-6076688928d0';
const INSTRUCTOR_ID = '76de5de7-0ed0-402f-8494-1d9cdf344534';

async function main() {
  console.log('🚀 Iniciando geração de aulas (Schema v2)...');

  // 1. Get a Course ID (required for Turma)
  const course = await prisma.course.findFirst({
    where: { organizationId: ORGANIZATION_ID }
  });

  if (!course) {
    console.error('❌ Nenhum curso encontrado. Crie um curso primeiro.');
    return;
  }
  console.log(`📚 Usando curso: ${course.name} (${course.id})`);

  // 2. Define Classes to Create
  const classesToCreate = [
    {
      name: 'Krav Maga - Manhã (Seg/Qua/Sex)',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      time: '08:00',
      duration: 60
    },
    {
      name: 'Krav Maga - Almoço (Ter/Qui)',
      daysOfWeek: [2, 4], // Tue, Thu
      time: '12:00',
      duration: 45
    },
    {
      name: 'Krav Maga - Noite (Seg/Qua/Sex)',
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      time: '19:00',
      duration: 90
    },
    {
      name: 'Defesa Pessoal - Sábado',
      daysOfWeek: [6], // Sat
      time: '10:00',
      duration: 120
    },
    {
      name: 'Krav Maga - Domingo',
      daysOfWeek: [0], // Sun
      time: '09:00',
      duration: 60
    }
  ];

  let createdCount = 0;
  let lessonCount = 0;

  for (const cls of classesToCreate) {
    // Check if Turma exists
    let turma = await prisma.turma.findFirst({
      where: {
        organizationId: ORGANIZATION_ID,
        name: cls.name
      }
    });

    if (!turma) {
      console.log(`✨ Criando turma: ${cls.name}`);
      turma = await prisma.turma.create({
        data: {
          name: cls.name,
          description: `Aula de ${cls.name}`,
          organizationId: ORGANIZATION_ID,
          courseId: course.id,
          instructorId: INSTRUCTOR_ID,
          startDate: new Date(),
          status: 'ACTIVE',
          isActive: true,
          maxStudents: 20,
          schedule: {
            daysOfWeek: cls.daysOfWeek,
            time: cls.time,
            duration: cls.duration
          }
        }
      });
      createdCount++;
    } else {
      console.log(`ℹ️ Turma já existe: ${cls.name}`);
    }

    // Enroll Student
    const enrollment = await prisma.turmaStudent.findFirst({
      where: {
        turmaId: turma.id,
        studentId: STUDENT_ID
      }
    });

    if (!enrollment) {
      await prisma.turmaStudent.create({
        data: {
          turmaId: turma.id,
          studentId: STUDENT_ID,
          status: 'ACTIVE',
          isActive: true
        }
      });
      console.log(`   👤 Aluno matriculado na turma.`);
    }

    // Generate Lessons for next 7 days
    const today = startOfDay(new Date());
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayOfWeek = getDay(date);

      if (cls.daysOfWeek.includes(dayOfWeek)) {
        // Parse time
        const [hours, minutes] = cls.time.split(':').map(Number);
        const scheduledDate = setMinutes(setHours(date, hours), minutes);

        // Check if lesson exists
        const existingLesson = await prisma.turmaLesson.findFirst({
          where: {
            turmaId: turma.id,
            scheduledDate: scheduledDate
          }
        });

        if (!existingLesson) {
          // Get next lesson number
          const lastLesson = await prisma.turmaLesson.findFirst({
            where: { turmaId: turma.id },
            orderBy: { lessonNumber: 'desc' }
          });
          const nextLessonNumber = (lastLesson?.lessonNumber || 0) + 1;

          await prisma.turmaLesson.create({
            data: {
              turmaId: turma.id,
              lessonNumber: nextLessonNumber,
              title: `Aula ${format(scheduledDate, 'dd/MM')}`,
              scheduledDate: scheduledDate,
              duration: cls.duration,
              status: 'SCHEDULED',
              isActive: true
            }
          });
          lessonCount++;
          // console.log(`   📅 Aula criada para ${format(scheduledDate, 'dd/MM HH:mm')}`);
        }
      }
    }
  }

  console.log(`✅ ${createdCount} turmas criadas/verificadas.`);
  console.log(`✅ ${lessonCount} aulas agendadas.`);

  // 3. Simulate Check-in for TODAY (if any lesson exists)
  console.log('\n📍 Verificando aulas para HOJE...');
  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const todaysLessons = await prisma.turmaLesson.findMany({
    where: {
      turma: { organizationId: ORGANIZATION_ID },
      scheduledDate: {
        gte: startOfToday,
        lt: endOfToday
      }
    },
    include: { turma: true }
  });

  if (todaysLessons.length > 0) {
    console.log(`   Encontradas ${todaysLessons.length} aulas hoje.`);
    
    const lesson = todaysLessons[0];
    console.log(`   Tentando check-in na aula: ${lesson.turma.name} às ${format(lesson.scheduledDate, 'HH:mm')}`);

    // Check if enrollment exists (it should, we just did it)
    const enrollment = await prisma.turmaStudent.findFirst({
      where: { turmaId: lesson.turmaId, studentId: STUDENT_ID }
    });

    if (enrollment) {
      // Check if attendance exists
      const existingAttendance = await prisma.turmaAttendance.findFirst({
        where: {
          turmaLessonId: lesson.id,
          studentId: STUDENT_ID
        }
      });

      if (!existingAttendance) {
        await prisma.turmaAttendance.create({
          data: {
            turmaId: lesson.turmaId,
            turmaLessonId: lesson.id,
            turmaStudentId: enrollment.id,
            studentId: STUDENT_ID,
            present: true,
            checkedAt: new Date(),
            checkedBy: INSTRUCTOR_ID // Self check-in or instructor
          }
        });
        console.log(`✅ Check-in realizado com sucesso!`);
      } else {
        console.log(`⚠️ Check-in já existe.`);
      }
    } else {
      console.error(`❌ Aluno não matriculado na turma (inesperado).`);
    }

  } else {
    console.log(`⚠️ Nenhuma aula encontrada para hoje. Tente rodar o script novamente em um dia com aulas (ou ajuste os dias).`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

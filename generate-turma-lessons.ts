import { prisma } from './src/utils/database';
import dayjs from 'dayjs';

async function generateTurmaLessons() {
  console.log('🔄 Generating turma lessons for the next 4 weeks...\n');

  const turmas = await prisma.turma.findMany({
    where: { 
      isActive: true,
      status: { in: ['SCHEDULED', 'ACTIVE'] }
    },
    include: {
      course: { select: { name: true } },
    },
  });

  for (const turma of turmas) {
    const schedule = turma.schedule as any;
    if (!schedule?.daysOfWeek || !schedule?.time) {
      console.log(`⚠️ Turma ${turma.name} has invalid schedule, skipping`);
      continue;
    }

    console.log(`📚 Processing: ${turma.name}`);
    console.log(`   Schedule: ${schedule.daysOfWeek.join(', ')} at ${schedule.time}`);

    const [hours, minutes] = schedule.time.split(':').map(Number);
    const duration = schedule.duration || 60;
    
    // Generate lessons for the next 4 weeks
    const startDate = dayjs().startOf('day');
    const endDate = startDate.add(4, 'week');
    
    let lessonsCreated = 0;

    for (let date = startDate; date.isBefore(endDate); date = date.add(1, 'day')) {
      const dayOfWeek = date.day(); // 0=Sunday, 1=Monday, etc.
      
      if (schedule.daysOfWeek.includes(dayOfWeek)) {
        const lessonDateTime = date.hour(hours).minute(minutes).second(0);
        
        // Skip if lesson already exists
        const existing = await prisma.turmaLesson.findFirst({
          where: {
            turmaId: turma.id,
            scheduledDate: lessonDateTime.toDate(),
          },
        });

        if (existing) {
          console.log(`   ⏭️ Lesson already exists for ${lessonDateTime.format('YYYY-MM-DD HH:mm')}`);
          continue;
        }

        // Create the lesson
        await prisma.turmaLesson.create({
          data: {
            turmaId: turma.id,
            title: `${turma.name}`,
            scheduledDate: lessonDateTime.toDate(),
            duration,
            status: 'SCHEDULED',
            lessonNumber: lessonsCreated + 1,
          },
        });

        console.log(`   ✅ Created lesson for ${lessonDateTime.format('YYYY-MM-DD HH:mm')}`);
        lessonsCreated++;
      }
    }

    console.log(`   📊 Total lessons created: ${lessonsCreated}\n`);
  }

  console.log('🎉 Lesson generation completed!');
  await prisma.$disconnect();
}

generateTurmaLessons().catch(console.error);

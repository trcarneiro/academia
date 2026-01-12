
import { PrismaClient } from '@prisma/client';
import { TurmasService } from '../src/services/turmasService';

const prisma = new PrismaClient();
const turmasService = new TurmasService();

async function main() {
    console.log('🔄 Regenerating Class Schedules (Dynamic Course Lookup)...');

    // 1. Get Context (Org, Unit, Instructor)
    const org = await prisma.organization.findFirst();
    const unit = await prisma.unit.findFirst();
    const instructor = await prisma.instructor.findFirst({
        select: { id: true, userId: true }
    });

    // 1.1 Find Course with Lesson Plans
    const course = await prisma.course.findFirst({
        where: {
            name: { contains: 'Krav Maga', mode: 'insensitive' },
            lessonPlans: { some: {} } // Must have at least one lesson plan
        },
        include: {
            _count: {
                select: { lessonPlans: true }
            }
        }
    });

    if (!course) {
        throw new Error('❌ Could not find a Krav Maga course with lesson plans!');
    }

    console.log(`✅ Found Course: "${course.name}" (ID: ${course.id}) with ${course._count.lessonPlans} lesson plans.`);

    if (!org || !unit || !instructor) {
        throw new Error('Missing Organization, Unit, or Instructor for seeding');
    }

    // Define Classes
    const classesToCreate = [
        {
            name: 'Krav Maga - Ter/Qui 18h',
            schedule: { daysOfWeek: [2, 4], time: '18:00', duration: 60 },
            startLesson: 0
        },
        {
            name: 'Krav Maga - Seg/Qui 20h',
            schedule: { daysOfWeek: [1, 4], time: '20:00', duration: 60 },
            startLesson: 0
        },
        {
            name: 'Krav Maga - Sáb 10:30',
            schedule: { daysOfWeek: [6], time: '10:30', duration: 90 },
            startLesson: 0
        },
        {
            name: 'Krav Maga - Seg/Qua 19h (No Meio)',
            schedule: { daysOfWeek: [1, 3], time: '19:00', duration: 60 },
            startLesson: 24 // Start in the middle
        }
    ];

    for (const cls of classesToCreate) {
        console.log(`\nProcessing: ${cls.name}...`);

        // 2. Check if exists and delete (Cleanup)
        const existing = await prisma.turma.findFirst({
            where: { name: cls.name }
        });

        if (existing) {
            console.log(` - Deleting existing turma: ${existing.id}`);
            await turmasService.delete(existing.id);
        }

        // 3. Create new
        console.log(' - Creating new turma...');
        const created = await turmasService.create({
            name: cls.name,
            courseId: course.id,
            type: 'COLLECTIVE',
            startDate: new Date().toISOString(),
            instructorId: instructor.userId, // 🔥 USING USER ID
            organizationId: org.id,
            unitId: unit.id,
            schedule: cls.schedule,
            maxStudents: 20
        });

        console.log(` - Created Turma ID: ${created.id}`);

        // EXPLICITLY REGENERATE TO ENSURE LESSONS ARE CREATED
        // Even for startLesson=0, this ensures we verify creation
        const startIndex = cls.startLesson || 0;

        console.log(` - Regenerating schedule starting from lesson index ${startIndex}...`);
        let lessons = [];
        try {
            lessons = await turmasService.regenerateSchedule(created.id, startIndex);
            console.log(` - Generated ${lessons.length} lessons starting from index ${startIndex}.`);
        } catch (error) {
            console.error('❌ Error regenerating schedule:', error);
        }

        if (lessons.length > 0) {
            console.log(`   First lesson: [${lessons[0].lessonNumber}] ${lessons[0].title} (Date: ${lessons[0].scheduledDate.toISOString()})`);

            // Check for specific lesson number in the "Middle" case
            if (startIndex > 0) {
                const expectedLessonNum = startIndex + 1;
                if (lessons[0].lessonNumber === expectedLessonNum) {
                    console.log(`   ✅ Correctly started at Lesson ${expectedLessonNum}`);
                } else {
                    console.warn(`   ⚠️ Expected Lesson ${expectedLessonNum} but got ${lessons[0].lessonNumber}`);
                }
            }
        } else {
            console.warn('   ⚠️ No lessons generated! Check course configuration.');
        }
    }

    console.log('\n✅ All schedules regenerated successfully based on request!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

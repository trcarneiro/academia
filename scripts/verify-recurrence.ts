
import { RecurrenceService } from '@/services/recurrenceService';
import { prisma } from '@/utils/database';
import dayjs from 'dayjs';

async function verifyRecurrence() {
    console.log('🧪 Starting Recurrence Verification...');

    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    const course = await prisma.course.findFirst({ where: { organizationId: orgId } });
    const instructor = await prisma.instructor.findFirst({ where: { organizationId: orgId } });

    if (!course || !instructor) throw new Error('Setup failed: Course/Instructor missing');

    // Cleanup prev test
    const existing = await prisma.turma.findFirst({ where: { name: 'TEST_RECURRENCE_AUTO' } });
    if (existing) {
        await prisma.turmaLesson.deleteMany({ where: { turmaId: existing.id } });
        await prisma.turma.delete({ where: { id: existing.id } });
        console.log('🧹 Cleanup done');
    }

    // 1. Create Turma (Mon/Wed 10:00)
    console.log('\n📝 1. Creating Turma (Mon/Wed 10:00)...');
    const turma = await prisma.turma.create({
        data: {
            organizationId: orgId,
            courseId: course.id,
            instructorId: instructor.userId!, // Assuming User relation fix or using instructor.userId
            name: 'TEST_RECURRENCE_AUTO',
            startDate: new Date(),
            status: 'ACTIVE',
            isActive: true,
            schedule: {
                days: [1, 3], // Mon, Wed
                startTime: '10:00',
                duration: 60
            }
        }
    });

    // 2. Trigger Initial Generation
    console.log('⚙️ Generating initial lessons...');
    await RecurrenceService.generateLessonsForTurma(turma.id);

    const lessonsCount = await prisma.turmaLesson.count({ where: { turmaId: turma.id } });
    console.log(`✅ Lessons generated: ${lessonsCount} (Should be ~52 for 6 months * 2/week)`);

    // 3. Select a future lesson to "Attend" (Mark as preserved)
    const futureLessons = await prisma.turmaLesson.findMany({
        where: { turmaId: turma.id },
        orderBy: { scheduledDate: 'asc' },
        take: 5
    });

    const lessonToKeep = futureLessons[2]; // 3rd lesson
    console.log(`📌 Simulating attendance on lesson: ${lessonToKeep.title} (${lessonToKeep.scheduledDate})`);

    // Create dummy student and attendance
    const student = await prisma.student.findFirst({ where: { organizationId: orgId } });
    if (student) {
        // Must link student to Turma first
        const ts = await prisma.turmaStudent.create({
            data: { turmaId: turma.id, studentId: student.id }
        });
        await prisma.turmaAttendance.create({
            data: {
                turmaId: turma.id,
                turmaLessonId: lessonToKeep.id,
                studentId: student.id,
                turmaStudentId: ts.id,
                present: true
            }
        });
        console.log('✅ Attendance created (Lesson is now "protected")');
    } else {
        console.warn('⚠️ No student found, skipping attendance test');
    }

    // 4. Change Schedule to Tue/Thu creates mismatch
    console.log('\n🔄 4. Changing Schedule to Tue/Thu 14:00...');
    await prisma.turma.update({
        where: { id: turma.id },
        data: {
            schedule: {
                days: [2, 4], // Tue, Thu
                startTime: '14:00',
                duration: 60
            }
        }
    });

    // 5. Trigger Reconciliation
    console.log('⚙️ Running Reconciliation...');
    await RecurrenceService.generateLessonsForTurma(turma.id);

    // 6. Verify Results
    console.log('\n🔍 Verifying Results...');
    const newLessons = await prisma.turmaLesson.findMany({
        where: { turmaId: turma.id },
        orderBy: { scheduledDate: 'asc' }
    });

    const preserved = newLessons.find(l => l.id === lessonToKeep.id);
    const totalCount = newLessons.length;

    if (preserved) {
        console.log('✅ PROTECTED lesson was preserved!');
    } else {
        console.error('❌ FAIL: Protected lesson was deleted!');
    }

    // Check if dates are now mostly Tue/Thu
    let tueThuCount = 0;
    let monWedCount = 0;
    newLessons.forEach(l => {
        const day = dayjs(l.scheduledDate).day();
        if (day === 2 || day === 4) tueThuCount++;
        if (day === 1 || day === 3) monWedCount++;
    });

    console.log(`📊 Stats: Tue/Thu (New): ${tueThuCount}, Mon/Wed (Old/Preserved): ${monWedCount}`);

    if (tueThuCount > 40 && monWedCount <= 1) { // 1 protected
        console.log('✅ Reconciliation Successful: Shifted to new schedule');
    } else {
        console.warn('⚠️ Verification ambiguous - check stats manually');
    }

}

verifyRecurrence()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

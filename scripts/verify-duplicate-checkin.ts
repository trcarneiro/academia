
import { AttendanceService } from '@/services/attendanceService';
import { prisma } from '@/utils/database';
import dayjs from 'dayjs';

async function verifyDuplicateCheckin() {
    console.log('🧪 Starting Duplicate Check-in Verification...');

    // 1. Setup: Find/Create Turma for TODAY
    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

    // Clean up any prev test lesson
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    // Find a student
    const student = await prisma.student.findFirst({ where: { organizationId: orgId } });
    if (!student) throw new Error('No student found');

    // Find a Turma
    const turma = await prisma.turma.findFirst({ where: { organizationId: orgId, isActive: true } });
    if (!turma) throw new Error('No active turma found');

    // Create or Find a Lesson for TODAY
    let lesson = await prisma.turmaLesson.findFirst({
        where: {
            turmaId: turma.id,
            scheduledDate: { gte: todayStart, lte: todayEnd }
        }
    });

    if (!lesson) {
        console.log('📝 Creating ad-hoc lesson for today...');
        const now = new Date();
        lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                lessonNumber: 999,
                title: 'Aula Teste Duplicidade',
                scheduledDate: now,
                duration: 60,
                status: 'SCHEDULED'
            }
        });
    }

    // Cleanup existing attendance for this lesson/student to ensure clean state
    await prisma.turmaAttendance.deleteMany({
        where: {
            turmaLessonId: lesson.id,
            studentId: student.id
        }
    });

    // 2. First Check-in (Should Succeed)
    console.log(`attempt 1: Checking in... Student: ${student.id}, Lesson: ${lesson.id}`);
    try {
        const result1 = await AttendanceService.checkInToClass(student.id, {
            classId: lesson.id,
            method: 'MANUAL',
            location: 'TEST_SCRIPT'
        });
        console.log('✅ First Check-in Successful:', result1.id);

        // VERIFY DB STATE IMMEDIATELY
        const checkDb = await prisma.turmaAttendance.findMany({
            where: { turmaLessonId: lesson.id, studentId: student.id }
        });
        console.log('🔍 DB Verification after 1st Check-in:', checkDb.length, 'records found.');
        if (checkDb.length > 0) console.log('Record ID:', checkDb[0].id);

    } catch (err) {
        console.error('❌ First Check-in FAILED:', err);
        process.exit(1);
    }

    // 3. Second Check-in (Should Fail)
    console.log(`attempt 2: Checking in again (Expect Error)... Student: ${student.id}, Lesson: ${lesson.id}`);
    try {
        await AttendanceService.checkInToClass(student.id, {
            classId: lesson.id,
            method: 'MANUAL',
            location: 'TEST_SCRIPT'
        });
        console.error('❌ FAIL: Second Check-in SUCCEEDED (Should have failed!)');
    } catch (err: any) {
        if (err.message.includes('Check-in já realizado') || err.message.includes('Check-in jÃ¡ realizado')) {
            console.log('✅ SUCCESS: Duplicate Check-in Blocked as expected.');
            console.log('Error message received:', err.message);
        } else {
            console.error('⚠️ Unexpected error message:', err.message);
            console.error(err);
        }
    }

    // Cleanup ad-hoc lesson if we created it? No, keep for audit.
}

verifyDuplicateCheckin()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

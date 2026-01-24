
import { PrismaClient } from '@prisma/client';
import { addHours, addDays, startOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

async function createTestCheckinClasses() {
    console.log('🧪 Creating Test Classes for Check-in Scenarios (FIXED)...\n');

    try {
        // 1. Prerequisites
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('No Organization found.');

        const unit = await prisma.unit.findFirst({ where: { organizationId: org.id } });
        if (!unit) throw new Error('No Unit found.');

        // Find or create a course (Use something generic if Krav Maga not found)
        let course = await prisma.course.findFirst({ where: { organizationId: org.id, name: { contains: 'Krav Maga' } } });
        if (!course) {
            course = await prisma.course.findFirst({ where: { organizationId: org.id } });
        }
        if (!course) throw new Error('No Course found.');

        // Find an instructor
        const instructor = await prisma.instructor.findFirst({ where: { organizationId: org.id } });
        if (!instructor) throw new Error('No Instructor found.');

        // Find a student to enroll (Test Student via User Name)
        // Fixed: Query via user relation
        const student = await prisma.student.findFirst({
            where: {
                organizationId: org.id,
                user: { firstName: { contains: 'Thiago' } }
            },
            include: { user: true }
        }) || await prisma.student.findFirst({
            where: { organizationId: org.id },
            include: { user: true }
        });

        if (!student) throw new Error('No Student found to enroll.');

        console.log(`🔹 Context: Org=${org.name}, Unit=${unit.name}, Instructor=${instructor.userId}`);
        console.log(`🔹 Target Student: ${student.user.firstName} ${student.user.lastName} (ID: ${student.id})`);

        // 2. Define Scenarios
        const now = new Date();
        const twoHoursFromNow = addHours(now, 2);

        // Helper to schedule a class
        const createClass = async (title: string, startDate: Date, startTimeStr: string, days: number[]) => {
            console.log(`   Creating Turma: "${title}" starts ${startDate.toISOString()} at ${startTimeStr}`);

            // Create Turma
            const turma = await prisma.turma.create({
                data: {
                    name: title,
                    description: 'Test class for Check-in Kiosk validation',
                    courseId: course!.id,
                    instructorId: instructor.userId, // Fixed: Use available userId field
                    organizationId: org.id,
                    unitId: unit.id,
                    classType: 'COLLECTIVE', // Fixed enum
                    startDate: startOfDay(startDate), // Start of the day
                    maxStudents: 20,
                    status: 'active', // Should likely be mapped to enum but Prisma might accept string if matches
                    schedule: {
                        daysOfWeek: days,
                        startTime: startTimeStr, // "HH:MM"
                        durationMinutes: 60
                    }
                }
            });

            // Create Lesson (TurmaLesson)
            // Fixed: use prisma.turmaLesson
            const targetDay = startDate.getDay(); // 0-6
            if (days.includes(targetDay)) {
                // Create specific lesson for this test date
                const lessonStart = new Date(startDate);
                const [h, m] = startTimeStr.split(':').map(Number);
                lessonStart.setHours(h, m, 0, 0);

                await prisma.turmaLesson.create({
                    data: {
                        turmaId: turma.id,
                        scheduledDate: lessonStart, // Fixed field name
                        lessonNumber: 1,
                        title: `${title} - Lesson 1`,
                        status: 'SCHEDULED', // Fixed status enum
                        duration: 60
                    }
                });
                console.log(`      ✅ Lesson created for: ${lessonStart.toLocaleString()}`);
            }

            // Enroll Student
            // Check if already enrolled? No, new turma.
            await prisma.turmaStudent.create({
                data: {
                    turmaId: turma.id,
                    studentId: student!.id,
                    status: 'ACTIVE',
                    enrolledAt: new Date()
                }
            });
            console.log(`      ✅ Student enrolled.`);

            return turma;
        };

        // SCENARIO A: Class NOW
        const timeNow = format(now, 'HH:mm');
        const dayOfWeek = now.getDay();
        await createClass(`TEST: AULA AGORA (${timeNow})`, now, timeNow, [dayOfWeek]);

        // SCENARIO B: Class in 2 Hours
        const timePlus2h = format(twoHoursFromNow, 'HH:mm');
        await createClass(`TEST: DAQUI 2 HORAS (${timePlus2h})`, twoHoursFromNow, timePlus2h, [dayOfWeek]);

        // SCENARIO C: Class Tomorrow
        const tomorrow = addDays(now, 1);
        const timeTomorrow = '10:00';
        const dayTomorrow = tomorrow.getDay();
        await createClass(`TEST: AMANHÃ (10:00)`, tomorrow, timeTomorrow, [dayTomorrow]);

        console.log('\n✅ All Test Classes Created Successfully!');

    } catch (e) {
        console.error('❌ Error creating test classes:', e);
    } finally {
        await prisma.$disconnect();
    }
}

createTestCheckinClasses();

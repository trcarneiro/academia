
import { GraduationService } from '../src/services/graduationService';
import { prisma } from '../src/utils/database';
import { logger } from '../src/utils/logger';

async function testGraduationFlow() {
    console.log('🥋 Starting Graduation Service Integration Test...');

    const timestamp = Date.now();
    const orgId = 'test-org-' + timestamp; // We might need a real org ID if FK constraints are strict

    try {
        // 1. Setup Data - We need to find valid Organization first or create one if possible
        // For safety, let's try to find the first existing organization
        const org = await prisma.organization.findFirst();
        if (!org) {
            throw new Error('No organization found to run tests against.');
        }

        console.log(`Using Organization: ${org.name} (${org.id})`);

        // Create a Test User & Student
        const user = await prisma.user.create({
            data: {
                email: `test-grad-${timestamp}@example.com`,
                password: 'hash',
                firstName: 'Karate',
                lastName: 'Kid',
                role: 'STUDENT',
                organization: { connect: { id: org.id } }
            }
        });

        const student = await prisma.student.create({
            data: {
                userId: user.id,
                organizationId: org.id,
                specialNeeds: [],
                preferredDays: [],
                preferredTimes: []
            }
        });

        console.log(`✅ Created Student: ${student.id}`);

        // Create a Course
        const course = await prisma.course.create({
            data: {
                name: `Miyagi-Do Karate ${timestamp}`,
                organizationId: org.id,
                description: 'Wax on, wax off',
                level: 'BEGINNER',
                duration: 60,
                totalClasses: 100,
                prerequisites: [],
                objectives: [],
                requirements: []
            }
        });

        // Enroll Student
        await prisma.courseEnrollment.create({
            data: {
                studentId: student.id,
                courseId: course.id,
                expectedEndDate: new Date(),
                gender: 'MASCULINO'
            }
        });

        // Create Martial Art & Progression (Needed for GraduationService)
        const martialArt = await prisma.martialArt.create({
            data: {
                name: `Karate Style ${timestamp}`,
                organizationId: org.id
            }
        });

        await prisma.studentProgression.create({
            data: {
                studentId: student.id,
                martialArtId: martialArt.id,
                currentGrade: 'White Belt',
                nextGrade: 'Yellow Belt'
            }
        });

        // 2. Test listStudentsWithProgress
        console.log('🧪 Testing listStudentsWithProgress...');
        const list = await GraduationService.listStudentsWithProgress(org.id, { courseId: course.id });
        if (list.length > 0 && list[0].id === student.id) {
            console.log('✅ listStudentsWithProgress returned key student.');
        } else {
            console.warn('⚠️ listStudentsWithProgress did not return the expected student.', list);
        }

        // 3. Test Attributes Calculation (Simulate Attendance)
        console.log('🧪 Simulating Attendance...');
        // Create a dummy class
        const cls = await prisma.class.create({
            data: {
                organizationId: org.id,
                courseId: course.id,
                instructorId: (await prisma.instructor.findFirst()).id, // Grab first instructor
                date: new Date(),
                startTime: new Date(),
                endTime: new Date(),
                status: 'COMPLETED'
            }
        });

        await prisma.attendance.create({
            data: {
                organizationId: org.id,
                studentId: student.id,
                classId: cls.id,
                status: 'PRESENT'
            }
        });

        const stats = await GraduationService.calculateStudentStats(student.id, course.id);
        console.log('📊 Student Stats:', stats);
        if (stats.attendanceRate >= 1) { // We manually counted attendance as rate in our impl for now
            console.log('✅ Attendance detected in stats');
        }

        // 4. Test Approve Graduation
        console.log('🧪 Testing Approve Graduation...');
        await GraduationService.approveGraduation(student.id, course.id, 'admin-id', { toBelt: 'Yellow Belt' });

        const updatedProgression = await prisma.studentProgression.findFirst({
            where: { studentId: student.id, martialArtId: martialArt.id }
        });

        if (updatedProgression.currentGrade === 'Yellow Belt') {
            console.log('✅ Graduation Approved: Student is now Yellow Belt');
        } else {
            console.error('❌ Graduation Approval Failed', updatedProgression);
        }

        console.log('🧹 Cleaning up...');
        // Cleanup with proper order for FK constraints
        await prisma.attendance.deleteMany({ where: { studentId: student.id } });
        await prisma.studentProgression.deleteMany({ where: { studentId: student.id } });
        await prisma.courseEnrollment.deleteMany({ where: { studentId: student.id } });
        await prisma.class.deleteMany({ where: { courseId: course.id } });

        await prisma.student.delete({ where: { id: student.id } });
        await prisma.user.delete({ where: { id: user.id } });

        await prisma.course.delete({ where: { id: course.id } });
        await prisma.martialArt.delete({ where: { id: martialArt.id } });

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGraduationFlow();

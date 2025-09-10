import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCoursesSerialization() {
    try {
        console.log('🔍 Testing course serialization...');
        
        const studentId = 'daf64ff0-1c1f-4f10-8228-7e1bac509104';
        
        const studentCourses = await prisma.studentCourse.findMany({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        category: true,
                        duration: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        date: true,
                        startTime: true,
                        endTime: true,
                        status: true
                    }
                }
            }
        });

        console.log('Raw Prisma result length:', studentCourses.length);
        console.log('First result:', JSON.stringify(studentCourses[0], null, 2));

        const mapped = studentCourses.map(sc => ({
            id: sc.id,
            startDate: sc.startDate,
            status: sc.status,
            course: sc.course,
            class: sc.class
        }));

        console.log('Mapped first result:', JSON.stringify(mapped[0], null, 2));

        // Test JSON serialization
        const serialized = JSON.stringify(mapped);
        const parsed = JSON.parse(serialized);
        
        console.log('After JSON parse first result:', JSON.stringify(parsed[0], null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCoursesSerialization();

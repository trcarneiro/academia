
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function simulateTurmaCreation() {
    try {
        console.log('🧪 Simulating UI Class Creation (API)...');

        // 1. Get Instructor & Organization Data
        const instructorUser = await prisma.user.findFirst({
            where: { email: 'instructor.test@academia.com' },
            include: { instructor: true }
        });

        if (!instructorUser || !instructorUser.instructor) {
            throw new Error('Test instructor not found. Run create-test-instructor.ts first.');
        }

        const org = await prisma.organization.findFirst();
        const unit = await prisma.unit.findFirst({ where: { organizationId: org?.id } });
        const course = await prisma.course.findFirst({ where: { organizationId: org?.id } });

        if (!org || !unit || !course) {
            throw new Error('Missing required data (Org, Unit or Course)');
        }

        console.log(`🔹 Using Instructor: ${instructorUser.email}`);
        console.log(`🔹 Using Course: ${course.name}`);

        // 2. Login
        console.log('🔹 Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'instructor.test@academia.com',
                password: 'defaultPassword123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.data?.token || loginData.token;

        // 3. Create Turma (Class)
        const newTurmaData = {
            name: 'Test Class UI (Simulated)',
            description: 'Created via API simulation to verify triggers',
            courseId: course.id,
            instructorId: instructorUser.instructor.id,
            organizationId: org.id,
            unitId: unit.id,
            type: 'COLLECTIVE',
            startDate: new Date().toISOString(),
            schedule: {
                daysOfWeek: [1, 3], // Mon, Wed
                time: '14:00',
                duration: 60
            },
            maxStudents: 20
        };

        console.log('🔹 Creating Turma...');
        const createRes = await fetch(`${BASE_URL}/api/turmas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTurmaData)
        });

        if (!createRes.ok) {
            const txt = await createRes.text();
            throw new Error(`Create Turma failed: ${createRes.status} - ${txt}`);
        }

        const createJson = await createRes.json();
        const turma = createJson.data || createJson;
        console.log(`✅ Turma Created: ${turma.id}`);

        // 4. Verify Lesson Generation (Recurrence Trigger)
        console.log('🔹 Verifying Lesson Generation (Wait 2s)...');
        await new Promise(r => setTimeout(r, 2000)); // Wait for async generation

        const lessonsRes = await fetch(`${BASE_URL}/api/turmas/${turma.id}/lessons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const lessonsJson = await lessonsRes.json();
        const lessons = lessonsJson.data || lessonsJson;

        console.log(`   Lessons Found: ${lessons.length}`);

        if (lessons.length > 0) {
            console.log(`✅ Recurrence Trigger VALIDATED! Generated ${lessons.length} lessons.`);
            const firstLesson = lessons[0];
            console.log(`   Sample: ${firstLesson.date} - ${firstLesson.status}`);
        } else {
            console.error('❌ Recurrence Trigger FAILED: No lessons generated.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

simulateTurmaCreation();

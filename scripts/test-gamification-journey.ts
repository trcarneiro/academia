
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { appConfig } from '../src/config';

// Force load envs if needed (tsx usually does handled it, but let's be safe)
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'krav-maga-academy-super-secret-jwt-key-change-in-production-256-bits';
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
    console.log('🚀 Starting Test Suite A: The Hero\'s Journey');

    // 1. Get Organization
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No Organization found in DB');
    const orgId = org.id;
    console.log(`🏢 Using Organization: ${org.name} (${orgId})`);

    // 2. Generate Admin Token (using correct secret)
    console.log('🔑 Generating Admin Token...');
    const token = jwt.sign(
        {
            userId: 'test-admin-system',
            role: 'ADMIN',
            organizationId: orgId
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('✅ Token generated.');

    // 3. Create Student
    console.log('👤 Creating Test Hero...');

    // Unique email
    const uniqueId = Date.now().toString().slice(-4);
    const email = `hero${uniqueId}@test.com`;
    const cpf = `999888${uniqueId}`; // Valid-ish length

    // Create User with organization connect
    const user = await prisma.user.create({
        data: {
            organization: { connect: { id: orgId } },
            email,
            password: 'hash',
            firstName: 'Test',
            lastName: `Hero ${uniqueId}`,
            role: 'STUDENT',
            cpf, // Moved CPF here
        }
    });

    const student = await prisma.student.create({
        data: {
            user: { connect: { id: user.id } }, // Connect to created User
            organization: { connect: { id: orgId } },
            // Removed default fields (totalXP, etc) to avoid validation error with old client
        }
    });
    console.log(`✅ Student Created: ${user.firstName} (${student.id})`);

    // 4. Create Turma and Lesson for Check-in
    console.log('🏫 Preparing Class for Check-in...');
    // 4. Create Turma and Lesson for Check-in
    console.log('🏫 Preparing Class for Check-in...');
    const course = await prisma.course.findFirst({ where: { organizationId: orgId } });
    if (!course) throw new Error('No course found');

    let turma = await prisma.turma.findFirst({
        where: { organizationId: orgId }
    });

    if (!turma) {
        // Fallback create if really empty
        turma = await prisma.turma.create({
            data: {
                organizationId: orgId,
                courseId: course.id,
                name: `Turma Teste ${uniqueId}`,
            }
        });
    }

    // Find or Create Lesson
    let lesson = await prisma.turmaLesson.findFirst({
        where: { turmaId: turma.id, status: 'SCHEDULED' }
    });

    if (!lesson) {
        lesson = await prisma.turmaLesson.create({
            data: {
                turmaId: turma.id,
                scheduledDate: new Date(),
                status: 'SCHEDULED',
                title: 'Aula de Teste',
                duration: 60
            }
        });
    }
    console.log(`✅ Class Ready: ${turma.name} / ${lesson.title}`);

    // 5. Execute Check-in via API
    console.log('📍 Executing Check-in API...');

    // NOTE: frontend passes date string as timestamp
    const checkinPayload = {
        classId: lesson.id,
        studentId: student.id,
        method: 'MANUAL',
        location: 'Test Script',
        timestamp: new Date().toISOString() // Frequency route needs timestamp?
        // AttendanceController validation?
        // Let's check schemas/attendance.ts checkInSchema if possible. 
        // But AttendanceController.checkIn just passes body to Service.checkInToClass
        // Service.checkInToClass expects { classId, method, location, notes }
    };

    try {
        const response = await fetch(`${BASE_URL}/api/attendance/checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Public endpoint
            },
            body: JSON.stringify(checkinPayload)
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`API Error: ${response.status} - ${txt}`);
        }

        const data = await response.json();
        console.log('✅ Check-in Response:', JSON.stringify(data, null, 2));

        // 6. Verify XP Update
        console.log('🔍 Verifying Status...');
        const updatedStudent = await prisma.student.findUnique({ where: { id: student.id } });
        console.log(`   XP: ${updatedStudent?.totalXP} (Expected > 0)`);
        console.log(`   Level: ${updatedStudent?.globalLevel}`);
        console.log(`   Streak: ${updatedStudent?.currentStreak}`);

        if ((updatedStudent?.totalXP || 0) > 0) {
            console.log('✅ XP Increased!');
        } else {
            console.error('❌ XP Did NOT Increase!');
        }

        // 7. Verify Leaderboard
        console.log('🏆 Checking Leaderboard...');
        // Leaderboard endpoint usually requires Auth? Let's assume Yes.
        const lbResponse = await fetch(`${BASE_URL}/api/gamification/leaderboard?organizationId=${orgId}&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!lbResponse.ok) {
            console.error(`Leaderboard Error: ${lbResponse.status} - ${await lbResponse.text()}`);
        } else {
            const lbData = await lbResponse.json();
            // Flattened structure or { data: [] }?
            const list = Array.isArray(lbData) ? lbData : (lbData.data || []);

            const entry = list.find((s: any) => s.studentId === student.id);

            if (entry) {
                console.log(`✅ Found in Leaderboard at Rank #${entry.rank} with ${entry.totalXP} XP`);
            } else {
                console.error('❌ Not found in Leaderboard!');
                console.log('First 3 entries:', list.slice(0, 3));
            }
        }

    } catch (e: any) {
        console.error('❌ Test Failed:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

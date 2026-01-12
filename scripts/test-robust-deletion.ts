
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { appConfig } from '../src/config';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'krav-maga-academy-super-secret-jwt-key-change-in-production-256-bits';
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
    console.log('🚀 Starting Test Suite B: The Clean Slate (Deletion Robustness)');

    // 1. Setup
    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('No Organization found');
    const orgId = org.id;

    console.log('🔑 Generating Admin Token...');
    const token = jwt.sign(
        { userId: 'test-admin-delete', role: 'ADMIN', organizationId: orgId },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 2. Create Student with Complex Data
    console.log('👤 Creating Test Data for Deletion...');
    const uniqueId = Date.now().toString().slice(-4);
    const email = `delete${uniqueId}@test.com`;
    const cpf = `777666${uniqueId}`;

    const user = await prisma.user.create({
        data: {
            organization: { connect: { id: orgId } },
            email,
            password: 'hash',
            firstName: 'To Be',
            lastName: 'Deleted',
            role: 'STUDENT',
            cpf
        }
    });

    const student = await prisma.student.create({
        data: {
            user: { connect: { id: user.id } },
            organization: { connect: { id: orgId } },
            // cpf, // Removed: CPF is in User model
            isActive: true,
        }
    });
    console.log(`✅ Student Created: ${student.id}`);

    // 3. Add Dependencies (Biometrics, Enrollment)
    console.log('🔗 Adding Dependencies (Biometrics, Enrollment)...');

    // Biometric Data
    await prisma.biometricData.create({
        data: {
            studentId: student.id,
            embedding: [0.1, 0.2, 0.3],
            photoUrl: 'http://locahost/fake.jpg',
            qualityScore: 99,
            enrollmentMethod: 'TEST'
        }
    });

    // Enrollment (TurmaStudent)
    const turma = await prisma.turma.findFirst({ where: { organizationId: orgId } });
    if (turma) {
        await prisma.turmaStudent.create({
            data: {
                turmaId: turma.id,
                studentId: student.id,
                // planType: 'MONTHLY' // Removed to match schema defaults/validity
            }
        });
    }

    // 4. Execute Deletion via API
    console.log('🗑️ Executing DELETE API...');

    // Check if it exists before delete
    let check = await prisma.student.findUnique({ where: { id: student.id } });
    if (!check) throw new Error('Student vanished before delete!');

    try {
        const response = await fetch(`${BASE_URL}/api/students/${student.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const txt = await response.text();
        console.log(`Response Status: ${response.status}`);
        console.log(`Response Body: ${txt}`);

        if (!response.ok) {
            throw new Error(`Deletion Failed with ${response.status}`);
        }

        // 5. Verify Database Cleanliness
        console.log('🔍 Verifying "Clean Slate"...');

        // Check Student
        const s = await prisma.student.findUnique({ where: { id: student.id } });
        if (s) console.error('❌ Student STILL EXISTS!');
        else console.log('✅ Student table: CLEAN');

        // Check User
        const u = await prisma.user.findUnique({ where: { id: user.id } });
        // NOTE: Does deleting Student delete User? Usually NO, unless explicitly handled.
        // API controller usually deletes user too if possible? Or keeps it?
        // Let's assume Student is main target.
        if (u) console.log('ℹ️ User record persists (Expected if API only deletes Student)');
        else console.log('✅ User record deleted');

        // Check Biometrics (Constraint check)
        const b = await prisma.biometricData.findFirst({ where: { studentId: student.id } });
        if (b) console.error('❌ BiometricData STILL EXISTS!');
        else console.log('✅ BiometricData: CLEAN');

        // Check Enrollment
        if (turma) {
            const e = await prisma.turmaStudent.findFirst({ where: { studentId: student.id } });
            if (e) console.error('❌ TurmaStudent STILL EXISTS!');
            else console.log('✅ TurmaStudent: CLEAN');
        }

        if (!s && !b) {
            console.log('🎉 DELETION TEST PASSED!');
        } else {
            console.error('❌ DELETION TEST FAILED - Leftovers found.');
            // process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ Test Failed:', e.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

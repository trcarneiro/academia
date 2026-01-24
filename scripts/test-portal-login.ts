
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function testPortalLogin() {
    try {
        console.log('🧪 Testing Student Portal Login...');

        const email = 'thiago.test@academia.com';
        const password = 'defaultPassword123';

        console.log(`🔹 Attempting login for: ${email}`);

        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            const txt = await loginRes.text();
            throw new Error(`Login failed: ${loginRes.status} - ${txt}`);
        }

        const loginData = await loginRes.json();
        console.log('🔍 Login Response Data:', JSON.stringify(loginData, null, 2));

        // The API wraps response in "data"
        const token = loginData.data?.token || loginData.token;
        const userData = loginData.data?.user || loginData.user;
        const userId = userData?.id;

        console.log('✅ Login successful!');
        console.log(`   Token received (len=${token?.length})`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Role: ${userData?.role}`);

        if (userData?.role !== 'STUDENT') {
            console.warn('⚠️ Warning: User role is not STUDENT');
        }

        // 2. Get Student ID
        const student = await prisma.student.findUnique({
            where: { userId: userId }
        });

        if (!student) {
            throw new Error('Student record not found for user');
        }
        console.log(`✅ Student Record Found: ${student.id}`);

        // 3. Test Financial Summary Access
        console.log('🔹 Fetching Financial Summary...');
        const summaryRes = await fetch(`${BASE_URL}/api/financial/students/${student.id}/summary`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!summaryRes.ok) {
            const txt = await summaryRes.text();
            throw new Error(`Financial Summary failed: ${summaryRes.status} - ${txt}`);
        }

        const summaryData = await summaryRes.json();
        console.log('✅ Financial Summary Retrieved');

        // summaryData might also be wrapped in data
        const summary = summaryData.data || summaryData;

        console.log('   Subscription Status:', summary.subscription?.status);
        console.log('   Recent Payments:', summary.recentPayments?.length);

        if (summary.recentPayments?.length > 0) {
            const lastPayment = summary.recentPayments[0];
            console.log(`   Last Payment: ${lastPayment.status} (${lastPayment.amount})`);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testPortalLogin();

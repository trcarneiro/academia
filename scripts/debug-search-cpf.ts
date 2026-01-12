
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging CPF Search...');

    // 1. Check if Dev User is a Student
    const devUser = await prisma.user.findFirst({ where: { email: 'dev@academia.com' } });
    if (devUser) {
        console.log(`👨‍💻 Dev User Found: ${devUser.firstName} ${devUser.lastName} (ID: ${devUser.id})`);
        const devStudent = await prisma.student.findUnique({ where: { userId: devUser.id } });
        console.log(`   Is registered as Student? ${devStudent ? '✅ YES' : '❌ NO'}`);
        if (devUser.cpf) console.log(`   CPF: ${devUser.cpf}`);
    } else {
        console.log('❌ Dev user not found');
    }

    // 2. Get the latest student created
    const lastStudent = await prisma.student.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });

    if (!lastStudent) {
        console.log('❌ No students found in DB.');
        return;
    }

    console.log('👤 Last Student Created:');
    console.log(`   ID: ${lastStudent.id}`);
    console.log(`   Name: ${lastStudent.user.firstName} ${lastStudent.user.lastName}`);
    console.log(`   User CPF (DB value): '${lastStudent.user.cpf}'`);

    if (!lastStudent.user.cpf) {
        console.log('⚠️ Warning: Student user has no CPF.');
    }

    // 2. Simulate Search Logic locally
    const searchCpf = lastStudent.user.cpf || '99999999999';
    const searchClean = searchCpf.replace(/\D/g, ''); // Remove non-digits

    console.log(`\n🔎 Testing search logic with term: '${searchCpf}' (clean: '${searchClean}')`);

    const where: any = {
        organizationId: lastStudent.organizationId
    };

    if (searchClean.length >= 3) {
        where.OR = [
            { registrationNumber: { contains: searchCpf, mode: 'insensitive' } },
            { user: { phone: { contains: searchCpf, mode: 'insensitive' } } },
            { user: { firstName: { contains: searchCpf, mode: 'insensitive' } } },
            { user: { lastName: { contains: searchCpf, mode: 'insensitive' } } },
            { user: { email: { contains: searchCpf, mode: 'insensitive' } } },
            { user: { cpf: { contains: searchClean, mode: 'insensitive' } } } // The critical part
        ];
    }

    const foundLocal = await prisma.student.findMany({
        where,
        include: { user: true }
    });

    console.log(`   Found locally via Prisma query? ${foundLocal.length > 0 ? '✅ YES' : '❌ NO'}`);
    if (foundLocal.length > 0) {
        console.log(`   Found ID: ${foundLocal[0].id}`);
    }

    // 3. Test API Endpoint (requiring auth)
    // We'll reuse the auth logic from the other test script
    try {
        console.log('\n🌐 Testing API Endpoint...');
        const authRes = await axios.post('http://localhost:3000/api/dev-auth/auto-login', {});
        const token = authRes.data.token;
        const orgId = authRes.data.user.organizationId; // Or get from header check if needed

        // Search with the clean numbers
        const searchUrl = `http://localhost:3000/api/students?search=${searchClean}`;
        console.log(`   GET ${searchUrl}`);

        const apiRes = await axios.get(searchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-organization-id': orgId
            }
        });

        console.log(`   API Status: ${apiRes.status}`);
        console.log(`   API Data Count: ${apiRes.data.data.length}`);

        if (apiRes.data.data.length > 0) {
            const found = apiRes.data.data.find((s: any) => s.id === lastStudent.id);
            console.log(`   Found target student in API response? ${found ? '✅ YES' : '❌ NO'}`);
        } else {
            console.log('   ❌ No results from API');
        }

    } catch (err: any) {
        console.error('   ❌ API Error Details:');
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', JSON.stringify(err.response.data, null, 2));
        } else if (err.request) {
            console.error('   No response received:', err.message);
        } else {
            console.error('   Error:', err.message);
        }
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

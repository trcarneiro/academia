
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const cpfToTest = '06822689680';
    console.log(`🔍 Testing CPF: ${cpfToTest}`);

    // 1. Check if CPF exists in User table
    const existingUser = await prisma.user.findFirst({
        where: { cpf: cpfToTest }
    });

    if (existingUser) {
        console.log(`⚠️  CPF found in User table! User ID: ${existingUser.id}, Email: ${existingUser.email}`);
    } else {
        console.log('✅ CPF NOT found in User table.');
    }

    // 2. Check if CPF exists in PreEnrollment table
    const existingPre = await prisma.preEnrollment.findFirst({
        where: { cpf: cpfToTest }
    });

    if (existingPre) {
        console.log(`⚠️  CPF found in PreEnrollment table! ID: ${existingPre.id}, Email: ${existingPre.email}, Status: ${existingPre.status}`);
    } else {
        console.log('✅ CPF NOT found in PreEnrollment table.');
    }

    // 3. Try to update a dummy pre-enrollment (or create one and update)
    console.log('\n🧪 Attempting to update a dummy pre-enrollment with this CPF...');

    try {
        // Create dummy
        const dummy = await prisma.preEnrollment.create({
            data: {
                firstName: 'Test',
                lastName: 'Dummy',
                cpf: '99999999999', // Temporary CPF
                email: 'test.dummy@example.com',
                phone: '11999999999',
                source: 'test_script'
            }
        });
        console.log(`   Dummy created with ID: ${dummy.id}`);

        // Update to target CPF
        await prisma.preEnrollment.update({
            where: { id: dummy.id },
            data: { cpf: cpfToTest }
        });
        console.log('❌ Update SUCCEEDED! This means the system ALLOWS duplicate/existing CPF in PreEnrollment update (or the CPF was distinct).');

        // Cleanup
        await prisma.preEnrollment.delete({ where: { id: dummy.id } });

    } catch (error: any) {
        console.log('✅ Update FAILED as expected (or due to other error).');
        console.log(`   Error: ${error.message}`);
        // Clean up if needed (if update failed but create succeeded)
        // Note: we can't easily catch the dummy ID if it wasn't saved to a var outside try, but here it is.
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/authService';
import { supabase } from '../src/utils/supabase'; // Adjust path if needed

const prisma = new PrismaClient();

async function fixTestUsers() {
    console.log('🔧 Fixing Test Users Auth (Manual Mode)...');

    const targets = [
        {
            name: 'Thiago Roberto Carneiro',
            email: 'thiago.test@academia.com',
            cpf: '06822689680',
            phone: '51999999999'
        },
        {
            name: 'Ana Paula Santos Carneiro',
            email: 'ana.test@academia.com',
            cpf: '62534822009',
            phone: '51988888888'
        }
    ];

    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Organization not found');

    for (const target of targets) {
        console.log(`\nProcessing ${target.name}...`);
        const [firstName, ...lastNameParts] = target.name.split(' ');

        // 1. Delete existing Prisma user
        const existing = await prisma.user.findFirst({ where: { email: target.email } });
        if (existing) {
            console.log(`   🗑️ Deleting existing Prisma user: ${existing.id}`);
            await prisma.user.delete({ where: { id: existing.id } });
        }

        // 2. Try Register
        try {
            console.log('   📝 Registering via AuthService...');
            const result = await AuthService.register({
                email: target.email,
                password: 'defaultPassword123',
                firstName: firstName,
                lastName: lastNameParts.join(' '),
                role: 'STUDENT',
                organizationId: org.id,
                phone: target.phone,
                birthDate: new Date('1990-01-01').toISOString(),
                medicalConditions: []
            });
            console.log(`   ✅ Registered: ${result.id}`);
        } catch (error: any) {
            console.warn(`   ⚠️ Registration Error: ${error.message}`);
            console.log('   🔄 Attempting manual recovery via Supabase Login...');

            try {
                // Direct Supabase Login
                const { data, error: sbError } = await supabase.auth.signInWithPassword({
                    email: target.email,
                    password: 'defaultPassword123'
                });

                if (sbError || !data.user) {
                    throw new Error(`Supabase login failed: ${sbError?.message}`);
                }

                const userId = data.user.id;
                console.log(`   ✅ Supabase ID Found: ${userId}`);

                // Manual Prisma Creation
                // Check if exists again (race condition?)
                const userCheck = await prisma.user.findUnique({ where: { id: userId } });
                if (!userCheck) {
                    console.log('   🔨 Creating Prisma User Manually...');
                    await prisma.user.create({
                        data: {
                            id: userId,
                            email: target.email,
                            password: 'defaultPassword123', // Required
                            firstName: firstName,     // Required
                            lastName: lastNameParts.join(' '), // Required
                            role: 'STUDENT',
                            organizationId: org.id,
                            phone: target.phone
                            // Add other defaults if needed
                        }
                    });
                    console.log('   ✅ Prisma User Created');
                } else {
                    console.log('   ✅ Prisma User Already Exists (Race condition?)');
                }

                // Create Student Profile
                const studentCheck = await prisma.student.findUnique({ where: { userId: userId } });
                if (!studentCheck) {
                    console.log('   🎓 Creating Student Profile...');
                    await prisma.student.create({
                        data: {
                            userId: userId,
                            organizationId: org.id,
                            preferredDays: [],
                            preferredTimes: [],
                            specialNeeds: []
                        }
                    });
                    console.log('   ✅ Student Profile Created');
                }

            } catch (recoveryErr: any) {
                console.error('   ❌ Recovery failed:', recoveryErr.message);
            }
        }
    }
}

fixTestUsers()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

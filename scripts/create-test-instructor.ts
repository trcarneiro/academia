
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/services/authService';
import { supabase } from '../src/utils/supabase';

const prisma = new PrismaClient();

async function createTestInstructor() {
    console.log('🔧 Creating Test Instructor (Fixed V8)...');

    const target = {
        name: 'Instructor Test User',
        email: 'instructor.test@academia.com',
        cpf: '00000000191',
        phone: '51977777777'
    };

    const org = await prisma.organization.findFirst();
    if (!org) throw new Error('Organization not found');

    const [firstName, ...lastNameParts] = target.name.split(' ');

    const existing = await prisma.user.findFirst({ where: { email: target.email } });
    if (existing) {
        console.log(`   🗑️ Deleting existing Prisma user: ${existing.id}`);
        await prisma.user.delete({ where: { id: existing.id } });
    }

    try {
        console.log('   📝 Registering via AuthService...');
        const result = await AuthService.register({
            email: target.email,
            password: 'defaultPassword123',
            firstName: firstName,
            lastName: lastNameParts.join(' '),
            role: 'INSTRUCTOR',
            organizationId: org.id,
            phone: target.phone,
            birthDate: new Date('1980-01-01').toISOString(),
            medicalConditions: []
        });
        console.log(`   ✅ Registered: ${result.id}`);
    } catch (error: any) {
        console.warn(`   ⚠️ Registration Error: ${error.message}`);
        console.log('   🔄 Attempting manual recovery via Supabase Login...');

        try {
            const { data, error: sbError } = await supabase.auth.signInWithPassword({
                email: target.email,
                password: 'defaultPassword123'
            });

            if (sbError || !data.user) {
                throw new Error(`Supabase login failed: ${sbError?.message}`);
            }

            const userId = data.user.id;
            console.log(`   ✅ Supabase ID Found: ${userId}`);

            const userCheck = await prisma.user.findUnique({ where: { id: userId } });
            if (!userCheck) {
                console.log('   🔨 Creating Prisma User Manually...');
                await prisma.user.create({
                    data: {
                        id: userId,
                        email: target.email,
                        password: 'defaultPassword123',
                        firstName: firstName,
                        lastName: lastNameParts.join(' '),
                        role: 'INSTRUCTOR',
                        organizationId: org.id,
                        phone: target.phone
                    }
                });
                console.log('   ✅ Prisma User Created');
            }

            const instCheck = await prisma.instructor.findUnique({ where: { userId: userId } });
            if (!instCheck) {
                console.log('   🎓 Creating Instructor Profile...');
                await prisma.instructor.create({
                    data: {
                        id: userId,
                        userId: userId,
                        organizationId: org.id,
                        // phone removed
                        // specialties removed
                        specializations: [],
                        certifications: [],
                        martialArts: [],
                        availability: [],
                        preferredUnits: [],
                        bio: 'Test Instructor Bio'
                    }
                });
                console.log('   ✅ Instructor Profile Created');
            }

        } catch (recoveryErr: any) {
            console.error('   ❌ Recovery failed:', recoveryErr.message);
        }
    }
}

createTestInstructor()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

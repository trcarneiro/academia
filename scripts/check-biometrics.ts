
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    try {
        const studentCount = await prisma.student.count({
            where: { organizationId: orgId }
        });
        const biometricCount = await prisma.biometricData.count({
            where: {
                student: { organizationId: orgId }
            }
        });

        console.log('--- DB SUMMARY FOR ORG ff5ee00e ---');
        console.log(`Total Students: ${studentCount}`);
        console.log(`Students with Biometrics: ${biometricCount}`);

        if (studentCount > 0) {
            const sampleStudents = await prisma.student.findMany({
                where: { organizationId: orgId },
                take: 5,
                include: { user: true }
            });
            console.log('Sample Students:', sampleStudents.map(s => `${s.user.firstName} ${s.user.lastName} (${s.id})`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

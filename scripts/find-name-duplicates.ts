
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- Analyzing Database for Duplicate Names/Emails ---');

    // Fetch all students with basic info
    const users = await prisma.user.findMany({
        where: {
            role: 'STUDENT'
        },
        include: {
            student: {
                include: {
                    _count: {
                        select: {
                            attendances: true,
                            subscriptions: true
                        }
                    }
                }
            }
        }
    });

    console.log(`Analyzing ${users.length} student records...`);

    const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

    // Group by name
    const byName: Record<string, typeof users> = {};
    for (const u of users) {
        const name = normalize(`${u.firstName} ${u.lastName}`);
        if (!byName[name]) byName[name] = [];
        byName[name].push(u);
    }

    const nameDuplicates = Object.values(byName).filter(g => g.length > 1);
    console.log(`Found ${nameDuplicates.length} names with multiple records.`);

    for (const group of nameDuplicates) {
        const name = `${group[0].firstName} ${group[0].lastName}`;

        // Check if any in group have activity
        const hasActivity = group.some(u =>
            (u.student?._count?.attendances || 0) > 0 ||
            (u.student?._count?.subscriptions || 0) > 0
        );

        console.log(`\nDuplicate Name: "${name}" (Count: ${group.length})`);
        if (hasActivity) console.log(`  [!] SOME RECORDS HAVE ACTIVITY`);

        for (const u of group) {
            const student = u.student;
            console.log(`  - ID: ${u.id} | Email: ${u.email} | CPF: ${u.cpf || 'None'}`);
            console.log(`    Created: ${u.createdAt.toISOString()}`);
            if (student) {
                console.log(`    Stats: Attendances=${student._count?.attendances}, Subscriptions=${student._count?.subscriptions}`);
            }
        }
    }

    console.log('\n--- Analysis Completed ---');
}

check()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

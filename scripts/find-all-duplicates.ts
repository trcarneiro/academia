
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- Analyzing Database for Duplicate CPFs ---');

    // Group users by CPF to find duplicates
    // Prisma doesn't support convenient "groupBy having count > 1" with returning associated data in one go easily
    // So we'll fetch CPFs with count > 1 first
    const cpfCounts = await prisma.user.groupBy({
        by: ['cpf'],
        _count: {
            cpf: true
        },
        having: {
            cpf: {
                _count: {
                    gt: 1
                }
            }
        },
        where: {
            cpf: {
                not: null
            }
        }
    });

    console.log(`Found ${cpfCounts.length} CPFs with duplicates.`);

    for (const group of cpfCounts) {
        const cpf = group.cpf;
        if (!cpf) continue;

        console.log(`\nDuplicate CPF: ${cpf} (Count: ${group._count.cpf})`);

        const users = await prisma.user.findMany({
            where: { cpf },
            include: {
                student: {
                    include: {
                        // Use explicit include to check arrays length safely
                        attendances: true,
                        subscriptions: true,
                        _count: {
                            select: {
                                attendances: true,
                                subscriptions: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // Oldest first
            }
        });

        for (const user of users) {
            const student = user.student;
            const attendanceCount = student ? (student.attendances?.length || student._count?.attendances || 0) : 0;
            const subscriptionCount = student ? (student.subscriptions?.length || student._count?.subscriptions || 0) : 0;

            console.log(`  - User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
            console.log(`    Email: ${user.email}`);
            console.log(`    Created: ${user.createdAt.toISOString()}`);
            console.log(`    Role: ${user.role}, Active: ${user.isActive}`);
            if (student) {
                console.log(`    Student ID: ${student.id}`);
                console.log(`    Data: Attendances=${attendanceCount}, Subscriptions=${subscriptionCount}`);
                console.log(`    Medical: ${student.medicalConditions?.substring(0, 50)}...`);
            } else {
                console.log(`    [!] No Student Record`);
            }
        }
    }

    console.log('\n--- Analysis Completed ---');
}

check()
    .catch(e => {
        console.error('Analysis Failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

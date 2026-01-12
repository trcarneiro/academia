
import { PrismaClient } from '@prisma/client';
import { GamificationService } from '../src/services/gamificationService';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Leaderboard Data...');

    // Get first organization found
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.log('No organization found.');
        return;
    }
    console.log(`Using Organization: ${org.name} (${org.id})`);

    try {
        const start = Date.now();
        const leaderboard = await GamificationService.getLeaderboard(org.id, 5);
        const time = Date.now() - start;

        console.log(`Leaderboard calculated in ${time}ms`);
        console.log(`Found ${leaderboard.length} students.`);

        leaderboard.forEach((item, idx) => {
            console.log(`Rank #${item.rank}: ${item.name} | XP: ${item.totalXP} | Lvl: ${item.level} | Streak: ${item.streak}`);
            if (idx > 0) {
                const prev = leaderboard[idx - 1];
                if (item.totalXP > prev.totalXP) {
                    console.error('ERROR: Sorting is wrong! Higher XP should be first.');
                }
            }
        });

        if (leaderboard.length === 0) {
            console.warn('Leaderboard is empty. Creating dummy XP for a student to test...');
            const student = await prisma.student.findFirst({ where: { organizationId: org.id } });
            if (student) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { totalXP: 500, globalLevel: 5, currentStreak: 3 }
                });
                console.log(`Updated student ${student.id} with XP.`);
            }
        }

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
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

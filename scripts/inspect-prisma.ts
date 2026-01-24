
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Prisma Client Keys:', Object.keys(prisma));
    // Also try to check specific properties to see if they are delegates
    const models = [
        'user', 'student', 'plan', 'billingPlan', 'subscription', 'studentSubscription',
        'progress', 'progressRecord', 'certificate', 'payment'
    ];

    models.forEach(model => {
        console.log(`${model}: ${prisma[model] ? 'EXISTS' : 'UNDEFINED'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        // Check active queries and locks
        console.log('\nChecking active queries...');
        const activeQueries = await prisma.$queryRaw`
      SELECT pid, usename, state, query, age(clock_timestamp(), query_start) as duration
      FROM pg_stat_activity
      WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
      ORDER BY duration DESC;
    `;
        console.log(activeQueries);

        /*
        // Optional: Terminate blocking queries (Use with caution)
        // await prisma.$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...`;
        */

        // Check specific table counts
        console.log('\nChecking table counts...');
        try {
            const userCount = await prisma.user.count();
            console.log(`User count: ${userCount}`);
        } catch (e) {
            console.log('Error counting users:', e.message);
        }
        await prisma.$disconnect();
    });

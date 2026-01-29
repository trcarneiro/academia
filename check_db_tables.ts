import { prisma } from './src/utils/database';

async function check() {
    try {
        const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
        console.log(JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

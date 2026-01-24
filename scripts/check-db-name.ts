
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`SELECT DATABASE() as db`;
        console.log('DATABASE():', result);

        const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = (SELECT DATABASE())
    `;
        console.log('Tables found:', tables.length);
        console.log(tables);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

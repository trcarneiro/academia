import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/krav_academy_test_db',
    },
  },
});

beforeAll(async () => {
  // Ensure the test database is set up
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database using DELETE with FK checks disabled in a transaction
  // Use DELETE instead of TRUNCATE because TRUNCATE implicitly commits and breaks transactions
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

      const tablenames = await tx.$queryRaw<Array<{ TABLE_NAME: string }>>`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = (SELECT DATABASE())
      `;

      for (const { TABLE_NAME } of tablenames) {
        if (TABLE_NAME !== '_prisma_migrations') {
          try {
            await tx.$executeRawUnsafe(`DELETE FROM \`${TABLE_NAME}\`;`);
          } catch (error) {
            console.log(`Failed to delete from ${TABLE_NAME}:`, error);
          }
        }
      }

      await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    }, {
      timeout: 120000 // Increase timeout for massive deletion
    });
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}, 120000);

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
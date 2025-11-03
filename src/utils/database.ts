import { PrismaClient } from '@prisma/client';

// Prisma client with increased connection pool and proper error handling
const prisma = new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Uses connection_limit from .env
    }
  }
});

// Graceful shutdown - release connections on process exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
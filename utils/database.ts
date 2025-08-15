import { PrismaClient } from '@prisma/client';

// Simple Prisma client configuration
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export { prisma };
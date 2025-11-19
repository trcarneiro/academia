import { PrismaClient } from '@prisma/client';

// Prisma client with optimized connection pool for Supabase PgBouncer
const prisma = new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Uses connection_limit from .env
    }
  },
  // Optimize for PgBouncer connection pooling
  // Supabase PgBouncer has limited connections, so we keep pool small
  // and rely on PgBouncer's pooling at the server level
});

// Graceful shutdown - release connections on process exit
// ⚠️ TEMPORARIAMENTE DESABILITADO (estava causando crash do servidor)
/*
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
*/

export { prisma };
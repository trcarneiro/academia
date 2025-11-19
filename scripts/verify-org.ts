import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyOrg() {
  try {
    const targetId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
    
    console.log(`🔍 Buscando organização: ${targetId}`);
    
    const org = await prisma.organization.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true
      }
    });
    
    if (org) {
      console.log('✅ Organização encontrada:');
      console.log(JSON.stringify(org, null, 2));
    } else {
      console.log('❌ Organização NÃO encontrada');
      
      console.log('\n📋 Todas as organizações no banco:');
      const allOrgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true
        }
      });
      console.log(JSON.stringify(allOrgs, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyOrg();

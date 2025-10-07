import { PrismaClient } from '@prisma/client';
import { DEV_CONFIG } from '../src/config/dev';

const prisma = new PrismaClient();

async function ensureDefaultOrganization() {
  try {
    console.log('🔍 Verificando organização padrão...');
    console.log('📋 Organization ID esperado:', DEV_CONFIG.DEFAULT_ORGANIZATION.id);

    // Verificar se a organização existe
    const existingOrg = await prisma.organization.findUnique({
      where: { id: DEV_CONFIG.DEFAULT_ORGANIZATION.id }
    });

    if (existingOrg) {
      console.log('✅ Organização padrão já existe:', existingOrg.name);
      return existingOrg;
    }

    console.log('⚠️  Organização padrão não encontrada. Criando...');

    // Criar a organização padrão
    const newOrg = await prisma.organization.create({
      data: {
        id: DEV_CONFIG.DEFAULT_ORGANIZATION.id,
        name: DEV_CONFIG.DEFAULT_ORGANIZATION.name,
        slug: DEV_CONFIG.DEFAULT_ORGANIZATION.slug,
        isActive: true
      }
    });

    console.log('✅ Organização padrão criada com sucesso:', newOrg.name);
    console.log('📋 ID:', newOrg.id);
    
    return newOrg;

  } catch (error: any) {
    console.error('❌ Erro ao verificar/criar organização:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  ensureDefaultOrganization()
    .then(() => {
      console.log('✅ Script concluído com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falhou:', error);
      process.exit(1);
    });
}

export { ensureDefaultOrganization };

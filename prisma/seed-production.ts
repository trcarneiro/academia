/**
 * Production Seed Script
 * Creates initial organization and admin user
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...');

  // Check if organization exists
  const existingOrg = await prisma.organization.findFirst();
  
  if (existingOrg) {
    console.log('✅ Organization already exists:', existingOrg.name);
    console.log('📋 Organization ID:', existingOrg.id);
    return;
  }

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Academia Krav Maga',
      slug: 'academia-krav-maga',
      description: 'Academia de Krav Maga e Artes Marciais',
      subscriptionPlan: 'PREMIUM',
      maxStudents: 500,
      maxStaff: 50,
      isActive: true,
      primaryColor: '#667eea',
      secondaryColor: '#764ba2'
    }
  });

  console.log('✅ Organization created:', organization.name);
  console.log('📋 Organization ID:', organization.id);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@kravmaga.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin user created:', adminUser.email);
  console.log('📋 Login: admin@kravmaga.com / admin123');

  // Create organization settings
  await prisma.organizationSettings.create({
    data: {
      organizationId: organization.id,
      enableGamification: true,
      enableAIRecommendations: true,
      enableMultipleArts: true,
      aiProvider: 'GEMINI',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR'
    }
  });

  console.log('✅ Organization settings created');

  // Create default unit
  const unit = await prisma.unit.create({
    data: {
      organizationId: organization.id,
      name: 'Unidade Principal',
      address: 'Rua Principal, 123',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30000-000',
      phone: '(31) 99999-9999',
      email: 'contato@kravmaga.com',
      isActive: true
    }
  });

  console.log('✅ Unit created:', unit.name);

  console.log('\n🎉 Production seed completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Access the system at http://67.205.159.161:3001');
  console.log('2. Login with: admin@kravmaga.com / admin123');
  console.log('3. Change the admin password immediately!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Seed Smart Defence Organization
 * Creates the default organization in PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOrganization() {
  console.log('🌱 Seeding Smart Defence organization...');

  try {
    // Check if organization already exists
    const existing = await prisma.organization.findUnique({
      where: { id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472' }
    });

    if (existing) {
      console.log('✅ Organization already exists:', existing.name);
      return;
    }

    // Create Smart Defence organization
    const organization = await prisma.organization.create({
      data: {
        id: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
        name: 'Smart Defence',
        slug: 'smart-defence',
        description: 'Academia de Krav Maga - Unidade Principal',
        email: 'contato@smartdefence.com.br',
        phone: '+55 11 99999-9999',
        website: 'https://smartdefence.com.br',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zipCode: '01234-567',
        maxStudents: 500,
        maxStaff: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Organization created successfully:');
    console.log('   ID:', organization.id);
    console.log('   Name:', organization.name);
    console.log('   Slug:', organization.slug);

  } catch (error) {
    console.error('❌ Error seeding organization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedOrganization()
  .then(() => {
    console.log('🎉 Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });

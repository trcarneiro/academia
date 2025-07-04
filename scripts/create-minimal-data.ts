import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating minimal data for production...');

  // Create organization
  console.log('🏢 Creating organization...');
  
  // Check if organization already exists
  let organization = await prisma.organization.findFirst();
  
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        id: uuidv4(),
        name: 'Academia Elite Krav Maga',
        slug: `elite-krav-maga-${Date.now()}`,
      description: 'Academia especializada em Krav Maga e defesa pessoal',
      logoUrl: 'https://example.com/logo.png',
      website: 'https://elitekravmaga.com.br',
      phone: '+55 11 3456-7890',
      email: 'contato@elitekravmaga.com.br',
      address: 'Rua das Olimpíadas, 500',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brazil',
      zipCode: '04551-000',
      subscriptionPlan: 'PREMIUM',
      maxStudents: 200,
      maxStaff: 20,
      isActive: true,
        primaryColor: '#1f2937',
        secondaryColor: '#3b82f6'
      }
    });
  } else {
    console.log('ℹ️ Organization already exists, using existing one');
  }

  // Create martial art
  console.log('🥋 Creating martial art...');
  const kravMaga = await prisma.martialArt.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Krav Maga',
      description: 'Sistema de combate e defesa pessoal desenvolvido para as forças de defesa israelenses',
      imageUrl: 'https://example.com/krav-maga.jpg',
      hasGrading: true,
      gradingSystem: 'BELT',
      maxLevel: 10,
      isActive: true,
    }
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      email: 'admin@elitekravmaga.com.br',
      password: adminPassword,
      firstName: 'Administrator',
      lastName: 'Sistema',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create a basic course
  console.log('📚 Creating basic course...');
  const beginnerCourse = await prisma.course.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      martialArtId: kravMaga.id,
      name: 'Krav Maga Iniciante',
      description: 'Curso básico de Krav Maga para iniciantes',
      level: 'BEGINNER',
      duration: 12,
      totalClasses: 48,
      classesPerWeek: 4,
      minAge: 16,
      maxAge: 65,
      category: 'ADULT',
      price: 150.00,
      isActive: true,
    }
  });

  // Create basic billing plans
  console.log('💳 Creating billing plans...');
  const basicPlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Básico',
      description: 'Acesso a 8 aulas por mês',
      category: 'ADULT',
      price: 150.00,
      billingType: 'MONTHLY',
      classesPerWeek: 2,
      maxClasses: 8,
      hasPersonalTraining: false,
      hasNutrition: false,
      isActive: true,
    }
  });

  const intermediatePlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Intermediário',
      description: 'Acesso a 12 aulas por mês',
      category: 'ADULT',
      price: 200.00,
      billingType: 'MONTHLY',
      classesPerWeek: 3,
      maxClasses: 12,
      hasPersonalTraining: false,
      hasNutrition: true,
      isActive: true,
    }
  });

  const premiumPlan = await prisma.billingPlan.create({
    data: {
      id: uuidv4(),
      organizationId: organization.id,
      name: 'Plano Premium',
      description: 'Aulas ilimitadas com personal training',
      category: 'ADULT',
      price: 350.00,
      billingType: 'MONTHLY',
      classesPerWeek: 5,
      maxClasses: 999,
      hasPersonalTraining: true,
      hasNutrition: true,
      isActive: true,
    }
  });

  console.log('✅ Minimal data created successfully!');
  console.log(`
📊 Summary:
- 1 Organization: ${organization.name}
- 1 Martial Art: ${kravMaga.name}
- 1 Admin user: admin@elitekravmaga.com.br / admin123
- 1 Course: ${beginnerCourse.name}
- 3 Billing plans created

🔑 Admin credentials:
Email: admin@elitekravmaga.com.br
Password: admin123

🎯 Sistema pronto para importar clientes do Asaas!
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
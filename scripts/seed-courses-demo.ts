import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // 1. Create or get organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Academia Demo',
        slug: 'academia-demo',
        email: 'contato@academiademo.com',
        website: 'https://academiademo.com'
      }
    });
    console.log('✅ Created organization:', org.name);
  }

  // 2. Get or create martial art
  let martialArt = await prisma.martialArt.findFirst({
    where: { organizationId: org.id }
  });

  if (!martialArt) {
    martialArt = await prisma.martialArt.create({
      data: {
        organizationId: org.id,
        name: 'Krav Maga'
      }
    });
    console.log('✅ Created martial art:', martialArt.name);
  }

  // Create demo courses
  const courses = [
    {
      name: 'Krav Maga - Faixa Branca',
      description: 'Curso inicial de Krav Maga para iniciantes',
      level: 'BEGINNER' as const,
      duration: 12,
      totalClasses: 48,
      isActive: true,
      category: 'ADULT' as const,
      objectives: [
        'Fundamentos de defesa pessoal',
        'Postura e base de combate',
        'Golpes básicos: socos e chutes',
        'Defesas contra agarramentos'
      ],
      requirements: []
    },
    {
      name: 'Krav Maga - Faixa Amarela',
      description: 'Evolução das técnicas básicas',
      level: 'INTERMEDIATE' as const,
      duration: 12,
      totalClasses: 48,
      isActive: true,
      category: 'ADULT' as const,
      objectives: [
        'Combinações de golpes',
        'Defesas contra armas brancas',
        'Técnicas de solo básicas',
        'Condicionamento físico avançado'
      ],
      requirements: ['Faixa Branca concluída']
    },
    {
      name: 'Krav Maga - Defesa Feminina',
      description: 'Curso especializado em defesa pessoal para mulheres',
      level: 'BEGINNER' as const,
      duration: 8,
      totalClasses: 32,
      isActive: true,
      category: 'FEMALE' as const,
      objectives: [
        'Técnicas específicas para defesa feminina',
        'Situações de risco comuns',
        'Fortalecimento mental e físico',
        'Defesa contra agarramentos e estrangulamentos'
      ],
      requirements: []
    },
    {
      name: 'Krav Maga Kids',
      description: 'Krav Maga adaptado para crianças',
      level: 'BEGINNER' as const,
      duration: 16,
      totalClasses: 64,
      isActive: true,
      category: 'ADULT' as const,
      objectives: [
        'Autoconfiança e disciplina',
        'Coordenação motora',
        'Defesa pessoal básica para crianças',
        'Respeito e valores'
      ],
      requirements: []
    },
    {
      name: 'Krav Maga Master I',
      description: 'Curso avançado para praticantes experientes',
      level: 'ADVANCED' as const,
      duration: 16,
      totalClasses: 64,
      isActive: false, // Curso inativo para teste
      category: 'MASTER_1' as const,
      objectives: [
        'Técnicas avançadas de combate',
        'Defesa contra múltiplos atacantes',
        'Armas de fogo e desarmamento',
        'Liderança e instrução'
      ],
      requirements: ['Faixa Amarela', 'Mínimo 2 anos de prática']
    }
  ];

  for (const courseData of courses) {
    try {
      const existing = await prisma.course.findFirst({
        where: {
          organizationId: org.id,
          name: courseData.name
        }
      });

      if (!existing) {
        await prisma.course.create({
          data: {
            ...courseData,
            organizationId: org.id,
            martialArtId: martialArt.id
          }
        });
        console.log(`✅ Created course: ${courseData.name}`);
      } else {
        console.log(`⏭️  Course already exists: ${courseData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating course ${courseData.name}:`, error);
    }
  }

  console.log('✅ Courses seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding courses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

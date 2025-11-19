import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdriana() {
  console.log('🔍 Buscando Adriana Kattah no banco de dados...\n');

  // Busca por nome
  const byFirstName = await prisma.student.findMany({
    include: { user: true },
    where: {
      user: {
        firstName: {
          contains: 'Adriana',
          mode: 'insensitive'
        }
      }
    }
  });

  console.log(`📋 Alunos com firstName "Adriana": ${byFirstName.length}`);
  byFirstName.forEach(s => {
    console.log(`   - ${s.user.firstName} ${s.user.lastName} (${s.user.email}) - ID: ${s.id}`);
    console.log(`     Criado em: ${s.createdAt}`);
  });

  // Busca por sobrenome
  console.log('\n');
  const byLastName = await prisma.student.findMany({
    include: { user: true },
    where: {
      user: {
        lastName: {
          contains: 'Kattah',
          mode: 'insensitive'
        }
      }
    }
  });

  console.log(`📋 Alunos com lastName "Kattah": ${byLastName.length}`);
  byLastName.forEach(s => {
    console.log(`   - ${s.user.firstName} ${s.user.lastName} (${s.user.email}) - ID: ${s.id}`);
    console.log(`     Criado em: ${s.createdAt}`);
  });

  // Busca por email
  console.log('\n');
  const byEmail = await prisma.student.findMany({
    include: { user: true },
    where: {
      user: {
        email: {
          contains: 'kattah',
          mode: 'insensitive'
        }
      }
    }
  });

  console.log(`📋 Alunos com email contendo "kattah": ${byEmail.length}`);
  byEmail.forEach(s => {
    console.log(`   - ${s.user.firstName} ${s.user.lastName} (${s.user.email}) - ID: ${s.id}`);
    console.log(`     Criado em: ${s.createdAt}`);
  });

  // Busca geral com OR
  console.log('\n');
  const all = await prisma.student.findMany({
    include: { user: true },
    where: {
      OR: [
        { user: { firstName: { contains: 'Adriana', mode: 'insensitive' } } },
        { user: { lastName: { contains: 'Kattah', mode: 'insensitive' } } },
        { user: { email: { contains: 'kattah', mode: 'insensitive' } } }
      ]
    }
  });

  console.log(`\n📊 TOTAL de registros relacionados: ${all.length}`);
  
  // Verifica se há duplicatas
  const uniqueEmails = new Set(all.map(s => s.user.email.toLowerCase()));
  if (uniqueEmails.size < all.length) {
    console.log(`⚠️  ATENÇÃO: Encontradas ${all.length - uniqueEmails.size} duplicatas!`);
  }

  await prisma.$disconnect();
}

findAdriana().catch(console.error);

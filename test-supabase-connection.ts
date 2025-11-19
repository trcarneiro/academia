import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com Supabase...\n');
    
    // Teste 1: Query simples
    console.log('1️⃣ Testando query simples...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Conexão OK! Hora do servidor:', result);
    
    // Teste 2: Contar organizações
    console.log('\n2️⃣ Contando organizações...');
    const orgCount = await prisma.organization.count();
    console.log(`✅ Total de organizações: ${orgCount}`);
    
    // Teste 3: Buscar organização específica
    const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence (único no Supabase)
    console.log(`\n3️⃣ Buscando organização ${orgId}...`);
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    
    if (org) {
      console.log(`✅ Organização encontrada: ${org.name}`);
    } else {
      console.log('❌ Organização NÃO encontrada');
    }
    
    // Teste 4: Contar turmas ativas
    console.log('\n4️⃣ Contando turmas ativas...');
    const turmaCount = await prisma.turma.count({
      where: {
        organizationId: orgId,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Total de turmas ativas: ${turmaCount}`);
    
    // Teste 5: Listar turmas
    if (turmaCount > 0) {
      console.log('\n5️⃣ Listando turmas...');
      const turmas = await prisma.turma.findMany({
        where: {
          organizationId: orgId,
          status: 'ACTIVE',
        },
        include: {
          course: true,
          instructor: true,
        },
        take: 5,
      });
      
      turmas.forEach((t, i) => {
        const schedule = typeof t.schedule === 'string' ? JSON.parse(t.schedule) : t.schedule;
        console.log(`   ${i + 1}. ${t.name}`);
        console.log(`      Curso: ${t.course?.name || 'N/A'}`);
        console.log(`      Instrutor: ${t.instructor?.name || 'N/A'}`);
        console.log(`      Schedule: ${schedule.time} (dias: ${schedule.daysOfWeek?.join(', ')})`);
      });
    }
    
    console.log('\n✅ Todos os testes passaram!\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

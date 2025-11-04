/**
 * SCRIPT DE LIMPEZA - Deletar Turmas de Teste
 * 
 * Remove turmas criadas durante testes automaticamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestTurmas() {
  console.log('\n🧹 INICIANDO LIMPEZA DE TURMAS DE TESTE\n');
  
  // 🆕 BUSCAR AUTOMATICAMENTE TURMAS DE TESTE
  console.log('🔍 Buscando turmas de teste no banco de dados...\n');
  
  const testTurmas = await prisma.turma.findMany({
    where: {
      OR: [
        { name: { startsWith: 'Teste Check-in' } },
        { name: { contains: 'Teste 2' } },
        { name: { contains: 'Teste 3' } },
        { name: { contains: 'Teste 4' } }
      ]
    },
    include: {
      _count: {
        select: {
          lessons: true,
          students: true,
          attendances: true,
          courses: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (testTurmas.length === 0) {
    console.log('✅ Nenhuma turma de teste encontrada!\n');
    return;
  }
  
  console.log(`📋 Encontradas ${testTurmas.length} turmas de teste:\n`);
  testTurmas.forEach((turma, index) => {
    console.log(`${index + 1}. ${turma.name}`);
    console.log(`   ID: ${turma.id}`);
    console.log(`   - ${turma._count.lessons} aulas`);
    console.log(`   - ${turma._count.students} alunos`);
    console.log(`   - ${turma._count.attendances} presenças`);
    console.log(`   - ${turma._count.courses} cursos`);
    console.log('');
  });
  
  console.log('⚠️  ATENÇÃO: As turmas acima serão DELETADAS (CASCADE)!\n');
  console.log('🗑️  Deletando...\n');
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const turma of testTurmas) {
    try {
      console.log(`🗑️  Deletando: ${turma.name}`);
      
      // Deletar turma (CASCADE deleta relações automaticamente)
      await prisma.turma.delete({
        where: { id: turma.id }
      });

      console.log(`   ✅ Deletada com sucesso!`);
      console.log(`      - ${turma._count.lessons} aulas CASCADE`);
      console.log(`      - ${turma._count.students} alunos CASCADE`);
      console.log(`      - ${turma._count.attendances} presenças CASCADE`);
      console.log(`      - ${turma._count.courses} cursos CASCADE`);
      console.log('');
      
      deletedCount++;
    } catch (error: any) {
      console.error(`   ❌ Erro ao deletar: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 RESUMO DA LIMPEZA:');
  console.log(`   ✅ Turmas deletadas: ${deletedCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log('');
  
  // Mostrar turmas restantes
  console.log('📋 Turmas restantes no sistema:\n');
  
  const remainingTurmas = await prisma.turma.findMany({
    include: {
      _count: {
        select: {
          lessons: true,
          students: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (remainingTurmas.length === 0) {
    console.log('   ⚠️  Nenhuma turma restante!\n');
  } else {
    remainingTurmas.forEach((turma, index) => {
      const schedule = turma.schedule as any;
      console.log(`${index + 1}. ${turma.name}`);
      console.log(`   ID: ${turma.id}`);
      console.log(`   Schedule: ${JSON.stringify(schedule)}`);
      console.log(`   Criada: ${turma.createdAt.toLocaleDateString('pt-BR')}`);
      console.log(`   Alunos: ${turma._count.students} | Aulas: ${turma._count.lessons}`);
      console.log('');
    });
  }

  console.log('✅ Limpeza concluída!\n');
}

cleanupTestTurmas()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('✨ Script finalizado com sucesso\n');
    await prisma.$disconnect();
  });

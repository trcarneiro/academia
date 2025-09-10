const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizeRegistrationNumbers() {
  try {
    console.log('🔧 Iniciando normalização de matrículas...');
    
    // Buscar todos os alunos ativos
    const students = await prisma.student.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }, // Ordem de criação para manter sequência
    });
    
    console.log(`📊 Encontrados ${students.length} alunos ativos`);
    
    // Começar do 1001 para academia pequena
    let currentNumber = 1001;
    const updates = [];
    
    for (const student of students) {
      const newRegistration = currentNumber.toString();
      
      if (student.registrationNumber !== newRegistration) {
        updates.push({
          id: student.id,
          oldRegistration: student.registrationNumber,
          newRegistration: newRegistration,
        });
        
        // Atualizar no banco
        await prisma.student.update({
          where: { id: student.id },
          data: { registrationNumber: newRegistration },
        });
        
        console.log(`✅ ${student.registrationNumber} → ${newRegistration}`);
      }
      
      currentNumber++;
    }
    
    console.log('\n📋 RESUMO DA NORMALIZAÇÃO:');
    console.log('==========================');
    console.log(`📈 Total de alunos: ${students.length}`);
    console.log(`🔄 Matrículas atualizadas: ${updates.length}`);
    console.log(`🆔 Próxima matrícula: ${currentNumber}`);
    
    if (updates.length > 0) {
      console.log('\n📝 ALTERAÇÕES REALIZADAS:');
      updates.forEach(update => {
        console.log(`   ${update.oldRegistration} → ${update.newRegistration}`);
      });
    }
    
    // Verificar duplicatas
    const duplicates = await prisma.student.groupBy({
      by: ['registrationNumber'],
      having: {
        registrationNumber: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ ATENÇÃO: Matrículas duplicadas encontradas:');
      duplicates.forEach(dup => {
        console.log(`   ${dup.registrationNumber} (${dup._count} alunos)`);
      });
    } else {
      console.log('\n✅ Nenhuma matrícula duplicada encontrada');
    }
    
    console.log('\n🎉 Normalização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante normalização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para gerar próxima matrícula
async function getNextRegistrationNumber() {
  try {
    const lastStudent = await prisma.student.findFirst({
      where: {
        registrationNumber: {
          startsWith: '1' // Matrículas começam com 1
        }
      },
      orderBy: {
        registrationNumber: 'desc'
      }
    });
    
    if (!lastStudent) {
      return '1001'; // Primeira matrícula
    }
    
    const lastNumber = parseInt(lastStudent.registrationNumber);
    return (lastNumber + 1).toString();
    
  } catch (error) {
    console.error('Erro ao gerar próxima matrícula:', error);
    return '1001';
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--normalize')) {
  normalizeRegistrationNumbers();
} else if (args.includes('--next')) {
  getNextRegistrationNumber().then(next => {
    console.log(`Próxima matrícula: ${next}`);
    process.exit(0);
  });
} else {
  console.log('📋 SISTEMA DE MATRÍCULAS - Academia Krav Maga');
  console.log('===========================================');
  console.log('');
  console.log('Comandos disponíveis:');
  console.log('  --normalize  : Normalizar todas as matrículas (1001, 1002, ...)');
  console.log('  --next       : Mostrar próxima matrícula disponível');
  console.log('');
  console.log('Exemplo:');
  console.log('  node normalize-registrations.js --normalize');
  console.log('  node normalize-registrations.js --next');
}

module.exports = { normalizeRegistrationNumbers, getNextRegistrationNumber };

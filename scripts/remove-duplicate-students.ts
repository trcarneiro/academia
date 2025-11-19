import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicateStudents() {
  console.log('🗑️  Removendo alunos duplicados...\n');
  
  try {
    // 1. Buscar todos os alunos agrupados por email
    const students = await prisma.student.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc' // Mais recente primeiro
      }
    });
    
    // 2. Agrupar por email
    const emailGroups = new Map<string, any[]>();
    students.forEach(student => {
      if (!student.user?.email) return; // Pular se não tiver email
      const email = student.user.email.toLowerCase();
      if (!emailGroups.has(email)) {
        emailGroups.set(email, []);
      }
      emailGroups.get(email)!.push(student);
    });
    
    // 3. Processar duplicatas
    let totalDuplicates = 0;
    let totalDeleted = 0;
    const deletedIds: string[] = [];
    
    for (const [email, group] of emailGroups) {
      if (group.length > 1) {
        totalDuplicates++;
        console.log(`📧 ${email}`);
        console.log(`   Total de registros: ${group.length}`);
        
        // Manter o mais recente (primeiro da lista, pois ordenamos por createdAt desc)
        const [keepStudent, ...duplicates] = group;
        console.log(`   ✅ MANTER: ${keepStudent.user.firstName} ${keepStudent.user.lastName} (ID: ${keepStudent.id}, Criado: ${keepStudent.createdAt})`);
        
        // Deletar os duplicados
        for (const duplicate of duplicates) {
          console.log(`   ❌ DELETAR: ${duplicate.user.firstName} ${duplicate.user.lastName} (ID: ${duplicate.id}, Criado: ${duplicate.createdAt})`);
          deletedIds.push(duplicate.id);
        }
        
        console.log('');
        totalDeleted += duplicates.length;
      }
    }
    
    // 4. Confirmar antes de deletar
    if (deletedIds.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!\n');
      return;
    }
    
    console.log(`\n⚠️  RESUMO:`);
    console.log(`   Total de emails duplicados: ${totalDuplicates}`);
    console.log(`   Total de registros a deletar: ${totalDeleted}`);
    console.log(`   Total de registros a manter: ${totalDuplicates}`);
    console.log(`\n❓ Deseja continuar com a remoção? (--execute para confirmar)\n`);
    
    if (!process.argv.includes('--execute')) {
      console.log('🛑 MODO DRY-RUN: Nenhum dado foi deletado.');
      console.log('   Execute novamente com --execute para confirmar a remoção.\n');
      return;
    }
    
    // 5. EXECUTAR REMOÇÃO
    console.log('🔄 Removendo duplicatas...\n');
    
    // Deletar em lote usando transaction
    await prisma.$transaction(async (tx) => {
      // Deletar students
      const deleteResult = await tx.student.deleteMany({
        where: {
          id: {
            in: deletedIds
          }
        }
      });
      
      console.log(`✅ ${deleteResult.count} alunos duplicados removidos\n`);
    });
    
    // 6. Verificar resultado
    const remainingStudents = await prisma.student.count();
    console.log(`📊 RESULTADO FINAL:`);
    console.log(`   Total de alunos no banco: ${remainingStudents}`);
    console.log(`   Alunos removidos: ${totalDeleted}`);
    console.log(`   Alunos únicos: ${totalDuplicates}`);
    console.log(`\n🎉 Duplicatas removidas com sucesso!\n`);
    
  } catch (error: any) {
    console.error('❌ Erro ao remover duplicatas:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicateStudents();

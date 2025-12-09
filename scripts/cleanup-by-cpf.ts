/**
 * Script para limpar alunos duplicados por CPF
 * 
 * Este script:
 * 1. Identifica alunos duplicados por CPF (campo único e confiável)
 * 2. Mantém o registro com Asaas ou mais dados
 * 3. DELETA os registros duplicados (não apenas desativa)
 * 
 * Uso: npx tsx scripts/cleanup-by-cpf.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('🧹 LIMPEZA DE DUPLICADOS POR CPF');
  console.log('=================================');
  if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita\n');
  } else {
    console.log('🔴 MODO PRODUÇÃO: Registros serão DELETADOS!\n');
  }

  // 1. Buscar todos os alunos com CPF
  console.log('📊 Carregando dados...');
  const allStudents = await prisma.student.findMany({
    where: { organizationId: ORG_ID },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, cpf: true } },
      subscriptions: { select: { id: true, isActive: true, planId: true } },
      asaasCustomer: { select: { id: true, asaasId: true } },
      attendances: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`  Total de alunos: ${allStudents.length}`);

  // 2. Agrupar por CPF (ignorar nulos/vazios)
  const cpfGroups: Record<string, typeof allStudents> = {};
  let withCpf = 0;
  let withoutCpf = 0;

  for (const student of allStudents) {
    const cpf = student.user.cpf?.replace(/\D/g, '').trim() || '';
    if (cpf && cpf.length >= 11) {
      withCpf++;
      if (!cpfGroups[cpf]) {
        cpfGroups[cpf] = [];
      }
      cpfGroups[cpf].push(student);
    } else {
      withoutCpf++;
    }
  }

  console.log(`  Com CPF válido: ${withCpf}`);
  console.log(`  Sem CPF: ${withoutCpf}`);

  // Filtrar apenas duplicados
  const duplicateGroups = Object.entries(cpfGroups)
    .filter(([_, students]) => students.length > 1);

  console.log(`\n🔍 DUPLICADOS POR CPF: ${duplicateGroups.length} grupos\n`);

  let totalDeleted = 0;
  let totalKept = 0;

  for (const [cpf, students] of duplicateGroups) {
    const cpfFormatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    console.log(`\n📋 CPF: ${cpfFormatted}`);
    console.log('─'.repeat(50));

    // Ordenar por prioridade: Asaas > Subscription ativa > Mais frequências > Ativo > Mais recente
    const sorted = students.sort((a, b) => {
      // Prioridade 1: Tem Asaas
      if (a.asaasCustomer && !b.asaasCustomer) return -1;
      if (!a.asaasCustomer && b.asaasCustomer) return 1;
      
      // Prioridade 2: Tem subscription ativa
      const aHasSub = a.subscriptions.some(s => s.isActive);
      const bHasSub = b.subscriptions.some(s => s.isActive);
      if (aHasSub && !bHasSub) return -1;
      if (!aHasSub && bHasSub) return 1;
      
      // Prioridade 3: Mais frequências
      if (a.attendances.length !== b.attendances.length) {
        return b.attendances.length - a.attendances.length;
      }
      
      // Prioridade 4: Está ativo
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Prioridade 5: Mais recente
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const keeper = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`  ✅ MANTER: ${keeper.user.firstName} ${keeper.user.lastName}`);
    console.log(`     ID: ${keeper.id}`);
    console.log(`     Asaas: ${keeper.asaasCustomer ? keeper.asaasCustomer.asaasId : '✗'}`);
    console.log(`     Subscriptions: ${keeper.subscriptions.filter(s => s.isActive).length} ativas`);
    console.log(`     Frequências: ${keeper.attendances.length}`);
    console.log(`     Status: ${keeper.isActive ? 'ATIVO' : 'INATIVO'}`);

    totalKept++;

    for (const dup of toDelete) {
      console.log(`  ❌ DELETAR: ${dup.user.firstName} ${dup.user.lastName}`);
      console.log(`     ID: ${dup.id}`);
      console.log(`     Asaas: ${dup.asaasCustomer ? dup.asaasCustomer.asaasId : '✗'}`);
      console.log(`     Subscriptions: ${dup.subscriptions.filter(s => s.isActive).length} ativas`);
      console.log(`     Frequências: ${dup.attendances.length}`);

      if (!isDryRun) {
        try {
          // Mover subscriptions órfãs para o keeper (se não tiver asaas)
          if (!dup.asaasCustomer && dup.subscriptions.length > 0) {
            await prisma.studentSubscription.updateMany({
              where: { studentId: dup.id },
              data: { studentId: keeper.id }
            });
            console.log(`     📦 Subscriptions movidas para o principal`);
          } else {
            // Deletar subscriptions do duplicado
            await prisma.studentSubscription.deleteMany({
              where: { studentId: dup.id }
            });
          }

          // Mover frequências para o keeper
          if (dup.attendances.length > 0) {
            await prisma.attendance.updateMany({
              where: { studentId: dup.id },
              data: { studentId: keeper.id }
            });
            console.log(`     📦 Frequências movidas para o principal`);
          }

          // Deletar AsaasCustomer se existir (vai dar erro se tiver, então try/catch)
          if (dup.asaasCustomer) {
            try {
              await prisma.asaasCustomer.delete({
                where: { id: dup.asaasCustomer.id }
              });
            } catch (e) {
              console.log(`     ⚠️  Não foi possível deletar AsaasCustomer`);
            }
          }

          // Deletar o student
          await prisma.student.delete({
            where: { id: dup.id }
          });

          // Deletar o user órfão
          await prisma.user.delete({
            where: { id: dup.user.id }
          });

          console.log(`     🗑️  DELETADO`);
          totalDeleted++;
        } catch (error: any) {
          console.log(`     ❌ Erro ao deletar: ${error.message}`);
        }
      } else {
        totalDeleted++;
      }
    }
  }

  // 3. Agora tratar duplicados por NOME (sem CPF ou CPF diferente)
  console.log('\n\n👤 ANALISANDO DUPLICADOS POR NOME...');
  
  const nameGroups: Record<string, typeof allStudents> = {};
  for (const student of allStudents) {
    const name = `${student.user.firstName} ${student.user.lastName}`.toLowerCase().trim();
    // Ignorar test students e nomes vazios
    if (name && !name.includes('test') && !name.includes('teste') && name.length > 3) {
      if (!nameGroups[name]) {
        nameGroups[name] = [];
      }
      nameGroups[name].push(student);
    }
  }

  const nameDuplicates = Object.entries(nameGroups)
    .filter(([_, students]) => students.length > 1);

  console.log(`  Grupos de nomes duplicados: ${nameDuplicates.length}`);

  let nameDeleted = 0;

  for (const [name, students] of nameDuplicates) {
    // Verificar se já foram tratados por CPF (mesmo CPF)
    const uniqueCpfs = new Set(students.map(s => s.user.cpf?.replace(/\D/g, '') || '').filter(c => c.length >= 11));
    
    // Se todos têm o mesmo CPF (ou nenhum), são duplicados reais
    if (uniqueCpfs.size <= 1) {
      console.log(`\n📋 Nome: ${name.toUpperCase()}`);
      console.log('─'.repeat(50));

      // Ordenar por prioridade
      const sorted = students.sort((a, b) => {
        if (a.asaasCustomer && !b.asaasCustomer) return -1;
        if (!a.asaasCustomer && b.asaasCustomer) return 1;
        const aHasSub = a.subscriptions.some(s => s.isActive);
        const bHasSub = b.subscriptions.some(s => s.isActive);
        if (aHasSub && !bHasSub) return -1;
        if (!aHasSub && bHasSub) return 1;
        if (a.attendances.length !== b.attendances.length) return b.attendances.length - a.attendances.length;
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      const keeper = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`  ✅ MANTER: ${keeper.user.firstName} ${keeper.user.lastName} (${keeper.id.slice(0, 8)})`);
      console.log(`     Asaas: ${keeper.asaasCustomer ? '✓' : '✗'} | Sub: ${keeper.subscriptions.some(s => s.isActive) ? '✓' : '✗'} | Freq: ${keeper.attendances.length}`);

      for (const dup of toDelete) {
        console.log(`  ❌ DELETAR: ${dup.user.firstName} ${dup.user.lastName} (${dup.id.slice(0, 8)})`);
        console.log(`     Asaas: ${dup.asaasCustomer ? '✓' : '✗'} | Sub: ${dup.subscriptions.some(s => s.isActive) ? '✓' : '✗'} | Freq: ${dup.attendances.length}`);

        if (!isDryRun) {
          try {
            // Mover subscriptions
            if (dup.subscriptions.length > 0) {
              await prisma.studentSubscription.updateMany({
                where: { studentId: dup.id },
                data: { studentId: keeper.id }
              });
            }

            // Mover frequências
            if (dup.attendances.length > 0) {
              await prisma.attendance.updateMany({
                where: { studentId: dup.id },
                data: { studentId: keeper.id }
              });
            }

            // Deletar relacionamentos que impedem delete
            await prisma.studentSubscription.deleteMany({ where: { studentId: dup.id } });

            // Deletar AsaasCustomer se existir
            if (dup.asaasCustomer) {
              try {
                await prisma.asaasCustomer.delete({ where: { id: dup.asaasCustomer.id } });
              } catch (e) { }
            }

            // Deletar student
            await prisma.student.delete({ where: { id: dup.id } });

            // Deletar user
            await prisma.user.delete({ where: { id: dup.user.id } });

            console.log(`     🗑️  DELETADO`);
            nameDeleted++;
          } catch (error: any) {
            console.log(`     ❌ Erro: ${error.message}`);
          }
        } else {
          nameDeleted++;
        }
      }
    }
  }

  // Resumo final
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RESUMO DA LIMPEZA');
  console.log('═'.repeat(50));
  console.log(`  Duplicados por CPF deletados: ${totalDeleted}`);
  console.log(`  Duplicados por nome deletados: ${nameDeleted}`);
  console.log(`  Registros mantidos: ${totalKept}`);
  console.log(`  Total removidos: ${totalDeleted + nameDeleted}`);
  
  if (isDryRun) {
    console.log('\n⚠️  Execute sem --dry-run para aplicar as mudanças');
  } else {
    console.log('\n✅ Limpeza concluída!');
    
    // Verificação final
    const finalCount = await prisma.student.count({ where: { organizationId: ORG_ID } });
    const activeCount = await prisma.student.count({ where: { organizationId: ORG_ID, isActive: true } });
    console.log(`\n📊 CONTAGEM FINAL:`);
    console.log(`  Total de alunos: ${finalCount}`);
    console.log(`  Alunos ativos: ${activeCount}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orgId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

async function main() {
  try {
    console.log('🔍 Verificando unidade...');
    
    // Buscar ou criar unidade principal
    let unit = await prisma.unit.findFirst({
      where: { organizationId: orgId }
    });

    if (!unit) {
      console.log('🏢 Criando unidade principal...');
      unit = await prisma.unit.create({
        data: {
          organizationId: orgId,
          name: 'Smart Defence - Unidade Principal',
          address: 'Endereço da academia',
          city: 'Cidade',
          state: 'Estado',
          zipCode: '00000-000',
          phone: '',
          email: 'contato@smartdefence.com.br',
          isActive: true
        }
      });
      console.log('✅ Unidade criada');
    } else {
      console.log(`✅ Unidade encontrada: ${unit.name}`);
    }

    console.log('\n🔍 Verificando áreas de treinamento...');
    
    // Buscar áreas existentes
    const existingAreas = await prisma.trainingArea.findMany({
      where: { unitId: unit.id }
    });

    console.log(`📋 Áreas existentes: ${existingAreas.length}`);
    existingAreas.forEach(area => {
      console.log(`  - ${area.name} (${area.type})`);
    });

    let tatame1, tatame2;

    if (existingAreas.length === 0) {
      console.log('\n🏗️ Criando áreas de treinamento...');
      
      // Criar Tatame 1 (Jiu-Jitsu)
      tatame1 = await prisma.trainingArea.create({
        data: {
          unitId: unit.id,
          name: 'Tatame 1',
          areaType: 'MAT',
          description: 'Área principal para Jiu-Jitsu',
          capacity: 30,
          equipment: ['Tatame', 'Espelho', 'Saco de pancada'],
          isActive: true
        }
      });
      console.log('✅ Criado: Tatame 1');

      // Criar Tatame 2 (Defesa Pessoal & Boxe)
      tatame2 = await prisma.trainingArea.create({
        data: {
          unitId: unit.id,
          name: 'Tatame 2',
          areaType: 'MAT',
          description: 'Área para Defesa Pessoal e Boxe',
          capacity: 25,
          equipment: ['Tatame', 'Saco de pancada', 'Luvas', 'Manoplas'],
          isActive: true
        }
      });
      console.log('✅ Criado: Tatame 2');
    } else {
      // Buscar tatames existentes
      tatame1 = existingAreas.find(a => a.name.includes('Tatame 1') || a.name.includes('tatame 1'));
      tatame2 = existingAreas.find(a => a.name.includes('Tatame 2') || a.name.includes('tatame 2'));

      if (!tatame1) {
        tatame1 = await prisma.trainingArea.create({
          data: {
            unitId: unit.id,
            name: 'Tatame 1',
            areaType: 'MAT',
            description: 'Área principal para Jiu-Jitsu',
            capacity: 30,
            equipment: ['Tatame', 'Espelho', 'Saco de pancada'],
            isActive: true
          }
        });
        console.log('✅ Criado: Tatame 1');
      }

      if (!tatame2) {
        tatame2 = await prisma.trainingArea.create({
          data: {
            unitId: unit.id,
            name: 'Tatame 2',
            areaType: 'MAT',
            description: 'Área para Defesa Pessoal e Boxe',
            capacity: 25,
            equipment: ['Tatame', 'Saco de pancada', 'Luvas', 'Manoplas'],
            isActive: true
          }
        });
        console.log('✅ Criado: Tatame 2');
      }
    }

    console.log('\n📚 Atualizando turmas de Defesa Pessoal...');

    // Buscar todas as turmas de Defesa Pessoal (room = 'Tatame 2')
    const turmasDefesaPessoal = await prisma.turma.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { room: 'Tatame 2' },
          { room: { contains: 'Tatame 2' } }
        ]
      }
    });

    console.log(`   Encontradas ${turmasDefesaPessoal.length} turmas`);

    let updated = 0;
    for (const turma of turmasDefesaPessoal) {
      await prisma.turma.update({
        where: { id: turma.id },
        data: { trainingAreaId: tatame2.id }
      });
      console.log(`   ✅ Atualizada: ${turma.name}`);
      updated++;
    }

    console.log(`\n🎉 Total atualizado: ${updated} turmas`);
    console.log('\n📋 Resumo:');
    console.log(`   - Tatame 1: ${tatame1.name} (${tatame1.id})`);
    console.log(`   - Tatame 2: ${tatame2.name} (${tatame2.id})`);
    console.log(`   - Turmas vinculadas ao Tatame 2: ${updated}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

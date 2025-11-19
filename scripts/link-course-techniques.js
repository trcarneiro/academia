const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Criando vínculos Course ↔ Technique (CourseTechnique)\n');

  const courseId = 'krav-maga-faixa-branca-2025';

  // Lista das 42 atividades
  const activityTitles = [
    'Guarda de Boxe', 'Posição Ortodoxa', 'Posição Canhota', 'Shadow Boxing (Passo, Planos, Saltos)',
    'Jab', 'Direto', 'Gancho Esquerdo/Direito', 'Uppercut Esquerdo/Direito',
    'Jab + Direto', 'Jab + Gancho', 'Direto + Uppercut',
    'Cotovelada Traseira', 'Cotovelada Lateral', 'Cotovelada Frontal', 'Cotovelada Uppercut', 'Cotovelada Martelo',
    'Chute Reto', 'Chute Lateral', 'Chute Circular Baixo', 'Joelhada Frontal', 'Empurrão',
    'Defesa Estrangulamento Dedos (Frontal)', 'Defesa Estrangulamento Joelho (Frontal)', 
    'Defesa Estrangulamento Empurrão (Frontal)', 'Defesa Estrangulamento Posterior', 
    'Defesa Estrangulamento Empurrão (Posterior)', 'Defesa Estrangulamento Lateral',
    'Defesa Agarramento Frontal Não Agressivo', 'Defesa Agarramento Frontal Agressivo',
    'Defesa Agarramento com Imobilização', 'Defesa Agarramento por Trás Externa', 
    'Defesa Agarramento por Trás Interna',
    'Defesa 360°', 'Defesa 360° + Contra-ataque', 'Defesa Soco Reto', 'Defesa Soco Gancho',
    'Queda para Trás', 'Queda Frente Suave', 'Queda Frente Dura', 'Queda Lateral', 
    'Rolamento Frente', 'Rolamento Trás'
  ];

  // 1. Buscar as techniques criadas
  const techniques = await prisma.technique.findMany({
    where: {
      name: { in: activityTitles }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`✅ Encontradas ${techniques.length} techniques\n`);

  if (techniques.length === 0) {
    console.log('❌ Nenhuma technique encontrada! Execute link-techniques-v2.js primeiro.');
    return;
  }

  // 2. Criar CourseTechnique para cada uma
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < techniques.length; i++) {
    const technique = techniques[i];

    // Verificar se já existe
    const existing = await prisma.courseTechnique.findUnique({
      where: {
        courseId_techniqueId: {
          courseId: courseId,
          techniqueId: technique.id
        }
      }
    });

    if (existing) {
      console.log(`  ⏭️  ${technique.name}`);
      skipped++;
      continue;
    }

    // Criar vínculo
    await prisma.courseTechnique.create({
      data: {
        courseId: courseId,
        techniqueId: technique.id,
        orderIndex: i + 1,
        isRequired: true
      }
    });

    console.log(`  ✓ ${technique.name}`);
    created++;
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📊 ${created} vínculos criados, ${skipped} já existiam`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

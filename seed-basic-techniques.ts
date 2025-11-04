import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding basic techniques...');

  // Create basic Krav Maga techniques
  const techniques = [
    {
      name: 'Soco Direto',
      description: 'Soco básico direto com punho cerrado',
      shortDescription: 'Soco direto básico',
      category: 'STRIKING',
      difficulty: 1,
      complexity: 'Iniciante',
      durationMin: 5,
      durationMax: 10,
      objectives: ['Aprender posicionamento correto', 'Desenvolver força no soco'],
      resources: ['Luvas', 'Saco de pancada'],
      tags: ['básico', 'soco', 'striking'],
      assessmentCriteria: ['Postura correta', 'Execução limpa', 'Força adequada'],
      risksMitigation: ['Aquecer punhos', 'Usar luvas adequadas'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Posicione-se em stance de combate' },
        { step: 2, description: 'Mantenha o punho fechado corretamente' },
        { step: 3, description: 'Execute o movimento direto para frente' }
      ]
    },
    {
      name: 'Defesa contra Estrangulamento',
      description: 'Técnica de defesa contra estrangulamento frontal',
      shortDescription: 'Defesa contra estrangulamento básico',
      category: 'DEFENSE',
      difficulty: 2,
      complexity: 'Intermediário',
      durationMin: 10,
      durationMax: 15,
      objectives: ['Quebrar o estrangulamento', 'Contra-atacar rapidamente'],
      resources: ['Parceiro de treino', 'Colchão'],
      tags: ['defesa', 'estrangulamento', 'sobrevivência'],
      assessmentCriteria: ['Reação rápida', 'Quebra eficiente', 'Contra-ataque preciso'],
      risksMitigation: ['Praticar com cuidado', 'Comunicar com parceiro', 'Parar se houver desconforto'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Identifique o tipo de estrangulamento' },
        { step: 2, description: 'Use as mãos para quebrar a pegada' },
        { step: 3, description: 'Execute contra-ataque imediato' }
      ]
    },
    {
      name: 'Chute Frontal',
      description: 'Chute direto com a planta do pé',
      shortDescription: 'Chute frontal básico',
      category: 'STRIKING',
      difficulty: 2,
      complexity: 'Iniciante',
      durationMin: 8,
      durationMax: 12,
      objectives: ['Desenvolver equilíbrio', 'Aumentar força nas pernas'],
      resources: ['Pao de chute', 'Espaço livre'],
      tags: ['chute', 'pernas', 'striking'],
      assessmentCriteria: ['Equilíbrio mantido', 'Chute direto', 'Retorno controlado'],
      risksMitigation: ['Aquecimento adequado', 'Superfície estável'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Levante o joelho em direção ao peito' },
        { step: 2, description: 'Estenda a perna rapidamente' },
        { step: 3, description: 'Retorne à posição inicial' }
      ]
    },
    {
      name: 'Joelhada',
      description: 'Ataque com o joelho em curta distância',
      shortDescription: 'Joelhada básica',
      category: 'STRIKING',
      difficulty: 1,
      complexity: 'Iniciante',
      durationMin: 5,
      durationMax: 8,
      objectives: ['Dominar distância curta', 'Desenvolver força no core'],
      resources: ['Pao de chute', 'Parceiro'],
      tags: ['joelho', 'clinch', 'striking'],
      assessmentCriteria: ['Distância adequada', 'Força no impacto', 'Estabilidade'],
      risksMitigation: ['Controlar força', 'Manter equilíbrio'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Aproxime-se do oponente' },
        { step: 2, description: 'Eleve o joelho com força' },
        { step: 3, description: 'Mire na região do tronco' }
      ]
    },
    {
      name: 'Defesa contra Agarramento de Punho',
      description: 'Liberação de agarramento no punho',
      shortDescription: 'Defesa contra pegada no punho',
      category: 'DEFENSE',
      difficulty: 1,
      complexity: 'Iniciante',
      durationMin: 3,
      durationMax: 6,
      objectives: ['Liberar-se rapidamente', 'Manter mobilidade'],
      resources: ['Parceiro de treino'],
      tags: ['defesa', 'agarramento', 'liberação'],
      assessmentCriteria: ['Liberação rápida', 'Movimento fluido', 'Controle de distância'],
      risksMitigation: ['Praticar devagar', 'Comunicação com parceiro'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Identifique a pegada do oponente' },
        { step: 2, description: 'Gire o punho contra o polegar' },
        { step: 3, description: 'Puxe com força para se liberar' }
      ]
    },
    {
      name: 'Cotovelada',
      description: 'Ataque com cotovelo em diversas direções',
      shortDescription: 'Cotovelada básica',
      category: 'STRIKING',
      difficulty: 2,
      complexity: 'Intermediário',
      durationMin: 6,
      durationMax: 10,
      objectives: ['Desenvolver técnica de cotovelo', 'Melhorar coordenação'],
      resources: ['Pao de foco', 'Espaço adequado'],
      tags: ['cotovelo', 'striking', 'curta-distância'],
      assessmentCriteria: ['Posicionamento correto', 'Movimento fluido', 'Impacto preciso'],
      risksMitigation: ['Aquecimento de ombros', 'Controle de força'],
      bnccCompetencies: [],
      references: [],
      instructions: [
        { step: 1, description: 'Posicione o cotovelo corretamente' },
        { step: 2, description: 'Execute movimento circular' },
        { step: 3, description: 'Mantenha o core ativado' }
      ]
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const techniqueData of techniques) {
    try {
      // Check if technique already exists
      const existing = await prisma.technique.findFirst({
        where: { name: techniqueData.name }
      });

      if (existing) {
        console.log(`⏭️ Technique already exists: ${techniqueData.name}`);
        skipped++;
        continue;
      }

      // Create technique
      await prisma.technique.create({
        data: {
          ...techniqueData,
          slug: techniqueData.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
        }
      });

      console.log(`✅ Created technique: ${techniqueData.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating technique ${techniqueData.name}:`, error);
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`• Created: ${created} techniques`);
  console.log(`• Skipped: ${skipped} techniques`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

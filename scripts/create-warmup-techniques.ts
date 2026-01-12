import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createWarmupTechniques() {
    try {
        console.log('🏃 Criando técnicas de aquecimento padrão...\n');

        // Buscar curso Krav Maga para pegar martialArtId
        const course = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga', mode: 'insensitive' } },
            include: { martialArt: true }
        });

        if (!course) {
            console.log('❌ Curso Krav Maga não encontrado');
            return;
        }

        const martialArtId = course.martialArtId;
        console.log(`📚 Usando arte marcial: ${course.martialArt?.name || martialArtId}\n`);

        // Técnicas de aquecimento padrão
        const warmupTechniques = [
            // FASE 1: CARDIO E EXPLOSÃO
            { name: 'Corrida no Tatame', category: 'AQUECIMENTO', subcategory: 'Cardio', difficulty: 1 },
            { name: 'Agachamento', category: 'AQUECIMENTO', subcategory: 'Cardio', difficulty: 1 },
            { name: 'Flexão de Braços', category: 'AQUECIMENTO', subcategory: 'Cardio', difficulty: 2 },
            { name: 'Abdominal', category: 'AQUECIMENTO', subcategory: 'Cardio', difficulty: 1 },

            // FASE 2: COORDENAÇÃO E FOOTWORK
            { name: 'Polichinelo Lateral', category: 'AQUECIMENTO', subcategory: 'Coordenação', difficulty: 1 },
            { name: 'Polichinelo Frontal (Tesoura)', category: 'AQUECIMENTO', subcategory: 'Coordenação', difficulty: 1 },
            { name: 'Tesoura Cruzada Frontal', category: 'AQUECIMENTO', subcategory: 'Coordenação', difficulty: 2 },
            { name: 'Rotação de Quadril com Salto', category: 'AQUECIMENTO', subcategory: 'Coordenação', difficulty: 2 },

            // FASE 3: MOBILIDADE ARTICULAR
            { name: 'Mobilidade Pescoço Frontal', category: 'AQUECIMENTO', subcategory: 'Mobilidade', difficulty: 1 },
            { name: 'Mobilidade Pescoço Lateral', category: 'AQUECIMENTO', subcategory: 'Mobilidade', difficulty: 1 },
            { name: 'Mobilidade Pescoço Queixo', category: 'AQUECIMENTO', subcategory: 'Mobilidade', difficulty: 1 },
            { name: 'Rotação de Ombros', category: 'AQUECIMENTO', subcategory: 'Mobilidade', difficulty: 1 },
            { name: 'Rotação de Pulsos', category: 'AQUECIMENTO', subcategory: 'Mobilidade', difficulty: 1 },

            // FASE 4: ALONGAMENTOS DINÂMICOS
            { name: 'Borboleta', category: 'ALONGAMENTO', subcategory: 'Dinâmico', difficulty: 1 },
            { name: 'Rotação Lateral Sentado', category: 'ALONGAMENTO', subcategory: 'Dinâmico', difficulty: 1 },
            { name: 'Spider-man (Alongamento Lateral)', category: 'ALONGAMENTO', subcategory: 'Dinâmico', difficulty: 2 },
            { name: 'Abertura Frontal Dinâmica', category: 'ALONGAMENTO', subcategory: 'Dinâmico', difficulty: 2 }
        ];

        let created = 0;
        let skipped = 0;

        for (const tech of warmupTechniques) {
            // Verificar se já existe
            const existing = await prisma.technique.findFirst({
                where: { name: tech.name }
            });

            if (existing) {
                console.log(`⏭️  ${tech.name} (já existe)`);
                skipped++;
                continue;
            }

            // Criar técnica com todos os campos obrigatórios
            await prisma.technique.create({
                data: {
                    name: tech.name,
                    category: tech.category,
                    subcategory: tech.subcategory,
                    difficulty: tech.difficulty,
                    martialArtId: martialArtId,
                    description: `Exercício de ${tech.subcategory.toLowerCase()}`,
                    shortDescription: tech.subcategory,
                    objectives: ['Preparação física', tech.subcategory],
                    resources: [],
                    assessmentCriteria: [],
                    risksMitigation: [],
                    tags: [tech.category, tech.subcategory],
                    references: [],
                    prerequisites: [],
                    instructions: [],
                    stepByStep: [],
                    bnccCompetencies: []
                }
            });

            console.log(`✅ ${tech.name}`);
            created++;
        }

        console.log(`\n📊 Resultado: ${created} criadas, ${skipped} já existiam`);

        // Vincular ao curso Krav Maga
        console.log('\n🔗 Vinculando técnicas ao curso...');

        const allWarmup = await prisma.technique.findMany({
            where: {
                OR: [
                    { category: 'AQUECIMENTO' },
                    { category: 'ALONGAMENTO' }
                ]
            }
        });

        let linked = 0;
        let startIndex = 100;

        for (const tech of allWarmup) {
            const existingLink = await prisma.courseTechnique.findFirst({
                where: { courseId: course.id, techniqueId: tech.id }
            });

            if (!existingLink) {
                await prisma.courseTechnique.create({
                    data: {
                        courseId: course.id,
                        techniqueId: tech.id,
                        orderIndex: startIndex++,
                        isRequired: true
                    }
                });
                linked++;
            }
        }

        console.log(`✅ ${linked} técnicas vinculadas ao curso`);

        const totalTech = await prisma.courseTechnique.count({
            where: { courseId: course.id }
        });

        console.log(`\n📚 Total de técnicas no curso: ${totalTech}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createWarmupTechniques();

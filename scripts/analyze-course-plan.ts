import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCourse() {
    try {
        console.log('🔍 Analisando Plano de Curso Krav Maga...\n');

        // Buscar curso
        const course = await prisma.course.findFirst({
            where: { name: { contains: 'Krav Maga', mode: 'insensitive' } },
            include: {
                techniques: {
                    include: { technique: true },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!course) {
            console.log('❌ Curso não encontrado');
            return;
        }

        console.log(`📚 CURSO: ${course.name}`);
        console.log(`   Duração: ${course.duration} meses`);
        console.log(`   Total de aulas: ${course.totalClasses}`);
        console.log(`   Aulas/semana: ${course.classesPerWeek}`);
        console.log(`   Técnicas cadastradas: ${course.techniques.length}\n`);

        // Verificar categorias das técnicas
        const categories: Record<string, any[]> = {};
        const withWeek: any[] = [];
        const withLesson: any[] = [];

        console.log('🥋 TÉCNICAS DO CURSO:\n');

        course.techniques.forEach((ct, idx) => {
            const tech = ct.technique;
            const cat = tech.category || 'SEM CATEGORIA';

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push({
                ordem: ct.orderIndex,
                nome: tech.name,
                semana: ct.weekNumber,
                aula: ct.lessonNumber,
                dificuldade: tech.difficulty
            });

            if (ct.weekNumber) withWeek.push(ct);
            if (ct.lessonNumber) withLesson.push(ct);
        });

        // Mostrar por categoria
        Object.keys(categories).sort().forEach(cat => {
            console.log(`\n📁 ${cat} (${categories[cat].length} técnicas)`);
            categories[cat].slice(0, 5).forEach(t => {
                console.log(`   ${t.ordem}. ${t.nome} ${t.semana ? `(Sem ${t.semana})` : ''} ${t.aula ? `(Aula ${t.aula})` : ''}`);
            });
            if (categories[cat].length > 5) {
                console.log(`   ... e mais ${categories[cat].length - 5} técnicas`);
            }
        });

        console.log('\n' + '═'.repeat(50));
        console.log('📊 ANÁLISE DO PLANO DE CURSO:\n');

        // Problemas identificados
        const problems: string[] = [];
        const suggestions: string[] = [];

        // Verificar se tem aquecimento/alongamento
        const hasAquecimento = categories['AQUECIMENTO']?.length > 0;
        const hasAlongamento = categories['ALONGAMENTO']?.length > 0;

        if (!hasAquecimento) {
            problems.push('❌ SEM técnicas de AQUECIMENTO cadastradas');
            suggestions.push('➕ Adicionar: Polichinelo, Corrida, Agachamento, Rotações, etc.');
        }

        if (!hasAlongamento) {
            problems.push('❌ SEM técnicas de ALONGAMENTO cadastradas');
            suggestions.push('➕ Adicionar: Alongamento pernas, braços, respiração, etc.');
        }

        // Verificar distribuição por semana/aula
        if (withWeek.length === 0) {
            problems.push('❌ NENHUMA técnica tem weekNumber definido');
            suggestions.push('➕ Definir em qual semana cada técnica deve ser ensinada');
        } else {
            console.log(`✅ ${withWeek.length} técnicas com weekNumber`);
        }

        if (withLesson.length === 0) {
            problems.push('❌ NENHUMA técnica tem lessonNumber definido');
            suggestions.push('➕ Definir em qual aula cada técnica deve ser ensinada');
        } else {
            console.log(`✅ ${withLesson.length} técnicas com lessonNumber`);
        }

        // Verificar cobertura das 48 aulas
        const aulas = course.totalClasses; // 48
        const tecnicasPorAula = course.techniques.length / aulas;

        console.log(`\n📈 Distribuição ideal: ${tecnicasPorAula.toFixed(1)} técnicas/aula`);

        // Mostrar problemas
        if (problems.length > 0) {
            console.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
            problems.forEach(p => console.log(`   ${p}`));

            console.log('\n💡 SUGESTÕES:');
            suggestions.forEach(s => console.log(`   ${s}`));
        } else {
            console.log('\n✅ Plano de curso está bem estruturado!');
        }

        // Verificar se existem técnicas de aquecimento no banco (não vinculadas ao curso)
        console.log('\n' + '═'.repeat(50));
        console.log('🔎 Técnicas de aquecimento/alongamento existentes no banco:\n');

        const warmupTechs = await prisma.technique.findMany({
            where: {
                OR: [
                    { category: { contains: 'aquecimento', mode: 'insensitive' } },
                    { category: { contains: 'alongamento', mode: 'insensitive' } },
                    { category: { contains: 'warmup', mode: 'insensitive' } },
                    { name: { contains: 'polichinelo', mode: 'insensitive' } },
                    { name: { contains: 'alongamento', mode: 'insensitive' } }
                ]
            },
            take: 10
        });

        if (warmupTechs.length > 0) {
            console.log(`Encontradas ${warmupTechs.length} técnicas:`);
            warmupTechs.forEach(t => {
                console.log(`   - ${t.name} (${t.category || 'sem categoria'})`);
            });
        } else {
            console.log('❌ Nenhuma técnica de aquecimento/alongamento encontrada');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeCourse();

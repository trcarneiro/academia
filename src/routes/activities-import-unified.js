// Unificação de Importação de Atividades
// Implementação do endpoint único para importação flexível

const importActivitiesHandler = async (request, reply) => {
    try {
        const { 
            mode = 'complete', 
            activities, 
            updateExisting = true,
            enrichWithAI = false 
        } = request.body;

        if (!activities || !Array.isArray(activities)) {
            return reply.status(400).send({
                success: false,
                error: 'Array de atividades é obrigatório'
            });
        }

        const results = {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            details: []
        };

        console.log(`🔄 Iniciando importação de ${activities.length} atividades (modo: ${mode})`);

        for (const activityData of activities) {
            try {
                // Validar dados mínimos necessários
                if (!activityData.name) {
                    results.errors.push({
                        activity: 'Sem nome',
                        error: 'Nome da atividade é obrigatório'
                    });
                    continue;
                }

                // Buscar atividade existente
                const existing = await prisma.activity.findFirst({
                    where: {
                        OR: [
                            activityData.id ? { id: activityData.id } : {},
                            { 
                                name: {
                                    equals: activityData.name,
                                    mode: 'insensitive'
                                }
                            }
                        ].filter(condition => Object.keys(condition).length > 0)
                    }
                });

                if (existing) {
                    if (updateExisting && mode !== 'basic') {
                        // Merge inteligente - preserva dados existentes, adiciona novos
                        const mergedData = {
                            ...existing,
                            ...activityData,
                            // Merge arrays ao invés de substituir
                            instructions: mergeArrays(existing.instructions, activityData.instructions),
                            objectives: mergeArrays(existing.objectives, activityData.objectives),
                            resources: mergeArrays(existing.resources, activityData.resources),
                            tags: mergeArrays(existing.tags, activityData.tags),
                            // Enriquecer campos vazios
                            description: activityData.description || existing.description || (enrichWithAI ? await generateAIDescription(activityData.name) : `Técnica: ${activityData.name}`),
                            updatedAt: new Date()
                        };

                        await prisma.activity.update({
                            where: { id: existing.id },
                            data: mergedData
                        });

                        results.updated++;
                        results.details.push({
                            name: activityData.name,
                            action: 'updated',
                            id: existing.id
                        });
                    } else {
                        results.skipped++;
                        results.details.push({
                            name: activityData.name,
                            action: 'skipped',
                            reason: 'already_exists'
                        });
                    }
                } else {
                    // Criar nova atividade com dados completos ou básicos
                    const newActivityData = {
                        id: activityData.id || generateUUID(),
                        name: activityData.name,
                        description: activityData.description || (enrichWithAI ? await generateAIDescription(activityData.name) : `Técnica: ${activityData.name}`),
                        slug: generateSlug(activityData.name),
                        category: activityData.category || 'TECHNIQUE',
                        difficulty: activityData.difficulty || 1,
                        type: activityData.type || 'TECHNIQUE',
                        instructions: activityData.instructions || [],
                        objectives: activityData.objectives || [],
                        resources: activityData.resources || activityData.equipment || [],
                        tags: activityData.tags || [],
                        duration: activityData.duration || activityData.durationMin || 5,
                        repetitions: activityData.repetitions || 1,
                        // Campos específicos de técnicas
                        complexity: activityData.complexity || 'Iniciante',
                        assessmentCriteria: activityData.assessmentCriteria || [],
                        risksMitigation: activityData.risksMitigation || activityData.safety || [],
                        prerequisites: activityData.prerequisites || [],
                        // Metadados
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    const created = await prisma.activity.create({
                        data: newActivityData
                    });

                    results.created++;
                    results.details.push({
                        name: activityData.name,
                        action: 'created',
                        id: created.id
                    });
                }
            } catch (error) {
                console.error(`❌ Erro ao processar atividade ${activityData.name}:`, error);
                results.errors.push({
                    activity: activityData.name || 'Desconhecida',
                    error: error.message
                });
            }
        }

        const message = `Importação concluída: ${results.created} criadas, ${results.updated} atualizadas, ${results.skipped} ignoradas`;
        
        console.log(`✅ ${message}`);
        if (results.errors.length > 0) {
            console.log(`⚠️ ${results.errors.length} erros encontrados`);
        }

        return reply.send({
            success: true,
            data: results,
            message,
            summary: {
                total: activities.length,
                processed: results.created + results.updated + results.skipped,
                errors: results.errors.length
            }
        });

    } catch (error) {
        console.error('❌ Erro na importação de atividades:', error);
        return reply.status(500).send({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};

// Funções auxiliares
function mergeArrays(existing = [], incoming = []) {
    if (!incoming || incoming.length === 0) return existing || [];
    if (!existing || existing.length === 0) return incoming || [];
    
    // Merge sem duplicatas
    const merged = [...existing];
    incoming.forEach(item => {
        if (!merged.find(existingItem => 
            typeof item === 'string' ? item === existingItem : 
            JSON.stringify(item) === JSON.stringify(existingItem)
        )) {
            merged.push(item);
        }
    });
    return merged;
}

function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim('-'); // Remove hífens das extremidades
}

async function generateAIDescription(name) {
    try {
        // Aqui seria a integração com IA (OpenAI, etc.)
        // Por enquanto, retorna uma descrição básica
        return `Técnica de Krav Maga: ${name}. Movimento fundamental focado em autodefesa e desenvolvimento de habilidades específicas.`;
    } catch (error) {
        return `Técnica: ${name}`;
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Endpoint de registro
module.exports = {
    importActivitiesHandler,
    // Adicionar às rotas:
    // fastify.post('/api/activities/import', importActivitiesHandler);
};

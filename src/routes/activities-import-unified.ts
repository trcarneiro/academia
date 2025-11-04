import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

// Unificação de Importação de Atividades  
// Implementação do endpoint único para importação flexível

// Helper function to get organization ID
async function getOrganizationId(): Promise<string> {
    const prisma = new PrismaClient();
    try {
        const org = await prisma.organization.findFirst({
            select: { id: true }
        });
        if (!org) {
            throw new Error('Nenhuma organização encontrada');
        }
        return org.id;
    } finally {
        await prisma.$disconnect();
    }
}

interface ImportBody {
    mode?: 'basic' | 'complete' | 'merge';
    activities: any[];
    updateExisting?: boolean;
    enrichWithAI?: boolean;
}

interface ImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: any[];
    details: any[];
}

export const importActivitiesHandler = async (request: FastifyRequest<{ Body: ImportBody }>, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    
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

        const results: ImportResult = {
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
                            type: activityData.type || existing.type,
                            title: activityData.title || activityData.name || existing.title,
                            description: activityData.description || existing.description || (enrichWithAI ? await generateAIDescription(existing.title) : undefined),
                            equipment: [...(existing.equipment || []), ...(activityData.equipment || activityData.resources || [])].filter((v, i, a) => a.indexOf(v) === i),
                            safety: activityData.safety || activityData.risksMitigation || existing.safety,
                            adaptations: [...(existing.adaptations || []), ...(activityData.adaptations || [])].filter((v, i, a) => a.indexOf(v) === i),
                            difficulty: activityData.difficulty ? parseInt(activityData.difficulty) : existing.difficulty,
                            refTechniqueId: activityData.refTechniqueId || existing.refTechniqueId,
                            defaultParams: activityData.defaultParams || existing.defaultParams
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
                    // Obter organizationId
                    const organizationId = await getOrganizationId();
                    
                    // Criar nova atividade com dados completos ou básicos
                    const newActivityData = {
                        organizationId,
                        type: activityData.type || 'TECHNIQUE',
                        title: activityData.name || activityData.title,
                        description: activityData.description || (enrichWithAI ? await generateAIDescription(activityData.name || activityData.title) : null),
                        equipment: activityData.equipment || activityData.resources || [],
                        safety: activityData.safety || activityData.risksMitigation || null,
                        adaptations: activityData.adaptations || [],
                        difficulty: activityData.difficulty ? parseInt(activityData.difficulty) : null,
                        refTechniqueId: activityData.refTechniqueId || null,
                        defaultParams: activityData.defaultParams || null
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
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
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
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    } finally {
        await prisma.$disconnect();
    }
};

// Funções auxiliares

async function generateAIDescription(name: string): Promise<string> {
    try {
        // Aqui seria a integração com IA (OpenAI, etc.)
        // Por enquanto, retorna uma descrição básica
        return `Técnica de Krav Maga: ${name}. Movimento fundamental focado em autodefesa e desenvolvimento de habilidades específicas.`;
    } catch (error) {
        return `Técnica: ${name}`;
    }
}

// Export for integration with route system
export default importActivitiesHandler;

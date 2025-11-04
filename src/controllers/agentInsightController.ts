import { FastifyReply, FastifyRequest } from 'fastify';
import { agentInsightService } from '@/services/agentInsightService';
import { logger } from '@/utils/logger';

interface ListInsightsQuery {
    organizationId?: string;
    agentId?: string;
    type?: string;
    category?: string;
    status?: string;
    priority?: string;
    limit?: string;
    offset?: string;
}

interface UpdateInsightBody {
    isPinned?: boolean;
    isRead?: boolean;
    status?: string;
}

export class AgentInsightController {
    /**
     * GET /api/agent-insights
     * Lista insights com filtros
     */
    async listInsights(
        request: FastifyRequest<{ Querystring: ListInsightsQuery }>,
        reply: FastifyReply
    ) {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Organization ID is required'
                });
            }

            const filters = {
                organizationId,
                agentId: request.query.agentId,
                type: request.query.type,
                category: request.query.category,
                status: request.query.status,
                priority: request.query.priority,
                limit: request.query.limit ? parseInt(request.query.limit) : 50,
                offset: request.query.offset ? parseInt(request.query.offset) : 0
            };

            const result = await agentInsightService.listInsights(filters);

            return reply.send({
                success: true,
                data: result.insights,
                total: result.total,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset
                }
            });
        } catch (error) {
            logger.error('Error listing insights:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to list insights'
            });
        }
    }

    /**
     * GET /api/agent-insights/stats
     * Estatísticas de insights
     */
    async getStats(
        request: FastifyRequest<{ Querystring: { agentId?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const organizationId = request.headers['x-organization-id'] as string;
            
            if (!organizationId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Organization ID is required'
                });
            }

            const stats = await agentInsightService.getStats(
                organizationId,
                request.query.agentId
            );

            return reply.send({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting insight stats:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to get stats'
            });
        }
    }

    /**
     * GET /api/agent-insights/:id
     * Buscar insight específico
     */
    async getInsight(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const insight = await agentInsightService.getInsightById(id);

            if (!insight) {
                return reply.code(404).send({
                    success: false,
                    message: 'Insight not found'
                });
            }

            return reply.send({
                success: true,
                data: insight
            });
        } catch (error) {
            logger.error('Error getting insight:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to get insight'
            });
        }
    }

    /**
     * PATCH /api/agent-insights/:id
     * Atualizar insight (pin, read, status)
     */
    async updateInsight(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateInsightBody }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const { isPinned, isRead, status } = request.body;

            let result;

            if (isPinned !== undefined) {
                result = await agentInsightService.togglePin(id, isPinned);
            } else if (isRead !== undefined) {
                result = await agentInsightService.markAsRead(id, isRead);
            } else if (status) {
                result = await agentInsightService.updateStatus(id, status);
            } else {
                return reply.code(400).send({
                    success: false,
                    message: 'No valid update field provided'
                });
            }

            return reply.send({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error updating insight:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to update insight'
            });
        }
    }

    /**
     * PATCH /api/agent-insights/:id/pin
     * Fixar/desfixar insight
     */
    async togglePin(
        request: FastifyRequest<{ Params: { id: string }; Body: { isPinned: boolean } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const { isPinned } = request.body;

            const result = await agentInsightService.togglePin(id, isPinned);

            return reply.send({
                success: true,
                data: result,
                message: isPinned ? 'Insight fixado' : 'Insight desfixado'
            });
        } catch (error) {
            logger.error('Error toggling pin:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to toggle pin'
            });
        }
    }

    /**
     * PATCH /api/agent-insights/:id/read
     * Marcar como lido/não lido
     */
    async markAsRead(
        request: FastifyRequest<{ Params: { id: string }; Body: { isRead?: boolean } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const { isRead = true } = request.body;

            const result = await agentInsightService.markAsRead(id, isRead);

            return reply.send({
                success: true,
                data: result,
                message: isRead ? 'Marcado como lido' : 'Marcado como não lido'
            });
        } catch (error) {
            logger.error('Error marking as read:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to mark as read'
            });
        }
    }

    /**
     * PATCH /api/agent-insights/:id/archive
     * Arquivar insight
     */
    async archive(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            const result = await agentInsightService.archive(id);

            return reply.send({
                success: true,
                data: result,
                message: 'Insight arquivado'
            });
        } catch (error) {
            logger.error('Error archiving insight:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to archive insight'
            });
        }
    }

    /**
     * DELETE /api/agent-insights/:id
     * Deletar insight permanentemente
     */
    async deleteInsight(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            await agentInsightService.delete(id);

            return reply.send({
                success: true,
                message: 'Insight deletado permanentemente'
            });
        } catch (error) {
            logger.error('Error deleting insight:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to delete insight'
            });
        }
    }

    /**
     * DELETE /api/agent-insights/bulk
     * Deletar múltiplos insights
     */
    async bulkDelete(
        request: FastifyRequest<{ Body: { ids: string[] } }>,
        reply: FastifyReply
    ) {
        try {
            const { ids } = request.body;

            if (!ids || ids.length === 0) {
                return reply.code(400).send({
                    success: false,
                    message: 'No insight IDs provided'
                });
            }

            await agentInsightService.bulkDelete(ids);

            return reply.send({
                success: true,
                message: `${ids.length} insights deletados`,
                count: ids.length
            });
        } catch (error) {
            logger.error('Error bulk deleting insights:', error);
            return reply.code(500).send({
                success: false,
                message: 'Failed to delete insights'
            });
        }
    }
}

export const agentInsightController = new AgentInsightController();

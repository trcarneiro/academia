/**
 * RAG Routes - Sistema de Knowledge Base Inteligente
 * Academia Krav Maga v2.0
 * 
 * Rotas para upload de documentos, ingestão RAG, chat inteligente
 * e geração de conteúdo baseado na base de conhecimento.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RAGService } from '../services/ragService';

// Schemas de validação
const ChatMessageSchema = z.object({
    message: z.string().min(1).max(1000)
});

const GenerateContentSchema = z.object({
    type: z.enum(['technique', 'lesson', 'course', 'evaluation']),
    parameters: z.record(z.any())
});

// Helper para respostas
class ResponseHelper {
    static success(reply: FastifyReply, data: any, message = 'Sucesso') {
        return reply.status(200).send({
            success: true,
            message,
            data
        });
    }

    static error(reply: FastifyReply, message: string, statusCode = 400) {
        return reply.status(statusCode).send({
            success: false,
            message,
            data: null
        });
    }
}

/**
 * Registra todas as rotas do sistema RAG
 */
export async function ragRoutes(fastify: FastifyInstance) {
    // Prefixo das rotas
    fastify.register(async function ragRoutesPlugin(fastify: FastifyInstance) {
        
        /**
         * GET /api/rag/stats
         * Retorna estatísticas do sistema RAG
         */
        fastify.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const stats = await RAGService.getRAGStats();
                return ResponseHelper.success(reply, stats);
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro ao buscar estatísticas RAG');
                return ResponseHelper.error(reply, 'Erro interno do servidor', 500);
            }
        });

        /**
         * POST /api/rag/ingest
         * Faz upload e ingestão de documentos no sistema RAG
         */
        fastify.post('/ingest', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const body = request.body as any;
                const files = body?.files || [];
                
                const category = body?.category || 'outros';
                const tags = body?.tags || [];
                
                const result = await RAGService.ingestDocuments(files, {
                    category,
                    tags,
                    userId: 1 // Mock user ID
                });
                
                return ResponseHelper.success(reply, result);
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro na ingestão RAG:');
                return ResponseHelper.error(reply, 'Erro ao processar documentos', 500);
            }
        });

        /**
         * GET /api/rag/documents
         * Lista documentos na base de conhecimento
         */
        fastify.get('/documents', async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const documents = await RAGService.getDocuments({});
                return ResponseHelper.success(reply, documents);
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro ao buscar documentos:');
                return ResponseHelper.error(reply, 'Erro ao buscar documentos', 500);
            }
        });

        /**
         * DELETE /api/rag/documents/:id
         * Remove documento da base de conhecimento
         */
        fastify.delete('/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const params = request.params as { id: string };
                const documentId = parseInt(params.id);
                
                await RAGService.deleteDocument(documentId);
                return ResponseHelper.success(reply, null, 'Documento removido');
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro ao remover documento:');
                return ResponseHelper.error(reply, 'Erro ao remover documento', 500);
            }
        });

        /**
         * POST /api/rag/chat
         * Interface de chat com o sistema RAG
         */
        fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const body = request.body as any;
                const { message } = ChatMessageSchema.parse(body);
                
                const response = await RAGService.processChat(message, {
                    userId: 1,
                    conversationId: request.headers['x-conversation-id'] as string
                });

                return ResponseHelper.success(reply, response);
            } catch (error: any) {
                if (error instanceof z.ZodError) {
                    return ResponseHelper.error(reply, 'Mensagem inválida', 400);
                }
                fastify.log.error({ err: error }, 'Erro no chat RAG:');
                return ResponseHelper.error(reply, 'Erro ao processar mensagem', 500);
            }
        });

        /**
         * GET /api/rag/chat/history
         * Obtém histórico de conversas
         */
        fastify.get('/chat/history', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const query = request.query as { conversationId?: string };
                const history = await RAGService.getChatHistory(1, query.conversationId);
                return ResponseHelper.success(reply, history);
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro ao buscar histórico:');
                return ResponseHelper.error(reply, 'Erro ao buscar histórico', 500);
            }
        });

        /**
         * POST /api/rag/generate
         * Gera conteúdo usando RAG
         */
        fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const body = request.body as any;
                const { type, parameters } = GenerateContentSchema.parse(body);
                
                const result = await RAGService.generateContent(type, parameters, {
                    userId: 1,
                    academyId: 1
                });
                
                return ResponseHelper.success(reply, result);
            } catch (error: any) {
                if (error instanceof z.ZodError) {
                    return ResponseHelper.error(reply, 'Parâmetros inválidos', 400);
                }
                fastify.log.error({ err: error }, 'Erro na geração de conteúdo:');
                return ResponseHelper.error(reply, 'Erro na geração de conteúdo', 500);
            }
        });

        /**
         * GET /api/rag/search
         * Busca semântica na base de conhecimento
         */
        fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const query = request.query as { q?: string; limit?: string };
                const searchQuery = query.q || '';
                const limit = parseInt(query.limit || '10');
                
                const results = await RAGService.semanticSearch(searchQuery, {
                    limit,
                    userId: 1
                });
                
                return ResponseHelper.success(reply, results);
            } catch (error: any) {
                fastify.log.error({ err: error }, 'Erro na busca semântica:');
                return ResponseHelper.error(reply, 'Erro na busca', 500);
            }
        });
    });
}

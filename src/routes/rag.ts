/**
 * RAG Routes - Sistema de Knowledge Base Inteligente
 * Academia Krav Maga v2.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RAGService } from '@/services/ragService';

// Schemas de validação
const ChatMessageSchema = z.object({
    message: z.string().min(1).max(1000),
    context: z.any().optional()
});

const GenerateContentSchema = z.object({
    type: z.enum(['technique', 'lesson', 'course', 'evaluation']),
    prompt: z.string().min(1),
    context: z.string().optional()
});

export async function ragRoutes(fastify: FastifyInstance) {
    
    // Health check
    fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const healthStatus = await RAGService.healthCheck();
            reply.send({ 
                success: true, 
                data: healthStatus 
            });
        } catch (error) {
            fastify.log.error('Erro no health check RAG: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'RAG service unavailable' 
            });
        }
    });

    // Estatísticas do RAG
    fastify.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = await RAGService.getRAGStats();
            reply.send({ 
                success: true, 
                data: stats 
            });
        } catch (error) {
            fastify.log.error('Erro ao buscar estatísticas RAG: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to get RAG stats' 
            });
        }
    });

    // Listar documentos
    fastify.get('/documents', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const documents = await RAGService.getDocuments();
            reply.send({ 
                success: true, 
                data: documents 
            });
        } catch (error) {
            fastify.log.error('Erro ao buscar documentos: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to get documents' 
            });
        }
    });

    // Chat com RAG (POST para enviar mensagem)
    fastify.post('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = request.body as any;
            const { message, context } = ChatMessageSchema.parse(body);
            
            const chatContext: any = context ? { sessionData: context } : {};
            const response = await RAGService.processChat(message, chatContext);
            reply.send({ 
                success: true, 
                data: response 
            });
        } catch (error) {
            fastify.log.error('Erro no chat RAG: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to process chat' 
            });
        }
    });

    // Chat Status (GET para buscar estado do chat)
    fastify.get('/chat/status', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Retorna conversas ativas ou estado do chat
            const chatData = {
                activeConversations: 1,
                status: 'ready',
                availableModels: ['Gemini-1.5-Flash'],
                lastActivity: new Date().toISOString()
            };
            
            reply.send({ 
                success: true, 
                data: chatData 
            });
        } catch (error) {
            fastify.log.error('Erro ao buscar chat status: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to get chat status' 
            });
        }
    });

    // Chat com RAG (GET para buscar mensagens/conversas)
    fastify.get('/chat', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { message } = request.query as { message?: string };
            
            if (message) {
                // Se há uma mensagem na query, processar chat
                const response = await RAGService.processChat(message, {});
                reply.send({ 
                    success: true, 
                    data: response 
                });
            } else {
                // Se não há mensagem, retornar conversas ativas ou estado inicial
                reply.send({ 
                    success: true, 
                    data: {
                        message: 'Chat RAG disponível. Envie uma mensagem para começar.',
                        status: 'ready',
                        availableCommands: [
                            'Como executar técnicas básicas?',
                            'Quais são os princípios do Krav Maga?',
                            'Explique sobre defesa pessoal'
                        ]
                    }
                });
            }
        } catch (error) {
            fastify.log.error('Erro no chat RAG GET: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to process chat request' 
            });
        }
    });

    // Histórico de chat
    fastify.get('/chat/history', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const history = await RAGService.getChatHistory();
            reply.send({ 
                success: true, 
                data: history 
            });
        } catch (error) {
            fastify.log.error('Erro ao buscar histórico: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to get chat history' 
            });
        }
    });

    // Gerar conteúdo
    fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = request.body as any;
            const { type, prompt, context } = GenerateContentSchema.parse(body);
            
            const parameters: any = { techniqueName: prompt };
            const generationContext: any = { context };
            
            const result = await RAGService.generateContent(type, parameters, generationContext);
            reply.send({ 
                success: true, 
                data: result 
            });
        } catch (error) {
            fastify.log.error('Erro na geração de conteúdo: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to generate content' 
            });
        }
    });

    // Busca semântica
    fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { q, limit = '10' } = request.query as any;
            
            if (!q) {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'Query parameter q is required' 
                });
            }
            
            const results = await RAGService.searchRelevantDocuments(q, undefined, parseInt(limit));
            reply.send({ 
                success: true, 
                data: results 
            });
        } catch (error) {
            fastify.log.error('Erro na busca semântica: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to search documents' 
            });
        }
    });

    // Upload de documento
    fastify.post('/upload', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            // TODO: Implementar upload multipart real
            const result = await RAGService.ingestDocument(Buffer.from('placeholder'), {
                fileName: 'placeholder.pdf',
                category: 'Geral',
                tags: ['placeholder'],
                userId: 1
            });
            
            reply.send({ 
                success: true, 
                data: result 
            });
        } catch (error) {
            fastify.log.error('Erro no upload: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to upload document' 
            });
        }
    });

    // Ingest de documento (alias para upload)
    fastify.post('/ingest', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            // TODO: Implementar ingest multipart real
            const result = await RAGService.ingestDocument(Buffer.from('placeholder'), {
                fileName: 'document-ingest.pdf',
                category: 'Ingested',
                tags: ['ingest', 'auto'],
                userId: 1
            });
            
            reply.send({ 
                success: true, 
                data: result 
            });
        } catch (error) {
            fastify.log.error('Erro no ingest: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to ingest document' 
            });
        }
    });

    // Query endpoint - alias for chat functionality
    fastify.post('/query', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { query, context } = request.body as { query: string, context?: string };
            
            if (!query || query.trim().length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'Query is required'
                });
            }

            // Use the same logic as chat endpoint but adapted for query format
            const response = await RAGService.executeRAGQuery(query.trim(), context);
            
            reply.send({
                success: true,
                data: {
                    query,
                    response,
                    sources: response.sources || [],
                    metadata: {
                        confidence: response.confidence || 0.8,
                        processingTime: response.processingTime || 0,
                        documentsScanned: response.documentsScanned || 0
                    }
                }
            });
        } catch (error) {
            fastify.log.error('Erro no RAG query: ' + String(error));
            reply.status(500).send({
                success: false,
                error: 'Failed to execute query'
            });
        }
    });

    // Remover documento
    fastify.delete('/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            // TODO: Implementar remoção quando método estiver disponível
            console.log(`Remove document ${id} - not implemented yet`);
            
            reply.send({ 
                success: true, 
                message: 'Document removal not implemented yet' 
            });
        } catch (error) {
            fastify.log.error('Erro ao remover documento: ' + String(error));
            reply.status(500).send({ 
                success: false, 
                error: 'Failed to remove document' 
            });
        }
    });
}

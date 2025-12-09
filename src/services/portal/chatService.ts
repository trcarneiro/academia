import { RAGService } from '../ragService';
import { logger } from '@/utils/logger';

export class PortalChatService {
    static async sendMessage(userId: string, message: string) {
        try {
            // Convert userId to number if RAGService expects number, or adapt RAGService
            // RAGService expects ChatContext with userId?: number. 
            // Our portal uses UUIDs (string) for students.
            // We might need to pass it as sessionData or adapt RAGService.
            
            // For now, let's pass it as sessionData since RAGService seems to use number for userId (legacy?)
            // or maybe we can just pass it and see if it works (if it's any).
            
            const response = await RAGService.processChat(message, {
                sessionData: {
                    portalUserId: userId,
                    role: 'STUDENT'
                }
            });

            return {
                success: true,
                message: response.message,
                sources: response.sources,
                timestamp: response.timestamp
            };
        } catch (error) {
            logger.error('Error in PortalChatService:', error);
            return {
                success: false,
                message: 'Desculpe, não consegui processar sua mensagem no momento.',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    static async getQuickActions() {
        return [
            {
                id: 'schedule_class',
                label: 'Agendar Aula',
                icon: '📅',
                action: 'navigate',
                target: '/schedule'
            },
            {
                id: 'view_progress',
                label: 'Meu Progresso',
                icon: '🥋',
                action: 'navigate',
                target: '/courses'
            },
            {
                id: 'financial_status',
                label: 'Financeiro',
                icon: '💰',
                action: 'navigate',
                target: '/payments'
            },
            {
                id: 'technique_question',
                label: 'Dúvida Técnica',
                icon: '❓',
                action: 'prompt',
                text: 'Tenho uma dúvida sobre a técnica...'
            }
        ];
    }
}
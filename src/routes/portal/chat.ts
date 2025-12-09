import { FastifyInstance } from 'fastify';
import { portalAuthMiddleware } from '@/middlewares/portalAuth';
import { ResponseHelper } from '@/utils/response';
import { z } from 'zod';

export default async function portalChatRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', portalAuthMiddleware);

    fastify.post('/message', async (request, reply) => {
        const schema = z.object({
            message: z.string().min(1)
        });

        const result = schema.safeParse(request.body);
        
        if (!result.success) {
            return ResponseHelper.error(reply, 'Mensagem inválida', 400);
        }

        const { message } = result.data;
        const studentId = request.studentId;

        // Simple AI-like responses for MVP
        let response = 'Desculpe, não entendi sua pergunta. Pode reformular?';
        
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('horário') || lowerMessage.includes('aula')) {
            response = 'Suas aulas estão na seção Agenda. Clique em "Agenda" no menu inferior para ver seus horários de treino.';
        } else if (lowerMessage.includes('pagamento') || lowerMessage.includes('financ') || lowerMessage.includes('mensalidade')) {
            response = 'Você pode ver sua situação financeira na seção "Financeiro" no menu inferior. Lá você encontra boletos pendentes e histórico de pagamentos.';
        } else if (lowerMessage.includes('técnica') || lowerMessage.includes('curso') || lowerMessage.includes('aprender')) {
            response = 'Seu progresso no curso está na seção "Cursos". Lá você vê as técnicas que já dominou e as próximas a aprender.';
        } else if (lowerMessage.includes('ajuda') || lowerMessage.includes('fazer')) {
            response = 'Posso ajudar você com:\n• Informações sobre horários de aulas\n• Situação financeira e pagamentos\n• Progresso no curso e técnicas\n\nO que gostaria de saber?';
        } else if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
            response = 'Olá! Como posso ajudar você hoje?';
        }

        return ResponseHelper.success(reply, { response });
    });

    fastify.get('/actions', async (request, reply) => {
        const actions = [
            { id: 'schedule', label: '📅 Meus horários' },
            { id: 'payment', label: '💳 Situação financeira' },
            { id: 'techniques', label: '🥋 Próxima técnica' },
            { id: 'help', label: '❓ Ajuda' }
        ];
        
        return ResponseHelper.success(reply, actions);
    });
}
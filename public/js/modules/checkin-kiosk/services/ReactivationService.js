/**
 * ReactivationService - Gerencia fluxo de reativação de planos
 * 
 * Responsabilidades:
 * - Buscar planos disponíveis
 * - Gerar link de pagamento PIX
 * - Verificar status do pagamento
 */

export class ReactivationService {
    constructor() {
        this.baseUrl = '/api';
        this.pollingInterval = null;
        this.maxPollingTime = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Buscar planos de assinatura disponíveis
     */
    async getAvailablePlans() {
        try {
            const response = await fetch(`${this.baseUrl}/billing-plans`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar planos');
            }

            const result = await response.json();
            
            // Filtrar apenas planos ativos
            const plans = (result.data || result || [])
                .filter(plan => plan.isActive !== false)
                .map(plan => ({
                    id: plan.id,
                    name: plan.name,
                    description: plan.description || '',
                    price: Number(plan.price),
                    billingType: plan.billingType,
                    classesPerWeek: plan.classesPerWeek,
                    features: plan.features || []
                }));

            console.log('📋 Planos disponíveis:', plans);
            return plans;
        } catch (error) {
            console.error('❌ Erro ao buscar planos:', error);
            throw error;
        }
    }

    /**
     * Solicitar reativação e gerar pagamento PIX
     */
    async requestReactivation(studentId, planId) {
        try {
            console.log('💳 Solicitando reativação:', { studentId, planId });
            
            const response = await fetch(`${this.baseUrl}/subscriptions/reactivate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentId, planId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao processar reativação');
            }

            const result = await response.json();
            console.log('✅ Reativação processada:', result);
            
            return result.data || result;
        } catch (error) {
            console.error('❌ Erro na reativação:', error);
            throw error;
        }
    }

    /**
     * Verificar status do pagamento
     */
    async checkPaymentStatus(subscriptionId) {
        try {
            const response = await fetch(`${this.baseUrl}/subscriptions/${subscriptionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao verificar status');
            }

            const result = await response.json();
            const subscription = result.data || result;
            
            return {
                status: subscription.status,
                isPaid: subscription.status === 'ACTIVE'
            };
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            throw error;
        }
    }

    /**
     * Iniciar polling para verificar pagamento
     */
    startPaymentPolling(subscriptionId, onPaid, onTimeout) {
        const startTime = Date.now();
        
        this.stopPaymentPolling();
        
        console.log('🔄 Iniciando polling de pagamento:', subscriptionId);
        
        this.pollingInterval = setInterval(async () => {
            try {
                const { isPaid, status } = await this.checkPaymentStatus(subscriptionId);
                
                if (isPaid) {
                    console.log('✅ Pagamento confirmado!');
                    this.stopPaymentPolling();
                    onPaid?.();
                    return;
                }
                
                // Verificar timeout
                if (Date.now() - startTime > this.maxPollingTime) {
                    console.log('⏰ Timeout do polling de pagamento');
                    this.stopPaymentPolling();
                    onTimeout?.();
                }
            } catch (error) {
                console.warn('⚠️ Erro no polling:', error);
            }
        }, 5000); // Verificar a cada 5 segundos
    }

    /**
     * Parar polling de pagamento
     */
    stopPaymentPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Formatar preço para exibição
     */
    formatPrice(price) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    }

    /**
     * Obter label do tipo de cobrança
     */
    getBillingTypeLabel(billingType) {
        const labels = {
            'MONTHLY': '/mês',
            'QUARTERLY': '/trimestre',
            'SEMIANNUALLY': '/semestre',
            'YEARLY': '/ano',
            'LIFETIME': ' (vitalício)'
        };
        return labels[billingType] || '';
    }

    /**
     * Destrutor
     */
    destroy() {
        this.stopPaymentPolling();
    }
}

// Exportar instância singleton
export const reactivationService = new ReactivationService();

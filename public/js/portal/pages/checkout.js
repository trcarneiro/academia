import { router } from '../router.js';
import { api } from '../api.js';

const PLANS = {
    mensal: { name: 'Plano Mensal', price: 199.90, label: 'R$ 199,90' },
    trimestral: { name: 'Plano Trimestral', price: 179.90, label: 'R$ 179,90' },
    anual: { name: 'Plano Anual', price: 149.90, label: 'R$ 149,90' }
};

export function renderCheckout(container) {
    loadCSS('/css/portal/pages/checkout.css');

    // Auth Check
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    const selectedPlanId = sessionStorage.getItem('selectedPlan') || 'mensal';
    const plan = PLANS[selectedPlanId] || PLANS.mensal;

    container.innerHTML = `
        <div class="checkout-page">
            <header class="checkout-header">
                <h2>Finalizar Pagamento</h2>
            </header>
            
            <div class="checkout-content">
                <div class="checkout-card">
                    <div class="plan-summary">
                        <div class="plan-details">
                            <h3>${plan.name}</h3>
                            <p>Cobrança recorrente</p>
                        </div>
                        <div class="plan-price">${plan.label}</div>
                    </div>
                    
                    <div class="payment-methods">
                        <button id="btn-pix" class="payment-method-btn active">
                            <i>💠</i>
                            <div>
                                <strong>PIX</strong>
                                <div style="font-size: 0.8rem; color: #666">Aprovação imediata</div>
                            </div>
                        </button>
                        
                        <button disabled class="payment-method-btn" style="opacity: 0.5; cursor: not-allowed">
                            <i>💳</i>
                            <div>
                                <strong>Cartão de Crédito</strong>
                                <div style="font-size: 0.8rem; color: #666">Em breve</div>
                            </div>
                        </button>
                    </div>

                    <div id="payment-area" style="margin-top: 20px;">
                        <button id="btn-pay" class="btn-primary btn-block btn-large">
                            Gerar PIX de ${plan.label}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-pay').addEventListener('click', async () => {
        const btn = document.getElementById('btn-pay');
        const paymentArea = document.getElementById('payment-area');
        
        btn.disabled = true;
        btn.textContent = 'Gerando cobrança...';

        try {
            const response = await api.request('POST', '/payments/create', {
                amount: plan.price,
                description: `Assinatura ${plan.name}`,
                paymentMethod: 'PIX'
            });

            if (response.success) {
                renderPixPayment(paymentArea, response.data);
            } else {
                throw new Error(response.message || 'Erro ao gerar pagamento');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao processar pagamento: ' + error.message);
            btn.disabled = false;
            btn.textContent = `Gerar PIX de ${plan.label}`;
        }
    });
}

function renderPixPayment(container, data) {
    // data should contain { id, encodedImage (base64), payload (copy paste) }
    // Adjust based on actual API response
    const qrCodeImage = data.encodedImage ? `data:image/png;base64,${data.encodedImage}` : '';
    const copyPaste = data.payload || '';

    container.innerHTML = `
        <div class="pix-container">
            <div class="status-badge status-pending">Aguardando Pagamento</div>
            
            <div style="margin: 20px 0;">
                ${qrCodeImage ? `<img src="${qrCodeImage}" class="qr-code" alt="QR Code PIX">` : '<div class="qr-code">QR Code Indisponível</div>'}
            </div>

            <div class="pix-code-box">
                ${copyPaste}
            </div>
            
            <button id="btn-copy" class="btn-outline btn-sm">
                Copiar Código PIX
            </button>

            <div style="margin-top: 20px;">
                <button id="btn-check-status" class="btn-primary btn-block">
                    Já paguei
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(copyPaste);
        const btn = document.getElementById('btn-copy');
        btn.textContent = 'Copiado!';
        setTimeout(() => btn.textContent = 'Copiar Código PIX', 2000);
    });

    document.getElementById('btn-check-status').addEventListener('click', () => {
        checkPaymentStatus(data.id);
    });

    // Start polling
    startPolling(data.id);
}

let pollInterval;

function startPolling(paymentId) {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(() => {
        checkPaymentStatus(paymentId, true);
    }, 5000); // Check every 5 seconds
}

async function checkPaymentStatus(paymentId, silent = false) {
    try {
        const response = await api.request('GET', `/payments/${paymentId}/status`);
        
        if (response.success && (response.status === 'RECEIVED' || response.status === 'CONFIRMED')) {
            clearInterval(pollInterval);
            router.navigate('/success');
        } else if (!silent) {
            alert('Pagamento ainda não confirmado. Aguarde alguns instantes.');
        }
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

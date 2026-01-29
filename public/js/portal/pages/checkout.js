import { router } from '../router.js';
import { api } from '../api.js';

const PLANS = {
    mensal: { name: 'Plano Mensal', price: 199.90, label: 'R$ 199,90' },
    trimestral: { name: 'Plano Trimestral', price: 179.90, label: 'R$ 179,90' },
    anual: { name: 'Plano Anual', price: 149.90, label: 'R$ 149,90' }
};

export async function renderCheckout(container) {
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
                <h2>Finalizar Assinatura</h2>
            </header>
            
            <div class="checkout-content">
                <div class="checkout-card">
                    <div class="plan-summary">
                        <div class="plan-details">
                            <h3>${plan.name}</h3>
                            <p>Renovação automática</p>
                        </div>
                        <div class="plan-price">${plan.label}</div>
                    </div>
                    
                    <span class="step-title">1. Escolha a forma de pagamento</span>
                    <div class="payment-methods">
                        <button id="btn-method-pix" class="payment-method-btn active">
                            <div class="method-icon">💠</div>
                            <div class="method-info">
                                <strong>PIX</strong>
                                <span>Liberação imediata</span>
                            </div>
                        </button>
                        
                        <button class="payment-method-btn" disabled style="opacity: 0.6;">
                            <div class="method-icon">💳</div>
                            <div class="method-info">
                                <strong>Cartão de Crédito</strong>
                                <span>Em breve</span>
                            </div>
                        </button>
                    </div>

                    <div id="payment-action-area">
                        <button id="btn-generate-payment" class="cta-button" style="width: 100%; padding: 1rem; background: var(--premium-blue); color: white; border: none; border-radius: 1rem; font-weight: 700; cursor: pointer;">
                            Gerar PIX de ${plan.label}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const btnGenerate = document.getElementById('btn-generate-payment');
    btnGenerate.addEventListener('click', async () => {
        const actionArea = document.getElementById('payment-action-area');

        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<div class="spinner-ring" style="width:20px; height:20px; border-width:2px; margin: 0 auto;"></div>';

        try {
            const response = await api.request('POST', '/payments/create', {
                amount: plan.price,
                description: `Assinatura ${plan.name}`,
                paymentMethod: 'PIX'
            });

            if (response.success) {
                renderPixUI(actionArea, response.data);
            } else {
                throw new Error(response.message || 'Erro ao gerar pagamento');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Erro', text: error.message });
            btnGenerate.disabled = false;
            btnGenerate.textContent = `Gerar PIX de ${plan.label}`;
        }
    });
}

function renderPixUI(container, data) {
    const qrCodeImage = data.encodedImage ? `data:image/png;base64,${data.encodedImage}` : '';
    const copyPaste = data.payload || '';

    container.innerHTML = `
        <div class="pix-container" style="text-align: center; animation: fadeIn 0.4s ease;">
            <div class="status-badge status-pending">
                <div class="dot"></div> Aguardando seu pagamento
            </div>
            
            <div class="qr-code-wrapper">
                ${qrCodeImage ? `<img src="${qrCodeImage}" style="width: 180px; height: 180px; display: block;" alt="QR Code PIX">` : '<div style="padding: 40px; color: #999;">QR Code Indisponível</div>'}
            </div>

            <p style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.75rem;">Ou copie o código abaixo:</p>
            <div class="pix-code-box" id="pix-copy-box">
                ${copyPaste}
            </div>
            
            <button id="btn-copy-pix" class="btn-secondary" style="margin-bottom: 1.5rem; width: 100%; border: 1px solid #e5e7eb; background: white; padding: 0.75rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer;">
                Copiar Código PIX
            </button>

            <div class="polling-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <span>Sincronizando com o banco...</span>
            </div>
        </div>
    `;

    document.getElementById('pix-copy-box').addEventListener('click', copyPix);
    document.getElementById('btn-copy-pix').addEventListener('click', copyPix);

    function copyPix() {
        navigator.clipboard.writeText(copyPaste);
        const btn = document.getElementById('btn-copy-pix');
        const box = document.getElementById('pix-copy-box');
        btn.textContent = '✅ Código Copiado!';
        box.style.background = '#f0fdf4';
        box.style.borderColor = '#bbf7d0';
        setTimeout(() => {
            btn.textContent = 'Copiar Código PIX';
            box.style.background = '#f9fafb';
            box.style.borderColor = '#d1d5db';
        }, 2000);
    }

    // Start Polling
    startPolling(data.id);
}

let pollInterval = null;

function startPolling(paymentId) {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
        try {
            const response = await api.request('GET', `/payments/${paymentId}/status`);

            if (response.success && (response.status === 'RECEIVED' || response.status === 'CONFIRMED' || response.status === 'PAID')) {
                clearInterval(pollInterval);
                router.navigate('/success');
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 4000); // slightly faster polling for better UX
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

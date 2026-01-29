import { router } from '../router.js';

export function renderSuccess(container) {
    loadCSS('/css/portal/pages/success.css');

    container.innerHTML = `
        <div class="success-page">
            <div class="success-content">
                <div class="icon-wrapper">
                    <i class="fas fa-check"></i>
                </div>
                <h1>Seja Bem-vindo! 🎉</h1>
                <p>Seu pagamento foi confirmado. Sua jornada no Krav Maga começa agora!</p>
                
                <div class="onboarding-steps">
                    <div class="onboarding-step">
                        <i class="fas fa-check-circle"></i>
                        <span>Matrícula ativada automaticamente</span>
                    </div>
                    <div class="onboarding-step">
                        <i class="fas fa-info-circle"></i>
                        <span>Use seu QR Code no Portal para acesso</span>
                    </div>
                </div>

                <button id="btn-dashboard" style="width: 100%; padding: 1rem; background: #10b981; color: white; border: none; border-radius: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                    Acessar Meu Portal
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-dashboard').addEventListener('click', () => {
        router.navigate('/dashboard');
    });
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

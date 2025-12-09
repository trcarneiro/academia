import { router } from '../router.js';

export function renderSuccess(container) {
    loadCSS('/css/portal/pages/success.css');

    container.innerHTML = `
        <div class="success-page">
            <div class="success-content">
                <div class="icon-success">✅</div>
                <h1>Pagamento Confirmado!</h1>
                <p>Bem-vindo à Academia Krav Maga.</p>
                <p>Sua matrícula foi realizada com sucesso.</p>
                
                <button id="btn-dashboard" class="btn-primary btn-block">
                    Acessar Portal
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

import { router } from '../router.js';
import { api } from '../api.js';

const PLANS = {
    mensal: { name: 'Plano Mensal', price: 'R$ 199,90/mês' },
    trimestral: { name: 'Plano Trimestral', price: 'R$ 179,90/mês' },
    anual: { name: 'Plano Anual', price: 'R$ 149,90/mês' }
};

export function renderRegister(container) {
    loadCSS('/css/portal/pages/register.css');

    const selectedPlanId = sessionStorage.getItem('selectedPlan') || 'mensal';
    const plan = PLANS[selectedPlanId] || PLANS.mensal;

    container.innerHTML = `
        <div class="auth-page">
            <header class="auth-header">
                <button id="btn-back" class="btn-icon">←</button>
                <h2>Criar Conta</h2>
            </header>
            
            <div class="auth-content">
                <div class="selected-plan-summary">
                    <div class="plan-info">
                        <h3>Plano Selecionado</h3>
                        <div class="plan-value">${plan.name}</div>
                        <small>${plan.price}</small>
                    </div>
                    <span class="change-plan" id="btn-change-plan">Alterar</span>
                </div>

                <div id="error-msg" class="error-message"></div>

                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" name="name" required placeholder="Seu nome" minlength="3">
                    </div>

                    <div class="form-group">
                        <label>CPF</label>
                        <input type="text" name="cpf" required placeholder="000.000.000-00" maxlength="14">
                    </div>

                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" name="email" required placeholder="seu@email.com">
                    </div>

                    <div class="form-group">
                        <label>Celular (WhatsApp)</label>
                        <input type="tel" name="phone" required placeholder="(00) 00000-0000">
                    </div>

                    <div class="form-group">
                        <label>Senha</label>
                        <input type="password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres">
                    </div>

                    <button type="submit" class="btn-primary btn-block btn-large">
                        Continuar para Pagamento
                    </button>
                </form>

                <div class="form-footer">
                    Já tem uma conta? <a href="#/login">Fazer Login</a>
                </div>
            </div>
        </div>
    `;

    // Events
    document.getElementById('btn-back').addEventListener('click', () => {
        router.navigate('/');
    });

    document.getElementById('btn-change-plan').addEventListener('click', () => {
        router.navigate('/');
    });

    // Mask CPF and Phone
    const cpfInput = container.querySelector('input[name="cpf"]');
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });

    const phoneInput = container.querySelector('input[name="phone"]');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = value;
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const errorMsg = document.getElementById('error-msg');
        
        btn.disabled = true;
        btn.textContent = 'Criando conta...';
        errorMsg.style.display = 'none';

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Clean CPF and Phone
        data.cpf = data.cpf.replace(/\D/g, '');
        data.phone = data.phone.replace(/\D/g, '');
        data.organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Default Org

        try {
            const response = await api.request('POST', '/auth/register', data);
            
            if (response.success) {
                // Save token
                localStorage.setItem('portal_token', response.token);
                // Navigate to checkout
                router.navigate('/checkout');
            } else {
                throw new Error(response.message || 'Erro ao criar conta');
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = error.message || 'Erro de conexão. Tente novamente.';
            errorMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Continuar para Pagamento';
        }
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

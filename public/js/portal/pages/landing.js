import { router } from '../router.js';

export function renderLanding(container) {
    // Load CSS
    loadCSS('/css/portal/pages/landing.css');

    container.innerHTML = `
        <div class="landing-page">
            <header class="landing-header">
                <div class="logo">🥋 Krav Maga</div>
                <button id="btn-login" class="btn-text">Login</button>
            </header>
            
            <main class="landing-hero">
                <h1>Defesa Pessoal Inteligente</h1>
                <p>Aprenda a se defender com o sistema mais eficiente do mundo.</p>
                
                <div class="landing-features">
                    <div class="feature">
                        <span class="icon">🛡️</span>
                        <span>Defesa Real</span>
                    </div>
                    <div class="feature">
                        <span class="icon">💪</span>
                        <span>Condicionamento</span>
                    </div>
                    <div class="feature">
                        <span class="icon">🧠</span>
                        <span>Autoconfiança</span>
                    </div>
                </div>

                <button id="btn-cta" class="btn-primary btn-large">
                    Ver Planos
                </button>
            </main>

            <section id="plans" class="landing-plans">
                <h2>Escolha seu Plano</h2>
                <div class="plans-grid">
                    <!-- Mensal -->
                    <div class="plan-card">
                        <div class="plan-name">Mensal</div>
                        <div class="plan-price">R$ 199<span>,90</span></div>
                        <div class="plan-period">por mês</div>
                        <ul class="plan-features">
                            <li><i class="fas fa-check"></i> Acesso ilimitado</li>
                            <li><i class="fas fa-check"></i> Sem fidelidade</li>
                            <li><i class="fas fa-check"></i> Todas as unidades</li>
                        </ul>
                        <button class="btn-outline btn-full" data-plan="mensal">Selecionar</button>
                    </div>

                    <!-- Trimestral -->
                    <div class="plan-card featured">
                        <div class="plan-badge">Mais Popular</div>
                        <div class="plan-name">Trimestral</div>
                        <div class="plan-price">R$ 179<span>,90</span></div>
                        <div class="plan-period">por mês</div>
                        <ul class="plan-features">
                            <li><i class="fas fa-check"></i> Acesso ilimitado</li>
                            <li><i class="fas fa-check"></i> 10% de desconto</li>
                            <li><i class="fas fa-check"></i> Kit de boas-vindas</li>
                        </ul>
                        <button class="btn-primary btn-full" data-plan="trimestral">Selecionar</button>
                    </div>

                    <!-- Anual -->
                    <div class="plan-card">
                        <div class="plan-badge">Melhor Valor</div>
                        <div class="plan-name">Anual</div>
                        <div class="plan-price">R$ 149<span>,90</span></div>
                        <div class="plan-period">por mês</div>
                        <ul class="plan-features">
                            <li><i class="fas fa-check"></i> Acesso ilimitado</li>
                            <li><i class="fas fa-check"></i> 25% de desconto</li>
                            <li><i class="fas fa-check"></i> 2 Camisetas grátis</li>
                        </ul>
                        <button class="btn-outline btn-full" data-plan="anual">Selecionar</button>
                    </div>
                </div>
            </section>

            <footer class="landing-footer">
                <p>© 2025 Academia Krav Maga</p>
            </footer>
        </div>
    `;

    // Events
    document.getElementById('btn-cta').addEventListener('click', () => {
        document.getElementById('plans').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-login').addEventListener('click', () => {
        router.navigate('/login');
    });

    // Plan selection
    container.querySelectorAll('[data-plan]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const plan = e.target.dataset.plan;
            sessionStorage.setItem('selectedPlan', plan);
            router.navigate('/register');
        });
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

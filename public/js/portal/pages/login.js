import { router } from '../router.js';
import { api } from '../api.js';

export function renderLogin(container) {
    loadCSS('/css/portal/pages/login.css');

    container.innerHTML = `
        <div class="login-page">
            <div class="login-container">
                <header class="login-header">
                    <h2>Bem-vindo de volta</h2>
                    <p>Acesse sua área do aluno</p>
                </header>

                <div class="login-tabs">
                    <button class="tab-btn active" data-tab="password">Senha</button>
                    <button class="tab-btn" data-tab="magic">WhatsApp</button>
                </div>

                <div id="error-msg" class="error-message" style="margin-bottom: 20px; display: none;"></div>

                <!-- Password Login Form -->
                <form id="login-form-password" class="login-form">
                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" name="email" required placeholder="seu@email.com">
                    </div>

                    <div class="form-group">
                        <label>Senha</label>
                        <input type="password" name="password" required placeholder="Sua senha">
                    </div>

                    <div class="forgot-password">
                        <a href="#/forgot-password">Esqueceu a senha?</a>
                    </div>

                    <button type="submit" class="btn-primary btn-block">
                        Entrar
                    </button>
                </form>

                <!-- Magic Link Request Form -->
                <form id="login-form-magic" class="login-form" style="display: none;">
                    <div class="form-group">
                        <label>Celular (WhatsApp)</label>
                        <input type="tel" name="phone" placeholder="(00) 00000-0000" required>
                    </div>

                    <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">
                        Enviaremos um código de acesso para seu WhatsApp.
                    </p>

                    <button type="submit" class="btn-primary btn-block">
                        Enviar Código
                    </button>
                </form>

                <!-- Magic Link Verify Form (Hidden initially) -->
                <form id="login-form-verify" class="login-form" style="display: none;">
                    <div class="form-group">
                        <label>Código de Verificação</label>
                        <input type="text" name="code" placeholder="000000" required maxlength="6" style="letter-spacing: 4px; text-align: center; font-size: 1.2rem;">
                    </div>
                    
                    <input type="hidden" name="email_or_phone">

                    <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px; text-align: center;">
                        Digite o código enviado para seu WhatsApp.
                    </p>

                    <button type="submit" class="btn-primary btn-block">
                        Verificar e Entrar
                    </button>
                    
                    <button type="button" id="btn-back-magic" class="btn-text" style="margin-top: 10px; width: 100%;">
                        Voltar
                    </button>
                </form>

                <div class="register-link">
                    Não tem uma conta? <a href="#/register">Cadastre-se</a>
                </div>
            </div>
        </div>
    `;

    // Tabs Logic
    const tabs = container.querySelectorAll('.tab-btn');
    const formPassword = document.getElementById('login-form-password');
    const formMagic = document.getElementById('login-form-magic');
    const formVerify = document.getElementById('login-form-verify');
    const errorMsg = document.getElementById('error-msg');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            errorMsg.style.display = 'none';
            formVerify.style.display = 'none';

            if (tab.dataset.tab === 'password') {
                formPassword.style.display = 'flex';
                formMagic.style.display = 'none';
            } else {
                formPassword.style.display = 'none';
                formMagic.style.display = 'flex';
            }
        });
    });

    // Password Login
    formPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formPassword.querySelector('button');
        
        btn.disabled = true;
        btn.textContent = 'Entrando...';
        errorMsg.style.display = 'none';

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; 

        try {
            const response = await api.request('POST', '/auth/login', data);
            
            if (response.success) {
                localStorage.setItem('portal_token', response.token);
                // Load user profile to cache it
                try {
                    const profile = await api.request('GET', '/profile');
                    if (profile.success) {
                        localStorage.setItem('portal_user', JSON.stringify(profile.data));
                    }
                } catch (err) {
                    console.warn('Could not fetch profile immediately', err);
                }
                router.navigate('/dashboard');
            } else {
                throw new Error(response.message || 'Credenciais inválidas');
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = error.message || 'Erro ao fazer login';
            errorMsg.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });

    // Magic Link Request
    formMagic.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formMagic.querySelector('button');
        
        btn.disabled = true;
        btn.textContent = 'Enviando...';
        errorMsg.style.display = 'none';

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const rawPhone = data.phone.replace(/\D/g, '');
        
        // Store phone for verification step
        formVerify.querySelector('input[name=email_or_phone]').value = rawPhone;

        const payload = {
            email: rawPhone, 
            organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
        };

        try {
            const response = await api.request('POST', '/auth/magic-link/request', payload);
            
            if (response.success) {
                formMagic.style.display = 'none';
                formVerify.style.display = 'flex';
                tabs.forEach(t => t.style.display = 'none'); // Hide tabs during verification
            } else {
                throw new Error(response.message || 'Erro ao enviar código');
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = error.message || 'Erro ao solicitar código';
            errorMsg.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Enviar Código';
        }
    });

    // Magic Link Verify
    formVerify.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formVerify.querySelector('button[type=submit]');
        
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        errorMsg.style.display = 'none';

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        const payload = {
            email: data.email_or_phone,
            code: data.code,
            organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
        };

        try {
            const response = await api.request('POST', '/auth/magic-link/verify', payload);
            
            if (response.success) {
                localStorage.setItem('portal_token', response.token);
                router.navigate('/dashboard');
            } else {
                throw new Error(response.message || 'Código inválido');
            }
        } catch (error) {
            console.error(error);
            errorMsg.textContent = error.message || 'Erro ao verificar código';
            errorMsg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Verificar e Entrar';
        }
    });

    // Back button in verify screen
    document.getElementById('btn-back-magic').addEventListener('click', () => {
        formVerify.style.display = 'none';
        formMagic.style.display = 'flex';
        tabs.forEach(t => t.style.display = 'block');
        errorMsg.style.display = 'none';
    });

    // Phone Mask
    const phoneInput = container.querySelector('input[name="phone"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = value;
        });
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

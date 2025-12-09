import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function renderProfile(container) {
    loadCSS('/css/portal/pages/profile.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data (from cache or fetch)
    let user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'profile-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'profile-content';
    content.innerHTML = `
        <div class="profile-container">
            <div class="profile-header-card">
                <div class="profile-avatar" id="profile-avatar"></div>
                <h2 id="profile-name">Carregando...</h2>
                <p id="profile-email" style="color: var(--text-secondary)">...</p>
            </div>

            <form id="profile-form">
                <div class="profile-section">
                    <h3 class="section-title">Dados Pessoais (Somente Leitura)</h3>
                    
                    <div class="form-group">
                        <label>CPF</label>
                        <input type="text" id="cpf" disabled>
                    </div>

                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="text" id="birthDate" disabled>
                    </div>
                </div>

                <div class="profile-section">
                    <h3 class="section-title">Contato e Saúde</h3>
                    
                    <div class="form-group">
                        <label>Telefone / WhatsApp</label>
                        <input type="tel" id="phone" name="phone" placeholder="(00) 00000-0000">
                    </div>

                    <div class="form-group">
                        <label>Contato de Emergência</label>
                        <input type="text" id="emergencyContact" name="emergencyContact" placeholder="Nome e Telefone">
                    </div>

                    <div class="form-group">
                        <label>Condições Médicas / Alergias</label>
                        <textarea id="medicalConditions" name="medicalConditions" placeholder="Descreva se houver..."></textarea>
                    </div>
                </div>

                <button type="submit" class="btn-save">Salvar Alterações</button>
            </form>

            <button id="btn-logout-page" class="btn-logout" style="margin-top: 20px; width: 100%; padding: 12px; background: #fee; color: #d32f2f; border: none; border-radius: 8px;">Sair do App</button>
        </div>
    `;
    container.appendChild(content);

    await loadProfile();
    setupEvents();
}

async function loadProfile() {
    try {
        const response = await api.request('GET', '/profile');
        if (response.success) {
            const data = response.data;
            
            // Update Cache
            localStorage.setItem('portal_user', JSON.stringify(data));

            // Header
            const nameEl = document.getElementById('profile-name');
            const emailEl = document.getElementById('profile-email');
            const avatarEl = document.getElementById('profile-avatar');

            if(nameEl) nameEl.textContent = data.name;
            if(emailEl) emailEl.textContent = data.email;
            
            // Initials
            if(avatarEl) {
                const initials = data.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                avatarEl.textContent = initials;
                avatarEl.style.display = 'flex';
                avatarEl.style.alignItems = 'center';
                avatarEl.style.justifyContent = 'center';
                avatarEl.style.backgroundColor = '#eee';
                avatarEl.style.borderRadius = '50%';
                avatarEl.style.width = '80px';
                avatarEl.style.height = '80px';
                avatarEl.style.fontSize = '2rem';
                avatarEl.style.margin = '0 auto 10px';
            }

            // Read-only
            const cpfEl = document.getElementById('cpf');
            const birthEl = document.getElementById('birthDate');
            if(cpfEl) cpfEl.value = formatCPF(data.cpf);
            if(birthEl) birthEl.value = formatDate(data.birthDate);

            // Editable
            const phoneEl = document.getElementById('phone');
            const emergencyEl = document.getElementById('emergencyContact');
            const medicalEl = document.getElementById('medicalConditions');

            if(phoneEl) phoneEl.value = data.phone || '';
            if(emergencyEl) emergencyEl.value = data.emergencyContact || '';
            if(medicalEl) medicalEl.value = data.medicalConditions || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // alert('Erro ao carregar perfil. Tente novamente.');
    }
}

function setupEvents() {
    const form = document.getElementById('profile-form');
    
    // Phone Mask
    const phoneInput = document.getElementById('phone');
    if(phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 2) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            }
            if (value.length > 9) {
                value = `${value.slice(0, 9)}-${value.slice(9)}`;
            }
            e.target.value = value;
        });
    }

    // Submit
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn-save');
            const originalText = btn.textContent;
            
            try {
                btn.disabled = true;
                btn.textContent = 'Salvando...';

                const formData = {
                    phone: document.getElementById('phone').value,
                    emergencyContact: document.getElementById('emergencyContact').value,
                    medicalConditions: document.getElementById('medicalConditions').value
                };

                const response = await api.request('PUT', '/profile', formData);
                
                if (response.success) {
                    alert('Perfil atualizado com sucesso!');
                    // Update cache
                    const currentUser = JSON.parse(localStorage.getItem('portal_user') || '{}');
                    const newUser = { ...currentUser, ...formData };
                    localStorage.setItem('portal_user', JSON.stringify(newUser));
                } else {
                    throw new Error(response.message || 'Erro ao atualizar');
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao salvar alterações: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('btn-logout-page');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('portal_token');
                localStorage.removeItem('portal_user');
                router.navigate('/login');
            }
        });
    }
}

function formatCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

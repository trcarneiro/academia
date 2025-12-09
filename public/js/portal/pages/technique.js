import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container, params) {
    loadCSS('/css/portal/pages/technique.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'technique-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'technique-content';
    content.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando detalhes da técnica...</p>
        </div>
    `;
    container.appendChild(content);

    await loadTechnique(content, params.id);
}

async function loadTechnique(content, techniqueId) {
    try {
        const response = await api.request('GET', `/courses/technique/${techniqueId}`);
        
        if (response.success && response.data) {
            renderTechnique(content, response.data, techniqueId);
        } else {
            content.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Técnica não encontrada</h3>
                    <p>Não foi possível carregar os detalhes desta técnica.</p>
                    <button class="btn-primary" id="btn-back-courses">Voltar para Cursos</button>
                </div>
            `;
            document.getElementById('btn-back-courses')?.addEventListener('click', () => {
                router.navigate('/courses');
            });
        }
    } catch (error) {
        console.error('Error loading technique:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Erro de conexão</h3>
                <p>Verifique sua conexão e tente novamente.</p>
                <button class="btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

function renderTechnique(content, technique, techniqueId) {
    const isCompleted = technique.status === 'COMPLETED';
    const statusLabel = {
        'COMPLETED': 'Concluído',
        'IN_PROGRESS': 'Em Andamento',
        'LOCKED': 'Bloqueado'
    }[technique.status] || 'Disponível';

    content.innerHTML = `
        <div class="technique-container">
            <div class="technique-header">
                <div class="technique-badge">🥋</div>
                <h1>${technique.name}</h1>
                <span class="technique-status ${technique.status?.toLowerCase()}">${statusLabel}</span>
            </div>

            <div class="technique-description">
                <h2>Descrição</h2>
                <p>${technique.description || 'Técnica de Krav Maga para autodefesa.'}</p>
            </div>

            ${technique.videoUrl ? `
            <div class="technique-video">
                <h2>Vídeo Demonstrativo</h2>
                <div class="video-wrapper">
                    <iframe src="${technique.videoUrl}" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
            ` : ''}

            <div class="technique-steps">
                <h2>Passos para Execução</h2>
                <ol class="steps-list">
                    ${(technique.steps || ['Posição de guarda', 'Executar movimento', 'Finalização']).map(step => `
                        <li>${step}</li>
                    `).join('')}
                </ol>
            </div>

            <div class="technique-tips">
                <h2>Dicas Importantes</h2>
                <ul class="tips-list">
                    ${(technique.tips || ['Mantenha a guarda alta', 'Respire corretamente', 'Pratique lentamente primeiro']).map(tip => `
                        <li>${tip}</li>
                    `).join('')}
                </ul>
            </div>

            ${!isCompleted ? `
            <div class="technique-actions">
                <button class="btn-primary btn-complete" id="btn-mark-complete">
                    Marcar como Concluída ✓
                </button>
            </div>
            ` : `
            <div class="technique-completed-badge">
                <span>✅ Você já dominou esta técnica!</span>
            </div>
            `}

            <button class="btn-text" id="btn-back" style="margin-top: 20px; width: 100%;">
                ← Voltar para Cursos
            </button>
        </div>
    `;

    // Event listeners
    document.getElementById('btn-back')?.addEventListener('click', () => {
        router.navigate('/courses');
    });

    document.getElementById('btn-mark-complete')?.addEventListener('click', async () => {
        await markAsCompleted(content, technique, techniqueId);
    });
}

async function markAsCompleted(content, technique, techniqueId) {
    const btn = document.getElementById('btn-mark-complete');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Salvando...';
    }

    try {
        const response = await api.request('POST', `/courses/technique/${techniqueId}/complete`);
        
        if (response.success) {
            technique.status = 'COMPLETED';
            alert('Técnica marcada como concluída! 🎉');
            renderTechnique(content, technique, techniqueId);
        } else {
            alert(response.message || 'Erro ao atualizar status');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Marcar como Concluída ✓';
            }
        }
    } catch (error) {
        console.error('Error marking technique as completed:', error);
        alert('Erro ao atualizar status. Tente novamente.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Marcar como Concluída ✓';
        }
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

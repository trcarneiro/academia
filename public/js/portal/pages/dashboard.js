import { router } from '../router.js';
import { api } from '../api.js';
import { renderHeader } from '../components/header.js';

export async function renderDashboard(container) {
    loadCSS('/css/portal/pages/dashboard.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    let user = JSON.parse(localStorage.getItem('portal_user') || 'null');
    
    // If no user in cache, try to fetch (or use placeholder)
    if (!user) {
        try {
            const response = await api.request('GET', '/profile');
            if (response.success) {
                user = response.data;
                localStorage.setItem('portal_user', JSON.stringify(user));
            }
        } catch (e) {
            console.warn('Failed to fetch user profile', e);
        }
    }

    // Clear container
    container.innerHTML = '';
    container.className = 'dashboard-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    // Dashboard Content Wrapper
    const content = document.createElement('div');
    content.className = 'dashboard-content';
    content.innerHTML = `
        <!-- Next Class -->
        <div class="next-class-card" id="next-class-card">
            <h3>Próxima Aula</h3>
            <div class="class-info">
                <div>
                    <div class="class-time">19:00</div>
                    <div class="class-name">Krav Maga - Iniciante</div>
                </div>
                <div class="class-location">
                    Unidade Centro<br>
                    Hoje
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="action-btn" id="btn-access">
                <div class="action-icon">📱</div>
                <span class="action-label">Acesso</span>
            </button>
            <button class="action-btn" id="btn-schedule">
                <div class="action-icon">📅</div>
                <span class="action-label">Agenda</span>
            </button>
            <button class="action-btn" id="btn-payments">
                <div class="action-icon">💳</div>
                <span class="action-label">Pagamentos</span>
            </button>
            <button class="action-btn" id="btn-chat">
                <div class="action-icon">💬</div>
                <span class="action-label">Ajuda</span>
            </button>
        </div>

        <!-- Progress -->
        <div class="section">
            <div class="section-header">
                <h3>Meu Progresso</h3>
                <a href="#/courses">Ver tudo</a>
            </div>
            <div class="progress-card">
                <div class="belt-icon">🥋</div>
                <div class="progress-info">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <strong>${user && user.belt ? user.belt : 'Faixa Branca'}</strong>
                        <span>30%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 30%"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                        12 aulas para o exame
                    </div>
                </div>
            </div>
        </div>

        <!-- Ranking Widget -->
        <div class="section">
            <div class="section-header">
                <h3>🏆 Ranking</h3>
                <a href="#/ranking">Ver todos</a>
            </div>
            <div class="ranking-widget" id="ranking-widget">
                <div class="loading-small">
                    <div class="spinner-small"></div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(content);

    // Access Modal (Hidden)
    const modal = document.createElement('div');
    modal.id = 'access-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Acesso ao Totem</h3>
            <div class="qr-code-container" id="qr-container">
                <div class="spinner"></div>
            </div>
            <p>Aproxime este QR Code do leitor</p>
            <p class="timer" id="qr-timer">Expira em 5:00</p>
        </div>
    `;
    container.appendChild(modal);

    // Events
    content.querySelector('#btn-access').addEventListener('click', () => showAccessModal(modal));
    content.querySelector('#btn-schedule').addEventListener('click', () => router.navigate('/schedule'));
    content.querySelector('#btn-payments').addEventListener('click', () => router.navigate('/payments'));
    content.querySelector('#btn-chat').addEventListener('click', () => router.navigate('/chat'));

    // Modal Events
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        stopQrTimer();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            stopQrTimer();
        }
    });

    // Load ranking widget
    loadRankingWidget();
}

async function loadRankingWidget() {
    const widget = document.getElementById('ranking-widget');
    if (!widget) return;

    try {
        const response = await api.request('GET', '/courses/ranking');
        
        if (response.success && response.data?.ranking) {
            const ranking = response.data.ranking.slice(0, 3);
            const userRank = response.data.userRank;

            if (ranking.length === 0) {
                widget.innerHTML = '<p class="empty-text">Ranking em breve</p>';
                return;
            }

            const medals = ['🥇', '🥈', '🥉'];
            widget.innerHTML = `
                <div class="ranking-top">
                    ${ranking.map((s, i) => `
                        <div class="rank-item ${userRank && userRank.id === s.id ? 'is-you' : ''}">
                            <span class="medal">${medals[i]}</span>
                            <span class="name">${s.name?.split(' ')[0] || 'Aluno'}</span>
                            <span class="points">${s.points || 0} pts</span>
                        </div>
                    `).join('')}
                </div>
                ${userRank ? `
                    <div class="your-rank">
                        Sua posição: <strong>#${userRank.position}</strong> (${userRank.points || 0} pts)
                    </div>
                ` : ''}
            `;
        } else {
            widget.innerHTML = '<p class="empty-text">Ranking em breve</p>';
        }
    } catch (error) {
        console.error('Error loading ranking:', error);
        widget.innerHTML = '<p class="empty-text">Erro ao carregar</p>';
    }
}

let qrTimerInterval;

async function showAccessModal(modal) {
    const qrContainer = modal.querySelector('#qr-container');
    
    modal.classList.add('visible');
    qrContainer.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Simulate API call for MVP
        // const response = await api.request('GET', '/dashboard/access-qrcode');
        
        // Mock response
        await new Promise(r => setTimeout(r, 1000));
        const mockQr = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ACCESS_TOKEN_123';
        
        qrContainer.innerHTML = `<img src="${mockQr}" alt="QR Code de Acesso">`;
        startQrTimer(300); // 5 minutes

    } catch (error) {
        console.error(error);
        qrContainer.innerHTML = '<p style="color: red">Erro de conexão</p>';
    }
}

function startQrTimer(seconds) {
    stopQrTimer();
    const display = document.getElementById('qr-timer');
    let remaining = seconds;
    
    updateDisplay(remaining);
    
    qrTimerInterval = setInterval(() => {
        remaining--;
        if (remaining < 0) {
            stopQrTimer();
            display.textContent = 'Expirado';
            document.getElementById('qr-container').innerHTML = '<p>QR Code expirado. Feche e abra novamente.</p>';
            return;
        }
        updateDisplay(remaining);
    }, 1000);
    
    function updateDisplay(s) {
        if (!display) return;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        display.textContent = `Expira em ${m}:${sec.toString().padStart(2, '0')}`;
    }
}

function stopQrTimer() {
    if (qrTimerInterval) {
        clearInterval(qrTimerInterval);
        qrTimerInterval = null;
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

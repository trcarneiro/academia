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
            <button class="action-btn" id="btn-notifications">
                <div class="action-icon">🔔</div>
                <span class="action-label">Avisos</span>
                <span id="unread-count" class="badge" style="display: none;"></span>
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

        <!-- Turmas Quase Ativas -->
        <div class="section" id="inactive-classes-section" style="display: none;">
            <div class="section-header">
                <h3>Turmas em Formação</h3>
                <span class="badge-new" style="background: #FF9800; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">Novidade</span>
            </div>
            <div class="inactive-classes-list" id="inactive-classes-list" style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Populated by JS -->
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

    // Fetch Inactive Classes
    fetchInactiveClasses(content, user);

    // Fetch Credit Summary
    fetchCreditSummary(content, user);

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
    content.querySelector('#btn-notifications').addEventListener('click', () => router.navigate('/notifications'));

    // Check Unread Notifications
    try {
        const res = await api.request('GET', '/notifications');
        if (res.success && res.data.unreadCount > 0) {
            const badge = content.querySelector('#unread-count');
            badge.textContent = res.data.unreadCount;
            badge.style.display = 'block';
            badge.style.position = 'absolute';
            badge.style.top = '0';
            badge.style.right = '10px';
            badge.style.background = '#ef4444';
            badge.style.color = 'white';
            badge.style.fontSize = '0.7rem';
            badge.style.padding = '2px 6px';
            badge.style.borderRadius = '10px';
            badge.style.fontWeight = 'bold';
        }
    } catch (e) {
        console.warn('Failed to fetch unread count', e);
    }

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

async function fetchInactiveClasses(content, user) {
    try {
        const response = await api.request('GET', '/turmas?isActive=false');
        if (response.success && response.data && response.data.length > 0) {
            const inactiveClasses = response.data;
            const list = content.querySelector('#inactive-classes-list');
            const section = content.querySelector('#inactive-classes-section');

            section.style.display = 'block';

            list.innerHTML = inactiveClasses.map(turma => {
                const interested = turma._count?.interests || 0;
                const needed = turma.minimumStudents || 5;
                const progress = Math.min(100, (interested / needed) * 100);
                // Check if user is already interested
                // Note: API should return if current user is interested, or we check locally if we have the list
                // For now, assuming we might need to fetch interests or the API includes it.
                // The list API includes _count.interests. It might not include the list of interests itself for privacy/performance.
                // But for the user to know if they are interested, we need that info.
                // Let's assume for now we don't know, or we need to fetch it.
                // Or better, the API should return `isInterested` flag if user context is known.
                // Since we are using `api.request`, it sends the token.
                // But `TurmasService.list` doesn't check for specific user interest.

                // Workaround: We will handle the button state optimistically or just show "Tenho Interesse" and if they click and already are, handle the error or toggle.
                // Ideally, we update the API to return `isInterested`.

                const isInterested = false; // Placeholder until API update

                // Format schedule
                const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const dayNames = turma.schedule?.daysOfWeek?.map(d => days[d]).join(', ') || 'A definir';
                const time = turma.schedule?.time || '--:--';

                return `
                    <div class="inactive-class-card" style="background: #fff; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee;">
                        <div class="class-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 1rem; color: #333;">${turma.name}</h4>
                            <span class="status-badge" style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Faltam ${Math.max(0, needed - interested)}</span>
                        </div>
                        <div class="class-details" style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                                <span>📅</span> <span>${dayNames} às ${time}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span>👨‍🏫</span> <span>${turma.instructor?.name || 'Instrutor a definir'}</span>
                            </div>
                        </div>
                        <div class="interest-progress" style="margin-bottom: 12px;">
                            <div class="progress-bar" style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
                                <div class="progress-fill" style="width: ${progress}%; height: 100%; background: #FF9800;"></div>
                            </div>
                            <span class="progress-text" style="font-size: 0.75rem; color: #888;">${interested}/${needed} interessados</span>
                        </div>
                        <button class="btn-interest" 
                            onclick="window.handleInterest('${turma.id}')"
                            style="width: 100%; padding: 8px; border: none; border-radius: 6px; background: #667eea; color: white; font-weight: 600; cursor: pointer;">
                            ✋ Tenho Interesse
                        </button>
                    </div>
                `;
            }).join('');

            // Add global handler
            window.handleInterest = async (turmaId) => {
                try {
                    // We need studentId. User object should have it.
                    if (!user || !user.studentId) {
                        alert('Erro: Perfil de aluno não encontrado.');
                        return;
                    }

                    const res = await api.request('POST', `/turmas/${turmaId}/interest`, { studentId: user.studentId });
                    if (res.success) {
                        alert('Interesse registrado com sucesso! Você será notificado quando a turma for ativada.');
                        fetchInactiveClasses(content, user);
                    } else {
                        // If already interested, maybe we want to remove?
                        // The API returns the interest object if exists.
                        // If we want to toggle, we need to know state.
                        // For now, let's assume it just registers.
                        alert('Interesse registrado!');
                    }
                } catch (e) {
                    console.error('Error handling interest', e);
                    alert('Erro ao processar solicitação');
                }
            };
        }
    } catch (e) {
        console.error('Failed to fetch inactive classes', e);
    }
}

async function fetchCreditSummary(content, user) {
    if (!user || !user.studentId) return;

    try {
        const response = await api.request('GET', `/credits/summary/${user.studentId}`);
        if (response.success && response.data) {
            const summary = response.data;

            // Create Credit Card
            const creditCard = document.createElement('div');
            creditCard.className = 'section';
            creditCard.innerHTML = `
                <div class="section-header">
                    <h3>💳 Meus Créditos</h3>
                    <span style="font-size: 0.9rem; color: #666;">Renova em ${summary.expiringFirst?.daysUntilExpiry ? summary.expiringFirst.daysUntilExpiry + ' dias' : 'N/A'}</span>
                </div>
                <div class="credit-summary-card" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                            <div style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Saldo Atual</div>
                            <div style="font-size: 2rem; font-weight: 700;">${summary.totalAvailable} <span style="font-size: 1rem; font-weight: 400; color: #cbd5e1;">créditos</span></div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px;">
                            🎫
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px;">
                            <div style="font-size: 0.75rem; color: #94a3b8;">Usados</div>
                            <div style="font-size: 1.1rem; font-weight: 600;">${summary.totalUsed}</div>
                        </div>
                        <div style="flex: 1; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px;">
                            <div style="font-size: 0.75rem; color: #94a3b8;">Total do Plano</div>
                            <div style="font-size: 1.1rem; font-weight: 600;">${summary.totalCredits}</div>
                        </div>
                    </div>

                    ${summary.totalAvailable === 0 ? `
                        <div style="margin-top: 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); padding: 8px; border-radius: 6px; font-size: 0.85rem; color: #fca5a5; display: flex; align-items: center; gap: 8px;">
                            ⚠️ <strong>Sem créditos!</strong> Nova cobrança será gerada ao agendar.
                        </div>
                    ` : ''}

                    ${summary.totalAvailable > 0 && summary.totalAvailable <= 2 ? `
                        <div style="margin-top: 12px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); padding: 8px; border-radius: 6px; font-size: 0.85rem; color: #fcd34d; display: flex; align-items: center; gap: 8px;">
                            ⚠️ <strong>Créditos baixos</strong>
                        </div>
                    ` : ''}
                </div>
            `;

            // Insert after "Quick Actions" (index 1 in childNodes? or just prepend/append)
            // dashboard-content structure:
            // 0: next-class-card
            // 1: quick-actions
            // 2: progress section
            // We want it maybe after Progress?
            content.insertBefore(creditCard, content.childNodes[3]); // Insert after Progress
        }
    } catch (e) {
        console.warn('Failed to fetch credit summary', e);
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

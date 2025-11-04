/**
 * CheckinView - View principal para check-in de frequência
 */

export class CheckinView {
    constructor() {
        this.template = null;
    }

    /**
     * Renderizar view de check-in
     */
    render(students = [], sessions = []) {
        return `
            <div class="frequency-checkin-view">
                <!-- Header da Página -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title">
                            <h1>✅ Check-in de Frequência</h1>
                            <p>Registre a presença dos alunos nas sessões</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" id="bulk-checkin">
                                📝 Check-in em Lote
                            </button>
                            <button class="btn-primary" id="refresh-data">
                                🔄 Atualizar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Breadcrumb Navigation -->
                    <nav class="breadcrumb-nav">
                        <span class="breadcrumb-item">Academia</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item active">✅ Frequência</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item active">Check-in</span>
                    </nav>
                </div>

                <!-- Stats Cards Row -->
                <div class="stats-overview">
                    <div class="stats-grid">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📅</div>
                            <div class="stat-content">
                                <div class="stat-value" id="today-checkins">0</div>
                                <div class="stat-label">Check-ins Hoje</div>
                                <div class="stat-trend trend-up">
                                    📈 +12%
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🏃</div>
                            <div class="stat-content">
                                <div class="stat-value" id="active-sessions">${sessions.length}</div>
                                <div class="stat-label">Sessões Ativas</div>
                                <div class="stat-additional">
                                    ${sessions.filter(s => s.status === 'IN_PROGRESS').length} em andamento
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">👥</div>
                            <div class="stat-content">
                                <div class="stat-value" id="present-students">0</div>
                                <div class="stat-label">Alunos Presentes</div>
                                <div class="stat-additional">
                                    de ${students.length} ativos
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-content">
                                <div class="stat-value" id="avg-response">2.3s</div>
                                <div class="stat-label">Tempo Médio</div>
                                <div class="stat-additional">
                                    por check-in
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="main-content">
                    <div class="content-grid">
                        <!-- Formulário de Check-in -->
                        <div class="checkin-section">
                            <div id="checkin-form-container" class="form-container">
                                <!-- CheckinForm component será renderizado aqui -->
                            </div>

                            <!-- Quick Actions -->
                            <div class="quick-actions data-card-premium">
                                <h4>🚀 Ações Rápidas</h4>
                                <div class="action-buttons">
                                    <button class="action-btn" id="scan-qr">
                                        📷 Scanner QR
                                    </button>
                                    <button class="action-btn" id="manual-entry">
                                        ✍️ Entrada Manual
                                    </button>
                                    <button class="action-btn" id="bulk-import">
                                        📋 Importar Lista
                                    </button>
                                    <button class="action-btn" id="emergency-checkin">
                                        🚨 Check-in Emergência
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Live Feed -->
                        <div class="live-section">
                            <div class="live-feed data-card-premium">
                                <div class="feed-header">
                                    <h4>📡 Feed ao Vivo</h4>
                                    <div class="feed-controls">
                                        <button class="btn-icon" id="pause-feed">⏸️</button>
                                        <button class="btn-icon" id="clear-feed">🗑️</button>
                                    </div>
                                </div>
                                <div class="feed-content" id="live-feed">
                                    <div class="feed-item">
                                        <div class="feed-time">Aguardando check-ins...</div>
                                        <div class="feed-message">O feed será atualizado automaticamente</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Current Sessions -->
                            <div class="current-sessions data-card-premium">
                                <h4>🏃 Sessões Atuais</h4>
                                <div class="sessions-list" id="current-sessions">
                                    ${this.renderCurrentSessions(sessions)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Actions -->
                <div class="bottom-actions">
                    <div class="actions-container">
                        <button class="btn-outline" id="view-history">
                            📊 Ver Histórico
                        </button>
                        <button class="btn-outline" id="export-today">
                            📥 Exportar Hoje
                        </button>
                        <button class="btn-outline" id="generate-report">
                            📈 Gerar Relatório
                        </button>
                        <button class="btn-primary" id="finish-session">
                            ✅ Finalizar Sessões
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar sessões atuais
     */
    renderCurrentSessions(sessions) {
        if (!sessions || sessions.length === 0) {
            return `
                <div class="no-sessions">
                    <div class="no-sessions-icon">🏃</div>
                    <p>Nenhuma sessão programada para hoje</p>
                </div>
            `;
        }

        const now = new Date();
        const todaySessions = sessions.filter(session => {
            const sessionDate = new Date(session.startAt);
            return sessionDate.toDateString() === now.toDateString();
        });

        return todaySessions.map(session => {
            const startTime = new Date(session.startAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const endTime = session.endAt ? new Date(session.endAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';

            const statusClass = this.getSessionStatusClass(session.status);
            const statusIcon = this.getSessionStatusIcon(session.status);

            return `
                <div class="session-item ${statusClass}" data-session-id="${session.id}">
                    <div class="session-time">
                        <div class="session-start">${startTime}</div>
                        ${endTime ? `<div class="session-end">até ${endTime}</div>` : ''}
                    </div>
                    
                    <div class="session-info">
                        <div class="session-course">${session.course?.name || 'Curso não definido'}</div>
                        <div class="session-instructor">
                            👨‍🏫 ${session.instructor?.name || 'Instrutor não definido'}
                        </div>
                        <div class="session-location">
                            📍 ${session.location || 'Local não definido'}
                        </div>
                    </div>
                    
                    <div class="session-status">
                        <span class="status-badge">
                            ${statusIcon} ${this.getSessionStatusText(session.status)}
                        </span>
                        <div class="session-attendance">
                            <span id="attendance-count-${session.id}">0</span> presentes
                        </div>
                    </div>
                    
                    <div class="session-actions">
                        <button class="btn-icon" onclick="quickCheckin('${session.id}')" title="Check-in rápido">
                            ⚡
                        </button>
                        <button class="btn-icon" onclick="viewSessionDetails('${session.id}')" title="Ver detalhes">
                            👁️
                        </button>
                        <button class="btn-icon" onclick="startSession('${session.id}')" title="Iniciar sessão">
                            ▶️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Obter classe CSS do status da sessão
     */
    getSessionStatusClass(status) {
        const classes = {
            'SCHEDULED': 'session-scheduled',
            'IN_PROGRESS': 'session-active',
            'COMPLETED': 'session-completed',
            'CANCELLED': 'session-cancelled'
        };
        return classes[status] || 'session-unknown';
    }

    /**
     * Obter ícone do status da sessão
     */
    getSessionStatusIcon(status) {
        const icons = {
            'SCHEDULED': '⏰',
            'IN_PROGRESS': '🟢',
            'COMPLETED': '✅',
            'CANCELLED': '❌'
        };
        return icons[status] || '❓';
    }

    /**
     * Obter texto do status da sessão
     */
    getSessionStatusText(status) {
        const texts = {
            'SCHEDULED': 'Programada',
            'IN_PROGRESS': 'Em Andamento',
            'COMPLETED': 'Finalizada',
            'CANCELLED': 'Cancelada'
        };
        return texts[status] || 'Desconhecido';
    }

    /**
     * Atualizar feed ao vivo
     */
    updateLiveFeed(checkinData) {
        const feedContainer = document.getElementById('live-feed');
        if (!feedContainer) return;

        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item feed-new';
        
        const time = new Date().toLocaleTimeString('pt-BR');
        feedItem.innerHTML = `
            <div class="feed-time">${time}</div>
            <div class="feed-message">
                ✅ <strong>${checkinData.student?.name || 'Aluno'}</strong> 
                fez check-in em <em>${checkinData.session?.course?.name || 'Sessão'}</em>
            </div>
            <div class="feed-device">${this.getDeviceIcon(checkinData.context?.device)}</div>
        `;

        // Adicionar no topo
        feedContainer.insertBefore(feedItem, feedContainer.firstChild);

        // Limitar a 10 itens
        while (feedContainer.children.length > 10) {
            feedContainer.removeChild(feedContainer.lastChild);
        }

        // Remover classe de destaque após animação
        setTimeout(() => {
            feedItem.classList.remove('feed-new');
        }, 2000);
    }

    /**
     * Atualizar contador de sessão
     */
    updateSessionAttendance(sessionId, count) {
        const counterEl = document.getElementById(`attendance-count-${sessionId}`);
        if (counterEl) {
            counterEl.textContent = count;
        }
    }

    /**
     * Atualizar estatísticas principais
     */
    updateMainStats(stats) {
        const todayEl = document.getElementById('today-checkins');
        const presentEl = document.getElementById('present-students');
        const avgEl = document.getElementById('avg-response');

        if (todayEl) todayEl.textContent = stats.todayCheckins || 0;
        if (presentEl) presentEl.textContent = stats.presentStudents || 0;
        if (avgEl) avgEl.textContent = stats.avgResponse || '0s';
    }

    /**
     * Mostrar notificação de sucesso
     */
    showSuccessNotification(message) {
        // Implementar notificação toast
        console.log('✅ Success:', message);
        
        // Criar notificação temporária
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Mostrar notificação de erro
     */
    showErrorNotification(message) {
        console.error('❌ Error:', message);
        
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Ícone do dispositivo
     */
    getDeviceIcon(device) {
        const icons = {
            'mobile': '📱',
            'desktop': '💻',
            'kiosk': '🖥️'
        };
        return icons[device] || '💻';
    }

    /**
     * Limpar feed
     */
    clearLiveFeed() {
        const feedContainer = document.getElementById('live-feed');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div class="feed-item">
                    <div class="feed-time">Feed limpo</div>
                    <div class="feed-message">Aguardando novos check-ins...</div>
                </div>
            `;
        }
    }

    /**
     * Pausar/despausar feed
     */
    toggleFeedPause() {
        const pauseBtn = document.getElementById('pause-feed');
        const feedContainer = document.getElementById('live-feed');
        
        if (pauseBtn && feedContainer) {
            const isPaused = feedContainer.classList.contains('feed-paused');
            
            if (isPaused) {
                feedContainer.classList.remove('feed-paused');
                pauseBtn.textContent = '⏸️';
            } else {
                feedContainer.classList.add('feed-paused');
                pauseBtn.textContent = '▶️';
            }
        }
    }
}

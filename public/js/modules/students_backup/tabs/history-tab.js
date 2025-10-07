/**
 * History Tab Component
 * Displays student activity history, attendance, and logs
 */

export class HistoryTab {
    constructor(editorController) {
        this.editor = editorController;
        this.attendanceHistory = [];
        this.activityLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        this.init();
    }

    init() {
        console.log('📊 Inicializando aba de Histórico...');
    }

    /**
     * Render history tab content
     */
    render(container) {
        const html = `
            <div class="history-tab-content">
                <!-- History Navigation -->
                <div class="history-navigation">
                    <div class="nav-tabs">
                        <button class="nav-tab active" data-tab="attendance" onclick="window.switchHistoryTab('attendance')">
                            📅 Presenças
                        </button>
                        <button class="nav-tab" data-tab="activities" onclick="window.switchHistoryTab('activities')">
                            📋 Atividades
                        </button>
                        <button class="nav-tab" data-tab="payments" onclick="window.switchHistoryTab('payments')">
                            💰 Pagamentos
                        </button>
                        <button class="nav-tab" data-tab="system" onclick="window.switchHistoryTab('system')">
                            ⚙️ Sistema
                        </button>
                    </div>
                    
                    <div class="history-filters">
                        <select id="history-period-filter" class="form-control">
                            <option value="all">Todos os períodos</option>
                            <option value="last-week">Última semana</option>
                            <option value="last-month">Último mês</option>
                            <option value="last-3-months">Últimos 3 meses</option>
                            <option value="last-year">Último ano</option>
                        </select>
                        
                        <input type="text" 
                               id="history-search" 
                               class="form-control" 
                               placeholder="Buscar no histórico...">
                    </div>
                </div>

                <!-- History Content Tabs -->
                <div class="history-content">
                    <!-- Attendance History -->
                    <div id="attendance-history" class="history-tab-content active">
                        <div class="section-header">
                            <h3>Histórico de Presenças</h3>
                            <div class="section-stats">
                                <div class="stat-item">
                                    <span class="stat-value" id="total-classes">0</span>
                                    <span class="stat-label">Total de Aulas</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="present-classes">0</span>
                                    <span class="stat-label">Presenças</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value" id="attendance-rate">0%</span>
                                    <span class="stat-label">Taxa de Presença</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="attendance-list" class="history-list">
                            ${this.renderAttendanceHistory()}
                        </div>
                    </div>

                    <!-- Activities History -->
                    <div id="activities-history" class="history-tab-content">
                        <div class="section-header">
                            <h3>Histórico de Atividades</h3>
                        </div>
                        
                        <div id="activities-list" class="history-list">
                            ${this.renderActivitiesHistory()}
                        </div>
                    </div>

                    <!-- Payments History -->
                    <div id="payments-history" class="history-tab-content">
                        <div class="section-header">
                            <h3>Histórico de Pagamentos</h3>
                        </div>
                        
                        <div id="payments-list" class="history-list">
                            ${this.renderPaymentsHistory()}
                        </div>
                    </div>

                    <!-- System History -->
                    <div id="system-history" class="history-tab-content">
                        <div class="section-header">
                            <h3>Histórico do Sistema</h3>
                        </div>
                        
                        <div id="system-list" class="history-list">
                            ${this.renderSystemHistory()}
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="history-pagination">
                    <button id="prev-page" class="btn btn-secondary" onclick="window.changePage(-1)" disabled>
                        ← Anterior
                    </button>
                    <span id="page-info">Página 1 de 1</span>
                    <button id="next-page" class="btn btn-secondary" onclick="window.changePage(1)" disabled>
                        Próxima →
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
        this.bindEvents(container);
        this.loadHistoryData();
    }

    /**
     * Render attendance history
     */
    renderAttendanceHistory() {
        if (!this.attendanceHistory || this.attendanceHistory.length === 0) {
            return `
                <div class="no-history">
                    <div class="no-history-icon">📅</div>
                    <h4>Nenhum registro de presença encontrado</h4>
                    <p>O histórico de presenças aparecerá aqui conforme o estudante participar das aulas.</p>
                </div>
            `;
        }

        return this.attendanceHistory.map(attendance => `
            <div class="history-item attendance-item">
                <div class="item-icon ${attendance.status === 'PRESENT' ? 'present' : 'absent'}">
                    ${attendance.status === 'PRESENT' ? '✅' : '❌'}
                </div>
                
                <div class="item-content">
                    <div class="item-header">
                        <h4 class="item-title">${attendance.class?.name || 'Aula'}</h4>
                        <span class="item-date">${new Date(attendance.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div class="item-details">
                        <span class="attendance-status ${attendance.status.toLowerCase()}">
                            ${attendance.status === 'PRESENT' ? 'Presente' : 'Ausente'}
                        </span>
                        
                        ${attendance.class?.instructor ? `
                            <span class="instructor">Instrutor: ${attendance.class.instructor}</span>
                        ` : ''}
                        
                        ${attendance.class?.duration ? `
                            <span class="duration">Duração: ${attendance.class.duration}min</span>
                        ` : ''}
                    </div>
                    
                    ${attendance.notes ? `
                        <div class="item-notes">${attendance.notes}</div>
                    ` : ''}
                </div>
                
                <div class="item-actions">
                    <button onclick="window.viewAttendanceDetails('${attendance.id}')" 
                            class="btn btn-sm btn-secondary"
                            title="Ver detalhes">
                        👁️
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render activities history
     */
    renderActivitiesHistory() {
        // Mock activities data
        const activities = [
            {
                id: '1',
                type: 'enrollment',
                title: 'Matrícula realizada',
                description: 'Estudante matriculado no curso de Krav Maga',
                date: new Date().toISOString(),
                icon: '📝'
            },
            {
                id: '2',
                type: 'plan_change',
                title: 'Plano alterado',
                description: 'Plano alterado de Básico para Premium',
                date: new Date(Date.now() - 86400000).toISOString(),
                icon: '🔄'
            }
        ];

        if (activities.length === 0) {
            return `
                <div class="no-history">
                    <div class="no-history-icon">📋</div>
                    <h4>Nenhuma atividade registrada</h4>
                    <p>As atividades do estudante aparecerão aqui.</p>
                </div>
            `;
        }

        return activities.map(activity => `
            <div class="history-item activity-item">
                <div class="item-icon">${activity.icon}</div>
                
                <div class="item-content">
                    <div class="item-header">
                        <h4 class="item-title">${activity.title}</h4>
                        <span class="item-date">${new Date(activity.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div class="item-description">${activity.description}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render payments history
     */
    renderPaymentsHistory() {
        // This would typically come from the financial tab data
        const payments = [];

        if (payments.length === 0) {
            return `
                <div class="no-history">
                    <div class="no-history-icon">💰</div>
                    <h4>Nenhum pagamento registrado</h4>
                    <p>O histórico de pagamentos aparecerá aqui.</p>
                </div>
            `;
        }

        return payments.map(payment => `
            <div class="history-item payment-item">
                <div class="item-icon">${payment.status === 'PAID' ? '💚' : '💔'}</div>
                
                <div class="item-content">
                    <div class="item-header">
                        <h4 class="item-title">${payment.description}</h4>
                        <span class="item-date">${new Date(payment.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div class="item-details">
                        <span class="payment-amount">R$ ${payment.amount}</span>
                        <span class="payment-status ${payment.status.toLowerCase()}">${payment.status}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render system history
     */
    renderSystemHistory() {
        // Mock system logs
        const systemLogs = [
            {
                id: '1',
                action: 'user_created',
                description: 'Conta do estudante criada',
                user: 'Sistema',
                date: new Date().toISOString(),
                icon: '👤'
            },
            {
                id: '2',
                action: 'profile_updated',
                description: 'Perfil atualizado',
                user: 'Admin',
                date: new Date(Date.now() - 3600000).toISOString(),
                icon: '✏️'
            }
        ];

        if (systemLogs.length === 0) {
            return `
                <div class="no-history">
                    <div class="no-history-icon">⚙️</div>
                    <h4>Nenhum log do sistema</h4>
                    <p>Os logs de sistema aparecerão aqui.</p>
                </div>
            `;
        }

        return systemLogs.map(log => `
            <div class="history-item system-item">
                <div class="item-icon">${log.icon}</div>
                
                <div class="item-content">
                    <div class="item-header">
                        <h4 class="item-title">${log.description}</h4>
                        <span class="item-date">${new Date(log.date).toLocaleDateString('pt-BR')} às ${new Date(log.date).toLocaleTimeString('pt-BR')}</span>
                    </div>
                    
                    <div class="item-details">
                        <span class="log-user">Por: ${log.user}</span>
                        <span class="log-action">${log.action}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load history data from API
     */
    async loadHistoryData() {
        if (!this.editor.studentId) return;

        try {
            // Load attendance history
            this.attendanceHistory = await this.editor.service.getStudentAttendanceHistory(this.editor.studentId);
            
            // Update displays
            this.updateAttendanceStats();
            this.updateAttendanceDisplay();
            
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
        }
    }

    /**
     * Load data from editor
     */
    loadData(studentData) {
        this.studentData = studentData;
        this.attendanceHistory = studentData.attendances || [];
        this.loadHistoryData();
    }

    /**
     * Update attendance statistics
     */
    updateAttendanceStats() {
        const totalClasses = this.attendanceHistory.length;
        const presentClasses = this.attendanceHistory.filter(a => a.status === 'PRESENT').length;
        const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

        const totalElement = document.getElementById('total-classes');
        const presentElement = document.getElementById('present-classes');
        const rateElement = document.getElementById('attendance-rate');

        if (totalElement) totalElement.textContent = totalClasses;
        if (presentElement) presentElement.textContent = presentClasses;
        if (rateElement) rateElement.textContent = attendanceRate + '%';
    }

    /**
     * Update attendance display
     */
    updateAttendanceDisplay() {
        const container = document.getElementById('attendance-list');
        if (container) {
            container.innerHTML = this.renderAttendanceHistory();
        }
    }

    /**
     * Switch between history tabs
     */
    switchHistoryTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.history-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${tabName}-history`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    /**
     * Change page for pagination
     */
    changePage(direction) {
        const newPage = this.currentPage + direction;
        const totalPages = Math.ceil(this.attendanceHistory.length / this.itemsPerPage);

        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.updatePagination();
            this.updateAttendanceDisplay();
        }
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const totalPages = Math.ceil(this.attendanceHistory.length / this.itemsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageInfo = document.getElementById('page-info');

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
    }

    /**
     * Filter history by period
     */
    filterByPeriod(period) {
        let filteredHistory = [...this.attendanceHistory];

        if (period !== 'all') {
            const now = new Date();
            let cutoffDate;

            switch (period) {
                case 'last-week':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'last-month':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'last-3-months':
                    cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case 'last-year':
                    cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
            }

            if (cutoffDate) {
                filteredHistory = filteredHistory.filter(item => 
                    new Date(item.date) >= cutoffDate
                );
            }
        }

        this.attendanceHistory = filteredHistory;
        this.currentPage = 1;
        this.updateAttendanceDisplay();
        this.updatePagination();
    }

    /**
     * Search in history
     */
    searchHistory(query) {
        if (!query.trim()) {
            this.loadHistoryData();
            return;
        }

        const filteredHistory = this.attendanceHistory.filter(item =>
            (item.class?.name || '').toLowerCase().includes(query.toLowerCase()) ||
            (item.notes || '').toLowerCase().includes(query.toLowerCase())
        );

        this.attendanceHistory = filteredHistory;
        this.updateAttendanceDisplay();
    }

    /**
     * Bind events
     */
    bindEvents(container) {
        // Make functions available globally
        window.switchHistoryTab = (tab) => this.switchHistoryTab(tab);
        window.changePage = (direction) => this.changePage(direction);
        window.viewAttendanceDetails = (id) => this.viewAttendanceDetails(id);

        // Period filter
        const periodFilter = container.querySelector('#history-period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', (e) => {
                this.filterByPeriod(e.target.value);
            });
        }

        // Search
        const searchInput = container.querySelector('#history-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchHistory(e.target.value);
                }, 300);
            });
        }
    }

    /**
     * View attendance details
     */
    viewAttendanceDetails(attendanceId) {
        console.log('👁️ Visualizando detalhes da presença:', attendanceId);
        const attendance = this.attendanceHistory.find(a => a.id === attendanceId);
        if (attendance) {
            // Implementation for showing attendance details modal
            alert(`Detalhes da aula: ${attendance.class?.name || 'Aula'} em ${new Date(attendance.date).toLocaleDateString('pt-BR')}`);
        }
    }

    /**
     * Get tab data
     */
    getData() {
        return {
            attendanceHistory: this.attendanceHistory,
            activityLogs: this.activityLogs
        };
    }

    /**
     * Validate tab
     */
    async validate() {
        // History tab doesn't need validation
        return [];
    }

    /**
     * Cleanup
     */
    destroy() {
        // Remove global handlers
        delete window.switchHistoryTab;
        delete window.changePage;
        delete window.viewAttendanceDetails;
        
        console.log('🧹 History Tab destruído');
    }
}

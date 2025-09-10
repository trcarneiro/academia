// TurmasAttendanceView - Visualização de frequência das turmas
// Gerencia presença dos alunos nas aulas

export class TurmasAttendanceView {
    constructor() {
        this.container = null;
        this.currentTurma = null;
        this.currentLesson = null;
        this.attendanceData = [];
        this.events = {
            onBack: null,
            onAttendanceUpdate: null
        };
    }

    render(container, turma, options = {}) {
        this.container = container;
        this.currentTurma = turma;
        this.currentLesson = options.lessonId || null;
        
        container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-header-nav">
                            <button id="backToDetail" class="btn-back">
                                <span class="icon">←</span>
                                <span>Voltar</span>
                            </button>
                            <div class="breadcrumb">
                                <span>Turmas</span>
                                <span>/</span>
                                <span>${turma.course?.name || 'Curso'}</span>
                                <span>/</span>
                                <span>Frequência</span>
                            </div>
                        </div>
                        <h1>📋 Frequência da Turma</h1>
                        <p>Gerencie a presença dos alunos nas aulas</p>
                    </div>
                </div>

                <!-- Filtros e controles -->
                <div class="attendance-controls">
                    <div class="controls-left">
                        <div class="filter-group">
                            <label for="lessonFilter">Filtrar por aula:</label>
                            <select id="lessonFilter" class="filter-select">
                                <option value="">Carregando aulas...</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="dateFilter">Período:</label>
                            <select id="dateFilter" class="filter-select">
                                <option value="">Todos os períodos</option>
                                <option value="week">Esta semana</option>
                                <option value="month">Este mês</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>
                    </div>
                    <div class="controls-right">
                        <button id="exportAttendance" class="btn-action">
                            <span>📊</span>
                            <span>Exportar</span>
                        </button>
                        <button id="generateReport" class="btn-action btn-primary">
                            <span>📋</span>
                            <span>Relatório</span>
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="attendance-stats">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalStudents">0</div>
                            <div class="stat-label">Total de Alunos</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-value" id="avgAttendance">0%</div>
                            <div class="stat-label">Frequência Média</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalLessons">0</div>
                            <div class="stat-label">Aulas Realizadas</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-content">
                            <div class="stat-value" id="lowAttendance">0</div>
                            <div class="stat-label">Baixa Frequência</div>
                        </div>
                    </div>
                </div>

                <!-- Tabela de frequência -->
                <div class="attendance-table-container">
                    <div id="attendanceTable" class="attendance-table">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                    
                    <!-- Loading -->
                    <div id="loadingState" class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Carregando dados de frequência...</p>
                    </div>
                    
                    <!-- Empty state -->
                    <div id="emptyState" class="empty-state" style="display: none;">
                        <div class="empty-icon">📋</div>
                        <h3>Nenhum dado de frequência</h3>
                        <p>Não há registros de frequência para exibir</p>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadData();
    }

    setupEventListeners() {
        // Navegação
        const backBtn = this.container.querySelector('#backToDetail');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.events.onBack) {
                    this.events.onBack();
                }
            });
        }

        // Filtros
        const lessonFilter = this.container.querySelector('#lessonFilter');
        const dateFilter = this.container.querySelector('#dateFilter');

        if (lessonFilter) {
            lessonFilter.addEventListener('change', () => this.applyFilters());
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }

        // Ações
        const exportBtn = this.container.querySelector('#exportAttendance');
        const reportBtn = this.container.querySelector('#generateReport');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAttendance());
        }

        if (reportBtn) {
            reportBtn.addEventListener('click', () => this.generateReport());
        }
    }

    async loadData() {
        try {
            this.showLoading();
            
            // Carregar dados de frequência
            const response = await turmasAPI.fetch(`/api/turmas/${this.currentTurma.id}/attendance`);
            this.attendanceData = response.data || [];
            
            this.renderAttendanceTable();
            this.updateStats();
            this.populateLessonFilter();
            
        } catch (error) {
            console.error('Erro ao carregar frequência:', error);
            this.showError('Erro ao carregar dados de frequência');
        } finally {
            this.hideLoading();
        }
    }

    renderAttendanceTable() {
        const container = this.container.querySelector('#attendanceTable');
        const emptyState = this.container.querySelector('#emptyState');
        
        if (!this.attendanceData || this.attendanceData.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        container.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Implementação básica da tabela
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Aluno</th>
                        <th>Aula</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.attendanceData.map(record => `
                        <tr>
                            <td>${record.student?.name || 'N/A'}</td>
                            <td>${record.lesson?.title || 'N/A'}</td>
                            <td>${this.formatDate(record.lesson?.scheduledDate)}</td>
                            <td>
                                <span class="status-badge ${record.present ? 'present' : 'absent'}">
                                    ${record.present ? 'Presente' : 'Ausente'}
                                </span>
                            </td>
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    updateStats() {
        // Implementação básica das estatísticas
        const totalStudentsEl = this.container.querySelector('#totalStudents');
        const avgAttendanceEl = this.container.querySelector('#avgAttendance');
        const totalLessonsEl = this.container.querySelector('#totalLessons');
        const lowAttendanceEl = this.container.querySelector('#lowAttendance');
        
        if (totalStudentsEl) totalStudentsEl.textContent = '0';
        if (avgAttendanceEl) avgAttendanceEl.textContent = '0%';
        if (totalLessonsEl) totalLessonsEl.textContent = '0';
        if (lowAttendanceEl) lowAttendanceEl.textContent = '0';
    }

    populateLessonFilter() {
        const select = this.container.querySelector('#lessonFilter');
        if (!select) return;
        
        select.innerHTML = `
            <option value="">Todas as aulas</option>
            <!-- Opções serão adicionadas dinamicamente -->
        `;
    }

    applyFilters() {
        // Implementar filtros
        this.renderAttendanceTable();
    }

    async exportAttendance() {
        try {
            const data = {
                turma: this.currentTurma,
                attendance: this.attendanceData,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `frequencia-turma-${this.currentTurma.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Frequência exportada com sucesso');
        } catch (error) {
            console.error('Erro ao exportar frequência:', error);
            this.showError('Erro ao exportar frequência');
        }
    }

    generateReport() {
        this.showSuccess('Funcionalidade de relatório em desenvolvimento');
    }

    showLoading() {
        const loading = this.container.querySelector('#loadingState');
        const table = this.container.querySelector('#attendanceTable');
        
        if (loading) loading.style.display = 'flex';
        if (table) table.style.display = 'none';
    }

    hideLoading() {
        const loading = this.container.querySelector('#loadingState');
        if (loading) loading.style.display = 'none';
    }

    showSuccess(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'success');
        } else {
            console.log('✅', message);
        }
    }

    showError(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            console.error('❌', message);
        }
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR');
    }

    // Métodos públicos para eventos
    onBack(callback) {
        this.events.onBack = callback;
    }

    onAttendanceUpdate(callback) {
        this.events.onAttendanceUpdate = callback;
    }
}

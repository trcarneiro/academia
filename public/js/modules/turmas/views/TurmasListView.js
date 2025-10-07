// TurmasListView - Visualização da lista de turmas com design premium
// Segue padrões do Guidelines.MD com componentes premium e navegação full-screen

export class TurmasListView {
    constructor(service, controller) {
        this.service = service;
        this.controller = controller;
        this.container = null;
        this.currentFilters = {};
        this.isLoading = false;
    }

    async render(container, initialFilters = {}) {
        this.container = container;
        this.currentFilters = { ...initialFilters };
        
        await this.renderHTML();
        this.attachEventListeners();
        await this.loadData();
    }

    async renderHTML() {
        this.container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header Premium com Breadcrumb -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-breadcrumb">
                            <span class="breadcrumb-item">📊 Início</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item active">👥 Turmas</span>
                        </div>
                        <div class="module-header-actions">
                            <button class="btn-action-premium" id="btnCreateTurma">
                                <i class="icon">➕</i>
                                <span>Nova Turma</span>
                            </button>
                            <button class="btn-action-secondary" id="btnRefresh">
                                <i class="icon">🔄</i>
                                <span>Atualizar</span>
                            </button>
                            <button class="btn-action-secondary" id="btnClearAllEndDates" title="Remover datas de término de todas as turmas">
                                <i class="icon">🧹</i>
                                <span>Limpar Fim de Todas</span>
                            </button>
                        </div>
                    </div>
                    <h1 class="module-title">👥 Gestão de Turmas</h1>
                    <p class="module-subtitle">Execute cronogramas de cursos com datas específicas e gerencie alunos</p>
                </div>

                <!-- Estatísticas Premium -->
                <div class="stats-grid-premium" id="statsContainer">
                    <div class="stat-card-enhanced loading-placeholder">
                        <div class="stat-card-content">
                            <div class="stat-number">...</div>
                            <div class="stat-label">Total de Turmas</div>
                        </div>
                        <div class="stat-card-icon">👥</div>
                    </div>
                    <div class="stat-card-enhanced loading-placeholder">
                        <div class="stat-card-content">
                            <div class="stat-number">...</div>
                            <div class="stat-label">Em Andamento</div>
                        </div>
                        <div class="stat-card-icon">🏃</div>
                    </div>
                    <div class="stat-card-enhanced loading-placeholder">
                        <div class="stat-card-content">
                            <div class="stat-number">...</div>
                            <div class="stat-label">Agendadas</div>
                        </div>
                        <div class="stat-card-icon">📅</div>
                    </div>
                    <div class="stat-card-enhanced loading-placeholder">
                        <div class="stat-card-content">
                            <div class="stat-number">...</div>
                            <div class="stat-label">Concluídas</div>
                        </div>
                        <div class="stat-card-icon">✅</div>
                    </div>
                </div>

                <!-- Filtros Premium -->
                <div class="module-filters-premium">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label for="filterSearch">🔍 Buscar Turmas</label>
                            <input type="text" id="filterSearch" placeholder="Nome, curso ou instrutor..." class="form-input-premium">
                        </div>
                        <div class="filter-group">
                            <label for="filterStatus">📊 Status</label>
                            <select id="filterStatus" class="form-select-premium">
                                <option value="">Todos os Status</option>
                                <option value="SCHEDULED">Agendado</option>
                                <option value="IN_PROGRESS">Em Andamento</option>
                                <option value="COMPLETED">Concluído</option>
                                <option value="CANCELLED">Cancelado</option>
                                <option value="SUSPENDED">Suspenso</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filterType">🎯 Tipo</label>
                            <select id="filterType" class="form-select-premium">
                                <option value="">Todos os Tipos</option>
                                <option value="COLLECTIVE">Coletivo</option>
                                <option value="PRIVATE">Particular</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <button class="btn-filter-clear" id="btnClearFilters">
                                <i class="icon">🧹</i>
                                <span>Limpar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Lista de Turmas -->
                <div class="data-container-premium">
                    <div class="data-header">
                        <h3>📋 Lista de Turmas</h3>
                        <div class="data-actions">
                            <button class="btn-view-toggle active" data-view="grid" id="btnViewGrid">
                                <i class="icon">⚏</i>
                            </button>
                            <button class="btn-view-toggle" data-view="list" id="btnViewList">
                                <i class="icon">☰</i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-content" id="turmasContent">
                        <!-- Loading state -->
                        <div class="loading-state" id="loadingState">
                            <div class="loading-spinner"></div>
                            <p>Carregando turmas...</p>
                        </div>
                        
                        <!-- Empty state -->
                        <div class="empty-state hidden" id="emptyState">
                            <div class="empty-icon">👥</div>
                            <h3>Nenhuma turma encontrada</h3>
                            <p>Comece criando sua primeira turma para executar os cronogramas dos cursos.</p>
                            <button class="btn-action-premium" id="btnCreateFromEmpty">
                                <i class="icon">➕</i>
                                <span>Criar Primeira Turma</span>
                            </button>
                        </div>
                        
                        <!-- Error state -->
                        <div class="error-state hidden" id="errorState">
                            <div class="error-icon">❌</div>
                            <h3>Erro ao carregar turmas</h3>
                            <p id="errorMessage">Ocorreu um erro inesperado. Tente novamente.</p>
                            <button class="btn-action-secondary" id="btnRetry">
                                <i class="icon">🔄</i>
                                <span>Tentar Novamente</span>
                            </button>
                        </div>
                        
                        <!-- Grid view -->
                        <div class="turmas-grid" id="turmasGrid"></div>
                        
                        <!-- List view -->
                        <div class="turmas-list hidden" id="turmasList">
                            <div class="table-responsive">
                                <table class="data-table-premium">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Curso</th>
                                            <th>Instrutor</th>
                                            <th>Tipo</th>
                                            <th>Status</th>
                                            <th>Progresso</th>
                                            <th>Início</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="turmasTableBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Botões principais
        const btnCreate = this.container.querySelector('#btnCreateTurma');
        const btnCreateFromEmpty = this.container.querySelector('#btnCreateFromEmpty');
        const btnRefresh = this.container.querySelector('#btnRefresh');
    const btnClearAllEndDates = this.container.querySelector('#btnClearAllEndDates');
        const btnRetry = this.container.querySelector('#btnRetry');
        const btnClearFilters = this.container.querySelector('#btnClearFilters');

        btnCreate?.addEventListener('click', () => this.controller.showCreate());
        btnCreateFromEmpty?.addEventListener('click', () => this.controller.showCreate());
        btnRefresh?.addEventListener('click', () => this.loadData());
        btnRetry?.addEventListener('click', () => this.loadData());
        btnClearFilters?.addEventListener('click', () => this.clearFilters());
        btnClearAllEndDates?.addEventListener('click', async () => {
            if (!confirm('Tem certeza que deseja remover as datas de término de TODAS as turmas?')) return;
            try {
                const res = await this.service.clearAllEndDates?.();
                if (res?.success) {
                    if (window.app?.showSuccess) window.app.showSuccess('Datas de término removidas de todas as turmas');
                    await this.loadData();
                } else {
                    const msg = res?.message || 'Falha ao limpar datas de término';
                    if (window.app?.showError) window.app.showError(msg); else alert(msg);
                }
            } catch (e) {
                console.error('Erro ao limpar datas de término em massa:', e);
                if (window.app?.handleError) window.app.handleError(e, 'clearAllEndDates');
            }
        });

        // Filtros
        const filterSearch = this.container.querySelector('#filterSearch');
        const filterStatus = this.container.querySelector('#filterStatus');
        const filterType = this.container.querySelector('#filterType');

        filterSearch?.addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        filterStatus?.addEventListener('change', () => this.applyFilters());
        filterType?.addEventListener('change', () => this.applyFilters());

        // View toggles
        const btnViewGrid = this.container.querySelector('#btnViewGrid');
        const btnViewList = this.container.querySelector('#btnViewList');

        btnViewGrid?.addEventListener('click', () => this.toggleView('grid'));
        btnViewList?.addEventListener('click', () => this.toggleView('list'));
    }

    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            const result = await this.service.list(this.currentFilters);
            
            if (result.success) {
                if (result.data && result.data.length > 0) {
                    this.renderTurmas(result.data);
                    this.updateStats(result.data);
                    this.showDataState();
                } else {
                    this.showEmptyState();
                }
            } else {
                throw new Error(result.error || 'Erro ao carregar turmas');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar turmas:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    renderTurmas(turmas) {
        const currentView = this.getCurrentView();
        
        if (currentView === 'grid') {
            this.renderGrid(turmas);
        } else {
            this.renderTable(turmas);
        }
    }

    renderGrid(turmas) {
        const grid = this.container.querySelector('#turmasGrid');

        if (!grid) {
            console.error('❌ Elemento #turmasGrid não encontrado no container');
            return;
        }

        grid.innerHTML = turmas.map(turma => {
            const formattedTurma = this.service.formatTurmaData(turma);
            
            return `
                <div class="turma-card data-card-premium" data-turma-id="${turma.id}">
                    <div class="turma-card-header">
                        <div class="turma-info">
                            <h4 class="turma-name">${turma.name}</h4>
                            <p class="turma-course">📚 ${turma.course?.name || 'Curso não encontrado'}</p>
                        </div>
                        <div class="turma-status">
                            <span class="status-badge status-${turma.status?.toLowerCase()}">${formattedTurma.statusText}</span>
                            <span class="type-badge type-${turma.type?.toLowerCase()}">${formattedTurma.typeText}</span>
                        </div>
                    </div>
                    
                    <div class="turma-card-body">
                        <div class="turma-details">
                            <div class="detail-item">
                                <span class="detail-label">👨‍🏫 Instrutor:</span>
                                <span class="detail-value">${turma.instructor?.name || 'Não definido'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📅 Início:</span>
                                <span class="detail-value">${formattedTurma.startDateFormatted}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">👥 Alunos:</span>
                                <span class="detail-value">${turma.students?.length || 0}</span>
                            </div>
                        </div>
                        
                        <div class="turma-progress">
                            <div class="progress-header">
                                <span>📊 Progresso</span>
                                <span>${formattedTurma.progressPercentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${formattedTurma.progressPercentage}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="turma-card-actions">
                        <button class="btn-card-action" data-action="view" data-turma-id="${turma.id}">
                            <i class="icon">👁️</i>
                            <span>Visualizar</span>
                        </button>
                        <button class="btn-card-action" data-action="schedule" data-turma-id="${turma.id}">
                            <i class="icon">📅</i>
                            <span>Cronograma</span>
                        </button>
                        <button class="btn-card-action" data-action="students" data-turma-id="${turma.id}">
                            <i class="icon">👥</i>
                            <span>Alunos</span>
                        </button>
                        <button class="btn-card-action" data-action="attendance" data-turma-id="${turma.id}">
                            <i class="icon">📋</i>
                            <span>Frequência</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach card event listeners
        this.attachCardEventListeners();
    }

    renderTable(turmas) {
        const tbody = this.container.querySelector('#turmasTableBody');

        if (!tbody) {
            console.error('❌ Elemento #turmasTableBody não encontrado no container');
            return;
        }

        tbody.innerHTML = turmas.map(turma => {
            const formattedTurma = this.service.formatTurmaData(turma);
            
            return `
                <tr class="table-row-clickable" data-turma-id="${turma.id}">
                    <td>
                        <div class="table-cell-content">
                            <strong>${turma.name}</strong>
                        </div>
                    </td>
                    <td>${turma.course?.name || 'Não definido'}</td>
                    <td>${turma.instructor?.name || 'Não definido'}</td>
                    <td>
                        <span class="type-badge type-${turma.type?.toLowerCase()}">${formattedTurma.typeText}</span>
                    </td>
                    <td>
                        <span class="status-badge status-${turma.status?.toLowerCase()}">${formattedTurma.statusText}</span>
                    </td>
                    <td>
                        <div class="progress-cell">
                            <div class="progress-bar-small">
                                <div class="progress-fill" style="width: ${formattedTurma.progressPercentage}%"></div>
                            </div>
                            <span class="progress-text">${formattedTurma.progressPercentage}%</span>
                        </div>
                    </td>
                    <td>${formattedTurma.startDateFormatted}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-table-action" data-action="view" data-turma-id="${turma.id}" title="Visualizar">
                                <i class="icon">👁️</i>
                            </button>
                            <button class="btn-table-action" data-action="edit" data-turma-id="${turma.id}" title="Editar">
                                <i class="icon">✏️</i>
                            </button>
                            <button class="btn-table-action" data-action="schedule" data-turma-id="${turma.id}" title="Cronograma">
                                <i class="icon">📅</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach table event listeners
        this.attachTableEventListeners();
    }

    attachCardEventListeners() {
        // Double-click navigation
        const cards = this.container.querySelectorAll('.turma-card');
        cards.forEach(card => {
            card.addEventListener('dblclick', (e) => {
                const turmaId = e.currentTarget.dataset.turmaId;
                this.controller.showView(turmaId);
            });
        });

        // Action buttons
        const actionButtons = this.container.querySelectorAll('.btn-card-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                const turmaId = e.currentTarget.dataset.turmaId;
                this.handleTurmaAction(action, turmaId);
            });
        });
    }

    attachTableEventListeners() {
        // Double-click navigation
        const rows = this.container.querySelectorAll('.table-row-clickable');
        rows.forEach(row => {
            row.addEventListener('dblclick', (e) => {
                const turmaId = e.currentTarget.dataset.turmaId;
                this.controller.showView(turmaId);
            });
        });

        // Action buttons
        const actionButtons = this.container.querySelectorAll('.btn-table-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                const turmaId = e.currentTarget.dataset.turmaId;
                this.handleTurmaAction(action, turmaId);
            });
        });
    }

    handleTurmaAction(action, turmaId) {
        switch (action) {
            case 'view':
                this.controller.showView(turmaId);
                break;
            case 'edit':
                this.controller.showEdit(turmaId);
                break;
            case 'schedule':
                this.controller.showSchedule(turmaId);
                break;
            case 'students':
                this.controller.showStudents(turmaId);
                break;
            case 'attendance':
                this.controller.showAttendance(turmaId);
                break;
            case 'reports':
                this.controller.showReports(turmaId);
                break;
            default:
                console.warn('Ação não reconhecida:', action);
        }
    }

    updateStats(turmas) {
        const stats = {
            total: turmas.length,
            inProgress: turmas.filter(t => t.status === 'IN_PROGRESS').length,
            scheduled: turmas.filter(t => t.status === 'SCHEDULED').length,
            completed: turmas.filter(t => t.status === 'COMPLETED').length
        };

        const statsContainer = this.container.querySelector('#statsContainer');
        
        statsContainer.innerHTML = `
            <div class="stat-card-enhanced">
                <div class="stat-card-content">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">Total de Turmas</div>
                </div>
                <div class="stat-card-icon">👥</div>
            </div>
            <div class="stat-card-enhanced">
                <div class="stat-card-content">
                    <div class="stat-number">${stats.inProgress}</div>
                    <div class="stat-label">Em Andamento</div>
                </div>
                <div class="stat-card-icon">🏃</div>
            </div>
            <div class="stat-card-enhanced">
                <div class="stat-card-content">
                    <div class="stat-number">${stats.scheduled}</div>
                    <div class="stat-label">Agendadas</div>
                </div>
                <div class="stat-card-icon">📅</div>
            </div>
            <div class="stat-card-enhanced">
                <div class="stat-card-content">
                    <div class="stat-number">${stats.completed}</div>
                    <div class="stat-label">Concluídas</div>
                </div>
                <div class="stat-card-icon">✅</div>
            </div>
        `;
    }

    // ===== Filtros =====

    applyFilters() {
        const search = this.container.querySelector('#filterSearch').value.trim();
        const status = this.container.querySelector('#filterStatus').value;
        const type = this.container.querySelector('#filterType').value;

        this.currentFilters = {
            ...(search && { search }),
            ...(status && { status }),
            ...(type && { type })
        };

        this.loadData();
    }

    clearFilters() {
        this.container.querySelector('#filterSearch').value = '';
        this.container.querySelector('#filterStatus').value = '';
        this.container.querySelector('#filterType').value = '';
        
        this.currentFilters = {};
        this.loadData();
    }

    // ===== Estados da UI =====

    showLoadingState() {
        this.container.querySelector('#loadingState')?.classList.remove('hidden');
        this.container.querySelector('#emptyState')?.classList.add('hidden');
        this.container.querySelector('#errorState')?.classList.add('hidden');
        this.container.querySelector('#turmasGrid')?.classList.add('hidden');
        this.container.querySelector('#turmasList')?.classList.add('hidden');
    }

    showDataState() {
        this.container.querySelector('#loadingState')?.classList.add('hidden');
        this.container.querySelector('#emptyState')?.classList.add('hidden');
        this.container.querySelector('#errorState')?.classList.add('hidden');
        
        const currentView = this.getCurrentView();
        if (currentView === 'grid') {
            this.container.querySelector('#turmasGrid')?.classList.remove('hidden');
            this.container.querySelector('#turmasList')?.classList.add('hidden');
        } else {
            this.container.querySelector('#turmasGrid')?.classList.add('hidden');
            this.container.querySelector('#turmasList')?.classList.remove('hidden');
        }
    }

    showEmptyState() {
        this.container.querySelector('#loadingState')?.classList.add('hidden');
        this.container.querySelector('#emptyState')?.classList.remove('hidden');
        this.container.querySelector('#errorState')?.classList.add('hidden');
        this.container.querySelector('#turmasGrid')?.classList.add('hidden');
        this.container.querySelector('#turmasList')?.classList.add('hidden');
    }

    showErrorState(message) {
        this.container.querySelector('#loadingState')?.classList.add('hidden');
        this.container.querySelector('#emptyState')?.classList.add('hidden');
        this.container.querySelector('#errorState')?.classList.remove('hidden');
        this.container.querySelector('#turmasGrid')?.classList.add('hidden');
        this.container.querySelector('#turmasList')?.classList.add('hidden');
        
        const errorMessage = this.container.querySelector('#errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    // ===== View Toggle =====

    toggleView(view) {
        const btnGrid = this.container.querySelector('#btnViewGrid');
        const btnList = this.container.querySelector('#btnViewList');
        
        if (view === 'grid') {
            btnGrid?.classList.add('active');
            btnList?.classList.remove('active');
            this.container.querySelector('#turmasGrid')?.classList.remove('hidden');
            this.container.querySelector('#turmasList')?.classList.add('hidden');
        } else {
            btnGrid?.classList.remove('active');
            btnList?.classList.add('active');
            this.container.querySelector('#turmasGrid')?.classList.add('hidden');
            this.container.querySelector('#turmasList')?.classList.remove('hidden');
        }
        
        // Salvar preferência
        localStorage.setItem('turmas_view_preference', view);
    }

    getCurrentView() {
        return localStorage.getItem('turmas_view_preference') || 'grid';
    }

    // ===== Utilitários =====

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== Refresh =====

    async refresh() {
        await this.loadData();
    }

    // ===== Cleanup =====

    destroy() {
        // Limpar event listeners e recursos
        this.container = null;
        this.service = null;
        this.controller = null;
    }
}

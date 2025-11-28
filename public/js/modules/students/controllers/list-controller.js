/**
 * Students List Controller - Guidelines.MD Compliant
 * Mirrors Activities module structure (gold standard)
 */

export class StudentsListController {
    constructor(api) {
        this.api = api; // ModuleAPIHelper instance
        this.container = null;
        
        // Initialize state properties
        this.students = [];
        this.totalCount = 0;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageSize = 20;
        this.searchQuery = '';
        this.filterCategory = '';
        this.filterStatus = '';
        this.isLoading = false;
        this.selectedStudents = new Set();
        
        // View mode: 'table' or 'cards'
        // Force cards view on mobile (768px or less)
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        this.viewMode = isMobile ? 'cards' : (localStorage.getItem('students-view-mode') || 'table');
        
        // Listen for resize to switch views
        this.mediaQuery = window.matchMedia('(max-width: 768px)');
        this.handleMediaQueryChange = (e) => {
            if (e.matches && this.viewMode === 'table') {
                this.viewMode = 'cards';
                this.updateViewDisplay();
                this.updateViewToggleButton();
            }
        };
        this.mediaQuery.addEventListener('change', this.handleMediaQueryChange);
        
        // Debug helper
        window.studentsListController = this;
    }

    async render(targetContainer) {
        this.container = targetContainer;
        targetContainer.setAttribute('data-module', 'students');
        targetContainer.setAttribute('data-active', 'true');
        targetContainer.classList.add('module-active');
        targetContainer.classList.add('students-module');

        this.renderHTML();
        this.bindEvents(targetContainer);
        await this.loadData();
    }

    renderHTML() {
        this.container.innerHTML = `
            <div class="module-isolated-container students-premium" data-module="students">
                <!-- Header Premium com Guidelines.MD + Gradient -->
                <div class="module-header-premium students-header-gradient">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="page-title animated-title">
                                <span class="icon-bounce">👥</span>
                                <span>Estudantes</span>
                            </h1>
                            <nav class="breadcrumb">
                                <i class="fas fa-home"></i> Home 
                                <i class="fas fa-chevron-right"></i> 
                                <span class="breadcrumb-current">Estudantes</span>
                            </nav>
                        </div>
                        <div class="header-actions">
                            <button id="toggle-view-btn" class="btn-form btn-icon" title="Alternar visualização">
                                <i class="fas fa-th"></i>
                            </button>
                            <button id="create-student-btn" class="btn-form btn-primary-form btn-pulse">
                                <i class="fas fa-plus"></i>
                                Novo Estudante
                            </button>
                            <button id="import-students-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-upload"></i>
                                Importar
                            </button>
                            <button id="export-students-btn" class="btn-form btn-success-form">
                                <i class="fas fa-download"></i>
                                Exportar
                            </button>
                            <button id="refresh-students-btn" class="btn-form btn-icon" title="Atualizar">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards Premium com Animação -->
                <div class="module-stats stats-animated">
                    <div class="stat-card-enhanced stat-gradient-primary" style="animation-delay: 0.1s">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon">📊</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value counter" id="total-students" data-target="0">0</div>
                            <div class="stat-label">Total de Estudantes</div>
                            <div class="stat-trend">
                                <i class="fas fa-arrow-up"></i> 100% do cadastro
                            </div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced stat-gradient-success" style="animation-delay: 0.2s">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon">✅</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value counter" id="active-students" data-target="0">0</div>
                            <div class="stat-label">Ativos</div>
                            <div class="stat-trend" id="active-percentage">
                                <i class="fas fa-check-circle"></i> Calculando...
                            </div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced stat-gradient-info" style="animation-delay: 0.3s">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon">💳</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value counter" id="with-subs" data-target="0">0</div>
                            <div class="stat-label">Com Assinatura</div>
                            <div class="stat-trend" id="subs-percentage">
                                <i class="fas fa-credit-card"></i> Calculando...
                            </div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced stat-gradient-warning" style="animation-delay: 0.4s">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon">🔍</div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value counter" id="filtered-students" data-target="0">0</div>
                            <div class="stat-label">Filtrados</div>
                            <div class="stat-trend">
                                <i class="fas fa-filter"></i> Resultados da busca
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters Premium com Melhorias Visuais -->
                <div class="module-filters-premium filters-enhanced">
                    <div class="filters-header">
                        <h3 class="filters-title">
                            <i class="fas fa-sliders-h"></i>
                            Filtros Avançados
                        </h3>
                        <button id="toggle-filters-btn" class="btn-form btn-sm btn-secondary-form">
                            <i class="fas fa-chevron-up"></i>
                            Recolher
                        </button>
                    </div>
                    <div class="filter-row" id="filters-content">
                        <div class="filter-group filter-search">
                            <label for="search-students" class="filter-label">
                                <i class="fas fa-search"></i>
                                Busca Inteligente
                            </label>
                            <div class="input-with-icon">
                                <input type="text" id="search-students" placeholder="Digite nome, e-mail ou telefone..." 
                                       class="filter-input" autocomplete="off">
                                <span class="input-icon"><i class="fas fa-search"></i></span>
                                <button id="clear-search-btn" class="input-clear" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label for="filter-category" class="filter-label">
                                <i class="fas fa-tag"></i>
                                Categoria
                            </label>
                            <select id="filter-category" class="filter-select">
                                <option value="">Todas as categorias</option>
                                <option value="ADULT">👨 Adulto</option>
                                <option value="TEEN">🧑 Adolescente</option>
                                <option value="CHILD">👶 Criança</option>
                                <option value="SENIOR">👴 Sênior</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-status" class="filter-label">
                                <i class="fas fa-toggle-on"></i>
                                Status
                            </label>
                            <select id="filter-status" class="filter-select">
                                <option value="">Todos os status</option>
                                <option value="active">✅ Ativo</option>
                                <option value="inactive">❌ Inativo</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-belt" class="filter-label">
                                <i class="fas fa-medal"></i>
                                Faixa
                            </label>
                            <select id="filter-belt" class="filter-select">
                                <option value="">Todas as faixas</option>
                                <option value="WHITE">⚪ Branca</option>
                                <option value="YELLOW">🟡 Amarela</option>
                                <option value="ORANGE">🟠 Laranja</option>
                                <option value="GREEN">🟢 Verde</option>
                                <option value="BLUE">🔵 Azul</option>
                                <option value="BROWN">🟤 Marrom</option>
                                <option value="BLACK">⚫ Preta</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="items-per-page" class="filter-label">
                                <i class="fas fa-list"></i>
                                Por Página
                            </label>
                            <select id="items-per-page" class="filter-select">
                                <option value="12">12 itens</option>
                                <option value="24">24 itens</option>
                                <option value="50">50 itens</option>
                                <option value="100">100 itens</option>
                                <option value="all">Todos</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button id="clear-filters-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-eraser"></i>
                                Limpar Filtros
                            </button>
                            <button id="save-filters-btn" class="btn-form btn-info-form" title="Salvar filtros atuais">
                                <i class="fas fa-save"></i>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions Bar -->
                <div id="bulk-actions-bar" class="bulk-actions-bar" style="display: none;">
                    <div class="bulk-info">
                        <span id="selected-count">0</span> estudantes selecionados
                    </div>
                    <div class="bulk-buttons">
                        <button id="select-page-btn" class="btn-bulk btn-secondary">
                            <i class="fas fa-check-square"></i>
                            Selecionar página
                        </button>
                        <button id="deselect-all-btn" class="btn-bulk btn-secondary">
                            <i class="fas fa-square"></i>
                            Desselecionar
                        </button>
                        <button id="bulk-activate-btn" class="btn-bulk btn-success">
                            <i class="fas fa-toggle-on"></i>
                            Ativar selecionados
                        </button>
                        <button id="bulk-deactivate-btn" class="btn-bulk btn-warning">
                            <i class="fas fa-toggle-off"></i>
                            Desativar selecionados
                        </button>
                    </div>
                </div>

                <!-- View Toggle & Content -->
                <div class="view-container">
                    <!-- Table View (default) -->
                    <div id="table-view" class="data-card-premium view-active">
                        <div class="table-header">
                            <h3 class="table-title">
                                <i class="fas fa-table"></i>
                                Visualização em Tabela
                            </h3>
                            <div class="table-actions">
                                <span class="results-count" id="results-count">Carregando...</span>
                            </div>
                        </div>
                        <div class="table-container">
                            <table class="data-table students-table">
                                <thead>
                                    <tr>
                                        <th class="col-select">
                                            <input type="checkbox" id="select-all-students" title="Selecionar todos">
                                        </th>
                                        <th class="col-student" data-sort="name">
                                            <i class="fas fa-user"></i>
                                            Estudante
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-contact" data-sort="email">
                                            <i class="fas fa-envelope"></i>
                                            Contato
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-category" data-sort="category">
                                            <i class="fas fa-tag"></i>
                                            Categoria
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-belt" data-sort="belt">
                                            <i class="fas fa-medal"></i>
                                            Faixa
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-plan" data-sort="plan">
                                            <i class="fas fa-credit-card"></i>
                                            Plano Atual
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-status" data-sort="status">
                                            <i class="fas fa-toggle-on"></i>
                                            Status
                                            <i class="fas fa-sort sort-icon"></i>
                                        </th>
                                        <th class="col-stats">
                                            <i class="fas fa-chart-bar"></i>
                                            Stats
                                        </th>
                                        <th class="col-actions">
                                            <i class="fas fa-cog"></i>
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="students-table-body">
                                    <!-- Content will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Cards View (hidden by default) -->
                    <div id="cards-view" class="cards-grid" style="display: none;">
                        <!-- Cards will be rendered here -->
                    </div>
                </div>

                <!-- Pagination Premium -->
                <div class="module-pagination pagination-enhanced">
                    <div class="pagination-info">
                        <i class="fas fa-info-circle"></i>
                        <span id="pagination-info">Carregando...</span>
                    </div>
                    <div class="pagination-controls">
                        <button id="first-page-btn" class="btn-form btn-icon" title="Primeira página" disabled>
                            <i class="fas fa-angle-double-left"></i>
                        </button>
                        <button id="prev-page-btn" class="btn-form btn-secondary-form" disabled>
                            <i class="fas fa-chevron-left"></i>
                            Anterior
                        </button>
                        <div class="pagination-current">
                            <span class="page-indicator">
                                Página 
                                <input type="number" id="page-jump" value="1" min="1" class="page-input" title="Ir para página">
                                de <span id="total-pages">1</span>
                            </span>
                        </div>
                        <button id="next-page-btn" class="btn-form btn-secondary-form" disabled>
                            Próxima
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button id="last-page-btn" class="btn-form btn-icon" title="Última página" disabled>
                            <i class="fas fa-angle-double-right"></i>
                        </button>
                    </div>
                    <div class="pagination-quick-jump">
                        <label for="quick-jump-select">Ir para:</label>
                        <select id="quick-jump-select" class="quick-jump-select">
                            <option value="1">Página 1</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents(container) {
        const searchInput = container.querySelector('#search-students');
        if (searchInput) {
            let t;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(t);
                t = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.currentPage = 1;
                    this.updateTable();
                }, 250);
            });
        }

        const perPage = container.querySelector('#items-per-page');
        if (perPage) {
            perPage.addEventListener('change', (e) => {
                const val = e.target.value;
                this.pageSize = val === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(val, 10);
                this.currentPage = 1;
                this.updateTable();
            });
        }

        const clearBtn = container.querySelector('#clear-filters-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.searchQuery = '';
                container.querySelector('#search-students').value = '';
                this.currentPage = 1;
                this.updateTable();
            });
        }

        const refreshBtn = container.querySelector('#refresh-students-btn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadData());

        const createBtn = container.querySelector('#create-student-btn');
        if (createBtn) createBtn.addEventListener('click', () => {
            location.hash = 'student-editor';
            window.router?.navigateTo('student-editor');
        });

        // Filter events
        const categoryFilter = container.querySelector('#filter-category');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterCategory = e.target.value;
                this.currentPage = 1;
                this.updateTable();
            });
        }

        const statusFilter = container.querySelector('#filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterStatus = e.target.value;
                this.currentPage = 1;
                this.updateTable();
            });
        }

        // View toggle button
        const toggleViewBtn = container.querySelector('#toggle-view-btn');
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => this.toggleView());
            this.updateViewToggleButton(toggleViewBtn);
        }

        // Import/Export buttons
        const importBtn = container.querySelector('#import-students-btn');
        if (importBtn) importBtn.addEventListener('click', () => this.showImportModal());

        const exportBtn = container.querySelector('#export-students-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportStudents());

        // Bulk selection
        const selectAllBtn = container.querySelector('#select-all-students');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('change', (e) => {
                const checkboxes = container.querySelectorAll('.student-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                this.updateBulkActions();
            });
        }

        // Pagination
        container.querySelector('#prev-page-btn')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateTable();
            }
        });
        const nextBtn = container.querySelector('#next-page-btn');
        if (nextBtn) {
            console.log('✅ [Students] Next button found, attaching event');
            nextBtn.addEventListener('click', () => {
                console.log('🔵 [Students] Next button clicked!', {
                    currentPage: this.currentPage,
                    totalPages: this.getTotalPages()
                });
                const totalPages = this.getTotalPages();
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    console.log('📄 [Students] Moving to page:', this.currentPage);
                    this.updateTable();
                } else {
                    console.warn('⚠️ [Students] Already on last page');
                }
            });
        } else {
            console.error('❌ [Students] Next button NOT found!');
        }
    }

    async loadData() {
        this.isLoading = true;
        const body = this.container.querySelector('#students-table-body');
        if (body) {
            body.innerHTML = `
                <tr>
                    <td colspan="8" class="loading-state-row">
                        <div class="loading-state">
                            <div class="loading-spinner">
                                <i class="fas fa-spinner fa-spin"></i>
                            </div>
                            <span class="loading-text">Carregando estudantes...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        try {
            const res = await this.api.fetchWithStates('/api/students', {
                onSuccess: (data) => data,
                onError: (err) => { throw err; }
            });

            const list = res?.data?.data || res?.data || res || [];
            this.students = Array.isArray(list) ? list : [];
            this.totalCount = this.students.length;
            this.updateStats();
            this.updateTable();
            
            // Apply saved view mode (aguarda DOM estar pronto com retry)
            this.waitForViewElements();
        } catch (err) {
            console.error('Erro ao carregar estudantes', err);
            const tableBody = this.container?.querySelector('#students-table-body');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados</td></tr>';
            }
            window.app?.handleError?.(err, 'students:list');
        } finally {
            this.isLoading = false;
        }
    }

    updateStats() {
        const total = this.students.length;
        const active = this.students.filter(s => s.isActive).length;
        const withSubs = this.students.filter(s => (s._count?.subscriptions || 0) > 0).length;
        
        // Calculate percentages
        const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
        const subsPercentage = total > 0 ? Math.round((withSubs / total) * 100) : 0;
        
        // Animate counters
        this.animateCounter('total-students', 0, total, 1000);
        this.animateCounter('active-students', 0, active, 1000);
        this.animateCounter('with-subs', 0, withSubs, 1000);
        
        // Update percentage trends
        const activeTrend = this.container?.querySelector('#active-percentage');
        if (activeTrend) {
            activeTrend.innerHTML = `<i class="fas fa-check-circle"></i> ${activePercentage}% do total`;
        }
        
        const subsTrend = this.container?.querySelector('#subs-percentage');
        if (subsTrend) {
            subsTrend.innerHTML = `<i class="fas fa-credit-card"></i> ${subsPercentage}% com plano`;
        }
    }

    // Animated counter effect
    animateCounter(elementId, start, end, duration) {
        const element = this.container?.querySelector(`#${elementId}`);
        if (!element) return;
        
        const range = end - start;
        const increment = range / (duration / 16); // 60fps
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    getFiltered() {
        let filtered = [...this.students];
        
        // Text search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(s => {
                const name = `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.toLowerCase();
                const email = (s?.user?.email || '').toLowerCase();
                const phone = (s?.user?.phone || '').toLowerCase();
                return name.includes(q) || email.includes(q) || phone.includes(q);
            });
        }
        
        // Category filter
        if (this.filterCategory) {
            filtered = filtered.filter(s => s?.category === this.filterCategory);
        }
        
        // Status filter
        if (this.filterStatus) {
            const isActive = this.filterStatus === 'active';
            filtered = filtered.filter(s => s?.isActive === isActive);
        }
        
        return filtered;
    }

    getTotalPages() {
        if (this.pageSize === Number.MAX_SAFE_INTEGER) return 1;
        const count = this.getFiltered().length;
        return Math.max(1, Math.ceil(count / this.pageSize));
    }

    updateTable() {
        const list = this.getFiltered();
        const totalPages = this.getTotalPages();
        const start = this.pageSize === Number.MAX_SAFE_INTEGER ? 0 : (this.currentPage - 1) * this.pageSize;
        const end = this.pageSize === Number.MAX_SAFE_INTEGER ? list.length : start + this.pageSize;
        const pageItems = list.slice(start, end);

        const tbody = this.container.querySelector('#students-table-body');
        if (!tbody) return;

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state-row">
                        <div class="module-isolated-empty-state">
                            <div class="empty-icon">
                                <i class="fas fa-users" style="font-size: 3rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
                            </div>
                            <h3 class="empty-title">Nenhum estudante encontrado</h3>
                            <p class="empty-message">
                                ${this.searchQuery || this.filterCategory || this.filterStatus ? 
                                    'Tente ajustar os filtros ou limpe-os para ver todos os estudantes.' : 
                                    'Comece adicionando seu primeiro estudante ao sistema.'
                                }
                            </p>
                            <div class="empty-actions">
                                ${this.searchQuery || this.filterCategory || this.filterStatus ? 
                                    '<button onclick="document.getElementById(\'clear-filters-btn\').click()" class="btn-form btn-secondary-form">Limpar Filtros</button>' : 
                                    '<button onclick="document.getElementById(\'create-student-btn\').click()" class="btn-form btn-primary-form">Adicionar Primeiro Estudante</button>'
                                }
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = pageItems.map((s, index) => {
                const name = `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim() || '(Sem nome)';
                const email = s?.user?.email || '';
                const phone = s?.user?.phone || '';
                const category = s?.category || 'N/A';
                const belt = s?.currentBelt || 'WHITE';
                const beltEmoji = this.getBeltEmoji(belt);
                const beltName = this.getBeltName(belt);
                const subs = s?._count?.subscriptions || 0;
                const attends = s?._count?.attendances || 0;
                const plan = s?.activeSubscription?.plan?.name || 'Sem plano';
                const isActive = s?.isActive;
                const statusBadge = isActive ? 
                    '<span class="status-badge status-active pulse-animation"><i class="fas fa-check-circle"></i> Ativo</span>' :
                    '<span class="status-badge status-inactive"><i class="fas fa-times-circle"></i> Inativo</span>';
                
                const attendanceRate = this.calculateAttendanceRate(s);
                const progressBar = this.renderProgressBar(attendanceRate);
                
                return `
                    <tr class="row-link row-animated" data-id="${s.id}" title="Duplo clique para editar" style="animation-delay: ${index * 0.03}s">
                        <td class="col-select">
                            <input type="checkbox" class="student-checkbox" value="${s.id}" onclick="event.stopPropagation()">
                        </td>
                        <td class="col-student">
                            <div class="student-info-card">
                                <div class="student-avatar">
                                    <img src="${s?.user?.profilePicture || '/images/avatar-placeholder.png'}" 
                                         alt="${name}" 
                                         onerror="this.src='/images/avatar-placeholder.png'">
                                </div>
                                <div class="student-details">
                                    <div class="student-name">${name}</div>
                                    <div class="student-meta">
                                        <span class="student-id" title="ID do estudante">
                                            <i class="fas fa-fingerprint"></i> ${s.id.slice(0, 8)}
                                        </span>
                                        ${s?.enrollmentDate ? `
                                        <span class="student-since" title="Data de matrícula">
                                            <i class="fas fa-calendar-plus"></i> 
                                            ${new Date(s.enrollmentDate).toLocaleDateString('pt-BR')}
                                        </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="col-contact">
                            <div class="contact-info">
                                <div class="contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <a href="mailto:${email}" class="contact-link" onclick="event.stopPropagation()">${email || 'Não informado'}</a>
                                </div>
                                <div class="contact-item">
                                    <i class="fas fa-phone"></i>
                                    <a href="tel:${phone}" class="contact-link" onclick="event.stopPropagation()">${phone || 'Não informado'}</a>
                                </div>
                            </div>
                        </td>
                        <td class="col-category">
                            <span class="category-badge category-${category.toLowerCase()}">${this.getCategoryIcon(category)} ${category}</span>
                        </td>
                        <td class="col-belt">
                            <div class="belt-badge belt-${belt.toLowerCase()}">
                                <span class="belt-emoji">${beltEmoji}</span>
                                <span class="belt-name">${beltName}</span>
                            </div>
                        </td>
                        <td class="col-plan">
                            <div class="plan-info-card">
                                <div class="plan-name" title="${plan}">
                                    <i class="fas fa-credit-card"></i>
                                    ${plan}
                                </div>
                                <div class="plan-meta">
                                    ${subs > 0 ? `
                                    <span class="plan-subs active">
                                        <i class="fas fa-check-circle"></i>
                                        ${subs} ativa${subs !== 1 ? 's' : ''}
                                    </span>
                                    ` : `
                                    <span class="plan-subs inactive">
                                        <i class="fas fa-times-circle"></i>
                                        Sem assinatura
                                    </span>
                                    `}
                                </div>
                            </div>
                        </td>
                        <td class="col-status">${statusBadge}</td>
                        <td class="col-stats">
                            <div class="stats-mini-card">
                                <div class="stat-item stat-attendance" title="Frequência">
                                    <i class="fas fa-calendar-check"></i>
                                    <span class="stat-value">${attends}</span>
                                    <span class="stat-label">aulas</span>
                                </div>
                                ${progressBar}
                            </div>
                        </td>
                        <td class="col-actions">
                            <div class="action-buttons">
                                <button class="btn-action btn-edit" onclick="event.stopPropagation(); location.hash='student-editor/${s.id}'; window.router?.navigateTo('student-editor', {id: '${s.id}'})" title="Editar estudante">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-action btn-view" onclick="event.stopPropagation(); window.studentsModule?.viewDetails?.('${s.id}')" title="Ver detalhes completos">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-action btn-whatsapp" onclick="event.stopPropagation(); window.open('https://wa.me/55${phone.replace(/\D/g, '')}', '_blank')" title="Enviar WhatsApp" ${!phone ? 'disabled' : ''}>
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                                ${plan.toLowerCase().includes('personal') ? `
                                    <button class="btn-action btn-personal" onclick="event.stopPropagation(); window.studentsModule?.schedulePersonal?.('${s.id}')" title="Agendar Personal Training">
                                        <i class="fas fa-dumbbell"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Wire enhanced interactions for rows
        this.container.querySelectorAll('tr.row-link').forEach(tr => {
            // Double click to edit - with visual feedback
            tr.addEventListener('dblclick', (e) => {
                e.preventDefault();
                const id = tr.getAttribute('data-id');
                console.log('🎯 Duplo clique no estudante:', id);
                
                // Visual feedback
                tr.style.background = 'var(--primary-color)';
                tr.style.color = 'white';
                tr.style.transform = 'scale(1.01)';
                
                setTimeout(() => {
                    location.hash = `student-editor/${id}`;
                    if (window.router?.navigateTo) {
                        window.router.navigateTo('student-editor', { id });
                    }
                }, 200);
            });
            
            // Enhanced hover feedback
            tr.addEventListener('mouseenter', () => {
                if (!tr.style.background.includes('var(--primary-color)')) {
                    tr.style.background = 'var(--color-background)';
                    tr.style.cursor = 'pointer';
                    tr.title = 'Duplo clique para editar';
                }
            });
            
            tr.addEventListener('mouseleave', () => {
                if (!tr.style.background.includes('var(--primary-color)')) {
                    tr.style.background = '';
                    tr.style.transform = '';
                }
            });
        });

        // Update pagination
        const currentPageEl = this.container.querySelector('#current-page');
        const totalPagesEl = this.container.querySelector('#total-pages');
        const paginationInfoEl = this.container.querySelector('#pagination-info');
        const filteredStudentsEl = this.container.querySelector('#filtered-students');
        
        if (currentPageEl) currentPageEl.textContent = String(this.currentPage);
        if (totalPagesEl) totalPagesEl.textContent = String(totalPages);
        if (paginationInfoEl) paginationInfoEl.textContent = `Mostrando ${pageItems.length} de ${list.length} (Total: ${this.students.length})`;
        if (filteredStudentsEl) filteredStudentsEl.textContent = String(list.length);
        
        const prev = this.container.querySelector('#prev-page-btn');
        const next = this.container.querySelector('#next-page-btn');
        if (prev) prev.disabled = this.currentPage <= 1;
        if (next) next.disabled = this.currentPage >= totalPages;

        // Update cards view if active
        if (this.viewMode === 'cards') {
            this.renderCardsView();
        }

        // Handle bulk selection
        this.updateBulkActions();
    }

    updateBulkActions() {
        const checkboxes = this.container.querySelectorAll('.student-checkbox:checked');
        const bulkBar = this.container.querySelector('#bulk-actions-bar');
        const selectedCount = this.container.querySelector('#selected-count');
        
        if (checkboxes.length > 0) {
            bulkBar.style.display = 'flex';
            selectedCount.textContent = checkboxes.length;
        } else {
            bulkBar.style.display = 'none';
        }
    }

    /**
     * Navigate to edit student page
     */
    editStudent(studentId) {
        console.log('✏️ Editando estudante:', studentId);
        location.hash = `student-editor/${studentId}`;
        if (window.router?.navigateTo) {
            window.router.navigateTo('student-editor', { id: studentId });
        }
    }

    /**
     * View student details (same as edit for now, could be read-only view)
     */
    viewStudent(studentId) {
        console.log('👁️ Visualizando estudante:', studentId);
        this.editStudent(studentId);
    }

    showImportModal() {
        // Simple placeholder - could be enhanced with proper modal
        const csvFile = prompt('Cole o conteúdo CSV aqui ou implemente upload de arquivo:');
        if (csvFile) {
            console.log('📥 Import CSV:', csvFile.substring(0, 100) + '...');
            alert('Funcionalidade de importação será implementada em breve');
        }
    }

    exportStudents() {
        const data = this.getFiltered();
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, 'estudantes.csv');
    }

    convertToCSV(data) {
        const headers = ['Nome', 'Email', 'Telefone', 'Categoria', 'Status', 'Assinaturas', 'Presenças'];
        const rows = data.map(s => [
            `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim(),
            s?.user?.email || '',
            s?.user?.phone || '',
            s?.category || '',
            s?.isActive ? 'Ativo' : 'Inativo',
            s?._count?.subscriptions || 0,
            s?._count?.attendances || 0
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Helper methods for enhanced UI
    getInitials(name) {
        if (!name || name === 'Sem nome') return '?';
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getBeltEmoji(belt) {
        const belts = {
            'WHITE': '⚪',
            'YELLOW': '🟡',
            'ORANGE': '🟠',
            'GREEN': '🟢',
            'BLUE': '🔵',
            'BROWN': '🟤',
            'BLACK': '⚫'
        };
        return belts[belt] || '⚪';
    }

    getBeltName(belt) {
        const names = {
            'WHITE': 'Branca',
            'YELLOW': 'Amarela',
            'ORANGE': 'Laranja',
            'GREEN': 'Verde',
            'BLUE': 'Azul',
            'BROWN': 'Marrom',
            'BLACK': 'Preta'
        };
        return names[belt] || 'Branca';
    }

    getCategoryIcon(category) {
        const icons = {
            'ADULT': '👨',
            'TEEN': '🧑',
            'CHILD': '👶',
            'SENIOR': '👴'
        };
        return icons[category] || '👤';
    }

    calculateAttendanceRate(student) {
        const totalClasses = student?._count?.classes || 30; // Assuming 30 classes per month
        const attended = student?._count?.attendances || 0;
        return totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;
    }

    renderProgressBar(percentage) {
        const color = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger';
        return `
            <div class="progress-bar-mini">
                <div class="progress-fill progress-${color}" style="width: ${percentage}%"></div>
                <span class="progress-label">${percentage}%</span>
            </div>
        `;
    }

    /**
     * Toggle between table and cards view
     * Note: On mobile (768px or less), always stays in cards view
     */
    toggleView() {
        // Don't allow switching to table on mobile
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            this.viewMode = 'cards';
            return;
        }
        
        this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
        localStorage.setItem('students-view-mode', this.viewMode);
        
        this.updateViewDisplay();
        this.updateViewToggleButton();
    }

    /**
     * Wait for view elements to be ready with retry logic
     */
    waitForViewElements(retries = 5, delay = 100) {
        const tableView = this.container.querySelector('#table-view');
        const cardsView = this.container.querySelector('#cards-view');

        if (tableView && cardsView) {
            this.updateViewDisplay();
        } else if (retries > 0) {
            setTimeout(() => this.waitForViewElements(retries - 1, delay * 1.5), delay);
        } else {
            console.warn('View elements not found after retries');
        }
    }

    /**
     * Update view display based on current mode
     */
    updateViewDisplay() {
        const tableView = this.container.querySelector('#table-view');
        const cardsView = this.container.querySelector('#cards-view');

        // Verificação de segurança
        if (!tableView || !cardsView) {
            console.warn('View elements not found');
            return;
        }

        if (this.viewMode === 'cards') {
            tableView.style.display = 'none';
            cardsView.style.display = 'grid';
            this.renderCardsView();
        } else {
            tableView.style.display = 'block';
            cardsView.style.display = 'none';
        }
    }

    /**
     * Update toggle button icon and tooltip
     */
    updateViewToggleButton(btn) {
        const toggleBtn = btn || this.container.querySelector('#toggle-view-btn');
        if (!toggleBtn) return;

        if (this.viewMode === 'cards') {
            toggleBtn.innerHTML = '<i class="fas fa-table"></i>';
            toggleBtn.title = 'Visualização em Tabela';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-th"></i>';
            toggleBtn.title = 'Visualização em Cards';
        }
    }

    /**
     * Render students in cards view
     */
    renderCardsView() {
        const cardsContainer = this.container.querySelector('#cards-view');
        if (!cardsContainer) return;

        if (!this.students || this.students.length === 0) {
            cardsContainer.innerHTML = `
                <div class="module-isolated-empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">😔</div>
                    <h3 class="empty-title">Nenhum estudante encontrado</h3>
                    <p class="empty-message">Não há estudantes cadastrados ou os filtros não retornaram resultados.</p>
                    <div class="empty-actions">
                        <button class="btn-form btn-primary-form" onclick="document.getElementById('create-student-btn').click()">
                            <i class="fas fa-plus"></i> Adicionar Primeiro Estudante
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        cardsContainer.innerHTML = this.students.map((student, index) => {
            const user = student.user || {};
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Sem nome';
            const initials = this.getInitials(fullName);
            const belt = student.currentBelt || 'WHITE';
            const category = student.category || 'ADULT';
            const isActive = student.isActive !== false;
            const attendanceRate = this.calculateAttendanceRate(student);
            
            return `
                <div class="student-card" 
                     data-student-id="${student.id}" 
                     style="animation-delay: ${index * 0.05}s"
                     ondblclick="window.studentsListController.editStudent('${student.id}')">
                    
                    <!-- Card Header with Avatar -->
                    <div class="card-header-premium">
                        <div class="student-avatar large ${user.avatarUrl ? '' : 'avatar-initials'}">
                            ${user.avatarUrl 
                                ? `<img src="${user.avatarUrl}" alt="${fullName}" onerror="this.parentElement.innerHTML='<span>${initials}</span>'; this.parentElement.classList.add('avatar-initials');">`
                                : `<span>${initials}</span>`
                            }
                        </div>
                        <div class="student-status-badge">
                            <span class="status-badge status-${isActive ? 'active' : 'inactive'} pulse-animation">
                                ${isActive ? '✅ ATIVO' : '⏸️ INATIVO'}
                            </span>
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="card-body-premium">
                        <h3 class="student-name-large">${fullName}</h3>
                        
                        <div class="student-meta-cards">
                            <div class="meta-badge">
                                ${this.getBeltEmoji(belt)}
                                <span>Faixa ${this.getBeltName(belt)}</span>
                            </div>
                            <div class="meta-badge">
                                ${this.getCategoryIcon(category)}
                                <span>${category}</span>
                            </div>
                        </div>

                        <!-- Contact Info -->
                        <div class="contact-info-card">
                            ${user.email ? `
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i>
                                <a href="mailto:${user.email}" class="contact-link">${user.email}</a>
                            </div>
                            ` : ''}
                            ${user.phone ? `
                            <div class="contact-item">
                                <i class="fas fa-phone"></i>
                                <span>${user.phone}</span>
                            </div>
                            ` : ''}
                        </div>

                        <!-- Stats Mini -->
                        <div class="stats-mini-card">
                            <div class="stat-item">
                                <i class="fas fa-calendar-check"></i>
                                <div>
                                    <span class="stat-label">Frequência</span>
                                    ${this.renderProgressBar(attendanceRate)}
                                </div>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-graduation-cap"></i>
                                <div>
                                    <span class="stat-label">Técnicas</span>
                                    <span class="stat-value">${student._count?.techniques || 0} dominadas</span>
                                </div>
                            </div>
                        </div>

                        <!-- Observações -->
                        ${student.observations ? `
                        <div class="card-observations">
                            <i class="fas fa-sticky-note"></i>
                            <p>${student.observations.substring(0, 100)}${student.observations.length > 100 ? '...' : ''}</p>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Card Actions -->
                    <div class="card-actions-premium">
                        <button class="btn-action btn-edit" 
                                onclick="event.stopPropagation(); window.studentsListController.editStudent('${student.id}')"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-view" 
                                onclick="event.stopPropagation(); window.studentsListController.viewStudent('${student.id}')"
                                title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${user.phone ? `
                        <button class="btn-action btn-whatsapp" 
                                onclick="event.stopPropagation(); window.open('https://wa.me/55${user.phone.replace(/\D/g, '')}', '_blank')"
                                title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ` : ''}
                        <button class="btn-action btn-personal" 
                                onclick="event.stopPropagation(); alert('Treino personalizado em desenvolvimento')"
                                title="Treino Personalizado">
                            <i class="fas fa-dumbbell"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}


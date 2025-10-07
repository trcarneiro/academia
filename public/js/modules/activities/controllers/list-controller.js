/**
 * Activities List Controller - Guidelines.MD Compliant
 * 
 * Manages the activities list view with search, filtering, pagination
 * and CRUD operations following SPA patterns.
 */

export class ActivitiesListController {
    constructor(api) {
        this.api = api;
        this.container = null;
        this.activities = [];
        this.totalCount = 0;
        this.currentPage = 1;
        this.pageSize = 20;
        this.searchQuery = '';
        this.filterType = '';
        this.filterDifficulty = '';
        this.isLoading = false;
        
        // Selection management
        this.selectedActivities = new Set();
        this.allActivitiesSelected = false;
        
        // Global reference for window functions
        window.activitiesListController = this;
    }

    /**
     * Render the activities list in the target container
     */
    async render(targetContainer) {
        console.log('🏋️ ListController.render() chamado');
        console.log('🏋️ Container:', targetContainer);
        console.log('🏋️ API:', this.api);
        
        this.container = targetContainer;
        
        // Mark container as activities module
        targetContainer.setAttribute('data-module', 'activities');
        targetContainer.setAttribute('data-active', 'true');
        targetContainer.classList.add('module-active');
        
        try {
            // Render initial HTML structure
            this.renderHTML();
            console.log('🏋️ HTML renderizado');
            
            // Setup event listeners
            this.bindEvents(targetContainer);
            console.log('🏋️ Eventos vinculados');
            
            // Load initial data
            await this.loadData();
            console.log('🏋️ Dados carregados');
            
            console.log('✅ Activities list controller renderizado');
        } catch (error) {
            console.error('❌ Erro no ListController.render():', error);
            console.error('❌ Stack trace:', error.stack);
            throw error;
        }
    }

    /**
     * Render HTML structure
     */
    renderHTML() {
        this.container.innerHTML = `
            <div class="module-isolated-container" data-module="activities">
                <!-- Header Premium com Guidelines.MD -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="page-title">
                                <i class="icon">🏋️</i>
                                Atividades
                            </h1>
                            <nav class="breadcrumb">Home / Atividades</nav>
                        </div>
                        <div class="header-actions">
                            <button id="create-activity-btn" class="btn-form btn-primary-form">
                                <i class="fas fa-plus"></i>
                                Nova Atividade
                            </button>
                            <button id="import-techniques-btn" class="btn-form btn-warning-form">
                                <i class="fas fa-upload"></i>
                                Importar Técnicas
                            </button>
                            <button id="export-activities-btn" class="btn-form btn-success-form">
                                <i class="fas fa-download"></i>
                                Exportar Técnicas
                            </button>
                            <button id="export-all-btn" class="btn-form btn-info-form">
                                <i class="fas fa-file-export"></i>
                                Exportar Todas
                            </button>
                            <button id="refresh-activities-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-sync-alt"></i>
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Cards Premium -->
                <div class="module-stats">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-value" id="total-activities">-</div>
                            <div class="stat-label">Total de Atividades</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🔍</div>
                        <div class="stat-content">
                            <div class="stat-value" id="filtered-activities">-</div>
                            <div class="stat-label">Filtradas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-value" id="activity-types">-</div>
                            <div class="stat-label">Tipos</div>
                        </div>
                    </div>
                </div>

                <!-- Filters Premium -->
                <div class="module-filters-premium">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="search-activities" class="filter-label">
                                <i class="fas fa-search"></i>
                                Buscar
                            </label>
                            <input type="text" id="search-activities" placeholder="Digite título ou descrição..." 
                                   class="filter-input" autocomplete="off">
                        </div>
                        <div class="filter-group">
                            <label for="filter-type" class="filter-label">
                                <i class="fas fa-tag"></i>
                                Tipo
                            </label>
                            <select id="filter-type" class="filter-select">
                                <option value="">Todos os tipos</option>
                                <option value="TECHNIQUE">Técnica</option>
                                <option value="STRETCH">Alongamento</option>
                                <option value="DRILL">Drill</option>
                                <option value="EXERCISE">Exercício</option>
                                <option value="GAME">Jogo</option>
                                <option value="CHALLENGE">Desafio</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-difficulty" class="filter-label">
                                <i class="fas fa-star"></i>
                                Dificuldade
                            </label>
                            <select id="filter-difficulty" class="filter-select">
                                <option value="">Todas as dificuldades</option>
                                <option value="1">⭐ Iniciante</option>
                                <option value="2">⭐⭐ Básico</option>
                                <option value="3">⭐⭐⭐ Intermediário</option>
                                <option value="4">⭐⭐⭐⭐ Avançado</option>
                                <option value="5">⭐⭐⭐⭐⭐ Expert</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="items-per-page" class="filter-label">
                                <i class="fas fa-list"></i>
                                Por Página
                            </label>
                            <select id="items-per-page" class="filter-select">
                                <option value="20">20 itens</option>
                                <option value="50">50 itens</option>
                                <option value="100">100 itens</option>
                                <option value="all">Todos</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button id="clear-filters-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-times"></i>
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions Bar -->
                <div id="bulk-actions-bar" class="bulk-actions-bar" style="display: none;">
                    <div class="bulk-info">
                        <span id="selected-count">0</span> atividades selecionadas
                    </div>
                    <div class="bulk-buttons">
                        <button id="select-page-btn" class="btn-bulk btn-secondary">
                            <i class="fas fa-check-square"></i>
                            Selecionar página
                        </button>
                        <button id="select-all-btn" class="btn-bulk btn-secondary">
                            <i class="fas fa-check-double"></i>
                            Selecionar todas (<span id="total-activities">0</span>)
                        </button>
                        <button id="deselect-all-btn" class="btn-bulk btn-secondary">
                            <i class="fas fa-square"></i>
                            Desselecionar
                        </button>
                        <button id="delete-selected-btn" class="btn-bulk btn-danger">
                            <i class="fas fa-trash"></i>
                            Excluir selecionadas
                        </button>
                    </div>
                </div>

                <!-- Table Premium -->
                <div class="data-card-premium">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th class="col-select">
                                        <input type="checkbox" id="select-all-activities" title="Selecionar todos">
                                    </th>
                                    <th class="col-activity">
                                        <i class="fas fa-dumbbell"></i>
                                        Atividade
                                    </th>
                                    <th class="col-type">
                                        <i class="fas fa-tag"></i>
                                        Tipo
                                    </th>
                                    <th class="col-difficulty">
                                        <i class="fas fa-star"></i>
                                        Dificuldade
                                    </th>
                                    <th class="col-duration">
                                        <i class="fas fa-clock"></i>
                                        Duração
                                    </th>
                                    <th class="col-equipment">
                                        <i class="fas fa-tools"></i>
                                        Equipamentos
                                    </th>
                                    <th class="col-actions">
                                        <i class="fas fa-cog"></i>
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="activities-table-body">
                                <!-- Content will be loaded here -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Debug Controls -->
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <strong>🔧 Debug Paginação:</strong>
                        <button onclick="window.activitiesListController?.loadData()" 
                                style="margin-left: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Recarregar Dados
                        </button>
                        <button onclick="window.activitiesListController?.updatePagination()" 
                                style="margin-left: 0.5rem; padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            📄 Atualizar Paginação
                        </button>
                        <span id="debug-info" style="margin-left: 1rem; font-family: monospace; font-size: 0.8rem;"></span>
                    </div>

                    <!-- Pagination Premium -->
                    <div class="module-pagination">
                        <div class="pagination-info">
                            <span id="pagination-info">Carregando...</span>
                        </div>
                        <div class="pagination-controls">
                            <button id="prev-page-btn" class="btn-form btn-secondary-form" disabled>
                                <i class="fas fa-chevron-left"></i>
                                Anterior
                            </button>
                            <span class="pagination-current">
                                Página <span id="current-page">1</span> de <span id="total-pages">1</span>
                            </span>
                            <button id="next-page-btn" class="btn-form btn-secondary-form" disabled>
                                Próxima
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Modal de Importação de Técnicas -->
                <div id="import-techniques-modal" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-lg">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="fas fa-upload"></i>
                                Importar Técnicas em Lote
                            </h3>
                            <button type="button" class="modal-close" onclick="this.closest('.modal-overlay').style.display='none'">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="import-section">
                                <h4>📋 Formato JSON Requerido:</h4>
                                <div class="format-example">
                                    <pre><code>[
  {
    "id": 1,
    "name": "Defesa contra Soco Direto",
    "description": "Técnica de defesa...",
    "type": "TECHNIQUE",
    "category": "DEFENSE",
    "difficulty": 2,
    "equipment": ["Luvas"],
    "duration": 300,
    "repetitions": 10,
    "instructions": ["Passo 1...", "Passo 2..."],
    "tips": ["Dica 1...", "Dica 2..."],
    "safety": ["Cuidado 1...", "Cuidado 2..."]
  }
]</code></pre>
                                </div>
                            </div>
                            
                            <div class="import-section">
                                <h4>📁 Selecionar Arquivo JSON:</h4>
                                <input type="file" id="techniques-file-input" accept=".json" class="file-input">
                                <div class="file-drop-zone" id="file-drop-zone">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Arraste o arquivo JSON aqui ou clique para selecionar</p>
                                    <small>Apenas arquivos .json são aceitos</small>
                                </div>
                            </div>

                            <div id="import-preview" class="import-preview" style="display: none;">
                                <h4>🔍 Prévia da Importação:</h4>
                                <div id="preview-content"></div>
                            </div>

                            <div id="import-progress" class="import-progress" style="display: none;">
                                <h4>⚡ Progresso da Importação:</h4>
                                <div class="progress-bar">
                                    <div id="progress-fill" class="progress-fill"></div>
                                </div>
                                <div id="progress-text">Preparando...</div>
                            </div>

                            <div id="import-results" class="import-results" style="display: none;">
                                <h4>✅ Resultados da Importação:</h4>
                                <div id="results-content"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-form btn-secondary-form" onclick="this.closest('.modal-overlay').style.display='none'">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                            <button type="button" id="start-import-btn" class="btn-form btn-success-form" disabled>
                                <i class="fas fa-upload"></i>
                                Iniciar Importação
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents(container) {
        // Search input with debounce
        const searchInput = container.querySelector('#search-activities');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.trim();
                    this.currentPage = 1;
                    this.loadData();
                }, 300);
            });
        }

        // Type filter
        const typeFilter = container.querySelector('#filter-type');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });
        }

        // Difficulty filter
        const difficultyFilter = container.querySelector('#filter-difficulty');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => {
                this.filterDifficulty = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });
        }

        // Items per page selector
        const itemsPerPageSelect = container.querySelector('#items-per-page');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (value === 'all') {
                    this.pageSize = 1000; // Um número alto para "todos"
                } else {
                    this.pageSize = parseInt(value);
                }
                this.currentPage = 1;
                console.log('📄 Page size alterado para:', this.pageSize);
                this.loadData();
            });
        }

        // Clear filters
        const clearFiltersBtn = container.querySelector('#clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Create activity button
        const createBtn = container.querySelector('#create-activity-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                window.openActivityEditor();
            });
        }

        // Import techniques button
        const importBtn = container.querySelector('#import-techniques-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.showImportDialog();
            });
        }

        // Export activities button
        const exportBtn = container.querySelector('#export-activities-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportActivities();
            });
        }

        // Export all activities button
        const exportAllBtn = container.querySelector('#export-all-btn');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => {
                this.exportAllActivities();
            });
        }

        // Refresh button
        const refreshBtn = container.querySelector('#refresh-activities-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
            });
        }

        // Pagination buttons
        const prevBtn = container.querySelector('#prev-page-btn');
        const nextBtn = container.querySelector('#next-page-btn');
        
        console.log('📄 Configurando event listeners de paginação');
        console.log('📄 Prev button encontrado:', !!prevBtn);
        console.log('📄 Next button encontrado:', !!nextBtn);
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('📄 ⬅️ Prev button clicado - Current page:', this.currentPage);
                if (this.currentPage > 1) {
                    this.currentPage--;
                    console.log('📄 ⬅️ Navegando para página:', this.currentPage);
                    this.loadData();
                } else {
                    console.log('📄 ⬅️ Já está na primeira página');
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalCount / this.pageSize);
                console.log('📄 ➡️ Next button clicado - Current page:', this.currentPage, 'Total pages:', totalPages);
                if (this.currentPage < totalPages) {
                    const oldPage = this.currentPage;
                    this.currentPage++;
                    console.log('📄 ➡️ Navegando:', oldPage, '->', this.currentPage);
                    this.loadData();
                } else {
                    console.log('📄 ➡️ Já está na última página');
                }
            });
        }

        // Selection events
        this.bindSelectionEvents(container);
    }

    /**
     * Bind selection events for bulk actions
     */
    bindSelectionEvents(container) {
        // Select all checkbox
        const selectAllCheckbox = container.querySelector('#select-all-activities');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        // Bulk action buttons
        const selectPageBtn = container.querySelector('#select-page-btn');
        if (selectPageBtn) {
            selectPageBtn.addEventListener('click', () => {
                this.selectCurrentPage();
            });
        }

        const selectAllBtn = container.querySelector('#select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllActivities();
            });
        }

        const deselectAllBtn = container.querySelector('#deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                this.deselectAll();
            });
        }

        const deleteSelectedBtn = container.querySelector('#delete-selected-btn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => {
                this.deleteSelectedActivities();
            });
        }

        // Individual checkbox changes
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('activity-checkbox')) {
                this.toggleActivitySelection(e.target.value, e.target.checked);
            }
        });
    }

    /**
     * Load activities data from API
     */
    async loadData() {
        console.log('🏋️ loadData() iniciado');
        console.log('🏋️ isLoading atual:', this.isLoading);
        console.log('🏋️ Página solicitada:', this.currentPage);
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.setLoading(true);
        
        try {
            // Build query parameters
            const params = {
                page: this.currentPage,
                pageSize: this.pageSize  // Corrigido: usar pageSize ao invés de limit
            };
            
            if (this.searchQuery) params.search = this.searchQuery;
            if (this.filterType) params.type = this.filterType;
            if (this.filterDifficulty) params.difficulty = this.filterDifficulty;
            
            console.log('🏋️ Parâmetros da consulta:', params);
            console.log('🏋️ Fazendo chamada para /api/activities...');
            
            // Use API client with states
            const result = await this.api.fetchWithStates('/api/activities', {
                method: 'GET',
                params,
                onSuccess: (data) => {
                    console.log('🏋️ API retornou sucesso:', data);
                    console.log('🏋️ Estrutura da resposta:', {
                        isSuccess: data.success,
                        hasData: !!data.data,
                        dataLength: data.data ? data.data.length : 0,
                        count: data.count,
                        page: data.page,
                        pageSize: data.pageSize,
                        totalPages: data.totalPages
                    });
                    
                    // API retorna { success: true, data: [...], count, page, pageSize, totalPages }
                    // Mas pode estar vindo com estrutura ligeiramente diferente
                    if (data.success && data.data) {
                        this.activities = data.data;
                        
                        // Se temos pagination metadata direta (ideal)
                        if (data.count !== undefined) {
                            this.totalCount = data.count || 0;
                            this.currentPage = data.page || 1;
                            this.pageSize = data.pageSize || 20;
                            console.log('🏋️ ✅ Metadata completa recebida - Total:', this.totalCount);
                        } else if (Array.isArray(data.data)) {
                            // WORKAROUND: Se não temos metadata, usar estimativa otimista
                            this.activities = data.data;
                            // NÃO resetar currentPage - manter a página solicitada
                            // this.currentPage = 1; // REMOVIDO - bug que sempre voltava para página 1
                            this.pageSize = 20;
                            // Estimar que há mais páginas se temos dados suficientes
                            this.totalCount = data.data.length >= this.pageSize ? data.data.length * 4 : data.data.length;
                            console.log('🏋️ ⚠️ Usando estimativa de count:', this.totalCount, 'página atual mantida:', this.currentPage);
                            
                            // Buscar count real em paralelo (não bloqueia UI)
                            this._fetchTotalCount();
                        } else {
                            // Último recurso
                            this.activities = [];
                            this.totalCount = 0;
                            console.log('🏋️ ❌ Nenhum dado válido encontrado');
                        }
                        console.log('🏋️ ✅ Dados processados corretamente - Atividades:', this.activities.length, 'Total:', this.totalCount, 'Página:', this.currentPage, 'de', Math.ceil(this.totalCount / this.pageSize));
                    } else if (Array.isArray(data)) {
                        // Fallback para array direto (compatibilidade com APIs antigas)
                        this.activities = data;
                        this.totalCount = data.length;
                        console.log('🏋️ ⚠️ Fallback array - Atividades:', this.activities.length);
                    } else {
                        // Último recurso
                        this.activities = [];
                        this.totalCount = 0;
                        console.log('🏋️ ❌ Nenhum dado válido encontrado');
                    }
                    this.updateTable();
                    this.updateStats();
                    this.updatePagination();
                    this.updateDebugInfo();
                },
                onEmpty: () => {
                    console.log('🏋️ API retornou vazio');
                    this.activities = [];
                    this.totalCount = 0;
                    this.showEmptyState();
                    this.updateStats();
                    this.updatePagination();
                    this.updateDebugInfo();
                },
                onError: (error) => {
                    console.error('❌ Erro na API:', error);
                    this.showErrorState('Erro ao carregar atividades');
                }
            });

        } catch (error) {
            console.error('❌ Erro ao carregar atividades:', error);
            this.showErrorState('Erro ao carregar atividades');
        } finally {
            this.isLoading = false;
            this.setLoading(false);
            console.log('🏋️ loadData() finalizado');
        }
    }

    /**
     * Clean up and stop any background processes
     */
    cleanup() {
        console.log('🏋️ Limpando list controller...');
        this.isLoading = false;
        
        // Clear any timeouts or intervals
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
        
        // Mark as inactive
        if (this.container) {
            this.container.setAttribute('data-active', 'false');
            this.container.classList.remove('module-active');
        }
        
        console.log('🏋️ List controller limpo');
    }

    /**
     * Update activities table
     */
    updateTable() {
        console.log('🏋️ updateTable() chamado com', this.activities.length, 'atividades');
        
        // Verificar se ainda estamos no contexto correto
        if (!this.container || !this.container.getAttribute('data-active')) {
            console.log('🏋️ ⚠️ Container não ativo, ignorando updateTable');
            return;
        }
        
        const tbody = this.container.querySelector('#activities-table-body');
        console.log('🏋️ tbody encontrado:', !!tbody);
        
        if (!tbody) {
            console.error('❌ Elemento #activities-table-body não encontrado');
            return;
        }
        
        if (this.activities.length === 0) {
            console.log('🏋️ Mostrando estado vazio');
            this.showEmptyState();
            return;
        }

        console.log('🏋️ Renderizando', this.activities.length, 'atividades na tabela');
        tbody.innerHTML = this.activities.map(activity => `
            <tr class="table-row" data-activity-id="${activity.id}">
                <td class="col-select">
                    <input type="checkbox" class="activity-checkbox" value="${activity.id}" data-activity-id="${activity.id}">
                </td>
                <td>
                    <div class="activity-info">
                        <strong class="activity-title">${activity?.title || activity?.name || activity?.description?.substring(0, 50) || 'Atividade sem nome'}</strong>
                        <div class="activity-description">${activity?.description || 'Sem descrição'}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${activity.type?.toLowerCase() || 'default'}">
                        ${this.getTypeLabel(activity.type)}
                    </span>
                </td>
                <td>
                    <div class="difficulty-display">
                        ${this.renderDifficulty(activity.difficulty || 1)}
                    </div>
                </td>
                <td>
                    <span class="duration-display">${activity.duration || 5} min</span>
                </td>
                <td>
                    <div class="equipment-list">
                        ${this.renderEquipment(activity.equipment)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-form btn-small btn-primary-form" 
                                onclick="window.openActivityEditor('${activity.id}')" 
                                title="Editar atividade">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-form btn-small btn-danger-form" 
                                onclick="window.activitiesListController?.deleteActivity('${activity.id}')" 
                                title="Excluir atividade">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        console.log('🏋️ Tabela atualizada com sucesso');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const tbody = this.container.querySelector('#activities-table-body');
        if (!tbody) return;
        
        const message = this.searchQuery || this.filterType || this.filterDifficulty 
            ? 'Nenhuma atividade encontrada com os filtros aplicados'
            : 'Nenhuma atividade cadastrada';
            
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-title">${message}</div>
                    <div class="empty-subtitle">
                        ${this.searchQuery || this.filterType || this.filterDifficulty 
                            ? 'Tente ajustar os filtros de busca'
                            : 'Comece criando sua primeira atividade'}
                    </div>
                    ${!this.searchQuery && !this.filterType && !this.filterDifficulty ? `
                        <button class="btn-form btn-primary-form" onclick="window.openActivityEditor()">
                            <i class="fas fa-plus"></i>
                            Criar primeira atividade
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }

    /**
     * Show error state
     */
    showErrorState(message) {
        const tbody = this.container.querySelector('#activities-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">Erro ao carregar dados</div>
                    <div class="error-message">${message}</div>
                    <button class="btn-form btn-primary-form" onclick="window.activitiesListController?.loadData()">
                        <i class="fas fa-sync-alt"></i>
                        Tentar novamente
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Update statistics
     */
    updateStats() {
        const totalElement = this.container.querySelector('#total-activities');
        const filteredElement = this.container.querySelector('#filtered-activities');
        const typesElement = this.container.querySelector('#activity-types');
        
        if (totalElement) totalElement.textContent = this.totalCount;
        if (filteredElement) filteredElement.textContent = this.activities.length;
        
        if (typesElement) {
            const uniqueTypes = new Set(this.activities.map(a => a.type).filter(Boolean));
            typesElement.textContent = uniqueTypes.size;
        }
    }

    /**
     * Update pagination
     */
    updatePagination() {
        console.log('📄 🎯 updatePagination() INÍCIO');
        
        // Verificar se ainda estamos no contexto correto
        if (!this.container || !this.container.getAttribute('data-active')) {
            console.log('📄 ⚠️ Container não ativo, ignorando updatePagination');
            return;
        }
        
        console.log('📄 State atual:', {
            totalCount: this.totalCount,
            pageSize: this.pageSize,
            currentPage: this.currentPage,
            activitiesLength: this.activities.length,
            isLoading: this.isLoading
        });
        
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        const infoElement = this.container.querySelector('#pagination-info');
        const currentPageElement = this.container.querySelector('#current-page');
        const totalPagesElement = this.container.querySelector('#total-pages');
        const prevBtn = this.container.querySelector('#prev-page-btn');
        const nextBtn = this.container.querySelector('#next-page-btn');
        
        console.log('📄 Elementos encontrados:', {
            infoElement: !!infoElement,
            currentPageElement: !!currentPageElement,
            totalPagesElement: !!totalPagesElement,
            prevBtn: !!prevBtn,
            nextBtn: !!nextBtn
        });
        
        console.log('📄 Calculado totalPages:', totalPages);
        
        if (infoElement) {
            if (this.isLoading) {
                infoElement.textContent = 'Carregando paginação...';
                infoElement.style.opacity = '0.6';
                console.log('📄 Info element - modo loading');
            } else {
                const start = (this.currentPage - 1) * this.pageSize + 1;
                const end = Math.min(start + this.activities.length - 1, this.totalCount);
                infoElement.textContent = `${start}-${end} de ${this.totalCount} atividades`;
                infoElement.style.opacity = '1';
                console.log('📄 Info element atualizado:', `${start}-${end} de ${this.totalCount} atividades`);
            }
        } else {
            console.log('📄 ⚠️ Info element não encontrado');
        }
        
        if (currentPageElement) {
            currentPageElement.textContent = this.currentPage;
            console.log('📄 Current page element atualizado:', this.currentPage);
        } else {
            console.log('📄 ⚠️ Current page element não encontrado');
        }
        
        if (totalPagesElement) {
            totalPagesElement.textContent = totalPages;
            console.log('📄 Total pages element atualizado:', totalPages);
        } else {
            console.log('📄 ⚠️ Total pages element não encontrado');
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
            console.log('📄 Prev button - disabled:', prevBtn.disabled, 'page:', this.currentPage);
        } else {
            console.log('📄 ⚠️ Prev button não encontrado');
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages;
            console.log('📄 Next button - disabled:', nextBtn.disabled, 'page:', this.currentPage, 'totalPages:', totalPages);
        } else {
            console.log('📄 ⚠️ Next button não encontrado');
        }
        
        // Mostrar/esconder container de paginação
        const paginationContainer = this.container.querySelector('.module-pagination');
        if (paginationContainer) {
            // Sempre mostrar paginação se temos atividades, mesmo que seja só 1 página
            // A única exceção é quando realmente não há dados
            const shouldShowPagination = this.totalCount > 0 || this.activities.length > 0;
            const currentDisplay = paginationContainer.style.display;
            paginationContainer.style.display = shouldShowPagination ? 'flex' : 'none';
            console.log('📄 Pagination container:', {
                shouldShow: shouldShowPagination,
                oldDisplay: currentDisplay,
                newDisplay: paginationContainer.style.display,
                totalCount: this.totalCount,
                activitiesLength: this.activities.length
            });
        } else {
            console.log('📄 ⚠️ Pagination container (.module-pagination) não encontrado');
        }
        
        console.log('📄 🎯 updatePagination() FIM');
        
        // Update debug info
        this.updateDebugInfo();
    }

    /**
     * Update debug information display
     */
    updateDebugInfo() {
        const debugElement = this.container?.querySelector('#debug-info');
        if (debugElement) {
            const totalPages = Math.ceil(this.totalCount / this.pageSize);
            const now = new Date().toLocaleTimeString();
            debugElement.textContent = `[${now}] Count: ${this.totalCount} | Page: ${this.currentPage}/${totalPages} | Items: ${this.activities.length} | Loading: ${this.isLoading}`;
        }
    }

    /**
     * Fetch total count separately (workaround for missing pagination metadata)
     */
    async _fetchTotalCount() {
        try {
            console.log('🔢 Buscando count total das atividades...');
            const response = await this.api.api.get('/api/activities/count');
            if (response.success && response.count !== undefined) {
                const oldTotal = this.totalCount;
                this.totalCount = response.count;
                console.log('🔢 Count total atualizado:', oldTotal, '->', this.totalCount);
                
                // Só atualizar paginação se o valor mudou significativamente
                if (Math.abs(oldTotal - this.totalCount) > 1) {
                    this.updatePagination();
                    this.updateStats(); // Atualizar stats também
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao buscar count total:', error);
            // Não fazer nada em caso de erro - manter valores atuais
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        const tbody = this.container.querySelector('#activities-table-body');
        if (!tbody) return;
        
        if (loading) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-state">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando atividades...</div>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.searchQuery = '';
        this.filterType = '';
        this.filterDifficulty = '';
        this.currentPage = 1;
        
        // Reset form elements
        const searchInput = this.container.querySelector('#search-activities');
        const typeFilter = this.container.querySelector('#filter-type');
        const difficultyFilter = this.container.querySelector('#filter-difficulty');
        
        if (searchInput) searchInput.value = '';
        if (typeFilter) typeFilter.value = '';
        if (difficultyFilter) difficultyFilter.value = '';
        
        this.loadData();
    }

    /**
     * Get type label
     */
    getTypeLabel(type) {
        const labels = {
            'TECHNIQUE': 'Técnica',
            'STRETCH': 'Alongamento',
            'DRILL': 'Drill',
            'EXERCISE': 'Exercício',
            'GAME': 'Jogo',
            'CHALLENGE': 'Desafio'
        };
        return labels[type] || type || 'Indefinido';
    }

    /**
     * Render difficulty stars
     */
    renderDifficulty(difficulty) {
        const stars = '⭐'.repeat(difficulty || 1);
        const labels = {
            1: 'Iniciante',
            2: 'Básico',
            3: 'Intermediário',
            4: 'Avançado',
            5: 'Expert'
        };
        return `<span title="${labels[difficulty] || 'Indefinido'}">${stars}</span>`;
    }

    /**
     * Render equipment list
     */
    renderEquipment(equipment) {
        if (!equipment || !Array.isArray(equipment) || equipment.length === 0) {
            return '<span class="no-equipment">Nenhum</span>';
        }
        
        return equipment.slice(0, 3).map(item => 
            `<span class="equipment-tag">${item}</span>`
        ).join('') + (equipment.length > 3 ? `<span class="equipment-more">+${equipment.length - 3}</span>` : '');
    }

    /**
     * Delete activity
     */
    async deleteActivity(activityId) {
        if (!confirm('Tem certeza que deseja excluir esta atividade?')) {
            return;
        }
        
        try {
            // Usar o API client correto - acessar o client interno
            if (this.api && this.api.api && this.api.api.delete) {
                await this.api.api.delete(`/api/activities/${activityId}`);
            } else {
                // Fallback para fetch direto
                const response = await fetch(`/api/activities/${activityId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            
            this.loadData(); // Reload data
            
            // Show success message
            if (window.showToast) {
                window.showToast('Atividade excluída com sucesso', 'success');
            }
        } catch (error) {
            console.error('Erro ao excluir atividade:', error);
            if (window.showToast) {
                window.showToast('Erro ao excluir atividade', 'error');
            }
        }
    }

    /**
     * Export activities as techniques JSON for course import
     */
    async exportActivities() {
        console.log('📥 Iniciando exportação de técnicas...');
        
        try {
            // Buscar todas as atividades (não apenas a página atual)
            console.log('📥 Buscando todas as atividades...');
            const response = await this.api.api.get('/api/activities', {
                params: { 
                    page: 1, 
                    pageSize: 1000, // Buscar todas
                    // Não filtrar por tipo aqui - vamos filtrar no frontend
                }
            });
            
            if (!response.success || !response.data) {
                throw new Error('Erro ao buscar atividades');
            }
            
            console.log('📥 Total de atividades encontradas:', response.data.length);
            
            // Mostrar breakdown por tipo
            const typeBreakdown = response.data.reduce((acc, activity) => {
                acc[activity.type] = (acc[activity.type] || 0) + 1;
                return acc;
            }, {});
            console.log('📥 Breakdown por tipo:', typeBreakdown);
            
            // Filtrar apenas as técnicas no frontend
            const allTechniques = response.data.filter(activity => 
                activity.type === 'TECHNIQUE'
            );
            
            console.log('📥 Técnicas filtradas:', allTechniques.length);
            
            // Converter atividades para formato de técnicas
            const techniques = allTechniques.map(activity => ({
                    nome: activity?.title || activity?.name || activity?.description?.substring(0, 50) || 'Atividade sem nome',
                    descricao: activity.description || '',
                    observacoes: activity.notes || '',
                    categoria: activity.category || 'Geral',
                    nivel_dificuldade: activity.difficulty || 1,
                    repeticoes: this.parseRepetitions(activity.repetitions),
                    duracao: activity.duration || '30 segundos',
                    precisao: activity.precision || 'baixa',
                    tags: activity.tags || [],
                    equipamentos: activity.equipment || [],
                    // Adicionar metadados para rastreabilidade
                    _metadata: {
                        exportedAt: new Date().toISOString(),
                        sourceId: activity.id,
                        sourceSystem: 'Academia Krav Maga v2.0'
                    }
                }));
            
            console.log('📥 Técnicas convertidas:', techniques.length);
            
            if (techniques.length === 0) {
                if (window.showToast) {
                    window.showToast('Nenhuma técnica encontrada para exportar', 'warning');
                }
                return;
            }
            
            // Criar estrutura JSON para importação
            const exportData = {
                techniques: techniques,
                metadata: {
                    exportedAt: new Date().toISOString(),
                    version: '2.0',
                    totalTechniques: techniques.length,
                    source: 'Academia Krav Maga - Módulo de Atividades'
                }
            };
            
            // Gerar arquivo para download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tecnicas-krav-maga-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('📥 ✅ Exportação concluída com sucesso');
            
            // Mostrar modal com instruções de importação
            this.showExportSuccessModal(techniques.length);
            
        } catch (error) {
            console.error('❌ Erro na exportação:', error);
            if (window.showToast) {
                window.showToast('Erro ao exportar técnicas', 'error');
            }
        }
    }

    /**
     * Parse repetitions from activity format to technique format
     */
    parseRepetitions(repetitions) {
        if (!repetitions) return {};
        
        // Se já é um objeto, retornar como está
        if (typeof repetitions === 'object') {
            return repetitions;
        }
        
        // Se é string, tentar parsear
        if (typeof repetitions === 'string') {
            try {
                return JSON.parse(repetitions);
            } catch {
                // Fallback para formato simples
                return { padrao: repetitions };
            }
        }
        
        return {};
    }

    /**
     * Show export success modal with import instructions
     */
    showExportSuccessModal(count, type = 'técnicas') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container export-success-modal">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-check-circle" style="color: #059669;"></i>
                        Exportação Concluída!
                    </h2>
                    <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="success-stats">
                        <div class="stat-item">
                            <span class="stat-number">${count}</span>
                            <span class="stat-label">${type} Exportadas</span>
                        </div>
                    </div>
                    
                    <div class="instructions-section">
                        <h3><i class="fas fa-upload"></i> Como Importar no Módulo de Cursos</h3>
                        <ol class="instruction-list">
                            <li>
                                <strong>Navegue para o módulo "Cursos"</strong>
                                <span>Use o menu lateral para acessar a seção de cursos</span>
                            </li>
                            <li>
                                <strong>Clique em "Importar Técnicas"</strong>
                                <span>Localize o botão de importação na interface de cursos</span>
                            </li>
                            <li>
                                <strong>Selecione o arquivo JSON baixado</strong>
                                <span>Use o arquivo que acabou de ser baixado (tecnicas-krav-maga-*.json)</span>
                            </li>
                            <li>
                                <strong>Confirme a importação</strong>
                                <span>As técnicas serão convertidas automaticamente para atividades do curso</span>
                            </li>
                        </ol>
                    </div>
                    
                    <div class="format-info">
                        <h4><i class="fas fa-info-circle"></i> Formato Compatível</h4>
                        <p>O arquivo exportado está no formato correto para importação direta no sistema de cursos, incluindo:</p>
                        <ul>
                            <li>Metadados de rastreabilidade</li>
                            <li>Repetições por categoria</li>
                            <li>Níveis de dificuldade</li>
                            <li>Equipamentos necessários</li>
                        </ul>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-form btn-primary-form" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-check"></i>
                        Entendi
                    </button>
                    <button class="btn-form btn-secondary-form" onclick="window.location.hash = '#/courses'">
                        <i class="fas fa-external-link-alt"></i>
                        Ir para Cursos
                    </button>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .export-success-modal {
                background: white;
                border-radius: 16px;
                padding: 0;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .modal-header {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                padding: 1.5rem 2rem;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h2 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .modal-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 8px;
                transition: background 0.2s;
            }
            
            .modal-close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .modal-body {
                padding: 2rem;
            }
            
            .success-stats {
                text-align: center;
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
                border-radius: 12px;
                border: 1px solid #d1fae5;
            }
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .stat-number {
                font-size: 2.5rem;
                font-weight: bold;
                color: #059669;
                line-height: 1;
            }
            
            .stat-label {
                color: #374151;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            .instructions-section {
                margin-bottom: 1.5rem;
            }
            
            .instructions-section h3 {
                color: #374151;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .instruction-list {
                list-style: none;
                padding: 0;
                counter-reset: step-counter;
            }
            
            .instruction-list li {
                counter-increment: step-counter;
                margin-bottom: 1rem;
                padding: 1rem;
                background: #f9fafb;
                border-radius: 8px;
                border-left: 4px solid #059669;
                position: relative;
            }
            
            .instruction-list li::before {
                content: counter(step-counter);
                position: absolute;
                left: -12px;
                top: 50%;
                transform: translateY(-50%);
                background: #059669;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            .instruction-list li strong {
                display: block;
                color: #374151;
                margin-bottom: 0.25rem;
            }
            
            .instruction-list li span {
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .format-info {
                background: #eff6ff;
                border: 1px solid #dbeafe;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .format-info h4 {
                color: #1e40af;
                margin: 0 0 0.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .format-info p {
                color: #374151;
                margin: 0 0 0.5rem 0;
            }
            
            .format-info ul {
                margin: 0;
                padding-left: 1.5rem;
                color: #6b7280;
            }
            
            .modal-footer {
                padding: 1.5rem 2rem;
                background: #f9fafb;
                border-radius: 0 0 16px 16px;
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Show toast as well
        if (window.showToast) {
            window.showToast(`${count} ${type} exportadas com sucesso!`, 'success');
        }
    }

    /**
     * Export all activities (not just techniques)
     */
    async exportAllActivities() {
        console.log('📥 Iniciando exportação de todas as atividades...');
        
        try {
            // Buscar todas as atividades
            console.log('📥 Buscando todas as atividades...');
            const response = await this.api.api.get('/api/activities', {
                params: { 
                    page: 1, 
                    pageSize: 1000, // Buscar todas
                }
            });
            
            if (!response.success || !response.data) {
                throw new Error('Erro ao buscar atividades');
            }
            
            console.log('📥 Total de atividades encontradas:', response.data.length);
            
            // Mostrar breakdown por tipo
            const typeBreakdown = response.data.reduce((acc, activity) => {
                acc[activity.type] = (acc[activity.type] || 0) + 1;
                return acc;
            }, {});
            console.log('📥 Breakdown por tipo:', typeBreakdown);
            
            const allActivities = response.data;
            
            if (allActivities.length === 0) {
                if (window.showToast) {
                    window.showToast('Nenhuma atividade encontrada para exportar', 'warning');
                }
                return;
            }
            
            // Criar estrutura JSON para exportação completa
            const exportData = {
                activities: allActivities.map(activity => ({
                    id: activity.id,
                    name: activity.name,
                    title: activity.title,
                    type: activity.type,
                    category: activity.category,
                    description: activity.description,
                    notes: activity.notes,
                    difficulty: activity.difficulty,
                    repetitions: activity.repetitions,
                    duration: activity.duration,
                    precision: activity.precision,
                    tags: activity.tags,
                    equipment: activity.equipment,
                    objectives: activity.objectives,
                    instructions: activity.instructions,
                    materials: activity.materials,
                    safetyTips: activity.safetyTips,
                    variations: activity.variations,
                    createdAt: activity.createdAt,
                    updatedAt: activity.updatedAt
                })),
                metadata: {
                    exportedAt: new Date().toISOString(),
                    version: '2.0',
                    totalActivities: allActivities.length,
                    source: 'Academia Krav Maga - Módulo de Atividades',
                    typeBreakdown: typeBreakdown
                }
            };
            
            // Gerar arquivo para download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `todas-atividades-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('📥 ✅ Exportação de todas as atividades concluída');
            
            // Mostrar toast de sucesso
            if (window.showToast) {
                window.showToast(`${allActivities.length} atividades exportadas com sucesso!`, 'success');
            }
            
        } catch (error) {
            console.error('❌ Erro na exportação de todas as atividades:', error);
            if (window.showToast) {
                window.showToast('Erro ao exportar todas as atividades', 'error');
            }
        }
    }

    /**
     * Selection Management Methods
     */
    
    toggleActivitySelection(activityId, isSelected) {
        if (isSelected) {
            this.selectedActivities.add(activityId);
        } else {
            this.selectedActivities.delete(activityId);
            this.allActivitiesSelected = false;
        }
        this.updateSelectionUI();
    }

    toggleSelectAll(selectAll) {
        const checkboxes = this.container.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            const activityId = checkbox.value;
            if (selectAll) {
                this.selectedActivities.add(activityId);
            } else {
                this.selectedActivities.delete(activityId);
            }
        });
        this.allActivitiesSelected = false;
        this.updateSelectionUI();
    }

    selectCurrentPage() {
        const checkboxes = this.container.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedActivities.add(checkbox.value);
        });
        
        // Update select all checkbox
        const selectAllCheckbox = this.container.querySelector('#select-all-activities');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        
        this.updateSelectionUI();
    }

    async selectAllActivities() {
        try {
            // Get all activity IDs from the server
            const response = await this.api.fetchWithStates('/api/activities/ids', {
                onSuccess: (data) => {
                    if (data && data.length > 0) {
                        // Add all IDs to selection
                        data.forEach(id => this.selectedActivities.add(id));
                        this.allActivitiesSelected = true;
                        
                        // Update current page checkboxes
                        const checkboxes = this.container.querySelectorAll('.activity-checkbox');
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = true;
                        });
                        
                        // Update select all checkbox
                        const selectAllCheckbox = this.container.querySelector('#select-all-activities');
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = true;
                        }
                        
                        this.updateSelectionUI();
                        
                        if (window.showToast) {
                            window.showToast(`${data.length} atividades selecionadas`, 'success');
                        }
                    }
                },
                onError: (error) => {
                    console.error('Erro ao buscar todas as atividades:', error);
                    if (window.showToast) {
                        window.showToast('Erro ao selecionar todas as atividades', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao selecionar todas as atividades:', error);
            if (window.showToast) {
                window.showToast('Erro ao selecionar todas as atividades', 'error');
            }
        }
    }

    deselectAll() {
        this.selectedActivities.clear();
        this.allActivitiesSelected = false;
        
        // Clear all checkboxes
        const checkboxes = this.container.querySelectorAll('.activity-checkbox, #select-all-activities');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        const selectedCount = this.selectedActivities.size;
        const bulkActionsBar = this.container.querySelector('#bulk-actions-bar');
        const selectedCountSpan = this.container.querySelector('#selected-count');
        const totalActivitiesSpan = this.container.querySelector('#total-activities');
        
        if (selectedCount > 0) {
            if (bulkActionsBar) bulkActionsBar.style.display = 'flex';
            if (selectedCountSpan) selectedCountSpan.textContent = selectedCount;
        } else {
            if (bulkActionsBar) bulkActionsBar.style.display = 'none';
        }
        
        if (totalActivitiesSpan) {
            totalActivitiesSpan.textContent = this.totalCount;
        }
    }

    async deleteSelectedActivities() {
        const selectedCount = this.selectedActivities.size;
        
        if (selectedCount === 0) {
            if (window.showToast) {
                window.showToast('Nenhuma atividade selecionada', 'warning');
            }
            return;
        }

        const confirmMessage = `Tem certeza que deseja excluir ${selectedCount} atividade${selectedCount > 1 ? 's' : ''}?\n\nEsta ação não pode ser desfeita.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        const selectedIds = Array.from(this.selectedActivities);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Show loading state
            const deleteBtn = this.container.querySelector('#delete-selected-btn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
            }

            // Delete activities one by one
            for (const activityId of selectedIds) {
                try {
                    if (this.api && this.api.api && this.api.api.delete) {
                        await this.api.api.delete(`/api/activities/${activityId}`);
                    } else {
                        // Fallback para fetch direto
                        const response = await fetch(`/api/activities/${activityId}`, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Erro ao excluir atividade ${activityId}:`, error);
                    errorCount++;
                }
            }

            // Clear selection and reload data
            this.deselectAll();
            await this.loadData();

            // Show results
            if (successCount > 0) {
                if (window.showToast) {
                    window.showToast(`${successCount} atividade${successCount > 1 ? 's' : ''} excluída${successCount > 1 ? 's' : ''} com sucesso!`, 'success');
                }
            }

            if (errorCount > 0) {
                if (window.showToast) {
                    window.showToast(`${errorCount} atividade${errorCount > 1 ? 's' : ''} não puderam ser excluídas`, 'error');
                }
            }

        } catch (error) {
            console.error('Erro durante exclusão em lote:', error);
            if (window.showToast) {
                window.showToast('Erro durante exclusão das atividades', 'error');
            }
        } finally {
            // Restore delete button
            const deleteBtn = this.container.querySelector('#delete-selected-btn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Excluir selecionadas';
            }
        }
    }

    // ==============================================
    // TÉCNICAS IMPORT FUNCTIONALITY
    // ==============================================

    /**
     * Show techniques import dialog
     */
    showImportDialog() {
        const modal = this.container.querySelector('#import-techniques-modal');
        if (!modal) {
            console.error('Modal de importação não encontrado');
            return;
        }

        // Reset modal state
        this.resetImportModal();

        // Setup file input events
        this.setupFileInput();

        // Show modal
        modal.style.display = 'flex';
    }

    /**
     * Reset import modal to initial state
     */
    resetImportModal() {
        const modal = this.container.querySelector('#import-techniques-modal');
        if (!modal) return;

        // Reset file input
        const fileInput = modal.querySelector('#techniques-file-input');
        if (fileInput) fileInput.value = '';

        // Hide preview and results sections
        const preview = modal.querySelector('#import-preview');
        const progress = modal.querySelector('#import-progress');
        const results = modal.querySelector('#import-results');
        
        if (preview) preview.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (results) results.style.display = 'none';

        // Disable import button
        const startBtn = modal.querySelector('#start-import-btn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-upload"></i> Iniciar Importação';
        }
    }

    /**
     * Setup file input and drag/drop events
     */
    setupFileInput() {
        const modal = this.container.querySelector('#import-techniques-modal');
        if (!modal) return;

        const fileInput = modal.querySelector('#techniques-file-input');
        const dropZone = modal.querySelector('#file-drop-zone');
        const startBtn = modal.querySelector('#start-import-btn');

        if (!fileInput || !dropZone || !startBtn) return;

        // File input change event
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Drop zone click event
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    fileInput.files = files;
                    this.handleFileSelection(file);
                } else {
                    if (window.showToast) {
                        window.showToast('Apenas arquivos JSON são aceitos', 'error');
                    }
                }
            }
        });

        // Start import button event
        startBtn.addEventListener('click', () => {
            this.startTechniquesImport();
        });
    }

    /**
     * Handle file selection and preview
     */
    async handleFileSelection(file) {
        try {
            // Validate file type
            if (!file.name.endsWith('.json') && file.type !== 'application/json') {
                throw new Error('Apenas arquivos JSON são aceitos');
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Arquivo muito grande. Máximo 10MB permitido');
            }

            // Read file content
            const content = await this.readFileAsText(file);
            
            // Parse JSON
            let techniques;
            try {
                techniques = JSON.parse(content);
            } catch (parseError) {
                throw new Error('Arquivo JSON inválido: ' + parseError.message);
            }

            // Validate techniques format
            const validation = this.validateTechniquesFormat(techniques);
            if (!validation.isValid) {
                throw new Error('Formato inválido: ' + validation.errors.join(', '));
            }

            // Show preview
            this.showImportPreview(techniques);

            // Enable import button
            const startBtn = this.container.querySelector('#start-import-btn');
            if (startBtn) {
                startBtn.disabled = false;
                this.selectedTechniques = techniques;
            }

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            if (window.showToast) {
                window.showToast(error.message, 'error');
            }
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    /**
     * Validate techniques JSON format
     */
    validateTechniquesFormat(techniques) {
        const errors = [];

        // Check if array
        if (!Array.isArray(techniques)) {
            errors.push('Deve ser um array de técnicas');
            return { isValid: false, errors };
        }

        // Check if not empty
        if (techniques.length === 0) {
            errors.push('Array não pode estar vazio');
            return { isValid: false, errors };
        }

        // Validate each technique
        techniques.forEach((technique, index) => {
            const prefix = `Técnica ${index + 1}:`;

            // Required fields
            if (!technique.name || typeof technique.name !== 'string') {
                errors.push(`${prefix} 'name' é obrigatório e deve ser string`);
            }
            if (!technique.description || typeof technique.description !== 'string') {
                errors.push(`${prefix} 'description' é obrigatório e deve ser string`);
            }
            if (!technique.type || typeof technique.type !== 'string') {
                errors.push(`${prefix} 'type' é obrigatório e deve ser string`);
            }

            // Validate type enum
            const validTypes = ['TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE'];
            if (technique.type && !validTypes.includes(technique.type)) {
                errors.push(`${prefix} 'type' deve ser um de: ${validTypes.join(', ')}`);
            }

            // Validate difficulty if present
            if (technique.difficulty !== undefined) {
                if (!Number.isInteger(technique.difficulty) || technique.difficulty < 1 || technique.difficulty > 5) {
                    errors.push(`${prefix} 'difficulty' deve ser um número inteiro entre 1 e 5`);
                }
            }

            // Validate arrays if present
            const arrayFields = ['equipment', 'instructions', 'tips', 'safety'];
            arrayFields.forEach(field => {
                if (technique[field] !== undefined && !Array.isArray(technique[field])) {
                    errors.push(`${prefix} '${field}' deve ser um array`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Show import preview
     */
    showImportPreview(techniques) {
        const preview = this.container.querySelector('#import-preview');
        const content = this.container.querySelector('#preview-content');
        
        if (!preview || !content) return;

        // Statistics
        const stats = this.calculateImportStats(techniques);
        
        content.innerHTML = `
            <div class="preview-stats">
                <div class="stat-item">
                    <span class="stat-value">${techniques.length}</span>
                    <span class="stat-label">Total de Técnicas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.types.length}</span>
                    <span class="stat-label">Tipos Diferentes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.categories.length}</span>
                    <span class="stat-label">Categorias</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.avgDifficulty.toFixed(1)}</span>
                    <span class="stat-label">Dificuldade Média</span>
                </div>
            </div>
            
            <div class="preview-types">
                <h5>📊 Distribuição por Tipo:</h5>
                ${Object.entries(stats.typeCount).map(([type, count]) => `
                    <div class="type-item">
                        <span class="type-name">${type}</span>
                        <span class="type-count">${count} técnica${count > 1 ? 's' : ''}</span>
                    </div>
                `).join('')}
            </div>

            <div class="preview-samples">
                <h5>🔍 Primeiras 3 Técnicas:</h5>
                ${techniques.slice(0, 3).map((technique, index) => `
                    <div class="sample-technique">
                        <strong>${index + 1}. ${technique.name}</strong>
                        <div class="sample-details">
                            <span class="badge">${technique.type}</span>
                            ${technique.difficulty ? `<span class="difficulty">${'⭐'.repeat(technique.difficulty)}</span>` : ''}
                        </div>
                        <p class="sample-description">${technique.description.substring(0, 100)}...</p>
                    </div>
                `).join('')}
            </div>
        `;

        preview.style.display = 'block';
    }

    /**
     * Calculate import statistics
     */
    calculateImportStats(techniques) {
        const types = [...new Set(techniques.map(t => t.type))];
        const categories = [...new Set(techniques.map(t => t.category).filter(Boolean))];
        const typeCount = {};
        let totalDifficulty = 0;
        let difficultyCount = 0;

        techniques.forEach(technique => {
            // Count by type
            typeCount[technique.type] = (typeCount[technique.type] || 0) + 1;
            
            // Average difficulty
            if (technique.difficulty) {
                totalDifficulty += technique.difficulty;
                difficultyCount++;
            }
        });

        return {
            types,
            categories,
            typeCount,
            avgDifficulty: difficultyCount > 0 ? totalDifficulty / difficultyCount : 0
        };
    }

    /**
     * Start techniques import process
     */
    async startTechniquesImport() {
        if (!this.selectedTechniques || !Array.isArray(this.selectedTechniques)) {
            if (window.showToast) {
                window.showToast('Nenhuma técnica selecionada para importação', 'error');
            }
            return;
        }

        const modal = this.container.querySelector('#import-techniques-modal');
        const progress = modal.querySelector('#import-progress');
        const results = modal.querySelector('#import-results');
        const startBtn = modal.querySelector('#start-import-btn');

        // Hide preview and show progress
        const preview = modal.querySelector('#import-preview');
        if (preview) preview.style.display = 'none';
        if (progress) progress.style.display = 'block';
        if (results) results.style.display = 'none';

        // Disable button
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
        }

        try {
            await this.importTechniquesWithProgress(this.selectedTechniques);
        } catch (error) {
            console.error('Erro durante importação:', error);
            if (window.showToast) {
                window.showToast('Erro durante importação: ' + error.message, 'error');
            }
        } finally {
            // Re-enable button
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-upload"></i> Iniciar Importação';
            }
        }
    }

    /**
     * Import techniques with progress tracking
     */
    async importTechniquesWithProgress(techniques) {
        const modal = this.container.querySelector('#import-techniques-modal');
        const progressFill = modal.querySelector('#progress-fill');
        const progressText = modal.querySelector('#progress-text');
        const resultsSection = modal.querySelector('#import-results');
        const resultsContent = modal.querySelector('#results-content');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Update progress
        const updateProgress = (current, total, status) => {
            const percentage = (current / total) * 100;
            if (progressFill) progressFill.style.width = percentage + '%';
            if (progressText) progressText.textContent = status;
        };

        updateProgress(0, techniques.length, 'Iniciando importação...');

        // Import in batches of 5 to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < techniques.length; i += batchSize) {
            const batch = techniques.slice(i, i + batchSize);
            
            updateProgress(i, techniques.length, `Processando lote ${Math.floor(i / batchSize) + 1}...`);

            // Process batch
            const batchPromises = batch.map(async (technique, batchIndex) => {
                try {
                    const globalIndex = i + batchIndex;
                    updateProgress(globalIndex, techniques.length, `Importando: ${technique.name}`);

                    // Prepare technique data for API (following the correct schema)
                    const techniqueData = {
                        title: technique.name,                    // API expects 'title' not 'name'
                        description: technique.description,      // API expects description as string
                        type: technique.type,                    // Required field
                        equipment: technique.equipment || [],    // Array of strings
                        safety: technique.safety ? technique.safety.join('\n') : null, // API expects string
                        difficulty: technique.difficulty || null, // Optional number 1-5
                        adaptations: []                          // Default empty array
                    };

                    // Call API to create technique
                    const response = await this.api.api.post('/api/activities', techniqueData);

                    if (response.success) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`${technique.name}: ${response.message || 'Erro desconhecido'}`);
                    }

                } catch (error) {
                    console.error(`Erro ao importar técnica ${technique.name}:`, error);
                    errorCount++;
                    errors.push(`${technique.name}: ${error.message}`);
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Show results
        updateProgress(techniques.length, techniques.length, 'Importação concluída!');

        // Display results
        if (resultsSection && resultsContent) {
            resultsContent.innerHTML = `
                <div class="import-summary">
                    <div class="summary-stats">
                        <div class="stat-success">
                            <i class="fas fa-check-circle"></i>
                            <span>${successCount} técnicas importadas com sucesso</span>
                        </div>
                        ${errorCount > 0 ? `
                            <div class="stat-error">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>${errorCount} técnicas com erro</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${errors.length > 0 ? `
                        <div class="error-details">
                            <h5>❌ Erros encontrados:</h5>
                            <ul class="error-list">
                                ${errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                                ${errors.length > 10 ? `<li>... e mais ${errors.length - 10} erros</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
            resultsSection.style.display = 'block';
        }

        // Show success toast
        if (window.showToast) {
            if (errorCount === 0) {
                window.showToast(`🎉 ${successCount} técnicas importadas com sucesso!`, 'success');
            } else {
                window.showToast(`⚠️ ${successCount} técnicas importadas, ${errorCount} com erro`, 'warning');
            }
        }

        // Reload activities list
        setTimeout(() => {
            this.loadData();
        }, 2000);
    }
}

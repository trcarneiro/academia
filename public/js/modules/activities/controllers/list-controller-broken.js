/**
 * Activities List Controller - Guidelines.MD Compliant
 * 
 * Manages the activities list view with search, filtering, pagination
 * and CRUD operations following SPA patterns.
 */

export class ActivitiesListController {
    constructor(api) {
        this.api = api;
        this.currentPage = 1;
        this.pageSize = 20;
        this.filterType = '';
        this.searchQuery = '';
        this.activities = [];
        this.totalCount = 0;
        this.container = null;
        this.isLoading = false;
        
        // Bind methods to preserve context
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
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
                        <div class="filter-actions">
                            <button id="clear-filters-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-times"></i>
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Table Premium -->
                <div class="data-card-premium">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
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
            </div>
        `;
    }
                    <div class="stat-card">
                        <div class="stat-value" id="activity-types">-</div>
                        <div class="stat-label">Tipos</div>
                    </div>
                </div>

                <!-- Filters Section -->
                <div class="module-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label for="search-activities" class="filter-label">Buscar:</label>
                            <input type="text" id="search-activities" placeholder="Digite título ou descrição..." 
                                   class="filter-input" autocomplete="off">
                        </div>
                        
                        <div class="filter-group">
                            <label for="filter-type" class="filter-label">Tipo:</label>
                            <select id="filter-type" class="filter-select">
                                <option value="">Todos os tipos</option>
                                <option value="TECHNIQUE">Técnica</option>
                                <option value="STRETCH">Alongamento</option>
                                <option value="DRILL">Drill</option>
                                <option value="EXERCISE">Exercício</option>
                                <option value="GAME">Jogo</option>
                                <option value="CHALLENGE">Desafio</option>
                                <option value="ASSESSMENT">Avaliação</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label for="filter-difficulty" class="filter-label">Dificuldade:</label>
                            <select id="filter-difficulty" class="filter-select">
                                <option value="">Todas</option>
                                <option value="1">⭐ Muito Fácil</option>
                                <option value="2">⭐⭐ Fácil</option>
                                <option value="3">⭐⭐⭐ Médio</option>
                                <option value="4">⭐⭐⭐⭐ Difícil</option>
                                <option value="5">⭐⭐⭐⭐⭐ Muito Difícil</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <button id="clear-filters-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-times"></i>
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Table Section -->
                <div class="module-content">
                    <div id="loading-state" class="loading-state" style="display: none;">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando atividades...</div>
                    </div>
                    
                    <div class="module-isolated-table">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Atividade</th>
                                    <th>Tipo</th>
                                    <th>Dificuldade</th>
                                    <th>Duração</th>
                                    <th>Equipamentos</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="activities-table-body">
                                <!-- Content will be loaded here -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="module-pagination">
                        <div class="pagination-info">
                            <span id="pagination-info">-</span>
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
                window.openActivityEditor(null, this.container);
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
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadData();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalCount / this.pageSize);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.loadData();
                }
            });
        }
    }

    /**
     * Load activities data from API
     */
    async loadData() {
        console.log('🏋️ loadData() iniciado');
        console.log('🏋️ isLoading atual:', this.isLoading);
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.setLoading(true);
        
        try {
            // Build query parameters
            const params = {
                page: this.currentPage,
                limit: this.pageSize
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
                    // Fix: A API retorna o array diretamente, não dentro de data.data
                    this.activities = Array.isArray(data) ? data : (data.data || []);
                    this.totalCount = data.pagination?.total || data.count || (Array.isArray(data) ? data.length : 0);
                    console.log('🏋️ Atividades processadas:', this.activities.length);
                    this.updateTable();
                    this.updateStats();
                    this.updatePagination();
                },
                onEmpty: () => {
                    console.log('🏋️ API retornou vazio');
                    this.activities = [];
                    this.totalCount = 0;
                    this.showEmptyState();
                    this.updateStats();
                    this.updatePagination();
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
     * Update activities table
     */
    updateTable() {
        console.log('🏋️ updateTable() chamado com', this.activities.length, 'atividades');
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
                                onclick="window.openActivityEditor('${activity.id}', document.querySelector('[data-module=activities]').parentElement)" 
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
                        <button class="btn-form btn-primary-form" onclick="window.openActivityEditor(null, document.querySelector('[data-module=activities]').parentElement)">
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
     * Update pagination controls
     */
    updatePagination() {
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        
        // Update pagination info
        const paginationInfo = this.container.querySelector('#pagination-info');
        if (paginationInfo) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(start + this.activities.length - 1, this.totalCount);
            paginationInfo.textContent = this.totalCount > 0 
                ? `Mostrando ${start}-${end} de ${this.totalCount} atividades`
                : 'Nenhuma atividade encontrada';
        }

        // Update page numbers
        const currentPageElement = this.container.querySelector('#current-page');
        const totalPagesElement = this.container.querySelector('#total-pages');
        
        if (currentPageElement) currentPageElement.textContent = this.currentPage;
        if (totalPagesElement) totalPagesElement.textContent = Math.max(1, totalPages);

        // Update button states
        const prevBtn = this.container.querySelector('#prev-page-btn');
        const nextBtn = this.container.querySelector('#next-page-btn');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages || totalPages === 0;
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
        
        // Reload data
        this.loadData();
    }

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        const loadingElement = this.container.querySelector('#loading-state');
        const tableElement = this.container.querySelector('.module-isolated-table');
        
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (tableElement) {
            tableElement.style.opacity = isLoading ? '0.6' : '1';
        }
    }

    /**
     * Delete activity
     */
    async deleteActivity(activityId) {
        if (!confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await this.api.saveWithFeedback(`/api/activities/${activityId}`, null, {
                method: 'DELETE',
                onSuccess: () => {
                    if (window.showBanner) {
                        window.showBanner('Atividade excluída com sucesso', 'success');
                    }
                    this.loadData();
                },
                onError: (error) => {
                    if (window.showBanner) {
                        window.showBanner('Erro ao excluir atividade', 'error');
                    }
                    console.error('Erro ao excluir atividade:', error);
                }
            });
        } catch (error) {
            console.error('Erro ao excluir atividade:', error);
            if (window.showBanner) {
                window.showBanner('Erro ao excluir atividade', 'error');
            }
        }
    }

    /**
     * Get activity type label
     */
    getTypeLabel(type) {
        const typeLabels = {
            'TECHNIQUE': 'Técnica',
            'STRETCH': 'Alongamento', 
            'DRILL': 'Drill',
            'EXERCISE': 'Exercício',
            'GAME': 'Jogo',
            'CHALLENGE': 'Desafio',
            'ASSESSMENT': 'Avaliação'
        };
        return typeLabels[type] || type || 'Não definido';
    }

    /**
     * Render difficulty stars
     */
    renderDifficulty(difficulty) {
        const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
        return `<span class="difficulty-stars" title="Dificuldade ${difficulty}/5">${stars}</span>`;
    }

    /**
     * Render equipment list
     */
    renderEquipment(equipment) {
        if (!equipment || equipment.length === 0) {
            return '<span class="no-equipment">Nenhum</span>';
        }
        
        const items = Array.isArray(equipment) ? equipment : equipment.split(',');
        return items.slice(0, 2).map(item => 
            `<span class="equipment-tag">${item.trim()}</span>`
        ).join('') + (items.length > 2 ? `<span class="equipment-more">+${items.length - 2}</span>` : '');
    }

    /**
     * Handle search input
     */
    handleSearch(event) {
        this.searchQuery = event.target.value.trim();
        this.currentPage = 1;
        this.loadData();
    }

    /**
     * Handle filter changes
     */
    handleFilter(event) {
        const filterType = event.target.id;
        
        if (filterType === 'filter-type') {
            this.filterType = event.target.value;
        } else if (filterType === 'filter-difficulty') {
            this.filterDifficulty = event.target.value;
        }
        
        this.currentPage = 1;
        this.loadData();
    }

    /**
     * Handle page changes
     */
    handlePageChange(direction) {
        const totalPages = Math.ceil(this.totalCount / this.pageSize);
        
        if (direction === 'prev' && this.currentPage > 1) {
            this.currentPage--;
            this.loadData();
        } else if (direction === 'next' && this.currentPage < totalPages) {
            this.currentPage++;
            this.loadData();
        }
    }

    /**
     * Destroy controller and cleanup
     */
    destroy() {
        // Clean up global references
        if (window.activitiesListController === this) {
            delete window.activitiesListController;
        }
        
        console.log('✅ Activities list controller destruído');
    }
}

// Export to global scope for HTML onclick events
window.activitiesListController = null;

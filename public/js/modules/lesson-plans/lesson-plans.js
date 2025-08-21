/**
 * Lesson Plans Module - Guidelines.MD Compliant
 * 
 * Main entry point for the lesson plans module with proper MVC architecture,
 * API client integration, and SPA compatibility.
 */

(function() {
    'use strict';
    
    console.log('📚 Lesson Plans Module - Starting...');
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines.MD)
    // ==============================================
    
    let lessonPlansAPI = null;
    
    // Wait for API client to be available
    async function waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
                return;
            }
            
            const checkAPI = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(checkAPI);
                    resolve();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkAPI);
                resolve();
            }, 5000);
        });
    }
    
    // Initialize API client
    async function initializeAPI() {
        await waitForAPIClient();
        lessonPlansAPI = window.createModuleAPI ? window.createModuleAPI('LessonPlans') : null;
        console.log('🌐 Lesson Plans API helper initialized');
    }
    
    // ==============================================
    // MODULE CONTROLLERS
    // ==============================================
    
    let listController = null;
    let editorController = null;
    
    // Initialize controllers
    async function initializeControllers() {
        // Initialize API first
        if (!lessonPlansAPI) {
            await initializeAPI();
        }
        
        // Create controller instances
        if (window.LessonPlansListController) {
            listController = new window.LessonPlansListController(lessonPlansAPI);
        }
        
        if (window.LessonPlanEditorController) {
            editorController = new window.LessonPlanEditorController(lessonPlansAPI);
        }
        
        console.log('✅ Lesson Plans controllers initialized');
    }
    
    // ==============================================
    // PUBLIC INTERFACE
    // ==============================================
    
    /**
     * Open lesson plans list
     */
    async function openLessonPlansList(targetContainer) {
        console.log('📚 Opening lesson plans list...');
        
        try {
            // Ensure controllers are initialized
            if (!listController) {
                await initializeControllers();
            }
            
            // Destroy existing editor if active
            if (editorController) {
                editorController.destroy();
            }
            
            // Render list controller
            if (listController) {
                await listController.render(targetContainer);
                
                // Make controller globally available for actions
                window.lessonPlansListController = listController;
            } else {
                console.error('❌ List controller not available');
                targetContainer.innerHTML = `
                    <div class="error-state">
                        <h3>Erro</h3>
                        <p>Não foi possível inicializar o módulo de planos de aula.</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('❌ Error opening lesson plans list:', error);
            targetContainer.innerHTML = `
                <div class="error-state">
                    <h3>Erro</h3>
                    <p>Erro ao carregar lista de planos de aula: ${error.message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Open lesson plan editor
     */
    async function openLessonPlanEditor(planId, targetContainer, readOnly = false) {
        console.log('✏️ Opening lesson plan editor...', { planId, readOnly });
        
        try {
            // Ensure controllers are initialized
            if (!editorController) {
                await initializeControllers();
            }
            
            // Destroy existing list controller if active
            if (listController) {
                listController.destroy();
            }
            
            // Render editor controller
            if (editorController) {
                await editorController.render(targetContainer, planId, readOnly);
                
                // Make controller globally available for actions
                window.lessonPlanEditorController = editorController;
            } else {
                console.error('❌ Editor controller not available');
                targetContainer.innerHTML = `
                    <div class="error-state">
                        <h3>Erro</h3>
                        <p>Não foi possível inicializar o editor de planos de aula.</p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('❌ Error opening lesson plan editor:', error);
            targetContainer.innerHTML = `
                <div class="error-state">
                    <h3>Erro</h3>
                    <p>Erro ao carregar editor de planos de aula: ${error.message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Initialize lesson plans module
     */
    async function initLessonPlans() {
        console.log('🔧 Initializing Lesson Plans Module...');
        
        try {
            // Check if we're on the lesson plans page
            const lessonPlansContainer = document.getElementById('lessonPlansContainer') ||
                                        document.querySelector('.lesson-plans-container') ||
                                        document.querySelector('.lesson-plans-isolated') ||
                                        document.querySelector('[data-module="lesson-plans"]');
            
            if (!lessonPlansContainer) {
                console.log('ℹ️ Not on lesson plans page, skipping initialization');
                return;
            }
            
            // Mark container as lesson plans module
            lessonPlansContainer.setAttribute('data-module', 'lesson-plans');
            lessonPlansContainer.setAttribute('data-active', 'true');
            lessonPlansContainer.classList.add('module-active');
            
            // Initialize controllers
            await initializeControllers();
            
            // Open list by default
            await openLessonPlansList(lessonPlansContainer);
            
            console.log('✅ Lesson Plans Module initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing lesson plans module:', error);
        }
    }
    
    // ==============================================
    // SPA ROUTER INTEGRATION
    // ==============================================
    
    // Export for SPA router
    window.initLessonPlans = initLessonPlans;
    window.openLessonPlansList = openLessonPlansList;
    window.openLessonPlanEditor = openLessonPlanEditor;
    
    // Legacy compatibility
    window.initializeLessonPlansModule = initLessonPlans;
    
    // ==============================================
    // LESSON PLANS LIST CONTROLLER
    // ==============================================
    
    class LessonPlansListController {
        constructor(api) {
            this.api = api;
            this.currentPage = 1;
            this.pageSize = 20;
            this.filterCourse = '';
            this.filterLevel = '';
            this.searchQuery = '';
            this.lessonPlans = [];
            this.courses = [];
            this.totalCount = 0;
            this.container = null;
            this.isLoading = false;
            
            // Bind methods to preserve context
            this.handleSearch = this.handleSearch.bind(this);
            this.handleFilter = this.handleFilter.bind(this);
            this.handlePageChange = this.handlePageChange.bind(this);
        }

        /**
         * Render the lesson plans list in the target container
         */
        async render(targetContainer) {
            this.container = targetContainer;
            
            // Mark container for Design System validator
            targetContainer.setAttribute('data-module', 'lesson-plans');
            targetContainer.setAttribute('data-active', 'true');
            targetContainer.classList.add('module-active');
            
            // Render initial HTML structure
            this.renderHTML();
            
            // Setup event listeners
            this.bindEvents(targetContainer);
            
            // Load initial data
            await this.loadData();
            
            console.log('✅ Lesson Plans list controller renderizado');
        }

        /**
         * Render HTML structure
         */
        renderHTML() {
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <!-- Header Section -->
                    <div class="module-header">
                        <div class="header-content">
                            <div class="header-left">
                                <h1 class="module-title">
                                    <span class="title-icon">📚</span>
                                    Planos de Aula
                                </h1>
                                <p class="module-subtitle">Gerencie planos de aula e cronogramas</p>
                            </div>
                            <div class="header-actions">
                                <button id="create-lesson-plan-btn" class="btn-form btn-primary-form">
                                    <i class="fas fa-plus"></i>
                                    Novo Plano
                                </button>
                                <button id="refresh-lesson-plans-btn" class="btn-form btn-secondary-form">
                                    <i class="fas fa-sync-alt"></i>
                                    Atualizar
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Section -->
                    <div class="module-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="total-lesson-plans">-</div>
                            <div class="stat-label">Total de Planos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="filtered-lesson-plans">-</div>
                            <div class="stat-label">Filtrados</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="courses-count">-</div>
                            <div class="stat-label">Cursos</div>
                        </div>
                    </div>

                    <!-- Filters Section -->
                    <div class="module-filters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="search-lesson-plans" class="filter-label">Buscar:</label>
                                <input type="text" id="search-lesson-plans" placeholder="Digite título ou descrição..." 
                                       class="filter-input" autocomplete="off">
                            </div>
                            
                            <div class="filter-group">
                                <label for="filter-course" class="filter-label">Curso:</label>
                                <select id="filter-course" class="filter-select">
                                    <option value="">Todos os cursos</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label for="filter-level" class="filter-label">Nível:</label>
                                <select id="filter-level" class="filter-select">
                                    <option value="">Todos os níveis</option>
                                    <option value="1">Nível 1</option>
                                    <option value="2">Nível 2</option>
                                    <option value="3">Nível 3</option>
                                    <option value="4">Nível 4</option>
                                    <option value="5">Nível 5</option>
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
                            <div class="loading-text">Carregando planos de aula...</div>
                        </div>
                        
                        <div class="module-isolated-table">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Plano de Aula</th>
                                        <th>Aula</th>
                                        <th>Semana</th>
                                        <th>Dificuldade</th>
                                        <th>Duração</th>
                                        <th>Nível</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="lesson-plans-table-body">
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
            const searchInput = container.querySelector('#search-lesson-plans');
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

            // Course filter
            const courseFilter = container.querySelector('#filter-course');
            if (courseFilter) {
                courseFilter.addEventListener('change', (e) => {
                    this.filterCourse = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                });
            }

            // Level filter
            const levelFilter = container.querySelector('#filter-level');
            if (levelFilter) {
                levelFilter.addEventListener('change', (e) => {
                    this.filterLevel = e.target.value;
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

            // Create lesson plan button
            const createBtn = container.querySelector('#create-lesson-plan-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    window.openLessonPlanEditor(null, this.container);
                });
            }

            // Refresh button
            const refreshBtn = container.querySelector('#refresh-lesson-plans-btn');
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
         * Load lesson plans data from API
         */
        async loadData() {
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
                if (this.filterCourse) params.courseId = this.filterCourse;
                if (this.filterLevel) params.level = this.filterLevel;
                
                // Use API client with states
                const result = await this.api.fetchWithStates('/api/lesson-plans', {
                    method: 'GET',
                    params,
                    onSuccess: (data) => {
                        this.lessonPlans = data.data || [];
                        this.totalCount = data.pagination?.total || data.count || 0;
                        this.updateTable();
                        this.updateStats();
                        this.updatePagination();
                    },
                    onEmpty: () => {
                        this.lessonPlans = [];
                        this.totalCount = 0;
                        this.showEmptyState();
                        this.updateStats();
                        this.updatePagination();
                    },
                    onError: (error) => {
                        console.error('Erro ao carregar planos de aula:', error);
                        this.showErrorState('Erro ao carregar planos de aula');
                    }
                });

                // Load courses for filters
                await this.loadCourses();

            } catch (error) {
                console.error('Erro ao carregar planos de aula:', error);
                this.showErrorState('Erro ao carregar planos de aula');
            } finally {
                this.isLoading = false;
                this.setLoading(false);
            }
        }

        /**
         * Load courses for filter dropdown
         */
        async loadCourses() {
            try {
                const result = await this.api.fetchWithStates('/api/courses', {
                    method: 'GET',
                    onSuccess: (data) => {
                        this.courses = data.data || [];
                        this.populateCourseFilter();
                    },
                    onError: (error) => {
                        console.warn('Erro ao carregar cursos:', error);
                    }
                });
            } catch (error) {
                console.warn('Erro ao carregar cursos:', error);
            }
        }

        /**
         * Populate course filter dropdown
         */
        populateCourseFilter() {
            const courseFilter = this.container.querySelector('#filter-course');
            if (!courseFilter || !this.courses.length) return;

            // Clear existing options except 'all'
            const defaultOption = courseFilter.querySelector('option[value=""]');
            courseFilter.innerHTML = '';
            courseFilter.appendChild(defaultOption);

            this.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseFilter.appendChild(option);
            });
        }

        /**
         * Update lesson plans table
         */
        updateTable() {
            const tbody = this.container.querySelector('#lesson-plans-table-body');
            if (!tbody) return;
            
            if (this.lessonPlans.length === 0) {
                this.showEmptyState();
                return;
            }

            tbody.innerHTML = this.lessonPlans.map(plan => `
                <tr class="table-row" data-plan-id="${plan.id}">
                    <td>
                        <div class="lesson-plan-info">
                            <strong class="lesson-title">${plan.title || 'Sem título'}</strong>
                            <div class="lesson-course">${plan.course?.name || 'Curso não definido'}</div>
                            ${plan.description ? `<div class="lesson-description">${plan.description}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="lesson-number">${plan.lessonNumber || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="week-number">${plan.weekNumber || 'N/A'}</span>
                    </td>
                    <td>
                        <div class="difficulty-display">
                            ${this.renderDifficulty(plan.difficulty || 1)}
                        </div>
                    </td>
                    <td>
                        <span class="duration-display">${plan.duration || 60} min</span>
                    </td>
                    <td>
                        <span class="status-badge status-level-${plan.level || 1}">
                            Nível ${plan.level || 1}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-form btn-small btn-primary-form" 
                                    onclick="window.openLessonPlanEditor('${plan.id}', document.querySelector('[data-module=lesson-plans]').parentElement)" 
                                    title="Editar plano">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-form btn-small btn-info-form" 
                                    onclick="window.lessonPlansListController?.viewLessonPlan('${plan.id}')" 
                                    title="Visualizar plano">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-form btn-small btn-danger-form" 
                                    onclick="window.lessonPlansListController?.deleteLessonPlan('${plan.id}')" 
                                    title="Excluir plano">
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
            const tbody = this.container.querySelector('#lesson-plans-table-body');
            if (!tbody) return;
            
            const message = this.searchQuery || this.filterCourse || this.filterLevel 
                ? 'Nenhum plano de aula encontrado com os filtros aplicados'
                : 'Nenhum plano de aula cadastrado';
                
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">${message}</div>
                        <div class="empty-subtitle">
                            ${this.searchQuery || this.filterCourse || this.filterLevel 
                                ? 'Tente ajustar os filtros de busca'
                                : 'Comece criando seu primeiro plano de aula'}
                        </div>
                        ${!this.searchQuery && !this.filterCourse && !this.filterLevel ? `
                            <button class="btn-form btn-primary-form" onclick="window.openLessonPlanEditor(null, document.querySelector('[data-module=lesson-plans]').parentElement)">
                                <i class="fas fa-plus"></i>
                                Criar primeiro plano
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
            const tbody = this.container.querySelector('#lesson-plans-table-body');
            if (!tbody) return;
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-state">
                        <div class="error-icon">⚠️</div>
                        <div class="error-title">Erro ao carregar dados</div>
                        <div class="error-message">${message}</div>
                        <button class="btn-form btn-primary-form" onclick="window.lessonPlansListController?.loadData()">
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
            const totalElement = this.container.querySelector('#total-lesson-plans');
            const filteredElement = this.container.querySelector('#filtered-lesson-plans');
            const coursesElement = this.container.querySelector('#courses-count');
            
            if (totalElement) totalElement.textContent = this.totalCount;
            if (filteredElement) filteredElement.textContent = this.lessonPlans.length;
            if (coursesElement) coursesElement.textContent = this.courses.length;
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
                const end = Math.min(start + this.lessonPlans.length - 1, this.totalCount);
                paginationInfo.textContent = this.totalCount > 0 
                    ? `Mostrando ${start}-${end} de ${this.totalCount} planos`
                    : 'Nenhum plano encontrado';
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
            this.filterCourse = '';
            this.filterLevel = '';
            this.currentPage = 1;
            
            // Reset form elements
            const searchInput = this.container.querySelector('#search-lesson-plans');
            const courseFilter = this.container.querySelector('#filter-course');
            const levelFilter = this.container.querySelector('#filter-level');
            
            if (searchInput) searchInput.value = '';
            if (courseFilter) courseFilter.value = '';
            if (levelFilter) levelFilter.value = '';
            
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
         * View lesson plan details
         */
        viewLessonPlan(planId) {
            console.log('👁️ Visualizando plano de aula:', planId);
            // Implementation for view lesson plan
            window.openLessonPlanEditor(planId, this.container, true); // read-only mode
        }

        /**
         * Delete lesson plan
         */
        async deleteLessonPlan(planId) {
            if (!confirm('Tem certeza que deseja excluir este plano de aula? Esta ação não pode ser desfeita.')) {
                return;
            }

            try {
                await this.api.saveWithFeedback(`/api/lesson-plans/${planId}`, null, {
                    method: 'DELETE',
                    onSuccess: () => {
                        if (window.showBanner) {
                            window.showBanner('Plano de aula excluído com sucesso', 'success');
                        }
                        this.loadData();
                    },
                    onError: (error) => {
                        if (window.showBanner) {
                            window.showBanner('Erro ao excluir plano de aula', 'error');
                        }
                        console.error('Erro ao excluir plano de aula:', error);
                    }
                });
            } catch (error) {
                console.error('Erro ao excluir plano de aula:', error);
                if (window.showBanner) {
                    window.showBanner('Erro ao excluir plano de aula', 'error');
                }
            }
        }

        /**
         * Render difficulty stars
         */
        renderDifficulty(difficulty) {
            const stars = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
            return `<span class="difficulty-stars" title="Dificuldade ${difficulty}/5">${stars}</span>`;
        }

        // Other helper methods (handleSearch, handleFilter, handlePageChange)
        
        /**
         * Destroy controller and cleanup
         */
        destroy() {
            // Clean up global references
            if (window.lessonPlansListController === this) {
                delete window.lessonPlansListController;
            }
            
            console.log('✅ Lesson Plans list controller destruído');
        }
    }
    
    // ==============================================
    // LESSON PLAN EDITOR CONTROLLER
    // ==============================================
    
    class LessonPlanEditorController {
        constructor(api) {
            this.api = api;
            this.container = null;
            this.planId = null;
            this.plan = null;
            this.courses = [];
            this.activities = [];
            this.isLoading = false;
            this.isDirty = false;
            this.isReadOnly = false;
            this.autoSaveTimeout = null;
            
            // Bind methods to preserve context
            this.handleInputChange = this.handleInputChange.bind(this);
            this.handleSave = this.handleSave.bind(this);
            this.handleCancel = this.handleCancel.bind(this);
        }

        /**
         * Render the lesson plan editor in the target container
         */
        async render(targetContainer, planId = null, readOnly = false) {
            this.container = targetContainer;
            this.planId = planId;
            this.isReadOnly = readOnly;
            
            // Mark container for Design System validator
            targetContainer.setAttribute('data-module', 'lesson-plans');
            targetContainer.setAttribute('data-active', 'true');
            targetContainer.classList.add('module-active');
            
            // Show simple editor for now
            this.renderSimpleEditor();
            
            console.log('✅ Lesson Plan editor controller renderizado');
        }
        
        /**
         * Render simple editor (placeholder)
         */
        renderSimpleEditor() {
            const isEditing = !!this.planId;
            const title = this.isReadOnly ? 'Visualizar Plano de Aula' : 
                         isEditing ? 'Editar Plano de Aula' : 'Novo Plano de Aula';
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <div class="module-header">
                        <div class="header-content">
                            <div class="header-left">
                                <button id="back-to-list-btn" class="btn-form btn-secondary-form" onclick="window.openLessonPlansList(this.closest('.module-isolated-container').parentElement)">
                                    <i class="fas fa-arrow-left"></i>
                                    Voltar
                                </button>
                                <div class="header-title">
                                    <h1 class="module-title">
                                        <span class="title-icon">📚</span>
                                        ${title}
                                    </h1>
                                    <p class="module-subtitle">Editor de planos de aula em desenvolvimento</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="module-content">
                        <div style="padding: 2rem; text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🚧</div>
                            <h3>Editor em Desenvolvimento</h3>
                            <p>O editor completo de planos de aula será implementado em breve.</p>
                            <p>Por enquanto, use a API diretamente ou aguarde a próxima atualização.</p>
                            
                            <div style="margin-top: 2rem;">
                                <button class="btn-form btn-primary-form" onclick="window.openLessonPlansList(this.closest('.module-isolated-container').parentElement)">
                                    <i class="fas fa-list"></i>
                                    Voltar para Lista
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Destroy controller and cleanup
         */
        destroy() {
            // Clear auto-save timeout
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            
            console.log('✅ Lesson Plan editor controller destruído');
        }
    }
    
    // Make controllers available globally
    window.LessonPlansListController = LessonPlansListController;
    window.LessonPlanEditorController = LessonPlanEditorController;
    
    // Auto-initialize if DOM is ready and container exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('lessonPlansContainer') || 
                document.querySelector('.lesson-plans-container') ||
                document.querySelector('.lesson-plans-isolated') ||
                document.querySelector('[data-module="lesson-plans"]')) {
                initLessonPlans();
            }
        });
    } else {
        // DOM already loaded
        if (document.getElementById('lessonPlansContainer') || 
            document.querySelector('.lesson-plans-container') ||
            document.querySelector('.lesson-plans-isolated') ||
            document.querySelector('[data-module="lesson-plans"]')) {
            initLessonPlans();
        }
    }
    
    // Listen for hash changes (SPA navigation)
    window.addEventListener('hashchange', () => {
        // Attempt init on route changes if container exists
        if (document.getElementById('lessonPlansContainer') ||
            document.querySelector('.lesson-plans-container') ||
            document.querySelector('.lesson-plans-isolated') ||
            document.querySelector('[data-module="lesson-plans"]')) {
            try { initLessonPlans(); } catch (_) {}
        }
    });
    
})();

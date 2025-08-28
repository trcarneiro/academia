/**
 * Lesson Plans Module - Guidelines2.md Premium Compliant
 * 
 * Main entry point for the lesson plans module with proper MVC architecture,
 * API client integration, SPA compatibility, and AcademyApp integration.
 */

(function() {
    'use strict';
    
    console.log('📚 Lesson Plans Module - Starting...');
    
    // Provide a safe banner shim using feedback utilities when available
    if (typeof window.showBanner !== 'function') {
        window.showBanner = function(message, type = 'info') {
            const fb = window.feedback || {};
            if (type === 'error') {
                (fb.showError && fb.showError(message)) || alert(message);
            } else if (type === 'success') {
                (fb.showSuccess && fb.showSuccess(message)) || alert(message);
            } else {
                (fb.showInfo && fb.showInfo(message)) || alert(message);
            }
        };
    }
    
    // ==============================================
    // ACADEMY APP INTEGRATION (Guidelines2.md)
    // ==============================================
    
    // Register with AcademyApp
    if (window.app) {
        window.app.dispatchEvent('module:loaded', { name: 'lesson-plans' });
    }
    
    // Expose module globally for AcademyApp
    window.lessonPlansModule = {
        name: 'lesson-plans',
        version: '2.0.0',
        init: initLessonPlans,
        destroy: destroyLessonPlans
    };
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines2.md)
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
        try {
            // Initialize API first
            if (!lessonPlansAPI) {
                await initializeAPI();
            }
            
            // Create controller instances - use local classes, not window
            listController = new LessonPlansListController(lessonPlansAPI);
            editorController = new LessonPlanEditorController(lessonPlansAPI);
            
            console.log('✅ Lesson Plans controllers initialized');
        } catch (error) {
            console.error('❌ Error initializing controllers:', error);
            throw error;
        }
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
            
            // Use AcademyApp error handling if available
            if (window.app && window.app.handleError) {
                window.app.handleError(error, 'Lesson Plans Module Initialization');
            }
        }
    }
    
    /**
     * Destroy lesson plans module
     */
    function destroyLessonPlans() {
        console.log('🧹 Destroying Lesson Plans Module...');
        
        // Cleanup controllers
        if (listController) {
            listController.destroy();
            listController = null;
        }
        
        if (editorController) {
            editorController.destroy();
            editorController = null;
        }
        
        // Remove global references
        window.lessonPlansModule = null;
        
        console.log('✅ Lesson Plans Module destroyed');
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
            
            // Note: Methods will be bound after class definition
            // this.handleSearch = this.handleSearch.bind(this);
            // this.handleFilter = this.handleFilter.bind(this);
            // this.handlePageChange = this.handlePageChange.bind(this);
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
         * Render HTML structure (Premium Guidelines2.md)
         */
        renderHTML() {
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <!-- Header Section Premium -->
                    <div class="module-header-premium">
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

                    <!-- Stats Section Enhanced -->
                    <div class="module-stats">
                        <div class="stat-card-enhanced">
                            <div class="stat-value" id="total-lesson-plans">-</div>
                            <div class="stat-label">Total de Planos</div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-value" id="filtered-lesson-plans">-</div>
                            <div class="stat-label">Filtrados</div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-value" id="courses-count">-</div>
                            <div class="stat-label">Cursos</div>
                        </div>
                    </div>

                    <!-- Filters Section Premium -->
                    <div class="module-filters-premium">
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

                    <!-- Table Section Premium -->
                    <div class="module-content">
                        <div id="loading-state" class="loading-state" style="display: none;">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Carregando planos de aula...</div>
                        </div>
                        
                        <div class="data-card-premium">
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
                    // Navigate via SPA router to ensure rendering in main container
                    if (window.router && typeof window.router.navigateTo === 'function') {
                        location.hash = 'lesson-plan-editor';
                        window.router.navigateTo('lesson-plan-editor');
                    } else {
                        location.hash = 'lesson-plan-editor';
                    }
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
                    <td><span class="lesson-number">${plan.lessonNumber || 'N/A'}</span></td>
                    <td><span class="week-number">${plan.weekNumber || 'N/A'}</span></td>
                    <td><div class="difficulty-display">${this.renderDifficulty(plan.difficulty || 1)}</div></td>
                    <td><span class="duration-display">${plan.duration || 60} min</span></td>
                    <td><span class="status-badge status-level-${plan.level || 1}">Nível ${plan.level || 1}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-form btn-small btn-primary-form" 
                                    onclick="location.hash='lesson-plan-editor/${plan.id}'" 
                                    title="Editar plano">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-form btn-small btn-info-form" 
                                    onclick="location.hash='lesson-plan-editor/${plan.id}'" 
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
                            <button class="btn-form btn-primary-form" onclick="location.hash='lesson-plan-editor'">
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
            // Route to editor in read-only (same screen, viewer handled inside editor if needed)
            window.location.hash = `lesson-plan-editor/${planId}`;
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
            
            // Bind methods - will be set up when methods are defined
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
         * Render complete lesson plan editor
         */
        renderSimpleEditor() {
            const isEditing = !!this.planId;
            const title = this.isReadOnly ? 'Visualizar Plano de Aula' : 
                         isEditing ? 'Editar Plano de Aula' : 'Novo Plano de Aula';
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <div class="module-header-premium">
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
                                    <p class="module-subtitle">Complete todos os campos necessários</p>
                                </div>
                            </div>
                            <div class="header-right">
                                ${!this.isReadOnly ? `
                                    <button id="save-plan-btn" class="btn-form btn-primary-form" ${isEditing ? '' : 'disabled'}>
                                        <i class="fas fa-save"></i>
                                        Salvar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="module-content">
                        <form id="lesson-plan-form" class="lesson-plan-editor">
                            <!-- Informações Básicas -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-info-circle"></i> Informações Básicas</h3>
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="courseId" class="form-label">Curso *</label>
                                        <select id="courseId" name="courseId" class="form-input" required ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="">Selecione um curso...</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="title" class="form-label">Título da Aula *</label>
                                        <input type="text" id="title" name="title" class="form-input" required ${this.isReadOnly ? 'readonly' : ''} placeholder="Ex: Técnicas de Defesa Básica">
                                    </div>
                                </div>
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="lessonNumber" class="form-label">Número da Aula *</label>
                                        <input type="number" id="lessonNumber" name="lessonNumber" class="form-input" required ${this.isReadOnly ? 'readonly' : ''} min="1" placeholder="1">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="weekNumber" class="form-label">Semana *</label>
                                        <input type="number" id="weekNumber" name="weekNumber" class="form-input" required ${this.isReadOnly ? 'readonly' : ''} min="1" placeholder="1">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="unit" class="form-label">Unidade</label>
                                        <input type="text" id="unit" name="unit" class="form-input" ${this.isReadOnly ? 'readonly' : ''} placeholder="Ex: Fundamentos">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="description" class="form-label">Descrição</label>
                                    <textarea id="description" name="description" class="form-input" rows="3" ${this.isReadOnly ? 'readonly' : ''} placeholder="Descreva os objetivos gerais da aula..."></textarea>
                                </div>
                            </div>

                            <!-- Configurações -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-cog"></i> Configurações</h3>
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="level" class="form-label">Nível (1-5)</label>
                                        <select id="level" name="level" class="form-input" ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="1">1 - Iniciante</option>
                                            <option value="2">2 - Básico</option>
                                            <option value="3">3 - Intermediário</option>
                                            <option value="4">4 - Avançado</option>
                                            <option value="5">5 - Expert</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="difficulty" class="form-label">Dificuldade (1-5)</label>
                                        <select id="difficulty" name="difficulty" class="form-input" ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="1">1 - Muito Fácil</option>
                                            <option value="2">2 - Fácil</option>
                                            <option value="3">3 - Moderado</option>
                                            <option value="4">4 - Difícil</option>
                                            <option value="5">5 - Muito Difícil</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="duration" class="form-label">Duração (minutos)</label>
                                        <input type="number" id="duration" name="duration" class="form-input" ${this.isReadOnly ? 'readonly' : ''} min="15" max="180" value="60" placeholder="60">
                                    </div>
                                </div>
                            </div>

                            <!-- Objetivos e Equipamentos -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-bullseye"></i> Objetivos e Recursos</h3>
                                
                                <div class="form-group">
                                    <label for="objectives" class="form-label">Objetivos da Aula</label>
                                    <textarea id="objectives" name="objectives" class="form-input" rows="3" ${this.isReadOnly ? 'readonly' : ''} placeholder="Liste os objetivos separados por linha..."></textarea>
                                    <small class="form-hint">Um objetivo por linha</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="equipment" class="form-label">Equipamentos Necessários</label>
                                    <textarea id="equipment" name="equipment" class="form-input" rows="2" ${this.isReadOnly ? 'readonly' : ''} placeholder="Ex: Tatames, luvas, bastões..."></textarea>
                                    <small class="form-hint">Um equipamento por linha</small>
                                </div>
                            </div>

                            <!-- Estrutura da Aula -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-list-ol"></i> Estrutura da Aula</h3>
                                
                                <div class="lesson-structure">
                                    <div class="structure-section">
                                        <h4><i class="fas fa-fire"></i> Aquecimento</h4>
                                        <textarea id="warmup" name="warmup" class="form-input" rows="4" ${this.isReadOnly ? 'readonly' : ''} placeholder="Descreva as atividades de aquecimento..."></textarea>
                                    </div>
                                    
                                    <div class="structure-section">
                                        <h4><i class="fas fa-fist-raised"></i> Técnicas Principais</h4>
                                        <textarea id="techniques" name="techniques" class="form-input" rows="6" ${this.isReadOnly ? 'readonly' : ''} placeholder="Descreva as técnicas que serão ensinadas..."></textarea>
                                    </div>
                                    
                                    <div class="structure-section">
                                        <h4><i class="fas fa-users"></i> Simulações e Prática</h4>
                                        <textarea id="simulations" name="simulations" class="form-input" rows="4" ${this.isReadOnly ? 'readonly' : ''} placeholder="Descreva as simulações e exercícios práticos..."></textarea>
                                    </div>
                                    
                                    <div class="structure-section">
                                        <h4><i class="fas fa-leaf"></i> Relaxamento</h4>
                                        <textarea id="cooldown" name="cooldown" class="form-input" rows="3" ${this.isReadOnly ? 'readonly' : ''} placeholder="Descreva as atividades de relaxamento..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Módulos Opcionais -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-puzzle-piece"></i> Módulos Opcionais</h3>
                                
                                <div class="form-group">
                                    <label for="mentalModule" class="form-label">Módulo Mental/Psicológico</label>
                                    <textarea id="mentalModule" name="mentalModule" class="form-input" rows="3" ${this.isReadOnly ? 'readonly' : ''} placeholder="Aspectos mentais, controle de estresse, concentração..."></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="tacticalModule" class="form-label">Módulo Tático</label>
                                    <input type="text" id="tacticalModule" name="tacticalModule" class="form-input" ${this.isReadOnly ? 'readonly' : ''} placeholder="Ex: Análise de distância, timing, posicionamento">
                                </div>
                                
                                <div class="form-group">
                                    <label for="adaptations" class="form-label">Adaptações</label>
                                    <textarea id="adaptations" name="adaptations" class="form-input" rows="2" ${this.isReadOnly ? 'readonly' : ''} placeholder="Adaptações para diferentes níveis ou necessidades especiais..."></textarea>
                                </div>
                            </div>

                            <!-- Mídia -->
                            <div class="data-card-premium">
                                <h3><i class="fas fa-video"></i> Recursos de Mídia</h3>
                                
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="videoUrl" class="form-label">URL do Vídeo</label>
                                        <input type="url" id="videoUrl" name="videoUrl" class="form-input" ${this.isReadOnly ? 'readonly' : ''} placeholder="https://youtube.com/watch?v=...">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="thumbnailUrl" class="form-label">URL da Thumbnail</label>
                                        <input type="url" id="thumbnailUrl" name="thumbnailUrl" class="form-input" ${this.isReadOnly ? 'readonly' : ''} placeholder="https://...">
                                    </div>
                                </div>
                            </div>

                            ${!this.isReadOnly ? `
                                <div class="form-actions">
                                    <button type="button" class="btn-form btn-secondary-form" onclick="window.openLessonPlansList(this.closest('.module-isolated-container').parentElement)">
                                        <i class="fas fa-times"></i>
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-form btn-primary-form">
                                        <i class="fas fa-save"></i>
                                        ${isEditing ? 'Atualizar' : 'Criar'} Plano de Aula
                                    </button>
                                </div>
                            ` : ''}
                        </form>
                    </div>
                </div>
            `;
            
            // Initialize editor functionality
            this.initializeEditor();
        }

        /**
         * Initialize editor functionality
         */
        async initializeEditor() {
            // Load courses for dropdown
            await this.loadCourses();
            
            // Load existing data if editing
            if (this.planId) {
                await this.loadLessonPlan();
            }
            
            // Setup form handlers
            this.setupFormHandlers();
            
            // Setup auto-save if not read-only
            if (!this.isReadOnly) {
                this.setupAutoSave();
            }
        }

        /**
         * Load courses for dropdown
         */
        async loadCourses() {
            try {
                await this.api.fetchWithStates('/api/courses', {
                    onSuccess: (list) => {
                        const courses = Array.isArray(list) ? list : (list?.data || []);
                        const courseSelect = document.getElementById('courseId');
                        if (courseSelect) {
                            courseSelect.innerHTML = '<option value="">Selecione um curso...</option>';
                            courses.forEach(course => {
                                courseSelect.innerHTML += `
                                    <option value="${course.id}">${course.name}${course.level ? ` (Nível ${course.level})` : ''}</option>
                                `;
                            });
                        }
                    },
                    onError: (error) => { console.warn('Erro ao carregar cursos:', error); }
                });
            } catch (error) {
                console.error('Erro ao carregar cursos:', error);
            }
        }

        /**
         * Load existing lesson plan data
         */
        async loadLessonPlan() {
            try {
                await this.api.fetchWithStates(`/api/lesson-plans/${this.planId}`, {
                    onSuccess: (data) => {
                        this.plan = data;
                        this.populateForm(this.plan);
                    },
                    onError: (error) => {
                        console.error('Erro ao carregar plano de aula:', error);
                        if (window.showBanner) {
                            window.showBanner('Erro ao carregar dados do plano de aula', 'error');
                        }
                    }
                });
            } catch (error) {
                console.error('Erro ao carregar plano de aula:', error);
                if (window.showBanner) {
                    window.showBanner('Erro ao carregar dados do plano de aula', 'error');
                }
            }
        }

        /**
         * Populate form with lesson plan data
         */
        populateForm(plan) {
            const fields = [
                'courseId', 'title', 'description', 'lessonNumber', 'weekNumber', 
                'unit', 'level', 'difficulty', 'duration', 'tacticalModule',
                'videoUrl', 'thumbnailUrl'
            ];

            fields.forEach(field => {
                const element = document.getElementById(field);
                if (element && plan[field] !== undefined) {
                    element.value = plan[field];
                }
            });

            // Handle array fields
            if (plan.objectives && Array.isArray(plan.objectives)) {
                const objectivesEl = document.getElementById('objectives');
                if (objectivesEl) {
                    objectivesEl.value = plan.objectives.join('\n');
                }
            }

            if (plan.equipment && Array.isArray(plan.equipment)) {
                const equipmentEl = document.getElementById('equipment');
                if (equipmentEl) {
                    equipmentEl.value = plan.equipment.join('\n');
                }
            }

            // Handle JSON fields
            const jsonFields = ['warmup', 'techniques', 'simulations', 'cooldown', 'mentalModule', 'adaptations'];
            jsonFields.forEach(field => {
                const element = document.getElementById(field);
                if (element && plan[field]) {
                    if (typeof plan[field] === 'string') {
                        element.value = plan[field];
                    } else if (typeof plan[field] === 'object') {
                        element.value = JSON.stringify(plan[field], null, 2);
                    }
                }
            });
        }

        /**
         * Setup form event handlers
         */
        setupFormHandlers() {
            const form = document.getElementById('lesson-plan-form');
            if (form) {
                form.addEventListener('submit', this.handleSubmit.bind(this));
                
                // Mark form as dirty on changes
                form.addEventListener('input', () => {
                    this.isDirty = true;
                    const saveBtn = document.getElementById('save-plan-btn');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                    }
                });
            }
        }

        /**
         * Setup auto-save functionality (disabled)
         */
        setupAutoSave() {
            // Auto-save desativado por solicitação
            this.autoSaveTimeout = null;
            return;
        }

        /**
         * Save draft (disabled)
         */
        async saveDraft() {
            // Auto-save/rascunho desativado
            return;
        }

        /**
         * Handle form submission
         */
        async handleSubmit(event) {
            event.preventDefault();
            
            if (this.isReadOnly) return;
            
            try {
                const formData = this.collectFormData();
                const validation = this.validateFormData(formData);
                
                if (!validation.isValid) {
                    window.showBanner(validation.message, 'error');
                    return;
                }

                const saveBtn = document.querySelector('#lesson-plan-form button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
                }

                const endpoint = this.planId ? `/api/lesson-plans/${this.planId}` : '/api/lesson-plans';
                const method = this.planId ? 'PUT' : 'POST';

                await this.api.saveWithFeedback(endpoint, formData, {
                    method,
                    onSuccess: () => {
                        this.isDirty = false;
                        window.showBanner(
                            `Plano de aula ${this.planId ? 'atualizado' : 'criado'} com sucesso!`,
                            'success'
                        );
                        setTimeout(() => {
                            window.openLessonPlansList(this.container);
                        }, 1200);
                    },
                    onError: (error) => {
                        console.error('Erro ao salvar plano de aula:', error);
                        window.showBanner(`Erro ao salvar: ${error?.message || 'Falha no salvamento'}`, 'error');
                    }
                });

            } catch (error) {
                console.error('Erro ao salvar plano de aula:', error);
                window.showBanner(`Erro ao salvar: ${error.message}`, 'error');
            } finally {
                const saveBtn = document.querySelector('#lesson-plan-form button[type="submit"]');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<i class="fas fa-save"></i> ${this.planId ? 'Atualizar' : 'Criar'} Plano de Aula`;
                }
            }
        }

        /**
         * Collect form data
         */
        collectFormData() {
            const form = document.getElementById('lesson-plan-form');
            const formData = new FormData(form);
            
            const data = {};
            
            // Basic fields
            const basicFields = [
                'courseId', 'title', 'description', 'unit', 'tacticalModule',
                'videoUrl', 'thumbnailUrl'
            ];
            
            basicFields.forEach(field => {
                const value = formData.get(field);
                if (value && value.trim()) {
                    data[field] = value.trim();
                }
            });

            // Numeric fields
            const numericFields = ['lessonNumber', 'weekNumber', 'level', 'difficulty', 'duration'];
            numericFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    data[field] = parseInt(value);
                }
            });

            // Array fields (split by lines)
            const objectives = formData.get('objectives');
            if (objectives) {
                data.objectives = objectives.split('\n').filter(line => line.trim()).map(line => line.trim());
            }

            const equipment = formData.get('equipment');
            if (equipment) {
                data.equipment = equipment.split('\n').filter(line => line.trim()).map(line => line.trim());
            }

            // JSON/Text fields for lesson structure
            const structureFields = ['warmup', 'techniques', 'simulations', 'cooldown'];
            structureFields.forEach(field => {
                const value = formData.get(field);
                if (value && value.trim()) {
                    data[field] = value.trim();
                }
            });

            // Optional fields
            const optionalFields = ['mentalModule', 'adaptations'];
            optionalFields.forEach(field => {
                const value = formData.get(field);
                if (value && value.trim()) {
                    data[field] = value.trim();
                }
            });

            return data;
        }

        /**
         * Validate form data
         */
        validateFormData(data) {
            if (!data.courseId) {
                return { isValid: false, message: 'Selecione um curso' };
            }
            
            if (!data.title || data.title.length < 3) {
                return { isValid: false, message: 'Título deve ter pelo menos 3 caracteres' };
            }
            
            if (!data.lessonNumber || data.lessonNumber < 1) {
                return { isValid: false, message: 'Número da aula deve ser maior que zero' };
            }
            
            if (!data.weekNumber || data.weekNumber < 1) {
                return { isValid: false, message: 'Número da semana deve ser maior que zero' };
            }

            return { isValid: true };
        }

        /**
         * Save draft (auto-save)
         */
        async saveDraft() {
            if (!this.planId || this.isReadOnly) return;
            
            try {
                const formData = this.collectFormData();
                await this.api.saveWithFeedback(`/api/lesson-plans/${this.planId}`, formData, {
                    method: 'PUT',
                    onSuccess: () => console.log('💾 Rascunho salvo automaticamente'),
                    onError: (e) => console.warn('Erro no auto-save:', e)
                });
            } catch (error) {
                console.warn('Erro no auto-save:', error);
            }
        }

        /**
         * Handle search input
         */
        handleSearch = (event) => {
            this.searchQuery = event.target.value.trim();
            this.currentPage = 1;
            this.loadData();
        }

        /**
         * Handle filter changes
         */
        handleFilter = (event) => {
            const { name, value } = event.target;
            
            if (name === 'course') {
                this.filterCourse = value;
            } else if (name === 'level') {
                this.filterLevel = value;
            }
            
            this.currentPage = 1;
            this.loadData();
        }

        /**
         * Handle page changes
         */
        handlePageChange = (newPage) => {
            this.currentPage = newPage;
            this.loadData();
        }

        /**
         * Refresh data
         */
        async refresh() {
            await this.loadData();
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
    
    // ==============================================
    // AUTO-INITIALIZATION DISABLED
    // ==============================================
    
    // Auto-initialization has been DISABLED to prevent unwanted loading.
    // The module will ONLY initialize when explicitly called via:
    // window.initializeLessonPlansModule() by the SPA router
    
    // Make controllers available globally for debugging and legacy compatibility
    window.LessonPlansListController = LessonPlansListController;
    window.LessonPlanEditorController = LessonPlanEditorController;
    
})();

/**
 * Lesson Plans Module - Activities Pattern Compliant
 * 
 * Main entry point for the lesson plans module following Activities module structure
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
    // ACADEMY APP INTEGRATION
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
    // CSS LOADING
    // ==============================================
    
    /**
     * Load module CSS dynamically
     */
    function loadModuleCSS() {
        const cssPath = '/css/modules/lesson-plans-editor.css';
        const existingLink = document.querySelector(`link[href="${cssPath}"]`);
        
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
            console.log('🎨 Lesson Plans CSS carregado');
        }
    }
    
    // ==============================================
    // API CLIENT INTEGRATION
    // ==============================================
    
    /**
     * Wait for API client
     */
    function waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.createModuleAPI) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }
    
    // ==============================================
    // CONTROLLERS
    // ==============================================
    
    // Controllers will be created fresh when needed, following Activities pattern
    
    // ==============================================
    // MODULE INITIALIZATION
    // ==============================================
    
    /**
     * Initialize the lesson plans module
     */
    async function initLessonPlans(targetContainer) {
        try {
            console.log('🔧 Initializing Lesson Plans Module...');
            
            // Validate container early
            if (!targetContainer) {
                console.error('❌ Target container is undefined in initLessonPlans');
                const moduleContainer = document.getElementById('module-container');
                if (moduleContainer) {
                    console.log('🔄 Using fallback module-container');
                    targetContainer = moduleContainer;
                } else {
                    throw new Error('No valid container found for lesson plans initialization');
                }
            }
            
            // Load CSS
            loadModuleCSS();
            
            // Setup tab navigation
            setupTabNavigation(targetContainer);
            
            // Open lesson plans list by default (tab 1)
            await openLessonPlansList(targetContainer);
            
            console.log('✅ Lesson Plans Module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Lesson Plans Module:', error);
            if (window.app && window.app.handleError) {
                window.app.handleError(error, 'Lesson Plans Module initialization');
            }
            throw error;
        }
    }

    /**
     * Setup tab navigation
     */
    function setupTabNavigation(targetContainer) {
        console.log('🔧 Setting up tab navigation...');
        
        // Find all tab buttons
        const tabButtons = targetContainer.querySelectorAll('.tab-btn');
        
        if (tabButtons.length === 0) {
            console.warn('⚠️ No tab buttons found');
            return;
        }

        tabButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tabName = e.currentTarget.dataset.tab;
                await switchTab(tabName, targetContainer);
            });
        });

        console.log(`✅ Tab navigation setup complete (${tabButtons.length} tabs)`);
    }

    /**
     * Switch between tabs
     */
    async function switchTab(tabName, targetContainer) {
        console.log(`🔄 Switching to tab: ${tabName}`);

        // Update active tab button
        const tabButtons = targetContainer.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Hide all tab contents
        const tabContents = targetContainer.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });

        // Show selected tab content
        const selectedTabContent = targetContainer.querySelector(`#${tabName}-tab-content`);
        if (selectedTabContent) {
            selectedTabContent.style.display = 'block';
            selectedTabContent.classList.add('active');
        }

        // Load tab content based on tab name
        try {
            switch (tabName) {
                case 'list':
                    // List is already loaded on init
                    console.log('📋 List tab activated');
                    break;

                case 'editor':
                    console.log('✏️ Editor tab activated');
                    // Editor will be loaded when user selects a lesson plan
                    break;

                case 'ai-generator':
                    console.log('🤖 AI Generator tab activated');
                    await loadAIGeneratorTab(targetContainer);
                    break;

                default:
                    console.warn(`⚠️ Unknown tab: ${tabName}`);
            }
        } catch (error) {
            console.error(`❌ Error loading tab ${tabName}:`, error);
            if (window.app?.handleError) {
                window.app.handleError(error, `lesson-plans-tab-${tabName}`);
            }
        }
    }

    /**
     * Load AI Generator tab
     */
    async function loadAIGeneratorTab(targetContainer) {
        console.log('🤖 Loading AI Generator tab...');

        try {
            // Wait for API Client
            await waitForAPIClient();
            const lessonPlansAPI = window.createModuleAPI('LessonPlans');

            // Load AI Generation Service if not already loaded
            if (typeof AIGenerationService === 'undefined') {
                console.log('📦 Loading AI Generation Service...');
                await loadScript('/js/modules/lesson-plans/services/ai-generation-service.js');
                // Wait for service to be available
                await waitForGlobal('AIGenerationService', 5000);
            }

            // Load AI Generator Controller if not already loaded
            if (typeof AIGeneratorController === 'undefined') {
                console.log('📦 Loading AI Generator Controller...');
                await loadScript('/js/modules/lesson-plans/controllers/ai-generator-controller.js');
                // Wait for controller to be available
                await waitForGlobal('AIGeneratorController', 5000);
            }

            // Find or create AI generator container
            const aiGeneratorContainer = targetContainer.querySelector('#ai-generator-container');
            if (!aiGeneratorContainer) {
                throw new Error('AI Generator container not found');
            }

            // Initialize AI Generator Controller (only once)
            if (!window.lessonPlansAIController) {
                console.log('🔧 Initializing AI Generator Controller...');
                window.lessonPlansAIController = new AIGeneratorController(lessonPlansAPI);
                await window.lessonPlansAIController.init(aiGeneratorContainer);
            }

            console.log('✅ AI Generator tab loaded successfully');
        } catch (error) {
            console.error('❌ Error loading AI Generator tab:', error);
            throw error;
        }
    }

    /**
     * Load external script dynamically
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`✅ Script already loaded: ${src}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                console.log(`✅ Script loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Wait for global variable to be available
     */
    function waitForGlobal(globalName, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (window[globalName]) {
                    clearInterval(checkInterval);
                    resolve(window[globalName]);
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${globalName}`));
                }
            }, 100);
        });
    }

    /**
     * Navigate to lesson plans list
     */
    async function openLessonPlansList(targetContainer) {
        console.log('📚 Opening lesson plans list...');
        
        try {
            // Wait for API Client
            await waitForAPIClient();
            const lessonPlansAPI = window.createModuleAPI('LessonPlans');
            
            // Initialize list controller
            const listController = new LessonPlansListController(lessonPlansAPI);
            
            // Store controller globally for button actions
            window.lessonPlansListController = listController;
            
            // Render list
            await listController.render(targetContainer);
            
        } catch (error) {
            console.error('❌ Error opening lesson plans list:', error);
            if (window.app?.handleError) {
                window.app.handleError(error, 'lesson-plans-list');
            }
        }
    }
    
    /**
     * Navigate to lesson plan editor
     */
    async function openLessonPlanEditor(targetContainer, lessonPlanId = null) {
        console.log('📝 Opening lesson plan editor:', lessonPlanId ? `editing ID ${lessonPlanId}` : 'new lesson plan');
        
        try {
            // Wait for API Client
            await waitForAPIClient();
            const lessonPlansAPI = window.createModuleAPI('LessonPlans');
            
            // Initialize editor controller
            const editorController = new LessonPlanEditorController(lessonPlansAPI);
            
            // Render editor
            await editorController.render(targetContainer, lessonPlanId);
            
        } catch (error) {
            console.error('❌ Error opening lesson plan editor:', error);
            if (window.app?.handleError) {
                window.app.handleError(error, 'lesson-plans-editor');
            }
        }
    }
    
    /**
     * Destroy the module
     */
    function destroyLessonPlans() {
        // Clean up global controller reference if exists
        if (window.lessonPlansListController) {
            window.lessonPlansListController.cleanup?.();
            delete window.lessonPlansListController;
        }
        console.log('🗑️ Lesson Plans Module destroyed');
    }
    
    // ==============================================
    // LIST CONTROLLER
    // ==============================================
    
    class LessonPlansListController {
        constructor(api) {
            this.api = api;
            this.currentPage = 1;
            this.pageSize = 20;
            this.filterCourse = '';
            this.filterLevel = '';
            this.searchQuery = '';
            this.sortBy = 'title';
            this.sortOrder = 'asc';
            this.lessonPlans = [];
            this.courses = [];
            this.totalCount = 0;
            this.container = null;
            this.isLoading = false;
            
            // Event handlers storage for cleanup
            this.eventHandlers = new Map();
        }

        /**
         * Render the lesson plans list in the target container
         */
        async render(targetContainer) {
            // Validate target container
            if (!targetContainer) {
                console.error('❌ Target container is undefined');
                throw new Error('Target container is required for rendering lesson plans');
            }
            
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
         * Render HTML structure (Following Activities module pattern)
         */
        renderHTML() {
            console.log('🎨 Starting HTML render for container:', this.container);
            console.log('🎨 Container ID:', this.container?.id);
            console.log('🎨 Container classes:', this.container?.className);
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <!-- Header Premium com Guidelines.MD -->
                    <div class="module-header-premium">
                        <div class="header-content">
                            <div class="header-left">
                                <h1 class="page-title">
                                    <i class="icon">📚</i>
                                    Planos de Aula
                                </h1>
                                <nav class="breadcrumb">Home / Planos de Aula</nav>
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
                                <button id="debug-drafts-btn" class="btn-form btn-info-form">
                                    <i class="fas fa-bug"></i>
                                    Debug Rascunhos
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Cards Premium -->
                    <div class="module-stats">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-value" id="total-lesson-plans">-</div>
                                <div class="stat-label">Total de Planos</div>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🔍</div>
                            <div class="stat-content">
                                <div class="stat-value" id="filtered-lesson-plans">-</div>
                                <div class="stat-label">Filtrados</div>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📝</div>
                            <div class="stat-content">
                                <div class="stat-value" id="drafts-count">-</div>
                                <div class="stat-label">Rascunhos</div>
                            </div>
                        </div>
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">🎓</div>
                            <div class="stat-content">
                                <div class="stat-value" id="courses-count">-</div>
                                <div class="stat-label">Cursos</div>
                            </div>
                        </div>
                    </div>

                    <!-- Filters Premium -->
                    <div class="module-filters-premium">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="search-lesson-plans" class="filter-label">
                                    <i class="fas fa-search"></i>
                                    Buscar
                                </label>
                                <input type="text" id="search-lesson-plans" placeholder="Digite título ou descrição..." 
                                       class="filter-input" autocomplete="off">
                            </div>
                            <div class="filter-group">
                                <label for="filter-course" class="filter-label">
                                    <i class="fas fa-graduation-cap"></i>
                                    Curso
                                </label>
                                <select id="filter-course" class="filter-select">
                                    <option value="">Todos os cursos</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filter-level" class="filter-label">
                                    <i class="fas fa-star"></i>
                                    Nível
                                </label>
                                <select id="filter-level" class="filter-select">
                                    <option value="">Todos os níveis</option>
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

                    <!-- Table Premium -->
                    <div class="data-card-premium">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th class="col-lesson">
                                            <i class="fas fa-book"></i>
                                            Plano de Aula
                                        </th>
                                        <th class="col-course">
                                            <i class="fas fa-graduation-cap"></i>
                                            Curso
                                        </th>
                                        <th class="col-level">
                                            <i class="fas fa-star"></i>
                                            Nível
                                        </th>
                                        <th class="col-duration">
                                            <i class="fas fa-clock"></i>
                                            Duração
                                        </th>
                                        <th class="col-objectives">
                                            <i class="fas fa-bullseye"></i>
                                            Objetivos
                                        </th>
                                        <th class="col-actions">
                                            <i class="fas fa-cog"></i>
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="lesson-plans-table-body">
                                    <!-- Lesson plans will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Pagination Premium -->
                    <div class="pagination-container">
                        <div class="pagination-info">
                            Mostrando <span id="items-start">0</span> a <span id="items-end">0</span> de <span id="items-total">0</span> planos
                        </div>
                        <div class="pagination-controls">
                            <button id="first-page-btn" class="btn-pagination" title="Primeira página">
                                <i class="fas fa-angle-double-left"></i>
                            </button>
                            <button id="prev-page-btn" class="btn-pagination" title="Página anterior">
                                <i class="fas fa-angle-left"></i>
                            </button>
                            <div class="page-numbers" id="page-numbers">
                                <!-- Page numbers will be populated here -->
                            </div>
                            <button id="next-page-btn" class="btn-pagination" title="Próxima página">
                                <i class="fas fa-angle-right"></i>
                            </button>
                            <button id="last-page-btn" class="btn-pagination" title="Última página">
                                <i class="fas fa-angle-double-right"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Loading state -->
                    <div id="loading-state" class="loading-state" style="display: none;">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>Carregando planos de aula...</p>
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div id="empty-state" class="empty-state" style="display: none;">
                        <div class="empty-content">
                            <div class="empty-icon">📚</div>
                            <h3>Nenhum plano de aula encontrado</h3>
                            <p>Comece criando seu primeiro plano de aula ou ajuste os filtros acima.</p>
                            <button id="create-first-lesson-plan-btn" class="btn-form btn-primary-form">
                                <i class="fas fa-plus"></i>
                                Criar Primeiro Plano
                            </button>
                        </div>
                    </div>

                    <!-- Error state -->
                    <div id="error-state" class="error-state" style="display: none;">
                        <div class="error-content">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar planos</h3>
                            <p id="error-message">Ocorreu um erro inesperado. Tente novamente.</p>
                            <button id="retry-load-btn" class="btn-form btn-primary-form">
                                <i class="fas fa-sync-alt"></i>
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Update lesson plans table content
         */
        updateTable() {
            console.log('📊 Updating table with lesson plans:', this.lessonPlans.length);
            const tbody = this.container.querySelector('#lesson-plans-table-body');
            console.log('📊 Table body found:', !!tbody);
            if (!tbody) {
                console.error('❌ Table body not found in container:', this.container);
                return;
            }

            tbody.innerHTML = '';

            if (this.lessonPlans.length === 0) {
                console.log('📊 No lesson plans found, showing empty state');
                this.showEmptyState();
                return;
            }

            console.log('📊 Rendering', this.lessonPlans.length, 'lesson plans');
            this.hideEmptyState();

            this.lessonPlans.forEach(plan => {
                console.log('📊 Creating row for plan:', plan.title);
                const row = this.createTableRow(plan);
                tbody.appendChild(row);
            });

            this.updateStats();
            this.updatePagination();
        }

        /**
         * Create table row for lesson plan
         */
        createTableRow(plan) {
            const tr = document.createElement('tr');
            tr.className = 'table-row';
            tr.setAttribute('data-id', plan.id);
            
            // Format level with stars
            const levelStars = '⭐'.repeat(plan.level || 1);
            
            // Format objectives
            const objectives = Array.isArray(plan.objectives) 
                ? plan.objectives.slice(0, 2).join(', ') + (plan.objectives.length > 2 ? '...' : '')
                : 'Não definidos';

            tr.innerHTML = `
                <td class="col-lesson">
                    <div class="lesson-info">
                        <div class="lesson-title">${this.escapeHtml(plan.title || 'Sem título')}</div>
                        <div class="lesson-meta">
                            Aula ${plan.lessonNumber || '-'} • Semana ${plan.weekNumber || '-'}
                        </div>
                        <div class="lesson-description">${this.escapeHtml(plan.description || 'Sem descrição')}</div>
                    </div>
                </td>
                <td class="col-course">
                    <div class="course-info">
                        <div class="course-name">${this.escapeHtml(plan.course?.name || 'Não definido')}</div>
                        <div class="course-level">${plan.course?.level || 'N/A'}</div>
                    </div>
                </td>
                <td class="col-level">
                    <span class="level-badge level-${plan.level || 1}">${levelStars}</span>
                </td>
                <td class="col-duration">
                    <div class="duration-info">
                        <i class="fas fa-clock"></i>
                        ${plan.duration || 60} min
                    </div>
                </td>
                <td class="col-objectives">
                    <div class="objectives-preview">${objectives}</div>
                </td>
                <td class="col-actions">
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-id="${plan.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-duplicate" data-id="${plan.id}" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${plan.id}" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Add double-click navigation
            tr.addEventListener('dblclick', () => {
                this.editLessonPlan(plan.id);
            });

            return tr;
        }

        /**
         * Bind event listeners
         */
        bindEvents(container) {
            // Clear existing event listeners first
            this.removeEventListeners(container);
            
            // Create handlers for storage and removal
            const handlers = {};
            
            // Create button
            const createBtn = container.querySelector('#create-lesson-plan-btn');
            if (createBtn) {
                handlers.createBtn = () => this.createLessonPlan();
                createBtn.addEventListener('click', handlers.createBtn);
            }

            // Refresh button
            const refreshBtn = container.querySelector('#refresh-lesson-plans-btn');
            if (refreshBtn) {
                handlers.refreshBtn = () => this.loadData();
                refreshBtn.addEventListener('click', handlers.refreshBtn);
            }

            // Debug button
            const debugBtn = container.querySelector('#debug-drafts-btn');
            if (debugBtn) {
                handlers.debugBtn = () => this.debugDrafts();
                debugBtn.addEventListener('click', handlers.debugBtn);
            }

            // Search input
            const searchInput = container.querySelector('#search-lesson-plans');
            if (searchInput) {
                handlers.searchInput = (e) => {
                    this.searchQuery = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                };
                searchInput.addEventListener('input', handlers.searchInput);
            }

            // Filter selects
            const courseFilter = container.querySelector('#filter-course');
            if (courseFilter) {
                handlers.courseFilter = (e) => {
                    this.filterCourse = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                };
                courseFilter.addEventListener('change', handlers.courseFilter);
            }

            const levelFilter = container.querySelector('#filter-level');
            if (levelFilter) {
                handlers.levelFilter = (e) => {
                    this.filterLevel = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                };
                levelFilter.addEventListener('change', handlers.levelFilter);
            }

            // Items per page
            const itemsPerPage = container.querySelector('#items-per-page');
            if (itemsPerPage) {
                handlers.itemsPerPage = (e) => {
                    if (e.target.value === 'all') {
                        this.pageSize = 999999;
                    } else {
                        this.pageSize = parseInt(e.target.value);
                    }
                    this.currentPage = 1;
                    this.loadData();
                };
                itemsPerPage.addEventListener('change', handlers.itemsPerPage);
            }

            // Clear filters
            const clearFiltersBtn = container.querySelector('#clear-filters-btn');
            if (clearFiltersBtn) {
                handlers.clearFiltersBtn = () => this.clearFilters();
                clearFiltersBtn.addEventListener('click', handlers.clearFiltersBtn);
            }

            // Action buttons delegation - store the handler to remove it later
            handlers.containerClick = (e) => {
                if (e.target.closest('.btn-edit')) {
                    const id = e.target.closest('.btn-edit').dataset.id;
                    this.editLessonPlan(id);
                } else if (e.target.closest('.btn-duplicate')) {
                    const id = e.target.closest('.btn-duplicate').dataset.id;
                    this.duplicateLessonPlan(id);
                } else if (e.target.closest('.btn-delete')) {
                    const id = e.target.closest('.btn-delete').dataset.id;
                    this.deleteLessonPlan(id);
                }
            };
            container.addEventListener('click', handlers.containerClick);
            
            // Store all handlers for cleanup
            this.eventHandlers.set(container, handlers);
        }

        /**
         * Remove event listeners to prevent duplication
         */
        removeEventListeners(container) {
            const handlers = this.eventHandlers.get(container);
            if (!handlers) return;
            
            // Remove individual element listeners
            const createBtn = container.querySelector('#create-lesson-plan-btn');
            if (createBtn && handlers.createBtn) {
                createBtn.removeEventListener('click', handlers.createBtn);
            }

            const refreshBtn = container.querySelector('#refresh-lesson-plans-btn');
            if (refreshBtn && handlers.refreshBtn) {
                refreshBtn.removeEventListener('click', handlers.refreshBtn);
            }

            const debugBtn = container.querySelector('#debug-drafts-btn');
            if (debugBtn && handlers.debugBtn) {
                debugBtn.removeEventListener('click', handlers.debugBtn);
            }

            const searchInput = container.querySelector('#search-lesson-plans');
            if (searchInput && handlers.searchInput) {
                searchInput.removeEventListener('input', handlers.searchInput);
            }

            const courseFilter = container.querySelector('#filter-course');
            if (courseFilter && handlers.courseFilter) {
                courseFilter.removeEventListener('change', handlers.courseFilter);
            }

            const levelFilter = container.querySelector('#filter-level');
            if (levelFilter && handlers.levelFilter) {
                levelFilter.removeEventListener('change', handlers.levelFilter);
            }

            const itemsPerPage = container.querySelector('#items-per-page');
            if (itemsPerPage && handlers.itemsPerPage) {
                itemsPerPage.removeEventListener('change', handlers.itemsPerPage);
            }

            const clearFiltersBtn = container.querySelector('#clear-filters-btn');
            if (clearFiltersBtn && handlers.clearFiltersBtn) {
                clearFiltersBtn.removeEventListener('click', handlers.clearFiltersBtn);
            }

            // Remove container delegation listener
            if (handlers.containerClick) {
                container.removeEventListener('click', handlers.containerClick);
            }
            
            // Clear the handlers from storage
            this.eventHandlers.delete(container);
        }

        /**
         * Load lesson plans data
         */
        async loadData() {
            try {
                this.showLoading();

                // Load lesson plans with filters
                const params = {
                    page: this.currentPage,
                    limit: this.pageSize
                };

                if (this.searchQuery) params.search = this.searchQuery;
                if (this.filterCourse) params.courseId = this.filterCourse;
                if (this.filterLevel) params.level = this.filterLevel;

                // Use API client with states (Activities pattern)
                const result = await this.api.fetchWithStates('/api/lesson-plans', {
                    method: 'GET',
                    params,
                    onSuccess: (data) => {
                        console.log('🎉 API Success callback called with data:', data);
                        console.log('🔍 Data structure:', Object.keys(data));
                        console.log('🔍 Data type:', Array.isArray(data) ? 'Array' : typeof data);
                        
                        // Handle both direct array and wrapped response
                        if (Array.isArray(data)) {
                            this.lessonPlans = data;
                            this.totalCount = data.length;
                        } else {
                            this.lessonPlans = data.data || [];
                            this.totalCount = data.pagination?.total || data.count || 0;
                        }
                        
                        console.log('📊 Lesson plans loaded:', this.lessonPlans.length);
                        
                        // Ensure DOM is ready before updating table
                        setTimeout(() => {
                            this.updateTable();
                        }, 100);
                    },
                    onEmpty: () => {
                        console.log('📭 API Empty callback called');
                        this.lessonPlans = [];
                        this.totalCount = 0;
                        this.showEmptyState();
                    },
                    onError: (error) => {
                        console.error('❌ API Error callback called:', error);
                        this.showErrorState(error);
                    }
                });

                // Load additional data
                await this.loadDraftsCount();
                await this.loadCourses();
                this.hideLoading();
            } catch (error) {
                console.error('❌ Error loading lesson plans:', error);
                this.showError(error.message);
                if (window.app?.handleError) {
                    window.app.handleError(error, 'Loading lesson plans');
                }
            }
        }

        /**
         * Load drafts count
         */
        async loadDraftsCount() {
            let draftsCount = 0;
            
            // Try to get drafts from AI module if available
            console.log('🔍 Checking for getAllAIDrafts function:', typeof window.getAllAIDrafts);
            if (typeof window.getAllAIDrafts === 'function') {
                try {
                    const drafts = window.getAllAIDrafts();
                    draftsCount = Array.isArray(drafts) ? drafts.length : 0;
                    console.log('📋 Loading drafts via AI module function:', draftsCount);
                } catch (error) {
                    console.warn('⚠️ Error getting drafts from AI module:', error);
                }
            } else {
                console.log('⚠️ AI module not available, trying direct localStorage access');
                // Fallback to direct localStorage access
                try {
                    const storedDrafts = localStorage.getItem('aiLessonPlanDrafts');
                    if (storedDrafts) {
                        const parsed = JSON.parse(storedDrafts);
                        draftsCount = Array.isArray(parsed) ? parsed.length : 0;
                        console.log('📋 Loading drafts via localStorage:', draftsCount);
                    } else {
                        console.log('📭 No drafts found in localStorage');
                    }
                } catch (error) {
                    console.warn('⚠️ Error accessing localStorage for drafts:', error);
                }
            }
            
            this.draftsCount = draftsCount;
        }

        /**
         * Load courses for filter
         */
        async loadCourses() {
            console.log('🎓 loadCourses() called');
            try {
                await this.api.fetchWithStates('/api/courses', {
                    method: 'GET',
                    onSuccess: (data) => {
                        console.log('🎓 onSuccess callback - raw data:', data);
                        console.log('🎓 onSuccess callback - data.data:', data.data);
                        console.log('🎓 onSuccess callback - data type:', typeof data);
                        
                        // fetchWithStates passes the full response, so we need data.data
                        const courses = data.data || data || [];
                        console.log('🎓 Courses loaded successfully:', courses.length);
                        this.courses = courses;
                        
                        // Ensure DOM is ready before populating filter
                        setTimeout(() => {
                            this.populateCourseFilter();
                        }, 100);
                    },
                    onError: (error) => {
                        console.error('❌ Error loading courses:', error);
                        this.courses = [];
                    }
                });
            } catch (error) {
                console.error('❌ Error loading courses:', error);
                this.courses = [];
            }
        }

        /**
         * Populate course filter dropdown
         */
        populateCourseFilter() {
            const courseFilter = this.container.querySelector('#filter-course');
            console.log('🎯 populateCourseFilter called');
            console.log('   courseFilter element:', courseFilter);
            console.log('   courses count:', this.courses.length);
            
            if (!courseFilter) {
                console.warn('⚠️ Course filter dropdown not found in DOM');
                return;
            }

            // Clear existing options except the first one
            courseFilter.innerHTML = '<option value="">Todos os cursos</option>';

            this.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseFilter.appendChild(option);
            });
            
            console.log('✅ Course filter populated with', this.courses.length, 'courses');
        }

        /**
         * Update stats display
         */
        updateStats() {
            const totalElement = this.container.querySelector('#total-lesson-plans');
            const filteredElement = this.container.querySelector('#filtered-lesson-plans');
            const draftsElement = this.container.querySelector('#drafts-count');
            const coursesElement = this.container.querySelector('#courses-count');

            if (totalElement) totalElement.textContent = this.totalCount;
            if (filteredElement) filteredElement.textContent = this.lessonPlans.length;
            if (draftsElement) draftsElement.textContent = this.draftsCount || 0;
            if (coursesElement) coursesElement.textContent = this.courses.length;
        }

        /**
         * Update pagination
         */
        updatePagination() {
            const totalPages = Math.ceil(this.totalCount / this.pageSize);
            
            // Update pagination info
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(this.currentPage * this.pageSize, this.totalCount);
            
            const startElement = this.container.querySelector('#items-start');
            const endElement = this.container.querySelector('#items-end');
            const totalElement = this.container.querySelector('#items-total');
            
            if (startElement) startElement.textContent = this.totalCount > 0 ? start : 0;
            if (endElement) endElement.textContent = end;
            if (totalElement) totalElement.textContent = this.totalCount;
        }

        /**
         * Show/hide states
         */
        showLoading() {
            this.hideError();
            this.hideEmptyState();
            const loadingElement = this.container.querySelector('#loading-state');
            if (loadingElement) loadingElement.style.display = 'flex';
        }

        hideLoading() {
            const loadingElement = this.container.querySelector('#loading-state');
            if (loadingElement) loadingElement.style.display = 'none';
        }

        showEmptyState() {
            this.hideError();
            this.hideLoading();
            const emptyElement = this.container.querySelector('#empty-state');
            if (emptyElement) emptyElement.style.display = 'flex';
        }

        hideEmptyState() {
            const emptyElement = this.container.querySelector('#empty-state');
            if (emptyElement) emptyElement.style.display = 'none';
        }

        showError(message) {
            this.hideLoading();
            this.hideEmptyState();
            const errorElement = this.container.querySelector('#error-state');
            const messageElement = this.container.querySelector('#error-message');
            if (errorElement) errorElement.style.display = 'flex';
            if (messageElement) messageElement.textContent = message;
        }

        hideError() {
            const errorElement = this.container.querySelector('#error-state');
            if (errorElement) errorElement.style.display = 'none';
        }

        /**
         * Action methods
         */
        createLessonPlan() {
            openLessonPlanEditor(this.container, null);
        }

        editLessonPlan(id) {
            openLessonPlanEditor(this.container, id);
        }

        async duplicateLessonPlan(id) {
            await this.api.fetchWithStates(`/api/lesson-plans/${id}/duplicate`, {
                method: 'POST',
                onSuccess: (data) => {
                    window.showBanner('Plano de aula duplicado com sucesso!', 'success');
                    this.loadData();
                },
                onError: (error) => {
                    console.error('❌ Error duplicating lesson plan:', error);
                    window.showBanner('Erro ao duplicar plano de aula', 'error');
                }
            });
        }

        async deleteLessonPlan(id) {
            if (!confirm('Tem certeza que deseja excluir este plano de aula?')) return;

            await this.api.fetchWithStates(`/api/lesson-plans/${id}`, {
                method: 'DELETE',
                onSuccess: (data) => {
                    window.showBanner('Plano de aula excluído com sucesso!', 'success');
                    this.loadData();
                },
                onError: (error) => {
                    console.error('❌ Error deleting lesson plan:', error);
                    window.showBanner('Erro ao excluir plano de aula', 'error');
                }
            });
        }

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

            this.loadData();
        }

        debugDrafts() {
            console.log('🐛 Debug Drafts:', {
                draftsCount: this.draftsCount,
                getAllAIDrafts: typeof window.getAllAIDrafts,
                localStorage: localStorage.getItem('aiLessonPlanDrafts')
            });
        }

        /**
         * Utility methods
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Cleanup method
         */
        cleanup() {
            console.log('🧹 Cleaning up lesson plans list controller');
            
            // Remove all event listeners
            if (this.container) {
                this.removeEventListeners(this.container);
            }
        }
    }

    // ==============================================
    // EDITOR CONTROLLER (FULL)
    // ==============================================
    
    class LessonPlanEditorController {
        constructor(api) {
            this.api = api;
            this.container = null;
            this.lessonPlanId = null;
            this.model = null;
            this.courses = [];
            // In-memory mapping between structure lines and linked activities
            // Format: [{ section: 'warmup'|'techniques'|'simulations'|'cooldown', index: number, text: string, activityId?: string, activity?: any }]
            this.activityLinks = [];
            // Debounce timers for autocomplete
            this._searchTimers = {};
        }

        async render(targetContainer, lessonPlanId = null) {
            this.container = targetContainer;
            this.lessonPlanId = lessonPlanId;
            console.log('📝 Lesson Plan Editor - rendering for ID:', lessonPlanId);

            // Render shell + form scaffold
            this.container.innerHTML = this.templateHeader(lessonPlanId) + this.templateForm();

            // Bind navigation
            this.bindHeaderActions();

            // Load dropdowns in parallel and the model if editing
            await this.loadInitialData();

            // Populate form if editing
            if (this.model) {
                this.fillForm(this.model);
            }

            // Wire events
            this.bindFormEvents();

            // Initialize links UI from current textarea contents (new or edit)
            this.syncLinksFromTextareas();
            // If editing and there are activityItems from backend, hydrate links
            if (this.model && Array.isArray(this.model.activityItems)) {
                this.hydrateLinksFromBackend(this.model.activityItems);
            }
        }

        templateHeader(lessonPlanId) {
            return `
            <div class="module-isolated-container" data-module="lesson-plans">
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="page-title">
                                <i class="icon">📝</i>
                                ${lessonPlanId ? 'Editar' : 'Novo'} Plano de Aula
                            </h1>
                            <nav class="breadcrumb">Home / Planos de Aula / ${lessonPlanId ? 'Editar' : 'Novo'}</nav>
                        </div>
                        <div class="header-actions">
                            <button id="back-to-list-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-arrow-left"></i>
                                Voltar à Lista
                            </button>
                            <button id="save-lesson-plan-btn" class="btn-form btn-primary-form">
                                <i class="fas fa-save"></i>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        templateForm() {
            return `
                <div class="editor-layout">
                    <div class="editor-main">
                        <form id="lesson-plan-form" class="form-professional">
                            
                            <!-- Informações Gerais -->
                            <div class="form-section">
                                <div class="section-header">
                                    <div class="section-icon">📋</div>
                                    <div class="section-content">
                                        <h3 class="section-title">Informações Gerais</h3>
                                        <p class="section-description">Dados básicos e identificação da aula</p>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-heading"></i> Título da Aula *</label>
                                        <input type="text" id="lp-title" required placeholder="Ex: Aula 1 - Fundamentos do Krav Maga" />
                                        <span class="field-hint">Nome claro e descritivo da aula</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-graduation-cap"></i> Curso *</label>
                                        <select id="lp-courseId" required>
                                            <option value="">Selecione o curso...</option>
                                        </select>
                                        <span class="field-hint">Curso ao qual esta aula pertence</span>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-list-ol"></i> Número da Aula</label>
                                        <input type="number" id="lp-lessonNumber" min="1" placeholder="1" />
                                        <span class="field-hint">Ordem sequencial no curso</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-calendar-week"></i> Semana</label>
                                        <input type="number" id="lp-weekNumber" min="1" placeholder="1" />
                                        <span class="field-hint">Semana do cronograma</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-clock"></i> Duração (min)</label>
                                        <input type="number" id="lp-duration" min="1" placeholder="60" />
                                        <span class="field-hint">Tempo previsto da aula</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-star"></i> Nível (1-5)</label>
                                        <select id="lp-level">
                                            <option value="">Selecione...</option>
                                            <option value="1">⭐ Iniciante</option>
                                            <option value="2">⭐⭐ Básico</option>
                                            <option value="3">⭐⭐⭐ Intermediário</option>
                                            <option value="4">⭐⭐⭐⭐ Avançado</option>
                                            <option value="5">⭐⭐⭐⭐⭐ Expert</option>
                                        </select>
                                        <span class="field-hint">Complexidade da aula</span>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field full-width">
                                        <label><i class="fas fa-align-left"></i> Descrição</label>
                                        <textarea id="lp-description" rows="3" placeholder="Breve descrição dos tópicos e objetivos da aula..."></textarea>
                                        <span class="field-hint">Resumo do conteúdo e propósito da aula</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Estrutura da Aula -->
                            <div class="form-section">
                                <div class="section-header">
                                    <div class="section-icon">🏋️</div>
                                    <div class="section-content">
                                        <h3 class="section-title">Estrutura da Aula</h3>
                                        <p class="section-description">Organização e sequência das atividades</p>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-bullseye"></i> Objetivos</label>
                                        <textarea id="lp-objectives" rows="4" placeholder="Ex:&#10;Ensinar postura básica&#10;Praticar deslocamentos&#10;Desenvolver reflexos"></textarea>
                                        <span class="field-hint">Um objetivo por linha - o que o aluno aprenderá</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-tools"></i> Equipamentos</label>
                                        <textarea id="lp-equipment" rows="4" placeholder="Ex:&#10;Tatame&#10;Escudos&#10;Luvas de foco"></textarea>
                                        <span class="field-hint">Um equipamento por linha - materiais necessários</span>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-fire"></i> Aquecimento</label>
                                        <textarea id="lp-warmup" rows="4" placeholder="Ex:&#10;Corrida leve - 5min&#10;Mobilidade articular&#10;Alongamento dinâmico"></textarea>
                                        <span class="field-hint">Exercícios preparatórios - um por linha</span>
                                        <div class="activity-links-block">
                                            <div class="links-header">
                                                <span class="links-title">Vincular a Atividades</span>
                                                <span class="links-subtitle">Conecte cada item ao módulo de Atividades</span>
                                            </div>
                                            <div id="links-warmup" class="activity-links-container" data-section="warmup"></div>
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-fist-raised"></i> Técnicas Principais</label>
                                        <textarea id="lp-techniques" rows="4" placeholder="Ex:&#10;Guarda alta&#10;Deslocamento lateral&#10;Defesa contra soco direto"></textarea>
                                        <span class="field-hint">Técnicas a serem ensinadas - uma por linha</span>
                                        <div class="activity-links-block">
                                            <div class="links-header">
                                                <span class="links-title">Vincular a Atividades</span>
                                                <span class="links-subtitle">Conecte cada item ao módulo de Atividades</span>
                                            </div>
                                            <div id="links-techniques" class="activity-links-container" data-section="techniques"></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-users"></i> Simulações/Sparring</label>
                                        <textarea id="lp-simulations" rows="4" placeholder="Ex:&#10;Simulação de agressão frontal&#10;Treino com parceiro&#10;Situações de estresse"></textarea>
                                        <span class="field-hint">Exercícios práticos e simulações - um por linha</span>
                                        <div class="activity-links-block">
                                            <div class="links-header">
                                                <span class="links-title">Vincular a Atividades</span>
                                                <span class="links-subtitle">Conecte cada item ao módulo de Atividades</span>
                                            </div>
                                            <div id="links-simulations" class="activity-links-container" data-section="simulations"></div>
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-leaf"></i> Alongamento/Relaxamento</label>
                                        <textarea id="lp-cooldown" rows="4" placeholder="Ex:&#10;Alongamento estático&#10;Respiração controlada&#10;Relaxamento muscular"></textarea>
                                        <span class="field-hint">Atividades de finalização - uma por linha</span>
                                        <div class="activity-links-block">
                                            <div class="links-header">
                                                <span class="links-title">Vincular a Atividades</span>
                                                <span class="links-subtitle">Conecte cada item ao módulo de Atividades</span>
                                            </div>
                                            <div id="links-cooldown" class="activity-links-container" data-section="cooldown"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Recursos Multimedia -->
                            <div class="form-section">
                                <div class="section-header">
                                    <div class="section-icon">🎬</div>
                                    <div class="section-content">
                                        <h3 class="section-title">Recursos Multimídia</h3>
                                        <p class="section-description">Vídeos e materiais de apoio</p>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-field">
                                        <label><i class="fas fa-video"></i> Vídeo da Aula</label>
                                        <input type="url" id="lp-videoUrl" placeholder="https://youtube.com/watch?v=..." />
                                        <span class="field-hint">Link para vídeo demonstrativo ou gravação</span>
                                    </div>
                                    <div class="form-field">
                                        <label><i class="fas fa-image"></i> Thumbnail/Capa</label>
                                        <input type="url" id="lp-thumbnailUrl" placeholder="https://example.com/thumbnail.jpg" />
                                        <span class="field-hint">Imagem de capa para visualização</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Avançado -->
                            <div class="form-section" id="advanced-section">
                                <div class="section-header">
                                    <div class="section-icon">🧩</div>
                                    <div class="section-content">
                                        <h3 class="section-title">Avançado</h3>
                                        <p class="section-description">Campos adicionais e metadados</p>
                                    </div>
                                    <div class="section-actions">
                                        <button type="button" id="toggle-advanced-section" class="btn-form btn-secondary-form">
                                            <i class="fas fa-chevron-down"></i> Mostrar/Ocultar
                                        </button>
                                    </div>
                                </div>

                                <div id="advanced-section-content" style="display:none;">
                                    <div class="form-row">
                                        <div class="form-field">
                                            <label><i class="fas fa-layer-group"></i> Unidade (unit)</label>
                                            <input type="text" id="lp-unit" placeholder="Ex: Unidade 1" />
                                            <span class="field-hint">Vincula esta aula a uma unidade do curso</span>
                                        </div>
                                        <div class="form-field">
                                            <label><i class="fas fa-tachometer-alt"></i> Dificuldade (1-5)</label>
                                            <select id="lp-difficulty">
                                                <option value="">Selecione...</option>
                                                <option value="1">1 - Muito Fácil</option>
                                                <option value="2">2 - Fácil</option>
                                                <option value="3">3 - Médio</option>
                                                <option value="4">4 - Difícil</option>
                                                <option value="5">5 - Muito Difícil</option>
                                            </select>
                                            <span class="field-hint">Nível de exigência geral</span>
                                        </div>
                                    </div>

                                    <div class="form-row">
                                        <div class="form-field full-width">
                                            <label><i class="fas fa-clipboard-list"></i> Atividades</label>
                                            <textarea id="lp-activities" rows="4" placeholder="Uma atividade por linha"></textarea>
                                            <span class="field-hint">Lista de atividades planejadas</span>
                                        </div>
                                    </div>

                                    <div class="form-row">
                                        <div class="form-field">
                                            <label><i class="fas fa-chess"></i> Módulo Tático (tacticalModule)</label>
                                            <input type="text" id="lp-tacticalModule" placeholder="Ex: Táticas de defesa em grupo" />
                                            <span class="field-hint">Resumo textual do foco tático</span>
                                        </div>
                                        <div class="form-field">
                                            <label><i class="fas fa-brain"></i> Módulo Mental (mentalModule)</label>
                                            <textarea id="lp-mentalModule" rows="4" placeholder='JSON (ex: {"items":["respiração","foco"]) } ou um item por linha'></textarea>
                                            <span class="field-hint">Aceita JSON ou itens por linha</span>
                                        </div>
                                    </div>

                                    <div class="form-row">
                                        <div class="form-field full-width">
                                            <label><i class="fas fa-tools"></i> Adaptações (adaptations)</label>
                                            <textarea id="lp-adaptations" rows="4" placeholder='JSON (ex: {"items":["turma grande","espaço reduzido"]) } ou um item por linha'></textarea>
                                            <span class="field-hint">Ajustes conforme contexto; aceita JSON ou itens por linha</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Preview Panel -->
                    <div class="editor-sidebar">
                        <div class="preview-card">
                            <div class="preview-header">
                                <h4><i class="fas fa-eye"></i> Preview</h4>
                            </div>
                            <div class="preview-content" id="lesson-preview">
                                <div class="preview-placeholder">
                                    <i class="fas fa-file-alt"></i>
                                    <p>Preencha os campos para ver a prévia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

        bindHeaderActions() {
            const backBtn = this.container.querySelector('#back-to-list-btn');
            if (backBtn) backBtn.addEventListener('click', () => openLessonPlansList(this.container));

            const saveBtn = this.container.querySelector('#save-lesson-plan-btn');
            if (saveBtn) saveBtn.addEventListener('click', () => this.save());
        }

        async loadInitialData() {
            // Load courses first (for select)
            try {
                await this.api.fetchWithStates('/api/courses', {
                    method: 'GET',
                    onSuccess: (data) => {
                        this.courses = data.data || data || [];
                        const sel = this.container.querySelector('#lp-courseId');
                        if (sel) {
                            sel.innerHTML = '<option value="">Selecione...</option>' +
                                this.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                        }
                    },
                    onError: (e) => console.error('Erro ao carregar cursos', e)
                });
            } catch (e) {
                console.error('Erro ao carregar cursos', e);
            }

            // Load model if editing
            if (this.lessonPlanId) {
                try {
                    await this.api.fetchWithStates(`/api/lesson-plans/${this.lessonPlanId}`, {
                        method: 'GET',
                        onSuccess: (data) => {
                            // Accept either wrapped or direct object
                            this.model = data.data || data;
                        },
                        onError: (e) => console.error('Erro ao carregar plano de aula', e)
                    });
                } catch (e) {
                    console.error('Erro ao carregar plano de aula', e);
                }
            }
        }

        fillForm(m) {
            const q = (id) => this.container.querySelector(id);
            q('#lp-title').value = m.title || '';
            q('#lp-courseId').value = m.courseId || '';
            q('#lp-lessonNumber').value = m.lessonNumber ?? '';
            q('#lp-weekNumber').value = m.weekNumber ?? '';
            q('#lp-duration').value = m.duration ?? '';
            q('#lp-level').value = m.level ?? '';
            const diffEl = q('#lp-difficulty');
            if (diffEl) diffEl.value = m.difficulty ?? '';
            const unitEl = q('#lp-unit');
            if (unitEl) unitEl.value = m.unit || '';
            q('#lp-description').value = m.description || '';

            // Arrays/Objects to multiline strings
            const arr = (v) => Array.isArray(v) ? v : (v?.items || []);
            q('#lp-objectives').value = (m.objectives || []).join('\n');
            q('#lp-equipment').value = (m.equipment || []).join('\n');
            q('#lp-warmup').value = arr(m.warmup).join('\n');
            q('#lp-techniques').value = arr(m.techniques).join('\n');
            q('#lp-simulations').value = arr(m.simulations).join('\n');
            q('#lp-cooldown').value = arr(m.cooldown).join('\n');

            // Advanced arrays
            const activitiesEl = q('#lp-activities');
            if (activitiesEl) activitiesEl.value = (m.activities || []).join('\n');

            // Tactical text
            const tacticalEl = q('#lp-tacticalModule');
            if (tacticalEl) tacticalEl.value = m.tacticalModule || '';

            // Helper to format advanced JSON to textarea
            const toTextarea = (val) => {
                if (val == null) return '';
                try {
                    if (typeof val === 'object' && Array.isArray(val.items)) {
                        return val.items.join('\n');
                    }
                    return JSON.stringify(val, null, 2);
                } catch {
                    return '';
                }
            };

            const mentalEl = q('#lp-mentalModule');
            if (mentalEl) mentalEl.value = toTextarea(m.mentalModule);

            const adaptEl = q('#lp-adaptations');
            if (adaptEl) adaptEl.value = toTextarea(m.adaptations);

            q('#lp-videoUrl').value = m.videoUrl || '';
            q('#lp-thumbnailUrl').value = m.thumbnailUrl || '';
        }

        collectForm() {
            const q = (id) => this.container.querySelector(id);
            const splitLines = (v) => v.split('\n').map(s => s.trim()).filter(Boolean);
            const emptyToNull = (v) => (v === '' || v === undefined) ? null : v;

            const model = {
                title: q('#lp-title').value.trim(),
                courseId: q('#lp-courseId').value || null,
                lessonNumber: q('#lp-lessonNumber').value ? Number(q('#lp-lessonNumber').value) : null,
                weekNumber: q('#lp-weekNumber').value ? Number(q('#lp-weekNumber').value) : null,
                duration: q('#lp-duration').value ? Number(q('#lp-duration').value) : null,
                level: q('#lp-level').value ? Number(q('#lp-level').value) : null,
                difficulty: q('#lp-difficulty') && q('#lp-difficulty').value ? Number(q('#lp-difficulty').value) : null,
                unit: emptyToNull(q('#lp-unit')?.value?.trim()),
                description: emptyToNull(q('#lp-description').value.trim()),
                objectives: splitLines(q('#lp-objectives').value),
                equipment: splitLines(q('#lp-equipment').value),
                warmup: { items: splitLines(q('#lp-warmup').value) },
                techniques: { items: splitLines(q('#lp-techniques').value) },
                simulations: { items: splitLines(q('#lp-simulations').value) },
                cooldown: { items: splitLines(q('#lp-cooldown').value) },
                activities: splitLines(q('#lp-activities')?.value || ''),
                tacticalModule: emptyToNull(q('#lp-tacticalModule')?.value?.trim()),
                videoUrl: emptyToNull(q('#lp-videoUrl').value.trim()),
                thumbnailUrl: emptyToNull(q('#lp-thumbnailUrl').value.trim()),
            };

            // Advanced JSON fields (accept JSON or lines)
            const buildJsonField = (text) => {
                const value = (text || '').trim();
                if (!value) return null;
                try {
                    return JSON.parse(value);
                } catch {
                    const lines = value.split('\n').map(s => s.trim()).filter(Boolean);
                    return { items: lines };
                }
            };

            model.mentalModule = buildJsonField(q('#lp-mentalModule')?.value);
            model.adaptations = buildJsonField(q('#lp-adaptations')?.value);

            // Persist activityItems from links mapping if any
            // Backend expects via dedicated endpoints typically, but we'll also include a client-side hint field
            // Note: The primary persistence is through POSTs to /:id/activities after main save (handled in save())
            model._activityItemsClient = this.activityLinks
                .filter(l => l.activityId)
                .map(l => ({ section: l.section, index: l.index, text: l.text, activityId: l.activityId }));
            return model;
        }

        validate(model) {
            const errors = [];
            if (!model.title) errors.push('Título é obrigatório');
            if (!model.courseId) errors.push('Curso é obrigatório');
            if (model.level && (model.level < 1 || model.level > 5)) errors.push('Nível deve estar entre 1 e 5');
            if (model.difficulty && (model.difficulty < 1 || model.difficulty > 5)) errors.push('Dificuldade deve estar entre 1 e 5');
            return errors;
        }

        async save() {
            const payload = this.collectForm();
            const errors = this.validate(payload);
            if (errors.length) {
                window.showBanner(errors.join(' \u2022 '), 'error');
                return;
            }

            const isEdit = !!this.lessonPlanId;
            const url = isEdit ? `/api/lesson-plans/${this.lessonPlanId}` : '/api/lesson-plans';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                let savedPlan = null;
                await this.api.fetchWithStates(url, {
                    method,
                    body: payload,
                    onSuccess: (data) => { savedPlan = data?.data || data; },
                    onError: (e) => {
                        console.error('Erro ao salvar plano de aula', e);
                        window.showBanner('Erro ao salvar plano de aula', 'error');
                    }
                });

                // If save succeeded, sync linked activities via dedicated endpoints
                const planId = savedPlan?.id || this.lessonPlanId;
                if (planId) {
                    await this.syncActivityLinksToServer(planId);
                }

                window.showBanner('Plano de aula salvo com sucesso!', 'success');
                openLessonPlansList(this.container);
            } catch (e) {
                console.error('Erro ao salvar plano de aula', e);
            }
        }

        bindFormEvents() {
            const form = this.container.querySelector('#lesson-plan-form');
            if (!form) return;
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });

            // Toggle advanced section
            const toggleBtn = this.container.querySelector('#toggle-advanced-section');
            const advancedContent = this.container.querySelector('#advanced-section-content');
            if (toggleBtn && advancedContent) {
                toggleBtn.addEventListener('click', () => {
                    const isHidden = advancedContent.style.display === 'none';
                    advancedContent.style.display = isHidden ? 'block' : 'none';
                    toggleBtn.querySelector('i')?.classList.toggle('fa-rotate-180');
                });
            }

            // Keep links UI synced with textarea changes
            const map = [
                { id: '#lp-warmup', section: 'warmup', containerId: '#links-warmup' },
                { id: '#lp-techniques', section: 'techniques', containerId: '#links-techniques' },
                { id: '#lp-simulations', section: 'simulations', containerId: '#links-simulations' },
                { id: '#lp-cooldown', section: 'cooldown', containerId: '#links-cooldown' },
            ];
            map.forEach(({ id, section }) => {
                const el = this.container.querySelector(id);
                if (el) {
                    el.addEventListener('input', () => {
                        this.updateLinksForSection(section, el.value);
                    });
                }
            });
        }

        cleanup() {
            console.log('✅ Lesson Plan editor controller destruído');
        }

        // ==========================
        // Activity Linking - helpers
        // ==========================

        syncLinksFromTextareas() {
            this.activityLinks = [];
            this.updateLinksForSection('warmup', this.container.querySelector('#lp-warmup')?.value || '');
            this.updateLinksForSection('techniques', this.container.querySelector('#lp-techniques')?.value || '');
            this.updateLinksForSection('simulations', this.container.querySelector('#lp-simulations')?.value || '');
            this.updateLinksForSection('cooldown', this.container.querySelector('#lp-cooldown')?.value || '');
        }

        updateLinksForSection(section, textareaValue) {
            const lines = (textareaValue || '').split('\n').map(s => s.trim()).filter(s => s.length > 0);
            // Remove existing links of this section first
            this.activityLinks = this.activityLinks.filter(l => l.section !== section);
            // Re-add mapped items, keeping prior activityId if same text at same index
            lines.forEach((text, index) => {
                const prev = this.activityLinks.find(l => l.section === section && l.index === index && l.text === text);
                this.activityLinks.push({ section, index, text, activityId: prev?.activityId, activity: prev?.activity });
            });
            this.renderLinksChips(section);
        }

        hydrateLinksFromBackend(activityItems) {
            // activityItems: [{ segment, ord, activity: { id, title, ... }}]
            const mapSegment = (s) => (s || '').toString().toLowerCase();
            activityItems.forEach(item => {
                const section = mapSegment(item.segment);
                const index = (item.ord || 1) - 1;
                const text = this.getLineTextBySectionAndIndex(section, index);
                if (text) {
                    this.upsertLink(section, index, text, item.activity?.id, item.activity);
                }
            });
            ['warmup','techniques','simulations','cooldown'].forEach(s => this.renderLinksChips(s));
        }

        getLineTextBySectionAndIndex(section, index) {
            const idMap = {
                warmup: '#lp-warmup',
                techniques: '#lp-techniques',
                simulations: '#lp-simulations',
                cooldown: '#lp-cooldown'
            };
            const el = this.container.querySelector(idMap[section]);
            if (!el) return '';
            const lines = (el.value || '').split('\n').map(s => s.trim()).filter(Boolean);
            return lines[index] || '';
        }

        upsertLink(section, index, text, activityId, activity) {
            const idx = this.activityLinks.findIndex(l => l.section === section && l.index === index);
            const link = { section, index, text, activityId, activity };
            if (idx >= 0) this.activityLinks[idx] = link; else this.activityLinks.push(link);
        }

        renderLinksChips(section) {
            const container = this.container.querySelector(`#links-${section}`);
            if (!container) return;
            const items = this.activityLinks
                .filter(l => l.section === section)
                .sort((a,b) => a.index - b.index);
            container.innerHTML = '';

            if (items.length === 0) {
                container.innerHTML = '<div class="links-empty">Nenhum item. Digite acima para gerar itens vinculáveis.</div>';
                return;
            }

            items.forEach(link => {
                const chip = document.createElement('div');
                chip.className = `activity-chip ${link.activityId ? 'linked' : 'unlinked'}`;
                chip.setAttribute('data-section', section);
                chip.setAttribute('data-index', String(link.index));
                chip.innerHTML = `
                    <span class="chip-index">${link.index + 1}.</span>
                    <span class="chip-text" title="${this.escapeHtml(link.text)}">${this.escapeHtml(link.text)}</span>
                    ${link.activityId ? `
                        <span class="chip-badge">Vinculado</span>
                        <button type="button" class="chip-action open" title="Abrir atividade">Abrir</button>
                        <button type="button" class="chip-action unlink" title="Desvincular">Desvincular</button>
                    ` : `
                        <div class="chip-search">
                            <input type="text" class="chip-input" placeholder="Buscar atividade..." value="${this.escapeHtml(link.text)}" />
                            <div class="chip-suggestions" style="display:none"></div>
                            <button type="button" class="chip-action search" title="Buscar">Buscar</button>
                            <button type="button" class="chip-action create" title="Criar atividade">Criar</button>
                        </div>
                    `}
                `;

                // Wire actions
                if (link.activityId) {
                    chip.querySelector('.chip-action.open')?.addEventListener('click', () => this.openActivity(link.activityId));
                    chip.querySelector('.chip-action.unlink')?.addEventListener('click', () => this.unlinkActivity(section, link.index));
                } else {
                    const input = chip.querySelector('.chip-input');
                    const panel = chip.querySelector('.chip-suggestions');
                    const doSearch = () => this.searchActivities(input.value, (results) => this.renderSuggestions(panel, results, section, link.index, input.value), section);
                    input.addEventListener('input', () => this.debounceSearch(section, link.index, doSearch, 250));
                    chip.querySelector('.chip-action.search')?.addEventListener('click', doSearch);
                    chip.querySelector('.chip-action.create')?.addEventListener('click', async () => {
                        await this.quickCreateActivity(input.value, section, link.index);
                    });
                }

                container.appendChild(chip);
            });
        }

        debounceSearch(section, index, fn, delay) {
            const key = `${section}:${index}`;
            clearTimeout(this._searchTimers[key]);
            this._searchTimers[key] = setTimeout(fn, delay);
        }

        async searchActivities(query, onResults, section = null) {
            if (!query || query.length < 2) {
                onResults([]);
                return;
            }
            const safeResults = (resp) => (resp?.data || resp || []);
            try {
                // Primary search: full query
                let resp = await this.api.fetchWithStates('/api/activities', {
                    method: 'GET',
                    params: { q: query, pageSize: 8 },
                    onSuccess: d => d,
                    onError: () => []
                });
                let list = safeResults(resp);

                // Fallback 1: first token if multi-word
                if ((!list || list.length === 0) && query.includes(' ')) {
                    const token = query.split(/\s+/).filter(Boolean)[0];
                    if (token && token.length >= 2) {
                        resp = await this.api.fetchWithStates('/api/activities', {
                            method: 'GET',
                            params: { q: token, pageSize: 8 },
                            onSuccess: d => d,
                            onError: () => []
                        });
                        list = safeResults(resp);
                    }
                }

                // Fallback 2: suggest by section type (top items)
                if ((!list || list.length === 0) && section) {
                    const typeMap = { warmup: 'EXERCISE', techniques: 'TECHNIQUE', simulations: 'DRILL', cooldown: 'STRETCH' };
                    const type = typeMap[section];
                    if (type) {
                        resp = await this.api.fetchWithStates('/api/activities', {
                            method: 'GET',
                            params: { type, pageSize: 8 },
                            onSuccess: d => d,
                            onError: () => []
                        });
                        list = safeResults(resp);
                    }
                }

                onResults(Array.isArray(list) ? list : []);
            } catch (e) {
                onResults([]);
            }
        }

        renderSuggestions(panel, results, section, index, lastQuery = '') {
            if (!panel) return;
            if (!results || results.length === 0) {
                panel.style.display = 'block';
                const q = this.escapeHtml(lastQuery || '');
                panel.innerHTML = `
                    <div class="suggestion-item" style="opacity:.75">Sem resultados para "${q}"</div>
                    <div class="suggestion-item" data-create="1">
                        <span class="sug-title">Criar atividade "${q}"</span>
                        <span class="sug-meta">Rápido • adiciona e vincula</span>
                    </div>
                `;
                const createEl = panel.querySelector('[data-create]');
                if (createEl) {
                    createEl.addEventListener('click', async () => {
                        await this.quickCreateActivity(lastQuery, section, index);
                    });
                }
                return;
            }
            panel.innerHTML = results.map(r => `
                <div class="suggestion-item" data-id="${r.id}">
                    <span class="sug-title">${this.escapeHtml(r.title)}</span>
                    <span class="sug-meta">${this.escapeHtml(r.type || '')}${r.difficulty ? ` • Dificuldade ${r.difficulty}` : ''}</span>
                </div>
            `).join('');
            panel.style.display = 'block';
            panel.querySelectorAll('.suggestion-item').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.getAttribute('data-id');
                    const title = el.querySelector('.sug-title')?.textContent || '';
                    this.linkActivity(section, index, id, { id, title });
                });
            });
        }

        async quickCreateActivity(title, section, index) {
            const clean = (title || '').trim();
            if (!clean) {
                window.showBanner('Informe um título para criar a atividade', 'error');
                return;
            }
            // Map section to default type hint
            const typeMap = {
                warmup: 'EXERCISE',
                techniques: 'TECHNIQUE',
                simulations: 'DRILL',
                cooldown: 'STRETCH'
            };
            const body = { title: clean, type: typeMap[section] || 'EXERCISE', description: '', equipment: [], adaptations: [] };
            try {
                const created = await this.api.fetchWithStates('/api/activities', {
                    method: 'POST',
                    body,
                    onSuccess: d => d,
                    onError: e => { throw e; }
                });
                const activity = created?.data || created;
                if (activity?.id) {
                    this.linkActivity(section, index, activity.id, activity);
                } else {
                    window.showBanner('Falha ao criar atividade', 'error');
                }
            } catch (e) {
                console.error('Erro ao criar atividade rapidamente', e);
                window.showBanner('Erro ao criar atividade', 'error');
            }
        }

        linkActivity(section, index, activityId, activity) {
            // Update in-memory mapping
            const text = this.getLineTextBySectionAndIndex(section, index);
            this.upsertLink(section, index, text, activityId, activity);
            this.renderLinksChips(section);
        }

        unlinkActivity(section, index) {
            const i = this.activityLinks.findIndex(l => l.section === section && l.index === index);
            if (i >= 0) {
                this.activityLinks[i].activityId = undefined;
                this.activityLinks[i].activity = undefined;
                this.renderLinksChips(section);
            }
        }

        async openActivity(activityId) {
            try {
                if (typeof window.openActivityEditor === 'function') {
                    // Try to keep same container if activities module uses it
                    await window.openActivityEditor(activityId, this.container);
                } else if (window.activitiesModuleReady && window.ActivityEditorController) {
                    const api = window.createModuleAPI('Activities');
                    const ctrl = new window.ActivityEditorController(api);
                    await ctrl.render(this.container, activityId);
                } else {
                    // Fallback: navigate via hash
                    location.hash = `#activities/${activityId}`;
                }
            } catch (e) {
                console.error('Erro abrindo editor de atividade', e);
                window.showBanner('Não foi possível abrir o editor de atividades', 'error');
            }
        }

        async syncActivityLinksToServer(planId) {
            // Only handle links for entries that have an activityId
            const linked = this.activityLinks.filter(l => l.activityId);
            if (linked.length === 0) return;
            // Load existing links to avoid duplicates
            let existing = [];
            try {
                const resp = await this.api.fetchWithStates(`/api/lesson-plans/${planId}/activities`, {
                    method: 'GET',
                    onSuccess: d => d,
                    onError: () => []
                });
                existing = resp?.data || resp || [];
            } catch {}

            const hasLink = (activityId, section) => existing.some(x => x.activityId === activityId &&
                (String(x.segment).toLowerCase() === String(section).toLowerCase()));
            // Create missing links in order by section/index
            const orderMap = { warmup: 1, techniques: 2, simulations: 3, cooldown: 4 };
            const toCreate = linked
                .filter(l => !hasLink(l.activityId, l.section))
                .sort((a,b) => (orderMap[a.section]-orderMap[b.section]) || (a.index - b.index));

            for (const l of toCreate) {
                try {
                    await this.api.fetchWithStates(`/api/lesson-plans/${planId}/activities`, {
                        method: 'POST',
                        body: { activityId: l.activityId, segment: l.section.toUpperCase(), ord: l.index + 1 },
                        onSuccess: () => true,
                        onError: () => false
                    });
                } catch {}
            }
        }

        // Simple HTML escape for safe rendering
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text == null ? '' : String(text);
            return div.innerHTML;
        }
    }

    // ==============================================
    // GLOBAL EXPORTS
    // ==============================================
    
    // Export functions for SPA router
    window.initLessonPlans = initLessonPlans;
    window.openLessonPlansList = openLessonPlansList;
    window.openLessonPlanEditor = openLessonPlanEditor;
    window.initializeLessonPlansModule = initLessonPlans;
    window.LessonPlansListController = LessonPlansListController;
    window.LessonPlanEditorController = LessonPlanEditorController;

})();
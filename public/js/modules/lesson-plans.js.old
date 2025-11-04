/**
 * Lesson Plans Module - Guidelines.MD Compliant
 * Following MVC architecture with proper controller separation
 */
(function() {
    'use strict';
    
    console.log('📚 Lesson Plans Module - Initializing with MVC controllers...');
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines.MD)
    // ==============================================
    
    let lessonPlansAPI = null;
    
    async function initializeAPI() {
        if (!lessonPlansAPI && window.createModuleAPI) {
            lessonPlansAPI = window.createModuleAPI('LessonPlans');
            console.log('🌐 LessonPlans API helper initialized');
        }
    }
    
    // Module state
    let listController = null;
    let editorController = null;
    let isInitialized = false;
    
    // ==============================================
    // EMBEDDED CONTROLLERS (For SPA Compatibility)
    // ==============================================
    
    // Embedded List Controller
    class LessonPlansListController {
        constructor() {
            this.container = null;
            this.currentData = [];
            this.filteredData = [];
            this.pagination = { page: 1, limit: 10, total: 0 };
        }
        
        async init(container) {
            this.container = container;
            await this.render();
            this.bindEvents();
            await this.loadData();
        }
        
        async render() {
            if (!this.container) return;
            
            // Inject CSS for list if not already present
            if (!document.querySelector('link[href*="lesson-plans.css"]')) {
                const listCSS = document.createElement('link');
                listCSS.rel = 'stylesheet';
                listCSS.href = '/css/modules/lesson-plans.css';
                document.head.appendChild(listCSS);
            }
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <!-- Module Header -->
                    <div class="module-header">
                        <div class="header-content">
                            <div class="header-left">
                                <div class="header-title">
                                    <h1 class="module-title">
                                        <span class="title-icon">📚</span>
                                        Planos de Aula
                                    </h1>
                                    <p class="module-subtitle">Gerencie os planos de aula dos cursos</p>
                                </div>
                            </div>
                            <div class="header-actions">
                                <button type="button" class="btn-form btn-primary-form" onclick="openLessonPlanEditor()">
                                    <i class="fas fa-plus"></i>
                                    Novo Plano
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Statistics Cards -->
                    <div class="module-stats">
                        <div class="stat-card">
                            <div class="stat-value" id="totalPlansCount">0</div>
                            <div class="stat-label">Total de Planos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="activeCoursesCount">0</div>
                            <div class="stat-label">Cursos Ativos</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="avgDurationCount">0</div>
                            <div class="stat-label">Duração Média (min)</div>
                        </div>
                    </div>
                    
                    <!-- Filters Section -->
                    <div class="module-filters">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label class="filter-label">Buscar</label>
                                <input type="text" class="filter-input" id="searchInput" placeholder="Buscar por título, descrição...">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Curso</label>
                                <select class="filter-select" id="courseFilter">
                                    <option value="">Todos os cursos</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Nível</label>
                                <select class="filter-select" id="levelFilter">
                                    <option value="">Todos os níveis</option>
                                    <option value="1">Nível 1</option>
                                    <option value="2">Nível 2</option>
                                    <option value="3">Nível 3</option>
                                    <option value="4">Nível 4</option>
                                    <option value="5">Nível 5</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <button type="button" class="btn-form btn-secondary-form" onclick="lessonPlansListController.clearFilters()">
                                    <i class="fas fa-times"></i>
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Content Area -->
                    <div class="module-content">
                        <div class="module-isolated-table">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Plano de Aula</th>
                                        <th>Aula Nº</th>
                                        <th>Semana</th>
                                        <th>Nível</th>
                                        <th>Dificuldade</th>
                                        <th>Duração</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="lessonPlansTableBody">
                                    <!-- Data will be inserted here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="module-pagination">
                            <div class="pagination-info">
                                Mostrando <span id="paginationStart">0</span> a <span id="paginationEnd">0</span> de <span id="paginationTotal">0</span> planos
                            </div>
                            <div class="pagination-controls">
                                <button type="button" class="btn-form btn-secondary-form btn-small" id="prevPageBtn" disabled>
                                    <i class="fas fa-chevron-left"></i>
                                    Anterior
                                </button>
                                <span class="pagination-current">
                                    Página <span id="currentPage">1</span> de <span id="totalPages">1</span>
                                </span>
                                <button type="button" class="btn-form btn-secondary-form btn-small" id="nextPageBtn" disabled>
                                    Próxima
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Loading State -->
                    <div class="loading-state" id="loadingState" style="display: none;">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando planos de aula...</div>
                    </div>
                </div>
            `;
        }
        
        bindEvents() {
            // Search input
            const searchInput = this.container.querySelector('#searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', this.handleSearch.bind(this));
            }
            
            // Filters
            const courseFilter = this.container.querySelector('#courseFilter');
            const levelFilter = this.container.querySelector('#levelFilter');
            
            if (courseFilter) {
                courseFilter.addEventListener('change', this.applyFilters.bind(this));
            }
            
            if (levelFilter) {
                levelFilter.addEventListener('change', this.applyFilters.bind(this));
            }
            
            // Pagination
            const prevBtn = this.container.querySelector('#prevPageBtn');
            const nextBtn = this.container.querySelector('#nextPageBtn');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => this.changePage(this.pagination.page - 1));
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.changePage(this.pagination.page + 1));
            }
        }
        
        async loadData() {
            if (!lessonPlansAPI) await initializeAPI();
            
            this.showLoading(true);
            
            try {
                const result = await lessonPlansAPI.fetchWithStates('/api/lesson-plans', {
                    loadingElement: this.container.querySelector('#loadingState'),
                    successMessage: null // Don't show success message for loading
                });
                
                if (result.success && Array.isArray(result.data)) {
                    this.currentData = result.data;
                    this.filteredData = [...this.currentData];
                    await this.loadCourses();
                    this.updateTable();
                    this.updateStats();
                } else {
                    throw new Error(result.error || 'Erro ao carregar dados');
                }
            } catch (error) {
                console.error('Error loading lesson plans:', error);
                this.showError('Erro ao carregar planos de aula: ' + error.message);
            } finally {
                this.showLoading(false);
            }
        }
        
        async loadCourses() {
            try {
                const result = await lessonPlansAPI.fetchWithStates('/api/courses');
                
                if (result.success && Array.isArray(result.data)) {
                    this.populateCourseFilter(result.data);
                }
            } catch (error) {
                console.error('Error loading courses:', error);
            }
        }
        
        populateCourseFilter(courses) {
            const courseFilter = this.container.querySelector('#courseFilter');
            if (!courseFilter) return;
            
            courseFilter.innerHTML = '<option value="">Todos os cursos</option>';
            
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseFilter.appendChild(option);
            });
        }
        
        handleSearch(event) {
            const searchTerm = event.target.value.toLowerCase().trim();
            this.applyFilters();
        }
        
        applyFilters() {
            const searchTerm = this.container.querySelector('#searchInput')?.value.toLowerCase().trim() || '';
            const courseId = this.container.querySelector('#courseFilter')?.value || '';
            const level = this.container.querySelector('#levelFilter')?.value || '';
            
            this.filteredData = this.currentData.filter(plan => {
                const matchesSearch = !searchTerm || 
                    (plan.title || '').toLowerCase().includes(searchTerm) ||
                    (plan.description || '').toLowerCase().includes(searchTerm);
                
                const matchesCourse = !courseId || plan.courseId === courseId;
                const matchesLevel = !level || String(plan.level) === level;
                
                return matchesSearch && matchesCourse && matchesLevel;
            });
            
            this.pagination.page = 1; // Reset to first page
            this.updateTable();
        }
        
        clearFilters() {
            const searchInput = this.container.querySelector('#searchInput');
            const courseFilter = this.container.querySelector('#courseFilter');
            const levelFilter = this.container.querySelector('#levelFilter');
            
            if (searchInput) searchInput.value = '';
            if (courseFilter) courseFilter.value = '';
            if (levelFilter) levelFilter.value = '';
            
            this.filteredData = [...this.currentData];
            this.pagination.page = 1;
            this.updateTable();
        }
        
        updateTable() {
            const tbody = this.container.querySelector('#lessonPlansTableBody');
            if (!tbody) return;
            
            // Calculate pagination
            const { page, limit } = this.pagination;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const pageData = this.filteredData.slice(startIndex, endIndex);
            
            this.pagination.total = this.filteredData.length;
            
            if (pageData.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-title">Nenhum plano de aula encontrado</div>
                            <div class="empty-subtitle">Comece criando seu primeiro plano de aula</div>
                        </td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = pageData.map(plan => this.renderTableRow(plan)).join('');
            }
            
            this.updatePagination();
        }
        
        renderTableRow(plan) {
            const difficultyStars = '★'.repeat(plan.difficulty || 1) + '☆'.repeat(5 - (plan.difficulty || 1));
            
            return `
                <tr class="table-row" data-plan-id="${plan.id}">
                    <td>
                        <div class="lesson-plan-info">
                            <span class="lesson-title">${plan.title || 'Sem título'}</span>
                            <div class="lesson-course">${plan.course?.name || 'Curso não definido'}</div>
                            <div class="lesson-description">${plan.description || ''}</div>
                        </div>
                    </td>
                    <td>
                        <span class="lesson-number">${plan.lessonNumber || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="week-number">${plan.weekNumber || 'N/A'}</span>
                    </td>
                    <td>
                        <span class="status-badge status-level-${plan.level || 1}">Nível ${plan.level || 1}</span>
                    </td>
                    <td>
                        <div class="difficulty-display">
                            <span class="difficulty-stars" title="Dificuldade: ${plan.difficulty || 1}/5">
                                ${difficultyStars}
                            </span>
                        </div>
                    </td>
                    <td>
                        <span class="duration-display">${plan.duration || 60} min</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button type="button" class="btn-form btn-info-form btn-small" onclick="viewLessonPlan('${plan.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn-form btn-secondary-form btn-small" onclick="openLessonPlanEditor('${plan.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn-form btn-danger-form btn-small" onclick="deleteLessonPlan('${plan.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        updatePagination() {
            const { page, limit, total } = this.pagination;
            const totalPages = Math.ceil(total / limit) || 1;
            const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
            const endItem = Math.min(page * limit, total);
            
            // Update pagination info
            const startSpan = this.container.querySelector('#paginationStart');
            const endSpan = this.container.querySelector('#paginationEnd');
            const totalSpan = this.container.querySelector('#paginationTotal');
            const currentPageSpan = this.container.querySelector('#currentPage');
            const totalPagesSpan = this.container.querySelector('#totalPages');
            
            if (startSpan) startSpan.textContent = startItem;
            if (endSpan) endSpan.textContent = endItem;
            if (totalSpan) totalSpan.textContent = total;
            if (currentPageSpan) currentPageSpan.textContent = page;
            if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
            
            // Update pagination buttons
            const prevBtn = this.container.querySelector('#prevPageBtn');
            const nextBtn = this.container.querySelector('#nextPageBtn');
            
            if (prevBtn) {
                prevBtn.disabled = page <= 1;
            }
            
            if (nextBtn) {
                nextBtn.disabled = page >= totalPages;
            }
        }
        
        changePage(newPage) {
            const totalPages = Math.ceil(this.pagination.total / this.pagination.limit) || 1;
            
            if (newPage >= 1 && newPage <= totalPages) {
                this.pagination.page = newPage;
                this.updateTable();
            }
        }
        
        updateStats() {
            const totalPlans = this.currentData.length;
            const uniqueCourses = new Set(this.currentData.map(p => p.courseId)).size;
            const avgDuration = totalPlans > 0 ? Math.round(
                this.currentData.reduce((sum, p) => sum + (p.duration || 60), 0) / totalPlans
            ) : 0;
            
            const totalPlansEl = this.container.querySelector('#totalPlansCount');
            const activeCoursesEl = this.container.querySelector('#activeCoursesCount');
            const avgDurationEl = this.container.querySelector('#avgDurationCount');
            
            if (totalPlansEl) totalPlansEl.textContent = totalPlans;
            if (activeCoursesEl) activeCoursesEl.textContent = uniqueCourses;
            if (avgDurationEl) avgDurationEl.textContent = avgDuration;
        }
        
        showLoading(show) {
            const loadingEl = this.container.querySelector('#loadingState');
            if (loadingEl) {
                loadingEl.style.display = show ? 'flex' : 'none';
            }
        }
        
        showError(message) {
            console.error('LessonPlans Error:', message);
            // You can implement a toast notification here
            alert(message);
        }
        
        async refresh() {
            await this.loadData();
        }
    }
    
    // ==============================================
    // EMBEDDED EDITOR CONTROLLER
    // ==============================================
    
    // Embedded Editor Controller  
    class LessonPlanEditorController {
        constructor() {
            this.container = null;
            this.planId = null;
            this.planData = null;
            this.isDirty = false;
            this.isReadOnly = false;
        }
        
        async init(container, planId = null, isReadOnly = false) {
            this.container = container;
            this.planId = planId;
            this.isReadOnly = isReadOnly;
            
            await this.render();
            this.bindEvents();
            
            // Load courses first
            await this.loadCourses();
            
            if (planId) {
                await this.loadPlanData();
            } else {
                this.initializeNewPlan();
            }
        }
        
        async render() {
            if (!this.container) return;
            
            // Inject CSS for editor if not already present
            if (!document.querySelector('link[href*="lesson-plans-editor.css"]')) {
                const editorCSS = document.createElement('link');
                editorCSS.rel = 'stylesheet';
                editorCSS.href = '/css/modules/lesson-plans-editor.css';
                document.head.appendChild(editorCSS);
            }
            
            this.container.innerHTML = `
                <div class="module-isolated-container" data-module="lesson-plans">
                    <!-- Editor Header -->
                    <div class="module-header">
                        <div class="header-content">
                            <div class="header-left">
                                <div class="header-title">
                                    <h1 class="module-title">
                                        <span class="title-icon">📚</span>
                                        ${this.planId ? 'Editar Plano de Aula' : 'Novo Plano de Aula'}
                                    </h1>
                                    <p class="module-subtitle" id="plan-subtitle">
                                        ${this.isReadOnly ? 'Visualização apenas' : 'Preencha as informações do plano'}
                                    </p>
                                </div>
                            </div>
                            <div class="header-actions">
                                <button type="button" class="btn-form btn-secondary-form" onclick="cancelLessonPlanEditor()">
                                    <i class="fas fa-arrow-left"></i>
                                    Voltar
                                </button>
                                ${!this.isReadOnly ? `
                                    <button type="button" class="btn-form btn-primary-form" id="save-plan-btn" disabled>
                                        <i class="fas fa-save"></i>
                                        Salvar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Loading State -->
                    <div class="loading-state" id="loadingState" style="display: none;">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Carregando plano de aula...</div>
                    </div>
                    
                    <!-- Form Section -->
                    <div class="module-content">
                        <form id="lesson-plan-form" class="lesson-plan-form">
                            <!-- Basic Information -->
                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-info-circle"></i>
                                    Informações Básicas
                                </h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-course" class="form-label required">
                                            Curso
                                        </label>
                                        <select id="plan-course" name="courseId" class="form-select" required ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="">Selecione o curso</option>
                                        </select>
                                        <div class="form-help">Curso ao qual este plano pertence</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-title" class="form-label required">
                                            Título da Aula
                                        </label>
                                        <input type="text" id="plan-title" name="title" 
                                               class="form-input" required maxlength="100"
                                               placeholder="Ex: Técnicas básicas de defesa"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Nome identificador da aula</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-lesson-number" class="form-label required">
                                            Número da Aula
                                        </label>
                                        <input type="number" id="plan-lesson-number" name="lessonNumber" 
                                               class="form-input" required min="1" max="999"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Sequência da aula no curso</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-week-number" class="form-label required">
                                            Semana
                                        </label>
                                        <input type="number" id="plan-week-number" name="weekNumber" 
                                               class="form-input" required min="1" max="52"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Semana do cronograma</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-level" class="form-label required">
                                            Nível
                                        </label>
                                        <select id="plan-level" name="level" class="form-select" required ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="">Selecione o nível</option>
                                            <option value="1">Nível 1 - Iniciante</option>
                                            <option value="2">Nível 2 - Básico</option>
                                            <option value="3">Nível 3 - Intermediário</option>
                                            <option value="4">Nível 4 - Avançado</option>
                                            <option value="5">Nível 5 - Especialista</option>
                                        </select>
                                        <div class="form-help">Nível de dificuldade da aula</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-duration" class="form-label required">
                                            Duração (minutos)
                                        </label>
                                        <input type="number" id="plan-duration" name="duration" 
                                               class="form-input" required min="15" max="180" value="60"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Tempo estimado da aula</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="plan-description" class="form-label">
                                            Descrição da Aula
                                        </label>
                                        <textarea id="plan-description" name="description" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Descreva brevemente o conteúdo e objetivos da aula..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Resumo do que será trabalhado na aula</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Content Details -->
                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-list-alt"></i>
                                    Conteúdo Programático
                                </h3>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="plan-objectives" class="form-label required">
                                            Objetivos de Aprendizagem
                                        </label>
                                        <textarea id="plan-objectives" name="objectives" 
                                                  class="form-textarea" rows="3" maxlength="500" required
                                                  placeholder="O que os alunos devem aprender nesta aula?"
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">O que os alunos devem aprender</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="plan-techniques" class="form-label">
                                            Técnicas e Movimentos
                                        </label>
                                        <textarea id="plan-techniques" name="techniques" 
                                                  class="form-textarea" rows="4" maxlength="800"
                                                  placeholder="Lista das técnicas que serão ensinadas..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Técnicas específicas da aula</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-difficulty" class="form-label">
                                            Dificuldade (1-5)
                                        </label>
                                        <select id="plan-difficulty" name="difficulty" class="form-select" ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="1">⭐ Muito Fácil</option>
                                            <option value="2">⭐⭐ Fácil</option>
                                            <option value="3">⭐⭐⭐ Médio</option>
                                            <option value="4">⭐⭐⭐⭐ Difícil</option>
                                            <option value="5">⭐⭐⭐⭐⭐ Muito Difícil</option>
                                        </select>
                                        <div class="form-help">Complexidade dos movimentos</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-equipment" class="form-label">
                                            Equipamentos Necessários
                                        </label>
                                        <input type="text" id="plan-equipment" name="equipment" 
                                               class="form-input" maxlength="200"
                                               placeholder="Ex: Luvas, protetor bucal..."
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Materiais e equipamentos</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Structure -->
                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-clock"></i>
                                    Estrutura da Aula
                                </h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-warmup" class="form-label">
                                            Aquecimento (minutos)
                                        </label>
                                        <input type="number" id="plan-warmup" name="warmupDuration" 
                                               class="form-input" min="0" max="30" value="10"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Tempo de aquecimento</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-main-content" class="form-label">
                                            Conteúdo Principal (minutos)
                                        </label>
                                        <input type="number" id="plan-main-content" name="mainContentDuration" 
                                               class="form-input" min="0" max="150" value="40"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Tempo do conteúdo principal</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-cooldown" class="form-label">
                                            Relaxamento (minutos)
                                        </label>
                                        <input type="number" id="plan-cooldown" name="cooldownDuration" 
                                               class="form-input" min="0" max="20" value="10"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Tempo de relaxamento/alongamento</div>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="plan-notes" class="form-label">
                                            Observações para o Instrutor
                                        </label>
                                        <textarea id="plan-notes" name="notes" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Dicas importantes, adaptações, observações especiais..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Anotações adicionais para o instrutor</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Form Actions -->
                            ${!this.isReadOnly ? `
                                <div class="form-actions">
                                    <div class="form-status">
                                        <span id="save-status" class="save-status"></span>
                                    </div>
                                    <div class="action-buttons">
                                        <button type="button" id="cancel-form-btn" class="btn-form btn-secondary-form">
                                            <i class="fas fa-times"></i>
                                            Cancelar
                                        </button>
                                        <button type="submit" id="submit-form-btn" class="btn-form btn-primary-form" disabled>
                                            <i class="fas fa-save"></i>
                                            ${this.planId ? 'Atualizar Plano' : 'Criar Plano'}
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="form-actions">
                                    <div class="action-buttons">
                                        <button type="button" onclick="cancelLessonPlanEditor()" class="btn-form btn-secondary-form">
                                            <i class="fas fa-arrow-left"></i>
                                            Voltar à Lista
                                        </button>
                                        <button type="button" onclick="openLessonPlanEditor('${this.planId}')" class="btn-form btn-primary-form">
                                            <i class="fas fa-edit"></i>
                                            Editar Plano
                                        </button>
                                    </div>
                                </div>
                            `}
                        </form>
                    </div>
                </div>
            `;
        }
        
        bindEvents() {
            if (this.isReadOnly) return;
            
            // Form submission
            const form = this.container.querySelector('#lesson-plan-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSave();
                });
            }
            
            // Save button
            const saveBtn = this.container.querySelector('#save-plan-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.handleSave());
            }
            
            // Cancel button
            const cancelBtn = this.container.querySelector('#cancel-form-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => window.cancelLessonPlanEditor());
            }
            
            // Form input changes for validation and dirty state
            const inputs = this.container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.handleInputChange());
                input.addEventListener('change', () => this.handleInputChange());
            });
            
            // Real-time validation
            this.setupValidation();
        }
        
        async loadCourses() {
            if (!lessonPlansAPI) await initializeAPI();
            
            try {
                const result = await lessonPlansAPI.fetchWithStates('/api/courses');
                
                if (result.success && Array.isArray(result.data)) {
                    this.populateCourseDropdown(result.data);
                }
            } catch (error) {
                console.error('Error loading courses:', error);
            }
        }
        
        populateCourseDropdown(courses) {
            const courseSelect = this.container.querySelector('#plan-course');
            if (!courseSelect) return;
            
            courseSelect.innerHTML = '<option value="">Selecione o curso</option>';
            
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        }
        
        async loadPlanData() {
            if (!this.planId || !lessonPlansAPI) return;
            
            this.showLoading(true);
            
            try {
                const result = await lessonPlansAPI.fetchWithStates(`/api/lesson-plans/${this.planId}`, {
                    loadingElement: this.container.querySelector('#loadingState'),
                    successMessage: null
                });
                
                if (result.success && result.data) {
                    this.planData = result.data;
                    console.log('📋 Loaded plan data:', this.planData);
                    console.log('🎓 Plan courseId:', this.planData.courseId);
                    this.populateForm();
                    this.updateSubtitle();
                } else {
                    throw new Error(result.error || 'Erro ao carregar dados do plano');
                }
            } catch (error) {
                console.error('Error loading lesson plan:', error);
                this.showError('Erro ao carregar plano de aula: ' + error.message);
            } finally {
                this.showLoading(false);
            }
        }
        
        initializeNewPlan() {
            this.planData = {
                title: '',
                description: '',
                courseId: '',
                lessonNumber: 1,
                weekNumber: 1,
                level: 1,
                duration: 60,
                difficulty: 3,
                objectives: '',
                techniques: '',
                equipment: '',
                warmupDuration: 10,
                mainContentDuration: 40,
                cooldownDuration: 10,
                notes: ''
            };
            
            this.populateForm();
            this.isDirty = false;
        }
        
        populateForm() {
            if (!this.planData) return;
            
            const form = this.container.querySelector('#lesson-plan-form');
            if (!form) return;
            
            console.log('📝 Populating form with data:', this.planData);
            
            // Populate all form fields
            Object.keys(this.planData).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && this.planData[key] !== null && this.planData[key] !== undefined) {
                    field.value = this.planData[key];
                    console.log(`✅ Set ${key} = ${this.planData[key]}`);
                } else if (field) {
                    console.log(`⚠️ Field ${key} found but value is null/undefined:`, this.planData[key]);
                } else {
                    console.log(`❌ Field not found for ${key}`);
                }
            });
            
            // Special handling for courseId
            const courseField = form.querySelector('[name="courseId"]');
            if (courseField && this.planData.courseId) {
                console.log('🎓 Setting courseId specifically:', this.planData.courseId);
                courseField.value = this.planData.courseId;
                
                // Verify it was set
                setTimeout(() => {
                    console.log('🔍 Course field value after set:', courseField.value);
                    console.log('🔍 Available options:', Array.from(courseField.options).map(opt => ({value: opt.value, text: opt.text})));
                }, 100);
            }
            
            this.isDirty = false;
            this.validateForm();
        }
        
        updateSubtitle() {
            if (this.planData && this.planData.title) {
                const subtitle = this.container.querySelector('#plan-subtitle');
                if (subtitle) {
                    subtitle.textContent = this.planData.title;
                }
            }
        }
        
        handleInputChange() {
            this.isDirty = true;
            this.validateForm();
            this.updateSaveStatus('Alterações não salvas', 'warning');
        }
        
        setupValidation() {
            const requiredFields = this.container.querySelectorAll('input[required], select[required], textarea[required]');
            
            requiredFields.forEach(field => {
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
            });
        }
        
        validateField(field) {
            const value = field.value.trim();
            const isValid = field.checkValidity() && value.length > 0;
            
            // Remove existing validation classes
            field.classList.remove('field-valid', 'field-invalid');
            
            // Add appropriate class
            if (value.length > 0) {
                field.classList.add(isValid ? 'field-valid' : 'field-invalid');
            }
            
            return isValid;
        }
        
        validateForm() {
            const form = this.container.querySelector('#lesson-plan-form');
            if (!form) return false;

            const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;

            // Validate all required fields
            requiredFields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            // Special validation for courseId
            const courseSelect = form.querySelector('#plan-course');
            if (courseSelect && (!courseSelect.value || courseSelect.value.trim() === '')) {
                console.error('❌ Course not selected');
                courseSelect.classList.add('field-invalid');
                isValid = false;
            } else if (courseSelect && courseSelect.value.trim() !== '') {
                courseSelect.classList.remove('field-invalid');
                courseSelect.classList.add('field-valid');
            }

            // Update save button state
            const saveBtn = this.container.querySelector('#save-plan-btn');
            const submitBtn = this.container.querySelector('#submit-form-btn');

            if (saveBtn) saveBtn.disabled = !isValid || !this.isDirty;
            if (submitBtn) submitBtn.disabled = !isValid;

            return isValid;
        }
        
        async handleSave() {
            if (!this.validateForm()) {
                this.updateSaveStatus('Corrija os erros do formulário', 'error');
                return;
            }
            
            if (!lessonPlansAPI) await initializeAPI();
            
            this.updateSaveStatus('Salvando...', 'info');
            
            try {
                const formData = this.getFormData();
                const method = this.planId ? 'PUT' : 'POST';
                const url = this.planId ? `/api/lesson-plans/${this.planId}` : '/api/lesson-plans';
                
                const result = await lessonPlansAPI.saveWithFeedback(url, formData, {
                    method: method,
                    successMessage: this.planId ? 'Plano de aula atualizado com sucesso!' : 'Plano de aula criado com sucesso!',
                    errorMessage: 'Erro ao salvar plano de aula'
                });
                
                if (result.success) {
                    this.planData = result.data;
                    this.planId = result.data.id;
                    this.isDirty = false;
                    this.updateSaveStatus('Salvo com sucesso', 'success');
                    this.updateSubtitle();
                    
                    // Update header if it was a new plan
                    if (!this.planId) {
                        const title = this.container.querySelector('.module-title');
                        if (title) {
                            title.innerHTML = '<span class="title-icon">📚</span> Editar Plano de Aula';
                        }
                    }
                } else {
                    throw new Error(result.error || 'Erro ao salvar');
                }
            } catch (error) {
                console.error('Error saving lesson plan:', error);
                this.updateSaveStatus('Erro ao salvar: ' + error.message, 'error');
            }
        }
        
        getFormData() {
            const form = this.container.querySelector('#lesson-plan-form');
            if (!form) return {};
            
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                // Convert number fields
                if (['lessonNumber', 'weekNumber', 'level', 'duration', 'difficulty', 'warmupDuration', 'mainContentDuration', 'cooldownDuration'].includes(key)) {
                    data[key] = parseInt(value) || 0;
                }
                // Convert array fields (split by lines and filter empty)
                else if (['objectives', 'equipment', 'activities'].includes(key)) {
                    data[key] = value.trim() ? value.split('\n').map(item => item.trim()).filter(item => item.length > 0) : [];
                }
                // Convert techniques field to array if present
                else if (key === 'techniques') {
                    data[key] = value.trim() ? value.split('\n').map(item => item.trim()).filter(item => item.length > 0) : [];
                }
                // Handle courseId specifically - must not be empty
                else if (key === 'courseId') {
                    const trimmedValue = value.trim();
                    if (!trimmedValue) {
                        console.error('❌ Course ID is empty - this should not happen');
                        throw new Error('Curso é obrigatório. Por favor, selecione um curso.');
                    }
                    data[key] = trimmedValue;
                }
                // Handle URL fields - convert empty strings to undefined
                else if (['videoUrl', 'thumbnailUrl'].includes(key)) {
                    const trimmedValue = value.trim();
                    if (trimmedValue) {
                        data[key] = trimmedValue;
                    }
                    // Don't include empty URL fields
                }
                else {
                    data[key] = value.trim();
                }
            }
            
            // Debug: log the collected data, especially courseId
            console.log('📋 Form data collected:', data);
            console.log('🎓 Course ID:', data.courseId);
            
            return data;
        }
        
        updateSaveStatus(message, type = 'info') {
            const statusEl = this.container.querySelector('#save-status');
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.className = `save-status save-status-${type}`;
                
                // Clear success/error messages after a delay
                if (type === 'success' || type === 'error') {
                    setTimeout(() => {
                        statusEl.textContent = '';
                        statusEl.className = 'save-status';
                    }, 3000);
                }
            }
        }
        
        showLoading(show) {
            const loadingEl = this.container.querySelector('#loadingState');
            if (loadingEl) {
                loadingEl.style.display = show ? 'flex' : 'none';
            }
        }
        
        showError(message) {
            console.error('LessonPlan Editor Error:', message);
            alert(message);
        }
        
        destroy() {
            // Cleanup any event listeners or intervals
            console.log('🧹 Lesson Plan Editor Controller destroyed');
        }
    }
    
    // ==============================================
    // MAIN MODULE FUNCTIONS
    // ==============================================
    
    // Global Functions for SPA Integration
    window.openLessonPlansList = function() {
        console.log('📋 Opening lesson plans list...');
        
        const container = document.getElementById('lessonPlansContainer') ||
                         document.querySelector('.lesson-plans-container') ||
                         document.querySelector('.lesson-plans-isolated');
        
        if (container) {
            // CLEAR CONTAINER COMPLETELY
            container.innerHTML = '';
            
            // Clear any existing editor
            if (editorController) {
                editorController.destroy();
                editorController = null;
            }
            
            // Initialize or reuse list controller
            if (!listController) {
                listController = new LessonPlansListController();
            }
            
            listController.init(container);
            
            // Store reference globally for access
            window.lessonPlansListController = listController;
        }
    };
    
    window.openLessonPlanEditor = function(lessonPlanId = null, isReadOnly = false) {
        console.log('✏️ Opening lesson plan editor for:', lessonPlanId || 'new', isReadOnly ? '(read-only)' : '');
        
        const container = document.getElementById('lessonPlansContainer') ||
                         document.querySelector('.lesson-plans-container') ||
                         document.querySelector('.lesson-plans-isolated');
        
        console.log('📦 Container found:', container ? 'Yes' : 'No', container);
        
        if (container) {
            // CLEAR CONTAINER COMPLETELY
            container.innerHTML = '';
            
            // Clear any existing list controller
            if (listController) {
                window.lessonPlansListController = null;
                listController = null;
            }
            
            console.log('🔄 Creating new editor controller...');
            // Create new editor controller
            editorController = new LessonPlanEditorController();
            editorController.init(container, lessonPlanId, isReadOnly);
        } else {
            console.error('❌ Container not found for lesson plan editor');
        }
    };
    
    window.cancelLessonPlanEditor = function() {
        console.log('❌ Canceling lesson plan editor...');
        
        if (editorController && editorController.isDirty) {
            if (!confirm('Há alterações não salvas. Deseja descartar as alterações?')) {
                return;
            }
        }
        
        // Return to list
        window.openLessonPlansList();
    };
    
    window.viewLessonPlan = function(id) {
        console.log('👁️ Viewing lesson plan:', id);
        window.openLessonPlanEditor(id, true); // Read-only mode
    };
    
    window.deleteLessonPlan = async function(id) {
        console.log('🗑️ Deleting lesson plan:', id);
        
        if (!confirm('Tem certeza que deseja excluir este plano de aula?')) {
            return;
        }
        
        if (!lessonPlansAPI) await initializeAPI();
        
        try {
            const result = await lessonPlansAPI.saveWithFeedback(`/api/lesson-plans/${id}`, null, {
                method: 'DELETE',
                successMessage: 'Plano de aula excluído com sucesso!',
                errorMessage: 'Erro ao excluir plano de aula'
            });
            
            if (result.success && listController) {
                await listController.refresh();
            }
        } catch (error) {
            console.error('Error deleting lesson plan:', error);
        }
    };
    
    // Module initialization
    async function initLessonPlans() {
        console.log('🔧 Initializing Lesson Plans Module...');
        
        if (isInitialized) {
            console.log('ℹ️ Lesson Plans module already initialized');
            return;
        }
        
        try {
            await initializeAPI();
            
            // Check if we should auto-open the list
            const container = document.getElementById('lessonPlansContainer') ||
                             document.querySelector('.lesson-plans-container') ||
                             document.querySelector('.lesson-plans-isolated');
            
            if (container) {
                // Clear container and open only the list
                container.innerHTML = '';
                await window.openLessonPlansList();
                isInitialized = true;
                console.log('✅ Lesson Plans Module initialized successfully');
            }
        } catch (error) {
            console.error('❌ Error initializing lesson plans module:', error);
        }
    }
    
    // Export for SPA compatibility
    window.initLessonPlans = initLessonPlans;
    window.initializeLessonPlansModule = initLessonPlans; // SPA router compatibility
    window.lessonPlansListController = null; // Will be set when created
    
    // Legacy compatibility for old HTML templates
    window.lessonPlansModule = {
        hideCreateModal: function() {
            console.log('📝 Hide create modal (legacy compatibility)');
            window.cancelLessonPlanEditor();
        },
        hideEditModal: function() {
            console.log('📝 Hide edit modal (legacy compatibility)');
            window.cancelLessonPlanEditor();
        },
        showCreateModal: function() {
            console.log('📝 Show create modal (legacy compatibility)');
            window.openLessonPlanEditor();
        },
        showEditModal: function(id) {
            console.log('📝 Show edit modal (legacy compatibility)', id);
            window.openLessonPlanEditor(id);
        }
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('lessonPlansContainer') ||
                             document.querySelector('.lesson-plans-container') ||
                             document.querySelector('.lesson-plans-isolated');
            if (container) {
                initLessonPlans();
            }
        });
    } else {
        const container = document.getElementById('lessonPlansContainer') ||
                         document.querySelector('.lesson-plans-container') ||
                         document.querySelector('.lesson-plans-isolated');
        if (container) {
            initLessonPlans();
        }
    }
    
    // Listen for SPA navigation
    window.addEventListener('hashchange', () => {
        if (!isInitialized) {
            const container = document.getElementById('lessonPlansContainer') ||
                             document.querySelector('.lesson-plans-container') ||
                             document.querySelector('.lesson-plans-isolated');
            if (container) {
                initLessonPlans();
            }
        }
    });
})();

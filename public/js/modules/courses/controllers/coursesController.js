// Courses List Controller - AGENTS.md v2.0 Compliant
// Handles courses listing and navigation with premium UI

class CoursesController {
    constructor() {
        this.moduleAPI = null;
        this.isInitialized = false;
        this.allCourses = []; // Store all courses for filtering
        this.currentFilters = {
            search: '',
            status: 'all',
            category: 'all'
        };
        this.currentView = localStorage.getItem('courses-view-preference') || 'grid';
        this.sortConfig = {
            column: null,
            direction: 'asc'
        };
        this.init();
    }

    async init() {
        try {
            console.log('📚 [Courses] Initializing controller...');
            
            // AGENTS.md: Esperar DOM estar pronto ANTES de inicializar
            await this.waitForDOM();
            console.log('📚 [Courses] DOM ready');
            
            // AGENTS.md: Wait for API client and create module API
            await this.waitForAPIClient();
            this.moduleAPI = window.createModuleAPI('Courses');
            
            if (!this.moduleAPI) {
                throw new Error('Failed to initialize Courses API client');
            }

            this.setupEventListeners();
            await this.loadCourses();
            this.isInitialized = true;

            // AGENTS.md: Dispatch module loaded event
            window.app?.dispatchEvent('module:loaded', { 
                name: 'courses-controller',
                controller: this 
            });
            
            console.log('✅ [Courses] Controller initialized successfully');

        } catch (error) {
            console.error('❌ [Courses] Initialization error:', error);
            window.app?.handleError(error, 'Initializing courses controller');
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            // Verificar se elemento crítico já existe
            const checkElement = document.getElementById('coursesGrid');
            if (checkElement) {
                console.log('📚 [Courses] coursesGrid found immediately');
                resolve();
                return;
            }
            
            console.log('📚 [Courses] Waiting for coursesGrid element...');
            
            // Observer para detectar quando elemento for adicionado
            const observer = new MutationObserver(() => {
                const element = document.getElementById('coursesGrid');
                if (element) {
                    console.log('📚 [Courses] coursesGrid found via observer');
                    observer.disconnect();
                    resolve();
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Timeout de segurança (5 segundos)
            setTimeout(() => {
                console.warn('⚠️ [Courses] Timeout waiting for coursesGrid, proceeding anyway');
                observer.disconnect();
                resolve();
            }, 5000);
        });
    }

    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) {
                resolve();
                return;
            }
            
            const checkAPI = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    setupEventListeners() {
        // Handle "Novo Curso" button clicks
        document.querySelectorAll('[data-action="openNewCourseForm"]').forEach(button => {
            button.addEventListener('click', () => {
                this.navigateToCourseForm();
            });
        });

        // Handle course row single clicks for course details
        document.addEventListener('click', (event) => {
            const courseRow = event.target.closest('.course-row');
            if (courseRow && !event.target.closest('.course-actions')) {
                const courseId = courseRow.dataset.courseId;
                this.navigateToCourseDetails(courseId);
            }
        });

        // Handle course row double-clicks for editing
        document.addEventListener('dblclick', (event) => {
            const courseRow = event.target.closest('.course-row');
            if (courseRow) {
                const courseId = courseRow.dataset.courseId;
                this.navigateToCourseForm(courseId);
            }
        });

        // Handle import course
        document.getElementById('importCourseBtn')?.addEventListener('click', () => {
            document.getElementById('importCourseFile').click();
        });

        document.getElementById('importCourseFile')?.addEventListener('change', (e) => this.handleCourseImport(e));

        // Handle generate with AI
        document.getElementById('generateWithAIBtn')?.addEventListener('click', () => this.generateCourseWithAI());

        // Setup filters (QUICK WIN #1)
        this.setupFilters();

        // Setup view toggle (QUICK WIN #2)
        this.setupViewToggle();

        // Setup table sorting (QUICK WIN #3)
        this.setupTableSort();
    }

    async loadCourses() {
        try {
            console.log('📚 loadCourses() called');
            
            // Show loading state
            const loadingState = document.getElementById('loadingState');
            const emptyState = document.getElementById('emptyState');
            const coursesContainer = document.getElementById('coursesContainer');
            
            if (loadingState) loadingState.style.display = 'flex';
            if (emptyState) emptyState.style.display = 'none';
            if (coursesContainer) coursesContainer.style.display = 'none';
            
            // AGENTS.md: Use fetchWithStates pattern
            await this.moduleAPI.fetchWithStates('/api/courses', {
                onSuccess: (data) => {
                    console.log('📚 Courses data received:', data);
                    // Extract courses array from response
                    const courses = data.data || data || [];
                    console.log('📚 Courses array:', courses.length, 'courses');
                    
                    // Store all courses for filtering
                    this.allCourses = courses;
                    
                    // Hide loading
                    if (loadingState) loadingState.style.display = 'none';
                    
                    if (courses.length === 0) {
                        if (emptyState) emptyState.style.display = 'block';
                        if (coursesContainer) coursesContainer.style.display = 'none';
                    } else {
                        if (emptyState) emptyState.style.display = 'none';
                        if (coursesContainer) coursesContainer.style.display = 'block';
                        
                        // Apply filters and render
                        this.applyFilters();
                        this.updateStats(courses);
                        
                        // Apply saved view preference
                        this.switchView(this.currentView, false);
                    }
                },
                onEmpty: () => {
                    console.log('📭 No courses found');
                    if (loadingState) loadingState.style.display = 'none';
                    if (emptyState) emptyState.style.display = 'block';
                    if (coursesContainer) coursesContainer.style.display = 'none';
                },
                onError: (error) => {
                    console.error('❌ Error loading courses:', error);
                    if (loadingState) loadingState.style.display = 'none';
                    window.app?.handleError(error, "Carregando cursos");
                }
            });
        } catch (error) {
            console.error('❌ Exception loading courses:', error);
            const loadingState = document.getElementById('loadingState');
            if (loadingState) loadingState.style.display = 'none';
            window.app?.handleError(error, "Carregando cursos");
        }
    }

    renderCourses(courses) {
        console.log('🎨 Rendering', courses.length, 'courses');
        
        // Render in grid view (default)
        const gridContainer = document.getElementById('coursesGrid');
        
        if (gridContainer) {
            console.log('📦 Rendering grid view');
            gridContainer.innerHTML = courses.map(course => `
                <div class="course-card" data-course-id="${course.id}" data-course-name="${this.escapeHtml(course.name)}" onclick="window.coursesController.navigateToCourseDetails('${course.id}')">
                    <div class="course-image">
                        <img src="${course.imageUrl || '/assets/images/course-placeholder.jpg'}" alt="${this.escapeHtml(course.name)}" onerror="this.src='https://placehold.co/600x400?text=Curso'">
                        <span class="course-badge ${course.isActive ? 'badge-active' : 'badge-inactive'}">
                            ${course.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div class="course-content">
                        <h3 class="course-title">${course.name}</h3>
                        <p class="course-description">${course.description || 'Sem descrição disponível.'}</p>
                        
                        <div class="course-meta">
                            <span>📅 ${course.duration || 'N/A'}</span>
                            <span>📚 ${course.totalLessons || 0} aulas</span>
                            <span>🎯 ${course.level || 'Geral'}</span>
                        </div>

                        <div class="course-actions" style="margin-top: var(--spacing-md); display: flex; gap: var(--spacing-sm);">
                            <button class="btn-premium-primary" onclick="event.stopPropagation(); window.coursesController.navigateToCourseForm('${course.id}')" style="flex: 1; justify-content: center;">
                                ✏️ Editar
                            </button>
                            <button class="btn-premium-primary" onclick="event.stopPropagation(); window.coursesController.deleteCourseFromCard(this)" style="flex: 1; justify-content: center; color: #ef4444; background: #fef2f2;">
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            console.log('✅ Grid view rendered');
        } else {
            console.error('❌ coursesGrid element not found!');
        }
        
        // Also render in table view (hidden by default)
        const tableBody = document.getElementById('coursesTableBody');
        if (tableBody) {
            tableBody.innerHTML = courses.map(course => `
                <div class="table-row" data-course-id="${course.id}" data-course-name="${this.escapeHtml(course.name)}">
                    <div class="table-cell">
                        <div style="font-weight: 600;">${course.name}</div>
                        <div style="font-size: 0.8em; color: var(--color-text-muted);">${course.level || 'Geral'}</div>
                    </div>
                    <div class="table-cell">${course.duration || '-'}</div>
                    <div class="table-cell">
                        <span class="badge ${course.isActive ? 'badge-success' : 'badge-secondary'}">
                            ${course.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div class="table-cell" style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-secondary" onclick="window.coursesController.navigateToCourseForm('${course.id}')">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.coursesController.deleteCourseFromCard(this)">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    updateStats(courses) {
        console.log('📊 Updating stats for', courses.length, 'courses');
        const totalCourses = courses.length;
        const activeCourses = courses.filter(c => c.isActive === true).length;
        const inactiveCourses = totalCourses - activeCourses;

        // Count unique levels as categories
        const categories = new Set(courses.map(c => c.level).filter(Boolean)).size;

        // AGENTS.md: Update premium stats cards
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
                console.log(`📊 Updated ${id}:`, value);
            } else {
                console.warn(`⚠️ Element #${id} not found`);
            }
        };

        updateElement('totalCourses', totalCourses);
        updateElement('activeCourses', activeCourses);
        updateElement('inactiveCourses', inactiveCourses);
        updateElement('categoriesCount', categories);
    }

    showEmptyState() {
        const container = document.getElementById('coursesTable');
        if (!container) return;

        // AGENTS.md: Premium empty state
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Nenhum curso encontrado</h3>
                <p>Comece criando seu primeiro curso</p>
                <button class="btn-premium-primary" data-action="openNewCourseForm">
                    ➕ Criar Primeiro Curso
                </button>
            </div>
        `;
    }

    navigateToCourseForm(courseId = null) {
        if (courseId) {
            // Navigate to course editor with ID
            window.location.hash = `course-editor/${courseId}`;
        } else {
            // Navigate to course editor for new course
            window.location.hash = 'course-editor';
        }
    }

    navigateToCourseDetails(courseId) {
        if (!courseId) {
            console.error('Course ID required for details navigation');
            return;
        }
        // Navigate to course details view
        window.location.hash = `course-details/${courseId}`;
    }

    // Helper to escape HTML in attributes
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Delete course from card - extracts data from DOM
    deleteCourseFromCard(button) {
        const card = button.closest('[data-course-id]');
        if (!card) {
            console.error('❌ Could not find course card');
            return;
        }
        
        const courseId = card.dataset.courseId;
        const courseName = card.dataset.courseName;
        
        console.log('🗑️ Delete course from card:', { courseId, courseName });
        this.showDeleteModal(courseId, courseName);
    }

    // Modal management for delete confirmation
    showDeleteModal(courseId, courseName) {
        console.log('✅ showDeleteModal called:', { courseId, courseName });
        this.courseToDelete = { id: courseId, name: courseName };
        
        const modal = document.getElementById('deleteCourseModal');
        const nameDisplay = document.getElementById('deleteCourseNameDisplay');
        
        console.log('🔍 Modal element:', modal);
        console.log('🔍 Name display element:', nameDisplay);
        
        if (nameDisplay) {
            nameDisplay.textContent = courseName;
            console.log('✅ Course name set in modal:', courseName);
        }
        
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Modal display set to flex');
        } else {
            console.error('❌ Modal element not found!');
        }
    }

    cancelDelete() {
        this.courseToDelete = null;
        const modal = document.getElementById('deleteCourseModal');
        if (modal) modal.style.display = 'none';
        
        // Reset button state
        const btn = document.getElementById('confirmDeleteBtn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🗑️ Confirmar Exclusão';
        }
    }

    async confirmDelete() {
        if (!this.courseToDelete) return;
        
        const { id, name } = this.courseToDelete;
        
        console.log('🗑️ Confirming delete for:', { id, name });
        
        try {
            // Show loading on button
            const btn = document.getElementById('confirmDeleteBtn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Excluindo...';
            }
            
            // AGENTS.md: Use moduleAPI.api.delete() for DELETE requests
            console.log('🗑️ Calling DELETE /api/courses/' + id);
            const result = await this.moduleAPI.api.delete(`/api/courses/${id}`);
            
            console.log('✅ Delete response:', result);
            
            // Close modal
            this.cancelDelete();
            
            // Show success banner
            if (window.app?.showBanner) {
                window.app.showBanner(`✅ Curso "${name}" excluído com sucesso!`, 'success');
            }
            
            // Reload courses
            await this.loadCourses();
            
            // Dispatch event
            window.app?.dispatchEvent('course:deleted', { courseId: id, courseName: name });
            
        } catch (error) {
            console.error('❌ Delete error:', error);
            this.cancelDelete();
            window.app?.handleError(error, `Excluindo curso "${name}"`);
        }
    }

    // Legacy method for backward compatibility
    async deleteCourse(courseId, courseName = 'curso') {
        // Redirect to modal-based deletion
        this.showDeleteModal(courseId, courseName);
    }

    async handleCourseImport(event) {
        // Redirecionar para o módulo de importação
        if (window.router) {
            window.router.navigate('import');
            
            // Disparar evento para mudar para a tab de cursos
            setTimeout(() => {
                const coursesTab = document.querySelector('.tab-btn[data-tab="courses"]');
                if (coursesTab) coursesTab.click();
            }, 500);
        } else {
            alert('Por favor, use o menu "Importação" na barra lateral para importar cursos.');
        }
    }

    async generateCourseWithAI() {
        // AGENTS.md: AI integration dispatch event
        window.app?.dispatchEvent('course:generate-ai');
        // For now, just navigate to form
        this.navigateToCourseForm();
    }

    // ============================================
    // QUICK WIN #1: FILTROS
    // ============================================

    /**
     * Setup filters - search, status, category
     */
    setupFilters() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const clearBtn = document.getElementById('clearFiltersBtn');

        // Search with debounce
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.currentFilters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
                console.log('🔍 Search filter applied:', this.currentFilters.search);
            }, 300));
        }

        // Status filter
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
                console.log('📊 Status filter applied:', this.currentFilters.status);
            });
        }

        // Category filter
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
                console.log('🎯 Category filter applied:', this.currentFilters.category);
            });
        }

        // Clear filters button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }
    }

    /**
     * Apply all active filters
     */
    applyFilters() {
        let filtered = [...this.allCourses];

        // Search filter (name or description)
        if (this.currentFilters.search) {
            filtered = filtered.filter(course => {
                const searchTerm = this.currentFilters.search;
                return (
                    course.name.toLowerCase().includes(searchTerm) ||
                    course.description?.toLowerCase().includes(searchTerm) ||
                    course.category?.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Status filter
        if (this.currentFilters.status !== 'all') {
            const isActive = this.currentFilters.status === 'ACTIVE';
            filtered = filtered.filter(course => course.isActive === isActive);
        }

        // Category filter (level)
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(course => course.level === this.currentFilters.category);
        }

        console.log(`📚 Filtered: ${filtered.length}/${this.allCourses.length} courses`);

        // Render filtered results
        this.renderCourses(filtered);
        this.updateStats(filtered);

        // Show empty state if no results
        const emptyState = document.getElementById('emptyState');
        const coursesContainer = document.getElementById('coursesContainer');
        if (filtered.length === 0) {
            if (coursesContainer) coursesContainer.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'flex';
                emptyState.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>Nenhum curso encontrado</h3>
                        <p>Tente ajustar os filtros ou limpar a busca.</p>
                        <button class="btn btn-secondary" onclick="window.coursesController.clearFilters()">
                            🔄 Limpar Filtros
                        </button>
                    </div>
                `;
            }
        } else {
            if (coursesContainer) coursesContainer.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {
            search: '',
            status: 'all',
            category: 'all'
        };

        // Reset UI
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (categoryFilter) categoryFilter.value = 'all';

        console.log('🔄 Filters cleared');
        this.applyFilters();
    }

    /**
     * Debounce helper for search input
     */
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

    // ============================================
    // QUICK WIN #2: VIEW TOGGLE
    // ============================================

    /**
     * Setup view toggle buttons (grid ↔ table)
     */
    setupViewToggle() {
        const gridBtn = document.getElementById('gridViewBtn');
        const tableBtn = document.getElementById('tableViewBtn');

        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                this.switchView('grid');
            });
        }

        if (tableBtn) {
            tableBtn.addEventListener('click', () => {
                this.switchView('table');
            });
        }
    }

    /**
     * Switch between grid and table views
     * @param {string} view - 'grid' or 'table'
     * @param {boolean} savePreference - Save to localStorage (default: true)
     */
    switchView(view, savePreference = true) {
        const grid = document.getElementById('coursesGrid');
        const table = document.getElementById('coursesTableView'); // FIX: era 'coursesTable' (container pai)
        const gridBtn = document.querySelector('.view-btn[data-view="grid"]');
        const tableBtn = document.querySelector('.view-btn[data-view="table"]');

        if (!grid || !table) {
            console.warn('⚠️ switchView: Grid or table element not found', { grid: !!grid, table: !!table });
            return;
        }

        if (view === 'grid') {
            grid.style.display = 'grid';
            table.style.display = 'none';
            gridBtn?.classList.add('active');
            tableBtn?.classList.remove('active');
        } else {
            grid.style.display = 'none';
            table.style.display = 'block';
            gridBtn?.classList.remove('active');
            tableBtn?.classList.add('active');
        }

        this.currentView = view;
        if (savePreference) {
            localStorage.setItem('courses-view-preference', view);
            console.log('👁️ View switched to:', view);
        }
    }

    // ============================================
    // QUICK WIN #3: TABLE SORT
    // ============================================

    /**
     * Setup table sorting on header clicks
     */
    setupTableSort() {
        // Add click listeners to table headers
        const tableHeader = document.querySelector('.courses-table .table-header');
        if (!tableHeader) return;

        const headers = tableHeader.querySelectorAll('.table-cell');
        headers.forEach((header, index) => {
            // Make headers clickable (except Actions column)
            if (index < headers.length - 1) {
                header.style.cursor = 'pointer';
                header.title = 'Clique para ordenar';
                
                header.addEventListener('click', () => {
                    const columns = ['name', 'level', 'status'];
                    const column = columns[index];
                    this.sortCourses(column);
                });
            }
        });
    }

    /**
     * Sort courses by column
     * @param {string} column - Column to sort by
     */
    sortCourses(column) {
        // Toggle direction if same column
        if (this.sortConfig.column === column) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.column = column;
            this.sortConfig.direction = 'asc';
        }

        console.log(`🔀 Sorting by ${column} (${this.sortConfig.direction})`);

        // Get current filtered courses
        let sorted = [...this.allCourses];

        // Apply current filters first
        if (this.currentFilters.search || this.currentFilters.status !== 'all' || this.currentFilters.category !== 'all') {
            sorted = this.getFilteredCourses();
        }

        // Sort
        sorted.sort((a, b) => {
            let aVal, bVal;

            switch (column) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'level':
                    const levelOrder = { 'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4, 'MASTER': 5 };
                    aVal = levelOrder[a.level] || 0;
                    bVal = levelOrder[b.level] || 0;
                    break;
                case 'status':
                    aVal = a.isActive ? 1 : 0;
                    bVal = b.isActive ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Render sorted results
        this.renderCourses(sorted);
        this.updateSortIndicators();
    }

    /**
     * Update sort direction indicators in table headers
     */
    updateSortIndicators() {
        const tableHeader = document.querySelector('.courses-table .table-header');
        if (!tableHeader) return;

        const headers = tableHeader.querySelectorAll('.table-cell');
        const columns = ['name', 'level', 'status'];

        headers.forEach((header, index) => {
            if (index < columns.length) {
                // Remove existing indicators
                header.textContent = header.textContent.replace(/ [↑↓]/g, '');

                // Add indicator if this column is sorted
                if (columns[index] === this.sortConfig.column) {
                    const indicator = this.sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
                    header.textContent += indicator;
                }
            }
        });
    }

    /**
     * Get filtered courses based on current filters
     */
    getFilteredCourses() {
        let filtered = [...this.allCourses];

        if (this.currentFilters.search) {
            filtered = filtered.filter(course => {
                const searchTerm = this.currentFilters.search;
                return (
                    course.name.toLowerCase().includes(searchTerm) ||
                    course.description?.toLowerCase().includes(searchTerm)
                );
            });
        }

        if (this.currentFilters.status !== 'all') {
            const isActive = this.currentFilters.status === 'ACTIVE';
            filtered = filtered.filter(course => course.isActive === isActive);
        }

        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(course => course.level === this.currentFilters.category);
        }

        return filtered;
    }

    // Public API for other modules
    refreshCourses() {
        return this.loadCourses();
    }

    isReady() {
        return this.isInitialized && this.moduleAPI !== null;
    }
}

// Create singleton instance and expose globally
const coursesController = new CoursesController();
window.coursesController = coursesController;

// AGENTS.md: Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Controller initializes itself
    console.log('Courses Controller DOM ready');
});

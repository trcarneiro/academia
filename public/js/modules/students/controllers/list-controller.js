/**
 * Students List Controller
 * Manages the students listing interface with search, filters, and navigation
 */

import { StudentsService } from '../services/students-service.js';
import { StudentsTableView } from '../views/table-view.js';
import { StudentsGridView } from '../views/grid-view.js';
import { StudentsFilters } from '../components/filters.js';

export class StudentsListController {
    constructor(apiClient) {
        this.api = apiClient;
        this.service = new StudentsService(apiClient);
        this.tableView = new StudentsTableView();
        this.gridView = new StudentsGridView();
        this.filters = new StudentsFilters();
        
        this.currentView = 'table';
        this.students = [];
        this.filteredStudents = [];
        this.isLoading = false;
        
        this.bindEvents();
    }

    /**
     * Render students list in target container
     */
    async render(container) {
        console.log('📋 Renderizando lista de estudantes...');
        
        try {
            // Ensure premium module styles are loaded
            this.ensureStyles();

            // Load template first
            await this.loadTemplate(container);

            // Mark container for Design System validator
            container.classList.add('module-isolated-container');
            container.setAttribute('data-module', 'students');
            
            // Initialize filters + connect callback
            this.filters.init(container);
            this.filters.setFilterChangeCallback((searchTerm, filters) => {
                this.filterStudents(searchTerm, filters);
            });
            
            // Bind view toggle buttons (premium UI)
            this.bindViewToggle();
            
            // Ensure global retry is available
            window.reloadStudents = () => this.reload();
            
            // Show loading state immediately
            this.showLoading();

            // Load students data using ModuleAPIHelper.fetchWithStates (AGENTS.md)
            await this.api.fetchWithStates('/api/students', {
                loadingElement: this.elements.loadingState || this.elements.container,
                onSuccess: (data) => {
                    this.students = Array.isArray(data) ? data : (data?.items || []);
                    this.filteredStudents = [...this.students];
                    this.showContent();
                    this.renderCurrentView();
                    this.updateResultsCount();
                },
                onEmpty: () => {
                    this.students = [];
                    this.filteredStudents = [];
                    this.renderCurrentView();
                    this.updateResultsCount();
                    this.showEmpty();
                },
                onError: (error) => {
                    this.showError(error?.message || 'Falha ao carregar estudantes');
                    window.app?.handleError?.(error, 'Students:list');
                }
            });
            
            console.log('✅ Lista de estudantes renderizada');
            
        } catch (error) {
            console.error('❌ Erro ao renderizar lista:', error);
            this.showErrorState(container, error.message);
            try { window.app?.handleError?.(error, 'Students:list:render'); } catch (_) {}
        }
    }

    /**
     * Load students template
     */
    async loadTemplate(container) {
        const response = await fetch('/modules/students/students.html');
        if (!response.ok) {
            throw new Error('Erro ao carregar template de estudantes');
        }
        
        const html = await response.text();
        container.innerHTML = html;
        
        // Cache DOM elements
        this.elements = {
            container,
            tableContainer: container.querySelector('#students-table-container'),
            gridContainer: container.querySelector('#students-grid-container'),
            searchInput: container.querySelector('#students-search'),
            viewToggle: container.querySelector('#view-toggle'),
            addButton: container.querySelector('#add-student-btn'),
            loadingState: container.querySelector('#loading-state') || container.querySelector('.loading-state'),
            emptyState: container.querySelector('#empty-state') || container.querySelector('.empty-state'),
            errorState: container.querySelector('#error-state') || container.querySelector('.error-state'),
            contentArea: container.querySelector('.content-area')
        };

        // Bind export action
        window.exportStudents = () => this.exportStudents();
        
        // Bind clear filters button if present
        const clearBtn = container.querySelector('#clear-filters-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.filters.reset();
            });
        }
    }

    /**
     * Load students from API
     */
    // loadStudents now handled by fetchWithStates in render()

    /**
     * Render current view (table or grid)
     */
    renderCurrentView() {
        if (!this.elements.tableContainer || !this.elements.gridContainer) {
            console.warn('⚠️ Elementos de visualização não encontrados');
            return;
        }

        if (this.currentView === 'table') {
            this.tableView.render(this.elements.tableContainer, this.filteredStudents);
            this.elements.tableContainer.style.display = 'block';
            this.elements.gridContainer.style.display = 'none';
        } else {
            this.gridView.render(this.elements.gridContainer, this.filteredStudents);
            this.elements.tableContainer.style.display = 'none';
            this.elements.gridContainer.style.display = 'block';
        }
    }

    /**
     * Switch between table and grid views
     */
    switchView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        this.renderCurrentView();
        
        // Update toggle buttons (fallback if #view-toggle is missing)
        try {
            const container = this.elements.container || document;
            const buttons = container.querySelectorAll('.view-controls .view-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            container.querySelector(`.view-controls .view-btn[data-view="${view}"]`)?.classList.add('active');
        } catch (_) { /* noop */ }
    }

    /**
     * Filter students based on search and filters
     */
    filterStudents(searchTerm = '', filters = {}) {
        let filtered = [...this.students];
        
        // Text search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(student => {
                const user = student.user || {};
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                
                return fullName.includes(term) || email.includes(term);
            });
        }
        
        // Status filter
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(student => {
                return filters.status === 'active' ? student.isActive : !student.isActive;
            });
        }
        
        // Category filter
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(student => student.category === filters.category);
        }
        
        this.filteredStudents = filtered;
        this.renderCurrentView();
        this.updateResultsCount();
    }

    /**
     * Update results count display
     */
    updateResultsCount() {
        const total = this.students.length;
        const filtered = this.filteredStudents.length;
        const active = this.students.filter(s => s.isActive).length;
        
        let message = `${filtered} estudante(s) encontrado(s)`;
        if (filtered !== total) {
            message += ` de ${total} total`;
        }
        message += ` • ${active} ativo(s)`;
        
        const countElement = this.elements.container.querySelector('#results-count');
        if (countElement) {
            countElement.textContent = message;
        }
    }

    /**
     * Handle student selection (edit)
     */
    onStudentSelect(studentId) {
        console.log('📝 Abrindo editor para estudante:', studentId);
        window.openStudentEditor(studentId, this.elements.container);
    }

    /**
     * Handle new student creation
     */
    onAddStudent() {
        console.log('➕ Criando novo estudante');
        window.openStudentEditor(null, this.elements.container);
    }

    /**
     * Handle open import module
     */
    onOpenImport() {
        console.log('📥 Abrindo módulo de importação');
        
        // Navegar para o módulo de importação usando o SPA router
        if (window.navigateTo) {
            window.navigateTo('import');
        } else if (window.location) {
            window.location.hash = '#import';
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Make methods available globally for HTML onclick handlers
        window.selectStudent = (id) => this.onStudentSelect(id);
        window.addNewStudent = () => this.onAddStudent();
        window.openImportModule = () => this.onOpenImport();
        window.switchStudentsView = (view) => this.switchView(view);
    }

    /**
     * Ensure module CSS is loaded (premium + responsive)
     */
    ensureStyles() {
        const head = document.head || document.getElementsByTagName('head')[0];
        const ensureLink = (href) => {
            if (!document.querySelector(`link[href="${href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                head.appendChild(link);
            }
        };
        // Design tokens (usually global, but ensure)
        ensureLink('/css/design-system/tokens.css');
        // Students premium styles
        ensureLink('/css/modules/students-enhanced.css');
        ensureLink('/css/modules/students.css');
        ensureLink('/css/modules/students-responsive.css');
    }

    /**
     * Bind view toggle buttons
     */
    bindViewToggle() {
        const container = this.elements?.container;
        if (!container) return;
        container.querySelectorAll('.view-controls .view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando estudantes...</p>
            </div>
        `;
    }

    /**
     * Show error state
     */
    showErrorState(container, message) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar estudantes</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    // Premium UI State helpers (loading/empty/error/content)
    showContent() {
        this.elements.contentArea && (this.elements.contentArea.style.display = 'block');
        this.elements.loadingState && (this.elements.loadingState.style.display = 'none');
        this.elements.emptyState && (this.elements.emptyState.style.display = 'none');
        this.elements.errorState && (this.elements.errorState.style.display = 'none');
    }
    showLoading() {
        this.elements.contentArea && (this.elements.contentArea.style.display = 'none');
        this.elements.loadingState && (this.elements.loadingState.style.display = 'block');
        this.elements.emptyState && (this.elements.emptyState.style.display = 'none');
        this.elements.errorState && (this.elements.errorState.style.display = 'none');
    }
    showEmpty() {
        this.elements.contentArea && (this.elements.contentArea.style.display = 'none');
        this.elements.loadingState && (this.elements.loadingState.style.display = 'none');
        this.elements.emptyState && (this.elements.emptyState.style.display = 'block');
        this.elements.errorState && (this.elements.errorState.style.display = 'none');
    }
    showError(message) {
        this.elements.contentArea && (this.elements.contentArea.style.display = 'none');
        this.elements.loadingState && (this.elements.loadingState.style.display = 'none');
        if (this.elements.errorState) {
            const msg = this.elements.errorState.querySelector('#error-message');
            if (msg) msg.textContent = message || 'Erro ao carregar estudantes';
            this.elements.errorState.style.display = 'block';
        }
        this.elements.emptyState && (this.elements.emptyState.style.display = 'none');
    }

    /**
     * Reload list from API
     */
    async reload() {
        // Re-run render on current container
        await this.render(this.elements?.container || document.getElementById('app'));
    }

    /**
     * Export students (CSV client-side from API data)
     */
    exportStudents() {
        const rows = this.filteredStudents.map(s => {
            const u = s.user || {};
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            const email = u.email || '';
            const phone = u.phone || '';
            const category = s.category || '';
            const status = s.isActive ? 'Ativo' : 'Inativo';
            return [s.id, name, email, phone, category, status].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });
        const header = ['ID','Nome','Email','Telefone','Categoria','Status'].join(',');
        const csv = [header, ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alunos-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Cleanup when leaving module
     */
    destroy() {
        // Remove global handlers
        delete window.selectStudent;
        delete window.addNewStudent;
        delete window.openImportModule;
        delete window.switchStudentsView;
        
        console.log('🧹 Students List Controller destruído');
    }
}

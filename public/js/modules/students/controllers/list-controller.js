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
            // Show loading state
            this.showLoadingState(container);
            
            // Load template
            await this.loadTemplate(container);

            // Mark container for Design System validator
            container.classList.add('module-isolated-container');
            container.setAttribute('data-module', 'students');
            
            // Load students data
            await this.loadStudents();
            
            // Render current view
            this.renderCurrentView();
            
            // Initialize filters
            this.filters.init(container);
            
            console.log('✅ Lista de estudantes renderizada');
            
        } catch (error) {
            console.error('❌ Erro ao renderizar lista:', error);
            this.showErrorState(container, error.message);
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
            loadingState: container.querySelector('.loading-state'),
            errorState: container.querySelector('.error-state')
        };
    }

    /**
     * Load students from API
     */
    async loadStudents() {
        this.isLoading = true;
        
        try {
            this.students = await this.service.getStudents();
            this.filteredStudents = [...this.students];
            this.updateResultsCount();
            
        } catch (error) {
            console.error('❌ Erro ao carregar estudantes:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

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
        
        // Update toggle buttons
        const buttons = this.elements.viewToggle.querySelectorAll('button');
        buttons.forEach(btn => btn.classList.remove('active'));
        this.elements.viewToggle.querySelector(`[data-view="${view}"]`).classList.add('active');
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
     * Bind event listeners
     */
    bindEvents() {
        // Make methods available globally for HTML onclick handlers
        window.selectStudent = (id) => this.onStudentSelect(id);
        window.addNewStudent = () => this.onAddStudent();
        window.switchStudentsView = (view) => this.switchView(view);
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

    /**
     * Cleanup when leaving module
     */
    destroy() {
        // Remove global handlers
        delete window.selectStudent;
        delete window.addNewStudent;
        delete window.switchStudentsView;
        
        console.log('🧹 Students List Controller destruído');
    }
}

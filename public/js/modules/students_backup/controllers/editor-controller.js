/**
 * Student Editor Controller
 * Manages the student creation/editing interface with tabs and CRUD operations
 */

import { StudentsService } from '../services/students-service.js';
import { createStudentDataService } from '../services/student-data-service.js';
import { ProfileTab } from '../tabs/profile-tab.js';
import { FinancialTab } from '../tabs/financial-tab.js';
import { CoursesTab } from '../tabs/courses-tab-modern.js';
import { DocumentsTab } from '../tabs/documents-tab.js';
import { HistoryTab } from '../tabs/history-tab.js';
import { StudentValidator } from '../validators/student-validator.js';

export class StudentEditorController {
    constructor(apiClient) {
        this.api = apiClient;
        this.service = new StudentsService(apiClient);
        this.dataService = createStudentDataService(apiClient); // New centralized data service
        this.validator = new StudentValidator();
        
        this.studentId = null;
        this.studentData = null;
        this.studentBundle = null; // Cached bundle data
        this.activeTab = 'profile';
        this.hasUnsavedChanges = false;
        this.isLoading = false;
        
        this.tabs = {};
        
        this.bindEvents();
    }

    /**
     * Render student editor in target container
     */
    async render(container, studentId = null) {
        console.log('📝 Renderizando editor de estudante...', studentId ? `ID: ${studentId}` : 'Novo');
        
        try {
            this.studentId = studentId;
            
            // Show loading state
            this.showLoadingState(container);
            
            // Load template
            await this.loadTemplate(container);
            
            // Initialize tabs
            this.initializeTabs();
            
            // Load student data if editing
            if (studentId) {
                await this.loadStudentData();
            } else {
                this.initializeNewStudent();
            }
            
            // Setup navigation
            this.setupNavigation();
            
            // Render initial tab after everything is loaded
            this.switchTab('profile');
            
            console.log('✅ Editor de estudante renderizado');
            
        } catch (error) {
            console.error('❌ Erro ao renderizar editor:', error);
            this.showErrorState(container, error.message);
            try { window.app?.handleError?.(error, 'Students:editor:render'); } catch (_) {}
        }
    }

    /**
     * Load editor template
     */
    async loadTemplate(container) {
        const response = await fetch('/modules/students/student-editor.html');
        if (!response.ok) {
            throw new Error('Erro ao carregar template do editor');
        }
        
        const html = await response.text();
        container.innerHTML = html;

        // Inject CSS (idempotent + cache-busting)
        const ensureStyle = (id, hrefBase) => {
            if (document.getElementById(id)) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.id = id;
            link.href = `${hrefBase}?v=${Date.now()}`;
            document.head.appendChild(link);
        };
        ensureStyle('students-editor-css', '/css/modules/students-editor.css');
        // Isolation shim for AGENTS.md .module-isolated-* compliance
        ensureStyle('students-editor-isolation-css', '/css/modules/students-editor-isolation.css');
        // Courses tab styles (isolated)
        ensureStyle('students-courses-css', '/css/modules/students-courses.css');
        
        // Cache DOM elements
        this.elements = {
            container,
            header: container.querySelector('.editor-header'),
            studentName: container.querySelector('#student-name-header'),
            studentId: container.querySelector('#student-id-header'),
            studentStatus: container.querySelector('#student-status-header'),
            tabNavigation: container.querySelector('.tab-navigation'),
            tabContents: container.querySelector('.tab-contents'),
            saveButton: container.querySelector('#save-student-btn'),
            cancelButton: container.querySelector('#cancel-btn'),
            deleteButton: container.querySelector('#delete-student-btn'),
            backButton: container.querySelector('#back-to-list-btn')
        };
        
        // Debug: verificar se elementos foram encontrados
        console.log('🔍 Elementos DOM encontrados:', {
            header: !!this.elements.header,
            studentName: !!this.elements.studentName,
            tabNavigation: !!this.elements.tabNavigation,
            tabContents: !!this.elements.tabContents,
            saveButton: !!this.elements.saveButton
        });
    }

    /**
     * Initialize tab components
     */
    initializeTabs() {
        this.tabs = {
            profile: new ProfileTab(this),
            financial: new FinancialTab(this),
            courses: new CoursesTab(this),
            documents: new DocumentsTab(this),
            history: new HistoryTab(this)
        };
        
        // Set active tab but don't render yet
        this.activeTab = 'profile';
        this.isInitialRender = true; // Flag for first render
    }

    /**
     * Load existing student data using bundle approach
     */
    async loadStudentData() {
        this.isLoading = true;
        
        try {
            console.log('📦 Carregando bundle completo para estudante:', this.studentId);
            
            // Use the new bundle loading approach
            this.studentBundle = await this.dataService.prefetchStudent(this.studentId);
            
            // Extract student data from bundle
            this.studentData = this.studentBundle.student;
            
            // Update header
            this.updateHeader();
            
            // Load bundle data into all tabs (they'll consume from bundle instead of making individual API calls)
            Object.values(this.tabs).forEach(tab => {
                if (tab.loadBundleData) {
                    // New method for tabs that can consume bundle data
                    tab.loadBundleData(this.studentBundle);
                } else if (tab.loadData) {
                    // Fallback to existing method
                    tab.loadData(this.studentData);
                }
            });
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do estudante:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Initialize new student form
     */
    initializeNewStudent() {
        this.studentData = {
            user: {
                firstName: '',
                lastName: '',
                email: '',
                phone: ''
            },
            isActive: true,
            category: 'REGULAR',
            subscriptions: [],
            attendances: []
        };
        
        this.updateHeader();
        
        // Initialize tabs with empty data
        Object.values(this.tabs).forEach(tab => {
            if (tab.loadData) {
                tab.loadData(this.studentData);
            }
        });
    }

    /**
     * Update header information
     */
    updateHeader() {
        const user = this.studentData?.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        
        this.elements.studentName.textContent = fullName || 'Novo Estudante';
        this.elements.studentId.textContent = this.studentData?.id ? `ID: ${this.studentData.id}` : 'ID: --';
        this.elements.studentStatus.textContent = this.studentData?.isActive ? 'Ativo' : 'Inativo';
        this.elements.studentStatus.className = `status-badge ${this.studentData?.isActive ? 'active' : 'inactive'}`;
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        if (this.activeTab === tabName && !this.isInitialRender) return;
        
        this.isInitialRender = false;
        
        // Check for unsaved changes
        if (this.hasUnsavedChanges && !confirm('Há alterações não salvas. Deseja continuar?')) {
            return;
        }
        
        this.activeTab = tabName;
        
        // Update tab navigation buttons
        this.elements.tabNavigation.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content visibility
        this.elements.tabContents.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-content`);
        });
        
        // Render active tab content
        const activeTab = this.tabs[tabName];
        const tabContainer = this.elements.tabContents.querySelector(`#${tabName}-content`);

        if (activeTab && tabContainer) {
            // Call init if present
            if (activeTab.init && typeof activeTab.init === 'function') {
                activeTab.init(tabContainer, this.studentId);
            }
            // Always render if render exists (some tabs' init doesn't render)
            if (activeTab.render && typeof activeTab.render === 'function') {
                activeTab.render(tabContainer);
            }
        } else {
            console.warn(`Aba ou container não encontrado para: ${tabName}`);
        }
    }

    /**
     * Save student data
     */
    async saveStudent() {
        console.log('💾 Salvando estudante...');
        
        try {
            // Validate all tabs
            const validationErrors = await this.validateAllTabs();
            if (validationErrors.length > 0) {
                this.showValidationErrors(validationErrors);
                return false;
            }
            
            // Collect data from all tabs
            const studentData = this.collectStudentData();
            
            // Save via API
            let savedStudent;
            if (this.studentId) {
                savedStudent = await this.service.updateStudent(this.studentId, studentData);
                
                // Invalidate cache for updated student
                this.dataService.invalidateStudent(this.studentId);
            } else {
                savedStudent = await this.service.createStudent(studentData);
                this.studentId = savedStudent.id;
            }
            
            this.studentData = savedStudent;
            this.hasUnsavedChanges = false;
            this.updateHeader();
            
            this.showSuccessMessage('Estudante salvo com sucesso!');
            console.log('✅ Estudante salvo:', savedStudent);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar estudante:', error);
            this.showErrorMessage('Erro ao salvar estudante: ' + error.message);
            return false;
        }
    }

    // ==============================================
    // CACHE MANAGEMENT METHODS
    // ==============================================

    /**
     * Refresh specific student data sections
     * @param {string[]} sections - ['student', 'subscription', 'attendances', 'financial']
     */
    async refreshStudentData(sections = ['student']) {
        if (!this.studentId) return;

        try {
            console.log('🔄 Atualizando dados do estudante:', sections);
            
            const refreshedData = await this.dataService.refreshStudent(this.studentId, sections);
            
            // Update local data
            if (refreshedData.student) {
                this.studentData = refreshedData.student;
                this.updateHeader();
            }
            
            // Update tabs with new data
            this.updateTabsWithRefreshedData(refreshedData);
            
            this.showSuccessMessage('Dados atualizados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar dados:', error);
            this.showErrorMessage('Erro ao atualizar dados: ' + error.message);
        }
    }

    /**
     * Update tabs with refreshed data
     */
    updateTabsWithRefreshedData(refreshedData) {
        Object.entries(this.tabs).forEach(([tabName, tab]) => {
            if (tab.updateWithRefreshedData) {
                tab.updateWithRefreshedData(refreshedData);
            }
        });
    }

    /**
     * Get data service for tabs to access cached data
     */
    getDataService() {
        return this.dataService;
    }

    /**
     * Get cached bundle data
     */
    getStudentBundle() {
        return this.studentBundle;
    }

    /**
     * Get cache statistics for debugging
     */
    getCacheStats() {
        return this.dataService.getStats();
    }

    /**
     * Delete student
     */
    async deleteStudent() {
        if (!this.studentId) return;
        
        if (!confirm('Tem certeza que deseja excluir este estudante? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            await this.service.deleteStudent(this.studentId);
            this.showSuccessMessage('Estudante excluído com sucesso!');
            
            // Navigate back to list
            setTimeout(() => {
                window.openStudentsList(this.elements.container);
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro ao excluir estudante:', error);
            this.showErrorMessage('Erro ao excluir estudante: ' + error.message);
        }
    }

    /**
     * Validate all tabs
     */
    async validateAllTabs() {
        const errors = [];
        
        for (const [tabName, tab] of Object.entries(this.tabs)) {
            if (tab.validate) {
                const tabErrors = await tab.validate();
                if (tabErrors.length > 0) {
                    errors.push(...tabErrors.map(err => `${tabName}: ${err}`));
                }
            }
        }
        
        return errors;
    }

    /**
     * Collect data from all tabs
     */
    collectStudentData() {
        const data = { ...this.studentData };
        
        Object.values(this.tabs).forEach(tab => {
            if (tab.getData) {
                const tabData = tab.getData();
                Object.assign(data, tabData);
            }
        });
        
        return data;
    }

    /**
     * Setup navigation and events
     */
    setupNavigation() {
        // Tab navigation
        this.elements.tabNavigation.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // Action buttons
        this.elements.saveButton?.addEventListener('click', () => this.saveStudent());
        this.elements.deleteButton?.addEventListener('click', () => this.deleteStudent());
        this.elements.cancelButton?.addEventListener('click', () => this.onCancel());
        this.elements.backButton?.addEventListener('click', () => this.onBack());
        
        // Show/hide delete button for new students
        if (this.elements.deleteButton) {
            this.elements.deleteButton.style.display = this.studentId ? 'block' : 'none';
        }
    }

    /**
     * Handle cancel action
     */
    onCancel() {
        if (this.hasUnsavedChanges && !confirm('Há alterações não salvas. Deseja descartar?')) {
            return;
        }
        
        this.onBack();
    }

    /**
     * Navigate back to students list
     */
    onBack() {
        window.openStudentsList(this.elements.container);
    }

    /**
     * Mark as having unsaved changes
     */
    markAsChanged() {
        this.hasUnsavedChanges = true;
        
        // Update save button state
        if (this.elements.saveButton) {
            this.elements.saveButton.classList.add('has-changes');
        }
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        const errorHtml = errors.map(error => `<li>${error}</li>`).join('');
        this.showErrorMessage(`
            <strong>Corrija os seguintes erros:</strong>
            <ul>${errorHtml}</ul>
        `);
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // Implementation depends on your notification system
        console.log('✅', message);
        // You can integrate with a toast/notification library here
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        // Implementation depends on your notification system
        console.error('❌', message);
        // You can integrate with a toast/notification library here
    }

    /**
     * Bind global events
     */
    bindEvents() {
        // Make methods available globally
        window.saveCurrentStudent = () => this.saveStudent();
        window.deleteCurrentStudent = () => this.deleteStudent();
        window.switchStudentTab = (tab) => this.switchTab(tab);
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando editor...</p>
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
                <h3>Erro no Editor</h3>
                <p>${message}</p>
                <button onclick="window.openStudentsList(this.closest('.content-area'))" class="btn btn-primary">
                    Voltar à Lista
                </button>
            </div>
        `;
    }

    /**
     * Cleanup when leaving editor
     */
    destroy() {
        // Remove global handlers
        delete window.saveCurrentStudent;
        delete window.deleteCurrentStudent;
        delete window.switchStudentTab;
        
        // Cleanup tabs
        Object.values(this.tabs).forEach(tab => {
            if (tab.destroy) {
                tab.destroy();
            }
        });
        
        console.log('🧹 Student Editor Controller destruído');
    }
}

/**
 * @fileoverview Student Editor Module - Refactored
 * @version 3.0.0
 * @description Clean, reactive student editor following modern best practices
 */

import { ApiClient } from './shared/api-client.js';
import { StateManager } from './shared/state-manager.js';
import { DOMUtils } from './shared/dom-utils.js';
import { Validator } from './shared/validator.js';
import { FormHandler } from './shared/form-handler.js';

// ==============================================
// MODULE CONSTANTS
// ==============================================

const CONFIG = {
    API_ENDPOINTS: {
        STUDENTS: '/api/students',
        STUDENT_DETAIL: (id) => `/api/students/${id}`,
        STUDENT_SUBSCRIPTION: (id) => `/api/students/${id}/subscription`,
        STUDENT_COURSES: (id) => `/api/students/${id}/courses`,
        STUDENT_CLASSES: (id) => `/api/students/${id}/classes`,
        STUDENT_FINANCIAL: (id) => `/api/students/${id}/financial`
    },
    FORM_FIELDS: {
        'student-name': { required: true, type: 'text', maxLength: 100 },
        'student-email': { required: true, type: 'email' },
        'student-phone': { required: false, type: 'tel' },
        'student-birth-date': { required: false, type: 'date' },
        'student-notes': { required: false, type: 'textarea', maxLength: 500 },
        'student-status': { required: true, type: 'select' }
    },
    TABS: {
        profile: { 
            id: 'profile', 
            name: '👤 Perfil', 
            loader: 'loadProfileData',
            validator: 'validateProfileData'
        },
        financial: { 
            id: 'financial', 
            name: '💳 Financeiro', 
            loader: 'loadFinancialData' 
        },
        courses: { 
            id: 'courses', 
            name: '📚 Cursos', 
            loader: 'loadCoursesData' 
        },
        classes: { 
            id: 'classes', 
            name: '🏫 Turmas', 
            loader: 'loadClassesData' 
        },
        progress: { 
            id: 'progress', 
            name: '📊 Progresso', 
            loader: 'loadProgressData' 
        },
        ia: { 
            id: 'ia', 
            name: '🤖 IA', 
            loader: 'loadIAData' 
        }
    },
    SELECTORS: {
        TAB_BUTTONS: '.page-tab',
        TAB_CONTENTS: '.editor-tab-content',
        FORM: '#student-form',
        SAVE_BTN: '#save-student-btn',
        BACK_BTN: '#back-to-list-btn',
        PAGE_TITLE: '.page-title'
    }
};

// ==============================================
// STUDENT EDITOR SERVICE
// ==============================================

class StudentEditorService {
    constructor() {
        this.apiClient = new ApiClient();
        this.state = new StateManager();
        this.validator = new Validator();
    }

    /**
     * Load student data
     */
    async loadStudent(studentId) {
        if (!this.validator.isValidId(studentId)) {
            throw new Error('ID do aluno inválido');
        }

        try {
            const response = await this.apiClient.get(
                CONFIG.API_ENDPOINTS.STUDENT_DETAIL(studentId)
            );
            
            if (!response.success || !response.data) {
                throw new Error('Aluno não encontrado');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Failed to load student:', error);
            throw new Error(`Erro ao carregar aluno: ${error.message}`);
        }
    }

    /**
     * Save student data
     */
    async saveStudent(studentId, studentData, isCreate = false) {
        const validationResult = this.validator.validateStudentData(studentData);
        
        if (!validationResult.isValid) {
            throw new Error(`Dados inválidos: ${validationResult.errors.join(', ')}`);
        }

        try {
            let response;
            
            if (isCreate) {
                response = await this.apiClient.post(
                    CONFIG.API_ENDPOINTS.STUDENTS,
                    validationResult.sanitizedData
                );
            } else {
                response = await this.apiClient.put(
                    CONFIG.API_ENDPOINTS.STUDENT_DETAIL(studentId),
                    { ...validationResult.sanitizedData, id: studentId }
                );
            }

            if (!response.success) {
                throw new Error(response.message || 'Erro ao salvar aluno');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Failed to save student:', error);
            throw new Error(`Erro ao salvar aluno: ${error.message}`);
        }
    }

    /**
     * Load student financial data
     */
    async loadStudentFinancial(studentId) {
        try {
            const response = await this.apiClient.get(
                CONFIG.API_ENDPOINTS.STUDENT_FINANCIAL(studentId)
            );
            return response.data || {};
        } catch (error) {
            console.error('❌ Failed to load financial data:', error);
            return {};
        }
    }

    /**
     * Load student courses
     */
    async loadStudentCourses(studentId) {
        try {
            const response = await this.apiClient.get(
                CONFIG.API_ENDPOINTS.STUDENT_COURSES(studentId)
            );
            return response.data || [];
        } catch (error) {
            console.error('❌ Failed to load courses:', error);
            return [];
        }
    }

    /**
     * Load student classes
     */
    async loadStudentClasses(studentId) {
        try {
            const response = await this.apiClient.get(
                CONFIG.API_ENDPOINTS.STUDENT_CLASSES(studentId)
            );
            return response.data || [];
        } catch (error) {
            console.error('❌ Failed to load classes:', error);
            return [];
        }
    }
}

// ==============================================
// STUDENT EDITOR CONTROLLER
// ==============================================

class StudentEditorController {
    constructor(service) {
        this.service = service;
        this.domUtils = new DOMUtils();
        this.formHandler = new FormHandler();
        this.state = new StateManager();
        
        // Reactive state
        this.currentStudent = null;
        this.currentTab = 'profile';
        this.isCreateMode = false;
        this.hasUnsavedChanges = false;
        this.isInitialized = false;
        
        // Bind methods
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleBack = this.handleBack.bind(this);
    }

    /**
     * Initialize the editor
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Student editor already initialized');
            return;
        }

        try {
            console.log('🔄 Initializing Student Editor...');
            
            // Determine mode and load data
            await this.determineMode();
            
            // Wait for DOM and setup
            await this.domUtils.waitForElement(CONFIG.SELECTORS.FORM);
            
            this.setupEventListeners();
            this.setupFormValidation();
            this.setupTabs();
            
            if (!this.isCreateMode && this.currentStudent) {
                this.populateForm(this.currentStudent);
                this.updatePageTitle(this.getStudentName(this.currentStudent));
            } else if (this.isCreateMode) {
                this.setupCreateMode();
            }
            
            this.isInitialized = true;
            console.log('✅ Student Editor initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Student Editor:', error);
            this.showError('Erro ao inicializar editor de aluno');
        }
    }

    /**
     * Determine if we're in create or edit mode
     */
    async determineMode() {
        const editorModeData = localStorage.getItem('studentEditorMode');
        
        if (!editorModeData) {
            throw new Error('Dados do editor não encontrados');
        }

        try {
            const editorData = JSON.parse(editorModeData);
            console.log('📊 Editor data:', editorData);
            
            this.isCreateMode = editorData.mode === 'create';
            
            if (!this.isCreateMode && editorData.studentId) {
                console.log('🔍 Loading student data for editing...');
                this.currentStudent = await this.service.loadStudent(editorData.studentId);
                console.log('✅ Student loaded:', this.getStudentName(this.currentStudent));
            }
        } catch (error) {
            console.error('❌ Failed to parse editor data:', error);
            throw new Error('Dados do editor inválidos');
        }
    }

    /**
     * Setup create mode
     */
    setupCreateMode() {
        console.log('🆕 Setting up create mode');
        
        this.updatePageTitle('Novo Aluno');
        
        // Update save button
        const saveBtn = this.domUtils.getElement(CONFIG.SELECTORS.SAVE_BTN);
        if (saveBtn) {
            saveBtn.textContent = '💾 Criar Aluno';
        }
        
        // Set default values
        this.populateForm({
            user: { firstName: '', lastName: '', email: '', phone: '' },
            birthDate: '',
            notes: '',
            isActive: true
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form change detection
        const form = this.domUtils.getElement(CONFIG.SELECTORS.FORM);
        if (form) {
            form.addEventListener('input', this.handleFormChange);
            form.addEventListener('change', this.handleFormChange);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Tab navigation
        const tabButtons = document.querySelectorAll(CONFIG.SELECTORS.TAB_BUTTONS);
        tabButtons.forEach(button => {
            button.addEventListener('click', this.handleTabClick);
        });

        // Save button
        const saveBtn = this.domUtils.getElement(CONFIG.SELECTORS.SAVE_BTN);
        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleSave);
        }

        // Back button
        const backBtn = this.domUtils.getElement(CONFIG.SELECTORS.BACK_BTN);
        if (backBtn) {
            backBtn.addEventListener('click', this.handleBack);
        }

        // Prevent accidental navigation with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
                return e.returnValue;
            }
        });

        console.log('✅ Event listeners setup completed');
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        this.formHandler.setupValidation(CONFIG.FORM_FIELDS);
        
        // Real-time validation
        Object.keys(CONFIG.FORM_FIELDS).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validateField(fieldId);
                });
            }
        });
    }

    /**
     * Setup tabs
     */
    setupTabs() {
        // Activate initial tab
        this.switchTab(this.currentTab);
    }

    /**
     * Handle form changes
     */
    handleFormChange(event) {
        this.hasUnsavedChanges = true;
        this.updateSaveButtonState();
        
        // Real-time validation
        if (event.target.id) {
            this.validateField(event.target.id);
        }
    }

    /**
     * Handle tab clicks
     */
    handleTabClick(event) {
        event.preventDefault();
        const tabId = event.currentTarget.dataset.tab;
        if (tabId) {
            this.switchTab(tabId);
        }
    }

    /**
     * Switch tabs
     */
    async switchTab(tabId) {
        if (this.currentTab === tabId) return;
        
        console.log(`🔄 Switching to tab: ${tabId}`);
        
        // Update UI
        document.querySelectorAll(CONFIG.SELECTORS.TAB_BUTTONS).forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        document.querySelectorAll(CONFIG.SELECTORS.TAB_CONTENTS).forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
        
        this.currentTab = tabId;
        
        // Load tab data
        if (CONFIG.TABS[tabId]?.loader && this.currentStudent && !this.isCreateMode) {
            await this.loadTabData(tabId);
        }
    }

    /**
     * Load tab data
     */
    async loadTabData(tabId) {
        const tabConfig = CONFIG.TABS[tabId];
        if (!tabConfig?.loader) return;
        
        try {
            this.showTabLoading(tabId);
            
            switch (tabId) {
                case 'financial':
                    await this.loadFinancialData();
                    break;
                case 'courses':
                    await this.loadCoursesData();
                    break;
                case 'classes':
                    await this.loadClassesData();
                    break;
                case 'progress':
                    await this.loadProgressData();
                    break;
                case 'ia':
                    await this.loadIAData();
                    break;
            }
            
            this.hideTabLoading(tabId);
        } catch (error) {
            console.error(`❌ Error loading ${tabId} data:`, error);
            this.showTabError(tabId, error);
        }
    }

    /**
     * Load financial data
     */
    async loadFinancialData() {
        if (!this.currentStudent) return;
        
        const financialData = await this.service.loadStudentFinancial(this.currentStudent.id);
        this.renderFinancialData(financialData);
    }

    /**
     * Load courses data
     */
    async loadCoursesData() {
        if (!this.currentStudent) return;
        
        const coursesData = await this.service.loadStudentCourses(this.currentStudent.id);
        this.renderCoursesData(coursesData);
    }

    /**
     * Load classes data
     */
    async loadClassesData() {
        if (!this.currentStudent) return;
        
        const classesData = await this.service.loadStudentClasses(this.currentStudent.id);
        this.renderClassesData(classesData);
    }

    /**
     * Load progress data
     */
    async loadProgressData() {
        // TODO: Implement progress data loading
        console.log('📊 Loading progress data...');
    }

    /**
     * Load IA data
     */
    async loadIAData() {
        // TODO: Implement IA data loading
        console.log('🤖 Loading IA data...');
    }

    /**
     * Handle save
     */
    async handleSave() {
        try {
            console.log('💾 Saving student...');
            
            this.showLoading('Salvando...');
            
            // Validate form
            const formData = this.collectFormData();
            const validationResult = this.validateFormData(formData);
            
            if (!validationResult.isValid) {
                this.showValidationErrors(validationResult.errors);
                return;
            }
            
            // Save student
            const savedStudent = await this.service.saveStudent(
                this.currentStudent?.id,
                validationResult.sanitizedData,
                this.isCreateMode
            );
            
            console.log('✅ Student saved successfully');
            this.showSuccess(
                this.isCreateMode ? 'Aluno criado com sucesso!' : 'Aluno salvo com sucesso!'
            );
            
            // Update state
            this.currentStudent = savedStudent;
            this.hasUnsavedChanges = false;
            
            // If was create mode, switch to edit mode
            if (this.isCreateMode) {
                this.isCreateMode = false;
                this.updatePageTitle(this.getStudentName(savedStudent));
                
                // Update localStorage
                const editorData = {
                    mode: 'edit',
                    studentId: savedStudent.id,
                    timestamp: Date.now()
                };
                localStorage.setItem('studentEditorMode', JSON.stringify(editorData));
                
                // Update save button
                const saveBtn = this.domUtils.getElement(CONFIG.SELECTORS.SAVE_BTN);
                if (saveBtn) {
                    saveBtn.textContent = '💾 Salvar Aluno';
                }
            }
            
            this.updateSaveButtonState();
            
        } catch (error) {
            console.error('❌ Failed to save student:', error);
            this.showError(`Erro ao salvar: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle back navigation
     */
    handleBack() {
        if (this.hasUnsavedChanges) {
            const confirmed = confirm('Você tem alterações não salvas. Deseja realmente sair?');
            if (!confirmed) {
                return;
            }
        }
        
        console.log('🔙 Navigating back to students list...');
        
        // Clear editor data
        localStorage.removeItem('studentEditorMode');
        
        // Navigate back
        if (window.navigateToModule) {
            window.navigateToModule('students');
        } else {
            window.location.href = '/views/students.html';
        }
    }

    /**
     * Populate form with student data
     */
    populateForm(student) {
        if (!student) return;
        
        console.log('📝 Populating form with student data');
        
        const user = student.user || {};
        const formData = {
            'student-name': `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            'student-email': user.email || '',
            'student-phone': user.phone || student.phone || '',
            'student-birth-date': student.birthDate ? 
                new Date(student.birthDate).toISOString().split('T')[0] : '',
            'student-notes': student.notes || '',
            'student-status': student.isActive ? 'ACTIVE' : 'INACTIVE'
        };
        
        // Populate fields
        Object.entries(formData).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
                
                // Trigger change event for reactive updates
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Reset unsaved changes flag after population
        setTimeout(() => {
            this.hasUnsavedChanges = false;
            this.updateSaveButtonState();
        }, 100);
        
        console.log('✅ Form populated successfully');
    }

    /**
     * Collect form data
     */
    collectFormData() {
        const formData = {};
        
        Object.keys(CONFIG.FORM_FIELDS).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                formData[fieldId] = field.value;
            }
        });
        
        return formData;
    }

    /**
     * Validate form data
     */
    validateFormData(formData) {
        const errors = [];
        const sanitizedData = {};
        
        // Validate each field
        Object.entries(CONFIG.FORM_FIELDS).forEach(([fieldId, config]) => {
            const value = formData[fieldId];
            
            // Required validation
            if (config.required && (!value || value.trim() === '')) {
                errors.push(`Campo ${this.getFieldLabel(fieldId)} é obrigatório`);
                return;
            }
            
            // Type validation
            if (value && config.type === 'email' && !this.isValidEmail(value)) {
                errors.push(`Campo ${this.getFieldLabel(fieldId)} deve ser um email válido`);
                return;
            }
            
            // Max length validation
            if (value && config.maxLength && value.length > config.maxLength) {
                errors.push(`Campo ${this.getFieldLabel(fieldId)} deve ter no máximo ${config.maxLength} caracteres`);
                return;
            }
            
            // Sanitize and add to result
            sanitizedData[fieldId] = this.sanitizeFieldValue(value, config.type);
        });
        
        // Transform to API format
        const apiData = this.transformToApiFormat(sanitizedData);
        
        return {
            isValid: errors.length === 0,
            errors,
            sanitizedData: apiData
        };
    }

    /**
     * Transform form data to API format
     */
    transformToApiFormat(formData) {
        const nameParts = (formData['student-name'] || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
            firstName,
            lastName,
            email: formData['student-email'] || '',
            phone: formData['student-phone'] || '',
            birthDate: formData['student-birth-date'] || '',
            notes: formData['student-notes'] || '',
            isActive: formData['student-status'] === 'ACTIVE'
        };
    }

    /**
     * Validate individual field
     */
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const config = CONFIG.FORM_FIELDS[fieldId];
        
        if (!field || !config) return;
        
        const value = field.value;
        let isValid = true;
        let message = '';
        
        // Required validation
        if (config.required && (!value || value.trim() === '')) {
            isValid = false;
            message = 'Campo obrigatório';
        }
        // Email validation
        else if (value && config.type === 'email' && !this.isValidEmail(value)) {
            isValid = false;
            message = 'Email inválido';
        }
        // Max length validation
        else if (value && config.maxLength && value.length > config.maxLength) {
            isValid = false;
            message = `Máximo ${config.maxLength} caracteres`;
        }
        
        // Update UI
        this.updateFieldValidation(fieldId, isValid, message);
        
        return isValid;
    }

    /**
     * Update field validation UI
     */
    updateFieldValidation(fieldId, isValid, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}-error`);
        
        if (field) {
            field.classList.toggle('is-valid', isValid);
            field.classList.toggle('is-invalid', !isValid);
        }
        
        if (errorElement) {
            errorElement.textContent = isValid ? '' : message;
            errorElement.style.display = isValid ? 'none' : 'block';
        }
    }

    /**
     * Update save button state
     */
    updateSaveButtonState() {
        const saveBtn = this.domUtils.getElement(CONFIG.SELECTORS.SAVE_BTN);
        if (saveBtn) {
            saveBtn.disabled = !this.hasUnsavedChanges;
            saveBtn.classList.toggle('has-changes', this.hasUnsavedChanges);
        }
    }

    /**
     * Update page title
     */
    updatePageTitle(title) {
        const titleElement = this.domUtils.getElement(CONFIG.SELECTORS.PAGE_TITLE);
        if (titleElement) {
            titleElement.textContent = this.isCreateMode ? 'Novo Aluno' : `Editando: ${title}`;
        }
        
        document.title = `Academia - ${this.isCreateMode ? 'Novo Aluno' : `Editando ${title}`}`;
    }

    /**
     * Get student name
     */
    getStudentName(student) {
        if (!student?.user) return 'Aluno sem nome';
        
        const { firstName, lastName } = student.user;
        return `${firstName || ''} ${lastName || ''}`.trim() || 'Aluno sem nome';
    }

    /**
     * Get field label
     */
    getFieldLabel(fieldId) {
        const labels = {
            'student-name': 'Nome',
            'student-email': 'Email',
            'student-phone': 'Telefone',
            'student-birth-date': 'Data de Nascimento',
            'student-notes': 'Observações',
            'student-status': 'Status'
        };
        return labels[fieldId] || fieldId;
    }

    /**
     * Utility functions
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    sanitizeFieldValue(value, type) {
        if (!value) return '';
        
        switch (type) {
            case 'email':
                return value.toLowerCase().trim();
            case 'tel':
                return value.replace(/[^\d+\-\s()]/g, '');
            default:
                return value.trim();
        }
    }

    /**
     * UI State Methods
     */
    showLoading(message = 'Carregando...') {
        // TODO: Implement loading UI
        console.log('🔄', message);
    }

    hideLoading() {
        // TODO: Implement loading UI
    }

    showSuccess(message) {
        // TODO: Implement success notification
        console.log('✅', message);
        alert(message); // Temporary
    }

    showError(message) {
        // TODO: Implement error notification
        console.error('❌', message);
        alert(`Erro: ${message}`); // Temporary
    }

    showValidationErrors(errors) {
        const message = errors.join('\n');
        this.showError(message);
    }

    showTabLoading(tabId) {
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.innerHTML = '<div class="loading-state">Carregando...</div>';
        }
    }

    hideTabLoading(tabId) {
        // Loading hidden when content is rendered
    }

    showTabError(tabId, error) {
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="error-state">
                    <p>Erro ao carregar dados: ${error.message}</p>
                    <button onclick="location.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    }

    /**
     * Render tab data methods
     */
    renderFinancialData(data) {
        const tabContent = document.getElementById('financial-tab');
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="financial-data">
                    <h3>💳 Dados Financeiros</h3>
                    <!-- TODO: Implement financial data rendering -->
                    <p>Dados financeiros serão implementados aqui</p>
                </div>
            `;
        }
    }

    renderCoursesData(data) {
        const tabContent = document.getElementById('courses-tab');
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="courses-data">
                    <h3>📚 Cursos</h3>
                    <!-- TODO: Implement courses data rendering -->
                    <p>Cursos serão implementados aqui</p>
                </div>
            `;
        }
    }

    renderClassesData(data) {
        const tabContent = document.getElementById('classes-tab');
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="classes-data">
                    <h3>🏫 Turmas</h3>
                    <!-- TODO: Implement classes data rendering -->
                    <p>Turmas serão implementadas aqui</p>
                </div>
            `;
        }
    }
}

// ==============================================
// MODULE INITIALIZATION
// ==============================================

let studentEditorController = null;

/**
 * Initialize the student editor module
 */
export async function initializeStudentEditor() {
    if (studentEditorController) {
        console.warn('⚠️ Student editor already initialized');
        return studentEditorController;
    }

    try {
        const service = new StudentEditorService();
        studentEditorController = new StudentEditorController(service);
        await studentEditorController.initialize();
        
        return studentEditorController;
    } catch (error) {
        console.error('❌ Failed to initialize student editor:', error);
        throw error;
    }
}

/**
 * Get the current student editor controller
 */
export function getStudentEditorController() {
    return studentEditorController;
}

// ==============================================
// LEGACY COMPATIBILITY
// ==============================================

// Expose for HTML compatibility
window.initializeStudentEditor = initializeStudentEditor;
window.StudentEditor = {
    initializeStudentEditor,
    getStudentEditorController
};

console.log('✅ Student Editor module loaded (ES6)');

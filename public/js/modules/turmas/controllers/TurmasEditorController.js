/**
 * Turmas Editor Controller
 * Manages the turma creation/editing interface following GUIDELINES2.md
 */

import { TurmasService } from '../services/TurmasService.js';
import { TurmasEditorView } from '../views/TurmasEditorView.js';
import { safeNavigateTo, safeNavigateToList } from '../../../shared/utils/navigation.js';

export class TurmasEditorController {
    constructor(apiClient) {
        this.api = apiClient;
        this.service = new TurmasService(apiClient);
        this.view = new TurmasEditorView();
        
        this.currentTurmaId = null;
        this.isEditing = false;
        this.formData = {};
        
        console.log('📝 [TurmasEditor] Controller initialized');
    }

    /**
     * Render turma editor in target container
     */
    async render(container, turmaId = null) {
        console.log('📝 [TurmasEditor] Rendering editor...', { turmaId });
        
        try {
            // Set editing mode
            this.currentTurmaId = turmaId;
            this.isEditing = !!turmaId;
            
            // Show loading state
            this.view.showLoadingState(container);
            
            // Load required data
            await this.loadFormData();
            
            // Load turma data if editing
            if (turmaId) {
                await this.loadTurmaData(turmaId);
            }
            
            // Render editor
            await this.view.render(container, {
                isEditing: this.isEditing,
                formData: this.formData
            });
            
            // Attach event listeners
            this.attachEventListeners(container);
            
            // Hide loading state
            this.view.hideLoadingState(container);
            
            console.log('✅ [TurmasEditor] Editor rendered successfully');
            
        } catch (error) {
            console.error('❌ [TurmasEditor] Render error:', error);
            this.view.showErrorState(container, 'Erro ao carregar editor de turma');
            this.handleError(error, 'TurmasEditor:render');
        }
    }

    /**
     * Load form data (courses, instructors, units)
     */
    async loadFormData() {
        console.log('[TurmasEditor] Loading form data...');
        
        try {
            // Load all required data in parallel
            const [courses, instructors, units] = await Promise.all([
                this.service.getCourses(),
                this.service.getInstructors(),
                this.service.getUnits()
            ]);
            
            this.formData = {
                courses: courses.success ? courses.data : [],
                instructors: instructors.success ? instructors.data : [],
                units: units.success ? units.data : []
            };
            
            console.log('[TurmasEditor] Form data loaded successfully');
            
        } catch (error) {
            console.error('[TurmasEditor] Error loading form data:', error);
            this.formData = {
                courses: [],
                instructors: [],
                units: []
            };
        }
    }

    /**
     * Load turma data for editing
     */
    async loadTurmaData(turmaId) {
        console.log('[TurmasEditor] Loading turma data...', { turmaId });
        
        try {
            const result = await this.service.getById(turmaId);
            
            if (result.success && result.data) {
                this.formData.turma = result.data;
                console.log('[TurmasEditor] Turma data loaded successfully');
            } else {
                throw new Error(result.error || 'Turma não encontrada');
            }
            
        } catch (error) {
            console.error('[TurmasEditor] Error loading turma data:', error);
            throw error;
        }
    }

    /**
     * Attach event listeners to form elements
     */
    attachEventListeners(container) {
        // Form submission
        const form = container.querySelector('#turma-editor-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Cancel button
        const btnCancel = container.querySelector('#btn-cancel-editor');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => this.handleCancel());
        }
        
        // Navigation
        const breadcrumbItems = container.querySelectorAll('.breadcrumb-item.clickable');
        breadcrumbItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        console.log('[TurmasEditor] Event listeners attached');
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();
        console.log('[TurmasEditor] Handling form submission...');
        
        try {
            const formData = new FormData(event.target);
            const data = this.extractFormData(formData);
            
            // Validate form data
            const validationErrors = this.validateFormData(data);
            if (validationErrors.length > 0) {
                this.view.showValidationErrors(event.target, validationErrors);
                return;
            }
            
            // Show loading state
            this.view.showFormLoadingState(event.target);
            
            // Save turma
            let result;
            if (this.isEditing) {
                result = await this.service.update(this.currentTurmaId, data);
            } else {
                result = await this.service.create(data);
            }
            
            // Handle result
            if (result.success) {
                this.view.showSuccessState(event.target, result.data, this.isEditing);
                // Navigate back to list after success
                setTimeout(() => {
                    safeNavigateToList('turmas', {
                        fallback: () => window.turmasModule?.controller?.showList?.(),
                        context: 'turmas-editor:save-success'
                    });
                }, 2000);
            } else {
                throw new Error(result.error || 'Erro ao salvar turma');
            }
            
        } catch (error) {
            console.error('[TurmasEditor] Save error:', error);
            this.view.hideFormLoadingState(event.target);
            this.view.showFormError(event.target, error.message);
            this.handleError(error, 'TurmasEditor:save');
        }
    }

    /**
     * Extract and process form data
     */
    extractFormData(formData) {
        const data = {
            name: formData.get('name'),
            courseId: formData.get('courseId'),
            type: formData.get('type'),
            instructorId: formData.get('instructorId'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate') || null,
            maxStudents: parseInt(formData.get('maxStudents')) || 20,
            unitId: formData.get('unitId'),
            organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9', // Default organization
            schedule: {
                daysOfWeek: this.getSelectedDaysOfWeek(formData),
                time: formData.get('time') || '19:00',
                duration: parseInt(formData.get('duration')) || 60
            }
        };
        
        // Optional fields
        const room = formData.get('room');
        if (room) data.room = room;
        
        const price = formData.get('price');
        if (price) data.price = parseFloat(price);
        
        const description = formData.get('description');
        if (description) data.description = description;
        
        return data;
    }

    /**
     * Get selected days of week from form data
     */
    getSelectedDaysOfWeek(formData) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            if (formData.get(`day_${i}`)) {
                days.push(i);
            }
        }
        return days;
    }

    /**
     * Validate form data
     */
    validateFormData(data) {
        const errors = [];
        
        // Required fields
        if (!data.name || data.name.trim() === '') {
            errors.push({ field: 'name', message: 'Nome da turma é obrigatório' });
        }
        
        if (!data.courseId) {
            errors.push({ field: 'courseId', message: 'Curso é obrigatório' });
        }
        
        if (!data.type) {
            errors.push({ field: 'type', message: 'Tipo de turma é obrigatório' });
        }
        
        if (!data.instructorId) {
            errors.push({ field: 'instructorId', message: 'Instrutor é obrigatório' });
        }
        
        if (!data.startDate) {
            errors.push({ field: 'startDate', message: 'Data de início é obrigatória' });
        }
        
        if (!data.unitId) {
            errors.push({ field: 'unitId', message: 'Unidade é obrigatória' });
        }
        
        // Validate schedule
        if (!data.schedule.daysOfWeek || data.schedule.daysOfWeek.length === 0) {
            errors.push({ field: 'daysOfWeek', message: 'Selecione pelo menos um dia da semana' });
        }
        
        if (!data.schedule.time) {
            errors.push({ field: 'time', message: 'Horário é obrigatório' });
        }
        
        if (!data.schedule.duration || data.schedule.duration <= 0) {
            errors.push({ field: 'duration', message: 'Duração deve ser maior que 0' });
        }
        
        return errors;
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        console.log('[TurmasEditor] Cancel action triggered');
        safeNavigateToList('turmas', {
            fallback: () => window.turmasModule?.controller?.showList?.(),
            context: 'turmas-editor:cancel'
        });
    }

    /**
     * Handle navigation
     */
    handleNavigation(event) {
        const path = event.currentTarget.dataset.navigate;
        console.log('[TurmasEditor] Navigation triggered:', path);
        
        switch (path) {
            case '/':
                safeNavigateTo('dashboard', { context: 'turmas-editor:breadcrumb-dashboard' });
                break;
            case '/turmas':
                safeNavigateToList('turmas', {
                    fallback: () => window.turmasModule?.controller?.showList?.(),
                    context: 'turmas-editor:breadcrumb-turmas'
                });
                break;
        }
    }

    /**
     * Handle errors consistently
     */
    handleError(error, context) {
        console.error(`[TurmasEditor] Error in ${context}:`, error);
        
        // Try to use global error handler
        if (window.app && window.app.handleError) {
            window.app.handleError(error, context);
        }
        
        // Try to use global notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        console.log('[TurmasEditor] Destroying controller...');
        this.service = null;
        this.view = null;
        this.currentTurmaId = null;
        this.formData = {};
    }
}
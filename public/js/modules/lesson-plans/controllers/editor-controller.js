/**
 * Lesson Plan Editor Controller - Guidelines.MD Compliant
 * 
 * Manages the lesson plan editor with form validation, auto-save,
 * and comprehensive CRUD operations following the Students module pattern.
 */

export class LessonPlanEditorController {
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
        
        // Render initial HTML structure
        this.renderHTML();
        
        // Setup event listeners
        this.bindEvents(targetContainer);
        
        // Load data
        await this.loadData();
        
        console.log('✅ Lesson Plan editor controller renderizado');
    }

    /**
     * Render HTML structure
     */
    renderHTML() {
        const isEditing = !!this.planId;
        const title = this.isReadOnly ? 'Visualizar Plano de Aula' : 
                     isEditing ? 'Editar Plano de Aula' : 'Novo Plano de Aula';
        
        this.container.innerHTML = `
            <div class="module-isolated-container" data-module="lesson-plans">
                <!-- Header Section -->
                <div class="module-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button id="back-to-list-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-arrow-left"></i>
                                Voltar
                            </button>
                            <div class="header-title">
                                <h1 class="module-title">
                                    <span class="title-icon">📚</span>
                                    ${title}
                                </h1>
                                <p class="module-subtitle" id="plan-subtitle">
                                    ${isEditing ? 'Editando plano existente' : 'Criando novo plano de aula'}
                                </p>
                            </div>
                        </div>
                        <div class="header-actions">
                            ${!this.isReadOnly ? `
                                <button id="save-plan-btn" class="btn-form btn-primary-form" disabled>
                                    <i class="fas fa-save"></i>
                                    Salvar
                                </button>
                                ${isEditing ? `
                                    <button id="delete-plan-btn" class="btn-form btn-danger-form">
                                        <i class="fas fa-trash"></i>
                                        Excluir
                                    </button>
                                ` : ''}
                            ` : ''}
                            <button id="cancel-edit-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-times"></i>
                                ${this.isReadOnly ? 'Fechar' : 'Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div id="loading-state" class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Carregando plano de aula...</div>
                </div>

                <!-- Form Section -->
                <div class="module-content">
                    <form id="lesson-plan-form" class="lesson-plan-form">
                        <div class="form-grid">
                            <!-- Basic Information -->
                            <div class="form-section">
                                <h3 class="section-title">Informações Básicas</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-course" class="form-label required">
                                            Curso
                                        </label>
                                        <select id="plan-course" name="courseId" class="form-select" required ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="">Selecione um curso</option>
                                        </select>
                                        <div class="form-help">Curso ao qual este plano pertence</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-title" class="form-label required">
                                            Título do Plano
                                        </label>
                                        <input type="text" id="plan-title" name="title" 
                                               class="form-input" required maxlength="200"
                                               placeholder="Ex: Fundamentos de Defesa Pessoal"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Nome descritivo para o plano de aula</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-description" class="form-label">
                                            Descrição
                                        </label>
                                        <textarea id="plan-description" name="description" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Descrição detalhada do plano de aula..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Objetivos e conteúdo geral da aula</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Schedule Information -->
                            <div class="form-section">
                                <h3 class="section-title">Cronograma</h3>
                                
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
                                        <label for="plan-unit" class="form-label">
                                            Unidade
                                        </label>
                                        <input type="text" id="plan-unit" name="unit" 
                                               class="form-input" maxlength="100"
                                               placeholder="Ex: Unidade 1 - Básico"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Agrupamento temático (opcional)</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-duration" class="form-label required">
                                            Duração (minutos)
                                        </label>
                                        <input type="number" id="plan-duration" name="duration" 
                                               class="form-input" required min="15" max="180" value="60"
                                               ${this.isReadOnly ? 'readonly' : ''}>
                                        <div class="form-help">Tempo total da aula</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Level and Difficulty -->
                            <div class="form-section">
                                <h3 class="section-title">Nível e Dificuldade</h3>
                                
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
                                            <option value="5">Nível 5 - Expert</option>
                                        </select>
                                        <div class="form-help">Nível de experiência necessário</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="plan-difficulty" class="form-label required">
                                            Dificuldade
                                        </label>
                                        <select id="plan-difficulty" name="difficulty" class="form-select" required ${this.isReadOnly ? 'disabled' : ''}>
                                            <option value="">Selecione a dificuldade</option>
                                            <option value="1">⭐ Muito Fácil</option>
                                            <option value="2">⭐⭐ Fácil</option>
                                            <option value="3">⭐⭐⭐ Médio</option>
                                            <option value="4">⭐⭐⭐⭐ Difícil</option>
                                            <option value="5">⭐⭐⭐⭐⭐ Muito Difícil</option>
                                        </select>
                                        <div class="form-help">Complexidade do conteúdo</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Information -->
                            <div class="form-section">
                                <h3 class="section-title">Informações Complementares</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-objectives" class="form-label">
                                            Objetivos de Aprendizado
                                        </label>
                                        <textarea id="plan-objectives" name="objectives" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Objetivos específicos desta aula..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">O que os alunos devem aprender</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-materials" class="form-label">
                                            Materiais Necessários
                                        </label>
                                        <textarea id="plan-materials" name="materials" 
                                                  class="form-textarea" rows="2" maxlength="300"
                                                  placeholder="Equipamentos, materiais didáticos..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Lista de materiais e equipamentos</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="plan-notes" class="form-label">
                                            Observações
                                        </label>
                                        <textarea id="plan-notes" name="notes" 
                                                  class="form-textarea" rows="2" maxlength="500"
                                                  placeholder="Observações importantes, adaptações..."
                                                  ${this.isReadOnly ? 'readonly' : ''}></textarea>
                                        <div class="form-help">Anotações adicionais para o instrutor</div>
                                    </div>
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
                                        ${isEditing ? 'Atualizar Plano' : 'Criar Plano'}
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents(container) {
        // Back to list button
        const backBtn = container.querySelector('#back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Cancel buttons
        const cancelBtns = container.querySelectorAll('#cancel-edit-btn, #cancel-form-btn');
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCancel();
            });
        });

        if (!this.isReadOnly) {
            // Save button (header)
            const saveBtn = container.querySelector('#save-plan-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.handleSave();
                });
            }

            // Delete button
            const deleteBtn = container.querySelector('#delete-plan-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.handleDelete();
                });
            }

            // Form submission
            const form = container.querySelector('#lesson-plan-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSave();
                });
            }

            // Form input changes for auto-save and validation
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', this.handleInputChange);
                input.addEventListener('change', this.handleInputChange);
            });

            // Real-time validation
            this.setupValidation(container);
        }
    }

    /**
     * Setup form validation
     */
    setupValidation(container) {
        const requiredFields = container.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });
        });
    }

    /**
     * Validate individual field
     */
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

    /**
     * Validate entire form
     */
    validateForm() {
        const form = this.container.querySelector('#lesson-plan-form');
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Update save button state
        const saveBtn = this.container.querySelector('#save-plan-btn');
        const submitBtn = this.container.querySelector('#submit-form-btn');
        
        if (saveBtn) saveBtn.disabled = !isValid || !this.isDirty;
        if (submitBtn) submitBtn.disabled = !isValid;
        
        return isValid;
    }

    /**
     * Handle input changes
     */
    handleInputChange(event) {
        if (this.isReadOnly) return;
        
        this.isDirty = true;
        this.validateField(event.target);
        this.validateForm();
        
        // Schedule auto-save
        this.scheduleAutoSave();
        
        // Update save status
        this.updateSaveStatus('Alterações não salvas', 'warning');
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            if (this.isDirty && this.validateForm()) {
                this.autoSave();
            }
        }, 3000); // Auto-save after 3 seconds of inactivity
    }

    /**
     * Load data (courses, existing plan)
     */
    async loadData() {
        this.setLoading(true);
        
        try {
            // Load courses first
            await this.loadCourses();
            
            // Load existing plan if editing
            if (this.planId) {
                await this.loadPlan(this.planId);
            } else {
                this.initializeNewPlan();
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.updateSaveStatus('Erro ao carregar dados', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Load courses for dropdown
     */
    async loadCourses() {
        try {
            const result = await this.api.fetchWithStates('/api/courses', {
                method: 'GET',
                onSuccess: (data) => {
                    this.courses = data.data || [];
                    this.populateCourseDropdown();
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
     * Populate course dropdown
     */
    populateCourseDropdown() {
        const courseSelect = this.container.querySelector('#plan-course');
        if (!courseSelect || !this.courses.length) return;

        // Clear existing options except default
        const defaultOption = courseSelect.querySelector('option[value=""]');
        courseSelect.innerHTML = '';
        courseSelect.appendChild(defaultOption);

        this.courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    }

    /**
     * Load lesson plan data
     */
    async loadPlan(planId) {
        try {
            const result = await this.api.fetchWithStates(`/api/lesson-plans/${planId}`, {
                method: 'GET',
                onSuccess: (data) => {
                    this.plan = data.data || data;
                    this.populateForm();
                    this.updateSaveStatus('Dados carregados', 'success');
                },
                onError: (error) => {
                    console.error('Erro ao carregar plano de aula:', error);
                    this.updateSaveStatus('Erro ao carregar plano', 'error');
                }
            });
        } catch (error) {
            console.error('Erro ao carregar plano de aula:', error);
            this.updateSaveStatus('Erro ao carregar plano', 'error');
        }
    }

    /**
     * Initialize new plan
     */
    initializeNewPlan() {
        this.plan = {
            title: '',
            description: '',
            courseId: '',
            lessonNumber: 1,
            weekNumber: 1,
            unit: '',
            level: 1,
            duration: 60,
            difficulty: 3,
            objectives: '',
            materials: '',
            notes: ''
        };
        
        this.populateForm();
        this.updateSaveStatus('Novo plano de aula', 'info');
    }

    /**
     * Populate form with plan data
     */
    populateForm() {
        if (!this.plan) return;
        
        const form = this.container.querySelector('#lesson-plan-form');
        if (!form) return;
        
        // Populate all form fields
        Object.keys(this.plan).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && this.plan[key] !== null && this.plan[key] !== undefined) {
                field.value = this.plan[key];
            }
        });
        
        // Update subtitle with plan info
        if (this.plan.title) {
            const subtitle = this.container.querySelector('#plan-subtitle');
            if (subtitle) {
                subtitle.textContent = this.plan.title;
            }
        }
        
        // Reset dirty state after population
        this.isDirty = false;
        this.validateForm();
    }

    /**
     * Get form data
     */
    getFormData() {
        const form = this.container.querySelector('#lesson-plan-form');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            // Convert number fields
            if (['lessonNumber', 'weekNumber', 'level', 'duration', 'difficulty'].includes(key)) {
                data[key] = parseInt(value) || 0;
            } else {
                data[key] = value.trim();
            }
        }
        
        return data;
    }

    /**
     * Handle save
     */
    async handleSave() {
        if (!this.validateForm()) {
            this.updateSaveStatus('Corrija os erros no formulário', 'error');
            return;
        }

        this.setLoading(true);
        
        try {
            const planData = this.getFormData();
            const url = this.planId ? `/api/lesson-plans/${this.planId}` : '/api/lesson-plans';
            const method = this.planId ? 'PUT' : 'POST';

            await this.api.saveWithFeedback(url, planData, {
                method,
                onSuccess: (result) => {
                    this.plan = result.data || result;
                    this.planId = this.plan.id;
                    this.isDirty = false;
                    
                    this.updateSaveStatus('Plano salvo com sucesso', 'success');
                    
                    if (window.showBanner) {
                        window.showBanner('Plano de aula salvo com sucesso', 'success');
                    }
                    
                    // Update URL and header if creating new
                    if (!this.planId) {
                        this.planId = this.plan.id;
                        this.updateHeaderForEdit();
                    }
                },
                onError: (error) => {
                    this.updateSaveStatus('Erro ao salvar plano', 'error');
                    console.error('Erro ao salvar plano de aula:', error);
                }
            });

        } catch (error) {
            console.error('Erro ao salvar plano de aula:', error);
            this.updateSaveStatus('Erro ao salvar plano', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Auto-save functionality
     */
    async autoSave() {
        if (!this.planId || !this.isDirty || !this.validateForm()) return;
        
        try {
            const planData = this.getFormData();
            
            await this.api.saveWithFeedback(`/api/lesson-plans/${this.planId}`, planData, {
                method: 'PUT',
                onSuccess: () => {
                    this.isDirty = false;
                    this.updateSaveStatus('Salvo automaticamente', 'success');
                },
                onError: () => {
                    this.updateSaveStatus('Erro no salvamento automático', 'warning');
                }
            });

        } catch (error) {
            console.warn('Erro no auto-save:', error);
        }
    }

    /**
     * Handle delete
     */
    async handleDelete() {
        if (!this.planId) return;
        
        if (!confirm('Tem certeza que deseja excluir este plano de aula? Esta ação não pode ser desfeita.')) {
            return;
        }

        this.setLoading(true);

        try {
            await this.api.saveWithFeedback(`/api/lesson-plans/${this.planId}`, null, {
                method: 'DELETE',
                onSuccess: () => {
                    if (window.showBanner) {
                        window.showBanner('Plano de aula excluído com sucesso', 'success');
                    }
                    this.handleCancel(); // Return to list
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
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.isDirty && !this.isReadOnly && !confirm('Há alterações não salvas. Deseja descartar?')) {
            return;
        }
        
        // Return to lesson plans list
        window.openLessonPlansList(this.container);
    }

    /**
     * Update header for edit mode
     */
    updateHeaderForEdit() {
        const title = this.container.querySelector('.module-title');
        const subtitle = this.container.querySelector('#plan-subtitle');
        
        if (title) {
            title.innerHTML = '<span class="title-icon">📚</span>Editar Plano de Aula';
        }
        
        if (subtitle) {
            subtitle.textContent = 'Editando plano existente';
        }
        
        // Show delete button
        const deleteBtn = this.container.querySelector('#delete-plan-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
    }

    /**
     * Set loading state
     */
    setLoading(isLoading, text = 'Carregando...') {
        const loadingElement = this.container.querySelector('#loading-state');
        const loadingText = this.container.querySelector('#loading-state .loading-text');
        const formElement = this.container.querySelector('#lesson-plan-form');
        
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        if (formElement) {
            formElement.style.opacity = isLoading ? '0.6' : '1';
        }
        
        // Disable form controls during loading
        const controls = this.container.querySelectorAll('input, select, textarea, button');
        controls.forEach(control => {
            if (isLoading) {
                control.setAttribute('disabled', 'disabled');
            } else {
                control.removeAttribute('disabled');
            }
        });
    }

    /**
     * Update save status
     */
    updateSaveStatus(message, type = 'info') {
        const statusElement = this.container.querySelector('#save-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = `save-status save-status-${type}`;
        
        // Clear status after delay for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'save-status';
            }, 3000);
        }
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

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
    }

    /**
     * Collect form data
     */
    collectFormData() {
        console.log('🗂️ Collecting form data...');
        const container = this.container;
        if (!container) {
            console.error('❌ No container found for form data collection');
            return {};
        }
        
        const data = {};
        
        // Basic text fields
        const basicFields = [
            'courseId', 'title', 'description', 'unit', 'tacticalModule',
            'videoUrl', 'thumbnailUrl'
        ];
        
        basicFields.forEach(field => {
            const element = container.querySelector(`[name="${field}"], #${field}`);
            if (element && element.value && element.value.trim()) {
                data[field] = element.value.trim();
            }
        });

        // Numeric fields
        const numericFields = ['lessonNumber', 'weekNumber', 'level', 'difficulty', 'duration'];
        numericFields.forEach(field => {
            const element = container.querySelector(`[name="${field}"], #${field}`);
            if (element && element.value) {
                data[field] = parseInt(element.value) || 0;
            }
        });

        // Array fields (split by lines)
        const objectivesElement = container.querySelector('[name="objectives"], #objectives');
        if (objectivesElement && objectivesElement.value) {
            data.objectives = objectivesElement.value
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.trim());
        }

        const equipmentElement = container.querySelector('[name="equipment"], #equipment');
        if (equipmentElement && equipmentElement.value) {
            data.equipment = equipmentElement.value
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.trim());
        }

        // JSON/Text fields for lesson structure
        const structureFields = ['warmup', 'techniques', 'simulations', 'cooldown'];
        structureFields.forEach(field => {
            const element = container.querySelector(`[name="${field}"], #${field}`);
            if (element && element.value && element.value.trim()) {
                try {
                    // Try to parse as JSON first (for structured data)
                    data[field] = JSON.parse(element.value);
                } catch (e) {
                    // If not JSON, treat as string
                    data[field] = element.value.trim();
                }
            }
        });

        // Optional fields
        const optionalFields = ['mentalModule', 'adaptations'];
        optionalFields.forEach(field => {
            const element = container.querySelector(`[name="${field}"], #${field}`);
            if (element && element.value && element.value.trim()) {
                try {
                    // Try to parse as JSON if it looks like JSON
                    if (element.value.trim().startsWith('{') || element.value.trim().startsWith('[')) {
                        data[field] = JSON.parse(element.value);
                    } else {
                        data[field] = element.value.trim();
                    }
                } catch (e) {
                    data[field] = element.value.trim();
                }
            }
        });

        console.log('📝 Collected form data:', data);
        return data;
    }

    /**
     * Destroy controller
     */
    destroy() {
        // Clear auto-save timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        console.log('✅ Lesson Plan editor controller destruído');
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

                <!-- Tabs Navigation -->
                ${isEditing ? `
                <div class="tabs-premium">
                    <nav class="tabs-nav">
                        <button class="tab-btn active" data-tab="details" type="button">
                            <span class="tab-icon">📝</span>
                            <span class="tab-label">Detalhes do Plano</span>
                        </button>
                        <button class="tab-btn" data-tab="courses" type="button">
                            <span class="tab-icon">📚</span>
                            <span class="tab-label">Cursos Vinculados</span>
                        </button>
                        <button class="tab-btn" data-tab="financial" type="button">
                            <span class="tab-icon">💰</span>
                            <span class="tab-label">Informações Financeiras</span>
                        </button>
                    </nav>
                </div>
                ` : ''}

                <!-- Form Section -->
                <div class="module-content">
                    <!-- Tab: Details -->
                    <div id="tab-details" class="tab-panel active">
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
                    <!-- End Tab: Details -->

                    <!-- Tab: Courses -->
                    ${isEditing ? `
                    <div id="tab-courses" class="tab-panel">
                        <div class="data-card-premium">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">📚</span>
                                            Cursos Utilizando Este Plano
                                        </h3>
                                        <p class="section-subtitle">Cursos que incluem este plano de aula em seu cronograma</p>
                                    </div>
                                </div>
                            </div>
                            <div id="courses-content" class="section-body">
                                <div class="loading-state">
                                    <div class="loading-spinner"></div>
                                    <p>Carregando cursos...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    <!-- End Tab: Courses -->

                    <!-- Tab: Financial -->
                    ${isEditing ? `
                    <div id="tab-financial" class="tab-panel">
                        <div class="data-card-premium">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">💰</span>
                                            Informações Financeiras
                                        </h3>
                                        <p class="section-subtitle">Custo e valor associado a este plano de aula</p>
                                    </div>
                                </div>
                            </div>
                            <div id="financial-content" class="section-body">
                                <div class="loading-state">
                                    <div class="loading-spinner"></div>
                                    <p>Carregando informações financeiras...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    <!-- End Tab: Financial -->
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

        // Tab navigation (only for edit mode)
        if (this.planId) {
            const tabBtns = container.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabName = btn.dataset.tab;
                    this.switchTab(tabName);
                });
            });
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
        
        // Auto-save desativado por solicitação
        // this.scheduleAutoSave();
        
        // Update save status
        this.updateSaveStatus('Alterações não salvas', 'warning');
    }

    /**
     * Schedule auto-save (disabled)
     */
    scheduleAutoSave() {
        // Desativado
        return;
    }

    /**
     * Auto-save functionality (disabled)
     */
    async autoSave() {
        // Desativado
        return;
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
        console.log('💾 HandleSave called! isReadOnly:', this.isReadOnly);
        
        if (this.isReadOnly) {
            console.log('❌ Save blocked: read-only mode');
            return;
        }
        
        try {
            console.log('🔍 Validating form...');
            if (!this.validateForm()) {
                console.log('❌ Form validation failed');
                this.updateSaveStatus('Preencha os campos obrigatórios', 'error');
                return;
            }
            
            console.log('✅ Form validation passed');
            
            const planData = this.collectFormData();
            const url = this.planId ? `/api/lesson-plans/${this.planId}` : '/api/lesson-plans';
            const method = this.planId ? 'PUT' : 'POST';
            
            const saveBtn = this.container.querySelector('#save-plan-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            }
            
            await this.api.saveWithFeedback(url, planData, {
                method,
                onSuccess: () => {
                    this.isDirty = false;
                    this.updateSaveStatus('Plano salvo com sucesso', 'success');
                    window.showBanner?.('Plano salvo com sucesso', 'success');
                    setTimeout(() => {
                        window.openLessonPlansList?.(this.container);
                    }, 1000);
                },
                onError: (error) => {
                    console.error('Erro ao salvar plano de aula:', error);
                    this.updateSaveStatus('Erro ao salvar plano', 'error');
                    window.showBanner?.(`Erro ao salvar: ${error?.message || 'Falha'}`, 'error');
                }
            });
        } finally {
            const saveBtn = this.container.querySelector('#save-plan-btn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
            }
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

    // ============================================================================
    // TAB NAVIGATION & CONTENT LOADING
    // ============================================================================

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        if (!this.container) return;

        // Update tab buttons
        const tabBtns = this.container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panels
        const tabPanels = this.container.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            if (panel.id === `tab-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Load tab content if needed
        if (tabName === 'courses') {
            this.loadCoursesTab();
        } else if (tabName === 'financial') {
            this.loadFinancialTab();
        }
    }

    /**
     * Load courses tab content
     */
    async loadCoursesTab() {
        if (!this.planId) return;

        const coursesContent = this.container.querySelector('#courses-content');
        if (!coursesContent) return;

        coursesContent.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando cursos...</p>
            </div>
        `;

        try {
            // Buscar cursos que usam este lesson plan
            const response = await this.api.api.get(`/api/lesson-plans/${this.planId}/courses`);
            const courses = response?.data || [];

            if (courses.length === 0) {
                coursesContent.innerHTML = `
                    <div class="module-isolated-empty-state">
                        <div class="empty-icon">📚</div>
                        <h4>Nenhum curso vinculado</h4>
                        <p>Este plano de aula ainda não está sendo utilizado em nenhum curso ativo.</p>
                        <button class="btn-form btn-primary-form" onclick="window.openCoursesList()">
                            <i class="fas fa-plus"></i>
                            Adicionar a um Curso
                        </button>
                    </div>
                `;
                return;
            }

            // Renderizar lista de cursos
            coursesContent.innerHTML = `
                <div class="courses-list-premium">
                    ${courses.map(course => `
                        <div class="course-card-premium" data-course-id="${course.id}">
                            <div class="course-header">
                                <div class="course-info">
                                    <h4 class="course-name">${course.name}</h4>
                                    <p class="course-description">${course.description || 'Sem descrição'}</p>
                                </div>
                                <div class="course-badge">
                                    <span class="badge ${course.isActive ? 'badge-success' : 'badge-secondary'}">
                                        ${course.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                    </span>
                                </div>
                            </div>

                            <div class="course-details">
                                <div class="detail-row">
                                    <div class="detail-item">
                                        <span class="detail-label">📅 Aula Número:</span>
                                        <span class="detail-value">${this.plan?.lessonNumber || '—'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">📆 Semana:</span>
                                        <span class="detail-value">${this.plan?.weekNumber || '—'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">⏱️ Duração:</span>
                                        <span class="detail-value">${this.plan?.duration || 60} min</span>
                                    </div>
                                </div>

                                ${course.studentsCount ? `
                                <div class="detail-row">
                                    <div class="detail-item">
                                        <span class="detail-label">👥 Alunos Matriculados:</span>
                                        <span class="detail-value">${course.studentsCount}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">📊 Taxa de Conclusão:</span>
                                        <span class="detail-value">
                                            ${course.completionRate || 0}%
                                        </span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>

                            <div class="course-actions">
                                <button class="btn-small btn-secondary" onclick="window.openCourseEditor('${course.id}')">
                                    <i class="fas fa-eye"></i>
                                    Ver Curso
                                </button>
                                <button class="btn-small btn-primary" onclick="window.openCourseSchedule('${course.id}')">
                                    <i class="fas fa-calendar"></i>
                                    Ver Cronograma
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="courses-summary">
                    <div class="summary-card">
                        <div class="summary-icon">📊</div>
                        <div class="summary-content">
                            <div class="summary-value">${courses.length}</div>
                            <div class="summary-label">
                                ${courses.length === 1 ? 'Curso Utilizando' : 'Cursos Utilizando'}
                            </div>
                        </div>
                    </div>

                    <div class="summary-card">
                        <div class="summary-icon">👥</div>
                        <div class="summary-content">
                            <div class="summary-value">
                                ${courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0)}
                            </div>
                            <div class="summary-label">Alunos Impactados</div>
                        </div>
                    </div>

                    <div class="summary-card">
                        <div class="summary-icon">✅</div>
                        <div class="summary-content">
                            <div class="summary-value">
                                ${courses.filter(c => c.isActive).length}
                            </div>
                            <div class="summary-label">Cursos Ativos</div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Erro ao carregar cursos:', error);
            coursesContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao Carregar Cursos</h3>
                    <p>${error.message || 'Não foi possível carregar os cursos vinculados'}</p>
                    <button class="btn-form btn-primary-form" onclick="this.loadCoursesTab()">
                        <i class="fas fa-redo"></i>
                        Tentar Novamente
                    </button>
                </div>
            `;
            window.app?.handleError?.(error, 'lesson-plans:courses-tab');
        }
    }

    /**
     * Load financial tab content
     */
    async loadFinancialTab() {
        if (!this.planId) return;

        const financialContent = this.container.querySelector('#financial-content');
        if (!financialContent) return;

        financialContent.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Carregando informações financeiras...</p>
            </div>
        `;

        try {
            // Buscar dados financeiros do plano
            const response = await this.api.api.get(`/api/lesson-plans/${this.planId}/financial`);
            const financial = response?.data || {};

            // Renderizar informações financeiras
            financialContent.innerHTML = `
                <div class="financial-overview-premium">
                    <!-- Custo e Valor -->
                    <div class="stats-grid">
                        <div class="stat-card-enhanced stat-gradient-info">
                            <div class="stat-header">
                                <span class="stat-icon">💵</span>
                                <span class="stat-label">Custo de Produção</span>
                            </div>
                            <div class="stat-value">
                                R$ ${financial.productionCost?.toFixed(2) || '0,00'}
                            </div>
                            <div class="stat-meta">
                                Materiais, equipamentos e preparação
                            </div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-success">
                            <div class="stat-header">
                                <span class="stat-icon">💰</span>
                                <span class="stat-label">Valor de Mercado</span>
                            </div>
                            <div class="stat-value">
                                R$ ${financial.marketValue?.toFixed(2) || '0,00'}
                            </div>
                            <div class="stat-meta">
                                Valor estimado por aula
                            </div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-primary">
                            <div class="stat-header">
                                <span class="stat-icon">📊</span>
                                <span class="stat-label">ROI Estimado</span>
                            </div>
                            <div class="stat-value">
                                ${financial.roi ? `${financial.roi}%` : '—'}
                            </div>
                            <div class="stat-meta">
                                Retorno sobre investimento
                            </div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-warning">
                            <div class="stat-header">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-label">Horas de Preparação</span>
                            </div>
                            <div class="stat-value">
                                ${financial.preparationHours || 0}h
                            </div>
                            <div class="stat-meta">
                                Tempo investido no plano
                            </div>
                        </div>
                    </div>

                    <!-- Formulário de Edição Financeira -->
                    <div class="data-card-premium" style="margin-top: 2rem;">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">✏️</span>
                                        Editar Informações Financeiras
                                    </h3>
                                    <p class="section-subtitle">Atualize custos e valores associados a este plano</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            <form id="financial-form" class="form-premium">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">Custo de Produção</span>
                                            <span class="label-optional">(R$)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input type="number" 
                                                   id="production-cost" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   min="0"
                                                   value="${financial.productionCost || 0}"
                                                   placeholder="0,00">
                                        </div>
                                        <small class="form-help">Materiais, equipamentos, etc.</small>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">Valor de Mercado</span>
                                            <span class="label-optional">(R$)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input type="number" 
                                                   id="market-value" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   min="0"
                                                   value="${financial.marketValue || 0}"
                                                   placeholder="0,00">
                                        </div>
                                        <small class="form-help">Valor estimado da aula</small>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">Horas de Preparação</span>
                                        </label>
                                        <input type="number" 
                                               id="preparation-hours" 
                                               class="form-input" 
                                               step="0.5" 
                                               min="0"
                                               value="${financial.preparationHours || 0}"
                                               placeholder="0">
                                        <small class="form-help">Tempo investido na criação</small>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">ROI Estimado</span>
                                            <span class="label-optional">(%)</span>
                                        </label>
                                        <div class="input-with-suffix">
                                            <input type="number" 
                                                   id="roi" 
                                                   class="form-input" 
                                                   step="1" 
                                                   min="0"
                                                   value="${financial.roi || 0}"
                                                   placeholder="0">
                                            <span class="input-suffix">%</span>
                                        </div>
                                        <small class="form-help">Retorno esperado</small>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label class="form-label">
                                            <span class="label-text">Observações Financeiras</span>
                                        </label>
                                        <textarea id="financial-notes" 
                                                  class="form-textarea" 
                                                  rows="3"
                                                  placeholder="Notas adicionais sobre custos, investimentos, etc.">${financial.notes || ''}</textarea>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="save-financial" class="btn-form btn-primary-form">
                                        <i class="fas fa-save"></i>
                                        Salvar Informações Financeiras
                                    </button>
                                    <button type="button" id="reset-financial" class="btn-form btn-secondary-form">
                                        <i class="fas fa-undo"></i>
                                        Resetar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Análise de Custos -->
                    <div class="data-card-premium" style="margin-top: 2rem;">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">📈</span>
                                        Análise de Custos
                                    </h3>
                                    <p class="section-subtitle">Comparativo com outros planos de aula</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            <div class="cost-analysis">
                                <div class="analysis-item">
                                    <div class="analysis-label">Custo vs Média do Curso</div>
                                    <div class="analysis-bar">
                                        <div class="progress-bar-mini">
                                            <div class="progress-fill ${financial.costVsAverage > 100 ? 'progress-warning' : 'progress-success'}" 
                                                 style="width: ${Math.min(financial.costVsAverage || 0, 100)}%"></div>
                                        </div>
                                        <span class="analysis-value">${financial.costVsAverage || 0}%</span>
                                    </div>
                                </div>

                                <div class="analysis-item">
                                    <div class="analysis-label">Valor vs Mercado</div>
                                    <div class="analysis-bar">
                                        <div class="progress-bar-mini">
                                            <div class="progress-fill progress-info" 
                                                 style="width: ${Math.min(financial.valueVsMarket || 0, 100)}%"></div>
                                        </div>
                                        <span class="analysis-value">${financial.valueVsMarket || 0}%</span>
                                    </div>
                                </div>

                                <div class="analysis-item">
                                    <div class="analysis-label">Eficiência (Valor/Custo)</div>
                                    <div class="analysis-bar">
                                        <div class="progress-bar-mini">
                                            <div class="progress-fill progress-primary" 
                                                 style="width: ${Math.min(financial.efficiency || 0, 100)}%"></div>
                                        </div>
                                        <span class="analysis-value">${financial.efficiency || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Setup financial form events
            this.setupFinancialFormEvents();

        } catch (error) {
            console.error('❌ Erro ao carregar financeiro:', error);
            financialContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao Carregar Informações Financeiras</h3>
                    <p>${error.message || 'Não foi possível carregar os dados financeiros'}</p>
                    <button class="btn-form btn-primary-form" onclick="this.loadFinancialTab()">
                        <i class="fas fa-redo"></i>
                        Tentar Novamente
                    </button>
                </div>
            `;
            window.app?.handleError?.(error, 'lesson-plans:financial-tab');
        }
    }

    /**
     * Setup financial form event listeners
     */
    setupFinancialFormEvents() {
        const saveBtn = this.container.querySelector('#save-financial');
        const resetBtn = this.container.querySelector('#reset-financial');

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                await this.saveFinancialData();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.loadFinancialTab(); // Reload to reset
            });
        }
    }

    /**
     * Save financial data
     */
    async saveFinancialData() {
        if (!this.planId) return;

        const productionCost = parseFloat(this.container.querySelector('#production-cost')?.value || 0);
        const marketValue = parseFloat(this.container.querySelector('#market-value')?.value || 0);
        const preparationHours = parseFloat(this.container.querySelector('#preparation-hours')?.value || 0);
        const roi = parseFloat(this.container.querySelector('#roi')?.value || 0);
        const notes = this.container.querySelector('#financial-notes')?.value?.trim() || '';

        const saveBtn = this.container.querySelector('#save-financial');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        try {
            await this.api.api.patch(`/api/lesson-plans/${this.planId}/financial`, {
                productionCost,
                marketValue,
                preparationHours,
                roi,
                notes
            });

            window.app?.showToast?.('Informações financeiras salvas com sucesso!', 'success');
            
            // Reload tab to show updated data
            await this.loadFinancialTab();

        } catch (error) {
            console.error('❌ Erro ao salvar financeiro:', error);
            window.app?.handleError?.(error, 'lesson-plans:save-financial');
            window.app?.showToast?.('Erro ao salvar informações financeiras', 'error');

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Informações Financeiras';
            }
        }
    }

    /**
     * Load courses data for the lesson plan
     */
    async loadCoursesData(lessonPlanId) {
        const panel = this.container.querySelector('#tab-courses');
        if (!panel) return;

        panel.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">🔄</div>
                <p>Carregando cursos relacionados...</p>
            </div>
        `;

        try {
            // Carregar cursos que usam este plano de aula e cursos disponíveis
            const [relatedCoursesRes, availableCoursesRes] = await Promise.all([
                this.api.get(`/api/lesson-plans/${lessonPlanId}/courses`),
                this.api.get('/api/courses?active=true&pageSize=100')
            ]);

            const relatedCourses = relatedCoursesRes?.data || [];
            const availableCourses = availableCoursesRes?.data || [];
            const relatedCourseIds = new Set(relatedCourses.map(c => c.id));

            panel.innerHTML = `
                <div class="courses-management">
                    <!-- Cursos que Utilizam Este Plano -->
                    ${relatedCourses.length > 0 ? `
                    <div class="data-card-premium" style="margin-bottom: 1.5rem;">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">📚</span>
                                        Cursos que Utilizam Este Plano
                                    </h3>
                                    <p class="section-subtitle">${relatedCourses.length} curso(s) ativo(s)</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            <div class="courses-grid">
                                ${relatedCourses.map(course => `
                                    <div class="course-card">
                                        <div class="course-header">
                                            <div class="course-info">
                                                <h4 class="course-name">${course.name || 'Curso sem nome'}</h4>
                                                <p class="course-description">${course.description || 'Sem descrição'}</p>
                                            </div>
                                            <div class="course-status">
                                                <span class="status-badge status-${(course.isActive ? 'active' : 'inactive').toLowerCase()}">
                                                    ${course.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div class="course-stats">
                                            <div class="stat-item">
                                                <span class="stat-icon">👥</span>
                                                <span class="stat-label">Alunos:</span>
                                                <span class="stat-value">${course.studentsCount || 0}</span>
                                            </div>
                                            <div class="stat-item">
                                                <span class="stat-icon">📅</span>
                                                <span class="stat-label">Aulas:</span>
                                                <span class="stat-value">${course.lessonsCount || 0}</span>
                                            </div>
                                            <div class="stat-item">
                                                <span class="stat-icon">⏱️</span>
                                                <span class="stat-label">Duração:</span>
                                                <span class="stat-value">${course.duration || 'N/A'} semanas</span>
                                            </div>
                                        </div>

                                        <div class="course-meta">
                                            <div class="meta-item">
                                                <span class="meta-label">Modalidade:</span>
                                                <span class="meta-value">${course.modality || 'Presencial'}</span>
                                            </div>
                                            <div class="meta-item">
                                                <span class="meta-label">Nível:</span>
                                                <span class="meta-value">${course.level || 'Iniciante'}</span>
                                            </div>
                                        </div>
                                        
                                        <div class="course-actions">
                                            <button class="btn-small btn-secondary" onclick="window.openCourseDetails('${course.id}')">
                                                👁️ Ver Detalhes
                                            </button>
                                            <button class="btn-small btn-warning" onclick="window.removeLessonPlanFromCourse('${course.id}', '${lessonPlanId}')">
                                                ❌ Desvincular
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : `
                    <div class="module-isolated-empty-state" style="margin-bottom: 1.5rem;">
                        <div class="empty-icon">📚</div>
                        <h4>Nenhum curso vinculado</h4>
                        <p>Este plano de aula ainda não está sendo usado por nenhum curso</p>
                    </div>
                    `}

                    <!-- Cursos Disponíveis para Vincular -->
                    <div class="data-card-premium">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">➕</span>
                                        Vincular a Novos Cursos
                                    </h3>
                                    <p class="section-subtitle">Adicione este plano de aula a mais cursos</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            ${availableCourses.length === 0 ? `
                                <div class="module-isolated-empty-state">
                                    <div class="empty-icon">📭</div>
                                    <h4>Nenhum curso disponível</h4>
                                    <p>Não há cursos ativos disponíveis no momento</p>
                                    <button class="btn-form btn-primary-form" onclick="window.openCoursesManager()">
                                        Gerenciar Cursos
                                    </button>
                                </div>
                            ` : `
                                <div class="courses-grid">
                                    ${availableCourses.filter(c => !relatedCourseIds.has(c.id)).map(course => `
                                        <div class="course-card available" data-course-id="${course.id}">
                                            <div class="course-header">
                                                <div class="course-info">
                                                    <h4 class="course-name">${course.name}</h4>
                                                    <p class="course-description">${course.description || 'Sem descrição'}</p>
                                                </div>
                                                <div class="course-level">
                                                    <span class="level-badge">${course.level || 'Iniciante'}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="course-meta">
                                                <div class="meta-item">
                                                    <span class="meta-label">Duração:</span>
                                                    <span class="meta-value">${course.duration || 'N/A'} semanas</span>
                                                </div>
                                                <div class="meta-item">
                                                    <span class="meta-label">Modalidade:</span>
                                                    <span class="meta-value">${course.modality || 'Presencial'}</span>
                                                </div>
                                                <div class="meta-item">
                                                    <span class="meta-label">Alunos:</span>
                                                    <span class="meta-value">${course.studentsCount || 0}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="course-actions">
                                                <button class="btn-form btn-primary-form btn-block" 
                                                        onclick="window.linkLessonPlanToCourse('${lessonPlanId}', '${course.id}', '${course.name}')">
                                                    ✅ Vincular ao Curso
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                ${availableCourses.filter(c => !relatedCourseIds.has(c.id)).length === 0 ? `
                                    <div class="module-isolated-empty-state">
                                        <div class="empty-icon">✅</div>
                                        <h4>Todos os cursos já vinculados</h4>
                                        <p>Este plano de aula já está vinculado a todos os cursos disponíveis</p>
                                    </div>
                                ` : ''}
                            `}
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ Erro ao carregar cursos:', error);
            panel.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao Carregar Cursos</h3>
                    <p>${error.message || 'Erro desconhecido'}</p>
                    <button class="btn-form btn-primary-form" onclick="lessonPlanEditor.loadCoursesData('${lessonPlanId}')">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
            window.app?.handleError?.(error, 'lesson-plans:load-courses');
        }
    }

    /**
     * Load financial data for the lesson plan
     */
    async loadFinancialData(lessonPlanId) {
        const panel = this.container.querySelector('#tab-financial');
        if (!panel) return;

        panel.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner">🔄</div>
                <p>Carregando informações financeiras...</p>
            </div>
        `;

        try {
            // Carregar dados financeiros do plano de aula
            const response = await this.api.get(`/api/lesson-plans/${lessonPlanId}/financial`);
            const financial = response?.data || {};

            panel.innerHTML = `
                <div class="financial-management">
                    <!-- Stats Overview -->
                    <div class="stats-grid" style="margin-bottom: 2rem;">
                        <div class="stat-card-enhanced stat-gradient-primary">
                            <div class="stat-header">
                                <span class="stat-icon">💰</span>
                                <span class="stat-label">Custo por Aula</span>
                            </div>
                            <div class="stat-value">R$ ${financial.costPerClass || '0,00'}</div>
                            <div class="stat-meta">Valor estimado</div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-success">
                            <div class="stat-header">
                                <span class="stat-icon">👥</span>
                                <span class="stat-label">Alunos Impactados</span>
                            </div>
                            <div class="stat-value">${financial.totalStudents || 0}</div>
                            <div class="stat-meta">Em ${financial.totalCourses || 0} curso(s)</div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-info">
                            <div class="stat-header">
                                <span class="stat-icon">📊</span>
                                <span class="stat-label">Receita Estimada</span>
                            </div>
                            <div class="stat-value">R$ ${financial.estimatedRevenue || '0,00'}</div>
                            <div class="stat-meta">Por ciclo completo</div>
                        </div>

                        <div class="stat-card-enhanced stat-gradient-warning">
                            <div class="stat-header">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-label">Tempo de Instrução</span>
                            </div>
                            <div class="stat-value">${financial.totalHours || 0}h</div>
                            <div class="stat-meta">${financial.totalClasses || 0} aula(s)</div>
                        </div>
                    </div>

                    <!-- Configurações Financeiras -->
                    <div class="data-card-premium">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">⚙️</span>
                                        Configurações Financeiras
                                    </h3>
                                    <p class="section-subtitle">Custos e valores associados ao plano de aula</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            <form id="financial-form" class="form-premium">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">💰 Custo por Aula</span>
                                            <span class="label-optional">(opcional)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input id="cost-per-class" 
                                                   type="number" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   placeholder="50,00"
                                                   value="${financial.costPerClass || ''}"
                                                   min="0">
                                        </div>
                                        <small class="form-help">Custo estimado para executar uma aula deste plano</small>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">👨‍🏫 Custo do Instrutor</span>
                                            <span class="label-optional">(opcional)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input id="instructor-cost" 
                                                   type="number" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   placeholder="100,00"
                                                   value="${financial.instructorCost || ''}"
                                                   min="0">
                                        </div>
                                        <small class="form-help">Remuneração do instrutor por aula</small>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">📦 Custo de Materiais</span>
                                            <span class="label-optional">(opcional)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input id="materials-cost" 
                                                   type="number" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   placeholder="30,00"
                                                   value="${financial.materialsCost || ''}"
                                                   min="0">
                                        </div>
                                        <small class="form-help">Custo de materiais e equipamentos por aula</small>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">
                                            <span class="label-text">🏢 Custos Operacionais</span>
                                            <span class="label-optional">(opcional)</span>
                                        </label>
                                        <div class="input-with-prefix">
                                            <span class="input-prefix">R$</span>
                                            <input id="operational-cost" 
                                                   type="number" 
                                                   class="form-input" 
                                                   step="0.01" 
                                                   placeholder="20,00"
                                                   value="${financial.operationalCost || ''}"
                                                   min="0">
                                        </div>
                                        <small class="form-help">Aluguel, energia, limpeza, etc. por aula</small>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label class="form-label">
                                            <span class="label-text">📝 Observações Financeiras</span>
                                            <span class="label-optional">(opcional)</span>
                                        </label>
                                        <textarea id="financial-notes" 
                                                  class="form-textarea" 
                                                  rows="3" 
                                                  placeholder="Detalhes adicionais sobre custos, investimentos especiais..."
                                                  maxlength="500">${financial.notes || ''}</textarea>
                                        <small class="form-help">Anotações sobre custos e investimentos</small>
                                    </div>
                                </div>

                                <!-- Calculated Totals -->
                                <div class="financial-summary">
                                    <div class="summary-card">
                                        <div class="summary-label">💰 Custo Total por Aula</div>
                                        <div class="summary-value" id="total-cost-display">R$ 0,00</div>
                                    </div>
                                    <div class="summary-card">
                                        <div class="summary-label">📊 Margem Estimada</div>
                                        <div class="summary-value" id="margin-display">—</div>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="save-financial-btn" class="btn-form btn-primary-form">
                                        <i class="fas fa-save"></i>
                                        Salvar Informações Financeiras
                                    </button>
                                    <button type="button" id="reset-financial-btn" class="btn-form btn-secondary-form">
                                        <i class="fas fa-undo"></i>
                                        Resetar Valores
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Análise de Rentabilidade -->
                    ${financial.totalCourses > 0 ? `
                    <div class="data-card-premium" style="margin-top: 1.5rem;">
                        <div class="module-header-premium">
                            <div class="header-content">
                                <div class="header-left">
                                    <h3 class="section-title">
                                        <span class="section-icon">📈</span>
                                        Análise de Rentabilidade
                                    </h3>
                                    <p class="section-subtitle">Impacto financeiro dos cursos que usam este plano</p>
                                </div>
                            </div>
                        </div>

                        <div class="section-body">
                            <div class="profitability-breakdown">
                                ${(financial.courseBreakdown || []).map(course => `
                                    <div class="course-financial-item">
                                        <div class="course-info-compact">
                                            <h4>${course.courseName}</h4>
                                            <span class="course-students">${course.studentsCount} aluno(s)</span>
                                        </div>
                                        <div class="course-financials">
                                            <div class="financial-metric">
                                                <span class="metric-label">Receita:</span>
                                                <span class="metric-value positive">+ R$ ${course.revenue || '0,00'}</span>
                                            </div>
                                            <div class="financial-metric">
                                                <span class="metric-label">Custos:</span>
                                                <span class="metric-value negative">- R$ ${course.costs || '0,00'}</span>
                                            </div>
                                            <div class="financial-metric">
                                                <span class="metric-label">Lucro:</span>
                                                <span class="metric-value ${course.profit >= 0 ? 'positive' : 'negative'}">
                                                    ${course.profit >= 0 ? '+' : ''} R$ ${course.profit || '0,00'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;

            // Setup event listeners
            this.setupFinancialEventListeners(lessonPlanId);

        } catch (error) {
            console.error('❌ Erro ao carregar financeiro:', error);
            panel.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao Carregar Dados Financeiros</h3>
                    <p>${error.message || 'Erro desconhecido'}</p>
                    <button class="btn-form btn-primary-form" onclick="lessonPlanEditor.loadFinancialData('${lessonPlanId}')">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
            window.app?.handleError?.(error, 'lesson-plans:load-financial');
        }
    }

    /**
     * Setup financial form event listeners
     */
    setupFinancialEventListeners(lessonPlanId) {
        const costInputs = [
            this.container.querySelector('#cost-per-class'),
            this.container.querySelector('#instructor-cost'),
            this.container.querySelector('#materials-cost'),
            this.container.querySelector('#operational-cost')
        ];

        const totalDisplay = this.container.querySelector('#total-cost-display');
        const marginDisplay = this.container.querySelector('#margin-display');

        // Calculate total costs on input change
        const updateTotals = () => {
            const total = costInputs.reduce((sum, input) => {
                const value = parseFloat(input?.value || '0');
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            if (totalDisplay) {
                totalDisplay.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            }

            // Simple margin calculation (assuming average class revenue of R$ 150)
            if (marginDisplay) {
                const avgRevenue = 150;
                const margin = ((avgRevenue - total) / avgRevenue * 100).toFixed(1);
                marginDisplay.textContent = `${margin}%`;
                marginDisplay.style.color = margin > 0 ? 'var(--color-success)' : 'var(--color-error)';
            }
        };

        costInputs.forEach(input => {
            input?.addEventListener('input', updateTotals);
        });

        // Initial calculation
        updateTotals();

        // Save button
        const saveBtn = this.container.querySelector('#save-financial-btn');
        saveBtn?.addEventListener('click', () => this.saveFinancialData(lessonPlanId));

        // Reset button
        const resetBtn = this.container.querySelector('#reset-financial-btn');
        resetBtn?.addEventListener('click', () => {
            costInputs.forEach(input => {
                if (input) input.value = '';
            });
            const notesInput = this.container.querySelector('#financial-notes');
            if (notesInput) notesInput.value = '';
            updateTotals();
        });
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

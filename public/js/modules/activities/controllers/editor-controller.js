/**
 * Activity Editor Controller - Guidelines.MD Compliant
 * 
 * Manages the activity editor with form validation, auto-save,
 * and comprehensive CRUD operations.
 */

export class ActivityEditorController {
    constructor(api) {
        this.api = api;
        this.container = null;
        this.activityId = null;
        this.activity = null;
        this.isLoading = false;
        this.isDirty = false;
        this.autoSaveTimeout = null;
        
        // Bind methods to preserve context
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    /**
     * Render the activity editor in the target container
     */
    async render(targetContainer, activityId = null) {
        console.log('🏋️ Renderizando editor de atividade');
        console.log('🏋️ Container:', targetContainer);
        console.log('🏋️ Activity ID:', activityId);
        
        this.container = targetContainer;
        this.activityId = activityId;
        
        // Mark container as activities module
        targetContainer.setAttribute('data-module', 'activities');
        targetContainer.setAttribute('data-active', 'true');
        targetContainer.classList.add('module-active');
        
        // Clear any existing content and timers
        targetContainer.innerHTML = '';
        
        // Render initial HTML structure
        this.renderHTML();
        
        // Setup event listeners
        this.bindEvents(targetContainer);
        
        // Load activity data if editing
        if (activityId) {
            await this.loadActivity(activityId);
        } else {
            this.initializeNewActivity();
        }
        
        console.log('✅ Activity editor controller renderizado');
    }

    /**
     * Render HTML structure
     */
    renderHTML() {
        const isEditing = !!this.activityId;
        
        this.container.innerHTML = `
            <div class="module-isolated-container" data-module="activities">
                <!-- Header Section -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <button id="back-to-list-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-arrow-left"></i>
                                Voltar
                            </button>
                            <div class="header-title">
                                <h1 class="module-title">
                                    <span class="title-icon">🏋️</span>
                                    ${isEditing ? 'Editar Atividade' : 'Nova Atividade'}
                                </h1>
                                <p class="module-subtitle">
                                    ${isEditing ? 'Atualize as informações da atividade' : 'Preencha os dados da nova atividade'}
                                </p>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button id="save-activity-btn" class="btn-form btn-primary-form" disabled>
                                <i class="fas fa-save"></i>
                                Salvar
                            </button>
                            <button id="cancel-edit-btn" class="btn-form btn-secondary-form">
                                <i class="fas fa-times"></i>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div id="loading-state" class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Carregando atividade...</div>
                </div>

                <!-- Form Section -->
                <div class="module-content">
                    <form id="activity-form" class="activity-form">
                        <div class="form-grid">
                            <!-- Basic Information -->
                            <div class="form-section">
                                <h3 class="section-title">Informações Básicas</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-title" class="form-label required">
                                            Título da Atividade
                                        </label>
                                        <input type="text" id="activity-title" name="title" 
                                               class="form-input" required maxlength="200"
                                               placeholder="Ex: Aquecimento com Polichinelos">
                                        <div class="form-help">Nome que identificará esta atividade</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-description" class="form-label">
                                            Descrição Detalhada
                                        </label>
                                        <textarea id="activity-description" name="description" 
                                                  class="form-textarea" rows="4" maxlength="1000"
                                                  placeholder="Descreva detalhadamente como executar esta atividade..."></textarea>
                                        <div class="form-help">Instruções completas para execução da atividade</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-type" class="form-label required">
                                            Tipo de Atividade
                                        </label>
                                        <select id="activity-type" name="type" class="form-select" required>
                                            <option value="">Selecione o tipo</option>
                                            <option value="TECHNIQUE">Técnica</option>
                                            <option value="STRETCH">Alongamento</option>
                                            <option value="DRILL">Drill</option>
                                            <option value="EXERCISE">Exercício</option>
                                            <option value="GAME">Jogo</option>
                                            <option value="CHALLENGE">Desafio</option>
                                            <option value="ASSESSMENT">Avaliação</option>
                                        </select>
                                        <div class="form-help">Categoria que melhor descreve esta atividade</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="activity-difficulty" class="form-label required">
                                            Nível de Dificuldade
                                        </label>
                                        <select id="activity-difficulty" name="difficulty" class="form-select" required>
                                            <option value="">Selecione a dificuldade</option>
                                            <option value="1">⭐ Muito Fácil</option>
                                            <option value="2">⭐⭐ Fácil</option>
                                            <option value="3">⭐⭐⭐ Médio</option>
                                            <option value="4">⭐⭐⭐⭐ Difícil</option>
                                            <option value="5">⭐⭐⭐⭐⭐ Muito Difícil</option>
                                        </select>
                                        <div class="form-help">Complexidade técnica e física da atividade</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-duration" class="form-label required">
                                            Duração (minutos)
                                        </label>
                                        <input type="number" id="activity-duration" name="duration" 
                                               class="form-input" required min="1" max="120" value="5">
                                        <div class="form-help">Tempo estimado para execução</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="activity-participants" class="form-label">
                                            Número de Participantes
                                        </label>
                                        <input type="text" id="activity-participants" name="participants" 
                                               class="form-input" placeholder="Ex: 1-20 pessoas, Individual, Duplas">
                                        <div class="form-help">Quantas pessoas podem participar</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Equipment and Requirements -->
                            <div class="form-section">
                                <h3 class="section-title">Equipamentos e Requisitos</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-equipment" class="form-label">
                                            Equipamentos Necessários
                                        </label>
                                        <input type="text" id="activity-equipment" name="equipment" 
                                               class="form-input" 
                                               placeholder="Ex: Colchonetes, Cones, Bolas">
                                        <div class="form-help">Separe múltiplos equipamentos por vírgula</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-space" class="form-label">
                                            Espaço Necessário
                                        </label>
                                        <input type="text" id="activity-space" name="space" 
                                               class="form-input" 
                                               placeholder="Ex: Tatame 4x4m, Área livre 6x6m">
                                        <div class="form-help">Descrição do espaço físico necessário</div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="activity-safety" class="form-label">
                                            Cuidados de Segurança
                                        </label>
                                        <input type="text" id="activity-safety" name="safety" 
                                               class="form-input" 
                                               placeholder="Ex: Supervisão próxima, Aquecimento prévio">
                                        <div class="form-help">Precauções importantes para esta atividade</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Pedagogical Information -->
                            <div class="form-section">
                                <h3 class="section-title">Informações Pedagógicas</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-objectives" class="form-label">
                                            Objetivos de Aprendizado
                                        </label>
                                        <textarea id="activity-objectives" name="objectives" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Quais habilidades esta atividade desenvolve?"></textarea>
                                        <div class="form-help">Competências que serão desenvolvidas</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-variations" class="form-label">
                                            Variações e Progressões
                                        </label>
                                        <textarea id="activity-variations" name="variations" 
                                                  class="form-textarea" rows="3" maxlength="500"
                                                  placeholder="Como adaptar para diferentes níveis?"></textarea>
                                        <div class="form-help">Maneiras de adaptar a dificuldade</div>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="activity-notes" class="form-label">
                                            Observações Adicionais
                                        </label>
                                        <textarea id="activity-notes" name="notes" 
                                                  class="form-textarea" rows="2" maxlength="300"
                                                  placeholder="Dicas importantes, limitações, etc."></textarea>
                                        <div class="form-help">Informações complementares sobre a atividade</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Form Actions -->
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
                                    ${isEditing ? 'Atualizar Atividade' : 'Criar Atividade'}
                                </button>
                            </div>
                        </div>
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

        // Save button (header)
        const saveBtn = container.querySelector('#save-activity-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleSave();
            });
        }

        // Form submission
        const form = container.querySelector('#activity-form');
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
        const form = this.container.querySelector('#activity-form');
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        // Update save button state
        const saveBtn = this.container.querySelector('#save-activity-btn');
        const submitBtn = this.container.querySelector('#submit-form-btn');
        
        if (saveBtn) saveBtn.disabled = !isValid || !this.isDirty;
        if (submitBtn) submitBtn.disabled = !isValid;
        
        return isValid;
    }

    /**
     * Handle input changes
     */
    handleInputChange(event) {
        this.isDirty = true;
        this.validateForm();
        
        // Auto-save after 2 seconds of inactivity
        if (this.activityId) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                if (this.validateForm()) {
                    this.autoSave();
                }
            }, 2000);
        }
        
        // Update save status
        this.updateSaveStatus('Alterações não salvas', 'pending');
    }

    /**
     * Load activity data
     */
    async loadActivity(activityId) {
        this.setLoading(true, 'Carregando atividade...');
        
        try {
            const result = await this.api.fetchWithStates(`/api/activities/${activityId}`, {
                method: 'GET',
                onSuccess: (data) => {
                    this.activity = data.data || data;
                    this.populateForm();
                },
                onError: (error) => {
                    console.error('Erro ao carregar atividade:', error);
                    if (window.showBanner) {
                        window.showBanner('Erro ao carregar atividade', 'error');
                    }
                    // Go back to list on error
                    window.openActivitiesList(this.container);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar atividade:', error);
            if (window.showBanner) {
                window.showBanner('Erro ao carregar atividade', 'error');
            }
            window.openActivitiesList(this.container);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Initialize new activity
     */
    initializeNewActivity() {
        this.activity = {
            title: '',
            description: '',
            type: '',
            difficulty: 3,
            duration: 5,
            participants: '',
            equipment: '',
            space: '',
            safety: '',
            objectives: '',
            variations: '',
            notes: ''
        };
        
        this.populateForm();
    }

    /**
     * Populate form with activity data
     */
    populateForm() {
        if (!this.activity) return;
        
        const form = this.container.querySelector('#activity-form');
        if (!form) return;
        
        // Populate all form fields
        Object.keys(this.activity).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field && this.activity[key] !== null && this.activity[key] !== undefined) {
                field.value = this.activity[key];
            }
        });
        
        // Reset dirty state after population
        this.isDirty = false;
        this.validateForm();
        this.updateSaveStatus('Dados carregados', 'success');
    }

    /**
     * Get form data
     */
    getFormData() {
        const form = this.container.querySelector('#activity-form');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            // Convert number fields
            if (['difficulty', 'duration'].includes(key)) {
                data[key] = parseInt(value) || (key === 'difficulty' ? 3 : 5);
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
            if (window.showBanner) {
                window.showBanner('Por favor, preencha todos os campos obrigatórios', 'warning');
            }
            return;
        }
        
        this.setLoading(true, 'Salvando atividade...');
        
        try {
            const data = this.getFormData();
            const url = this.activityId ? `/api/activities/${this.activityId}` : '/api/activities';
            const method = this.activityId ? 'PUT' : 'POST';
            
            await this.api.saveWithFeedback(url, data, {
                method,
                onSuccess: (result) => {
                    this.isDirty = false;
                    this.updateSaveStatus('Salvo com sucesso', 'success');
                    
                    if (window.showBanner) {
                        window.showBanner(
                            this.activityId ? 'Atividade atualizada com sucesso' : 'Atividade criada com sucesso',
                            'success'
                        );
                    }
                    
                    // If creating new activity, redirect to list
                    if (!this.activityId) {
                        setTimeout(() => {
                            window.openActivitiesList(this.container);
                        }, 1000);
                    } else {
                        // Update activity ID if it was created
                        if (result.data?.id && !this.activityId) {
                            this.activityId = result.data.id;
                        }
                    }
                },
                onError: (error) => {
                    console.error('Erro ao salvar atividade:', error);
                    this.updateSaveStatus('Erro ao salvar', 'error');
                    
                    if (window.showBanner) {
                        window.showBanner('Erro ao salvar atividade', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao salvar atividade:', error);
            this.updateSaveStatus('Erro ao salvar', 'error');
            
            if (window.showBanner) {
                window.showBanner('Erro ao salvar atividade', 'error');
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Auto-save functionality
     */
    async autoSave() {
        if (!this.activityId || !this.isDirty) return;
        
        try {
            const data = this.getFormData();
            
            await this.api.saveWithFeedback(`/api/activities/${this.activityId}`, data, {
                method: 'PUT',
                onSuccess: () => {
                    this.isDirty = false;
                    this.updateSaveStatus('Auto-salvo', 'success');
                },
                onError: (error) => {
                    console.error('Erro no auto-save:', error);
                    this.updateSaveStatus('Erro no auto-save', 'error');
                }
            });
        } catch (error) {
            console.error('Erro no auto-save:', error);
        }
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.isDirty) {
            if (!confirm('Você tem alterações não salvas. Deseja realmente sair sem salvar?')) {
                return;
            }
        }
        
        window.openActivitiesList(this.container);
    }

    /**
     * Set loading state
     */
    setLoading(isLoading, text = 'Carregando...') {
        const loadingElement = this.container.querySelector('#loading-state');
        const loadingText = this.container.querySelector('.loading-text');
        const form = this.container.querySelector('#activity-form');
        
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        if (form) {
            form.style.opacity = isLoading ? '0.6' : '1';
        }
        
        // Disable form elements during loading
        const inputs = this.container.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            input.disabled = isLoading;
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
        
        // Clear status after a few seconds for success/error messages
        if (type === 'success' || type === 'error') {
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
        
        console.log('✅ Activity editor controller destruído');
    }
}

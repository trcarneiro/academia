/**
 * Turmas Editor View
 * Renders the turma editor interface following GUIDELINES2.md
 */

export class TurmasEditorView {
    constructor() {
        console.log('🎨 [TurmasEditorView] View initialized');
    }

    /**
     * Render the editor interface
     */
    async render(container, options = {}) {
        console.log('🎨 [TurmasEditorView] Rendering view...', options);
        
        const { isEditing = false, formData = {} } = options;
        
        container.innerHTML = `
            <div class="module-isolated-turmas-editor">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-breadcrumb">
                            <span class="breadcrumb-item clickable" data-navigate="/">🏠 Início</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item clickable" data-navigate="/turmas">👥 Turmas</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item active">${isEditing ? '✏️ Editar' : '➕ Nova'} Turma</span>
                        </div>
                        <div class="module-header-actions">
                            <button class="btn-action-secondary" id="btn-cancel-editor">
                                <i class="icon">❌</i>
                                <span>Cancelar</span>
                            </button>
                        </div>
                    </div>
                    <h1 class="module-title">${isEditing ? 'Editar Turma' : 'Nova Turma'}</h1>
                    <p class="module-subtitle">${isEditing 
                        ? 'Atualize as informações da turma' 
                        : 'Crie uma nova turma para executar o cronograma de um curso'}</p>
                </div>

                <!-- Loading State -->
                <div class="module-loading-state hidden">
                    <div class="loading-spinner"></div>
                    <p>Carregando editor de turma...</p>
                </div>

                <!-- Error State -->
                <div class="module-error-state hidden">
                    <div class="error-icon">❌</div>
                    <h3>Erro ao carregar editor</h3>
                    <p id="error-message">Ocorreu um erro inesperado.</p>
                    <button class="btn-action-secondary" id="retry-btn">
                        <i class="icon">🔄</i>
                        <span>Tentar Novamente</span>
                    </button>
                </div>

                <!-- Success State -->
                <div class="module-success-state hidden">
                    <div class="success-icon">✅</div>
                    <h3 id="success-title">Turma salva com sucesso!</h3>
                    <p id="success-message">A turma foi criada/atualizada com sucesso.</p>
                    <button class="btn-action-primary" id="view-turma-btn">
                        <i class="icon">👁️</i>
                        <span>Visualizar Turma</span>
                    </button>
                </div>

                <!-- Main Form -->
                <form id="turma-editor-form" class="module-form-premium">
                    <!-- Form Tabs -->
                    <div class="form-tabs-nav">
                        <button type="button" class="tab-button active" data-tab="general">
                            <i class="icon">📝</i>
                            <span>Geral</span>
                        </button>
                        <button type="button" class="tab-button" data-tab="schedule">
                            <i class="icon">⏰</i>
                            <span>Horário</span>
                        </button>
                        <button type="button" class="tab-button" data-tab="configuration">
                            <i class="icon">⚙️</i>
                            <span>Configuração</span>
                        </button>
                    </div>

                    <div class="form-tabs-content">
                        <!-- General Tab -->
                        <div id="tab-general" class="tab-panel active">
                            ${this.renderGeneralTab(formData)}
                        </div>

                        <!-- Schedule Tab -->
                        <div id="tab-schedule" class="tab-panel">
                            ${this.renderScheduleTab(formData)}
                        </div>

                        <!-- Configuration Tab -->
                        <div id="tab-configuration" class="tab-panel">
                            ${this.renderConfigurationTab(formData)}
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="button" class="btn-action-secondary" id="btn-cancel-form">
                            <i class="icon">❌</i>
                            <span>Cancelar</span>
                        </button>
                        <button type="submit" class="btn-action-premium">
                            <i class="icon">${isEditing ? '💾' : '➕'}</i>
                            <span id="submit-text">${isEditing ? 'Atualizar' : 'Criar'} Turma</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Add container classes for Design System validator
        container.classList.add('module-isolated-container');
        container.setAttribute('data-module', 'turmas-editor');
    }

    /**
     * Render general tab content
     */
    renderGeneralTab(formData = {}) {
        const turma = formData.turma || {};
        const courses = formData.courses || [];
        const instructors = formData.instructors || [];

        return `
            <div class="form-section">
                <div class="section-header">
                    <h3>📋 Informações Básicas</h3>
                    <p>Dados principais da turma</p>
                </div>
                
                <div class="form-grid">
                    <div class="form-group span-2">
                        <label for="name" class="required">📝 Nome da Turma</label>
                        <input type="text" id="name" name="name" class="form-input-premium" 
                               placeholder="Ex: Krav Maga Básico - Manhã" 
                               value="${turma.name || ''}" required>
                        <div class="field-error hidden" id="name-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="courseId" class="required">📚 Curso</label>
                        <select id="courseId" name="courseId" class="form-select-premium" required>
                            <option value="">Selecione um curso</option>
                            ${courses.map(course => 
                                `<option value="${course.id}" ${turma.courseId === course.id ? 'selected' : ''}>${course.name}</option>`
                            ).join('')}
                        </select>
                        <div class="field-error hidden" id="courseId-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="type" class="required">🎯 Tipo</label>
                        <select id="type" name="type" class="form-select-premium" required>
                            <option value="">Selecione o tipo</option>
                            <option value="COLLECTIVE" ${turma.type === 'COLLECTIVE' ? 'selected' : ''}>Coletivo</option>
                            <option value="PRIVATE" ${turma.type === 'PRIVATE' ? 'selected' : ''}>Particular</option>
                        </select>
                        <div class="field-error hidden" id="type-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="instructorId" class="required">👨‍🏫 Instrutor</label>
                        <select id="instructorId" name="instructorId" class="form-select-premium" required>
                            <option value="">Selecione um instrutor</option>
                            ${instructors.map(instructor => 
                                `<option value="${instructor.id}" ${turma.instructorId === instructor.id ? 'selected' : ''}>${instructor.name}</option>`
                            ).join('')}
                        </select>
                        <div class="field-error hidden" id="instructorId-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="maxStudents">👥 Máximo de Alunos</label>
                        <input type="number" id="maxStudents" name="maxStudents" 
                               class="form-input-premium" min="1" max="50" 
                               placeholder="Ex: 20" value="${turma.maxStudents || 20}">
                        <div class="field-help">Deixe vazio para sem limite</div>
                        <div class="field-error hidden" id="maxStudents-error"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render schedule tab content
     */
    renderScheduleTab(formData = {}) {
        const turma = formData.turma || {};
        const schedule = turma.schedule || {};
        const daysOfWeek = schedule.daysOfWeek || [];

        return `
            <div class="form-section">
                <div class="section-header">
                    <h3>📅 Datas e Período</h3>
                    <p>Configure quando a turma será executada</p>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="startDate" class="required">📅 Data de Início</label>
                        <input type="date" id="startDate" name="startDate" 
                               class="form-input-premium" 
                               value="${turma.startDate ? new Date(turma.startDate).toISOString().split('T')[0] : ''}" required>
                        <div class="field-error hidden" id="startDate-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="endDate">📅 Data de Término</label>
                        <input type="date" id="endDate" name="endDate" 
                               class="form-input-premium"
                               value="${turma.endDate ? new Date(turma.endDate).toISOString().split('T')[0] : ''}">
                        <div class="field-help">Deixe vazio para determinar automaticamente</div>
                        <div class="field-error hidden" id="endDate-error"></div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="section-header">
                    <h3>⏰ Horários</h3>
                    <p>Defina quando as aulas acontecerão</p>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="required">📅 Dias da Semana</label>
                        <div class="days-of-week-container">
                            ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day, index) => `
                                <label class="day-checkbox">
                                    <input type="checkbox" name="day_${index}" value="${index}"
                                           ${daysOfWeek.includes(index) ? 'checked' : ''}>
                                    <span class="day-label">${day}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="field-error hidden" id="daysOfWeek-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="time" class="required">⏰ Horário</label>
                        <input type="time" id="time" name="time" 
                               class="form-input-premium" 
                               value="${schedule.time || '19:00'}" required>
                        <div class="field-error hidden" id="time-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="duration" class="required">⏱️ Duração (minutos)</label>
                        <select id="duration" name="duration" class="form-select-premium" required>
                            <option value="">Selecione a duração</option>
                            <option value="30" ${schedule.duration === 30 ? 'selected' : ''}>30 minutos</option>
                            <option value="45" ${schedule.duration === 45 ? 'selected' : ''}>45 minutos</option>
                            <option value="60" ${schedule.duration === 60 ? 'selected' : ''}>60 minutos</option>
                            <option value="90" ${schedule.duration === 90 ? 'selected' : ''}>90 minutos</option>
                            <option value="120" ${schedule.duration === 120 ? 'selected' : ''}>120 minutos</option>
                        </select>
                        <div class="field-error hidden" id="duration-error"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render configuration tab content
     */
    renderConfigurationTab(formData = {}) {
        const turma = formData.turma || {};
        const units = formData.units || [];

        return `
            <div class="form-section">
                <div class="section-header">
                    <h3>🏢 Localização</h3>
                    <p>Onde a turma será realizada</p>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label for="unitId" class="required">🏪 Unidade</label>
                        <select id="unitId" name="unitId" class="form-select-premium" required>
                            <option value="">Selecione uma unidade</option>
                            ${units.map(unit => 
                                `<option value="${unit.id}" ${turma.unitId === unit.id ? 'selected' : ''}>${unit.name}</option>`
                            ).join('')}
                        </select>
                        <div class="field-error hidden" id="unitId-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="room">🚪 Sala/Sala</label>
                        <input type="text" id="room" name="room" 
                               class="form-input-premium" 
                               placeholder="Ex: Sala 1" 
                               value="${turma.room || ''}">
                        <div class="field-error hidden" id="room-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="price">💰 Preço (R$)</label>
                        <input type="number" id="price" name="price" 
                               class="form-input-premium" 
                               placeholder="Ex: 150.00" 
                               step="0.01" min="0"
                               value="${turma.price || ''}">
                        <div class="field-error hidden" id="price-error"></div>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="section-header">
                    <h3>📝 Descrição</h3>
                    <p>Informações adicionais sobre a turma</p>
                </div>
                
                <div class="form-group">
                    <label for="description">Descrição</label>
                    <textarea id="description" name="description" 
                              class="form-textarea-premium" 
                              placeholder="Descreva detalhes importantes sobre esta turma..."
                              rows="4">${turma.description || ''}</textarea>
                    <div class="field-error hidden" id="description-error"></div>
                </div>
            </div>
        `;
    }

    /**
     * Show loading state
     */
    showLoadingState(container) {
        const loadingState = container.querySelector('.module-loading-state');
        const content = container.querySelector('.module-form-premium');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (content) content.classList.add('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState(container) {
        const loadingState = container.querySelector('.module-loading-state');
        const content = container.querySelector('.module-form-premium');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }

    /**
     * Show error state
     */
    showErrorState(container, message) {
        const errorState = container.querySelector('.module-error-state');
        const content = container.querySelector('.module-form-premium');
        const errorMessage = container.querySelector('#error-message');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorState) errorState.classList.remove('hidden');
        if (content) content.classList.add('hidden');
    }

    /**
     * Show success state
     */
    showSuccessState(container, turmaData, isEditing) {
        const successState = container.querySelector('.module-success-state');
        const content = container.querySelector('.module-form-premium');
        const successTitle = container.querySelector('#success-title');
        const successMessage = container.querySelector('#success-message');
        
        if (successTitle) {
            successTitle.textContent = `Turma ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;
        }
        
        if (successMessage) {
            successMessage.textContent = `A turma "${turmaData.name}" foi ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;
        }
        
        if (successState) successState.classList.remove('hidden');
        if (content) content.classList.add('hidden');
    }

    /**
     * Show form loading state
     */
    showFormLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="icon">⏳</i><span>Salvando...</span>';
            submitBtn.disabled = true;
        }
    }

    /**
     * Hide form loading state
     */
    hideFormLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const isEditing = form.querySelector('#submit-text')?.textContent.includes('Atualizar');
        
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="icon">${isEditing ? '💾' : '➕'}</i><span>${isEditing ? 'Atualizar' : 'Criar'} Turma</span>`;
            submitBtn.disabled = false;
        }
    }

    /**
     * Show form error
     */
    showFormError(form, message) {
        // Try to show in a notification
        if (window.app && window.app.showNotification) {
            window.app.showNotification(`❌ ${message}`, 'error');
        } else {
            // Fallback to alert
            alert(`❌ ${message}`);
        }
    }

    /**
     * Show validation errors
     */
    showValidationErrors(form, errors) {
        // Clear previous errors
        const errorElements = form.querySelectorAll('.field-error');
        errorElements.forEach(element => {
            element.classList.add('hidden');
            element.textContent = '';
        });
        
        // Show new errors
        errors.forEach(error => {
            const errorElement = form.querySelector(`#${error.field}-error`);
            if (errorElement) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('hidden');
                
                // Highlight field
                const field = form.querySelector(`[name="${error.field}"]`);
                if (field) {
                    field.classList.add('error');
                }
            }
        });
        
        // Show notification
        if (errors.length > 0) {
            const message = `Por favor, corrija os erros no formulário: ${errors.map(e => e.message).join(', ')}`;
            if (window.app && window.app.showNotification) {
                window.app.showNotification(`❌ ${message}`, 'error');
            } else {
                alert(`❌ ${message}`);
            }
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
        }
    }
}
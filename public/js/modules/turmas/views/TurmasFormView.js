// TurmasFormView - Formulário para criação/edição de turmas
import { safeNavigateTo } from '../../../shared/utils/navigation.js';
// Design premium com validação em tempo real

export class TurmasFormView {
    constructor(service, controller) {
        this.service = service;
        this.controller = controller;
        this.container = null;
        this.isEditMode = false;
        this.turmaData = null;
        this.formData = {};
        this.validationErrors = {};
        this.selectedCourses = [];
        this.availableCourses = [];
    }

    async render(container, turmaData = null) {
        this.container = container;
        this.turmaData = turmaData;
        this.isEditMode = !!turmaData;

        // Registrar globalmente para uso nos modais (onclick inline usa window.turmaFormView)
        window.turmaFormView = this;

        await this.loadFormData();
        await this.renderHTML();
        this.attachEventListeners();
        this.setupValidation();
        
        if (this.isEditMode) {
            this.populateForm(turmaData);
        }
    }

    async loadFormData() {
        try {
            console.log('🔄 [Turmas Form] Carregando dados do formulário...');
            // Carregar dados necessários para o formulário
            const [coursesResult, instructorsResult, organizationsResult, unitsResult, trainingAreasResult] = await Promise.all([
                this.service.getCourses(),
                this.service.getInstructors(), 
                this.service.getOrganizations(),
                this.service.getUnits(),
                this.service.getTrainingAreas()
            ]);

            console.log('📋 [Turmas Form] Resultados das APIs:', {
                courses: coursesResult,
                instructors: instructorsResult,
                organizations: organizationsResult,
                units: unitsResult,
                trainingAreas: trainingAreasResult
            });

            this.formData = {
                courses: coursesResult.success ? coursesResult.data : [],
                instructors: instructorsResult.success ? instructorsResult.data : [],
                organizations: organizationsResult.success ? organizationsResult.data : [],
                units: unitsResult.success ? unitsResult.data : [],
                trainingAreas: trainingAreasResult.success ? trainingAreasResult.data : []
            };

            console.log('💾 [Turmas Form] Dados processados:', this.formData);

            // Armazenar cursos disponíveis para o modal
            this.availableCourses = this.formData.courses;

            // Se for edição, carregar cursos associados
            if (this.isEditMode && this.turmaData?.id) {
                await this.loadSelectedCourses(this.turmaData.id);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados do formulário:', error);
            this.formData = {
                courses: [],
                instructors: [],
                organizations: [],
                units: []
            };
        }
    }

    async renderHTML() {
        const title = this.isEditMode ? 'Editar Turma' : 'Nova Turma';
        const subtitle = this.isEditMode 
            ? 'Atualize as informações da turma'
            : 'Crie uma nova turma para executar o cronograma de um curso';

        this.container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-breadcrumb">
                            <span class="breadcrumb-item clickable" data-navigate="/">📊 Início</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item clickable" data-navigate="/turmas">👥 Turmas</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item active">${this.isEditMode ? '✏️ Editar' : '➕ Nova'}</span>
                        </div>
                        <div class="module-header-actions">
                            <button class="btn-action-secondary" id="btnCancel">
                                <i class="icon">❌</i>
                                <span>Cancelar</span>
                            </button>
                        </div>
                    </div>
                    <h1 class="module-title">${title}</h1>
                    <p class="module-subtitle">${subtitle}</p>
                </div>

                <!-- Formulário -->
                <form id="turmaForm" class="form-container-premium">
                    <div class="form-tabs-nav">
                        <button type="button" class="tab-button active" data-tab="general">📝 Geral</button>
                        <button type="button" class="tab-button" data-tab="courses">🎓 Cursos</button>
                    </div>

                    <div class="form-tabs-content">
                        <div id="tab-general" class="tab-panel active">
                            <div class="form-sections">
                        <!-- Informações Básicas -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3>📋 Informações Básicas</h3>
                                <p>Dados principais da turma</p>
                            </div>
                            <div class="form-grid">
                                <div class="form-group span-2">
                                    <label for="name" class="required">📝 Nome da Turma</label>
                                    <input type="text" id="name" name="name" class="form-input-premium" 
                                           placeholder="Ex: Krav Maga Básico - Manhã" required>
                                    <div class="field-error hidden" id="nameError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="courseId" class="required">📚 Curso</label>
                                    <select id="courseId" name="courseId" class="form-select-premium" required>
                                        <option value="">Selecione um curso</option>
                                        ${this.formData.courses.map(course => 
                                            `<option value="${course.id}">${course.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="field-error hidden" id="courseIdError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="type" class="required">🎯 Tipo</label>
                                    <select id="type" name="type" class="form-select-premium" required>
                                        <option value="">Selecione o tipo</option>
                                        <option value="COLLECTIVE">Coletivo</option>
                                        <option value="PRIVATE">Particular</option>
                                    </select>
                                    <div class="field-error hidden" id="typeError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="instructorId" class="required">👨‍🏫 Instrutor</label>
                                    <select id="instructorId" name="instructorId" class="form-select-premium" required>
                                        <option value="">Selecione um instrutor</option>
                                        ${this.formData.instructors.map(instructor => 
                                            `<option value="${instructor.id}">${instructor.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="field-error hidden" id="instructorIdError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="maxStudents">👥 Máximo de Alunos</label>
                                    <input type="number" id="maxStudents" name="maxStudents" 
                                           class="form-input-premium" min="1" max="50" 
                                           placeholder="Ex: 20">
                                    <div class="field-help">Deixe vazio para sem limite</div>
                                    <div class="field-error hidden" id="maxStudentsError"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Datas e Período -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3>📅 Datas e Período</h3>
                                <p>Configure quando a turma será executada</p>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="startDate" class="required">📅 Data de Início</label>
                                    <input type="date" id="startDate" name="startDate" 
                                           class="form-input-premium" required>
                                    <div class="field-help">Datas no passado são permitidas; o cronograma será gerado a partir desta data e aparecerá na agenda.</div>
                                    <div class="field-error hidden" id="startDateError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="endDate">📅 Data de Término</label>
                                    <input type="date" id="endDate" name="endDate" 
                                           class="form-input-premium">
                                    <div class="field-help">Deixe vazio para determinar automaticamente</div>
                                    <div class="field-error hidden" id="endDateError"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Horários -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3>⏰ Horários</h3>
                                <p>Defina quando as aulas acontecerão</p>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="required">📅 Dias da Semana</label>
                                    <div class="days-of-week-container">
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="0">
                                            <span class="day-label">Dom</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="1">
                                            <span class="day-label">Seg</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="2">
                                            <span class="day-label">Ter</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="3">
                                            <span class="day-label">Qua</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="4">
                                            <span class="day-label">Qui</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="5">
                                            <span class="day-label">Sex</span>
                                        </label>
                                        <label class="day-checkbox">
                                            <input type="checkbox" name="daysOfWeek" value="6">
                                            <span class="day-label">Sab</span>
                                        </label>
                                    </div>
                                    <div class="field-error hidden" id="daysOfWeekError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="time" class="required">⏰ Horário</label>
                                    <input type="time" id="time" name="time" 
                                           class="form-input-premium" required>
                                    <div class="field-error hidden" id="timeError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="duration" class="required">⏱️ Duração (minutos)</label>
                                    <select id="duration" name="duration" class="form-select-premium" required>
                                        <option value="">Selecione a duração</option>
                                        <option value="30">30 minutos</option>
                                        <option value="45">45 minutos</option>
                                        <option value="60">60 minutos</option>
                                        <option value="90">90 minutos</option>
                                        <option value="120">120 minutos</option>
                                    </select>
                                    <div class="field-error hidden" id="durationError"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Localização -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3>🏢 Localização</h3>
                                <p>Onde a turma será realizada</p>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="organizationId" class="required">🏢 Organização</label>
                                    <select id="organizationId" name="organizationId" class="form-select-premium" required>
                                        <option value="">Selecione a organização</option>
                                        ${this.formData.organizations.map(org => 
                                            `<option value="${org.id}">${org.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="field-error hidden" id="organizationIdError"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="unitId" class="required">🏪 Unidade</label>
                                    <select id="unitId" name="unitId" class="form-select-premium" required>
                                        <option value="">Selecione a unidade</option>
                                        ${this.formData.units.map(unit => 
                                            `<option value="${unit.id}">${unit.name}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="field-error hidden" id="unitIdError"></div>
                                </div>

                                <div class="form-group">
                                    <label for="turma-training-area">🥋 Tatame / Área de Treino</label>
                                    <select id="turma-training-area" name="trainingAreaId" class="form-select-premium">
                                        <option value="">Selecione o tatame...</option>
                                        ${(this.formData.trainingAreas || []).map(area => 
                                            `<option value="${area.id}">${area.name} (${area.capacity} pessoas)</option>`
                                        ).join('')}
                                    </select>
                                    <small class="form-helper">Selecione onde acontecerão as aulas desta turma</small>
                                </div>
                            </div>
                        </div>

                    </div>

                        </div>

                        <div id="tab-courses" class="tab-panel">
                        </div>

                            <!-- painel de Cursos (será mostrado quando aba 'Cursos' selecionada) -->
                            <div id="tab-courses" class="tab-panel" style="display:none;">
                                <div class="form-section">
                                    <div class="section-header">
                                        <h3>🎓 Cursos Associados</h3>
                                        <p>Selecione os cursos que serão ensinados nesta turma</p>
                                    </div>
                                    <div class="courses-management">
                                        <div class="courses-header">
                                            <button type="button" class="btn-action-secondary" id="addCourseBtn">
                                                <i class="icon">➕</i>
                                                <span>Adicionar Curso</span>
                                            </button>
                                        </div>
                                        <div id="selectedCourses" class="selected-courses">
                                            <div class="empty-state">
                                                <i class="icon">📚</i>
                                                <p>Nenhum curso selecionado</p>
                                                <small>Clique em "Adicionar Curso" para começar</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                    </div>

                    <!-- Ações do Formulário -->
                    <div class="form-actions">
                        <button type="button" class="btn-action-secondary" id="btnCancelForm">
                            <i class="icon">❌</i>
                            <span>Cancelar</span>
                        </button>
                        <button type="submit" class="btn-action-premium" id="btnSubmit">
                            <i class="icon">${this.isEditMode ? '💾' : '➕'}</i>
                            <span id="submitText">${this.isEditMode ? 'Atualizar' : 'Criar'} Turma</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    attachEventListeners() {
        const form = this.container.querySelector('#turmaForm');
        const btnCancel = this.container.querySelector('#btnCancel');
        const btnCancelForm = this.container.querySelector('#btnCancelForm');

        // Formulário
        form?.addEventListener('submit', (e) => this.handleSubmit(e));

        // Botões de cancelar
        btnCancel?.addEventListener('click', () => this.controller.navigateToList());
        btnCancelForm?.addEventListener('click', () => this.controller.navigateToList());

        // Botão de adicionar curso
        const addCourseBtn = this.container.querySelector('#addCourseBtn');
        addCourseBtn?.addEventListener('click', () => this.showAddCourseDialog());

        // Abas do formulário (Geral / Cursos)
        const tabButtons = this.container.querySelectorAll('.form-tabs-nav .tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchFormTab(tab);
            });
        });

        // Navegação breadcrumb
        const breadcrumbItems = this.container.querySelectorAll('.breadcrumb-item.clickable');
            breadcrumbItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const path = e.currentTarget.dataset.navigate;
                    if (path === '/') {
                        safeNavigateTo('dashboard', { context: 'turmas:form:breadcrumb-dashboard' });
                    } else if (path === '/turmas') {
                        this.controller.navigateToList();
                    }
                });
            });
            // Fim da navegação breadcrumb

        // Validação em tempo real
        const inputs = this.container.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Checkboxes dos dias da semana
        const daysCheckboxes = this.container.querySelectorAll('input[name="daysOfWeek"]');
        daysCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.validateDaysOfWeek());
        });

        // Filtro de unidades por organização
        const organizationSelect = this.container.querySelector('#organizationId');
        organizationSelect?.addEventListener('change', () => this.filterUnits());
    }

    switchFormTab(tabName) {
        // Atualiza botões
        const tabButtons = this.container.querySelectorAll('.form-tabs-nav .tab-button');
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabName) button.classList.add('active');
            else button.classList.remove('active');
        });

        // Atualiza painéis
        const panels = this.container.querySelectorAll('.form-tabs-content .tab-panel');
        panels.forEach(panel => {
            if (panel.id === `tab-${tabName}`) panel.classList.add('active');
            else panel.classList.remove('active');
        });
    }

    setupValidation() {
        // Configurar validações customizadas
        const form = this.container.querySelector('#turmaForm');
        
        if (form) {
            form.noValidate = true; // Desabilitar validação HTML5 padrão
        }
    }

    populateForm(turmaData) {
        if (!turmaData) return;

        // Campos básicos
        this.setFieldValue('name', turmaData.name);
        this.setFieldValue('courseId', turmaData.courseId);
        this.setFieldValue('type', turmaData.type);
        this.setFieldValue('instructorId', turmaData.instructorId);
        this.setFieldValue('maxStudents', turmaData.maxStudents);
        this.setFieldValue('organizationId', turmaData.organizationId);
        this.setFieldValue('unitId', turmaData.unitId);

        // Datas
        if (turmaData.startDate) {
            this.setFieldValue('startDate', this.formatDateForInput(turmaData.startDate));
        }
        if (turmaData.endDate) {
            this.setFieldValue('endDate', this.formatDateForInput(turmaData.endDate));
        }

        // Horários
        if (turmaData.schedule) {
            const schedule = turmaData.schedule;
            
            // Dias da semana
            if (schedule.daysOfWeek) {
                schedule.daysOfWeek.forEach(day => {
                    const checkbox = this.container.querySelector(`input[name="daysOfWeek"][value="${day}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            // Horário e duração
            this.setFieldValue('time', schedule.time);
            this.setFieldValue('duration', schedule.duration);
        }
    }

    setFieldValue(fieldName, value) {
        const field = this.container.querySelector(`[name="${fieldName}"]`);
        if (field && value !== undefined && value !== null) {
            field.value = value;
        }
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validar formulário
        const isValid = this.validateForm();
        if (!isValid) {
            this.showValidationSummary();
            return;
        }

        // Coletar dados
        const formData = this.collectFormData();
        
        // Desabilitar botão de submit
        this.setSubmitLoading(true);

        try {
            if (this.isEditMode) {
                await this.controller.updateTurma(this.turmaData.id, formData);
            } else {
                await this.controller.createTurma(formData);
            }
        } catch (error) {
            console.error('❌ Erro ao salvar turma:', error);
            this.showError(error.message || 'Erro ao salvar turma');
        } finally {
            this.setSubmitLoading(false);
        }
    }

    collectFormData() {
        const form = this.container.querySelector('#turmaForm');
        const formData = new FormData(form);
        
        // Coletar dias da semana
        const daysOfWeek = [];
        const daysCheckboxes = this.container.querySelectorAll('input[name="daysOfWeek"]:checked');
        daysCheckboxes.forEach(checkbox => {
            daysOfWeek.push(parseInt(checkbox.value));
        });

        return {
            name: formData.get('name'),
            courseId: formData.get('courseId'), // Mantém compatibilidade com curso principal
            type: formData.get('type'),
            instructorId: formData.get('instructorId'),
            maxStudents: formData.get('maxStudents') ? parseInt(formData.get('maxStudents')) : null,
            organizationId: formData.get('organizationId'),
            unitId: formData.get('unitId'),
            startDate: formData.get('startDate') + 'T00:00:00.000Z',
            endDate: formData.get('endDate') ? formData.get('endDate') + 'T23:59:59.999Z' : null,
            schedule: {
                daysOfWeek,
                time: formData.get('time'),
                duration: parseInt(formData.get('duration'))
            },
            courseIds: this.selectedCourses.map(course => course.id) // Cursos múltiplos
        };
    }

    validateForm() {
        this.validationErrors = {};
        let isValid = true;

        // Validar campos obrigatórios
        const requiredFields = ['name', 'courseId', 'type', 'instructorId', 'organizationId', 'unitId', 'startDate', 'time', 'duration'];
        
        requiredFields.forEach(field => {
            const element = this.container.querySelector(`[name="${field}"]`);
            if (!element || !element.value.trim()) {
                this.setFieldError(field, 'Este campo é obrigatório');
                isValid = false;
            }
        });

        // Validar dias da semana
        const daysCheckboxes = this.container.querySelectorAll('input[name="daysOfWeek"]:checked');
        if (daysCheckboxes.length === 0) {
            this.setFieldError('daysOfWeek', 'Selecione pelo menos um dia da semana');
            isValid = false;
        }

        // Validar datas
        const startDate = this.container.querySelector('[name="startDate"]')?.value;
        const endDate = this.container.querySelector('[name="endDate"]')?.value;
        
        // startDate no passado agora é permitido; apenas validações relacionais permanecem

        if (startDate && endDate) {
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            if (endDateObj <= startDateObj) {
                this.setFieldError('endDate', 'Data de término deve ser posterior à data de início');
                isValid = false;
            }
        }

        return isValid;
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();

        // Limpar erro anterior
        this.clearFieldError(field);

        // Validações específicas por campo
        switch (fieldName) {
            case 'maxStudents':
                if (value && (parseInt(value) < 1 || parseInt(value) > 50)) {
                    this.setFieldError(fieldName, 'Número de alunos deve estar entre 1 e 50');
                }
                break;
                
            case 'startDate':
                // Datas no passado são permitidas; nenhuma validação adicional aqui
                break;
        }
    }

    validateDaysOfWeek() {
        const daysCheckboxes = this.container.querySelectorAll('input[name="daysOfWeek"]:checked');
        if (daysCheckboxes.length === 0) {
            this.setFieldError('daysOfWeek', 'Selecione pelo menos um dia da semana');
        } else {
            this.clearFieldError({ name: 'daysOfWeek' });
        }
    }

    setFieldError(fieldName, message) {
        this.validationErrors[fieldName] = message;
        
        const errorElement = this.container.querySelector(`#${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }

        // Adicionar classe de erro ao campo
        const field = this.container.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('field-error-state');
        } else if (fieldName === 'daysOfWeek') {
            // Para checkboxes dos dias da semana
            const container = this.container.querySelector('.days-of-week-container');
            if (container) {
                container.classList.add('field-error-state');
            }
        }
    }

    clearFieldError(field) {
        const fieldName = field.name;
        delete this.validationErrors[fieldName];
        
        const errorElement = this.container.querySelector(`#${fieldName}Error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }

        // Remover classe de erro do campo
        field.classList.remove('field-error-state');
        
        if (fieldName === 'daysOfWeek') {
            const container = this.container.querySelector('.days-of-week-container');
            if (container) {
                container.classList.remove('field-error-state');
            }
        }
    }

    showValidationSummary() {
        const errorCount = Object.keys(this.validationErrors).length;
        if (errorCount > 0) {
            const message = `Por favor, corrija ${errorCount} erro${errorCount > 1 ? 's' : ''} no formulário.`;
            this.showError(message);
        }
    }

    filterUnits() {
        const organizationId = this.container.querySelector('#organizationId')?.value;
        const unitSelect = this.container.querySelector('#unitId');
        
        if (!unitSelect) return;

        // Limpar seleção atual
        unitSelect.value = '';
        
        // Filtrar unidades (aqui você implementaria a lógica de filtro baseada na organização)
        // Por simplicidade, manteremos todas as unidades por enquanto
    }

    setSubmitLoading(loading) {
        const submitBtn = this.container.querySelector('#btnSubmit');
        const submitText = this.container.querySelector('#submitText');
        
        if (loading) {
            submitBtn?.setAttribute('disabled', 'true');
            submitBtn?.classList.add('loading');
            if (submitText) {
                submitText.textContent = 'Salvando...';
            }
        } else {
            submitBtn?.removeAttribute('disabled');
            submitBtn?.classList.remove('loading');
            if (submitText) {
                submitText.textContent = this.isEditMode ? 'Atualizar Turma' : 'Criar Turma';
            }
        }
    }

    showError(message) {
        if (window.app && window.app.showError) {
            window.app.showError(message);
        } else {
            alert(message);
        }
    }

    // ===== Gestão de Cursos Múltiplos =====

    async loadSelectedCourses(turmaId) {
        try {
            const result = await this.service.getTurmaCourses(turmaId);
            if (result.success) {
                this.selectedCourses = result.data.map(tc => tc.course);
                this.renderSelectedCourses();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cursos da turma:', error);
        }
    }

    renderSelectedCourses() {
        const container = this.container.querySelector('#selectedCourses');
        if (!container) return;

        if (this.selectedCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="icon">📚</i>
                    <p>Nenhum curso selecionado</p>
                    <small>Clique em "Adicionar Curso" para começar</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.selectedCourses.map(course => `
            <div class="course-item" data-course-id="${course.id}">
                <div class="course-info">
                    <h4>${course.name}</h4>
                    <p>${course.description || 'Sem descrição'}</p>
                    <span class="course-level">${course.level || 'N/A'}</span>
                </div>
                <div class="course-actions">
                    <button type="button" class="btn-action-danger btn-sm" 
                            onclick="window.turmaFormView.removeCourse('${course.id}')">
                        <i class="icon">🗑️</i>
                        <span>Remover</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async showAddCourseDialog() {
        const availableCourses = this.availableCourses.filter(course => 
            !this.selectedCourses.some(selected => selected.id === course.id)
        );

        if (availableCourses.length === 0) {
            this.showError('Todos os cursos já foram adicionados à turma');
            return;
        }

        const dialogHtml = `
            <div class="selector-overlay" id="addCourseDialog">
                <div class="selector-container">
                    <div class="selector-header">
                        <h3>Adicionar Curso à Turma</h3>
                        <button class="selector-close" onclick="window.turmaFormView.closeDialog()">&times;</button>
                    </div>
                    <div class="selector-body">
                        <div class="courses-selection">
                            ${availableCourses.map(course => `
                                <div class="course-option" onclick="window.turmaFormView.selectCourse('${course.id}')">
                                    <h4>${course.name}</h4>
                                    <p>${course.description || 'Sem descrição'}</p>
                                    <span class="course-level">${course.level || 'N/A'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHtml);
    }

    async selectCourse(courseId) {
        const course = this.availableCourses.find(c => c.id === courseId);
        if (course) {
            this.selectedCourses.push(course);
            this.renderSelectedCourses();
            this.closeDialog();
        }
    }

    removeCourse(courseId) {
        this.selectedCourses = this.selectedCourses.filter(course => course.id !== courseId);
        this.renderSelectedCourses();
    }

    closeDialog() {
        const dialog = document.getElementById('addCourseDialog');
        if (dialog) {
            dialog.remove();
        }
    }

    // ===== Cleanup =====

    destroy() {
        this.container = null;
        this.service = null;
        this.controller = null;
        this.formData = {};
        this.validationErrors = {};
    }
}

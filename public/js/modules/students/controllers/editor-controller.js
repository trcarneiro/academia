/**
 * Student Editor Controller - Premium UX following Activities patterns
 */

export class StudentEditorController {
    constructor(api) {
        this.api = api; // ModuleAPIHelper
        this.container = null;
        this.current = null;
        this.currentStudentId = null;
        this.formChanged = false;
    }

    async render(targetContainer, studentId = null) {
        this.container = targetContainer;
        this.currentStudentId = studentId;
        try {
            if (studentId) {
                await this.loadStudent(studentId);
            }
            this.renderHTML();
            this.bindEvents();
        } catch (err) {
            console.error('StudentEditor render error:', err);
            window.app?.handleError?.(err, 'students:render');
        }
    }

    async loadStudent(id) {
        try {
            const res = await this.api.fetchWithStates(`/api/students/${id}`, {
                loadingElement: this.container,
                onError: (error) => console.error('Load student error:', error)
            });
            this.current = res.data || res;
        } catch (err) {
            window.app?.handleError?.(err, 'students:load');
        }
    }

    renderHTML() {
        const s = this.current;
        const isEdit = !!s?.id;
        
        this.container.innerHTML = `
            <div class="module-isolated-container" data-module="students">
                <!-- Header Premium com Guidelines.MD -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-left">
                            <h1 class="page-title">
                                <i class="icon">👥</i>
                                ${isEdit ? 'Editar Estudante' : 'Novo Estudante'}
                            </h1>
                            <nav class="breadcrumb">Home / Estudantes / ${isEdit ? 'Editar' : 'Novo'}</nav>
                        </div>
                        <div class="header-actions">
                            <button id="back-to-students" class="btn-form btn-secondary-form">
                                <i class="fas fa-arrow-left"></i>
                                Voltar
                            </button>
                            ${isEdit ? `
                            <button id="duplicate-student" class="btn-form btn-info-form">
                                <i class="fas fa-copy"></i>
                                Duplicar
                            </button>
                            ` : ''}
                            <button id="save-student" class="btn-form btn-primary-form">
                                <i class="fas fa-save"></i>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>

                ${isEdit ? `
                <!-- Student Info Card -->
                <div class="student-summary-card">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👤</div>
                        <div class="stat-content">
                            <div class="stat-value">${`${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim() || 'Novo Estudante'}</div>
                            <div class="stat-label">ID: ${s.id.slice(0, 8)}...</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">${s?.isActive ? '✅' : '❌'}</div>
                        <div class="stat-content">
                            <div class="stat-value">${s?.isActive ? 'Ativo' : 'Inativo'}</div>
                            <div class="stat-label">Status</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value">${new Date(s?.enrollmentDate || s?.createdAt).toLocaleDateString('pt-BR')}</div>
                            <div class="stat-label">Matrícula</div>
                        </div>
                    </div>
                </div>
                ` : `
                <!-- Welcome Card for New Student -->
                <div class="welcome-card-new-student">
                    <div class="welcome-content">
                        <div class="welcome-icon">🎉</div>
                        <h2 class="welcome-title">Cadastro de Novo Estudante</h2>
                        <p class="welcome-subtitle">Preencha os dados abaixo para criar um novo cadastro na academia</p>
                        <div class="welcome-tips">
                            <div class="tip-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Campos com <span class="required-mark">*</span> são obrigatórios</span>
                            </div>
                            <div class="tip-item">
                                <i class="fas fa-check-circle"></i>
                                <span>E-mail será usado para login no sistema</span>
                            </div>
                            <div class="tip-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Telefone e CPF são formatados automaticamente</span>
                            </div>
                        </div>
                    </div>
                </div>
                `}

                <!-- Student Detail Tabs System -->
                <div class="student-tabs-container data-card-premium">
                    <div class="tabs-header module-filters-premium">
                        <button class="tab-button active" data-tab="dados">
                            <i class="fas fa-user"></i>
                            ${isEdit ? 'Dados Pessoais' : '1. Dados Pessoais'}
                        </button>
                        ${!isEdit ? `
                        <button class="tab-button" data-tab="plano">
                            <i class="fas fa-credit-card"></i>
                            2. Matrícula e Pagamento
                        </button>
                        ` : ''}
                        ${isEdit ? `
                        <button class="tab-button" data-tab="overview">
                            <i class="fas fa-chart-line"></i>
                            Visão Geral
                        </button>
                        <button class="tab-button" data-tab="financial">
                            <i class="fas fa-credit-card"></i>
                            Financeiro
                        </button>
                        <button class="tab-button" data-tab="courses">
                            <i class="fas fa-graduation-cap"></i>
                            Cursos
                        </button>
                        ` : ''}
                    </div>
                    
                    <div class="tab-panels">
                        <!-- Dados Pessoais Tab -->
                        <section class="tab-panel active" id="tab-dados">
                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-user"></i>
                                    Informações Básicas
                                </h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="firstName" class="required">Primeiro Nome</label>
                                        <input id="firstName" type="text" placeholder="Ex: João" value="${s?.user?.firstName || ''}" required>
                                        <div class="field-help">Nome que aparecerá nos relatórios</div>
                                    </div>
                                    <div class="form-group">
                                        <label for="lastName" class="required">Sobrenome</label>
                                        <input id="lastName" type="text" placeholder="Ex: Silva" value="${s?.user?.lastName || ''}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="email" class="required">E-mail</label>
                                        <input id="email" type="email" placeholder="joao@email.com" value="${s?.user?.email || ''}" required>
                                        <div class="field-help">Usado para login e comunicações</div>
                                    </div>
                                    <div class="form-group">
                                        <label for="phone">Telefone</label>
                                        <input id="phone" type="tel" placeholder="(11) 99999-9999" value="${s?.user?.phone || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label for="cpf">CPF</label>
                                        <input id="cpf" type="text" placeholder="000.000.000-00" value="${s?.user?.cpf || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label for="birthDate">Data de Nascimento</label>
                                        <input id="birthDate" type="date" value="${s?.user?.birthDate ? new Date(s.user.birthDate).toISOString().split('T')[0] : ''}">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-phone"></i>
                                    Contato de Emergência
                                </h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="emergencyContact">Telefone de Emergência</label>
                                        <input id="emergencyContact" type="tel" placeholder="(11) 99999-9999" value="${s?.emergencyContact || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label for="medicalConditions">Condições Médicas</label>
                                        <textarea id="medicalConditions" placeholder="Descreva qualquer condição médica relevante..." rows="3">${s?.medicalConditions || ''}</textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-graduation-cap"></i>
                                    Dados Acadêmicos
                                </h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="category">Categoria</label>
                                        <select id="category">
                                            <option value="">Selecione...</option>
                                            <option value="ADULT" ${s?.category === 'ADULT' ? 'selected' : ''}>Adulto</option>
                                            <option value="TEEN" ${s?.category === 'TEEN' ? 'selected' : ''}>Adolescente</option>
                                            <option value="CHILD" ${s?.category === 'CHILD' ? 'selected' : ''}>Criança</option>
                                            <option value="SENIOR" ${s?.category === 'SENIOR' ? 'selected' : ''}>Sênior</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="physicalCondition">Condição Física</label>
                                        <select id="physicalCondition">
                                            <option value="INICIANTE" ${s?.physicalCondition === 'INICIANTE' ? 'selected' : ''}>Iniciante</option>
                                            <option value="INTERMEDIARIO" ${s?.physicalCondition === 'INTERMEDIARIO' ? 'selected' : ''}>Intermediário</option>
                                            <option value="AVANCADO" ${s?.physicalCondition === 'AVANCADO' ? 'selected' : ''}>Avançado</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="isActive">Status</label>
                                        <select id="isActive">
                                            <option value="true" ${s?.isActive !== false ? 'selected' : ''}>Ativo</option>
                                            <option value="false" ${s?.isActive === false ? 'selected' : ''}>Inativo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        ${!isEdit ? `
                        <!-- Enrollment Tab - Package Selection -->
                        <section class="tab-panel" id="tab-plano">
                            <div class="enrollment-header">
                                <div class="enrollment-icon">�</div>
                                <h3 class="enrollment-title">Selecione o Plano de Pagamento</h3>
                                <p class="enrollment-subtitle">O plano define os cursos disponíveis e a matrícula automática no curso base</p>
                            </div>

                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-calendar-alt"></i>
                                    Informações da Matrícula
                                </h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="enrollmentDate" class="required">Data de Matrícula</label>
                                        <input id="enrollmentDate" type="date" value="${new Date().toISOString().split('T')[0]}" required>
                                        <div class="field-help">Data de início na academia</div>
                                    </div>
                                    <div class="form-group">
                                        <label for="enrollmentGoal">Objetivo Principal</label>
                                        <select id="enrollmentGoal">
                                            <option value="">Selecione...</option>
                                            <option value="DEFESA_PESSOAL">Defesa Pessoal</option>
                                            <option value="CONDICIONAMENTO">Condicionamento Físico</option>
                                            <option value="COMPETICAO">Competição</option>
                                            <option value="HOBBY">Hobby/Lazer</option>
                                            <option value="DESENVOLVIMENTO_INFANTIL">Desenvolvimento Infantil</option>
                                        </select>
                                    </div>
                                </div>
                            </div>



                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-box"></i>
                                    Selecione o Pacote/Plano
                                    <span class="required-mark">*</span>
                                </h3>
                                <div id="packages-loading">
                                    <div class="loading-spinner">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        Carregando pacotes disponíveis...
                                    </div>
                                </div>
                                <div id="packages-container" style="display: none;">
                                    <!-- Packages will be loaded here -->
                                </div>
                            </div>

                            <div class="form-section" id="package-details-section" style="display: none;">
                                <h3 class="section-title">
                                    <i class="fas fa-info-circle"></i>
                                    Detalhes do Plano Selecionado
                                </h3>
                                <div class="selected-package-card">
                                    <div id="selected-package-info">
                                        <!-- Package details will be shown here -->
                                    </div>
                                </div>
                            </div>

                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-credit-card"></i>
                                    Configurações de Pagamento
                                </h3>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="paymentMethod">Forma de Pagamento</label>
                                        <select id="paymentMethod">
                                            <option value="">Selecione...</option>
                                            <option value="CREDIT_CARD">Cartão de Crédito</option>
                                            <option value="DEBIT_CARD">Cartão de Débito</option>
                                            <option value="BANK_SLIP">Boleto Bancário</option>
                                            <option value="PIX">PIX</option>
                                            <option value="CASH">Dinheiro</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="paymentDay">Dia de Vencimento</label>
                                        <select id="paymentDay">
                                            <option value="">Selecione...</option>
                                            ${Array.from({length: 28}, (_, i) => i + 1).map(day => 
                                                `<option value="${day}">${day}</option>`
                                            ).join('')}
                                        </select>
                                        <div class="field-help">Dia do mês para vencimento das mensalidades</div>
                                    </div>
                                    <div class="form-group">
                                        <label for="discount">Desconto (%)</label>
                                        <input id="discount" type="number" min="0" max="100" step="0.01" placeholder="0.00">
                                        <div class="field-help">Desconto especial aplicado ao plano</div>
                                    </div>
                                    <div class="form-group">
                                        <label for="enrollmentObservations">Observações da Matrícula</label>
                                        <textarea id="enrollmentObservations" placeholder="Informações adicionais sobre a matrícula..." rows="3"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="enrollment-navigation">
                                <button type="button" class="btn-secondary" onclick="window.studentsModule.openEditor()">
                                    <i class="fas fa-arrow-left"></i>
                                    Voltar aos Dados
                                </button>
                                <button type="button" class="btn-primary" id="btn-save-enrollment">
                                    <i class="fas fa-save"></i>
                                    Salvar Matrícula
                                </button>
                            </div>
                        </section>

                        <section class="tab-panel" id="tab-cursos" style="display: none;">
                            <div class="enrollment-header">
                                <div class="enrollment-icon">🎓</div>
                                <h3 class="enrollment-title">Selecione os Cursos</h3>
                                <p class="enrollment-subtitle">Escolha em quais cursos o aluno será matriculado</p>
                            </div>

                            <div class="form-section">
                                <h3 class="section-title">
                                    <i class="fas fa-graduation-cap"></i>
                                    Cursos Disponíveis
                                    <span class="required-mark">*</span>
                                </h3>
                                <p class="section-help">
                                    <i class="fas fa-info-circle"></i>
                                    Selecione em quais cursos o aluno será matriculado. Você pode selecionar múltiplos cursos.
                                </p>
                                <div id="courses-loading">
                                    <div class="loading-spinner">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        Carregando cursos disponíveis...
                                    </div>
                                </div>
                                <div id="courses-container" style="display: none;">
                                    <!-- Courses will be loaded here -->
                                </div>
                                <div id="selected-courses-display" style="display: none;">
                                    <h4 class="subsection-title">
                                        <i class="fas fa-check-circle"></i>
                                        Cursos Selecionados
                                    </h4>
                                    <div id="selected-courses-list" class="selected-items-list">
                                        <!-- Selected courses will be shown here -->
                                    </div>
                                </div>
                            </div>

                            <div class="enrollment-summary">
                                <div class="summary-card">
                                    <h4><i class="fas fa-calculator"></i> Resumo da Matrícula</h4>
                                    <div class="summary-item">
                                        <span>Cursos Selecionados:</span>
                                        <strong id="summary-courses-count">0</strong>
                                    </div>
                                    <div class="summary-item">
                                        <span>Plano Selecionado:</span>
                                        <strong id="summary-plan">-</strong>
                                    </div>
                                    <div class="summary-item">
                                        <span>Valor Original:</span>
                                        <strong id="summary-original-price">R$ 0,00</strong>
                                    </div>
                                    <div class="summary-item">
                                        <span>Desconto:</span>
                                        <strong id="summary-discount">R$ 0,00</strong>
                                    </div>
                                    <div class="summary-item summary-total">
                                        <span>Valor Final:</span>
                                        <strong id="summary-final-price">R$ 0,00</strong>
                                    </div>
                                    <div class="summary-item">
                                        <span>Primeiro Vencimento:</span>
                                        <strong id="summary-first-payment">-</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="enrollment-navigation">
                                <button type="button" class="btn-secondary" id="btn-back-to-plan">
                                    <i class="fas fa-arrow-left"></i>
                                    Voltar ao Plano
                                </button>
                            </div>
                        </section>
                        ` : ''}

                        ${isEdit ? `
                        <!-- Overview Tab -->
                        <section class="tab-panel" id="tab-overview">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">📊</span>
                                            Visão Geral do Aluno
                                        </h3>
                                        <p class="section-subtitle">Resumo de progresso e objetivos</p>
                                    </div>
                                </div>
                            </div>

                            <div class="section-body">
                                <div class="overview-grid">
                                    <div class="overview-card stat-card-enhanced">
                                        <h4><i class="fas fa-chart-line"></i> Resumo Geral</h4>
                                        <div id="overview-summary">
                                            <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                        </div>
                                    </div>
                                    <div class="overview-card stat-card-enhanced">
                                        <h4><i class="fas fa-bullseye"></i> Próximos Objetivos</h4>
                                        <div id="overview-goals">
                                            <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Courses from Plan Section -->
                                <div class="overview-courses-section data-card-premium" style="margin-top: 2rem;">
                                    <h4><i class="fas fa-graduation-cap"></i> Cursos do Plano</h4>
                                    <div class="field-help" style="margin-bottom: 1rem;">
                                        <i class="fas fa-info-circle"></i>
                                        Cursos base incluídos automaticamente no plano ativo
                                    </div>
                                    
                                    <div id="overview-courses-list">
                                        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Financial Tab -->
                        <section class="tab-panel" id="tab-financial">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">💳</span>
                                            Informações Financeiras
                                        </h3>
                                        <p class="section-subtitle">Matrículas, planos e histórico de pagamentos</p>
                                    </div>
                                </div>
                            </div>

                            <div class="section-body">
                                <div class="financial-section data-card-premium">
                                    <h4><i class="fas fa-file-invoice-dollar"></i> Matrículas e Planos</h4>
                                    <div id="student-subscriptions">
                                        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                    </div>
                                </div>
                                <div class="financial-section data-card-premium">
                                    <h4><i class="fas fa-history"></i> Histórico de Pagamentos</h4>
                                    <div id="student-payments">
                                        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Courses Tab -->
                        <section class="tab-panel" id="tab-courses">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">📚</span>
                                            Gerenciamento de Cursos
                                        </h3>
                                        <p class="section-subtitle">Matrículas ativas e cursos disponíveis</p>
                                    </div>
                                </div>
                            </div>

                            <div class="section-body">
                                <!-- Enrolled Courses Section -->
                                <div class="courses-section data-card-premium">
                                    <h4><i class="fas fa-check-circle"></i> Cursos Matriculados</h4>
                                    <div class="field-help" style="margin-bottom: 1rem;">
                                        <i class="fas fa-info-circle"></i>
                                        Cursos com matrícula ativa no momento
                                    </div>
                                    <div id="enrolled-courses-tab">
                                        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                    </div>
                                </div>

                                <!-- Available Courses Section -->
                                <div class="courses-section data-card-premium" style="margin-top: 2rem;">
                                    <h4><i class="fas fa-book-open"></i> Cursos Disponíveis</h4>
                                    <div class="field-help" style="margin-bottom: 1rem;">
                                        <i class="fas fa-info-circle"></i>
                                        Cursos sem matrícula ativa ou com matrículas encerradas
                                    </div>
                                    <div id="available-courses-tab">
                                        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        ` : ''}
                    </div>
                </div>

                <!-- Success/Error Messages -->
                <div id="form-messages" class="form-messages" style="display: none;"></div>
            </div>
        `;
    }

    bindEvents() {
        // Enhanced back button with unsaved changes protection
        const backBtn = this.container.querySelector('#back-to-students');
        backBtn?.addEventListener('click', () => {
            if (this.hasUnsavedChanges()) {
                if (confirm('Você tem alterações não salvas. Deseja continuar?')) {
                    window.router?.navigateTo('students');
                }
            } else {
                window.router?.navigateTo('students');
            }
        });

        // Enhanced save button
        const saveBtn = this.container.querySelector('#save-student');
        console.log('🔍 Save button found:', saveBtn);
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('💾 Save button clicked!');
                await this.save();
            });
        } else {
            console.error('❌ Save button not found! Container:', this.container);
        }

        // Duplicate button
        const duplicateBtn = this.container.querySelector('#duplicate-student');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => this.duplicateStudent());
        }

        // Enhanced tab switching with lazy loading for new tabs
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', async () => {
                // Prevenir clique em abas desabilitadas
                if (btn.disabled) {
                    return;
                }
                
                this.container.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.getAttribute('data-tab');
                this.container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                const targetPanel = this.container.querySelector(`#tab-${tab}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
                
                // Lazy load tab content
                if (!btn.dataset.loaded && this.current?.id) {
                    btn.dataset.loaded = '1';
                    await this.loadTabContent(tab, this.current.id);
                }
                
                // Load packages for plan tab (new student)
                if (tab === 'plano' && !btn.dataset.loaded) {
                    btn.dataset.loaded = '1';
                    await this.loadPackagesForEnrollment();
                }
                
                // Load courses for courses tab (new student)
                if (tab === 'cursos' && !btn.dataset.loaded) {
                    btn.dataset.loaded = '1';
                    await this.loadCoursesForEnrollment();
                }
            });
        });

        // Setup enrollment tab listeners (new student mode)
        if (!this.current?.id) {
            this.setupEnrollmentListeners();
        }

        // Load initial tab content for edit mode (only for dynamic tabs)
        // Note: 'dados' tab doesn't need lazy loading as it's static HTML

        this.trackFormChanges();
        this.setupFieldMasks();
        this.setupAutoSave();
    }

    async save() {
        console.log('🚀 Save method called!');
        const saveBtn = this.container.querySelector('#save-student');
        const originalText = saveBtn?.textContent;
        console.log('📝 Save button:', saveBtn, 'Original text:', originalText);
        
        try {
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            }
            
            console.log('✅ Validating form...');
            if (!this.validateForm()) {
                console.log('❌ Form validation failed!');
                return;
            }
            
            console.log('📦 Collecting form data...');
            const payload = this.collectFormData();
            console.log('📊 Payload:', payload);
            
            if (this.current?.id) {
                console.log('🔄 Updating student:', this.current.id);
                await this.api.saveWithFeedback(`/api/students/${this.current.id}`, payload, { 
                    method: 'PUT',
                    successMessage: 'Estudante atualizado com sucesso!'
                });
            } else {
                console.log('➕ Creating new student');
                await this.api.saveWithFeedback('/api/students', payload, { 
                    method: 'POST',
                    successMessage: 'Estudante cadastrado com sucesso!'
                });
            }
            
            console.log('✅ Save successful! Redirecting...');
            setTimeout(() => {
                window.router?.navigateTo('students');
            }, 1500);
            
        } catch (err) {
            console.error('❌ Save error:', err);
            window.app?.handleError?.(err, 'students:save');
            this.showMessage('Erro ao salvar estudante. Tente novamente.', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        }
    }

    collectFormData() {
        const formData = {
            firstName: this.container.querySelector('#firstName')?.value?.trim(),
            lastName: this.container.querySelector('#lastName')?.value?.trim(),
            email: this.container.querySelector('#email')?.value?.trim(),
            phone: this.container.querySelector('#phone')?.value?.trim(),
            cpf: this.container.querySelector('#cpf')?.value?.trim(),
            birthDate: this.container.querySelector('#birthDate')?.value || null,
            category: this.container.querySelector('#category')?.value || null,
            physicalCondition: this.container.querySelector('#physicalCondition')?.value || 'INICIANTE',
            isActive: this.container.querySelector('#isActive')?.value === 'true',
            emergencyContact: this.container.querySelector('#emergencyContact')?.value?.trim(),
            medicalConditions: this.container.querySelector('#medicalConditions')?.value?.trim()
        };

        // Add enrollment data only if package is selected (optional)
        if (!this.current?.id && this.selectedPackage) {
            formData.enrollment = {
                enrollmentDate: this.container.querySelector('#enrollmentDate')?.value || new Date().toISOString().split('T')[0],
                enrollmentGoal: this.container.querySelector('#enrollmentGoal')?.value || null,
                packageId: this.selectedPackage.id,
                packageName: this.selectedPackage.name,
                paymentMethod: this.container.querySelector('#paymentMethod')?.value || null,
                paymentDay: parseInt(this.container.querySelector('#paymentDay')?.value || 0),
                discount: parseFloat(this.container.querySelector('#discount')?.value || 0),
                observations: this.container.querySelector('#enrollmentObservations')?.value?.trim()
            };
        }

        return formData;
    }

    validateForm() {
        console.log('🔍 Validating form...');
        const errors = [];
        const firstName = this.container.querySelector('#firstName')?.value?.trim();
        const lastName = this.container.querySelector('#lastName')?.value?.trim();
        const email = this.container.querySelector('#email')?.value?.trim();
        
        console.log('📋 Form values:', { firstName, lastName, email });
        
        if (!firstName) errors.push('Primeiro nome é obrigatório');
        if (!lastName) errors.push('Sobrenome é obrigatório');
        if (!email) errors.push('E-mail é obrigatório');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('E-mail deve ter formato válido (exemplo@dominio.com)');
        }
        
        // Enrollment data is optional for new students
        // Students can be created with just name and email
        // Enrollment and payment can be added later
        if (!this.current?.id && this.selectedPackage) {
            console.log('📝 New student with enrollment data');
            console.log('Selected package:', this.selectedPackage);
        }
        
        if (errors.length > 0) {
            console.log('❌ Validation errors:', errors);
            this.showMessage(errors.join('<br>'), 'error');
            return false;
        }
        
        console.log('✅ Validation passed!');
        return true;
    }

    duplicateStudent() {
        if (!this.current?.id) return;
        
        if (confirm('Criar um novo estudante baseado neste?')) {
            const formData = this.collectFormData();
            delete formData.id;
            formData.firstName = `${formData.firstName} (Cópia)`;
            
            this.current = null;
            this.renderHTML();
            this.bindEvents();
            
            Object.keys(formData).forEach(key => {
                const field = this.container.querySelector(`#${key}`);
                if (field && formData[key]) {
                    field.value = formData[key];
                }
            });
        }
    }

    trackFormChanges() {
        this.formChanged = false;
        const inputs = this.container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.formChanged = true;
            });
        });
    }

    hasUnsavedChanges() {
        return this.formChanged;
    }

    setupFieldMasks() {
        const phoneField = this.container.querySelector('#phone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\\D/g, '');
                if (value.length >= 11) {
                    value = value.replace(/(\\d{2})(\\d{5})(\\d{4})/, '($1) $2-$3');
                } else if (value.length >= 7) {
                    value = value.replace(/(\\d{2})(\\d{4})(\\d+)/, '($1) $2-$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\\d{2})(\\d+)/, '($1) $2');
                }
                e.target.value = value;
            });
        }

        const cpfField = this.container.querySelector('#cpf');
        if (cpfField) {
            cpfField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\\D/g, '');
                if (value.length >= 9) {
                    value = value.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
                } else if (value.length >= 6) {
                    value = value.replace(/(\\d{3})(\\d{3})(\\d+)/, '$1.$2.$3');
                } else if (value.length >= 3) {
                    value = value.replace(/(\\d{3})(\\d+)/, '$1.$2');
                }
                e.target.value = value;
            });
        }
    }

    setupAutoSave() {
        if (this.current?.id) return;
        
        setInterval(() => {
            if (this.formChanged) {
                const formData = this.collectFormData();
                localStorage.setItem('student-draft', JSON.stringify(formData));
            }
        }, 30000);
    }

    showMessage(message, type = 'info') {
        const messageDiv = this.container.querySelector('#form-messages');
        messageDiv.innerHTML = `
            <div class="alert alert-${type}">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
            </div>
        `;
        messageDiv.style.display = 'block';
        
        if (type !== 'error') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    // =========================================================================
    // TAB CONTENT LOADERS - Premium UX with real data
    // =========================================================================

    async loadTabContent(tab, studentId) {
        switch (tab) {
            case 'overview':
                await this.renderOverviewTab(studentId);
                break;
            case 'courses':
                await this.renderCoursesTab(studentId);
                break;
            case 'financial':
                await this.renderFinancialTab(studentId);
                break;
        }
    }

    async renderOverviewTab(studentId) {
        const summaryDiv = this.container.querySelector('#overview-summary');
        const goalsDiv = this.container.querySelector('#overview-goals');

        try {
            // Load student stats
            const response = await this.api.request(`/api/students/${studentId}/stats`);
            const stats = response.data || {};

            summaryDiv.innerHTML = `
                <div class="overview-stats-grid">
                    <div class="overview-stat">
                        <div class="stat-icon">📅</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.totalAttendances || 0}</div>
                            <div class="stat-label">Aulas Frequentadas</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.attendanceRate || 0}%</div>
                            <div class="stat-label">Taxa de Frequência</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">🥋</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.techniquesLearned || 0}</div>
                            <div class="stat-label">Técnicas Aprendidas</div>
                        </div>
                    </div>
                    <div class="overview-stat">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.skillLevel || 'Iniciante'}</div>
                            <div class="stat-label">Nível Atual</div>
                        </div>
                    </div>
                </div>
            `;

            goalsDiv.innerHTML = `
                <div class="goals-list">
                    <div class="goal-item">
                        <div class="goal-icon">🎯</div>
                        <div class="goal-content">
                            <div class="goal-title">Próximo Exame de Faixa</div>
                            <div class="goal-description">Falta completar 3 técnicas obrigatórias</div>
                            <div class="goal-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 70%"></div>
                                </div>
                                <span class="progress-label">70% completo</span>
                            </div>
                        </div>
                    </div>
                    <div class="goal-item">
                        <div class="goal-icon">📚</div>
                        <div class="goal-content">
                            <div class="goal-title">Frequência Mensal</div>
                            <div class="goal-description">Meta: 12 aulas por mês</div>
                            <div class="goal-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill progress-success" style="width: 85%"></div>
                                </div>
                                <span class="progress-label">10 de 12 aulas</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading overview:', error);
            summaryDiv.innerHTML = '<p class="error-message">Erro ao carregar dados. Tente novamente.</p>';
            goalsDiv.innerHTML = '<p class="error-message">Erro ao carregar objetivos.</p>';
        }
    }

    async renderAttendanceTab(studentId) {
        const statsDiv = this.container.querySelector('#attendance-stats');
        const historyDiv = this.container.querySelector('#attendance-history');

        try {
            const response = await this.api.request(`/api/students/${studentId}/attendances`);
            const attendances = response.data || [];

            // Calculate stats
            const total = attendances.length;
            const thisMonth = attendances.filter(a => {
                const date = new Date(a.createdAt);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length;

            statsDiv.innerHTML = `
                <div class="attendance-stats-grid">
                    <div class="stat-card-mini">
                        <div class="stat-value">${total}</div>
                        <div class="stat-label">Total de Presenças</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-value">${thisMonth}</div>
                        <div class="stat-label">Este Mês</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-value">${total > 0 ? Math.round((thisMonth / 12) * 100) : 0}%</div>
                        <div class="stat-label">Taxa Mensal</div>
                    </div>
                </div>
            `;

            if (attendances.length === 0) {
                historyDiv.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--color-text-muted);"></i>
                        <p>Nenhuma presença registrada ainda</p>
                    </div>
                `;
            } else {
                historyDiv.innerHTML = `
                    <div class="attendance-timeline">
                        ${attendances.slice(0, 20).map(att => `
                            <div class="timeline-item">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <div class="timeline-date">${new Date(att.createdAt).toLocaleDateString('pt-BR')}</div>
                                    <div class="timeline-title">${att.class?.name || 'Aula'}</div>
                                    <div class="timeline-meta">
                                        ${att.class?.instructor?.user?.firstName || ''} ${att.class?.instructor?.user?.lastName || ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading attendance:', error);
            statsDiv.innerHTML = '<p class="error-message">Erro ao carregar estatísticas</p>';
            historyDiv.innerHTML = '<p class="error-message">Erro ao carregar histórico</p>';
        }
    }

    async renderTechniquesTab(studentId) {
        const statsDiv = this.container.querySelector('#techniques-stats');
        const listDiv = this.container.querySelector('#techniques-list');

        try {
            const response = await this.api.request(`/api/students/${studentId}/techniques`);
            const techniques = response.data || [];

            const learned = techniques.filter(t => t.mastery !== 'beginner').length;
            const mastered = techniques.filter(t => t.mastery === 'expert').length;

            statsDiv.innerHTML = `
                <div class="techniques-stats-grid">
                    <div class="stat-card-mini">
                        <div class="stat-icon">🥋</div>
                        <div class="stat-value">${techniques.length}</div>
                        <div class="stat-label">Total</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${learned}</div>
                        <div class="stat-label">Aprendidas</div>
                    </div>
                    <div class="stat-card-mini">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-value">${mastered}</div>
                        <div class="stat-label">Dominadas</div>
                    </div>
                </div>
            `;

            if (techniques.length === 0) {
                listDiv.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-fist-raised" style="font-size: 3rem; color: var(--color-text-muted);"></i>
                        <p>Nenhuma técnica registrada ainda</p>
                    </div>
                `;
            } else {
                listDiv.innerHTML = `
                    <div class="techniques-grid">
                        ${techniques.map(tech => {
                            const masteryLevel = this.getMasteryPercentage(tech.mastery);
                            return `
                                <div class="technique-card">
                                    <div class="technique-header">
                                        <h4>${tech.name}</h4>
                                        <span class="technique-badge mastery-${tech.mastery}">
                                            ${this.getMasteryLabel(tech.mastery)}
                                        </span>
                                    </div>
                                    <div class="technique-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${masteryLevel}%"></div>
                                        </div>
                                        <span class="progress-label">${masteryLevel}% dominado</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading techniques:', error);
            statsDiv.innerHTML = '<p class="error-message">Erro ao carregar dados</p>';
            listDiv.innerHTML = '<p class="error-message">Erro ao carregar técnicas</p>';
        }
    }

    async renderProgressTab(studentId) {
        const progressDiv = this.container.querySelector('#course-progress');
        const missingDiv = this.container.querySelector('#missing-content');

        try {
            const response = await this.api.request(`/api/students/${studentId}/progress`);
            const progress = response.data || {};

            progressDiv.innerHTML = `
                <div class="progress-overview">
                    <div class="progress-header">
                        <h4>Faixa ${progress.currentBelt || 'Branca'}</h4>
                        <span class="progress-percentage">${progress.completionRate || 0}%</span>
                    </div>
                    <div class="progress-bar-large">
                        <div class="progress-fill progress-gradient" style="width: ${progress.completionRate || 0}%"></div>
                    </div>
                    <div class="progress-details">
                        <div class="detail-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${progress.completedLessons || 0} aulas concluídas</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${progress.totalHours || 0} horas de treino</span>
                        </div>
                    </div>
                </div>
            `;

            missingDiv.innerHTML = `
                <div class="missing-list">
                    ${(progress.missingRequirements || []).length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--color-success);"></i>
                            <p>Todos os requisitos foram cumpridos!</p>
                        </div>
                    ` : `
                        <ul class="requirements-list">
                            ${(progress.missingRequirements || []).map(req => `
                                <li class="requirement-item">
                                    <i class="fas fa-circle requirement-icon"></i>
                                    <span>${req}</span>
                                </li>
                            `).join('')}
                        </ul>
                    `}
                </div>
            `;
        } catch (error) {
            console.error('Error loading progress:', error);
            progressDiv.innerHTML = '<p class="error-message">Erro ao carregar progresso</p>';
            missingDiv.innerHTML = '<p class="error-message">Erro ao carregar requisitos</p>';
        }
    }

    async renderCoursesTab(studentId) {
        console.log('🔄 Loading courses tab for student:', studentId);
        
        const currentCoursesList = this.container.querySelector('#current-courses-list');
        const availableCoursesList = this.container.querySelector('#available-courses-list');
        
        if (!currentCoursesList || !availableCoursesList) {
            console.error('❌ Course list containers not found in DOM');
            return;
        }
        
        try {
            console.log('📡 Fetching courses data...');
            
            // Load current enrollments and available courses
            const [enrollmentsRes, availableRes] = await Promise.all([
                this.api.request(`/api/students/${studentId}/enrollments`),
                this.api.request(`/api/students/${studentId}/available-courses`)
            ]);

            const enrollments = enrollmentsRes.data || [];
            const availableCourses = availableRes.data || [];
            
            console.log('📚 Current enrollments:', enrollments.length);
            console.log('📖 Available courses:', availableCourses.length);

            // Render current courses
            if (enrollments.length === 0) {
                currentCoursesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open" style="font-size: 2.5rem; color: var(--color-text-muted); margin-bottom: 1rem;"></i>
                        <p>Nenhum curso matriculado ainda</p>
                    </div>
                `;
            } else {
                currentCoursesList.innerHTML = `
                    <div class="courses-list">
                        ${enrollments.map(enr => {
                            const isBaseCourse = enr.course?.isBaseCourse || false;
                            return `
                                <div class="course-item ${isBaseCourse ? 'base-course' : ''}" data-enrollment-id="${enr.id}">
                                    <div class="course-item-header">
                                        <div class="course-item-title">
                                            ${isBaseCourse ? '<span class="badge-base-course">🏆 Curso Base</span>' : ''}
                                            <h5>${enr.course?.name || 'Curso'}</h5>
                                            <span class="course-level-badge level-${(enr.course?.level || 'beginner').toLowerCase()}">
                                                ${enr.course?.level || 'BEGINNER'}
                                            </span>
                                        </div>
                                        ${!isBaseCourse ? `
                                            <button class="btn-icon btn-danger" onclick="window.studentsModule.editorController.removeCourse('${studentId}', '${enr.id}')" title="Remover curso">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : '<span class="text-muted" style="font-size: 0.85rem;">Não pode ser removido</span>'}
                                    </div>
                                    <div class="course-item-details">
                                        <div class="detail-item">
                                            <i class="fas fa-calendar-alt"></i>
                                            <span>Matrícula: ${new Date(enr.enrolledAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-chart-line"></i>
                                            <span>Progresso: ${enr.lessonsCompleted || 0} aulas</span>
                                        </div>
                                        ${enr.course?.martialArt ? `
                                            <div class="detail-item">
                                                <i class="fas fa-fist-raised"></i>
                                                <span>${enr.course.martialArt.name}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // Render available courses
            if (availableCourses.length === 0) {
                availableCoursesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                        <p>Aluno já está matriculado em todos os cursos disponíveis</p>
                    </div>
                `;
            } else {
                // Group courses by martial art
                const coursesByArt = availableCourses.reduce((acc, course) => {
                    const artName = course.martialArt?.name || 'Outros';
                    if (!acc[artName]) acc[artName] = [];
                    acc[artName].push(course);
                    return {};
                }, {});

                availableCoursesList.innerHTML = `
                    <div class="available-courses-grid">
                        ${availableCourses.map(course => `
                            <div class="available-course-card" data-course-id="${course.id}">
                                <div class="course-card-header">
                                    <h5>${course.name}</h5>
                                    <span class="course-level-badge level-${(course.level || 'beginner').toLowerCase()}">
                                        ${course.level || 'BEGINNER'}
                                    </span>
                                </div>
                                <div class="course-card-body">
                                    ${course.description ? `
                                        <p class="course-description">${course.description.substring(0, 100)}${course.description.length > 100 ? '...' : ''}</p>
                                    ` : ''}
                                    <div class="course-card-meta">
                                        ${course.martialArt ? `
                                            <div class="meta-item">
                                                <i class="fas fa-fist-raised"></i>
                                                <span>${course.martialArt.name}</span>
                                            </div>
                                        ` : ''}
                                        <div class="meta-item">
                                            <i class="fas fa-clock"></i>
                                            <span>${course.duration || 12} semanas</span>
                                        </div>
                                        <div class="meta-item">
                                            <i class="fas fa-book"></i>
                                            <span>${course.totalClasses || 0} aulas</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="course-card-footer">
                                    <button class="btn-form btn-primary-form" onclick="window.studentsModule.editorController.addCourse('${studentId}', '${course.id}', '${course.name}')">
                                        <i class="fas fa-plus"></i>
                                        Adicionar Curso
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            console.log('✅ Courses tab rendered successfully');

        } catch (error) {
            console.error('❌ Error loading courses tab:', error);
            currentCoursesList.innerHTML = `<div class="error-state">Erro ao carregar cursos ativos</div>`;
            availableCoursesList.innerHTML = `<div class="error-state">Erro ao carregar cursos disponíveis</div>`;
        }
    }

    async addCourse(studentId, courseId, courseName) {
        try {
            console.log('➕ Adding course:', courseName);
            
            const confirmed = confirm(`Deseja adicionar o curso "${courseName}" para este aluno?`);
            if (!confirmed) return;

            await this.api.request(`/api/students/${studentId}/enrollments`, {
                method: 'POST',
                body: JSON.stringify({ courseId })
            });

            this.showMessage(`Curso "${courseName}" adicionado com sucesso!`, 'success');
            
            // Reload courses tab
            await this.renderCoursesTab(studentId);

        } catch (error) {
            console.error('Error adding course:', error);
            this.showMessage('Erro ao adicionar curso. Tente novamente.', 'error');
        }
    }

    async removeCourse(studentId, enrollmentId) {
        try {
            console.log('➖ Removing enrollment:', enrollmentId);
            
            const confirmed = confirm('Deseja remover este curso paralelo? Esta ação não pode ser desfeita.');
            if (!confirmed) return;

            await this.api.request(`/api/students/${studentId}/enrollments/${enrollmentId}`, {
                method: 'DELETE'
            });

            this.showMessage('Curso removido com sucesso!', 'success');
            
            // Reload courses tab
            await this.renderCoursesTab(studentId);

        } catch (error) {
            console.error('Error removing course:', error);
            this.showMessage('Erro ao remover curso. Tente novamente.', 'error');
        }
    }

    async renderCoursesTab(studentId) {
        // Simply call the dedicated loadCoursesTab method
        await this.loadCoursesTab(studentId);
    }

    async renderFinancialTab(studentId) {
        const panel = this.container.querySelector('#tab-financial');
        
        try {
            const [subscriptionsRes, paymentsRes, packagesRes] = await Promise.all([
                this.api.request(`/api/students/${studentId}/subscriptions`),
                this.api.request(`/api/students/${studentId}/payments`),
                this.api.request('/api/billing-plans')
            ]);

            const subscriptions = subscriptionsRes.data || [];
            const payments = paymentsRes.data || [];
            const packages = packagesRes.data || [];

            const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

            panel.innerHTML = `
                <div class="financial-container">
                    <!-- Financial Overview -->
                    <div class="financial-stats">
                        <div class="stat-card-enhanced stat-gradient-success">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-value">R$ ${totalPaid.toFixed(2)}</div>
                                <div class="stat-label">Total Pago</div>
                            </div>
                        </div>
                        <div class="stat-card-enhanced stat-gradient-primary">
                            <div class="stat-icon">📋</div>
                            <div class="stat-content">
                                <div class="stat-value">${activeSubscriptions.length}</div>
                                <div class="stat-label">Assinaturas Ativas</div>
                            </div>
                        </div>
                        <div class="stat-card-enhanced stat-gradient-warning">
                            <div class="stat-icon">⏳</div>
                            <div class="stat-content">
                                <div class="stat-value">${pendingPayments}</div>
                                <div class="stat-label">Pagamentos Pendentes</div>
                            </div>
                        </div>
                    </div>

                    <!-- Active Subscriptions -->
                    <div class="subscriptions-section data-card-premium">
                        <div class="section-header">
                            <h3>
                                <i class="fas fa-file-invoice-dollar"></i>
                                Pacotes Ativos
                            </h3>
                            <button class="btn-form btn-primary-form" onclick="window.openPackageSelector('${studentId}')">
                                <i class="fas fa-plus"></i>
                                Adicionar Pacote
                            </button>
                        </div>
                        ${activeSubscriptions.length === 0 ? `
                            <div class="empty-state">
                                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--color-text-muted);"></i>
                                <p>Nenhum pacote ativo</p>
                            </div>
                        ` : `
                            <div class="subscriptions-list">
                                ${activeSubscriptions.map(sub => `
                                    <div class="subscription-card">
                                        <div class="subscription-header">
                                            <h4>${sub.plan?.name || 'Plano'}</h4>
                                            <span class="subscription-badge status-active">
                                                <i class="fas fa-check-circle"></i>
                                                Ativo
                                            </span>
                                        </div>
                                        <div class="subscription-details">
                                            <div class="detail-row">
                                                <span class="detail-label">Início:</span>
                                                <span class="detail-value">${new Date(sub.startDate).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div class="detail-row">
                                                <span class="detail-label">Renovação:</span>
                                                <span class="detail-value">${sub.endDate ? new Date(sub.endDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                                            </div>
                                            <div class="detail-row">
                                                <span class="detail-label">Valor:</span>
                                                <span class="detail-value price">R$ ${sub.plan?.price?.toFixed(2) || '0.00'}/mês</span>
                                            </div>
                                        </div>
                                        <div class="subscription-actions">
                                            <button class="btn-form btn-sm btn-info-form" onclick="window.viewSubscriptionDetails('${sub.id}')">
                                                <i class="fas fa-eye"></i>
                                                Detalhes
                                            </button>
                                            <button class="btn-form btn-sm btn-warning-form" onclick="window.pauseSubscription('${sub.id}')">
                                                <i class="fas fa-pause"></i>
                                                Pausar
                                            </button>
                                            <button class="btn-form btn-sm btn-danger-form" onclick="window.cancelSubscription('${sub.id}')">
                                                <i class="fas fa-times"></i>
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- Payment History -->
                    <div class="payments-section data-card-premium">
                        <div class="section-header">
                            <h3>
                                <i class="fas fa-history"></i>
                                Histórico de Pagamentos
                            </h3>
                            <button class="btn-form btn-secondary-form" onclick="window.exportPaymentHistory('${studentId}')">
                                <i class="fas fa-download"></i>
                                Exportar
                            </button>
                        </div>
                        ${payments.length === 0 ? `
                            <div class="empty-state">
                                <i class="fas fa-receipt" style="font-size: 3rem; color: var(--color-text-muted);"></i>
                                <p>Nenhum pagamento registrado</p>
                            </div>
                        ` : `
                            <div class="payments-table-container">
                                <table class="payments-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Descrição</th>
                                            <th>Valor</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${payments.slice(0, 20).map(payment => `
                                            <tr>
                                                <td>${new Date(payment.createdAt).toLocaleDateString('pt-BR')}</td>
                                                <td>${payment.description || 'Pagamento'}</td>
                                                <td class="payment-amount">R$ ${payment.amount?.toFixed(2) || '0.00'}</td>
                                                <td>
                                                    <span class="payment-status status-${(payment.status || 'pending').toLowerCase()}">
                                                        ${payment.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn-action btn-view" onclick="window.viewPaymentReceipt('${payment.id}')" title="Ver comprovante">
                                                        <i class="fas fa-file-invoice"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>

                    <!-- Available Packages -->
                    <div class="packages-section data-card-premium">
                        <div class="section-header">
                            <h3>
                                <i class="fas fa-box-open"></i>
                                Pacotes Disponíveis
                            </h3>
                        </div>
                        <div class="packages-grid">
                            ${packages.map(pkg => `
                                <div class="package-card">
                                    <div class="package-header">
                                        <h4>${pkg.name}</h4>
                                        <span class="package-price">R$ ${pkg.price?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div class="package-description">
                                        ${pkg.description || 'Sem descrição'}
                                    </div>
                                    <ul class="package-features">
                                        ${(pkg.features || ['Acesso às aulas', 'Suporte técnico']).map(feature => `
                                            <li><i class="fas fa-check"></i> ${feature}</li>
                                        `).join('')}
                                    </ul>
                                    <button class="btn-form btn-primary-form btn-block" onclick="window.subscribeToPackage('${studentId}', '${pkg.id}')">
                                        <i class="fas fa-shopping-cart"></i>
                                        Assinar
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading financial data:', error);
            panel.innerHTML = '<p class="error-message">Erro ao carregar dados financeiros. Tente novamente.</p>';
        }
    }

    // =========================================================================
    // ENROLLMENT TAB - COURSES & PACKAGE SELECTION (NEW STUDENT)
    // =========================================================================

    async loadCoursesForEnrollment() {
        const loadingEl = this.container.querySelector('#courses-loading');
        const containerEl = this.container.querySelector('#courses-container');
        
        // Initialize selected courses array
        this.selectedCourses = this.selectedCourses || [];

        try {
            const response = await this.api.fetchWithStates('/api/courses?active=true', {
                loadingElement: loadingEl,
                onError: (error) => console.error('Error loading courses:', error)
            });
            const courses = response.data || [];

            loadingEl.style.display = 'none';
            containerEl.style.display = 'block';

            if (courses.length === 0) {
                containerEl.innerHTML = '<p class="empty-state">Nenhum curso disponível no momento</p>';
                return;
            }

            containerEl.innerHTML = `
                <div class="courses-grid-enrollment">
                    ${courses.map(course => `
                        <div class="course-card-enrollment" data-course-id="${course.id}">
                            <div class="course-header-enrollment">
                                <div class="course-icon">📚</div>
                                <h4>${course.name}</h4>
                                ${course.level ? `<span class="course-level-badge">${course.level}</span>` : ''}
                            </div>
                            <div class="course-description-enrollment">
                                ${course.description || 'Curso completo de Krav Maga'}
                            </div>
                            <div class="course-info-enrollment">
                                ${course.duration ? `
                                    <div class="info-item">
                                        <i class="fas fa-clock"></i>
                                        <span>${course.duration}h de carga horária</span>
                                    </div>
                                ` : ''}
                                ${course.totalLessons ? `
                                    <div class="info-item">
                                        <i class="fas fa-book"></i>
                                        <span>${course.totalLessons} aulas</span>
                                    </div>
                                ` : ''}
                            </div>
                            <label class="course-checkbox-label">
                                <input type="checkbox" 
                                       class="course-checkbox" 
                                       data-course-id="${course.id}" 
                                       data-course-name="${course.name}"
                                       data-course-level="${course.level || 'Todos'}"
                                       ${this.selectedCourses.includes(course.id) ? 'checked' : ''}>
                                <span class="checkbox-custom"></span>
                                <span class="checkbox-text">Matricular neste curso</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add event listeners to checkboxes
            this.container.querySelectorAll('.course-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.toggleCourseSelection(
                        e.target.dataset.courseId,
                        e.target.dataset.courseName,
                        e.target.dataset.courseLevel,
                        e.target.checked
                    );
                });
            });

        } catch (error) {
            console.error('Error loading courses:', error);
            loadingEl.style.display = 'none';
            containerEl.style.display = 'block';
            containerEl.innerHTML = '<p class="error-state">Erro ao carregar cursos. Tente novamente.</p>';
        }
    }

    toggleCourseSelection(courseId, courseName, courseLevel, isChecked) {
        if (isChecked) {
            // Add to selected courses
            if (!this.selectedCourses.includes(courseId)) {
                this.selectedCourses.push(courseId);
                this.addCourseToSelectedList(courseId, courseName, courseLevel);
            }
        } else {
            // Remove from selected courses
            this.selectedCourses = this.selectedCourses.filter(id => id !== courseId);
            this.removeCourseFromSelectedList(courseId);
        }

        // Show/hide selected courses section
        const displaySection = this.container.querySelector('#selected-courses-display');
        if (this.selectedCourses.length > 0) {
            displaySection.style.display = 'block';
        } else {
            displaySection.style.display = 'none';
        }

        // Update summary
        this.updateEnrollmentSummary();
    }

    addCourseToSelectedList(courseId, courseName, courseLevel) {
        const listEl = this.container.querySelector('#selected-courses-list');
        
        const courseItem = document.createElement('div');
        courseItem.className = 'selected-course-item';
        courseItem.dataset.courseId = courseId;
        courseItem.innerHTML = `
            <div class="selected-course-info">
                <i class="fas fa-check-circle"></i>
                <div class="selected-course-text">
                    <strong>${courseName}</strong>
                    <span class="course-level-small">${courseLevel}</span>
                </div>
            </div>
            <button class="btn-remove-course" data-course-id="${courseId}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add remove button listener
        courseItem.querySelector('.btn-remove-course').addEventListener('click', () => {
            // Uncheck the checkbox
            const checkbox = this.container.querySelector(`.course-checkbox[data-course-id="${courseId}"]`);
            if (checkbox) checkbox.checked = false;
            
            // Remove from selection
            this.toggleCourseSelection(courseId, courseName, courseLevel, false);
        });

        listEl.appendChild(courseItem);
    }

    removeCourseFromSelectedList(courseId) {
        const item = this.container.querySelector(`.selected-course-item[data-course-id="${courseId}"]`);
        if (item) item.remove();
    }

    async loadPackagesForEnrollment() {
        const loadingEl = this.container.querySelector('#packages-loading');
        const containerEl = this.container.querySelector('#packages-container');

        try {
            const response = await this.api.fetchWithStates('/api/billing-plans', {
                loadingElement: loadingEl,
                onError: (error) => console.error('Error loading packages:', error)
            });
            const packages = response.data || [];

            loadingEl.style.display = 'none';
            containerEl.style.display = 'block';

            if (packages.length === 0) {
                containerEl.innerHTML = '<p class="empty-state">Nenhum pacote disponível no momento</p>';
                return;
            }

            containerEl.innerHTML = `
                <div class="packages-grid-enrollment">
                    ${packages.map(pkg => {
                        // Extract features - handle both array and object formats
                        let featuresList = ['Acesso às aulas', 'Suporte técnico', 'Certificado'];
                        
                        if (pkg.features) {
                            if (Array.isArray(pkg.features)) {
                                featuresList = pkg.features;
                            } else if (typeof pkg.features === 'object') {
                                // Features is an object with courseIds, etc
                                featuresList = [];
                                if (pkg.features.courseIds && pkg.features.courseIds.length > 0) {
                                    featuresList.push(`Acesso a ${pkg.features.courseIds.length} curso(s)`);
                                }
                                if (pkg.isUnlimitedAccess) {
                                    featuresList.push('Acesso ilimitado');
                                }
                                if (pkg.classesPerWeek) {
                                    featuresList.push(`${pkg.classesPerWeek} aulas por semana`);
                                }
                                if (pkg.hasPersonalTraining) {
                                    featuresList.push('Personal Training incluído');
                                }
                                if (pkg.hasNutrition) {
                                    featuresList.push('Acompanhamento nutricional');
                                }
                                if (pkg.allowFreeze) {
                                    featuresList.push(`Congelamento até ${pkg.freezeMaxDays || 30} dias`);
                                }
                            }
                        }
                        
                        return `
                        <div class="package-card-enrollment" data-package-id="${pkg.id}">
                            <div class="package-badge">${pkg.popular ? '⭐ Mais Popular' : ''}</div>
                            <div class="package-header-enrollment">
                                <h4>${pkg.name}</h4>
                                <div class="package-price-enrollment">
                                    <span class="price-value">R$ ${parseFloat(pkg.price || 0).toFixed(2)}</span>
                                    <span class="price-period">/${pkg.billingType === 'MONTHLY' ? 'mês' : pkg.billingType === 'YEARLY' ? 'ano' : 'período'}</span>
                                </div>
                            </div>
                            <div class="package-description-enrollment">
                                ${pkg.description || 'Plano completo'}
                            </div>
                            <ul class="package-features-enrollment">
                                ${featuresList.slice(0, 5).map(feature => `
                                    <li><i class="fas fa-check-circle"></i> ${feature}</li>
                                `).join('')}
                            </ul>
                            <button class="btn-select-package" data-package-id="${pkg.id}" data-package-name="${pkg.name}" data-package-price="${pkg.price || 0}">
                                <i class="fas fa-check"></i>
                                Selecionar Este Plano
                            </button>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;

            // Add click listeners to package selection buttons
            this.container.querySelectorAll('.btn-select-package').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.selectPackage(e.target.dataset.packageId, e.target.dataset.packageName, parseFloat(e.target.dataset.packagePrice));
                });
            });

        } catch (error) {
            console.error('Error loading packages:', error);
            loadingEl.style.display = 'none';
            containerEl.style.display = 'block';
            containerEl.innerHTML = '<p class="error-state">Erro ao carregar pacotes. Tente novamente.</p>';
        }
    }

    selectPackage(packageId, packageName, packagePrice) {
        // Store selected package
        this.selectedPackage = { id: packageId, name: packageName, price: packagePrice };

        // Highlight selected package
        this.container.querySelectorAll('.package-card-enrollment').forEach(card => {
            card.classList.remove('selected');
        });
        this.container.querySelector(`[data-package-id="${packageId}"]`).classList.add('selected');

        // Show package details
        const detailsSection = this.container.querySelector('#package-details-section');
        const infoDiv = this.container.querySelector('#selected-package-info');
        
        detailsSection.style.display = 'block';
        infoDiv.innerHTML = `
            <div class="selected-package-display">
                <div class="selected-icon">✅</div>
                <div class="selected-info">
                    <h4>${packageName}</h4>
                    <p class="selected-price">R$ ${packagePrice.toFixed(2)}/mês</p>
                </div>
            </div>
        `;

        // Enable courses tab now that package is selected
        const cursosTab = this.container.querySelector('[data-tab="cursos"]');
        if (cursosTab) {
            cursosTab.disabled = false;
            cursosTab.style.opacity = '1';
            cursosTab.style.cursor = 'pointer';
        }

        // Update summary
        this.updateEnrollmentSummary();

        // Scroll to payment section
        this.container.querySelector('#package-details-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setupEnrollmentListeners() {
        // Save enrollment button
        const btnSaveEnrollment = this.container.querySelector('#btn-save-enrollment');
        const btnBackToPlan = this.container.querySelector('#btn-back-to-plan');
        
        if (btnSaveEnrollment) {
            btnSaveEnrollment.addEventListener('click', async () => {
                // Enrollment is optional - just trigger main save
                this.showMessage('Salvando...', 'info');
                
                // Trigger main save (via main save button)
                const mainSaveBtn = this.container.querySelector('#save-student');
                if (mainSaveBtn) {
                    mainSaveBtn.click();
                } else {
                    // Fallback: call save directly
                    await this.save();
                }
            });
        }
        
        if (btnBackToPlan) {
            btnBackToPlan.addEventListener('click', () => {
                const planoTab = this.container.querySelector('[data-tab="plano"]');
                if (planoTab) {
                    planoTab.click();
                }
            });
        }
        
        // Listen to discount changes
        const discountInput = this.container.querySelector('#discount');
        if (discountInput) {
            discountInput.addEventListener('input', () => this.updateEnrollmentSummary());
        }

        // Listen to payment day changes
        const paymentDaySelect = this.container.querySelector('#paymentDay');
        if (paymentDaySelect) {
            paymentDaySelect.addEventListener('change', () => this.updateEnrollmentSummary());
        }
    }

    updateEnrollmentSummary() {
        // Update courses count
        const coursesCount = this.selectedCourses?.length || 0;
        const coursesCountEl = this.container.querySelector('#summary-courses-count');
        if (coursesCountEl) {
            coursesCountEl.textContent = coursesCount;
            coursesCountEl.parentElement.style.color = coursesCount > 0 ? 'var(--primary-color)' : 'inherit';
        }

        if (!this.selectedPackage) return;

        const discountInput = this.container.querySelector('#discount');
        const paymentDaySelect = this.container.querySelector('#paymentDay');

        const discountPercent = parseFloat(discountInput?.value || 0);
        const originalPrice = this.selectedPackage.price;
        const discountAmount = (originalPrice * discountPercent) / 100;
        const finalPrice = originalPrice - discountAmount;

        // Calculate first payment date
        const selectedDay = parseInt(paymentDaySelect?.value || new Date().getDate());
        const today = new Date();
        const firstPayment = new Date(today.getFullYear(), today.getMonth(), selectedDay);
        if (firstPayment < today) {
            firstPayment.setMonth(firstPayment.getMonth() + 1);
        }

        // Update summary display
        this.container.querySelector('#summary-plan').textContent = this.selectedPackage.name;
        this.container.querySelector('#summary-original-price').textContent = `R$ ${originalPrice.toFixed(2)}`;
        this.container.querySelector('#summary-discount').textContent = `R$ ${discountAmount.toFixed(2)}`;
        this.container.querySelector('#summary-final-price').textContent = `R$ ${finalPrice.toFixed(2)}`;
        this.container.querySelector('#summary-first-payment').textContent = firstPayment.toLocaleDateString('pt-BR');
    }

    getMasteryPercentage(mastery) {
        const levels = {
            'beginner': 25,
            'intermediate': 50,
            'advanced': 75,
            'expert': 100
        };
        return levels[mastery] || 0;
    }

    // === TAB CONTENT LOADERS ===
    
    async loadTabContent(tabName, studentId) {
        try {
            switch (tabName) {
                case 'overview':
                    await this.loadOverviewTab(studentId);
                    break;
                case 'courses':
                    await this.loadCoursesTab(studentId);
                    break;
                case 'financial':
                    await this.loadFinancial(studentId);
                    break;
            }
        } catch (error) {
            window.app?.handleError?.(error, `Erro ao carregar aba ${tabName}`);
        }
    }

    async loadOverviewTab(studentId) {
        const summaryElement = this.container.querySelector('#overview-summary');
        const goalsElement = this.container.querySelector('#overview-goals');

        await this.api.fetchWithStates(`/api/students/${studentId}/overview`, {
            loadingElement: summaryElement,
            onSuccess: (data) => {
                summaryElement.innerHTML = `
                    <div class="summary-metrics">
                        <div class="metric">
                            <span class="metric-value">${data.attendanceRate || 0}%</span>
                            <span class="metric-label">Frequência</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${data.techniquesLearned || 0}</span>
                            <span class="metric-label">Técnicas</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${data.courseProgress || 0}%</span>
                            <span class="metric-label">Progresso</span>
                        </div>
                    </div>
                `;

                goalsElement.innerHTML = `
                    <div class="goals-list">
                        ${(data.nextGoals || []).map(goal => `
                            <div class="goal-item">
                                <span class="goal-icon">${goal.icon || '🎯'}</span>
                                <span class="goal-text">${goal.description || 'Nenhum objetivo definido'}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            },
            onEmpty: () => {
                summaryElement.innerHTML = '<p class="empty-state">Dados insuficientes para análise</p>';
                goalsElement.innerHTML = '<p class="empty-state">Nenhum objetivo definido</p>';
            },
            onError: (error) => {
                summaryElement.innerHTML = '<p class="error-state">Erro ao carregar resumo</p>';
                goalsElement.innerHTML = '<p class="error-state">Erro ao carregar objetivos</p>';
            }
        });
        
        // Load courses from plan
        await this.loadCoursesInOverview(studentId);
    }

    async loadAttendanceTab(studentId) {
        const statsElement = this.container.querySelector('#attendance-stats');
        const historyElement = this.container.querySelector('#attendance-history');

        await this.api.fetchWithStates(`/api/students/${studentId}/attendance`, {
            loadingElement: statsElement,
            onSuccess: (data) => {
                // Attendance Statistics
                statsElement.innerHTML = `
                    <div class="attendance-stats-grid">
                        <div class="stat-card">
                            <h4>Total de Aulas</h4>
                            <span class="stat-number">${data.totalClasses || 0}</span>
                        </div>
                        <div class="stat-card">
                            <h4>Presenças</h4>
                            <span class="stat-number present">${data.attendedClasses || 0}</span>
                        </div>
                        <div class="stat-card">
                            <h4>Faltas</h4>
                            <span class="stat-number absent">${data.missedClasses || 0}</span>
                        </div>
                        <div class="stat-card">
                            <h4>Taxa de Frequência</h4>
                            <span class="stat-number rate">${data.attendanceRate || 0}%</span>
                        </div>
                    </div>
                `;

                // Attendance History
                historyElement.innerHTML = `
                    <div class="attendance-timeline">
                        ${(data.attendanceHistory || []).map(record => `
                            <div class="timeline-item ${record.status}">
                                <div class="timeline-date">${this.formatDate(record.date)}</div>
                                <div class="timeline-content">
                                    <h5>${record.className}</h5>
                                    <p>${record.course || 'Curso não informado'}</p>
                                    <span class="status-badge ${record.status}">
                                        ${record.status === 'present' ? '✅ Presente' : '❌ Faltou'}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            },
            onEmpty: () => {
                statsElement.innerHTML = '<p class="empty-state">Nenhum registro de frequência encontrado</p>';
                historyElement.innerHTML = '<p class="empty-state">Histórico vazio</p>';
            },
            onError: () => {
                statsElement.innerHTML = '<p class="error-state">Erro ao carregar estatísticas</p>';
                historyElement.innerHTML = '<p class="error-state">Erro ao carregar histórico</p>';
            }
        });
    }

    async loadTechniquesTab(studentId) {
        const statsElement = this.container.querySelector('#techniques-stats');
        const listElement = this.container.querySelector('#techniques-list');

        await this.api.fetchWithStates(`/api/students/${studentId}/techniques`, {
            loadingElement: statsElement,
            onSuccess: (data) => {
                // Techniques Statistics by Category
                statsElement.innerHTML = `
                    <div class="techniques-categories">
                        ${Object.entries(data.categorySummary || {}).map(([category, count]) => `
                            <div class="category-card">
                                <h4>${category}</h4>
                                <span class="category-count">${count} técnicas</span>
                                <div class="category-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(count / (data.totalAvailable?.[category] || 1)) * 100}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Detailed Techniques List
                listElement.innerHTML = `
                    <div class="techniques-detailed">
                        ${Object.entries(data.techniquesByCategory || {}).map(([category, techniques]) => `
                            <div class="category-section">
                                <h4 class="category-title">${category}</h4>
                                <div class="techniques-grid">
                                    ${techniques.map(technique => `
                                        <div class="technique-card ${technique.masteryLevel || 'beginner'}">
                                            <h5>${technique.name}</h5>
                                            <p>${technique.description || 'Sem descrição'}</p>
                                            <div class="mastery-level">
                                                <span class="mastery-label">Nível:</span>
                                                <span class="mastery-value">${this.getMasteryLabel(technique.masteryLevel)}</span>
                                            </div>
                                            <div class="practice-date">
                                                Última prática: ${this.formatDate(technique.lastPracticed)}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            },
            onEmpty: () => {
                statsElement.innerHTML = '<p class="empty-state">Nenhuma técnica registrada</p>';
                listElement.innerHTML = '<p class="empty-state">O aluno ainda não praticou técnicas</p>';
            },
            onError: () => {
                statsElement.innerHTML = '<p class="error-state">Erro ao carregar técnicas</p>';
                listElement.innerHTML = '<p class="error-state">Erro ao carregar lista de técnicas</p>';
            }
        });
    }

    async loadProgressTab(studentId) {
        const progressElement = this.container.querySelector('#course-progress');
        const missingElement = this.container.querySelector('#missing-content');

        await this.api.fetchWithStates(`/api/students/${studentId}/progress`, {
            loadingElement: progressElement,
            onSuccess: (data) => {
                // Course Progress
                progressElement.innerHTML = `
                    <div class="course-progress-detail">
                        <div class="course-header">
                            <h4>${data.currentCourse?.name || 'Nenhum curso ativo'}</h4>
                            <div class="progress-percentage">${data.overallProgress || 0}%</div>
                        </div>
                        <div class="progress-bar-large">
                            <div class="progress-fill" style="width: ${data.overallProgress || 0}%"></div>
                        </div>
                        <div class="progress-breakdown">
                            ${data.basicTechniques ? `
                            <div class="breakdown-item">
                                <span>Técnicas Básicas</span>
                                <div class="mini-progress">
                                    <div class="progress-fill" style="width: ${data.basicTechniques.progress}%"></div>
                                </div>
                                <span>${data.basicTechniques.completed}/${data.basicTechniques.total}</span>
                            </div>
                            ` : ''}
                            ${data.advancedTechniques ? `
                            <div class="breakdown-item">
                                <span>Técnicas Avançadas</span>
                                <div class="mini-progress">
                                    <div class="progress-fill" style="width: ${data.advancedTechniques.progress}%"></div>
                                </div>
                                <span>${data.advancedTechniques.completed}/${data.advancedTechniques.total}</span>
                            </div>
                            ` : ''}
                            ${data.classAttendance ? `
                            <div class="breakdown-item">
                                <span>Aulas Frequentadas</span>
                                <div class="mini-progress">
                                    <div class="progress-fill" style="width: ${data.classAttendance.progress}%"></div>
                                </div>
                                <span>${data.classAttendance.attended}/${data.classAttendance.required}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;

                // Missing Content
                missingElement.innerHTML = `
                    <div class="missing-content-detail">
                        <div class="missing-sections">
                            ${(data.missingContent || []).map(section => `
                                <div class="missing-section">
                                    <h5>${section.category}</h5>
                                    <div class="missing-items">
                                        ${section.items.map(item => `
                                            <div class="missing-item">
                                                <span class="item-icon">${item.icon || '📝'}</span>
                                                <span class="item-name">${item.name}</span>
                                                <span class="item-priority priority-${item.priority}">${item.priority}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${data.estimatedCompletion ? `
                        <div class="completion-estimate">
                            <h5>Estimativa de Conclusão</h5>
                            <p>Com frequência regular, você completará o curso em aproximadamente <strong>${data.estimatedCompletion}</strong>.</p>
                        </div>
                        ` : ''}
                    </div>
                `;
            },
            onEmpty: () => {
                progressElement.innerHTML = '<p class="empty-state">Aluno não matriculado em curso ativo</p>';
                missingElement.innerHTML = '<p class="empty-state">Nenhum conteúdo pendente</p>';
            },
            onError: () => {
                progressElement.innerHTML = '<p class="error-state">Erro ao carregar progresso</p>';
                missingElement.innerHTML = '<p class="error-state">Erro ao carregar conteúdo faltante</p>';
            }
        });
    }

    async loadCourses(studentId) {
        const enrolledElement = this.container.querySelector('#enrolled-courses');
        const availableElement = this.container.querySelector('#available-courses');

        if (!enrolledElement || !availableElement) {
            console.warn('Courses tab elements not found');
            return;
        }

        await this.api.fetchWithStates(`/api/students/${studentId}/courses`, {
            loadingElement: enrolledElement,
            onSuccess: (data) => {
                console.log('🎯 [loadCourses] onSuccess chamado!', data);
                
                const enrolledCourses = data.enrolledCourses || [];
                const availableCourses = data.availableCourses || [];
                
                console.log('📚 Enrolled:', enrolledCourses.length, 'Available:', availableCourses.length);

                // ========== ENROLLED COURSES ==========
                if (enrolledCourses.length === 0) {
                    enrolledElement.innerHTML = `
                        <div class="empty-state-premium">
                            <div class="empty-state-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3>Nenhum Curso Matriculado</h3>
                            <p>O aluno ainda não está matriculado em nenhum curso.</p>
                            <p class="empty-state-hint">Matricule-o em um dos cursos disponíveis abaixo.</p>
                        </div>
                    `;
                } else {
                    enrolledElement.innerHTML = `
                        <div class="courses-grid">
                            ${enrolledCourses.map(enrollment => `
                                <div class="course-card-premium enrolled">
                                    <div class="course-card-header">
                                        <div class="course-title-section">
                                            <h4 class="course-title">${enrollment.course?.name || 'Curso sem nome'}</h4>
                                            <span class="badge badge-success">✓ Matriculado</span>
                                        </div>
                                        <span class="course-category-badge ${(enrollment.course?.category || 'ADULT').toLowerCase()}">${this.formatCategory(enrollment.course?.category)}</span>
                                    </div>
                                    
                                    <div class="course-stats-grid">
                                        <div class="stat-item">
                                            <i class="far fa-clock"></i>
                                            <span>${enrollment.course?.durationTotalWeeks || 0} semanas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-list-alt"></i>
                                            <span>${enrollment.course?.totalLessons || 0} aulas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="fas fa-signal"></i>
                                            <span>${enrollment.course?.difficulty || 'N/A'}</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-calendar"></i>
                                            <span>${this.formatDate(enrollment.enrolledAt)}</span>
                                        </div>
                                    </div>

                                    ${enrollment.course?.description ? `
                                        <p class="course-description">${enrollment.course.description}</p>
                                    ` : ''}

                                    <div class="course-actions-row">
                                        <button class="btn-action btn-primary" onclick="window.studentEditor?.viewCourseSchedule('${enrollment.courseId}', '${enrollment.course?.name || 'Curso'}')">
                                            <i class="fas fa-calendar-alt"></i>
                                            Ver Cronograma
                                        </button>
                                        <button class="btn-action btn-danger" onclick="window.studentEditor?.unenrollFromCourse('${studentId}', '${enrollment.id}', '${enrollment.course?.name || 'curso'}')">
                                            <i class="fas fa-times-circle"></i>
                                            Desmatricular
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                // ========== AVAILABLE COURSES ==========
                if (availableCourses.length === 0) {
                    availableElement.innerHTML = `
                        <div class="empty-state-info">
                            <div class="empty-state-icon">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h3>Nenhum Curso Disponível</h3>
                            <p>Este plano não inclui cursos adicionais ou o aluno já está matriculado em todos os cursos disponíveis.</p>
                        </div>
                    `;
                } else {
                    const availableHTML = `
                        <div class="courses-grid">
                            ${availableCourses.map(course => `
                                <div class="course-card-premium available">
                                    <div class="course-card-header">
                                        <div class="course-title-section">
                                            <h4 class="course-title">${course.name || 'Curso sem nome'}</h4>
                                            <span class="badge badge-info">Disponível no Plano</span>
                                        </div>
                                        <span class="course-category-badge ${(course.category || 'ADULT').toLowerCase()}">${this.formatCategory(course.category)}</span>
                                    </div>
                                    
                                    <div class="course-stats-grid">
                                        <div class="stat-item">
                                            <i class="far fa-clock"></i>
                                            <span>${course.durationTotalWeeks || 0} semanas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-list-alt"></i>
                                            <span>${course.totalLessons || 0} aulas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="fas fa-signal"></i>
                                            <span>${course.difficulty || 'Iniciante'}</span>
                                        </div>
                                    </div>

                                    ${course.description ? `
                                        <p class="course-description">${course.description}</p>
                                    ` : ''}

                                    <div class="course-actions-row">
                                        <button class="btn-action btn-secondary" onclick="window.studentEditor?.viewCourseSchedule('${course.id}', '${course.name || 'Curso'}')">
                                            <i class="fas fa-eye"></i>
                                            Ver Cronograma
                                        </button>
                                        <button class="btn-action btn-success" onclick="window.studentEditor?.enrollInCourse('${studentId}', '${course.id}', '${course.name || 'curso'}')">
                                            <i class="fas fa-plus-circle"></i>
                                            Matricular
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    
                    console.log('🎨 Rendering available courses HTML:', availableHTML.length, 'chars');
                    availableElement.innerHTML = availableHTML;
                    console.log('✅ availableElement.innerHTML set!', availableElement);
                }
            },
            onEmpty: () => {
                enrolledElement.innerHTML = `
                    <div class="empty-state-premium">
                        <div class="empty-state-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h3>Nenhum Curso Matriculado</h3>
                        <p>O aluno ainda não está matriculado em nenhum curso.</p>
                    </div>
                `;
                availableElement.innerHTML = `
                    <div class="empty-state-info">
                        <div class="empty-state-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>Nenhum Curso Disponível</h3>
                        <p>Nenhum curso encontrado no plano do aluno.</p>
                    </div>
                `;
            },
            onError: (error) => {
                const is404 = error?.message?.includes('404') || error?.status === 404;
                if (is404) {
                    enrolledElement.innerHTML = `
                        <div class="info-state">
                            <i class="fas fa-info-circle"></i>
                            <p>Endpoint <code>/api/students/${studentId}/courses</code> não implementado ainda.</p>
                            <p class="hint">Esta funcionalidade será adicionada em breve.</p>
                        </div>
                    `;
                    availableElement.innerHTML = '';
                } else {
                    enrolledElement.innerHTML = '<p class="error-state">Erro ao carregar cursos matriculados</p>';
                    availableElement.innerHTML = '<p class="error-state">Erro ao carregar cursos disponíveis</p>';
                }
            }
        });
    }

    async loadFinancial(studentId) {
        const subscriptionsElement = this.container.querySelector('#student-subscriptions');
        const paymentsElement = this.container.querySelector('#student-payments');

        if (!subscriptionsElement || !paymentsElement) {
            console.warn('Financial tab elements not found');
            return;
        }

        await this.api.fetchWithStates(`/api/students/${studentId}/financial-summary`, {
            loadingElement: subscriptionsElement,
            onSuccess: (response) => {
                const { payments = [], summary = {} } = response.data || {};
                
                // Get active subscriptions from this.current
                const activeSubscriptions = (this.current?.subscriptions || []).filter(sub => sub.status === 'ACTIVE');
                
                // Build subscriptions HTML section (show ALL active plans)
                let subscriptionsHTML = '';
                if (activeSubscriptions.length > 0) {
                    const planCards = activeSubscriptions.map(plan => `
                        <div class="subscription-card">
                            <div class="subscription-header">
                                <h6>${plan.plan?.name || 'Plano'}</h6>
                                <span class="subscription-price">R$ ${parseFloat(plan.currentPrice || 0).toFixed(2)}/mês</span>
                            </div>
                            <div class="subscription-details">
                                <div class="detail-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>Início: ${this.formatDate(plan.startDate)}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-sync-alt"></i>
                                    <span>Próximo: ${this.formatDate(plan.nextBillingDate)}</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-info-circle"></i>
                                    <span>${plan.billingType === 'RECURRING' ? 'Recorrente' : 'Único'}</span>
                                </div>
                                ${plan.plan?.description ? `
                                <div class="detail-item">
                                    <i class="fas fa-file-alt"></i>
                                    <span>${plan.plan.description}</span>
                                </div>
                                ` : ''}
                            </div>
                            <div class="subscription-actions">
                                <button class="btn-action btn-warning" onclick="window.studentEditor.confirmEndSubscription('${plan.id}')" title="Finalizar (inativa mas mantém histórico)">
                                    <i class="fas fa-pause-circle"></i> Finalizar
                                </button>
                                <button class="btn-action btn-danger" onclick="window.studentEditor.confirmDeleteSubscription('${plan.id}')" title="Deletar (remove permanentemente)">
                                    <i class="fas fa-trash-alt"></i> Deletar
                                </button>
                            </div>
                        </div>
                    `).join('');
                    
                    subscriptionsHTML = `
                        <div class="active-subscriptions">
                            <h5><i class="fas fa-check-circle"></i> ${activeSubscriptions.length > 1 ? `Planos Ativos (${activeSubscriptions.length})` : 'Plano Ativo'}</h5>
                            <div class="subscriptions-grid ${activeSubscriptions.length > 1 ? 'multiple' : 'single'}">
                                ${planCards}
                            </div>
                        </div>
                    `;
                }
                
                // Financial Summary Cards with Add Plan Button
                subscriptionsElement.innerHTML = `
                    <div class="financial-header">
                        <h4>Resumo Financeiro</h4>
                        <button class="btn-add-plan" onclick="window.studentEditor.showAddPlanModal()">
                            <i class="fas fa-plus"></i> Adicionar Plano
                        </button>
                    </div>
                    
                    <div class="financial-summary">
                        <div class="summary-card">
                            <h4>Total Pago</h4>
                            <span class="amount-paid">R$ ${(summary.totalPaid || 0).toFixed(2)}</span>
                        </div>
                        <div class="summary-card">
                            <h4>Total Pendente</h4>
                            <span class="amount-pending">R$ ${(summary.totalPending || 0).toFixed(2)}</span>
                        </div>
                        <div class="summary-card">
                            <h4>Total Atrasado</h4>
                            <span class="amount-overdue">R$ ${(summary.totalOverdue || 0).toFixed(2)}</span>
                        </div>
                        <div class="summary-card">
                            <h4>Último Pagamento</h4>
                            <span class="last-payment">${summary.lastPayment ? this.formatDate(summary.lastPayment.dueDate) : 'Nenhum'}</span>
                        </div>
                    </div>
                    
                    ${subscriptionsHTML}
                `;

                // Payment History
                paymentsElement.innerHTML = `
                    <div class="payments-list">
                        <h5>Histórico de Pagamentos (Últimos 20)</h5>
                        ${payments.length > 0 ? payments.map(payment => {
                            // Converter Decimal para número
                            const amount = typeof payment.amount === 'object' ? parseFloat(payment.amount.toString()) : payment.amount;
                            const planName = payment.subscription?.plan?.name || 'Plano não informado';
                            const subscriptionId = payment.subscription?.id || '';
                            const isPaid = payment.status === 'RECEIVED' || payment.status === 'PAID';
                            
                            return `
                            <div class="payment-item ${payment.status?.toLowerCase()}">
                                <div class="payment-date">
                                    <span class="date">${this.formatDate(payment.dueDate)}</span>
                                    <span class="status-badge ${payment.status?.toLowerCase()}">${payment.status || 'Pendente'}</span>
                                </div>
                                <div class="payment-details">
                                    <span class="payment-description">${planName}</span>
                                    <span class="payment-method">${payment.paymentMethod || 'Não informado'}</span>
                                    ${subscriptionId ? `<span class="subscription-id">Assinatura: ${subscriptionId.slice(0, 8)}...</span>` : ''}
                                </div>
                                <div class="payment-amount">
                                    <span class="amount ${isPaid ? 'paid' : 'pending'}">
                                        R$ ${(amount || 0).toFixed(2)}
                                    </span>
                                </div>
                                <!-- TODO: Implementar endpoints PATCH /api/payments/:id e /api/subscriptions/:id
                                <div class="payment-actions">
                                    ${!isPaid ? `
                                        <button class="btn-action btn-mark-paid" onclick="window.studentEditor.markPaymentAsPaid('${payment.id}')" title="Marcar como pago">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    ` : ''}
                                    ${subscriptionId ? `
                                        <button class="btn-action btn-end-subscription" onclick="window.studentEditor.confirmEndSubscription('${subscriptionId}')" title="Finalizar assinatura">
                                            <i class="fas fa-stop-circle"></i>
                                        </button>
                                    ` : ''}
                                </div>
                                -->
                            </div>
                        `}).join('') : '<p class="empty-state">Nenhum pagamento registrado</p>'}
                    </div>
                `;
            },
            onEmpty: () => {
                subscriptionsElement.innerHTML = '<p class="empty-state">Nenhuma informação financeira encontrada</p>';
                paymentsElement.innerHTML = '<p class="empty-state">Nenhum pagamento registrado</p>';
            },
            onError: (error) => {
                const is404 = error?.message?.includes('404') || error?.status === 404;
                if (is404) {
                    subscriptionsElement.innerHTML = `
                        <div class="info-state">
                            <i class="fas fa-info-circle"></i>
                            <p>Endpoint <code>/api/students/${studentId}/financial-summary</code> não implementado ainda.</p>
                            <p class="hint">Esta funcionalidade será adicionada em breve.</p>
                        </div>
                    `;
                    paymentsElement.innerHTML = '';
                } else {
                    subscriptionsElement.innerHTML = '<p class="error-state">Erro ao carregar informações financeiras</p>';
                    paymentsElement.innerHTML = '<p class="error-state">Erro ao carregar histórico de pagamentos</p>';
                }
            }
        });
    }

    // Show Add Plan Modal
    async showAddPlanModal() {
        try {
            // Buscar planos disponíveis
            const response = await this.api.api.get('/api/billing-plans');
            const plans = response.data || [];

            if (plans.length === 0) {
                alert('Nenhum plano disponível no sistema.');
                return;
            }

            // Criar modal
            const modalHTML = `
                <div class="modal-overlay" id="add-plan-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3><i class="fas fa-plus-circle"></i> Adicionar Plano ao Aluno</h3>
                            <button class="modal-close" onclick="window.studentEditor.closeAddPlanModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="add-plan-form">
                                <div class="form-group">
                                    <label for="plan-select">Selecione o Plano:</label>
                                    <select id="plan-select" class="form-control" required>
                                        <option value="">-- Selecione --</option>
                                        ${plans.map(plan => `
                                            <option value="${plan.id}" data-price="${plan.price}">
                                                ${plan.name} - R$ ${parseFloat(plan.price || 0).toFixed(2)}/mês
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="payment-method">Forma de Pagamento:</label>
                                    <select id="payment-method" class="form-control" required>
                                        <option value="">-- Selecione --</option>
                                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                        <option value="BOLETO">Boleto</option>
                                        <option value="PIX">PIX</option>
                                        <option value="DINHEIRO">Dinheiro</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="due-day">Dia de Vencimento:</label>
                                    <input type="number" id="due-day" class="form-control" min="1" max="31" value="10" required>
                                </div>

                                <div class="form-group">
                                    <label for="start-date">Data de Início:</label>
                                    <input type="date" id="start-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>

                                <div class="modal-actions">
                                    <button type="button" class="btn-secondary" onclick="window.studentEditor.closeAddPlanModal()">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-check"></i> Adicionar Plano
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;

            // Adicionar modal ao DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Event listener para o formulário
            document.getElementById('add-plan-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.addPlanToStudent();
            });

        } catch (error) {
            window.app?.handleError?.(error, 'showAddPlanModal');
        }
    }

    // Close Add Plan Modal
    closeAddPlanModal() {
        const modal = document.getElementById('add-plan-modal');
        if (modal) {
            modal.remove();
        }
    }

    // Add Plan to Student
    async addPlanToStudent() {
        try {
            const planId = document.getElementById('plan-select').value;
            const paymentMethod = document.getElementById('payment-method').value;
            const dueDay = document.getElementById('due-day').value;
            const startDate = document.getElementById('start-date').value;

            if (!planId || !paymentMethod) {
                alert('Por favor, preencha todos os campos obrigatórios');
                return;
            }

            // Obter studentId do aluno atual
            const studentId = this.current?.id || this.currentStudentId;
            
            if (!studentId) {
                alert('Erro: ID do aluno não encontrado. Recarregue a página e tente novamente.');
                console.error('Student ID missing:', { current: this.current, currentStudentId: this.currentStudentId });
                return;
            }

            console.log('Creating subscription with:', { studentId, planId, startDate });

            // Criar assinatura (API aceita apenas studentId, planId e startDate)
            const response = await this.api.api.post('/api/financial/subscriptions', {
                studentId: studentId,
                planId: planId,
                startDate: new Date(startDate).toISOString()
            });

            if (response.success) {
                // If replacing an old plan, end the previous subscription
                if (this.subscriptionToReplace) {
                    try {
                        console.log('🔄 Finalizando plano anterior:', this.subscriptionToReplace);
                        await this.endSubscription(this.subscriptionToReplace, true); // true = silent mode
                        this.subscriptionToReplace = null;
                    } catch (error) {
                        console.warn('⚠️ Erro ao finalizar plano anterior:', error);
                        // Continue anyway, new plan was created successfully
                    }
                }
                
                this.closeAddPlanModal();
                window.app?.showFeedback?.('Plano adicionado com sucesso!', 'success');
                
                // Reload student data to get updated subscriptions
                await this.loadStudent(studentId);
                await this.loadFinancial(studentId);
            } else {
                alert(response.message || 'Erro ao adicionar plano');
            }

        } catch (error) {
            console.error('Erro ao adicionar plano:', error);
            alert('Erro ao adicionar plano. Verifique os dados e tente novamente.');
            window.app?.handleError?.(error, 'addPlanToStudent');
        }
    }

    // Mark Payment as Paid
    async markPaymentAsPaid(paymentId) {
        if (!confirm('Confirmar pagamento como recebido?')) {
            return;
        }

        try {
            const response = await this.api.api.patch(`/api/payments/${paymentId}`, {
                status: 'RECEIVED',
                paidAt: new Date().toISOString()
            });

            if (response.success) {
                window.app?.showFeedback?.('Pagamento marcado como recebido!', 'success');
                // Recarregar aba financeira
                const studentId = this.current?.id || this.currentStudentId;
                await this.loadFinancial(studentId);
            }

        } catch (error) {
            window.app?.handleError?.(error, 'markPaymentAsPaid');
        }
    }

    // Confirm Delete Subscription (PERMANENT removal)
    confirmDeleteSubscription(subscriptionId) {
        if (!confirm('⚠️ TEM CERTEZA QUE DESEJA DELETAR PERMANENTEMENTE ESTA ASSINATURA?\n\n🚨 ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n❌ Isso vai APAGAR:\n- A assinatura do banco de dados\n- Todo o histórico de pagamentos relacionado\n- Não poderá ser desfeito\n\n💡 Se quiser apenas inativar (mantendo histórico), use "Finalizar" ao invés de "Deletar".\n\nContinuar com a DELEÇÃO PERMANENTE?')) {
            return;
        }

        this.deleteSubscription(subscriptionId);
    }

    // Delete Subscription (PERMANENT removal via DELETE endpoint)
    async deleteSubscription(subscriptionId) {
        try {
            const response = await this.api.api.delete(`/api/financial/subscriptions/${subscriptionId}`);

            if (response.success) {
                window.app?.showFeedback?.('✅ Assinatura deletada permanentemente!', 'success');
                // Recarregar dados do aluno e aba financeira
                const studentId = this.current?.id || this.currentStudentId;
                if (studentId) {
                    await this.loadStudent(studentId);
                    await this.loadFinancial(studentId);
                }
            }

        } catch (error) {
            console.error('❌ Erro ao deletar assinatura:', error);
            window.app?.handleError?.(error, 'deleteSubscription');
        }
    }

    // Confirm End Subscription (INATIVA mas mantém histórico)
    confirmEndSubscription(subscriptionId) {
        if (!confirm('Tem certeza que deseja FINALIZAR esta assinatura?\n\nIsso vai:\n- Encerrar a assinatura (status INACTIVE)\n- Parar de gerar novos pagamentos\n- Manter o histórico de pagamentos\n\n💡 Para remover permanentemente, use "Deletar".')) {
            return;
        }

        this.endSubscription(subscriptionId);
    }

    // End Subscription
    async endSubscription(subscriptionId, silent = false) {
        try {
            const response = await this.api.api.patch(`/api/financial/subscriptions/${subscriptionId}`, {
                status: 'INACTIVE',
                endDate: new Date().toISOString(),
                isActive: false
            });

            if (response.success) {
                if (!silent) {
                    window.app?.showFeedback?.('Assinatura finalizada com sucesso!', 'success');
                }
                // Recarregar dados do aluno e aba financeira
                const studentId = this.current?.id || this.currentStudentId;
                if (studentId) {
                    await this.loadStudent(studentId);
                    await this.loadFinancial(studentId);
                }
            }

        } catch (error) {
            console.error('Erro ao finalizar assinatura:', error);
            if (!silent) {
                window.app?.handleError?.(error, 'endSubscription');
            }
        }
    }

    // ==================== COURSES IN OVERVIEW TAB ====================
    
    async loadCoursesInOverview(studentId) {
        const coursesElement = this.container.querySelector('#overview-courses-list');

        if (!coursesElement) {
            console.warn('Courses in overview tab element not found');
            return;
        }

        await this.api.fetchWithStates(`/api/students/${studentId}/courses`, {
            loadingElement: coursesElement,
            onSuccess: (data) => {
                const availableCourses = data.availableCourses || [];

                if (availableCourses.length === 0) {
                    coursesElement.innerHTML = `
                        <div class="empty-state-simple">
                            <i class="fas fa-graduation-cap"></i>
                            <p>Nenhum curso base encontrado no plano ativo.</p>
                        </div>
                    `;
                } else {
                    coursesElement.innerHTML = `
                        <div class="courses-compact-list">
                            ${availableCourses.map(course => `
                                <div class="course-compact-card available">
                                    <div class="course-compact-icon">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                    <div class="course-compact-info">
                                        <h6>${course.name || 'Curso sem nome'}</h6>
                                        <span class="course-compact-meta">
                                            ${course.durationTotalWeeks || 0} semanas • 
                                            ${course.totalLessons || 0} aulas • 
                                            ${course.difficulty || 'Iniciante'}
                                        </span>
                                        ${course.description ? `<p class="course-compact-desc">${course.description}</p>` : ''}
                                        <span class="course-compact-badge auto">Automático pelo Plano</span>
                                    </div>
                                    <div class="course-compact-actions">
                                        <button class="btn-compact btn-primary" onclick="window.studentEditor?.viewCourseSchedule('${course.id}', \`${course.name || 'Curso'}\`)" title="Ver Cronograma Completo">
                                            <i class="fas fa-calendar-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            },
            onEmpty: () => {
                coursesElement.innerHTML = `
                    <div class="empty-state-simple">
                        <i class="fas fa-graduation-cap"></i>
                        <p>Nenhum curso encontrado no plano.</p>
                    </div>
                `;
            },
            onError: (error) => {
                coursesElement.innerHTML = '<p class="error-state">Erro ao carregar cursos do plano</p>';
            }
        });
    }

    // ==================== COURSES TAB (Dedicated) ====================
    
    async loadCoursesTab(studentId) {
        const enrolledElement = this.container.querySelector('#enrolled-courses-tab');
        const availableElement = this.container.querySelector('#available-courses-tab');

        if (!enrolledElement || !availableElement) {
            console.warn('Courses tab elements not found');
            return;
        }

        await this.api.fetchWithStates(`/api/students/${studentId}/courses`, {
            loadingElement: enrolledElement,
            onSuccess: (data) => {
                const enrolledCourses = data.enrolledCourses || [];
                const availableCourses = data.availableCourses || [];

                // ========== ENROLLED COURSES (with End Enrollment button) ==========
                if (enrolledCourses.length === 0) {
                    enrolledElement.innerHTML = `
                        <div class="empty-state-premium">
                            <div class="empty-state-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3>Nenhum Curso Matriculado</h3>
                            <p>O aluno ainda não possui matrícula ativa em nenhum curso.</p>
                            <p class="empty-state-hint">Verifique os cursos disponíveis abaixo.</p>
                        </div>
                    `;
                } else {
                    enrolledElement.innerHTML = `
                        <div class="courses-grid">
                            ${enrolledCourses.map(enrollment => `
                                <div class="course-card-premium enrolled">
                                    <div class="course-card-header">
                                        <div class="course-title-section">
                                            <h4 class="course-title">${enrollment.course?.name || 'Curso sem nome'}</h4>
                                            <span class="badge badge-success">✓ Matriculado</span>
                                        </div>
                                        <span class="course-category-badge ${(enrollment.course?.category || 'ADULT').toLowerCase()}">${this.formatCategory(enrollment.course?.category)}</span>
                                    </div>
                                    
                                    <div class="course-stats-grid">
                                        <div class="stat-item">
                                            <i class="far fa-clock"></i>
                                            <span>${enrollment.course?.durationTotalWeeks || 0} semanas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-list-alt"></i>
                                            <span>${enrollment.course?.totalLessons || 0} aulas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="fas fa-signal"></i>
                                            <span>${enrollment.course?.difficulty || 'N/A'}</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-calendar"></i>
                                            <span>Desde ${this.formatDate(enrollment.enrolledAt)}</span>
                                        </div>
                                    </div>

                                    ${enrollment.course?.description ? `
                                        <p class="course-description">${enrollment.course.description}</p>
                                    ` : ''}

                                    <div class="course-actions-row">
                                        <button class="btn-action btn-primary" onclick="window.studentEditor?.viewCourseSchedule('${enrollment.courseId}', \`${enrollment.course?.name || 'Curso'}\`)" title="Ver Cronograma">
                                            <i class="fas fa-calendar-alt"></i>
                                            Ver Cronograma
                                        </button>
                                        <button class="btn-action btn-warning" onclick="window.studentEditor?.endCourseEnrollment('${enrollment.id}', \`${enrollment.course?.name || 'curso'}\`)" title="Encerrar Matrícula">
                                            <i class="fas fa-times-circle"></i>
                                            Encerrar Matrícula
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                // ========== AVAILABLE COURSES (not enrolled or inactive) ==========
                if (availableCourses.length === 0) {
                    availableElement.innerHTML = `
                        <div class="empty-state-info">
                            <div class="empty-state-icon">
                                <i class="fas fa-check-double"></i>
                            </div>
                            <h3>Todos os Cursos Matriculados!</h3>
                            <p>O aluno já está matriculado em todos os cursos disponíveis no plano.</p>
                        </div>
                    `;
                } else {
                    availableElement.innerHTML = `
                        <div class="courses-grid">
                            ${availableCourses.map(course => `
                                <div class="course-card-premium available">
                                    <div class="course-card-header">
                                        <div class="course-title-section">
                                            <h4 class="course-title">${course.name || 'Curso sem nome'}</h4>
                                            <span class="badge badge-info">Disponível</span>
                                        </div>
                                        <span class="course-category-badge ${(course.category || 'ADULT').toLowerCase()}">${this.formatCategory(course.category)}</span>
                                    </div>
                                    
                                    <div class="course-stats-grid">
                                        <div class="stat-item">
                                            <i class="far fa-clock"></i>
                                            <span>${course.durationTotalWeeks || 0} semanas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="far fa-list-alt"></i>
                                            <span>${course.totalLessons || 0} aulas</span>
                                        </div>
                                        <div class="stat-item">
                                            <i class="fas fa-signal"></i>
                                            <span>${course.difficulty || 'Iniciante'}</span>
                                        </div>
                                    </div>

                                    ${course.description ? `
                                        <p class="course-description">${course.description}</p>
                                    ` : ''}

                                    <div class="course-actions-row">
                                        <button class="btn-action btn-secondary" onclick="window.studentEditor?.viewCourseSchedule('${course.id}', \`${course.name || 'Curso'}\`)" title="Ver Cronograma">
                                            <i class="fas fa-eye"></i>
                                            Ver Detalhes
                                        </button>
                                        <button class="btn-action btn-success" onclick="window.studentEditor?.enrollInCourseFromTab('${course.id}', \`${course.name || 'curso'}\`)" title="Matricular neste curso">
                                            <i class="fas fa-plus-circle"></i>
                                            Matricular
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            },
            onEmpty: () => {
                enrolledElement.innerHTML = `
                    <div class="empty-state-premium">
                        <div class="empty-state-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h3>Nenhum Curso</h3>
                        <p>Nenhum curso encontrado.</p>
                    </div>
                `;
                availableElement.innerHTML = `
                    <div class="empty-state-info">
                        <div class="empty-state-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>Nenhum Curso Disponível</h3>
                        <p>Nenhum curso disponível no momento.</p>
                    </div>
                `;
            },
            onError: (error) => {
                enrolledElement.innerHTML = '<p class="error-state">Erro ao carregar cursos matriculados</p>';
                availableElement.innerHTML = '<p class="error-state">Erro ao carregar cursos disponíveis</p>';
            }
        });
    }

    // ==================== COURSES IN FINANCIAL TAB ====================
    
    async loadCoursesInFinancial(studentId) {
        const enrolledElement = this.container.querySelector('#enrolled-courses-financial');
        const availableElement = this.container.querySelector('#available-courses-financial');

        if (!enrolledElement || !availableElement) {
            console.warn('Courses in financial tab elements not found');
            return;
        }

        await this.api.fetchWithStates(`/api/students/${studentId}/courses`, {
            loadingElement: enrolledElement,
            onSuccess: (data) => {
                const enrolledCourses = data.enrolledCourses || [];
                const availableCourses = data.availableCourses || [];

                // ========== ENROLLED COURSES (Simplified for Financial Tab) ==========
                if (enrolledCourses.length === 0) {
                    enrolledElement.innerHTML = `
                        <div class="empty-state-simple">
                            <i class="fas fa-graduation-cap"></i>
                            <p>Nenhum curso matriculado ainda.</p>
                        </div>
                    `;
                } else {
                    enrolledElement.innerHTML = `
                        <div class="courses-compact-list">
                            ${enrolledCourses.map(enrollment => `
                                <div class="course-compact-card enrolled">
                                    <div class="course-compact-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="course-compact-info">
                                        <h6>${enrollment.course?.name || 'Curso sem nome'}</h6>
                                        <span class="course-compact-meta">
                                            ${enrollment.course?.durationTotalWeeks || 0} semanas • 
                                            ${enrollment.course?.totalLessons || 0} aulas
                                        </span>
                                    </div>
                                    <div class="course-compact-actions">
                                        <button class="btn-compact btn-primary" onclick="window.studentEditor?.viewCourseSchedule('${enrollment.courseId}', \`${enrollment.course?.name || 'Curso'}\`)" title="Ver Cronograma">
                                            <i class="fas fa-calendar-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                // ========== AVAILABLE COURSES (Simplified for Financial Tab) ==========
                if (availableCourses.length === 0) {
                    availableElement.innerHTML = `
                        <div class="empty-state-simple">
                            <i class="fas fa-book-open"></i>
                            <p>Todos os cursos do plano já estão matriculados ou nenhum disponível.</p>
                        </div>
                    `;
                } else {
                    availableElement.innerHTML = `
                        <div class="courses-compact-list">
                            ${availableCourses.map(course => `
                                <div class="course-compact-card available">
                                    <div class="course-compact-icon">
                                        <i class="fas fa-plus-circle"></i>
                                    </div>
                                    <div class="course-compact-info">
                                        <h6>${course.name || 'Curso sem nome'}</h6>
                                        <span class="course-compact-meta">
                                            ${course.durationTotalWeeks || 0} semanas • 
                                            ${course.totalLessons || 0} aulas
                                        </span>
                                        <span class="course-compact-badge">${this.formatCategory(course.category)}</span>
                                    </div>
                                    <div class="course-compact-actions">
                                        <button class="btn-compact btn-secondary" onclick="window.studentEditor?.viewCourseSchedule('${course.id}', \`${course.name || 'Curso'}\`)" title="Ver Cronograma">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-compact btn-success" onclick="window.studentEditor?.enrollInCourse('${studentId}', '${course.id}', \`${course.name || 'curso'}\`)" title="Matricular">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            },
            onEmpty: () => {
                enrolledElement.innerHTML = `
                    <div class="empty-state-simple">
                        <i class="fas fa-graduation-cap"></i>
                        <p>Nenhum curso matriculado.</p>
                    </div>
                `;
                availableElement.innerHTML = `
                    <div class="empty-state-simple">
                        <i class="fas fa-book-open"></i>
                        <p>Nenhum curso disponível no plano.</p>
                    </div>
                `;
            },
            onError: (error) => {
                enrolledElement.innerHTML = '<p class="error-state">Erro ao carregar cursos</p>';
                availableElement.innerHTML = '<p class="error-state">Erro ao carregar cursos disponíveis</p>';
            }
        });
    }

    // ==================== COURSE ACTIONS ====================

    // Format course category for display
    formatCategory(category) {
        const categories = {
            'ADULT': 'Adultos',
            'TEEN': 'Adolescentes',
            'KIDS': 'Crianças',
            'SENIOR': 'Idosos',
            'WOMEN': 'Mulheres',
            'MEN': 'Homens',
            'MIXED': 'Misto',
            'LAW_ENFORCEMENT': 'Forças de Segurança'
        };
        return categories[category] || category || 'N/A';
    }

    // View Course Schedule (navigate to course editor schedule tab)
    viewCourseSchedule(courseId, courseName) {
        if (!courseId) {
            window.app?.showFeedback?.('ID do curso não encontrado', 'error');
            return;
        }

        console.log(`📅 Navegando para cronograma do curso: ${courseName}`);
        
        // Navigate to course editor with schedule tab
        window.location.hash = `#course-editor?id=${courseId}&tab=schedule`;
        
        // Show feedback
        window.app?.showFeedback?.(`Abrindo cronograma: ${courseName}`, 'info');
    }

    // Enroll in Course
    async enrollInCourse(studentId, courseId, courseName) {
        if (!confirm(`Deseja matricular o aluno no curso:\n\n"${courseName}"?\n\nIsso criará uma matrícula ativa no curso.`)) {
            return;
        }

        try {
            const response = await this.api.api.post(`/api/students/${studentId}/courses`, {
                courseId,
                startDate: new Date().toISOString(),
                status: 'ACTIVE'
            });

            if (response.success) {
                window.app?.showFeedback?.(`✅ Aluno matriculado em "${courseName}"!`, 'success');
                // Reload courses tab
                await this.loadCourses(studentId);
            }

        } catch (error) {
            console.error('❌ Erro ao matricular aluno:', error);
            window.app?.handleError?.(error, 'enrollInCourse');
        }
    }

    // Unenroll from Course
    async unenrollFromCourse(studentId, enrollmentId, courseName) {
        if (!confirm(`Deseja DESMATRICULAR o aluno do curso:\n\n"${courseName}"?\n\nIsso encerrará a matrícula ativa.`)) {
            return;
        }

        try {
            const response = await this.api.api.patch(`/api/students/${studentId}/courses/${enrollmentId}`, {
                status: 'DROPPED',
                endDate: new Date().toISOString()
            });

            if (response.success) {
                window.app?.showFeedback?.(`✅ Aluno desmatriculado de "${courseName}"!`, 'success');
                // Reload courses tab
                await this.loadCourses(studentId);
            }

        } catch (error) {
            console.error('❌ Erro ao desmatricular aluno:', error);
            window.app?.handleError?.(error, 'unenrollFromCourse');
        }
    }

    // End Course Enrollment (for dedicated Courses tab)
    async endCourseEnrollment(enrollmentId, courseName) {
        if (!confirm(`⚠️ Confirma ENCERRAR a matrícula do curso:\n\n"${courseName}"?\n\nA matrícula será marcada como INATIVA.`)) {
            return;
        }

        try {
            const studentId = this.current?.id;
            if (!studentId) {
                throw new Error('ID do aluno não encontrado');
            }

            const response = await this.api.api.patch(`/api/students/${studentId}/courses/${enrollmentId}`, {
                status: 'DROPPED',
                endDate: new Date().toISOString()
            });

            if (response.success) {
                window.app?.showFeedback?.(`✅ Matrícula de "${courseName}" encerrada com sucesso!`, 'success');
                // Reload courses tab to update lists
                await this.loadCoursesTab(studentId);
            }

        } catch (error) {
            console.error('❌ Erro ao encerrar matrícula:', error);
            window.app?.handleError?.(error, 'endCourseEnrollment');
        }
    }

    // Enroll in Course (from dedicated Courses tab)
    async enrollInCourseFromTab(courseId, courseName) {
        if (!confirm(`✅ Confirma MATRICULAR o aluno no curso:\n\n"${courseName}"?\n\nUma nova matrícula será criada.`)) {
            return;
        }

        try {
            const studentId = this.current?.id;
            if (!studentId) {
                throw new Error('ID do aluno não encontrado');
            }

            const response = await this.api.api.post(`/api/students/${studentId}/courses`, {
                courseId: courseId,
                status: 'ACTIVE',
                enrolledAt: new Date().toISOString()
            });

            if (response.success) {
                window.app?.showFeedback?.(`✅ Aluno matriculado em "${courseName}" com sucesso!`, 'success');
                // Reload courses tab to update lists
                await this.loadCoursesTab(studentId);
            }

        } catch (error) {
            console.error('❌ Erro ao matricular aluno:', error);
            
            // Check if it's a 404 error (endpoint not found)
            if (error.message?.includes('404') || error.message?.includes('not found')) {
                window.app?.showFeedback?.(
                    '⚠️ Endpoint de matrícula ainda não implementado no backend. Entre em contato com o desenvolvedor.',
                    'warning'
                );
            } else {
                window.app?.handleError?.(error, 'enrollInCourseFromTab');
            }
        }
    }

    // Helper methods
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getMasteryLabel(level) {
        const labels = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário', 
            'advanced': 'Avançado',
            'expert': 'Expert'
        };
        return labels[level] || 'Não avaliado';
    }
}

// Global functions for course management
window.enrollInCourse = async function(studentId, courseId, courseName) {
    if (!confirm(`Matricular aluno no curso "${courseName}"?`)) return;
    
    try {
        const response = await fetch(`/api/students/${studentId}/enrollments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                courseId: courseId,
                status: 'ACTIVE',
                enrolledAt: new Date().toISOString(),
                currentLevel: 'Iniciante'
            })
        });
        
        if (response.ok) {
            window.app?.showToast?.('Aluno matriculado com sucesso!', 'success');
            // Refresh the courses tab
            location.reload();
        } else {
            throw new Error('Failed to enroll student');
        }
        
    } catch (error) {
        console.error('Error enrolling student:', error);
        window.app?.showToast?.('Erro ao matricular aluno', 'error');
    }
};

window.unenrollFromCourse = async function(studentId, enrollmentId) {
    if (!confirm('Tem certeza que deseja cancelar esta matrícula?')) return;
    
    try {
        const response = await fetch(`/api/students/${studentId}/enrollments/${enrollmentId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            window.app?.showToast?.('Matrícula cancelada com sucesso!', 'success');
            // Refresh the courses tab
            location.reload();
        } else {
            throw new Error('Failed to unenroll student');
        }
        
    } catch (error) {
        console.error('Error unenrolling student:', error);
        window.app?.showToast?.('Erro ao cancelar matrícula', 'error');
    }
};

window.openStudentSchedule = function(studentId, courseId) {
    // Navigate to student schedule view
    window.router?.navigateTo(`students/${studentId}/schedule/${courseId}`);
};

window.openCoursesManager = function() {
    // Navigate to courses management
    window.router?.navigateTo('courses');
};

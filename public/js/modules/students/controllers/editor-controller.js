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
        this.modelsLoaded = false;
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
                    <div class="tabs-header">
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
                            <i class="fas fa-wallet"></i>
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
                            <!-- Seção de Foto para Reconhecimento Facial -->
                            <div class="form-section biometric-capture-section">
                                <h3 class="section-title">
                                    <i class="fas fa-camera"></i>
                                    Foto para Reconhecimento Facial
                                </h3>
                                <div class="biometric-capture-container">
                                    <div class="capture-preview-area">
                                        <div id="photo-preview" class="photo-preview ${s?.biometricData?.photoUrl ? 'has-photo' : ''}">
                                            ${(() => {
                                                const bioUrl = s?.biometricData?.photoUrl;
                                                const isBioUri = bioUrl && bioUrl.startsWith('biometric://');
                                                const avatarUrl = s?.user?.avatarUrl;
                                                
                                                if (isBioUri && !avatarUrl) {
                                                    return `
                                                        <div class="no-photo-placeholder biometric-active" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                                                            <i class="fas fa-fingerprint" style="font-size: 3rem; color: var(--success-color); margin-bottom: 10px;"></i>
                                                            <p style="font-weight: 600; margin: 0;">Biometria Ativa</p>
                                                            <p style="font-size: 0.8rem; opacity: 0.8; margin: 5px 0 0 0;">Foto no dispositivo</p>
                                                            <div class="photo-status" style="margin-top: 10px;">
                                                                <span class="status-badge success">✅ Cadastrado</span>
                                                            </div>
                                                        </div>
                                                    `;
                                                } else if (bioUrl || avatarUrl) {
                                                    const url = isBioUri ? avatarUrl : bioUrl;
                                                    return `
                                                        <img src="${url}" alt="Foto do aluno" class="captured-photo">
                                                        <div class="photo-status">
                                                            <span class="status-badge success">✅ Cadastrado</span>
                                                        </div>
                                                    `;
                                                } else {
                                                    return `
                                                        <div class="no-photo-placeholder">
                                                            <i class="fas fa-user-circle"></i>
                                                            <p>Nenhuma foto cadastrada</p>
                                                        </div>
                                                    `;
                                                }
                                            })()}
                                        </div>
                                        <div class="capture-actions">
                                            <button type="button" id="btn-capture-photo" class="btn-form btn-primary-form">
                                                <i class="fas fa-camera"></i>
                                                ${s?.biometricData?.photoUrl ? 'Atualizar Foto' : 'Capturar Foto'}
                                            </button>
                                            ${s?.biometricData?.photoUrl ? `
                                                <button type="button" id="btn-remove-photo" class="btn-form btn-danger-form">
                                                    <i class="fas fa-trash"></i>
                                                    Remover Foto
                                                </button>
                                            ` : ''}
                                        </div>
                                        <div class="capture-help">
                                            <p><i class="fas fa-info-circle"></i> A foto será usada para check-in automático via reconhecimento facial</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
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
                        
                        <!-- Responsible Tab 🆕 -->
                        <section class="tab-panel" id="tab-responsible">
                            <div class="module-header-premium">
                                <div class="header-content">
                                    <div class="header-left">
                                        <h3 class="section-title">
                                            <span class="section-icon">👤</span>
                                            Responsável Financeiro
                                        </h3>
                                        <p class="section-subtitle">Pessoa responsável por receber as cobranças</p>
                                    </div>
                                </div>
                            </div>

                            <div class="section-body">
                                <div id="student-responsible-container">
                                    <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>
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
                console.log('🖱️ [Tab Click] Clicked on tab:', btn.getAttribute('data-tab'));
                
                // Prevenir clique em abas desabilitadas
                if (btn.disabled) {
                    console.warn('⏸️ [Tab Click] Tab is disabled, ignoring...');
                    return;
                }
                
                this.container.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.getAttribute('data-tab');
                console.log('🎯 [Tab Click] Activating tab:', tab);
                
                this.container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                const targetPanel = this.container.querySelector(`#tab-${tab}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    console.log('✅ [Tab Click] Panel displayed:', targetPanel.id);
                }
                
                // Lazy load tab content
                console.log('🔍 [Tab Click] Tab:', tab, 'Loaded:', btn.dataset.loaded, 'StudentId:', this.current?.id);
                
                // Load packages for plan tab (new student mode)
                if (tab === 'plano' && !this.current?.id && !btn.dataset.loaded) {
                    console.log('� [Tab Click] Loading packages for NEW student...');
                    btn.dataset.loaded = '1';
                    await this.loadPackagesForEnrollment();
                }
                
                // Load courses for courses tab (new student mode)
                if (tab === 'cursos' && !this.current?.id && !btn.dataset.loaded) {
                    console.log('📚 [Tab Click] Loading courses for NEW student...');
                    btn.dataset.loaded = '1';
                    await this.loadCoursesForEnrollment();
                }
                
                // Load tab content for existing student (edit mode)
                if (!btn.dataset.loaded && this.current?.id) {
                    console.log('📡 [Tab Click] Loading tab content for EXISTING student...');
                    btn.dataset.loaded = '1';
                    await this.loadTabContent(tab, this.current.id);
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
        
        // Biometric photo capture events
        const btnCapturePhoto = this.container.querySelector('#btn-capture-photo');
        const btnRemovePhoto = this.container.querySelector('#btn-remove-photo');
        
        if (btnCapturePhoto) {
            btnCapturePhoto.addEventListener('click', () => this.openPhotoCaptureModal());
        }
        
        if (btnRemovePhoto) {
            btnRemovePhoto.addEventListener('click', () => this.removeStudentPhoto());
        }
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
            
            let studentId;
            let studentResponse;
            
            if (this.current?.id) {
                console.log('🔄 Updating student:', this.current.id);
                studentResponse = await this.api.saveWithFeedback(`/api/students/${this.current.id}`, payload, { 
                    method: 'PUT',
                    successMessage: 'Estudante atualizado com sucesso!'
                });
                studentId = this.current.id;
            } else {
                console.log('➕ Creating new student');
                studentResponse = await this.api.saveWithFeedback('/api/students', payload, { 
                    method: 'POST',
                    successMessage: 'Estudante cadastrado com sucesso!'
                });
                // Extract ID from response
                studentId = studentResponse?.data?.id || studentResponse?.id;
                console.log('✅ New student created with ID:', studentId);
            }
            
            // Upload biometric photo if captured
            if (this.capturedPhoto && studentId) {
                console.log('📸 Uploading biometric photo...');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando foto...';
                }
                await this.uploadBiometricPhoto(studentId);
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

    async uploadBiometricPhoto(studentId) {
        if (!this.capturedPhoto) return;
        
        // Safety check for studentId
        if (!studentId) {
            console.error('❌ Cannot upload biometric photo: studentId is missing');
            this.showMessage('Erro interno: ID do estudante não encontrado. Tente salvar novamente.', 'error');
            return;
        }

        try {
            // The backend expects JSON with: embedding (array), photoUrl (string), qualityScore (number)
            // We need to send the face descriptor and the photo as dataURL
            
            if (!this.capturedPhoto.descriptor) {
                console.warn('⚠️ No face descriptor available, skipping biometric upload');
                this.showMessage('⚠️ Foto salva apenas como avatar (sem dados biométricos)', 'warning');
                return;
            }
            
            const payload = {
                embedding: Array.from(this.capturedPhoto.descriptor),
                photoUrl: this.capturedPhoto.dataUrl, // Base64 data URL
                qualityScore: 85 // Default quality score
            };
            
            console.log('📸 Uploading biometric data...', {
                studentId,
                embeddingLength: payload.embedding.length,
                photoUrlLength: payload.photoUrl?.length
            });
            
            // Ensure URL matches backend route: POST /api/biometric/students/:studentId/face-embedding
            const response = await fetch(`/api/biometric/students/${studentId}/face-embedding`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'x-organization-id': window.academyApp?.organizationId || localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Biometric photo uploaded:', result);
            
            // Clear captured photo after successful upload
            this.capturedPhoto = null;
            this.currentFaceDescriptor = null;
            
        } catch (error) {
            console.error('❌ Error uploading biometric photo:', error);
            this.showMessage('⚠️ Aluno salvo, mas houve erro ao enviar a foto. Tente adicionar novamente.', 'warning');
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

    // =========================================================================
    // BIOMETRIC PHOTO CAPTURE - Reconhecimento Facial
    // =========================================================================

    openPhotoCaptureModal() {
        // Create full-screen modal for photo capture
        const modal = document.createElement('div');
        modal.id = 'photo-capture-modal';
        modal.className = 'photo-capture-modal';
        modal.innerHTML = `
            <div class="modal-content-photo">
                <div class="modal-header-photo">
                    <h2><i class="fas fa-camera"></i> Captura Facial</h2>
                    <button class="btn-close-modal" id="close-photo-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body-photo">
                    <div class="camera-preview-container">
                        <video id="photo-video" autoplay playsinline></video>
                        <canvas id="photo-canvas" style="display: none;"></canvas>
                        <button id="capture-photo-main" class="capture-btn-overlay" disabled>
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Iniciando...</span>
                        </button>
                    </div>
                </div>
                <div class="modal-footer-photo mobile-hidden">
                    <button class="btn-form btn-secondary-form" id="cancel-capture">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start camera and face detection
        this.startPhotoCamera();
        
        // Event listeners
        const closeBtn = modal.querySelector('#close-photo-modal');
        const cancelBtn = modal.querySelector('#cancel-capture');
        const captureBtn = modal.querySelector('#capture-photo-main');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePhotoCaptureModal());
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.closePhotoCaptureModal();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closePhotoCaptureModal());
        }
        
        // Botão principal de captura (overlay na câmera)
        if (captureBtn) {
            const handleCapture = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!captureBtn.disabled) {
                    console.log('📸 Capturing photo!');
                    this.captureStudentPhoto();
                }
            };
            
            captureBtn.addEventListener('click', handleCapture);
            captureBtn.addEventListener('touchend', handleCapture);
        }
    }

    async startPhotoCamera() {
        const video = document.getElementById('photo-video');
        const captureBtn = document.getElementById('capture-photo-main');
        
        try {
            // Update button state
            captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Iniciando câmera...</span>';
            captureBtn.disabled = true;
            
            // Load models if needed
            if (window.faceapi && !this.modelsLoaded) {
                const modelsPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
                console.log('📦 Loading face-api models...');
                try {
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
                        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
                        faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
                    ]);
                    this.modelsLoaded = true;
                    console.log('✅ Face-api models loaded');
                } catch (modelError) {
                    console.error('❌ Error loading models:', modelError);
                    // Continue without models (fallback to simple photo capture)
                }
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            video.srcObject = stream;
            this.currentStream = stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            // Start face detection (if face-api.js is available)
            if (window.faceapi) {
                this.startFaceDetection(video, captureBtn);
            } else {
                // Fallback: enable capture button after 1.5s
                setTimeout(() => {
                    captureBtn.disabled = false;
                    captureBtn.innerHTML = '<i class="fas fa-camera"></i><span>CAPTURAR FOTO</span>';
                    captureBtn.classList.add('ready');
                }, 1500);
            }
            
        } catch (error) {
            console.error('❌ Error starting camera:', error);
            captureBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Erro na câmera</span>';
            captureBtn.classList.add('error');
        }
    }

    async startFaceDetection(video, captureBtn) {
        // Ensure face-api models are loaded
        if (!window.faceapi || !this.modelsLoaded) {
            console.warn('⚠️ Face-api not ready, skipping detection');
            captureBtn.disabled = false;
            captureBtn.innerHTML = '<i class="fas fa-camera"></i><span>CAPTURAR (Sem Biometria)</span>';
            return;
        }

        try {
            const detectionInterval = setInterval(async () => {
                if (!video.paused && !video.ended) {
                    try {
                        const detection = await window.faceapi
                            .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
                            .withFaceLandmarks()
                            .withFaceDescriptor();
                        
                        if (detection) {
                            captureBtn.innerHTML = '<i class="fas fa-camera"></i><span>CAPTURAR FOTO</span>';
                            captureBtn.classList.remove('searching');
                            captureBtn.classList.add('ready');
                            captureBtn.disabled = false;
                            this.currentFaceDescriptor = detection.descriptor;
                        } else {
                            captureBtn.innerHTML = '<i class="fas fa-search"></i><span>Procurando rosto...</span>';
                            captureBtn.classList.remove('ready');
                            captureBtn.classList.add('searching');
                            captureBtn.disabled = true;
                            this.currentFaceDescriptor = null;
                        }
                    } catch (err) {
                        // Silent error during detection loop
                    }
                }
            }, 500);
            
            this.detectionInterval = detectionInterval;
            
        } catch (error) {
            console.error('❌ Face detection error:', error);
            // Fallback: enable capture anyway
            captureBtn.disabled = false;
            captureBtn.innerHTML = '<i class="fas fa-camera"></i><span>CAPTURAR FOTO</span>';
            captureBtn.classList.add('ready');
        }
    }

    async captureStudentPhoto() {
        const video = document.getElementById('photo-video');
        const canvas = document.getElementById('photo-canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            // Store photo data
            this.capturedPhoto = {
                blob: blob,
                dataUrl: canvas.toDataURL('image/jpeg', 0.9),
                descriptor: this.currentFaceDescriptor || null,
                timestamp: new Date().toISOString()
            };
            
            console.log('📸 Photo captured!', {
                size: blob.size,
                hasDescriptor: !!this.currentFaceDescriptor
            });
            
            // Close modal and update preview
            this.closePhotoCaptureModal();
            this.updatePhotoPreview();
            
            // Show success message
            this.showMessage('✅ Foto capturada com sucesso! Salve o aluno para registrar.', 'success');
            
        }, 'image/jpeg', 0.9);
    }

    closePhotoCaptureModal() {
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        // Stop face detection
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        
        // Remove modal
        const modal = document.getElementById('photo-capture-modal');
        if (modal) {
            modal.remove();
        }
    }

    updatePhotoPreview() {
        if (!this.capturedPhoto) return;
        
        const preview = this.container.querySelector('#photo-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <img src="${this.capturedPhoto.dataUrl}" alt="Foto capturada" class="captured-photo">
            <div class="photo-status">
                <span class="status-badge warning">⚠️ Não salvo</span>
            </div>
        `;
        preview.classList.add('has-photo');
        
        // Update button text
        const captureBtn = this.container.querySelector('#btn-capture-photo');
        if (captureBtn) {
            captureBtn.innerHTML = '<i class="fas fa-camera"></i> Atualizar Foto';
        }
        
        // Show remove button if not exists
        const removeBtn = this.container.querySelector('#btn-remove-photo');
        if (!removeBtn) {
            const actionsDiv = this.container.querySelector('.capture-actions');
            if (actionsDiv) {
                const newRemoveBtn = document.createElement('button');
                newRemoveBtn.type = 'button';
                newRemoveBtn.id = 'btn-remove-photo';
                newRemoveBtn.className = 'btn-form btn-danger-form';
                newRemoveBtn.innerHTML = '<i class="fas fa-trash"></i> Remover Foto';
                newRemoveBtn.addEventListener('click', () => this.removeStudentPhoto());
                actionsDiv.appendChild(newRemoveBtn);
            }
        }
    }

    removeStudentPhoto() {
        if (!confirm('Tem certeza que deseja remover a foto?')) return;
        
        this.capturedPhoto = null;
        this.currentFaceDescriptor = null;
        
        const preview = this.container.querySelector('#photo-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="no-photo-placeholder">
                    <i class="fas fa-user-circle"></i>
                    <p>Nenhuma foto cadastrada</p>
                </div>
            `;
            preview.classList.remove('has-photo');
        }
        
        // Update button text
        const captureBtn = this.container.querySelector('#btn-capture-photo');
        if (captureBtn) {
            captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capturar Foto';
        }
        
        // Remove delete button
        const removeBtn = this.container.querySelector('#btn-remove-photo');
        if (removeBtn) {
            removeBtn.remove();
        }
        
        this.showMessage('Foto removida. As alterações serão aplicadas ao salvar.', 'info');
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
        console.log('🔵 [LoadTabContent] Called with tab:', tab, 'studentId:', studentId);
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
            default:
                console.warn('⚠️ [LoadTabContent] Unknown tab:', tab);
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

    // 🆕 Renderizar aba "Responsável Financeiro"
    async renderResponsibleTab(studentId) {
        console.log('🔵 [ResponsibleTab] Starting render for student:', studentId);
        
        const container = this.container.querySelector('#student-responsible-container');
        if (!container) {
            console.error('❌ [ResponsibleTab] Container not found!');
            return;
        }

        // Prevenir múltiplas chamadas simultâneas
        if (this._renderingResponsible) {
            console.log('⏸️ [ResponsibleTab] Already rendering, skipping...');
            return;
        }
        this._renderingResponsible = true;
        console.log('🔓 [ResponsibleTab] Lock acquired');

        try {
            // Mostrar loading
            console.log('⏳ [ResponsibleTab] Showing loading spinner...');
            container.innerHTML = '<div class="loading-spinner">Carregando...</div>';

            // Carregar dados do aluno (com financialResponsible e financialResponsibleStudent incluídos)
            console.log('📡 [ResponsibleTab] Fetching student data...');
            console.log('📡 [ResponsibleTab] Fetching student data...');
            const studentRes = await this.api.request(`/api/students/${studentId}`);
            console.log('✅ [ResponsibleTab] Student data received:', studentRes);
            
            if (!studentRes || !studentRes.success) {
                throw new Error('Failed to load student data');
            }
            const student = studentRes.data || {};
            console.log('📦 [ResponsibleTab] Student:', student.user?.firstName, student.user?.lastName);
            
            // Carregar lista de TODOS os alunos (para selecionar outro aluno como responsável)
            console.log('📡 [ResponsibleTab] Fetching all students...');
            const allStudentsRes = await this.api.request('/api/students');
            console.log('✅ [ResponsibleTab] All students received:', allStudentsRes?.data?.length);
            
            // Filtrar e ordenar alunos alfabeticamente
            const allStudents = (allStudentsRes.data || [])
                .filter(s => s.id !== studentId) // Excluir o próprio aluno
                .sort((a, b) => {
                    const nameA = [a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ').toLowerCase();
                    const nameB = [b.user?.firstName, b.user?.lastName].filter(Boolean).join(' ').toLowerCase();
                    return nameA.localeCompare(nameB, 'pt-BR');
                });
            
            // Carregar lista de responsáveis financeiros (cadastros separados)
            let responsibles = [];
            try {
                const responsiblesRes = await this.api.request('/api/students/financial-responsibles');
                responsibles = responsiblesRes.data || [];
            } catch (err) {
                console.warn('Financial responsibles endpoint not available:', err);
            }

            // Carregar dependentes financeiros com tratamento de erro robusto
            let dependentsData = { dependents: [], consolidatedCharges: [], totalDependents: 0, totalAmount: 0 };
            try {
                const dependentsRes = await this.api.request(`/api/students/${studentId}/financial-dependents`);
                if (dependentsRes && dependentsRes.success && dependentsRes.data) {
                    dependentsData = dependentsRes.data;
                }
            } catch (depError) {
                console.warn('Could not load dependents (non-critical):', depError);
                // Continuar mesmo se falhar - não é crítico
            }

            // Renderizar conteúdo
            container.innerHTML = `
                <div class="data-card-premium">
                    <!-- Seção: Quem é o responsável deste aluno? -->
                    <div class="card-section">
                        <h4 class="card-title">
                            <i class="fas fa-user-shield"></i>
                            Responsável Financeiro deste Aluno
                        </h4>
                        
                        ${student.financialResponsibleStudent ? `
                            <div class="responsible-info" style="background: #e8f5e9; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                                <div class="info-badge">
                                    <i class="fas fa-user-graduate" style="color: #28a745;"></i>
                                    <strong>👤 Outro Aluno: ${[student.financialResponsibleStudent.user?.firstName, student.financialResponsibleStudent.user?.lastName].filter(Boolean).join(' ') || 'Sem nome'}</strong>
                                </div>
                                <div class="info-detail">
                                    <span class="label">Email:</span>
                                    <span class="value">${student.financialResponsibleStudent.user?.email || 'Não informado'}</span>
                                </div>
                            </div>
                        ` : student.financialResponsible ? `
                            <div class="responsible-info" style="background: #e3f2fd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                                <div class="info-badge">
                                    <i class="fas fa-user-tie" style="color: #2196f3;"></i>
                                    <strong>📋 Cadastro Separado: ${student.financialResponsible.name}</strong>
                                </div>
                                <div class="info-detail">
                                    <span class="label">Email:</span>
                                    <span class="value">${student.financialResponsible.email || 'Não informado'}</span>
                                </div>
                                <div class="info-detail">
                                    <span class="label">Telefone:</span>
                                    <span class="value">${student.financialResponsible.phone || 'Não informado'}</span>
                                </div>
                            </div>
                        ` : `
                            <div class="empty-info">
                                <i class="fas fa-inbox" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;"></i>
                                <p style="color: #999;">Nenhum responsável financeiro vinculado</p>
                                <small style="color: #bbb;">Todas as cobranças serão direcionadas ao próprio aluno</small>
                            </div>
                        `}

                        <!-- Form para selecionar responsável -->
                        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
                            <h5 style="margin-bottom: 1rem; color: #555;">
                                <i class="fas fa-edit"></i> Alterar Responsável Financeiro
                            </h5>

                            <!-- Opção 1: Selecionar outro aluno -->
                            <div class="form-group">
                                <label for="responsibleStudentSelect" style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-user-graduate" style="color: #28a745;"></i>
                                    <strong>Opção 1:</strong> Outro Aluno da Academia
                                </label>
                                <select id="responsibleStudentSelect" class="form-control">
                                    <option value="">-- Selecionar Aluno --</option>
                                    ${allStudents.map(s => {
                                        const fullName = [s.user?.firstName, s.user?.lastName].filter(Boolean).join(' ') || 'Sem nome';
                                        return `
                                        <option value="${s.id}" ${student.financialResponsibleStudentId === s.id ? 'selected' : ''}>
                                            ${fullName} - ${s.user?.email || 'Sem email'}
                                        </option>
                                    `;
                                    }).join('')}
                                </select>
                                <small class="field-help">💡 Ideal para famílias: pai/mãe paga por filhos, etc.</small>
                            </div>

                            <!-- Opção 2: Responsável cadastrado separadamente -->
                            <div class="form-group" style="margin-top: 1.5rem;">
                                <label for="responsibleSelect" style="display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-user-tie" style="color: #2196f3;"></i>
                                    <strong>Opção 2:</strong> Responsável Cadastrado (não é aluno)
                                </label>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <select id="responsibleSelect" class="form-control" style="flex: 1;">
                                        <option value="">-- Selecionar Responsável --</option>
                                        ${responsibles.map(r => `
                                            <option value="${r.id}" ${student.financialResponsibleId === r.id ? 'selected' : ''}>
                                                ${r.name} - ${r.email || ''}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <button id="showCreateResponsible" class="btn-form btn-sm btn-secondary-form" title="Criar novo responsável">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                                <small class="field-help">💡 Ideal para responsáveis que não são alunos</small>
                            </div>

                            <!-- Form de criar novo responsável (inicialmente oculto) -->
                            <div id="createResponsibleForm" style="display: none; margin-top: 1rem; padding: 1rem; background: #f9f9f9; border-radius: 6px;">
                                <h5 style="margin-bottom: 1rem; color: var(--primary-color);">📝 Criar Novo Responsável</h5>
                                <div class="form-group">
                                    <label>Nome *</label>
                                    <input id="newResponsibleName" type="text" class="form-control" placeholder="Nome completo" />
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input id="newResponsibleEmail" type="email" class="form-control" placeholder="email@exemplo.com" />
                                </div>
                                <div class="form-group">
                                    <label>Telefone</label>
                                    <input id="newResponsiblePhone" type="tel" class="form-control" placeholder="(11) 99999-9999" />
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button id="saveNewResponsible" class="btn-form btn-primary-form">
                                        <i class="fas fa-check"></i> Salvar
                                    </button>
                                    <button id="cancelNewResponsible" class="btn-form btn-link">Cancelar</button>
                                </div>
                            </div>

                            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                                <button id="saveResponsible" class="btn-form btn-primary-form">
                                    <i class="fas fa-save"></i> Salvar Responsável
                                </button>
                                <button id="removeResponsible" class="btn-form btn-warning-form">
                                    <i class="fas fa-times"></i> Remover Vínculo
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Seção: Dependentes financeiros (se este aluno for responsável por outros) -->
                    ${dependentsData.totalDependents > 0 ? `
                        <div class="card-section" style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #667eea;">
                            <h4 class="card-title">
                                <i class="fas fa-users"></i>
                                Este aluno é Responsável Financeiro por ${dependentsData.totalDependents} ${dependentsData.totalDependents === 1 ? 'pessoa' : 'pessoas'}
                            </h4>

                            <div style="background: #fff3cd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                                <strong>💰 Total Consolidado: R$ ${dependentsData.totalAmount.toFixed(2)}</strong>
                            </div>

                            <div class="dependents-list">
                                ${(dependentsData.dependents || []).map(dep => {
                                    const userName = [dep?.user?.firstName, dep?.user?.lastName].filter(Boolean).join(' ') || 'Nome não disponível';
                                    const subsLength = (dep?.subscriptions || []).length;
                                    const totalPrice = (dep?.subscriptions || []).reduce((sum, sub) => {
                                        return sum + (sub?.plan?.price || 0);
                                    }, 0);
                                    
                                    return `
                                        <div class="dependent-card" style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin-bottom: 0.5rem;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <div>
                                                    <strong>${userName}</strong>
                                                    <div style="color: #666; font-size: 0.85rem;">
                                                        ${subsLength} plano(s) ativo(s)
                                                    </div>
                                                </div>
                                                <div style="text-align: right;">
                                                    <strong style="color: #28a745;">
                                                        R$ ${totalPrice.toFixed(2)}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <details style="margin-top: 1rem;">
                                <summary style="cursor: pointer; color: #667eea; font-weight: 500;">
                                    <i class="fas fa-file-invoice-dollar"></i> Ver Cobranças Detalhadas
                                </summary>
                                <div style="margin-top: 1rem;">
                                    ${(dependentsData.consolidatedCharges || []).map(charge => {
                                        const studentName = charge?.studentName || 'Aluno';
                                        const planName = charge?.planName || 'Plano';
                                        const amount = charge?.amount || 0;
                                        const status = charge?.status || 'Desconhecido';
                                        const endDateStr = charge?.endDate ? `(vence em ${new Date(charge.endDate).toLocaleDateString()})` : '';
                                        
                                        return `
                                            <div style="padding: 0.75rem; border-left: 3px solid #667eea; background: #f0f4ff; margin-bottom: 0.5rem;">
                                                <strong>${studentName}</strong> - ${planName}<br>
                                                <span style="color: #666;">
                                                    R$ ${amount.toFixed(2)} - ${status}
                                                    ${endDateStr}
                                                </span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </details>
                        </div>
                    ` : ''}
                </div>
            `;

            // Event listeners
            const responsibleStudentSelect = container.querySelector('#responsibleStudentSelect');
            const responsibleSelect = container.querySelector('#responsibleSelect');
            const showCreateBtn = container.querySelector('#showCreateResponsible');
            const createForm = container.querySelector('#createResponsibleForm');
            const cancelCreateBtn = container.querySelector('#cancelNewResponsible');
            const saveNewResponsibleBtn = container.querySelector('#saveNewResponsible');
            const saveResponsibleBtn = container.querySelector('#saveResponsible');
            const removeResponsibleBtn = container.querySelector('#removeResponsible');

            // Sincronizar selects: quando um é selecionado, limpar o outro
            responsibleStudentSelect.onchange = () => {
                if (responsibleStudentSelect.value) {
                    responsibleSelect.value = '';
                }
            };

            responsibleSelect.onchange = () => {
                if (responsibleSelect.value) {
                    responsibleStudentSelect.value = '';
                }
            };

            // Mostrar/ocultar form de criar
            showCreateBtn.onclick = () => {
                createForm.style.display = 'block';
                showCreateBtn.style.display = 'none';
            };

            cancelCreateBtn.onclick = () => {
                createForm.style.display = 'none';
                showCreateBtn.style.display = '';
                container.querySelector('#newResponsibleName').value = '';
                container.querySelector('#newResponsibleEmail').value = '';
                container.querySelector('#newResponsiblePhone').value = '';
            };

            // Salvar novo responsável
            saveNewResponsibleBtn.onclick = async () => {
                const name = container.querySelector('#newResponsibleName').value.trim();
                const email = container.querySelector('#newResponsibleEmail').value.trim();
                const phone = container.querySelector('#newResponsiblePhone').value.trim();

                if (!name) {
                    window.app?.showToast?.('❌ Nome é obrigatório', 'error');
                    return;
                }

                const res = await this.api.request('/api/students/financial-responsibles', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, phone }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (res.success) {
                    window.app?.showToast?.('✅ Responsável criado! Recarregue a página para ver mudanças.', 'success');
                    // NÃO chamar renderResponsibleTab - causa loop infinito
                } else {
                    window.app?.showToast?.(`❌ ${res.message || 'Erro ao criar'}`, 'error');
                }
            };

            // Salvar seleção de responsável
            saveResponsibleBtn.onclick = async () => {
                const selectedStudentId = responsibleStudentSelect.value;
                const selectedResponsibleId = responsibleSelect.value;

                // Determinar qual tipo de responsável foi selecionado
                if (selectedStudentId) {
                    // Vincular outro aluno como responsável
                    const res = await this.api.request(`/api/students/${studentId}/financial-responsible-student`, {
                        method: 'POST',
                        body: JSON.stringify({ responsibleStudentId: selectedStudentId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.success) {
                        window.app?.showToast?.('✅ Aluno responsável vinculado! Recarregue a página para ver mudanças.', 'success');
                        // NÃO chamar renderResponsibleTab - causa loop infinito
                    } else {
                        window.app?.showToast?.(`❌ ${res.message}`, 'error');
                    }
                } else if (selectedResponsibleId) {
                    // Vincular responsável cadastrado separadamente
                    const res = await this.api.request(`/api/students/${studentId}/financial-responsible`, {
                        method: 'PATCH',
                        body: JSON.stringify({ financialResponsibleId: selectedResponsibleId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.success) {
                        window.app?.showToast?.('✅ Responsável vinculado! Recarregue a página para ver mudanças.', 'success');
                        // NÃO chamar renderResponsibleTab - causa loop infinito
                    } else {
                        window.app?.showToast?.(`❌ ${res.message}`, 'error');
                    }
                } else {
                    window.app?.showToast?.('⚠️ Selecione um responsável primeiro', 'warning');
                }
            };

            // Remover vínculo
            removeResponsibleBtn.onclick = async () => {
                const confirmed = await window.app?.confirm?.('Desvinculará o responsável financeiro. Cobranças irão para o aluno. Continuar?');
                if (!confirmed) return;

                // Remover ambos os tipos de responsável
                const promises = [
                    this.api.request(`/api/students/${studentId}/financial-responsible-student`, {
                        method: 'POST',
                        body: JSON.stringify({ responsibleStudentId: null }),
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    this.api.request(`/api/students/${studentId}/financial-responsible`, {
                        method: 'PATCH',
                        body: JSON.stringify({ financialResponsibleId: null }),
                        headers: { 'Content-Type': 'application/json' }
                    })
                ];

                try {
                    await Promise.all(promises);
                    window.app?.showToast?.('✅ Vínculo removido! Recarregue a página para ver mudanças.', 'success');
                    // NÃO chamar renderResponsibleTab - causa loop infinito
                } catch (error) {
                    window.app?.showToast?.('❌ Erro ao remover vínculo', 'error');
                }
            };
        } catch (error) {
            console.error('❌ [ResponsibleTab] Error loading responsible tab:', error);
            container.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                    <p>Erro ao carregar aba de responsável financeiro</p>
                    <p style="font-size: 0.9rem; color: #666;">${error.message}</p>
                    <button onclick="location.reload()" class="btn-form btn-secondary-form" style="margin-top: 1rem;">
                        🔄 Recarregar Página
                    </button>
                </div>
            `;
        } finally {
            console.log('🔓 [ResponsibleTab] Lock released');
            this._renderingResponsible = false;
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

    async loadCoursesTab(studentId) {
        const enrolledContainer = this.container.querySelector('#enrolled-courses-tab');
        const availableContainer = this.container.querySelector('#available-courses-tab');
        
        if (!enrolledContainer || !availableContainer) {
            console.error('❌ Courses tab containers not found');
            return;
        }

        try {
            // Load student's course enrollments and available courses
            const coursesRes = await this.api.request(`/api/students/${studentId}/courses`);
            const enrollments = coursesRes.data?.enrolledCourses || [];
            const availableCourses = coursesRes.data?.availableCourses || [];
            
            console.log('📚 Course enrollments:', enrollments);
            console.log('📚 Available courses:', availableCourses);

            // Render enrolled courses
            if (enrollments.length === 0) {
                enrolledContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <p>Nenhum curso matriculado</p>
                    </div>
                `;
            } else {
                enrolledContainer.innerHTML = enrollments.map(enrollment => {
                    const course = enrollment.course || {};
                    return `
                        <div class="course-item data-card-premium">
                            <div class="course-header">
                                <h5>${course.name || 'Sem nome'}</h5>
                                <span class="badge badge-success">Matriculado</span>
                            </div>
                            ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
                            <div class="course-meta">
                                <span class="badge badge-info">${enrollment.status || 'ACTIVE'}</span>
                                ${enrollment.enrolledAt ? `<small>Matrícula: ${new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}</small>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Render available courses (not enrolled)
            if (availableCourses.length === 0) {
                availableContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✅</div>
                        <p>Todos os cursos disponíveis já estão matriculados</p>
                    </div>
                `;
            } else {
                availableContainer.innerHTML = availableCourses.map(course => `
                    <div class="course-item data-card-premium">
                        <div class="course-header">
                            <h5>${course.name || 'Sem nome'}</h5>
                            <button class="btn btn-sm btn-primary" onclick="window.enrollCourse('${course.id}')">
                                Matricular
                            </button>
                        </div>
                        ${course.description ? `<p class="course-description">${course.description}</p>` : ''}
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading courses tab:', error);
            enrolledContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <p>Erro ao carregar cursos</p>
                </div>
            `;
        }
    }

    async renderFinancialTab(studentId) {
        const panel = this.container.querySelector('#tab-financial');
        
        try {
            // Load student data with financial relationships
            const studentRes = await this.api.request(`/api/students/${studentId}`);
            const studentFull = studentRes.data || {};
            
            // Load all financial data in parallel
            const [
                subscriptionsRes,
                paymentsRes,
                packagesRes,
                allStudentsRes,
                responsiblesRes,
                dependentsRes
            ] = await Promise.all([
                this.api.request(`/api/students/${studentId}/subscriptions`),
                this.api.request(`/api/students/${studentId}/payments`),
                this.api.request('/api/billing-plans'),
                this.api.request('/api/students'),
                this.api.request('/api/students/financial-responsibles').catch(() => ({ data: [] })),
                this.api.request(`/api/students/${studentId}/financial-dependents`).catch(() => ({ data: { dependents: [], totalDependents: 0, totalAmount: 0 } }))
            ]);

            const subscriptions = subscriptionsRes.data || [];
            const payments = paymentsRes.data || [];
            const packages = packagesRes.data || [];
            
            // Filtrar e ordenar alunos alfabeticamente
            const allStudents = (allStudentsRes.data || [])
                .filter(s => s.id !== studentId)
                .sort((a, b) => {
                    const nameA = [a.user?.firstName, a.user?.lastName].filter(Boolean).join(' ').toLowerCase();
                    const nameB = [b.user?.firstName, b.user?.lastName].filter(Boolean).join(' ').toLowerCase();
                    return nameA.localeCompare(nameB, 'pt-BR');
                });
                
            const responsibles = responsiblesRes.data || [];
            const dependentsData = dependentsRes.data || { dependents: [], totalDependents: 0, totalAmount: 0 };

            const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const pendingPayments = payments.filter(p => p.status === 'PENDING').length;

            panel.innerHTML = `
                <div class="financial-container">
                    <!-- 📊 Overview Section -->
                    <div class="financial-overview data-card-premium">
                        <h3 class="section-title">
                            <i class="fas fa-chart-line"></i>
                            Visão Geral Financeira
                        </h3>
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
                                    <div class="stat-label">Pendentes</div>
                                </div>
                            </div>
                            ${dependentsData.totalDependents > 0 ? `
                            <div class="stat-card-enhanced stat-gradient-info">
                                <div class="stat-icon">👥</div>
                                <div class="stat-content">
                                    <div class="stat-value">${dependentsData.totalDependents}</div>
                                    <div class="stat-label">Dependentes</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- 👤 Responsável Financeiro Section -->
                    <details class="financial-section-collapsible data-card-premium" open>
                        <summary class="collapsible-header">
                            <i class="fas fa-user-shield"></i>
                            Responsável Financeiro
                            ${studentFull.financialResponsible || studentFull.financialResponsibleStudent ? '<span class="badge-active">✅ Configurado</span>' : '<span class="badge-inactive">⚠️ Não configurado</span>'}
                        </summary>
                        <div class="collapsible-content">
                            ${studentFull.financialResponsibleStudent ? `
                                <div class="responsible-info info-badge-success">
                                    <i class="fas fa-user-graduate"></i>
                                    <div class="responsible-details">
                                        <strong>👤 Outro Aluno: ${[studentFull.financialResponsibleStudent.user?.firstName, studentFull.financialResponsibleStudent.user?.lastName].filter(Boolean).join(' ') || 'Sem nome'}</strong>
                                        <div class="text-muted">${studentFull.financialResponsibleStudent.user?.email || 'Não informado'}</div>
                                    </div>
                                </div>
                            ` : studentFull.financialResponsible ? `
                                <div class="responsible-info info-badge-info">
                                    <i class="fas fa-user-tie"></i>
                                    <div class="responsible-details">
                                        <strong>📋 Cadastro Separado: ${studentFull.financialResponsible.name}</strong>
                                        <div class="text-muted">${studentFull.financialResponsible.email || 'Não informado'} ${studentFull.financialResponsible.phone ? '• ' + studentFull.financialResponsible.phone : ''}</div>
                                    </div>
                                </div>
                            ` : `
                                <div class="empty-state-inline">
                                    <i class="fas fa-inbox"></i>
                                    <p>Nenhum responsável financeiro vinculado</p>
                                    <small>Cobranças serão direcionadas ao próprio aluno</small>
                                </div>
                            `}

                            <div class="form-section">
                                <h5 class="form-section-title"><i class="fas fa-edit"></i> Alterar Responsável</h5>
                                
                                <div class="form-group">
                                    <label for="responsibleStudentSelect">
                                        <i class="fas fa-user-graduate"></i> Opção 1: Outro Aluno
                                    </label>
                                    <select id="responsibleStudentSelect" class="form-control">
                                        <option value="">-- Selecionar Aluno --</option>
                                        ${allStudents.map(s => {
                                            const fullName = [s.user?.firstName, s.user?.lastName].filter(Boolean).join(' ') || 'Sem nome';
                                            return `
                                            <option value="${s.id}" ${studentFull.financialResponsibleStudentId === s.id ? 'selected' : ''}>
                                                ${fullName} - ${s.user?.email || 'Sem email'}
                                            </option>
                                        `;
                                        }).join('')}
                                    </select>
                                    <small class="field-help">💡 Ideal para famílias: pai/mãe paga por filhos</small>
                                </div>

                                <div class="form-group">
                                    <label for="responsibleSelect">
                                        <i class="fas fa-user-tie"></i> Opção 2: Responsável Cadastrado
                                    </label>
                                    <div class="input-with-button">
                                        <select id="responsibleSelect" class="form-control">
                                            <option value="">-- Selecionar Responsável --</option>
                                            ${responsibles.map(r => `
                                                <option value="${r.id}" ${studentFull.financialResponsibleId === r.id ? 'selected' : ''}>
                                                    ${r.name} - ${r.email || ''}
                                                </option>
                                            `).join('')}
                                        </select>
                                        <button id="showCreateResponsible" class="btn-icon btn-primary" title="Criar novo responsável">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <small class="field-help">💡 Para responsáveis que não são alunos</small>
                                </div>

                                <div id="createResponsibleForm" class="form-inline" style="display: none;">
                                    <h5 class="form-section-title">📝 Criar Novo Responsável</h5>
                                    <div class="form-group">
                                        <label>Nome *</label>
                                        <input id="newResponsibleName" type="text" class="form-control" placeholder="Nome completo" />
                                    </div>
                                    <div class="form-group">
                                        <label>Email</label>
                                        <input id="newResponsibleEmail" type="email" class="form-control" placeholder="email@exemplo.com" />
                                    </div>
                                    <div class="form-group">
                                        <label>Telefone</label>
                                        <input id="newResponsiblePhone" type="tel" class="form-control" placeholder="(11) 99999-9999" />
                                    </div>
                                    <div class="button-group">
                                        <button id="saveNewResponsible" class="btn-form btn-primary-form">
                                            <i class="fas fa-check"></i> Salvar
                                        </button>
                                        <button id="cancelNewResponsible" class="btn-form btn-link">Cancelar</button>
                                    </div>
                                </div>

                                <div class="button-group">
                                    <button id="saveResponsible" class="btn-form btn-primary-form">
                                        <i class="fas fa-save"></i> Salvar Responsável
                                    </button>
                                    <button id="removeResponsible" class="btn-form btn-warning-form">
                                        <i class="fas fa-times"></i> Remover Vínculo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>

                    <!-- 📋 Assinaturas Ativas Section -->
                    <details class="financial-section-collapsible data-card-premium" ${activeSubscriptions.length > 0 ? 'open' : ''}>
                        <summary class="collapsible-header">
                            <i class="fas fa-file-invoice-dollar"></i>
                            Assinaturas Ativas
                            <span class="badge-count">${activeSubscriptions.length}</span>
                        </summary>
                        <div class="collapsible-content">
                            <div class="section-actions">
                                <button class="btn-form btn-primary-form" onclick="window.openPackageSelector('${studentId}')">
                                    <i class="fas fa-plus"></i> Adicionar Pacote
                                </button>
                            </div>

                            ${activeSubscriptions.length === 0 ? `
                                <div class="empty-state">
                                    <i class="fas fa-inbox"></i>
                                    <p>Nenhuma assinatura ativa</p>
                                </div>
                            ` : `
                                <div class="subscriptions-list">
                                    ${activeSubscriptions.map(sub => {
                                        const subscriptionPayload = encodeURIComponent(JSON.stringify({
                                            id: sub.id,
                                            studentId,
                                            planId: sub.planId || sub.plan?.id || '',
                                            planName: sub.plan?.name || 'Plano',
                                            originalPrice: parseFloat(sub.plan?.price ?? sub.price ?? 0) || 0,
                                            currentPrice: parseFloat(sub.currentPrice ?? sub.plan?.price ?? sub.price ?? 0) || 0,
                                            startDate: sub.startDate,
                                            nextDueDate: sub.nextDueDate || sub.endDate || '',
                                            status: sub.status || (sub.isActive ? 'ACTIVE' : 'PAUSED')
                                        }));
                                        return `
                                            <div class="subscription-card">
                                                <div class="subscription-header">
                                                    <h4>${sub.plan?.name || 'Plano'}</h4>
                                                    <span class="subscription-badge status-active">
                                                        <i class="fas fa-check-circle"></i> Ativo
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
                                                        <span class="detail-value price">R$ ${(parseFloat(sub.plan?.price) || 0).toFixed(2)}/mês</span>
                                                    </div>
                                                </div>
                                                <div class="subscription-actions">
                                                    <button class="btn-form btn-sm btn-info-form" data-subscription="${subscriptionPayload}" onclick="window.viewSubscriptionDetails(this.dataset.subscription)">
                                                        <i class="fas fa-eye"></i> Detalhes
                                                    </button>
                                                    <button class="btn-form btn-sm btn-warning-form" onclick="window.pauseSubscription('${sub.id}')">
                                                        <i class="fas fa-pause"></i> Pausar
                                                    </button>
                                                    <button class="btn-form btn-sm btn-danger-form" onclick="window.cancelSubscription('${sub.id}')">
                                                        <i class="fas fa-times"></i> Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </details>

                    <!-- 👥 Dependentes Financeiros Section -->
                    ${dependentsData.totalDependents > 0 ? `
                    <details class="financial-section-collapsible data-card-premium" ${dependentsData.totalDependents > 0 ? 'open' : ''}>
                        <summary class="collapsible-header">
                            <i class="fas fa-users"></i>
                            Dependentes Financeiros
                            <span class="badge-count">${dependentsData.totalDependents}</span>
                            <span class="badge-price">R$ ${dependentsData.totalAmount.toFixed(2)}</span>
                        </summary>
                        <div class="collapsible-content">
                            <div class="info-callout info-callout-primary">
                                <i class="fas fa-info-circle"></i>
                                <div>
                                    <strong>Cobrança Consolidada</strong>
                                    <p>A fatura mensal será gerada com o valor total de <strong>R$ ${dependentsData.totalAmount.toFixed(2)}</strong> incluindo todos os dependentes abaixo.</p>
                                </div>
                            </div>

                            <div class="dependents-list">
                                ${(dependentsData.dependents || []).map(dep => {
                                    const userName = [dep?.user?.firstName, dep?.user?.lastName].filter(Boolean).join(' ') || 'Nome não disponível';
                                    const subsLength = (dep?.subscriptions || []).length;
                                    const totalPrice = (dep?.subscriptions || []).reduce((sum, sub) => {
                                        return sum + (sub?.plan?.price || 0);
                                    }, 0);
                                    
                                    return `
                                        <div class="dependent-card">
                                            <div class="dependent-header">
                                                <i class="fas fa-user"></i>
                                                <div class="dependent-info">
                                                    <strong>${userName}</strong>
                                                    <small>${subsLength} plano(s) ativo(s)</small>
                                                </div>
                                            </div>
                                            <div class="dependent-amount">
                                                R$ ${totalPrice.toFixed(2)}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </details>
                    ` : ''}

                    <!-- 📦 Pacotes Disponíveis Section -->
                    <details class="financial-section-collapsible data-card-premium">
                        <summary class="collapsible-header">
                            <i class="fas fa-box-open"></i>
                            Pacotes Disponíveis
                            <span class="badge-count">${packages.length}</span>
                        </summary>
                        <div class="collapsible-content">
                            <div class="packages-grid">
                                ${packages.map(pkg => `
                                    <div class="package-card">
                                        <div class="package-header">
                                            <h4>${pkg.name}</h4>
                                            <span class="package-price">R$ ${(parseFloat(pkg.price) || 0).toFixed(2)}</span>
                                        </div>
                                        <div class="package-description">
                                            ${pkg.description || 'Sem descrição'}
                                        </div>
                                        <ul class="package-features">
                                            ${(() => {
                                                let features = pkg.features;
                                                if (!features) {
                                                    features = ['Acesso às aulas', 'Suporte técnico'];
                                                } else if (typeof features === 'string') {
                                                    try {
                                                        features = JSON.parse(features);
                                                    } catch (e) {
                                                        features = ['Acesso às aulas', 'Suporte técnico'];
                                                    }
                                                }
                                                if (!Array.isArray(features)) {
                                                    features = ['Acesso às aulas', 'Suporte técnico'];
                                                }
                                                return features.map(feature => `
                                                    <li><i class="fas fa-check"></i> ${feature}</li>
                                                `).join('');
                                            })()}
                                        </ul>
                                        <button class="btn-form btn-primary-form btn-block"
                                            data-student-id="${studentId}"
                                            data-plan-id="${pkg.id}"
                                            data-plan-name="${encodeURIComponent(pkg.name || 'Plano')}"
                                            data-plan-price="${(parseFloat(pkg.price) || 0).toFixed(2)}"
                                            onclick="window.subscribeToPackageFromButton(this)">
                                            <i class="fas fa-shopping-cart"></i> Assinar
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </details>

                    <!-- 📜 Histórico de Pagamentos Section -->
                    <details class="financial-section-collapsible data-card-premium">
                        <summary class="collapsible-header">
                            <i class="fas fa-history"></i>
                            Histórico de Pagamentos
                            <span class="badge-count">${payments.length}</span>
                        </summary>
                        <div class="collapsible-content">
                            <div class="section-actions">
                                <button class="btn-form btn-secondary-form" onclick="window.exportPaymentHistory('${studentId}')">
                                    <i class="fas fa-download"></i> Exportar
                                </button>
                            </div>

                            ${payments.length === 0 ? `
                                <div class="empty-state">
                                    <i class="fas fa-receipt"></i>
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
                    </details>
                </div>
            `;

            // Setup event listeners for responsible management
            this.setupFinancialResponsibleEvents(studentId, allStudents, responsibles);

        } catch (error) {
            console.error('Error loading financial data:', error);
            panel.innerHTML = '<p class="error-message">Erro ao carregar dados financeiros. Tente novamente.</p>';
        }
    }

    // New method to handle financial responsible events
    setupFinancialResponsibleEvents(studentId, allStudents, responsibles) {
        const panel = this.container.querySelector('#tab-financial');
        if (!panel) return;

        const responsibleStudentSelect = panel.querySelector('#responsibleStudentSelect');
        const responsibleSelect = panel.querySelector('#responsibleSelect');
        const showCreateBtn = panel.querySelector('#showCreateResponsible');
        const createForm = panel.querySelector('#createResponsibleForm');
        const cancelCreateBtn = panel.querySelector('#cancelNewResponsible');
        const saveNewResponsibleBtn = panel.querySelector('#saveNewResponsible');
        const saveResponsibleBtn = panel.querySelector('#saveResponsible');
        const removeResponsibleBtn = panel.querySelector('#removeResponsible');

        if (!responsibleStudentSelect || !responsibleSelect) return;

        // Sync selects: when one is selected, clear the other
        responsibleStudentSelect.onchange = () => {
            if (responsibleStudentSelect.value) {
                responsibleSelect.value = '';
            }
        };

        responsibleSelect.onchange = () => {
            if (responsibleSelect.value) {
                responsibleStudentSelect.value = '';
            }
        };

        // Show/hide create form
        if (showCreateBtn) {
            showCreateBtn.onclick = () => {
                createForm.style.display = 'block';
                showCreateBtn.style.display = 'none';
            };
        }

        if (cancelCreateBtn) {
            cancelCreateBtn.onclick = () => {
                createForm.style.display = 'none';
                showCreateBtn.style.display = '';
                panel.querySelector('#newResponsibleName').value = '';
                panel.querySelector('#newResponsibleEmail').value = '';
                panel.querySelector('#newResponsiblePhone').value = '';
            };
        }

        // Save new responsible
        if (saveNewResponsibleBtn) {
            saveNewResponsibleBtn.onclick = async () => {
                const name = panel.querySelector('#newResponsibleName').value.trim();
                const email = panel.querySelector('#newResponsibleEmail').value.trim();
                const phone = panel.querySelector('#newResponsiblePhone').value.trim();

                if (!name) {
                    window.app?.showToast?.('❌ Nome é obrigatório', 'error');
                    return;
                }

                const res = await this.api.request('/api/students/financial-responsibles', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, phone }),
                    headers: { 'Content-Type': 'application/json' }
                });

                if (res.success) {
                    window.app?.showToast?.('✅ Responsável criado com sucesso!', 'success');
                    await this.renderFinancialTab(studentId);
                } else {
                    window.app?.showToast?.(`❌ ${res.message || 'Erro ao criar'}`, 'error');
                }
            };
        }

        // Save responsible selection
        if (saveResponsibleBtn) {
            saveResponsibleBtn.onclick = async () => {
                const selectedStudentId = responsibleStudentSelect.value;
                const selectedResponsibleId = responsibleSelect.value;

                if (selectedStudentId) {
                    const res = await this.api.request(`/api/students/${studentId}/financial-responsible-student`, {
                        method: 'POST',
                        body: JSON.stringify({ responsibleStudentId: selectedStudentId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.success) {
                        window.app?.showToast?.('✅ Aluno responsável vinculado!', 'success');
                        await this.renderFinancialTab(studentId);
                    } else {
                        window.app?.showToast?.(`❌ ${res.message}`, 'error');
                    }
                } else if (selectedResponsibleId) {
                    const res = await this.api.request(`/api/students/${studentId}/financial-responsible`, {
                        method: 'PATCH',
                        body: JSON.stringify({ financialResponsibleId: selectedResponsibleId }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (res.success) {
                        window.app?.showToast?.('✅ Responsável vinculado!', 'success');
                        await this.renderFinancialTab(studentId);
                    } else {
                        window.app?.showToast?.(`❌ ${res.message}`, 'error');
                    }
                } else {
                    window.app?.showToast?.('⚠️ Selecione um responsável primeiro', 'warning');
                }
            };
        }

        // Remove responsible link
        if (removeResponsibleBtn) {
            removeResponsibleBtn.onclick = async () => {
                const confirmed = await window.app?.confirm?.('Desvinculará o responsável financeiro. Cobranças irão para o aluno. Continuar?');
                if (!confirmed) return;

                const promises = [
                    this.api.request(`/api/students/${studentId}/financial-responsible-student`, {
                        method: 'POST',
                        body: JSON.stringify({ responsibleStudentId: null }),
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    this.api.request(`/api/students/${studentId}/financial-responsible`, {
                        method: 'PATCH',
                        body: JSON.stringify({ financialResponsibleId: null }),
                        headers: { 'Content-Type': 'application/json' }
                    })
                ];

                try {
                    await Promise.all(promises);
                    window.app?.showToast?.('✅ Vínculo removido!', 'success');
                    await this.renderFinancialTab(studentId);
                } catch (error) {
                    window.app?.showToast?.('❌ Erro ao remover vínculo', 'error');
                }
            };
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
        console.log('📦 [Packages] Starting to load packages...');
        const loadingEl = this.container.querySelector('#packages-loading');
        const containerEl = this.container.querySelector('#packages-container');
        
        console.log('📦 [Packages] Elements found:', {
            loading: !!loadingEl,
            container: !!containerEl
        });

        if (!loadingEl || !containerEl) {
            console.error('❌ [Packages] Required elements not found!');
            return;
        }

        try {
            console.log('📡 [Packages] Fetching from /api/billing-plans...');
            const response = await this.api.fetchWithStates('/api/billing-plans', {
                loadingElement: loadingEl,
                onError: (error) => console.error('❌ [Packages] Error loading packages:', error)
            });
            console.log('✅ [Packages] Response received:', response);
            const packages = response.data || [];
            console.log('📦 [Packages] Total packages:', packages.length);

            loadingEl.style.display = 'none';
            containerEl.style.display = 'block';

            if (packages.length === 0) {
                console.warn('⚠️ [Packages] No packages available');
                containerEl.innerHTML = '<p class="empty-state">Nenhum pacote disponível no momento</p>';
                return;
            }

            console.log('🎨 [Packages] Rendering', packages.length, 'packages...');
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

    // Converter data para formato YYYY-MM-DD para input type="date"
    getDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
                'Accept': 'application/json',
                'x-organization-id': localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
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
                'Accept': 'application/json',
                'x-organization-id': localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
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

window.subscribeToPackageFromButton = function(buttonElement) {
    if (!buttonElement) {
        return;
    }

    const studentId = buttonElement.dataset.studentId;
    const planId = buttonElement.dataset.planId;

    if (!studentId || !planId) {
        window.app?.showToast?.('Não foi possível identificar o aluno ou o plano selecionado.', 'error');
        return;
    }
    const planName = buttonElement.dataset.planName ? decodeURIComponent(buttonElement.dataset.planName) : 'Plano';
    const planPrice = buttonElement.dataset.planPrice || '0.00';

    window.subscribeToPackage(studentId, planId, planName, planPrice);
};

window.subscribeToPackage = function(studentId, planId, planName = 'Plano', planPrice = '0.00') {
    if (!studentId || !planId) {
        window.app?.showToast?.('Não foi possível identificar o aluno ou o plano selecionado.', 'error');
        return;
    }

    const numericPrice = Number(planPrice);
    window.openSubscriptionModal({
        mode: 'create',
        studentId,
        planId,
        planName,
        originalPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
        currentPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
        startDate: new Date().toISOString().split('T')[0]
    });
};

window.openSubscriptionModal = function(options = {}) {
    const {
        mode = 'create',
        studentId = '',
        planId = '',
        subscriptionId = '',
        planName = 'Plano',
        originalPrice = 0,
        currentPrice = 0,
        startDate = new Date().toISOString().split('T')[0],
        nextDueDate = '',
        status = 'ACTIVE'
    } = options;

    const isEditMode = mode === 'edit';

    const formatToInputDate = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    window.closeSubscriptionModal();

    const overlay = document.createElement('div');
    overlay.id = 'subscription-pricing-modal';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); display: flex; align-items: center; justify-content: center; padding: 2rem; z-index: 11000;';
    overlay.innerHTML = `
        <div class="data-card-premium" style="width: min(560px, 100%); max-height: 88vh; overflow-y: auto; border-radius: 22px; padding: 0; box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);">
            <div class="module-header-premium" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; padding: 1.8rem 1.8rem 1.6rem; border-top-left-radius: 22px; border-top-right-radius: 22px;">
                <div>
                    <p style="margin: 0; color: rgba(255,255,255,0.78); font-size: 0.95rem;">
                        ${isEditMode ? 'Ajustar cobrança da assinatura' : 'Confirmar assinatura do plano'}
                    </p>
                    <h2 data-role="plan-title" style="margin: 0; color: #ffffff; font-size: 1.4rem;"></h2>
                </div>
                <button type="button" data-role="close-modal" style="background: transparent; border: none; color: rgba(255,255,255,0.85); font-size: 1.35rem; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="subscription-pricing-form" style="padding: 1.75rem 1.85rem 1.6rem; display: flex; flex-direction: column; gap: 1.25rem;">
                <input type="hidden" data-role="final-price-value" value="0">
                <input type="hidden" data-role="mode" value="${isEditMode ? 'edit' : 'create'}">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div class="stat-card-enhanced" style="padding: 1rem; border-radius: 14px; background: rgba(102, 126, 234, 0.12);">
                        <span style="display: block; font-size: 0.8rem; color: #475569; font-weight: 600; text-transform: uppercase;">Valor original</span>
                        <strong data-role="original-price" style="display: block; margin-top: 0.45rem; font-size: 1.4rem; color: #1f2937;">R$ 0,00</strong>
                    </div>
                    <div class="stat-card-enhanced" style="padding: 1rem; border-radius: 14px; background: rgba(118, 75, 162, 0.12);">
                        <span style="display: block; font-size: 0.8rem; color: #475569; font-weight: 600; text-transform: uppercase;">Valor final</span>
                        <strong data-role="final-price" style="display: block; margin-top: 0.45rem; font-size: 1.55rem; color: #1f2937;">R$ 0,00</strong>
                    </div>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Personalização do valor</label>
                    <select data-role="discount-type" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem;">
                        <option value="none">Manter valor padrão</option>
                        <option value="percentage">Aplicar desconto percentual</option>
                        <option value="fixed">Definir valor final (R$)</option>
                    </select>
                </div>
                <div data-role="discount-group" style="display: none;">
                    <label data-role="discount-label" style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;"></label>
                    <input type="number" step="0.01" min="0" data-role="discount-value" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem;" placeholder="0">
                    <small data-role="discount-hint" style="display: block; margin-top: 0.4rem; color: #64748b;"></small>
                </div>
                <div data-role="price-preview" style="display: none; background: rgba(102, 126, 234, 0.08); border: 1px dashed rgba(102, 126, 234, 0.4); padding: 1rem; border-radius: 12px;">
                    <span data-role="discount-info" style="color: #059669; font-weight: 600;"></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Data de início</label>
                        <input type="date" data-role="start-date" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem;">
                    </div>
                    ${isEditMode ? `
                        <div>
                            <label style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Próximo vencimento</label>
                            <input type="date" data-role="next-due-date" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem;">
                        </div>
                    ` : ''}
                </div>
                ${isEditMode ? `
                    <div>
                        <label style="display: block; font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Status da assinatura</label>
                        <select data-role="status" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem;">
                            <option value="ACTIVE" ${status === 'ACTIVE' ? 'selected' : ''}>🟢 Ativo</option>
                            <option value="PAUSED" ${status === 'PAUSED' ? 'selected' : ''}>🟡 Pausado</option>
                            <option value="CANCELLED" ${status === 'CANCELLED' ? 'selected' : ''}>🔴 Cancelado</option>
                        </select>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                    <button type="button" data-role="close-modal" class="btn-form btn-secondary-form" style="flex: 1;">Cancelar</button>
                    <button type="submit" data-role="submit" class="btn-form btn-primary-form" style="flex: 1;">
                        <i class="fas fa-check"></i>
                        ${isEditMode ? 'Salvar alterações' : 'Confirmar assinatura'}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector('#subscription-pricing-form');
    form.dataset.studentId = studentId;
    form.dataset.planId = planId;
    form.dataset.planName = planName;
    form.dataset.originalPrice = String(Number(originalPrice) || 0);
    form.dataset.initialCurrentPrice = String(Number(currentPrice) || 0);

    if (isEditMode) {
        form.dataset.subscriptionId = subscriptionId;
        form.dataset.initialStatus = status;
    }

    overlay.querySelector('[data-role="plan-title"]').textContent = planName;

    const startDateField = overlay.querySelector('[data-role="start-date"]');
    const normalizedStartDate = startDate || new Date().toISOString().split('T')[0];
    startDateField.value = normalizedStartDate;
    form.dataset.startDate = normalizedStartDate;

    if (isEditMode) {
        const nextDueDateField = overlay.querySelector('[data-role="next-due-date"]');
        const formattedNextDue = formatToInputDate(nextDueDate);
        nextDueDateField.value = formattedNextDue;
        form.dataset.nextDueDate = formattedNextDue || '';
    }

    const discountTypeField = overlay.querySelector('[data-role="discount-type"]');
    const discountGroup = overlay.querySelector('[data-role="discount-group"]');
    const discountLabel = overlay.querySelector('[data-role="discount-label"]');
    const discountHint = overlay.querySelector('[data-role="discount-hint"]');
    const discountValueField = overlay.querySelector('[data-role="discount-value"]');
    const discountInfoEl = overlay.querySelector('[data-role="discount-info"]');
    const pricePreviewEl = overlay.querySelector('[data-role="price-preview"]');
    const originalPriceEl = overlay.querySelector('[data-role="original-price"]');
    const finalPriceEl = overlay.querySelector('[data-role="final-price"]');
    const finalPriceInput = overlay.querySelector('[data-role="final-price-value"]');
    const submitButton = overlay.querySelector('[data-role="submit"]');

    const basePrice = Number(originalPrice) || 0;
    const initialCurrentPrice = Number(currentPrice) || basePrice;
    originalPriceEl.textContent = `R$ ${basePrice.toFixed(2)}`;

    const updatePreview = () => {
        const type = discountTypeField.value;
        const rawValue = Number(discountValueField.value);
        let finalPrice = basePrice;
        let message = 'Valor padrão será aplicado.';
        let messageColor = '#475569';

        if (type === 'percentage') {
            if (Number.isFinite(rawValue) && rawValue > 0) {
                const discountAmount = (basePrice * rawValue) / 100;
                finalPrice = basePrice - discountAmount;
                message = `Desconto de ${rawValue.toFixed(2).replace('.', ',')}% (R$ ${discountAmount.toFixed(2)})`;
                messageColor = '#059669';
            } else {
                message = 'Informe o percentual de desconto (ex: 10 para 10%).';
            }
        } else if (type === 'fixed') {
            if (Number.isFinite(rawValue) && rawValue >= 0) {
                finalPrice = rawValue;
                const difference = basePrice - finalPrice;
                if (difference > 0) {
                    message = `Valor final definido: R$ ${finalPrice.toFixed(2)} (desconto de R$ ${difference.toFixed(2)})`;
                    messageColor = '#059669';
                } else if (difference < 0) {
                    message = `Valor final acima do original em R$ ${Math.abs(difference).toFixed(2)}.`;
                    messageColor = '#b45309';
                } else {
                    message = 'Valor final igual ao original.';
                }
            } else {
                message = 'Informe o valor final que o aluno irá pagar.';
            }
        }

        if (type === 'none') {
            discountGroup.style.display = 'none';
            pricePreviewEl.style.display = 'none';
            discountValueField.value = '';
        } else {
            discountGroup.style.display = 'block';
            pricePreviewEl.style.display = 'block';
        }

        if (finalPrice < 0) {
            message = 'Valor final não pode ser negativo.';
            messageColor = '#dc2626';
            submitButton.disabled = true;
        } else {
            submitButton.disabled = false;
        }

        finalPriceEl.textContent = `R$ ${finalPrice.toFixed(2)}`;
        discountInfoEl.textContent = message;
        discountInfoEl.style.color = messageColor;
        finalPriceInput.value = finalPrice.toFixed(2);
    };

    const handleDiscountTypeChange = (prefillValue = '') => {
        const type = discountTypeField.value;
        if (type === 'percentage') {
            discountLabel.textContent = 'Percentual de desconto (%)';
            discountHint.textContent = 'Informe apenas o número. Ex: 10 para 10% de desconto.';
            discountValueField.placeholder = '0';
            discountValueField.max = '100';
            discountValueField.step = '0.1';
            if (prefillValue) {
                discountValueField.value = prefillValue;
            } else {
                discountValueField.value = '';
            }
        } else if (type === 'fixed') {
            discountLabel.textContent = 'Valor final em reais (R$)';
            discountHint.textContent = 'Informe o valor final que será cobrado.';
            discountValueField.placeholder = basePrice.toFixed(2);
            discountValueField.removeAttribute('max');
            discountValueField.step = '0.01';
            if (prefillValue) {
                discountValueField.value = prefillValue;
            } else {
                discountValueField.value = '';
            }
        }

        updatePreview();
    };

    discountTypeField.addEventListener('change', () => handleDiscountTypeChange());
    discountValueField.addEventListener('input', updatePreview);

    overlay.querySelectorAll('[data-role="close-modal"]').forEach((button) => {
        button.addEventListener('click', () => window.closeSubscriptionModal());
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            window.closeSubscriptionModal();
        }
    });

    form.addEventListener('submit', window.submitSubscriptionForm);

    if (isEditMode && Math.abs(initialCurrentPrice - basePrice) > 0.009) {
        discountTypeField.value = 'fixed';
        handleDiscountTypeChange(initialCurrentPrice.toFixed(2));
    } else {
        handleDiscountTypeChange();
    }

    updatePreview();
};

window.closeSubscriptionModal = function() {
    const modal = document.getElementById('subscription-pricing-modal');
    if (modal) {
        modal.remove();
    }
};

window.submitSubscriptionForm = async function(event) {
    event.preventDefault();

    const form = event.target;
    const mode = form.querySelector('[data-role="mode"]').value;
    const studentId = form.dataset.studentId;
    const planId = form.dataset.planId;
    const planName = form.dataset.planName || 'Plano';
    const subscriptionId = form.dataset.subscriptionId || '';
    const originalPrice = Number(form.dataset.originalPrice || 0);
    const initialCurrentPrice = Number(form.dataset.initialCurrentPrice || originalPrice);

    if (!studentId || !planId) {
        window.app?.showToast?.('Erro: não foi possível identificar o aluno ou o plano.', 'error');
        return;
    }

    if (mode === 'edit' && !subscriptionId) {
        window.app?.showToast?.('Erro: assinatura não encontrada para edição.', 'error');
        return;
    }

    const discountType = form.querySelector('[data-role="discount-type"]').value;
    const finalPriceField = form.querySelector('[data-role="final-price-value"]');
    const finalPrice = Number(finalPriceField?.value || originalPrice);
    const startDateField = form.querySelector('[data-role="start-date"]');
    const nextDueDateField = form.querySelector('[data-role="next-due-date"]');
    const statusField = form.querySelector('[data-role="status"]');

    if (finalPrice < 0) {
        window.app?.showToast?.('O valor final não pode ser negativo.', 'error');
        return;
    }

    const submitButton = form.querySelector('[data-role="submit"]');
    const originalButtonHTML = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    let shouldRestoreButton = true;

    const buildISODate = (value) => {
        if (!value) return undefined;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };

    try {
        const payload = { studentId, planId };
        const currentStartDate = startDateField?.value || '';
        const originalStartDate = form.dataset.startDate || '';
        const currentNextDueDate = nextDueDateField?.value || '';
        const originalNextDueDate = form.dataset.nextDueDate || '';
        const initialStatus = form.dataset.initialStatus || '';
        const baselinePrice = mode === 'edit' ? initialCurrentPrice : originalPrice;
        let startDateISO;

        if (mode === 'create') {
            startDateISO = buildISODate(currentStartDate);
            if (startDateISO) {
                payload.startDate = startDateISO;
            }
        } else if (currentStartDate && currentStartDate !== originalStartDate) {
            startDateISO = buildISODate(currentStartDate);
            if (startDateISO) {
                payload.startDate = startDateISO;
            }
        }

        if (discountType !== 'none' && Number.isFinite(finalPrice) && Math.abs(finalPrice - baselinePrice) > 0.009) {
            payload.currentPrice = Number(finalPrice.toFixed(2));
        } else if (mode === 'edit' && discountType === 'none' && Math.abs(initialCurrentPrice - originalPrice) > 0.009) {
            payload.currentPrice = Number(originalPrice.toFixed(2));
        }

        let url = '/api/financial/subscriptions';
        let method = 'POST';

        if (mode === 'edit') {
            url = `/api/subscriptions/${subscriptionId}`;
            method = 'PATCH';

            if (statusField && statusField.value && statusField.value !== initialStatus) {
                payload.status = statusField.value;
            }

            if (nextDueDateField && currentNextDueDate && currentNextDueDate !== originalNextDueDate) {
                const nextDueDateISO = buildISODate(currentNextDueDate);
                if (nextDueDateISO) {
                    payload.nextDueDate = nextDueDateISO;
                }
            }

            delete payload.studentId;
            delete payload.planId;

            if (Object.keys(payload).length === 0) {
                window.app?.showToast?.('Nenhuma alteração detectada.', 'info');
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
                return;
            }
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-organization-id': localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = data?.message || data?.error || (mode === 'edit' ? 'Falha ao atualizar assinatura' : 'Falha ao assinar plano');
            throw new Error(message);
        }

        window.app?.showToast?.(
            mode === 'edit'
                ? 'Assinatura atualizada com sucesso!'
                : `Plano "${planName}" assinado com sucesso!`,
            'success'
        );

        window.closeSubscriptionModal();
        shouldRestoreButton = false;

        if (window.studentEditor && typeof window.studentEditor.renderFinancialTab === 'function') {
            const activeStudentId = window.studentEditor.current?.id || studentId;
            try {
                await window.studentEditor.renderFinancialTab(activeStudentId);
            } catch (refreshError) {
                console.warn('Não foi possível atualizar a aba financeira automaticamente:', refreshError);
            }
        }
    } catch (error) {
        console.error('Erro ao processar assinatura:', error);
        window.app?.showToast?.(error.message || 'Erro ao salvar mudanças', 'error');
    } finally {
        if (shouldRestoreButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    }
};

window.viewSubscriptionDetails = function(subscriptionData) {
    if (typeof subscriptionData === 'string') {
        try {
            subscriptionData = JSON.parse(decodeURIComponent(subscriptionData));
        } catch (parseError) {
            console.error('Failed to parse subscription data payload:', parseError);
            window.app?.showToast?.('Erro ao preparar dados da assinatura', 'error');
            return;
        }
    }

    if (!subscriptionData || !subscriptionData.id) {
        console.error('Missing subscription data');
        window.app?.showToast?.('Erro ao carregar dados da assinatura', 'error');
        return;
    }

    window.openSubscriptionModal({
        mode: 'edit',
        subscriptionId: subscriptionData.id,
        studentId: subscriptionData.studentId,
        planId: subscriptionData.planId,
        planName: subscriptionData.planName,
        originalPrice: Number(subscriptionData.originalPrice) || 0,
        currentPrice: Number(
            subscriptionData.currentPrice !== undefined && subscriptionData.currentPrice !== null
                ? subscriptionData.currentPrice
                : subscriptionData.originalPrice
        ) || 0,
        startDate: subscriptionData.startDate ? subscriptionData.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        nextDueDate: subscriptionData.nextDueDate || '',
        status: subscriptionData.status || 'ACTIVE'
    });
};

window.pauseSubscription = async function(subscriptionId) {
    if (!confirm('Deseja pausar esta assinatura?')) return;

    try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-organization-id': localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
            },
            body: JSON.stringify({ status: 'PAUSED' })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao pausar assinatura');
        }

        window.app?.showToast?.('Assinatura pausada com sucesso!', 'success');

        if (window.studentEditor && typeof window.studentEditor.renderFinancialTab === 'function') {
            const activeStudentId = window.studentEditor.current?.id;
            if (activeStudentId) {
                try {
                    await window.studentEditor.renderFinancialTab(activeStudentId);
                } catch (refreshError) {
                    console.warn('Não foi possível atualizar a aba financeira automaticamente após pausar:', refreshError);
                }
            }
        }
    } catch (error) {
        console.error('Error pausing subscription:', error);
        window.app?.showToast?.(error.message || 'Erro ao pausar assinatura', 'error');
    }
};

/**
 * Enroll student in a course (called from onclick in HTML)
 * @param {string} courseId - The course ID to enroll
 */
window.enrollCourse = async function(courseId) {
    const editor = window.studentEditor;
    if (!editor?.current?.id) {
        console.error('❌ [enrollCourse] No current student');
        alert('Erro: Aluno não carregado');
        return;
    }

    console.log('📚 [enrollCourse] Enrolling student', editor.current.id, 'in course', courseId);

    try {
        const response = await editor.api.request(`/api/students/${editor.current.id}/courses`, {
            method: 'POST',
            body: JSON.stringify({ courseId })
        });

        if (response.success) {
            window.app?.showToast?.('Aluno matriculado no curso com sucesso!', 'success');
            // Reload courses tab
            await editor.loadTabContent('courses', editor.current.id);
        } else {
            throw new Error(response.message || 'Falha ao matricular no curso');
        }
    } catch (error) {
        console.error('❌ [enrollCourse] Error:', error);
        window.app?.showToast?.(error.message || 'Erro ao matricular no curso', 'error');
    }
};

// Global function for package selector (called from onclick in HTML)
window.openPackageSelector = async function(studentId) {
    console.log('📦 [openPackageSelector] Opening for student:', studentId);
    
    if (!window.studentEditor) {
        console.error('❌ [openPackageSelector] StudentEditor not available');
        alert('Erro: Editor não disponível');
        return;
    }

    // Load packages in modal or inline section
    try {
        // Get student data
        const response = await window.studentEditor.api.request(`/api/students/${studentId}`);
        const student = response.data;

        // Load billing plans
        const plansResponse = await window.studentEditor.api.request('/api/billing-plans');
        const plans = plansResponse.data || [];

        if (plans.length === 0) {
            alert('Nenhum plano disponível no momento');
            return;
        }

        // Show plans in a modal or inline section
        // For now, let's create a simple modal
        const modalHTML = `
            <div class="modal-overlay" id="package-selector-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 800px;
                    max-height: 80vh;
                    overflow-y: auto;
                    width: 90%;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2>Selecionar Plano para ${student.user.firstName} ${student.user.lastName}</h2>
                        <button onclick="document.getElementById('package-selector-modal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 2rem;
                            cursor: pointer;
                            color: #666;
                        ">&times;</button>
                    </div>
                    <div class="packages-grid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                        gap: 1rem;
                    ">
                        ${plans.map(pkg => `
                            <div class="package-card" style="
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                padding: 1.5rem;
                                cursor: pointer;
                                transition: all 0.3s;
                            " onmouseover="this.style.borderColor='#667eea'" onmouseout="this.style.borderColor='#e0e0e0'">
                                <h3 style="margin-top: 0; color: #667eea;">${pkg.name}</h3>
                                <p style="color: #666; font-size: 0.9rem;">${pkg.description || ''}</p>
                                <div style="margin: 1rem 0;">
                                    <span style="font-size: 1.5rem; font-weight: bold; color: #333;">R$ ${parseFloat(pkg.price).toFixed(2)}</span>
                                    <span style="color: #666; font-size: 0.9rem;">/${pkg.billingType === 'MONTHLY' ? 'mês' : 'período'}</span>
                                </div>
                                <button onclick="window.createSubscription('${studentId}', '${pkg.id}')" style="
                                    width: 100%;
                                    padding: 0.75rem;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-weight: bold;
                                ">Selecionar</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (error) {
        console.error('❌ [openPackageSelector] Error:', error);
        alert('Erro ao carregar planos: ' + error.message);
    }
};

// Global function to create subscription (called from package selector)
window.createSubscription = async function(studentId, planId) {
    console.log('💳 [createSubscription] Creating subscription:', { studentId, planId });

    try {
        const response = await window.studentEditor.api.request('/api/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                studentId,
                planId,
                startDate: new Date().toISOString().split('T')[0]
            })
        });

        if (response.success) {
            // Close modal
            document.getElementById('package-selector-modal')?.remove();
            
            // Show success message
            window.app?.showToast?.('Assinatura criada com sucesso!', 'success');
            
            // Reload financial tab if student is currently open
            if (window.studentEditor.current?.id === studentId) {
                await window.studentEditor.renderFinancialTab(studentId);
            }
        } else {
            throw new Error(response.message || 'Falha ao criar assinatura');
        }
    } catch (error) {
        console.error('❌ [createSubscription] Error:', error);
        alert('Erro ao criar assinatura: ' + error.message);
    }
};

window.cancelSubscription = async function(subscriptionId) {
    if (!confirm('Deseja cancelar esta assinatura? Esta ação não pode ser desfeita.')) return;

    try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
            headers: {
                'x-organization-id': localStorage.getItem('activeOrganizationId') || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao cancelar assinatura');
        }

        window.app?.showToast?.('Assinatura cancelada com sucesso!', 'success');

        if (window.studentEditor && typeof window.studentEditor.renderFinancialTab === 'function') {
            const activeStudentId = window.studentEditor.current?.id;
            if (activeStudentId) {
                try {
                    await window.studentEditor.renderFinancialTab(activeStudentId);
                } catch (refreshError) {
                    console.warn('Não foi possível atualizar a aba financeira automaticamente após cancelar:', refreshError);
                }
            }
        }
    } catch (error) {
        console.error('Error canceling subscription:', error);
        window.app?.showToast?.(error.message || 'Erro ao cancelar assinatura', 'error');
    }
};



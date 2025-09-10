// TurmasDetailView - Visualização detalhada de uma turma
// Mostra informações completas com navegação para diferentes seções

export class TurmasDetailView {
    constructor(service, controller) {
        this.service = service;
        this.controller = controller;
        this.container = null;
        this.turmaData = null;
        this.currentTab = 'overview'; // Aba atual
        this.turmaCourses = []; // Cursos da turma
        this.availableCourses = []; // Cursos disponíveis
    }

    async render(container, turmaData) {
        this.container = container;
        this.turmaData = turmaData;
        
        // Registrar view globalmente para callbacks dos modais
        window.turmaDetailView = this;
        
        // Carregar dados dos cursos
        await this.loadCoursesData();
        
        await this.renderHTML();
        this.attachEventListeners();
    }

    // attachEventListeners is implemented later in the file (consolidated version)

    handleQuickAction(actionType) {
        switch (actionType) {
            case 'schedule':
                this.switchTab('schedule');
                break;
            case 'students':
                this.switchTab('students');
                break;
            case 'attendance':
                this.switchTab('attendance');
                break;
            case 'reports':
                this.switchTab('reports');
                break;
            default:
                console.warn('Ação rápida não reconhecida:', actionType);
        }
    }

    async handleDuplicate() {
        if (confirm('Deseja duplicar esta turma?')) {
            try {
                // Implementar lógica de duplicação
                this.showSuccess('Funcionalidade de duplicação em desenvolvimento');
            } catch (error) {
                this.showError('Erro ao duplicar turma');
            }
        }
    }

    async handleDelete() {
        if (confirm('⚠️ ATENÇÃO: Esta ação não pode ser desfeita. Deseja realmente excluir esta turma?')) {
            try {
                const result = await this.service.delete(this.turmaData.id);
                if (result.success) {
                    this.showSuccess('Turma excluída com sucesso');
                    this.controller.navigateToList();
                } else {
                    this.showError('Erro ao excluir turma');
                }
            } catch (error) {
                this.showError('Erro ao excluir turma');
            }
        }
    }

    async loadCoursesData() {
        try {
            // Carregar cursos da turma
            const turmaCoursesResult = await this.service.getTurmaCourses(this.turmaData.id);
            if (turmaCoursesResult.success) {
                this.turmaCourses = turmaCoursesResult.data;
            }

            // Carregar cursos disponíveis
            const availableCoursesResult = await this.service.getCourses();
            if (availableCoursesResult.success) {
                // Filtrar cursos que não estão associados à turma
                this.availableCourses = availableCoursesResult.data.filter(course => 
                    !this.turmaCourses.some(tc => tc.course.id === course.id)
                );
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos cursos:', error);
            this.turmaCourses = [];
            this.availableCourses = [];
        }
    }

    async renderHTML() {
        const formattedTurma = this.service.formatTurmaData(this.turmaData);
        
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
                            <span class="breadcrumb-item active">👁️ ${this.turmaData.name}</span>
                        </div>
                        <div class="module-header-actions">
                            <button class="btn-action-secondary" id="btnBack">
                                <i class="icon">←</i>
                                <span>Voltar</span>
                            </button>
                            <button class="btn-action-premium" id="btnEdit">
                                <i class="icon">✏️</i>
                                <span>Editar</span>
                            </button>
                        </div>
                    </div>
                    <h1 class="module-title">${this.turmaData.name}</h1>
                    <p class="module-subtitle">Detalhes completos da turma e acesso às funcionalidades</p>
                </div>

                <!-- Status e Progresso -->
                <div class="stats-grid-premium">
                    <div class="stat-card-enhanced">
                        <div class="stat-card-content">
                            <div class="stat-number">${formattedTurma.statusText}</div>
                            <div class="stat-label">Status Atual</div>
                        </div>
                        <div class="stat-card-icon">📊</div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-card-content">
                            <div class="stat-number">${this.turmaData.students?.length || 0}</div>
                            <div class="stat-label">Alunos Matriculados</div>
                        </div>
                        <div class="stat-card-icon">👥</div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-card-content">
                            <div class="stat-number">${this.turmaData.lessons?.length || 0}</div>
                            <div class="stat-label">Aulas Programadas</div>
                        </div>
                        <div class="stat-card-icon">📚</div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-card-content">
                            <div class="stat-number">${formattedTurma.progressPercentage}%</div>
                            <div class="stat-label">Progresso</div>
                        </div>
                        <div class="stat-card-icon">📈</div>
                    </div>
                </div>

                <!-- Navegação Rápida -->
                <div class="quick-actions-container">
                    <div class="quick-actions-header">
                        <h3>🚀 Ações Rápidas</h3>
                        <p>Acesse rapidamente as principais funcionalidades da turma</p>
                    </div>
                    <div class="quick-actions-grid">
                        <div class="quick-action-card" data-action="schedule">
                            <div class="quick-action-icon">📅</div>
                            <div class="quick-action-content">
                                <h4>Cronograma</h4>
                                <p>Visualizar e gerenciar o calendário de aulas</p>
                            </div>
                            <div class="quick-action-arrow">→</div>
                        </div>
                        
                        <div class="quick-action-card" data-action="students">
                            <div class="quick-action-icon">👥</div>
                            <div class="quick-action-content">
                                <h4>Alunos</h4>
                                <p>Gerenciar matriculados e adicionar novos</p>
                            </div>
                            <div class="quick-action-arrow">→</div>
                        </div>
                        
                        <div class="quick-action-card" data-action="attendance">
                            <div class="quick-action-icon">📋</div>
                            <div class="quick-action-content">
                                <h4>Frequência</h4>
                                <p>Registrar presença e acompanhar faltas</p>
                            </div>
                            <div class="quick-action-arrow">→</div>
                        </div>
                        
                        <div class="quick-action-card" data-action="reports">
                            <div class="quick-action-icon">📊</div>
                            <div class="quick-action-content">
                                <h4>Relatórios</h4>
                                <p>Análises e estatísticas detalhadas</p>
                            </div>
                            <div class="quick-action-arrow">→</div>
                        </div>
                    </div>
                </div>

                <!-- Conteúdo com Abas -->
                <div class="tabs-container">
                    <!-- Navegação das Abas -->
                    <div class="tabs-nav">
                        <button class="tab-button active" data-tab="overview">
                            <i class="icon">�️</i>
                            <span>Visão Geral</span>
                        </button>
                        <button class="tab-button" data-tab="courses">
                            <i class="icon">🎓</i>
                            <span>Cursos</span>
                            <span class="tab-badge">${this.turmaCourses.length}</span>
                        </button>
                        <button class="tab-button" data-tab="students">
                            <i class="icon">👥</i>
                            <span>Alunos</span>
                            <span class="tab-badge">${this.turmaData.students?.length || 0}</span>
                        </button>
                        <button class="tab-button" data-tab="schedule">
                            <i class="icon">📅</i>
                            <span>Cronograma</span>
                        </button>
                        <button class="tab-button" data-tab="attendance">
                            <i class="icon">📋</i>
                            <span>Frequência</span>
                        </button>
                        <button class="tab-button" data-tab="reports">
                            <i class="icon">📊</i>
                            <span>Relatórios</span>
                        </button>
                    </div>

                    <!-- Conteúdo das Abas -->
                    <div class="tabs-content">
                        <!-- Aba Visão Geral -->
                        <div id="tab-overview" class="tab-panel active">
                            ${this.renderOverviewTab()}
                        </div>

                        <!-- Aba Cursos -->
                        <div id="tab-courses" class="tab-panel">
                            ${this.renderCoursesTab()}
                        </div>

                        <!-- Aba Alunos -->
                        <div id="tab-students" class="tab-panel">
                            ${this.renderStudentsTab()}
                        </div>

                        <!-- Aba Cronograma -->
                        <div id="tab-schedule" class="tab-panel">
                            ${this.renderScheduleTab()}
                        </div>

                        <!-- Aba Frequência -->
                        <div id="tab-attendance" class="tab-panel">
                            ${this.renderAttendanceTab()}
                        </div>

                        <!-- Aba Relatórios -->
                        <div id="tab-reports" class="tab-panel">
                            ${this.renderReportsTab()}
                        </div>
                    </div>
                </div>

                <!-- Ações Adicionais -->
                <div class="additional-actions">
                    <div class="action-group">
                        <h4>⚙️ Gerenciamento</h4>
                        <div class="action-buttons">
                            <button class="btn-action-secondary" id="btnGenerateSchedule">
                                <i class="icon">🔄</i>
                                <span>Regenerar Cronograma</span>
                            </button>
                            <button class="btn-action-secondary" id="btnDuplicate">
                                <i class="icon">📋</i>
                                <span>Duplicar Turma</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="action-group danger-zone">
                        <h4>⚠️ Zona de Perigo</h4>
                        <div class="action-buttons">
                            <button class="btn-action-danger" id="btnDelete">
                                <i class="icon">🗑️</i>
                                <span>Excluir Turma</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Navegação
        const btnBack = this.container.querySelector('#btnBack');
        const btnEdit = this.container.querySelector('#btnEdit');

        btnBack?.addEventListener('click', () => this.controller.navigateToList());
        btnEdit?.addEventListener('click', () => this.controller.showEdit(this.turmaData.id));

        // Breadcrumb
        const breadcrumbItems = this.container.querySelectorAll('.breadcrumb-item.clickable');
        breadcrumbItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.navigate;
                if (path === '/') {
                    if (window.router) {
                        window.router.navigate('dashboard');
                    }
                } else if (path === '/turmas') {
                    this.controller.navigateToList();
                }
            });
        });

        // Navegação das Abas
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Botão de adicionar curso
        const addCourseBtn = this.container.querySelector('#addCourseBtn');
        addCourseBtn?.addEventListener('click', () => this.showAddCourseModal());

        // Ações rápidas
        const quickActionCards = this.container.querySelectorAll('.quick-action-card');
        quickActionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Ações de gerenciamento
        const btnGenerateSchedule = this.container.querySelector('#btnGenerateSchedule');
        const btnDuplicate = this.container.querySelector('#btnDuplicate');
        const btnDelete = this.container.querySelector('#btnDelete');

        btnGenerateSchedule?.addEventListener('click', () => this.handleGenerateSchedule());
        btnDuplicate?.addEventListener('click', () => this.handleDuplicate());
        btnDelete?.addEventListener('click', () => this.handleDelete());

        // Registrar view globalmente para os modais
        window.turmaDetailView = this;
    }

    handleQuickAction(action) {
        switch (action) {
            case 'schedule':
                this.controller.showSchedule(this.turmaData.id);
                break;
            case 'students':
                this.controller.showStudents(this.turmaData.id);
                break;
            case 'attendance':
                this.controller.showAttendance(this.turmaData.id);
                break;
            case 'reports':
                this.controller.showReports(this.turmaData.id);
                break;
        }
    }

    async handleGenerateSchedule() {
        if (!confirm('Tem certeza que deseja regenerar o cronograma? Isso substituirá o cronograma atual.')) {
            return;
        }

        try {
            await this.controller.generateSchedule(this.turmaData.id);
        } catch (error) {
            console.error('❌ Erro ao regenerar cronograma:', error);
        }
    }

    handleDuplicate() {
        // Por simplicidade, redireciona para criar nova turma com dados pré-preenchidos
        this.controller.showCreate();
    }

    async handleDelete() {
        await this.controller.deleteTurma(this.turmaData.id);
    }

    formatDaysOfWeek(daysArray) {
        if (!daysArray || daysArray.length === 0) {
            return 'Não definido';
        }

        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        return daysArray.map(day => dayNames[day]).join(', ');
    }

    getCompletedLessons() {
        if (!this.turmaData.lessons) return '0';
        
        const completed = this.turmaData.lessons.filter(lesson => 
            lesson.status === 'COMPLETED'
        ).length;
        
        return `${completed} de ${this.turmaData.lessons.length}`;
    }

    getNextLesson() {
        if (!this.turmaData.lessons) return 'Não programada';
        
        const now = new Date();
        const nextLesson = this.turmaData.lessons.find(lesson => 
            lesson.status === 'SCHEDULED' && new Date(lesson.scheduledDate) > now
        );
        
        if (nextLesson) {
            const date = new Date(nextLesson.scheduledDate);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return 'Não programada';
    }

    getEstimatedCompletion() {
        if (!this.turmaData.lessons || this.turmaData.lessons.length === 0) {
            return 'Não determinada';
        }
        
        const completedCount = this.turmaData.lessons.filter(lesson => 
            lesson.status === 'COMPLETED'
        ).length;
        
        const totalCount = this.turmaData.lessons.length;
        const remainingCount = totalCount - completedCount;
        
        if (remainingCount === 0) {
            return 'Concluída';
        }
        
        // Estimar baseado na frequência das aulas
        const schedule = this.turmaData.schedule;
        if (schedule && schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
            const weeksRemaining = Math.ceil(remainingCount / schedule.daysOfWeek.length);
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + (weeksRemaining * 7));
            
            return estimatedDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        
        return 'Não determinada';
    }

    // ===== Refresh =====

    async refresh() {
        // Recarregar dados da turma
        try {
            const result = await this.service.getById(this.turmaData.id);
            if (result.success && result.data) {
                this.turmaData = result.data;
                await this.renderHTML();
                this.attachEventListeners();
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar detalhes da turma:', error);
        }
    }

    // ===== Renderização das Abas =====

    renderOverviewTab() {
        const formattedTurma = this.service.formatTurmaData(this.turmaData);
        
        return `
            <div class="detail-sections">
                <!-- Informações Básicas -->
                <div class="detail-section">
                    <div class="detail-section-header">
                        <h3>📋 Informações Básicas</h3>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">📚 Curso:</span>
                            <span class="detail-value">${this.turmaData.course?.name || 'Não definido'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">👨‍🏫 Instrutor:</span>
                            <span class="detail-value">${this.turmaData.instructor?.name || 'Não definido'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🎯 Tipo:</span>
                            <span class="detail-value">
                                <span class="type-badge type-${this.turmaData.type?.toLowerCase()}">${formattedTurma.typeText}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📊 Status:</span>
                            <span class="detail-value">
                                <span class="status-badge status-${this.turmaData.status?.toLowerCase()}">${formattedTurma.statusText}</span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">👥 Limite de Alunos:</span>
                            <span class="detail-value">${this.turmaData.maxStudents || 'Sem limite'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🏢 Organização:</span>
                            <span class="detail-value">${this.turmaData.organization?.name || 'Não definido'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🏪 Unidade:</span>
                            <span class="detail-value">${this.turmaData.unit?.name || 'Não definido'}</span>
                        </div>
                    </div>
                </div>

                <!-- Cronograma -->
                <div class="detail-section">
                    <div class="detail-section-header">
                        <h3>📅 Cronograma</h3>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">📅 Data de Início:</span>
                            <span class="detail-value">${formattedTurma.startDateFormatted}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📅 Data de Término:</span>
                            <span class="detail-value">${formattedTurma.endDateFormatted || 'Automática'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📅 Dias da Semana:</span>
                            <span class="detail-value">${this.formatDaysOfWeek(this.turmaData.schedule?.daysOfWeek)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">⏰ Horário:</span>
                            <span class="detail-value">${this.turmaData.schedule?.time || 'Não definido'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">⏱️ Duração:</span>
                            <span class="detail-value">${this.turmaData.schedule?.duration || 0} minutos</span>
                        </div>
                    </div>
                </div>

                <!-- Progresso Detalhado -->
                <div class="detail-section">
                    <div class="detail-section-header">
                        <h3>📈 Progresso Detalhado</h3>
                    </div>
                    <div class="progress-details">
                        <div class="progress-overview">
                            <div class="progress-circle">
                                <svg viewBox="0 0 36 36" class="circular-chart">
                                    <path class="circle-bg" d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    <path class="circle" stroke-dasharray="${formattedTurma.progressPercentage}, 100" d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                    <text x="18" y="20.35" class="percentage">${formattedTurma.progressPercentage}%</text>
                                </svg>
                            </div>
                            <div class="progress-stats">
                                <div class="progress-stat">
                                    <span class="stat-label">Aulas Concluídas:</span>
                                    <span class="stat-value">${this.getCompletedLessons()}</span>
                                </div>
                                <div class="progress-stat">
                                    <span class="stat-label">Próxima Aula:</span>
                                    <span class="stat-value">${this.getNextLesson()}</span>
                                </div>
                                <div class="progress-stat">
                                    <span class="stat-label">Estimativa de Conclusão:</span>
                                    <span class="stat-value">${this.getEstimatedCompletion()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCoursesTab() {
        return `
            <div class="courses-management-section">
                <!-- Header da Aba de Cursos -->
                <div class="section-header-premium">
                    <div class="section-header-content">
                        <h3>🎓 Gestão de Cursos da Turma</h3>
                        <p>Gerencie os cursos associados a esta turma e valide a qualificação dos alunos</p>
                    </div>
                    <div class="section-actions">
                        <button class="btn-action-premium" id="addCourseBtn">
                            <i class="icon">➕</i>
                            <span>Adicionar Curso</span>
                        </button>
                    </div>
                </div>

                <!-- Lista de Cursos Atuais -->
                <div class="courses-list-section">
                    <h4>📚 Cursos Associados (${this.turmaCourses.length})</h4>
                    <div id="turmaCoursesList" class="courses-list">
                        ${this.renderTurmaCoursesList()}
                    </div>
                </div>

                <!-- Validação de Qualificação -->
                <div class="qualification-validation-section">
                    <h4>✅ Validação de Qualificação</h4>
                    <div id="qualificationStatus" class="qualification-status">
                        ${this.renderQualificationStatus()}
                    </div>
                </div>
            </div>
        `;
    }

    renderStudentsTab() {
        return `
            <div class="students-section">
                <div class="section-header-premium">
                    <h3>👥 Gestão de Alunos</h3>
                    <p>Alunos matriculados nesta turma</p>
                </div>
                <div class="coming-soon">
                    <i class="icon">👥</i>
                    <h4>Funcionalidade em Desenvolvimento</h4>
                    <p>A gestão de alunos será implementada em breve.</p>
                </div>
            </div>
        `;
    }

    renderScheduleTab() {
        return `
            <div class="schedule-section">
                <div class="section-header-premium">
                    <h3>📅 Cronograma de Aulas</h3>
                    <p>Visualize e gerencie o calendário de aulas</p>
                </div>
                <div class="coming-soon">
                    <i class="icon">📅</i>
                    <h4>Funcionalidade em Desenvolvimento</h4>
                    <p>O cronograma detalhado será implementado em breve.</p>
                </div>
            </div>
        `;
    }

    renderAttendanceTab() {
        return `
            <div class="attendance-section">
                <div class="section-header-premium">
                    <h3>📋 Controle de Frequência</h3>
                    <p>Registre presença e acompanhe faltas</p>
                </div>
                <div class="coming-soon">
                    <i class="icon">📋</i>
                    <h4>Funcionalidade em Desenvolvimento</h4>
                    <p>O controle de frequência será implementado em breve.</p>
                </div>
            </div>
        `;
    }

    // renderCoursesTab is implemented above (consolidated version)

    renderTurmaCoursesList() {
        if (this.turmaCourses.length === 0) {
            return `
                <div class="empty-state">
                    <i class="icon">📚</i>
                    <p>Nenhum curso associado</p>
                    <small>Clique em "Adicionar Curso" para começar</small>
                </div>
            `;
        }

        return this.turmaCourses.map(tc => `
            <div class="course-item-premium" data-course-id="${tc.course.id}">
                <div class="course-info">
                    <h4>${tc.course.name}</h4>
                    <p>${tc.course.description || 'Sem descrição'}</p>
                    <div class="course-meta">
                        <span class="course-level">${tc.course.level || 'N/A'}</span>
                        <span class="course-duration">${tc.course.duration || 0} horas</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn-action-danger btn-sm" 
                            onclick="window.turmaDetailView.removeCourse('${tc.course.id}')">
                        <i class="icon">🗑️</i>
                        <span>Remover</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderQualificationStatus() {
        if (!this.turmaData.students || this.turmaData.students.length === 0) {
            return `
                <div class="qualification-empty">
                    <i class="icon">👥</i>
                    <p>Nenhum aluno matriculado</p>
                    <small>Adicione alunos para validar qualificações</small>
                </div>
            `;
        }

        // Simulação de validação (em produção, isso viria da API)
        const qualifiedCount = Math.floor(this.turmaData.students.length * 0.7);
        const unqualifiedCount = this.turmaData.students.length - qualifiedCount;

        return `
            <div class="qualification-summary">
                <div class="qualification-stats">
                    <div class="stat-item qualified">
                        <span class="stat-number">${qualifiedCount}</span>
                        <span class="stat-label">Qualificados</span>
                    </div>
                    <div class="stat-item unqualified">
                        <span class="stat-number">${unqualifiedCount}</span>
                        <span class="stat-label">Não Qualificados</span>
                    </div>
                </div>
                <div class="qualification-details">
                    <h5>📋 Detalhes da Validação</h5>
                    <div class="qualification-list">
                        ${this.turmaData.students.slice(0, 3).map(student => `
                            <div class="student-qualification">
                                <span class="student-name">${student.name}</span>
                                <span class="qualification-badge ${Math.random() > 0.3 ? 'qualified' : 'unqualified'}">
                                    ${Math.random() > 0.3 ? '✅ Qualificado' : '❌ Não Qualificado'}
                                </span>
                            </div>
                        `).join('')}
                        ${this.turmaData.students.length > 3 ? 
                            `<small>... e mais ${this.turmaData.students.length - 3} alunos</small>` : 
                            ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== Gestão de Abas =====

    switchTab(tabName) {
        // Atualizar estado da aba atual
        this.currentTab = tabName;

        // Atualizar botões das abas
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Atualizar painéis das abas
        const tabPanels = this.container.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            if (panel.id === `tab-${tabName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    // ===== Gestão de Cursos =====

    async showAddCourseModal() {
        if (this.availableCourses.length === 0) {
            this.showError('Todos os cursos já foram adicionados à turma');
            return;
        }

        const modalHtml = `
            <div class="modal-overlay" id="addCourseModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Adicionar Curso à Turma</h3>
                        <button class="modal-close" onclick="window.turmaDetailView.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="courses-selection">
                            ${this.availableCourses.map(course => `
                                <div class="course-option" onclick="window.turmaDetailView.selectCourse('${course.id}')">
                                    <h4>${course.name}</h4>
                                    <p>${course.description || 'Sem descrição'}</p>
                                    <div class="course-meta">
                                        <span class="course-level">${course.level || 'N/A'}</span>
                                        <span class="course-duration">${course.duration || 0} horas</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async selectCourse(courseId) {
        try {
            const result = await this.service.addCourseToTurma(this.turmaData.id, courseId);
            if (result.success) {
                this.showSuccess('Curso adicionado com sucesso!');
                await this.refreshCoursesData();
                this.closeModal();
            } else {
                this.showError('Erro ao adicionar curso: ' + (result.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('❌ Erro ao adicionar curso:', error);
            this.showError('Erro ao adicionar curso');
        }
    }

    async removeCourse(courseId) {
        if (!confirm('Tem certeza que deseja remover este curso da turma?')) {
            return;
        }

        try {
            const result = await this.service.removeCourseFromTurma(this.turmaData.id, courseId);
            if (result.success) {
                this.showSuccess('Curso removido com sucesso!');
                await this.refreshCoursesData();
            } else {
                this.showError('Erro ao remover curso: ' + (result.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('❌ Erro ao remover curso:', error);
            this.showError('Erro ao remover curso');
        }
    }

    closeModal() {
        const modal = document.getElementById('addCourseModal');
        if (modal) {
            modal.remove();
        }
    }

    async loadCoursesData() {
        try {
            // Carregar cursos disponíveis
            const availableResult = await this.service.getAvailableCourses();
            if (availableResult.success) {
                this.availableCourses = availableResult.data || [];
            } else {
                console.warn('⚠️ Erro ao carregar cursos disponíveis:', availableResult.message);
                this.availableCourses = [];
            }

            // Carregar cursos da turma
            const turmaCoursesResult = await this.service.getTurmaCourses(this.turmaData.id);
            if (turmaCoursesResult.success) {
                this.turmaCourses = turmaCoursesResult.data || [];
            } else {
                console.warn('⚠️ Erro ao carregar cursos da turma:', turmaCoursesResult.message);
                this.turmaCourses = [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos cursos:', error);
            this.availableCourses = [];
            this.turmaCourses = [];
        }
    }

    async refreshCoursesData() {
        await this.loadCoursesData();
        this.updateCoursesTab();
    }

    updateCoursesTab() {
        const coursesList = this.container.querySelector('#turmaCoursesList');
        if (coursesList) {
            coursesList.innerHTML = this.renderTurmaCoursesList();
        }

        const qualificationStatus = this.container.querySelector('#qualificationStatus');
        if (qualificationStatus) {
            qualificationStatus.innerHTML = this.renderQualificationStatus();
        }

        // Atualizar badge da aba
        const coursesTabBadge = this.container.querySelector('.tab-button[data-tab="courses"] .tab-badge');
        if (coursesTabBadge) {
            coursesTabBadge.textContent = this.turmaCourses.length;
        }
    }

    showSuccess(message) {
        if (window.app && window.app.showSuccess) {
            window.app.showSuccess(message);
        } else {
            alert(message);
        }
    }

    showError(message) {
        if (window.app && window.app.showError) {
            window.app.showError(message);
        } else {
            alert(message);
        }
    }

    renderReportsTab() {
        return `
            <div class="reports-section">
                <div class="section-header-premium">
                    <h3>📊 Relatórios e Análises</h3>
                    <p>Estatísticas detalhadas da turma</p>
                </div>
                <div class="coming-soon">
                    <i class="icon">📊</i>
                    <h4>Funcionalidade em Desenvolvimento</h4>
                    <p>Os relatórios serão implementados em breve.</p>
                </div>
            </div>
        `;
    }
}

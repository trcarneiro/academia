import { safeNavigateTo } from '../../../shared/utils/navigation.js';

// TurmasDetailView (clean minimal unified detail/create view)
export class TurmasDetailView {
  constructor(service, controller) {
    this.service = service;
    this.controller = controller;

    this.container = null;
    this.wrapper = null;
    this.turmaData = null;
    this.isCreateMode = false;
    this.currentTab = 'overview';

    this.turmaCourses = [];
    this.availableCourses = [];
    this.instructors = [];
    this.units = [];
    this.organizations = [];

    this.coursesLoading = false;
    this.coursesError = null;
    this._coursesDataLoaded = false; // guard to avoid duplicate initial fetches

    this.scheduleLoading = false;
    this.scheduleError = null;
    this._scheduleInitialized = false;
  }

  buildEmptyTurma() {
    const emptyTurma = {
      id: null,
      name: '',
      description: '',
      courseId: '',
      classType: 'COLLECTIVE',
      status: 'SCHEDULED',
      instructorId: '',
      organizationId: '',
      unitId: '',
      startDate: '',
      endDate: null,
      schedule: {
        daysOfWeek: [],
        time: '',
        duration: 60,
      },
      maxStudents: null,
      students: [],
      lessons: [],
    };
    console.debug('🔍 [TurmasDetailView] buildEmptyTurma - result:', emptyTurma);
    return emptyTurma;
  }

  async render(container, turmaData, options = {}) {
    this.container = container;
    this.isCreateMode = !!options.isCreateMode;
    this.currentTab = options.defaultTab || 'overview';
    this.turmaData = turmaData || this.buildEmptyTurma();
  this._scheduleInitialized = false;
  this.scheduleError = null;

    this.showLoadingState('Carregando dados da turma...');

    try {
      console.debug('🔍 [TurmasDetailView] Starting render - turmaData:', this.turmaData);
      
      console.debug('🔍 [TurmasDetailView] Loading support lists...');
      await this.loadSupportLists();
      console.debug('🔍 [TurmasDetailView] Support lists loaded successfully');
      
      console.debug('🔍 [TurmasDetailView] Loading courses data...');
      await this.loadCoursesData();
      console.debug('🔍 [TurmasDetailView] Courses data loaded successfully');

      console.debug('🔍 [TurmasDetailView] Rendering HTML...');
      this.renderHTML();
      console.debug('🔍 [TurmasDetailView] HTML rendered successfully');
      
      console.debug('🔍 [TurmasDetailView] Applying form values...');
      this.applyFormValues();
      console.debug('🔍 [TurmasDetailView] Form values applied successfully');
      
      console.debug('🔍 [TurmasDetailView] Attaching event listeners...');
      this.attachEventListeners();
      console.debug('🔍 [TurmasDetailView] Event listeners attached successfully');
      
      console.debug('🔍 [TurmasDetailView] Refreshing courses content...');
      this.refreshCoursesContent();
      console.debug('🔍 [TurmasDetailView] Courses content refreshed successfully');

  console.debug('🔍 [TurmasDetailView] Initializing dynamic sections...');
  await this.initializeDynamicSections();
  console.debug('🔍 [TurmasDetailView] Dynamic sections initialized successfully');
      
      console.debug('🔍 [TurmasDetailView] Switching to tab:', this.currentTab);
      this.switchTab(this.currentTab);
      console.debug('🔍 [TurmasDetailView] Render completed successfully');
    } catch (error) {
      console.error('❌ [TurmasDetailView] Render failed:', error);
      console.error('❌ [TurmasDetailView] Error stack:', error.stack);
      this.reportError(error, 'Erro durante renderização da view');
      this.showErrorState('Não foi possível carregar os dados da turma.', () => {
        this.render(container, turmaData, options);
      });
    }
  }

  async loadSupportLists() {
    try {
      const [instructorsRes, unitsRes, organizationsRes] = await Promise.all([
        this.service.getInstructors?.(),
        this.service.getUnits?.(),
        this.service.getOrganizations?.(),
      ]);

      this.instructors = this.parseResult(instructorsRes, []);
      this.units = this.parseResult(unitsRes, []);
      this.organizations = this.parseResult(organizationsRes, []);
    } catch (error) {
      this.reportError(error, 'Falha ao carregar referências da turma');
      throw error;
    }
  }

  async loadCoursesData({ force = false } = {}) {
    // Prevent duplicate background calls unless force reload requested
    if (this._coursesDataLoaded && !force) return;

    this.coursesLoading = true;
    this.coursesError = null;

    try {
      const availableResponse = await this.service.getAvailableCourses?.();
      this.availableCourses = this.parseResult(availableResponse, []);

      if (this.turmaData.id && this.service.getTurmaCourses) {
        const turmaCoursesResponse = await this.service.getTurmaCourses(this.turmaData.id);
        const rawCourses = this.parseResult(turmaCoursesResponse, []);
        this.turmaCourses = rawCourses.map((item) => (item?.course ? item.course : item));
      } else {
        this.turmaCourses = [];
      }
      this._coursesDataLoaded = true;
    } catch (error) {
      this.coursesError = error;
      this.reportError(error, 'Falha ao carregar cursos da turma');
    } finally {
      this.coursesLoading = false;
    }
  }

  parseResult(response, fallback) {
    // Accept several shapes:
    // 1) { success: true, data: [...] }
    // 2) Cached value already in desired form (array)
    // 3) Plain object data (fallback to provided)
    console.debug('🔍 [TurmasDetailView] parseResult - input:', response, 'fallback:', fallback);
    
    if (!response) {
      console.debug('🔍 [TurmasDetailView] parseResult - no response, returning fallback');
      return fallback;
    }

    // If it's already an array, return directly
    if (Array.isArray(response)) {
      console.debug('🔍 [TurmasDetailView] parseResult - response is array, returning directly');
      return response;
    }

    // If it looks like fetchWithStates response
    if (typeof response === 'object' && 'success' in response) {
      if (response.success) {
        console.debug('🔍 [TurmasDetailView] parseResult - success response, returning data:', response.data);
        return response.data || fallback;
      }
      console.error('❌ [TurmasDetailView] parseResult - failed response:', response);
      throw new Error(response.message || 'Operação inválida');
    }

    // Unknown shape—return fallback to avoid crashing the view
    console.debug('🔍 [TurmasDetailView] parseResult - unknown shape, returning fallback');
    return fallback;
  }

  reportError(error, context) {
    console.error(`[TurmasDetailView] ${context}`, error);
    if (window.app?.handleError) {
      window.app.handleError(error, { module: 'turmas', context });
    }
  }

  renderHTML() {
    console.debug('🔍 [TurmasDetailView] renderHTML - starting render');
    console.debug('🔍 [TurmasDetailView] renderHTML - turmaData:', this.turmaData);
    console.debug('🔍 [TurmasDetailView] renderHTML - turmaCourses:', this.turmaCourses);
    
    try {
      const header = this.renderHeader();
      console.debug('🔍 [TurmasDetailView] renderHTML - header rendered');
      
      const stats = this.renderHeaderStats();
      console.debug('🔍 [TurmasDetailView] renderHTML - stats rendered');
      
      const quickPanel = this.isCreateMode ? this.renderCreateHints() : this.renderQuickHighlights();
      console.debug('🔍 [TurmasDetailView] renderHTML - quickPanel rendered');
      
      const tabs = this.renderTabs();
      console.debug('🔍 [TurmasDetailView] renderHTML - tabs rendered');
      
      const extras = this.isCreateMode ? '' : this.renderAdditionalActions();
      console.debug('🔍 [TurmasDetailView] renderHTML - extras rendered');

      this.container.innerHTML = `
        <div class="module-isolated-turmas module-turmas-detail">
          ${header}
          ${stats}
          ${quickPanel}
          ${tabs}
          ${extras}
        </div>
      `;
      
      console.debug('🔍 [TurmasDetailView] renderHTML - HTML inserted into container');

      this.wrapper = this.container.querySelector('.module-isolated-turmas');
      console.debug('🔍 [TurmasDetailView] renderHTML - wrapper element found:', !!this.wrapper);
      
      if (this.wrapper) {
        const coursesCount = Array.isArray(this.turmaCourses) ? this.turmaCourses.length : 0;
        const studentsCount = Array.isArray(this.turmaData?.students) ? this.turmaData.students.length : 0;
        
        this.updateTabBadge('courses', coursesCount);
        this.updateTabBadge('students', studentsCount);
        console.debug('🔍 [TurmasDetailView] renderHTML - tab badges updated');
      }
      
      console.debug('🔍 [TurmasDetailView] renderHTML - completed successfully');
    } catch (error) {
      console.error('❌ [TurmasDetailView] renderHTML - error:', error);
      throw error;
    }
  }

  renderHeader() {
    const title = this.isCreateMode ? 'Nova Turma' : this.escapeHTML(this.turmaData.name || 'Turma');
    const subtitle = this.isCreateMode
      ? 'Configure todos os detalhes antes de salvar a turma.'
      : 'Edição completa da turma em um painel unificado.';

    const actions = this.isCreateMode
      ? `
        <button class="btn-action-secondary" data-action="cancel-create">← Cancelar</button>
        <button class="btn-action-premium" data-action="create-turma">
          <span class="icon">💾</span>
          <span>Criar Turma</span>
        </button>
      `
      : `
        <button class="btn-action-secondary" data-action="back-to-list">← Voltar</button>
      `;

    return `
      <header class="module-header-premium">
        <div class="module-header-content">
          <div>
            <nav class="module-breadcrumb">
              <span class="breadcrumb-item clickable" data-navigate="/">Dashboard</span>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-item clickable" data-navigate="/turmas">Turmas</span>
              <span class="breadcrumb-separator">/</span>
              <span class="breadcrumb-item active">${title}</span>
            </nav>
            <h1 class="module-title">${title}</h1>
            <p class="module-subtitle">${subtitle}</p>
          </div>
          <div class="module-header-actions">
            ${actions}
          </div>
        </div>
      </header>
    `;
  }

  renderHeaderStats() {
    const status = this.getStatusText(this.turmaData.status);
    const startDate = this.turmaData.startDate ? this.formatDateForDisplay(this.turmaData.startDate) : 'Defina a data';
    const students = this.turmaData.students?.length || 0;
    const progress = this.calculateProgress();

    return `
      <section class="stats-grid-premium" id="turmaStatsSection">
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number" id="turmaStatusValue">${status}</div>
            <div class="stat-label">Status atual</div>
          </div>
          <div class="stat-card-icon">📊</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number" id="turmaStartDateValue">${startDate}</div>
            <div class="stat-label">Início planejado</div>
          </div>
          <div class="stat-card-icon">📅</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number" id="turmaStudentsValue">${students}</div>
            <div class="stat-label">Alunos vinculados</div>
          </div>
          <div class="stat-card-icon">👥</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number" id="turmaProgressValue">${progress}%</div>
            <div class="stat-label">Progresso das aulas</div>
          </div>
          <div class="stat-card-icon">🔥</div>
        </article>
      </section>
    `;
  }

  renderCreateHints() {
    return `
      <section class="data-card-premium">
        <div class="data-card-header">
          <div>
            <h3>⚙️ Configuração Inicial</h3>
            <p>Preencha os formulários abaixo para habilitar todas as funcionalidades premium da turma.</p>
          </div>
        </div>
        <div class="data-card-body">
          <ul class="premium-checklist">
            <li>📋 Defina informações básicas e responsáveis.</li>
            <li>📅 Ajuste cronograma com dias, horário e duração.</li>
            <li>🎓 Após salvar, vincule cursos específicos ao grupo.</li>
          </ul>
        </div>
      </section>
    `;
  }

  renderQuickHighlights() {
    const courseName = this.getCourseNameById(this.turmaData.courseId) || 'Selecione um curso principal';
    const instructorName = this.getInstructorNameById(this.turmaData.instructorId) || 'Defina um instrutor responsável';
    const nextLesson = this.getNextLessonSummary();

    return `
      <section class="data-card-premium" id="quickHighlightsCard">
        <div class="data-card-header">
          <div>
            <h3>✨ Insights Rápidos</h3>
            <p>Mantenha a turma sob controle com métricas essenciais.</p>
          </div>
        </div>
        <div class="data-card-body quick-highlights-grid">
          <div class="highlight-item">
            <span class="highlight-icon">📘</span>
            <div>
              <strong>Curso principal</strong>
              <p id="turmaCourseName">${courseName}</p>
            </div>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">🧑‍🏫</span>
            <div>
              <strong>Instrutor</strong>
              <p id="turmaInstructorName">${instructorName}</p>
            </div>
          </div>
          <div class="highlight-item">
            <span class="highlight-icon">⏭️</span>
            <div>
              <strong>Próxima aula</strong>
              <p id="turmaNextLessonValue">${nextLesson}</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderTabs() {
    return `
      <section class="tabs-container premium-tabs">
        <nav class="tabs-nav">
          ${this.renderTabButton('overview', '👁️', 'Visão Geral')}
          ${this.renderTabButton('courses', '🎓', 'Cursos', this.turmaCourses.length || 0)}
          ${this.renderTabButton('students', '👥', 'Alunos', this.turmaData.students?.length || 0)}
          ${this.renderTabButton('schedule', '📅', 'Cronograma')}
        </nav>
        <div class="tabs-content">
          <div id="tab-overview" class="tab-panel">${this.renderOverviewTab()}</div>
          <div id="tab-courses" class="tab-panel">${this.renderCoursesTab()}</div>
          <div id="tab-students" class="tab-panel">${this.renderStudentsTab()}</div>
          <div id="tab-schedule" class="tab-panel">${this.renderScheduleTab()}</div>
        </div>
      </section>
    `;
  }

  renderTabButton(tab, icon, label, badgeValue) {
    const isActive = this.currentTab === tab;
    const badge = badgeValue !== undefined ? `<span class="tab-badge">${badgeValue}</span>` : '';

    return `
      <button class="tab-button ${isActive ? 'active' : ''}" data-tab="${tab}">
        <span class="icon">${icon}</span>
        <span>${label}</span>
        ${badge}
      </button>
    `;
  }

  renderOverviewTab() {
    return `
      <div class="overview-vertical-layout">
        ${this.renderBasicInfoForm()}
        ${this.renderScheduleForm()}
        
        <!-- Botão único de salvar -->
        <div class="form-actions-footer">
          <button type="button" class="btn-action-secondary" id="cancelEdit">
            <span class="icon">❌</span>
            <span>Cancelar</span>
          </button>
          <button type="button" class="btn-action-premium btn-save-all" id="saveAllOverview">
            <span class="icon">💾</span>
            <span>Salvar Turma</span>
          </button>
        </div>
      </div>
    `;
  }

  renderBasicInfoForm() {
    return `
      <form id="turmaBasicForm" class="data-card-premium">
        <div class="data-card-header">
          <div>
            <h3>📋 Informações Básicas</h3>
            <p>Informações essenciais para identificar e organizar a turma.</p>
          </div>
        </div>
        <div class="data-card-body form-grid">
          ${this.renderTextInput('name', 'Nome da Turma', this.turmaData.name, {
            icon: '📛',
            placeholder: 'Ex: Turma Kids Faixa Branca',
            required: true,
          })}
          ${this.renderTextarea('description', 'Descrição', this.turmaData.description, {
            icon: '📝',
            placeholder: 'Detalhe a proposta, faixa etária e objetivos.',
          })}
          ${this.renderSelect('courseId', 'Curso Principal', this.turmaData.courseId, this.getCourseOptionsForForm(), {
            icon: '📚',
            required: true,
          })}
          ${this.renderSelect('instructorId', 'Instrutor Responsável', this.turmaData.instructorId, this.getInstructorOptions(), {
            icon: '👨‍🏫',
            required: true,
          })}
          ${this.renderSelect('organizationId', 'Organização', this.turmaData.organizationId, this.getOrganizationOptions(), {
            icon: '🏢',
          })}
          ${this.renderSelect('unitId', 'Unidade', this.turmaData.unitId, this.getUnitOptions(), {
            icon: '📍',
          })}
          ${this.renderSelect('classType', 'Formato da Turma', this.turmaData.classType, [
            { value: 'COLLECTIVE', label: 'Coletiva' },
            { value: 'PRIVATE', label: 'Particular' },
            { value: 'SEMI_PRIVATE', label: 'Semi-particular' },
          ], {
            icon: '🎯',
            required: true,
          })}
          ${this.renderSelect('status', 'Status', this.turmaData.status, [
            { value: 'SCHEDULED', label: 'Agendada' },
            { value: 'ACTIVE', label: 'Ativa' },
            { value: 'COMPLETED', label: 'Concluída' },
            { value: 'CANCELLED', label: 'Cancelada' },
          ], {
            icon: '📈',
          })}
          ${this.renderNumberInput('maxStudents', 'Limite de Alunos', this.turmaData.maxStudents, {
            icon: '👥',
            min: 1,
            placeholder: 'Ex: 20',
          })}
        </div>
      </form>
    `;
  }

  renderScheduleForm() {
    return `
      <form id="turmaScheduleForm" class="data-card-premium">
        <div class="data-card-header">
          <div>
            <h3>📅 Cronograma</h3>
            <p>Defina datas, dias e duração dos encontros.</p>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-action-secondary" id="clearEndDate">
              <span class="icon">🧹</span>
              <span>Remover término</span>
            </button>
          </div>
        </div>
        <div class="data-card-body form-grid">
          ${this.renderDateInput('startDate', 'Data de Início', this.turmaData.startDate, {
            icon: '🚀',
            required: true,
          })}
          ${this.renderDateInput('endDate', 'Data de Término', this.turmaData.endDate, {
            icon: '🏁',
            allowNull: true,
          })}
          ${this.renderDaysOfWeekField(this.turmaData.schedule?.daysOfWeek || [])}
          ${this.renderTimeInput('schedule.time', 'Horário', this.turmaData.schedule?.time)}
          ${this.renderNumberInput('schedule.duration', 'Duração (min)', this.turmaData.schedule?.duration, {
            icon: '⏱️',
            min: 10,
            step: 5,
          })}
        </div>
      </form>
    `;
  }

  renderCoursesTab() {
    if (this.isCreateMode) {
      return `
        <div class="data-card-premium">
          <div class="data-card-header">
            <div>
              <h3>🎓 Cursos vinculados</h3>
              <p>Salve a turma para começar a vincular cursos complementares.</p>
            </div>
          </div>
          <div class="data-card-body">
            ${this.renderEmptyState('Cadastre a turma primeiro', 'Crie a turma para liberar a gestão de cursos adicionais.', {
              icon: '📝',
            })}
          </div>
        </div>
      `;
    }

    const unassignedCourses = this.getUnassignedCourses();
    const options = unassignedCourses
      .map((course) => `<option value="${course.id}">${this.escapeHTML(course.name)}</option>`)
      .join('');

    return `
      <div class="courses-management">
        <div class="data-card-premium">
          <div class="data-card-header">
            <div>
              <h3>🎓 Cursos vinculados</h3>
              <p>Associe cursos que complementam o plano de aulas da turma.</p>
            </div>
            <div class="card-actions">
              <form id="addCourseToTurmaForm">
                <select id="courseToAdd" name="courseId" class="form-select-premium" ${unassignedCourses.length === 0 ? 'disabled' : ''}>
                  <option value="">${unassignedCourses.length === 0 ? 'Todos os cursos já foram vinculados' : 'Selecione um curso para adicionar'}</option>
                  ${options}
                </select>
                <button type="submit" class="btn-action-premium" ${unassignedCourses.length === 0 ? 'disabled' : ''}>
                  <span class="icon">➕</span>
                  <span>Adicionar</span>
                </button>
              </form>
            </div>
          </div>
          <div class="data-card-body" id="coursesContent">
            ${this.renderCoursesContent()}
          </div>
        </div>
      </div>
    `;
  }

  renderCoursesContent() {
    if (this.coursesLoading) {
      return this.renderLoadingState('Carregando cursos vinculados...');
    }

    if (this.coursesError) {
      return this.renderErrorState('Não foi possível carregar os cursos vinculados.', {
        actionLabel: 'Tentar novamente',
        actionId: 'retry-courses',
      });
    }

    if (!this.turmaCourses.length) {
      return this.renderEmptyState('Nenhum curso vinculado', 'Adicione cursos para enriquecer os conteúdos desta turma.', {
        icon: '📚',
        actionLabel: 'Adicionar curso',
        actionId: 'focus-course-select',
      });
    }

    return `
      <div class="selected-courses">
        ${this.turmaCourses.map((course) => this.renderCourseCard(course)).join('')}
      </div>
    `;
  }

  renderCourseCard(course) {
    const description = course.description || 'Sem descrição cadastrada.';
    const level = course.level || 'Nível não informado';

    return `
      <article class="course-item" data-course-id="${course.id}">
        <div class="course-info">
          <h4>${this.escapeHTML(course.name)}</h4>
          <p>${this.escapeHTML(description)}</p>
          <span class="course-level">${this.escapeHTML(level)}</span>
        </div>
        <div class="course-actions">
          <button type="button" class="btn-action-secondary" data-action="remove-course" data-course-id="${course.id}">
            <span class="icon">🗑️</span>
            <span>Remover</span>
          </button>
        </div>
      </article>
    `;
  }

  renderStudentsTab() {
    const total = this.turmaData.students?.length || 0;

    return `
      <div class="data-card-premium">
        <div class="data-card-header">
          <div>
            <h3>👥 Alunos da turma</h3>
            <p>Gerencie matrículas, presenças e progresso individual.</p>
          </div>
        </div>
        <div class="data-card-body">
          ${this.renderEmptyState('Gestão de alunos em breve', `Atualmente ${total} aluno(s) estão vinculados. Em breve este painel trará ferramentas avançadas.`, {
            icon: '🛠️',
          })}
        </div>
      </div>
    `;
  }

  renderScheduleTab() {
    return `
      <div class="data-card-premium">
        <div class="data-card-header">
          <div>
            <h3>📆 Cronograma detalhado</h3>
            <p>Visualize aulas geradas automaticamente e eventos importantes.</p>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-action-secondary" data-action="open-schedule-view">
              <span class="icon">🗂️</span>
              <span>Ver cronograma completo</span>
            </button>
            <button type="button" class="btn-action-secondary" id="refreshLessons">
              <span class="icon">🔄</span>
              <span>Atualizar</span>
            </button>
          </div>
        </div>
        <div class="data-card-body">
          <div id="scheduleOverviewContent" class="schedule-overview-content">
            ${this.renderEmptyState('Cronograma dinâmico', 'Carregue as aulas geradas ou regenere o cronograma para visualizar os detalhes.', {
              icon: '⏳',
              actionLabel: 'Gerar cronograma',
              actionId: 'schedule-generate-action',
            })}
          </div>
        </div>
      </div>
    `;
  }

  renderAdditionalActions() {
    return `
      <section class="additional-actions premium-actions-grid">
        <div class="data-card-premium">
          <div class="data-card-header">
            <div>
              <h3>⚙️ Ações rápidas</h3>
              <p>Atalhos para manter a turma atualizada.</p>
            </div>
          </div>
          <div class="data-card-body quick-actions-grid">
            <button class="btn-action-secondary" data-action="generate-schedule">
              <span class="icon">📅</span>
              <span>Regenerar cronograma</span>
            </button>
            <button class="btn-action-secondary" data-action="duplicate-turma">
              <span class="icon">📋</span>
              <span>Duplicar turma</span>
            </button>
            <button class="btn-action-danger" data-action="delete-turma">
              <span class="icon">🗑️</span>
              <span>Excluir turma</span>
            </button>
          </div>
        </div>
      </section>
    `;
  }

  attachEventListeners() {
    if (!this.wrapper) return;

    this.setupNavigation();
    this.setupHeaderActions();
    this.setupFormActions();
    this.setupCoursesEvents();
    this.setupScheduleEvents();
    this.setupAdditionalActions();
  }

  setupNavigation() {
    this.wrapper.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', (event) => {
        const tab = event.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  setupHeaderActions() {
    this.wrapper.querySelector('[data-action="back-to-list"]')?.addEventListener('click', () => {
      this.controller.navigateToList();
    });

    this.wrapper.querySelector('[data-action="cancel-create"]')?.addEventListener('click', () => {
      this.controller.navigateToList();
    });

    this.wrapper.querySelector('[data-action="create-turma"]')?.addEventListener('click', () => this.handleCreateTurma());
  }

  setupFormActions() {
    // Botão único de salvar tudo (Overview tab)
    this.wrapper.querySelector('#saveAllOverview')?.addEventListener('click', () => this.saveAllOverview());
    
    // Botão de cancelar
    this.wrapper.querySelector('#cancelEdit')?.addEventListener('click', () => {
      if (this.isCreateMode) {
        this.controller.navigateToList();
      } else {
        // Reverter mudanças
        this.resetBasicForm();
        this.resetScheduleForm();
      }
    });
    
    // Manter botões individuais legacy (para outras abas se necessário)
    this.wrapper.querySelector('#saveBasicInfo')?.addEventListener('click', () => this.saveBasicChanges());
    this.wrapper.querySelector('#resetBasicInfo')?.addEventListener('click', () => this.resetBasicForm());

    this.wrapper.querySelector('#saveSchedule')?.addEventListener('click', () => this.saveScheduleChanges());
    this.wrapper.querySelector('#resetSchedule')?.addEventListener('click', () => this.resetScheduleForm());
    this.wrapper.querySelector('#clearEndDate')?.addEventListener('click', () => this.clearEndDate());
  }

  setupCoursesEvents() {
    if (this.isCreateMode || !this.wrapper) return;

    const addForm = this.wrapper.querySelector('#addCourseToTurmaForm');
    const coursesContent = this.wrapper.querySelector('#coursesContent');

    addForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const select = addForm.querySelector('#courseToAdd');
      const courseId = select?.value;

      if (!courseId) {
        this.showError('Selecione um curso para adicionar.');
        return;
      }

      await this.handleAddCourse(courseId);
    });

    coursesContent?.addEventListener('click', async (event) => {
      const remove = event.target.closest('[data-action="remove-course"]');
      if (remove) {
        const courseId = remove.dataset.courseId;
        await this.handleRemoveCourse(courseId);
      }

      const focusSelect = event.target.closest('[data-action="focus-course-select"]');
      if (focusSelect) {
        this.wrapper.querySelector('#courseToAdd')?.focus();
      }

      const retry = event.target.closest('[data-action="retry-courses"]');
      if (retry) {
        this.reloadCourses();
      }
    });
  }

  setupScheduleEvents() {
    if (this.isCreateMode || !this.wrapper) return;

    const refreshButton = this.wrapper.querySelector('#refreshLessons');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.populateScheduleOverview({ forceReload: true, manualTrigger: true });
      });
    }

    const openScheduleButton = this.wrapper.querySelector('[data-action="open-schedule-view"]');
    if (openScheduleButton) {
      openScheduleButton.addEventListener('click', () => {
        if (this.turmaData?.id) {
          this.controller.showSchedule(this.turmaData.id);
        }
      });
    }
  }

  setupAdditionalActions() {
    if (!this.wrapper || this.isCreateMode) return;

    this.wrapper.querySelector('[data-action="generate-schedule"]')?.addEventListener('click', () => this.handleGenerateSchedule());
    this.wrapper.querySelector('[data-action="duplicate-turma"]')?.addEventListener('click', () => this.handleDuplicate());
    this.wrapper.querySelector('[data-action="delete-turma"]')?.addEventListener('click', () => this.handleDelete());
  }

  switchTab(tab) {
    this.currentTab = tab;

    this.wrapper?.querySelectorAll('.tab-button').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    this.wrapper?.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${tab}`);
    });
  }

  async initializeDynamicSections() {
    if (this.isCreateMode) return;
    this.updateStatsAndHighlights();
    await this.populateScheduleOverview();
  }

  async populateScheduleOverview({ forceReload = false, manualTrigger = false } = {}) {
    if (this.isCreateMode || !this.wrapper || !this.turmaData?.id) return;

    const content = this.wrapper.querySelector('#scheduleOverviewContent');
    if (!content) return;

    if (manualTrigger) this.toggleRefreshButton(true);

    try {
      let shouldFetch = forceReload;

      if (!Array.isArray(this.turmaData?.lessons)) {
        shouldFetch = true;
      } else if (!this.turmaData.lessons.length && !this._scheduleInitialized) {
        shouldFetch = true;
      }

      if (shouldFetch && this.service.getLessons) {
        this.scheduleLoading = true;
        content.innerHTML = this.renderLoadingState('Carregando cronograma...');
        const lessonsResponse = await this.service.getLessons(this.turmaData.id);
        const lessons = this.parseResult(lessonsResponse, []);
        this.turmaData.lessons = Array.isArray(lessons) ? lessons : [];
      }

      this._scheduleInitialized = true;

      const lessonsToRender = Array.isArray(this.turmaData?.lessons) ? this.turmaData.lessons : [];
      content.innerHTML = this.renderScheduleOverviewContent(lessonsToRender);
      this.attachScheduleContentEvents();
      this.updateStatsAndHighlights();
      this.scheduleError = null;
    } catch (error) {
      this.scheduleError = error;
      this.reportError(error, 'Falha ao carregar cronograma da turma');
      content.innerHTML = this.renderErrorState('Não foi possível carregar o cronograma da turma.', {
        actionLabel: 'Tentar novamente',
        actionId: 'retry-lessons-load',
      });

      const retryButton = content.querySelector('[data-action="retry-lessons-load"]');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          this.populateScheduleOverview({ forceReload: true, manualTrigger: true });
        });
      }
    } finally {
      this.scheduleLoading = false;
      if (manualTrigger) this.toggleRefreshButton(false);
    }
  }

  renderScheduleOverviewContent(lessons = []) {
    if (!lessons.length) {
      return this.renderEmptyState('Cronograma dinâmico', 'Nenhuma aula foi gerada ainda para esta turma.', {
        icon: '🗓️',
        actionLabel: 'Gerar cronograma',
        actionId: 'schedule-generate-action',
      });
    }

    const sortedLessons = this.sortLessonsByDate(lessons);
    const completedLessons = sortedLessons.filter((lesson) => this.isLessonCompleted(lesson)).length;
    const upcomingLessons = sortedLessons.filter((lesson) => this.isLessonUpcoming(lesson));
    const previewLessons = (upcomingLessons.length ? upcomingLessons : sortedLessons).slice(0, 6);
    const nextLesson = upcomingLessons[0] || sortedLessons[0];
    const nextLessonDateValue = this.getLessonDateValue(nextLesson);
    const nextLessonDate = nextLessonDateValue ? this.formatDateForDisplay(nextLessonDateValue) : '--';
    const nextLessonTime = nextLessonDateValue ? this.formatTimeForDisplay(nextLessonDateValue) : '--';
  const nextLessonLabel = nextLesson ? this.formatLessonDisplayTitle(nextLesson) : 'Sem aulas futuras';
    const progress = this.calculateProgress();

    return `
      <div class="schedule-overview-summary">
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number">${sortedLessons.length}</div>
            <div class="stat-label">Total de aulas</div>
          </div>
          <div class="stat-card-icon">🗓️</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number">${completedLessons}</div>
            <div class="stat-label">Aulas concluídas</div>
          </div>
          <div class="stat-card-icon">✅</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number">${progress}%</div>
            <div class="stat-label">Progresso do cronograma</div>
          </div>
          <div class="stat-card-icon">📈</div>
        </article>
        <article class="stat-card-enhanced">
          <div class="stat-card-content">
            <div class="stat-number">${nextLessonDate} • ${nextLessonTime}</div>
            <div class="stat-label">Próxima aula: ${this.escapeHTML(nextLessonLabel)}</div>
          </div>
          <div class="stat-card-icon">⏭️</div>
        </article>
      </div>
      <div class="schedule-lessons-preview">
        <h4>Próximas aulas</h4>
        <ul class="schedule-lessons-list">
          ${previewLessons.length
            ? previewLessons.map((lesson) => this.renderScheduleLessonItem(lesson)).join('')
            : '<li class="schedule-lesson-item">Sem aulas futuras registradas.</li>'}
        </ul>
      </div>
    `;
  }

  renderScheduleLessonItem(lesson) {
    const dateValue = this.getLessonDateValue(lesson);
    const dateLabel = this.formatDateForDisplay(dateValue);
    const timeLabel = this.formatTimeForDisplay(dateValue);
    const statusLabel = this.getLessonStatusLabel(lesson?.status);
    const statusIcon = this.getLessonStatusIcon(lesson?.status);
    const title = this.escapeHTML(this.formatLessonDisplayTitle(lesson));
    const lessonId = lesson?.id ? String(lesson.id) : '';
    const turmaId = lesson?.turmaId
      ? String(lesson.turmaId)
      : this.turmaData?.id
        ? String(this.turmaData.id)
        : '';
    const lessonDateKey = this.getLessonDateKey(dateValue) || '';
    const lessonTimeKey = this.getLessonTimeKey(dateValue) || '';

    return `
      <li class="schedule-lesson-item is-clickable"
          data-lesson-id="${this.escapeHTML(lessonId)}"
          data-turma-id="${this.escapeHTML(turmaId)}"
          data-lesson-date="${lessonDateKey}"
          data-lesson-time="${lessonTimeKey}"
          role="button"
          tabindex="0"
          aria-label="Abrir agenda na data desta aula">
        <span class="lesson-status-icon">${statusIcon}</span>
        <div class="lesson-details">
          <p class="lesson-title">${title}</p>
          <p class="lesson-meta">${dateLabel} • ${timeLabel} • ${statusLabel}</p>
        </div>
      </li>
    `;
  }

  formatLessonDisplayTitle(lesson) {
    if (!lesson) {
      return 'Aula';
    }

    const number = lesson.lessonNumber;
    const rawTitle = (lesson.title || lesson.lessonPlan?.title || '').trim();

    if (!number) {
      return rawTitle || 'Aula';
    }

    if (!rawTitle) {
      return `Aula ${number}`;
    }

    const match = rawTitle.match(/^Aula\s+\d+\s*[-:–]?\s*(.*)$/i);
    if (match) {
      const suffix = match[1]?.trim();
      return suffix ? `Aula ${number} - ${suffix}` : `Aula ${number}`;
    }

    return `Aula ${number} - ${rawTitle}`;
  }

  getLessonDateValue(lesson) {
    if (!lesson) return null;
    return lesson.scheduledDate || lesson.date || lesson.actualDate || null;
  }

  getLessonDateKey(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getLessonTimeKey(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  sortLessonsByDate(lessons = []) {
    return [...lessons].sort((a, b) => {
      const valueA = this.getLessonDateValue(a);
      const valueB = this.getLessonDateValue(b);
      const dateA = valueA ? new Date(valueA) : null;
      const dateB = valueB ? new Date(valueB) : null;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA - dateB;
    });
  }

  isLessonCompleted(lesson) {
    const status = (lesson?.status || '').toUpperCase();
    return status === 'COMPLETED' || status === 'CONFIRMED';
  }

  isLessonUpcoming(lesson) {
    const rawDate = this.getLessonDateValue(lesson);
    if (!rawDate) return false;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();
    return date >= now;
  }

  getLessonStatusLabel(status) {
    const normalized = (status || '').toUpperCase();
    const map = {
      SCHEDULED: 'Agendada',
      CONFIRMED: 'Confirmada',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      MISSED: 'Ausência',
      IN_PROGRESS: 'Em andamento',
      DRAFT: 'Rascunho',
    };
    return map[normalized] || 'Agendada';
  }

  getLessonStatusIcon(status) {
    const normalized = (status || '').toUpperCase();
    switch (normalized) {
      case 'COMPLETED':
      case 'CONFIRMED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      case 'IN_PROGRESS':
        return '⏳';
      case 'MISSED':
        return '⚠️';
      default:
        return '📘';
    }
  }

  formatTimeForDisplay(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  toggleRefreshButton(isLoading) {
    const button = this.wrapper?.querySelector('#refreshLessons');
    if (!button) return;

    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = button.innerText;
    }

    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);

    const icon = button.querySelector('.icon');
    if (icon) {
      icon.textContent = isLoading ? '⏳' : '🔄';
    }

    const label = button.querySelector('span:not(.icon)');
    if (label) {
      label.textContent = isLoading ? 'Atualizando...' : 'Atualizar';
    }
  }

  attachScheduleContentEvents() {
    if (!this.wrapper) return;

    const generateButton = this.wrapper.querySelector('#scheduleOverviewContent [data-action="schedule-generate-action"]');
    if (generateButton) {
      generateButton.addEventListener('click', () => this.handleGenerateSchedule());
    }

    const scheduleContent = this.wrapper.querySelector('#scheduleOverviewContent');
    if (scheduleContent) {
      scheduleContent.querySelectorAll('.schedule-lesson-item.is-clickable').forEach((item) => {
        item.addEventListener('click', () => this.handleLessonNavigation(item));
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleLessonNavigation(item);
          }
        });
      });
    }
  }

  handleLessonNavigation(element) {
    if (!element) return;

    const lessonDate = element.dataset.lessonDate;
    const lessonId = element.dataset.lessonId || '';
    const turmaId = element.dataset.turmaId || (this.turmaData?.id ? String(this.turmaData.id) : '');

    if (!lessonDate) {
      console.warn('[TurmasDetailView] Navegação para agenda ignorada: data ausente');
      return;
    }

    this.navigateToAgenda(lessonDate, { lessonId, turmaId });
  }

  async navigateToAgenda(dateStr, { lessonId }) {
    try {
      safeNavigateTo('agenda', { context: 'turmas:lesson-link' });

      const agendaModule = await this.waitForAgendaModule();
      if (!agendaModule) {
        console.warn('[TurmasDetailView] Não foi possível localizar o módulo de agenda para navegação');
        return;
      }

      const agendaContainer = await this.ensureAgendaRendered();
      if (!agendaContainer) {
        console.warn('[TurmasDetailView] Não foi possível confirmar o carregamento do calendário na agenda');
      }

      if (typeof agendaModule.showDayClasses === 'function') {
        agendaModule.showDayClasses(dateStr);
      }

      if (agendaContainer && lessonId && typeof agendaModule.viewItemDetails === 'function') {
        const normalizedId = lessonId.startsWith('turmaLesson-') ? lessonId : `turmaLesson-${lessonId}`;
        setTimeout(() => agendaModule.viewItemDetails(normalizedId, 'TURMA'), 350);
      }
    } catch (error) {
      this.reportError(error, 'Falha ao abrir agenda pela turma');
    }
  }

  async waitForAgendaModule(attempt = 0) {
    const agendaModule = this.getAgendaModule();
    if (agendaModule) {
      if (!agendaModule.isInitialized && typeof agendaModule.initialize === 'function') {
        try {
          await agendaModule.initialize();
        } catch (error) {
          console.error('[TurmasDetailView] Falha ao inicializar módulo de agenda', error);
        }
      }
      return agendaModule;
    }

    if (attempt >= 20) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    return this.waitForAgendaModule(attempt + 1);
  }

  getAgendaModule() {
    if (window.app?.getModule) {
      const module = window.app.getModule('agenda');
      if (module) return module;
    }
    if (window.agendaModule) {
      return window.agendaModule;
    }
    return null;
  }

  async ensureAgendaRendered(attempt = 0) {
    const container = document.getElementById('calendarContent');
    if (container) {
      return container;
    }

    if (attempt >= 20) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    return this.ensureAgendaRendered(attempt + 1);
  }

  updateStatsAndHighlights() {
    this.updateStatsCards();
    this.updateQuickHighlightsSection();
  }

  updateStatsCards() {
    if (!this.wrapper) return;

    const statusEl = this.wrapper.querySelector('#turmaStatusValue');
    if (statusEl) {
      statusEl.textContent = this.getStatusText(this.turmaData.status);
    }

    const startDateEl = this.wrapper.querySelector('#turmaStartDateValue');
    if (startDateEl) {
      startDateEl.textContent = this.turmaData.startDate
        ? this.formatDateForDisplay(this.turmaData.startDate)
        : 'Defina a data';
    }

    const studentsEl = this.wrapper.querySelector('#turmaStudentsValue');
    if (studentsEl) {
      const totalStudents = this.turmaData.students?.length || 0;
      studentsEl.textContent = totalStudents;
    }

    const progressEl = this.wrapper.querySelector('#turmaProgressValue');
    if (progressEl) {
      progressEl.textContent = `${this.calculateProgress()}%`;
    }
  }

  updateQuickHighlightsSection() {
    if (!this.wrapper) return;

    const courseName = this.getCourseNameById(this.turmaData.courseId)
      || this.turmaData.course?.name
      || 'Selecione um curso principal';

    const instructorName = this.getInstructorNameById(this.turmaData.instructorId)
      || this.turmaData.instructor?.name
      || 'Defina um instrutor responsável';

    const nextLessonSummary = this.getNextLessonSummary();

    const courseEl = this.wrapper.querySelector('#turmaCourseName');
    if (courseEl) courseEl.textContent = courseName;

    const instructorEl = this.wrapper.querySelector('#turmaInstructorName');
    if (instructorEl) instructorEl.textContent = instructorName;

    const nextLessonEl = this.wrapper.querySelector('#turmaNextLessonValue');
    if (nextLessonEl) nextLessonEl.textContent = nextLessonSummary;
  }

  async handleAddCourse(courseId) {
    if (!this.turmaData?.id) return;

    this.coursesLoading = true;
    this.refreshCoursesContent();

    const response = await this.service.addCourseToTurma(this.turmaData.id, courseId);
    if (!response.success) {
      this.coursesLoading = false;
      this.showError(response.message || 'Erro ao vincular curso à turma.');
      this.refreshCoursesContent();
      return;
    }

    await this.loadCoursesData();
    this.refreshCoursesContent();
    this.updateTabBadge('courses', this.turmaCourses.length || 0);
    this.showSuccess('Curso vinculado com sucesso.');
  }

  async handleRemoveCourse(courseId) {
    if (!this.turmaData?.id) return;

    this.coursesLoading = true;
    this.refreshCoursesContent();

    const response = await this.service.removeCourseFromTurma(this.turmaData.id, courseId);
    if (!response.success) {
      this.coursesLoading = false;
      this.showError(response.message || 'Erro ao remover curso da turma.');
      this.refreshCoursesContent();
      return;
    }

    await this.loadCoursesData();
    this.refreshCoursesContent();
    this.updateTabBadge('courses', this.turmaCourses.length || 0);
    this.showSuccess('Curso removido da turma.');
  }

  async reloadCourses() {
    this.coursesLoading = true;
    this.refreshCoursesContent();
    // Force bypass guard + underlying service may deliver cached or fresh depending on its caching policy
    await this.loadCoursesData({ force: true });
    this.refreshCoursesContent();
    this.updateTabBadge('courses', this.turmaCourses.length || 0);
  }

  refreshCoursesContent() {
    if (this.isCreateMode) return;
    const container = this.wrapper?.querySelector('#coursesContent');
    if (!container) return;
    container.innerHTML = this.renderCoursesContent();
    this.setupCoursesEvents();
  }

  updateTabBadge(tab, value) {
    const badge = this.wrapper?.querySelector(`.tab-button[data-tab="${tab}"] .tab-badge`);
    if (badge) badge.textContent = value;
  }

  collectBasicFormData() {
    const form = this.wrapper?.querySelector('#turmaBasicForm');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {
      name: formData.get('name')?.trim() || '',
      description: formData.get('description')?.trim() || '',
      courseId: formData.get('courseId') || null,
      instructorId: formData.get('instructorId') || null,
      organizationId: formData.get('organizationId') || null,
      unitId: formData.get('unitId') || null,
      classType: formData.get('classType') || 'COLLECTIVE',
      status: formData.get('status') || 'SCHEDULED',
      maxStudents: formData.get('maxStudents') ? parseInt(formData.get('maxStudents'), 10) : null,
    };

    // Remove null values that should not be sent to the API
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === '') {
        delete data[key];
      }
    });

    if (data.maxStudents !== undefined && Number.isNaN(data.maxStudents)) {
      delete data.maxStudents;
    }
    if (data.classType && !data.type) data.type = data.classType;

    return data;
  }

  collectScheduleFormData() {
    const form = this.wrapper?.querySelector('#turmaScheduleForm');
    if (!form) return {};

    const formData = new FormData(form);
    const days = formData
      .getAll('schedule.daysOfWeek')
      .map((value) => parseInt(value, 10))
      .filter((value) => !Number.isNaN(value));

    const durationRaw = formData.get('schedule.duration');
    const duration = durationRaw ? parseInt(durationRaw, 10) : null;

    const schedule = {
      ...this.turmaData.schedule,
      daysOfWeek: days,
      time: formData.get('schedule.time') || '',
      duration: Number.isNaN(duration) ? null : duration,
    };

    // Convert dates to proper ISO format
    const data = {};
    
    const startDateRaw = formData.get('startDate');
    if (startDateRaw && startDateRaw.trim()) {
      // Convert YYYY-MM-DD to ISO datetime
      data.startDate = new Date(startDateRaw + 'T00:00:00.000Z').toISOString();
    }

    const endDateRaw = formData.get('endDate');
    if (endDateRaw && endDateRaw.trim()) {
      // Convert YYYY-MM-DD to ISO datetime  
      data.endDate = new Date(endDateRaw + 'T23:59:59.999Z').toISOString();
    }

    data.schedule = schedule;

    return data;
  }

  async saveBasicChanges() {
    const updates = this.collectBasicFormData();

    if (this.isCreateMode) {
      Object.assign(this.turmaData, updates);
      this.showSuccess('Dados básicos atualizados no rascunho.');
      return;
    }

    const response = await this.service.update(this.turmaData.id, updates);
    if (!response.success) {
      this.showError(response.message || 'Erro ao salvar informações básicas.');
      return;
    }

    Object.assign(this.turmaData, updates);
    await this.render(this.container, this.turmaData, { defaultTab: this.currentTab });
    this.showSuccess('Informações básicas atualizadas.');
  }
  
  /**
   * Salva todas as mudanças da aba Overview (informações básicas + cronograma)
   */
  async saveAllOverview() {
    console.log('💾 Salvando todas as informações da turma...');
    
    try {
      const basicData = this.collectBasicFormData();
      const scheduleData = this.collectScheduleFormData();
      
      // Combinar dados
      const updates = {
        ...basicData,
        ...scheduleData
      };
      
      console.log('📦 Dados coletados:', updates);
      
      // Modo criação: criar nova turma
      if (this.isCreateMode) {
        await this.handleCreateTurma();
        return;
      }
      
      // Modo edição: atualizar turma existente
      const response = await this.service.update(this.turmaData.id, updates);
      
      if (!response.success) {
        this.showError(response.message || 'Erro ao salvar turma.');
        return;
      }
      
      // Atualizar dados locais
      Object.assign(this.turmaData, updates);
      
      // Re-renderizar para refletir mudanças
      await this.render(this.container, this.turmaData, { defaultTab: this.currentTab });
      
      this.showSuccess('✅ Turma salva com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar turma:', error);
      this.showError('Erro inesperado ao salvar turma.');
      this.reportError(error, 'Erro ao salvar todas as informações');
    }
  }

  async saveScheduleChanges() {
    const updates = this.collectScheduleFormData();

    if (this.isCreateMode) {
      Object.assign(this.turmaData, updates);
      this.showSuccess('Cronograma atualizado no rascunho.');
      return;
    }

    const response = await this.service.update(this.turmaData.id, updates);
    if (!response.success) {
      this.showError(response.message || 'Erro ao salvar cronograma.');
      return;
    }

    Object.assign(this.turmaData, updates);
    await this.render(this.container, this.turmaData, { defaultTab: this.currentTab });
    this.showSuccess('Cronograma atualizado com sucesso.');
  }

  resetBasicForm() {
    this.applyBasicFormValues();
  }

  resetScheduleForm() {
    this.applyScheduleFormValues();
  }

  clearEndDate() {
    const form = this.wrapper?.querySelector('#turmaScheduleForm');
    if (!form) return;

    const endDateInput = form.querySelector('#endDate');
    if (endDateInput) endDateInput.value = '';

    if (this.isCreateMode) {
      this.turmaData.endDate = null;
      this.showSuccess('Data de término removida do rascunho.');
      return;
    }

    this.service
      .update(this.turmaData.id, { endDate: null })
      .then((response) => {
        if (!response.success) {
          this.showError(response.message || 'Erro ao remover data de término.');
          return;
        }
        this.turmaData.endDate = null;
        this.showSuccess('Data de término removida da turma.');
      })
      .catch((error) => this.reportError(error, 'Erro ao remover data de término'));
  }

  applyFormValues() {
    this.applyBasicFormValues();
    this.applyScheduleFormValues();
  }

  applyBasicFormValues() {
    const form = this.wrapper?.querySelector('#turmaBasicForm');
    if (!form) return;

    form.querySelector('#name').value = this.turmaData.name || '';
    form.querySelector('#description').value = this.turmaData.description || '';
    form.querySelector('#courseId').value = this.turmaData.courseId || '';
    form.querySelector('#instructorId').value = this.turmaData.instructorId || '';
    form.querySelector('#organizationId').value = this.turmaData.organizationId || '';
    form.querySelector('#unitId').value = this.turmaData.unitId || '';
    form.querySelector('#classType').value = this.turmaData.classType || 'COLLECTIVE';
    form.querySelector('#status').value = this.turmaData.status || 'SCHEDULED';
    form.querySelector('#maxStudents').value = this.turmaData.maxStudents ?? '';
  }

  applyScheduleFormValues() {
    const form = this.wrapper?.querySelector('#turmaScheduleForm');
    if (!form) return;

    // Use the corrected IDs with underscores
    const startDateInput = form.querySelector('#startDate');
    const endDateInput = form.querySelector('#endDate');
    const timeInput = form.querySelector('#schedule_time');
    const durationInput = form.querySelector('#schedule_duration');

    if (startDateInput) {
      startDateInput.value = this.formatDateForInput(this.turmaData.startDate);
    }
    if (endDateInput) {
      endDateInput.value = this.formatDateForInput(this.turmaData.endDate);
    }
    if (timeInput) {
      timeInput.value = this.turmaData.schedule?.time || '';
    }
    if (durationInput) {
      durationInput.value = this.turmaData.schedule?.duration ?? '';
    }

    const selectedDays = new Set(this.turmaData.schedule?.daysOfWeek || []);
    form.querySelectorAll('input[name="schedule.daysOfWeek"]').forEach((checkbox) => {
      checkbox.checked = selectedDays.has(parseInt(checkbox.value, 10));
    });
  }

  async handleCreateTurma() {
    try {
      const basic = this.collectBasicFormData();
      const schedule = this.collectScheduleFormData();
      const payload = { ...basic, ...schedule };

      if (payload.classType && !payload.type) payload.type = payload.classType;
      if (!payload.schedule) payload.schedule = this.turmaData.schedule;

      const errors = this.service.validateTurmaData
        ? this.service.validateTurmaData({ ...this.turmaData, ...payload })
        : [];

      if (errors.length) {
        this.showError(`Corrija os seguintes pontos antes de salvar:\n${errors.join('\n')}`);
        return;
      }

      const response = await this.service.create(payload);
      if (!response.success) {
        this.showError(response.message || 'Erro ao criar turma.');
        return;
      }

      const created = response.data || response;
      this.showSuccess('Turma criada com sucesso!');
      if (created.id) {
        this.controller.showView(created.id);
      } else {
        this.controller.navigateToList();
      }
    } catch (error) {
      this.reportError(error, 'Erro inesperado ao criar turma');
      this.showError('Erro inesperado ao criar turma.');
    }
  }

  async handleGenerateSchedule() {
    if (!this.turmaData?.id) return;
    if (!confirm('Deseja regenerar o cronograma da turma?')) return;

    try {
      await this.controller.generateSchedule(this.turmaData.id);
    } catch (error) {
      this.reportError(error, 'Erro ao regenerar cronograma');
      this.showError('Não foi possível regenerar o cronograma.');
    }
  }

  handleDuplicate() {
    this.controller.showCreate();
  }

  async handleDelete() {
    if (!this.turmaData?.id) return;
    if (!confirm('Tem certeza que deseja excluir esta turma? Essa ação não pode ser desfeita.')) return;

    try {
      await this.controller.deleteTurma(this.turmaData.id);
    } catch (error) {
      this.reportError(error, 'Erro ao excluir turma');
      this.showError('Não foi possível excluir a turma.');
    }
  }

  async refresh() {
    if (!this.turmaData?.id) return;

    try {
      const response = await this.service.getById(this.turmaData.id);
      const updatedTurma = this.parseResult(response, null);
      if (!updatedTurma) return;

      const currentTab = this.currentTab;
      this._scheduleInitialized = false;
      this.scheduleError = null;
      await this.render(this.container, updatedTurma, {
        isCreateMode: this.isCreateMode,
        defaultTab: currentTab,
      });
    } catch (error) {
      this.reportError(error, 'Erro ao atualizar dados da turma');
      this.showError('Não foi possível atualizar os dados da turma.');
    }
  }

  showLoadingState(message) {
    this.container.innerHTML = `
      <div class="module-isolated-turmas">
        ${this.renderLoadingState(message)}
      </div>
    `;
  }

  showErrorState(message, retryCallback) {
    this.container.innerHTML = `
      <div class="module-isolated-turmas">
        ${this.renderErrorState(message, { actionLabel: 'Tentar novamente', actionId: 'retry-render' })}
      </div>
    `;

    const retry = this.container.querySelector('[data-action="retry-render"]');
    if (retry && retryCallback) {
      retry.addEventListener('click', retryCallback);
    }
  }

  renderLoadingState(message) {
    return `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }

  renderErrorState(message, { title = 'Algo deu errado', actionLabel, actionId } = {}) {
    return `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>${title}</h3>
        <p>${message}</p>
        ${actionLabel ? `<button class="btn-action-premium" data-action="${actionId}">${actionLabel}</button>` : ''}
      </div>
    `;
  }

  renderEmptyState(title, description, { icon = '✨', actionLabel, actionId } = {}) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3>${title}</h3>
        <p>${description}</p>
        ${actionLabel ? `<button class="btn-action-secondary" data-action="${actionId}">${actionLabel}</button>` : ''}
      </div>
    `;
  }

  renderTextInput(name, label, value, { icon, placeholder = '', required = false } = {}) {
    return `
      <div class="form-group${name === 'description' ? ' span-2' : ''}">
        <label class="form-label${required ? ' required' : ''}" for="${name}">
          ${icon ? `<span class="form-label-icon">${icon}</span>` : ''}
          ${label}
        </label>
        <input
          type="text"
          id="${name}"
          name="${name}"
          class="form-input-premium"
          value="${this.escapeHTML(value)}"
          ${placeholder ? `placeholder="${this.escapeHTML(placeholder)}"` : ''}
          ${required ? 'required' : ''}
        />
      </div>
    `;
  }

  renderTextarea(name, label, value, { icon, placeholder = '', required = false } = {}) {
    return `
      <div class="form-group span-2">
        <label class="form-label${required ? ' required' : ''}" for="${name}">
          ${icon ? `<span class="form-label-icon">${icon}</span>` : ''}
          ${label}
        </label>
        <textarea
          id="${name}"
          name="${name}"
          class="form-input-premium"
          rows="3"
          ${placeholder ? `placeholder="${this.escapeHTML(placeholder)}"` : ''}
          ${required ? 'required' : ''}
        >${this.escapeHTML(value)}</textarea>
      </div>
    `;
  }

  renderSelect(name, label, value, options, { icon, required = false } = {}) {
    const opts = [
      '<option value="">Selecione...</option>',
      ...options.map((option) => `
        <option value="${option.value}" ${option.value === (value || '') ? 'selected' : ''}>
          ${this.escapeHTML(option.label)}
        </option>
      `),
    ].join('');

    return `
      <div class="form-group">
        <label class="form-label${required ? ' required' : ''}" for="${name}">
          ${icon ? `<span class="form-label-icon">${icon}</span>` : ''}
          ${label}
        </label>
        <select id="${name}" name="${name}" class="form-select-premium" ${required ? 'required' : ''}>
          ${opts}
        </select>
      </div>
    `;
  }

  renderNumberInput(name, label, value, { icon, min, max, step, placeholder } = {}) {
    // Convert dots to underscores for valid CSS IDs
    const validId = name.replace(/\./g, '_');
    
    return `
      <div class="form-group">
        <label class="form-label" for="${validId}">
          ${icon ? `<span class="form-label-icon">${icon}</span>` : ''}
          ${label}
        </label>
        <input
          type="number"
          id="${validId}"
          name="${name}"
          class="form-input-premium"
          value="${value ?? ''}"
          ${min !== undefined ? `min="${min}"` : ''}
          ${max !== undefined ? `max="${max}"` : ''}
          ${step !== undefined ? `step="${step}"` : ''}
          ${placeholder ? `placeholder="${placeholder}"` : ''}
        />
      </div>
    `;
  }

  renderDateInput(name, label, value, { icon, required = false, allowNull = false } = {}) {
    // Convert dots to underscores for valid CSS IDs
    const validId = name.replace(/\./g, '_');
    
    return `
      <div class="form-group">
        <label class="form-label${required ? ' required' : ''}" for="${validId}">
          ${icon ? `<span class="form-label-icon">${icon}</span>` : ''}
          ${label}
        </label>
        <input
          type="date"
          id="${validId}"
          name="${name}"
          class="form-input-premium"
          value="${this.formatDateForInput(value)}"
          ${required && !allowNull ? 'required' : ''}
        />
      </div>
    `;
  }

  renderTimeInput(name, label, value) {
    // Convert dots to underscores for valid CSS IDs
    const validId = name.replace(/\./g, '_');
    
    return `
      <div class="form-group">
        <label class="form-label" for="${validId}">
          <span class="form-label-icon">⏰</span>
          ${label}
        </label>
        <input
          type="time"
          id="${validId}"
          name="${name}"
          class="form-input-premium"
          value="${value || ''}"
          required
        />
      </div>
    `;
  }

  renderDaysOfWeekField(selectedDays) {
    // Ensure selectedDays is always an array to prevent rendering errors
    const safeDays = Array.isArray(selectedDays) ? selectedDays : [];
    console.debug('🔍 [TurmasDetailView] renderDaysOfWeekField - selectedDays:', selectedDays, 'safeDays:', safeDays);
    
    const days = [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Segunda' },
      { value: 2, label: 'Terça' },
      { value: 3, label: 'Quarta' },
      { value: 4, label: 'Quinta' },
      { value: 5, label: 'Sexta' },
      { value: 6, label: 'Sábado' },
    ];

    const checkboxes = days
      .map(
        (day) => `
          <label class="day-checkbox">
            <input type="checkbox" name="schedule.daysOfWeek" value="${day.value}" ${safeDays.includes(day.value) ? 'checked' : ''} />
            <span>${day.label}</span>
          </label>
        `,
      )
      .join('');

    return `
      <div class="form-group span-2">
        <label class="form-label required">
          <span class="form-label-icon">🗓️</span>
          Dias da semana
        </label>
        <div class="days-of-week-container">
          ${checkboxes}
        </div>
      </div>
    `;
  }

  getCourseOptionsForForm() {
    console.debug('🔍 [TurmasDetailView] getCourseOptionsForForm - availableCourses:', this.availableCourses, 'turmaCourses:', this.turmaCourses);
    
    const map = new Map();

    // Safely iterate over courses arrays
    const allCourses = [
      ...(Array.isArray(this.availableCourses) ? this.availableCourses : []),
      ...(Array.isArray(this.turmaCourses) ? this.turmaCourses : [])
    ];

    allCourses.forEach((course) => {
      if (!course?.id || map.has(course.id)) return;
      map.set(course.id, {
        value: course.id,
        label: course.name || 'Curso sem nome',
      });
    });

    const result = Array.from(map.values());
    console.debug('🔍 [TurmasDetailView] getCourseOptionsForForm - result:', result);
    return result;
  }

  getInstructorOptions() {
    return (this.instructors || []).map((instructor) => ({
      value: instructor.userId,  // ✅ Use userId (User.id) instead of id (Instructor.id) for FK compatibility
      label: instructor.name || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instrutor sem nome',
    }));
  }

  getOrganizationOptions() {
    return (this.organizations || []).map((org) => ({
      value: org.id,
      label: org.name || org.legalName || 'Organização sem nome',
    }));
  }

  getUnitOptions() {
    return (this.units || []).map((unit) => ({
      value: unit.id,
      label: unit.name || 'Unidade sem nome',
    }));
  }

  getUnassignedCourses() {
    const assignedIds = new Set((this.turmaCourses || []).map((course) => course.id));
    return (this.availableCourses || []).filter((course) => !assignedIds.has(course.id));
  }

  getCourseNameById(courseId) {
    if (!courseId) return this.turmaData?.course?.name || null;
    if (this.turmaData?.course?.id === courseId) return this.turmaData.course.name;
    const course = [...(this.availableCourses || []), ...(this.turmaCourses || [])].find((item) => item.id === courseId);
    return course?.name || this.turmaData?.course?.name || null;
  }

  getInstructorNameById(instructorId) {
    if (!instructorId) return null;
    const instructor = (this.instructors || []).find((item) => item.id === instructorId);
    if (!instructor) return null;
    return instructor.name || `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || null;
  }

  getNextLessonSummary() {
    const lessons = Array.isArray(this.turmaData?.lessons) ? this.turmaData.lessons : [];
    if (!lessons.length) return 'Cronograma ainda não gerado';

    const sortedLessons = this.sortLessonsByDate(lessons);
    const upcoming = sortedLessons.find((lesson) => this.isLessonUpcoming(lesson));
    const fallback = sortedLessons[0];
    if (!upcoming && !fallback) return 'Sem aulas registradas';

    const target = upcoming || fallback;
    const dateValue = this.getLessonDateValue(target);
    const dateLabel = this.formatDateForDisplay(dateValue);
    const timeLabel = this.formatTimeForDisplay(dateValue);
    const title = target.title || target.lessonPlan?.title || `Aula ${target.lessonNumber || ''}`;

    return `${dateLabel}${timeLabel && timeLabel !== '--' ? ` • ${timeLabel}` : ''} • ${title}`;
  }

  calculateProgress() {
    const lessons = Array.isArray(this.turmaData?.lessons) ? this.turmaData.lessons : [];
    if (!lessons.length) return 0;

    const completed = lessons.filter((lesson) => this.isLessonCompleted(lesson)).length;
    return Math.round((completed / lessons.length) * 100);
  }

  getStatusText(status) {
    const map = {
      SCHEDULED: 'Agendada',
      ACTIVE: 'Ativa',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      SUSPENDED: 'Suspensa',
    };
    return map[status] || 'Defina o status';
  }

  formatDateForInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  formatDateForDisplay(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('pt-BR');
  }

  escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  showSuccess(message) {
    if (window.app?.showSuccess) window.app.showSuccess(message);
    else console.info(message);
  }

  showError(message) {
    if (window.app?.showError) window.app.showError(message);
    else alert(message);
  }
}

/**
 * 🎓 Student Progression Module
 * Dashboard visual de progressão do aluno com graus e atividades
 * 
 * Features:
 * - Timeline visual dos graus (1º⭐ → 2º⭐⭐ → 3º⭐⭐⭐ → 4º⭐⭐⭐⭐)
 * - Barra de progresso percentual animada
 * - Widget de atividades por categoria (radar chart)
 * - Próximas aulas checkpoint destacadas
 */

if (typeof window.StudentProgressionModule !== 'undefined') {
  console.log('StudentProgressionModule already loaded');
} else {

const StudentProgressionModule = {
  container: null,
  progressionAPI: null,
  currentStudentId: null,
  currentCourseId: null,
  progressionData: null,

  // Inicializar módulo
  async init(containerId = 'student-progression-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    await this.initializeAPI();
    this.setupEventListeners();
    
    // Registrar globalmente
    window.studentProgression = this;
    window.app?.dispatchEvent('module:loaded', { name: 'studentProgression' });

    console.log('✅ StudentProgressionModule initialized');
  },

  // Setup API client
  async initializeAPI() {
    await waitForAPIClient();
    this.progressionAPI = window.createModuleAPI('StudentProgression');
  },

  // Carregar progressão de um aluno
  async loadProgression(studentId, courseId) {
    this.currentStudentId = studentId;
    this.currentCourseId = courseId;

    await this.progressionAPI.fetchWithStates(`/students/${studentId}/progression/${courseId}`, {
      loadingElement: this.container,
      onSuccess: (data) => {
        this.progressionData = data.data;
        this.render();
      },
      onEmpty: () => this.showEmptyState(),
      onError: (error) => this.showErrorState(error)
    });
  },

  // Renderizar dashboard completo
  render() {
    if (!this.progressionData) {
      this.showEmptyState();
      return;
    }

    const { progressionData } = this;

    this.container.innerHTML = `
      <div class="module-header-premium">
        <div class="header-content">
          <div>
            <h1>📊 Progressão do Aluno</h1>
            <nav class="breadcrumb">
              <a href="#students">Alunos</a> > 
              <a href="#students/${progressionData.studentId}">${progressionData.studentName}</a> >
              Progressão
            </nav>
          </div>
          <div class="header-actions">
            <button class="btn-secondary" onclick="window.studentProgression.goBack()">
              ← Voltar
            </button>
            <button class="btn-primary" onclick="window.studentProgression.refreshData()">
              🔄 Atualizar
            </button>
          </div>
        </div>
      </div>

      <div class="progression-dashboard">
        <!-- Summary Cards -->
        <div class="summary-cards">
          ${this.renderSummaryCards()}
        </div>

        <!-- Main Progress Section -->
        <div class="progress-section">
          <div class="data-card-premium">
            <h2>🎯 Progresso Geral</h2>
            ${this.renderProgressBar()}
            ${this.renderDegreeTimeline()}
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="two-column-layout">
          <!-- Activity Categories -->
          <div class="data-card-premium">
            <h2>📋 Atividades por Categoria</h2>
            ${this.renderActivityCategories()}
          </div>

          <!-- Upcoming Checkpoints -->
          <div class="data-card-premium">
            <h2>🎯 Próximos Marcos</h2>
            ${this.renderUpcomingCheckpoints()}
          </div>
        </div>

        <!-- Eligibility Section -->
        ${progressionData.isEligibleForBeltChange ? this.renderEligibilityBanner() : this.renderRequirements()}
      </div>
    `;

    this.attachEventListeners();
  },

  // Summary cards (4 métricas principais)
  renderSummaryCards() {
    const { progressionData } = this;

    const cards = [
      {
        icon: '📈',
        title: 'Progresso',
        value: `${progressionData.progressPercentage.toFixed(1)}%`,
        subtitle: `${progressionData.completedLessons}/${progressionData.totalLessonsInCourse} aulas`,
        color: '#667eea'
      },
      {
        icon: '⭐',
        title: 'Grau Atual',
        value: this.getDegreeLabel(progressionData.currentDegree),
        subtitle: `Faixa: ${progressionData.currentBelt}`,
        color: '#764ba2'
      },
      {
        icon: '📊',
        title: 'Frequência',
        value: `${progressionData.attendanceRate.toFixed(1)}%`,
        subtitle: 'Taxa de presença',
        color: '#10B981'
      },
      {
        icon: '🏆',
        title: 'Qualidade',
        value: `${progressionData.averageQuality.toFixed(1)}/5.0`,
        subtitle: `${progressionData.totalRepetitions} repetições`,
        color: '#F59E0B'
      }
    ];

    return cards.map(card => `
      <div class="stat-card-enhanced" style="border-left: 4px solid ${card.color}">
        <div class="stat-icon" style="background: ${card.color}20; color: ${card.color}">
          ${card.icon}
        </div>
        <div class="stat-content">
          <div class="stat-value">${card.value}</div>
          <div class="stat-label">${card.title}</div>
          <div class="stat-subtitle">${card.subtitle}</div>
        </div>
      </div>
    `).join('');
  },

  // Barra de progresso animada
  renderProgressBar() {
    const { progressPercentage, nextDegreeAt, currentDegree } = this.progressionData;
    const nextMilestone = nextDegreeAt || 100;
    const progressToNext = ((progressPercentage - (currentDegree * 20)) / 20) * 100;

    return `
      <div class="progress-bar-container">
        <div class="progress-bar-header">
          <span class="progress-label">Progresso Total</span>
          <span class="progress-percentage">${progressPercentage.toFixed(1)}%</span>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPercentage}%">
              <div class="progress-bar-shine"></div>
            </div>
          </div>
          <div class="progress-markers">
            ${[20, 40, 60, 80, 100].map(marker => `
              <div class="progress-marker ${progressPercentage >= marker ? 'completed' : ''}" 
                   style="left: ${marker}%"
                   title="${marker}%">
                ${progressPercentage >= marker ? '✓' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="progress-bar-footer">
          <span>Próximo marco: ${nextMilestone}%</span>
          <span>${progressToNext.toFixed(0)}% até o próximo grau</span>
        </div>
      </div>
    `;
  },

  // Timeline visual dos graus
  renderDegreeTimeline() {
    const { currentDegree, degreeHistory } = this.progressionData;
    const degrees = [1, 2, 3, 4];

    return `
      <div class="degree-timeline">
        <h3>Timeline de Graus</h3>
        <div class="timeline-container">
          ${degrees.map(degree => {
            const achieved = degreeHistory.find(d => d.degree === degree);
            const isCurrent = degree === currentDegree;
            const isPast = degree < currentDegree;
            const isFuture = degree > currentDegree;

            return `
              <div class="timeline-item ${isPast ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}">
                <div class="timeline-marker">
                  <div class="timeline-icon">
                    ${this.getDegreeStars(degree)}
                  </div>
                  ${achieved ? `<div class="timeline-check">✓</div>` : ''}
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">${degree}º Grau</div>
                  <div class="timeline-percentage">${degree * 20}%</div>
                  ${achieved ? `
                    <div class="timeline-date">
                      ${new Date(achieved.achievedAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div class="timeline-stats">
                      ${achieved.completedLessons} aulas • 
                      ${achieved.totalRepetitions} reps • 
                      ${achieved.averageQuality.toFixed(1)}/5.0 ⭐
                    </div>
                  ` : `
                    <div class="timeline-pending">
                      ${isCurrent ? 'Em andamento...' : 'Aguardando...'}
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Widget de atividades por categoria
  renderActivityCategories() {
    // Dados mock - em produção viriam da API
    const categories = [
      { name: 'Posturas', completed: 45, total: 50, color: '#3B82F6', icon: '🧍' },
      { name: 'Socos', completed: 85, total: 100, color: '#EF4444', icon: '👊' },
      { name: 'Chutes', completed: 62, total: 80, color: '#10B981', icon: '🦶' },
      { name: 'Defesas', completed: 98, total: 120, color: '#F59E0B', icon: '🛡️' },
      { name: 'Quedas', completed: 22, total: 30, color: '#8B5CF6', icon: '🤸' },
      { name: 'Combinações', completed: 34, total: 50, color: '#EC4899', icon: '⚡' }
    ];

    return `
      <div class="activity-categories">
        ${categories.map(cat => {
          const percentage = (cat.completed / cat.total) * 100;
          const isComplete = cat.completed >= cat.total;

          return `
            <div class="category-item">
              <div class="category-header">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
                <span class="category-percentage ${isComplete ? 'complete' : ''}">
                  ${percentage.toFixed(0)}%
                </span>
              </div>
              <div class="category-progress">
                <div class="category-progress-bar" style="background: ${cat.color}20">
                  <div class="category-progress-fill" 
                       style="width: ${percentage}%; background: ${cat.color}">
                  </div>
                </div>
              </div>
              <div class="category-stats">
                ${cat.completed}/${cat.total} repetições
                ${isComplete ? '✓ Completo' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Próximos checkpoints
  renderUpcomingCheckpoints() {
    const { currentDegree, completedLessons, totalLessonsInCourse } = this.progressionData;
    
    const checkpoints = [
      { lesson: 7, degree: 1, percentage: 20, title: '1º Grau ⭐' },
      { lesson: 14, degree: 2, percentage: 40, title: '2º Grau ⭐⭐' },
      { lesson: 21, degree: 3, percentage: 60, title: '3º Grau ⭐⭐⭐' },
      { lesson: 28, degree: 4, percentage: 80, title: '4º Grau ⭐⭐⭐⭐' },
      { lesson: 35, degree: 5, percentage: 100, title: 'Exame Final 🏆' }
    ];

    const upcomingCheckpoints = checkpoints.filter(cp => cp.degree > currentDegree);

    if (upcomingCheckpoints.length === 0) {
      return `
        <div class="checkpoints-complete">
          <div class="celebration-icon">🎉</div>
          <h3>Todos os marcos conquistados!</h3>
          <p>Você completou todos os graus. Aguardando aprovação para graduação.</p>
        </div>
      `;
    }

    return `
      <div class="upcoming-checkpoints">
        ${upcomingCheckpoints.slice(0, 3).map(checkpoint => {
          const lessonsRemaining = checkpoint.lesson - completedLessons;
          const isNext = checkpoint.degree === currentDegree + 1;

          return `
            <div class="checkpoint-card ${isNext ? 'next' : ''}">
              <div class="checkpoint-icon">
                ${checkpoint.degree <= 4 ? this.getDegreeStars(checkpoint.degree) : '🏆'}
              </div>
              <div class="checkpoint-content">
                <div class="checkpoint-title">${checkpoint.title}</div>
                <div class="checkpoint-lesson">Aula ${checkpoint.lesson}</div>
                <div class="checkpoint-remaining">
                  ${lessonsRemaining > 0 ? 
                    `Faltam ${lessonsRemaining} aulas` : 
                    'Disponível para conquista!'
                  }
                </div>
              </div>
              ${isNext ? '<div class="checkpoint-badge">Próximo</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Banner de elegibilidade para graduação
  renderEligibilityBanner() {
    const { eligibilityDetails } = this.progressionData;

    return `
      <div class="data-card-premium eligibility-banner success">
        <div class="eligibility-header">
          <div class="eligibility-icon">🎓</div>
          <div>
            <h2>Elegível para Graduação!</h2>
            <p>Parabéns! Você atende todos os requisitos para mudança de faixa.</p>
          </div>
        </div>
        <div class="eligibility-details">
          <div class="eligibility-item">
            <span class="check-icon">✓</span>
            4º Grau Completo (${eligibilityDetails.currentAttendanceRate.toFixed(1)}%)
          </div>
          <div class="eligibility-item">
            <span class="check-icon">✓</span>
            Frequência: ${eligibilityDetails.currentAttendanceRate.toFixed(1)}%
          </div>
          <div class="eligibility-item">
            <span class="check-icon">✓</span>
            Qualidade: ${eligibilityDetails.currentQualityRating.toFixed(1)}/5.0
          </div>
          <div class="eligibility-item">
            <span class="check-icon">✓</span>
            ${eligibilityDetails.totalRepetitions} repetições
          </div>
          <div class="eligibility-item">
            <span class="check-icon">✓</span>
            ${eligibilityDetails.monthsEnrolled} meses matriculado
          </div>
        </div>
        <div class="eligibility-actions">
          <button class="btn-primary-large" onclick="window.studentProgression.requestGraduation()">
            🏆 Solicitar Graduação
          </button>
        </div>
      </div>
    `;
  },

  // Requisitos pendentes
  renderRequirements() {
    const { eligibilityDetails } = this.progressionData;

    const requirements = [
      {
        label: '4º Grau Completo',
        met: eligibilityDetails.hasAllDegrees,
        current: eligibilityDetails.currentAttendanceRate?.toFixed(1) || '0',
        target: '80%'
      },
      {
        label: 'Taxa de Frequência',
        met: eligibilityDetails.meetsAttendanceRate,
        current: eligibilityDetails.currentAttendanceRate?.toFixed(1) || '0',
        target: '80%'
      },
      {
        label: 'Qualidade Média',
        met: eligibilityDetails.meetsQualityRating,
        current: eligibilityDetails.currentQualityRating?.toFixed(1) || '0',
        target: '3.0/5.0'
      },
      {
        label: 'Total de Repetições',
        met: eligibilityDetails.meetsRepetitions,
        current: eligibilityDetails.totalRepetitions || 0,
        target: '500'
      },
      {
        label: 'Tempo Matriculado',
        met: eligibilityDetails.meetsMonthsEnrolled,
        current: `${eligibilityDetails.monthsEnrolled || 0} meses`,
        target: '3 meses'
      }
    ];

    return `
      <div class="data-card-premium requirements-section">
        <h2>📋 Requisitos para Graduação</h2>
        <p class="requirements-description">
          Complete todos os requisitos abaixo para se tornar elegível à mudança de faixa:
        </p>
        <div class="requirements-list">
          ${requirements.map(req => `
            <div class="requirement-item ${req.met ? 'met' : 'pending'}">
              <div class="requirement-status">
                ${req.met ? '✓' : '○'}
              </div>
              <div class="requirement-content">
                <div class="requirement-label">${req.label}</div>
                <div class="requirement-progress">
                  <span class="requirement-current">${req.current}</span>
                  <span class="requirement-separator">/</span>
                  <span class="requirement-target">${req.target}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Helpers
  getDegreeLabel(degree) {
    if (degree === 0) return 'Sem Grau';
    return `${degree}º Grau ${this.getDegreeStars(degree)}`;
  },

  getDegreeStars(degree) {
    return '⭐'.repeat(degree);
  },

  showEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h2>Nenhuma progressão disponível</h2>
        <p>Selecione um aluno e curso para visualizar a progressão.</p>
      </div>
    `;
  },

  showErrorState(error) {
    this.container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h2>Erro ao carregar progressão</h2>
        <p>${error.message || 'Ocorreu um erro inesperado'}</p>
        <button class="btn-primary" onclick="window.studentProgression.refreshData()">
          Tentar Novamente
        </button>
      </div>
    `;
  },

  // Event listeners
  setupEventListeners() {
    // Delegação de eventos no container
    this.container.addEventListener('click', (e) => {
      const target = e.target;

      // Navegação para detalhes de grau
      if (target.closest('.timeline-item')) {
        const degree = target.closest('.timeline-item').dataset.degree;
        if (degree) this.showDegreeDetails(degree);
      }

      // Expandir categoria
      if (target.closest('.category-item')) {
        target.closest('.category-item').classList.toggle('expanded');
      }
    });
  },

  attachEventListeners() {
    // Listeners específicos após render
  },

  // Actions
  async refreshData() {
    if (this.currentStudentId && this.currentCourseId) {
      await this.loadProgression(this.currentStudentId, this.currentCourseId);
    }
  },

  goBack() {
    window.location.hash = `#students/${this.currentStudentId}`;
  },

  async requestGraduation() {
    if (!confirm('Deseja solicitar a graduação? Um instrutor irá avaliar sua solicitação.')) {
      return;
    }

    try {
      await this.progressionAPI.request(`/students/${this.currentStudentId}/graduation-request`, {
        method: 'POST',
        body: JSON.stringify({
          courseId: this.currentCourseId,
          notes: 'Solicitação via dashboard de progressão'
        })
      });

      alert('✅ Solicitação enviada com sucesso! Aguarde aprovação do instrutor.');
      this.refreshData();
    } catch (error) {
      window.app?.handleError(error, { 
        module: 'StudentProgression', 
        context: 'requestGraduation' 
      });
    }
  },

  showDegreeDetails(degree) {
    const degreeData = this.progressionData.degreeHistory.find(d => d.degree === parseInt(degree));
    if (!degreeData) return;

    // Modal ou painel lateral com detalhes do grau
    console.log('Show degree details:', degreeData);
  }
};

window.StudentProgressionModule = StudentProgressionModule;

} // end if

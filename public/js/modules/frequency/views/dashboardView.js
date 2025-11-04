/**
 * Dashboard View - Frequency Module
 * Exibe estatísticas agregadas, gráficos e alertas de frequência
 * 
 * Features:
 * - 4 cards de estatísticas principais
 * - 3 gráficos Chart.js (semanal, top alunos, turmas)
 * - Polling automático (30s)
 * - Estados: loading, error, empty
 * 
 * @requires Chart.js 4.4.0+
 * @requires API Client (window.createModuleAPI)
 */

export class DashboardView {
  constructor(moduleAPI) {
    this.moduleAPI = moduleAPI;
    this.container = null;
    this.pollingInterval = null;
    this.isPaused = false;
    this.charts = {
      weekly: null,
      topStudents: null,
      classesByAttendance: null
    };
    
    // Configurações
    this.POLLING_INTERVAL = 30000; // 30 segundos
    this.ANIMATION_DURATION = 800;
  }

  /**
   * Renderiza a view completa
   */
  async render(container) {
    this.container = container;
    
    // HTML estrutura
    this.container.innerHTML = this.getHTML();
    
    // Carrega dados iniciais
    await this.loadDashboardData();
    
    // Configura eventos
    this.setupEvents();
    
    // Inicia polling
    this.startPolling();
    
    console.log('✅ Dashboard View renderizada');
  }

  /**
   * HTML da dashboard
   */
  getHTML() {
    return `
      <div class="frequency-dashboard">
        <!-- Header -->
        <div class="module-header-premium">
          <div class="header-content">
            <h1>📊 Dashboard de Frequência</h1>
            <nav class="breadcrumb">
              <a href="#home">Home</a> › 
              <a href="#frequency">Frequência</a> › 
              <span>Dashboard</span>
            </nav>
          </div>
          <div class="header-actions">
            <button id="refreshDashboard" class="btn btn-secondary">
              🔄 Atualizar
            </button>
            <button id="togglePolling" class="btn btn-secondary">
              ⏸️ Pausar
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="dashboard-stats-grid">
          <!-- Card 1: Check-ins Hoje -->
          <div class="stat-card-enhanced card-primary">
            <div class="card-icon">📋</div>
            <div class="card-content">
              <h3>Check-ins Hoje</h3>
              <div class="card-value" data-stat="todayCheckins">
                <span class="loading-skeleton">--</span>
              </div>
              <div class="card-trend" data-stat="checkinsChange">
                <span class="loading-skeleton">--</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Alunos Presentes -->
          <div class="stat-card-enhanced card-success">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <h3>Alunos Presentes</h3>
              <div class="card-value" data-stat="presentStudents">
                <span class="loading-skeleton">--</span>
              </div>
              <div class="card-subtitle" data-stat="attendanceRate">
                Taxa: <span class="loading-skeleton">--</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Aulas Ativas -->
          <div class="stat-card-enhanced card-info">
            <div class="card-icon">🏋️</div>
            <div class="card-content">
              <h3>Aulas Ativas</h3>
              <div class="card-value" data-stat="activeClasses">
                <span class="loading-skeleton">--</span>
              </div>
              <div class="card-subtitle">Hoje</div>
            </div>
          </div>

          <!-- Card 4: Alunos Faltosos -->
          <div class="stat-card-enhanced card-warning">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
              <h3>Alunos Faltando</h3>
              <div class="card-value" data-stat="missingCount">
                <span class="loading-skeleton">--</span>
              </div>
              <div class="card-subtitle">Com planos ativos</div>
              <button id="viewMissingStudents" class="btn-link">
                Ver lista →
              </button>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="dashboard-charts">
          <!-- Chart 1: Frequência Semanal -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>📈 Frequência por Dia da Semana</h3>
              <span class="chart-subtitle">Média dos últimos 30 dias</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="weeklyStatsChart"></canvas>
            </div>
          </div>

          <!-- Chart 2: Top 10 Alunos -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>🏆 Top 10 Alunos Mais Assíduos</h3>
              <span class="chart-subtitle">Últimos 30 dias</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="topStudentsChart"></canvas>
            </div>
          </div>

          <!-- Chart 3: Turmas por Presença -->
          <div class="chart-container">
            <div class="chart-header">
              <h3>📊 Taxa de Presença por Turma</h3>
              <span class="chart-subtitle">Últimos 30 dias</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="classesByAttendanceChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Polling Status -->
        <div class="polling-status">
          <span id="pollingIndicator" class="status-active">
            🔄 Atualizando automaticamente a cada 30s
          </span>
          <span id="lastUpdate">Última atualização: --</span>
        </div>
      </div>
    `;
  }

  /**
   * Carrega dados da dashboard (stats + charts)
   */
  async loadDashboardData() {
    try {
      this.showLoading();

      // Requisições paralelas
      const [statsData, chartsData] = await Promise.all([
        this.fetchDashboardStats(),
        this.fetchChartsData()
      ]);

      // Atualiza cards
      this.updateStatsCards(statsData);

      // Atualiza gráficos
      this.updateCharts(chartsData);

      // Atualiza timestamp
      this.updateLastUpdateTime();

      this.hideLoading();

    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      this.showError(error.message);
      window.app?.handleError(error, { module: 'Frequency', context: 'loadDashboardData' });
    }
  }

  /**
   * Fetch: Dashboard Stats
   */
  async fetchDashboardStats() {
    const response = await this.moduleAPI.request('/api/frequency/dashboard-stats');
    if (!response.success) {
      throw new Error(response.message || 'Erro ao buscar estatísticas');
    }
    return response.data;
  }

  /**
   * Fetch: Charts Data
   */
  async fetchChartsData() {
    const response = await this.moduleAPI.request('/api/frequency/charts-data');
    if (!response.success) {
      throw new Error(response.message || 'Erro ao buscar dados de gráficos');
    }
    return response.data;
  }

  /**
   * Atualiza cards de estatísticas
   */
  updateStatsCards(data) {
    // Card 1: Check-ins Hoje
    this.animateValue('[data-stat="todayCheckins"]', data.todayCheckins);
    
    // Card 1: Tendência
    const checkinsChange = data.comparisonYesterday?.checkinsChange || 0;
    const trendElement = this.container.querySelector('[data-stat="checkinsChange"]');
    if (trendElement) {
      const arrow = checkinsChange > 0 ? '↑' : checkinsChange < 0 ? '↓' : '→';
      const className = checkinsChange > 0 ? 'trend-up' : checkinsChange < 0 ? 'trend-down' : 'trend-neutral';
      trendElement.innerHTML = `<span class="${className}">${arrow} ${Math.abs(checkinsChange)}% vs ontem</span>`;
    }

    // Card 2: Alunos Presentes
    this.animateValue('[data-stat="presentStudents"]', data.presentStudents);
    
    // Card 2: Taxa de Presença
    const attendanceRate = data.comparisonYesterday?.attendanceRate || 0;
    const rateElement = this.container.querySelector('[data-stat="attendanceRate"]');
    if (rateElement) {
      rateElement.innerHTML = `Taxa: <strong>${attendanceRate.toFixed(1)}%</strong>`;
    }

    // Card 3: Aulas Ativas
    this.animateValue('[data-stat="activeClasses"]', data.activeClasses);

    // Card 4: Alunos Faltosos
    this.animateValue('[data-stat="missingCount"]', data.studentsWithPlansMissing?.count || 0);
  }

  /**
   * Anima valor numérico (count-up effect)
   */
  animateValue(selector, targetValue) {
    const element = this.container.querySelector(selector);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = this.ANIMATION_DURATION;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeProgress);
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Atualiza gráficos com Chart.js
   */
  updateCharts(data) {
    this.updateWeeklyChart(data.weeklyStats);
    this.updateTopStudentsChart(data.topStudents);
    this.updateClassesByAttendanceChart(data.classesByAttendance);
  }

  /**
   * Gráfico 1: Frequência Semanal (Bar Chart)
   */
  updateWeeklyChart(weeklyData) {
    const ctx = this.container.querySelector('#weeklyStatsChart');
    if (!ctx) return;

    // Destruir gráfico anterior
    if (this.charts.weekly) {
      this.charts.weekly.destroy();
    }

    // Dias da semana
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = labels.map((_, index) => {
      const dayData = weeklyData.find(d => d.dayOfWeek === index);
      return dayData ? dayData.avgCheckins : 0;
    });

    this.charts.weekly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Check-ins Médios',
          data: data,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(118, 75, 162, 0.9)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => `${context.parsed.y} check-ins`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Gráfico 2: Top 10 Alunos (Horizontal Bar Chart)
   */
  updateTopStudentsChart(topStudentsData) {
    const ctx = this.container.querySelector('#topStudentsChart');
    if (!ctx) return;

    if (this.charts.topStudents) {
      this.charts.topStudents.destroy();
    }

    const labels = topStudentsData.map(s => s.studentName || 'N/A');
    const data = topStudentsData.map(s => s.attendanceRate);

    this.charts.topStudents = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Taxa de Presença (%)',
          data: data,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(5, 150, 105, 0.9)'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context) => `${context.parsed.x.toFixed(1)}% de presença`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (value) => `${value}%` },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Gráfico 3: Turmas por Presença (Doughnut Chart)
   */
  updateClassesByAttendanceChart(classesData) {
    const ctx = this.container.querySelector('#classesByAttendanceChart');
    if (!ctx) return;

    if (this.charts.classesByAttendance) {
      this.charts.classesByAttendance.destroy();
    }

    const labels = classesData.map(c => c.turmaName || 'Turma');
    const data = classesData.map(c => c.attendanceRate);
    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(118, 75, 162, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)'
    ];

    this.charts.classesByAttendance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value.toFixed(1)}%`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Configura eventos
   */
  setupEvents() {
    // Botão Refresh
    const refreshBtn = this.container.querySelector('#refreshDashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }

    // Botão Toggle Polling
    const toggleBtn = this.container.querySelector('#togglePolling');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.handleTogglePolling());
    }

    // Botão Ver Alunos Faltosos
    const missingBtn = this.container.querySelector('#viewMissingStudents');
    if (missingBtn) {
      missingBtn.addEventListener('click', () => this.handleViewMissingStudents());
    }
  }

  /**
   * Handler: Refresh Manual
   */
  async handleRefresh() {
    console.log('🔄 Refresh manual solicitado');
    await this.loadDashboardData();
  }

  /**
   * Handler: Toggle Polling
   */
  handleTogglePolling() {
    this.isPaused = !this.isPaused;
    
    const toggleBtn = this.container.querySelector('#togglePolling');
    const indicator = this.container.querySelector('#pollingIndicator');

    if (this.isPaused) {
      this.stopPolling();
      toggleBtn.innerHTML = '▶️ Retomar';
      indicator.className = 'status-paused';
      indicator.textContent = '⏸️ Atualização automática pausada';
    } else {
      this.startPolling();
      toggleBtn.innerHTML = '⏸️ Pausar';
      indicator.className = 'status-active';
      indicator.textContent = '🔄 Atualizando automaticamente a cada 30s';
    }
  }

  /**
   * Handler: Ver Alunos Faltosos (navega para view específica)
   */
  handleViewMissingStudents() {
    console.log('📋 Navegando para lista de alunos faltosos...');
    // TODO: Implementar navegação para view de alunos faltosos (Fase 6)
    alert('🚧 View de alunos faltosos será implementada na Fase 6');
  }

  /**
   * Inicia polling automático
   */
  startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      if (!this.isPaused) {
        console.log('🔄 Polling: Atualizando dashboard...');
        this.loadDashboardData();
      }
    }, this.POLLING_INTERVAL);

    console.log(`✅ Polling iniciado (${this.POLLING_INTERVAL / 1000}s)`);
  }

  /**
   * Para polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏹️ Polling parado');
    }
  }

  /**
   * Atualiza timestamp de última atualização
   */
  updateLastUpdateTime() {
    const lastUpdateElement = this.container.querySelector('#lastUpdate');
    if (lastUpdateElement) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      lastUpdateElement.textContent = `Última atualização: ${timeString}`;
    }
  }

  /**
   * Mostra estado de loading
   */
  showLoading() {
    const cards = this.container.querySelectorAll('.stat-card-enhanced');
    cards.forEach(card => card.classList.add('loading'));
  }

  /**
   * Esconde estado de loading
   */
  hideLoading() {
    const cards = this.container.querySelectorAll('.stat-card-enhanced');
    cards.forEach(card => card.classList.remove('loading'));
  }

  /**
   * Mostra erro
   */
  showError(message) {
    const statsGrid = this.container.querySelector('.dashboard-stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="error-state" style="grid-column: 1 / -1;">
          <div class="error-icon">❌</div>
          <h3>Erro ao carregar dashboard</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            🔄 Recarregar Página
          </button>
        </div>
      `;
    }
  }

  /**
   * Cleanup ao destruir view
   */
  destroy() {
    this.stopPolling();
    
    // Destruir gráficos
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    
    console.log('🗑️ Dashboard View destruída');
  }
}

/**
 * History View - Frequency Module (Fase 3)
 * Exibe histórico de aulas com participantes em tabela expansível
 * 
 * Features:
 * - Tabela paginada (20 aulas por página)
 * - Linha expansível com lista de participantes
 * - Filtros: turma, status, período
 * - Exportação CSV
 * 
 * @requires API Client (window.createModuleAPI)
 */

export class HistoryView {
  constructor(moduleAPI) {
    this.moduleAPI = moduleAPI;
    this.container = null;
    this.currentPage = 1;
    this.pageSize = 20;
    this.filters = {
      turmaId: null,
      status: null,
      startDate: null,
      endDate: null
    };
    this.expandedRows = new Set(); // IDs das linhas expandidas
    this.lessons = []; // Cache das aulas
  }

  /**
   * Renderiza a view completa
   */
  async render(container) {
    this.container = container;
    
    // HTML estrutura
    this.container.innerHTML = this.getHTML();
    
    // Carrega dados iniciais
    await this.loadLessonsHistory();
    
    // Configura eventos
    this.setupEvents();
    
    console.log('✅ History View renderizada');
  }

  /**
   * HTML da history view
   */
  getHTML() {
    return `
      <div class="frequency-history">
        <!-- Header -->
        <div class="module-header-premium">
          <div class="header-content">
            <h1>📋 Histórico de Aulas</h1>
            <nav class="breadcrumb">
              <a href="#home">Home</a> › 
              <a href="#frequency">Frequência</a> › 
              <span>Histórico</span>
            </nav>
          </div>
          <div class="header-actions">
            <button id="exportHistoryCSV" class="btn btn-secondary">
              📥 Exportar CSV
            </button>
            <button id="refreshHistory" class="btn btn-secondary">
              🔄 Atualizar
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="history-filters">
          <div class="filter-group">
            <label for="filterTurma">Turma</label>
            <select id="filterTurma" class="filter-select">
              <option value="">Todas as turmas</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="filterStatus">Status</label>
            <select id="filterStatus" class="filter-select">
              <option value="">Todos os status</option>
              <option value="COMPLETED">Completa</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="filterStartDate">Data Início</label>
            <input type="date" id="filterStartDate" class="filter-input" />
          </div>

          <div class="filter-group">
            <label for="filterEndDate">Data Fim</label>
            <input type="date" id="filterEndDate" class="filter-input" />
          </div>

          <div class="filter-actions">
            <button id="applyFilters" class="btn btn-primary">
              Aplicar Filtros
            </button>
            <button id="clearFilters" class="btn btn-secondary">
              Limpar
            </button>
          </div>
        </div>

        <!-- Lessons Table -->
        <div class="history-table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th style="width: 40px;"></th>
                <th style="width: 80px;">Nº</th>
                <th>Título</th>
                <th style="width: 150px;">Turma</th>
                <th style="width: 150px;">Data</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 120px;">Presença</th>
                <th style="width: 100px;">Taxa</th>
              </tr>
            </thead>
            <tbody id="lessonsTableBody">
              <tr class="loading-row">
                <td colspan="8" style="text-align: center; padding: 40px;">
                  <div class="loading-spinner"></div>
                  <p>Carregando histórico...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="history-pagination">
          <div class="pagination-info">
            Mostrando <strong id="paginationInfo">0</strong> de <strong id="totalLessons">0</strong> aulas
          </div>
          <div class="pagination-controls">
            <button id="prevPage" class="btn-pagination" disabled>
              ← Anterior
            </button>
            <span id="pageNumbers" class="page-numbers"></span>
            <button id="nextPage" class="btn-pagination" disabled>
              Próxima →
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="empty-state" style="display: none;">
          <div class="empty-icon">📭</div>
          <h3>Nenhuma aula encontrada</h3>
          <p>Ajuste os filtros ou aguarde novas aulas serem agendadas.</p>
        </div>
      </div>
    `;
  }

  /**
   * Carrega histórico de aulas da API
   */
  async loadLessonsHistory() {
    try {
      this.showLoading();

      const queryParams = new URLSearchParams({
        page: this.currentPage,
        pageSize: this.pageSize,
        ...(this.filters.turmaId && { turmaId: this.filters.turmaId }),
        ...(this.filters.status && { status: this.filters.status }),
        ...(this.filters.startDate && { startDate: this.filters.startDate }),
        ...(this.filters.endDate && { endDate: this.filters.endDate })
      });

      const response = await this.moduleAPI.request(
        `/api/frequency/lessons-history?${queryParams}`
      );

      if (!response.success) {
        throw new Error(response.message || 'Erro ao carregar histórico');
      }

      // Armazena aulas no cache
      this.lessons = response.data;

      // Renderiza tabela
      this.renderLessonsTable(response.data);

      // Atualiza paginação
      this.updatePagination(response.pagination);

      // Esconde empty state
      this.hideEmptyState();

      // Se não há dados, mostra empty state
      if (response.data.length === 0) {
        this.showEmptyState();
      }

    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      this.showError(error.message);
      window.app?.handleError(error, { module: 'Frequency', context: 'loadLessonsHistory' });
    }
  }

  /**
   * Renderiza tabela de aulas
   */
  renderLessonsTable(lessons) {
    const tbody = this.container.querySelector('#lessonsTableBody');
    if (!tbody) return;

    if (lessons.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = lessons.map(lesson => this.getLessonRowHTML(lesson)).join('');

    // Adiciona eventos de clique nas linhas
    lessons.forEach(lesson => {
      const row = tbody.querySelector(`[data-lesson-id="${lesson.id}"]`);
      if (row) {
        row.addEventListener('click', (e) => {
          // Não expandir se clicar no botão
          if (e.target.classList.contains('expand-btn')) return;
          this.toggleRow(lesson.id);
        });
      }
    });
  }

  /**
   * HTML de uma linha da tabela
   */
  getLessonRowHTML(lesson) {
    const isExpanded = this.expandedRows.has(lesson.id);
    const statusClass = this.getStatusClass(lesson.status);
    const statusLabel = this.getStatusLabel(lesson.status);
    
    // Suporta ambos formatos: lesson.stats.attendanceRate (antigo) e lesson.attendanceRate (novo)
    const attendanceRate = lesson.stats?.attendanceRate ?? lesson.attendanceRate ?? 0;
    const attendanceRateClass = this.getAttendanceRateClass(attendanceRate);

    const scheduledDate = new Date(lesson.scheduledDate);
    const dateFormatted = scheduledDate.toLocaleDateString('pt-BR');
    const timeFormatted = scheduledDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const expandedRowHTML = isExpanded ? this.getExpandedRowHTML(lesson) : '';

    return `
      <tr class="lesson-row ${isExpanded ? 'expanded' : ''}" data-lesson-id="${lesson.id}">
        <td class="expand-cell">
          <button class="expand-btn" aria-label="Expandir" onclick="event.stopPropagation()">
            ${isExpanded ? '▼' : '▶'}
          </button>
        </td>
        <td class="lesson-number">${lesson.lessonNumber}</td>
        <td class="lesson-title">${lesson.title}</td>
        <td class="lesson-turma">${lesson.turmaName || lesson.turma?.name || 'N/A'}</td>
        <td class="lesson-date">
          ${dateFormatted}<br>
          <small>${timeFormatted}</small>
        </td>
        <td class="lesson-status">
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </td>
        <td class="lesson-attendance">
          ${lesson.presentStudents ?? lesson.stats?.presentStudents ?? 0} / ${lesson.totalStudents ?? lesson.stats?.totalStudents ?? 0}
        </td>
        <td class="lesson-rate">
          <span class="rate-badge ${attendanceRateClass}">
            ${attendanceRate}%
          </span>
        </td>
      </tr>
      ${expandedRowHTML}
    `;
  }

  /**
   * HTML da linha expandida (participantes)
   */
  getExpandedRowHTML(lesson) {
    const presentStudents = lesson.participants.filter(p => p.present);
    const absentStudents = lesson.participants.filter(p => !p.present);

    return `
      <tr class="expanded-row" data-lesson-id="${lesson.id}">
        <td colspan="8">
          <div class="participants-container">
            <div class="participants-section">
              <h4>✅ Presentes (${presentStudents.length})</h4>
              <div class="participants-list">
                ${presentStudents.map(p => `
                  <div class="participant-item present">
                    <span class="participant-name">${p.studentName}</span>
                    ${p.late ? '<span class="badge-late">Atrasado</span>' : ''}
                    ${p.checkedAt ? `<small>Check-in: ${new Date(p.checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>` : ''}
                  </div>
                `).join('')}
                ${presentStudents.length === 0 ? '<p class="no-participants">Nenhum aluno presente</p>' : ''}
              </div>
            </div>

            <div class="participants-section">
              <h4>❌ Ausentes (${absentStudents.length})</h4>
              <div class="participants-list">
                ${absentStudents.map(p => `
                  <div class="participant-item absent">
                    <span class="participant-name">${p.studentName}</span>
                    ${p.justified ? '<span class="badge-justified">Justificado</span>' : ''}
                  </div>
                `).join('')}
                ${absentStudents.length === 0 ? '<p class="no-participants">Nenhum aluno ausente</p>' : ''}
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Toggle expansão de linha
   */
  toggleRow(lessonId) {
    if (this.expandedRows.has(lessonId)) {
      this.expandedRows.delete(lessonId);
    } else {
      this.expandedRows.add(lessonId);
    }

    // Re-renderiza tabela mantendo o cache
    this.renderLessonsTable(this.lessons);
  }

  /**
   * Atualiza paginação
   */
  updatePagination(pagination) {
    const { page, pageSize, total, totalPages } = pagination;

    // Info
    const infoElement = this.container.querySelector('#paginationInfo');
    const totalElement = this.container.querySelector('#totalLessons');
    if (infoElement && totalElement) {
      const start = (page - 1) * pageSize + 1;
      const end = Math.min(page * pageSize, total);
      infoElement.textContent = total > 0 ? `${start}-${end}` : '0';
      totalElement.textContent = total;
    }

    // Buttons
    const prevBtn = this.container.querySelector('#prevPage');
    const nextBtn = this.container.querySelector('#nextPage');
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;

    // Page numbers
    const pageNumbersElement = this.container.querySelector('#pageNumbers');
    if (pageNumbersElement) {
      pageNumbersElement.innerHTML = this.getPageNumbersHTML(page, totalPages);
    }
  }

  /**
   * HTML dos números de página
   */
  getPageNumbersHTML(currentPage, totalPages) {
    if (totalPages <= 1) return '';

    let html = '';
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      html += `
        <button class="page-number ${isActive ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    return html;
  }

  /**
   * Configura eventos
   */
  setupEvents() {
    // Botão Refresh
    const refreshBtn = this.container.querySelector('#refreshHistory');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }

    // Botão Export CSV
    const exportBtn = this.container.querySelector('#exportHistoryCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportCSV());
    }

    // Filtros
    const applyBtn = this.container.querySelector('#applyFilters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.handleApplyFilters());
    }

    const clearBtn = this.container.querySelector('#clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClearFilters());
    }

    // Paginação
    const prevBtn = this.container.querySelector('#prevPage');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.handlePrevPage());
    }

    const nextBtn = this.container.querySelector('#nextPage');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.handleNextPage());
    }

    // Page numbers (event delegation)
    const pageNumbersContainer = this.container.querySelector('#pageNumbers');
    if (pageNumbersContainer) {
      pageNumbersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-number')) {
          const page = parseInt(e.target.dataset.page, 10);
          this.handleGoToPage(page);
        }
      });
    }
  }

  /**
   * Handlers
   */
  async handleRefresh() {
    console.log('🔄 Refresh manual solicitado');
    this.expandedRows.clear();
    await this.loadLessonsHistory();
  }

  handleApplyFilters() {
    this.filters.turmaId = this.container.querySelector('#filterTurma').value || null;
    this.filters.status = this.container.querySelector('#filterStatus').value || null;
    this.filters.startDate = this.container.querySelector('#filterStartDate').value || null;
    this.filters.endDate = this.container.querySelector('#filterEndDate').value || null;

    this.currentPage = 1;
    this.expandedRows.clear();
    this.loadLessonsHistory();
  }

  handleClearFilters() {
    this.filters = {
      turmaId: null,
      status: null,
      startDate: null,
      endDate: null
    };

    this.container.querySelector('#filterTurma').value = '';
    this.container.querySelector('#filterStatus').value = '';
    this.container.querySelector('#filterStartDate').value = '';
    this.container.querySelector('#filterEndDate').value = '';

    this.currentPage = 1;
    this.expandedRows.clear();
    this.loadLessonsHistory();
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.expandedRows.clear();
      this.loadLessonsHistory();
    }
  }

  handleNextPage() {
    this.currentPage++;
    this.expandedRows.clear();
    this.loadLessonsHistory();
  }

  handleGoToPage(page) {
    this.currentPage = page;
    this.expandedRows.clear();
    this.loadLessonsHistory();
  }

  async handleExportCSV() {
    console.log('📥 Exportando histórico para CSV...');
    alert('🚧 Exportação CSV será implementada em breve');
    // TODO: Implementar exportação CSV
  }

  /**
   * Helpers de UI
   */
  getStatusClass(status) {
    const map = {
      'COMPLETED': 'status-completed',
      'SCHEDULED': 'status-scheduled',
      'CANCELLED': 'status-cancelled'
    };
    return map[status] || '';
  }

  getStatusLabel(status) {
    const map = {
      'COMPLETED': 'Completa',
      'SCHEDULED': 'Agendada',
      'CANCELLED': 'Cancelada'
    };
    return map[status] || status;
  }

  getAttendanceRateClass(rate) {
    if (rate >= 80) return 'rate-excellent';
    if (rate >= 60) return 'rate-good';
    if (rate >= 40) return 'rate-fair';
    return 'rate-poor';
  }

  /**
   * Estados de UI
   */
  showLoading() {
    const tbody = this.container.querySelector('#lessonsTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr class="loading-row">
          <td colspan="8" style="text-align: center; padding: 40px;">
            <div class="loading-spinner"></div>
            <p>Carregando histórico...</p>
          </td>
        </tr>
      `;
    }
  }

  showEmptyState() {
    const emptyState = this.container.querySelector('#emptyState');
    const tableContainer = this.container.querySelector('.history-table-container');
    const paginationContainer = this.container.querySelector('.history-pagination');

    if (emptyState) emptyState.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';
  }

  hideEmptyState() {
    const emptyState = this.container.querySelector('#emptyState');
    const tableContainer = this.container.querySelector('.history-table-container');
    const paginationContainer = this.container.querySelector('.history-pagination');

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';
    if (paginationContainer) paginationContainer.style.display = 'flex';
  }

  showError(message) {
    const tbody = this.container.querySelector('#lessonsTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr class="error-row">
          <td colspan="8" style="text-align: center; padding: 40px;">
            <div class="error-icon">❌</div>
            <h3>Erro ao carregar histórico</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
              🔄 Recarregar Página
            </button>
          </td>
        </tr>
      `;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.expandedRows.clear();
    this.lessons = [];
    console.log('🗑️ History View destruída');
  }
}

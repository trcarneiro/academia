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
      endDate: null,
      studentId: null
    };
    this.viewMode = 'lessons'; // 'lessons' | 'student'
    this.expandedRows = new Set(); // IDs das linhas expandidas
    this.lessons = []; // Cache das aulas
    this.studentHistory = []; // Cache do histórico do aluno
  }

  /**
   * Renderiza a view completa
   */
  async render(container) {
    this.container = container;
    
    // HTML estrutura
    this.container.innerHTML = this.getHTML();
    
    // Carrega dados iniciais (apenas se estiver no modo lessons)
    if (this.viewMode === 'lessons') {
        await this.loadLessonsHistory();
    }
    
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
            <label>Visualizar por</label>
            <div class="view-mode-toggle">
                <button class="btn-toggle ${this.viewMode === 'lessons' ? 'active' : ''}" data-mode="lessons">Aulas</button>
                <button class="btn-toggle ${this.viewMode === 'student' ? 'active' : ''}" data-mode="student">Aluno</button>
            </div>
          </div>

          <div class="filter-group" id="studentFilterGroup" style="display: ${this.viewMode === 'student' ? 'block' : 'none'};">
            <label for="studentSearch">Aluno</label>
            <div class="search-wrapper">
                <input type="text" id="studentSearch" class="filter-input" placeholder="Buscar aluno..." autocomplete="off">
                <input type="hidden" id="selectedStudentId" value="${this.filters.studentId || ''}">
                <div id="studentSearchResults" class="search-results-dropdown"></div>
            </div>
          </div>

          <div class="filter-group" id="turmaFilterGroup" style="display: ${this.viewMode === 'lessons' ? 'block' : 'none'};">
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
          <table class="history-table" id="mainHistoryTable">
            <thead>
              ${this.getTableHeaderHTML()}
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
            Mostrando <strong id="paginationInfo">0</strong> de <strong id="totalLessons">0</strong> registros
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
          <h3>Nenhum registro encontrado</h3>
          <p>Ajuste os filtros ou aguarde novos registros.</p>
        </div>
      </div>
    `;
  }

  getTableHeaderHTML() {
      if (this.viewMode === 'lessons') {
          return `
              <tr>
                <th style="width: 40px;"></th>
                <th style="width: 80px;">Nº</th>
                <th>Título</th>
                <th style="width: 150px;">Turma</th>
                <th style="width: 150px;">Data</th>
                <th style="width: 100px;">Status</th>
                <th style="width: 120px;">Presença</th>
                <th style="width: 100px;">Taxa</th>
                <th style="width: 80px;">Ações</th>
              </tr>
          `;
      } else {
          return `
              <tr>
                <th style="width: 150px;">Data</th>
                <th>Aula</th>
                <th style="width: 150px;">Status</th>
                <th>Observações</th>
                <th style="width: 100px;">Ações</th>
              </tr>
          `;
      }
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
   * Carrega histórico do aluno
   */
  async loadStudentHistory() {
      if (!this.filters.studentId) {
          this.showEmptyState();
          return;
      }

      try {
          this.showLoading();

          const queryParams = new URLSearchParams({
              page: this.currentPage,
              limit: this.pageSize,
              studentId: this.filters.studentId,
              ...(this.filters.startDate && { startDate: this.filters.startDate }),
              ...(this.filters.endDate && { endDate: this.filters.endDate }),
              ...(this.filters.status && { status: this.filters.status })
          });

          const response = await this.moduleAPI.request(
              `/api/attendance/history?${queryParams}`
          );

          if (!response.success) {
              throw new Error(response.message || 'Erro ao carregar histórico do aluno');
          }

          this.studentHistory = response.data;
          this.renderStudentHistoryTable(response.data);
          
          // Pagination logic for student history (assuming API returns pagination metadata)
          // If API structure is different, adjust here.
          // Based on AttendanceController.getHistory:
          // return ResponseHelper.paginated(reply, result.attendances, result.page, result.limit, result.total);
          
          this.updatePagination({
              page: response.pagination?.page || this.currentPage,
              pageSize: response.pagination?.pageSize || this.pageSize,
              total: response.pagination?.total || 0,
              totalPages: response.pagination?.totalPages || 1
          });

          this.hideEmptyState();
          if (response.data.length === 0) {
              this.showEmptyState();
          }

      } catch (error) {
          console.error('❌ Erro ao carregar histórico do aluno:', error);
          this.showError(error.message);
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
          if (e.target.closest('.btn-roll')) return;
          this.toggleRow(lesson.id);
        });

        const rollBtn = row.querySelector('.btn-roll');
        if (rollBtn) {
            rollBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openRollModal(lesson.id);
            });
        }
      }
    });
  }

  renderStudentHistoryTable(attendances) {
      const tbody = this.container.querySelector('#lessonsTableBody');
      if (!tbody) return;

      if (attendances.length === 0) {
          tbody.innerHTML = '';
          return;
      }

      tbody.innerHTML = attendances.map(att => this.getStudentAttendanceRowHTML(att)).join('');
      
      // Add edit events
      attendances.forEach(att => {
          const row = tbody.querySelector(`[data-attendance-id="${att.id}"]`);
          if (row) {
              const editBtn = row.querySelector('.btn-edit-attendance');
              if (editBtn) {
                  editBtn.addEventListener('click', () => this.openEditAttendanceModal(att));
              }
          }
      });
  }

  getStudentAttendanceRowHTML(att) {
      const date = new Date(att.checkedAt || att.createdAt);
      const dateFormatted = date.toLocaleDateString('pt-BR');
      const timeFormatted = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      let statusLabel = 'Presente';
      let statusClass = 'status-completed';
      
      if (att.present === false) {
          statusLabel = 'Ausente';
          statusClass = 'status-cancelled';
      } else if (att.late) {
          statusLabel = 'Atrasado';
          statusClass = 'status-scheduled'; // Yellowish
      }

      return `
        <tr data-attendance-id="${att.id}">
            <td>
                ${dateFormatted}<br>
                <small>${timeFormatted}</small>
            </td>
            <td>
                <div class="lesson-title">${att.turmaLesson?.title || 'Aula'}</div>
                <small>${att.turmaLesson?.turma?.name || '-'}</small>
            </td>
            <td>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </td>
            <td>${att.notes || '-'}</td>
            <td>
                <button class="btn-icon btn-edit-attendance" title="Editar Presença">
                    ✏️
                </button>
            </td>
        </tr>
      `;
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
        <td class="lesson-actions">
            <button class="btn-icon btn-roll" title="Gerenciar Chamada">
                📝
            </button>
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
    // View Mode Toggles
    const toggleBtns = this.container.querySelectorAll('.btn-toggle');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            this.handleViewModeChange(mode);
        });
    });

    // Student Search
    const studentSearchInput = this.container.querySelector('#studentSearch');
    if (studentSearchInput) {
        let debounceTimer;
        studentSearchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleStudentSearch(e.target.value);
            }, 300);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                const results = this.container.querySelector('#studentSearchResults');
                if (results) results.style.display = 'none';
            }
        });
    }

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

  handleViewModeChange(mode) {
      if (this.viewMode === mode) return;
      
      this.viewMode = mode;
      
      // Update UI toggles
      this.container.querySelectorAll('.btn-toggle').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.mode === mode);
      });
      
      // Show/Hide filters
      const studentGroup = this.container.querySelector('#studentFilterGroup');
      const turmaGroup = this.container.querySelector('#turmaFilterGroup');
      
      if (mode === 'student') {
          studentGroup.style.display = 'block';
          turmaGroup.style.display = 'none';
      } else {
          studentGroup.style.display = 'none';
          turmaGroup.style.display = 'block';
      }
      
      // Update table header
      const thead = this.container.querySelector('.history-table thead');
      if (thead) {
          thead.innerHTML = this.getTableHeaderHTML();
      }
      
      // Reset pagination and load data
      this.currentPage = 1;
      this.expandedRows.clear();
      
      if (mode === 'lessons') {
          this.loadLessonsHistory();
      } else {
          // If a student is already selected, load their history
          if (this.filters.studentId) {
              this.loadStudentHistory();
          } else {
              // Clear table and show empty state or prompt
              const tbody = this.container.querySelector('#lessonsTableBody');
              if (tbody) tbody.innerHTML = '';
              this.showEmptyState();
              // Optionally change empty state message
              const emptyState = this.container.querySelector('#emptyState p');
              if (emptyState) emptyState.textContent = 'Selecione um aluno para ver o histórico.';
          }
      }
  }

  async handleStudentSearch(query) {
      const resultsContainer = this.container.querySelector('#studentSearchResults');
      if (!query || query.length < 2) {
          resultsContainer.style.display = 'none';
          return;
      }

      try {
          // Use existing API endpoint for student search
          const response = await this.moduleAPI.request(`/api/students?search=${encodeURIComponent(query)}&limit=5`);
          
          if (response.success && response.data.length > 0) {
              resultsContainer.innerHTML = response.data.map(student => `
                  <div class="search-result-item" data-id="${student.id}" data-name="${student.name}">
                      <div class="student-name">${student.name}</div>
                      <small>${student.email || ''}</small>
                  </div>
              `).join('');
              
              resultsContainer.style.display = 'block';
              
              // Add click events
              resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                  item.addEventListener('click', () => {
                      this.selectStudent({
                          id: item.dataset.id,
                          name: item.dataset.name
                      });
                      resultsContainer.style.display = 'none';
                  });
              });
          } else {
              resultsContainer.innerHTML = '<div class="no-results">Nenhum aluno encontrado</div>';
              resultsContainer.style.display = 'block';
          }
      } catch (error) {
          console.error('Error searching students:', error);
      }
  }

  selectStudent(student) {
      this.filters.studentId = student.id;
      this.container.querySelector('#studentSearch').value = student.name;
      this.container.querySelector('#selectedStudentId').value = student.id;
      
      // Trigger load
      this.currentPage = 1;
      this.loadStudentHistory();
  }

  /**
   * Handlers
   */
  async handleRefresh() {
    console.log('🔄 Refresh manual solicitado');
    this.expandedRows.clear();
    if (this.viewMode === 'lessons') {
        await this.loadLessonsHistory();
    } else {
        await this.loadStudentHistory();
    }
  }

  handleApplyFilters() {
    this.filters.turmaId = this.container.querySelector('#filterTurma').value || null;
    this.filters.status = this.container.querySelector('#filterStatus').value || null;
    this.filters.startDate = this.container.querySelector('#filterStartDate').value || null;
    this.filters.endDate = this.container.querySelector('#filterEndDate').value || null;
    // studentId is already set by selectStudent

    this.currentPage = 1;
    this.expandedRows.clear();
    
    if (this.viewMode === 'lessons') {
        this.loadLessonsHistory();
    } else {
        this.loadStudentHistory();
    }
  }

  handleClearFilters() {
    this.filters = {
      turmaId: null,
      status: null,
      startDate: null,
      endDate: null,
      studentId: null
    };

    this.container.querySelector('#filterTurma').value = '';
    this.container.querySelector('#filterStatus').value = '';
    this.container.querySelector('#filterStartDate').value = '';
    this.container.querySelector('#filterEndDate').value = '';
    
    const studentInput = this.container.querySelector('#studentSearch');
    if (studentInput) studentInput.value = '';
    const studentIdInput = this.container.querySelector('#selectedStudentId');
    if (studentIdInput) studentIdInput.value = '';

    this.currentPage = 1;
    this.expandedRows.clear();
    
    if (this.viewMode === 'lessons') {
        this.loadLessonsHistory();
    } else {
        // Clear table
        const tbody = this.container.querySelector('#lessonsTableBody');
        if (tbody) tbody.innerHTML = '';
        this.showEmptyState();
    }
  }

  handlePrevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.expandedRows.clear();
      if (this.viewMode === 'lessons') {
          this.loadLessonsHistory();
      } else {
          this.loadStudentHistory();
      }
    }
  }

  handleNextPage() {
    this.currentPage++;
    this.expandedRows.clear();
    if (this.viewMode === 'lessons') {
        this.loadLessonsHistory();
    } else {
        this.loadStudentHistory();
    }
  }

  handleGoToPage(page) {
    this.currentPage = page;
    this.expandedRows.clear();
    if (this.viewMode === 'lessons') {
        this.loadLessonsHistory();
    } else {
        this.loadStudentHistory();
    }
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

  /**
   * Abre modal de chamada
   */
  async openRollModal(lessonId) {
    try {
      // Show loading
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
            <div class="modal-content">
                <div class="loading-spinner"></div>
                <p style="text-align: center; padding: 20px;">Carregando lista de chamada...</p>
            </div>
        `;
      document.body.appendChild(modal);

      // Fetch data
      const response = await this.moduleAPI.request(
        `/api/attendance/lesson/${lessonId}/roll`
      );

      if (!response.success) throw new Error(response.message);

      // Render modal content
      this.renderRollModalContent(modal, response.data);
    } catch (error) {
      console.error('Error opening roll modal:', error);
      alert('Erro ao carregar chamada: ' + error.message);
      document.querySelector('.modal-overlay')?.remove();
    }
  }

  renderRollModalContent(modalContainer, data) {
    const { lesson, students } = data;

    modalContainer.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>📝 Chamada: ${lesson.turmaName}</h2>
                <button class="close-modal">×</button>
            </div>
            <div class="modal-body">
                <div class="lesson-info" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px;">
                    <div><strong>Data:</strong> ${new Date(
                      lesson.date
                    ).toLocaleDateString('pt-BR')} ${new Date(
      lesson.date
    ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><strong>Instrutor:</strong> ${
                      lesson.instructorName
                    }</div>
                    <div><strong>Tópico:</strong> ${lesson.topic || '-'}</div>
                </div>

                <div class="roll-list">
                    <table class="roll-table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th style="width: 150px;">Status</th>
                                <th>Obs</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students
                              .map(
                                (s) => `
                                <tr data-student-id="${s.student.id}">
                                    <td>
                                        <div class="student-info">
                                            <img src="${
                                              s.student.photoUrl ||
                                              '/assets/default-avatar.png'
                                            }" class="avatar-small" onerror="this.src='/assets/default-avatar.png'">
                                            <div>
                                                <div class="student-name">${
                                                  s.student.firstName
                                                } ${s.student.lastName}</div>
                                                <div class="student-reg">${
                                                  s.student.registrationNumber ||
                                                  '-'
                                                }</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <select class="status-select" data-original="${
                                          s.status
                                        }">
                                            <option value="PRESENT" ${
                                              s.status === 'PRESENT'
                                                ? 'selected'
                                                : ''
                                            }>✅ Presente</option>
                                            <option value="LATE" ${
                                              s.status === 'LATE'
                                                ? 'selected'
                                                : ''
                                            }>⏰ Atrasado</option>
                                            <option value="ABSENT" ${
                                              s.status === 'ABSENT'
                                                ? 'selected'
                                                : ''
                                            }>❌ Ausente</option>
                                            <option value="NONE" ${
                                              s.status === 'NONE'
                                                ? 'selected'
                                                : ''
                                            }>⚪ Pendente</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="text" class="notes-input" value="${
                                          s.notes || ''
                                        }" placeholder="Observações">
                                    </td>
                                </tr>
                            `
                              )
                              .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancelar</button>
                <button class="btn btn-primary save-roll">Salvar Chamada</button>
            </div>
        </div>
    `;

    // Events
    const closeBtns = modalContainer.querySelectorAll('.close-modal');
    closeBtns.forEach((btn) => (btn.onclick = () => modalContainer.remove()));

    const saveBtn = modalContainer.querySelector('.save-roll');
    saveBtn.onclick = async () => {
      await this.saveRoll(lesson.id, modalContainer);
    };
  }

  async saveRoll(lessonId, modalContainer) {
    const rows = modalContainer.querySelectorAll('tbody tr');
    const updates = [];

    rows.forEach((row) => {
      const studentId = row.dataset.studentId;
      const status = row.querySelector('.status-select').value;
      const notes = row.querySelector('.notes-input').value;
      const originalStatus =
        row.querySelector('.status-select').dataset.original;

      // Only send changes (or if status is not NONE)
      if (status !== originalStatus || (status !== 'NONE' && notes)) {
        updates.push({ studentId, status, notes });
      }
    });

    if (updates.length === 0) {
      modalContainer.remove();
      return;
    }

    try {
      const saveBtn = modalContainer.querySelector('.save-roll');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando...';

      const response = await this.moduleAPI.request(
        `/api/attendance/lesson/${lessonId}/roll`,
        {
          method: 'PUT',
          body: JSON.stringify({ updates }),
        }
      );

      if (response.success) {
        // alert('Chamada salva com sucesso!'); // Removed alert for better UX
        modalContainer.remove();
        this.loadLessonsHistory(); // Refresh list
        
        // Show toast notification if available
        if (window.app?.showToast) {
            window.app.showToast('Chamada salva com sucesso!', 'success');
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error saving roll:', error);
      alert('Erro ao salvar: ' + error.message);
      const saveBtn = modalContainer.querySelector('.save-roll');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar Chamada';
    }
  }

  /**
   * Abre modal de edição de presença
   */
  openEditAttendanceModal(attendance) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      
      const isPresent = attendance.present;
      const isLate = attendance.late;
      
      modal.innerHTML = `
          <div class="modal-content">
              <div class="modal-header">
                  <h2>✏️ Editar Presença</h2>
                  <button class="close-modal">×</button>
              </div>
              <div class="modal-body">
                  <div class="form-group">
                      <label>Aluno</label>
                      <input type="text" class="form-input" value="${attendance.student?.name || 'Aluno'}" disabled>
                  </div>
                  <div class="form-group">
                      <label>Aula</label>
                      <input type="text" class="form-input" value="${attendance.turmaLesson?.title || 'Aula'}" disabled>
                  </div>
                  
                  <div class="form-group">
                      <label>Status</label>
                      <div class="radio-group">
                          <label class="radio-label">
                              <input type="radio" name="attendanceStatus" value="present" ${isPresent && !isLate ? 'checked' : ''}>
                              Presente
                          </label>
                          <label class="radio-label">
                              <input type="radio" name="attendanceStatus" value="late" ${isPresent && isLate ? 'checked' : ''}>
                              Atrasado
                          </label>
                          <label class="radio-label">
                              <input type="radio" name="attendanceStatus" value="absent" ${!isPresent ? 'checked' : ''}>
                              Ausente
                          </label>
                      </div>
                  </div>
                  
                  <div class="form-group">
                      <label>Observações</label>
                      <textarea id="attendanceNotes" class="form-input" rows="3">${attendance.notes || ''}</textarea>
                  </div>
              </div>
              <div class="modal-footer">
                  <button class="btn btn-secondary close-modal-btn">Cancelar</button>
                  <button class="btn btn-primary" id="saveAttendanceBtn">Salvar</button>
              </div>
          </div>
      `;
      
      document.body.appendChild(modal);
      
      // Events
      const close = () => modal.remove();
      modal.querySelector('.close-modal').addEventListener('click', close);
      modal.querySelector('.close-modal-btn').addEventListener('click', close);
      
      modal.querySelector('#saveAttendanceBtn').addEventListener('click', async () => {
          const status = modal.querySelector('input[name="attendanceStatus"]:checked').value;
          const notes = modal.querySelector('#attendanceNotes').value;
          
          const data = {
              present: status !== 'absent',
              late: status === 'late',
              notes: notes
          };
          
          await this.handleSaveAttendance(attendance.id, data);
          close();
      });
  }

  async handleSaveAttendance(attendanceId, data) {
      try {
          const response = await this.moduleAPI.request(`/api/attendance/${attendanceId}`, {
              method: 'PUT',
              body: JSON.stringify(data)
          });
          
          if (response.success) {
              // Refresh list
              this.loadStudentHistory();
              // Show success toast (if available) or simple alert
              // alert('Presença atualizada com sucesso!'); 
          } else {
              throw new Error(response.message);
          }
      } catch (error) {
          console.error('Error updating attendance:', error);
          alert('Erro ao atualizar presença: ' + error.message);
      }
  }
}

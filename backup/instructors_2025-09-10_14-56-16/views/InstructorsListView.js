const InstructorsListView = {
  render(instructors, container) {
    container.innerHTML = `
      <div class="module-header-premium">
        <div class="header-content">
          <nav class="breadcrumb-premium">
            <span class="breadcrumb-item">🏠 Academia</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">👨‍🏫 Instrutores</span>
          </nav>
          <div class="title-section">
            <h1>👨‍🏫 Instrutores</h1>
            <p class="subtitle">Gerenciamento da equipe de instrutores</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary-premium" data-action="create-instructor">
              ➕ Novo Instrutor
            </button>
          </div>
        </div>
      </div>

      <div class="module-stats-premium">
        ${this.renderStats(instructors)}
      </div>

      <div class="module-filters-premium">
        <div class="filter-group">
          <input type="text" id="searchInstructors" placeholder="🔍 Buscar instrutores..." class="filter-input">
          <select id="filterStatus" class="filter-select">
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      <div class="data-card-premium">
        ${this.renderInstructorsList(instructors)}
      </div>
    `;

    this.setupFilters();
  },

  renderStats(instructors) {
    const totalInstructors = instructors.length;
    const activeInstructors = instructors.filter(i => i.isActive !== false).length;
    const inactiveInstructors = totalInstructors - activeInstructors;

    return `
      <div class="stat-card-enhanced">
        <div class="stat-icon">👨‍🏫</div>
        <div class="stat-content">
          <div class="stat-number">${totalInstructors}</div>
          <div class="stat-label">Total de Instrutores</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">${activeInstructors}</div>
          <div class="stat-label">Instrutores Ativos</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">⏸️</div>
        <div class="stat-content">
          <div class="stat-number">${inactiveInstructors}</div>
          <div class="stat-label">Instrutores Inativos</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">📧</div>
        <div class="stat-content">
          <div class="stat-number">${instructors.filter(i => i.email).length}</div>
          <div class="stat-label">Com Email</div>
        </div>
      </div>
    `;
  },

  renderInstructorsList(instructors) {
    if (instructors.length === 0) {
      return '<div class="empty-state">Nenhum instrutor encontrado</div>';
    }

    return `
      <div class="data-table-premium">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>ID do Usuário</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${instructors.map(instructor => `
              <tr class="table-row-interactive instructor-row" data-id="${instructor.id}">
                <td>
                  <div class="cell-content">
                    <strong>${instructor.name}</strong>
                  </div>
                </td>
                <td>${instructor.email || 'Não informado'}</td>
                <td>${instructor.userId || 'Não definido'}</td>
                <td>
                  <span class="status ${instructor.isActive !== false ? 'status-active' : 'status-inactive'}">
                    ${instructor.isActive !== false ? '✅ Ativo' : '⏸️ Inativo'}
                  </span>
                </td>
                <td>${this.formatDate(instructor.createdAt)}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" data-action="edit-instructor" data-id="${instructor.id}" title="Editar">
                      ✏️
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderEmpty(container) {
    container.innerHTML = `
      <div class="module-header-premium">
        <div class="header-content">
          <nav class="breadcrumb-premium">
            <span class="breadcrumb-item">🏠 Academia</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">👨‍🏫 Instrutores</span>
          </nav>
          <div class="title-section">
            <h1>👨‍🏫 Instrutores</h1>
            <p class="subtitle">Gerenciamento da equipe de instrutores</p>
          </div>
        </div>
      </div>

      <div class="empty-state-premium">
        <div class="empty-icon">👨‍🏫</div>
        <h3>Nenhum instrutor encontrado</h3>
        <p>Comece adicionando o primeiro instrutor à sua equipe</p>
        <button class="btn-primary-premium" data-action="create-instructor">
          ➕ Adicionar Primeiro Instrutor
        </button>
      </div>
    `;
  },

  setupFilters() {
    const searchInput = document.getElementById('searchInstructors');
    const statusFilter = document.getElementById('filterStatus');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterInstructors());
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterInstructors());
    }
  },

  filterInstructors() {
    // Implementation for filtering (if needed)
  },

  formatDate(dateString) {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }
};

// Export globally  
window.InstructorsListView = InstructorsListView;

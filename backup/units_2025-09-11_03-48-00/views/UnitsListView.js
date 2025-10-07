export default {
  render(units, container) {
    // Defensive programming: ensure units is an array
    if (!units || !Array.isArray(units)) {
      console.warn('[UnitsListView] render called with invalid units:', units);
      units = [];
    }
    
    container.innerHTML = `
      <div class="module-header-premium">
        <div class="header-content">
          <nav class="breadcrumb-premium">
            <span class="breadcrumb-item">🏠 Academia</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">🏢 Unidades/Filiais</span>
          </nav>
          <div class="title-section">
            <h1>🏢 Unidades/Filiais</h1>
            <p class="subtitle">Gerenciamento de unidades e filiais por organização</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary-premium" data-action="create-unit">
              ➕ Nova Unidade
            </button>
          </div>
        </div>
      </div>

      <div class="module-stats-premium">
        ${this.renderStats(units)}
      </div>

      <div class="module-filters-premium">
        <div class="filter-group">
          <input type="text" id="searchUnits" placeholder="🔍 Buscar unidades..." class="filter-input">
          <select id="filterOrganization" class="filter-select">
            <option value="">Todas as organizações</option>
          </select>
          <select id="filterStatus" class="filter-select">
            <option value="">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      <div class="data-card-premium">
        ${this.renderUnitsList(units)}
      </div>
    `;

  this.setupFilters(container);
  this.loadOrganizations(container);
  },

  renderStats(units) {
    // Defensive programming: ensure units is an array
    if (!units || !Array.isArray(units)) {
      console.warn('[UnitsListView] renderStats called with invalid units:', units);
      units = [];
    }
    
    const totalUnits = units.length;
    const activeUnits = units.filter(u => u.isActive !== false).length;
    const inactiveUnits = totalUnits - activeUnits;
    const organizations = [...new Set(units.map(u => u.organization?.id).filter(Boolean))].length;

    return `
      <div class="stat-card-enhanced">
        <div class="stat-icon">🏢</div>
        <div class="stat-content">
          <div class="stat-number">${totalUnits}</div>
          <div class="stat-label">Total de Unidades</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">${activeUnits}</div>
          <div class="stat-label">Unidades Ativas</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">🏫</div>
        <div class="stat-content">
          <div class="stat-number">${organizations}</div>
          <div class="stat-label">Organizações</div>
        </div>
      </div>
      <div class="stat-card-enhanced">
        <div class="stat-icon">⏸️</div>
        <div class="stat-content">
          <div class="stat-number">${inactiveUnits}</div>
          <div class="stat-label">Unidades Inativas</div>
        </div>
      </div>
    `;
  },

  renderUnitsList(units) {
    // Defensive programming: ensure units is an array
    if (!units || !Array.isArray(units)) {
      console.warn('[UnitsListView] renderUnitsList called with invalid units:', units);
      units = [];
    }
    
    if (units.length === 0) {
      return '<div class="empty-state">Nenhuma unidade encontrada</div>';
    }

    return `
      <div class="data-table-premium">
        <table>
          <thead>
            <tr>
              <th>🏫 Organização</th>
              <th>📍 Nome da Unidade</th>
              <th>🏠 Endereço</th>
              <th>🌆 Cidade</th>
              <th>📊 Status</th>
              <th>⚙️ Ações</th>
            </tr>
          </thead>
          <tbody>
            ${units.map(unit => `
              <tr class="table-row-interactive unit-row" data-id="${unit.id}">
                <td>
                  <div class="organization-info">
                    <strong>${unit.organization?.name || 'Sem organização'}</strong>
                    <small class="organization-slug">${unit.organization?.slug || ''}</small>
                  </div>
                </td>
                <td>
                  <div class="cell-content">
                    <strong>${unit.name}</strong>
                    ${unit.description ? `<small>${unit.description}</small>` : ''}
                  </div>
                </td>
                <td>${unit.address || 'Não informado'}</td>
                <td>${unit.city || 'Não informado'}</td>
                <td>
                  <span class="status ${unit.isActive !== false ? 'status-active' : 'status-inactive'}">
                    ${unit.isActive !== false ? '✅ Ativa' : '⏸️ Inativa'}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" data-action="edit-unit" data-id="${unit.id}" title="Editar">
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
            <span class="breadcrumb-item active">🏢 Unidades</span>
          </nav>
          <div class="title-section">
            <h1>🏢 Unidades</h1>
            <p class="subtitle">Gerenciamento de unidades e filiais</p>
          </div>
        </div>
      </div>

      <div class="empty-state-premium">
        <div class="empty-icon">🏢</div>
        <h3>Nenhuma unidade encontrada</h3>
        <p>Comece criando sua primeira unidade para organizar as filiais</p>
        <button class="btn-primary-premium" data-action="create-unit">
          ➕ Criar Primeira Unidade
        </button>
      </div>
    `;
  },

  setupFilters(container) {
    const scope = container || document;
    const searchInput = scope.querySelector('#searchUnits');
    const statusFilter = scope.querySelector('#filterStatus');
    const organizationFilter = scope.querySelector('#filterOrganization');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterUnits());
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterUnits());
    }

    if (organizationFilter) {
      organizationFilter.addEventListener('change', () => this.filterUnits());
    }
  },

  async loadOrganizations(container) {
    try {
      const api = window.unitsModule?.api || window.createModuleAPI?.('Units');
      if (!api) return;
      const response = await api.fetchWithStates('/api/organizations');
      if (response?.success && response?.data) {
        this.populateOrganizationFilter(response.data, container);
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    }
  },

  populateOrganizationFilter(organizations, container) {
    const scope = container || document;
    const select = scope.querySelector('#filterOrganization');
    if (select && organizations) {
      // Limpar opções existentes (manter só a primeira)
      select.innerHTML = '<option value="">Todas as organizações</option>';
      
      organizations.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = org.name;
        select.appendChild(option);
      });
    }
  },

  filterUnits() {
    // Implementation for filtering (if needed)
  },

  formatDate(dateString) {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  }
};

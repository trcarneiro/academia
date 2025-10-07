/**
 * Instructors Controller - Simplified and Working Version
 * Handles the business logic for the instructors module
 */
class InstructorsController {
  constructor() {
    this.container = null;
    this.moduleAPI = null;
    this.initialized = false;
  }

  /**
   * Initialize the controller with container
   */
  async initialize(container) {
    try {
      console.log('🔧 [InstructorsController] Initializing...');
      
      this.container = container;
      
      // Wait for API to be available
      await this.waitForAPI();
      
      // Load and render data
      await this.loadAndRender();
      
      this.initialized = true;
      console.log('✅ [InstructorsController] Initialized successfully');
      
    } catch (error) {
      console.error('❌ [InstructorsController] Initialization failed:', error);
      this.renderError(error.message);
    }
  }

  /**
   * Wait for API client to be available
   */
  async waitForAPI() {
    let attempts = 0;
    while (!window.createModuleAPI && attempts < 50) {
      console.log('[InstructorsController] Waiting for API client...');
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.createModuleAPI) {
      throw new Error('API client not available after 5 seconds');
    }
    
    this.moduleAPI = window.createModuleAPI('Instructors');
    console.log('[InstructorsController] API client ready');
  }

  /**
   * Load data and render UI
   */
  async loadAndRender() {
    try {
      // Show loading state
      this.renderLoading();
      
      // Fetch instructors data
      const response = await fetch('/api/instructors');
      const data = await response.json();
      
      if (data.success) {
        const instructors = data.data || [];
        console.log('[InstructorsController] Loaded', instructors.length, 'instructors');
        this.renderInstructors(instructors);
      } else {
        throw new Error(data.error || 'Failed to load instructors');
      }
      
    } catch (error) {
      console.error('[InstructorsController] Load error:', error);
      this.renderError('Erro ao carregar instrutores: ' + error.message);
    }
  }

  /**
   * Render loading state
   */
  renderLoading() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="module-header-premium">
        <div class="breadcrumb-premium">
          <span class="breadcrumb-item active">Instrutores</span>
        </div>
        <h1>👨‍🏫 Instrutores</h1>
      </div>
      <div class="loading-state-premium">
        <div class="spinner-premium"></div>
        <p>Carregando instrutores...</p>
      </div>
    `;
  }

  /**
   * Render instructors list
   */
  renderInstructors(instructors) {
    if (!this.container) return;
    
    const totalInstructors = instructors.length;
    const activeInstructors = instructors.filter(i => i.isActive !== false).length;
    
    this.container.innerHTML = `
      <div class="module-header-premium">
        <div class="breadcrumb-premium">
          <span class="breadcrumb-item active">Instrutores</span>
        </div>
        <h1>👨‍🏫 Instrutores</h1>
        <div class="header-actions">
          <button id="add-instructor-btn" class="btn-primary">
            <i class="fas fa-plus"></i>
            Novo Instrutor
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card-enhanced">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">${totalInstructors}</div>
            <div class="stat-label">Total de Instrutores</div>
          </div>
        </div>

        <div class="stat-card-enhanced">
          <div class="stat-icon">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">${activeInstructors}</div>
            <div class="stat-label">Instrutores Ativos</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="module-filters-premium">
        <div class="filter-group">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="instructor-search" placeholder="Buscar instrutores..." class="search-input">
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="data-card-premium">
        ${this.renderInstructorsTable(instructors)}
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render instructors table
   */
  renderInstructorsTable(instructors) {
    if (instructors.length === 0) {
      return `
        <div class="empty-state-premium">
          <div class="empty-icon-premium">
            <i class="fas fa-user-tie"></i>
          </div>
          <h3>Nenhum instrutor encontrado</h3>
          <p>Não há instrutores cadastrados no sistema.</p>
          <button id="add-first-instructor" class="btn-primary">
            <i class="fas fa-plus"></i>
            Adicionar Primeiro Instrutor
          </button>
        </div>
      `;
    }

    return `
      <div class="table-header-premium">
        <h3>Lista de Instrutores</h3>
      </div>
      <div class="table-container-premium">
        <table class="data-table-premium">
          <thead>
            <tr>
              <th>Instrutor</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${instructors.map(instructor => this.renderInstructorRow(instructor)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render single instructor row
   */
  renderInstructorRow(instructor) {
    const statusClass = instructor.isActive ? 'status-active' : 'status-inactive';
    const statusText = instructor.isActive ? 'Ativo' : 'Inativo';

    return `
      <tr class="data-row-premium" data-id="${instructor.id}">
        <td>
          <div class="user-info-premium">
            <div class="user-avatar-premium">
              <span>${instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I'}</span>
            </div>
            <div class="user-details-premium">
              <span class="user-name-premium">${instructor.name || 'Nome não informado'}</span>
              <span class="user-email-premium">${instructor.email || 'Email não informado'}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="contact-info">
            <div>${instructor.phone || '-'}</div>
          </div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <div class="table-actions-premium">
            <button class="btn-icon edit-btn" title="Editar" data-id="${instructor.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-btn" title="Excluir" data-id="${instructor.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Render error state
   */
  renderError(message) {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="module-header-premium">
        <div class="breadcrumb-premium">
          <span class="breadcrumb-item active">Instrutores</span>
        </div>
        <h1>👨‍🏫 Instrutores</h1>
      </div>
      <div class="error-state-premium">
        <div class="error-icon-premium">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Erro ao carregar módulo</h3>
        <p>${message}</p>
        <button class="btn-primary" onclick="location.reload()">
          Tentar Novamente
        </button>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.container) return;

    // Add instructor button
    const addBtn = this.container.querySelector('#add-instructor-btn, #add-first-instructor');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.navigateToEditor();
      });
    }

    // Search input
    const searchInput = this.container.querySelector('#instructor-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Edit buttons
    const editBtns = this.container.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const instructorId = btn.dataset.id;
        this.navigateToEditor(instructorId);
      });
    });

    // Delete buttons
    const deleteBtns = this.container.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const instructorId = btn.dataset.id;
        this.handleDelete(instructorId);
      });
    });

    // Row double click
    const rows = this.container.querySelectorAll('.data-row-premium');
    rows.forEach(row => {
      row.addEventListener('dblclick', () => {
        const instructorId = row.dataset.id;
        this.navigateToEditor(instructorId);
      });
    });
  }

  /**
   * Handle search functionality
   */
  handleSearch(searchTerm) {
    const rows = this.container.querySelectorAll('.data-row-premium');
    rows.forEach(row => {
      const name = row.querySelector('.user-name-premium')?.textContent.toLowerCase() || '';
      const email = row.querySelector('.user-email-premium')?.textContent.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      if (name.includes(searchLower) || email.includes(searchLower)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  /**
   * Handle delete instructor
   */
  async handleDelete(instructorId) {
    if (!confirm('Tem certeza que deseja excluir este instrutor?')) return;

    try {
      const response = await fetch(`/api/instructors/${instructorId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload the list
        await this.loadAndRender();
      } else {
        alert('Erro ao excluir instrutor: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro ao excluir instrutor: ' + error.message);
    }
  }

  /**
   * Navigate to editor
   */
  navigateToEditor(instructorId = null) {
    const path = instructorId ? `#/instructors/edit/${instructorId}` : '#/instructors/new';
    window.location.hash = path;
  }

  /**
   * Refresh/reload data
   */
  async refresh() {
    if (this.initialized) {
      await this.loadAndRender();
    }
  }

  /**
   * Alias for refresh - used by navigation
   */
  async loadList() {
    return this.refresh();
  }
}

// Export globally
window.InstructorsController = InstructorsController;

/**
 * Instructors Controller
 * Handles the business logic for the instructors module
 * Follows AGENTS.md patterns for API client usage and UI states
 */
class InstructorsController {
  constructor() {
    this.moduleAPI = null;
    this.instructorsContainer = null;
    this.instructorsTable = null;
    this.loadingElement = null;
    this.emptyElement = null;
    this.errorElement = null;
    this.initialized = false;
  }

  /**
   * Initialize the controller
   */
  async initialize() {
    try {
      console.log('🔧 Initializing Instructors Controller...');

      // Get API instance using the standard pattern
      await this.initializeAPI();

      // Find DOM elements
      this.findElements();

      // Load instructors data
      await this.loadInstructors();

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing Instructors Controller:', error);
      this.showError('Não foi possível carregar os dados de instrutores.');
    }
  }

  /**
   * Initialize the API client
   */
  async initializeAPI() {
    // Wait for API client to be available
    return new Promise((resolve) => {
      if (window.createModuleAPI) {
        this.moduleAPI = window.createModuleAPI('Instructors');
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.createModuleAPI) {
            this.moduleAPI = window.createModuleAPI('Instructors');
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      }
    });
  }

  /**
   * Find DOM elements
   */
  findElements() {
    this.instructorsContainer = document.getElementById('module-content');
    this.loadingElement = document.querySelector('.module-isolated-loading-state');
    this.emptyElement = document.querySelector('.module-isolated-empty-state');
    this.errorElement = document.querySelector('.module-isolated-error-state');
    this.instructorsTable = document.getElementById('instructors-table');
  }

  /**
   * Load instructors data from API
   */
  async loadInstructors() {
    try {
      // Use fetchWithStates for automatic state management
      await this.moduleAPI.fetchWithStates('/api/instructors', {
        loadingElement: this.loadingElement,
        onSuccess: (response) => this.onSuccess(response),
        onEmpty: () => this.onEmpty(),
        onError: (error) => this.onError(error)
      });
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Handle successful API response
   * @param {Object} response - API response object
   */
  onSuccess(response) {
    if (response && response.data) {
      console.log('[InstructorsController] onSuccess - count:', response.data.length);

      // Hide loading, empty and error states
      if (this.loadingElement) this.loadingElement.style.display = 'none';
      if (this.emptyElement) this.emptyElement.style.display = 'none';
      if (this.errorElement) this.errorElement.style.display = 'none';

      // Show content
      if (this.instructorsContainer) {
        this.instructorsContainer.style.display = 'block';
      }

      // Render instructors
      this.renderInstructors(response.data);
    } else {
      this.onEmpty();
    }
  }

  /**
   * Handle empty API response
   */
  onEmpty() {
    // Hide loading and error states
    if (this.loadingElement) this.loadingElement.style.display = 'none';
    if (this.errorElement) this.errorElement.style.display = 'none';

    // Show empty state
    if (this.emptyElement) {
      this.emptyElement.style.display = 'flex';
    } else {
      // Create empty state if it doesn't exist
      this.createEmptyState();
    }
  }

  /**
   * Handle API error
   * @param {Error} error - Error object
   */
  onError(error) {
    console.error('Error loading instructors:', error);

    // Use app error handler if available
    if (window.app && typeof window.app.handleError === 'function') {
      window.app.handleError(error, { module: 'instructors', context: 'loading-data' });
    }

    // Hide loading and empty states
    if (this.loadingElement) this.loadingElement.style.display = 'none';
    if (this.emptyElement) this.emptyElement.style.display = 'none';

    // Show error state
    if (this.errorElement) {
      const errorMessage = this.errorElement.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.textContent = error.message || 'Não foi possível carregar os dados de instrutores.';
      }
      this.errorElement.style.display = 'flex';
    } else {
      // Create error state if it doesn't exist
      this.createErrorState(error.message);
    }
  }

  /**
   * Create empty state UI
   */
  createEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'module-isolated-empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon-premium">
        <i class="fas fa-user-slash"></i>
      </div>
      <h3>Nenhum instrutor encontrado</h3>
      <p>Não há instrutores cadastrados no sistema.</p>
      <button class="btn-primary" onclick="window.location.href='#/instructors/new'">
        <i class="fas fa-plus"></i>
        Adicionar Instrutor
      </button>
    `;

    if (this.instructorsContainer) {
      this.instructorsContainer.appendChild(emptyState);
      this.emptyElement = emptyState;
    }

    emptyState.style.display = 'flex';
  }

  /**
   * Create error state UI
   * @param {string} message - Error message
   */
  createErrorState(message) {
    const errorState = document.createElement('div');
    errorState.className = 'module-isolated-error-state';
    errorState.innerHTML = `
      <div class="error-icon-premium">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>Erro ao carregar instrutores</h3>
      <p class="error-message">${message || 'Não foi possível carregar os dados de instrutores.'}</p>
      <button class="btn-primary" onclick="window.location.reload()">
        Tentar Novamente
      </button>
    `;

    if (this.instructorsContainer) {
      this.instructorsContainer.appendChild(errorState);
      this.errorElement = errorState;
    }

    errorState.style.display = 'flex';
  }

  /**
   * Render instructors in the UI
   * @param {Array} instructors - List of instructors
   */
  renderInstructors(instructors) {
    // Get or create table body
    let tableBody = this.instructorsTable.querySelector('tbody');
    if (!tableBody) {
      tableBody = document.createElement('tbody');
      this.instructorsTable.appendChild(tableBody);
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each instructor
    instructors.forEach(instructor => {
      const row = document.createElement('tr');
      row.className = 'data-row-premium';
      row.setAttribute('data-id', instructor.id);

      // Status class based on active state
      const statusClass = instructor.isActive ? 'status-active' : 'status-inactive';

      row.innerHTML = `
        <td>
          <div class="user-info-premium">
            <div class="user-avatar-premium">
              <span>${instructor.name.charAt(0)}</span>
            </div>
            <div class="user-details-premium">
              <span class="user-name-premium">${instructor.name}</span>
              <span class="user-email-premium">${instructor.email}</span>
            </div>
          </div>
        </td>
        <td>${instructor.phone || '-'}</td>
        <td><span class="status-badge ${statusClass}">${instructor.isActive ? 'Ativo' : 'Inativo'}</span></td>
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
      `;

      // Add double-click event for row navigation
      row.addEventListener('dblclick', () => {
        this.navigateToEditor(instructor.id);
      });

      tableBody.appendChild(row);
    });

    // Add click handlers for action buttons
    this.setupRowActionHandlers();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add instructor button
    const addButton = document.getElementById('add-instructor-btn');
    if (addButton) {
      addButton.addEventListener('click', () => {
        window.location.href = '#/instructors/new';
      });
    }

    // Search input
    const searchInput = document.getElementById('instructor-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch.bind(this));
    }
  }

  /**
   * Set up row action handlers
   */
  setupRowActionHandlers() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const instructorId = button.getAttribute('data-id');
        this.navigateToEditor(instructorId);
      });
    });

    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const instructorId = button.getAttribute('data-id');
        this.confirmDelete(instructorId);
      });
    });
  }

  /**
   * Navigate to instructor editor
   * @param {string} id - Instructor ID
   */
  navigateToEditor(id) {
    window.location.href = `#/instructors/edit?id=${id}`;
  }

  /**
   * Confirm instructor deletion
   * @param {string} id - Instructor ID
   */
  async confirmDelete(id) {
    if (confirm('Tem certeza que deseja excluir este instrutor? Esta ação não pode ser desfeita.')) {
      try {
        // Show loading state
        if (this.loadingElement) this.loadingElement.style.display = 'flex';

        // Send delete request
        const response = await this.moduleAPI.request(`/api/instructors/${id}`, {
          method: 'DELETE'
        });

        if (response.success) {
          // Reload instructors list
          await this.loadInstructors();
        } else {
          throw new Error(response.message || 'Erro ao excluir instrutor');
        }
      } catch (error) {
        this.onError(error);
      }
    }
  }

  /**
   * Handle search input
   * @param {Event} event - Input event
   */
  handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = this.instructorsTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const name = row.querySelector('.user-name-premium').textContent.toLowerCase();
      const email = row.querySelector('.user-email-premium').textContent.toLowerCase();

      if (name.includes(searchTerm) || email.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
}

// Create and export controller instance
const instructorsController = new InstructorsController();
      const instructorId = e.target.dataset.id;
      this.navigateToEditor(instructorId);
    }
  }

  handleDoubleClick(e) {
    if (e.target.closest('.instructor-row')) {
      const instructorId = e.target.closest('.instructor-row').dataset.id;
      this.navigateToEditor(instructorId);
    }
  }

  handleAppEvents() {
    this.loadList();
  }

  cleanupEventListeners() {
    // Remove existing event listeners to prevent memory leaks
    this.boundEventHandlers.forEach(({ element, handler }, key) => {
      try {
        element.removeEventListener(key.split('-')[0], handler);
      } catch (error) {
        console.warn('[InstructorsController] Error removing event listener:', error);
      }
    });
    this.boundEventHandlers.clear();
  }

  getContainer() {
    return this.root?.querySelector?.('#module-content')
      || document.getElementById('module-content')
      || document.getElementById('module-container')
      || document.querySelector('#module-container, #module-content, .module-content');
  }

  async loadList() {
    const container = this.getContainer();
    if (!container) {
      console.error('[InstructorsController] Container not found for list rendering');
      return;
    }
    
    if (!window.instructorsModule || !window.instructorsModule.api) {
      console.error('[InstructorsController] API not available');
      return;
    }

    // Use fetchWithStates pattern per AGENTS.md
    await window.instructorsModule.api.fetchWithStates('/api/instructors', {
      loadingElement: container,
      targetElement: container,
      onSuccess: (instructors) => {
        console.log('[InstructorsController] onSuccess - count:', Array.isArray(instructors) ? instructors.length : 'n/a');
        this.listView.render(instructors, container);
      },
      onEmpty: () => {
        console.log('[InstructorsController] onEmpty - no instructors');
        this.listView.renderEmpty(container);
      },
      onError: (error) => {
        console.error('[InstructorsController] Error loading instructors:', error);
        // Use window.app.handleError per AGENTS.md error handling
        if (window.app && window.app.handleError) {
          window.app.handleError(error, 'instructors:loadList');
        }
      }
    });
  }

  // Add cleanup method per AGENTS.md modular isolation
  destroy() {
    this.cleanupEventListeners();
  }

  navigateToEditor(instructorId = null) {
    const path = instructorId ? `#instructor-editor/${instructorId}` : '#instructor-editor';
    window.location.hash = path;
  }
}

// Export globally
window.InstructorsController = InstructorsController;

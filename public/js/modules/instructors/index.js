// Instructors Module - Premium Management System
// import InstructorsController from './controllers/InstructorsController.js';

var instructorsModule = window.instructorsModule || {
  name: 'instructors',
  icon: '👨‍🏫',
  _isInitializing: false,
  _isInitialized: false,
  
  async init() {
    if (this._isInitialized) {
      console.log('👨‍🏫 Instructors Module already initialized, skipping');
      return this;
    }
    if (this._isInitializing) {
      console.log('👨‍🏫 Instructors Module initialization in progress, skipping');
      return this;
    }
    this._isInitializing = true;
    console.log('👨‍🏫 Instructors Module - Starting...');
    
    // Aguardar API Client
    await this.initializeAPI();
    
    // Aguardar dependências estarem disponíveis
    await this.waitForDependencies();
    
  // Inicializar controller com container fornecido pelo router
  this.controller = new window.InstructorsController(this.container);
    
    // Registrar globalmente
    window.instructorsModule = this;
    
    // Notificar app
    if (window.app) {
      window.app.dispatchEvent('module:loaded', { name: 'instructors' });
    }
    
  this._isInitializing = false;
  this._isInitialized = true;
  console.log('👨‍🏫 Instructors Module - Loaded');
    return this;
  },

  async waitForDependencies() {
    // Aguardar InstructorsController estar disponível
    let attempts = 0;
    while (!window.InstructorsController && attempts < 50) {
      console.log('[Instructors] Waiting for InstructorsController...');
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.InstructorsController) {
      throw new Error('InstructorsController not available after 5 seconds');
    }
  },

  async initializeAPI() {
    // Wait for API client to be available
    while (!window.createModuleAPI) {
      console.log('[Instructors] Waiting for API client...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.api = window.createModuleAPI('Instructors');
    console.log('[Instructors] API initialized:', !!this.api);
  }
};

// Auto-initialize if loaded via module system
if (window.ModuleLoader) {
  try { window.ModuleLoader.register('instructors', instructorsModule); } catch(e) { console.warn('[Instructors] ModuleLoader registration failed:', e?.message || e); }
} else {
  // Direct initialization
  document.addEventListener('DOMContentLoaded', () => {
    instructorsModule.init();
  });
}

// Register globally for SPA router
window.instructorsModule = instructorsModule;
window.initInstructorsModule = async function(container) {
  console.log('👨‍🏫 initInstructorsModule called with container:', container);
  console.log('👨‍🏫 Container innerHTML length:', container.innerHTML.length);
  console.log('👨‍🏫 Container first 200 chars:', container.innerHTML.substring(0, 200));
  
  try {
    // Only create skeleton if missing to avoid wiping rendered content on re-entry
    const hasContentDiv = container.querySelector('#module-content');
    const hasIsolatedClass = container.querySelector('.module-isolated-instructors');
    if (!hasContentDiv || !hasIsolatedClass) {
      console.log('👨‍🏫 Creating new container structure');
      container.innerHTML = '<div id="module-content" class="module-isolated-instructors"></div>';
    } else {
      console.log('👨‍🏫 Container structure already exists');
    }

    // Memorize container for scoped rendering
    instructorsModule.container = container;

    // Initialize once; on subsequent navigations just refresh the list
    if (!instructorsModule._isInitialized && !instructorsModule._isInitializing) {
      await instructorsModule.init();
    } else {
      // Best-effort refresh without re-adding listeners per AGENTS.md modular isolation
      try {
        // Clean up existing controller to prevent memory leaks
        if (instructorsModule.controller && typeof instructorsModule.controller.destroy === 'function') {
          instructorsModule.controller.destroy();
        }
        // Create new controller with fresh container (ensure InstructorsController is available)
        if (window.InstructorsController) {
          instructorsModule.controller = new window.InstructorsController(container);
        } else {
          throw new Error('InstructorsController is not available');
        }
      } catch (e) {
        console.warn('[Instructors] Refresh after re-navigation failed:', e?.message || e);
        // Fallback to simple list reload
        await instructorsModule.controller?.loadList?.();
      }
    }

    console.log('👨‍🏫 Instructors module initialized successfully');
    return instructorsModule;
  } catch (error) {
    console.error('❌ Error initializing instructors module:', error);
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Erro ao carregar módulo</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" class="btn btn-primary">
          Recarregar Página
        </button>
      </div>
    `;
    if (window.app && window.app.handleError) {
      window.app.handleError(error, 'instructors-module');
    }
    throw error;
  }
};

// Export globally  
window.instructorsModule = instructorsModule;

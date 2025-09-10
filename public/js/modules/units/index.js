// Units Module - Premium Management System
import UnitsController from './controllers/UnitsController.js';

const unitsModule = {
  name: 'units',
  icon: '🏢',
  _isInitializing: false,
  _isInitialized: false,
  
  async init() {
    if (this._isInitialized) {
      console.log('🏢 Units Module already initialized, skipping');
      return this;
    }
    if (this._isInitializing) {
      console.log('🏢 Units Module initialization in progress, skipping');
      return this;
    }
    this._isInitializing = true;
    console.log('🏢 Units Module - Starting...');
    
    // Aguardar API Client
    await this.initializeAPI();
    
    // Inicializar controller
  this.controller = new UnitsController(this.container);
    
    // Registrar globalmente
    window.unitsModule = this;
    
    // Notificar app
    if (window.app) {
      window.app.dispatchEvent('module:loaded', { name: 'units' });
    }
    
  this._isInitializing = false;
  this._isInitialized = true;
  console.log('🏢 Units Module - Loaded');
    return this;
  },

  async initializeAPI() {
    // Wait for API client to be available
    while (!window.createModuleAPI) {
      console.log('[Units] Waiting for API client...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.api = window.createModuleAPI('Units');
    console.log('[Units] API initialized:', !!this.api);
  }
};

// Auto-initialize if loaded via module system
if (window.ModuleLoader) {
  window.ModuleLoader.register('units', unitsModule);
} else {
  // Direct initialization
  document.addEventListener('DOMContentLoaded', () => {
    unitsModule.init();
  });
}

// Register globally for SPA router
window.unitsModule = unitsModule;
window.initUnitsModule = async function(container) {
  console.log('🏢 initUnitsModule called with container:', container);
  
  try {
    // Only reset container if it doesn't have units content already
    if (!container.querySelector('#module-content') || !container.querySelector('.module-isolated-units')) {
      container.innerHTML = '<div id="module-content" class="module-isolated-units"></div>';
    }
    
    // Remember container for scoped rendering
    unitsModule.container = container;

    // Initialize the module
    await unitsModule.init();
    
    console.log('🏢 Units module initialized successfully');
    return unitsModule;
  } catch (error) {
    console.error('❌ Error initializing units module:', error);
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
    throw error;
  }
};

export default unitsModule;

// Defensive registration with ModuleLoader (if available)
if (window.ModuleLoader && window.unitsModule) {
  try {
    window.ModuleLoader.register('units', window.unitsModule);
  } catch (e) {
    console.warn('[Units] ModuleLoader registration failed:', e?.message || e);
  }
}

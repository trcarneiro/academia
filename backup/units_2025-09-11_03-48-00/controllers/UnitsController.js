import UnitsService from '../services/UnitsService.js';
import UnitsListView from '../views/UnitsListView.js';

export default class UnitsController {
  constructor(rootContainer = null) {
    this.service = UnitsService;
    this.listView = UnitsListView;
    this.root = rootContainer;
    this.init();
  }

  async init() {
    console.log('🔧 Initializing Units Controller...');
    this.setupEventListeners();
    await this.loadList();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="create-unit"]')) {
        this.navigateToEditor();
      }
      
      if (e.target.matches('[data-action="edit-unit"]')) {
        const unitId = e.target.dataset.id;
        this.navigateToEditor(unitId);
      }
    });

    // Double-click navigation
    document.addEventListener('dblclick', (e) => {
      if (e.target.closest('.unit-row')) {
        const unitId = e.target.closest('.unit-row').dataset.id;
        this.navigateToEditor(unitId);
      }
    });

    // Listen for updates
    if (window.app) {
      window.app.addEventListener('units:updated', () => {
        this.loadList();
      });
    }
  }

  async loadList() {
    // Use the router-provided container when available
    const container = this.root?.querySelector?.('#module-content')
      || document.getElementById('module-content')
      || document.getElementById('module-container')
      || document.querySelector('#module-container, #module-content, .module-content');
    if (!container) {
      console.error('[UnitsController] Container not found for list rendering');
      return;
    }
    
    if (!window.unitsModule || !window.unitsModule.api) {
      console.error('[UnitsController] API not available');
      return;
    }

    await window.unitsModule.api.fetchWithStates('/api/units', {
      loadingElement: container,
      targetElement: container,
      // onSuccess receives the normalized data (array), not { success, data }
      onSuccess: (units) => {
        console.log('[UnitsController] API response:', units);
        console.log('[UnitsController] Units data:', units);
        this.listView.render(units, container);
      },
      onEmpty: () => {
        console.log('[UnitsController] Empty response');
        this.listView.renderEmpty(container);
      },
      onError: (error) => {
        console.error('[UnitsController] Error loading units:', error);
        if (window.app && window.app.handleError) {
          window.app.handleError(error, 'units:loadList');
        }
      }
    });
  }

  navigateToEditor(unitId = null) {
    const path = unitId ? `#unit-editor/${unitId}` : '#unit-editor';
    window.location.hash = path;
  }
}

(function(){
  // Prevent duplicate initialization
  if (window.unitEditor) {
    console.log('ℹ️ Unit editor already initialized, skipping...');
    return window.unitEditor;
  }

  console.log('📝 Unit Editor Module - Starting...');

  // Global state
  const unitEditorState = {
    isInitialized: false,
    currentUnitId: null,
    isEditing: false,
    formData: {}
  };

  let unitAPI = null;
  let trainingAreasController = null;

  // Initialize API
  async function initializeAPI() {
    // Wait for API client to be available
    while (!window.createModuleAPI) {
      console.log('[UnitEditor] Waiting for API client...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    unitAPI = window.createModuleAPI('UnitEditor');
    console.log('[UnitEditor] API initialized:', !!unitAPI);
  }

  // Main initialization
  async function initializeUnitEditor(unitId = null) {
    if (unitEditorState.isInitialized) {
      console.log('[UnitEditor] Already initialized, checking mode...');
      // If a different unitId is requested while already initialized, load that unit for editing
      if (unitId && unitEditorState.currentUnitId !== unitId) {
        console.log('[UnitEditor] Switching to edit mode for unit:', unitId);
        unitEditorState.currentUnitId = unitId;
        unitEditorState.isEditing = true;
        updateEditorMode();
        try {
          showLoadingState();
          await loadUnitData(unitId);
        } finally {
          hideLoadingState();
        }
        return;
      }

      // If switching from editing to creating (no unitId), reset form state
      if (!unitId && unitEditorState.isEditing) {
        console.log('[UnitEditor] Switching to create mode');
        unitEditorState.currentUnitId = null;
        unitEditorState.isEditing = false;
        updateEditorMode();
        // clear form
        populateFormWithUnitData({});
      }

      console.log('[UnitEditor] Already initialized, skipping full init.');
      return;
    }

    console.log('🔧 Initializing Unit Editor...');
    
    try {
      // Initialize API
      await initializeAPI();
      
      // Initialize Training Areas Controller
      if (!trainingAreasController) {
        // Dynamically import the TrainingAreasController
        try {
          const module = await import('./controllers/TrainingAreasController.js');
          const TrainingAreasController = module.default;
          trainingAreasController = new TrainingAreasController();
          console.log('✅ Training Areas Controller initialized');
        } catch (error) {
          console.error('❌ Failed to load Training Areas Controller:', error);
        }
      }
      
      // Load CSS
      if (!document.querySelector('link[href*="unit-editor.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/unit-editor.css';
        document.head.appendChild(link);
        console.log('✅ Unit Editor CSS loaded');
      }
      
      // Load Training Areas CSS
      if (!document.querySelector('link[href*="training-areas.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/training-areas.css';
        document.head.appendChild(link);
        console.log('✅ Training Areas CSS loaded');
      }
      
      // Set current unit ID
      unitEditorState.currentUnitId = unitId;
      unitEditorState.isEditing = !!unitId;

      // Update UI based on mode
      updateEditorMode();
      
      // Load form data
      await loadFormData();
      
      // Setup event listeners
      setupEventListeners();
      
      // Load unit data if editing
      if (unitId) {
        await loadUnitData(unitId);
      }
      
      unitEditorState.isInitialized = true;
      console.log('✅ Unit Editor initialized successfully');

      // Integrate with AcademyApp
      if (window.app) {
        window.app.dispatchEvent('module:loaded', { name: 'unit-editor' });
      }

    } catch (error) {
      console.error('[UnitEditor] Initialization error:', error);
      showErrorState('Erro ao inicializar editor de unidade');
      
      if (window.app) {
        window.app.handleError(error, 'UnitEditor:initialization');
      }
    }
  }

  // Update editor mode (create vs edit)
  function updateEditorMode() {
    const titleElement = document.getElementById('editor-title');
    const breadcrumbAction = document.getElementById('editor-breadcrumb');
    const saveBtn = document.getElementById('save-unit-btn');
    const trainingAreasTab = document.querySelector('[data-tab="training-areas"]');

    if (unitEditorState.isEditing) {
      if (titleElement) titleElement.textContent = '✏️ Editar Unidade';
      if (breadcrumbAction) breadcrumbAction.textContent = 'Editar Unidade';
      if (saveBtn) saveBtn.innerHTML = '💾 Atualizar Unidade';
      
      // Show training areas tab only in edit mode
      if (trainingAreasTab) {
        trainingAreasTab.style.display = 'block';
      }
    } else {
      if (titleElement) titleElement.textContent = '✨ Nova Unidade';
      if (breadcrumbAction) breadcrumbAction.textContent = 'Nova Unidade';
      if (saveBtn) saveBtn.innerHTML = '💾 Salvar Unidade';
      
      // Hide training areas tab in create mode
      if (trainingAreasTab) {
        trainingAreasTab.style.display = 'none';
      }
      
      // Ensure basic info tab is active
      const basicInfoTab = document.querySelector('[data-tab="basic-info"]');
      const basicInfoContent = document.getElementById('tab-basic-info');
      if (basicInfoTab && basicInfoContent) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        basicInfoTab.classList.add('active');
        basicInfoContent.style.display = 'block';
      }
    }
  }

  // Load form data (instructors, etc.)
  async function loadFormData() {
    try {
      console.log('[UnitEditor] Loading form data...');
      
      // Load instructors
      const instructorsResponse = await unitAPI.get('/api/instructors');
      if (instructorsResponse.success && instructorsResponse.data) {
        populateInstructorsSelect(instructorsResponse.data);
      }
      
      console.log('[UnitEditor] Form data loaded successfully');
    } catch (error) {
      console.error('[UnitEditor] Error loading form data:', error);
    }
  }

  // Populate instructors select
  function populateInstructorsSelect(instructors) {
    const select = document.getElementById('unit-instructor');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um instrutor</option>';
    
    instructors.forEach(instructor => {
      const option = document.createElement('option');
      option.value = instructor.id;
      option.textContent = instructor.name;
      select.appendChild(option);
    });
  }

  // Load unit data for editing
  async function loadUnitData(unitId) {
    try {
      console.log('[UnitEditor] Loading unit data for ID:', unitId);
      
      const response = await unitAPI.get(`/api/units/${unitId}`);
      if (response.success && response.data) {
        populateFormWithUnitData(response.data);
        console.log('[UnitEditor] Unit data loaded successfully');
      } else {
        throw new Error('Failed to load unit data');
      }
    } catch (error) {
      console.error('[UnitEditor] Error loading unit data:', error);
      showErrorState('Erro ao carregar dados da unidade');
    }
  }

  // Populate form with unit data
  function populateFormWithUnitData(unitData) {
    console.log('[UnitEditor] Populating form with unit data:', unitData);
    
    // Basic info
    document.getElementById('unit-name').value = unitData.name || '';
    document.getElementById('unit-description').value = unitData.description || '';
    document.getElementById('unit-phone').value = unitData.phone || '';
    document.getElementById('unit-email').value = unitData.email || '';
    
    // Address
    document.getElementById('unit-address').value = unitData.address || '';
    document.getElementById('unit-number').value = unitData.number || '';
    document.getElementById('unit-complement').value = unitData.complement || '';
    document.getElementById('unit-neighborhood').value = unitData.neighborhood || '';
    document.getElementById('unit-city').value = unitData.city || '';
    document.getElementById('unit-state').value = unitData.state || '';
    document.getElementById('unit-zipcode').value = unitData.zipcode || '';
    
    // Additional info
    document.getElementById('unit-instructor').value = unitData.instructorId || '';
    document.getElementById('unit-capacity').value = unitData.capacity || '';
    document.getElementById('unit-status').value = unitData.status || 'active';
    document.getElementById('unit-operating-hours').value = unitData.operatingHours || '';
  }

  // Setup event listeners
  function setupEventListeners() {
    console.log('[UnitEditor] Setting up event listeners...');
    
    // Form submission
    const form = document.getElementById('unit-form');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-unit-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        if (tabId) {
          switchTab(tabId);
        }
      });
    });
    
    console.log('[UnitEditor] Event listeners set up');
  }

  // Switch tabs
  function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`tab-${tabId}`);
    if (selectedContent) {
      selectedContent.style.display = 'block';
    }
    
    // Add active class to selected button
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedButton) {
      selectedButton.classList.add('active');
    }
    
    // Special handling for training areas tab
    if (tabId === 'training-areas' && unitEditorState.isEditing) {
      initTrainingAreasTab();
    }
  }

  // Initialize training areas tab
  async function initTrainingAreasTab() {
    if (!unitEditorState.currentUnitId) return;
    
    try {
      const container = document.getElementById('training-areas-content');
      if (!container) return;
      
      // Use TrainingAreasController if available
      if (trainingAreasController && typeof trainingAreasController.init === 'function') {
        await trainingAreasController.init({
          unitId: unitEditorState.currentUnitId,
          container: container,
          api: unitAPI
        });
      } else {
        // Fallback to basic implementation
        await loadTrainingAreasFallback(container);
      }
    } catch (error) {
      console.error('[UnitEditor] Error initializing training areas tab:', error);
    }
  }

  // Fallback training areas loading
  async function loadTrainingAreasFallback(container) {
    try {
      const response = await unitAPI.get(`/api/units/${unitEditorState.currentUnitId}/training-areas`);
      if (response.success && response.data) {
        renderTrainingAreasList(container, response.data);
      } else {
        container.innerHTML = '<div class="empty-state">Nenhuma área de treino cadastrada.</div>';
      }
    } catch (error) {
      console.error('[UnitEditor] Error loading training areas:', error);
      container.innerHTML = '<div class="error-state">Erro ao carregar áreas de treino.</div>';
    }
  }

  // Render training areas list
  function renderTrainingAreasList(container, areas) {
    if (!areas.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma área de treino cadastrada.</div>';
      return;
    }
    
    const html = ['<div class="training-areas-grid">'];
    areas.forEach(area => {
      html.push(`
        <div class="training-area-card data-card-premium">
          <div class="area-header">
            <h4>${area.name || 'Área de Treino'}</h4>
            <span class="area-capacity">Capacidade: ${area.capacity || 0}</span>
          </div>
          <div class="area-details">
            <p>${area.description || ''}</p>
            <span class="area-status ${area.status || 'active'}">${area.status || 'active'}</span>
          </div>
        </div>
      `);
    });
    html.push('</div>');
    container.innerHTML = html.join('');
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('[UnitEditor] Form submitted');
    
    const formData = collectFormData();
    
    if (!validateForm(formData)) {
      return;
    }
    
    try {
      showLoadingState();
      
      let response;
      if (unitEditorState.isEditing) {
        response = await unitAPI.put(`/api/units/${unitEditorState.currentUnitId}`, formData);
      } else {
        response = await unitAPI.post('/api/units', formData);
      }
      
      if (response.success) {
        showSuccessMessage(
          unitEditorState.isEditing 
            ? 'Unidade atualizada com sucesso!' 
            : 'Unidade criada com sucesso!'
        );
        
        // Navigate back to units list after a short delay
        setTimeout(() => {
          if (window.app) {
            window.app.navigate('/units');
          }
        }, 1500);
      } else {
        throw new Error(response.message || 'Erro ao salvar unidade');
      }
    } catch (error) {
      console.error('[UnitEditor] Error saving unit:', error);
      showErrorState(error.message || 'Erro ao salvar unidade');
    } finally {
      hideLoadingState();
    }
  }

  // Collect form data
  function collectFormData() {
    return {
      name: document.getElementById('unit-name').value.trim(),
      description: document.getElementById('unit-description').value.trim(),
      phone: document.getElementById('unit-phone').value.trim(),
      email: document.getElementById('unit-email').value.trim(),
      address: document.getElementById('unit-address').value.trim(),
      number: document.getElementById('unit-number').value.trim(),
      complement: document.getElementById('unit-complement').value.trim(),
      neighborhood: document.getElementById('unit-neighborhood').value.trim(),
      city: document.getElementById('unit-city').value.trim(),
      state: document.getElementById('unit-state').value.trim(),
      zipcode: document.getElementById('unit-zipcode').value.trim(),
      instructorId: document.getElementById('unit-instructor').value,
      capacity: parseInt(document.getElementById('unit-capacity').value) || 0,
      status: document.getElementById('unit-status').value,
      operatingHours: document.getElementById('unit-operating-hours').value.trim()
    };
  }

  // Validate form data
  function validateForm(formData) {
    clearErrorStates();
    
    const errors = [];
    
    if (!formData.name) {
      errors.push('Nome da unidade é obrigatório');
      showFieldError('unit-name', 'Nome é obrigatório');
    }
    
    if (!formData.phone) {
      errors.push('Telefone é obrigatório');
      showFieldError('unit-phone', 'Telefone é obrigatório');
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      errors.push('Email inválido');
      showFieldError('unit-email', 'Email inválido');
    }
    
    if (errors.length > 0) {
      showErrorState(errors.join('<br>'));
      return false;
    }
    
    return true;
  }

  // Validate email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Handle cancel
  function handleCancel() {
    console.log('[UnitEditor] Cancel clicked');
    if (window.app) {
      window.app.navigate('/units');
    }
  }

  // Clear error states
  function clearErrorStates() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  }

  // Show field error
  function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.classList.add('error');
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.textContent = message;
      field.parentNode.appendChild(errorEl);
    }
  }

  // Show loading state
  function showLoadingState() {
    const submitBtn = document.getElementById('save-unit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = unitEditorState.isEditing ? '💾 Atualizando...' : '💾 Salvando...';
    }
  }

  // Hide loading state
  function hideLoadingState() {
    const submitBtn = document.getElementById('save-unit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      updateEditorMode(); // This will reset the button text
    }
  }

  // Show error state
  function showErrorState(message) {
    const errorContainer = document.getElementById('form-error');
    if (errorContainer) {
      errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
      errorContainer.style.display = 'block';
    }
    
    // Also show as toast if app is available
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    }
  }

  // Show success message
  function showSuccessMessage(message) {
    // Show as toast if app is available
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'success');
    }
    
    // Also show in form if container exists
    const successContainer = document.getElementById('form-success');
    if (successContainer) {
      successContainer.innerHTML = `<div class="success-message">${message}</div>`;
      successContainer.style.display = 'block';
    }
  }

  // Utility function to wait for DOM ready
  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Wait for API client
  async function waitForAPIClient() {
    while (!window.createModuleAPI) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Expose the unit editor
  window.unitEditor = {
    initialize: initializeUnitEditor,
    state: unitEditorState
  };

  console.log('📝 Unit Editor Module - Ready');

  // Auto-initialize if we're on the unit editor page
  onReady(() => {
    if (window.location.hash.includes('#unit-editor')) {
      const unitId = getUnitIdFromHash();
      initializeUnitEditor(unitId);
    }
  });

  // --- Training Areas Tab Integration ---
  const TAB_ID = 'training-areas';
  const PANEL_ID = 'tab-training-areas';
  const PANEL_INNER_ID = 'training-areas-content';

  function getUnitIdFromHash(){
    const m = (window.location.hash||'').match(/#unit-editor\/(.+)/); return m ? m[1] : null;
  }

  function findTabsRoot(){
    return (
      document.getElementById('editor-tabs') ||
      document.querySelector('.editor-tabs') ||
      document.querySelector('[data-role="editor-tabs"]')
    );
  }

  function findPanelsRoot(){
    return (
      document.getElementById('tab-panels') ||
      document.querySelector('.tab-panels') ||
      document.querySelector('[data-role="tab-panels"]') ||
      document.getElementById('form-container') ||
      document.getElementById('unit-form') ||
      document.querySelector('#module-content, .module-content') ||
      document.body
    );
  }

  function ensureTabHeader(){
    const tabsRoot = findTabsRoot(); if (!tabsRoot) return null;
    if (tabsRoot.querySelector(`[data-tab="${TAB_ID}"]`)) return tabsRoot;
    const btn = document.createElement('button');
    btn.type='button'; btn.className='tab-button'; btn.dataset.tab=TAB_ID; btn.textContent='Áreas de Treino';
    btn.addEventListener('click', ()=>switchToTab(TAB_ID));
    tabsRoot.appendChild(btn);
    return tabsRoot;
  }

  function ensureTabPanel(){
    const panelsRoot = findPanelsRoot(); if (!panelsRoot) return null;
    let panel = document.getElementById(PANEL_ID);
    if (!panel){
      panel = document.createElement('div'); panel.id=PANEL_ID; panel.className='tab-panel'; panel.style.display='none';
      panel.innerHTML = `
        <div class="data-card-premium">
          <div class="section-header">🏟️ Áreas de Treino</div>
          <div id="${PANEL_INNER_ID}" class="module-isolated-training-areas"></div>
        </div>`;
      panelsRoot.appendChild(panel);
    }
    return panel;
  }

  function hideAllPanels(){
    document.querySelectorAll('.tab-panel').forEach(p=>p.style.display='none');
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
  }

  function switchToTab(tab){
    hideAllPanels();
    const btn = document.querySelector(`.tab-button[data-tab="${tab}"]`); if (btn) btn.classList.add('active');
    const panel = document.getElementById(`tab-${tab}`); if (panel) panel.style.display='block';
    if (tab === TAB_ID) initTrainingAreasOnce();
  }

  let initialized = false;
  async function initTrainingAreasOnce(){
    if (initialized) return; initialized = true;
    try {
      await waitForAPIClient();
      const moduleAPI = window.createModuleAPI('Units');
      const unitId = getUnitIdFromHash();
      const target = document.getElementById(PANEL_INNER_ID);
      if (!target) return;

      if (window.TrainingAreasController) {
        try {
          const controller = new window.TrainingAreasController({ unitId, container: target, api: moduleAPI });
          if (controller && typeof controller.init === 'function') await controller.init();
          return;
        } catch (e) {
          console.warn('[Units] TrainingAreasController failed, falling back:', e?.message||e);
        }
      }

      await moduleAPI.fetchWithStates(`/api/units/${unitId}/training-areas`, {
        loadingElement: target,
        onSuccess: (data)=>renderFallbackList(target, data||[]),
        onEmpty: ()=>renderFallbackList(target, []),
        onError: (err)=>renderError(target, err)
      });
    } catch (error){
      renderError(document.getElementById(PANEL_INNER_ID), error);
      if (window.app && window.app.handleError) window.app.handleError(error, 'units-training-areas-tab');
    }
  }

  function renderFallbackList(target, areas){
    if (!target) return;
    if (!areas.length){ target.innerHTML = '<div class="empty-state">Nenhuma área cadastrada.</div>'; return; }
    const html = ['<div class="areas-grid">'];
    areas.forEach(a=>{ html.push(`<div class=\"area-card data-card-premium\"><div class=\"title\">${a.name||'Área'}</div><div class=\"meta\">${a.capacity?`Capacidade: ${a.capacity}`:''}</div></div>`); });
    html.push('</div>'); target.innerHTML = html.join('');
  }

  function renderError(target, err){
    if (!target) return; target.innerHTML = `<div class=\"error-state-premium\"><div class=\"error-icon\">⚠️</div><p>${(err&&err.message)||'Erro ao carregar áreas de treino'}</p></div>`;
  }

  onReady(()=>{ const tabs = ensureTabHeader(); const panel = ensureTabPanel(); if (!tabs || !panel) console.warn('[Units] Tabs or panel root not found. Training Areas tab injected with fallback placement.'); });
})();
// --- End Training Areas Tab Patch ---
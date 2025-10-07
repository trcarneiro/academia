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
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        basicInfoTab.classList.add('active');
        basicInfoContent.classList.add('active');
      }
    }
  }

  async function loadFormData() {
    console.log('[UnitEditor] Loading form data...');
    
    try {
      showLoadingState();
      
      // Load organizations for the select dropdown
      await loadOrganizations();
      
      // Show the form
      hideLoadingState();
      console.log('[UnitEditor] Form data loaded successfully');

    } catch (error) {
      console.error('[UnitEditor] Error loading form data:', error);
      showErrorState('Erro ao carregar dados do formulário');
    }
  }

  // Load unit data for editing
  async function loadUnitData(unitId) {
    console.log('[UnitEditor] Loading unit data for ID:', unitId);
    
    try {
      showLoadingState();

      const response = await fetch(`/api/units/${unitId}`);

      if (!response.ok) {
        // Try to read response body for diagnostics
        let bodyText = '';
        try { bodyText = await response.text(); } catch (e) { bodyText = '<unable to read response body>'; }
        const msg = `Server error ${response.status}: ${bodyText.substring(0,1000)}`;
        console.error('[UnitEditor] loadUnitData non-ok response:', msg);
        throw new Error(msg);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar unidade');
      }

      const unit = data.data;
      console.log('[UnitEditor] Unit data loaded:', unit);

      // Populate form with unit data
      populateFormWithUnitData(unit);
      
      hideLoadingState();

    } catch (error) {
      console.error('[UnitEditor] Error loading unit data:', error);
      showErrorState(error.message);
    }
  }

  // Load organizations for select dropdown
  async function loadOrganizations() {
    try {
      const response = await unitAPI.fetchWithStates('/api/organizations', {
        loadingElement: document.getElementById('unit-organization')
      });

      if (response?.success && response?.data) {
        populateOrganizationSelect(response.data);
      } else {
        console.warn('[UnitEditor] No organizations found');
        // Still allow form to show but with warning
        showFormWarning('Nenhuma organização encontrada. Verifique se há organizações cadastradas.');
      }
    } catch (error) {
      console.error('[UnitEditor] Error loading organizations:', error);
      showFormWarning('Erro ao carregar organizações. Tente novamente.');
    }
  }

  // Populate organization select
  function populateOrganizationSelect(organizations) {
    const select = document.getElementById('unit-organization');
    if (!select) return;

    // Clear existing options (keep the first placeholder)
    select.innerHTML = '<option value="">Selecione a organização...</option>';

    organizations.forEach(org => {
      const option = document.createElement('option');
      option.value = org.id;
      option.textContent = org.name;
      
      // Add data attributes for additional info
      option.setAttribute('data-slug', org.slug || '');
      option.setAttribute('data-city', org.city || '');
      
      select.appendChild(option);
    });

    console.log(`[UnitEditor] Loaded ${organizations.length} organizations`);
  }

  // Show form warning
  function showFormWarning(message) {
    // You can implement this to show warnings in the form
    console.warn('[UnitEditor] Form warning:', message);
  }

  // Populate form with existing unit data
  function populateFormWithUnitData(unit) {
  unit = unit || {};
    // Organization
    const orgSelect = document.getElementById('unit-organization');
    if (orgSelect && unit.organizationId) {
      orgSelect.value = unit.organizationId;
    }
    
  // Basic info
  const nameEl = document.getElementById('unit-name');
  if (nameEl) nameEl.value = unit.name || '';

  // Slug field removed from templates; nothing to populate here.
  const addressEl = document.getElementById('unit-address');
  if (addressEl) addressEl.value = unit.address || '';

  const cityEl = document.getElementById('unit-city');
  if (cityEl) cityEl.value = unit.city || '';

  const stateEl = document.getElementById('unit-state');
  if (stateEl) stateEl.value = unit.state || '';

  const zipcodeEl = document.getElementById('unit-zipcode');
  if (zipcodeEl) zipcodeEl.value = unit.zipcode || '';

  // Contact info
  const phoneEl = document.getElementById('unit-phone');
  if (phoneEl) phoneEl.value = unit.phone || '';

  const emailEl = document.getElementById('unit-email');
  if (emailEl) emailEl.value = unit.email || '';

  // Status
  const statusEl = document.getElementById('unit-status');
  if (statusEl && unit.status) {
    statusEl.value = unit.status;
  }

  // Additional info
  const descriptionEl = document.getElementById('unit-description');
  if (descriptionEl) descriptionEl.value = unit.description || '';

  console.log('[UnitEditor] Form populated with unit data');
}

  // Setup event listeners
  function setupEventListeners() {
    // Tab switching functionality
    setupTabNavigation();
    
    // Save button
    const saveBtn = document.getElementById('save-unit-btn');
    if (saveBtn) saveBtn.addEventListener('click', handleSaveUnit);

    // Form validation
    const form = document.getElementById('unit-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveUnit();
      });

      // Real-time validation
      const requiredInputs = form.querySelectorAll('[required]');
      requiredInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
      });
    }

    // Training areas event listeners
    setupTrainingAreasEventListeners();

    console.log('[UnitEditor] Event listeners setup completed');
  }

  // Setup tab navigation
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = button.dataset.tab;
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(`tab-${targetTab}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }

        // Load training areas when the tab is activated and we're in edit mode
        if (targetTab === 'training-areas' && unitEditorState.isEditing && unitEditorState.currentUnitId) {
          loadTrainingAreasTab();
        }
      });
    });
  }

  // Setup training areas event listeners
  function setupTrainingAreasEventListeners() {
    // Add training area button
    const addButton = document.getElementById('add-training-area-btn');
    const addFirstButton = document.getElementById('create-first-training-area-btn');
    const retryButton = document.getElementById('retry-training-areas-btn');

    if (addButton) {
      addButton.addEventListener('click', () => {
        // Navigate to training area creation
        window.location.hash = `#training-area-editor?unitId=${unitEditorState.currentUnitId}`;
      });
    }

    if (addFirstButton) {
      addFirstButton.addEventListener('click', () => {
        // Navigate to training area creation
        window.location.hash = `#training-area-editor?unitId=${unitEditorState.currentUnitId}`;
      });
    }

    if (retryButton) {
      retryButton.addEventListener('click', () => {
        loadTrainingAreasTab();
      });
    }
  }

  // Handle save unit
  async function handleSaveUnit() {
    console.log('[UnitEditor] Saving unit...');

    try {
      // Validate form
      if (!validateForm()) {
        showNotification('❌ Por favor, corrija os erros no formulário', 'error');
        return;
      }

      // Collect form data
      const formData = collectFormData();
      console.log('[UnitEditor] Form data collected:', formData);

      // Show loading on save button
      const saveBtn = document.getElementById('save-unit-btn');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '⏳ Salvando...';
      saveBtn.disabled = true;

      // API call
      let response;
      if (unitEditorState.isEditing) {
        response = await fetch(`/api/units/${unitEditorState.currentUnitId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        response = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

  const result = await response.json();
  console.log('[UnitEditor] Save response:', result);

      // Restore button
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;

      if (result.success) {
        showSuccessState(result.data);
        showNotification(
          unitEditorState.isEditing ? '✅ Unidade atualizada com sucesso!' : '✅ Unidade criada com sucesso!',
          'success'
        );
      } else {
        // If server provided validation details (Zod), show them field-by-field
        if (result.details && Array.isArray(result.details)) {
          // Clear previous field errors
          const form = document.getElementById('unit-form');
          form.querySelectorAll('.field-error').forEach(el => el.remove());

          const messages = [];
          result.details.forEach(err => {
            // zod error path is an array, e.g. ['name']
            const path = Array.isArray(err.path) && err.path.length ? err.path[0] : null;
            const message = err.message || 'Valor inválido';
            messages.push(message + (path ? ` (${path})` : ''));

            if (path) {
              const field = form.querySelector(`[name="${path}"]`);
              if (field) {
                showFieldError(field, message);
              }
            }
          });

          showNotification(`❌ Erros de validação:\n• ${messages.join('\n• ')}`, 'error');
        }

        throw new Error(result.error || 'Erro ao salvar unidade');
      }

    } catch (error) {
      console.error('[UnitEditor] Save error:', error);
      showNotification(`❌ ${error.message}`, 'error');
      
      // Restore button
      const saveBtn = document.getElementById('save-unit-btn');
      saveBtn.innerHTML = unitEditorState.isEditing ? '💾 Atualizar Unidade' : '💾 Salvar Unidade';
      saveBtn.disabled = false;

      if (window.app) {
        window.app.handleError(error, 'UnitEditor:save');
      }
    }
  }

  // Collect form data
  function collectFormData() {
    const form = document.getElementById('unit-form');
    const formData = new FormData(form);
    
    // Build data object
    const rawZip = formData.get('zipCode') || '';
    const cleanedZip = String(rawZip).replace(/\D/g, '');
    const rawState = formData.get('state') || '';
    const normalizedState = String(rawState).toUpperCase();

    const data = {
      organizationId: formData.get('organizationId'),
      name: formData.get('name'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: normalizedState,
      zipCode: cleanedZip,
      phone: formData.get('phone'),
      email: formData.get('email'),
      capacity: parseInt(formData.get('capacity')) || 100,
      totalMats: parseInt(formData.get('totalMats')) || 1,
      isActive: formData.get('isActive') === 'on'
    };

    // Debug: Log all field values
    console.log('[UnitEditor] Individual field values:', {
      organizationId: data.organizationId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      email: data.email,
      capacity: data.capacity,
      totalMats: data.totalMats,
      isActive: data.isActive
    });

    // Validation: organizationId is required
    if (!data.organizationId) {
      throw new Error('Por favor, selecione uma organização');
    }

    return data;
  }

  // Form validation
  function validateForm() {
    const form = document.getElementById('unit-form');
    let isValid = true;
    let errorMessages = [];

    // Check required fields with custom validation
    const requiredFieldsMap = {
      'organizationId': 'Por favor, selecione uma organização',
      'name': 'Nome da unidade é obrigatório',
      'address': 'Endereço é obrigatório',
      'city': 'Cidade é obrigatória',
      'state': 'Estado é obrigatório (2 caracteres)',
      'zipCode': 'CEP é obrigatório (8-9 dígitos)'
    };

    // Validate each required field with stronger rules
    for (const [fieldName, errorMessage] of Object.entries(requiredFieldsMap)) {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;

      let value = String(field.value || '').trim();
      let fieldValid = true;

      // Stronger validation rules
      switch (fieldName) {
        case 'state':
          fieldValid = /^[A-Za-z]{2}$/.test(value);
          break;
        case 'zipCode':
          const cleanZip2 = value.replace(/\D/g, '');
          fieldValid = cleanZip2.length >= 8 && cleanZip2.length <= 9;
          break;
        case 'name':
          fieldValid = value.length >= 2 && value.length <= 100;
          break;
        case 'address':
          fieldValid = value.length >= 5;
          break;
        case 'city':
          fieldValid = value.length >= 2;
          break;
        default:
          fieldValid = value.length > 0;
      }

      if (!fieldValid) {
        isValid = false;
        errorMessages.push(errorMessage);

        // Add visual feedback
        field.classList.add('error');

        // Find or create error element
        let errorElement = field.parentElement.querySelector('.field-error');
        if (!errorElement) {
          errorElement = document.createElement('div');
          errorElement.className = 'field-error';
          field.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      } else {
        // Remove error state
        field.classList.remove('error');
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }
    }

    // Show general error message if form is invalid
    if (!isValid) {
      const generalError = `Por favor, preencha todos os campos obrigatórios:\n• ${errorMessages.join('\n• ')}`;
      showNotification(generalError, 'error');
    }

    return isValid;
  }

  // Validate individual field
  function validateField(field) {
    if (field.target) field = field.target; // Handle event object
    
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
      showFieldError(field, 'Este campo é obrigatório');
      return false;
    }
    
    // Type-specific validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
      showFieldError(field, 'Email inválido');
      return false;
    }
    
    if (field.type === 'number' && value) {
      const num = parseFloat(value);
      const min = parseFloat(field.min);
      const max = parseFloat(field.max);
      
      if (isNaN(num)) {
        showFieldError(field, 'Valor numérico inválido');
        return false;
      }
      
      if (!isNaN(min) && num < min) {
        showFieldError(field, `Valor mínimo: ${min}`);
        return false;
      }
      
      if (!isNaN(max) && num > max) {
        showFieldError(field, `Valor máximo: ${max}`);
        return false;
      }
    }
    
    clearFieldError(field);
    return true;
  }

  // Show field error
  function showFieldError(field, message) {
    if (typeof field === 'string') {
      field = document.getElementById(field) || document.querySelector(`.${field}`);
    }
    
    if (!field) return;
    
    clearFieldError(field);
    
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
  }

  // Clear field error
  function clearFieldError(field) {
    if (field.target) field = field.target; // Handle event object
    
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }
  
  // Load training areas tab
  async function loadTrainingAreasTab() {
    if (!unitEditorState.currentUnitId) {
      console.log('[UnitEditor] No unit ID available for loading training areas');
      return;
    }

    console.log('[UnitEditor] Loading training areas for unit:', unitEditorState.currentUnitId);

    const listContainer = document.getElementById('training-areas-list');
    const emptyState = document.getElementById('training-areas-empty');
    const loadingState = document.getElementById('training-areas-loading');
    const errorState = document.getElementById('training-areas-error');

    try {
      // Use fetchWithStates for better UI state management
      await unitAPI.fetchWithStates(`/api/training-areas`, {
        params: { unitId: unitEditorState.currentUnitId },
        loadingElement: loadingState,
        onSuccess: (data) => {
          console.log('[UnitEditor] Training areas loaded:', data);
          
          // Hide all states
          if (listContainer) listContainer.style.display = 'none';
          if (emptyState) emptyState.style.display = 'none';
          if (loadingState) loadingState.style.display = 'none';
          if (errorState) errorState.style.display = 'none';

          if (!data || data.length === 0) {
            // Show empty state
            if (emptyState) emptyState.style.display = 'block';
          } else {
            // Render training areas
            renderTrainingAreas(data);
            if (listContainer) listContainer.style.display = 'grid';
          }
        },
        onEmpty: () => {
          console.log('[UnitEditor] No training areas found');
          
          // Hide all states except empty
          if (listContainer) listContainer.style.display = 'none';
          if (loadingState) loadingState.style.display = 'none';
          if (errorState) errorState.style.display = 'none';
          if (emptyState) emptyState.style.display = 'block';
        },
        onError: (error) => {
          console.error('[UnitEditor] Error loading training areas:', error);
          
          // Hide all states except error
          if (listContainer) listContainer.style.display = 'none';
          if (emptyState) emptyState.style.display = 'none';
          if (loadingState) loadingState.style.display = 'none';
          if (errorState) {
            errorState.style.display = 'block';
            const errorMessage = document.getElementById('training-areas-error-message');
            if (errorMessage) {
              errorMessage.textContent = error.message || 'Erro ao carregar áreas de treino';
            }
          }
        }
      });

    } catch (error) {
      console.error('[UnitEditor] Error in loadTrainingAreasTab:', error);
      
      // Fallback error handling
      if (listContainer) listContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
      if (loadingState) loadingState.style.display = 'none';
      if (errorState) {
        errorState.style.display = 'block';
        const errorMessage = document.getElementById('training-areas-error-message');
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Erro inesperado ao carregar áreas de treino';
        }
      }
    }
  }

  // Render training areas in the tab
  function renderTrainingAreas(trainingAreas) {
    const listContainer = document.getElementById('training-areas-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    trainingAreas.forEach(area => {
      const areaCard = document.createElement('div');
      areaCard.className = 'training-area-card';
      areaCard.dataset.areaId = area.id;

      const statusClass = area.isActive ? 'active' : 'inactive';
      const statusText = area.isActive ? 'Ativa' : 'Inativa';
      const statusIcon = area.isActive ? '✅' : '❌';

      areaCard.innerHTML = `
        <div class="training-area-header">
          <h4 class="training-area-name">${area.name}</h4>
          <div class="training-area-actions">
            <button class="btn-icon-premium" onclick="editTrainingArea('${area.id}')" title="Editar">
              ✏️
            </button>
            <button class="btn-icon-premium" onclick="deleteTrainingArea('${area.id}')" title="Excluir">
              🗑️
            </button>
          </div>
        </div>
        <div class="training-area-info">
          <div class="training-area-detail">
            <span>📍 ${area.description || 'Sem descrição'}</span>
          </div>
          <div class="training-area-detail">
            <span>👥 Capacidade: ${area.capacity || 'Não definida'}</span>
          </div>
          <div class="training-area-detail">
            <span class="area-status ${statusClass}">
              ${statusIcon} ${statusText}
            </span>
          </div>
        </div>
      `;

      // Add click handler for editing
      areaCard.addEventListener('dblclick', () => {
        window.location.hash = `#training-area-editor/${area.id}`;
      });

      listContainer.appendChild(areaCard);
    });
  }

  // Global functions for training area actions
  window.editTrainingArea = function(areaId) {
    window.location.hash = `#training-area-editor/${areaId}`;
  };

  window.deleteTrainingArea = function(areaId) {
    if (confirm('Tem certeza que deseja excluir esta área de treino?')) {
      // Implement delete functionality
      console.log('Delete training area:', areaId);
      // This would typically call the API to delete and then refresh the list
    }
  };

  // Utility functions
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // State management functions
  function showLoadingState() {
    document.getElementById('unit-editor-loading').style.display = 'flex';
    document.getElementById('unit-editor-content').style.display = 'none';
    document.getElementById('unit-editor-error').style.display = 'none';
    document.getElementById('unit-editor-success').style.display = 'none';
  }

  function hideLoadingState() {
    document.getElementById('unit-editor-loading').style.display = 'none';
    document.getElementById('unit-editor-content').style.display = 'block';
  }

  function showErrorState(message) {
    document.getElementById('unit-editor-error').style.display = 'flex';
    document.getElementById('unit-editor-content').style.display = 'none';
    document.getElementById('unit-editor-loading').style.display = 'none';
    document.getElementById('unit-editor-success').style.display = 'none';
    document.getElementById('error-message').textContent = message;
  }

  function showSuccessState(unitData) {
    document.getElementById('unit-editor-success').style.display = 'flex';
    document.getElementById('unit-editor-content').style.display = 'none';
    document.getElementById('unit-editor-loading').style.display = 'none';
    document.getElementById('unit-editor-error').style.display = 'none';
    
    // Update success message
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = `A unidade "${unitData.name}" foi ${unitEditorState.isEditing ? 'atualizada' : 'criada'} com sucesso!`;
    
    // Setup view button
    const viewBtn = document.getElementById('view-unit-btn');
    viewBtn.onclick = () => {
      window.location.hash = '#units';
    };
  }

  // Notification system
  function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  // Navigation helper
  window.navigateToUnitEditor = function(unitId = null) {
    console.log('[UnitEditor] Navigating to unit editor, ID:', unitId);
    
    // Reset state
    unitEditorState.isInitialized = false;
    unitEditorState.currentUnitId = null;
    unitEditorState.isEditing = false;
    
    // Initialize with new ID
    initializeUnitEditor(unitId);
  };

  // Export functions for global access
  window.unitEditor = {
    initialize: initializeUnitEditor,
    navigateToEditor: window.navigateToUnitEditor,
    state: unitEditorState
  };

  console.log('📝 Unit Editor Module - Loaded');

  // Auto-initialize if container exists
  function checkAndInitialize() {
    if (document.querySelector('#unit-editor-container')) {
      const urlParts = window.location.hash.split('/');
      const unitId = urlParts.length > 1 ? urlParts[1] : null;
      console.log('🔧 Auto-initializing unit editor with ID:', unitId);
      initializeUnitEditor(unitId);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInitialize);
  } else {
    // DOM already loaded, check immediately
    setTimeout(checkAndInitialize, 100);
  }
})();

// --- Training Areas Tab Patch (AGENTS.md compliant) ---
; (function UnitsTrainingAreasTabPatch(){
  const PATCH_FLAG = '__unitsTrainingTabPatch';
  if (window[PATCH_FLAG]) return; window[PATCH_FLAG] = true; // idempotent

  const TAB_ID = 'training-areas';
  const PANEL_ID = 'tab-training-areas';
  const PANEL_INNER_ID = 'training-areas-container';

  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function waitForAPIClient(){
    return new Promise(resolve=>{ let tries=0; (function loop(){ if (window.createModuleAPI||tries++>120) return resolve(); setTimeout(loop,50); })(); });
  }

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

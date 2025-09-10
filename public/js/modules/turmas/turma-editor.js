(function(){
    if (window.turmaEditor) {
        console.log('📝 Turma Editor Module - Already loaded, skipping re-declare');
        return;
    }

    console.log('📝 Turma Editor Module - Starting...');

    // Global state
    let turmaEditorState = {
            isInitialized: false,
            currentTurmaId: null,
            isEditing: false,
            formData: {},
            courses: [],
            instructors: [],
            units: [],
            organization: null,
            selectedCourseIds: [] // Initialize as empty array
    };

    // API Helper
    let turmaAPI = null;

async function initializeTurmaEditorAPI() {
    // Wait for API client to be available
    while (!window.createModuleAPI) {
        console.log('[TurmaEditor] Waiting for API client...');
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    turmaAPI = window.createModuleAPI('TurmaEditor');
    console.log('[TurmaEditor] API initialized:', !!turmaAPI);
}

// Main initialization function
async function initializeTurmaEditor(turmaId = null) {
    if (turmaEditorState.isInitialized) {
        console.log('[TurmaEditor] Already initialized, skipping...');
        return;
    }

    console.log('🔧 Initializing Turma Editor...');

    try {
        // Initialize API
        await initializeTurmaEditorAPI();

        // Load CSS
        if (!document.querySelector('link[href*="turma-editor.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/modules/turmas/turma-editor.css';
            document.head.appendChild(link);
            console.log('✅ Turma Editor CSS loaded');
        }

        // Set current turma ID
        turmaEditorState.currentTurmaId = turmaId;
        turmaEditorState.isEditing = !!turmaId;

        // Update UI based on mode
        updateEditorMode();

        // Load form data
        await loadFormData();

        // Setup event listeners
        setupEventListeners();

    // Setup tabs and courses UI handlers
    setupTabsAndCoursesUI();

        // Load turma data if editing
        if (turmaId) {
            await loadTurmaData(turmaId);
        }

        // Initial render of selected courses
        renderSelectedCoursesArea();

        turmaEditorState.isInitialized = true;
        console.log('✅ Turma Editor initialized successfully');

        // Export globally for debugging
        window.turmaEditorState = turmaEditorState;
        window.turmaEditorActions = {
            validateForm,
            collectFormData,
            selectCourse,
            removeSelectedCourse,
            renderSelectedCoursesArea
        };

        // Integrate with AcademyApp
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: 'turma-editor' });
        }

    } catch (error) {
        console.error('[TurmaEditor] Initialization error:', error);
        showErrorState('Erro ao inicializar editor de turma');
        
        if (window.app) {
            window.app.handleError(error, 'TurmaEditor:initialization');
        }
    }
}

// Setup tabs navigation and courses UI
function setupTabsAndCoursesUI() {
    const tabBtnGeneral = document.getElementById('tab-btn-general');
    const tabBtnCourses = document.getElementById('tab-btn-courses');
    const tabGeneral = document.getElementById('tab-general');
    const tabCourses = document.getElementById('tab-courses');

    if (tabBtnGeneral) tabBtnGeneral.addEventListener('click', () => switchEditorTab('general'));
    if (tabBtnCourses) tabBtnCourses.addEventListener('click', () => switchEditorTab('courses'));

    // Add course button - try the centralized course picker (wait briefly if it loads later)
    const addCourseBtn = document.getElementById('add-course-btn');
    if (addCourseBtn) addCourseBtn.addEventListener('click', async () => {
        // Wait up to 2s for the shared picker to become available (some pages load scripts async)
        const maxWait = 2000; // ms
        const interval = 100; // ms
        let waited = 0;

        while (!window.openCoursePicker && waited < maxWait) {
            await new Promise(r => setTimeout(r, interval));
            waited += interval;
        }

        if (window.openCoursePicker) {
            console.log('[TurmaEditor] Opening centralized course picker');
            window.openCoursePicker({
                multi: false,
                preselected: turmaEditorState.selectedCourseIds || [],
                onSelect: (courseId) => {
                    if (Array.isArray(courseId)) courseId = courseId[0];
                    if (courseId) selectCourse(courseId);
                }
            });
        } else {
            showNotification('❌ O seletor de cursos não está disponível. Recarregue a página ou contate o suporte.', 'error');
            // Optionally, disable the Add button until picker loads
            addCourseBtn.disabled = true;
            setTimeout(() => { addCourseBtn.disabled = false; }, 5000);
            console.warn('[TurmaEditor] openCoursePicker not available after wait, using fallback');
            showAddCourseModal();
        }
    });

    // Render selected courses area if any
    renderSelectedCoursesArea();
}

function switchEditorTab(tabName) {
    const tabBtnGeneral = document.getElementById('tab-btn-general');
    const tabBtnCourses = document.getElementById('tab-btn-courses');
    const tabGeneral = document.getElementById('tab-general');
    const tabCourses = document.getElementById('tab-courses');

    if (tabName === 'general') {
        if (tabBtnGeneral) tabBtnGeneral.classList.add('active');
        if (tabBtnCourses) tabBtnCourses.classList.remove('active');
        if (tabGeneral) tabGeneral.style.display = 'block';
        if (tabCourses) tabCourses.style.display = 'none';
    } else {
        if (tabBtnGeneral) tabBtnGeneral.classList.remove('active');
        if (tabBtnCourses) tabBtnCourses.classList.add('active');
        if (tabGeneral) tabGeneral.style.display = 'none';
        if (tabCourses) tabCourses.style.display = 'block';
    }
}

// Selected courses management (simple client-side list)
function renderSelectedCoursesArea() {
    const container = document.getElementById('selected-courses');
    if (!container) return;

    // the turmaEditorState may have a property selectedCourseIds
    turmaEditorState.selectedCourseIds = turmaEditorState.selectedCourseIds || [];

    container.innerHTML = '';

    if (turmaEditorState.selectedCourseIds.length === 0) {
        container.innerHTML = '<div class="empty">Nenhum curso associado</div>';
        return;
    }

    turmaEditorState.selectedCourseIds.forEach(courseId => {
        const course = turmaEditorState.courses.find(c => c.id === courseId) || { id: courseId, name: 'Curso desconhecido' };

        const item = document.createElement('div');
        item.className = 'selected-course-item';
        item.innerHTML = `
            <div class="course-name">🎓 ${course.name}</div>
            <div class="course-actions">
                <button type="button" class="btn btn-link remove-course" data-id="${course.id}">Remover</button>
            </div>
        `;

        container.appendChild(item);
    });

    // wire remove buttons
    const removeBtns = container.querySelectorAll('.remove-course');
    removeBtns.forEach(btn => btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        removeSelectedCourse(id);
    }));
}

function showAddCourseModal() {
    console.log('[TurmaEditor] showAddCourseModal fallback called - use openCoursePicker when available');
}

function closeCoursesModal() {
    const modal = document.getElementById('courses-modal');
    if (!modal) return;
    modal.innerHTML = '';
    modal.style.display = 'none';
}

function selectCourse(courseId) {
    turmaEditorState.selectedCourseIds = turmaEditorState.selectedCourseIds || [];
    if (!turmaEditorState.selectedCourseIds.includes(courseId)) {
        turmaEditorState.selectedCourseIds.push(courseId);
    }
    renderSelectedCoursesArea();
    closeCoursesModal();
}

function removeSelectedCourse(courseId) {
    turmaEditorState.selectedCourseIds = turmaEditorState.selectedCourseIds || [];
    turmaEditorState.selectedCourseIds = turmaEditorState.selectedCourseIds.filter(id => id !== courseId);
    renderSelectedCoursesArea();
}

// Update editor mode (create vs edit)
function updateEditorMode() {
    const titleElement = document.getElementById('editor-title');
    const breadcrumbAction = document.getElementById('breadcrumb-action');
    const saveBtn = document.getElementById('save-turma-btn');

    if (turmaEditorState.isEditing) {
        titleElement.textContent = '✏️ Editar Turma';
        breadcrumbAction.textContent = 'Editar Turma';
        saveBtn.innerHTML = '💾 Atualizar Turma';
    } else {
        titleElement.textContent = '✨ Nova Turma';
        breadcrumbAction.textContent = 'Nova Turma';
        saveBtn.innerHTML = '💾 Salvar Turma';
    }
}

// Load form data (courses, instructors, units)
async function loadFormData() {
    console.log('[TurmaEditor] Loading form data...');
    
    try {
        showLoadingState();

        // Load organization first
        const orgsResponse = await fetch('/api/organizations');
        const orgsData = await orgsResponse.json();
        turmaEditorState.organization = orgsData.success && orgsData.data.length > 0 ? orgsData.data[0] : null;

        // Load courses
        const coursesResponse = await fetch('/api/courses');
        const coursesData = await coursesResponse.json();
        turmaEditorState.courses = coursesData.success ? coursesData.data : [];

        // Load instructors
        const instructorsResponse = await fetch('/api/instructors');
        const instructorsData = await instructorsResponse.json();
        turmaEditorState.instructors = instructorsData.success ? instructorsData.data : [];

        // Load units
        const unitsResponse = await fetch('/api/units');
        const unitsData = await unitsResponse.json();
        turmaEditorState.units = unitsData.success ? unitsData.data : [];
        
        // Load training areas
        const trainingAreasResponse = await fetch('/api/training-areas');
        const trainingAreasData = await trainingAreasResponse.json();
        turmaEditorState.trainingAreas = trainingAreasData.success ? trainingAreasData.data : [];

        // Populate form selects
        populateFormSelects();
        
        // Pre-select first course if none selected and not editing
        if (!turmaEditorState.isEditing && turmaEditorState.courses.length > 0 && turmaEditorState.selectedCourseIds.length === 0) {
            turmaEditorState.selectedCourseIds = [turmaEditorState.courses[0].id];
            console.log('[TurmaEditor] Auto-selected first course:', turmaEditorState.courses[0].name);
        }
        
        // Pre-select first instructor and unit if not editing
        if (!turmaEditorState.isEditing) {
            const instructorSelect = document.getElementById('turma-instructor');
            const unitSelect = document.getElementById('turma-unit');
            
            if (turmaEditorState.instructors.length > 0 && !instructorSelect.value) {
                instructorSelect.value = turmaEditorState.instructors[0].id;
                console.log('[TurmaEditor] Auto-selected first instructor:', turmaEditorState.instructors[0].name);
            }
            
            if (turmaEditorState.units.length > 0 && !unitSelect.value) {
                unitSelect.value = turmaEditorState.units[0].id;
                console.log('[TurmaEditor] Auto-selected first unit:', turmaEditorState.units[0].name);
            }
        }
        
        // Auto-fill unique name if empty and not editing
        if (!turmaEditorState.isEditing) {
            const nameInput = document.getElementById('turma-name');
            if (nameInput && !nameInput.value.trim()) {
                const now = new Date();
                const timestamp = now.toISOString().slice(5, 16).replace('T', ' ');
                nameInput.value = `Turma ${timestamp}`;
                console.log('[TurmaEditor] Auto-filled unique turma name');
            }
        }
        
        hideLoadingState();

        console.log('[TurmaEditor] Form data loaded successfully');

    } catch (error) {
        console.error('[TurmaEditor] Error loading form data:', error);
        showErrorState('Erro ao carregar dados do formulário');
    }
}

// Populate form select elements
function populateFormSelects() {
    // Courses are managed in the Cursos tab; we still keep the list in state for the picker
    // (no DOM select in the Geral tab anymore)

    // Populate instructors
    const instructorSelect = document.getElementById('turma-instructor');
    instructorSelect.innerHTML = '<option value="">Selecione um instrutor...</option>';
    turmaEditorState.instructors.forEach(instructor => {
        const option = document.createElement('option');
        option.value = instructor.id;
        option.textContent = `👨‍🏫 ${instructor.name}`;
        instructorSelect.appendChild(option);
    });

    // Populate units
    const unitSelect = document.getElementById('turma-unit');
    unitSelect.innerHTML = '<option value="">Selecione uma unidade...</option>';
    turmaEditorState.units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.id;
        option.textContent = `🏢 ${unit.name}`;
        unitSelect.appendChild(option);
    });
    
    // Populate training areas
    const trainingAreaSelect = document.getElementById('turma-training-area');
    if (trainingAreaSelect) {
        trainingAreaSelect.innerHTML = '<option value="">Selecione uma área de treino...</option>';
        turmaEditorState.trainingAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = `🏃 ${area.name} (${area.unit.name})`;
            trainingAreaSelect.appendChild(option);
        });
    }
}

// Load turma data for editing
async function loadTurmaData(turmaId) {
    console.log('[TurmaEditor] Loading turma data for ID:', turmaId);
    
    try {
        showLoadingState();

        const response = await fetch(`/api/turmas/${turmaId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao carregar turma');
        }

        const turma = data.data;
        console.log('[TurmaEditor] Turma data loaded:', turma);

        // Populate form with turma data
        populateFormWithTurmaData(turma);
        
        hideLoadingState();

    } catch (error) {
        console.error('[TurmaEditor] Error loading turma data:', error);
        showErrorState(error.message);
    }
}

// Populate form with existing turma data
function populateFormWithTurmaData(turma) {
    // Basic info
    document.getElementById('turma-name').value = turma.name || '';
    // Load main course into selectedCourseIds so it's managed via the Cursos tab
    turmaEditorState.selectedCourseIds = turmaEditorState.selectedCourseIds || [];
    if (turma.courseId && !turmaEditorState.selectedCourseIds.includes(turma.courseId)) {
        turmaEditorState.selectedCourseIds.unshift(turma.courseId);
    }
    document.getElementById('turma-type').value = turma.classType || '';
    document.getElementById('turma-instructor').value = turma.instructorId || '';

    // Schedule
    if (turma.startDate) {
        const startDate = new Date(turma.startDate);
        document.getElementById('turma-start-date').value = startDate.toISOString().split('T')[0];
    }
    
    if (turma.endDate) {
        const endDate = new Date(turma.endDate);
        document.getElementById('turma-end-date').value = endDate.toISOString().split('T')[0];
    }

    // Schedule details from JSON
    if (turma.schedule) {
        const schedule = typeof turma.schedule === 'string' ? JSON.parse(turma.schedule) : turma.schedule;
        
        if (schedule.time) {
            document.getElementById('turma-time').value = schedule.time;
        }
        
        if (schedule.duration) {
            document.getElementById('turma-duration').value = schedule.duration;
        }

        // Days of week
        if (schedule.daysOfWeek && Array.isArray(schedule.daysOfWeek)) {
            const checkboxes = document.querySelectorAll('input[name="daysOfWeek"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = schedule.daysOfWeek.includes(parseInt(checkbox.value));
            });
        }
    }

    // Configuration
    document.getElementById('turma-max-students').value = turma.maxStudents || 20;
    document.getElementById('turma-unit').value = turma.unitId || '';
    document.getElementById('turma-room').value = turma.room || '';
    
    // Training area
    const trainingAreaSelect = document.getElementById('turma-training-area');
    if (trainingAreaSelect && turma.trainingAreaId) {
        trainingAreaSelect.value = turma.trainingAreaId;
    }
    
    document.getElementById('turma-price').value = turma.price || '';
    document.getElementById('turma-description').value = turma.description || '';
}

// Setup event listeners
function setupEventListeners() {
    // Save button
    document.getElementById('save-turma-btn').addEventListener('click', handleSaveTurma);

    // Form validation
    const form = document.getElementById('turma-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveTurma();
    });

    // Real-time validation
    const requiredInputs = form.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    console.log('[TurmaEditor] Event listeners setup completed');
}

// Handle save turma
async function handleSaveTurma() {
    console.log('[TurmaEditor] Saving turma...');
    // Keep original button text available to restore in both try and catch
    let originalText = null;

    try {
        // Validate form
        if (!validateForm()) {
            showNotification('❌ Por favor, corrija os erros no formulário', 'error');
            return;
        }

        // Collect form data
        const formData = collectFormData();
        if (!formData) {
            // collectFormData already showed error notification
            return;
        }
        console.log('[TurmaEditor] Form data collected:', formData);

        // Show loading on save button
        const saveBtn = document.getElementById('save-turma-btn');
        originalText = saveBtn ? saveBtn.innerHTML : '💾 Salvar Turma';
        if (saveBtn) {
            saveBtn.innerHTML = '⏳ Salvando...';
            saveBtn.disabled = true;
        }

        // API call
        console.log('[TurmaEditor] Making API request:', {
            method: turmaEditorState.isEditing ? 'PUT' : 'POST',
            url: turmaEditorState.isEditing ? `/api/turmas/${turmaEditorState.currentTurmaId}` : '/api/turmas',
            payload: JSON.stringify(formData, null, 2)
        });
        
        let response;
        if (turmaEditorState.isEditing) {
            response = await fetch(`/api/turmas/${turmaEditorState.currentTurmaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch('/api/turmas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        console.log('[TurmaEditor] Response status:', response.status);
        console.log('[TurmaEditor] Response headers:', Object.fromEntries(response.headers.entries()));

        // Get response text first for debugging
        const responseText = await response.text();
        console.log('[TurmaEditor] Raw response text:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[TurmaEditor] Failed to parse response as JSON:', parseError);
            result = { success: false, error: 'Invalid response format' };
        }
        console.log('[TurmaEditor] Save response:', result);

        // Restore button
        if (saveBtn) {
            saveBtn.innerHTML = originalText || (turmaEditorState.isEditing ? '💾 Atualizar Turma' : '💾 Salvar Turma');
            saveBtn.disabled = false;
        }

        if (result.success) {
            showSuccessState(result.data);
            showNotification(
                turmaEditorState.isEditing ? '✅ Turma atualizada com sucesso!' : '✅ Turma criada com sucesso!',
                'success'
            );
        } else {
            // Show detailed validation errors if available
            if (result.details && Array.isArray(result.details)) {
                const errorMessages = result.details.map(detail => {
                    const field = detail.path ? detail.path.join('.') : 'Campo desconhecido';
                    return `${field}: ${detail.message}`;
                }).join('\n');
                
                showNotification(`❌ Dados inválidos:\n${errorMessages}`, 'error');
                console.error('[TurmaEditor] Validation errors:', result.details);
            } else {
                throw new Error(result.error || 'Erro ao salvar turma');
            }
        }

    } catch (error) {
        console.error('[TurmaEditor] Save error:', error);
        
        // More specific error handling
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('❌ Erro de conexão. Verifique se o servidor está funcionando.', 'error');
        } else if (error.message.includes('500')) {
            showNotification('❌ Erro interno do servidor. Tente novamente em alguns instantes.', 'error');
        } else {
            showNotification(`❌ ${error.message}`, 'error');
        }
        
        // Restore button (safe fallback if originalText is not available)
        const saveBtn = document.getElementById('save-turma-btn');
        if (saveBtn) {
            saveBtn.innerHTML = originalText || (turmaEditorState.isEditing ? '💾 Atualizar Turma' : '💾 Salvar Turma');
            saveBtn.disabled = false;
        }

        if (window.app) {
            window.app.handleError(error, 'TurmaEditor:save');
        }
    }
}

// Collect form data
function collectFormData() {
    const form = document.getElementById('turma-form');
    if (!form) {
        console.error('[TurmaEditor] Form not found');
        return {};
    }
    
    const formData = new FormData(form);
    
    // Debug: log all form data
    for (let [key, value] of formData.entries()) {
        console.log(`[TurmaEditor] Form field ${key}:`, value);
    }
    
    // Get selected days of week
    const daysOfWeek = [];
    const dayCheckboxes = document.querySelectorAll('input[name="daysOfWeek"]:checked');
    dayCheckboxes.forEach(checkbox => {
        daysOfWeek.push(parseInt(checkbox.value));
    });

    // Build data object
    const selectedCourses = turmaEditorState.selectedCourseIds || [];
    console.log('[TurmaEditor] Selected courses array:', selectedCourses);
    console.log('[TurmaEditor] Selected courses type:', typeof selectedCourses);
    console.log('[TurmaEditor] Selected courses length:', selectedCourses.length);
    
    // Ensure we have a valid unitId
    let unitId = formData.get('unitId');
    if (!unitId && turmaEditorState.units.length > 0) {
        unitId = turmaEditorState.units[0].id;
        console.log('[TurmaEditor] Using fallback unitId:', unitId);
    }
    
    // Get training area ID
    let trainingAreaId = formData.get('trainingAreaId');
    
    const data = {
        name: formData.get('name'),
        courseId: selectedCourses.length > 0 ? selectedCourses[0] : null, // main course for backend
        type: formData.get('type'),
        instructorId: formData.get('instructorId'),
        startDate: formData.get('startDate') ? new Date(formData.get('startDate')).toISOString() : null,
        endDate: formData.get('endDate') ? new Date(formData.get('endDate')).toISOString() : null,
        maxStudents: parseInt(formData.get('maxStudents')) || 20,
        organizationId: turmaEditorState.organization ? turmaEditorState.organization.id : 'd961f738-9552-4385-8c1d-e10d8b1047e5',
        unitId: unitId,
        trainingAreaId: trainingAreaId || null,
        schedule: {
            daysOfWeek: daysOfWeek,
            time: formData.get('time'),
            duration: parseInt(formData.get('duration')) || 60
        }
        // Note: Remove room, price, description, selectedCourseIds - not in backend schema
    };

    console.log('[TurmaEditor] Collected data:', data);
    console.log('[TurmaEditor] JSON test:', JSON.stringify(data, null, 2));
    
    // Final validation of critical fields
    const criticalFields = ['name', 'courseId', 'type', 'instructorId', 'startDate', 'organizationId', 'unitId'];
    const missingCritical = criticalFields.filter(field => !data[field]);
    
    if (missingCritical.length > 0) {
        console.error('[TurmaEditor] Missing critical fields:', missingCritical);
        showNotification(`❌ Campos críticos faltando: ${missingCritical.join(', ')}`, 'error');
        return null;
    }
    
    return data;
}

// Form validation
function validateForm() {
    const form = document.getElementById('turma-form');
    let isValid = true;
    let missingFields = [];

    // Check required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
            const label = field.closest('.form-group')?.querySelector('.form-label')?.textContent || field.name;
            missingFields.push(label);
        }
    });

    // Check days of week
    const daysCheckboxes = document.querySelectorAll('input[name="daysOfWeek"]:checked');
    if (daysCheckboxes.length === 0) {
        showFieldError('weekdays-selector', 'Selecione pelo menos um dia da semana');
        missingFields.push('Dias da semana');
        isValid = false;
    }

    // Check at least one course selected
    if (!turmaEditorState.selectedCourseIds || turmaEditorState.selectedCourseIds.length === 0) {
        showNotification('❌ Selecione pelo menos um curso na aba Cursos', 'error');
        // Optionally switch to Cursos tab for user convenience
        switchEditorTab('courses');
        missingFields.push('Curso');
        isValid = false;
    }

    // Check schedule details
    const timeInput = document.getElementById('turma-time');
    const durationInput = document.getElementById('turma-duration');
    
    if (!timeInput.value) {
        showFieldError('turma-time', 'Horário é obrigatório');
        missingFields.push('Horário');
        isValid = false;
    }
    
    if (!durationInput.value || parseInt(durationInput.value) < 30) {
        showFieldError('turma-duration', 'Duração deve ser pelo menos 30 minutos');
        missingFields.push('Duração válida');
        isValid = false;
    }

    // Check unitId is available
    const unitSelect = document.getElementById('turma-unit');
    if (!unitSelect.value && (!turmaEditorState.units || turmaEditorState.units.length === 0)) {
        showNotification('❌ Nenhuma unidade disponível. Cadastre uma unidade primeiro.', 'error');
        missingFields.push('Unidade');
        isValid = false;
    }

    if (!isValid) {
        console.log('[TurmaEditor] Validation failed. Missing fields:', missingFields);
        showNotification(`❌ Campos obrigatórios: ${missingFields.join(', ')}`, 'error');
    } else {
        console.log('[TurmaEditor] Validation passed');
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

// Utility functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// State management functions
function showLoadingState() {
    document.getElementById('turma-editor-loading').style.display = 'flex';
    document.getElementById('turma-editor-content').style.display = 'none';
    document.getElementById('turma-editor-error').style.display = 'none';
    document.getElementById('turma-editor-success').style.display = 'none';
}

function hideLoadingState() {
    document.getElementById('turma-editor-loading').style.display = 'none';
    document.getElementById('turma-editor-content').style.display = 'block';
}

function showErrorState(message) {
    document.getElementById('turma-editor-error').style.display = 'flex';
    document.getElementById('turma-editor-content').style.display = 'none';
    document.getElementById('turma-editor-loading').style.display = 'none';
    document.getElementById('turma-editor-success').style.display = 'none';
    document.getElementById('error-message').textContent = message;
}

function showSuccessState(turmaData) {
    document.getElementById('turma-editor-success').style.display = 'flex';
    document.getElementById('turma-editor-content').style.display = 'none';
    document.getElementById('turma-editor-loading').style.display = 'none';
    document.getElementById('turma-editor-error').style.display = 'none';
    
    // Update success message
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = `A turma "${turmaData.name}" foi ${turmaEditorState.isEditing ? 'atualizada' : 'criada'} com sucesso!`;
    
    // Setup view button
    const viewBtn = document.getElementById('view-turma-btn');
    viewBtn.onclick = () => {
        window.navigateToModule('turmas', { turmaId: turmaData.id });
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
window.navigateToTurmaEditor = function(turmaId = null) {
    console.log('[TurmaEditor] Navigating to turma editor, ID:', turmaId);
    
    // Reset state
    turmaEditorState.isInitialized = false;
    turmaEditorState.currentTurmaId = null;
    turmaEditorState.isEditing = false;
    
    // Initialize with new ID
    initializeTurmaEditor(turmaId);
};

  // Export functions for global access
  window.turmaEditor = {
      initialize: initializeTurmaEditor,
      navigateToEditor: window.navigateToTurmaEditor,
      state: turmaEditorState,
      // Helper function for quick testing
      fillTestData: () => {
          if (!turmaEditorState.isInitialized) {
              console.warn('[TurmaEditor] Not initialized yet');
              return;
          }
          
          // Generate unique name with timestamp
          const now = new Date();
          const timestamp = now.toISOString().slice(5, 16).replace('T', ' ');
          const uniqueName = `Turma ${timestamp}`;
          
          document.getElementById('turma-name').value = uniqueName;
          document.getElementById('turma-type').value = 'COLLECTIVE';
          document.getElementById('turma-start-date').value = '2025-09-01';
          document.getElementById('turma-end-date').value = '2025-12-31';
          document.getElementById('turma-time').value = '19:00';
          document.getElementById('turma-duration').value = '90';
          
          // Select first instructor if available
          const instructorSelect = document.getElementById('turma-instructor');
          if (instructorSelect.options.length > 1) {
              instructorSelect.selectedIndex = 1;
          }
          
          // Select first unit if available
          const unitSelect = document.getElementById('turma-unit');
          if (unitSelect.options.length > 1) {
              unitSelect.selectedIndex = 1;
          }
          
          // Check Mon and Wed
          const monCheckbox = document.querySelector('input[name="daysOfWeek"][value="1"]');
          const wedCheckbox = document.querySelector('input[name="daysOfWeek"][value="3"]');
          if (monCheckbox) monCheckbox.checked = true;
          if (wedCheckbox) wedCheckbox.checked = true;
          
          // Make sure we have a course selected
          if (turmaEditorState.selectedCourseIds.length === 0 && turmaEditorState.courses.length > 0) {
              turmaEditorState.selectedCourseIds = [turmaEditorState.courses[0].id];
              renderSelectedCoursesArea();
          }
          
          console.log('✅ Test data filled');
          console.log('State:', {
              courses: turmaEditorState.courses.length,
              instructors: turmaEditorState.instructors.length,
              units: turmaEditorState.units.length,
              selectedCourses: turmaEditorState.selectedCourseIds.length,
              organization: !!turmaEditorState.organization
          });
      },
      validateForm,
      collectFormData,
      renderSelectedCoursesArea
  };

  console.log('📝 Turma Editor Module - Loaded');

  // Auto-initialize if container exists
  document.addEventListener('DOMContentLoaded', () => {
      if (document.querySelector('.turma-editor-container')) {
          const urlParams = new URLSearchParams(window.location.search);
          const turmaId = urlParams.get('id');
          initializeTurmaEditor(turmaId);
      }
  });
})();

/**
 * Turmas Module - Consolidated Edition
 * Following GUIDELINES2.md standards with inline editor
 * API-First, Modular, AcademyApp Integration
 */

(function() {
    'use strict';
    
    console.log('👥 Turmas Module Consolidated - Starting...');
    
    // Wait for dependencies
    async function waitForDependencies() {
        console.log('[Turmas] Waiting for dependencies...');
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        while (!window.createModuleAPI && attempts < maxAttempts) {
            console.log(`[Turmas] Waiting for createModuleAPI... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.createModuleAPI) {
            throw new Error('createModuleAPI not available after 10 seconds');
        }
        
        console.log('[Turmas] Dependencies available!');
    }

    // API helper
    let turmasAPI = null;
    
    // Initialize API
    async function initializeAPI() {
        console.log('[Turmas] Initializing API...');
        
        if (turmasAPI) {
            console.log('[Turmas] API already initialized, skipping...');
            return;
        }
        
        try {
            await waitForDependencies();
            turmasAPI = window.createModuleAPI('Turmas');
            console.log('[Turmas] API initialized successfully:', !!turmasAPI);
        } catch (error) {
            console.error('[Turmas] Error initializing API:', error);
            throw error;
        }
    }
    
    // Module state
    let moduleState = {
        isInitialized: false,
        isInitializing: false,
        isSaving: false, // Add saving state protection
        handlersSetup: false, // Prevent multiple handler setups
        lastSaveAttempt: 0, // Track last save attempt timestamp
        currentView: 'list', // 'list', 'create', 'edit'
        editingTurma: null,
        turmas: [],
        courses: [],
        instructors: [],
        units: [],
        trainingAreas: []
    };
    
    // Load CSS
    function loadTurmasCSS() {
        if (!document.querySelector('link[href*="turmas-consolidated.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/modules/turmas-consolidated.css';
            document.head.appendChild(link);
        }
    }
    
    // Turmas Module Definition following GUIDELINES2.md
    const TurmasModule = {
        name: 'turmas',
        version: '3.0.0',
        initialized: false,
        
        async init() {
            if (this.initialized) {
                console.log('[Turmas] Module already initialized');
                return;
            }
            
            try {
                await initializeAPI();
                await initializeTurmasModule();
                this.initialized = true;
                
                // Register with AcademyApp
                if (window.app) {
                    window.app.registerModule('turmas', this);
                    window.app.dispatchEvent('module:loaded', { name: 'turmas' });
                }
                
                console.log('✅ Turmas Module initialized successfully');
            } catch (error) {
                console.error('❌ Failed to initialize Turmas Module:', error);
                if (window.app) {
                    window.app.handleError(error, 'turmas-init');
                }
            }
        },
        
        async destroy() {
            this.initialized = false;
            moduleState.isInitialized = false;
            moduleState.isInitializing = false;
        },
        
        // Public API
        showCreateForm() {
            showTurmaEditor();
        },
        
        showEditForm(turmaId) {
            // Prevent multiple rapid clicks
            if (moduleState.currentView === 'edit' || moduleState.currentView === 'create') {
                console.log('[Turmas] Editor already open, ignoring click...');
                return;
            }
            
            showTurmaEditor(turmaId);
        },
        
        showListView() {
            showListView();
        },
        
        refreshList() {
            loadTurmasData();
        }
    };
    
    // Main initialization function
    async function initializeTurmasModule() {
        if (moduleState.isInitialized) {
            console.log('[Turmas] Already initialized, skipping...');
            return Promise.resolve();
        }
        
        // Prevent multiple simultaneous initializations with timeout
        if (moduleState.isInitializing) {
            console.log('[Turmas] Initialization in progress, waiting...');
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            while (moduleState.isInitializing && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (attempts >= maxAttempts) {
                console.warn('[Turmas] Initialization timeout, forcing new initialization...');
                moduleState.isInitializing = false;
            } else if (moduleState.isInitialized) {
                console.log('[Turmas] Initialization completed by another instance');
                return Promise.resolve();
            }
        }
        
        moduleState.isInitializing = true;
        console.log('[Turmas] Starting fresh initialization...');
        
        try {
            console.log('🔧 Initializing Turmas Module...');
            
            // Load and apply CSS
            loadTurmasCSS();
            console.log('✅ Turmas CSS loaded');
            
            // Initialize module container - try multiple selectors
            const container = document.getElementById('turmasContainer') || 
                             document.getElementById('module-container') ||
                             document.querySelector('.turmas-container') ||
                             document.querySelector('#main-content');
            
            console.log('[Turmas] Container found:', !!container);
            console.log('[Turmas] Container ID:', container?.id);
            
            if (!container) {
                console.error('[Turmas] No suitable container found');
                moduleState.isInitializing = false;
                return Promise.reject(new Error('Container not found'));
            }
            
            // Initialize API
            console.log('[Turmas] Initializing API...');
            await initializeAPI();
            console.log('[Turmas] API initialized successfully');
            
            // Set up initial view
            console.log('[Turmas] Rendering main view...');
            renderMainView(container);
            
            // Load initial data
            console.log('[Turmas] Loading initial data...');
            await loadInitialData();
            
            moduleState.isInitialized = true;
            moduleState.isInitializing = false;
            console.log('✅ Turmas Module initialized successfully');
            
            return Promise.resolve();
            
        } catch (error) {
            console.error('❌ Error initializing turmas module:', error);
            moduleState.isInitializing = false;
            if (window.app) {
                window.app.handleError(error, 'turmas-module-init');
            }
            return Promise.reject(error);
        }
    }
    
    // Render main view
    function renderMainView(container) {
        console.log('[Turmas] Rendering main view in container:', container);
        
        container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="breadcrumb-nav">
                            <span class="breadcrumb-item">🏠 Home</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item active">👥 Turmas</span>
                        </div>
                        <h1 class="header-title">👥 Gestão de Turmas</h1>
                        <p class="header-subtitle">Gerencie turmas, horários e cronogramas</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="turmas.showCreateForm()">
                            ➕ Nova Turma
                        </button>
                    </div>
                </div>

                <!-- Stats Cards Enhanced -->
                <div class="stats-row">
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-value" id="total-turmas">-</div>
                            <div class="stat-label">Total de Turmas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🟢</div>
                        <div class="stat-content">
                            <div class="stat-value" id="active-turmas">-</div>
                            <div class="stat-label">Turmas Ativas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-value" id="scheduled-turmas">-</div>
                            <div class="stat-label">Agendadas</div>
                        </div>
                    </div>
                    <div class="stat-card-enhanced">
                        <div class="stat-icon">🎓</div>
                        <div class="stat-content">
                            <div class="stat-value" id="finished-turmas">-</div>
                            <div class="stat-label">Finalizadas</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div class="main-content-area">
                    <!-- List View -->
                    <div id="turmas-list-view" class="content-view active">
                        <!-- Loading State -->
                        <div id="loading-state" class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Carregando turmas...</p>
                        </div>
                        
                        <!-- Empty State -->
                        <div id="empty-state" class="empty-state" style="display: none;">
                            <div class="empty-icon">👥</div>
                            <h3>Nenhuma turma encontrada</h3>
                            <p>Crie sua primeira turma para começar</p>
                            <button class="btn btn-primary" onclick="turmas.showCreateForm()">
                                ➕ Criar Primeira Turma
                            </button>
                        </div>
                        
                        <!-- Error State -->
                        <div id="error-state" class="error-state" style="display: none;">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar turmas</h3>
                            <p id="error-message">Ocorreu um erro inesperado</p>
                            <button class="btn btn-secondary" onclick="turmas.refreshList()">
                                🔄 Tentar Novamente
                            </button>
                        </div>
                        
                        <!-- Data Grid -->
                        <div id="turmas-grid" class="data-grid" style="display: none;">
                            <div class="grid-header">
                                <h3>Lista de Turmas</h3>
                                <div class="grid-actions">
                                    <input type="text" placeholder="Buscar turmas..." class="search-input" id="search-turmas">
                                    <select class="filter-select" id="filter-status">
                                        <option value="">Todos os Status</option>
                                        <option value="SCHEDULED">Agendadas</option>
                                        <option value="IN_PROGRESS">Em Andamento</option>
                                        <option value="COMPLETED">Finalizadas</option>
                                        <option value="CANCELLED">Canceladas</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid-content" id="turmas-table-container">
                                <!-- Table will be rendered here -->
                            </div>
                        </div>
                    </div>

                    <!-- Editor View -->
                    <div id="turmas-editor-view" class="content-view" style="display: none;">
                        <!-- Editor content will be rendered here -->
                    </div>
                </div>
            </div>
        `;
        
        console.log('[Turmas] Main view HTML rendered successfully');
    }
    
    // Load initial data
    async function loadInitialData() {
        console.log('[Turmas] Loading initial data...');
        
        try {
            // Load turmas data
            console.log('[Turmas] Step 1: Loading turmas data...');
            await loadTurmasData();
            console.log('[Turmas] Step 1 completed: Turmas data loaded');
            
            // Load dependencies for editor
            console.log('[Turmas] Step 2: Loading form dependencies...');
            await loadFormDependencies();
            console.log('[Turmas] Step 2 completed: Form dependencies loaded');
            
            console.log('[Turmas] ✅ All initial data loaded successfully!');
            
        } catch (error) {
            console.error('[Turmas] Error loading initial data:', error);
            showErrorState('Erro ao carregar dados iniciais');
        }
    }
    
    // Load turmas data
    async function loadTurmasData() {
        console.log('[Turmas] Loading turmas data...');
        showLoadingState();
        
        try {
            console.log('[Turmas] Making API call to /api/turmas...');
            const response = await fetch('/api/turmas');
            console.log('[Turmas] API response status:', response.status);
            
            const result = await response.json();
            console.log('[Turmas] API response data:', result);
            
            if (result.success && result.data) {
                moduleState.turmas = result.data;
                console.log(`[Turmas] Loaded ${result.data.length} turmas`);
                
                console.log('[Turmas] Updating stats cards...');
                updateStatsCards(result.data);
                
                console.log('[Turmas] Rendering turmas table...');
                renderTurmasTable(result.data);
                
                console.log('[Turmas] Hiding loading state...');
                hideLoadingState();
                
                if (result.data.length === 0) {
                    console.log('[Turmas] No data, showing empty state...');
                    showEmptyState();
                } else {
                    console.log('[Turmas] Showing data grid...');
                    showDataGrid();
                }
                
                console.log('[Turmas] Turmas data loaded successfully!');
            } else {
                throw new Error('Invalid API response: ' + JSON.stringify(result));
            }
            
        } catch (error) {
            console.error('[Turmas] Error loading turmas:', error);
            hideLoadingState();
            showErrorState('Erro ao carregar turmas: ' + error.message);
        }
    }
    
    // Update stats cards
    function updateStatsCards(turmas) {
        const totalElement = document.getElementById('total-turmas');
        const activeElement = document.getElementById('active-turmas');
        const scheduledElement = document.getElementById('scheduled-turmas');
        const finishedElement = document.getElementById('finished-turmas');
        
        if (totalElement) totalElement.textContent = turmas.length;
        if (activeElement) activeElement.textContent = turmas.filter(t => t.status === 'IN_PROGRESS').length;
        if (scheduledElement) scheduledElement.textContent = turmas.filter(t => t.status === 'SCHEDULED').length;
        if (finishedElement) finishedElement.textContent = turmas.filter(t => t.status === 'COMPLETED').length;
    }
    
    // Render turmas table
    function renderTurmasTable(turmas) {
        const container = document.getElementById('turmas-table-container');
        if (!container) return;
        
        if (turmas.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma turma encontrada</p>';
            return;
        }
        
        const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Curso</th>
                        <th>Instrutor</th>
                        <th>Status</th>
                        <th>Início</th>
                        <th>Alunos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${turmas.map(turma => `
                        <tr class="table-row">
                            <td>
                                <div class="cell-content">
                                    <strong>${turma.name}</strong>
                                    ${turma.description ? `<br><small>${turma.description}</small>` : ''}
                                </div>
                            </td>
                            <td>${turma.course?.name || 'N/A'}</td>
                            <td>${turma.instructor?.name || 'N/A'}</td>
                            <td>
                                <span class="status-badge status-${turma.status.toLowerCase()}">
                                    ${getStatusText(turma.status)}
                                </span>
                            </td>
                            <td>${formatDate(turma.startDate)}</td>
                            <td>
                                <span class="student-count">
                                    ${turma.students?.length || 0}/${turma.maxStudents || 0}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button onclick="turmas.showEditForm('${turma.id}')" class="btn-action-small btn-edit">
                                        <span>✏️</span><span>Editar</span>
                                    </button>
                                    <button onclick="viewTurma('${turma.id}')" class="btn-action-small btn-view">
                                        <span>👁️</span><span>Ver</span>
                                    </button>
                                    <button onclick="deleteTurma('${turma.id}')" class="btn-action-small btn-danger">
                                        <span>🗑️</span><span>Excluir</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = table;
    }
    
    // Show turma editor (create or edit)
    async function showTurmaEditor(turmaId = null) {
        console.log('[Turmas] Showing editor for:', turmaId || 'new turma');
        
        // Prevent multiple simultaneous editor opens
        if (moduleState.currentView === 'edit' || moduleState.currentView === 'create') {
            console.log('[Turmas] Editor already open, ignoring...');
            return;
        }
        
        const isEdit = !!turmaId;
        moduleState.currentView = isEdit ? 'edit' : 'create';
        moduleState.editingTurma = null;
        
        try {
            // Load turma data if editing
            if (isEdit) {
                await loadTurmaForEdit(turmaId);
            }
            
            // Ensure dependencies are loaded
            await loadFormDependencies();
            
            // Switch to editor view
            showEditorView();
            renderTurmaEditor(isEdit);
            
        } catch (error) {
            console.error('[Turmas] Error showing editor:', error);
            
            // Show user-friendly error message
            const errorMessage = error.message || 'Erro desconhecido';
            
            if (window.app && window.app.showNotification) {
                window.app.showNotification(`Erro ao abrir editor: ${errorMessage}`, 'error');
            } else {
                alert(`Erro ao abrir editor: ${errorMessage}`);
            }
            
            // Stay in list view
            showListView();
            
            if (window.app) {
                window.app.handleError(error, 'turmas-editor');
            }
        }
    }
    
    // Load turma for editing
    async function loadTurmaForEdit(turmaId) {
        console.log('[Turmas] Loading turma for edit:', turmaId);
        
        try {
            // First check if turma exists in our local state
            const localTurma = moduleState.turmas.find(t => t.id === turmaId);
            if (!localTurma) {
                console.warn('[Turmas] Turma not found in local state, refreshing data...');
                await loadTurmasData();
                
                // Check again after refresh
                const refreshedTurma = moduleState.turmas.find(t => t.id === turmaId);
                if (!refreshedTurma) {
                    throw new Error('Turma não encontrada após atualização');
                }
            }
            
            // Try to load detailed data from API, but fallback to local data if it fails
            try {
                console.log('[Turmas] Making API call to load turma details...');
                const response = await fetch(`/api/turmas/${turmaId}`);
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        moduleState.editingTurma = result.data;
                        console.log('[Turmas] Loaded detailed turma data from API:', result.data.name);
                        return;
                    }
                }
                
                // If API fails or returns no data, fall back to local data
                throw new Error('API response invalid or failed');
                
            } catch (apiError) {
                console.warn('[Turmas] API call failed, using local data as fallback:', apiError.message);
                
                // Use local data as fallback
                const localTurma = moduleState.turmas.find(t => t.id === turmaId);
                if (localTurma) {
                    moduleState.editingTurma = localTurma;
                    console.log('[Turmas] Using local turma data for editing:', localTurma.name);
                } else {
                    throw new Error('Turma não encontrada nem na API nem localmente');
                }
            }
            
        } catch (error) {
            console.error('[Turmas] Error loading turma for edit:', error);
            throw error;
        }
    }
    
    // Load form dependencies
    async function loadFormDependencies() {
        console.log('[Turmas] Loading form dependencies...');
        
        try {
            // Load courses if not loaded
            if (moduleState.courses.length === 0) {
                console.log('[Turmas] Loading courses...');
                const coursesResponse = await fetch('/api/courses');
                const coursesResult = await coursesResponse.json();
                if (coursesResult.success) {
                    moduleState.courses = coursesResult.data;
                    console.log(`[Turmas] Loaded ${coursesResult.data.length} courses`);
                }
            }
            
            // Load instructors if not loaded
            if (moduleState.instructors.length === 0) {
                console.log('[Turmas] Loading instructors...');
                const instructorsResponse = await fetch('/api/users?role=instructor');
                const instructorsResult = await instructorsResponse.json();
                if (instructorsResult.success) {
                    moduleState.instructors = instructorsResult.data;
                    console.log(`[Turmas] Loaded ${instructorsResult.data.length} instructors`);
                }
            }
            
            // Load units if not loaded
            if (moduleState.units.length === 0) {
                console.log('[Turmas] Loading units...');
                const unitsResponse = await fetch('/api/units');
                const unitsResult = await unitsResponse.json();
                if (unitsResult.success) {
                    moduleState.units = unitsResult.data;
                    console.log(`[Turmas] Loaded ${unitsResult.data.length} units`);
                }
            }
            
            // Load training areas if not loaded
            if (moduleState.trainingAreas.length === 0) {
                console.log('[Turmas] Loading training areas...');
                const trainingAreasResponse = await fetch('/api/training-areas');
                const trainingAreasResult = await trainingAreasResponse.json();
                if (trainingAreasResult.success) {
                    moduleState.trainingAreas = trainingAreasResult.data;
                    console.log(`[Turmas] Loaded ${trainingAreasResult.data.length} training areas`);
                }
            }
            
            console.log('[Turmas] Form dependencies loaded successfully!');
            
        } catch (error) {
            console.error('[Turmas] Error loading form dependencies:', error);
            // Continue anyway - form will work with empty lists
        }
    }
    
    // Helper function to convert daysOfWeek numbers back to weekDays strings
    function convertDaysOfWeekToWeekDays(daysOfWeek) {
        if (!daysOfWeek || !Array.isArray(daysOfWeek)) return [];
        
        const dayMap = {
            0: 'SUNDAY', 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY',
            4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY'
        };
        
        return daysOfWeek.map(day => dayMap[day]).filter(Boolean);
    }
    
    // Check if weekDays is available in schedule or convert from daysOfWeek
    function getWeekDaysForRendering(turma) {
        console.log('[Turmas] 🔍 Getting weekDays for rendering...', turma.schedule);
        
        if (turma.schedule?.weekDays && Array.isArray(turma.schedule.weekDays)) {
            console.log('[Turmas] ✅ Using existing weekDays:', turma.schedule.weekDays);
            return turma.schedule.weekDays;
        }
        
        if (turma.schedule?.daysOfWeek && Array.isArray(turma.schedule.daysOfWeek)) {
            const converted = convertDaysOfWeekToWeekDays(turma.schedule.daysOfWeek);
            console.log('[Turmas] 🔄 Converted daysOfWeek to weekDays:', turma.schedule.daysOfWeek, '→', converted);
            return converted;
        }
        
        console.log('[Turmas] ⚠️ No valid schedule data found, returning empty array');
        return [];
    }

    // Render turma editor
    function renderTurmaEditor(isEdit) {
        console.log('[Turmas] Rendering turma editor - isEdit:', isEdit);
        
        const editorContainer = document.getElementById('turmas-editor-view');
        if (!editorContainer) {
            console.error('[Turmas] Editor container not found!');
            return;
        }
        
        const turma = moduleState.editingTurma || {};
        console.log('[Turmas] Editor data:', turma);
        
        // Get weekDays for checkbox rendering (convert from daysOfWeek if needed)
        const weekDaysForCheckboxes = getWeekDaysForRendering(turma);
        
        // Build set of associated course IDs for checkbox pre-selection
        const associatedCourseIds = new Set([
            ...((turma.courses || []).map(tc => tc.courseId)),
            ...(turma.courseId ? [turma.courseId] : [])
        ]);
        
        editorContainer.innerHTML = `
            <div class="editor-container">
                <!-- Editor Header -->
                <div class="editor-header">
                    <div class="header-content">
                        <div class="breadcrumb-nav">
                            <span class="breadcrumb-item" onclick="turmas.showListView()">👥 Turmas</span>
                            <span class="breadcrumb-separator">›</span>
                            <span class="breadcrumb-item active">${isEdit ? 'Editar' : 'Nova'} Turma</span>
                        </div>
                        <h2 class="editor-title">${isEdit ? '✏️ Editar' : '➕ Nova'} Turma</h2>
                        <p class="editor-subtitle">${isEdit ? 'Modifique os dados da turma' : 'Preencha os dados para criar uma nova turma'}</p>
                    </div>
                    <div class="header-actions">
                        <button type="button" class="btn btn-secondary" onclick="turmas.showListView()">
                            ← Voltar
                        </button>
                        <button type="button" class="btn btn-primary" id="save-turma-btn">
                            💾 ${isEdit ? 'Atualizar' : 'Criar'} Turma
                        </button>
                    </div>
                </div>

                <!-- Editor Form -->
                <form id="turma-form" class="editor-form">
                    <div class="form-grid">
                        <!-- Basic Information -->
                        <div class="form-section">
                            <h3 class="section-title">📋 Informações Básicas</h3>
                            <div class="form-group">
                                <label for="turma-name">Nome da Turma *</label>
                                <input type="text" id="turma-name" name="name" required
                                       value="${turma.name || ''}" 
                                       placeholder="Ex: Krav Maga Iniciante - Manhã">
                            </div>
                            <div class="form-group">
                                <label>Cursos da Turma *</label>
                                    <div class="courses-selection" id="courses-selection-container">
                                        ${moduleState.courses.map(course => `
                                            <div class="course-option">
                                                <label class="course-checkbox-label">
                                                    <input type="checkbox" 
                                                           name="courseIds" 
                                                           value="${course.id}"
                                                           class="course-checkbox"
                                                           ${associatedCourseIds.has(course.id) ? 'checked' : ''}>
                                                    <span class="course-info">
                                                        <strong>${course.name}</strong>
                                                        <small>${course.level || ''} • ${course.description || ''}</small>
                                                    </span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="turma-description">Descrição</label>
                                <textarea id="turma-description" name="description" rows="3"
                                          placeholder="Descrição opcional da turma">${turma.description || ''}</textarea>
                            </div>
                        </div>

                        <!-- Schedule Information -->
                        <div class="form-section">
                            <h3 class="section-title">📅 Cronograma</h3>
                            <div class="form-group">
                                <label for="turma-start-date">Data de Início *</label>
                                <input type="date" id="turma-start-date" name="startDate" required
                                       value="${turma.startDate ? turma.startDate.split('T')[0] : ''}">
                            </div>
                            <div class="form-group">
                                <label for="turma-end-date">Data de Término</label>
                                <input type="date" id="turma-end-date" name="endDate"
                                       value="${turma.endDate ? turma.endDate.split('T')[0] : ''}">
                            </div>
                            <div class="form-group">
                                <label>Horário e Dias da Semana</label>
                                <div class="schedule-builder">
                                    <div class="weekdays-selector">
                                        <label><input type="checkbox" name="weekDays" value="MONDAY" ${weekDaysForCheckboxes.includes('MONDAY') ? 'checked' : ''}> Segunda</label>
                                        <label><input type="checkbox" name="weekDays" value="TUESDAY" ${weekDaysForCheckboxes.includes('TUESDAY') ? 'checked' : ''}> Terça</label>
                                        <label><input type="checkbox" name="weekDays" value="WEDNESDAY" ${weekDaysForCheckboxes.includes('WEDNESDAY') ? 'checked' : ''}> Quarta</label>
                                        <label><input type="checkbox" name="weekDays" value="THURSDAY" ${weekDaysForCheckboxes.includes('THURSDAY') ? 'checked' : ''}> Quinta</label>
                                        <label><input type="checkbox" name="weekDays" value="FRIDAY" ${weekDaysForCheckboxes.includes('FRIDAY') ? 'checked' : ''}> Sexta</label>
                                        <label><input type="checkbox" name="weekDays" value="SATURDAY" ${weekDaysForCheckboxes.includes('SATURDAY') ? 'checked' : ''}> Sábado</label>
                                        <label><input type="checkbox" name="weekDays" value="SUNDAY" ${weekDaysForCheckboxes.includes('SUNDAY') ? 'checked' : ''}> Domingo</label>
                                    </div>
                                    <div class="time-inputs">
                                        <div class="input-group">
                                            <label>Horário:</label>
                                            <input type="time" id="turma-time" name="time" 
                                                   value="${turma.schedule?.time || '19:00'}">
                                        </div>
                                        <div class="input-group">
                                            <label>Duração (min):</label>
                                            <input type="number" id="turma-duration" name="duration" min="30" max="180" step="15"
                                                   value="${turma.schedule?.duration || 60}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Staff and Location -->
                        <div class="form-section">
                            <h3 class="section-title">👨‍🏫 Instrutor e Local</h3>
                            <div class="form-group">
                                <label for="turma-instructor">Instrutor *</label>
                                <select id="turma-instructor" name="instructorId" required>
                                    <option value="">Selecione um instrutor</option>
                                    ${moduleState.instructors.map(instructor => `
                                        <option value="${instructor.id}" ${instructor.id === turma.instructorId ? 'selected' : ''}>
                                            ${instructor.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="turma-unit">Unidade</label>
                                <select id="turma-unit" name="unitId">
                                    <option value="">Selecione uma unidade</option>
                                    ${moduleState.units.map(unit => `
                                        <option value="${unit.id}" ${unit.id === turma.unitId ? 'selected' : ''}>
                                            ${unit.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="turma-training-area">Área de Treino</label>
                                <select id="turma-training-area" name="trainingAreaId">
                                    <option value="">Selecione uma área de treino</option>
                                    <!-- Training areas will be loaded dynamically based on selected unit -->
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="turma-room">Sala/Local</label>
                                <input type="text" id="turma-room" name="room"
                                       value="${turma.room || ''}" 
                                       placeholder="Ex: Sala 1, Dojo Principal">
                            </div>
                        </div>

                        <!-- Settings -->
                        <div class="form-section">
                            <h3 class="section-title">⚙️ Configurações</h3>
                            <div class="form-group">
                                <label for="turma-max-students">Máximo de Alunos</label>
                                <input type="number" id="turma-max-students" name="maxStudents" min="1" max="50"
                                       value="${turma.maxStudents || 20}">
                            </div>
                            <div class="form-group">
                                <label for="turma-price">Preço (R$)</label>
                                <input type="number" id="turma-price" name="price" min="0" step="0.01"
                                       value="${turma.price || ''}" 
                                       placeholder="Ex: 149.90">
                            </div>
                            <div class="form-group">
                                <label for="turma-class-type">Tipo de Aula</label>
                                <select id="turma-class-type" name="classType">
                                    <option value="COLLECTIVE" ${turma.classType === 'COLLECTIVE' ? 'selected' : ''}>Coletiva</option>
                                    <option value="INDIVIDUAL" ${turma.classType === 'INDIVIDUAL' ? 'selected' : ''}>Individual</option>
                                    <option value="SEMI_PRIVATE" ${turma.classType === 'SEMI_PRIVATE' ? 'selected' : ''}>Semi-Privada</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="turma-status">Status</label>
                                <select id="turma-status" name="status">
                                    <option value="SCHEDULED" ${turma.status === 'SCHEDULED' ? 'selected' : ''}>Agendada</option>
                                    <option value="IN_PROGRESS" ${turma.status === 'IN_PROGRESS' ? 'selected' : ''}>Em Andamento</option>
                                    <option value="COMPLETED" ${turma.status === 'COMPLETED' ? 'selected' : ''}>Finalizada</option>
                                    <option value="CANCELLED" ${turma.status === 'CANCELLED' ? 'selected' : ''}>Cancelada</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
        
        // Setup form handlers
        setupEditorHandlers();
        
        console.log('[Turmas] ✅ Editor rendered successfully');
    }
    
    // Setup editor event handlers
    function setupEditorHandlers() {
        const form = document.getElementById('turma-form');
        const saveBtn = document.getElementById('save-turma-btn');
        
        console.log('[Turmas] Setting up editor handlers...');
        
        // Prevent multiple setups
        if (moduleState.handlersSetup) {
            console.log('[Turmas] Handlers already setup, skipping...');
            return;
        }
        
        if (saveBtn) {
            // Clear any existing handlers and clone to remove all event listeners
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            
            // Disable auto-submit attributes
            newSaveBtn.type = 'button'; // Ensure it's not a submit button
            newSaveBtn.removeAttribute('onclick');
            newSaveBtn.removeAttribute('onsubmit');
            
            // Add single click handler with enhanced protection
            newSaveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Enhanced protection - check saving state immediately
                if (moduleState.isSaving) {
                    console.log('[Turmas] Click ignored - save already in progress');
                    return false;
                }
                
                if (newSaveBtn.disabled) {
                    console.log('[Turmas] Click ignored - button disabled');
                    return false;
                }
                
                console.log('[Turmas] Save button clicked via event listener');
                handleSaveTurma();
                return false;
            }, { once: false }); // Don't use once: true to allow multiple saves after completion
            
            // Prevent double-click
            newSaveBtn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('[Turmas] Double-click prevented');
                return false;
            });
        }
        
        if (form) {
            // Disable form auto-submission completely
            form.onsubmit = null;
            form.removeAttribute('onsubmit');
            
            // Prevent form auto-submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('[Turmas] Form submission prevented');
                return false;
            });
        }
        
        // Setup unit change handler to update training areas
        const unitSelect = document.getElementById('turma-unit');
        const trainingAreaSelect = document.getElementById('turma-training-area');
        
        if (unitSelect && trainingAreaSelect) {
            unitSelect.addEventListener('change', (e) => {
                const selectedUnitId = e.target.value;
                console.log('[Turmas] Unit changed:', selectedUnitId);
                updateTrainingAreas(selectedUnitId, trainingAreaSelect);
            });
        }
        
        // Mark handlers as setup
        moduleState.handlersSetup = true;
        console.log('[Turmas] ✅ Editor handlers setup complete');
    }
    
    // Update training areas based on selected unit
    function updateTrainingAreas(selectedUnitId, trainingAreaSelect) {
        // Clear existing options except the first one
        trainingAreaSelect.innerHTML = '<option value="">Selecione uma área de treino</option>';
        
        if (!selectedUnitId) {
            console.log('[Turmas] No unit selected, clearing training areas');
            return;
        }
        
        // Filter training areas by unit
        const filteredAreas = moduleState.trainingAreas.filter(area => area.unitId === selectedUnitId);
        console.log(`[Turmas] Found ${filteredAreas.length} training areas for unit ${selectedUnitId}`);
        
        // Add filtered training areas to select
        filteredAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.id;
            option.textContent = area.name;
            trainingAreaSelect.appendChild(option);
        });
        
        if (filteredAreas.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhuma área de treino disponível';
            option.disabled = true;
            trainingAreaSelect.appendChild(option);
        }
    }
    
    // Handle save turma
    async function handleSaveTurma() {
        const timestamp = new Date().toISOString();
        console.log(`[Turmas] Save turma requested at ${timestamp}...`);
        console.log(`[Turmas] Current isSaving state: ${moduleState.isSaving}`);
        
        const form = document.getElementById('turma-form');
        const saveBtn = document.getElementById('save-turma-btn');
        
        if (!form) {
            console.error('[Turmas] Form not found');
            return;
        }
        
        // Enhanced protection with multiple checks
        if (moduleState.isSaving === true) {
            console.log('[Turmas] BLOCKED: Save already in progress, ignoring...');
            return;
        }
        
        if (saveBtn && saveBtn.disabled) {
            console.log('[Turmas] BLOCKED: Save button disabled, ignoring...');
            return;
        }
        
        // Additional check for rapid succession calls
        const now = Date.now();
        if (moduleState.lastSaveAttempt && (now - moduleState.lastSaveAttempt) < 1000) {
            console.log('[Turmas] BLOCKED: Too soon after last save attempt, ignoring...');
            return;
        }
        
        console.log('[Turmas] ✅ All checks passed, proceeding with save...');
        
        // Set saving state immediately
        moduleState.isSaving = true;
        moduleState.lastSaveAttempt = now;
        
        try {
            // Show loading state
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = '💾 Salvando...';
            }
            
            // Collect form data
            const formData = new FormData(form);
            const turmaData = {};
            
            console.log('[Turmas] 📝 Collecting form data...');
            
            // Basic fields
            for (const [key, value] of formData.entries()) {
                if (key !== 'weekDays' && value.trim()) {
                    turmaData[key] = value.trim();
                }
            }
            
            // Handle weekDays array with enhanced debugging
            const weekDaysFromForm = formData.getAll('weekDays');
            const time = formData.get('time');
            const duration = formData.get('duration');
            
            console.log('[Turmas] 📅 WeekDays from FormData.getAll:', weekDaysFromForm);
            console.log('[Turmas] ⏰ Time:', time);
            console.log('[Turmas] ⏱️ Duration:', duration);
            
            // Also check checkboxes directly from DOM as fallback
            const checkboxes = form.querySelectorAll('input[name="weekDays"]:checked');
            const weekDaysFromDOM = Array.from(checkboxes).map(cb => cb.value);
            
            console.log('[Turmas] 📋 WeekDays from DOM checkboxes:', weekDaysFromDOM);
            
            // Use DOM values if FormData is empty
            const weekDays = weekDaysFromForm.length > 0 ? weekDaysFromForm : weekDaysFromDOM;
            
            console.log('[Turmas] ✅ Final weekDays selected:', weekDays);

            // Handle multiple course selection
            const selectedCourses = formData.getAll('courseIds');
            console.log('[Turmas] 📚 Selected courses from FormData:', selectedCourses);
            
            // Also check checkboxes directly from DOM as fallback
            const courseCheckboxes = form.querySelectorAll('input[name="courseIds"]:checked');
            const coursesFromDOM = Array.from(courseCheckboxes).map(cb => cb.value);
            console.log('[Turmas] 📚 Selected courses from DOM:', coursesFromDOM);
            
            // Use DOM values if FormData is empty
            const courseIds = selectedCourses.length > 0 ? selectedCourses : coursesFromDOM;
            console.log('[Turmas] ✅ Final courseIds selected:', courseIds);

            turmaData.schedule = {
                weekDays: weekDays,
                time: time || '19:00',
                duration: parseInt(duration) || 60
            };

            // Add selected courses
            turmaData.courseIds = courseIds;

            console.log('[Turmas] 📊 Form data collected:', JSON.stringify(turmaData, null, 2));            // Fix field mappings to match API schema
            if (turmaData.classType) {
                turmaData.type = turmaData.classType; // Map classType to type
                delete turmaData.classType;
            }
            
            // Add organizationId - get from editing turma or default
            if (moduleState.editingTurma && moduleState.editingTurma.organizationId) {
                turmaData.organizationId = moduleState.editingTurma.organizationId;
            } else {
                // Fallback to first available organization (Academia Demo)
                turmaData.organizationId = 'a55ad715-2eb0-493c-996c-bb0f60bacec9';
            }
            
            // Ensure schedule has correct format for backend
            if (turmaData.schedule && turmaData.schedule.weekDays) {
                console.log('[Turmas] 🔄 Converting weekDays to daysOfWeek...');

                const normalizeDay = (val) => {
                    if (val === null || val === undefined) return null;
                    // Already a number 0-6
                    if (typeof val === 'number') return val;
                    // String handling
                    const raw = String(val).trim();
                    // Numeric string
                    if (/^\d+$/.test(raw)) {
                        const n = parseInt(raw, 10);
                        return isNaN(n) ? null : Math.max(0, Math.min(6, n));
                    }
                    const upper = raw
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
                      .toUpperCase();
                    // English map
                    const mapEn = {
                        SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
                        THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
                        SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
                    };
                    // Portuguese map
                    const mapPt = {
                        DOMINGO: 0, SEGUNDA: 1, TERCA: 2, QUARTA: 3,
                        QUINTA: 4, SEXTA: 5, SABADO: 6,
                        DOM: 0, SEG: 1, TER: 2, QUA: 3, QUI: 4, SEX: 5, SAB: 6
                    };
                    if (upper in mapEn) return mapEn[upper];
                    if (upper in mapPt) return mapPt[upper];
                    // Unknown -> default to Monday (1)
                    return 1;
                };

                turmaData.schedule.daysOfWeek = (turmaData.schedule.weekDays || [])
                  .map(normalizeDay)
                  .filter(v => v !== null && v !== undefined);

                console.log('[Turmas] ✅ Converted daysOfWeek:', turmaData.schedule.daysOfWeek);
                delete turmaData.schedule.weekDays; // Remove old format
            } else {
                console.log('[Turmas] ⚠️ No weekDays found in schedule, setting empty array');
                // Ensure we have a valid schedule structure
                if (!turmaData.schedule) {
                    turmaData.schedule = {};
                }
                turmaData.schedule.daysOfWeek = []; // Empty array is valid
            }
            
            console.log('[Turmas] 🔧 Fixed form data:', JSON.stringify(turmaData, null, 2));
            
            // Remove fields that are not part of the API schema
            const fieldsToRemove = ['time', 'duration', 'status'];
            fieldsToRemove.forEach(field => {
                if (turmaData[field]) {
                    console.log(`[Turmas] Removing field '${field}' from API payload`);
                    delete turmaData[field];
                }
            });
            
            // Convert dates to ISO format if they exist
            if (turmaData.startDate) {
                turmaData.startDate = new Date(turmaData.startDate).toISOString();
            }
            if (turmaData.endDate) {
                turmaData.endDate = new Date(turmaData.endDate).toISOString();
            }
            
            // Check required fields based on schema
            const requiredFields = ['name', 'courseIds', 'type', 'startDate', 'instructorId', 'organizationId', 'unitId'];
            const missingFields = requiredFields.filter(field => {
                if (field === 'courseIds') {
                    return !turmaData[field] || turmaData[field].length === 0;
                }
                return !turmaData[field];
            });
            
            if (missingFields.length > 0) {
                console.error('[Turmas] ❌ Missing required fields:', missingFields);
                throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
            }
            
            // Convert numeric fields
            if (turmaData.maxStudents) turmaData.maxStudents = parseInt(turmaData.maxStudents);
            if (turmaData.price) turmaData.price = parseFloat(turmaData.price);
            
            // Client-side uniqueness check for name within organization
            try {
                const orgIdForCheck = turmaData.organizationId || (moduleState.editingTurma && moduleState.editingTurma.organizationId);
                const currentId = moduleState.editingTurma && moduleState.editingTurma.id;
                if (orgIdForCheck && moduleState.turmas && Array.isArray(moduleState.turmas)) {
                    const duplicate = moduleState.turmas.find(t => (
                        t.organizationId === orgIdForCheck &&
                        t.name && turmaData.name && t.name.trim().toLowerCase() === turmaData.name.trim().toLowerCase() &&
                        t.id !== currentId
                    ));
                    if (duplicate) {
                        const msg = 'Já existe uma turma com esse nome nesta organização. Escolha um nome diferente.';
                        console.warn('[Turmas] Duplicate name detected, aborting save');
                        if (window.app && window.app.showNotification) {
                            window.app.showNotification(msg, 'warning');
                        } else {
                            alert(msg);
                        }
                        // Reset saving state and exit early
                        moduleState.isSaving = false;
                        if (saveBtn) {
                            saveBtn.disabled = false;
                            saveBtn.innerHTML = moduleState.editingTurma ? '💾 Atualizar Turma' : '💾 Criar Turma';
                        }
                        return;
                    }
                }
            } catch (e) {
                console.warn('[Turmas] Name uniqueness pre-check failed (non-blocking):', e);
            }

            // API call
            const isEdit = !!moduleState.editingTurma;
            const url = isEdit ? `/api/turmas/${moduleState.editingTurma.id}` : '/api/turmas';
            const method = isEdit ? 'PUT' : 'POST';
            
            console.log('[Turmas] 🚀 Making API call...');
            console.log('[Turmas] 📍 URL:', url);
            console.log('[Turmas] 🔄 Method:', method);
            console.log('[Turmas] 📦 Payload:', JSON.stringify(turmaData, null, 2));
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(turmaData)
            });
            
            console.log('[Turmas] 📡 Response status:', response.status);
            console.log('[Turmas] 📋 Response headers:', response.headers);
            
            const result = await response.json();
            console.log('[Turmas] 📄 Response body:', JSON.stringify(result, null, 2));
            
            if (result.success) {
                console.log('[Turmas] Turma saved successfully');
                
                // Show success message without navigating away
                if (window.app && window.app.showNotification) {
                    window.app.showNotification(
                        `✅ Turma ${isEdit ? 'atualizada' : 'criada'} com sucesso!`,
                        'success'
                    );
                } else {
                    // Fallback notification
                    alert(`✅ Turma ${isEdit ? 'atualizada' : 'criada'} com sucesso!`);
                }
                
                // Update local data without full refresh
                if (isEdit && moduleState.editingTurma) {
                    // Update the editing turma with new data
                    Object.assign(moduleState.editingTurma, result.data || turmaData);
                    
                    // Update the turmas list if we have it
                    const turmaIndex = moduleState.turmas.findIndex(t => t.id === moduleState.editingTurma.id);
                    if (turmaIndex !== -1) {
                        moduleState.turmas[turmaIndex] = { ...moduleState.editingTurma };
                    }
                }
                
                // Keep user in editor but reset saving state
                console.log('[Turmas] Save completed - staying in editor');
                
            } else {
                const serverMessage = result.error || result.message || 'Erro ao salvar turma';
                throw new Error(serverMessage);
            }
            
        } catch (error) {
            console.error('[Turmas] Error saving turma:', error);
            
            if (window.app && window.app.showNotification) {
                window.app.showNotification(
                    'Erro ao salvar turma: ' + error.message,
                    'error'
                );
            }
            
        } finally {
            // Always reset saving state
            moduleState.isSaving = false;
            
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = moduleState.editingTurma ? '💾 Atualizar Turma' : '💾 Criar Turma';
            }
            
            console.log('[Turmas] Save operation completed - isSaving reset to false');
        }
    }
    
    // View management functions
    function showListView() {
        moduleState.currentView = 'list';
        moduleState.editingTurma = null;
        moduleState.handlersSetup = false; // Reset handlers for next editor use
        
        const listView = document.getElementById('turmas-list-view');
        const editorView = document.getElementById('turmas-editor-view');
        
        if (listView) {
            listView.style.display = 'block';
            listView.classList.add('active');
        }
        if (editorView) {
            editorView.style.display = 'none';
            editorView.classList.remove('active');
        }
    }
    
    function showEditorView() {
        console.log('[Turmas] Switching to editor view...');
        
        // Reset handlers setup flag to allow new setup
        moduleState.handlersSetup = false;
        
        const listView = document.getElementById('turmas-list-view');
        const editorView = document.getElementById('turmas-editor-view');
        
        console.log('[Turmas] List view element:', !!listView);
        console.log('[Turmas] Editor view element:', !!editorView);
        
        if (listView) {
            listView.style.display = 'none';
            listView.classList.remove('active');
        }
        if (editorView) {
            editorView.style.display = 'block';
            editorView.classList.add('active');
        }
        
        console.log('[Turmas] Editor view should now be visible');
    }
    
    // State management functions
    function showLoadingState() {
        const loadingEl = document.getElementById('loading-state');
        const emptyEl = document.getElementById('empty-state');
        const errorEl = document.getElementById('error-state');
        const gridEl = document.getElementById('turmas-grid');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        if (gridEl) gridEl.style.display = 'none';
    }
    
    function hideLoadingState() {
        const loadingEl = document.getElementById('loading-state');
        if (loadingEl) loadingEl.style.display = 'none';
    }
    
    function showEmptyState() {
        const emptyEl = document.getElementById('empty-state');
        const errorEl = document.getElementById('error-state');
        const gridEl = document.getElementById('turmas-grid');
        
        if (emptyEl) emptyEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (gridEl) gridEl.style.display = 'none';
    }
    
    function showErrorState(message) {
        const emptyEl = document.getElementById('empty-state');
        const errorEl = document.getElementById('error-state');
        const gridEl = document.getElementById('turmas-grid');
        const messageEl = document.getElementById('error-message');
        
        if (errorEl) errorEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        if (gridEl) gridEl.style.display = 'none';
        if (messageEl) messageEl.textContent = message;
    }
    
    function showDataGrid() {
        const emptyEl = document.getElementById('empty-state');
        const errorEl = document.getElementById('error-state');
        const gridEl = document.getElementById('turmas-grid');
        
        if (gridEl) gridEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
    }
    
    // Utility functions
    function getStatusText(status) {
        const statusMap = {
            'SCHEDULED': 'Agendada',
            'IN_PROGRESS': 'Em Andamento',
            'COMPLETED': 'Finalizada',
            'CANCELLED': 'Cancelada'
        };
        return statusMap[status] || status;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    // Global functions for buttons
    window.viewTurma = function(turmaId) {
        console.log('[Turmas] Viewing turma:', turmaId);
        // TODO: Implement view turma details
        alert(`Visualizar turma ${turmaId} - Funcionalidade em desenvolvimento`);
    };
    
    window.deleteTurma = async function(turmaId) {
        console.log('[Turmas] Deleting turma:', turmaId);
        
        // Confirm deletion
        const confirmed = confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.');
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/turmas/${turmaId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('[Turmas] Turma deleted successfully');
                
                if (window.app && window.app.showNotification) {
                    window.app.showNotification('Turma excluída com sucesso!', 'success');
                }
                
                // Refresh list
                loadTurmasData();
                
            } else {
                throw new Error(result.message || 'Erro ao excluir turma');
            }
            
        } catch (error) {
            console.error('[Turmas] Error deleting turma:', error);
            
            if (window.app && window.app.showNotification) {
                window.app.showNotification('Erro ao excluir turma: ' + error.message, 'error');
            }
        }
    };
    
    // Expose public API
    window.turmas = TurmasModule;
    window.initializeTurmasModule = initializeTurmasModule;
    
    // Auto-initialize if called directly
    if (typeof module === 'undefined') {
        console.log('👥 Turmas Module Consolidated - Loaded');
        // Auto-initialization will be called by spa-router
    }

})();

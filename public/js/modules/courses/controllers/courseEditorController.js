/**
 * Course Editor Controller
 * AGENTS.md v2.0 compliant
 * Handles course creation and editing with AI integration
 * Last Updated: 2025-10-03 06:45
 */

// Module state
let moduleAPI = null;
let currentCourseId = null;
let isInitialized = false;

/**
 * Initialize Course Editor Module
 * Called by spa-router.js and modular-system.js
 */
window.initializeCourseEditorModule = async function() {
    if (isInitialized) {
        console.log('📝 Course Editor already initialized, skipping...');
        return;
    }

    console.log('📝 Initializing Course Editor Module...');

    try {
        // Wait for API client to be available
        await waitForAPIClient();
        moduleAPI = window.createModuleAPI('CourseEditor');

        // Get course ID from URL hash or window.currentCourseId
        const hashParts = window.location.hash.split('/');
        currentCourseId = hashParts[1] || window.currentCourseId || null;

        // Setup event listeners
        setupEventListeners();

        // Setup tab navigation
        setupTabs();

        // Load martial arts
        await loadMartialArts();

        // Load course data if editing
        if (currentCourseId) {
            await loadCourse(currentCourseId);
        } else {
            showNewCourseState();
        }

        isInitialized = true;
        console.log('✅ Course Editor initialized successfully');

        // Dispatch event
        window.app?.dispatchEvent?.('module:loaded', { name: 'course-editor' });

    } catch (error) {
        console.error('❌ Error initializing Course Editor:', error);
        window.app?.handleError?.(error, { module: 'course-editor', context: 'initialization' });
    }
};

/**
 * Wait for API client to be available
 */
async function waitForAPIClient() {
    let attempts = 0;
    const maxAttempts = 50;

    while (!window.createModuleAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.createModuleAPI) {
        throw new Error('API client not available after waiting');
    }
}

/**
 * Setup event listeners for buttons and form
 */
function setupEventListeners() {
    console.log('🔗 Setting up event listeners...');

    // Back button
    const goBackBtn = document.getElementById('goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', goBack);
    }

    // Save button
    const saveCourseBtn = document.getElementById('saveCourseBtn');
    if (saveCourseBtn) {
        saveCourseBtn.addEventListener('click', saveCourse);
    }

    // Generate schedule button
    const generateScheduleBtn = document.getElementById('generateScheduleBtn');
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', generateSchedule);
    }

    // Import schedule button
    const importScheduleBtn = document.getElementById('importScheduleBtn');
    if (importScheduleBtn) {
        importScheduleBtn.addEventListener('click', importSchedule);
    }

    // Export schedule button
    const exportScheduleBtn = document.getElementById('exportScheduleBtn');
    if (exportScheduleBtn) {
        exportScheduleBtn.addEventListener('click', exportSchedule);
    }

    // Generate RAG plans button
    const generateRAGPlansBtn = document.getElementById('generateRAGPlansBtn');
    if (generateRAGPlansBtn) {
        generateRAGPlansBtn.addEventListener('click', generateRAGPlans);
    }

    // Preview RAG button
    const previewRAGBtn = document.getElementById('previewRAGBtn');
    if (previewRAGBtn) {
        previewRAGBtn.addEventListener('click', previewRAG);
    }

    // Add objective buttons
    setupDynamicListeners();

    console.log('✅ Event listeners set up');
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            switchTab(targetTab);
        });
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    console.log(`📑 Switching to tab: ${tabName}`);

    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });

    // Activate selected tab
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // Show selected content
    let contentId = '';
    if (tabName === 'info') contentId = 'tabContentInfo';
    else if (tabName === 'schedule') contentId = 'tabContentSchedule';
    else if (tabName === 'ai-generation') contentId = 'tabContentAI';

    const content = document.getElementById(contentId);
    if (content) {
        content.style.display = 'block';
        content.classList.add('active');
    }
}

/**
 * Load available martial arts
 */
async function loadMartialArts() {
    try {
        const select = document.getElementById('courseMartialArt');
        if (!select) return;

        try {
            // Try to fetch from API
            const response = await moduleAPI.api.request('GET', '/api/martial-arts');
            if (response.success && response.data && response.data.length > 0) {
                select.innerHTML = '<option value="">Selecione a modalidade</option>';
                response.data.forEach(art => {
                    const option = document.createElement('option');
                    option.value = art.id;
                    option.textContent = art.name;
                    select.appendChild(option);
                });
            } else {
                 // If no martial arts found, maybe add a default or leave it to backend to create
                 console.log('No martial arts found via API');
            }
        } catch (e) {
            console.warn('Could not load martial arts from API', e);
        }
    } catch (error) {
        console.error('Error loading martial arts:', error);
    }
}

/**
 * Load course data for editing
 */
async function loadCourse(courseId) {
    console.log(`📥 Loading course: ${courseId}`);

    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'flex';

    try {
        const response = await moduleAPI.api.request('GET', `/api/courses/${courseId}`);

        if (response.success && response.data) {
            populateCourseForm(response.data);
            updateTitle('Editar Curso');
            
            // Load lesson plans and techniques for the course
            await loadLessonPlans(courseId);
            await loadCourseTechniques(courseId);
        } else {
            throw new Error(response.message || 'Failed to load course');
        }
    } catch (error) {
        console.error('❌ Error loading course:', error);
        window.app?.handleError?.(error, { module: 'course-editor', context: 'loadCourse' });
    } finally {
        if (loadingState) loadingState.style.display = 'none';
    }
}

/**
 * Populate form with course data
 */
function populateCourseForm(course) {
    console.log('📝 Populating form with course data:', course);

    // Basic info - ALL FIELDS
    if (document.getElementById('courseName')) {
        document.getElementById('courseName').value = course.name || '';
    }
    
    if (document.getElementById('courseLevel')) {
        document.getElementById('courseLevel').value = course.level || '';
    }
    
    if (document.getElementById('courseCategory')) {
        document.getElementById('courseCategory').value = course.category || 'ADULT';
    }

    if (document.getElementById('courseMartialArt')) {
        document.getElementById('courseMartialArt').value = course.martialArtId || '';
    }
    
    if (document.getElementById('courseDuration')) {
        // Extract number from duration string (e.g., "18 semanas" -> 18)
        const durationValue = course.duration ? parseInt(String(course.duration).match(/\d+/)?.[0] || '0') : '';
        document.getElementById('courseDuration').value = durationValue;
    }
    
    if (document.getElementById('courseClassesPerWeek')) {
        document.getElementById('courseClassesPerWeek').value = course.classesPerWeek || 2;
    }
    
    if (document.getElementById('courseTotalClasses')) {
        document.getElementById('courseTotalClasses').value = course.totalClasses || '';
    }
    
    if (document.getElementById('courseMinAge')) {
        document.getElementById('courseMinAge').value = course.minAge || 16;
    }
    
    if (document.getElementById('courseMaxAge')) {
        document.getElementById('courseMaxAge').value = course.maxAge || '';
    }
    
    if (document.getElementById('courseOrderIndex')) {
        document.getElementById('courseOrderIndex').value = course.orderIndex || 1;
    }
    
    if (document.getElementById('courseSequence')) {
        document.getElementById('courseSequence').value = course.sequence || 1;
    }
    
    if (document.getElementById('courseImageUrl')) {
        document.getElementById('courseImageUrl').value = course.imageUrl || '';
    }
    
    if (document.getElementById('courseIsBaseCourse')) {
        document.getElementById('courseIsBaseCourse').checked = course.isBaseCourse || false;
    }
    
    if (document.getElementById('courseIsActive')) {
        document.getElementById('courseIsActive').checked = course.isActive !== false;
    }
    
    if (document.getElementById('courseDescription')) {
        document.getElementById('courseDescription').value = course.description || '';
    }

    // Populate objectives
    if (course.objectives && course.objectives.length > 0) {
        const generalObjectivesContainer = document.getElementById('generalObjectives');
        if (generalObjectivesContainer) {
            generalObjectivesContainer.innerHTML = '';
            course.objectives.forEach(obj => {
                const div = document.createElement('div');
                div.className = 'objective-item';
                div.innerHTML = `
                    <textarea placeholder="Descreva um objetivo geral do curso...">${obj}</textarea>
                    <button type="button" class="remove-btn" data-action="removeObjective" data-args='["this","general"]'>🗑️</button>
                `;
                generalObjectivesContainer.appendChild(div);
            });
        }
    }
    
    if (course.prerequisites && course.prerequisites.length > 0) {
        const specificObjectivesContainer = document.getElementById('specificObjectives');
        if (specificObjectivesContainer) {
            specificObjectivesContainer.innerHTML = '';
            course.prerequisites.forEach(obj => {
                const div = document.createElement('div');
                div.className = 'objective-item';
                div.innerHTML = `
                    <textarea placeholder="Descreva um pré-requisito...">${obj}</textarea>
                    <button type="button" class="remove-btn" data-action="removeObjective" data-args='["this","specific"]'>🗑️</button>
                `;
                specificObjectivesContainer.appendChild(div);
            });
        }
    }
    
    console.log('✅ Form populated successfully');
}

/**
 * Load lesson plans for the course
 */
async function loadLessonPlans(courseId) {
    console.log(`📅 Loading lesson plans for course: ${courseId}`);
    
    try {
        // Load lesson plans summary
        const response = await moduleAPI.api.request('GET', `/api/courses/${courseId}/lesson-plans`);
        
        if (!response.success || !response.data) {
            console.warn('⚠️ No lesson plans found or error in response');
            showEmptyScheduleState();
            return;
        }
        
        // Load techniques associated with lessons
        const techniquesResponse = await moduleAPI.api.request('GET', `/api/courses/${courseId}/lesson-techniques`);
        
        // Merge lesson plans with their techniques
        const lessonPlansWithTechniques = response.data.map(plan => {
            const lessonWithTechs = techniquesResponse.success && techniquesResponse.data 
                ? techniquesResponse.data.find(lt => lt.lessonNumber === plan.lesson)
                : null;
            
            return {
                ...plan,
                techniques: lessonWithTechs?.techniques || []
            };
        });
        
        console.log(`✅ Loaded ${lessonPlansWithTechniques.length} lesson plans with techniques`);
        populateScheduleGrid(lessonPlansWithTechniques);
        updateScheduleStats(lessonPlansWithTechniques);
        
    } catch (error) {
        console.error('❌ Error loading lesson plans:', error);
        showEmptyScheduleState();
    }
}

/**
 * Populate schedule grid with lesson plans
 */
function populateScheduleGrid(lessonPlans) {
    const scheduleGrid = document.getElementById('scheduleGrid');
    
    if (!scheduleGrid) {
        console.error('❌ scheduleGrid element not found');
        return;
    }
    
    if (!lessonPlans || lessonPlans.length === 0) {
        showEmptyScheduleState();
        return;
    }
    
    // Group by week
    const byWeek = {};
    lessonPlans.forEach(lesson => {
        if (!byWeek[lesson.week]) {
            byWeek[lesson.week] = [];
        }
        byWeek[lesson.week].push(lesson);
    });
    
    // Render week by week with enhanced visual design
    let html = '<div class="schedule-weeks-container">';
    
    Object.keys(byWeek)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(week => {
            html += `
                <div class="week-card data-card-premium">
                    <div class="week-header module-header-premium">
                        <div class="week-header-left">
                            <h3>📅 Semana ${week}</h3>
                            <span class="week-lessons-count stat-card-enhanced">${byWeek[week].length} aula(s)</span>
                        </div>
                    </div>
                    <div class="lessons-list">
                        ${byWeek[week]
                            .sort((a, b) => a.lesson - b.lesson)
                            .map(lesson => `
                                <div class="lesson-item-card clickable-lesson" 
                                     data-lesson-id="${lesson.id}"
                                     data-lesson-number="${lesson.lesson}"
                                     title="Clique para editar este plano de aula">
                                    <div class="lesson-card-header">
                                        <div class="lesson-header-info">
                                            <span class="lesson-number-badge">Aula ${lesson.lesson}</span>
                                            <h4 class="lesson-title">${lesson.name || `Semana ${week} - Aula ${lesson.lesson}`}</h4>
                                        </div>
                                        <div class="lesson-actions-header">
                                            <button class="btn-edit-lesson btn-primary-sm" 
                                                    data-lesson-id="${lesson.id}" 
                                                    data-lesson-number="${lesson.lesson}"
                                                    title="Editar esta aula no módulo de Planos de Aula"
                                                    onclick="event.stopPropagation();">
                                                ✏️ Editar Aula
                                            </button>
                                        </div>
                                    </div>
                                    
                                    ${lesson.techniques && lesson.techniques.length > 0 ? `
                                    <div class="lesson-techniques-section">
                                        <div class="techniques-header">
                                            <span class="techniques-icon">🥋</span>
                                            <h5>Técnicas Base (${lesson.techniques.length})</h5>
                                        </div>
                                        <div class="techniques-grid">
                                            ${lesson.techniques.map((tech, idx) => `
                                                <div class="technique-card clickable-technique" 
                                                     data-technique-id="${tech.id}"
                                                     data-technique-name="${tech.title || tech.name}"
                                                     title="Clique para ver detalhes desta técnica">
                                                    <div class="technique-order">#${idx + 1}</div>
                                                    <div class="technique-info">
                                                        <div class="technique-name">${tech.title || tech.name}</div>
                                                        <div class="technique-meta">
                                                            <span class="technique-category badge-${(tech.category || '').toLowerCase()}">${tech.category || 'N/A'}</span>
                                                            ${tech.difficulty ? `<span class="technique-difficulty">Nível ${tech.difficulty}</span>` : ''}
                                                            ${tech.allocationMinutes ? `<span class="technique-duration">⏱️ ${tech.allocationMinutes}min</span>` : ''}
                                                        </div>
                                                    </div>
                                                    <div class="technique-click-hint">👁️ Ver detalhes</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ` : `
                                    <div class="lesson-empty-state">
                                        <p class="empty-state-icon">📋</p>
                                        <p class="empty-state-text">Nenhuma técnica vinculada ainda</p>
                                    </div>
                                    `}
                                    
                                    <div class="lesson-card-footer">
                                        <button class="btn-add-techniques" 
                                                data-lesson-id="${lesson.id}" 
                                                data-lesson-number="${lesson.lesson}" 
                                                data-lesson-name="${lesson.name || `Aula ${lesson.lesson}`}">
                                            ➕ Adicionar/Gerenciar Técnicas
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `;
        });
    
    html += '</div>';
    
    scheduleGrid.innerHTML = html;
    console.log('✅ Schedule grid populated successfully');
    
    // Add event listeners for "Add Techniques" buttons
    setupTechniqueButtons();
    
    // Add event listeners for "Edit Lesson" buttons
    setupEditLessonButtons();
    
    // Add event listeners for clickable lesson cards
    setupLessonCardClicks();
    
    // Add event listeners for clickable technique cards
    setupTechniqueCardClicks();
}

/**
 * Setup event listeners for technique buttons
 */
function setupTechniqueButtons() {
    const addTechniquesButtons = document.querySelectorAll('.btn-add-techniques');
    addTechniquesButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const lessonId = button.dataset.lessonId;
            const lessonNumber = button.dataset.lessonNumber;
            const lessonName = button.dataset.lessonName;
            openTechniquesModal(lessonId, lessonNumber, lessonName);
        });
    });
}

/**
 * Setup event listeners for edit lesson buttons
 * Navigates to lesson-plans module for AI-powered editing
 */
function setupEditLessonButtons() {
    const editLessonButtons = document.querySelectorAll('.btn-edit-lesson');
    editLessonButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const lessonId = button.dataset.lessonId;
            const lessonNumber = button.dataset.lessonNumber;
            navigateToLessonEditor(lessonId, lessonNumber);
        });
    });
}

/**
 * Setup event listeners for clickable lesson cards
 */
function setupLessonCardClicks() {
    const lessonCards = document.querySelectorAll('.clickable-lesson');
    lessonCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons inside the card
            if (e.target.closest('.btn-add-techniques') || e.target.closest('.btn-edit-lesson')) {
                return;
            }
            
            const lessonId = card.dataset.lessonId;
            const lessonNumber = card.dataset.lessonNumber;
            navigateToLessonEditor(lessonId, lessonNumber);
        });
    });
}

/**
 * Setup event listeners for clickable technique cards
 */
function setupTechniqueCardClicks() {
    const techniqueCards = document.querySelectorAll('.clickable-technique');
    techniqueCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const techniqueId = card.dataset.techniqueId;
            const techniqueName = card.dataset.techniqueName;
            navigateToTechnique(techniqueId, techniqueName);
        });
    });
}

/**
 * Navigate to technique detail in techniques module
 */
function navigateToTechnique(techniqueId, techniqueName) {
    console.log(`🥋 Navigating to technique: ${techniqueId} (${techniqueName})`);
    
    // Store current course context for back navigation
    sessionStorage.setItem('returnToCourse', currentCourseId);
    sessionStorage.setItem('returnTab', 'schedule');
    
    // Navigate to techniques module with technique ID
    window.location.hash = `#techniques?id=${techniqueId}`;
}

/**
 * Navigate to lesson plan editor module
 * Uses SPA routing to maintain state
 */
function navigateToLessonEditor(lessonId, lessonNumber) {
    console.log(`📝 Navigating to lesson editor: ${lessonId} (Lesson ${lessonNumber})`);
    
    // Store current course context for back navigation
    sessionStorage.setItem('returnToCourse', currentCourseId);
    sessionStorage.setItem('returnTab', 'schedule');
    
    // Navigate to lesson-plans module with lesson ID
    window.location.hash = `#lesson-plans/${lessonId}`;
    
    // Show success message
    showSuccessMessage(`Abrindo editor da Aula ${lessonNumber}...`);
}

/**
 * Open modal to select techniques for a lesson
 */
async function openTechniquesModal(lessonId, lessonNumber, lessonName) {
    console.log(`🥋 Opening techniques modal for lesson ${lessonNumber}: ${lessonName}`);
    
    try {
        // Load all available techniques
        const response = await moduleAPI.api.request('GET', '/api/techniques');
        
        if (!response.success || !response.data) {
            showErrorMessage('Erro ao carregar técnicas disponíveis');
            return;
        }
        
        const techniques = response.data;
        
        // Load already linked techniques for this lesson
        const linkedResponse = await moduleAPI.api.request('GET', `/api/lesson-plans/${lessonId}/techniques`);
        const linkedTechniques = linkedResponse.success ? linkedResponse.data : [];
        const linkedIds = new Set(linkedTechniques.map(t => t.id));
        
        // Create selector dialog HTML
        const modalHTML = `
            <div class="selector-overlay" id="techniquesSelector">
                <div class="selector-container technique-selector-dialog">
                    <div class="selector-header">
                        <h2>🥋 Adicionar Técnicas</h2>
                        <p class="selector-subtitle">${lessonName} - Aula ${lessonNumber}</p>
                        <button class="selector-close" onclick="closeTechniquesModal()">✕</button>
                    </div>
                    
                    <div class="selector-body">
                        <div class="technique-search-box">
                            <input type="text" id="techniqueSearchInput" placeholder="🔍 Buscar técnicas..." />
                        </div>
                        
                        <div class="technique-filters">
                            <select id="categoryFilter">
                                <option value="">Todas as categorias</option>
                                <option value="ATTACK">Ataque</option>
                                <option value="DEFENSE">Defesa</option>
                                <option value="FALL">Quedas</option>
                                <option value="TACTICS">Táticas</option>
                            </select>
                            
                            <select id="difficultyFilter">
                                <option value="">Todas as dificuldades</option>
                                <option value="1">Nível 1 - Iniciante</option>
                                <option value="2">Nível 2</option>
                                <option value="3">Nível 3</option>
                                <option value="4">Nível 4</option>
                                <option value="5">Nível 5 - Avançado</option>
                            </select>
                        </div>
                        
                        <div class="selected-techniques-count">
                            <span id="selectedCount">0 técnicas selecionadas</span>
                        </div>
                        
                        <div class="techniques-grid" id="techniquesGrid">
                            ${techniques.map(tech => `
                                <div class="technique-card ${linkedIds.has(tech.id) ? 'already-linked' : ''}" data-technique-id="${tech.id}" data-category="${tech.category || ''}" data-difficulty="${tech.difficulty || 1}">
                                    <input type="checkbox" 
                                           class="technique-checkbox" 
                                           value="${tech.id}"
                                           ${linkedIds.has(tech.id) ? 'checked disabled' : ''} />
                                    <div class="technique-info">
                                        <h4 class="technique-name">${tech.name}</h4>
                                        <div class="technique-badges">
                                            ${tech.category ? `<span class="badge badge-${tech.category.toLowerCase()}">${tech.category}</span>` : ''}
                                            ${tech.difficulty ? `<span class="badge badge-difficulty">Nível ${tech.difficulty}</span>` : ''}
                                        </div>
                                        ${tech.description ? `<p class="technique-description">${tech.description}</p>` : ''}
                                        ${linkedIds.has(tech.id) ? '<span class="already-linked-label">✓ Já vinculada</span>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="selector-footer">
                        <button class="btn btn-secondary" onclick="closeTechniquesModal()">Cancelar</button>
                        <button class="btn btn-primary" onclick="saveLessonTechniques('${lessonId}')">
                            Adicionar Técnicas Selecionadas
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insert modal into DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup modal interactions
        setupTechniqueModalInteractions();
        
    } catch (error) {
        console.error('Error opening techniques modal:', error);
        showErrorMessage('Erro ao abrir modal de técnicas');
    }
}

/**
 * Setup interactions for the techniques modal
 */
function setupTechniqueModalInteractions() {
    // Search functionality
    const searchInput = document.getElementById('techniqueSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterTechniques);
    }
    
    // Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', filterTechniques);
    if (difficultyFilter) difficultyFilter.addEventListener('change', filterTechniques);
    
    // Checkbox selection
    const checkboxes = document.querySelectorAll('.technique-checkbox:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedCount);
    });
    
    // Initial count
    updateSelectedCount();
}

/**
 * Filter techniques based on search and filters
 */
function filterTechniques() {
    const searchTerm = document.getElementById('techniqueSearchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const difficulty = document.getElementById('difficultyFilter')?.value || '';
    
    const cards = document.querySelectorAll('.technique-card');
    
    cards.forEach(card => {
        const techniqueName = card.querySelector('.technique-name')?.textContent.toLowerCase() || '';
        const cardCategory = card.dataset.category || '';
        const cardDifficulty = card.dataset.difficulty || '';
        
        const matchesSearch = techniqueName.includes(searchTerm);
        const matchesCategory = !category || cardCategory === category;
        const matchesDifficulty = !difficulty || cardDifficulty === difficulty;
        
        if (matchesSearch && matchesCategory && matchesDifficulty) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Update selected techniques count
 */
function updateSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.technique-checkbox:checked:not([disabled])');
    const count = checkedBoxes.length;
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = `${count} técnica${count !== 1 ? 's' : ''} selecionada${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Save selected techniques to lesson plan
 */
async function saveLessonTechniques(lessonId) {
    console.log(`💾 Saving techniques for lesson ${lessonId}`);
    
    try {
        const checkboxes = document.querySelectorAll('.technique-checkbox:checked:not([disabled])');
        const techniqueIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (techniqueIds.length === 0) {
            showInfoMessage('Selecione pelo menos uma técnica para adicionar');
            return;
        }
        
        // Send to backend
        const response = await moduleAPI.api.request('POST', `/api/lesson-plans/${lessonId}/techniques`, {
            body: JSON.stringify({
                techniqueIds,
                replace: false
            })
        });
        
        if (!response.success) {
            showErrorMessage(response.error || 'Erro ao adicionar técnicas');
            return;
        }
        
        showSuccessMessage(`${techniqueIds.length} técnica(s) adicionada(s) com sucesso!`);
        
        // Close modal
        closeTechniquesModal();
        
        // Reload lesson plans to show new techniques
        await loadLessonPlans(currentCourseId);
        
    } catch (error) {
        console.error('Error saving lesson techniques:', error);
        showErrorMessage('Erro ao salvar técnicas');
    }
}

/**
 * Close techniques modal
 */
function closeTechniquesModal() {
    const modal = document.getElementById('techniquesSelector');
    if (modal) {
        modal.remove();
    }
}

/**
 * Update schedule statistics
 */
function updateScheduleStats(lessonPlans) {
    const totalLessonsCount = document.getElementById('totalLessonsCount');
    const assignedTechniquesCount = document.getElementById('assignedTechniquesCount');
    
    if (totalLessonsCount) {
        totalLessonsCount.textContent = lessonPlans.length.toString();
    }
    
    // Count total items across all lessons
    const totalItems = lessonPlans.reduce((sum, lesson) => sum + (lesson.itemsCount || 0), 0);
    if (assignedTechniquesCount) {
        assignedTechniquesCount.textContent = totalItems.toString();
    }
    
    console.log(`📊 Stats updated: ${lessonPlans.length} lessons, ${totalItems} items`);
}

/**
 * Show empty schedule state
 */
function showEmptyScheduleState() {
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (scheduleGrid) {
        scheduleGrid.innerHTML = `
            <div class="schedule-empty-state">
                <p>📋 Nenhum cronograma carregado</p>
                <p class="empty-state-hint">Importe um curso com cronograma ou gere um novo</p>
            </div>
        `;
    }
    
    // Reset stats
    const totalLessonsCount = document.getElementById('totalLessonsCount');
    const assignedTechniquesCount = document.getElementById('assignedTechniquesCount');
    if (totalLessonsCount) totalLessonsCount.textContent = '0';
    if (assignedTechniquesCount) assignedTechniquesCount.textContent = '0';
}

/**
 * Load course techniques
 */
async function loadCourseTechniques(courseId) {
    console.log(`🥋 Loading techniques for course: ${courseId}`);
    
    try {
        const response = await moduleAPI.api.request('GET', `/api/courses/${courseId}/techniques`);
        
        if (response.success && response.data) {
            console.log(`✅ Loaded ${response.data.length} techniques`);
            populateTechniquesList(response.data);
            updateTechniquesStats(response.data);
        } else {
            console.warn('⚠️ No techniques found or error in response');
            showEmptyTechniquesState();
        }
    } catch (error) {
        console.error('❌ Error loading techniques:', error);
        showEmptyTechniquesState();
    }
}

/**
 * Populate techniques list
 */
function populateTechniquesList(techniques) {
    const techniquesList = document.getElementById('techniquesList');
    
    if (!techniquesList) {
        console.error('❌ techniquesList element not found');
        return;
    }
    
    if (!techniques || techniques.length === 0) {
        showEmptyTechniquesState();
        return;
    }
    
    let html = '';
    
    techniques.forEach(tech => {
        const techniqueId = tech.techniqueId || tech.id;
        const techniqueName = tech.technique?.name || tech.name || 'Técnica sem nome';
        const techniqueCategory = tech.technique?.category || tech.category || 'GERAL';
        const lessonPlans = tech.lessonPlans || [];
        
        // Build lesson info string
        let lessonInfo = '';
        if (lessonPlans.length > 0) {
            const lessonNumbers = lessonPlans.map(lp => `S${lp.weekNumber}A${lp.lessonNumber}`).join(', ');
            lessonInfo = `<span class="technique-lessons" title="Aparece nas aulas: ${lessonNumbers}">📅 ${lessonPlans.length} aula(s)</span>`;
        }
        
        html += `
            <div class="technique-item" data-technique-id="${techniqueId}">
                <div class="technique-info">
                    <div class="technique-icon">🥋</div>
                    <div class="technique-details">
                        <div class="technique-name">
                            <a href="#" onclick="window.navigateToTechnique('${techniqueId}'); return false;">
                                ${techniqueName}
                            </a>
                        </div>
                        <div class="technique-meta">
                            <span class="technique-badge">${techniqueCategory}</span>
                            ${lessonInfo}
                        </div>
                    </div>
                </div>
                <div class="technique-actions">
                    <button type="button" onclick="window.removeTechnique('${techniqueId}')" title="Remover técnica">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
    
    techniquesList.innerHTML = html;
    console.log('✅ Techniques list populated');
}

/**
 * Update techniques statistics
 */
function updateTechniquesStats(techniques, totalAssignments = 0) {
    const totalTechniquesCount = document.getElementById('totalTechniquesCount');
    
    if (totalTechniquesCount) {
        totalTechniquesCount.textContent = techniques.length.toString();
    }
    
    // Count techniques assigned in lessons
    const assignedInLessonsCount = document.getElementById('assignedInLessonsCount');
    if (assignedInLessonsCount) {
        // Show total assignments if provided, otherwise count from lessonPlans array
        let count = totalAssignments;
        if (!count && techniques.length > 0) {
            count = techniques.reduce((sum, tech) => sum + (tech.lessonPlans?.length || 0), 0);
        }
        assignedInLessonsCount.textContent = count;
    }
    
    console.log(`📊 Techniques stats updated: ${techniques.length} total`);
}

/**
 * Show empty techniques state
 */
function showEmptyTechniquesState() {
    const techniquesList = document.getElementById('techniquesList');
    if (techniquesList) {
        techniquesList.innerHTML = `
            <div class="techniques-empty-state">
                <p>🥋 Nenhuma técnica associada</p>
                <p class="empty-hint">Clique em "Adicionar Técnica" para começar</p>
            </div>
        `;
    }
    
    // Reset stats
    const totalTechniquesCount = document.getElementById('totalTechniquesCount');
    const assignedInLessonsCount = document.getElementById('assignedInLessonsCount');
    if (totalTechniquesCount) totalTechniquesCount.textContent = '0';
    if (assignedInLessonsCount) assignedInLessonsCount.textContent = '0';
}

/**
 * Navigate to technique editor
 */
window.navigateToTechnique = function(techniqueId) {
    console.log(`🔗 Navigating to technique: ${techniqueId}`);
    // Navigate to techniques module with the technique ID
    window.location.hash = `#techniques?id=${techniqueId}`;
};

/**
 * Remove technique from course
 */
window.removeTechnique = async function(techniqueId) {
    if (!confirm('Deseja remover esta técnica do curso?')) {
        return;
    }
    
    console.log(`🗑️ Removing technique: ${techniqueId}`);
    
    try {
        const response = await moduleAPI.api.request('DELETE', `/api/courses/${currentCourseId}/techniques/${techniqueId}`);
        
        if (response.success) {
            console.log('✅ Technique removed successfully');
            await loadCourseTechniques(currentCourseId);
        } else {
            throw new Error(response.message || 'Failed to remove technique');
        }
    } catch (error) {
        console.error('❌ Error removing technique:', error);
        alert('Erro ao remover técnica: ' + error.message);
    }
};

/**
 * Show new course state
 */
function showNewCourseState() {
    console.log('🆕 Showing new course state');
    updateTitle('Novo Curso');
}

/**
 * Update page title
 */
function updateTitle(title) {
    const titleElement = document.getElementById('titleText');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

/**
 * Save course
 */
async function saveCourse() {
    console.log('💾 Saving course...');

    const formData = collectFormData();
    
    if (!validateFormData(formData)) {
        return;
    }

    const saveCourseBtn = document.getElementById('saveCourseBtn');
    if (saveCourseBtn) saveCourseBtn.disabled = true;

    try {
        const endpoint = currentCourseId 
            ? `/api/courses/${currentCourseId}` 
            : '/api/courses';
        
        const method = currentCourseId ? 'PUT' : 'POST';

        const response = await moduleAPI.api.request(method, endpoint, formData);

        if (response.success) {
            console.log('✅ Course saved successfully');
            
            // Show success message
            showSuccessMessage('Curso salvo com sucesso!');
            
            // Wait 1 second then go back
            setTimeout(() => {
                goBack();
            }, 1000);
        } else {
            throw new Error(response.message || 'Failed to save course');
        }
    } catch (error) {
        console.error('❌ Error saving course:', error);
        window.app?.handleError?.(error, { module: 'course-editor', context: 'saveCourse' });
    } finally {
        if (saveCourseBtn) saveCourseBtn.disabled = false;
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    // Collect general objectives
    const generalObjectives = [];
    document.querySelectorAll('#generalObjectives textarea').forEach(textarea => {
        const value = textarea.value.trim();
        if (value) generalObjectives.push(value);
    });
    
    // Collect specific objectives/prerequisites
    const specificObjectives = [];
    document.querySelectorAll('#specificObjectives textarea').forEach(textarea => {
        const value = textarea.value.trim();
        if (value) specificObjectives.push(value);
    });
    
    // Collect resources
    const resources = [];
    document.querySelectorAll('#resourcesList input[type="text"]').forEach(input => {
        const value = input.value.trim();
        if (value) resources.push(value);
    });
    
    const formData = {
        name: document.getElementById('courseName')?.value?.trim() || '',
        level: document.getElementById('courseLevel')?.value || '',
        category: document.getElementById('courseCategory')?.value || 'ADULT',
        martialArtId: document.getElementById('courseMartialArt')?.value || null,
        duration: parseInt(document.getElementById('courseDuration')?.value) || 0,
        classesPerWeek: parseInt(document.getElementById('courseClassesPerWeek')?.value) || 2,
        totalClasses: parseInt(document.getElementById('courseTotalClasses')?.value) || 0,
        minAge: parseInt(document.getElementById('courseMinAge')?.value) || 16,
        maxAge: document.getElementById('courseMaxAge')?.value ? parseInt(document.getElementById('courseMaxAge').value) : null,
        orderIndex: parseInt(document.getElementById('courseOrderIndex')?.value) || 1,
        sequence: parseInt(document.getElementById('courseSequence')?.value) || 1,
        imageUrl: document.getElementById('courseImageUrl')?.value?.trim() || '',
        isBaseCourse: Boolean(document.getElementById('courseIsBaseCourse')?.checked),
        isActive: document.getElementById('courseIsActive')?.checked !== false,
        description: document.getElementById('courseDescription')?.value?.trim() || '',
        objectives: generalObjectives,
        generalObjectives: generalObjectives,
        specificObjectives: specificObjectives,
        prerequisites: specificObjectives,
        resources: resources,
        requirements: resources,
        category: document.getElementById('courseCategory')?.value || 'ADULT',
        methodology: document.getElementById('courseDescription')?.value?.trim() || '',
    };

    console.log('📋 Collected form data:', formData);
    return formData;
}

/**
 * Validate form data
 */
function validateFormData(formData) {
    if (!formData.name || formData.name.trim() === '') {
        showErrorMessage('Nome do curso é obrigatório');
        document.getElementById('courseName')?.focus();
        return false;
    }

    if (!formData.level || formData.level === '') {
        showErrorMessage('Nível do curso é obrigatório');
        document.getElementById('courseLevel')?.focus();
        return false;
    }
    
    if (!formData.duration || formData.duration <= 0) {
        showErrorMessage('Duração (semanas) é obrigatória e deve ser maior que zero');
        document.getElementById('courseDuration')?.focus();
        return false;
    }

    return true;
}

/**
 * Go back to courses list
 */
function goBack() {
    console.log('← Going back to courses list');
    
    if (window.router && typeof window.router.navigateTo === 'function') {
        window.router.navigateTo('courses');
    } else {
        window.location.hash = 'courses';
    }
}

/**
 * Generate schedule
 */
function generateSchedule() {
    console.log('🔄 Generating schedule...');
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Import schedule
 */
function importSchedule() {
    console.log('📁 Importing schedule...');
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Export schedule
 */
function exportSchedule() {
    console.log('📤 Exporting schedule...');
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Generate RAG plans
 */
async function generateRAGPlans() {
    console.log('🤖 Generating AI plans...');
    showInfoMessage('Geração de planos com IA em desenvolvimento');
}

/**
 * Preview RAG
 */
function previewRAG() {
    console.log('👁️ Previewing AI generation...');
    showInfoMessage('Preview em desenvolvimento');
}

/**
 * Setup dynamic list listeners (objectives, resources, etc.)
 */
function setupDynamicListeners() {
    // Delegate event listeners for dynamically added items
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Handle data-action attribute
        if (target.hasAttribute('data-action')) {
            const action = target.getAttribute('data-action');
            const argsStr = target.getAttribute('data-args');
            
            try {
                const args = argsStr ? JSON.parse(argsStr) : [];
                
                if (action === 'addObjective') {
                    addObjective(args[0]);
                } else if (action === 'removeObjective') {
                    removeObjective(target);
                } else if (action === 'addResource') {
                    addResource();
                } else if (action === 'removeResource') {
                    removeResource(target);
                } else if (action === 'addEvalItem') {
                    addEvalItem(args[0]);
                } else if (action === 'removeEvalItem') {
                    removeEvalItem(target);
                }
            } catch (error) {
                console.error('Error handling action:', action, error);
            }
        }
    });
}

/**
 * Add objective
 */
function addObjective(type) {
    console.log(`➕ Adding ${type} objective`);
    // TODO: Implement add objective
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Remove objective
 */
function removeObjective(button) {
    console.log('🗑️ Removing objective');
    const item = button.closest('.objective-item');
    if (item) item.remove();
}

/**
 * Add resource
 */
function addResource() {
    console.log('➕ Adding resource');
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Remove resource
 */
function removeResource(button) {
    console.log('🗑️ Removing resource');
    const item = button.closest('.resource-item');
    if (item) item.remove();
}

/**
 * Add evaluation item
 */
function addEvalItem(type) {
    console.log(`➕ Adding ${type} evaluation item`);
    showInfoMessage('Funcionalidade em desenvolvimento');
}

/**
 * Remove evaluation item
 */
function removeEvalItem(button) {
    console.log('🗑️ Removing evaluation item');
    const item = button.closest('.eval-item');
    if (item) item.remove();
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    console.log('✅', message);
    // TODO: Implement toast notification
    alert(message);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    console.error('❌', message);
    // TODO: Implement toast notification
    alert(message);
}

/**
 * Show info message
 */
function showInfoMessage(message) {
    console.log('ℹ️', message);
    // TODO: Implement toast notification
    alert(message);
}

/**
 * Module cleanup on navigation
 */
window.cleanupCourseEditorModule = function() {
    console.log('🧹 Cleaning up Course Editor Module...');
    isInitialized = false;
    currentCourseId = null;
    moduleAPI = null;
};

// Export for global access
window.courseEditorController = {
    goBack,
    saveCourse,
    generateSchedule,
    importSchedule,
    exportSchedule,
    generateRAGPlans,
    previewRAG,
    openTechniquesModal,
    closeTechniquesModal,
    saveLessonTechniques
};

console.log('📝 Course Editor Controller loaded');

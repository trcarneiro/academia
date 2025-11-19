/**
 * Course Editor Premium Controller
 * AGENTS.md v2.0 - Premium UI Standards
 * Replaces old course-editor with modern premium interface
 */

// Module state
let moduleAPI = null;
let currentCourseId = null;
let isInitialized = false;
let courseTechniques = [];
let lessonPlans = [];

/**
 * Initialize Course Editor Module
 */
window.initializeCourseEditorModule = async function() {
    if (isInitialized) {
        console.log('📝 Course Editor Premium já inicializado');
        return;
    }

    console.log('📝 Inicializando Course Editor Premium...');

    try {
        // Wait for API client
        await waitForAPIClient();
        moduleAPI = window.createModuleAPI('CourseEditor');

        // Get course ID from URL
        const hashParts = window.location.hash.split('/');
        currentCourseId = hashParts[1] || window.currentCourseId || null;

        // Setup
        setupEventListeners();
        setupTabs();

        // Load data
        if (currentCourseId) {
            await loadCourse(currentCourseId);
        } else {
            showNewCourseState();
        }

        isInitialized = true;
        console.log('✅ Course Editor Premium inicializado');

    } catch (error) {
        console.error('❌ Erro ao inicializar Course Editor Premium:', error);
    }
};

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
    // Header actions
    const cancelBtn = document.getElementById('cancelCourseBtn');
    const saveBtn = document.getElementById('saveCourseBtn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.hash = '#courses';
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', saveCourse);
    }

    // Form field listeners for auto-calculation
    const durationInput = document.getElementById('courseDuration');
    const classesPerWeekInput = document.getElementById('courseClassesPerWeek');
    const totalClassesInput = document.getElementById('courseTotalClasses');

    if (durationInput && classesPerWeekInput && totalClassesInput) {
        const updateTotalClasses = () => {
            const weeks = parseInt(durationInput.value) || 0;
            const perWeek = parseInt(classesPerWeekInput.value) || 0;
            totalClassesInput.value = weeks * perWeek;
            updateStatCards();
        };

        durationInput.addEventListener('input', updateTotalClasses);
        classesPerWeekInput.addEventListener('input', updateTotalClasses);
    }

    // Objectives buttons
    document.getElementById('addGeneralObjective')?.addEventListener('click', () => addObjective('general'));
    document.getElementById('addSpecificObjective')?.addEventListener('click', () => addObjective('specific'));

    // Resources button
    document.getElementById('addResource')?.addEventListener('click', addResource);

    // Evaluation buttons
    document.getElementById('addEvalCriteria')?.addEventListener('click', () => addEvalItem('criteria'));
    document.getElementById('addEvalMethod')?.addEventListener('click', () => addEvalItem('methods'));

    // Techniques button
    document.getElementById('addTechniqueBtn')?.addEventListener('click', showAddTechniqueModal);

    // Modal close
    document.getElementById('closeTechniqueModal')?.addEventListener('click', closeAddTechniqueModal);
    document.getElementById('cancelTechniqueModal')?.addEventListener('click', closeAddTechniqueModal);
}

/**
 * Setup Tab Navigation
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.module-isolated-course-editor .tab-btn');
    const tabContents = document.querySelectorAll('.module-isolated-course-editor .tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update active content
            tabContents.forEach(content => {
                const contentTab = content.getAttribute('data-tab-content');
                if (contentTab === targetTab) {
                    content.classList.add('active');
                    content.style.display = 'block';
                } else {
                    content.classList.remove('active');
                    content.style.display = 'none';
                }
            });

            // Load tab-specific data
            if (targetTab === 'techniques' && currentCourseId) {
                loadTechniques();
            } else if (targetTab === 'lessons' && currentCourseId) {
                loadLessonPlans();
            }
        });
    });
}

/**
 * Load Course Data
 */
async function loadCourse(courseId) {
    showLoading(true);

    try {
        const response = await moduleAPI.api.request('GET', `/api/courses/${courseId}`);
        
        if (response.success && response.data) {
            populateForm(response.data);
            updateHeader(response.data.name);
            updateBreadcrumb(response.data.name);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar curso:', error);
        window.app?.handleError(error, { module: 'CourseEditor', context: 'loadCourse' });
    } finally {
        showLoading(false);
    }
}

/**
 * Populate Form with Course Data
 */
function populateForm(course) {
    // Basic info
    document.getElementById('courseName').value = course.name || '';
    document.getElementById('courseLevel').value = course.level || '';
    document.getElementById('courseCategory').value = course.targetAudience || '';
    document.getElementById('courseDuration').value = parseInt(course.duration) || 24;
    document.getElementById('courseClassesPerWeek').value = 2;
    document.getElementById('courseTotalClasses').value = course.totalLessons || 48;
    document.getElementById('courseMinAge').value = course.minAge || 16;
    document.getElementById('courseMaxAge').value = course.maxAge || '';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('courseIsActive').checked = course.isActive !== false;

    // Objectives
    if (course.generalObjectives && course.generalObjectives.length > 0) {
        const container = document.getElementById('generalObjectivesList');
        container.innerHTML = '';
        course.generalObjectives.forEach(obj => {
            addObjective('general', obj);
        });
    }

    if (course.specificObjectives && course.specificObjectives.length > 0) {
        const container = document.getElementById('specificObjectivesList');
        container.innerHTML = '';
        course.specificObjectives.forEach(obj => {
            addObjective('specific', obj);
        });
    }

    // Resources
    if (course.resources && course.resources.length > 0) {
        const container = document.getElementById('resourcesList');
        container.innerHTML = '';
        course.resources.forEach(resource => {
            addResource(resource);
        });
    }

    // Evaluation
    if (course.evaluation?.criteria && course.evaluation.criteria.length > 0) {
        const container = document.getElementById('evaluationCriteriaList');
        container.innerHTML = '';
        course.evaluation.criteria.forEach(criteria => {
            addEvalItem('criteria', criteria);
        });
    }

    if (course.evaluation?.methods && course.evaluation.methods.length > 0) {
        const container = document.getElementById('evaluationMethodsList');
        container.innerHTML = '';
        course.evaluation.methods.forEach(method => {
            addEvalItem('methods', method);
        });
    }

    if (course.evaluation?.requirements) {
        document.getElementById('evaluationRequirements').value = course.evaluation.requirements;
    }

    // Update stats
    updateStatCards();
}

/**
 * Save Course
 */
async function saveCourse() {
    const courseData = {
        name: document.getElementById('courseName').value.trim(),
        level: document.getElementById('courseLevel').value,
        targetAudience: document.getElementById('courseCategory').value,
        duration: `${document.getElementById('courseDuration').value} semanas`,
        totalLessons: parseInt(document.getElementById('courseTotalClasses').value),
        minAge: parseInt(document.getElementById('courseMinAge').value) || null,
        maxAge: parseInt(document.getElementById('courseMaxAge').value) || null,
        description: document.getElementById('courseDescription').value.trim(),
        isActive: document.getElementById('courseIsActive').checked,
        category: document.getElementById('courseLevel').value,
        generalObjectives: collectObjectives('general'),
        specificObjectives: collectObjectives('specific'),
        resources: collectResources(),
        evaluation: {
            criteria: collectEvalItems('criteria'),
            methods: collectEvalItems('methods'),
            requirements: document.getElementById('evaluationRequirements').value.trim()
        }
    };

    // Validation
    if (!courseData.name) {
        alert('Por favor, preencha o nome do curso');
        return;
    }

    if (!courseData.level) {
        alert('Por favor, selecione o nível do curso');
        return;
    }

    try {
        const method = currentCourseId ? 'PUT' : 'POST';
        const url = currentCourseId ? `/api/courses/${currentCourseId}` : '/api/courses';
        
        const response = await moduleAPI.api.request(method, url, courseData);

        if (response.success) {
            alert('✅ Curso salvo com sucesso!');
            window.location.hash = '#courses';
        }
    } catch (error) {
        console.error('❌ Erro ao salvar curso:', error);
        alert('Erro ao salvar curso. Verifique os dados e tente novamente.');
    }
}

/**
 * Add Objective
 */
function addObjective(type, value = '') {
    const container = document.getElementById(type === 'general' ? 'generalObjectivesList' : 'specificObjectivesList');
    
    const item = document.createElement('div');
    item.className = 'objective-item';
    item.innerHTML = `
        <textarea placeholder="Descreva o objetivo..." rows="2">${value}</textarea>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">🗑️</button>
    `;
    
    container.appendChild(item);
}

/**
 * Add Resource
 */
function addResource(value = '') {
    const container = document.getElementById('resourcesList');
    
    const item = document.createElement('div');
    item.className = 'resource-item';
    item.innerHTML = `
        <input type="text" placeholder="Ex: Tatame, Luvas, Escudos..." value="${value}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">🗑️</button>
    `;
    
    container.appendChild(item);
}

/**
 * Add Evaluation Item
 */
function addEvalItem(type, value = '') {
    const container = document.getElementById(type === 'criteria' ? 'evaluationCriteriaList' : 'evaluationMethodsList');
    
    const item = document.createElement('div');
    item.className = 'eval-item';
    item.innerHTML = `
        <input type="text" placeholder="${type === 'criteria' ? 'Ex: Execução correta' : 'Ex: Avaliação prática'}" value="${value}">
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">🗑️</button>
    `;
    
    container.appendChild(item);
}

/**
 * Collect Data Helpers
 */
function collectObjectives(type) {
    const container = document.getElementById(type === 'general' ? 'generalObjectivesList' : 'specificObjectivesList');
    const textareas = container.querySelectorAll('textarea');
    return Array.from(textareas)
        .map(ta => ta.value.trim())
        .filter(val => val.length > 0);
}

function collectResources() {
    const container = document.getElementById('resourcesList');
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(val => val.length > 0);
}

function collectEvalItems(type) {
    const container = document.getElementById(type === 'criteria' ? 'evaluationCriteriaList' : 'evaluationMethodsList');
    const inputs = container.querySelectorAll('input');
    return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(val => val.length > 0);
}

/**
 * Update UI Elements
 */
function updateHeader(courseName) {
    const title = document.getElementById('courseEditorTitle');
    if (title) {
        title.textContent = currentCourseId ? `Editando: ${courseName}` : 'Novo Curso';
    }
}

function updateBreadcrumb(courseName) {
    const breadcrumb = document.getElementById('breadcrumbCurrent');
    if (breadcrumb) {
        breadcrumb.textContent = currentCourseId ? courseName : 'Novo Curso';
    }
}

function updateStatCards() {
    const totalLessons = document.getElementById('courseTotalClasses')?.value || 0;
    const duration = document.getElementById('courseDuration')?.value || 0;
    
    document.getElementById('statTotalLessons').textContent = totalLessons;
    document.getElementById('statDuration').textContent = `${duration} sem`;
    document.getElementById('statTotalTechniques').textContent = courseTechniques.length;
}

function showLoading(show) {
    const loading = document.getElementById('courseEditorLoading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showNewCourseState() {
    updateHeader('Novo Curso');
    updateBreadcrumb('Novo Curso');
    
    // Add initial empty items
    addObjective('general');
    addObjective('specific');
    addResource();
    addEvalItem('criteria');
    addEvalItem('methods');
}

/**
 * Techniques Management
 */
async function loadTechniques() {
    if (!currentCourseId) return;

    try {
        const response = await moduleAPI.api.request('GET', `/api/courses/${currentCourseId}/techniques`);
        
        if (response.success && response.data) {
            courseTechniques = response.data;
            renderTechniquesTable();
            updateTechniquesStats();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar técnicas:', error);
    }
}

function renderTechniquesTable() {
    const tbody = document.getElementById('techniquesTableBody');
    
    if (!tbody) return;
    
    if (courseTechniques.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="6" class="empty-state-cell">
                    <div class="empty-state-content">
                        <span class="empty-icon">🥋</span>
                        <p>Nenhuma técnica adicionada</p>
                        <p class="empty-hint">Clique em "Adicionar Técnica" para começar</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = courseTechniques.map((item, index) => `
        <tr>
            <td>${item.orderIndex || index + 1}</td>
            <td>${item.technique?.name || 'N/A'}</td>
            <td>${item.technique?.category || 'N/A'}</td>
            <td>${item.technique?.difficulty || 1}</td>
            <td>${item.isRequired ? '✅ Sim' : '❌ Não'}</td>
            <td>
                <button class="remove-btn" onclick="removeTechnique('${item.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateTechniquesStats() {
    const categories = {
        STANCE: 0,
        PUNCH: 0,
        KICK: 0,
        DEFENSE: 0
    };

    courseTechniques.forEach(item => {
        const category = item.technique?.category;
        if (category && categories.hasOwnProperty(category)) {
            categories[category]++;
        }
    });

    document.getElementById('techniquesCount').textContent = courseTechniques.length;
    document.getElementById('stancesCount').textContent = categories.STANCE;
    document.getElementById('punchesCount').textContent = categories.PUNCH;
    document.getElementById('kicksCount').textContent = categories.KICK;
    document.getElementById('defensesCount').textContent = categories.DEFENSE;
}

function showAddTechniqueModal() {
    const modal = document.getElementById('addTechniqueModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAddTechniqueModal() {
    const modal = document.getElementById('addTechniqueModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Lesson Plans Management
 */
async function loadLessonPlans() {
    if (!currentCourseId) return;

    try {
        const response = await moduleAPI.api.request('GET', `/api/courses/${currentCourseId}/lesson-plans`);
        
        if (response.success && response.data) {
            lessonPlans = response.data;
            renderLessonsGrid();
            updateLessonsStats();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar planos de aula:', error);
    }
}

function renderLessonsGrid() {
    const container = document.getElementById('lessonsGridContainer');
    
    if (!container) return;

    if (lessonPlans.length === 0) {
        container.innerHTML = `
            <div class="empty-state-content">
                <span class="empty-icon">📅</span>
                <p>Nenhum cronograma carregado</p>
                <p class="empty-hint">Importe um curso ou gere um cronograma automático</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lessonPlans.map(lesson => `
        <div class="lesson-card">
            <h4>Aula ${lesson.lesson} - Semana ${lesson.week}</h4>
            <p>${lesson.name}</p>
            <small>${lesson.itemsCount || 0} atividades</small>
        </div>
    `).join('');
}

function updateLessonsStats() {
    const weeksSet = new Set(lessonPlans.map(l => l.week));
    
    document.getElementById('lessonsCount').textContent = lessonPlans.length;
    document.getElementById('weeksCount').textContent = weeksSet.size;
    document.getElementById('assignedTechniquesCount').textContent = courseTechniques.length;
    
    const completion = lessonPlans.length > 0 ? Math.round((lessonPlans.length / 48) * 100) : 0;
    document.getElementById('completionRate').textContent = `${completion}%`;
}

// Export for debugging
window.courseEditorPremium = {
    loadCourse,
    saveCourse,
    loadTechniques,
    loadLessonPlans
};

console.log('📝 Course Editor Premium Controller carregado');

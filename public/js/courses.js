// ==========================================
// COURSE MANAGEMENT MODULE
// ==========================================

// Module-level state
let allCourses = []; // Cache for courses
let currentEditingCourseId = null;
let currentEditingCourse = null;

/**
 * Initializes all event listeners for the courses section.
 */
function initCourseEventListeners() {
    // Search functionality
    const courseSearch = document.getElementById('courseSearch');
    if (courseSearch) courseSearch.addEventListener('input', handleCourseSearch);

    // Refresh button
    const refreshBtn = document.querySelector('[onclick="refreshCourses()"]');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRenderCourses);

    // Export button
    const exportBtn = document.querySelector('[onclick="exportCourses()"]');
    if (exportBtn) exportBtn.addEventListener('click', exportCourses);

    // Course table event delegation
    const coursesTableBody = document.getElementById('courses-table-body');
    if (coursesTableBody) coursesTableBody.addEventListener('click', handleCourseTableClick);

    // Course detail modal listeners
    const closeDetailBtn = document.getElementById('closeCourseDetailModalBtn');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeCourseDetailModal);

    // Course modal tabs
    const courseModalTabs = document.getElementById('course-modal-tabs');
    if (courseModalTabs) courseModalTabs.addEventListener('click', handleCourseModalTabClick);

    // Initialize form handlers
    initCourseFormHandlers();

    console.log('✅ Course event listeners initialized');
}

/**
 * Loads and renders the courses list dynamically from the API.
 */
async function loadAndRenderCourses() {
    console.log('🔄 Loading courses from API...');
    
    // Show loading state
    showCoursesLoadingState();
    
    try {
        const response = await fetch('/api/courses');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load courses');
        }
        
        // Store courses in cache
        allCourses = result.data || [];
        console.log(`✅ Loaded ${allCourses.length} courses from API`);
        
        // Render the courses table
        renderCoursesTable(allCourses);
        
        // Hide loading state
        hideCoursesLoadingState();
        
        // Update counters and other UI elements
        updateCoursesCounter();
        
    } catch (error) {
        console.error('❌ Error loading courses:', error);
        showCoursesErrorState(error.message);
    }
}

/**
 * Renders the courses table with the provided data.
 * @param {Array} courses - Array of course objects to render.
 */
function renderCoursesTable(courses) {
    const tableBody = document.getElementById('courses-table-body');
    if (!tableBody) return;
    
    if (courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">📚</div>
                    <div>Nenhum curso encontrado</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        Clique em "Novo Curso" para criar o primeiro curso
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const html = courses.map(course => {
        const name = course.name || 'Nome não disponível';
        const category = course.category || 'N/A';
        const level = course.level || 'N/A';
        const duration = course.duration || 0;
        const totalLessons = course.totalLessons || course._count?.lessons || 0;
        const studentCount = course._count?.studentEnrollments || course._count?.students || 0;
        const status = course.isActive ? 'Ativo' : 'Inativo';
        const statusColor = course.isActive ? '#10B981' : '#EF4444';
        const instructorName = course.instructor?.name || course.instructorName || 'N/A';
        
        return `
            <tr class="course-row" data-course-id="${course.id}" style="cursor: pointer; transition: background-color 0.2s ease;" 
                onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'" 
                onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding: 1rem; color: #F8FAFC; font-weight: 500;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></div>
                        ${name}
                    </div>
                    ${course.description ? `<div style="font-size: 0.875rem; color: #94A3B8; margin-top: 0.25rem;">${course.description.substring(0, 60)}${course.description.length > 60 ? '...' : ''}</div>` : ''}
                </td>
                <td style="padding: 1rem; color: #94A3B8;">
                    <div style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; text-align: center; display: inline-block;">
                        ${category}
                    </div>
                </td>
                <td style="padding: 1rem; color: #94A3B8;">
                    <div style="background: rgba(16, 185, 129, 0.1); color: #10B981; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; text-align: center; display: inline-block;">
                        ${level}
                    </div>
                </td>
                <td style="padding: 1rem; color: #94A3B8; text-align: center;">
                    <div style="font-weight: 600; color: #F8FAFC;">${totalLessons}</div>
                    <div style="font-size: 0.75rem; color: #6B7280;">${duration} semanas</div>
                </td>
                <td style="padding: 1rem; color: #94A3B8; text-align: center;">
                    <div style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; display: inline-block;">
                        ${studentCount}
                    </div>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <div style="color: ${statusColor}; font-weight: 600; font-size: 0.875rem;">
                        ${status}
                    </div>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="action-btn" data-action="view" data-course-id="${course.id}" 
                                style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid #3B82F6; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Ver detalhes">
                            👁️
                        </button>
                        <button class="action-btn" data-action="edit" data-course-id="${course.id}" 
                                style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid #F59E0B; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Editar curso">
                            ✏️
                        </button>
                        <button class="action-btn" data-action="delete" data-course-id="${course.id}" 
                                style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid #EF4444; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Excluir curso">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = html;
    
    console.log(`✅ Rendered ${courses.length} courses in table`);
}

/**
 * Handles course search input for real-time filtering.
 * @param {Event} event - The input event.
 */
function handleCourseSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log(`🔍 Filtering courses with: "${searchTerm}"`);
    
    // If no search term, show all courses
    if (!searchTerm) {
        renderCoursesTable(allCourses);
        updateFilteredCounter(allCourses.length, allCourses.length);
        return;
    }
    
    // Filter courses based on search term
    const filteredCourses = allCourses.filter(course => {
        const name = (course.name || '').toLowerCase();
        const description = (course.description || '').toLowerCase();
        const category = (course.category || '').toLowerCase();
        const level = (course.level || '').toLowerCase();
        const instructorName = (course.instructor?.name || course.instructorName || '').toLowerCase();
        const courseId = course.id.toLowerCase();
        
        return (
            name.includes(searchTerm) ||
            description.includes(searchTerm) ||
            category.includes(searchTerm) ||
            level.includes(searchTerm) ||
            instructorName.includes(searchTerm) ||
            courseId.includes(searchTerm)
        );
    });
    
    console.log(`✅ Found ${filteredCourses.length} courses matching "${searchTerm}"`);
    
    // Render filtered results
    renderCoursesTable(filteredCourses);
    updateFilteredCounter(filteredCourses.length, allCourses.length);
}

/**
 * Handles clicks on the course table (event delegation).
 * @param {Event} event - The click event.
 */
function handleCourseTableClick(event) {
    const actionBtn = event.target.closest('.action-btn');
    const courseRow = event.target.closest('.course-row');
    
    if (actionBtn) {
        event.stopPropagation();
        const action = actionBtn.dataset.action;
        const courseId = actionBtn.dataset.courseId;
        
        switch (action) {
            case 'view':
                openCourseDetailModal(courseId);
                break;
            case 'edit':
                editCourse(courseId);
                break;
            case 'delete':
                deleteCourse(courseId);
                break;
        }
    } else if (courseRow) {
        // Double-click to open details
        const courseId = courseRow.dataset.courseId;
        openCourseDetailModal(courseId);
    }
}

/**
 * Opens the course detail modal with comprehensive course information.
 * @param {string} courseId - The ID of the course to display.
 */
async function openCourseDetailModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) {
        window.showToast('Erro: Curso não encontrado.', 'error');
        console.error(`Course with ID ${courseId} not found in cache.`);
        return;
    }
    
    currentEditingCourseId = courseId;
    currentEditingCourse = course;
    
    console.log('Opening details for course:', course);
    const modal = document.getElementById('courseDetailModal');
    if (!modal) return;
    
    // Populate basic modal fields
    await populateCourseDetailsModal(course);
    
    // Load default tab data
    await loadCourseModalTabData(courseId, 'overview');
    
    modal.style.display = 'block';
}

/**
 * Closes the course detail modal.
 */
function closeCourseDetailModal() {
    const modal = document.getElementById('courseDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingCourseId = null;
    currentEditingCourse = null;
}

/**
 * Populates the course details modal with comprehensive course information.
 * @param {Object} course - The course object to display.
 */
async function populateCourseDetailsModal(course) {
    try {
        // Fetch fresh course data from API
        const response = await fetch(`/api/courses/${course.id}`);
        const result = await response.json();
        
        if (!result.success) {
            console.warn('Failed to load fresh course data, using cached data');
            populateBasicCourseInfo(course);
            return;
        }
        
        const freshCourse = result.data;
        
        // Update basic information
        const nameEl = document.getElementById('modalCourseName');
        const idEl = document.getElementById('modalCourseId');
        const descriptionEl = document.getElementById('modalCourseDescription');
        const categoryEl = document.getElementById('modalCourseCategory');
        const levelEl = document.getElementById('modalCourseLevel');
        const statusEl = document.getElementById('modalCourseStatus');
        const durationEl = document.getElementById('modalCourseDuration');
        const instructorEl = document.getElementById('modalCourseInstructor');
        
        if (nameEl) nameEl.textContent = freshCourse.name || 'Nome não disponível';
        if (idEl) idEl.textContent = `ID: ${freshCourse.id}`;
        if (descriptionEl) descriptionEl.textContent = freshCourse.description || 'Sem descrição';
        if (categoryEl) categoryEl.textContent = freshCourse.category || 'N/A';
        if (levelEl) levelEl.textContent = freshCourse.level || 'N/A';
        if (durationEl) durationEl.textContent = `${freshCourse.duration || 0} semanas`;
        if (instructorEl) instructorEl.textContent = freshCourse.instructor?.name || freshCourse.instructorName || 'N/A';
        if (statusEl) {
            statusEl.textContent = freshCourse.isActive ? 'Ativo' : 'Inativo';
            statusEl.style.color = freshCourse.isActive ? '#10B981' : '#EF4444';
        }
        
        console.log('✅ Course modal populated with fresh data');
        
    } catch (error) {
        console.error('❌ Error loading fresh course data:', error);
        populateBasicCourseInfo(course);
    }
}

/**
 * Populates basic course information as fallback.
 * @param {Object} course - The course object.
 */
function populateBasicCourseInfo(course) {
    const nameEl = document.getElementById('modalCourseName');
    const idEl = document.getElementById('modalCourseId');
    const descriptionEl = document.getElementById('modalCourseDescription');
    const categoryEl = document.getElementById('modalCourseCategory');
    const levelEl = document.getElementById('modalCourseLevel');
    const statusEl = document.getElementById('modalCourseStatus');
    const durationEl = document.getElementById('modalCourseDuration');
    const instructorEl = document.getElementById('modalCourseInstructor');
    
    if (nameEl) nameEl.textContent = course.name || 'Nome não disponível';
    if (idEl) idEl.textContent = `ID: ${course.id}`;
    if (descriptionEl) descriptionEl.textContent = course.description || 'Sem descrição';
    if (categoryEl) categoryEl.textContent = course.category || 'N/A';
    if (levelEl) levelEl.textContent = course.level || 'N/A';
    if (durationEl) durationEl.textContent = `${course.duration || 0} semanas`;
    if (instructorEl) instructorEl.textContent = course.instructor?.name || course.instructorName || 'N/A';
    if (statusEl) {
        statusEl.textContent = course.isActive ? 'Ativo' : 'Inativo';
        statusEl.style.color = course.isActive ? '#10B981' : '#EF4444';
    }
}

/**
 * Handles clicks on course modal tabs.
 * @param {Event} event - The click event.
 */
function handleCourseModalTabClick(event) {
    const tabButton = event.target.closest('.course-tab-btn');
    if (!tabButton) return;

    const tabName = tabButton.dataset.tab;
    console.log(`Course modal tab clicked: ${tabName}`);

    // Update active button style
    const tabContainer = tabButton.parentElement;
    tabContainer.querySelectorAll('.course-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.color = '#94A3B8';
        btn.style.borderBottom = '2px solid transparent';
    });
    tabButton.classList.add('active');
    tabButton.style.color = '#3B82F6';
    tabButton.style.borderBottom = '2px solid #3B82F6';

    // Show the corresponding tab content
    const contentContainer = document.getElementById('course-modal-tab-contents');
    contentContainer.querySelectorAll('.course-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    const activeContent = document.getElementById(`course-tab-${tabName}`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }

    // Load dynamic content for the tab
    if (currentEditingCourseId) {
        loadCourseModalTabData(currentEditingCourseId, tabName);
    }
}

/**
 * Loads tab data dynamically for the course modal.
 * @param {string} courseId - The ID of the course.
 * @param {string} tabName - The name of the tab to load.
 */
async function loadCourseModalTabData(courseId, tabName) {
    console.log(`🔄 Loading ${tabName} tab data for course ${courseId}`);
    
    try {
        switch (tabName) {
            case 'overview':
                // Overview is already populated
                break;
            case 'modules':
                await loadCourseModulesData(courseId);
                break;
            case 'students':
                await loadCourseStudentsData(courseId);
                break;
            case 'classes':
                await loadCourseClassesData(courseId);
                break;
            case 'progress':
                await loadCourseProgressData(courseId);
                break;
            default:
                console.log(`Unknown tab: ${tabName}`);
        }
    } catch (error) {
        console.error(`❌ Error loading ${tabName} data:`, error);
        showCourseTabError(tabName, error.message);
    }
}

/**
 * Loads modules data for the course.
 * @param {string} courseId - The ID of the course.
 */
async function loadCourseModulesData(courseId) {
    const response = await fetch(`/api/courses/${courseId}/modules`);
    const result = await response.json();
    
    if (result.success) {
        const contentEl = document.getElementById('course-modules-content');
        if (contentEl) {
            contentEl.innerHTML = renderCourseModules(result.data);
        }
        console.log('✅ Modules data loaded');
    } else {
        throw new Error(result.message || 'Failed to load modules data');
    }
}

/**
 * Loads enrolled students data for the course.
 * @param {string} courseId - The ID of the course.
 */
async function loadCourseStudentsData(courseId) {
    const response = await fetch(`/api/courses/${courseId}/students`);
    const result = await response.json();
    
    if (result.success) {
        const contentEl = document.getElementById('course-students-content');
        if (contentEl) {
            contentEl.innerHTML = renderCourseStudents(result.data);
        }
        console.log('✅ Students data loaded');
    } else {
        throw new Error(result.message || 'Failed to load students data');
    }
}

/**
 * Loads classes data for the course.
 * @param {string} courseId - The ID of the course.
 */
async function loadCourseClassesData(courseId) {
    const response = await fetch(`/api/courses/${courseId}/classes`);
    const result = await response.json();
    
    if (result.success) {
        const contentEl = document.getElementById('course-classes-content');
        if (contentEl) {
            contentEl.innerHTML = renderCourseClasses(result.data);
        }
        console.log('✅ Classes data loaded');
    } else {
        throw new Error(result.message || 'Failed to load classes data');
    }
}

/**
 * Loads progress data for the course.
 * @param {string} courseId - The ID of the course.
 */
async function loadCourseProgressData(courseId) {
    const response = await fetch(`/api/courses/${courseId}/progress`);
    const result = await response.json();
    
    if (result.success) {
        const contentEl = document.getElementById('course-progress-content');
        if (contentEl) {
            contentEl.innerHTML = renderCourseProgress(result.data);
        }
        console.log('✅ Progress data loaded');
    } else {
        throw new Error(result.message || 'Failed to load progress data');
    }
}

// Utility functions for loading states
function showCoursesLoadingState() {
    const tableBody = document.getElementById('courses-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #3B82F6;">
                        <div style="width: 16px; height: 16px; border: 2px solid #3B82F6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Carregando cursos...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideCoursesLoadingState() {
    // Loading state is automatically hidden when table is re-rendered
}

function showCoursesErrorState(message) {
    const tableBody = document.getElementById('courses-table-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #EF4444;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div>Erro ao carregar cursos</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        ${message}
                    </div>
                </td>
            </tr>
        `;
    }
}

function updateCoursesCounter() {
    const counterEl = document.getElementById('coursesCounter');
    if (counterEl) {
        counterEl.textContent = `${allCourses.length} curso${allCourses.length !== 1 ? 's' : ''}`;
    }
}

function updateFilteredCounter(filtered, total) {
    const counterEl = document.getElementById('coursesCounter');
    if (counterEl) {
        if (filtered === total) {
            counterEl.textContent = `${total} curso${total !== 1 ? 's' : ''}`;
        } else {
            counterEl.textContent = `${filtered} de ${total} curso${total !== 1 ? 's' : ''}`;
        }
    }
}

function showCourseTabError(tabName, message) {
    const contentEl = document.getElementById(`course-${tabName}-content`);
    if (contentEl) {
        contentEl.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #EF4444;">
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
                <div>Erro ao carregar dados: ${message}</div>
            </div>
        `;
    }
}

// Render functions for different data types
function renderCourseModules(modules) {
    if (!modules || modules.length === 0) {
        return '<div style="padding: 1rem; color: #94A3B8; text-align: center;">Nenhum módulo encontrado</div>';
    }
    
    return `
        <div style="padding: 1rem;">
            <h4 style="color: #F8FAFC; margin-bottom: 1rem;">📚 Módulos do Curso</h4>
            ${modules.map(module => `
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                    <div style="color: #F8FAFC; font-weight: bold;">${module.name}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">${module.description || 'Sem descrição'}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">Aulas: ${module.lessonCount || 0}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCourseStudents(students) {
    if (!students || students.length === 0) {
        return '<div style="padding: 1rem; color: #94A3B8; text-align: center;">Nenhum aluno matriculado</div>';
    }
    
    return `
        <div style="padding: 1rem;">
            <h4 style="color: #F8FAFC; margin-bottom: 1rem;">👥 Alunos Matriculados</h4>
            ${students.map(student => `
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                    <div style="color: #F8FAFC; font-weight: bold;">${student.name}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">Status: ${student.status}</div>
                    ${student.enrolledAt ? `<div style="color: #94A3B8; font-size: 0.875rem;">Matriculado em: ${new Date(student.enrolledAt).toLocaleDateString()}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderCourseClasses(classes) {
    if (!classes || classes.length === 0) {
        return '<div style="padding: 1rem; color: #94A3B8; text-align: center;">Nenhuma turma encontrada</div>';
    }
    
    return `
        <div style="padding: 1rem;">
            <h4 style="color: #F8FAFC; margin-bottom: 1rem;">🏫 Turmas</h4>
            ${classes.map(cls => `
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                    <div style="color: #F8FAFC; font-weight: bold;">${cls.name}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">Horário: ${cls.schedule}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">Instrutor: ${cls.instructor}</div>
                    <div style="color: #94A3B8; font-size: 0.875rem;">Capacidade: ${cls.currentStudents}/${cls.maxStudents}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCourseProgress(progress) {
    return `
        <div style="padding: 1rem;">
            <h4 style="color: #F8FAFC; margin-bottom: 1rem;">📊 Estatísticas do Curso</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px;">
                    <div style="color: #94A3B8; font-size: 0.875rem;">Total de Alunos</div>
                    <div style="color: #F8FAFC; font-size: 1.5rem; font-weight: bold;">${progress.totalStudents || 0}</div>
                </div>
                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px;">
                    <div style="color: #94A3B8; font-size: 0.875rem;">Taxa de Conclusão</div>
                    <div style="color: #10B981; font-size: 1.5rem; font-weight: bold;">${progress.completionRate || 0}%</div>
                </div>
            </div>
        </div>
    `;
}

// Course action functions
function openNewCourseForm() {
    console.log('➕ Opening new course form...');
    
    // Clear any existing editing course ID
    localStorage.removeItem('editingCourseId');
    
    // Navigate to course-editor for new course creation
    navigateToModule('course-editor');
}

function editCourse(courseId) {
    console.log('✏️ Editing course:', courseId);
    
    // Store course ID for course-editor to use
    localStorage.setItem('editingCourseId', courseId);
    
    // Navigate to course-editor with the course ID
    navigateToModule('course-editor', { courseId: courseId });
}

async function deleteCourse(courseId) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast('Curso excluído com sucesso!', 'success');
            // Refresh the courses list
            await loadAndRenderCourses();
        } else {
            throw new Error(result.message || 'Erro ao excluir curso');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        window.showToast('Erro ao excluir curso: ' + error.message, 'error');
    }
}

function exportCourses() {
    console.log('Exporting courses');
    // TODO: Implement actual export functionality
    window.showToast('Função de exportação em desenvolvimento', 'info');
}

/**
 * Opens the course creation modal.
 */
function openCourseModal() {
    console.log('Opening course creation modal');
    const modal = document.getElementById('addCourseModal');
    if (modal) {
        // Clear the form
        const form = document.getElementById('addCourseForm');
        if (form) form.reset();
        
        // Open the modal
        modal.classList.add('active');
    } else {
        window.showToast('Modal de criação não encontrado', 'error');
    }
}

/**
 * Populates the edit course modal with course data.
 * @param {Object} course - The course data to populate.
 */
function populateEditCourseModal(course) {
    // Populate edit form fields
    const fields = {
        'editCourseId': course.id,
        'editCourseName': course.name,
        'editCourseDescription': course.description,
        'editCourseCategory': course.category,
        'editCourseLevel': course.level,
        'editCourseTotalClasses': course.totalClasses,
        'editCourseClassesPerWeek': course.classesPerWeek,
        'editCourseDuration': course.duration,
        'editCourseMinAge': course.minAge,
        'editCourseMaxAge': course.maxAge,
        'editCourseObjectives': (course.objectives || []).join('\n'),
        'editCourseRequirements': (course.requirements || []).join('\n')
    };
    
    for (const [fieldId, value] of Object.entries(fields)) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value || '';
        }
    }
}

/**
 * Initializes course form submissions to call loadAndRenderCourses after success.
 */
function initCourseFormHandlers() {
    // Handle course creation form
    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('courseName').value,
                description: document.getElementById('courseDescription').value,
                category: document.getElementById('courseCategory').value,
                level: document.getElementById('courseLevel').value,
                totalClasses: document.getElementById('courseTotalClasses').value,
                classesPerWeek: document.getElementById('courseClassesPerWeek').value,
                duration: document.getElementById('courseDuration').value,
                minAge: document.getElementById('courseMinAge').value,
                maxAge: document.getElementById('courseMaxAge').value,
                objectives: document.getElementById('courseObjectives').value.split('\n').filter(obj => obj.trim()),
                requirements: document.getElementById('courseRequirements').value.split('\n').filter(req => req.trim())
            };
            
            try {
                const response = await fetch('/api/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.showToast('Curso criado com sucesso!', 'success');
                    closeModal('addCourseModal');
                    // Auto-refresh courses list
                    await loadAndRenderCourses();
                } else {
                    throw new Error(data.message || 'Erro desconhecido');
                }
            } catch (error) {
                console.error('Error creating course:', error);
                window.showToast('Erro ao criar curso: ' + error.message, 'error');
            }
        });
    }
    
    // Handle course edit form
    const editCourseForm = document.getElementById('editCourseForm');
    if (editCourseForm) {
        editCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const courseId = document.getElementById('editCourseId').value;
            const formData = {
                name: document.getElementById('editCourseName').value,
                description: document.getElementById('editCourseDescription').value,
                category: document.getElementById('editCourseCategory').value,
                level: document.getElementById('editCourseLevel').value,
                totalClasses: document.getElementById('editCourseTotalClasses').value,
                classesPerWeek: document.getElementById('editCourseClassesPerWeek').value,
                duration: document.getElementById('editCourseDuration').value,
                minAge: document.getElementById('editCourseMinAge').value,
                maxAge: document.getElementById('editCourseMaxAge').value,
                objectives: document.getElementById('editCourseObjectives').value.split('\n').filter(obj => obj.trim()),
                requirements: document.getElementById('editCourseRequirements').value.split('\n').filter(req => req.trim())
            };
            
            try {
                const response = await fetch(`/api/courses/${courseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.showToast('Curso atualizado com sucesso!', 'success');
                    closeModal('editCourseModal');
                    // Auto-refresh courses list
                    await loadAndRenderCourses();
                } else {
                    throw new Error(data.message || 'Erro desconhecido');
                }
            } catch (error) {
                console.error('Error updating course:', error);
                window.showToast('Erro ao atualizar curso: ' + error.message, 'error');
            }
        });
    }
}

// Legacy function compatibility
function loadCourses() {
    return loadAndRenderCourses();
}

function renderCourses(courses) {
    return renderCoursesTable(courses);
}

// Utility functions for modal operations
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Global function exposure for HTML onclick handlers
window.refreshCourses = loadAndRenderCourses;
window.exportCourses = exportCourses;
window.openCourseModal = openCourseModal;
window.openNewCourseForm = openNewCourseForm;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.openModal = openModal;
window.closeModal = closeModal;
window.filterCourses = function() {
    const event = { target: document.getElementById('courseSearch') };
    handleCourseSearch(event);
};

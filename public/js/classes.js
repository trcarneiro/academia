// ==========================================
// CLASS MANAGEMENT MODULE (TURMAS)
// ==========================================

// Module-level state
let allClasses = []; // Cache for classes
let currentEditingClassId = null;
let currentEditingClass = null;

/**
 * Initializes all event listeners for the classes section.
 */
export function initClassEventListeners() {
    // Status filter functionality
    const classStatusFilter = document.getElementById('classStatusFilter');
    if (classStatusFilter) classStatusFilter.addEventListener('change', handleClassStatusFilter);

    // Class table event delegation
    const classesTableBody = document.getElementById('classesTableBody');
    if (classesTableBody) classesTableBody.addEventListener('click', handleClassTableClick);

    // Class detail modal listeners
    const closeDetailBtn = document.getElementById('closeClassDetailModalBtn');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeClassDetailModal);

    // Class modal tabs
    const classModalTabs = document.getElementById('class-modal-tabs');
    if (classModalTabs) classModalTabs.addEventListener('click', handleClassModalTabClick);

    // Initialize form handlers
    initClassFormHandlers();

    console.log('✅ Class event listeners initialized');
}

/**
 * Loads and renders the classes list dynamically from the API.
 */
export async function loadAndRenderClasses() {
    console.log('🔄 Loading classes from API...');
    
    // Show loading state
    showClassesLoadingState();
    
    try {
        const response = await fetch('/api/classes');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load classes');
        }
        
        // Store classes in cache
        allClasses = result.data || [];
        console.log(`✅ Loaded ${allClasses.length} classes from API`);
        
        // Render the classes table
        renderClassesTable(allClasses);
        
        // Hide loading state
        hideClassesLoadingState();
        
        // Update counters and other UI elements
        updateClassesCounter();
        updateClassesStats();
        
    } catch (error) {
        console.error('❌ Error loading classes:', error);
        showClassesErrorState(error.message);
    }
}

/**
 * Renders the classes table with the provided data.
 * @param {Array} classes - Array of class objects to render.
 */
function renderClassesTable(classes) {
    const tableBody = document.getElementById('classesTableBody');
    if (!tableBody) return;
    
    if (classes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">🏫</div>
                    <div>Nenhuma turma encontrada</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        Clique em "Nova Turma" para criar a primeira turma
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const html = classes.map(classItem => {
        const name = classItem.name || 'Nome não disponível';
        const courseName = classItem.course?.name || classItem.courseName || 'Curso não informado';
        const schedule = formatClassSchedule(classItem);
        const levels = formatClassLevels(classItem);
        const studentCount = classItem._count?.students || classItem.studentsCount || 0;
        const maxStudents = classItem.maxStudents || 20;
        const status = classItem.status || 'active';
        const statusInfo = getStatusInfo(status);
        const instructorName = classItem.instructor?.name || classItem.instructorName || 'N/A';
        
        return `
            <tr class="class-row" data-class-id="${classItem.id}" style="border-bottom: 1px solid #374151; cursor: pointer; transition: background-color 0.2s ease;" 
                onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'" 
                onmouseout="this.style.backgroundColor='transparent'">
                <td style="padding: 1rem; color: #F8FAFC; font-weight: 600;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="background: ${statusInfo.color}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">
                            ${classItem.shortCode || `T${classItem.id.substring(0, 2)}`}
                        </span>
                        ${name}
                    </div>
                    ${instructorName !== 'N/A' ? `<div style="font-size: 0.75rem; color: #94A3B8; margin-top: 0.25rem;">👨‍🏫 ${instructorName}</div>` : ''}
                </td>
                <td style="padding: 1rem; color: #CBD5E1;">
                    <div style="font-weight: 500;">${courseName}</div>
                    ${classItem.course?.category ? `<div style="font-size: 0.75rem; color: #94A3B8;">${classItem.course.category}</div>` : ''}
                </td>
                <td style="padding: 1rem; color: #CBD5E1;">
                    <div>${schedule.main}</div>
                    ${schedule.sub ? `<div style="font-size: 0.75rem; color: #94A3B8;">${schedule.sub}</div>` : ''}
                </td>
                <td style="padding: 1rem; color: #CBD5E1;">
                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                        ${levels}
                    </div>
                </td>
                <td style="padding: 1rem; color: #CBD5E1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="background: #3B82F6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">
                            ${studentCount}/${maxStudents}
                        </span>
                        alunos
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <span style="background: ${statusInfo.background}; color: ${statusInfo.textColor}; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${statusInfo.icon} ${statusInfo.text}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn" data-action="view" data-class-id="${classItem.id}" 
                                style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid #3B82F6; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Ver detalhes">
                            👁️ Ver
                        </button>
                        <button class="action-btn" data-action="edit" data-class-id="${classItem.id}" 
                                style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid #F59E0B; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Editar turma">
                            ✏️ Editar
                        </button>
                        <button class="action-btn" data-action="schedule" data-class-id="${classItem.id}" 
                                style="background: rgba(16, 185, 129, 0.1); color: #10B981; border: 1px solid #10B981; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Gerenciar agenda">
                            📅 Agenda
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = html;
    
    console.log(`✅ Rendered ${classes.length} classes in table`);
}

/**
 * Handles class status filter changes for real-time filtering.
 * @param {Event} event - The change event.
 */
function handleClassStatusFilter(event) {
    const selectedStatus = event.target.value;
    console.log(`🔍 Filtering classes by status: "${selectedStatus}"`);
    
    // If "all" is selected, show all classes
    if (selectedStatus === 'all') {
        renderClassesTable(allClasses);
        updateFilteredCounter(allClasses.length, allClasses.length);
        return;
    }
    
    // Filter classes based on selected status
    const filteredClasses = allClasses.filter(classItem => {
        const status = classItem.status || 'active';
        
        switch (selectedStatus) {
            case 'active':
                return status === 'active' || status === 'ongoing';
            case 'finished':
                return status === 'finished' || status === 'completed';
            case 'paused':
                return status === 'paused' || status === 'suspended';
            default:
                return true;
        }
    });
    
    console.log(`✅ Found ${filteredClasses.length} classes with status "${selectedStatus}"`);
    
    // Render filtered results
    renderClassesTable(filteredClasses);
    updateFilteredCounter(filteredClasses.length, allClasses.length);
}

/**
 * Handles clicks on the class table (event delegation).
 * @param {Event} event - The click event.
 */
function handleClassTableClick(event) {
    const actionBtn = event.target.closest('.action-btn');
    const classRow = event.target.closest('.class-row');
    
    if (actionBtn) {
        event.stopPropagation();
        const action = actionBtn.dataset.action;
        const classId = actionBtn.dataset.classId;
        
        switch (action) {
            case 'view':
                viewClassDetails(classId);
                break;
            case 'edit':
                editClass(classId);
                break;
            case 'schedule':
                manageClassSchedule(classId);
                break;
        }
    } else if (classRow) {
        // Double-click to open details
        const classId = classRow.dataset.classId;
        viewClassDetails(classId);
    }
}

/**
 * Views class details in a modal or page.
 * @param {string} classId - The ID of the class to view.
 */
async function viewClassDetails(classId) {
    const classItem = allClasses.find(c => c.id === classId);
    if (!classItem) {
        window.showToast('Erro: Turma não encontrada.', 'error');
        console.error(`Class with ID ${classId} not found in cache.`);
        return;
    }
    
    currentEditingClassId = classId;
    currentEditingClass = classItem;
    
    console.log('Opening details for class:', classItem);
    
    // For now, we'll open a simple details modal
    // This will be enhanced in Task 4
    await openClassDetailModal(classId);
}

/**
 * Opens the class detail modal with comprehensive class information.
 * @param {string} classId - The ID of the class to display.
 */
async function openClassDetailModal(classId) {
    try {
        // Fetch fresh class data from API
        const response = await fetch(`/api/classes/${classId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load class details');
        }
        
        const classData = result.data;
        
        // Create and show a detailed modal (simplified for now)
        const modalHtml = `
            <div id="classDetailModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div style="background: #0F172A; border-radius: 16px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; border: 1px solid #334155;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 2rem; border-radius: 16px 16px 0 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0; color: white; font-size: 1.5rem;">🏫 ${classData.name}</h2>
                                <p style="margin: 0.5rem 0 0 0; color: rgba(255,255,255,0.8);">${classData.course?.name || 'Curso não informado'}</p>
                            </div>
                            <button onclick="closeClassDetailModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; font-size: 1.5rem;">✕</button>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 2rem;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                            <div>
                                <h3 style="color: #F8FAFC; margin: 0 0 1rem 0;">📋 Informações Básicas</h3>
                                <div style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px;">
                                    <div style="margin-bottom: 0.5rem;"><strong style="color: #94A3B8;">Instrutor:</strong> <span style="color: #F8FAFC;">${classData.instructor?.name || 'N/A'}</span></div>
                                    <div style="margin-bottom: 0.5rem;"><strong style="color: #94A3B8;">Horário:</strong> <span style="color: #F8FAFC;">${formatClassSchedule(classData).main}</span></div>
                                    <div style="margin-bottom: 0.5rem;"><strong style="color: #94A3B8;">Capacidade:</strong> <span style="color: #F8FAFC;">${classData._count?.students || 0}/${classData.maxStudents || 'N/A'} alunos</span></div>
                                    <div><strong style="color: #94A3B8;">Status:</strong> <span style="color: ${getStatusInfo(classData.status).textColor};">${getStatusInfo(classData.status).text}</span></div>
                                </div>
                            </div>
                            <div>
                                <h3 style="color: #F8FAFC; margin: 0 0 1rem 0;">👥 Alunos Matriculados</h3>
                                <div id="classStudentsList" style="background: rgba(15, 23, 42, 0.5); padding: 1rem; border-radius: 8px; min-height: 150px;">
                                    <div style="text-align: center; color: #94A3B8; padding: 2rem;">
                                        <div style="margin-bottom: 0.5rem;">🔄</div>
                                        Carregando alunos...
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button onclick="closeClassDetailModal()" style="background: #374151; color: #F8FAFC; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Fechar</button>
                            <button onclick="editClass('${classId}')" style="background: #F59E0B; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">✏️ Editar Turma</button>
                            <button onclick="addStudentToClass('${classId}')" style="background: #059669; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">➕ Adicionar Aluno</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('classDetailModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Load students for this class
        await loadClassStudents(classId);
        
        console.log('✅ Class detail modal opened');
        
    } catch (error) {
        console.error('❌ Error opening class details:', error);
        window.showToast('Erro ao carregar detalhes da turma: ' + error.message, 'error');
    }
}

/**
 * Loads students for a specific class.
 * @param {string} classId - The ID of the class.
 */
async function loadClassStudents(classId) {
    try {
        const response = await fetch(`/api/classes/${classId}/students`);
        const result = await response.json();
        
        const studentsListEl = document.getElementById('classStudentsList');
        if (!studentsListEl) return;
        
        if (result.success && result.data.length > 0) {
            const studentsHtml = result.data.map(student => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #374151;">
                    <div>
                        <div style="color: #F8FAFC; font-weight: 500;">${student.user?.firstName || ''} ${student.user?.lastName || ''}</div>
                        <div style="color: #94A3B8; font-size: 0.875rem;">${student.user?.email || ''}</div>
                    </div>
                    <div style="color: #10B981; font-size: 0.875rem;">${student.status || 'Ativo'}</div>
                </div>
            `).join('');
            
            studentsListEl.innerHTML = studentsHtml;
        } else {
            studentsListEl.innerHTML = `
                <div style="text-align: center; color: #94A3B8; padding: 2rem;">
                    <div style="margin-bottom: 0.5rem;">👥</div>
                    Nenhum aluno matriculado nesta turma
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading class students:', error);
        const studentsListEl = document.getElementById('classStudentsList');
        if (studentsListEl) {
            studentsListEl.innerHTML = `
                <div style="text-align: center; color: #EF4444; padding: 2rem;">
                    <div style="margin-bottom: 0.5rem;">⚠️</div>
                    Erro ao carregar alunos
                </div>
            `;
        }
    }
}

/**
 * Closes the class detail modal.
 */
function closeClassDetailModal() {
    const modal = document.getElementById('classDetailModal');
    if (modal) {
        modal.remove();
    }
    currentEditingClassId = null;
    currentEditingClass = null;
}

// Utility functions for formatting and display
function formatClassSchedule(classItem) {
    if (classItem.schedule) {
        return {
            main: classItem.schedule,
            sub: classItem.startDate ? `Início: ${new Date(classItem.startDate).toLocaleDateString('pt-BR')}` : null
        };
    }
    
    // Try to construct from individual fields
    const days = classItem.days || classItem.weekdays;
    const time = classItem.time || classItem.startTime;
    
    if (days && time) {
        return {
            main: `${days} - ${time}`,
            sub: classItem.startDate ? `Início: ${new Date(classItem.startDate).toLocaleDateString('pt-BR')}` : null
        };
    }
    
    return {
        main: 'Horário não definido',
        sub: null
    };
}

function formatClassLevels(classItem) {
    const levels = classItem.levels || classItem.belts || [];
    
    if (levels.length === 0) {
        return '<span style="background: #6B7280; color: white; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">🥋 Todos os níveis</span>';
    }
    
    return levels.map(level => {
        const levelInfo = getLevelInfo(level);
        return `<span style="background: ${levelInfo.background}; color: ${levelInfo.color}; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">🥋 ${levelInfo.name}</span>`;
    }).join('');
}

function getLevelInfo(level) {
    const levelMap = {
        'white': { name: 'Branca', background: '#FFFFFF', color: '#000000' },
        'yellow': { name: 'Amarela', background: '#FDE047', color: '#000000' },
        'orange': { name: 'Laranja', background: '#FB923C', color: '#FFFFFF' },
        'green': { name: 'Verde', background: '#22C55E', color: '#FFFFFF' },
        'blue': { name: 'Azul', background: '#3B82F6', color: '#FFFFFF' },
        'brown': { name: 'Marrom', background: '#A3A3A3', color: '#FFFFFF' },
        'black': { name: 'Preta', background: '#000000', color: '#FFFFFF' }
    };
    
    return levelMap[level?.toLowerCase()] || { name: level || 'N/A', background: '#6B7280', color: '#FFFFFF' };
}

function getStatusInfo(status) {
    const statusMap = {
        'active': { text: 'Ativa', background: '#059669', textColor: 'white', color: '#059669', icon: '🟢' },
        'ongoing': { text: 'Em Andamento', background: '#059669', textColor: 'white', color: '#059669', icon: '🟢' },
        'finished': { text: 'Finalizada', background: '#6B7280', textColor: 'white', color: '#6B7280', icon: '✅' },
        'completed': { text: 'Concluída', background: '#6B7280', textColor: 'white', color: '#6B7280', icon: '✅' },
        'paused': { text: 'Pausada', background: '#F59E0B', textColor: 'white', color: '#F59E0B', icon: '⏸️' },
        'suspended': { text: 'Suspensa', background: '#EF4444', textColor: 'white', color: '#EF4444', icon: '⏹️' }
    };
    
    return statusMap[status] || statusMap['active'];
}

// Utility functions for loading states
function showClassesLoadingState() {
    const tableBody = document.getElementById('classesTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #059669;">
                        <div style="width: 16px; height: 16px; border: 2px solid #059669; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Carregando turmas...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideClassesLoadingState() {
    // Loading state is automatically hidden when table is re-rendered
}

function showClassesErrorState(message) {
    const tableBody = document.getElementById('classesTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #EF4444;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div>Erro ao carregar turmas</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        ${message}
                    </div>
                </td>
            </tr>
        `;
    }
}

function updateClassesCounter() {
    const counterEl = document.getElementById('classes-count');
    if (counterEl) {
        counterEl.textContent = allClasses.length;
    }
}

function updateFilteredCounter(filtered, total) {
    const counterEl = document.getElementById('classes-count');
    if (counterEl) {
        if (filtered === total) {
            counterEl.textContent = total;
        } else {
            counterEl.textContent = `${filtered}/${total}`;
        }
    }
}

function updateClassesStats() {
    // Update stats in the header
    const totalActiveClasses = allClasses.filter(c => c.status === 'active' || c.status === 'ongoing').length;
    const totalStudents = allClasses.reduce((sum, c) => sum + (c._count?.students || 0), 0);
    const activeCourses = new Set(allClasses.map(c => c.courseId).filter(Boolean)).size;
    
    const totalClassesCountEl = document.getElementById('totalClassesCount');
    const totalEnrolledStudentsEl = document.getElementById('totalEnrolledStudents');
    const activeBeltsEl = document.getElementById('activeBelts');
    
    if (totalClassesCountEl) totalClassesCountEl.textContent = totalActiveClasses;
    if (totalEnrolledStudentsEl) totalEnrolledStudentsEl.textContent = totalStudents;
    if (activeBeltsEl) activeBeltsEl.textContent = activeCourses;
}

// Class action functions
async function editClass(classId) {
    console.log('Editing class:', classId);
    
    try {
        // Load class data
        const response = await fetch(`/api/classes/${classId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            await openClassModal(result.data);
        } else {
            window.showToast('Erro ao carregar dados da turma', 'error');
        }
    } catch (error) {
        console.error('Error loading class:', error);
        window.showToast('Erro ao conectar com o servidor', 'error');
    }
}

function manageClassSchedule(classId) {
    console.log('Managing schedule for class:', classId);
    // TODO: Implement schedule management
    window.showToast('Função de agenda em desenvolvimento', 'info');
}

async function createNewClass() {
    console.log('Creating new class');
    await openClassModal();
}

async function addStudentToClass(classId) {
    console.log('Adding student to class:', classId);
    
    // Create and show student selection modal
    const modalHtml = `
        <div id="addStudentModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1001; display: flex; align-items: center; justify-content: center;">
            <div style="background: #0F172A; border-radius: 16px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; border: 1px solid #334155;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 1.5rem; border-radius: 16px 16px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; color: white; font-size: 1.25rem;">➕ Adicionar Aluno à Turma</h2>
                        <button onclick="closeAddStudentModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; font-size: 1.2rem;">✕</button>
                    </div>
                </div>
                
                <!-- Content -->
                <div style="padding: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Buscar Aluno</label>
                        <input type="text" id="studentSearchInput" placeholder="Digite o nome, email ou CPF do aluno..." 
                               style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;"
                               oninput="searchStudentsForClass()">
                    </div>
                    
                    <div id="studentSearchResults" style="min-height: 200px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; padding: 1rem;">
                        <div style="text-align: center; color: #94A3B8;">
                            Digite o nome do aluno para buscar...
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                        <button onclick="closeAddStudentModal()" style="background: #374151; color: #F8FAFC; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('addStudentModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Store the class ID for later use
    window.currentAddStudentClassId = classId;
}

/**
 * Opens the class creation/edit modal.
 * @param {Object} classData - Optional class data for editing.
 */
async function openClassModal(classData = null) {
    const isEditing = !!classData;
    const title = isEditing ? 'Editar Turma' : 'Nova Turma';
    
    try {
        // Load courses and instructors for the selects
        const [coursesResponse, instructorsResponse] = await Promise.all([
            fetch('/api/courses'),
            fetch('/api/instructors')
        ]);
        
        const coursesResult = await coursesResponse.json();
        const instructorsResult = await instructorsResponse.json();
        
        const courses = coursesResult.success ? coursesResult.data : [];
        const instructors = instructorsResult.success ? instructorsResult.data : [];
        
        const modalHtml = `
            <div id="classModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
                <div style="background: #0F172A; border-radius: 16px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; border: 1px solid #334155;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, ${isEditing ? '#F59E0B' : '#059669'}, ${isEditing ? '#D97706' : '#10B981'}); padding: 2rem; border-radius: 16px 16px 0 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h2 style="margin: 0; color: white; font-size: 1.5rem;">${isEditing ? '✏️' : '➕'} ${title}</h2>
                                <p style="margin: 0.5rem 0 0 0; color: rgba(255,255,255,0.8);">${isEditing ? 'Edite as informações da turma' : 'Crie uma nova turma para o curso'}</p>
                            </div>
                            <button onclick="closeClassModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; font-size: 1.5rem;">✕</button>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 2rem;">
                        <form id="classForm">
                            ${isEditing ? `<input type="hidden" id="classId" value="${classData.id}">` : ''}
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Nome da Turma *</label>
                                    <input type="text" id="className" required 
                                           value="${classData?.name || ''}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                           placeholder="Ex: Turma Manhã - Faixa Branca">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Curso *</label>
                                    <select id="classCourse" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                        <option value="">Selecione um curso</option>
                                        ${courses.map(course => `
                                            <option value="${course.id}" ${classData?.courseId === course.id ? 'selected' : ''}>
                                                ${course.name} - ${course.category || 'N/A'}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Instrutor</label>
                                    <select id="classInstructor" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                        <option value="">Selecione um instrutor</option>
                                        ${instructors.map(instructor => `
                                            <option value="${instructor.id}" ${classData?.instructorId === instructor.id ? 'selected' : ''}>
                                                ${instructor.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Capacidade Máxima</label>
                                    <input type="number" id="classMaxStudents" min="1" max="50" 
                                           value="${classData?.maxStudents || '20'}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                           placeholder="20">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Dias da Semana</label>
                                    <input type="text" id="classDays" 
                                           value="${classData?.days || classData?.schedule?.split(' - ')[0] || ''}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                           placeholder="Ex: Ter/Qui">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Horário</label>
                                    <input type="time" id="classTime" 
                                           value="${classData?.time || classData?.startTime || ''}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Duração (min)</label>
                                    <input type="number" id="classDuration" min="30" max="180" step="15" 
                                           value="${classData?.duration || '60'}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                           placeholder="60">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Data de Início</label>
                                    <input type="date" id="classStartDate" 
                                           value="${classData?.startDate ? new Date(classData.startDate).toISOString().split('T')[0] : ''}"
                                           style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Status</label>
                                    <select id="classStatus" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                        <option value="active" ${classData?.status === 'active' ? 'selected' : ''}>Ativa</option>
                                        <option value="paused" ${classData?.status === 'paused' ? 'selected' : ''}>Pausada</option>
                                        <option value="finished" ${classData?.status === 'finished' ? 'selected' : ''}>Finalizada</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 2rem;">
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Observações</label>
                                <textarea id="classNotes" rows="3" 
                                          style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC; resize: vertical;" 
                                          placeholder="Observações sobre a turma, requisitos especiais, etc.">${classData?.notes || classData?.description || ''}</textarea>
                            </div>
                            
                            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                                <button type="button" onclick="closeClassModal()" style="background: #374151; color: #F8FAFC; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
                                <button type="submit" style="background: ${isEditing ? '#F59E0B' : '#059669'}; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    ${isEditing ? '✏️ Atualizar Turma' : '➕ Criar Turma'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('classModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        console.log(`✅ Class modal opened for ${isEditing ? 'editing' : 'creation'}`);
        
    } catch (error) {
        console.error('❌ Error opening class modal:', error);
        window.showToast('Erro ao carregar dados para o modal: ' + error.message, 'error');
    }
}

/**
 * Closes the class modal.
 */
function closeClassModal() {
    const modal = document.getElementById('classModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Closes the add student modal.
 */
function closeAddStudentModal() {
    const modal = document.getElementById('addStudentModal');
    if (modal) {
        modal.remove();
    }
    window.currentAddStudentClassId = null;
}

/**
 * Searches for students to add to a class.
 */
async function searchStudentsForClass() {
    const searchInput = document.getElementById('studentSearchInput');
    const resultsContainer = document.getElementById('studentSearchResults');
    
    if (!searchInput || !resultsContainer) return;
    
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; color: #94A3B8;">
                Digite pelo menos 2 caracteres para buscar...
            </div>
        `;
        return;
    }
    
    try {
        resultsContainer.innerHTML = `
            <div style="text-align: center; color: #3B82F6;">
                <div style="margin-bottom: 0.5rem;">🔄</div>
                Buscando alunos...
            </div>
        `;
        
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchTerm)}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const studentsHtml = result.data.map(student => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #374151; border-radius: 8px; margin-bottom: 0.5rem; cursor: pointer; transition: background-color 0.2s;"
                     onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'"
                     onmouseout="this.style.backgroundColor='transparent'"
                     onclick="addStudentToClassConfirm('${student.id}', '${student.user?.firstName || ''} ${student.user?.lastName || ''}')">
                    <div>
                        <div style="color: #F8FAFC; font-weight: 500;">${student.user?.firstName || ''} ${student.user?.lastName || ''}</div>
                        <div style="color: #94A3B8; font-size: 0.875rem;">${student.user?.email || ''}</div>
                        <div style="color: #94A3B8; font-size: 0.75rem;">Categoria: ${student.category || 'N/A'}</div>
                    </div>
                    <button style="background: #059669; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                        ➕ Adicionar
                    </button>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = studentsHtml;
        } else {
            resultsContainer.innerHTML = `
                <div style="text-align: center; color: #94A3B8;">
                    <div style="margin-bottom: 0.5rem;">🔍</div>
                    Nenhum aluno encontrado com "${searchTerm}"
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching students:', error);
        resultsContainer.innerHTML = `
            <div style="text-align: center; color: #EF4444;">
                <div style="margin-bottom: 0.5rem;">⚠️</div>
                Erro ao buscar alunos
            </div>
        `;
    }
}

/**
 * Confirms adding a student to the class.
 * @param {string} studentId - The ID of the student to add.
 * @param {string} studentName - The name of the student.
 */
async function addStudentToClassConfirm(studentId, studentName) {
    if (!window.currentAddStudentClassId) {
        window.showToast('Erro: ID da turma não encontrado', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/classes/${window.currentAddStudentClassId}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast(`${studentName} foi adicionado à turma com sucesso!`, 'success');
            closeAddStudentModal();
            
            // Refresh the class details if modal is open
            if (document.getElementById('classDetailModal')) {
                await loadClassStudents(window.currentAddStudentClassId);
            }
            
            // Refresh the classes list
            await loadAndRenderClasses();
        } else {
            throw new Error(result.message || 'Erro ao adicionar aluno');
        }
    } catch (error) {
        console.error('Error adding student to class:', error);
        window.showToast('Erro ao adicionar aluno: ' + error.message, 'error');
    }
}

/**
 * Initializes class form submissions.
 */
export function initClassFormHandlers() {
    // The form handler will be attached when the modal is created
    // We need to use event delegation since the form is created dynamically
    document.addEventListener('submit', async function(e) {
        if (e.target.id === 'classForm') {
            e.preventDefault();
            await handleClassFormSubmit(e);
        }
    });
    
    console.log('✅ Class form handlers initialized');
}

/**
 * Handles class form submission.
 * @param {Event} event - The form submission event.
 */
async function handleClassFormSubmit(event) {
    event.preventDefault();
    
    const classId = document.getElementById('classId')?.value;
    const isEditing = !!classId;
    
    const formData = {
        name: document.getElementById('className').value,
        courseId: document.getElementById('classCourse').value,
        instructorId: document.getElementById('classInstructor').value || null,
        maxStudents: parseInt(document.getElementById('classMaxStudents').value) || 20,
        days: document.getElementById('classDays').value,
        time: document.getElementById('classTime').value,
        duration: parseInt(document.getElementById('classDuration').value) || 60,
        startDate: document.getElementById('classStartDate').value || null,
        status: document.getElementById('classStatus').value,
        notes: document.getElementById('classNotes').value
    };
    
    // Construct schedule from days and time
    if (formData.days && formData.time) {
        formData.schedule = `${formData.days} - ${formData.time}`;
    }
    
    try {
        const url = isEditing ? `/api/classes/${classId}` : '/api/classes';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast(`Turma ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, 'success');
            closeClassModal();
            
            // Auto-refresh classes list
            await loadAndRenderClasses();
        } else {
            throw new Error(result.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} turma`);
        }
    } catch (error) {
        console.error('Error saving class:', error);
        window.showToast('Erro ao salvar turma: ' + error.message, 'error');
    }
}

// Legacy function compatibility
export function loadClasses() {
    return loadAndRenderClasses();
}

// Global function exposure for HTML onclick handlers
window.loadAndRenderClasses = loadAndRenderClasses;
window.filterClasses = function() {
    const event = { target: document.getElementById('classStatusFilter') };
    handleClassStatusFilter(event);
};
window.viewClassDetails = viewClassDetails;
window.editClass = editClass;
window.manageClassSchedule = manageClassSchedule;
window.createNewClass = createNewClass;
window.closeClassDetailModal = closeClassDetailModal;
window.addStudentToClass = addStudentToClass;
window.closeClassModal = closeClassModal;
window.closeAddStudentModal = closeAddStudentModal;
window.searchStudentsForClass = searchStudentsForClass;
window.addStudentToClassConfirm = addStudentToClassConfirm;
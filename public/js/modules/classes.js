/**
 * CLASSES MODULE - ISOLATED JAVASCRIPT
 * Modulo isolado para gestão de turmas seguindo diretrizes CLAUDE.md
 * 
 * Funcionalidades:
 * - Listar turmas com filtros
 * - Criar/editar turmas
 * - Gerenciar horários e cursos
 * - Navegação full-screen
 * - API-First data handling
 */

// =============================================
// GLOBAL STATE MANAGEMENT
// =============================================

let classesState = {
    classes: [],
    filters: {
        status: 'all',
        martialArt: 'all'
    },
    loading: false,
    editingClass: null
};

// =============================================
// API FUNCTIONS
// =============================================

/**
 * Fetch classes from API
 */
async function fetchClasses() {
    try {
        classesState.loading = true;
        updateLoadingState(true);
        
        const response = await fetch('/api/classes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        classesState.classes = data.data || [];
        
        return data;
    } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        showNotification('Erro ao carregar turmas', 'error');
        
        // Fallback para dados em localStorage ou dados vazios
        const cachedData = localStorage.getItem('classes_cache');
        if (cachedData) {
            classesState.classes = JSON.parse(cachedData);
        } else {
            classesState.classes = [];
        }
        
        return { success: false, data: classesState.classes };
    } finally {
        classesState.loading = false;
        updateLoadingState(false);
    }
}

/**
 * Save class to API
 */
async function saveClassToAPI(classData) {
    try {
        const isEdit = classData.id;
        const url = isEdit ? `/api/classes/${classData.id}` : '/api/classes';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(classData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Update local state
        if (isEdit) {
            const index = classesState.classes.findIndex(c => c.id === classData.id);
            if (index !== -1) {
                classesState.classes[index] = result.data;
            }
        } else {
            classesState.classes.push(result.data);
        }
        
        // Update localStorage cache
        localStorage.setItem('classes_cache', JSON.stringify(classesState.classes));
        
        return result;
    } catch (error) {
        console.error('Erro ao salvar turma:', error);
        showNotification('Erro ao salvar turma', 'error');
        throw error;
    }
}

/**
 * Delete class from API
 */
async function deleteClassFromAPI(classId) {
    try {
        const response = await fetch(`/api/classes/${classId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Remove from local state
        classesState.classes = classesState.classes.filter(c => c.id !== classId);
        
        // Update localStorage cache
        localStorage.setItem('classes_cache', JSON.stringify(classesState.classes));
        
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar turma:', error);
        showNotification('Erro ao deletar turma', 'error');
        throw error;
    }
}

// =============================================
// CORE FUNCTIONS
// =============================================

/**
 * Initialize classes module
 */
function initClassesModule() {
    console.log('🏫 Inicializando módulo de Turmas');
    
    // Load classes data
    loadClassesData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update UI
    updateClassesDisplay();
    updateClassesStats();
}

/**
 * Load classes data
 */
async function loadClassesData() {
    await fetchClasses();
    updateClassesDisplay();
    updateClassesStats();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter change
    const filterSelect = document.getElementById('classStatusFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', handleFilterChange);
    }
    
    // Form submission
    const classForm = document.getElementById('classForm');
    if (classForm) {
        classForm.addEventListener('submit', handleFormSubmit);
    }
}

/**
 * Handle filter change
 */
function handleFilterChange(event) {
    classesState.filters.status = event.target.value;
    updateClassesDisplay();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = collectFormData();
        await saveClassToAPI(formData);
        
        showNotification('Turma salva com sucesso!', 'success');
        
        // Redirect back to classes list
        setTimeout(() => {
            window.location.href = 'classes.html';
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao salvar turma:', error);
        showNotification('Erro ao salvar turma', 'error');
    }
}

/**
 * Collect form data
 */
function collectFormData() {
    const formData = {
        id: document.getElementById('classId')?.value || null,
        name: document.getElementById('className').value,
        martialArt: document.getElementById('classMartialArt').value,
        capacity: parseInt(document.getElementById('classCapacity').value),
        instructor: document.getElementById('classInstructor').value,
        schedule: {
            days: [],
            startTime: document.getElementById('classStartTime').value,
            endTime: document.getElementById('classEndTime').value,
            startDate: document.getElementById('classStartDate').value,
            duration: parseInt(document.getElementById('classDuration').value)
        },
        includedCourses: []
    };
    
    // Collect selected days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const checkbox = document.getElementById(`class${day}`);
        if (checkbox && checkbox.checked) {
            formData.schedule.days.push(day.toLowerCase());
        }
    });
    
    // Collect included courses
    const courses = ['Branca', 'Amarela', 'Laranja'];
    courses.forEach(course => {
        const checkbox = document.getElementById(`include${course}`);
        if (checkbox && checkbox.checked) {
            formData.includedCourses.push(course.toLowerCase());
        }
    });
    
    return formData;
}

/**
 * Update classes display
 */
function updateClassesDisplay() {
    const tbody = document.getElementById('classesTableBody');
    if (!tbody) return;
    
    // Filter classes based on current filters
    const filteredClasses = filterClasses(classesState.classes);
    
    if (filteredClasses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🏫</div>
                    <p>Nenhuma turma encontrada</p>
                    <button onclick="createNewClass()" class="classes-isolated-btn classes-isolated-btn-primary" style="margin-top: 1rem;">
                        <span>➕</span> Criar Primeira Turma
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredClasses.map(classItem => `
        <tr>
            <td>
                <div class="classes-isolated-class-info">
                    <span class="classes-isolated-class-badge ${getClassBadgeColor(classItem.id)}">${classItem.code || `T${classItem.id}`}</span>
                    ${classItem.name}
                </div>
            </td>
            <td class="classes-isolated-text-secondary">${formatMartialArt(classItem.martialArt)}</td>
            <td class="classes-isolated-text-secondary">
                <div>${formatSchedule(classItem.schedule)}</div>
                <div class="classes-isolated-text-small">Início: ${formatDate(classItem.startDate)}</div>
            </td>
            <td class="classes-isolated-text-secondary">
                <div class="classes-isolated-belt-tags">
                    ${classItem.includedCourses?.map(course => `
                        <span class="classes-isolated-belt-tag classes-isolated-belt-${course}">${formatBeltEmoji(course)} ${formatBeltName(course)}</span>
                    `).join('') || '<span class="classes-isolated-text-small">Nenhum curso</span>'}
                </div>
            </td>
            <td class="classes-isolated-text-secondary">
                <div class="classes-isolated-student-count">
                    <span class="classes-isolated-count-badge">${classItem.enrolledStudents || 0}/${classItem.capacity}</span>
                    alunos
                </div>
            </td>
            <td>
                <span class="classes-isolated-status-badge ${getStatusBadgeClass(classItem.status)}">${formatStatus(classItem.status)}</span>
            </td>
            <td>
                <div class="classes-isolated-action-buttons">
                    <button onclick="viewClassDetails(${classItem.id})" class="classes-isolated-btn-small classes-isolated-btn-secondary">👁️ Ver</button>
                    <button onclick="editClass(${classItem.id})" class="classes-isolated-btn-small classes-isolated-btn-primary">✏️ Editar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update classes statistics
 */
function updateClassesStats() {
    // Calculate stats from current data
    const totalClasses = classesState.classes.filter(c => c.status === 'active').length;
    const totalStudents = classesState.classes.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
    const activeBelts = getUniqueBelts(classesState.classes).length;
    const averageAttendance = calculateAverageAttendance(classesState.classes);
    
    // Update UI elements
    updateStatElement('totalClassesCount', totalClasses);
    updateStatElement('totalEnrolledStudents', totalStudents);
    updateStatElement('activeBelts', activeBelts);
    updateStatElement('attendanceRate', `${averageAttendance}%`);
}

// =============================================
// ACTION FUNCTIONS
// =============================================

/**
 * Create new class
 */
function createNewClass() {
    window.location.href = 'class-editor.html?mode=create';
}

/**
 * Edit existing class
 */
function editClass(classId) {
    window.location.href = `class-editor.html?mode=edit&id=${classId}`;
}

/**
 * View class details
 */
function viewClassDetails(classId) {
    // For now, show alert - in full implementation would navigate to details page
    showNotification(`🚧 Visualizando detalhes da Turma ${classId}\n\nInformações disponíveis:\n• Lista de alunos\n• Progresso da turma\n• Histórico de frequência\n• Avaliações realizadas`, 'info');
}

/**
 * Manage class schedule
 */
function manageClassSchedule(classId) {
    // For now, show alert - in full implementation would navigate to schedule page
    showNotification(`🚧 Gerenciando agenda da Turma ${classId}\n\nFuncionalidades:\n• Reagendar aulas\n• Marcar faltas do instrutor\n• Aulas de reposição\n• Alterações de horário`, 'info');
}

/**
 * View class schedule overview
 */
function viewClassSchedule() {
    showNotification('🚧 Função em desenvolvimento: Cronograma de Turmas\n\nExibirá:\n• Calendário completo\n• Aulas agendadas\n• Conflitos de horário\n• Feriados e pausas', 'info');
}

/**
 * Filter classes
 */
function filterClasses() {
    const filter = document.getElementById('classStatusFilter')?.value || 'all';
    classesState.filters.status = filter;
    updateClassesDisplay();
}

/**
 * Load class data for editing
 */
async function loadClassData(classId) {
    try {
        const classData = classesState.classes.find(c => c.id == classId);
        if (classData) {
            populateForm(classData);
        } else {
            // Try to fetch from API
            const response = await fetch(`/api/classes/${classId}`);
            if (response.ok) {
                const data = await response.json();
                populateForm(data.data);
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados da turma:', error);
        showNotification('Erro ao carregar dados da turma', 'error');
    }
}

/**
 * Populate form with class data
 */
function populateForm(classData) {
    document.getElementById('classId').value = classData.id || '';
    document.getElementById('className').value = classData.name || '';
    document.getElementById('classMartialArt').value = classData.martialArt || '';
    document.getElementById('classCapacity').value = classData.capacity || 20;
    document.getElementById('classInstructor').value = classData.instructor || '';
    
    // Schedule data
    if (classData.schedule) {
        document.getElementById('classStartTime').value = classData.schedule.startTime || '18:00';
        document.getElementById('classEndTime').value = classData.schedule.endTime || '19:00';
        document.getElementById('classStartDate').value = classData.schedule.startDate || '';
        document.getElementById('classDuration').value = classData.schedule.duration || 24;
        
        // Days of week
        if (classData.schedule.days) {
            classData.schedule.days.forEach(day => {
                const checkbox = document.getElementById(`class${day.charAt(0).toUpperCase() + day.slice(1)}`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }
    
    // Included courses
    if (classData.includedCourses) {
        classData.includedCourses.forEach(course => {
            const checkbox = document.getElementById(`include${course.charAt(0).toUpperCase() + course.slice(1)}`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

/**
 * Cancel edit
 */
function cancelEdit() {
    if (confirm('Deseja cancelar? Todas as alterações não salvas serão perdidas.')) {
        window.location.href = 'classes.html';
    }
}

/**
 * Save class
 */
async function saveClass() {
    const form = document.getElementById('classForm');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    }
}

/**
 * Delete class
 */
async function deleteClass() {
    const classId = document.getElementById('classId')?.value;
    if (!classId) return;
    
    if (confirm('Tem certeza que deseja deletar esta turma? Esta ação não pode ser desfeita.')) {
        try {
            await deleteClassFromAPI(classId);
            showNotification('Turma deletada com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'classes.html';
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao deletar turma:', error);
        }
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Filter classes based on current filters
 */
function filterClasses(classes) {
    return classes.filter(classItem => {
        if (classesState.filters.status !== 'all' && classItem.status !== classesState.filters.status) {
            return false;
        }
        return true;
    });
}

/**
 * Get class badge color
 */
function getClassBadgeColor(classId) {
    const colors = ['classes-isolated-badge-green', 'classes-isolated-badge-purple'];
    return colors[(classId - 1) % colors.length];
}

/**
 * Format martial art name
 */
function formatMartialArt(martialArt) {
    const mappings = {
        'KRAV_MAGA': 'Krav Maga',
        'JIU_JITSU': 'Jiu-Jitsu',
        'BOXING': 'Boxe',
        'MUAY_THAI': 'Muay Thai',
        'KARATE': 'Karatê',
        'TAEKWONDO': 'Taekwondo'
    };
    return mappings[martialArt] || martialArt;
}

/**
 * Format schedule
 */
function formatSchedule(schedule) {
    if (!schedule || !schedule.days) return 'Não definido';
    
    const dayMappings = {
        'monday': 'Seg',
        'tuesday': 'Ter',
        'wednesday': 'Qua',
        'thursday': 'Qui',
        'friday': 'Sex',
        'saturday': 'Sáb'
    };
    
    const days = schedule.days.map(day => dayMappings[day] || day).join('/');
    const time = schedule.startTime ? ` - ${schedule.startTime}h` : '';
    
    return `${days}${time}`;
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '01/06/2025'; // Default date
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return dateString;
    }
}

/**
 * Format belt emoji
 */
function formatBeltEmoji(belt) {
    const mappings = {
        'branca': '🤍',
        'amarela': '💛',
        'laranja': '🧡',
        'white': '🤍',
        'yellow': '💛',
        'orange': '🧡'
    };
    return mappings[belt.toLowerCase()] || '🥋';
}

/**
 * Format belt name
 */
function formatBeltName(belt) {
    const mappings = {
        'branca': 'Branca',
        'amarela': 'Amarela',
        'laranja': 'Laranja',
        'white': 'Branca',
        'yellow': 'Amarela',
        'orange': 'Laranja'
    };
    return mappings[belt.toLowerCase()] || belt;
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
    const mappings = {
        'active': 'classes-isolated-status-active',
        'finished': 'classes-isolated-status-finished',
        'paused': 'classes-isolated-status-paused'
    };
    return mappings[status] || 'classes-isolated-status-active';
}

/**
 * Format status
 */
function formatStatus(status) {
    const mappings = {
        'active': '🟢 Ativa',
        'finished': '🔴 Finalizada',
        'paused': '🟡 Pausada'
    };
    return mappings[status] || '🟢 Ativa';
}

/**
 * Get unique belts
 */
function getUniqueBelts(classes) {
    const belts = new Set();
    classes.forEach(classItem => {
        if (classItem.includedCourses) {
            classItem.includedCourses.forEach(course => belts.add(course));
        }
    });
    return Array.from(belts);
}

/**
 * Calculate average attendance
 */
function calculateAverageAttendance(classes) {
    if (classes.length === 0) return 85; // Default value
    
    const attendanceSum = classes.reduce((sum, classItem) => {
        return sum + (classItem.attendanceRate || 85);
    }, 0);
    
    return Math.round(attendanceSum / classes.length);
}

/**
 * Update stat element
 */
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Update loading state
 */
function updateLoadingState(isLoading) {
    const tbody = document.getElementById('classesTableBody');
    if (!tbody) return;
    
    if (isLoading) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div style="color: #3B82F6;">🔄 Carregando turmas...</div>
                </td>
            </tr>
        `;
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Simple alert for now - in full implementation would use toast notification
    if (type === 'error') {
        alert(`❌ ${message}`);
    } else if (type === 'success') {
        alert(`✅ ${message}`);
    } else {
        alert(`ℹ️ ${message}`);
    }
}

// =============================================
// MODULE INITIALIZATION
// =============================================

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏫 Classes module DOM ready');
    initClassesModule();
});

// Expose functions globally for HTML onclick handlers
window.createNewClass = createNewClass;
window.editClass = editClass;
window.viewClassDetails = viewClassDetails;
window.manageClassSchedule = manageClassSchedule;
window.viewClassSchedule = viewClassSchedule;
window.filterClasses = filterClasses;
window.loadClassData = loadClassData;
window.cancelEdit = cancelEdit;
window.saveClass = saveClass;
window.deleteClass = deleteClass;

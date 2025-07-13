// ==========================================
// STUDENT MANAGEMENT MODULE
// ==========================================

// Module-level state
let currentEditingStudentId = null;
let currentEditingStudent = null;
let allStudents = []; // Cache for students
let currentView = 'table'; // 'table' or 'grid'

// ==============================================
// STUDENT TABS STRUCTURE - UX ARCHITECTED
// ==============================================

const STUDENT_TABS = {
    profile: { 
        id: 'profile',
        name: '👤 Perfil', 
        description: 'Dados pessoais e acadêmicos',
        loader: 'loadProfileTab'
    },
    financial: { 
        id: 'financial',
        name: '💳 Financeiro', 
        description: 'Planos, assinaturas e pagamentos',
        loader: 'loadFinancialTab'
    },
    enrollments: { 
        id: 'enrollments',
        name: '📚 Cursos Matriculados', 
        description: 'Cursos inclusos no plano ativo',
        loader: 'loadEnrollmentsTab'
    },
    classes: { 
        id: 'classes',
        name: '🏫 Turmas Ativas',
        description: 'Turmas específicas frequentadas',
        loader: 'loadClassesTab'
    },
    progress: { 
        id: 'progress',
        name: '📊 Progresso Geral',
        description: 'Evolução acadêmica e gamificação',
        loader: 'loadProgressTab'
    },
    insights: { 
        id: 'insights',
        name: '🤖 Dashboard IA',
        description: 'Insights e recomendações',
        loader: 'loadInsightsTab'
    }
};

// ==============================================
// CENTRALIZED STATE MANAGEMENT SYSTEM
// ==============================================

// Student data cache for tabs
let studentDataCache = {
    subscription: null,
    enrollments: null,
    courses: null,
    classes: null,
    plan: null
};

/**
 * Centralized function to set current editing student
 * This is the single source of truth for student state
 */
export function setCurrentEditingStudent(studentId, studentData = null) {
    console.log('🎯 Setting current editing student:', studentId);
    
    // Clear cache when changing student
    if (currentEditingStudentId !== studentId) {
        clearStudentDataCache();
    }
    
    // Set all references to ensure compatibility
    currentEditingStudentId = studentId;
    currentEditingStudent = studentData;
    window.currentEditingStudentId = studentId;
    
    // Set DOM attributes for compatibility with HTML functions
    const editForm = document.getElementById('editStudentForm') || document.getElementById('editPageStudentForm');
    if (editForm) {
        editForm.dataset.editingStudentId = studentId;
    }
    
    // Set global variable for HTML scope
    if (typeof window.currentEditingStudent !== 'undefined') {
        window.currentEditingStudent = studentData;
    }
    
    console.log('✅ Student state centralized:', {
        moduleId: currentEditingStudentId,
        windowId: window.currentEditingStudentId,
        hasStudentData: !!currentEditingStudent
    });
}

/**
 * Get current editing student ID from any available source
 */
export function getCurrentEditingStudentId() {
    const studentId = currentEditingStudentId || 
                     window.currentEditingStudentId ||
                     document.getElementById('editStudentForm')?.dataset?.editingStudentId ||
                     document.getElementById('editPageStudentForm')?.dataset?.editingStudentId;
    
    console.log('🔍 Getting current student ID:', studentId);
    return studentId;
}

/**
 * Clear student data cache
 */
function clearStudentDataCache() {
    console.log('🧹 Clearing student data cache');
    studentDataCache = {
        subscription: null,
        enrollments: null,
        courses: null,
        classes: null,
        plan: null
    };
}

// ==============================================
// STUDENT DATA LOADING FUNCTIONS
// ==============================================

/**
 * Load student subscription/plan data
 */
export async function getCurrentStudentSubscription() {
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    if (studentDataCache.subscription) {
        console.log('📦 Using cached subscription data');
        return studentDataCache.subscription;
    }

    console.log('🔄 Loading student subscription from API...');
    const response = await fetch(`/api/students/${studentId}/subscription`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!data.success) {
        throw new Error(data.message || 'Falha ao carregar dados da assinatura');
    }

    studentDataCache.subscription = data.data;
    studentDataCache.plan = data.data?.plan || null;
    
    console.log('✅ Subscription loaded and cached:', data.data);
    return data.data;
}

/**
 * Load student enrollments
 */
export async function getCurrentStudentEnrollments() {
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    if (studentDataCache.enrollments) {
        console.log('📦 Using cached enrollments data');
        return studentDataCache.enrollments;
    }

    console.log('🔄 Loading student enrollments from API...');
    const response = await fetch(`/api/students/${studentId}/enrollments`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!data.success) {
        throw new Error(data.message || 'Falha ao carregar matrículas');
    }

    studentDataCache.enrollments = data.data;
    console.log('✅ Enrollments loaded and cached:', data.data);
    return data.data;
}

/**
 * Load complete subscription details for current student
 */
export async function getCurrentStudentSubscriptionDetails() {
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    console.log('🔄 Loading complete subscription details...');
    
    try {
        // Get the subscription with plan and course details
        const subscription = await getCurrentStudentSubscription();
        
        if (!subscription || !subscription.plan) {
            console.log('💳 No active subscription found');
            return {
                hasSubscription: false,
                subscription: null,
                plan: null,
                courses: [],
                paymentStatus: 'NO_SUBSCRIPTION'
            };
        }

        // Get detailed course information
        const courses = await getCurrentStudentCourses();

        return {
            hasSubscription: true,
            subscription: subscription,
            plan: subscription.plan,
            courses: courses,
            paymentStatus: subscription.status || 'UNKNOWN',
            nextPaymentDate: subscription.nextPaymentDate,
            paymentMethod: subscription.paymentMethod,
            startDate: subscription.startDate,
            notes: subscription.notes
        };

    } catch (error) {
        console.error('❌ Error loading subscription details:', error);
        return {
            hasSubscription: false,
            subscription: null,
            plan: null,
            courses: [],
            paymentStatus: 'ERROR',
            error: error.message
        };
    }
}

/**
 * Load courses from student's active plan with full details
 */
export async function getCurrentStudentCourses() {
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    if (studentDataCache.courses) {
        console.log('📦 Using cached courses data');
        return studentDataCache.courses;
    }

    console.log('🔄 Loading student courses from plan...');
    
    // First get the subscription to find the active plan
    const subscription = await getCurrentStudentSubscription();
    
    if (!subscription || !subscription.plan) {
        console.log('📚 No active plan found');
        return [];
    }

    const plan = subscription.plan;
    console.log('📚 Found active plan:', plan.name);

    // Get plan details with course information
    const planResponse = await fetch(`/api/billing-plans/${plan.id}`);
    const planData = await planResponse.json();

    if (!planResponse.ok) {
        throw new Error(`API Error: ${planResponse.status} ${planResponse.statusText}`);
    }

    if (!planData.success) {
        throw new Error(planData.message || 'Falha ao carregar dados do plano');
    }

    // Extract course IDs from plan
    const courseIds = [];
    const planDetails = planData.data;
    
    if (planDetails.courseId) {
        courseIds.push(planDetails.courseId);
    }
    
    if (planDetails.features?.courseIds?.length) {
        planDetails.features.courseIds.forEach(courseId => {
            if (!courseIds.includes(courseId)) {
                courseIds.push(courseId);
            }
        });
    }

    // Now fetch full course details for each course ID
    const coursesWithDetails = [];
    
    for (const courseId of courseIds) {
        try {
            console.log(`🔍 Fetching details for course ${courseId}...`);
            const courseResponse = await fetch(`/api/courses-management/`);
            const courseData = await courseResponse.json();
            
            if (courseResponse.ok && courseData.success) {
                // Find the specific course in the list
                const course = courseData.data.courses.find(c => c.id === courseId);
                if (course) {
                    coursesWithDetails.push({
                        id: courseId,
                        name: course.name,
                        description: course.description,
                        level: course.level,
                        duration: course.duration,
                        totalClasses: course.totalClasses,
                        isActive: course.isActive,
                        fromPlan: true
                    });
                    console.log(`✅ Found course: ${course.name}`);
                } else {
                    // Course not found, add with ID only
                    coursesWithDetails.push({
                        id: courseId,
                        name: `Curso não encontrado (ID: ${courseId})`,
                        description: 'Detalhes não disponíveis',
                        level: 'N/A',
                        fromPlan: true
                    });
                    console.log(`⚠️ Course ${courseId} not found in courses list`);
                }
            } else {
                // API error, add with ID only
                coursesWithDetails.push({
                    id: courseId,
                    name: `Curso ID: ${courseId}`,
                    description: 'Erro ao carregar detalhes',
                    level: 'N/A', 
                    fromPlan: true
                });
            }
        } catch (error) {
            console.error(`❌ Error fetching course ${courseId}:`, error);
            // Add course with error info
            coursesWithDetails.push({
                id: courseId,
                name: `Curso ID: ${courseId}`,
                description: 'Erro de conexão',
                level: 'N/A',
                fromPlan: true
            });
        }
    }

    studentDataCache.courses = coursesWithDetails;
    console.log('✅ Courses with details loaded and cached:', coursesWithDetails);
    return coursesWithDetails;
}

/**
 * Load available classes for student
 */
export async function getCurrentStudentClasses() {
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    if (studentDataCache.classes) {
        console.log('📦 Using cached classes data');
        return studentDataCache.classes;
    }

    console.log('🔄 Loading available classes...');
    
    // Get student courses first
    const courses = await getCurrentStudentCourses();
    
    // Get all available classes
    const response = await fetch('/api/classes/');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!data.success) {
        throw new Error(data.message || 'Falha ao carregar turmas');
    }

    // Filter classes by student's courses
    const courseIds = courses.map(c => c.id);
    const relevantClasses = data.data.filter(classItem => 
        courseIds.includes(classItem.courseId)
    );

    studentDataCache.classes = relevantClasses;
    console.log('✅ Classes loaded and cached:', relevantClasses);
    return relevantClasses;
}

/**
 * Initializes all event listeners for the students section.
 */
export function initStudentEventListeners() {
    // Search and View
    const studentSearch = document.getElementById('studentSearch');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    
    if (studentSearch) studentSearch.addEventListener('keyup', filterStudents);
    if (tableViewBtn) tableViewBtn.addEventListener('click', () => switchStudentView('table'));
    if (gridViewBtn) gridViewBtn.addEventListener('click', () => switchStudentView('grid'));

    // Add/Edit Modal (Simple)
    const openAddStudentModalBtn = document.getElementById('openAddStudentModalBtn');
    const openAddStudentModalBtnEmpty = document.getElementById('openAddStudentModalBtnEmpty');
    
    if (openAddStudentModalBtn) openAddStudentModalBtn.addEventListener('click', openAddStudentModal);
    if (openAddStudentModalBtnEmpty) openAddStudentModalBtnEmpty.addEventListener('click', openAddStudentModal);

    // Listeners for the simple "Add/Edit Student" modal
    const closeBtn = document.getElementById('closeStudentModalBtn');
    const cancelBtn = document.getElementById('cancelStudentBtn');
    const studentForm = document.getElementById('studentForm');

    if (closeBtn) closeBtn.addEventListener('click', closeStudentModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeStudentModal);
    if (studentForm) studentForm.addEventListener('submit', handleStudentFormSubmit);

    // Listeners for the main student list (event delegation)
    const studentsTableBody = document.getElementById('studentsTableBody');
    const studentsGrid = document.getElementById('studentsGrid');

    if (studentsTableBody) studentsTableBody.addEventListener('dblclick', handleStudentDoubleClick);
    if (studentsGrid) studentsGrid.addEventListener('dblclick', handleStudentDoubleClick);

    // Architecture-compliant: No detail modals, only full-screen editing


    // TODO: Add listeners for the rest of the student section interactions
}

/**
 * Filters the students list based on the search input.
 */
function filterStudents(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log(`🔍 Filtering students with: "${searchTerm}"`);
    
    // If no search term, show all students
    if (!searchTerm) {
        renderStudentsTable(allStudents);
        renderStudentsGrid(allStudents);
        updateFilteredCounter(allStudents.length, allStudents.length);
        return;
    }
    
    // Filter students based on search term
    const filteredStudents = allStudents.filter(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const cpf = (user.cpf || '').toLowerCase();
        const category = (student.category || '').toLowerCase();
        const studentId = student.id.toLowerCase();
        
        return (
            fullName.includes(searchTerm) ||
            email.includes(searchTerm) ||
            phone.includes(searchTerm) ||
            cpf.includes(searchTerm) ||
            category.includes(searchTerm) ||
            studentId.includes(searchTerm)
        );
    });
    
    console.log(`✅ Found ${filteredStudents.length} students matching "${searchTerm}"`);
    
    // Re-render with filtered results
    renderStudentsTable(filteredStudents);
    renderStudentsGrid(filteredStudents);
    updateFilteredCounter(filteredStudents.length, allStudents.length);
}

/**
 * Updates the counter showing filtered results.
 * @param {number} filteredCount - Number of filtered students.
 * @param {number} totalCount - Total number of students.
 */
function updateFilteredCounter(filteredCount, totalCount) {
    const searchInfo = document.getElementById('studentsSearchInfo');
    if (searchInfo) {
        if (filteredCount === totalCount) {
            searchInfo.textContent = `${totalCount} alunos`;
        } else {
            searchInfo.textContent = `${filteredCount} de ${totalCount} alunos`;
        }
    }
}

/**
 * Switches the student list view between table and grid.
 * @param {string} view - The view to switch to ('table' or 'grid').
 */
function switchStudentView(view) {
    if (currentView === view) return;
    currentView = view;

    const tableViewBtn = document.getElementById('tableViewBtn');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const studentsTable = document.getElementById('studentsTable');
    const studentsGrid = document.getElementById('studentsGrid');

    if (view === 'table') {
        tableViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        studentsTable.style.display = '';
        studentsGrid.style.display = 'none';
    } else {
        tableViewBtn.classList.remove('active');
        gridViewBtn.classList.add('active');
        studentsTable.style.display = 'none';
        studentsGrid.style.display = '';
    }
    console.log(`Switched to ${view} view`);
}

/**
 * Handles clicks on the student list (table or grid) using event delegation.
 * @param {Event} event - The click event.
 */
/**
 * Handles double-click on student table/grid to navigate to full-screen edit page
 * Following agents.md PILLAR III: FULL-SCREEN UI - No modals for editing
 */
function handleStudentDoubleClick(event) {
    const target = event.target.closest('[data-student-id]');
    if (target) {
        const studentId = target.dataset.studentId;
        console.log(`Student double-clicked: ${studentId} - Opening full-screen edit page`);
        
        // Architecture-compliant: direct function call, no global pollution
        openStudentEditPage(studentId);
    }
}






/**
 * Opens the modal to add a new student.
 */
function openAddStudentModal() {
    console.log('Opening add student modal...');
    const modal = document.getElementById('studentModal');
    if (modal) {
        document.getElementById('studentModalTitle').textContent = 'Adicionar Novo Aluno';
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        modal.style.display = 'block';
    }
}

/**
 * Closes the simple "Add/Edit Student" modal.
 */
function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Handles the submission of the student form.
 * @param {Event} event - The form submission event.
 */
async function handleStudentFormSubmit(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('saveStudentBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>💾</span> Salvando...';

    const form = event.target;
    const studentId = form.elements.studentId.value;
    
    const formData = {
        firstName: form.elements.firstName.value,
        lastName: form.elements.lastName.value,
        email: form.elements.email.value,
        phone: form.elements.phone.value,
        birthDate: form.elements.birthDate.value,
        gender: form.elements.gender.value,
        category: form.elements.category.value,
        status: form.elements.status.value,
        // Add other fields as necessary
    };

    const method = studentId ? 'PUT' : 'POST';
    const url = studentId ? `/api/students/${studentId}` : '/api/students';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            window.showToast(`Aluno ${studentId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            closeStudentModal();
            // Auto-refresh student list after successful save
            await loadAndRenderStudents();
        } else {
            throw new Error(result.message || `Erro ao ${studentId ? 'atualizar' : 'criar'} aluno.`);
        }
    } catch (error) {
        console.error('Erro ao salvar aluno:', error);
        window.showToast(error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> Salvar Alterações';
    }
}

/**
 * Sets the student cache.
 * @param {Array} students - The array of student objects.
 */
export function setAllStudents(students) {
    allStudents = students;
}

/**
 * Loads and renders the students list dynamically from the API.
 */
export async function loadAndRenderStudents() {
    console.log('🔄 [DEBUG] loadAndRenderStudents called - starting student data loading process...');
    console.log('🔄 Loading students from API...');
    
    // Show loading state
    showStudentsLoadingState();
    
    try {
        const response = await fetch('/api/students');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load students');
        }
        
        // Store students in cache
        allStudents = result.data || [];
        console.log(`✅ Loaded ${allStudents.length} students from API`);
        
        // Render both table and grid views
        console.log('🔄 [DEBUG] About to render table and grid views...');
        const tableRenderResult = renderStudentsTable(allStudents);
        console.log(`🔄 [DEBUG] Table render completed: ${tableRenderResult}`);
        const gridRenderResult = renderStudentsGrid(allStudents);
        console.log(`🔄 [DEBUG] Grid render completed: ${gridRenderResult}`);
        
        console.log(`🎨 Table render result: ${tableRenderResult}, Grid render result: ${gridRenderResult}`);
        
        // Hide loading state
        hideStudentsLoadingState();
        
        // Update counters and other UI elements
        updateStudentsCounter();
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        showStudentsErrorState(error.message);
    }
}

/**
 * Renders the students table with the provided data.
 * @param {Array} students - Array of student objects to render.
 */
function renderStudentsTable(students) {
    console.log(`🔄 [DEBUG] renderStudentsTable called with ${students?.length || 0} students`);
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) {
        console.error('❌ studentsTableBody element not found in DOM');
        return false;
    }
    
    console.log(`🔄 Rendering ${students.length} students in table`);
    
    try {
    
    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">👥</div>
                    <div>Nenhum aluno encontrado</div>
                </td>
            </tr>
        `;
        return;
    }
    
    const html = students.map(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
        const category = student.category || 'N/A';
        const status = student.isActive ? 'Ativo' : 'Inativo';
        const statusColor = student.isActive ? '#10B981' : '#EF4444';
        const financialResponsible = student.financialResponsible?.name || 'Próprio aluno';
        
        return `
            <tr data-student-id="${student.id}" style="cursor: pointer; transition: background-color 0.2s;" 
                onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'" 
                onmouseout="this.style.backgroundColor='transparent'">
                <td style="font-family: monospace; font-size: 0.85rem;">${student.id.split('-')[0]}...</td>
                <td style="font-weight: 500; color: #F8FAFC;">${fullName}</td>
                <td style="font-family: monospace; font-size: 0.85rem;">${user.cpf || 'N/A'}</td>
                <td>
                    <span style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                        ${category}
                    </span>
                </td>
                <td style="color: #94A3B8;">${financialResponsible}</td>
                <td>
                    <span style="color: ${statusColor}; font-weight: 500;">●</span>
                    <span style="color: ${statusColor}; margin-left: 0.25rem;">${status}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="event.stopPropagation(); openStudentEditPage('${student.id}')" 
                                style="background: #3B82F6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                title="Editar">
                            ✏️
                        </button>
                        <button onclick="event.stopPropagation(); confirmQuickCheckin('${student.id}', '${fullName}', '${student.id.split('-')[0]}')" 
                                style="background: #10B981; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                title="Check-in rápido">
                            ✅
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = html;
    console.log(`✅ Successfully rendered ${students.length} students in table`);
    return true;
    
    } catch (error) {
        console.error('❌ Error rendering students table:', error);
        return false;
    }
}

/**
 * Renders the students grid with the provided data.
 * @param {Array} students - Array of student objects to render.
 */
function renderStudentsGrid(students) {
    console.log(`🔄 [DEBUG] renderStudentsGrid called with ${students?.length || 0} students`);
    const grid = document.getElementById('studentsGrid');
    if (!grid) {
        console.error('❌ studentsGrid element not found in DOM');
        return false;
    }
    
    console.log(`🔄 Rendering ${students.length} students in grid`);
    
    try {
    
    if (students.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6B7280; grid-column: 1 / -1;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">👥</div>
                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Nenhum aluno encontrado</div>
                <div style="font-size: 0.9rem;">Adicione seu primeiro aluno para começar</div>
            </div>
        `;
        return;
    }
    
    const html = students.map(student => {
        const user = student.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
        const category = student.category || 'N/A';
        const status = student.isActive ? 'Ativo' : 'Inativo';
        const statusColor = student.isActive ? '#10B981' : '#EF4444';
        const avatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&size=80`;
        
        return `
            <div data-student-id="${student.id}" 
                 style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6)); 
                        border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; 
                        cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#3B82F6';" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#334155';">
                
                <!-- Avatar and Status -->
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <img src="${avatar}" alt="${fullName}" 
                         style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #3B82F6; margin-right: 1rem;">
                    <div style="flex: 1;">
                        <h4 style="color: #F8FAFC; margin: 0; font-size: 1rem; font-weight: 600;">${fullName}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                            <span style="color: ${statusColor}; font-weight: 500;">●</span>
                            <span style="color: ${statusColor}; font-size: 0.85rem;">${status}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Student Info -->
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #94A3B8; font-size: 0.85rem;">Categoria:</span>
                        <span style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            ${category}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94A3B8; font-size: 0.85rem;">ID:</span>
                        <span style="color: #E5E7EB; font-size: 0.85rem; font-family: monospace;">${student.id.split('-')[0]}...</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick="event.stopPropagation(); openStudentEditPage('${student.id}')" 
                            style="flex: 1; background: #3B82F6; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;"
                            title="Editar aluno">
                        ✏️ Editar
                    </button>
                    <button onclick="event.stopPropagation(); confirmQuickCheckin('${student.id}', '${fullName}', '${student.id.split('-')[0]}')" 
                            style="background: #10B981; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;"
                            title="Check-in rápido">
                        ✅
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    console.log(`✅ Successfully rendered ${students.length} students in grid`);
    return true;
    
    } catch (error) {
        console.error('❌ Error rendering students grid:', error);
        return false;
    }
}

/**
 * Shows the loading state for students.
 */
function showStudentsLoadingState() {
    const tableBody = document.getElementById('studentsTableBody');
    const grid = document.getElementById('studentsGrid');
    const loadingHTML = `
        <div style="text-align: center; padding: 3rem; color: #6B7280;">
            <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #374151; border-top: 3px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <div>Carregando alunos...</div>
        </div>
    `;
    
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7">${loadingHTML}</td></tr>`;
    }
    if (grid) {
        grid.innerHTML = loadingHTML;
    }
}

/**
 * Hides the loading state for students.
 */
function hideStudentsLoadingState() {
    // Explicitly clear loading state from both table and grid
    const tableBody = document.getElementById('studentsTableBody');
    const grid = document.getElementById('studentsGrid');
    
    if (tableBody && tableBody.innerHTML.includes('Carregando alunos')) {
        console.log('🧹 Clearing loading state from table');
        // If table still shows loading, it means rendering failed, so clear it
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #EF4444;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div>Erro ao renderizar tabela de alunos</div>
                    <button onclick="loadAndRenderStudents()" 
                            style="margin-top: 1rem; background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        🔄 Tentar novamente
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (grid && grid.innerHTML.includes('Carregando alunos')) {
        console.log('🧹 Clearing loading state from grid');
        grid.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #EF4444; grid-column: 1 / -1;">
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⚠️</div>
                <div>Erro ao renderizar grid de alunos</div>
                <button onclick="loadAndRenderStudents()" 
                        style="margin-top: 1rem; background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * Shows error state for students.
 * @param {string} message - Error message to display.
 */
function showStudentsErrorState(message) {
    const tableBody = document.getElementById('studentsTableBody');
    const grid = document.getElementById('studentsGrid');
    const errorHTML = `
        <div style="text-align: center; padding: 3rem; color: #EF4444;">
            <div style="font-size: 1.5rem; margin-bottom: 1rem;">❌</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar alunos</div>
            <div style="font-size: 0.9rem; color: #9CA3AF;">${message}</div>
            <button onclick="loadAndRenderStudents()" 
                    style="margin-top: 1rem; background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                🔄 Tentar novamente
            </button>
        </div>
    `;
    
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="7">${errorHTML}</td></tr>`;
    }
    if (grid) {
        grid.innerHTML = errorHTML;
    }
}

/**
 * Updates the students counter in the UI.
 */
function updateStudentsCounter() {
    const activeStudents = allStudents.filter(s => s.isActive).length;
    const totalStudents = allStudents.length;
    
    // Update navigation counter
    const navButton = document.querySelector('[onclick*="students"]');
    if (navButton) {
        const counterElement = navButton.querySelector('.badge') || navButton.lastElementChild;
        if (counterElement && counterElement.tagName !== 'SPAN') {
            counterElement.textContent = activeStudents.toString();
        }
    }
    
    // Update any other counters in the students section
    const counters = document.querySelectorAll('[data-students-counter]');
    counters.forEach(counter => {
        counter.textContent = `${activeStudents} ativos de ${totalStudents} total`;
    });
}

/**
 * Opens the dedicated full-page view for editing a student.
 * @param {string} studentId - The ID of the student to edit.
 */
export async function openStudentEditPage(studentId) {
    try {
        console.log('🔄 Abrindo página de edição do aluno:', studentId);
        if (!studentId) {
            throw new Error('ID do estudante não fornecido');
        }
        
        currentEditingStudentId = studentId;

        // Find student in existing data first
        let student = allStudents.find(s => s.id === studentId);
        
        if (!student) {
            console.log('🔍 Debug: Buscando estudante via API...');
            const response = await fetch(`/api/students`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Erro ao carregar dados do estudante');
            }
            
            // Update cache
            setAllStudents(data.data);
            student = allStudents.find(s => s.id === studentId);
        }

        if (!student) {
            throw new Error('Estudante não encontrado com ID: ' + studentId);
        }

        console.log('✅ Debug: Estudante carregado:', student.user?.firstName, student.user?.lastName);
        
        // Use centralized state management
        setCurrentEditingStudent(student.id, student);
        
        const studentsSection = document.getElementById('students');
        const editPageSection = document.getElementById('student-edit-page');
        
        if (!studentsSection || !editPageSection) {
            throw new Error('Elementos da página não encontrados');
        }
        
        studentsSection.style.display = 'none';
        editPageSection.style.display = 'block';
        
        updateEditPageHeader(student);
        loadEditPageForm(student);
        updateEditPageSidebar(student);
        switchPageTab('edit');
        
        console.log('✅ Página de edição carregada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao abrir página de edição:', error);
        window.showToast(`Erro ao abrir edição: ${error.message}`, 'error');
    }
}

/**
 * Updates the header of the edit page with student information.
 * @param {object} student - The student object.
 */
function updateEditPageHeader(student) {
    const user = student.user || {};
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Aluno sem nome';
    const studentId = student.id;
    const category = student.category || 'N/A';
    
    document.getElementById('editPageStudentName').textContent = fullName;
    document.getElementById('editPageStudentId').textContent = `ID: ${studentId}`;
    document.getElementById('editPageStudentCategory').textContent = `Categoria: ${category}`;
}

/**
 * Loads the student editing form into the page.
 * @param {object} student - The student object.
 */
function loadEditPageForm(student) {
    const formContainer = document.getElementById('pageFormContainer');
    if (!formContainer) return;

    // NOTE: This is a large HTML block. In a future refactor,
    // this could be loaded from a template file or built with a library.
    formContainer.innerHTML = `
        <form id="editPageStudentForm" style="display: grid; gap: 2rem;">
            <!-- Personal Information Section -->
            <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155;">
                <h4 style="color: #F8FAFC; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    👤 Informações Pessoais
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label for="pageFirstName" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Nome</label>
                        <input type="text" id="pageFirstName" value="${student.user?.firstName || ''}" 
                               style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;" required>
                    </div>
                    <div class="form-group">
                        <label for="pageLastName" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Sobrenome</label>
                        <input type="text" id="pageLastName" value="${student.user?.lastName || ''}" 
                               style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;" required>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div class="form-group">
                        <label for="pageEmail" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Email</label>
                        <input type="email" id="pageEmail" value="${student.user?.email || ''}" 
                               style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;" required>
                    </div>
                    <div class="form-group">
                        <label for="pagePhone" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Telefone</label>
                        <input type="tel" id="pagePhone" value="${student.user?.phone || ''}" 
                               style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                </div>
            </div>

            <!-- Academic Information Section -->
            <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155;">
                <h4 style="color: #F8FAFC; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    🥋 Informações Acadêmicas
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label for="pageCategory" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Categoria</label>
                        <select id="pageCategory" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                            <option value="ADULT" ${student.category === 'ADULT' ? 'selected' : ''}>Adulto</option>
                            <option value="CHILD" ${student.category === 'CHILD' ? 'selected' : ''}>Criança</option>
                            <option value="INICIANTE1" ${student.category === 'INICIANTE1' ? 'selected' : ''}>Iniciante 1</option>
                            <option value="INICIANTE2" ${student.category === 'INICIANTE2' ? 'selected' : ''}>Iniciante 2</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pageGender" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Gênero</label>
                        <select id="pageGender" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                            <option value="MASCULINO" ${student.gender === 'MASCULINO' ? 'selected' : ''}>Masculino</option>
                            <option value="FEMININO" ${student.gender === 'FEMININO' ? 'selected' : ''}>Feminino</option>
                            <option value="OUTRO" ${student.gender === 'OUTRO' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <label for="pagePhysicalCondition" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Condição Física</label>
                    <select id="pagePhysicalCondition" style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                        <option value="INICIANTE" ${student.physicalCondition === 'INICIANTE' ? 'selected' : ''}>Iniciante</option>
                        <option value="INTERMEDIARIO" ${student.physicalCondition === 'INTERMEDIARIO' ? 'selected' : ''}>Intermediário</option>
                        <option value="AVANCADO" ${student.physicalCondition === 'AVANCADO' ? 'selected' : ''}>Avançado</option>
                    </select>
                </div>
            </div>

            <!-- Additional Information Section -->
            <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155;">
                <h4 style="color: #F8FAFC; margin: 0 0 1.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                    📋 Informações Adicionais
                </h4>
                <div style="display: grid; gap: 1rem;">
                    <div class="form-group">
                        <label for="pageEmergencyContact" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Contato de Emergência</label>
                        <input type="text" id="pageEmergencyContact" value="${student.emergencyContact || ''}" 
                               style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC;">
                    </div>
                    <div class="form-group">
                        <label for="pageMedicalConditions" style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem; display: block;">Condições Médicas</label>
                        <textarea id="pageMedicalConditions" rows="3" 
                                  style="width: 100%; padding: 0.75rem; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #F8FAFC; resize: vertical;">${student.medicalConditions || ''}</textarea>
                    </div>
                </div>
            </div>

            <!-- Hidden fields -->
            <input type="hidden" id="pageStudentId" value="${student.id}">
            <input type="hidden" id="pageUserId" value="${student.userId}">
        </form>
    `;

    // ARCHITECTURAL FIX: Set DOM attribute as additional failsafe for isolated modules
    formContainer.setAttribute('data-editing-student-id', student.id);

    const inputs = formContainer.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updatePageFormProgress);
    });

    updatePageFormProgress();
    
    // Pre-load financial tab content to ensure plan information is available
    setTimeout(() => {
        console.log('🔄 Pre-loading financial tab...');
        // This function needs to be available/imported if it's not in this module
        if (window.loadStudentFinancialTab) {
            window.loadStudentFinancialTab();
        } else {
            console.warn('loadStudentFinancialTab is not defined globally.');
        }
    }, 1000);
}

/**
 * Updates the sidebar on the edit page with student stats.
 * @param {object} student - The student object.
 */
function updateEditPageSidebar(student) {
    document.getElementById('sidebarXP').textContent = student.totalXP || '0';
    document.getElementById('sidebarLevel').textContent = `Nv. ${student.globalLevel || '1'}`;
    document.getElementById('sidebarStreak').textContent = `${student.currentStreak || '0'} dias`;
}

/**
 * Switches the visible tab on the student edit page.
 * @param {string} tabName - The name of the tab to switch to.
 */
export function switchPageTab(tabName) {
    document.querySelectorAll('.page-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    document.querySelectorAll('.page-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#94A3B8';
    });

    const selectedTab = document.getElementById(`page-tab-${tabName}`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    const selectedBtn = document.querySelector(`[data-page-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        selectedBtn.style.background = 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
        selectedBtn.style.color = 'white';
    }

    loadPageTabContent(tabName);
}

/**
 * Loads the content for a specific tab on the student edit page.
 * @param {string} tabName - The name of the tab to load.
 */
function loadPageTabContent(tabName) {
    if (!currentEditingStudent) return;

    // These functions need to be available/imported if they are not in this module.
    // For now, we assume they are globally available on the window object.
    switch (tabName) {
        case 'ai-dashboard':
            window.loadAIDashboardContent?.();
            break;
        case 'plans':
            window.loadPlansTabContent?.();
            break;
        case 'classes':
            window.loadStudentClassesTab?.();
            break;
        case 'courses':
            // Use the new robust courses loading function
            if (currentEditingStudentId) {
                loadStudentCourses(currentEditingStudentId);
            } else {
                console.error('❌ No current student ID for loading courses');
            }
            break;
        case 'progress':
            window.loadProgressTabContent?.();
            break;
        default:
            // 'edit' tab is loaded by default
            break;
    }
}

/**
 * Updates the progress bar for the student edit form.
 */
function updatePageFormProgress() {
    const form = document.getElementById('editPageStudentForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required], select[required]');
    let completed = 0;
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            completed++;
        }
    });
    
    const progress = inputs.length > 0 ? Math.round((completed / inputs.length) * 100) : 0;
    const progressBar = document.getElementById('pageFormProgress');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

/**
 * Saves the edited student data.
 */
export async function saveEditStudent() {
    console.log('🔄 saveEditStudent called');
    
    // Use centralized state management
    const studentId = getCurrentEditingStudentId();
    
    if (!studentId) {
        console.error('❌ No student ID found in centralized state');
        window.showToast('❌ Erro: ID do aluno não encontrado', 'error');
        return;
    }
    
    console.log('✅ Using student ID from centralized state:', studentId);
    
    const formData = {
        firstName: document.getElementById('pageFirstName').value,
        lastName: document.getElementById('pageLastName').value,
        email: document.getElementById('pageEmail').value,
        phone: document.getElementById('pagePhone').value,
        category: document.getElementById('pageCategory').value,
        gender: document.getElementById('pageGender').value,
        physicalCondition: document.getElementById('pagePhysicalCondition').value,
        emergencyContact: document.getElementById('pageEmergencyContact').value,
        medicalConditions: document.getElementById('pageMedicalConditions').value,
    };
    
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast('Aluno atualizado com sucesso!', 'success');
            // Optionally, refresh data or navigate away
        } else {
            throw new Error(result.message || 'Erro ao atualizar aluno');
        }
    } catch (error) {
        console.error('Erro:', error);
        window.showToast('Erro ao atualizar aluno: ' + error.message, 'error');
    }
}

/**
 * A wrapper function to be called by the `onclick` event.
 * This is a common pattern to avoid modals and use full-page navigation.
 * @param {string} studentId - The ID of the student to edit.
 */
export function editStudent(studentId) {
    openStudentEditPage(studentId);
}







/**
 * Creates HTML for a single class card.
 * @param {Object} classItem - Class object from API.
 * @returns {string} HTML string for the class card.
 */
function createClassCard(classItem) {
    const className = classItem.name || classItem.className || 'Turma sem nome';
    const schedule = classItem.schedule || '';
    const instructor = classItem.instructor || classItem.instructorName || '';
    const status = classItem.status || 'ATIVO';
    const statusColor = status === 'ATIVO' ? '#10B981' : '#EF4444';
    
    return `
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 1.5rem; border-left: 4px solid ${statusColor};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h5 style="color: #F8FAFC; margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700;">
                        ${className}
                    </h5>
                    ${schedule ? `<p style="color: #94A3B8; margin: 0; font-size: 0.875rem;">📅 ${schedule}</p>` : ''}
                </div>
                <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                    ${status}
                </span>
            </div>
            
            ${instructor ? `
                <div style="color: #E2E8F0; font-size: 0.875rem;">
                    👨‍🏫 <strong>Instrutor:</strong> ${instructor}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Loads and displays classes for a specific course.
 * @param {string} courseId - The ID of the course.
 */
async function loadCourseClasses(courseId) {
    console.log(`🏫 Loading classes for course ${courseId}...`);
    
    const classesContainer = document.getElementById(`course-classes-${courseId}`);
    if (!classesContainer) {
        console.error('❌ Classes container not found');
        return;
    }
    
    // Show loading state
    classesContainer.innerHTML = `
        <div style="padding: 1rem; text-align: center; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #3B82F6;">
                <div style="width: 16px; height: 16px; border: 2px solid #3B82F6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="font-size: 0.875rem;">Carregando turmas...</span>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/courses/${courseId}/classes`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load course classes');
        }
        
        const classes = result.data || [];
        console.log(`✅ Successfully loaded ${classes.length} classes for course ${courseId}`);
        
        if (classes.length === 0) {
            classesContainer.innerHTML = `
                <div style="padding: 1rem; text-align: center; background: rgba(156, 163, 175, 0.1); border-radius: 8px;">
                    <div style="color: #9CA3B8; font-size: 0.875rem;">
                        🏫 Nenhuma turma disponível para este curso
                    </div>
                </div>
            `;
            return;
        }
        
        const classesHtml = `
            <div style="background: rgba(59, 130, 246, 0.05); border-radius: 8px; padding: 1rem;">
                <div style="color: #93C5FD; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem;">
                    🏫 Turmas Disponíveis (${classes.length})
                </div>
                <div style="display: grid; gap: 0.75rem;">
                    ${classes.map(classItem => createMiniClassCard(classItem)).join('')}
                </div>
            </div>
        `;
        
        classesContainer.innerHTML = classesHtml;
        
    } catch (error) {
        console.error(`❌ Error loading classes for course ${courseId}:`, error);
        classesContainer.innerHTML = `
            <div style="padding: 1rem; text-align: center; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                <div style="color: #EF4444; font-size: 0.875rem;">
                    ⚠️ Erro ao carregar turmas: ${error.message}
                </div>
            </div>
        `;
    }
}

/**
 * Creates HTML for a mini class card (inside course view).
 * @param {Object} classItem - Class object from API.
 * @returns {string} HTML string for the mini class card.
 */
function createMiniClassCard(classItem) {
    const className = classItem.name || classItem.className || 'Turma sem nome';
    const schedule = classItem.schedule || '';
    const instructor = classItem.instructor || classItem.instructorName || '';
    const capacity = classItem.capacity || '';
    const currentStudents = classItem.currentStudents || 0;
    
    return `
        <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 1rem; font-size: 0.875rem;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                <div style="color: #E2E8F0; font-weight: 600;">${className}</div>
                ${capacity ? `<div style="color: #94A3B8; font-size: 0.75rem; font-weight: 500;">${currentStudents}/${capacity} alunos</div>` : ''}
            </div>
            ${schedule ? `<div style="color: #94A3B8; margin-bottom: 0.25rem;">📅 ${schedule}</div>` : ''}
            ${instructor ? `<div style="color: #94A3B8;">👨‍🏫 ${instructor}</div>` : ''}
        </div>
    `;
}

/**
 * Loads and renders courses for a specific student from the API.
 * This is the main exported function that can be used by other modules.
 * @param {string} studentId - The ID of the student.
 */
export async function loadStudentCourses(studentId = null) {
    console.log(`📚 Loading courses for student...`);
    
    // Use centralized state if no studentId provided
    if (!studentId) {
        studentId = getCurrentEditingStudentId();
    }
    
    if (!studentId) {
        console.error('❌ Student ID is required to load courses');
        return;
    }
    
    // Ensure we're working with the right student
    setCurrentEditingStudent(studentId);
    
    // Try to find the correct courses content element
    let contentEl = document.getElementById('page-tab-courses');
    if (!contentEl) {
        // Fallback to old system
        contentEl = document.getElementById('student-courses-content');
    }
    
    if (!contentEl) {
        console.error('❌ Courses content element not found in DOM');
        return;
    }
    
    console.log('✅ Found courses content element:', contentEl.id, contentEl);
    
    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #8B5CF6;">
                <div style="width: 20px; height: 20px; border: 2px solid #8B5CF6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="font-size: 1rem; color: #94A3B8;">Carregando cursos...</span>
            </div>
        </div>
    `;
    
    try {
        // Use centralized data loading
        const courses = await getCurrentStudentCourses();
        
        if (!courses || courses.length === 0) {
            console.log('📚 No courses found, showing empty state');
            contentEl.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📚</div>
                    <div style="color: #94A3B8; font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
                        Nenhum curso encontrado
                    </div>
                    <div style="color: #64748B; font-size: 0.875rem;">
                        Este aluno não possui cursos disponíveis. Configure um plano na aba Financeiro para ver os cursos disponíveis.
                    </div>
                </div>
            `;
            return;
        }
        
        // Get the plan data for context
        const subscription = await getCurrentStudentSubscription();
        const plan = subscription?.plan;
        
        console.log(`✅ Successfully loaded ${courses.length} courses`);
        
        // Render courses with plan context
        renderStudentCoursesWithPlan(courses, plan, contentEl);
        
    } catch (error) {
        console.error(`❌ Error loading courses for student ${studentId}:`, error);
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar cursos</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadStudentCourses('${studentId}')" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * Updates the courses tab indicator with course count.
 * @param {number} courseCount - Number of courses to display.
 */
function updateCoursesTabIndicator(courseCount) {
    const coursesTabBtn = document.querySelector('[data-page-tab="courses"]');
    if (coursesTabBtn) {
        // Find existing badge or create one
        let badge = coursesTabBtn.querySelector('.tab-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.style.cssText = `
                background: linear-gradient(135deg, #8B5CF6, #7C3AED);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-left: 0.5rem;
            `;
            coursesTabBtn.appendChild(badge);
        }
        
        badge.textContent = courseCount.toString();
        console.log(`✅ Updated courses tab indicator: ${courseCount}`);
    }
}

// ==============================================
// PLACEHOLDER FUNCTIONS FOR FULL-SCREEN UI
// ==============================================
// Following the architectural principle: no modals for editing/creating data

/**
 * Placeholder for plan association - redirects to full-screen financial section
 */
function openPlanAssociationModal(studentId) {
    console.log('🔄 Redirecting to financial tab for plan association...');
    if (studentId) {
        window.currentEditingStudentId = studentId;
    }
    // Switch to financial tab instead of opening modal
    const financialTab = document.querySelector('[data-page-tab="financial"]');
    if (financialTab) {
        financialTab.click();
    }
}

/**
 * Placeholder for closing plan association modal - no-op since we use full-screen
 */
function closePlanAssociationModal() {
    console.log('ℹ️ No modal to close - using full-screen UI');
}

/**
 * Placeholder for invoice generation - redirects to financial section
 */
function generateInvoice(studentId) {
    console.log('🔄 Redirecting to financial tab for invoice generation...');
    if (studentId) {
        window.currentEditingStudentId = studentId;
    }
    const financialTab = document.querySelector('[data-page-tab="financial"]');
    if (financialTab) {
        financialTab.click();
    }
}

/**
 * Placeholder for payment registration - redirects to financial section
 */
function registerPayment(studentId) {
    console.log('🔄 Redirecting to financial tab for payment registration...');
    if (studentId) {
        window.currentEditingStudentId = studentId;
    }
    const financialTab = document.querySelector('[data-page-tab="financial"]');
    if (financialTab) {
        financialTab.click();
    }
}

/**
 * Placeholder for closing payment modal - no-op since we use full-screen
 */
function closePaymentModal() {
    console.log('ℹ️ No modal to close - using full-screen UI');
}

// ==============================================
// UX ARCHITECTED TAB LOADING FUNCTIONS
// ==============================================

/**
 * 👤 PROFILE TAB - Dados pessoais e acadêmicos
 */
export async function loadProfileTab() {
    console.log('👤 Loading profile tab...');
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    const contentEl = document.getElementById('page-tab-profile') || document.getElementById('page-tab-edit');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #3B82F6;">
                <div style="width: 20px; height: 20px; border: 2px solid #3B82F6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Carregando perfil...</span>
            </div>
        </div>
    `;

    try {
        // Load student data
        const response = await fetch(`/api/students/${studentId}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do aluno');
        
        const studentData = await response.json();
        const student = studentData.data;
        
        contentEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                <!-- Header do Perfil -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <h3 style="color: #F8FAFC; margin: 0; font-size: 1.5rem; font-weight: 600;">👤 Perfil do Aluno</h3>
                    <span style="background: ${student.isActive ? '#10B981' : '#EF4444'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${student.isActive ? '🟢 Ativo' : '🔴 Inativo'}
                    </span>
                </div>

                <!-- Dados Pessoais -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                    <div style="background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #475569;">
                        <h4 style="color: #3B82F6; margin: 0 0 1rem 0; font-size: 1.125rem;">📋 Informações Pessoais</h4>
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Nome Completo</label>
                                <div style="color: #F8FAFC; font-weight: 500;">${student.user?.name || 'Não informado'}</div>
                            </div>
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Email</label>
                                <div style="color: #F8FAFC;">${student.user?.email || 'Não informado'}</div>
                            </div>
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Telefone</label>
                                <div style="color: #F8FAFC;">${student.user?.phone || 'Não informado'}</div>
                            </div>
                        </div>
                    </div>

                    <div style="background: rgba(30, 41, 59, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #475569;">
                        <h4 style="color: #10B981; margin: 0 0 1rem 0; font-size: 1.125rem;">🎓 Dados Acadêmicos</h4>
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Categoria</label>
                                <div style="color: #F8FAFC; font-weight: 500;">${student.category || 'Não definido'}</div>
                            </div>
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Gênero</label>
                                <div style="color: #F8FAFC;">${student.user?.gender || 'Não informado'}</div>
                            </div>
                            <div>
                                <label style="color: #94A3B8; font-size: 0.875rem; display: block; margin-bottom: 0.25rem;">Data de Nascimento</label>
                                <div style="color: #F8FAFC;">${student.user?.dateOfBirth ? new Date(student.user.dateOfBirth).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contato de Emergência -->
                ${student.emergencyContact ? `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #EF4444; margin: 0 0 1rem 0; font-size: 1.125rem;">🚨 Contato de Emergência</h4>
                    <div style="color: #F8FAFC;">${student.emergencyContact}</div>
                </div>
                ` : ''}

                <!-- Condições Médicas -->
                ${student.medicalConditions ? `
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #F59E0B; margin: 0 0 1rem 0; font-size: 1.125rem;">⚕️ Condições Médicas</h4>
                    <div style="color: #F8FAFC;">${student.medicalConditions}</div>
                </div>
                ` : ''}

                <!-- Botão de Edição -->
                <div style="text-align: center; padding-top: 1rem; border-top: 1px solid #475569;">
                    <button onclick="switchPageTab('edit')" 
                            style="background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        ✏️ Editar Dados
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar perfil</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadProfileTab()" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * 💳 FINANCIAL TAB - Panorama financeiro completo
 */
export async function loadFinancialTab() {
    console.log('💳 Loading financial tab...');
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    const contentEl = document.getElementById('page-tab-financial') || document.getElementById('page-tab-plans');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #10B981;">
                <div style="width: 20px; height: 20px; border: 2px solid #10B981; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Carregando dados financeiros...</span>
            </div>
        </div>
    `;

    try {
        // Load subscription data
        const subscriptionDetails = await getCurrentStudentSubscriptionDetails();
        
        if (!subscriptionDetails || subscriptionDetails.paymentStatus === 'NO_SUBSCRIPTION') {
            contentEl.innerHTML = `
                <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
                        <h3 style="color: #F8FAFC; margin-bottom: 1rem;">Nenhuma assinatura ativa</h3>
                        <p style="color: #94A3B8; margin-bottom: 2rem;">Este aluno ainda não possui um plano de pagamento ativo.</p>
                        <button onclick="switchPageTab('plans')" 
                                style="background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            ➕ Contratar Plano
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const { subscription, plan, courses, paymentStatus } = subscriptionDetails;
        
        // Status colors and labels
        const statusColors = {
            'ACTIVE': '#10B981',
            'PENDING': '#F59E0B', 
            'SUSPENDED': '#EF4444',
            'CANCELLED': '#6B7280',
            'EXPIRED': '#374151'
        };

        const statusLabels = {
            'ACTIVE': 'Ativa',
            'PENDING': 'Pendente',
            'SUSPENDED': 'Suspensa', 
            'CANCELLED': 'Cancelada',
            'EXPIRED': 'Expirada'
        };

        contentEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                <!-- Header Financeiro -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                    <h3 style="color: #F8FAFC; margin: 0; font-size: 1.5rem; font-weight: 600;">💳 Panorama Financeiro</h3>
                    <span style="background: ${statusColors[paymentStatus] || '#6B7280'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${statusLabels[paymentStatus] || paymentStatus}
                    </span>
                </div>

                <!-- Status da Assinatura -->
                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #3B82F6; margin: 0 0 1rem 0; font-size: 1.25rem;">📊 Status da Assinatura</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">📅 Data de Início</div>
                            <div style="color: #F8FAFC; font-weight: 500;">${subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                        </div>
                        <div>
                            <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">🔄 Próxima Cobrança</div>
                            <div style="color: #F8FAFC; font-weight: 500;">${subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                        </div>
                        <div>
                            <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">💰 Valor Atual</div>
                            <div style="color: #10B981; font-weight: 600; font-size: 1.125rem;">R$ ${parseFloat(subscription?.currentPrice || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">💳 Método de Pagamento</div>
                            <div style="color: #F8FAFC; font-weight: 500;">${subscription?.paymentMethod || 'Não informado'}</div>
                        </div>
                    </div>
                </div>

                <!-- Detalhes do Plano -->
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #10B981; margin: 0 0 1rem 0; font-size: 1.25rem;">📋 Plano Ativo</h4>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
                        <div>
                            <h5 style="color: #F8FAFC; margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600;">${plan?.name || 'Plano não identificado'}</h5>
                            <p style="color: #94A3B8; margin: 0 0 1rem 0; font-size: 0.875rem;">${plan?.description || 'Sem descrição disponível'}</p>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                                <div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Categoria</div>
                                    <div style="color: #F8FAFC; font-weight: 500;">${plan?.category || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Tipo de Cobrança</div>
                                    <div style="color: #F8FAFC; font-weight: 500;">${plan?.billingType || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Aulas por Semana</div>
                                    <div style="color: #F8FAFC; font-weight: 500;">${plan?.classesPerWeek || 'Ilimitado'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center;">
                            <div style="background: rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem;">
                                <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.25rem;">Valor do Plano</div>
                                <div style="color: #10B981; font-size: 2rem; font-weight: bold;">R$ ${parseFloat(plan?.price || 0).toFixed(0)}</div>
                                <div style="color: #94A3B8; font-size: 0.75rem;">/${plan?.billingType === 'MONTHLY' ? 'mês' : plan?.billingType === 'QUARTERLY' ? 'trimestre' : 'ano'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ações Rápidas -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <button onclick="switchPageTab('plans')" 
                            style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        🔄 Alterar Plano
                    </button>
                    <button onclick="alert('Funcionalidade em desenvolvimento')" 
                            style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        📄 Gerar Fatura
                    </button>
                    <button onclick="alert('Funcionalidade em desenvolvimento')" 
                            style="background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        💰 Registrar Pagamento
                    </button>
                    <button onclick="alert('Funcionalidade em desenvolvimento')" 
                            style="background: linear-gradient(135deg, #6B7280, #4B5563); color: white; border: none; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        📊 Histórico
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar dados financeiros</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadFinancialTab()" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * 📚 ENROLLMENTS TAB - Cursos baseados no plano ativo
 */
export async function loadEnrollmentsTab() {
    console.log('📚 Loading enrollments tab...');
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    const contentEl = document.getElementById('page-tab-enrollments') || document.getElementById('page-tab-courses');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #8B5CF6;">
                <div style="width: 20px; height: 20px; border: 2px solid #8B5CF6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Carregando cursos matriculados...</span>
            </div>
        </div>
    `;

    try {
        // Load subscription and courses data
        const subscriptionDetails = await getCurrentStudentSubscriptionDetails();
        
        if (!subscriptionDetails || subscriptionDetails.paymentStatus === 'NO_SUBSCRIPTION') {
            contentEl.innerHTML = `
                <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                        <h3 style="color: #F8FAFC; margin-bottom: 1rem;">Nenhum curso disponível</h3>
                        <p style="color: #94A3B8; margin-bottom: 2rem;">É necessário ter um plano ativo para acessar os cursos.</p>
                        <button onclick="switchPageTab('financial')" 
                                style="background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            💳 Ver Planos
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const { courses, plan } = subscriptionDetails;
        const activeCourses = courses.filter(course => course.isActive);
        const totalCourses = courses.length;

        contentEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                <!-- Header Cursos -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                    <h3 style="color: #F8FAFC; margin: 0; font-size: 1.5rem; font-weight: 600;">📚 Cursos Matriculados</h3>
                    <div style="display: flex; gap: 1rem;">
                        <span style="background: #8B5CF6; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${activeCourses.length} Ativos
                        </span>
                        <span style="background: #6B7280; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${totalCourses} Total
                        </span>
                    </div>
                </div>

                <!-- Informações do Plano -->
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #8B5CF6; margin: 0 0 0.5rem 0; font-size: 1.125rem;">💳 Inclusos no Plano: ${plan?.name}</h4>
                    <p style="color: #94A3B8; margin: 0; font-size: 0.875rem;">
                        Os cursos abaixo estão inclusos automaticamente no seu plano de pagamento ativo.
                    </p>
                </div>

                <!-- Grid de Cursos -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
                    ${courses.map(course => `
                        <div style="background: rgba(30, 41, 59, 0.8); border: 2px solid ${course.isActive ? '#8B5CF6' : '#475569'}; border-radius: 12px; padding: 1.5rem; transition: all 0.3s ease;">
                            <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 1rem;">
                                <h5 style="color: #F8FAFC; margin: 0; font-size: 1.125rem; font-weight: 600; flex: 1;">${course.name}</h5>
                                <span style="background: ${course.isActive ? '#10B981' : '#EF4444'}; color: white; padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.625rem; font-weight: 600; margin-left: 1rem;">
                                    ${course.isActive ? '🟢 ATIVO' : '🔴 INATIVO'}
                                </span>
                            </div>
                            
                            <p style="color: #94A3B8; margin: 0 0 1.5rem 0; font-size: 0.875rem; line-height: 1.5;">
                                ${course.description || 'Descrição não disponível'}
                            </p>
                            
                            <!-- Progresso Simulado -->
                            <div style="margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                                    <span style="color: #94A3B8; font-size: 0.875rem;">Progresso</span>
                                    <span style="color: #8B5CF6; font-weight: 600; font-size: 0.875rem;">${Math.floor(Math.random() * 100)}%</span>
                                </div>
                                <div style="background: #374151; border-radius: 8px; height: 8px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, #8B5CF6, #7C3AED); height: 100%; width: ${Math.floor(Math.random() * 100)}%; transition: width 0.3s ease;"></div>
                                </div>
                            </div>
                            
                            <!-- Detalhes do Curso -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                <div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Duração</div>
                                    <div style="color: #F8FAFC; font-weight: 500;">${course.duration || 12} semanas</div>
                                </div>
                                <div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Total de Aulas</div>
                                    <div style="color: #F8FAFC; font-weight: 500;">${course.totalClasses || 24} aulas</div>
                                </div>
                            </div>
                            
                            <!-- Matrícula Status -->
                            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="color: #10B981;">✅</span>
                                    <span style="color: #10B981; font-weight: 500; font-size: 0.875rem;">Matrícula Automática</span>
                                </div>
                                <div style="color: #94A3B8; font-size: 0.75rem; margin-top: 0.25rem;">
                                    Incluso no plano ${plan?.name}
                                </div>
                            </div>
                            
                            <!-- Botão Ver Turmas -->
                            <button onclick="switchPageTab('classes')" 
                                    style="width: 100%; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">
                                🏫 Ver Turmas Disponíveis
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                ${courses.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: #94A3B8;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                        <div style="font-size: 1.125rem; margin-bottom: 0.5rem;">Nenhum curso encontrado</div>
                        <div style="font-size: 0.875rem;">Os cursos serão carregados automaticamente quando um plano for ativado.</div>
                    </div>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar cursos</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadEnrollmentsTab()" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * Legacy function for backward compatibility
 */
export async function loadStudentCoursesTab() {
    console.log('🔄 Redirecting to new enrollments tab...');
    return loadEnrollmentsTab();
}

/**
 * 🏫 CLASSES TAB - Turmas específicas frequentadas
 */
export async function loadClassesTab() {
    console.log('🏫 Loading classes tab...');
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    const contentEl = document.getElementById('page-tab-classes');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #8B5CF6;">
                <div style="width: 20px; height: 20px; border: 2px solid #8B5CF6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Carregando turmas ativas...</span>
            </div>
        </div>
    `;

    try {
        // Load classes data
        const response = await fetch(`/api/students/${studentId}/classes`);
        let classesData = [];
        
        if (response.ok) {
            const data = await response.json();
            classesData = data.data || [];
        }
        
        // Simulate some classes data if empty
        if (classesData.length === 0) {
            classesData = [
                {
                    id: 'class-1',
                    name: 'Krav Maga Iniciante - Manhã',
                    course: 'Fundamentos do Krav Maga',
                    instructor: 'Instrutor João Silva',
                    schedule: 'Segunda, Quarta, Sexta - 08:00-09:00',
                    capacity: 20,
                    enrolled: 15,
                    nextClass: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    status: 'ACTIVE',
                    frequency: 85
                },
                {
                    id: 'class-2', 
                    name: 'Krav Maga Intermediário - Noite',
                    course: 'Técnicas Avançadas',
                    instructor: 'Instrutor Maria Santos',
                    schedule: 'Terça, Quinta - 19:00-20:30',
                    capacity: 15,
                    enrolled: 12,
                    nextClass: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    status: 'ACTIVE',
                    frequency: 92
                }
            ];
        }

        const activeClasses = classesData.filter(cls => cls.status === 'ACTIVE');
        const upcomingClasses = classesData.filter(cls => cls.nextClass && new Date(cls.nextClass) > new Date());

        contentEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                <!-- Header Turmas -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                    <h3 style="color: #F8FAFC; margin: 0; font-size: 1.5rem; font-weight: 600;">🏫 Turmas Ativas</h3>
                    <div style="display: flex; gap: 1rem;">
                        <span style="background: #8B5CF6; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${activeClasses.length} Turmas
                        </span>
                        <span style="background: #10B981; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${upcomingClasses.length} Próximas
                        </span>
                    </div>
                </div>

                <!-- Próximas Aulas -->
                ${upcomingClasses.length > 0 ? `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color: #10B981; margin: 0 0 1rem 0; font-size: 1.125rem;">⏰ Próximas Aulas</h4>
                    <div style="display: grid; gap: 1rem;">
                        ${upcomingClasses.slice(0, 3).map(cls => `
                            <div style="display: flex; justify-content: between; align-items: center; background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 1rem;">
                                <div style="flex: 1;">
                                    <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 0.25rem;">${cls.name}</div>
                                    <div style="color: #94A3B8; font-size: 0.875rem;">${cls.instructor}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #10B981; font-weight: 600; font-size: 0.875rem;">
                                        ${new Date(cls.nextClass).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">
                                        ${new Date(cls.nextClass).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Grid de Turmas -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
                    ${classesData.map(cls => `
                        <div style="background: rgba(30, 41, 59, 0.8); border: 2px solid ${cls.status === 'ACTIVE' ? '#8B5CF6' : '#475569'}; border-radius: 12px; padding: 1.5rem; transition: all 0.3s ease;">
                            <!-- Header da Turma -->
                            <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h5 style="color: #F8FAFC; margin: 0 0 0.25rem 0; font-size: 1.125rem; font-weight: 600;">${cls.name}</h5>
                                    <div style="color: #8B5CF6; font-size: 0.875rem; font-weight: 500;">${cls.course}</div>
                                </div>
                                <span style="background: ${cls.status === 'ACTIVE' ? '#10B981' : '#EF4444'}; color: white; padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.625rem; font-weight: 600;">
                                    ${cls.status === 'ACTIVE' ? '🟢 ATIVA' : '🔴 INATIVA'}
                                </span>
                            </div>
                            
                            <!-- Instrutor e Horário -->
                            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                                <div style="display: grid; gap: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="color: #8B5CF6;">👨‍🏫</span>
                                        <div>
                                            <div style="color: #F8FAFC; font-weight: 500; font-size: 0.875rem;">${cls.instructor}</div>
                                            <div style="color: #94A3B8; font-size: 0.75rem;">Instrutor</div>
                                        </div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="color: #8B5CF6;">📅</span>
                                        <div>
                                            <div style="color: #F8FAFC; font-weight: 500; font-size: 0.875rem;">${cls.schedule}</div>
                                            <div style="color: #94A3B8; font-size: 0.75rem;">Horário das aulas</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Estatísticas da Turma -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                <div style="text-align: center;">
                                    <div style="color: #10B981; font-size: 1.5rem; font-weight: bold;">${cls.enrolled}/${cls.capacity}</div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Ocupação</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #F59E0B; font-size: 1.5rem; font-weight: bold;">${cls.frequency}%</div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Sua Frequência</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #8B5CF6; font-size: 1.5rem; font-weight: bold;">${Math.floor(Math.random() * 50) + 10}</div>
                                    <div style="color: #94A3B8; font-size: 0.75rem;">Aulas Feitas</div>
                                </div>
                            </div>

                            <!-- Próxima Aula -->
                            ${cls.nextClass ? `
                            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: between; align-items: center;">
                                    <div>
                                        <div style="color: #10B981; font-weight: 500; font-size: 0.875rem;">Próxima Aula</div>
                                        <div style="color: #94A3B8; font-size: 0.75rem;">
                                            ${new Date(cls.nextClass).toLocaleDateString('pt-BR')} às ${new Date(cls.nextClass).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <span style="color: #10B981; font-size: 1.25rem;">⏰</span>
                                </div>
                            </div>
                            ` : ''}

                            <!-- Ações -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <button onclick="alert('Check-in rápido em desenvolvimento')" 
                                        style="background: linear-gradient(135deg, #10B981, #059669); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">
                                    ✅ Check-in
                                </button>
                                <button onclick="alert('Detalhes da turma em desenvolvimento')" 
                                        style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">
                                    📋 Detalhes
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${classesData.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: #94A3B8;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🏫</div>
                        <div style="font-size: 1.125rem; margin-bottom: 0.5rem;">Nenhuma turma encontrada</div>
                        <div style="font-size: 0.875rem;">As turmas serão exibidas quando você se matricular em alguma.</div>
                    </div>
                ` : ''}

                <!-- Turmas Disponíveis para Matrícula -->
                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #475569;">
                    <div style="display: flex; justify-content: center;">
                        <button onclick="alert('Matrícula em novas turmas em desenvolvimento')" 
                                style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                            ➕ Ver Turmas Disponíveis
                        </button>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar turmas</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadClassesTab()" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * 📊 PROGRESS TAB - Evolução acadêmica e gamificação
 */
export async function loadProgressTab() {
    console.log('📊 Loading progress tab...');
    const studentId = getCurrentEditingStudentId();
    if (!studentId) {
        throw new Error('ID do aluno não encontrado');
    }

    const contentEl = document.getElementById('page-tab-progress');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    // Show loading state
    contentEl.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #F59E0B;">
                <div style="width: 20px; height: 20px; border: 2px solid #F59E0B; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Carregando progresso...</span>
            </div>
        </div>
    `;

    try {
        // Simulate progress data
        const progressData = {
            level: 8,
            xp: 2450,
            nextLevelXp: 3000,
            streak: 12,
            totalClasses: 87,
            achievements: [
                { id: 1, name: 'Primeira Aula', description: 'Completou sua primeira aula', icon: '🥋', earned: true },
                { id: 2, name: 'Sequência de 7 dias', description: 'Treinou por 7 dias seguidos', icon: '🔥', earned: true },
                { id: 3, name: 'Nível 5', description: 'Alcançou o nível 5', icon: '⭐', earned: true },
                { id: 4, name: 'Frequência Perfeita', description: '100% de frequência no mês', icon: '💯', earned: false },
                { id: 5, name: 'Mestre', description: 'Alcançar nível 20', icon: '🏆', earned: false }
            ],
            monthlyProgress: [
                { month: 'Jan', classes: 15, frequency: 85 },
                { month: 'Fev', classes: 18, frequency: 90 },
                { month: 'Mar', classes: 20, frequency: 95 },
                { month: 'Abr', classes: 16, frequency: 80 }
            ]
        };

        const xpPercentage = (progressData.xp / progressData.nextLevelXp) * 100;
        const earnedAchievements = progressData.achievements.filter(a => a.earned);

        contentEl.innerHTML = `
            <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
                <!-- Header Progresso -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
                    <h3 style="color: #F8FAFC; margin: 0; font-size: 1.5rem; font-weight: 600;">📊 Progresso Geral</h3>
                    <span style="background: #F59E0B; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        Nível ${progressData.level}
                    </span>
                </div>

                <!-- Cards de Status -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <!-- XP e Nível -->
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="color: #F59E0B; font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${progressData.level}
                        </div>
                        <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 1rem;">Nível Atual</div>
                        
                        <div style="background: #374151; border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 0.5rem;">
                            <div style="background: linear-gradient(90deg, #F59E0B, #D97706); height: 100%; width: ${xpPercentage}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="color: #94A3B8; font-size: 0.875rem;">
                            ${progressData.xp} / ${progressData.nextLevelXp} XP
                        </div>
                    </div>

                    <!-- Sequência -->
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="color: #EF4444; font-size: 2.5rem; margin-bottom: 0.5rem;">🔥</div>
                        <div style="color: #EF4444; font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${progressData.streak}
                        </div>
                        <div style="color: #F8FAFC; font-weight: 600;">Dias Consecutivos</div>
                    </div>

                    <!-- Total de Aulas -->
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="color: #10B981; font-size: 2.5rem; margin-bottom: 0.5rem;">🥋</div>
                        <div style="color: #10B981; font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${progressData.totalClasses}
                        </div>
                        <div style="color: #F8FAFC; font-weight: 600;">Aulas Concluídas</div>
                    </div>

                    <!-- Conquistas -->
                    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="color: #8B5CF6; font-size: 2.5rem; margin-bottom: 0.5rem;">🏆</div>
                        <div style="color: #8B5CF6; font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
                            ${earnedAchievements.length}
                        </div>
                        <div style="color: #F8FAFC; font-weight: 600;">Conquistas</div>
                    </div>
                </div>

                <!-- Conquistas e Badges -->
                <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #8B5CF6; margin: 0 0 1rem 0; font-size: 1.25rem;">🏆 Conquistas e Badges</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${progressData.achievements.map(achievement => `
                            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid ${achievement.earned ? '#8B5CF6' : '#475569'}; border-radius: 8px; padding: 1rem; opacity: ${achievement.earned ? '1' : '0.6'};">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="font-size: 2rem;">${achievement.icon}</div>
                                    <div style="flex: 1;">
                                        <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 0.25rem;">${achievement.name}</div>
                                        <div style="color: #94A3B8; font-size: 0.875rem;">${achievement.description}</div>
                                    </div>
                                    ${achievement.earned ? `
                                        <div style="color: #10B981; font-size: 1.25rem;">✅</div>
                                    ` : `
                                        <div style="color: #6B7280; font-size: 1.25rem;">⏳</div>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Progresso Mensal -->
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.5rem;">
                    <h4 style="color: #10B981; margin: 0 0 1rem 0; font-size: 1.25rem;">📈 Evolução Mensal</h4>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                        ${progressData.monthlyProgress.map(month => `
                            <div style="background: rgba(15, 23, 42, 0.6); border-radius: 8px; padding: 1rem; text-align: center;">
                                <div style="color: #10B981; font-weight: 600; margin-bottom: 0.5rem;">${month.month}</div>
                                <div style="color: #F8FAFC; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;">
                                    ${month.classes}
                                </div>
                                <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.5rem;">aulas</div>
                                <div style="color: #F59E0B; font-weight: 600; font-size: 0.875rem;">
                                    ${month.frequency}% freq.
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #EF4444;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar progresso</div>
                <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                    ${error.message}
                </div>
                <button onclick="loadProgressTab()" 
                        style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    🔄 Tentar novamente
                </button>
            </div>
        `;
    }
}

/**
 * 🤖 INSIGHTS TAB - Dashboard IA  
 */
export async function loadInsightsTab() {
    console.log('🤖 Loading insights tab...');
    const contentEl = document.getElementById('page-tab-insights') || document.getElementById('page-tab-ai-dashboard');
    if (!contentEl) {
        throw new Error('Elemento de conteúdo não encontrado');
    }

    contentEl.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.8); border-radius: 16px; padding: 2rem; border: 1px solid #334155;">
            <div style="text-align: center; padding: 3rem; color: #94A3B8;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🤖</div>
                <div style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #F8FAFC;">Dashboard IA em desenvolvimento</div>
                <div style="font-size: 0.875rem;">Insights inteligentes e recomendações personalizadas em breve.</div>
            </div>
        </div>
    `;
}

/**
 * Legacy function for backward compatibility
 */
export async function loadStudentClassesTab() {
    console.log('🔄 Redirecting to new classes tab...');
    return loadClassesTab();
                </div>
            </div>
        `;

        // Load classes using centralized function
        const classes = await getCurrentStudentClasses();
        
        if (!classes || classes.length === 0) {
            contentEl.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🏫</div>
                    <div style="color: #94A3B8; font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
                        Nenhuma turma encontrada
                    </div>
                    <div style="color: #64748B; font-size: 0.875rem;">
                        Este aluno não possui turmas disponíveis no momento.
                    </div>
                </div>
            `;
            return;
        }

        // Render classes
        renderStudentClasses(classes, contentEl);
        
    } catch (error) {
        console.error('❌ Error loading classes tab:', error);
        // Try to find the correct classes content element for error display
        let contentEl = document.getElementById('page-tab-classes');
        if (!contentEl) {
            contentEl = document.getElementById('student-classes-content');
        }
        if (contentEl) {
            contentEl.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #EF4444;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar turmas</div>
                    <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                        ${error.message}
                    </div>
                    <button onclick="loadStudentClassesTab()" 
                            style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        🔄 Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Simplified plans tab loader for HTML
 */
export async function loadPlansTabContent() {
    console.log('📋 Loading plans tab...');
    try {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) {
            throw new Error('ID do aluno não encontrado');
        }

        // Try to find the correct plans content element
        let contentEl = document.getElementById('page-tab-plans');
        if (!contentEl) {
            // Fallback to old system
            contentEl = document.getElementById('plansContent');
        }
        
        if (!contentEl) {
            throw new Error('Elemento de conteúdo não encontrado');
        }
        
        console.log('✅ Found plans content element:', contentEl.id);

        // Show loading state
        contentEl.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #8B5CF6;">
                    <div style="width: 20px; height: 20px; border: 2px solid #8B5CF6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <span style="font-size: 1rem; color: #94A3B8;">Carregando planos...</span>
                </div>
            </div>
        `;

        // Load subscription using centralized function
        const subscription = await getCurrentStudentSubscription();
        
        if (!subscription || !subscription.plan) {
            contentEl.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📋</div>
                    <div style="color: #94A3B8; font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
                        Nenhum plano ativo
                    </div>
                    <div style="color: #64748B; font-size: 0.875rem;">
                        Este aluno não possui um plano ativo no momento.
                    </div>
                </div>
            `;
            return;
        }

        // Render plan information
        const plan = subscription.plan;
        contentEl.innerHTML = `
            <div style="padding: 1.5rem; background: rgba(15, 23, 42, 0.5); border-radius: 12px; border: 1px solid #334155;">
                <h3 style="color: #F8FAFC; margin: 0 0 1rem 0;">${plan.name}</h3>
                <p style="color: #94A3B8; margin: 0 0 1rem 0;">${plan.description || 'Sem descrição'}</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <label style="color: #64748B; font-size: 0.875rem;">Preço</label>
                        <div style="color: #F8FAFC; font-weight: 600;">R$ ${plan.price}</div>
                    </div>
                    <div>
                        <label style="color: #64748B; font-size: 0.875rem;">Tipo de Cobrança</label>
                        <div style="color: #F8FAFC; font-weight: 600;">${plan.billingType}</div>
                    </div>
                    <div>
                        <label style="color: #64748B; font-size: 0.875rem;">Aulas por Semana</label>
                        <div style="color: #F8FAFC; font-weight: 600;">${plan.classesPerWeek || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Error loading plans tab:', error);
        // Try to find the correct plans content element for error display
        let contentEl = document.getElementById('page-tab-plans');
        if (!contentEl) {
            contentEl = document.getElementById('plansContent');
        }
        if (contentEl) {
            contentEl.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #EF4444;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar planos</div>
                    <div style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 1.5rem;">
                        ${error.message}
                    </div>
                    <button onclick="loadPlansTabContent()" 
                            style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        🔄 Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Render student classes
 */
function renderStudentClasses(classes, container) {
    if (!classes || classes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #94A3B8;">
                Nenhuma turma encontrada
            </div>
        `;
        return;
    }

    const html = classes.map(classItem => `
        <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; margin-bottom: 1rem;">
            <h4 style="color: #F8FAFC; margin: 0 0 0.5rem 0;">${classItem.name || 'Turma sem nome'}</h4>
            <p style="color: #94A3B8; margin: 0 0 1rem 0; font-size: 0.875rem;">${classItem.description || 'Sem descrição'}</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.875rem;">
                <div>
                    <label style="color: #64748B;">Instrutor</label>
                    <div style="color: #F8FAFC;">${classItem.instructor || 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Horário</label>
                    <div style="color: #F8FAFC;">${classItem.schedule || 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Capacidade</label>
                    <div style="color: #F8FAFC;">${classItem.capacity || 'N/A'}</div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

/**
 * Render student courses with plan context and subscription details
 */
function renderStudentSubscriptionDetails(subscriptionDetails, container) {
    console.log('🎨 renderStudentSubscriptionDetails called:', {
        hasSubscription: subscriptionDetails?.hasSubscription || false,
        hasContainer: !!container,
        containerId: container?.id || 'No ID'
    });
    
    if (!container) {
        console.error('❌ Container element not provided to renderStudentSubscriptionDetails');
        return;
    }

    if (!subscriptionDetails.hasSubscription) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #94A3B8;">
                <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">💳</div>
                <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">
                    Nenhuma assinatura ativa
                </div>
                <div style="font-size: 0.875rem; margin-bottom: 2rem;">
                    Este aluno não possui uma assinatura de plano ativa
                </div>
                <button onclick="createSubscriptionForStudent()" 
                        style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    ➕ Criar Assinatura
                </button>
            </div>
        `;
        return;
    }

    const { subscription, plan, courses, paymentStatus } = subscriptionDetails;
    
    // Status colors and labels
    const statusColors = {
        'ACTIVE': '#10B981',
        'PENDING': '#F59E0B', 
        'SUSPENDED': '#EF4444',
        'CANCELLED': '#6B7280',
        'EXPIRED': '#374151',
        'NO_SUBSCRIPTION': '#6B7280'
    };

    const statusLabels = {
        'ACTIVE': 'Ativa',
        'PENDING': 'Pendente',
        'SUSPENDED': 'Suspensa', 
        'CANCELLED': 'Cancelada',
        'EXPIRED': 'Expirada',
        'NO_SUBSCRIPTION': 'Sem Assinatura'
    };

    const paymentMethodLabels = {
        'CREDIT_CARD': 'Cartão de Crédito',
        'DEBIT_CARD': 'Cartão de Débito',
        'PIX': 'PIX',
        'BANK_SLIP': 'Boleto Bancário',
        'CASH': 'Dinheiro',
        'BANK_TRANSFER': 'Transferência'
    };

    container.innerHTML = `
        <!-- Subscription Status Header -->
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem;">
                <h4 style="color: #3B82F6; margin: 0; font-size: 1.25rem;">💳 Status da Assinatura</h4>
                <span style="background: ${statusColors[paymentStatus] || '#6B7280'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                    ${statusLabels[paymentStatus] || paymentStatus}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">📅 Data de Início</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">📆 Próximo Pagamento</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">💳 Método de Pagamento</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${paymentMethodLabels[subscription.paymentMethod] || subscription.paymentMethod || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">💰 Valor</div>
                    <div style="color: #10B981; font-weight: 600; font-size: 1.1rem;">R$ ${parseFloat(plan?.price || 0).toFixed(2)}</div>
                </div>
            </div>
        </div>

        <!-- Plan Details -->
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
            <h4 style="color: #10B981; margin: 0 0 1rem 0; font-size: 1.25rem;">📋 Detalhes do Plano</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">📄 Nome do Plano</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${plan?.name || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">📂 Categoria</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${plan?.category || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">🔄 Tipo de Cobrança</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${plan?.billingType || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.25rem;">⏱️ Duração</div>
                    <div style="color: #F8FAFC; font-weight: 600;">${plan?.duration || 'N/A'} meses</div>
                </div>
            </div>
            
            ${plan?.description ? `
                <div>
                    <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem;">📝 Descrição</div>
                    <div style="color: #CBD5E1; font-size: 0.875rem; line-height: 1.5;">${plan.description}</div>
                </div>
            ` : ''}
        </div>

        <!-- Courses Included -->
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="color: #8B5CF6; margin: 0; font-size: 1.25rem;">📚 Meus Cursos</h4>
                <span style="background: rgba(139, 92, 246, 0.2); color: #A855F7; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                    ${courses?.length || 0} curso${(courses?.length || 0) !== 1 ? 's' : ''} incluso${(courses?.length || 0) !== 1 ? 's' : ''}
                </span>
            </div>
            
            ${courses && courses.length > 0 ? `
                <div style="display: grid; gap: 1rem;">
                    ${courses.map((course, index) => `
                        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; padding: 1.25rem; position: relative; overflow: hidden;">
                            <!-- Course Number Badge -->
                            <div style="position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.75rem; border: 3px solid rgba(139, 92, 246, 0.1);">
                                ${index + 1}
                            </div>
                            
                            <!-- Course Header -->
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="color: #F8FAFC; font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${course.name}</div>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <span style="background: rgba(139, 92, 246, 0.3); color: #A855F7; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                                            ${course.level}
                                        </span>
                                        <span style="color: #94A3B8; font-size: 0.75rem;">•</span>
                                        <span style="color: #94A3B8; font-size: 0.75rem;">${course.category || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Course Description -->
                            <div style="color: #CBD5E1; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1rem;">
                                ${course.description || 'Sem descrição disponível'}
                            </div>
                            
                            <!-- Course Details Grid -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                                ${course.duration ? `
                                    <div style="background: rgba(139, 92, 246, 0.1); padding: 0.5rem; border-radius: 6px;">
                                        <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.25rem;">⏱️ Duração</div>
                                        <div style="color: #F8FAFC; font-weight: 600; font-size: 0.875rem;">${course.duration} semanas</div>
                                    </div>
                                ` : ''}
                                ${course.totalClasses ? `
                                    <div style="background: rgba(139, 92, 246, 0.1); padding: 0.5rem; border-radius: 6px;">
                                        <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.25rem;">📚 Total de Aulas</div>
                                        <div style="color: #F8FAFC; font-weight: 600; font-size: 0.875rem;">${course.totalClasses} aulas</div>
                                    </div>
                                ` : ''}
                                ${course.classesPerWeek ? `
                                    <div style="background: rgba(139, 92, 246, 0.1); padding: 0.5rem; border-radius: 6px;">
                                        <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.25rem;">📅 Frequência</div>
                                        <div style="color: #F8FAFC; font-weight: 600; font-size: 0.875rem;">${course.classesPerWeek}x por semana</div>
                                    </div>
                                ` : ''}
                                ${course.martialArt ? `
                                    <div style="background: rgba(139, 92, 246, 0.1); padding: 0.5rem; border-radius: 6px;">
                                        <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.25rem;">🥋 Arte Marcial</div>
                                        <div style="color: #F8FAFC; font-weight: 600; font-size: 0.875rem;">${course.martialArt}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <!-- Course Objectives -->
                            ${course.objectives && course.objectives.length > 0 ? `
                                <div style="margin-bottom: 1rem;">
                                    <div style="color: #94A3B8; font-size: 0.75rem; margin-bottom: 0.5rem; font-weight: 600;">🎯 OBJETIVOS DO CURSO</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                        ${course.objectives.slice(0, 3).map(objective => `
                                            <span style="background: rgba(16, 185, 129, 0.1); color: #10B981; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; border: 1px solid rgba(16, 185, 129, 0.2);">
                                                ✓ ${objective}
                                            </span>
                                        `).join('')}
                                        ${course.objectives.length > 3 ? `
                                            <span style="color: #94A3B8; font-size: 0.75rem; align-self: center;">
                                                +${course.objectives.length - 3} mais...
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Course Status and Actions -->
                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid rgba(139, 92, 246, 0.2);">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div style="width: 8px; height: 8px; background: ${course.isActive ? '#10B981' : '#6B7280'}; border-radius: 50%;"></div>
                                    <span style="color: ${course.isActive ? '#10B981' : '#6B7280'}; font-size: 0.75rem; font-weight: 600;">
                                        ${course.isActive ? 'Curso Ativo' : 'Curso Inativo'}
                                    </span>
                                </div>
                                <button onclick="viewCourseDetails('${course.id}')" 
                                        style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); color: #A855F7; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                                    📖 Ver Detalhes
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Courses Summary -->
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.1);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; text-align: center;">
                        <div>
                            <div style="color: #8B5CF6; font-weight: 600; font-size: 1.1rem;">${courses.length}</div>
                            <div style="color: #94A3B8; font-size: 0.75rem;">Total Cursos</div>
                        </div>
                        <div>
                            <div style="color: #8B5CF6; font-weight: 600; font-size: 1.1rem;">${courses.filter(c => c.isActive).length}</div>
                            <div style="color: #94A3B8; font-size: 0.75rem;">Ativos</div>
                        </div>
                        <div>
                            <div style="color: #8B5CF6; font-weight: 600; font-size: 1.1rem;">${courses.reduce((sum, c) => sum + (c.totalClasses || 0), 0)}</div>
                            <div style="color: #94A3B8; font-size: 0.75rem;">Total Aulas</div>
                        </div>
                        <div>
                            <div style="color: #8B5CF6; font-weight: 600; font-size: 1.1rem;">${Math.round(courses.reduce((sum, c) => sum + (c.duration || 0), 0) / courses.length) || 0}</div>
                            <div style="color: #94A3B8; font-size: 0.75rem;">Duração Média</div>
                        </div>
                    </div>
                </div>
            ` : `
                <div style="text-align: center; padding: 3rem; color: #94A3B8;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📚</div>
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Nenhum curso associado</div>
                    <div style="font-size: 0.875rem; opacity: 0.8;">Este plano não possui cursos inclusos ou os cursos não foram encontrados</div>
                </div>
            `}
        </div>
        
        ${subscription.notes ? `
            <div style="background: rgba(248, 250, 252, 0.05); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem;">
                <h4 style="color: #CBD5E1; margin: 0 0 0.5rem 0; font-size: 1rem;">📝 Observações</h4>
                <div style="color: #94A3B8; font-size: 0.875rem; line-height: 1.5;">${subscription.notes}</div>
            </div>
        ` : ''}
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(148, 163, 184, 0.2);">
            <button onclick="editStudentSubscription()" 
                    style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                ✏️ Editar Assinatura
            </button>
            <button onclick="viewSubscriptionHistory()" 
                    style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #CBD5E1; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                📊 Histórico
            </button>
        </div>
    `;
}

function renderStudentCoursesWithPlan(courses, plan, container) {
    console.log('🎨 renderStudentCoursesWithPlan called:', {
        coursesCount: courses?.length || 0,
        planName: plan?.name || 'No plan',
        hasContainer: !!container,
        containerId: container?.id || 'No ID'
    });
    
    if (!container) {
        console.error('❌ Container element not provided to renderStudentCoursesWithPlan');
        return;
    }
    
    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #94A3B8;">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📚</div>
                <div style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
                    Nenhum curso encontrado
                </div>
                <div style="font-size: 0.875rem;">
                    Este aluno não possui cursos disponíveis no plano ativo.
                </div>
            </div>
        `;
        return;
    }

    // Get subscription details for display
    const subscription = studentDataCache.subscription;
    
    const subscriptionInfo = subscription ? `
        <div style="background: rgba(59, 130, 246, 0.1); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgba(59, 130, 246, 0.3);">
            <h4 style="color: #3B82F6; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
                💳 Assinatura Ativa
                <span style="background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                    ${subscription.status || 'ACTIVE'}
                </span>
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.875rem; color: #94A3B8;">
                <div>
                    <label style="color: #64748B;">ID da Assinatura:</label>
                    <div style="color: #E2E8F0; font-family: monospace; font-size: 0.75rem;">${subscription.id}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Plano:</label>
                    <div style="color: #E2E8F0;">${plan?.name || 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Valor:</label>
                    <div style="color: #10B981; font-weight: 600;">R$ ${subscription.currentPrice || plan?.price || '0'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Tipo de Cobrança:</label>
                    <div style="color: #E2E8F0;">${subscription.billingType || plan?.billingType || 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Início:</label>
                    <div style="color: #E2E8F0;">${subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Próximo Pagamento:</label>
                    <div style="color: #F59E0B;">${subscription.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR') : 'N/A'}</div>
                </div>
                <div>
                    <label style="color: #64748B;">Renovação Automática:</label>
                    <div style="color: ${subscription.autoRenew ? '#10B981' : '#EF4444'};">${subscription.autoRenew ? '✅ Sim' : '❌ Não'}</div>
                </div>
            </div>
        </div>
    ` : '';

    const html = `
        ${subscriptionInfo}
        <div style="background: rgba(16, 185, 129, 0.05); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; border: 1px solid rgba(16, 185, 129, 0.2);">
            <h4 style="color: #10B981; margin: 0 0 0.5rem 0;">📚 Cursos Inclusos na Assinatura</h4>
            <div style="color: #94A3B8; font-size: 0.875rem;">
                ${courses.length} curso(s) disponível(is) através do plano "${plan?.name || 'N/A'}"
            </div>
        </div>
        
        <div style="display: grid; gap: 1rem;">
            ${courses.map(course => `
                <div style="background: rgba(15, 23, 42, 0.5); border-radius: 12px; padding: 1.5rem; border: 1px solid #334155;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="color: #F8FAFC; margin: 0 0 0.5rem 0;">
                                📚 ${course.name || `Curso ID: ${course.id}`}
                            </h4>
                            <div style="color: #94A3B8; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                ${course.description || 'Descrição não disponível'}
                            </div>
                            ${course.level ? `<div style="color: #8B5CF6; font-size: 0.75rem;">🎯 Nível: ${course.level}</div>` : ''}
                        </div>
                        <span style="background: rgba(16, 185, 129, 0.1); color: #10B981; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid rgba(16, 185, 129, 0.3);">
                            ATIVO
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; font-size: 0.875rem; background: rgba(0, 0, 0, 0.2); padding: 1rem; border-radius: 8px;">
                        <div>
                            <label style="color: #64748B;">ID do Curso:</label>
                            <div style="color: #E2E8F0; font-family: monospace; font-size: 0.75rem;">${course.id}</div>
                        </div>
                        <div>
                            <label style="color: #64748B;">Fonte:</label>
                            <div style="color: #3B82F6;">${course.fromPlan ? '💳 Plano de Pagamento' : '✋ Manual'}</div>
                        </div>
                        <div>
                            <label style="color: #64748B;">Matrícula:</label>
                            <div style="color: #10B981;">✅ Automática</div>
                        </div>
                        ${course.duration ? `
                        <div>
                            <label style="color: #64748B;">Duração:</label>
                            <div style="color: #E2E8F0;">${course.duration} semanas</div>
                        </div>
                        ` : ''}
                        ${course.totalClasses ? `
                        <div>
                            <label style="color: #64748B;">Total de Aulas:</label>
                            <div style="color: #E2E8F0;">${course.totalClasses} aulas</div>
                        </div>
                        ` : ''}
                        <div>
                            <label style="color: #64748B;">Status do Curso:</label>
                            <div style="color: ${course.isActive ? '#10B981' : '#EF4444'};">${course.isActive ? '🟢 Ativo' : '🔴 Inativo'}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = html;
    console.log('✅ renderStudentCoursesWithPlan completed successfully');
}

// Architecture-compliant: Essential function exposures for basic functionality
window.loadAndRenderStudents = loadAndRenderStudents;
window.renderStudentsTable = renderStudentsTable;
window.renderStudentsGrid = renderStudentsGrid;
window.openStudentEditPage = openStudentEditPage;
window.setCurrentEditingStudent = setCurrentEditingStudent;
window.getCurrentEditingStudentId = getCurrentEditingStudentId;
window.loadStudentCoursesTab = loadStudentCoursesTab;
window.loadStudentClassesTab = loadStudentClassesTab;

// UX Architected Tab Functions - Global Exposure
window.loadProfileTab = loadProfileTab;
window.loadFinancialTab = loadFinancialTab;
window.loadEnrollmentsTab = loadEnrollmentsTab;
window.loadClassesTab = loadClassesTab;
window.loadProgressTab = loadProgressTab;
window.loadInsightsTab = loadInsightsTab;
window.STUDENT_TABS = STUDENT_TABS;

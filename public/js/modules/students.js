(function() {
    'use strict';
    
    // ==============================================
    // STUDENT TABS STRUCTURE - ENHANCED UX
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
    
    // Module state - Enhanced
    let allStudents = [];
    let filteredStudents = [];
    let currentView = 'grid';
    let currentEditingStudentId = null;
    let currentEditingStudent = null;
    let studentDataCache = {};
    let isLoading = false;
    
    // Export initialization function for manual loading (SPA compatibility)
    window.initializeStudentsModule = initializeStudentsModule;
    
    // Module initialization
    async function initializeStudentsModule() {
        console.log('🔧 Initializing Students Module...');
        
        try {
            // Check if we're on the students list page
            const studentsContainer = document.getElementById('studentsContainer');
            if (!studentsContainer) {
                console.log('ℹ️ Not on students list page, skipping students module initialization');
                return;
            }
            
            // Validate that other required DOM elements exist
            const requiredElements = [
                'studentSearch',
                'statusFilter', 
                'planFilter',
                'tableViewBtn',
                'gridViewBtn',
                'clearFiltersBtn',
                'activeStudents',
                'inactiveStudents',
                'newStudents'
            ];
            
            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    console.warn(`⚠️ Required element '${elementId}' not found`);
                }
            }
            
            console.log('✅ DOM validation passed - studentsContainer found');
            
            // Wait a bit more to ensure all DOM elements are properly rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await loadInitialData();
            setupEventListeners();
            
            console.log('✅ Students Module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing students module:', error);
            showError('Erro ao inicializar módulo de alunos');
        }
    }
    
    // Load initial data with parallel execution
    async function loadInitialData() {
        // Load students and plans in parallel for better performance
        await Promise.all([
            loadStudentsList(),
            loadPlansForFilter()
        ]);
    }
    
    // Load plans for the filter dropdown
    async function loadPlansForFilter() {
        const planFilter = document.getElementById('planFilter');
        if (!planFilter) {
            console.warn('⚠️ Plan filter element not found, skipping plan load.');
            return;
        }

        try {
            console.log('🔧 Loading plans for filter...');
            const response = await fetch('/api/billing-plans');
            const data = await response.json();
            
            if (data.success) {
                populatePlanFilter(data.data);
                console.log('✅ Plans loaded for filter:', data.data.length);
            } else {
                console.warn('⚠️ Failed to load plans:', data.error);
            }
        } catch (error) {
            console.error('❌ Error loading plans for filter:', error);
        }
    }
    
    // Populate the plan filter dropdown
    function populatePlanFilter(plans) {
        const planFilter = document.getElementById('planFilter');
        if (!planFilter) {
            console.warn('⚠️ Plan filter element not found');
            return;
        }
        
        // Clear existing options except the first (All Plans)
        const firstOption = planFilter.firstElementChild;
        planFilter.innerHTML = '';
        if (firstOption) {
            planFilter.appendChild(firstOption);
        }
        
        // Add plan options (filter only active plans)
        plans.filter(plan => plan.isActive).forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = plan.name;
            planFilter.appendChild(option);
        });
        
        console.log('✅ Plan filter populated with', plans.length, 'plans');
    }
    
    // Setup event listeners
    function setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        // Search input
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterStudents, 300));
            console.log('✅ Search input listener added');
        } else {
            console.warn('⚠️ Search input not found');
        }
        
        // Filter selects
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', filterStudents);
            console.log('✅ Status filter listener added');
        } else {
            console.warn('⚠️ Status filter not found');
        }
        
        const planFilter = document.getElementById('planFilter');
        if (planFilter) {
            planFilter.addEventListener('change', filterStudents);
            console.log('✅ Plan filter listener added');
        } else {
            console.warn('⚠️ Plan filter not found');
        }
        
        // View toggle buttons
        const tableViewBtn = document.getElementById('tableViewBtn');
        const gridViewBtn = document.getElementById('gridViewBtn');
        
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => switchView('table'));
            console.log('✅ Table view button listener added');
        } else {
            console.warn('⚠️ Table view button not found');
        }
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => switchView('grid'));
            console.log('✅ Grid view button listener added');
        } else {
            console.warn('⚠️ Grid view button not found');
        }
        
        // Setup clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
            console.log('✅ Clear filters button listener added');
        } else {
            console.warn('⚠️ Clear filters button not found');
        }
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Load students list
    async function loadStudentsList() {
        console.log('🔄 Loading students list...');
        
        try {
            showLoadingState();
            
            // Add performance timing
            const startTime = performance.now();
            const response = await fetch('/api/students?limit=100', {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            const result = await response.json();
            const endTime = performance.now();
            console.log(`⚡ API Response time: ${(endTime - startTime).toFixed(2)}ms`);
            
            if (result.success) {
                allStudents = (result.data || []).map(student => ({
                    ...student,
                    // Add isActive property if it doesn't exist (assume active by default)
                    isActive: student.isActive !== undefined ? student.isActive : true
                }));
                filteredStudents = [...allStudents];
                
                console.log(`📊 Loaded ${allStudents.length} students`);
                
                updateStudentsDisplay();
                updateStudentsStats();
                hideLoadingState();
                
                if (allStudents.length === 0) {
                    showEmptyState();
                }
            } else {
                throw new Error(result.message || 'Failed to load students');
            }
        } catch (error) {
            console.error('❌ Error loading students:', error);
            hideLoadingState();
            showError('Erro ao carregar alunos: ' + error.message);
        }
    }
    
    // Filter students
    // Enhanced filtering with comprehensive search (migrated from legacy)
    function filterStudents() {
        const searchTerm = getElementValue('studentSearch').toLowerCase().trim();
        const statusFilter = getElementValue('statusFilter');
        const planFilter = getElementValue('planFilter');
        
        filteredStudents = allStudents.filter(student => {
            // Enhanced search - multiple fields (from legacy module)
            let searchMatch = true;
            if (searchTerm) {
                const user = student.user || {};
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const phone = (user.phone || student.phone || '').toLowerCase();
                const cpf = (user.cpf || student.cpf || '').toLowerCase();
                const category = (student.category || '').toLowerCase();
                const matricula = (student.matricula || '').toLowerCase();
                const studentId = (student.id || '').toLowerCase();
                
                searchMatch = fullName.includes(searchTerm) || 
                             email.includes(searchTerm) || 
                             phone.includes(searchTerm) || 
                             cpf.includes(searchTerm) || 
                             category.includes(searchTerm) || 
                             matricula.includes(searchTerm) ||
                             studentId.includes(searchTerm);
            }
            
            // Status filter
            let statusMatch = true;
            if (statusFilter) {
                statusMatch = statusFilter === 'active' ? student.isActive : !student.isActive;
            }
            
            // Plan filter (match by plan ID)
            let planMatch = true;
            if (planFilter) {
                // Check if student has a subscription with the selected plan
                if (student.subscriptions && student.subscriptions.length > 0) {
                    planMatch = student.subscriptions.some(sub => 
                        sub.billingPlan?.id === planFilter || sub.planId === planFilter
                    );
                } else {
                    planMatch = false; // No subscriptions = no plan match
                }
            }
            
            return searchMatch && statusMatch && planMatch;
        });
        
        updateStudentsDisplay();
        updateStudentsStats();
    }
    
    // Switch between table and grid view
    function switchView(view) {
        currentView = view;
        
        // Update button states
        const tableViewBtn = document.getElementById('tableViewBtn');
        const gridViewBtn = document.getElementById('gridViewBtn');
        
        if (tableViewBtn && gridViewBtn) {
            tableViewBtn.classList.toggle('active', view === 'table');
            gridViewBtn.classList.toggle('active', view === 'grid');
        }
        
        // Re-render with new view
        updateStudentsDisplay();
    }
    
    // Clear all filters
    function clearFilters() {
        // Clear search
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Clear filters
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.value = '';
        }
        
        const planFilter = document.getElementById('planFilter');
        if (planFilter) {
            planFilter.value = '';
        }
        
        // Re-filter
        filterStudents();
    }
    
    // Update students display
    function updateStudentsDisplay() {
        const container = document.getElementById('studentsContainer');
        if (!container) {
            console.error('❌ updateStudentsDisplay: studentsContainer not found');
            return;
        }
        
        if (filteredStudents.length === 0) {
            if (allStudents.length === 0) {
                container.innerHTML = getEmptyStateHTML();
            } else {
                container.innerHTML = getFilteredEmptyStateHTML();
            }
            return;
        }
        
        if (currentView === 'grid') {
            container.innerHTML = renderGridView(filteredStudents);
        } else {
            container.innerHTML = renderTableView(filteredStudents);
        }
    }
    
    // Render grid view
    function renderGridView(students) {
        return `
            <div class="students-isolated">
                <div class="students-grid">
                    ${students.map(student => `
                        <div class="student-card" onclick="openStudentDetails('${student.id}')">
                            <div class="student-header">
                                <div class="student-avatar">
                                    ${getStudentInitials(student)}
                                </div>
                                <div class="student-info">
                                    <div class="student-name">${getStudentName(student)}</div>
                                    <div class="student-email">${student.user?.email || 'N/A'}</div>
                                    <div class="student-status ${student.isActive ? 'active' : 'inactive'}">
                                        ${student.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                    </div>
                                </div>
                            </div>
                            <div class="student-details">
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Categoria</div>
                                    <div class="student-detail-value">${student.category || 'ADULT'}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Matrícula</div>
                                    <div class="student-detail-value">${student.id.substring(0, 8).toUpperCase()}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Plano</div>
                                    <div class="student-detail-value">${student.plan?.name || 'Não definido'}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Cadastro</div>
                                    <div class="student-detail-value">${formatDate(student.createdAt)}</div>
                                </div>
                            </div>
                            <div class="student-actions">
                                <button class="btn-action btn-view" onclick="event.stopPropagation(); viewStudent('${student.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn-action btn-edit" onclick="event.stopPropagation(); editStudent('${student.id}')">
                                    ✏️ Editar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Render table view
    function renderTableView(students) {
        return `
            <div class="students-isolated">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Email</th>
                                <th>Categoria</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr ondblclick="editStudent('${student.id}')">
                                    <td>
                                        <div class="student-info">
                                            <div class="student-avatar">
                                                ${getStudentInitials(student)}
                                            </div>
                                            <div class="student-details">
                                                <div class="student-name">${getStudentName(student)}</div>
                                                <div class="student-detail-value">${student.category || 'ADULT'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${student.user?.email || 'N/A'}</td>
                                    <td>${student.category || 'ADULT'}</td>
                                    <td>
                                        <span class="student-status ${student.isActive ? 'active' : 'inactive'}">
                                            ${student.isActive ? '✅ Ativo' : '⏸️ Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="table-actions">
                                            <button class="btn-action btn-view" onclick="viewStudent('${student.id}')">
                                                👁️ Ver
                                            </button>
                                            <button class="btn-action btn-edit" onclick="editStudent('${student.id}')">
                                                ✏️ Editar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Get empty state HTML
    function getEmptyStateHTML() {
        return `
            <div class="students-isolated">
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-title">Nenhum aluno encontrado</div>
                    <div class="empty-state-description">Comece adicionando o primeiro aluno</div>
                    <button class="btn btn-primary" onclick="openNewStudentForm()">
                        ➕ Novo Aluno
                    </button>
                </div>
            </div>
        `;
    }
    
    // Get filtered empty state HTML
    function getFilteredEmptyStateHTML() {
        return `
            <div class="students-isolated">
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">Nenhum aluno encontrado</div>
                    <div class="empty-state-description">Tente ajustar os filtros ou limpar a pesquisa</div>
                    <button class="btn btn-primary" onclick="clearFilters()">
                        🔄 Limpar Filtros
                    </button>
                </div>
            </div>
        `;
    }
    
    // Update students stats
    function updateStudentsStats() {
        const stats = calculateStudentsStats();
        
        updateElementText('totalStudents', stats.total);
        updateElementText('activeStudents', stats.active);
        updateElementText('inactiveStudents', stats.inactive);
        updateElementText('newStudents', stats.new);
    }
    
    // Calculate students statistics
    function calculateStudentsStats() {
        const total = allStudents.length;
        const active = allStudents.filter(s => s.isActive).length;
        const inactive = total - active;
        
        // Calculate new students (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newStudents = allStudents.filter(student => {
            if (!student.createdAt) return false;
            return new Date(student.createdAt) >= thirtyDaysAgo;
        }).length;
        
        return {
            total,
            active,
            inactive,
            new: newStudents
        };
    }
    
    // Show loading state
    function showLoadingState() {
        const container = document.getElementById('studentsContainer');
        if (!container) {
            console.error('❌ showLoadingState: studentsContainer not found');
            return;
        }
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div>🔄 Carregando alunos...</div>
                <small class="loading-details">Otimizando consulta na base de dados...</small>
            </div>
        `;
    }
    
    // Hide loading state
    function hideLoadingState() {
        // Loading state will be replaced by actual content
    }
    
    // Show empty state
    function showEmptyState() {
        // Empty state is handled in updateStudentsDisplay
    }
    
    // Show error state
    function showError(message) {
        const container = document.getElementById('studentsContainer');
        if (!container) {
            console.error('❌ showError: studentsContainer not found in DOM');
            console.error('❌ Available DOM elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <div class="error-message">${message}</div>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
    
    // Helper function to get element value
    function getElementValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }
    
    // Helper function to update element text
    function updateElementText(id, text) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ updateElementText: Element with ID '${id}' not found`);
            return;
        }
        element.textContent = text;
    }
    
    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return 'N/A';
        }
    }
    
    // Helper function to get student initials
    function getStudentInitials(student) {
        const firstName = student.user?.firstName || '';
        const lastName = student.user?.lastName || '';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        return initials || '?';
    }
    
    // Helper function to get student name
    function getStudentName(student) {
        const firstName = student.user?.firstName || '';
        const lastName = student.user?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || 'Nome não informado';
    }
    
    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Global functions for external access - Updated for SPA compatibility
    window.openNewStudentForm = function() {
        // Store navigation intent for the editor
        localStorage.setItem('studentEditorMode', JSON.stringify({
            mode: 'create',
            studentId: null,
            timestamp: Date.now()
        }));
        
        // Use SPA navigation instead of window.location.href
        if (window.navigateToModule) {
            window.navigateToModule('student-editor');
        } else {
            // Fallback if navigateToModule is not available
            console.warn('navigateToModule not available, using fallback');
            window.location.href = '/views/student-editor.html';
        }
    };
    
    window.viewStudent = function(studentId) {
        // Store navigation intent for the editor
        localStorage.setItem('studentEditorMode', JSON.stringify({
            mode: 'view',
            studentId: studentId,
            timestamp: Date.now()
        }));
        
        if (window.navigateToModule) {
            window.navigateToModule('student-editor');
        } else {
            window.location.href = `/views/student-editor.html?id=${studentId}&mode=view`;
        }
    };
    
    window.editStudent = function(studentId) {
        console.log('✏️ editStudent called with ID:', studentId);
        
        // Store navigation intent for the editor
        const editorData = {
            mode: 'edit',
            studentId: studentId,
            timestamp: Date.now()
        };
        
        console.log('📱 Storing in localStorage:', editorData);
        localStorage.setItem('studentEditorMode', JSON.stringify(editorData));
        
        if (window.navigateToModule) {
            console.log('🔄 Navigating to student-editor module...');
            window.navigateToModule('student-editor');
        } else {
            console.log('🔄 Fallback navigation to student-editor.html...');
            window.location.href = `/views/student-editor.html?id=${studentId}&mode=edit`;
        }
    };
    
    window.openStudentDetails = function(studentId) {
        // Store navigation intent for the editor (default to edit mode for details)
        localStorage.setItem('studentEditorMode', JSON.stringify({
            mode: 'edit',
            studentId: studentId,
            timestamp: Date.now()
        }));
        
        if (window.navigateToModule) {
            window.navigateToModule('student-editor');
        } else {
            window.location.href = `/views/student-editor.html?id=${studentId}`;
        }
    };
    
    window.refreshStudents = function() {
        loadStudentsList();
    };
    
    window.clearFilters = clearFilters;
    
    // ==============================================
    // STATE MANAGEMENT - Enhanced (from legacy)
    // ==============================================
    
    // Set current editing student
    function setCurrentEditingStudent(student) {
        currentEditingStudent = student;
        currentEditingStudentId = student?.id || null;
        
        // Cache student data
        if (student && student.id) {
            studentDataCache[student.id] = student;
        }
        
        console.log('🎯 Current editing student set:', student?.user?.firstName || 'Unknown');
    }
    
    // Get current editing student ID from multiple sources
    function getCurrentEditingStudentId() {
        // Priority order: explicit ID > current student > URL params > localStorage
        if (currentEditingStudentId) return currentEditingStudentId;
        if (currentEditingStudent?.id) return currentEditingStudent.id;
        
        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        const urlStudentId = urlParams.get('studentId');
        if (urlStudentId) return urlStudentId;
        
        // Check localStorage as fallback
        const storedId = localStorage.getItem('currentEditingStudentId');
        return storedId || null;
    }
    
    // Clear student data cache
    function clearStudentDataCache() {
        studentDataCache = {};
        currentEditingStudent = null;
        currentEditingStudentId = null;
        console.log('🧹 Student data cache cleared');
    }
    
    // Get student from cache or fetch
    async function getStudent(studentId) {
        if (!studentId) return null;
        
        // Check cache first
        if (studentDataCache[studentId]) {
            console.log('📋 Student loaded from cache:', studentId);
            return studentDataCache[studentId];
        }
        
        // Fetch from API
        try {
            const response = await fetch(`/api/students/${studentId}`);
            if (response.ok) {
                const data = await response.json();
                const student = data.success ? data.data : null;
                
                // Cache the result
                if (student) {
                    studentDataCache[studentId] = student;
                }
                
                return student;
            }
        } catch (error) {
            console.error('❌ Error fetching student:', error);
        }
        
        return null;
    }
    
    // ==============================================
    // TAB LOADING SYSTEM (from legacy)
    // ==============================================
    
    // Load profile tab
    async function loadProfileTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('profile-content');
        
        try {
            const student = await getStudent(studentId);
            if (student) {
                renderProfileContent(student);
            } else {
                showError('Estudante não encontrado');
            }
        } catch (error) {
            console.error('❌ Error loading profile tab:', error);
            showError('Erro ao carregar perfil do estudante');
        }
    }
    
    // Load financial tab
    async function loadFinancialTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('financial-content');
        
        try {
            const subscription = await getCurrentStudentSubscription(studentId);
            renderFinancialContent(subscription);
        } catch (error) {
            console.error('❌ Error loading financial tab:', error);
            showError('Erro ao carregar dados financeiros');
        }
    }
    
    // Load enrollments tab - Cursos Matriculados
    async function loadEnrollmentsTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('enrollments-content');
        
        try {
            const response = await fetch(`/api/students/${studentId}/enrollments`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderEnrollmentsContent(data.data || []);
                } else {
                    showError('Erro ao carregar matrículas: ' + (data.error || 'Erro desconhecido'));
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error loading enrollments tab:', error);
            showError('Erro ao carregar dados de matrículas');
        }
    }
    
    // Load classes tab - Turmas Ativas
    async function loadClassesTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('classes-content');
        
        try {
            const response = await fetch(`/api/students/${studentId}/classes`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderClassesContent(data.data || []);
                } else {
                    showError('Erro ao carregar turmas: ' + (data.error || 'Erro desconhecido'));
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error loading classes tab:', error);
            showError('Erro ao carregar dados de turmas');
        }
    }
    
    // Load progress tab - Progresso Geral
    async function loadProgressTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('progress-content');
        
        try {
            const response = await fetch(`/api/students/${studentId}/progress`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderProgressContent(data.data || {});
                } else {
                    showError('Erro ao carregar progresso: ' + (data.error || 'Erro desconhecido'));
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error loading progress tab:', error);
            showError('Erro ao carregar dados de progresso');
        }
    }
    
    // Get current student subscription
    async function getCurrentStudentSubscription(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}/subscription`);
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : null;
            }
        } catch (error) {
            console.error('❌ Error fetching subscription:', error);
        }
        return null;
    }

    // Get available plans for subscription
    async function getAvailablePlans() {
        try {
            const response = await fetch('/api/plans');
            if (response.ok) {
                const data = await response.json();
                return data.success ? data.data : [];
            }
        } catch (error) {
            console.error('❌ Error fetching available plans:', error);
        }
        return [];
    }

    // Modify student subscription
    async function modifyStudentSubscription(studentId, subscriptionData) {
        try {
            const response = await fetch(`/api/students/${studentId}/subscription`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return data.data;
                }
                throw new Error(data.error || 'Failed to modify subscription');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            console.error('❌ Error modifying subscription:', error);
            throw error;
        }
    }
    
    // Show loading state
    function showLoadingState(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="students-isolated-loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando...</p>
                </div>
            `;
        }
    }
    
    // Render profile content
    function renderProfileContent(student) {
        const container = document.getElementById('profile-content');
        if (!container) return;
        
        const user = student.user || {};
        container.innerHTML = `
            <div class="students-isolated-profile">
                <h3>Dados Pessoais</h3>
                <div class="profile-field">
                    <label>Nome Completo:</label>
                    <span>${user.firstName || ''} ${user.lastName || ''}</span>
                </div>
                <div class="profile-field">
                    <label>Email:</label>
                    <span>${user.email || 'Não informado'}</span>
                </div>
                <div class="profile-field">
                    <label>Categoria:</label>
                    <span>${student.category || 'Não informado'}</span>
                </div>
                <div class="profile-field">
                    <label>Matrícula:</label>
                    <span>${student.matricula || 'Não informado'}</span>
                </div>
            </div>
        `;
    }
    
    // Render financial content
    function renderFinancialContent(subscription) {
        const container = document.getElementById('financial-content');
        if (!container) return;
        
        if (!subscription) {
            container.innerHTML = `
                <div class="students-isolated-no-data">
                    <p>Nenhuma assinatura ativa encontrada</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="students-isolated-financial">
                <h3>Assinatura Ativa</h3>
                <div class="subscription-info">
                    <div class="field">
                        <label>Plano:</label>
                        <span>${subscription.plan?.name || 'Não informado'}</span>
                    </div>
                    <div class="field">
                        <label>Status:</label>
                        <span class="status ${subscription.status?.toLowerCase()}">${subscription.status || 'Desconhecido'}</span>
                    </div>
                    <div class="field">
                        <label>Valor:</label>
                        <span>R$ ${subscription.plan?.price || '0.00'}</span>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="showSubscriptionEditModal('${subscription.id}')">
                    ✏️ Alterar Assinatura
                </button>
            </div>
        `;
    }

    // Show subscription edit modal
    async function showSubscriptionEditModal(subscriptionId) {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;

        try {
            const [subscription, plans] = await Promise.all([
                getCurrentStudentSubscription(studentId),
                getAvailablePlans()
            ]);

            if (!subscription || !plans.length) {
                showError('Não foi possível carregar dados para edição');
                return;
            }

            // TODO: Implement modal UI for subscription editing
            console.log('Editing subscription:', subscription);
            console.log('Available plans:', plans);
        } catch (error) {
            console.error('Error loading subscription edit data:', error);
            showError('Erro ao carregar dados para edição');
        }
    }

    // Load insights tab - Dashboard IA
    async function loadInsightsTab() {
        const studentId = getCurrentEditingStudentId();
        if (!studentId) return;
        
        showLoadingState('insights-content');
        
        try {
            const response = await fetch(`/api/students/${studentId}/insights`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderInsightsContent(data.data);
                } else {
                    showError('Erro ao carregar insights: ' + (data.error || 'Erro desconhecido'));
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error loading insights tab:', error);
            showError('Erro ao carregar insights do estudante');
        }
    }
    
    // Render insights content
    function renderInsightsContent(insights) {
        const container = document.getElementById('insights-content');
        if (!container) return;
        
        if (!insights || insights.length === 0) {
            container.innerHTML = `
                <div class="students-isolated-no-data">
                    <div class="insights-empty">
                        <div class="insights-empty-icon">🤖</div>
                        <h3>Nenhum insight disponível</h3>
                        <p>Não foram encontrados dados suficientes para gerar insights sobre este aluno.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="students-isolated-insights">
                <div class="insights-header">
                    <h3>🤖 Dashboard de Insights - IA</h3>
                    <p class="insights-subtitle">Análise inteligente baseada nos dados do aluno</p>
                </div>
                <div class="insights-grid">
                    ${insights.map(insight => `
                        <div class="insight-card insight-${insight.type}">
                            <div class="insight-icon">
                                ${insight.type === 'warning' ? '⚠️' : insight.type === 'positive' ? '✅' : 'ℹ️'}
                            </div>
                            <div class="insight-content">
                                <h4 class="insight-title">${insight.title}</h4>
                                <p class="insight-message">${insight.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="insights-footer">
                    <p class="insights-disclaimer">
                        💡 <strong>Dica:</strong> Os insights são gerados automaticamente com base nos dados disponíveis. 
                        Use-os como apoio para tomadas de decisão pedagógicas e administrativas.
                    </p>
                </div>
            </div>
        `;
    }
    
    // Render enrollments content
    function renderEnrollmentsContent(enrollments) {
        const container = document.getElementById('enrollments-content');
        if (!container) return;
        
        if (!enrollments || enrollments.length === 0) {
            container.innerHTML = `
                <div class="students-isolated-no-data">
                    <div class="enrollments-empty">
                        <div class="enrollments-empty-icon">📚</div>
                        <h3>Nenhum curso matriculado</h3>
                        <p>Este aluno não possui matrículas ativas em cursos.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="students-isolated-enrollments">
                <h3>Cursos Matriculados (${enrollments.length})</h3>
                <div class="enrollments-grid">
                    ${enrollments.map(enrollment => `
                        <div class="enrollment-card">
                            <div class="enrollment-header">
                                <h4>${enrollment.course?.name || 'Curso sem nome'}</h4>
                                <span class="enrollment-status ${enrollment.status?.toLowerCase()}">${enrollment.status || 'Desconhecido'}</span>
                            </div>
                            <div class="enrollment-details">
                                <div class="enrollment-field">
                                    <label>Data de Matrícula:</label>
                                    <span>${enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR') : 'Não informado'}</span>
                                </div>
                                <div class="enrollment-field">
                                    <label>Progresso:</label>
                                    <span>${enrollment.progress || 0}% concluído</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Render classes content
    function renderClassesContent(classes) {
        const container = document.getElementById('classes-content');
        if (!container) return;
        
        if (!classes || classes.length === 0) {
            container.innerHTML = `
                <div class="students-isolated-no-data">
                    <div class="classes-empty">
                        <div class="classes-empty-icon">🏫</div>
                        <h3>Nenhuma turma ativa</h3>
                        <p>Este aluno não está participando de turmas específicas no momento.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="students-isolated-classes">
                <h3>Turmas Ativas (${classes.length})</h3>
                <div class="classes-grid">
                    ${classes.map(cls => `
                        <div class="class-card">
                            <div class="class-header">
                                <h4>${cls.name || 'Turma sem nome'}</h4>
                                <span class="class-status ${cls.status?.toLowerCase()}">${cls.status || 'Ativa'}</span>
                            </div>
                            <div class="class-details">
                                <div class="class-field">
                                    <label>Instrutor:</label>
                                    <span>${cls.instructor?.name || 'Não informado'}</span>
                                </div>
                                <div class="class-field">
                                    <label>Horário:</label>
                                    <span>${cls.schedule || 'Não informado'}</span>
                                </div>
                                <div class="class-field">
                                    <label>Frequência:</label>
                                    <span>${cls.attendance || 0}% de presença</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Render progress content
    function renderProgressContent(progress) {
        const container = document.getElementById('progress-content');
        if (!container) return;
        
        if (!progress || Object.keys(progress).length === 0) {
            container.innerHTML = `
                <div class="students-isolated-no-data">
                    <div class="progress-empty">
                        <div class="progress-empty-icon">📊</div>
                        <h3>Dados de progresso indisponíveis</h3>
                        <p>Não foram encontrados dados de progresso para este aluno.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="students-isolated-progress">
                <h3>Progresso Geral</h3>
                <div class="progress-overview">
                    <div class="progress-stat">
                        <div class="stat-value">${progress.overallProgress || 0}%</div>
                        <div class="stat-label">Progresso Geral</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-value">${progress.coursesCompleted || 0}</div>
                        <div class="stat-label">Cursos Concluídos</div>
                    </div>
                    <div class="progress-stat">
                        <div class="stat-value">${progress.attendanceRate || 0}%</div>
                        <div class="stat-label">Taxa de Presença</div>
                    </div>
                </div>
                
                ${progress.achievements && progress.achievements.length > 0 ? `
                    <div class="achievements-section">
                        <h4>Conquistas Recentes</h4>
                        <div class="achievements-grid">
                            ${progress.achievements.map(achievement => `
                                <div class="achievement-card">
                                    <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                                    <div class="achievement-info">
                                        <h5>${achievement.title}</h5>
                                        <p>${achievement.description}</p>
                                        <small>${achievement.earnedAt ? new Date(achievement.earnedAt).toLocaleDateString('pt-BR') : ''}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${progress.nextGoals && progress.nextGoals.length > 0 ? `
                    <div class="goals-section">
                        <h4>Próximas Metas</h4>
                        <div class="goals-list">
                            ${progress.nextGoals.map(goal => `
                                <div class="goal-item">
                                    <div class="goal-progress">
                                        <div class="goal-progress-bar" style="width: ${goal.progress || 0}%"></div>
                                    </div>
                                    <div class="goal-info">
                                        <h5>${goal.title}</h5>
                                        <p>${goal.description}</p>
                                        <small>${goal.progress || 0}% concluído</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Export for external use - Enhanced
    window.studentsModule = {
        loadStudentsList,
        filterStudents,
        switchView,
        clearFilters,
        setCurrentEditingStudent,
        getCurrentEditingStudentId,
        getStudent,
        loadProfileTab,
        loadFinancialTab,
        loadEnrollmentsTab,
        loadClassesTab,
        loadProgressTab,
        loadInsightsTab,
        STUDENT_TABS
    };
    
    // Debug log for module loading
    console.log('📊 Students Module script loaded, initializeStudentsModule available:', typeof window.initializeStudentsModule);
    
})();

(function() {
    'use strict';
    
    console.log('📚 Courses Module - Starting...');
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines.MD)
    // ==============================================
    
    const coursesAPI = window.createModuleAPI ? window.createModuleAPI('Courses') : null;
    // Optional endpoints helper (fallback when factory is not present)
    const endpoints = (window.createEndpoints && window.createEndpoints('/api/courses')) || {
        base: '/api/courses',
        list: '/api/courses',
        byId: (id) => `/api/courses/${id}`,
        import: '/api/courses/import',
        activities: '/api/activities',
        lessonPlansImport: '/api/lesson-plans/import'
    };

    // Module state
    let allCourses = [];
    let filteredCourses = [];
    let isLoading = false;
    let isInitialized = false;
    
    // Export initialization function for manual loading (SPA compatibility)
    window.initializeCoursesModule = initializeCoursesModule;
    
    // Module initialization - Following CLAUDE.md guidelines
    async function initializeCoursesModule() {
        console.log('[Courses] initializeCoursesModule called');
        if (isInitialized) {
            console.log('ℹ️ Courses module already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Initializing Courses Module...');
        
        try {
            // Check if we're on the courses page - Following students.js pattern
            const coursesContainer = document.getElementById('coursesContainer');
            console.log('[Courses] coursesContainer found:', !!coursesContainer);
            if (!coursesContainer) {
                console.log('ℹ️ Not on courses page, skipping courses module initialization');
                return;
            }

            // Mark module as active for validator/compliance
            try {
                coursesContainer.setAttribute('data-module', 'courses');
                coursesContainer.setAttribute('data-active', 'true');
                coursesContainer.classList.add('module-active');
            } catch(_) {}
            
            console.log('✅ DOM validation passed - coursesContainer found');
            
            // Load create turma functionality
            if (!document.querySelector('script[src*="create-turma-from-course"]')) {
                const script = document.createElement('script');
                script.src = '/js/modules/create-turma-from-course.js';
                document.head.appendChild(script);
                console.log('📚 Create turma script loaded');
            }
            
            // Mark as initialized to prevent double loading
            isInitialized = true;
            
            // Load data and setup in parallel for better performance
            await Promise.all([
                loadInitialData(),
                setupEventListeners()
            ]);
            
            console.log('✅ Courses Module initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing courses module:', error);
            showError(`Erro ao inicializar módulo de cursos: ${error.message}`);
            isInitialized = false; // Reset on error
        }
    }
    
    // Load initial data from API - API-first approach following CLAUDE.md
    async function loadInitialData() {
        if (isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }
        
        console.log('📊 Loading initial courses data...');
        isLoading = true;
        showLoadingState();
        try {
            const response = await fetch('/api/courses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('[Courses] fetch /api/courses status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            console.log('[Courses] API Response:', result);
            if (result.success && Array.isArray(result.data)) {
                allCourses = result.data;
                filteredCourses = [...allCourses];
                console.log('✅ Courses loaded successfully:', allCourses.length, 'courses');
                updateStats();
                if (allCourses.length === 0) {
                    showEmptyState('Nenhum curso cadastrado.');
                } else {
                    renderCourses();
                    showCoursesContainer();
                }
            } else {
                throw new Error(result.error || 'Formato de resposta da API inválido');
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            showEmptyState('Erro ao carregar cursos: ' + error.message);
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    }
    
    // Update statistics display
    function updateStats() {
        const totalCoursesEl = document.getElementById('totalCourses');
        const activeCoursesEl = document.getElementById('activeCourses');
        const inactiveCoursesEl = document.getElementById('inactiveCourses');
        const categoriesCountEl = document.getElementById('categoriesCount');
        
        if (totalCoursesEl) totalCoursesEl.textContent = allCourses.length;
        
        const activeCourses = allCourses.filter(course => course.status === 'ACTIVE');
        if (activeCoursesEl) activeCoursesEl.textContent = activeCourses.length;
        
        const inactiveCourses = allCourses.filter(course => course.status === 'INACTIVE');
        if (inactiveCoursesEl) inactiveCoursesEl.textContent = inactiveCourses.length;
        
        const uniqueCategories = [...new Set(allCourses.map(course => course.category || course.level))];
        if (categoriesCountEl) categoriesCountEl.textContent = uniqueCategories.length;
    }
    
    // Setup event listeners - Following students.js pattern
    function setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            console.log('✅ Search listener added');
        }
        
        // Filter selects
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', handleFilter);
            console.log('✅ Category filter listener added');
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', handleFilter);
            console.log('✅ Status filter listener added');
        }
        
        // View control buttons
        const gridViewBtn = document.getElementById('gridViewBtn');
        const tableViewBtn = document.getElementById('tableViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => toggleView('grid'));
            console.log('✅ Grid view listener added');
        }
        
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => toggleView('table'));
            console.log('✅ Table view listener added');
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
            console.log('✅ Clear filters listener added');
        }
        
        // Importação de Curso
        const importCourseBtn = document.getElementById('importCourseBtn');
        const importCourseFile = document.getElementById('importCourseFile');
        importCourseBtn?.addEventListener('click', () => importCourseFile.click());
        importCourseFile?.addEventListener('change', async () => {
            if (!importCourseFile.files.length) return;
            try {
                const text = await importCourseFile.files[0].text();
                const data = JSON.parse(text);
                if (!data.name) return alert('JSON inválido: campo "name" obrigatório');
                const resp = await fetch('/api/courses/import', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
                const j = await resp.json();
                if (!resp.ok || !j.success) throw new Error(j.message || 'Falha ao importar curso');
                alert('Curso importado com sucesso');
                importCourseFile.value = '';
                await loadInitialData(); // Recarregar a lista de cursos
            } catch(e){ alert('Erro na importação de curso: ' + (e.message || e)); }
        });
        
        // "Novo Curso" buttons (header and empty state)
        const newCourseButtons = document.querySelectorAll('[data-action="openNewCourseForm"]');
        newCourseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                try { window.openNewCourseForm(); } catch (_) {
                    // Fallback SPA navigation
                    if (window.router) {
                        window.router.navigateTo('course-editor');
                    } else {
                        location.hash = 'course-editor';
                    }
                }
            });
        });
        
        // "Gerar com IA" button
        const generateWithAIBtn = document.getElementById('generateWithAIBtn');
        generateWithAIBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to AI module
            if (window.router) {
                window.router.navigateTo('ai');
            } else {
                location.hash = 'ai';
            }
        });
        
        // Delegated fallback in case buttons are rendered later
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="openNewCourseForm"]');
            if (!btn) return;
            e.preventDefault();
            try { window.openNewCourseForm(); } catch (_) {
                if (window.router) {
                    window.router.navigateTo('course-editor');
                } else {
                    location.hash = 'course-editor';
                }
            }
        });
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Handle search input
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('🔍 Searching for:', searchTerm);
        
        filteredCourses = allCourses.filter(course => {
            return (
                (course.name || '').toLowerCase().includes(searchTerm) ||
                (course.description || '').toLowerCase().includes(searchTerm) ||
                (course.category || '').toLowerCase().includes(searchTerm) ||
                (course.level || '').toLowerCase().includes(searchTerm)
            );
        });
        
        renderCourses();
    }
    
    // Handle filter changes
    function handleFilter() {
        console.log('🎛️ Applying filters...');
        
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');
        
        const selectedCategory = categoryFilter?.value || 'all';
        const selectedStatus = statusFilter?.value || 'all';
        const searchTerm = searchInput?.value.toLowerCase().trim() || '';
        
        filteredCourses = allCourses.filter(course => {
            const categoryMatch = selectedCategory === 'all' || 
                (course.category || course.level || '').toUpperCase() === selectedCategory;
            
            const statusMatch = selectedStatus === 'all' || 
                (course.status || '').toUpperCase() === selectedStatus;
            
            const searchMatch = !searchTerm || 
                (course.name || '').toLowerCase().includes(searchTerm) ||
                (course.description || '').toLowerCase().includes(searchTerm);
            
            return categoryMatch && statusMatch && searchMatch;
        });
        
        renderCourses();
    }
    
    // Render courses in the grid
    function renderCourses() {
        console.log('🎨 Rendering courses...', filteredCourses.length, 'courses');
        
        const coursesGrid = document.getElementById('coursesGrid');
        if (!coursesGrid) {
            console.warn('⚠️ Courses grid element not found');
            return;
        }

        if (filteredCourses.length === 0) {
            coursesGrid.innerHTML = '<div class="no-results">Nenhum curso encontrado com os filtros aplicados.</div>';
            return;
        }

        coursesGrid.innerHTML = filteredCourses.map(course => createCourseCardHTML(course)).join('');
        console.log('✅ Courses rendered successfully');
    }
    
    // Create course card HTML - Following UI standards from CLAUDE.md
    function createCourseCardHTML(course) {
        const status = course.status === 'ACTIVE' ? 'Ativo' : 'Inativo';
        const statusClass = course.status === 'ACTIVE' ? 'active' : 'inactive';
        const category = course.category || course.level || 'BEGINNER';
        const categoryLabel = getCategoryLabel(category);
        
        return `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-header">
                    <h3 class="course-title">${escapeHtml(course.name || 'Curso sem nome')}</h3>
                    <span class="course-category">${categoryLabel}</span>
                </div>
                <p class="course-description">${escapeHtml(course.description || 'Sem descrição disponível')}</p>
                <div class="course-footer">
                    <span class="course-status ${statusClass}">${status}</span>
                    <div class="course-actions">
                        <button class="action-btn" onclick="viewCourse('${course.id}')" title="Visualizar">
                            👁️
                        </button>
                        <button class="action-btn" onclick="editCourse('${course.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="action-btn" onclick="createTurmaFromCourse('${course.id}', '${course.name.replace(/'/g, "\\'")}')" title="Criar Turma">
                            👥
                        </button>
                        <button class="action-btn" onclick="deleteCourse('${course.id}', '${course.name.replace(/'/g, "\\'")}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // State management functions
    function showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'flex';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        console.log('🔄 Loading state shown');
    }
    
    function hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
        console.log('✅ Loading state hidden');
    }
    
    function showEmptyState(msg) {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        if (loadingState) loadingState.style.display = 'none';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.textContent = msg || 'Nenhum curso encontrado.';
        }
        console.log('📭 Empty state shown:', msg);
    }
    
    function showCoursesContainer() {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'none';
        if (coursesContainer) coursesContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        
        console.log('📚 Courses container shown');
    }
    
    // View toggle function
    function toggleView(viewType) {
        const gridView = document.getElementById('coursesGrid');
        const tableView = document.getElementById('coursesTable');
        const gridBtn = document.getElementById('gridViewBtn');
        const tableBtn = document.getElementById('tableViewBtn');
        
        if (viewType === 'grid') {
            if (gridView) gridView.style.display = 'grid';
            if (tableView) tableView.style.display = 'none';
            if (gridBtn) gridBtn.classList.add('active');
            if (tableBtn) tableBtn.classList.remove('active');
        } else if (viewType === 'table') {
            if (gridView) gridView.style.display = 'none';
            if (tableView) tableView.style.display = 'block';
            if (gridBtn) gridBtn.classList.remove('active');
            if (tableBtn) tableBtn.classList.add('active');
            renderTableView();
        }
    }
    
    // Clear filters function
    function clearFilters() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        
        filteredCourses = [...allCourses];
        renderCourses();
    }
    
    // Render table view
    function renderTableView() {
        const tableBody = document.getElementById('coursesTableBody');
        if (!tableBody) return;
        
        if (filteredCourses.length === 0) {
            tableBody.innerHTML = '<div class="table-row"><div class="table-cell" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">Nenhum curso encontrado</div></div>';
            return;
        }
        
        tableBody.innerHTML = filteredCourses.map(course => {
            const status = course.status === 'ACTIVE' ? 'Ativo' : 'Inativo';
            const statusClass = course.status === 'ACTIVE' ? 'active' : 'inactive';
            const category = getCategoryLabel(course.category || course.level || 'BEGINNER');
            
            return `
                <div class="table-row">
                    <div class="table-cell">${escapeHtml(course.name || 'Curso sem nome')}</div>
                    <div class="table-cell">${category}</div>
                    <div class="table-cell">
                        <span class="course-status ${statusClass}">${status}</span>
                    </div>
                    <div class="table-cell">
                        <div class="course-actions">
                            <button class="action-btn" onclick="viewCourse('${course.id}')" title="Visualizar">👁️</button>
                            <button class="action-btn" onclick="editCourse('${course.id}')" title="Editar">✏️</button>
                            <button class="action-btn" onclick="createTurmaFromCourse('${course.id}', '${course.name.replace(/'/g, "\\'")}')" title="Criar Turma">👥</button>
                            <button class="action-btn" onclick="deleteCourse('${course.id}', '${course.name.replace(/'/g, "\\'")}')" title="Excluir">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Helper functions
    function getCategoryLabel(category) {
        const categoryMap = {
            'BEGINNER': 'Iniciante',
            'INTERMEDIATE': 'Intermediário',
            'ADVANCED': 'Avançado',
            'EXPERT': 'Especialista',
            'MASTER': 'Mestre'
        };
        return categoryMap[category] || category;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showError(message) {
        console.error('❌ Error:', message);
        alert(message);
    }
    
    // Global functions for course actions
    window.openNewCourseForm = function() {
        console.log('➕ Opening new course form...');
        // Usar o router global que já existe
        if (window.router) {
            window.router.navigateTo('course-editor');
        } else {
            location.hash = 'course-editor';
        }
    };
    
    window.viewCourse = function(courseId) {
        console.log('👁️ Viewing course:', courseId);
        // Store mode and ID for the editor
        window.currentCourseId = courseId;
        window.currentCourseMode = 'view';
        // Usar o router global
        if (window.router) {
            location.hash = `course-editor/${courseId}`;
            window.router.navigateTo('course-editor');
        } else {
            location.hash = `course-editor/${courseId}`;
        }
    };
    
    window.editCourse = function(courseId) {
        console.log('✏️ Editing course:', courseId);
        
        // Store courseId globally for the editor to pick up
        window.currentCourseId = courseId;
        window.currentCourseMode = 'edit';
        
        // Usar o router global
        if (window.router) {
            location.hash = `course-editor/${courseId}`;
            window.router.navigateTo('course-editor');
        } else {
            location.hash = `course-editor/${courseId}`;
        }
    };
    
    window.deleteCourse = async function(courseId, courseName) {
        console.log('🗑️ Deleting course:', courseId);
        
        // Confirmação com nome do curso se disponível
        const confirmMessage = courseName 
            ? `Tem certeza que deseja excluir o curso "${courseName}"?\n\nEsta ação não pode ser desfeita.`
            : 'Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.';
            
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            // DEBUG: Forçar uso de fetch direto para testar
            console.warn('🔍 TESTING: Using direct fetch instead of API client');
            console.log('🔍 Using direct fetch for DELETE request - NO Content-Type header');
            
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
                // Não enviar Content-Type para DELETE sem body
            });
            
            console.log('🔍 Response status:', response.status);
            
            if (response.ok) {
                console.log('✅ Course deleted successfully');
                showNotification('success', `Curso ${courseName ? `"${courseName}"` : ''} excluído com sucesso!`);
                loadInitialData();
            } else {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || `Error deleting course: ${response.status}`);
            }

        } catch (error) {
            console.error('💥 Unexpected error in deleteCourse:', error);
            
            // Mostrar mensagem de erro específica
            let errorMessage = 'Erro inesperado ao excluir curso';
            
            if (error.message) {
                if (error.message.includes('not found')) {
                    errorMessage = 'Curso não encontrado';
                } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
                    errorMessage = 'Não é possível deletar este curso pois ele possui dados associados';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showNotification('error', `Erro ao excluir curso: ${errorMessage}`);
            
            // Usar o error handler do app conforme instruções
            if (window.app?.handleError) {
                window.app.handleError(error, 'courses-delete');
            }
        }
    };
    
    // Função para mostrar notificações seguindo o padrão Guidelines.MD
    function showNotification(type, message) {
        // Remover notificação existente
        const existingNotification = document.querySelector('.notification-toast');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Refresh function
    window.refreshCourses = function() {
        console.log('🔄 Refreshing courses...');
        loadInitialData();
    };
    
    // Reset function for when navigating away from courses page
    window.resetCoursesModule = function() {
        console.log('🔄 Resetting courses module...');
        isInitialized = false;
        allCourses = [];
        filteredCourses = [];
        isLoading = false;
    };
    
    console.log('📚 Courses Module - Loaded');

    // Auto-initialize when DOM is ready or on hash changes (SPA friendly)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try { initializeCoursesModule(); } catch (_) {}
        });
    } else {
        // DOM already ready
        setTimeout(() => { try { initializeCoursesModule(); } catch (_) {} }, 0);
    }
    window.addEventListener('hashchange', () => {
        // Attempt init on route changes if not initialized and container exists
        if (!isInitialized && document.getElementById('coursesContainer')) {
            try { initializeCoursesModule(); } catch (_) {}
        }
    });

// ===== Course Picker API (used by other modules) =====
// Opens a lightweight course picker modal and calls the provided callback with
// the selected course id (single) or array of ids (when multi=true).
async function openCoursePicker(options = {}) {
    const { onSelect, multi = false, preselected = [] } = options || {};

    // Ensure courses cache is loaded
    if (!allCourses || allCourses.length === 0) {
        await loadAndRenderCourses();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = 10000;

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.style.maxWidth = '900px';

    const title = document.createElement('h3');
    title.textContent = multi ? 'Selecione cursos' : 'Selecione um curso';
    dialog.appendChild(title);

    const list = document.createElement('div');
    list.style.maxHeight = '60vh';
    list.style.overflow = 'auto';

    // When multi, render checkboxes
    allCourses.forEach(course => {
        const row = document.createElement('div');
        row.className = 'picker-course-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '0.5rem 0';
        row.innerHTML = `
            <div style="flex:1">🎓 ${course.name}</div>
        `;

        if (multi) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = course.id;
            if (preselected.includes(course.id)) checkbox.checked = true;
            row.insertBefore(checkbox, row.firstChild);
        } else {
            const selectBtn = document.createElement('button');
            selectBtn.type = 'button';
            selectBtn.className = 'btn btn-primary';
            selectBtn.textContent = 'Selecionar';
            selectBtn.addEventListener('click', () => {
                try {
                    if (typeof onSelect === 'function') onSelect(course.id);
                } catch (err) {
                    console.error('openCoursePicker onSelect handler error:', err);
                }
                modal.remove();
            });
            row.appendChild(selectBtn);
        }

        list.appendChild(row);
    });

    dialog.appendChild(list);

    // Actions (for multi selection)
    const actions = document.createElement('div');
    actions.style.marginTop = '1rem';
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '0.5rem';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Fechar';
    closeBtn.addEventListener('click', () => modal.remove());
    actions.appendChild(closeBtn);

    if (multi) {
        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.textContent = 'Selecionar';
        confirmBtn.addEventListener('click', () => {
            const checked = Array.from(list.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
            try {
                if (typeof onSelect === 'function') onSelect(checked);
            } catch (err) {
                console.error('openCoursePicker onSelect handler error:', err);
            }
            modal.remove();
        });
        actions.appendChild(confirmBtn);
    }

    dialog.appendChild(actions);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
}

/**
 * Loads courses from the API and updates the allCourses cache.
 * Used by picker and global refresh.
 */
async function loadAndRenderCourses() {
    try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        allCourses = data.success ? data.data : [];
        // Optionally, update UI if on courses page
        if (document.getElementById('coursesContainer')) {
            // ...call renderCourses or similar...
        }
    } catch (err) {
        console.error('Erro ao carregar cursos:', err);
        allCourses = [];
    }
}

// Simple export function to download all courses as JSON
function exportCourses() {
    try {
        const dataStr = JSON.stringify(allCourses || [], null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `courses-export-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        try { showNotification('success', 'Exportação de cursos iniciada'); } catch(_) {}
    } catch (err) {
        console.error('Erro ao exportar cursos:', err);
        try { showNotification('error', 'Erro ao exportar cursos'); } catch(_) {}
    }
}

// Global function exposure for HTML onclick handlers
// Expose safe globals for legacy handlers. Only assign if implementations exist
try {
    window.refreshCourses = loadAndRenderCourses;
} catch(_) {}
try {
    window.exportCourses = exportCourses;
} catch(_) {}

// openCourseModal may not be implemented in this module (some legacy files provide it).
// Expose a safe fallback that navigates to the course editor if not present.
if (typeof openCourseModal === 'function') {
    window.openCourseModal = openCourseModal;
} else {
    window.openCourseModal = function() {
        console.warn('openCourseModal not implemented here; falling back to course editor');
        if (window.router) return window.router.navigateTo('course-editor');
        location.hash = 'course-editor';
    };
}

if (typeof openNewCourseForm === 'function') {
    window.openNewCourseForm = openNewCourseForm;
} else {
    window.openNewCourseForm = function() { window.openCourseModal(); };
}

if (typeof editCourse === 'function') window.editCourse = editCourse;
if (typeof deleteCourse === 'function') window.deleteCourse = deleteCourse;
if (typeof openModal === 'function') window.openModal = openModal;
if (typeof closeModal === 'function') window.closeModal = closeModal;

// Prevent recursive wrapper: capture the implementation first
if (typeof openCoursePicker === 'function') {
    const __openCoursePicker_impl = openCoursePicker;
    window.openCoursePicker = function(options) { return __openCoursePicker_impl(options); };
} else {
    window.openCoursePicker = function(options) { console.warn('openCoursePicker not implemented'); return Promise.resolve(); };
}

window.filterCourses = function() {
    const event = { target: document.getElementById('courseSearch') };
    try { handleCourseSearch(event); } catch(_) { console.warn('handleCourseSearch not available'); }
};

})();

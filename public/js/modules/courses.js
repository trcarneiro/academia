(function() {
    'use strict';
    
    console.log('📚 Courses Module - Starting...');
    
    // Module state
    let allCourses = [];
    let filteredCourses = [];
    let isLoading = false;
    let isInitialized = false;
    
    // Export initialization function for manual loading (SPA compatibility)
    window.initializeCoursesModule = initializeCoursesModule;
    
    // Module initialization - Following CLAUDE.md guidelines
    async function initializeCoursesModule() {
        if (isInitialized) {
            console.log('ℹ️ Courses module already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Initializing Courses Module...');
        
        try {
            // Check if we're on the courses page - Following students.js pattern
            const coursesContainer = document.getElementById('coursesContainer');
            if (!coursesContainer) {
                console.log('ℹ️ Not on courses page, skipping courses module initialization');
                return;
            }
            
            console.log('✅ DOM validation passed - coursesContainer found');
            
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
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📊 API Response:', result);
            
            if (result.success && Array.isArray(result.data)) {
                allCourses = result.data;
                filteredCourses = [...allCourses];
                console.log('✅ Courses loaded successfully:', allCourses.length, 'courses');
                
                updateStats();
                
                if (allCourses.length === 0) {
                    showEmptyState();
                } else {
                    renderCourses();
                    showCoursesContainer();
                }
            } else {
                throw new Error(result.error || 'Invalid API response format');
            }
            
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            showError(`Erro ao carregar cursos: ${error.message}`);
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
                        <button class="action-btn" onclick="deleteCourse('${course.id}')" title="Excluir">
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
    
    function showEmptyState() {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'none';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        
        console.log('📭 Empty state shown');
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
                            <button class="action-btn" onclick="deleteCourse('${course.id}')" title="Excluir">🗑️</button>
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
        navigateToModule('course-editor');
    };
    
    window.viewCourse = function(courseId) {
        console.log('👁️ Viewing course:', courseId);
        navigateToModule('course-editor', `?id=${courseId}&mode=view`);
    };
    
    window.editCourse = function(courseId) {
        console.log('✏️ Editing course:', courseId);
        
        // Store courseId globally for the editor to pick up
        window.currentCourseId = courseId;
        
        // Navigate to course editor
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('course-editor', `&id=${courseId}`);
        } else {
            console.error('❌ Navigation function not available');
        }
    };
    
    window.deleteCourse = async function(courseId) {
        console.log('🗑️ Deleting course:', courseId);
        
        if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log('✅ Course deleted successfully');
                await loadInitialData();
            } else {
                throw new Error(`Error deleting course: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error deleting course:', error);
            alert('Erro ao excluir curso. Tente novamente.');
        }
    };
    
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
    
})();

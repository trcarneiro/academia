(function() {
    'use strict';
    
    console.log('📚 Courses Module Final Version - Starting...');
    
    // Module state
    let coursesData = [];
    let isLoading = false;
    
    // Initialize module
    function initializeCoursesModule() {
        console.log('🔧 Initializing Courses Module...');
        
        try {
            // Check if we're on the courses page
            if (!document.querySelector('.courses-isolated')) {
                console.log('ℹ️ Not on courses page, skipping initialization');
                return;
            }
            
            console.log('✅ Courses page detected, starting initialization...');
            
            // Setup event listeners first
            setupEventListeners();
            
            // Load courses data
            loadCoursesData();
            
            console.log('✅ Courses Module initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Courses Module:', error);
            showErrorState('Erro ao inicializar módulo de cursos');
        }
    }
    
    // Load courses from API
    async function loadCoursesData() {
        if (isLoading) {
            console.log('⏳ Already loading courses, skipping...');
            return;
        }
        
        isLoading = true;
        console.log('🔄 Starting to load courses...');
        
        try {
            showLoadingState();
            
            console.log('📡 Fetching from /api/courses...');
            const response = await fetch('/api/courses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('📡 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📦 API Result:', result);
            
            if (result.success && Array.isArray(result.data)) {
                coursesData = result.data;
                console.log('✅ Courses loaded successfully:', coursesData.length, 'courses');
                
                if (coursesData.length === 0) {
                    showEmptyState();
                } else {
                    renderCourses(coursesData);
                }
            } else {
                throw new Error(result.error || 'Invalid API response format');
            }
            
        } catch (error) {
            console.error('❌ Error loading courses:', error);
            showErrorState(`Erro ao carregar cursos: ${error.message}`);
        } finally {
            isLoading = false;
        }
    }
    
    // Render courses in the grid
    function renderCourses(courses) {
        console.log('🎨 Rendering courses:', courses?.length || 0);
        
        const container = document.getElementById('coursesGrid');
        const coursesContainer = document.getElementById('coursesContainer');
        
        if (!container) {
            console.error('❌ coursesGrid container not found');
            return;
        }
        
        console.log('🔍 Container elements found:', {
            coursesGrid: !!container,
            coursesContainer: !!coursesContainer
        });
        
        // Hide loading and empty states
        hideLoadingState();
        hideEmptyState();
        
        // Show courses container
        if (coursesContainer) {
            coursesContainer.style.display = 'block';
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        if (!courses || courses.length === 0) {
            showEmptyState();
            return;
        }
        
        // Generate HTML for courses
        const coursesHtml = courses.map(course => {
            const status = course.status === 'ACTIVE' ? 'Ativo' : 'Inativo';
            const statusClass = course.status === 'ACTIVE' ? 'active' : 'inactive';
            const level = course.level || 'BEGINNER';
            const levelLabel = getLevelLabel(level);
            const enrollments = course._count?.enrollments || 0;
            const lessons = course._count?.lessons || course.duration || 0;
            
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-header">
                        <div class="course-info">
                            <h3 class="course-title">${course.name || 'Curso sem nome'}</h3>
                            <span class="course-code">${course.code || course.id.substring(0, 8)}</span>
                        </div>
                        <div class="course-badges">
                            <span class="category-badge category-${level.toLowerCase()}">${levelLabel}</span>
                            <span class="status-badge status-${statusClass}">${status}</span>
                        </div>
                    </div>
                    <p class="course-description">${course.description || 'Sem descrição disponível'}</p>
                    <div class="course-stats">
                        <div class="stat-item">
                            <span class="stat-value">${enrollments}</span>
                            <span class="stat-label">Alunos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${lessons}</span>
                            <span class="stat-label">Aulas</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="action-button" onclick="viewCourse('${course.id}')" title="Visualizar">
                            👁️
                        </button>
                        <button class="action-button" onclick="editCourse('${course.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="action-button delete-button" onclick="deleteCourse('${course.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = coursesHtml;
        console.log('✅ Courses rendered successfully');
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
    
    function hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
    }
    
    function showErrorState(message) {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'none';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <div class="empty-icon">❌</div>
                <h3>Erro ao carregar cursos</h3>
                <p>${message}</p>
                <button class="primary-button" onclick="window.location.reload()">
                    <span>🔄</span>
                    <span>Tentar novamente</span>
                </button>
            `;
        }
        
        console.log('❌ Error state shown:', message);
    }
    
    // Setup event listeners
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
        
        console.log('✅ Event listeners setup completed');
    }
    
    // Handle search
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('🔍 Searching for:', searchTerm);
        
        if (!searchTerm) {
            renderCourses(coursesData);
            return;
        }
        
        const filtered = coursesData.filter(course => 
            (course.name || '').toLowerCase().includes(searchTerm) ||
            (course.description || '').toLowerCase().includes(searchTerm) ||
            (course.code || '').toLowerCase().includes(searchTerm)
        );
        
        console.log('🔍 Search results:', filtered.length, 'courses found');
        renderCourses(filtered);
    }
    
    // Handle filter
    function handleFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        let filtered = [...coursesData];
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            filtered = filtered.filter(course => course.level === categoryFilter.value);
            console.log('📊 Filtered by category:', categoryFilter.value, '-', filtered.length, 'results');
        }
        
        if (statusFilter && statusFilter.value !== 'all') {
            filtered = filtered.filter(course => course.status === statusFilter.value);
            console.log('📊 Filtered by status:', statusFilter.value, '-', filtered.length, 'results');
        }
        
        renderCourses(filtered);
    }
    
    // Utility functions
    function getLevelLabel(level) {
        const labels = {
            'BEGINNER': 'Iniciante',
            'INTERMEDIATE': 'Intermediário',
            'ADVANCED': 'Avançado',
            'EXPERT': 'Especialista',
            'MASTER': 'Mestre'
        };
        return labels[level] || level;
    }
    
    // Global functions for HTML onclick events
    window.viewCourse = function(courseId) {
        console.log('👁️ Viewing course:', courseId);
        window.location.href = `/views/course-editor.html?id=${courseId}`;
    };
    
    window.editCourse = function(courseId) {
        console.log('✏️ Editing course:', courseId);
        window.location.href = `/views/course-editor.html?id=${courseId}`;
    };
    
    window.deleteCourse = async function(courseId) {
        console.log('🗑️ Delete course requested:', courseId);
        
        if (!confirm('Tem certeza que deseja excluir este curso?\\n\\nEsta ação não pode ser desfeita.')) {
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
                // Reload courses
                loadCoursesData();
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
        loadCoursesData();
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCoursesModule);
    } else {
        initializeCoursesModule();
    }
    
    // Export for manual initialization
    window.initializeCoursesModule = initializeCoursesModule;
    
    console.log('📚 Courses Module Final Version - Loaded');
    
})();

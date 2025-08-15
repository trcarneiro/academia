(function() {
    'use strict';
    
    console.log('📚 Courses Module loaded');
    
    // Module state
    let coursesData = [];
    
    // Initialize module when DOM is ready
    function initializeCoursesModule() {
        console.log('📚 Initializing Courses Module...');
        
        // Check if we're on the courses page
        if (document.querySelector('.courses-isolated')) {
            loadCoursesData();
            setupEventListeners();
        }
    }
    
    // Load courses from API
    async function loadCoursesData() {
        try {
            showLoadingState();
            
            const response = await fetch('/api/courses');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success) {
                coursesData = result.data || [];
                renderCourses(coursesData);
            } else {
                throw new Error(result.error || 'Failed to load courses');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            showErrorState(error.message);
        }
    }
    
    // Render courses in the grid
    function renderCourses(courses) {
        const container = document.getElementById('coursesGrid');
        const coursesContainer = document.getElementById('coursesContainer');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) {
            console.warn('Courses grid container not found');
            return;
        }
        
        // Hide loading
        if (loadingState) loadingState.style.display = 'none';
        
        if (!courses || courses.length === 0) {
            if (coursesContainer) coursesContainer.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        // Show courses container
        if (coursesContainer) coursesContainer.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        
        const gridHtml = courses.map(course => {
            return `
                <div class="course-card" data-course-id="${course.id}">
                    <div class="course-header">
                        <div class="course-info">
                            <h3 class="course-title">${course.name || 'Curso sem nome'}</h3>
                            <span class="course-code">${course.code || course.id}</span>
                        </div>
                        <div class="course-badges">
                            <span class="category-badge category-${(course.level || 'beginner').toLowerCase()}">${course.level || 'Iniciante'}</span>
                            <span class="status-badge status-${course.status === 'ACTIVE' ? 'active' : 'inactive'}">${course.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span>
                        </div>
                    </div>
                    <p class="course-description">${course.description || 'Sem descrição disponível'}</p>
                    <div class="course-stats">
                        <div class="stat-item">
                            <span class="stat-value">${course._count?.enrollments || 0}</span>
                            <span class="stat-label">Alunos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${course._count?.lessons || course.duration || 0}</span>
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

        container.innerHTML = gridHtml;
    }
    
    // Show loading state
    function showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'block';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }
    
    // Show error state
    function showErrorState(message) {
        const loadingState = document.getElementById('loadingState');
        const coursesContainer = document.getElementById('coursesContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'none';
        if (coursesContainer) coursesContainer.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <div class="empty-icon">❌</div>
                <h3>Erro ao carregar cursos</h3>
                <p>${message}</p>
                <button class="primary-button" onclick="location.reload()">Tentar novamente</button>
            `;
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        // Filter selects
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', handleFilter);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', handleFilter);
        }
    }
    
    // Handle search
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const filtered = coursesData.filter(course => 
            (course.name || '').toLowerCase().includes(searchTerm) ||
            (course.description || '').toLowerCase().includes(searchTerm)
        );
        renderCourses(filtered);
    }
    
    // Handle filter
    function handleFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        let filtered = [...coursesData];
        
        if (categoryFilter && categoryFilter.value !== 'all') {
            filtered = filtered.filter(course => course.level === categoryFilter.value);
        }
        
        if (statusFilter && statusFilter.value !== 'all') {
            filtered = filtered.filter(course => course.status === statusFilter.value);
        }
        
        renderCourses(filtered);
    }
    
    // Global functions for HTML onclick events
    window.viewCourse = function(courseId) {
        window.location.href = `/views/course-editor.html?id=${courseId}`;
    };
    
    window.editCourse = function(courseId) {
        window.location.href = `/views/course-editor.html?id=${courseId}`;
    };
    
    window.deleteCourse = function(courseId) {
        if (confirm('Tem certeza que deseja excluir este curso?')) {
            // TODO: Implement delete functionality
            console.log('Delete course:', courseId);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCoursesModule);
    } else {
        initializeCoursesModule();
    }
    
    // Export for manual initialization
    window.initializeCoursesModule = initializeCoursesModule;
    
})();

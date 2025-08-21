// Lesson Plans Module - SPA Compatible
(function() {
    'use strict';
    
    console.log('📚 Lesson Plans Module - Starting...');
    
    // ==============================================
    // API CLIENT INTEGRATION (Guidelines.MD)
    // ==============================================
    
    const lessonPlansAPI = window.createModuleAPI ? window.createModuleAPI('LessonPlans') : null;
    // Optional endpoints helper (fallback when factory is not present)
    const endpoints = (window.createEndpoints && window.createEndpoints('/api/lesson-plans')) || {
        base: '/api/lesson-plans',
        list: '/api/lesson-plans',
        byId: (id) => `/api/lesson-plans/${id}`,
        import: '/api/lesson-plans/import',
        courses: '/api/courses',
        activities: '/api/activities'
    };

    // Module state
    let allLessonPlans = [];
    let filteredLessonPlans = [];
    let allCourses = [];
    let allActivities = [];
    let isLoading = false;
    let isInitialized = false;
    
    // Export initialization function for manual loading (SPA compatibility)
    window.initializeLessonPlansModule = initializeLessonPlansModule;
    
    // Module initialization - Following CLAUDE.md guidelines
    async function initializeLessonPlansModule() {
        console.log('[Lesson Plans] initializeLessonPlansModule called');
        if (isInitialized) {
            console.log('ℹ️ Lesson Plans module already initialized, skipping...');
            return;
        }
        
        console.log('🔧 Initializing Lesson Plans Module...');
        
        try {
            // Check if we're on the lesson plans page
            const lessonPlansContainer = document.getElementById('lessonPlansContainer') ||
                                        document.querySelector('.lesson-plans-container') ||
                                        document.querySelector('.lesson-plans-isolated');
            
            console.log('[Lesson Plans] lessonPlansContainer found:', !!lessonPlansContainer);
            if (!lessonPlansContainer) {
                console.log('ℹ️ Not on lesson plans page, skipping lesson plans module initialization');
                return;
            }

            // Mark module as active for validator/compliance
            try {
                lessonPlansContainer.setAttribute('data-module', 'lesson-plans');
                lessonPlansContainer.setAttribute('data-active', 'true');
                lessonPlansContainer.classList.add('module-active');
            } catch(_) {}
            
            console.log('✅ DOM validation passed - lessonPlansContainer found');
            
            // Mark as initialized to prevent double loading
            isInitialized = true;
            
            // Load data and setup in parallel for better performance
            await Promise.all([
                loadInitialData(),
                setupEventListeners()
            ]);
            
            console.log('✅ Lesson Plans Module initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing lesson plans module:', error);
            showError(`Erro ao inicializar módulo de planos de aula: ${error.message}`);
            isInitialized = false; // Reset on error
        }
    }
    
    // Load initial data from API - API-first approach following CLAUDE.md
    async function loadInitialData() {
        if (isLoading) {
            console.log('⏳ Already loading, skipping...');
            return;
        }
        
        console.log('📊 Loading initial lesson plans data...');
        isLoading = true;
        showLoadingState();
        
        try {
            // Load lesson plans, courses, and activities in parallel
            const [lessonPlansResponse, coursesResponse, activitiesResponse] = await Promise.all([
                fetch('/api/lesson-plans', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch('/api/courses', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch('/api/activities', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                })
            ]);
            
            console.log('[Lesson Plans] API responses:', {
                lessonPlans: lessonPlansResponse.status,
                courses: coursesResponse.status,
                activities: activitiesResponse.status
            });
            
            if (!lessonPlansResponse.ok) {
                throw new Error(`HTTP ${lessonPlansResponse.status}: ${lessonPlansResponse.statusText}`);
            }
            
            const [lessonPlansResult, coursesResult, activitiesResult] = await Promise.all([
                lessonPlansResponse.json(),
                coursesResponse.json(),
                activitiesResponse.json()
            ]);
            
            console.log('[Lesson Plans] API Results:', {
                lessonPlans: lessonPlansResult,
                courses: coursesResult,
                activities: activitiesResult
            });
            
            if (lessonPlansResult.success && Array.isArray(lessonPlansResult.data)) {
                allLessonPlans = lessonPlansResult.data;
                filteredLessonPlans = [...allLessonPlans];
            } else {
                console.warn('Invalid lesson plans response:', lessonPlansResult);
                allLessonPlans = [];
                filteredLessonPlans = [];
            }
            
            if (coursesResult.success && Array.isArray(coursesResult.data)) {
                allCourses = coursesResult.data;
            } else {
                allCourses = [];
            }
            
            if (activitiesResult.success && Array.isArray(activitiesResult.data)) {
                allActivities = activitiesResult.data;
            } else {
                allActivities = [];
            }
            
            hideLoadingState();
            populateCourseFilters();
            renderLessonPlans();
            updateStats();
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            hideLoadingState();
            showError(`Erro ao carregar dados: ${error.message}`);
            // Set empty arrays to prevent further errors
            allLessonPlans = [];
            filteredLessonPlans = [];
            allCourses = [];
            allActivities = [];
        } finally {
            isLoading = false;
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        console.log('🔧 Setting up lesson plans event listeners...');
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            console.log('✅ Search input listener added');
        }

        // Course filter
        const courseFilter = document.getElementById('courseFilter');
        if (courseFilter) {
            courseFilter.addEventListener('change', handleFilter);
            console.log('✅ Course filter listener added');
        }

        // Level filter
        const levelFilter = document.getElementById('levelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', handleFilter);
            console.log('✅ Level filter listener added');
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
            console.log('✅ Clear filters listener added');
        }

        // Create lesson plan button
        const createBtn = document.getElementById('createLessonPlanBtn');
        if (createBtn) {
            createBtn.addEventListener('click', showCreateModal);
            console.log('✅ Create button listener added');
        }

        console.log('✅ Event listeners setup completed');
    }

    // Handle search input
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        console.log('🔍 Searching for:', searchTerm);
        
        filteredLessonPlans = allLessonPlans.filter(plan => {
            return (
                (plan.title || '').toLowerCase().includes(searchTerm) ||
                (plan.description || '').toLowerCase().includes(searchTerm) ||
                (plan.course?.name || '').toLowerCase().includes(searchTerm)
            );
        });
        
        renderLessonPlans();
    }

    // Handle filter changes
    function handleFilter() {
        console.log('🎛️ Applying filters...');
        
        const courseFilter = document.getElementById('courseFilter');
        const levelFilter = document.getElementById('levelFilter');
        const searchInput = document.getElementById('searchInput');
        
        const selectedCourse = courseFilter?.value || 'all';
        const selectedLevel = levelFilter?.value || 'all';
        const searchTerm = searchInput?.value.toLowerCase().trim() || '';
        
        filteredLessonPlans = allLessonPlans.filter(plan => {
            const courseMatch = selectedCourse === 'all' || plan.courseId === selectedCourse;
            const levelMatch = selectedLevel === 'all' || String(plan.level) === selectedLevel;
            const searchMatch = !searchTerm || 
                (plan.title || '').toLowerCase().includes(searchTerm) ||
                (plan.description || '').toLowerCase().includes(searchTerm) ||
                (plan.course?.name || '').toLowerCase().includes(searchTerm);
            
            return courseMatch && levelMatch && searchMatch;
        });
        
        renderLessonPlans();
    }

    // Clear all filters
    function clearFilters() {
        console.log('🧹 Clearing all filters...');
        
        const searchInput = document.getElementById('searchInput');
        const courseFilter = document.getElementById('courseFilter');
        const levelFilter = document.getElementById('levelFilter');
        
        if (searchInput) searchInput.value = '';
        if (courseFilter) courseFilter.value = 'all';
        if (levelFilter) levelFilter.value = 'all';
        
        filteredLessonPlans = [...allLessonPlans];
        renderLessonPlans();
    }

    // Populate course filter options
    function populateCourseFilters() {
        const courseFilter = document.getElementById('courseFilter');
        if (!courseFilter || !allCourses.length) return;
        
        // Clear existing options except 'all'
        courseFilter.innerHTML = '<option value="all">Todos os Cursos</option>';
        
        allCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseFilter.appendChild(option);
        });
    }

    // Render lesson plans
    function renderLessonPlans() {
        console.log('🎨 Rendering lesson plans...');
        
        const container = document.getElementById('lessonPlansTableBody');
        if (!container) {
            console.error('Lesson plans table body not found');
            return;
        }
        
        if (!filteredLessonPlans.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">Nenhum plano de aula encontrado</div>
                        <div class="empty-subtitle">Comece criando seu primeiro plano de aula</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = filteredLessonPlans.map(plan => {
            const course = plan.course || { name: 'Curso não encontrado' };
            const difficultyStars = '★'.repeat(plan.difficulty || 1) + '☆'.repeat(5 - (plan.difficulty || 1));
            
            return `
                <tr data-plan-id="${plan.id}">
                    <td>
                        <div class="lesson-info">
                            <strong>${plan.title || 'Sem título'}</strong>
                            <div class="lesson-meta">Aula ${plan.lessonNumber || 'N/A'} | Semana ${plan.weekNumber || 'N/A'}</div>
                        </div>
                    </td>
                    <td>${plan.lessonNumber || 'N/A'}</td>
                    <td>${plan.weekNumber || 'N/A'}</td>
                    <td>
                        <span class="difficulty-stars" title="Dificuldade: ${plan.difficulty || 1}/5">
                            ${difficultyStars}
                        </span>
                    </td>
                    <td>${plan.duration || 60} min</td>
                    <td>
                        <span class="level-badge level-${plan.level || 1}">
                            Nível ${plan.level || 1}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-small btn-primary" onclick="viewLessonPlan('${plan.id}')">
                                👁️ Ver
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="editLessonPlan('${plan.id}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteLessonPlan('${plan.id}')">
                                🗑️ Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        updateStats();
    }

    // Update statistics
    function updateStats() {
        const totalElement = document.getElementById('totalLessonPlans');
        const filteredElement = document.getElementById('filteredLessonPlans');
        const coursesElement = document.getElementById('coursesCount');
        
        if (totalElement) totalElement.textContent = allLessonPlans.length;
        if (filteredElement) filteredElement.textContent = filteredLessonPlans.length;
        if (coursesElement) coursesElement.textContent = allCourses.length;
    }

    // Show create modal
    function showCreateModal() {
        console.log('📝 Opening create lesson plan modal...');
        // Implementation for create modal
        alert('Funcionalidade de criação será implementada em breve!');
    }

    // View lesson plan
    window.viewLessonPlan = function(id) {
        console.log('👁️ Viewing lesson plan:', id);
        // Implementation for view lesson plan
        alert(`Visualizar plano de aula: ${id}`);
    };

    // Edit lesson plan
    window.editLessonPlan = function(id) {
        console.log('✏️ Editing lesson plan:', id);
        // Implementation for edit lesson plan
        alert(`Editar plano de aula: ${id}`);
    };

    // Delete lesson plan
    window.deleteLessonPlan = async function(id) {
        console.log('🗑️ Deleting lesson plan:', id);
        
        if (!confirm('Tem certeza que deseja excluir este plano de aula?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/lesson-plans/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                alert('Plano de aula excluído com sucesso!');
                // Reload data
                await loadInitialData();
            } else {
                throw new Error(result.error || 'Erro ao excluir plano de aula');
            }
        } catch (error) {
            console.error('Error deleting lesson plan:', error);
            alert(`Erro ao excluir plano de aula: ${error.message}`);
        }
    };

    // Utility functions
    function showLoadingState() {
        const loadingElement = document.getElementById('loadingState');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    function hideLoadingState() {
        const loadingElement = document.getElementById('loadingState');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    function showError(message) {
        console.error('Error:', message);
        // You can implement a toast notification here
        alert(message);
    }

    // Auto-initialize if DOM is ready and container exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('lessonPlansContainer') || 
                document.querySelector('.lesson-plans-container') ||
                document.querySelector('.lesson-plans-isolated')) {
                initializeLessonPlansModule();
            }
        });
    } else {
        // DOM already loaded
        if (document.getElementById('lessonPlansContainer') || 
            document.querySelector('.lesson-plans-container') ||
            document.querySelector('.lesson-plans-isolated')) {
            initializeLessonPlansModule();
        }
    }
    
    // Listen for hash changes (SPA navigation)
    window.addEventListener('hashchange', () => {
        // Attempt init on route changes if not initialized and container exists
        if (!isInitialized && (document.getElementById('lessonPlansContainer') ||
                              document.querySelector('.lesson-plans-container') ||
                              document.querySelector('.lesson-plans-isolated'))) {
            try { initializeLessonPlansModule(); } catch (_) {}
        }
    });
})();

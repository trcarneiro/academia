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
            } catch(e){ alert('Erro na importação de curso: ' + (e.message || e)); }
        });
        // Importação de Técnicas/Atividades
        const importActivitiesBtn = document.getElementById('importActivitiesBtn');
        const importActivitiesFile = document.getElementById('importActivitiesFile');
        importActivitiesBtn?.addEventListener('click', () => importActivitiesFile.click());
        importActivitiesFile?.addEventListener('change', async () => {
            if (!importActivitiesFile.files.length) return;
            try {
                const text = await importActivitiesFile.files[0].text();
                const data = JSON.parse(text);
                if (!Array.isArray(data)) return alert('JSON inválido: esperado array de técnicas/atividades');
                let successCount = 0, failCount = 0;
                for (const rawItem of data) {
                    try {
                        const title = (rawItem?.title || rawItem?.name || '').toString().trim();
                        if (!title) { failCount++; continue; }
                        
                        // Map Portuguese types to enum values (only if needed)
                        const typeMap = {
                            'Postura': 'TECHNIQUE',
                            'Soco': 'TECHNIQUE', 
                            'Cotovelada': 'TECHNIQUE',
                            'Chute': 'TECHNIQUE',
                            'Combinação': 'TECHNIQUE',
                            'Defesa Estrangulamento': 'TECHNIQUE',
                            'Defesa Geral': 'TECHNIQUE',
                            'Queda': 'DRILL',
                            'Rolamento': 'DRILL'
                        };
                        
                        // Map difficulty strings to integers (only if needed)
                        const difficultyMap = {
                            'Iniciante': 1,
                            'Intermediário': 2,
                            'Avançado': 3,
                            'Especialista': 4,
                            'Mestre': 5
                        };
                        
                        // Use existing values if they're already in the correct format
                        const validTypes = ['TECHNIQUE', 'STRETCH', 'DRILL', 'EXERCISE', 'GAME', 'CHALLENGE', 'ASSESSMENT'];
                        const mappedType = validTypes.includes(rawItem?.type) ? rawItem.type : (typeMap[rawItem?.type] || 'TECHNIQUE');
                        
                        const mappedDifficulty = typeof rawItem?.difficulty === 'number' ? rawItem.difficulty : (difficultyMap[rawItem?.difficulty] || 1);
                        
                        // Handle refTechniqueId - convert array to single string or null
                        let refTechniqueId = null;
                        if (Array.isArray(rawItem?.refTechniqueId) && rawItem.refTechniqueId.length > 0) {
                            refTechniqueId = rawItem.refTechniqueId[0]; // Take first element
                        } else if (typeof rawItem?.refTechniqueId === 'string' && rawItem.refTechniqueId.trim()) {
                            refTechniqueId = rawItem.refTechniqueId;
                        }
                        // Note: refTechniqueId will be null if the referenced technique doesn't exist
                        // This avoids foreign key constraint errors during bulk import
                        
                        const payload = {
                            id: rawItem.id,
                            title,
                            description: rawItem.description,
                            type: mappedType,
                            difficulty: mappedDifficulty,
                            refTechniqueId: null, // Set to null to avoid foreign key errors during bulk import
                            equipment: Array.isArray(rawItem?.equipment)
                                ? rawItem.equipment
                                : (rawItem?.equipment ? [rawItem.equipment] : []),
                            adaptations: Array.isArray(rawItem?.adaptations)
                                ? rawItem.adaptations
                                : (rawItem?.adaptations ? [rawItem.adaptations] : []),
                            safety: rawItem.safety,
                            defaultParams: rawItem.defaultParams
                        };
                        const resp = await fetch('/api/activities', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const j = await resp.json().catch(() => ({ success: false }));
                        if (resp.ok && j?.success) {
                            successCount++;
                        } else if (resp.status === 500 && (j?.message?.includes?.('Unique constraint') || j?.error?.includes?.('Unique constraint'))) {
                            // Skip duplicates - already exists
                            console.warn(`Skipping duplicate activity: ${rawItem.id}`);
                        } else {
                            failCount++;
                            console.error(`Failed to import ${rawItem.id}:`, j?.error || j?.message || 'Unknown error');
                        }
                    } catch (_) {
                        failCount++;
                    }
                }
                alert(`Importação concluída: ${successCount} técnicas/atividades importadas, ${failCount} falhas.`);
                importActivitiesFile.value = '';
            } catch(e){ alert('Erro na importação de técnicas: ' + (e.message || e)); }
        });
        // Importação de Planos de Aula
        const importPlansBtn = document.getElementById('importPlansBtn');
        const importPlansFile = document.getElementById('importPlansFile');
        importPlansBtn?.addEventListener('click', () => importPlansFile.click());
        importPlansFile?.addEventListener('change', async () => {
            if (!importPlansFile.files.length) return;
            try {
                const text = await importPlansFile.files[0].text();
                const data = JSON.parse(text);
                if (!Array.isArray(data)) return alert('JSON inválido: esperado array de planos de aula');

                // Verificar se todos os planos têm courseId ou solicitar um global
                let defaultCourseId = null;
                const plansWithoutCourse = data.filter(p => !p?.courseId);
                
                if (plansWithoutCourse.length > 0) {
                    // Mostrar lista de cursos disponíveis para seleção
                    const coursesResponse = await fetch('/api/courses');
                    const coursesResult = await coursesResponse.json();
                    
                    if (coursesResult.success && coursesResult.data.length > 0) {
                        // Criar modal customizado para seleção de curso
                        defaultCourseId = await showCourseSelectionModal(coursesResult.data, plansWithoutCourse.length);
                        
                        if (!defaultCourseId) {
                            alert('Importação cancelada: é necessário associar os planos a um curso.');
                            importPlansFile.value = '';
                            return;
                        }
                    } else {
                        alert('Nenhum curso encontrado. Crie um curso primeiro antes de importar planos de aula.');
                        importPlansFile.value = '';
                        return;
                    }
                }

                let successCount = 0, failCount = 0;
                const errors = [];
                
                for (let i = 0; i < data.length; i++) {
                    const rawPlan = data[i];
                    try {
                        const title = (rawPlan?.title || rawPlan?.name || '').toString().trim();
                        const courseId = rawPlan?.courseId || defaultCourseId;
                        
                        if (!title) { 
                            failCount++; 
                            errors.push(`Plano ${i + 1}: título é obrigatório`);
                            continue; 
                        }
                        
                        if (!courseId) { 
                            failCount++; 
                            errors.push(`Plano ${i + 1}: courseId é obrigatório`);
                            continue; 
                        }
                        
                        const planPayload = { 
                            ...rawPlan, 
                            title, 
                            courseId,
                            lessonNumber: rawPlan.lessonNumber || (i + 1),
                            weekNumber: rawPlan.weekNumber || Math.ceil((i + 1) / 2)
                        };
                        
                        const resp = await fetch('/api/lesson-plans/import', { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify(planPayload) 
                        });
                        
                        const j = await resp.json().catch(() => ({ success: false }));
                        
                        if (resp.ok && j?.success) {
                            successCount++;
                        } else {
                            failCount++;
                            errors.push(`Plano ${i + 1}: ${j?.error || 'erro desconhecido'}`);
                        }
                    } catch (e) {
                        failCount++;
                        errors.push(`Plano ${i + 1}: ${e.message || 'erro de processamento'}`);
                    }
                }
                
                let message = `Importação concluída: ${successCount} planos importados, ${failCount} falhas.`;
                if (errors.length > 0 && errors.length <= 5) {
                    message += '\n\nErros:\n' + errors.join('\n');
                } else if (errors.length > 5) {
                    message += '\n\nPrimeiros 5 erros:\n' + errors.slice(0, 5).join('\n') + '\n...';
                }
                
                alert(message);
                importPlansFile.value = '';
                
                // Recarregar dados se houve sucesso
                if (successCount > 0) {
                    await loadInitialData();
                }
            } catch(e) { 
                alert('Erro na importação de planos: ' + (e.message || e)); 
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
        
        // Adiciona botão de importação e modal
        if (!document.getElementById('importCourseBtn')) {
            const importBtn = document.createElement('button');
            importBtn.id = 'importCourseBtn';
            importBtn.className = 'btn btn-secondary';
            importBtn.textContent = 'Importar Curso (JSON)';
            importBtn.style.margin = '10px 0';
            importBtn.onclick = showImportModal;
            coursesGrid.parentElement.insertBefore(importBtn, coursesGrid);
        }

        if (!document.getElementById('importCourseModal')) {
            const modal = document.createElement('div');
            modal.id = 'importCourseModal';
            modal.style.display = 'none';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.5)';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div style="background:#fff;max-width:500px;margin:60px auto;padding:24px;border-radius:8px;box-shadow:0 2px 16px #0002;">
                    <h3>Importar Curso via JSON</h3>
                    <textarea id="importCourseTextarea" style="width:100%;height:180px;"></textarea>
                    <div style="margin-top:12px;text-align:right;">
                        <button id="importCourseCancelBtn" class="btn btn-light">Cancelar</button>
                        <button id="importCourseSendBtn" class="btn btn-primary">Importar</button>
                    </div>
                    <div id="importCourseError" style="color:#c00;margin-top:8px;"></div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('importCourseCancelBtn').onclick = hideImportModal;
            document.getElementById('importCourseSendBtn').onclick = importCourseJson;
        }

        if (filteredCourses.length === 0) {
            coursesGrid.innerHTML = '<div class="no-results">Nenhum curso encontrado com os filtros aplicados.</div>';
            return;
        }

        coursesGrid.innerHTML = filteredCourses.map(course => createCourseCardHTML(course)).join('');
        console.log('✅ Courses rendered successfully');

        // Funções do modal
        function showImportModal() {
            document.getElementById('importCourseModal').style.display = 'block';
            document.getElementById('importCourseTextarea').value = '';
            document.getElementById('importCourseError').textContent = '';
        }
        function hideImportModal() {
            document.getElementById('importCourseModal').style.display = 'none';
        }
        async function importCourseJson() {
            const textarea = document.getElementById('importCourseTextarea');
            const errorDiv = document.getElementById('importCourseError');
            let json;
            try {
                json = JSON.parse(textarea.value);
            } catch (e) {
                errorDiv.textContent = 'JSON inválido.';
                return;
            }
            errorDiv.textContent = '';
            try {
                const res = await fetch('/api/courses/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json)
                });
                const result = await res.json();
                if (result.success) {
                    hideImportModal();
                    window.refreshCourses();
                } else {
                    errorDiv.textContent = result.message || 'Erro ao importar.';
                }
            } catch (e) {
                errorDiv.textContent = 'Erro ao importar.';
            }
        }
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
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('course-editor');
        } else {
            window.location.href = '/modules/courses/course-editor.html';
        }
    };
    
    window.viewCourse = function(courseId) {
        console.log('👁️ Viewing course:', courseId);
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('course-editor', `?id=${courseId}&mode=view`);
        } else {
            window.location.href = `/modules/courses/course-editor.html?id=${courseId}&mode=view`;
        }
    };
    
    window.editCourse = function(courseId) {
        console.log('✏️ Editing course:', courseId);
        
        // Store courseId globally for the editor to pick up
        window.currentCourseId = courseId;
        
        // Navigate to course editor
        if (typeof window.navigateToModule === 'function') {
            window.navigateToModule('course-editor', `&id=${courseId}`);
        } else {
            window.location.href = `/modules/courses/course-editor.html?id=${courseId}`;
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

    // Função para mostrar modal de seleção de curso
    function showCourseSelectionModal(courses, plansCount) {
        return new Promise((resolve) => {
            // Criar modal
            const modal = document.createElement('div');
            modal.className = 'course-selection-modal-overlay';
            modal.innerHTML = `
                <div class="course-selection-modal">
                    <div class="modal-header">
                        <h3>Selecionar Curso para Planos de Aula</h3>
                        <p>${plansCount} planos não têm curso associado. Selecione um curso:</p>
                    </div>
                    <div class="modal-body">
                        <select id="courseSelector" class="course-selector">
                            <option value="">-- Selecione um curso --</option>
                            ${courses.map(c => `<option value="${c.id}">${c.name} (${c.level || 'N/A'})</option>`).join('')}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button id="confirmCourse" class="btn btn-primary">Confirmar</button>
                        <button id="cancelCourse" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            `;

            // Estilos do modal
            const style = document.createElement('style');
            style.textContent = `
                .course-selection-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .course-selection-modal {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                    color: #1e293b;
                }
                .course-selection-modal .modal-header {
                    padding: 24px 24px 16px 24px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .course-selection-modal .modal-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                .course-selection-modal .modal-header p {
                    margin: 0;
                    color: #64748b;
                    font-size: 0.875rem;
                }
                .course-selection-modal .modal-body {
                    padding: 24px;
                }
                .course-selection-modal .course-selector {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 1rem;
                    background: white;
                }
                .course-selection-modal .modal-footer {
                    padding: 16px 24px 24px 24px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                .course-selection-modal .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .course-selection-modal .btn-primary {
                    background: linear-gradient(135deg, #8b5cf6, #a855f7);
                    color: white;
                }
                .course-selection-modal .btn-primary:hover {
                    background: linear-gradient(135deg, #7c3aed, #8b5cf6);
                }
                .course-selection-modal .btn-secondary {
                    background: #f1f5f9;
                    color: #475569;
                }
                .course-selection-modal .btn-secondary:hover {
                    background: #e2e8f0;
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(modal);

            // Event listeners
            const confirmBtn = modal.querySelector('#confirmCourse');
            const cancelBtn = modal.querySelector('#cancelCourse');
            const selector = modal.querySelector('#courseSelector');

            confirmBtn.addEventListener('click', () => {
                const selectedCourseId = selector.value;
                if (!selectedCourseId) {
                    alert('Por favor, selecione um curso.');
                    return;
                }
                document.body.removeChild(modal);
                document.head.removeChild(style);
                resolve(selectedCourseId);
            });

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.head.removeChild(style);
                resolve(null);
            });

            // Fechar com ESC
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    document.head.removeChild(style);
                    document.removeEventListener('keydown', handleEsc);
                    resolve(null);
                }
            };
            document.addEventListener('keydown', handleEsc);

            // Focar no select
            setTimeout(() => selector.focus(), 100);
        });
    }
})();

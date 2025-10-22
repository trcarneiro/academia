/**
 * GRADUATION MODULE - REFACTORED v2.0
 * Single-file architecture following AGENTS.md standards
 * Template: Instructors module (745 lines)
 * 
 * Features:
 * - API-first with fetchWithStates
 * - Inline editing of activities (quantitative + qualitative)
 * - Premium UI design (#667eea → #764ba2)
 * - Loading/Empty/Error states
 * - Responsive (768/1024/1440)
 */

// Prevent multiple declarations
if (typeof window.GraduationModule !== 'undefined') {
    console.log('🎓 Graduation Module already loaded, skipping...');
} else {

const GraduationModule = {
    // ============================================
    // MODULE PROPERTIES
    // ============================================
    container: null,
    moduleAPI: null,
    students: [],
    selectedStudentData: null,
    currentView: 'list', // 'list', 'detail', 'edit-activity'
    editingActivity: null,
    initialized: false,
    
    filters: {
        search: '',
        course: '',
        belt: '',
        status: ''
    },

    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize module
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('🎓 Graduation Module already initialized, skipping...');
                return this;
            }

            console.log('🎓 Initializing Graduation Module...');
            
            if (!this.container) {
                throw new Error('Container not set before initialization');
            }

            // Initialize API client
            await this.initializeAPI();
            
            // Load data
            await this.loadStudents();
            
            // Render UI
            this.render();
            
            // Setup events
            this.setupEvents();

            // Register globally
            window.graduationModule = this;
            window.GraduationModule = this;

            // Dispatch event
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'graduation' });
            }

            this.initialized = true;
            console.log('✅ Graduation Module initialized');

            return this;
        } catch (error) {
            console.error('❌ Graduation Module initialization failed:', error);
            if (window.app) {
                window.app.handleError(error, { module: 'graduation', context: 'init' });
            }
            throw error;
        }
    },

    /**
     * Initialize API client
     */
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('Graduation');
    },

    // ============================================
    // DATA LOADING
    // ============================================

    /**
     * Load students with graduation progress
     */
    async loadStudents() {
        console.log('📋 Loading students...');

        const listContainer = document.getElementById('studentsList');
        if (!listContainer) {
            console.warn('⚠️ studentsList not found yet');
            return;
        }

        const organizationId = '452c0b35-1822-4890-851e-922356c812fb';

        await this.moduleAPI.fetchWithStates('/api/graduation/students', {
            params: { organizationId, ...this.filters },
            loadingElement: listContainer,
            onSuccess: (data) => {
                this.students = data || [];
                console.log(`✅ Loaded ${this.students.length} students`);
                this.filterAndRender();
            },
            onEmpty: () => {
                listContainer.innerHTML = `
                    <div class="empty-state-premium">
                        <div class="empty-icon">👥</div>
                        <h3>Nenhum Aluno Encontrado</h3>
                        <p>Não há alunos matriculados ou os filtros estão muito restritivos.</p>
                    </div>
                `;
            },
            onError: (error) => {
                listContainer.innerHTML = `
                    <div class="error-state-premium">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao Carregar Alunos</h3>
                        <p>${error.message || 'Erro desconhecido'}</p>
                        <button onclick="window.graduationModule.loadStudents()" class="btn-primary">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                `;
            }
        });
    },

    /**
     * Load student detail with activities
     */
    async loadStudentDetail(studentId) {
        try {
            const response = await this.moduleAPI.request(`/api/graduation/student/${studentId}/progress`);
            
            if (response.success && response.data) {
                return response.data;
            } else {
                throw new Error(response.message || 'Erro ao carregar dados do aluno');
            }
        } catch (error) {
            console.error('❌ Error loading student detail:', error);
            throw error;
        }
    },

    // ============================================
    // RENDERING
    // ============================================

    /**
     * Render main view
     */
    render() {
        if (!this.container) return;

        // Main container already has structure from HTML
        // Just render the students list
        this.filterAndRender();
    },

    /**
     * Filter and render students
     */
    filterAndRender() {
        let filtered = [...this.students];

        // Apply search filter
        if (this.filters.search) {
            filtered = filtered.filter(s => 
                (s.name || '').toLowerCase().includes(this.filters.search) ||
                (s.email || '').toLowerCase().includes(this.filters.search)
            );
        }

        // Apply belt filter
        if (this.filters.belt) {
            filtered = filtered.filter(s => s.beltLevel === this.filters.belt);
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(s => this.determineStatus(s.stats?.completionPercentage || 0) === this.filters.status);
        }

        this.renderStudentsList(filtered);
    },

    /**
     * Navigate back to list view
     */
    navigateToList() {
        this.currentView = 'list';
        this.selectedStudentData = null;
        this.editingActivity = null;
        this.render();
    },

    /**
     * Render students grid
     */
    renderStudentsList(students) {
        const listContainer = document.getElementById('studentsList');
        if (!listContainer) return;

        if (!students || students.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state-premium">
                    <div class="empty-icon">🔍</div>
                    <h3>Nenhum Resultado</h3>
                    <p>Nenhum aluno encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = students.map(student => {
            const initials = this.getInitials(student.name || 'NA');
            const belt = student.beltLevel || 'white';
            const progress = student.stats?.completionPercentage || 0;
            const status = this.determineStatus(progress);
            const courseName = student.courses?.[0]?.name || 'Sem curso';

            return `
                <div class="student-card" onclick="window.graduationModule.openStudentDetail('${student.id}')">
                    <div class="student-card-header">
                        <div class="student-avatar">${initials}</div>
                        <div class="student-info">
                            <h3 class="student-name">${student.name || 'Nome não informado'}</h3>
                            <p class="student-registration">${student.email || ''}</p>
                        </div>
                    </div>
                    
                    <div class="student-meta">
                        <span class="meta-badge belt-${belt}">${this.translateBelt(belt)}</span>
                        <span class="meta-badge">${Math.round(progress)}% Concluído</span>
                    </div>
                    
                    <div class="student-progress-bar">
                        <div class="student-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    
                    <div class="student-stats">
                        <div class="stat-item">
                            <p class="stat-value">${student.stats?.completedActivities || 0}/${student.stats?.totalActivities || 0}</p>
                            <p class="stat-label">Atividades</p>
                        </div>
                        <div class="stat-item">
                            <p class="stat-value">${student.stats?.averageRating || 0}⭐</p>
                            <p class="stat-label">Avaliação</p>
                        </div>
                        <div class="stat-item">
                            <p class="stat-value">${Math.round(student.stats?.repsPercentage || 0)}%</p>
                            <p class="stat-label">Repetições</p>
                        </div>
                    </div>
                    
                    <div class="student-status ${status}">
                        ${this.translateStatus(status)}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render activities table rows - DOUBLE-CLICK TO EDIT (AGENTS.md pattern)
     */
    renderActivitiesRows(activities) {
        if (!activities || activities.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="empty-table-cell">
                        <div class="empty-state-small">
                            <p>📭 Nenhuma atividade registrada</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return activities.map((activity, index) => {
            const completion = activity.quantitativeTarget > 0 
                ? Math.round((activity.quantitativeProgress / activity.quantitativeTarget) * 100) 
                : 0;

            return `
                <tr 
                    data-activity-id="${activity.id}" 
                    ondblclick="window.graduationModule.navigateToActivityEdit('${activity.id}')"
                    style="cursor: pointer;"
                    title="Duplo-clique para editar"
                >
                    <td>${activity.lessonNumber || index + 1}</td>
                    <td>
                        <strong>${activity.name}</strong><br>
                        <small class="text-muted">${activity.lessonTitle || ''}</small>
                    </td>
                    <td><span class="badge-category">${activity.category}</span></td>
                    <td>
                        <div class="progress-inline">
                            <span class="progress-text">${activity.quantitativeProgress || 0}</span>
                            <div class="progress-bar-mini" style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; margin-top: 4px;">
                                <div style="width: ${completion}%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 2px;"></div>
                            </div>
                        </div>
                    </td>
                    <td>${activity.quantitativeTarget || 0}</td>
                    <td>
                        <span class="rating-display">
                            ${this.renderStarsInline(activity.qualitativeRating || 0)}
                        </span>
                    </td>
                    <td><span class="badge-source">${this.translateSource(activity.source)}</span></td>
                </tr>
            `;
        }).join('');
    },

    // ============================================
    // EVENT HANDLERS
    // ============================================

    /**
     * Setup event listeners
     */
    setupEvents() {
        // Search filter
        const searchInput = document.getElementById('search-student');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.filterAndRender();
            });
        }

        // Course filter
        const courseFilter = document.getElementById('filter-course');
        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.filters.course = e.target.value;
                this.loadStudents();
            });
        }

        // Belt filter
        const beltFilter = document.getElementById('filter-belt');
        if (beltFilter) {
            beltFilter.addEventListener('change', (e) => {
                this.filters.belt = e.target.value;
                this.filterAndRender();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.filterAndRender();
            });
        }
    },

    /**
     * Open student detail page (FULL-SCREEN - AGENTS.md pattern)
     */
    async openStudentDetail(studentId) {
        this.currentView = 'detail';
        
        // Show loading in container
        this.container.innerHTML = `
            <div class="loading-state-premium">
                <div class="spinner-large"></div>
                <p>Carregando dados do aluno...</p>
            </div>
        `;

        try {
            const data = await this.loadStudentDetail(studentId);
            this.showStudentDetail(data);
        } catch (error) {
            console.error('❌ Error loading student detail:', error);
            this.container.innerHTML = `
                <div class="error-state-premium">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao Carregar Dados</h3>
                    <p>${error.message || 'Erro desconhecido'}</p>
                    <button onclick="window.graduationModule.navigateToList()" class="btn-secondary">
                        ← Voltar para Lista
                    </button>
                </div>
            `;
        }
    },

    /**
     * Show student detail page (render full-screen)
     * @param {string|object} dataOrId - Student data object OR student ID string
     */
    async showStudentDetail(dataOrId) {
        // If it's a string ID, load data first
        if (typeof dataOrId === 'string') {
            await this.openStudentDetail(dataOrId);
            return;
        }

        // Otherwise it's the data object
        this.currentView = 'detail';
        this.selectedStudentData = dataOrId;
        this.renderStudentDetailFullScreen(dataOrId);
    },

    /**
     * Render student detail as full-screen page (NOT MODAL)
     */
    renderStudentDetailFullScreen(data) {
        const student = data.student;
        const initials = this.getInitials(student.name || 'NA');
        const belt = student.beltLevel || 'white';
        const progress = data.progressPercentage || 0;
        const status = this.determineStatus(progress);

        this.container.innerHTML = `
            <!-- HEADER PREMIUM -->
            <div class="module-header-premium">
                <div class="header-top">
                    <div class="header-title-section">
                        <h1>🎓 ${student.name}</h1>
                        <nav class="breadcrumb">
                            <a href="#graduation" onclick="window.graduationModule.navigateToList(); return false;">Graduação</a>
                            <span class="separator">›</span>
                            <span class="current">${student.name}</span>
                        </nav>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="window.graduationModule.navigateToList()">
                            ← Voltar
                        </button>
                    </div>
                </div>
            </div>

            <!-- STATS CARDS -->
            <div class="stats-grid-premium" style="margin-bottom: 2rem;">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <p class="stat-label">Repetições</p>
                        <h3 class="stat-value">${data.stats.totalReps || 0} / ${data.stats.targetReps || 0}</h3>
                        <p class="stat-change">Meta: ${data.stats.repsPercentage?.toFixed(1) || 0}%</p>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <p class="stat-label">Avaliação Média</p>
                        <h3 class="stat-value">${data.stats.averageRating?.toFixed(1) || 0} ⭐</h3>
                        <p class="stat-change">${data.stats.completedActivities || 0} atividades avaliadas</p>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <p class="stat-label">Atividades</p>
                        <h3 class="stat-value">${data.stats.completedActivities || 0} / ${data.stats.totalActivities || 0}</h3>
                        <p class="stat-change">${data.progressPercentage?.toFixed(1) || 0}% concluído</p>
                    </div>
                </div>

                <div class="stat-card-enhanced">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <p class="stat-label">Check-ins</p>
                        <h3 class="stat-value">${data.stats.totalCheckins || 0}</h3>
                        <p class="stat-change">Presença registrada</p>
                    </div>
                </div>
            </div>

            <!-- ACTIVITIES TABLE -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>📋 Atividades do Plano de Aula</h2>
                    <p class="card-subtitle">Duplo-clique em uma linha para editar</p>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table-premium">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Atividade</th>
                                    <th>Categoria</th>
                                    <th>Progresso</th>
                                    <th>Meta</th>
                                    <th>Avaliação</th>
                                    <th>Origem</th>
                                </tr>
                            </thead>
                            <tbody id="activitiesTableBody">
                                ${this.renderActivitiesRows(data.activities || [])}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * DEPRECATED - Keep for backwards compatibility but redirect to new method
     */
    closeStudentDetail() {
        this.navigateToList();
        this.editingActivityId = null;
    },

    /**
     * Navigate to activity edit page (FULL-SCREEN - AGENTS.md pattern)
     */
    navigateToActivityEdit(activityId) {
        // Find activity in current data
        if (!this.selectedStudentData || !this.selectedStudentData.activities) {
            console.error('No student data available');
            return;
        }

        const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
        if (!activity) {
            console.error('Activity not found:', activityId);
            return;
        }

        this.editingActivity = activity;
        this.currentView = 'edit-activity';
        this.renderActivityEditPage();
    },

    /**
     * Render full-screen activity edit page
     */
    renderActivityEditPage() {
        const activity = this.editingActivity;
        const student = this.selectedStudentData.student;

        this.container.innerHTML = `
            <!-- HEADER PREMIUM -->
            <div class="module-header-premium">
                <div class="header-top">
                    <div class="header-title-section">
                        <h1>✏️ Editar Atividade</h1>
                        <nav class="breadcrumb">
                            <a href="#graduation" onclick="window.graduationModule.navigateToList(); return false;">Graduação</a>
                            <span class="separator">›</span>
                            <a href="#" onclick="window.graduationModule.showStudentDetail('${student.id}'); return false;">${student.name}</a>
                            <span class="separator">›</span>
                            <span class="current">Editar ${activity.name}</span>
                        </nav>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="window.graduationModule.showStudentDetail('${student.id}')">
                            ← Voltar
                        </button>
                    </div>
                </div>
            </div>

            <!-- EDIT FORM CARD -->
            <div class="data-card-premium" style="max-width: 800px; margin: 2rem auto;">
                <div class="card-header">
                    <h2>📝 Dados da Atividade</h2>
                </div>
                <div class="card-body">
                    <form id="activityEditForm" onsubmit="window.graduationModule.saveActivityFromFullScreen(event); return false;">
                        <!-- ACTIVITY INFO (READ-ONLY) -->
                        <div class="form-group">
                            <label class="form-label">Atividade</label>
                            <div class="info-box">
                                <strong>${activity.name}</strong><br>
                                <small class="text-muted">${activity.lessonTitle || 'Sem título da aula'}</small>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Aula #</label>
                                <div class="info-box">${activity.lessonNumber || '-'}</div>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Categoria</label>
                                <div class="info-box">
                                    <span class="badge-category">${activity.category}</span>
                                </div>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Origem</label>
                                <div class="info-box">
                                    <span class="badge-source">${this.translateSource(activity.source)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- QUANTITATIVE PROGRESS (EDITABLE) -->
                        <div class="form-group">
                            <label for="quantitativeProgress" class="form-label">
                                Repetições Completadas
                                <span class="form-label-hint">Meta: ${activity.quantitativeTarget || 0} repetições</span>
                            </label>
                            <input 
                                type="number" 
                                id="quantitativeProgress" 
                                class="form-control" 
                                value="${activity.quantitativeProgress || 0}"
                                min="0"
                                max="${activity.quantitativeTarget || 9999}"
                                required
                            />
                            <div class="progress-bar-container" style="margin-top: 0.5rem;">
                                <div class="progress-bar-premium">
                                    <div 
                                        id="progressBarFill" 
                                        class="progress-bar-fill"
                                        style="width: ${activity.quantitativeTarget > 0 ? ((activity.quantitativeProgress / activity.quantitativeTarget) * 100).toFixed(1) : 0}%"
                                    ></div>
                                </div>
                                <span id="progressPercentage" class="progress-percentage">
                                    ${activity.quantitativeTarget > 0 ? ((activity.quantitativeProgress / activity.quantitativeTarget) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>

                        <!-- QUALITATIVE RATING (EDITABLE) -->
                        <div class="form-group">
                            <label for="qualitativeRating" class="form-label">
                                Avaliação Qualitativa
                                <span class="form-label-hint">Avalie a execução do aluno</span>
                            </label>
                            <select id="qualitativeRating" class="form-control">
                                <option value="0" ${activity.qualitativeRating === 0 ? 'selected' : ''}>Não avaliado</option>
                                <option value="1" ${activity.qualitativeRating === 1 ? 'selected' : ''}>⭐ 1 - Fraco</option>
                                <option value="2" ${activity.qualitativeRating === 2 ? 'selected' : ''}>⭐⭐ 2 - Regular</option>
                                <option value="3" ${activity.qualitativeRating === 3 ? 'selected' : ''}>⭐⭐⭐ 3 - Bom</option>
                                <option value="4" ${activity.qualitativeRating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ 4 - Ótimo</option>
                                <option value="5" ${activity.qualitativeRating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ 5 - Excelente</option>
                            </select>
                        </div>

                        <!-- NOTES (OPTIONAL) -->
                        <div class="form-group">
                            <label for="notes" class="form-label">
                                Observações
                                <span class="form-label-hint">(Opcional)</span>
                            </label>
                            <textarea 
                                id="notes" 
                                class="form-control" 
                                rows="4"
                                placeholder="Adicione observações sobre o desempenho do aluno nesta atividade..."
                            >${activity.notes || ''}</textarea>
                        </div>

                        <!-- ACTION BUTTONS -->
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="window.graduationModule.showStudentDetail('${student.id}')">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                💾 Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Setup live progress update
        const repsInput = document.getElementById('quantitativeProgress');
        if (repsInput) {
            repsInput.addEventListener('input', (e) => {
                const current = parseInt(e.target.value) || 0;
                const target = activity.quantitativeTarget || 1;
                const percentage = ((current / target) * 100).toFixed(1);
                
                const progressFill = document.getElementById('progressBarFill');
                const progressText = document.getElementById('progressPercentage');
                
                if (progressFill) progressFill.style.width = `${percentage}%`;
                if (progressText) progressText.textContent = `${percentage}%`;
            });
        }
    },

    /**
     * Save activity from full-screen edit page
     */
    async saveActivityFromFullScreen(event) {
        event.preventDefault();

        try {
            const activity = this.editingActivity;
            const student = this.selectedStudentData.student;

            // Get form values
            const reps = parseInt(document.getElementById('quantitativeProgress').value) || 0;
            const rating = parseInt(document.getElementById('qualitativeRating').value) || 0;
            const notes = document.getElementById('notes').value.trim();

            // Show loading
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '⏳ Salvando...';
            submitBtn.disabled = true;

            // Call API
            const response = await this.moduleAPI.request(
                `/api/graduation/student/${student.id}/activity/${activity.id}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        quantitativeProgress: reps,
                        qualitativeRating: rating,
                        notes: notes || null
                    })
                }
            );

            if (response.success) {
                // Update local data
                activity.quantitativeProgress = reps;
                activity.qualitativeRating = rating;
                activity.notes = notes;

                // Show success
                this.showToast('✅ Atividade atualizada com sucesso!', 'success');

                // Navigate back to detail page after short delay
                setTimeout(() => {
                    this.showStudentDetail(student.id);
                }, 1000);
            } else {
                throw new Error(response.message || 'Erro ao salvar');
            }

        } catch (error) {
            console.error('❌ Error saving activity:', error);
            this.showToast(`❌ Erro: ${error.message}`, 'error');
            
            // Re-enable button
            const submitBtn = event.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = '💾 Salvar Alterações';
                submitBtn.disabled = false;
            }
        }
    },

    // ============================================
    // HELPER METHODS
    // ============================================

    getInitials(name) {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    },

    translateBelt(belt) {
        const belts = {
            white: '⚪ Branca',
            yellow: '🟡 Amarela',
            orange: '🟠 Laranja',
            green: '🟢 Verde',
            blue: '🔵 Azul',
            brown: '🟤 Marrom',
            black: '⚫ Preta'
        };
        return belts[belt] || belt;
    },

    determineStatus(progress) {
        if (progress >= 80) return 'ready';
        if (progress >= 40) return 'in-progress';
        return 'needs-attention';
    },

    translateStatus(status) {
        const statuses = {
            ready: '✅ Pronto para Graduação',
            'in-progress': '🔄 Em Progresso',
            'needs-attention': '⚠️ Necessita Atenção'
        };
        return statuses[status] || status;
    },

    translateSource(source) {
        const sources = {
            checkin: '✅ Check-in',
            manual: '✏️ Manual'
        };
        return sources[source] || source;
    },

    renderStarsInline(rating) {
        if (rating === 0) return '<span class="text-muted">Não avaliado</span>';
        return '⭐'.repeat(rating);
    },

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// ============================================
// GLOBAL EXPOSURE
// ============================================
window.graduationModule = GraduationModule;
window.GraduationModule = GraduationModule;

// Auto-init if container exists
if (document.getElementById('graduationContainer')) {
    GraduationModule.container = document.getElementById('graduationContainer');
    GraduationModule.init();
}

} // end if


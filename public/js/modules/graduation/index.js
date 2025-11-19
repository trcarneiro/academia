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

        const organizationId = typeof getActiveOrganizationId === 'function' ? getActiveOrganizationId() : window.organizationContext?.currentOrganizationId || 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; console.log(' Using organizationId:', organizationId);

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

        // Update stats cards
        this.updateStatsCards();
        
        this.renderStudentsList(filtered);
    },

    /**
     * Update stats cards with current data
     */
    updateStatsCards() {
        const totalStudents = this.students.length;
        const ready = this.students.filter(s => this.determineStatus(s.stats?.completionPercentage || 0) === 'ready').length;
        const pending = this.students.filter(s => this.determineStatus(s.stats?.completionPercentage || 0) === 'needs-attention').length;
        
        const totalEl = document.getElementById('stat-total-students');
        const readyEl = document.getElementById('stat-ready');
        const pendingEl = document.getElementById('stat-pending');
        
        if (totalEl) totalEl.textContent = totalStudents;
        if (readyEl) readyEl.textContent = ready;
        if (pendingEl) pendingEl.textContent = pending;
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
            const status = this.determineStatus(progress, student);
            const courseName = student.courses?.[0]?.name || 'Sem curso';
            
            // Calcular atividades avaliadas (com qualitativeRating > 0)
            const evaluatedActivities = student.stats?.evaluatedActivities || student.stats?.completedActivities || 0;
            const totalActivities = student.stats?.totalActivities || 0;

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
                            <p class="stat-value">${evaluatedActivities}/${totalActivities}</p>
                            <p class="stat-label">Avaliadas</p>
                        </div>
                        <div class="stat-item">
                            <p class="stat-value">${((student.stats?.averageRating || 0) * 10 / 3).toFixed(1)}/10</p>
                            <p class="stat-label">Avaliação</p>
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
                    <td colspan="8" class="empty-table-cell">
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

            // Calcular nota automática baseada em progresso (0-10)
            const autoRating = activity.quantitativeTarget > 0
                ? (activity.quantitativeProgress / activity.quantitativeTarget) * 10
                : 0;
            
            // Usar nota manual se existir, senão usar automática
            const finalRating = activity.qualitativeRating > 0 
                ? (activity.qualitativeRating * 10) / 3  // Converter 0-3 para 0-10
                : autoRating;

            // Determine badge color and text based on qualification method
            const hasManualRating = activity.qualitativeRating > 0;
            const hasCheckInProgress = activity.quantitativeProgress >= activity.quantitativeTarget;
            
            let originBadge = '';
            if (hasManualRating && hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-both">✓ Check-in + Manual</span>';
            } else if (hasManualRating) {
                originBadge = '<span class="badge-source badge-manual">✏️ Manual</span>';
            } else if (hasCheckInProgress) {
                originBadge = '<span class="badge-source badge-checkin">✓ Check-in</span>';
            } else {
                originBadge = '<span class="badge-source badge-pending">⏳ Pendente</span>';
            }

            return `
                <tr 
                    data-activity-id="${activity.id}" 
                    ondblclick="window.graduationModule.navigateToActivityEdit('${activity.id}')"
                    style="cursor: pointer;"
                    title="Duplo-clique para editar"
                >
                    <td style="width: 40px; text-align: center;">
                        <input type="checkbox" 
                               class="activity-checkbox" 
                               data-activity-id="${activity.id}"
                               onclick="event.stopPropagation(); window.graduationModule.toggleActivitySelection(this);"
                               style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;">
                    </td>
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
                    <td ondblclick="window.graduationModule.navigateToActivityEdit('${activity.id}')">${activity.quantitativeTarget || 0}</td>
                    <td onclick="event.stopPropagation();" style="cursor: default;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="rating-display">
                                ${this.renderClickableStars(activity.id, finalRating, autoRating)}
                            </span>
                        </div>
                    </td>
                    <td ondblclick="window.graduationModule.navigateToActivityEdit('${activity.id}')">${originBadge}</td>
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
        // Passar student completo com activities para verificar elegibilidade
        const studentWithActivities = { ...student, activities: data.activities || [] };
        const status = this.determineStatus(progress, studentWithActivities);
        const courseName = data.courseName || 'Curso não definido';

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

            <!-- COURSE INFO BANNER -->
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-left: 4px solid #667eea; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 250px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">🥋</span>
                            <h3 style="margin: 0; color: #667eea; font-size: 1.3rem; font-weight: 600;">${courseName || 'Curso não definido'}</h3>
                        </div>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
                            <strong>${(data.activities || []).filter(a => a.qualitativeRating > 0).length}</strong> de <strong>${(data.activities || []).length}</strong> atividades avaliadas
                            ${data.qualitativeAverage > 0 ? `• Média: <strong style="color: #fbbf24;">${((data.qualitativeAverage * 10) / 3).toFixed(1)}/10</strong>` : ''}
                        </p>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <div style="text-align: center; padding: 0.75rem 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 1.8rem; font-weight: 700; color: #667eea; line-height: 1;">${Math.round(((data.activities || []).filter(a => a.qualitativeRating > 0).length / (data.activities || []).length) * 100)}%</div>
                            <div style="font-size: 0.75rem; color: #999; text-transform: uppercase; margin-top: 4px;">Avaliado</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATS CARDS -->
            <div class="stats-grid-premium" style="margin-bottom: 2rem;">
                <div class="stat-card-enhanced" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <div class="stat-icon" style="font-size: 2.5rem;">📊</div>
                    <div class="stat-content">
                        <p class="stat-label" style="color: rgba(255,255,255,0.9);">Progresso de Avaliações</p>
                        <h3 class="stat-value" style="font-size: 2.5rem; font-weight: 700;">${Math.round(((data.activities || []).filter(a => a.qualitativeRating > 0).length / (data.activities || []).length) * 100)}%</h3>
                        <p class="stat-change" style="color: rgba(255,255,255,0.8);">${(data.activities || []).filter(a => a.qualitativeRating > 0).length} de ${(data.activities || []).length} avaliadas</p>
                    </div>
                </div>

                <div class="stat-card-enhanced" style="border-left: 4px solid #fbbf24;">
                    <div class="stat-icon" style="font-size: 2.5rem;">⭐</div>
                    <div class="stat-content">
                        <p class="stat-label">Avaliação Média</p>
                        <h3 class="stat-value" style="font-size: 2.5rem; color: #fbbf24;">${((data.qualitativeAverage || 0) * 10 / 3).toFixed(1)} <span style="font-size: 1.2rem;">/ 10</span></h3>
                        <p class="stat-change">${(data.activities || []).filter(a => a.qualitativeRating > 0).length} de ${(data.activities || []).length} atividades avaliadas</p>
                    </div>
                </div>

                <div class="stat-card-enhanced" style="border-left: 4px solid #ef4444;">
                    <div class="stat-icon" style="font-size: 2.5rem;">⏳</div>
                    <div class="stat-content">
                        <p class="stat-label">Pendentes</p>
                        <h3 class="stat-value" style="font-size: 2.5rem; color: #ef4444;">${(data.activities || []).filter(a => a.qualitativeRating === 0).length}</h3>
                        <p class="stat-change">Atividades sem avaliação</p>
                    </div>
                </div>
            </div>

            <!-- ACTIVITIES TABLE -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h2>📋 Atividades do Plano de Aula (${(data.activities || []).length} total)</h2>
                    <p class="card-subtitle">Clique nas ⭐ para avaliar | Duplo-clique na linha para editar | Selecione múltiplas para avaliar em massa</p>
                </div>
                <div class="card-body">
                    <div id="timeline-container" style="margin-bottom: 2rem;">
                        <!-- Timeline será carregada aqui -->
                        <div class="loading-spinner">Carregando timeline...</div>
                    </div>
                    <div class="table-responsive">
                        <table class="table-premium">
                            <thead>
                                <tr style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);">
                                    <th style="width: 40px; text-align: center;">
                                        <input type="checkbox" 
                                               id="select-all-activities" 
                                               onclick="window.graduationModule.toggleSelectAll(this)"
                                               style="width: 18px; height: 18px; cursor: pointer; accent-color: #667eea;"
                                               title="Selecionar todas">
                                    </th>
                                    <th style="width: 60px;">#</th>
                                    <th>Atividade</th>
                                    <th style="width: 150px;">Categoria</th>
                                    <th style="width: 120px;">Progresso</th>
                                    <th style="width: 80px;">Meta</th>
                                    <th style="width: 180px; text-align: center;">Avaliação ⭐</th>
                                    <th style="width: 150px;">Status</th>
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

        // Carregar timeline após renderizar
        this.loadAndRenderTimeline(student.id);
    },

    /**
     * Load and render student timeline with check-ins
     */
    async loadAndRenderTimeline(studentId) {
        console.log('📊 Loading timeline for student:', studentId);
        
        try {
            const organizationId = typeof getActiveOrganizationId === 'function' 
                ? getActiveOrganizationId() 
                : window.organizationContext?.currentOrganizationId 
                || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
            
            const response = await this.moduleAPI.request(`/api/graduation/student/${studentId}/detailed-progress?organizationId=${organizationId}`, {
                method: 'GET'
            });
            
            if (response.success && response.data) {
                const { timeline, stats } = response.data;
                
                // Render evolution chart if there's data
                if (timeline && timeline.length > 0) {
                    this.renderEvolutionChart(timeline);
                    
                    // Render timeline items
                    const timelineContainer = document.getElementById('timelineContainer');
                    if (timelineContainer) {
                        timelineContainer.innerHTML = timeline.map((item, index) => 
                            this.renderTimelineItem(item, index)
                        ).join('');
                    }
                } else {
                    console.log('ℹ️ No timeline data available');
                    const chartContainer = document.getElementById('evolutionChart');
                    if (chartContainer) {
                        chartContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Nenhum dado de evolução disponível ainda.</p>';
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error loading timeline:', error);
        }
    },

    /**
     * Render evolution chart with Chart.js
     */
    renderEvolutionChart(timeline) {
        const chartContainer = document.getElementById('evolutionChart');
        if (!chartContainer || !window.Chart) return;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'progressChart';
        canvas.style.maxHeight = '300px';
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Prepare data
        const labels = timeline.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        });
        
        const completionData = timeline.map(item => item.completionPercentage || 0);
        const activitiesData = timeline.map(item => item.activitiesCount || 0);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Progresso (%)',
                        data: completionData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Atividades',
                        data: activitiesData,
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução do Aluno'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Progresso (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Atividades'
                        },
                        grid: {
                            drawOnChartArea: false
                        },
                        min: 0
                    }
                }
            }
        });
    },

    /**
     * Render individual timeline item
     */
    renderTimelineItem(item, index) {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        const activities = item.activities || [];
        const activitiesHtml = activities.length > 0
            ? activities.map(act => `
                <div class="activity-in-timeline">
                    <span class="activity-name">${act.name}</span>
                    ${act.completed ? '<span class="completion-badge">✓ Concluído</span>' : ''}
                </div>
            `).join('')
            : '<p class="no-activities">Nenhuma atividade registrada</p>';
        
        return `
            <div class="timeline-item" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${dateStr}</h4>
                        <span class="timeline-badge">${item.activitiesCount || 0} atividades</span>
                    </div>
                    <div class="timeline-body">
                        ${activitiesHtml}
                    </div>
                    <div class="timeline-footer">
                        <span class="progress-indicator">Progresso: ${(item.completionPercentage || 0).toFixed(1)}%</span>
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

    /**
     * Check if student is eligible for graduation
     * Criteria: ALL activities >= 7.0/10 AND average >= 7.0/10
     */
    isEligibleForGraduation(student) {
        const activities = student.activities || [];
        
        // Se tem array de atividades (tela de detalhes), calcula completo
        if (activities.length > 0) {
            // Calcular nota final para cada atividade (automática ou manual)
            const activityRatings = activities.map(activity => {
                const autoRating = activity.quantitativeTarget > 0
                    ? (activity.quantitativeProgress / activity.quantitativeTarget) * 10
                    : 0;
                
                // Se tem nota manual (qualitativeRating > 0), usa ela; senão usa automática
                const finalRating = activity.qualitativeRating > 0 
                    ? (activity.qualitativeRating * 10) / 3
                    : autoRating;
                
                return finalRating;
            });
            
            // Verificar se TODAS atividades estão >= 7.0
            const allActivitiesAbove7 = activityRatings.every(rating => rating >= 7.0);
            
            // Calcular média geral
            const averageRating = activityRatings.length > 0 
                ? activityRatings.reduce((sum, rating) => sum + rating, 0) / activityRatings.length
                : 0;
            
            // Elegível se TODAS >= 7.0 E média >= 7.0
            return allActivitiesAbove7 && averageRating >= 7.0;
        }
        
        // Se não tem atividades (listagem), usa stats do backend
        const stats = student.stats || {};
        const averageRating = ((stats.averageRating || 0) * 10) / 3; // Converter 0-3 para 0-10
        const totalActivities = stats.totalActivities || 0;
        const evaluatedActivities = stats.evaluatedActivities || 0;
        
        // Critérios:
        // 1. Todas atividades avaliadas (100% completo)
        // 2. Média >= 7.0
        const allEvaluated = totalActivities > 0 && evaluatedActivities === totalActivities;
        const goodAverage = averageRating >= 7.0;
        
        return allEvaluated && goodAverage;
    },

    determineStatus(progress, student = null) {
        // Se student foi passado, verificar elegibilidade para graduação
        if (student && this.isEligibleForGraduation(student)) {
            return 'ready';
        }
        
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


    // ============================================
    // BULK EDIT FUNCTIONS

    renderClickableStars(activityId, currentRating, autoRating = 0) {
        // Converter de escala 0-3 para 0-10 se necessário
        const rating10 = currentRating <= 3 ? (currentRating * 10) / 3 : currentRating;
        const displayRating = Math.round(rating10 * 10) / 10; // 1 decimal
        const displayAutoRating = Math.round(autoRating * 10) / 10;
        
        const isManual = displayRating !== displayAutoRating && displayRating > 0;
        
        return `
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
                ${isManual ? `<span style="font-size: 0.75rem; color: #999; text-decoration: line-through;">${displayAutoRating}</span>` : ''}
                <input type="number" 
                       id="rating-${activityId}"
                       value="${displayRating}"
                       min="0" 
                       max="10" 
                       step="0.5"
                       onchange="window.graduationModule.updateActivityRatingInline('${activityId}', this.value); event.stopPropagation();"
                       onclick="event.stopPropagation();"
                       style="width: 60px; padding: 6px 8px; border: 2px solid #fbbf24; border-radius: 6px; font-size: 1.1rem; font-weight: 600; text-align: center; color: ${isManual ? '#764ba2' : '#667eea'}; background: white;"
                       title="${isManual ? 'Nota ajustada manualmente pelo professor' : 'Nota automática baseada em execuções'}">
                <span style="font-size: 1.3rem; color: #fbbf24; font-weight: 600;">/ 10</span>
                ${isManual ? `<span style="font-size: 0.75rem; color: #764ba2; font-weight: 600;">✏️</span>` : ''}
            </div>
        `;
    },

    async updateActivityRatingInline(activityId, rating) {
        try {
            const student = this.selectedStudentData?.student;
            if (!student) {
                console.error('No student selected');
                return;
            }

            // Converter de 0-10 para 0-3 para o backend (mantém compatibilidade)
            const rating3 = Math.round((parseFloat(rating) * 3) / 10);
            
            console.log(`Updating activity ${activityId}: ${rating}/10 → ${rating3}/3 para o backend`);

            const response = await this.moduleAPI.request(`/api/graduation/student/${student.id}/activity/${activityId}`, {
                method: 'PATCH',
                body: JSON.stringify({ qualitativeRating: rating3 })
            });

            if (response.success) {
                // ✅ Reload full student data to update badges and stats
                await this.showStudentDetail(student.id);
                
                this.showToast(`✅ Avaliação ${parseFloat(rating).toFixed(1)}/10 salva com sucesso!`, 'success');
            } else {
                this.showToast('❌ Erro ao salvar avaliação', 'error');
            }
        } catch (error) {
            console.error('Error updating rating inline:', error);
            this.showToast('❌ Erro ao salvar avaliação', 'error');
        }
    },

    // ============================================

    toggleActivitySelection(checkbox) {
        this.updateBulkToolbar();
    },

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
        });
        this.updateBulkToolbar();
    },

    updateBulkToolbar() {
        const checkboxes = document.querySelectorAll('.activity-checkbox:checked');
        const toolbar = document.getElementById('bulkEditToolbar');
        const countEl = document.getElementById('selectedCount');
        
        if (toolbar && countEl) {
            if (checkboxes.length > 0) {
                toolbar.style.display = 'block';
                countEl.textContent = checkboxes.length;
            } else {
                toolbar.style.display = 'none';
            }
        }
    },

    clearBulkSelection() {
        const checkboxes = document.querySelectorAll('.activity-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        
        const selectAll = document.getElementById('selectAllActivities');
        if (selectAll) {
            selectAll.checked = false;
        }
        
        this.updateBulkToolbar();
    },

    openBulkEvaluationModal() {
        const selectedCheckboxes = document.querySelectorAll('.activity-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.activityId);
        
        if (selectedIds.length === 0) {
            this.showToast('Selecione pelo menos uma atividade', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'bulkEvaluationModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content-premium" style="max-width: 500px;">
                <div class="modal-header-premium">
                    <h2>⭐ Avaliação em Massa</h2>
                    <button class="modal-close" onclick="document.getElementById('bulkEvaluationModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1.5rem; color: #666;">
                        <strong>${selectedIds.length}</strong> atividades selecionadas serão avaliadas.
                    </p>

                    <div class="form-group">
                        <label class="form-label">Avaliação Qualitativa (Estrelas)</label>
                        <div class="star-rating-input" style="display: flex; gap: 0.5rem; font-size: 2rem;">
                            ${[1, 2, 3].map(star => `
                                <span 
                                    class="star-clickable" 
                                    data-rating="${star}"
                                    onclick="window.graduationModule.setBulkRating(${star})"
                                    style="cursor: pointer; opacity: 0.3; transition: opacity 0.2s;"
                                    onmouseover="this.style.opacity='1'"
                                    onmouseout="if(!this.classList.contains('active')) this.style.opacity='0.3'"
                                >⭐</span>
                            `).join('')}
                        </div>
                        <input type="hidden" id="bulkRating" value="0" />
                        <p class="form-hint" style="margin-top: 0.5rem;">
                            <small>⭐ = Iniciante | ⭐⭐ = Intermediário | ⭐⭐⭐ = Avançado</small>
                        </p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Observações (Opcional)</label>
                        <textarea 
                            id="bulkNotes" 
                            class="form-control" 
                            rows="3" 
                            placeholder="Observações gerais sobre essas atividades..."
                        ></textarea>
                    </div>
                </div>
                <div class="modal-footer-premium">
                    <button 
                        class="btn-secondary" 
                        onclick="document.getElementById('bulkEvaluationModal').remove()"
                    >
                        Cancelar
                    </button>
                    <button 
                        class="btn-primary" 
                        onclick="window.graduationModule.saveBulkEvaluation()"
                    >
                        💾 Salvar Avaliações
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (!document.getElementById('bulkModalStyles')) {
            const style = document.createElement('style');
            style.id = 'bulkModalStyles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }
                .modal-content-premium {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                }
                .modal-header-premium {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px 12px 0 0;
                }
                .modal-header-premium h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .modal-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                .modal-body {
                    padding: 2rem;
                }
                .modal-footer-premium {
                    padding: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    background: #f9fafb;
                    border-radius: 0 0 12px 12px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .star-clickable.active {
                    opacity: 1 !important;
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(style);
        }
    },

    setBulkRating(rating) {
        document.getElementById('bulkRating').value = rating;
        
        const stars = document.querySelectorAll('.star-clickable');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.style.opacity = '1';
            } else {
                star.classList.remove('active');
                star.style.opacity = '0.3';
            }
        });
    },

    async saveBulkEvaluation() {
        const rating = parseInt(document.getElementById('bulkRating').value);
        const notes = document.getElementById('bulkNotes').value;

        if (rating === 0) {
            this.showToast('Selecione uma avaliação (estrelas)', 'error');
            return;
        }

        const selectedCheckboxes = document.querySelectorAll('.activity-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.activityId);

        try {
            const modal = document.getElementById('bulkEvaluationModal');
            const saveBtn = modal.querySelector('.btn-primary');
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ Salvando...';

            const studentId = this.selectedStudentData.student.id;
            const organizationId = typeof getActiveOrganizationId === 'function' 
                ? getActiveOrganizationId() 
                : window.organizationContext?.currentOrganizationId 
                || 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

            let successCount = 0;
            let errorCount = 0;

            for (const activityId of selectedIds) {
                try {
                    await this.moduleAPI.request(`/api/graduation/student/${studentId}/activity/${activityId}?organizationId=${organizationId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            qualitativeRating: rating,
                            notes: notes || undefined
                        })
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Error updating activity ${activityId}:`, error);
                    errorCount++;
                }
            }

            modal.remove();

            if (errorCount === 0) {
                this.showToast(`✅ ${successCount} atividades avaliadas com sucesso!`, 'success');
            } else {
                this.showToast(`⚠️ ${successCount} avaliadas, ${errorCount} com erro`, 'error');
            }

            await this.showStudentDetail(studentId);
            this.clearBulkSelection();

        } catch (error) {
            console.error('Error in bulk evaluation:', error);
            this.showToast('Erro ao salvar avaliações', 'error');
        }
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


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
    editingActivityId: null,
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
     * Render student detail modal
     */
    renderStudentDetail(data) {
        const modal = document.getElementById('studentDetailModal');
        if (!modal) return;

        this.selectedStudentData = data;

        // Update header
        const initials = this.getInitials(data.student.name || 'NA');
        const belt = data.student.beltLevel || 'white';
        const progress = data.progressPercentage || 0;

        const avatarEl = document.getElementById('studentDetailAvatar');
        const nameEl = document.getElementById('studentDetailFullName');
        if (avatarEl) avatarEl.innerHTML = initials;
        if (nameEl) nameEl.textContent = data.student.name || 'Nome não informado';

        const beltEl = document.getElementById('studentDetailBelt');
        const progressEl = document.getElementById('studentDetailProgress');
        const courseEl = document.getElementById('studentDetailCourse');
        
        if (beltEl) beltEl.textContent = this.translateBelt(belt);
        if (progressEl) progressEl.textContent = `${Math.round(progress)}% Completo`;
        if (courseEl) courseEl.textContent = data.courseName || 'Sem curso';

        // Render body
        const modalBody = modal.querySelector('.modal-body-fullscreen');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <!-- Summary Cards -->
            <div class="summary-cards-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon">🔢</div>
                    <div class="stat-content">
                        <p class="stat-value">${data.quantitativeCompleted || 0}/${data.quantitativeTotal || 0}</p>
                        <p class="stat-label">Progresso Quantitativo</p>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <p class="stat-value">${(data.qualitativeAverage || 0).toFixed(1)}</p>
                        <p class="stat-label">Avaliação Qualitativa</p>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <p class="stat-value">${data.checkins || 0}</p>
                        <p class="stat-label">Check-ins Realizados</p>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon">✏️</div>
                    <div class="stat-content">
                        <p class="stat-value">${data.manualRegistrations || 0}</p>
                        <p class="stat-label">Registros Manuais</p>
                    </div>
                </div>
            </div>

            <!-- Activities Table with INLINE EDITING -->
            <div class="data-card-premium">
                <div class="card-header">
                    <h3>📋 Atividades do Curso</h3>
                    <p class="card-subtitle">${data.activities?.length || 0} atividades registradas</p>
                </div>
                
                <div class="table-responsive">
                    <table class="table-premium">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Atividade</th>
                                <th>Categoria</th>
                                <th>Repetições</th>
                                <th>Meta</th>
                                <th>Avaliação</th>
                                <th>Origem</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="activitiesTableBody">
                            ${this.renderActivitiesRows(data.activities || [])}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Render activities table rows with inline editing
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
            const isEditing = this.editingActivityId === activity.id;
            const completion = activity.quantitativeTarget > 0 
                ? Math.round((activity.quantitativeProgress / activity.quantitativeTarget) * 100) 
                : 0;

            if (isEditing) {
                // EDIT MODE
                return `
                    <tr class="editing-row" data-activity-id="${activity.id}">
                        <td>${activity.lessonNumber || index + 1}</td>
                        <td>
                            <strong>${activity.name}</strong><br>
                            <small>${activity.lessonTitle || ''}</small>
                        </td>
                        <td><span class="badge-category">${activity.category}</span></td>
                        <td>
                            <input 
                                type="number" 
                                id="edit-reps-${activity.id}" 
                                class="input-inline" 
                                value="${activity.quantitativeProgress || 0}" 
                                min="0"
                                max="${activity.quantitativeTarget || 9999}"
                            />
                        </td>
                        <td>${activity.quantitativeTarget || 0}</td>
                        <td>
                            <select id="edit-rating-${activity.id}" class="select-inline">
                                <option value="0" ${activity.qualitativeRating === 0 ? 'selected' : ''}>Não avaliado</option>
                                <option value="1" ${activity.qualitativeRating === 1 ? 'selected' : ''}>⭐ Fraco</option>
                                <option value="2" ${activity.qualitativeRating === 2 ? 'selected' : ''}>⭐⭐ Regular</option>
                                <option value="3" ${activity.qualitativeRating === 3 ? 'selected' : ''}>⭐⭐⭐ Bom</option>
                                <option value="4" ${activity.qualitativeRating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ Ótimo</option>
                                <option value="5" ${activity.qualitativeRating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ Excelente</option>
                            </select>
                        </td>
                        <td><span class="badge-source">${this.translateSource(activity.source)}</span></td>
                        <td>
                            <div class="action-buttons-inline">
                                <button 
                                    class="btn-icon btn-success" 
                                    onclick="window.graduationModule.saveActivityEdit('${activity.id}')"
                                    title="Salvar"
                                >
                                    💾
                                </button>
                                <button 
                                    class="btn-icon btn-secondary" 
                                    onclick="window.graduationModule.cancelEdit()"
                                    title="Cancelar"
                                >
                                    ✖️
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                // VIEW MODE
                return `
                    <tr data-activity-id="${activity.id}">
                        <td>${activity.lessonNumber || index + 1}</td>
                        <td>
                            <strong>${activity.name}</strong><br>
                            <small class="text-muted">${activity.lessonTitle || ''}</small>
                        </td>
                        <td><span class="badge-category">${activity.category}</span></td>
                        <td>
                            <div class="progress-inline">
                                <span class="progress-text">${activity.quantitativeProgress || 0}</span>
                            </div>
                        </td>
                        <td>${activity.quantitativeTarget || 0}</td>
                        <td>
                            <span class="rating-display">
                                ${this.renderStarsInline(activity.qualitativeRating || 0)}
                            </span>
                        </td>
                        <td><span class="badge-source">${this.translateSource(activity.source)}</span></td>
                        <td>
                            <button 
                                class="btn-icon btn-primary" 
                                onclick="window.graduationModule.editActivity('${activity.id}')"
                                title="Editar"
                            >
                                ✏️
                            </button>
                        </td>
                    </tr>
                `;
            }
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
     * Open student detail modal
     */
    async openStudentDetail(studentId) {
        const modal = document.getElementById('studentDetailModal');
        if (!modal) return;

        modal.style.display = 'block';
        
        const modalBody = modal.querySelector('.modal-body-fullscreen');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="loading-state-premium">
                    <div class="spinner-large"></div>
                    <p>Carregando dados do aluno...</p>
                </div>
            `;
        }

        try {
            const data = await this.loadStudentDetail(studentId);
            this.renderStudentDetail(data);
        } catch (error) {
            console.error('❌ Error loading student detail:', error);
            if (modalBody) {
                modalBody.innerHTML = `
                    <div class="error-state-premium">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao Carregar Dados</h3>
                        <p>${error.message || 'Erro desconhecido'}</p>
                        <button onclick="window.graduationModule.closeStudentDetail()" class="btn-secondary">
                            Fechar
                        </button>
                    </div>
                `;
            }
        }
    },

    /**
     * Close student detail modal
     */
    closeStudentDetail() {
        const modal = document.getElementById('studentDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedStudentData = null;
        this.editingActivityId = null;
    },

    /**
     * Start editing an activity
     */
    editActivity(activityId) {
        this.editingActivityId = activityId;
        
        // Re-render activities table to show edit mode
        if (this.selectedStudentData) {
            const tbody = document.getElementById('activitiesTableBody');
            if (tbody) {
                tbody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities || []);
            }
        }
    },

    /**
     * Cancel editing
     */
    cancelEdit() {
        this.editingActivityId = null;
        
        // Re-render activities table to hide edit mode
        if (this.selectedStudentData) {
            const tbody = document.getElementById('activitiesTableBody');
            if (tbody) {
                tbody.innerHTML = this.renderActivitiesRows(this.selectedStudentData.activities || []);
            }
        }
    },

    /**
     * Save activity edit
     */
    async saveActivityEdit(activityId) {
        try {
            // Get edited values
            const repsInput = document.getElementById(`edit-reps-${activityId}`);
            const ratingSelect = document.getElementById(`edit-rating-${activityId}`);

            if (!repsInput || !ratingSelect) {
                throw new Error('Campos de edição não encontrados');
            }

            const newReps = parseInt(repsInput.value) || 0;
            const newRating = parseInt(ratingSelect.value) || 0;

            // Find activity in current data
            const activity = this.selectedStudentData.activities.find(a => a.id === activityId);
            if (!activity) {
                throw new Error('Atividade não encontrada');
            }

            // Show loading
            const saveBtn = document.querySelector(`button[onclick="window.graduationModule.saveActivityEdit('${activityId}')"]`);
            if (saveBtn) {
                saveBtn.innerHTML = '⏳';
                saveBtn.disabled = true;
            }

            // Call backend API (TODO: implement endpoint)
            const response = await this.moduleAPI.request(
                `/api/graduation/student/${this.selectedStudentData.student.id}/activity/${activityId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        quantitativeProgress: newReps,
                        qualitativeRating: newRating
                    })
                }
            );

            if (response.success) {
                // Update local data
                activity.quantitativeProgress = newReps;
                activity.qualitativeRating = newRating;

                // Exit edit mode
                this.cancelEdit();

                // Show success feedback
                this.showToast('✅ Atividade atualizada com sucesso!', 'success');
            } else {
                throw new Error(response.message || 'Erro ao salvar');
            }

        } catch (error) {
            console.error('❌ Error saving activity:', error);
            this.showToast(`❌ Erro: ${error.message}`, 'error');
            
            // Re-enable button
            const saveBtn = document.querySelector(`button[onclick="window.graduationModule.saveActivityEdit('${activityId}')"]`);
            if (saveBtn) {
                saveBtn.innerHTML = '💾';
                saveBtn.disabled = false;
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


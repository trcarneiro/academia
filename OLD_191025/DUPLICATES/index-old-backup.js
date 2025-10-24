/**
 * GRADUATION MODULE - CONTROLLER
 * Gestão de Graduação com rastreamento quantitativo e qualitativo
 */

// Prevent re-declaration
if (typeof window.graduationModule !== 'undefined') {
    console.log('✅ Graduation module already loaded');
} else {

const GraduationModule = {
    container: null,
    moduleAPI: null,
    currentStudents: [],
    selectedStudent: null,
    filters: {
        search: '',
        course: '',
        belt: '',
        status: ''
    },
    
    /**
     * Initialize module
     */
    async init() {
        console.log('🎓 Initializing Graduation Module...');
        
        this.container = document.getElementById('graduationContainer');
        if (!this.container) {
            console.error('❌ Graduation container not found');
            return;
        }
        
        await this.initializeAPI();
        this.setupEvents();
        await this.loadCourses();
        await this.loadStudents();
        
        // Register globally
        window.graduationModule = this;
        window.app?.dispatchEvent('module:loaded', { name: 'graduation' });
        
        console.log('✅ Graduation module initialized');
    },
    
    /**
     * Initialize API client
     */
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('Graduation');
    },
    
    /**
     * Setup event listeners
     */
    setupEvents() {
        // Search filter
        const searchInput = document.getElementById('searchStudents');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.filterStudentsLocally();
            });
        }
        
        // Course filter
        const courseSelect = document.getElementById('filterCourse');
        if (courseSelect) {
            courseSelect.addEventListener('change', (e) => {
                this.filters.course = e.target.value;
                this.loadStudents();
            });
        }
        
        // Belt filter
        const beltSelect = document.getElementById('filterBelt');
        if (beltSelect) {
            beltSelect.addEventListener('change', (e) => {
                this.filters.belt = e.target.value;
                this.loadStudents();
            });
        }
        
        // Status filter
        const statusSelect = document.getElementById('filterStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.loadStudents();
            });
        }
        
        // Manual form - rating buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.rating-btn')) {
                const btn = e.target.closest('.rating-btn');
                this.selectRating(btn.dataset.rating);
            }
        });
        
        // Manual form submit
        const manualForm = document.getElementById('manualActivityForm');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitManualRegistration();
            });
        }
    },
    
    /**
     * Load courses for filters
     */
    async loadCourses() {
        try {
            const response = await this.moduleAPI.request('/api/courses');
            if (response.success && response.data) {
                this.renderCourseOptions(response.data);
            }
        } catch (error) {
            console.warn('⚠️ Could not load courses for filter:', error);
        }
    },
    
    /**
     * Render course options in filter
     */
    renderCourseOptions(courses) {
        const select = document.getElementById('filterCourse');
        if (!select) return;
        
        select.innerHTML = `
            <option value="">Todos os cursos</option>
            ${courses.map(course => `
                <option value="${course.id}">${course.name}</option>
            `).join('')}
        `;
    },
    
    /**
     * Load students with graduation progress
     */
    async loadStudents() {
        console.log('🔄 Loading students...');
        
        // Wait for DOM element (SPA routing)
        await new Promise(resolve => {
            if (document.getElementById('studentsList')) {
                resolve();
            } else {
                setTimeout(resolve, 100);
            }
        });
        
        const listContainer = document.getElementById('studentsList');
        if (!listContainer) {
            console.error('❌ studentsList container not found');
            return;
        }
        
        // Get organizationId from API client's hardcoded value
        const organizationId = '452c0b35-1822-4890-851e-922356c812fb';
        
        await this.moduleAPI.fetchWithStates('/api/graduation/students', {
            params: { organizationId },
            loadingElement: listContainer,
            onSuccess: (students) => {
                console.log(`✅ Loaded ${students?.length || 0} students`);
                this.currentStudents = students || [];
                this.filterStudentsLocally();
            },
            onEmpty: () => {
                const listContainer = document.getElementById('studentsList');
                if (!listContainer) {
                    console.warn('⚠️ Cannot show empty state: studentsList container not found');
                    return;
                }
                
                listContainer.innerHTML = `
                    <div class="empty-state-premium">
                        <div class="empty-icon">👥</div>
                        <h3>Nenhum Aluno Encontrado</h3>
                        <p>Não há alunos matriculados ou os filtros estão muito restritivos.</p>
                    </div>
                `;
            },
            onError: (error) => {
                const listContainer = document.getElementById('studentsList');
                if (!listContainer) {
                    console.error('❌ Cannot show error: studentsList container not found');
                    return;
                }
                
                // Check if it's a 404 (backend not implemented)
                if (error.message && error.message.includes('404')) {
                    listContainer.innerHTML = `
                        <div class="info-state-premium">
                            <div class="info-icon">🚧</div>
                            <h3>Backend em Desenvolvimento</h3>
                            <p>Os endpoints da API de Graduação ainda não foram implementados.</p>
                            <div style="margin-top: 1.5rem; padding: 1rem; background: #f3f4f6; border-radius: 8px; text-align: left;">
                                <h4 style="margin: 0 0 0.5rem 0; color: #1f2937;">Próximos Passos:</h4>
                                <ol style="margin: 0; padding-left: 1.5rem; color: #6b7280;">
                                    <li>Implementar schema Prisma (StudentProgress, QualitativeAssessment)</li>
                                    <li>Criar /src/routes/graduation.ts</li>
                                    <li>Criar /src/controllers/graduationController.ts</li>
                                    <li>Implementar 7 endpoints REST</li>
                                </ol>
                                <p style="margin: 1rem 0 0 0; font-size: 0.875rem; color: #6b7280;">
                                    📄 Veja <strong>GRADUATION_MODULE_COMPLETE.md</strong> para especificação completa das APIs.
                                </p>
                            </div>
                        </div>
                    `;
                } else {
                    listContainer.innerHTML = `
                        <div class="error-state-premium">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao Carregar Alunos</h3>
                            <p>${error.message || 'Erro desconhecido'}</p>
                            <button onclick="window.graduationModule.loadStudents()" class="btn-primary">
                                Tentar Novamente
                            </button>
                        </div>
                    `;
                }
            }
        });
    },
    
    /**
     * Filter students locally (search field)
     */
    filterStudentsLocally() {
        console.log(`🔍 Filtering ${this.currentStudents.length} students`);
        
        let filtered = [...this.currentStudents];
        
        // Apply search filter
        if (this.filters.search) {
            filtered = filtered.filter(student => {
                const name = (student.name || '').toLowerCase();
                const registration = (student.registrationNumber || '').toLowerCase();
                return name.includes(this.filters.search) || registration.includes(this.filters.search);
            });
        }
        
        console.log(`✅ Rendering ${filtered.length} filtered students`);
        this.renderStudents(filtered);
    },
    
    /**
     * Render students grid
     */
    renderStudents(students) {
        console.log(`🎨 renderStudents called with ${students?.length || 0} students`);
        
        const listContainer = document.getElementById('studentsList');
        
        // NULL SAFETY: Verificar se elemento existe (SPA routing)
        if (!listContainer) {
            console.warn('⚠️ studentsList container not found yet, will retry...');
            setTimeout(() => {
                const retryContainer = document.getElementById('studentsList');
                if (retryContainer) {
                    this.renderStudents(students);
                } else {
                    console.error('❌ studentsList container still not found after retry');
                }
            }, 100);
            return;
        }
        
        console.log(`✅ studentsList container found, rendering...`);
        
        if (!students || students.length === 0) {
            console.log(`📭 No students to show, displaying empty state`);
            listContainer.innerHTML = `
                <div class="empty-state-premium">
                    <div class="empty-icon">🔍</div>
                    <h3>Nenhum Resultado</h3>
                    <p>Nenhum aluno encontrado com os filtros aplicados.</p>
                </div>
            `;
            return;
        }
        
        console.log(`✅ Rendering ${students.length} student cards...`);
        
        listContainer.innerHTML = students.map(student => {
            // Backend returns name directly (firstName + lastName concatenated)
            const studentName = student.name || 'Nome não informado';
            const initials = this.getInitials(studentName);
            const belt = student.beltLevel || 'white';
            
            // Calculate progress from stats
            const stats = student.stats || {};
            const progress = stats.completionPercentage || 0;
            const status = this.determineStatus(progress);
            
            // Get first course name
            const courseName = student.courses?.[0]?.name || 'Sem curso';
            
            return `
                <div class="student-card" onclick="window.graduationModule.openStudentDetail('${student.id}')">
                    <div class="student-card-header">
                        <div class="student-avatar">${initials}</div>
                        <div class="student-info">
                            <h3 class="student-name">${studentName}</h3>
                            <p class="student-registration">Mat. ${student.registrationNumber || student.id.substring(0, 8)}</p>
                        </div>
                    </div>
                    
                    <div class="student-meta">
                        <span class="meta-badge belt-${belt}">${this.translateBelt(belt)}</span>
                        <span class="meta-badge">${Math.round(progress)}% Concluído</span>
                        <span class="meta-badge">${courseName}</span>
                    </div>
                    
                    <div class="student-progress-bar">
                        <div class="student-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    
                    <div class="student-stats">
                        <div class="stat-item">
                            <p class="stat-value">${stats.completedActivities || 0}/${stats.totalActivities || 0}</p>
                            <p class="stat-label">Atividades</p>
                        </div>
                        <div class="stat-item">
                            <p class="stat-value">${stats.averageRating || 0}⭐</p>
                            <p class="stat-label">Avaliação</p>
                        </div>
                        <div class="stat-item">
                            <p class="stat-value">${Math.round(stats.repsPercentage || 0)}%</p>
                            <p class="stat-label">Repetições</p>
                        </div>
                    </div>
                    
                    <div class="student-status ${status}">
                        ${this.translateStatus(status)}
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ ${students.length} student cards rendered successfully`);
    },
    
    /**
     * Open student detail modal
     */
    async openStudentDetail(studentId) {
        const modal = document.getElementById('studentDetailModal');
        if (!modal) return;
        
        this.selectedStudent = studentId;
        modal.style.display = 'block';
        
        // Load student progress
        const loadingHTML = `
            <div class="loading-state-premium">
                <div class="spinner-large"></div>
                <p>Carregando dados do aluno...</p>
            </div>
        `;
        
        const modalBody = modal.querySelector('.modal-body-fullscreen');
        if (modalBody) {
            modalBody.innerHTML = loadingHTML;
        }
        
        try {
            const response = await this.moduleAPI.request(`/api/graduation/student/${studentId}/progress`);
            
            if (response.success && response.data) {
                this.renderStudentDetail(response.data);
            } else {
                throw new Error(response.message || 'Erro ao carregar dados');
            }
        } catch (error) {
            window.app?.handleError(error, { module: 'graduation', context: 'openStudentDetail' });
            this.closeStudentDetail();
        }
    },
    
    /**
     * Render student detail modal content
     */
    renderStudentDetail(data) {
        const modal = document.getElementById('studentDetailModal');
        const modalBody = modal.querySelector('.modal-body-fullscreen');
        
        // Update header
        const initials = this.getInitials(data.student.name || 'NA');
        const belt = data.student.beltLevel || 'white';
        const progress = data.progressPercentage || 0;
        
        // Update avatar and name (using correct IDs from HTML)
        const avatarEl = document.getElementById('studentDetailAvatar');
        const nameEl = document.getElementById('studentDetailFullName');
        if (avatarEl) avatarEl.innerHTML = initials;
        if (nameEl) nameEl.textContent = data.student.name || 'Nome não informado';
        
        // Update meta badges (using correct IDs from HTML)
        const beltEl = document.getElementById('studentDetailBelt');
        const progressEl = document.getElementById('studentDetailProgress');
        const courseEl = document.getElementById('studentDetailCourse');
        
        if (beltEl) beltEl.textContent = this.translateBelt(belt);
        if (progressEl) progressEl.textContent = `${Math.round(progress)}% Completo`;
        if (courseEl) courseEl.textContent = data.courseName || 'Sem curso';
        
        // Render summary cards + activities table
        modalBody.innerHTML = `
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
                        <p class="stat-value">${data.qualitativeAverage || 0}%</p>
                        <p class="stat-label">Avaliação Qualitativa</p>
                    </div>
                </div>
                
                <div class="stat-card-enhanced">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <p class="stat-value">${data.checkins || 0}</p>
                        <p class="stat-label">Aulas com Check-in</p>
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
            
            <div class="data-card-premium">
                <div class="card-header-actions">
                    <h3>📋 Atividades do Curso</h3>
                    <div class="button-group">
                        <button onclick="window.graduationModule.toggleViewMode()" class="btn-secondary">
                            <span class="icon">🔄</span> Alternar Visualização
                        </button>
                        <button onclick="window.graduationModule.openManualForm()" class="btn-primary">
                            <span class="icon">➕</span> Registro Manual
                        </button>
                    </div>
                </div>
                
                <table class="activities-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Atividade</th>
                            <th>Categoria</th>
                            <th>Progresso Quantitativo</th>
                            <th>Avaliação Qualitativa</th>
                            <th>Origem</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderActivitiesRows(data.activities || [])}
                    </tbody>
                </table>
            </div>
            
            <div id="manualRegistrationSection" class="data-card-premium" style="display: none; margin-top: 2rem;">
                <div class="card-header-actions">
                    <h3>✏️ Registro Manual de Atividade</h3>
                    <button onclick="window.graduationModule.closeManualForm()" class="btn-secondary">
                        <span class="icon">✖️</span> Cancelar
                    </button>
                </div>
                
                ${this.renderManualForm(data.availableActivities || [])}
            </div>
        `;
    },
    
    /**
     * Render activities table rows
     */
    renderActivitiesRows(activities) {
        if (!activities || activities.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        <p style="color: var(--text-secondary);">Nenhuma atividade registrada.</p>
                    </td>
                </tr>
            `;
        }
        
        return activities.map((activity, index) => {
            const rating = activity.qualitativeRating || 0;
            const stars = this.renderStars(rating);
            const origin = activity.source || 'manual';
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="activity-name">${activity.name}</span></td>
                    <td><span class="activity-category">${activity.category || 'Geral'}</span></td>
                    <td>
                        <div class="progress-quantitative">
                            <input type="number" 
                                   value="${activity.quantitativeProgress || 0}" 
                                   min="0" 
                                   onchange="window.graduationModule.updateQuantitative('${activity.id}', this.value)">
                            <span>/ ${activity.quantitativeTarget || 0}</span>
                        </div>
                    </td>
                    <td>
                        <div class="rating-display">
                            ${stars}
                        </div>
                    </td>
                    <td>
                        <span class="origin-badge ${origin}">
                            ${origin === 'checkin' ? '✅ Check-in' : '✏️ Manual'}
                        </span>
                    </td>
                    <td>
                        <button onclick="window.graduationModule.editActivity('${activity.id}')" 
                                class="btn-sm btn-secondary">
                            ✏️ Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    /**
     * Render manual registration form
     */
    renderManualForm(availableActivities) {
        return `
            <form id="manualActivityForm" class="form-grid">
                <div class="form-group">
                    <label for="manual-activity">Atividade</label>
                    <select id="manual-activity" class="form-select" required>
                        <option value="">Selecione uma atividade...</option>
                        ${availableActivities.map(act => 
                            `<option value="${act.id}">${act.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="manual-date">Data de Execução</label>
                    <input type="date" 
                           id="manual-date" 
                           class="form-input" 
                           value="${new Date().toISOString().split('T')[0]}" 
                           required>
                </div>
                
                <div class="form-group">
                    <label for="manual-quantity">Quantidade (repetições/tempo)</label>
                    <input type="number" 
                           id="manual-quantity" 
                           class="form-input" 
                           min="1" 
                           placeholder="Ex: 10" 
                           required>
                </div>
                
                <div class="form-group">
                    <label>Avaliação Qualitativa</label>
                    <div class="rating-selector">
                        <button type="button" class="rating-btn" data-rating="1">1⭐</button>
                        <button type="button" class="rating-btn" data-rating="2">2⭐</button>
                        <button type="button" class="rating-btn" data-rating="3">3⭐</button>
                        <button type="button" class="rating-btn" data-rating="4">4⭐</button>
                        <button type="button" class="rating-btn" data-rating="5">5⭐</button>
                    </div>
                    <input type="hidden" id="manual-rating" value="">
                </div>
                
                <div class="form-group full-width">
                    <label for="manual-notes">Observações (opcional)</label>
                    <textarea id="manual-notes" 
                              class="form-input" 
                              rows="3" 
                              placeholder="Adicione observações sobre a execução..."></textarea>
                </div>
                
                <div class="form-actions full-width">
                    <button type="button" 
                            onclick="window.graduationModule.closeManualForm()" 
                            class="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-primary">
                        <span class="icon">💾</span> Salvar Registro
                    </button>
                </div>
            </form>
        `;
    },
    
    /**
     * Close student detail modal
     */
    closeStudentDetail() {
        const modal = document.getElementById('studentDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedStudent = null;
    },
    
    /**
     * Open manual registration form
     */
    openManualForm() {
        const section = document.getElementById('manualRegistrationSection');
        if (section) {
            section.style.display = 'block';
            section.scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    /**
     * Close manual registration form
     */
    closeManualForm() {
        const section = document.getElementById('manualRegistrationSection');
        if (section) {
            section.style.display = 'none';
            document.getElementById('manualActivityForm')?.reset();
            document.getElementById('manual-rating').value = '';
            document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
        }
    },
    
    /**
     * Select rating in manual form
     */
    selectRating(rating) {
        document.getElementById('manual-rating').value = rating;
        
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.rating === rating);
        });
    },
    
    /**
     * Submit manual registration
     */
    async submitManualRegistration() {
        const activityId = document.getElementById('manual-activity')?.value;
        const date = document.getElementById('manual-date')?.value;
        const quantity = document.getElementById('manual-quantity')?.value;
        const rating = document.getElementById('manual-rating')?.value;
        const notes = document.getElementById('manual-notes')?.value;
        
        if (!activityId || !date || !quantity || !rating) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        try {
            const response = await this.moduleAPI.request('/api/graduation/manual-registration', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: this.selectedStudent,
                    activityId,
                    executionDate: date,
                    quantitativeProgress: parseInt(quantity, 10),
                    qualitativeRating: parseInt(rating, 10),
                    notes: notes || null
                })
            });
            
            if (response.success) {
                alert('✅ Registro salvo com sucesso!');
                this.closeManualForm();
                this.openStudentDetail(this.selectedStudent); // Reload
            } else {
                throw new Error(response.message || 'Erro ao salvar');
            }
        } catch (error) {
            window.app?.handleError(error, { module: 'graduation', context: 'submitManualRegistration' });
            alert('❌ Erro ao salvar registro. Tente novamente.');
        }
    },
    
    /**
     * Update quantitative progress inline
     */
    async updateQuantitative(activityId, newValue) {
        try {
            const response = await this.moduleAPI.request(`/api/graduation/activity/${activityId}/update`, {
                method: 'PATCH',
                body: JSON.stringify({
                    studentId: this.selectedStudent,
                    quantitativeProgress: parseInt(newValue, 10)
                })
            });
            
            if (!response.success) {
                throw new Error(response.message || 'Erro ao atualizar');
            }
            
            console.log('✅ Progresso quantitativo atualizado');
        } catch (error) {
            window.app?.handleError(error, { module: 'graduation', context: 'updateQuantitative' });
        }
    },
    
    /**
     * Save all student progress changes
     */
    async saveStudentProgress() {
        if (!this.selectedStudent) return;
        
        try {
            const response = await this.moduleAPI.request(`/api/graduation/student/${this.selectedStudent}/save-progress`, {
                method: 'PUT',
                body: JSON.stringify({
                    // Collect all changes from form
                })
            });
            
            if (response.success) {
                alert('✅ Progresso salvo com sucesso!');
                this.closeStudentDetail();
                this.loadStudents(); // Refresh list
            }
        } catch (error) {
            window.app?.handleError(error, { module: 'graduation', context: 'saveStudentProgress' });
        }
    },
    
    /**
     * Load course requirements
     */
    async loadCourseRequirements(courseId) {
        const container = document.getElementById('requirementsDisplay');
        
        await this.moduleAPI.fetchWithStates(`/api/graduation/course/${courseId}/requirements`, {
            loadingElement: container,
            onSuccess: (data) => {
                this.renderRequirements(data.data || []);
            },
            onEmpty: () => {
                container.innerHTML = `
                    <div class="empty-state-premium">
                        <div class="empty-icon">📋</div>
                        <h3>Sem Requisitos Cadastrados</h3>
                        <p>Este curso ainda não possui requisitos de graduação definidos.</p>
                    </div>
                `;
            },
            onError: (error) => {
                container.innerHTML = `
                    <div class="error-state-premium">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao Carregar Requisitos</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        });
    },
    
    /**
     * Render course requirements
     */
    renderRequirements(requirements) {
        const container = document.getElementById('requirementsDisplay');
        
        const grouped = this.groupRequirementsByCategory(requirements);
        
        container.innerHTML = Object.entries(grouped).map(([category, items]) => `
            <div class="requirement-category">
                <div class="requirement-category-header">
                    <div class="category-icon">${this.getCategoryIcon(category)}</div>
                    <div>
                        <h3 class="category-title">${category}</h3>
                        <p class="category-subtitle">${items.length} requisitos</p>
                    </div>
                </div>
                
                <div class="requirement-items">
                    ${items.map(item => `
                        <div class="requirement-item">
                            <div class="requirement-checkbox ${item.completed ? 'checked' : ''}"></div>
                            <div class="requirement-info">
                                <p class="requirement-name">${item.name}</p>
                                <p class="requirement-details">${item.description || 'Sem descrição'}</p>
                            </div>
                            <div class="requirement-progress">
                                <p class="progress-value">${item.minimumRequired || 0}</p>
                                <p class="progress-target">mínimo</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Export progress report
     */
    async exportProgress() {
        try {
            const response = await this.moduleAPI.request('/api/graduation/export-report', {
                method: 'POST',
                body: JSON.stringify({
                    filters: this.filters
                })
            });
            
            if (response.success && response.data?.downloadUrl) {
                window.open(response.data.downloadUrl, '_blank');
            }
        } catch (error) {
            window.app?.handleError(error, { module: 'graduation', context: 'exportProgress' });
        }
    },
    
    /**
     * Open bulk registration modal
     */
    openBulkRegistration() {
        alert('🚧 Funcionalidade de registro em lote em desenvolvimento...');
    },
    
    /**
     * Toggle view mode (table/grid)
     */
    toggleViewMode() {
        alert('🚧 Alternância de visualização em desenvolvimento...');
    },
    
    /**
     * Edit activity
     */
    editActivity(activityId) {
        alert(`🚧 Edição de atividade ${activityId} em desenvolvimento...`);
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
    
    renderStars(rating) {
        const filled = '⭐';
        const empty = '☆';
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="rating-star ${i <= rating ? 'filled' : 'empty'}">${i <= rating ? filled : empty}</span>`;
        }
        return stars;
    },
    
    groupRequirementsByCategory(requirements) {
        return requirements.reduce((acc, req) => {
            const category = req.category || 'Geral';
            if (!acc[category]) acc[category] = [];
            acc[category].push(req);
            return acc;
        }, {});
    },
    
    getCategoryIcon(category) {
        const icons = {
            'Posturas': '🧍',
            'Socos': '👊',
            'Chutes': '🦶',
            'Defesas': '🛡️',
            'Quedas': '🤸',
            'Combinações': '🔄'
        };
        return icons[category] || '📋';
    }
};

// Global exposure
window.graduationModule = GraduationModule;

// Auto-init if container exists
if (document.getElementById('graduationContainer')) {
    GraduationModule.init();
}

} // end if


if (typeof window.LessonDetailsModule !== 'undefined') {
    console.log('LessonDetails Module already loaded');
} else {
    const LessonDetailsModule = {
        container: null,
        lessonId: null,
        data: null,
        moduleAPI: null,

        async init() {
            console.log('📘 Initializing Lesson Details Module');
            await this.initializeAPI();
            
            // Register globally
            window.lessonDetails = this;
            
            // Find container
            this.container = document.getElementById('module-container') || 
                             document.getElementById('content-area');

            if (window.app?.dispatchEvent) {
                window.app.dispatchEvent('module:loaded', { name: 'lessonDetails' });
            }

            // Check if there is a hash ID to load immediately
            const hash = window.location.hash;
            if (hash.includes('lesson-details/')) {
                const id = hash.split('lesson-details/')[1];
                if (id) this.loadLesson(id);
            }
        },

        async initializeAPI() {
            // Wait for API client
            const waitForAPI = () => new Promise(resolve => {
                if (window.createModuleAPI) resolve();
                else {
                    const interval = setInterval(() => {
                        if (window.createModuleAPI) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                }
            });
            await waitForAPI();
            this.moduleAPI = window.createModuleAPI('LessonDetails');
        },

        async loadLesson(id) {
            this.lessonId = id;
            this.showLoading();
            
            try {
                // Use the agenda endpoint which returns formatted class data
                // We might need to enhance this endpoint or create a new one if it doesn't return enough info
                // For now, let's try the existing one and see.
                // If it's a virtual ID (turma-...), the backend handles it.
                const response = await this.moduleAPI.request(`/api/agenda/class/${id}`);
                
                if (response.success) {
                    this.data = response.data;
                    // Fetch full lesson plan details if we have a lessonPlanId but no details
                    if (this.data.lessonPlanId && !this.data.lessonPlan) {
                        await this.loadLessonPlan(this.data.lessonPlanId);
                    }
                    this.render();
                } else {
                    this.showError(response.message || 'Failed to load lesson details');
                }
            } catch (error) {
                console.error('Error loading lesson:', error);
                this.showError('Error loading lesson details');
            }
        },

        async loadLessonPlan(planId) {
            try {
                const response = await this.moduleAPI.request(`/api/lesson-plans/${planId}`);
                if (response.success) {
                    this.data.lessonPlan = response.data;
                }
            } catch (error) {
                console.warn('Failed to load lesson plan details:', error);
            }
        },

        render() {
            if (!this.container) return;
            
            // Load CSS
            this.loadCSS();

            const lesson = this.data;
            const date = new Date(lesson.startTime).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
            const time = `${new Date(lesson.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - ${new Date(lesson.endTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;

            this.container.innerHTML = `
                <div class="module-isolated-lesson-details">
                    <div class="module-header-premium">
                        <div class="header-content">
                            <h1>${lesson.title || 'Aula'}</h1>
                            <p class="header-subtitle">${date} • ${time}</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" onclick="window.history.back()">
                                <i class="fas fa-arrow-left"></i> Voltar
                            </button>
                            <button class="btn-primary" onclick="lessonDetails.startClass()">
                                <i class="fas fa-tv"></i> Painel da Aula (TV)
                            </button>
                        </div>
                    </div>

                    <div class="details-grid">
                        <!-- Info Card -->
                        <div class="data-card-premium info-card">
                            <div class="card-header">
                                <h2><i class="fas fa-info-circle"></i> Informações</h2>
                                <span class="status-badge status-${lesson.status?.toLowerCase() || 'scheduled'}">${this.translateStatus(lesson.status)}</span>
                            </div>
                            <div class="info-content">
                                <div class="info-row">
                                    <span class="label">Instrutor</span>
                                    <span class="value">${lesson.instructor?.name || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Curso</span>
                                    <span class="value">${lesson.course?.name || 'N/A'}</span>
                                </div>
                                ${lesson.turmaId ? `
                                    <div class="info-row">
                                        <span class="label">Turma</span>
                                        <a href="#turmas" onclick="setTimeout(() => window.location.hash='#turmas', 100)" class="link-turma">Ver Turma</a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Lesson Plan Card -->
                        <div class="data-card-premium plan-card">
                            <div class="card-header">
                                <h2><i class="fas fa-book-open"></i> Plano de Aula</h2>
                                ${lesson.lessonPlan ? 
                                    `<button class="btn-small" onclick="lessonDetails.editPlan('${lesson.lessonPlan.id}')">Ver Completo</button>` : 
                                    `<button class="btn-small btn-accent" onclick="lessonDetails.assignPlan()">Atribuir Plano</button>`
                                }
                            </div>
                            <div class="plan-content">
                                ${this.renderPlanContent(lesson.lessonPlan)}
                            </div>
                        </div>

                        <!-- Attendance Card -->
                        <div class="data-card-premium attendance-card">
                            <div class="card-header">
                                <h2><i class="fas fa-users"></i> Presença</h2>
                                <button class="btn-small" onclick="lessonDetails.manageAttendance()">Gerenciar</button>
                            </div>
                            <div class="attendance-stats">
                                <div class="stat">
                                    <span class="stat-value">${lesson.attendances?.filter(a => a.present).length || 0}</span>
                                    <span class="stat-label">Presentes</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${lesson.attendances?.length || 0}</span>
                                    <span class="stat-label">Total</span>
                                </div>
                            </div>
                            <div class="attendance-list">
                                ${this.renderAttendanceList(lesson.attendances)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        renderPlanContent(plan) {
            if (!plan) return '<p class="empty-state">Nenhum plano de aula atribuído.</p>';
            
            // Calculate total duration
            const totalDuration = (plan.warmup?.duration || 0) + (plan.technique?.duration || 0) + (plan.cooldown?.duration || 0);

            return `
                <div class="plan-summary">
                    <h3>${plan.title}</h3>
                    <p class="plan-desc">${plan.description || ''}</p>
                    
                    <div class="plan-phases-mini">
                        <div class="phase-mini">
                            <span class="phase-icon">🔥</span>
                            <span class="phase-info">
                                <strong>Aquecimento</strong>
                                <small>${plan.warmup?.duration || 0} min</small>
                            </span>
                        </div>
                        <div class="phase-mini">
                            <span class="phase-icon">🥋</span>
                            <span class="phase-info">
                                <strong>Técnica</strong>
                                <small>${plan.technique?.duration || 0} min</small>
                            </span>
                        </div>
                        <div class="phase-mini">
                            <span class="phase-icon">🧘</span>
                            <span class="phase-info">
                                <strong>Resfriamento</strong>
                                <small>${plan.cooldown?.duration || 0} min</small>
                            </span>
                        </div>
                    </div>
                    
                    <div class="plan-meta">
                        <span><i class="fas fa-clock"></i> ${totalDuration} min total</span>
                        <span><i class="fas fa-layer-group"></i> ${plan.level || 'Nível N/A'}</span>
                    </div>
                </div>
            `;
        },

        renderAttendanceList(attendances) {
            if (!attendances || !attendances.length) return '<p class="empty-state">Nenhuma presença registrada.</p>';
            
            // Show only first 5
            const preview = attendances.slice(0, 5);
            const remaining = attendances.length - 5;

            let html = preview.map(att => `
                <div class="attendance-item ${att.present ? 'present' : 'absent'}">
                    <span class="student-name">${att.student?.name || 'Aluno'}</span>
                    <span class="status-icon">${att.present ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}</span>
                </div>
            `).join('');

            if (remaining > 0) {
                html += `<div class="attendance-more">+ mais ${remaining} alunos</div>`;
            }

            return html;
        },

        translateStatus(status) {
            const map = {
                'SCHEDULED': 'Agendada',
                'IN_PROGRESS': 'Em Andamento',
                'COMPLETED': 'Concluída',
                'CANCELLED': 'Cancelada'
            };
            return map[status] || status || 'Agendada';
        },

        loadCSS() {
            if (!document.getElementById('lesson-details-css')) {
                const link = document.createElement('link');
                link.id = 'lesson-details-css';
                link.rel = 'stylesheet';
                link.href = '/css/modules/lesson-details.css';
                document.head.appendChild(link);
            }
        },

        showLoading() {
            if (this.container) this.container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando detalhes da aula...</div>';
        },

        showError(msg) {
            if (this.container) this.container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar</h3>
                    <p>${msg}</p>
                    <button class="btn-secondary" onclick="window.history.back()">Voltar</button>
                </div>
            `;
        },

        startClass() {
            // Navigate to Class Dashboard
            // We assume the dashboard can handle being opened without an ID (it fetches current)
            // OR we pass the ID.
            // Let's try passing the ID in the hash
            window.location.hash = `#class-dashboard/${this.lessonId}`;
        },

        editPlan(planId) {
            // Navigate to plan editor
            window.location.hash = `#plan-editor/${planId}`;
        },

        assignPlan() {
            // TODO: Implement assign plan modal or navigation
            alert('Funcionalidade de atribuir plano em breve.');
        },

        manageAttendance() {
            // Navigate to attendance module or open modal
            // Assuming we have an attendance module
            window.location.hash = `#attendance/${this.lessonId}`;
        }
    };

    window.LessonDetailsModule = LessonDetailsModule;
}

/**
 * Lesson Execution Module - Live Activity Tracking Interface
 * Módulo de Execução de Aula ao Vivo
 * 
 * Interface para instrutores marcarem atividades em tempo real durante a aula.
 * Seguindo: AGENTS.md v2.1 - Single-file approach
 * Referência: public/js/modules/instructors/index.js (745 linhas, single-file)
 * 
 * @version 1.0.0
 * @date 2025-10-07
 */

// Prevenir re-declaração
if (typeof window.LessonExecutionModule !== 'undefined') {
    console.log('🎯 Lesson Execution Module already loaded');
} else {

const LessonExecutionModule = {
    // State management
    container: null,
    moduleAPI: null,
    lessonId: null,
    lessonData: null,
    pollInterval: null,
    pollIntervalMs: 5000, // 5 segundos
    isPolling: false,
    
    /**
     * Inicializar módulo
     */
    async init(lessonId, container = null) {
        console.log('🎯 [LessonExecution] Initializing for lesson:', lessonId);
        
        try {
            // Configurar container
            this.container = container || document.getElementById('lesson-execution-container') || document.getElementById('content');
            
            if (!this.container) {
                throw new Error('Container not found for lesson execution module');
            }
            
            this.lessonId = lessonId;
            
            // Aguardar API Client
            await this.initializeAPI();
            
            // Carregar dados da aula
            await this.loadLessonData();
            
            // Renderizar interface
            this.render();
            
            // Setup eventos
            this.setupEvents();
            
            // Iniciar polling
            this.startPolling();
            
            // Registrar globalmente
            window.lessonExecution = this;
            window.app?.dispatchEvent('module:loaded', { name: 'lessonExecution' });
            
            console.log('✅ [LessonExecution] Module initialized successfully');
            
        } catch (error) {
            console.error('❌ [LessonExecution] Initialization failed:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'init',
                lessonId: lessonId 
            });
            this.renderError(error);
        }
    },
    
    /**
     * Inicializar API Client
     */
    async initializeAPI() {
        // Aguardar API Client global
        await this.waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('LessonExecution');
    },
    
    /**
     * Aguardar API Client estar disponível
     */
    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.apiClient && window.createModuleAPI) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.apiClient && window.createModuleAPI) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    },
    
    /**
     * Carregar dados da aula
     */
    async loadLessonData() {
        try {
            console.log('📊 Loading lesson data for:', this.lessonId);
            
            const response = await this.moduleAPI.request(
                `/api/lesson-activity-executions/lesson/${this.lessonId}`,
                { method: 'GET' }
            );
            
            if (response.success) {
                this.lessonData = response.data;
                console.log('✅ Lesson data loaded:', this.lessonData);
                return this.lessonData;
            } else {
                throw new Error(response.message || 'Failed to load lesson data');
            }
            
        } catch (error) {
            console.error('❌ Error loading lesson data:', error);
            throw error;
        }
    },
    
    /**
     * Renderizar interface principal
     */
    render() {
        if (!this.lessonData) {
            this.renderLoading();
            return;
        }
        
        const { lesson, students, completionRate } = this.lessonData;
        
        this.container.innerHTML = `
            <div class="lesson-execution-module module-isolated-lesson-execution">
                ${this.renderHeader(lesson, completionRate)}
                ${this.renderActivitiesSummary()}
                ${this.renderStudentGrid(students)}
            </div>
        `;
    },
    
    /**
     * Renderizar header premium
     */
    renderHeader(lesson, completionRate) {
        const lessonDate = new Date(lesson.scheduledDate);
        const formattedDate = lessonDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const formattedTime = lessonDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determinar classe de progresso
        let progressClass = 'progress-low';
        if (completionRate >= 80) progressClass = 'progress-high';
        else if (completionRate >= 50) progressClass = 'progress-medium';
        
        const studentsCount = this.lessonData.students.length;
        
        return `
            <header class="module-header-premium">
                <div class="header-content">
                    <div class="header-left">
                        <h1 class="module-title">
                            <i class="icon">🎯</i>
                            <span>${lesson.title || 'Execução de Aula ao Vivo'}</span>
                        </h1>
                        <nav class="breadcrumb">
                            <span class="breadcrumb-item" onclick="window.location.hash='#frequency'">Frequência</span>
                            <span class="breadcrumb-separator">></span>
                            <span class="breadcrumb-item active">Execução ao Vivo</span>
                        </nav>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" id="refresh-data" title="Atualizar dados">
                            🔄 Atualizar
                        </button>
                        <button class="btn-secondary" id="toggle-polling" title="Pausar/Retomar atualização automática">
                            ${this.isPolling ? '⏸️ Pausar' : '▶️ Retomar'}
                        </button>
                    </div>
                </div>
                
                <!-- Stats da Aula -->
                <div class="lesson-stats">
                    <div class="stat-item">
                        <span class="stat-icon">📅</span>
                        <span class="stat-label">Data/Hora:</span>
                        <span class="stat-value">${formattedDate} ${formattedTime}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">👥</span>
                        <span class="stat-label">Alunos:</span>
                        <span class="stat-value">${studentsCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">📊</span>
                        <span class="stat-label">Conclusão Geral:</span>
                        <span class="stat-value ${progressClass}">${completionRate.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item auto-update-indicator">
                        <span class="stat-icon">${this.isPolling ? '🔄' : '⏸️'}</span>
                        <span class="stat-label">Atualização:</span>
                        <span class="stat-value">${this.isPolling ? 'Automática (5s)' : 'Pausada'}</span>
                    </div>
                </div>
            </header>
        `;
    },
    
    /**
     * Renderizar resumo de atividades
     */
    renderActivitiesSummary() {
        if (!this.lessonData.activities || this.lessonData.activities.length === 0) {
            return `
                <div class="activities-summary data-card-premium">
                    <div class="card-header">
                        <h3>📋 Atividades do Plano de Aula</h3>
                    </div>
                    <div class="card-content">
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <h4>Nenhuma atividade planejada</h4>
                            <p>Esta aula não possui um plano de aula com atividades definidas.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const activities = this.lessonData.activities;
        const totalActivities = activities.length;
        
        // Calcular estatísticas agregadas
        const activitiesWithStats = activities.map(activity => {
            const totalStudents = this.lessonData.students.length;
            const completedCount = this.lessonData.students.filter(student => {
                const studentActivity = student.activities.find(a => a.activityId === activity.id);
                return studentActivity && studentActivity.completed;
            }).length;
            
            const completionRate = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;
            
            return {
                ...activity,
                completedCount,
                totalStudents,
                completionRate
            };
        });
        
        return `
            <div class="activities-summary data-card-premium">
                <div class="card-header">
                    <h3>📋 Atividades do Plano de Aula (${totalActivities})</h3>
                </div>
                <div class="card-content">
                    <div class="activities-list">
                        ${activitiesWithStats.map((activity, index) => this.renderActivitySummaryCard(activity, index + 1)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar card de resumo de atividade
     */
    renderActivitySummaryCard(activity, number) {
        const progressClass = activity.completionRate >= 80 ? 'progress-high' :
                             activity.completionRate >= 50 ? 'progress-medium' : 'progress-low';
        
        return `
            <div class="activity-summary-card">
                <div class="activity-number">${number}</div>
                <div class="activity-info">
                    <div class="activity-name">${activity.name}</div>
                    <div class="activity-meta">
                        ${activity.duration ? `⏱️ ${activity.duration} min` : ''}
                        ${activity.reps ? `| 🔁 ${activity.reps} repetições` : ''}
                    </div>
                </div>
                <div class="activity-progress">
                    <div class="progress-text">
                        <span class="completed-fraction">${activity.completedCount}/${activity.totalStudents}</span>
                        <span class="completion-rate ${progressClass}">${activity.completionRate.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar ${progressClass}" style="width: ${activity.completionRate}%"></div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar grid de alunos × atividades
     */
    renderStudentGrid(students) {
        if (!students || students.length === 0) {
            return `
                <div class="student-grid-container data-card-premium">
                    <div class="card-header">
                        <h3>👥 Alunos Presentes</h3>
                    </div>
                    <div class="card-content">
                        <div class="empty-state">
                            <div class="empty-icon">👥</div>
                            <h4>Nenhum aluno presente</h4>
                            <p>Não há alunos registrados nesta aula.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="student-grid-container data-card-premium">
                <div class="card-header">
                    <h3>👥 Execução por Aluno (${students.length})</h3>
                    <div class="grid-controls">
                        <button class="btn-secondary btn-sm" id="mark-all-complete">
                            ✅ Marcar Todos Completo
                        </button>
                        <button class="btn-secondary btn-sm" id="clear-all">
                            ⬜ Limpar Todos
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="students-list">
                        ${students.map(student => this.renderStudentCard(student)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar card de aluno
     */
    renderStudentCard(student) {
        const progressClass = student.completionRate >= 80 ? 'progress-high' :
                             student.completionRate >= 50 ? 'progress-medium' : 'progress-low';
        
        return `
            <div class="student-card" data-student-id="${student.studentId}">
                <div class="student-header">
                    <div class="student-info">
                        <div class="student-avatar">
                            ${student.avatarUrl ? 
                                `<img src="${student.avatarUrl}" alt="${student.studentName}">` :
                                `<div class="avatar-placeholder">${student.studentName.charAt(0).toUpperCase()}</div>`
                            }
                        </div>
                        <div class="student-details">
                            <div class="student-name">${student.studentName}</div>
                            <div class="student-completion ${progressClass}">
                                ${student.completionRate.toFixed(0)}% completo
                            </div>
                        </div>
                    </div>
                    <button class="btn-icon btn-expand" 
                            onclick="lessonExecution.toggleStudentExpand('${student.studentId}')"
                            title="Expandir/Recolher">
                        ▼
                    </button>
                </div>
                
                <div class="student-activities" id="activities-${student.studentId}">
                    ${student.activities.map(activity => this.renderActivityRow(student, activity)).join('')}
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar linha de atividade
     */
    renderActivityRow(student, activity) {
        const isCompleted = activity.completed || false;
        const rating = activity.performanceRating || 0;
        const hasNotes = activity.notes && activity.notes.trim() !== '';
        
        return `
            <div class="activity-row ${isCompleted ? 'completed' : ''}" 
                 data-activity-id="${activity.activityId}"
                 data-attendance-id="${student.attendanceId}">
                
                <div class="activity-checkbox">
                    <input type="checkbox" 
                           id="checkbox-${student.studentId}-${activity.activityId}"
                           ${isCompleted ? 'checked' : ''}
                           onchange="lessonExecution.toggleActivity('${student.studentId}', '${student.attendanceId}', '${activity.activityId}', this.checked)">
                    <label for="checkbox-${student.studentId}-${activity.activityId}">
                        <span class="checkbox-custom"></span>
                    </label>
                </div>
                
                <div class="activity-name">
                    ${activity.activityName}
                </div>
                
                <div class="activity-rating">
                    ${this.renderStarRating(student.studentId, activity.activityId, rating)}
                </div>
                
                <div class="activity-actions">
                    <button class="btn-icon btn-notes ${hasNotes ? 'has-notes' : ''}" 
                            onclick="lessonExecution.openNotesModal('${student.studentId}', '${student.attendanceId}', '${activity.activityId}')"
                            title="${hasNotes ? 'Editar notas' : 'Adicionar notas'}">
                        📝
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Renderizar estrelas de rating
     */
    renderStarRating(studentId, activityId, currentRating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const isFilled = i <= currentRating;
            stars.push(`
                <button class="star-btn ${isFilled ? 'filled' : ''}" 
                        data-rating="${i}"
                        onclick="lessonExecution.rateActivity('${studentId}', '${activityId}', ${i})"
                        title="${i} estrela${i > 1 ? 's' : ''}">
                    ${isFilled ? '⭐' : '☆'}
                </button>
            `);
        }
        return `<div class="star-rating">${stars.join('')}</div>`;
    },
    
    /**
     * Renderizar estado de loading
     */
    renderLoading() {
        this.container.innerHTML = `
            <div class="lesson-execution-loading">
                <div class="loading-spinner"></div>
                <p>Carregando dados da aula...</p>
            </div>
        `;
    },
    
    /**
     * Renderizar estado de erro
     */
    renderError(error) {
        this.container.innerHTML = `
            <div class="lesson-execution-error data-card-premium">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar aula</h3>
                <p>${error.message || 'Ocorreu um erro desconhecido'}</p>
                <button class="btn-primary" onclick="location.reload()">
                    🔄 Tentar Novamente
                </button>
                <button class="btn-secondary" onclick="window.location.hash='#frequency'">
                    ← Voltar para Frequência
                </button>
            </div>
        `;
    },
    
    /**
     * Setup event listeners
     */
    setupEvents() {
        // Botão de refresh
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Botão de toggle polling
        const togglePollingBtn = document.getElementById('toggle-polling');
        if (togglePollingBtn) {
            togglePollingBtn.addEventListener('click', () => this.togglePolling());
        }
        
        // Botão marcar todos completo
        const markAllBtn = document.getElementById('mark-all-complete');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllComplete());
        }
        
        // Botão limpar todos
        const clearAllBtn = document.getElementById('clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }
    },
    
    /**
     * Toggle atividade (checkbox)
     */
    async toggleActivity(studentId, attendanceId, activityId, completed) {
        try {
            console.log('🎯 Toggling activity:', { studentId, attendanceId, activityId, completed });
            
            const response = await this.moduleAPI.request('/api/lesson-activity-executions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendanceId,
                    activityId,
                    completed,
                    recordedBy: this.getCurrentInstructorId()
                })
            });
            
            if (response.success) {
                console.log('✅ Activity toggled successfully');
                await this.refreshData(false); // Refresh sem reload total
            } else {
                throw new Error(response.message || 'Failed to toggle activity');
            }
            
        } catch (error) {
            console.error('❌ Error toggling activity:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'toggleActivity' 
            });
            // Reverter checkbox
            const checkbox = document.getElementById(`checkbox-${studentId}-${activityId}`);
            if (checkbox) checkbox.checked = !completed;
        }
    },
    
    /**
     * Avaliar atividade (rating)
     */
    async rateActivity(studentId, activityId, rating) {
        try {
            console.log('⭐ Rating activity:', { studentId, activityId, rating });
            
            // Encontrar attendance ID
            const student = this.lessonData.students.find(s => s.studentId === studentId);
            if (!student) {
                throw new Error('Student not found');
            }
            
            const response = await this.moduleAPI.request('/api/lesson-activity-executions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendanceId: student.attendanceId,
                    activityId,
                    completed: true, // Rating implica conclusão
                    performanceRating: rating,
                    recordedBy: this.getCurrentInstructorId()
                })
            });
            
            if (response.success) {
                console.log('✅ Activity rated successfully');
                await this.refreshData(false);
            } else {
                throw new Error(response.message || 'Failed to rate activity');
            }
            
        } catch (error) {
            console.error('❌ Error rating activity:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'rateActivity' 
            });
        }
    },
    
    /**
     * Abrir modal de notas
     */
    openNotesModal(studentId, attendanceId, activityId) {
        console.log('📝 Opening notes modal:', { studentId, attendanceId, activityId });
        
        // Encontrar atividade atual
        const student = this.lessonData.students.find(s => s.studentId === studentId);
        const activity = student?.activities.find(a => a.activityId === activityId);
        const currentNotes = activity?.notes || '';
        
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📝 Notas da Atividade</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Aluno:</label>
                        <div class="student-name-display">${student?.studentName || 'N/A'}</div>
                    </div>
                    <div class="form-group">
                        <label>Atividade:</label>
                        <div class="activity-name-display">${activity?.activityName || 'N/A'}</div>
                    </div>
                    <div class="form-group">
                        <label for="activity-notes">Observações:</label>
                        <textarea id="activity-notes" 
                                  class="form-control" 
                                  rows="5" 
                                  placeholder="Ex: Boa execução, mas precisa melhorar a postura...">${currentNotes}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn-primary" onclick="lessonExecution.saveNotes('${studentId}', '${attendanceId}', '${activityId}', this.closest('.modal-overlay'))">
                        💾 Salvar Notas
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus no textarea
        setTimeout(() => {
            const textarea = modal.querySelector('#activity-notes');
            if (textarea) textarea.focus();
        }, 100);
    },
    
    /**
     * Salvar notas
     */
    async saveNotes(studentId, attendanceId, activityId, modalElement) {
        try {
            const textarea = modalElement.querySelector('#activity-notes');
            const notes = textarea.value.trim();
            
            console.log('💾 Saving notes:', { studentId, attendanceId, activityId, notes });
            
            const response = await this.moduleAPI.request('/api/lesson-activity-executions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendanceId,
                    activityId,
                    completed: true, // Notas implicam que atividade foi executada
                    notes,
                    recordedBy: this.getCurrentInstructorId()
                })
            });
            
            if (response.success) {
                console.log('✅ Notes saved successfully');
                modalElement.remove();
                await this.refreshData(false);
            } else {
                throw new Error(response.message || 'Failed to save notes');
            }
            
        } catch (error) {
            console.error('❌ Error saving notes:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'saveNotes' 
            });
        }
    },
    
    /**
     * Marcar todos como completo
     */
    async markAllComplete() {
        if (!confirm('Deseja marcar TODAS as atividades de TODOS os alunos como completas?')) {
            return;
        }
        
        try {
            console.log('✅ Marking all activities as complete...');
            
            const promises = [];
            
            for (const student of this.lessonData.students) {
                for (const activity of student.activities) {
                    if (!activity.completed) {
                        promises.push(
                            this.moduleAPI.request('/api/lesson-activity-executions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    attendanceId: student.attendanceId,
                                    activityId: activity.activityId,
                                    completed: true,
                                    recordedBy: this.getCurrentInstructorId()
                                })
                            })
                        );
                    }
                }
            }
            
            await Promise.all(promises);
            console.log('✅ All activities marked as complete');
            await this.refreshData();
            
        } catch (error) {
            console.error('❌ Error marking all complete:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'markAllComplete' 
            });
        }
    },
    
    /**
     * Limpar todos
     */
    async clearAll() {
        if (!confirm('Deseja limpar TODAS as execuções de atividades? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            console.log('🗑️ Clearing all activity executions...');
            
            // TODO: Implementar endpoint de bulk delete ou iterar por execuções existentes
            alert('Funcionalidade de limpeza em massa será implementada em breve.');
            
        } catch (error) {
            console.error('❌ Error clearing all:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'clearAll' 
            });
        }
    },
    
    /**
     * Toggle expand/collapse de aluno
     */
    toggleStudentExpand(studentId) {
        const activitiesContainer = document.getElementById(`activities-${studentId}`);
        const expandBtn = document.querySelector(`[data-student-id="${studentId}"] .btn-expand`);
        
        if (activitiesContainer && expandBtn) {
            const isExpanded = activitiesContainer.style.display !== 'none';
            activitiesContainer.style.display = isExpanded ? 'none' : 'block';
            expandBtn.textContent = isExpanded ? '▶' : '▼';
        }
    },
    
    /**
     * Refresh dados
     */
    async refreshData(showLoading = true) {
        try {
            if (showLoading) {
                this.renderLoading();
            }
            
            await this.loadLessonData();
            this.render();
            this.setupEvents();
            
            console.log('✅ Data refreshed');
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            window.app?.handleError(error, { 
                module: 'lessonExecution', 
                action: 'refreshData' 
            });
        }
    },
    
    /**
     * Iniciar polling automático
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing lesson data...');
            this.refreshData(false);
        }, this.pollIntervalMs);
        
        console.log('▶️ Polling started (interval: 5s)');
    },
    
    /**
     * Parar polling
     */
    stopPolling() {
        if (!this.isPolling) return;
        
        clearInterval(this.pollInterval);
        this.isPolling = false;
        console.log('⏸️ Polling stopped');
    },
    
    /**
     * Toggle polling
     */
    togglePolling() {
        if (this.isPolling) {
            this.stopPolling();
        } else {
            this.startPolling();
        }
        
        // Atualizar UI
        this.render();
        this.setupEvents();
    },
    
    /**
     * Obter ID do instrutor atual
     */
    getCurrentInstructorId() {
        // Tentar obter do contexto de autenticação
        if (window.app && window.app.currentUser) {
            return window.app.currentUser.id;
        }
        
        // Tentar localStorage
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.id;
            } catch (e) {
                console.warn('Failed to parse current user from localStorage');
            }
        }
        
        // Fallback
        return 'unknown-instructor';
    },
    
    /**
     * Destruir módulo (cleanup)
     */
    destroy() {
        console.log('🗑️ Destroying lesson execution module...');
        
        // Parar polling
        this.stopPolling();
        
        // Limpar referências
        this.lessonData = null;
        this.moduleAPI = null;
        
        console.log('✅ Module destroyed');
    }
};

// Expor globalmente
window.LessonExecutionModule = LessonExecutionModule;
window.lessonExecution = LessonExecutionModule;

// Função global de inicialização para SPA router
window.initLessonExecution = async (lessonId, container) => {
    console.log('🚀 Initializing Lesson Execution Module via router...');
    await LessonExecutionModule.init(lessonId, container);
};

console.log('🎯 Lesson Execution Module loaded and registered globally');

} // end if

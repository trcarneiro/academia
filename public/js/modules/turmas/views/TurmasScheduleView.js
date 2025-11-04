export class TurmasScheduleView {
    constructor(service, controller) {
        this.service = service;
        this.controller = controller;
        this.api = service.api; // ✅ Usar a API do service
        this.container = null;
        this.currentTurma = null;
        this.currentWeekStart = this.getWeekStart(new Date());
        this.events = {
            onBack: null,
            onLessonUpdate: null,
            onAttendanceUpdate: null
        };
    }

    extractResponseData(response, fallback = null) {
        if (!response) return fallback;

        if (Array.isArray(response)) {
            return response;
        }

        if (typeof response === 'object') {
            if ('success' in response) {
                if (!response.success) {
                    throw new Error(response.message || 'Operação inválida');
                }
                return response.data ?? fallback;
            }

            if ('data' in response && response.data !== undefined) {
                return response.data;
            }
        }

        return response ?? fallback;
    }

    render(container, turma) {
        this.container = container;
        this.currentTurma = turma;
        
        // Registrar instância globalmente para callbacks inline
        window.turmasScheduleView = this;
        
        container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header com navegação -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-header-nav">
                            <button id="backToDetail" class="btn-back">
                                <span class="icon">←</span>
                                <span>Voltar</span>
                            </button>
                            <div class="breadcrumb">
                                <span>Turmas</span>
                                <span>/</span>
                                <span>${turma.course?.name || 'Curso'}</span>
                                <span>/</span>
                                <span>Cronograma</span>
                            </div>
                        </div>
                        <h1>📅 Cronograma da Turma</h1>
                        <p>Gerencie o cronograma e acompanhe o progresso das aulas</p>
                    </div>
                </div>

                <!-- Informações da turma -->
                <div class="turma-info-bar">
                    <div class="turma-basic-info">
                        <h3>${turma.course?.name || 'Curso'}</h3>
                        <p><strong>Instrutor:</strong> ${turma.instructor?.name || 'Não definido'}</p>
                        <p><strong>Período:</strong> ${this.formatDate(turma.startDate)} - ${this.formatDate(turma.endDate)}</p>
                        <p><strong>Modalidade:</strong> ${turma.type === 'collective' ? 'Coletiva' : 'Individual'}</p>
                    </div>
                    <div class="turma-progress-info">
                        <div class="progress-stat">
                            <span class="label">Progresso</span>
                            <span class="value" id="progressValue">0%</span>
                        </div>
                        <div class="progress-stat">
                            <span class="label">Aulas Ministradas</span>
                            <span class="value" id="completedLessons">0/0</span>
                        </div>
                        <div class="progress-stat">
                            <span class="label">Próxima Aula</span>
                            <span class="value" id="nextLesson">-</span>
                        </div>
                    </div>
                </div>

                <!-- Controles do calendário -->
                <div class="schedule-controls">
                    <div class="week-navigation">
                        <button id="prevWeek" class="btn-nav">
                            <span>←</span>
                            <span>Semana Anterior</span>
                        </button>
                        <div class="current-week">
                            <h3 id="weekTitle">Semana de</h3>
                            <p id="weekRange">Data</p>
                        </div>
                        <button id="nextWeek" class="btn-nav">
                            <span>Próxima Semana</span>
                            <span>→</span>
                        </button>
                    </div>
                    
                    <div class="schedule-actions">
                        <button id="todayBtn" class="btn-action">
                            <span>📅</span>
                            <span>Hoje</span>
                        </button>
                        <button id="regenerateSchedule" class="btn-action btn-warning">
                            <span>🔄</span>
                            <span>Regenerar Cronograma</span>
                        </button>
                        <button id="exportSchedule" class="btn-action">
                            <span>📊</span>
                            <span>Exportar</span>
                        </button>
                    </div>
                </div>

                <!-- Calendário semanal -->
                <div class="schedule-calendar">
                    <div class="calendar-header">
                        <div class="calendar-day-header">Horário</div>
                        <div class="calendar-day-header">Domingo</div>
                        <div class="calendar-day-header">Segunda</div>
                        <div class="calendar-day-header">Terça</div>
                        <div class="calendar-day-header">Quarta</div>
                        <div class="calendar-day-header">Quinta</div>
                        <div class="calendar-day-header">Sexta</div>
                        <div class="calendar-day-header">Sábado</div>
                    </div>
                    <div id="calendarGrid" class="calendar-grid">
                        <!-- Grid será populado dinamicamente -->
                    </div>
                </div>

                <!-- Detalhes da aula selecionada -->
                <div id="lessonDetails" class="lesson-details-panel" style="display: none;">
                    <div class="lesson-details-header">
                        <h3>Detalhes da Aula</h3>
                        <button id="closeLessonDetails" class="btn-close">×</button>
                    </div>
                    <div class="lesson-details-content">
                        <!-- Conteúdo será preenchido dinamicamente -->
                    </div>
                </div>

                <!-- Modal de confirmação -->
                <div id="confirmModal" class="modal-overlay" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modalTitle">Confirmar Ação</h3>
                            <button id="closeModal" class="btn-close">×</button>
                        </div>
                        <div class="modal-body">
                            <p id="modalMessage">Tem certeza que deseja realizar esta ação?</p>
                        </div>
                        <div class="modal-footer">
                            <button id="modalCancel" class="btn-secondary">Cancelar</button>
                            <button id="modalConfirm" class="btn-primary">Confirmar</button>
                        </div>
                    </div>
                </div>

                <!-- Loading overlay -->
                <div id="loadingOverlay" class="loading-overlay" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Carregando cronograma...</p>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadScheduleData();
        this.updateWeekDisplay();
    }

    setupEventListeners() {
        // Navegação
        const backBtn = this.container.querySelector('#backToDetail');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.events.onBack) {
                    this.events.onBack();
                }
            });
        }

        // Navegação de semanas
        const prevWeekBtn = this.container.querySelector('#prevWeek');
        const nextWeekBtn = this.container.querySelector('#nextWeek');
        const todayBtn = this.container.querySelector('#todayBtn');

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                this.currentWeekStart = this.addDays(this.currentWeekStart, -7);
                this.updateWeekDisplay();
                this.renderCalendar();
            });
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                this.currentWeekStart = this.addDays(this.currentWeekStart, 7);
                this.updateWeekDisplay();
                this.renderCalendar();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentWeekStart = this.getWeekStart(new Date());
                this.updateWeekDisplay();
                this.renderCalendar();
            });
        }

        // Ações do cronograma
        const regenerateBtn = this.container.querySelector('#regenerateSchedule');
        const exportBtn = this.container.querySelector('#exportSchedule');

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.showConfirmModal(
                    'Regenerar Cronograma',
                    'Isso irá recriar todo o cronograma baseado no curso. Aulas já ministradas não serão afetadas. Deseja continuar?',
                    () => this.regenerateSchedule()
                );
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSchedule();
            });
        }

        // Modal
        const closeModal = this.container.querySelector('#closeModal');
        const modalCancel = this.container.querySelector('#modalCancel');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }
        
        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.hideModal());
        }

        // Detalhes da aula
        const closeLessonDetails = this.container.querySelector('#closeLessonDetails');
        if (closeLessonDetails) {
            closeLessonDetails.addEventListener('click', () => {
                this.hideLessonDetails();
            });
        }
    }

    async loadScheduleData({ skipLoadingOverlay = false } = {}) {
        try {
            if (!skipLoadingOverlay) {
                this.showLoading();
            }
            
            // Buscar aulas da turma usando a API do service
            await this.api.fetchWithStates(`/api/turmas/${this.currentTurma.id}/lessons`, {
                onSuccess: (data) => {
                    this.lessons = data || [];
                    this.renderCalendar();
                    this.updateProgressInfo();
                },
                onError: (error) => {
                    console.error('Erro ao carregar cronograma:', error);
                    this.showError('Erro ao carregar cronograma da turma');
                }
            });

        } catch (error) {
            console.error('Erro ao carregar dados do cronograma:', error);
            this.showError('Erro ao carregar cronograma');
        } finally {
            if (!skipLoadingOverlay) {
                this.hideLoading();
            }
        }
    }

    renderCalendar() {
        const calendarGrid = this.container.querySelector('#calendarGrid');
        if (!calendarGrid) return;

        const hours = this.generateTimeSlots();
        const weekDays = this.getWeekDays(this.currentWeekStart);
        
        let gridHTML = '';

        // Para cada horário
        hours.forEach(hour => {
            gridHTML += `<div class="time-slot">${hour}</div>`;
            
            // Para cada dia da semana
            weekDays.forEach((day, dayIndex) => {
                const lesson = this.getLessonForDateTime(day, hour);
                const cellClass = this.getCellClass(day, hour, lesson);
                
                gridHTML += `
                    <div class="${cellClass}" 
                         data-date="${this.formatDateForData(day)}" 
                         data-time="${hour}"
                         ${lesson ? `data-lesson-id="${lesson.id}"` : ''}>
                        ${lesson ? this.renderLessonInCell(lesson) : ''}
                    </div>
                `;
            });
        });

        calendarGrid.innerHTML = gridHTML;
        this.setupCalendarEvents();
    }

    setupCalendarEvents() {
        const cells = this.container.querySelectorAll('.calendar-cell[data-lesson-id]');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const lessonId = cell.dataset.lessonId;
                const lesson = this.lessons.find(l => l.id == lessonId);
                if (lesson) {
                    this.showLessonDetails(lesson);
                }
            });
        });
    }

    getLessonForDateTime(date, time) {
        if (!this.lessons) return null;
        
        const targetDate = this.formatDateForData(date);
        return this.lessons.find(lesson => {
            const lessonDate = this.formatDateForData(new Date(lesson.scheduledDate));
            const lessonTime = this.formatTime(new Date(lesson.scheduledDate));
            return lessonDate === targetDate && lessonTime === time;
        });
    }

    getCellClass(date, time, lesson) {
        let classes = ['calendar-cell'];
        
        if (lesson) {
            classes.push('has-lesson');
            const status = this.normalizeLessonStatus(lesson.status);
            if (status === 'completed') {
                classes.push('lesson-completed');
            } else if (status === 'cancelled') {
                classes.push('lesson-cancelled');
            } else if (status === 'scheduled') {
                classes.push('lesson-scheduled');
            }
        }

        // Verificar se é hoje
        const today = new Date();
        if (this.isSameDay(date, today)) {
            classes.push('today');
        }

        // Verificar se é passado
        if (date < today && !lesson) {
            classes.push('past');
        }

        return classes.join(' ');
    }

    renderLessonInCell(lesson) {
        const statusIcon = this.getLessonStatusIcon(lesson.status);
        const duration = lesson.duration || 60;
        const title = this.escapeHtml(this.formatLessonTitle(lesson));
        
        return `
            <div class="lesson-cell-content">
                <div class="lesson-status">${statusIcon}</div>
                <div class="lesson-info">
                    <div class="lesson-title">${title}</div>
                    <div class="lesson-time">${duration}min</div>
                </div>
            </div>
        `;
    }

    formatLessonTitle(lesson) {
        if (!lesson) {
            return 'Aula';
        }

        const number = lesson.lessonNumber;
        const rawTitle = (lesson.title || lesson.lessonPlan?.title || '').trim();

        if (!number) {
            return rawTitle || 'Aula';
        }

        if (!rawTitle) {
            return `Aula ${number}`;
        }

        const match = rawTitle.match(/^Aula\s+\d+\s*[-:–]?\s*(.*)$/i);
        if (match) {
            const suffix = match[1]?.trim();
            return suffix ? `Aula ${number} - ${suffix}` : `Aula ${number}`;
        }

        return `Aula ${number} - ${rawTitle}`;
    }

    getLessonStatusIcon(status) {
        switch (this.normalizeLessonStatus(status)) {
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            case 'scheduled': return '📅';
            default: return '⏳';
        }
    }

    showLessonDetails(lesson) {
        const panel = this.container.querySelector('#lessonDetails');
        const content = panel.querySelector('.lesson-details-content');
        
        const completedStudents = lesson.attendances?.filter(a => a.present).length || 0;
        const totalStudents = lesson.attendances?.length || 0;
        
        content.innerHTML = `
            <div class="lesson-detail-section">
                <h4>📚 Informações da Aula</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">Título:</span>
                        <span class="value">${this.escapeHtml(this.formatLessonTitle(lesson))}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Data/Hora:</span>
                        <span class="value">${this.formatDateTime(lesson.scheduledDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Duração:</span>
                        <span class="value">${lesson.duration || 60} minutos</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Status:</span>
                        <span class="value status-${this.normalizeLessonStatus(lesson.status)}">${this.getStatusText(lesson.status)}</span>
                    </div>
                </div>
            </div>

            <div class="lesson-detail-section">
                <h4>📋 Plano de Aula</h4>
                <div class="lesson-plan-preview">
                    <p><strong>Objetivos:</strong> ${lesson.lessonPlan?.objectives || 'Não definido'}</p>
                    <p><strong>Descrição:</strong> ${lesson.lessonPlan?.description || 'Não definido'}</p>
                    ${lesson.lessonPlan?.techniques?.length ? `
                        <div class="techniques-list">
                            <strong>Técnicas:</strong>
                            <ul>
                                ${lesson.lessonPlan.techniques.map(t => `<li>${t.name}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="lesson-detail-section">
                <h4>👥 Frequência (${completedStudents}/${totalStudents})</h4>
                <div class="attendance-summary">
                    ${totalStudents > 0 ? `
                        <div class="attendance-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(completedStudents/totalStudents)*100}%"></div>
                            </div>
                            <span class="progress-text">${Math.round((completedStudents/totalStudents)*100)}%</span>
                        </div>
                    ` : '<p>Nenhum aluno matriculado ainda.</p>'}
                </div>
            </div>

            <div class="lesson-actions">
                ${this.normalizeLessonStatus(lesson.status) === 'scheduled' ? `
                    <button class="btn-action" onclick="window.turmasScheduleView.markLessonCompleted('${lesson.id}')">
                        <span>✅</span>
                        <span>Marcar como Realizada</span>
                    </button>
                    <button class="btn-action btn-warning" onclick="window.turmasScheduleView.cancelLesson('${lesson.id}')">
                        <span>❌</span>
                        <span>Cancelar Aula</span>
                    </button>
                ` : ''}
                
                <button class="btn-action" onclick="window.turmasScheduleView.openAttendance('${lesson.id}')">
                    <span>📋</span>
                    <span>Gerenciar Frequência</span>
                </button>
                
                <button class="btn-action" onclick="window.turmasScheduleView.editLesson('${lesson.id}')">
                    <span>✏️</span>
                    <span>Editar Aula</span>
                </button>
            </div>
        `;
        
        panel.style.display = 'block';
        
        // Scroll suave para o painel
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    hideLessonDetails() {
        const panel = this.container.querySelector('#lessonDetails');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    async markLessonCompleted(lessonId) {
        try {
            await this.api.request(`/api/turmas/lessons/${lessonId}/complete`, {
                method: 'POST'
            });
            
            this.showSuccess('Aula marcada como realizada');
            this.loadScheduleData();
            this.hideLessonDetails();
        } catch (error) {
            console.error('Erro ao marcar aula como realizada:', error);
            this.showError('Erro ao marcar aula como realizada');
        }
    }

    async cancelLesson(lessonId) {
        this.showConfirmModal(
            'Cancelar Aula',
            'Tem certeza que deseja cancelar esta aula? Esta ação pode ser desfeita.',
            async () => {
                try {
                    await this.api.request(`/api/turmas/lessons/${lessonId}/cancel`, {
                        method: 'POST'
                    });
                    
                    this.showSuccess('Aula cancelada');
                    this.loadScheduleData();
                    this.hideLessonDetails();
                } catch (error) {
                    console.error('Erro ao cancelar aula:', error);
                    this.showError('Erro ao cancelar aula');
                }
            }
        );
    }

    openAttendance(lessonId) {
        // Implementar navegação para tela de frequência
        if (this.events.onAttendanceUpdate) {
            this.events.onAttendanceUpdate(lessonId);
        }
    }

    editLesson(lessonId) {
        // Implementar edição de aula
        if (this.events.onLessonUpdate) {
            this.events.onLessonUpdate(lessonId);
        }
    }

    async refresh() {
        if (!this.currentTurma?.id) return;

        try {
            this.showLoading();

            if (this.service?.getById) {
                try {
                    const response = await this.service.getById(this.currentTurma.id);
                    const updatedTurma = this.extractResponseData(response, null);
                    if (updatedTurma) {
                        this.currentTurma = updatedTurma;
                    }
                } catch (error) {
                    console.error('Erro ao atualizar dados da turma:', error);
                    if (window.app?.handleError) {
                        window.app.handleError(error, { module: 'turmas', context: 'schedule:refresh:turma' });
                    }
                }
            }

            await this.loadScheduleData({ skipLoadingOverlay: true });
            this.updateWeekDisplay();
        } catch (error) {
            console.error('Erro ao atualizar cronograma:', error);
            this.showError('Erro ao atualizar cronograma');
            if (window.app?.handleError) {
                window.app.handleError(error, { module: 'turmas', context: 'schedule:refresh' });
            }
        } finally {
            this.hideLoading();
        }
    }

    async regenerateSchedule() {
        if (!this.currentTurma?.id) return;

        try {
            if (this.controller?.generateSchedule) {
                await this.controller.generateSchedule(this.currentTurma.id);
                return;
            }

            if (this.service?.generateSchedule) {
                const result = await this.service.generateSchedule(this.currentTurma.id);
                const success = result?.success !== false;

                if (!success) {
                    throw new Error(result?.message || 'Erro ao regenerar cronograma');
                }

                await this.refresh();

                if (!result?.success) {
                    this.showSuccess('Cronograma regenerado com sucesso');
                }
                return;
            }

            await this.api.request(`/api/turmas/${this.currentTurma.id}/schedule`, {
                method: 'POST'
            });
            await this.refresh();
            this.showSuccess('Cronograma regenerado com sucesso');
        } catch (error) {
            console.error('Erro ao regenerar cronograma:', error);
            this.showError('Erro ao regenerar cronograma');
            if (window.app?.handleError) {
                window.app.handleError(error, { module: 'turmas', context: 'schedule:regenerate' });
            }
        }
    }

    async exportSchedule() {
        try {
            const response = await this.api.request(`/api/turmas/${this.currentTurma.id}/export-schedule`);
            
            // Criar e baixar arquivo
            const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cronograma-turma-${this.currentTurma.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Cronograma exportado com sucesso');
        } catch (error) {
            console.error('Erro ao exportar cronograma:', error);
            this.showError('Erro ao exportar cronograma');
        }
    }

    updateProgressInfo() {
        if (!this.lessons) return;
        
        const completed = this.lessons.filter(l => this.normalizeLessonStatus(l.status) === 'completed').length;
        const total = this.lessons.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const now = new Date();
        
        // Encontrar próxima aula
        const nextLesson = this.lessons
            .filter(l => this.normalizeLessonStatus(l.status) === 'scheduled' && new Date(l.scheduledDate) > now)
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
        
        // Atualizar elementos
        const progressElement = this.container.querySelector('#progressValue');
        const completedElement = this.container.querySelector('#completedLessons');
        const nextElement = this.container.querySelector('#nextLesson');
        
        if (progressElement) progressElement.textContent = `${progress}%`;
        if (completedElement) completedElement.textContent = `${completed}/${total}`;
        if (nextElement) {
            nextElement.textContent = nextLesson 
                ? this.formatDate(nextLesson.scheduledDate)
                : 'Nenhuma aula agendada';
        }
    }

    updateWeekDisplay() {
        const weekEnd = this.addDays(this.currentWeekStart, 6);
        
        const titleElement = this.container.querySelector('#weekTitle');
        const rangeElement = this.container.querySelector('#weekRange');
        
        if (titleElement) {
            titleElement.textContent = `Semana de ${this.formatDate(this.currentWeekStart)}`;
        }
        
        if (rangeElement) {
            rangeElement.textContent = `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(weekEnd)}`;
        }
    }

    showConfirmModal(title, message, onConfirm) {
        const modal = this.container.querySelector('#confirmModal');
        const titleElement = modal.querySelector('#modalTitle');
        const messageElement = modal.querySelector('#modalMessage');
        const confirmBtn = modal.querySelector('#modalConfirm');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Remove listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            this.hideModal();
            onConfirm();
        });
        
        modal.style.display = 'flex';
    }

    hideModal() {
        const modal = this.container.querySelector('#confirmModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading() {
        const overlay = this.container.querySelector('#loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = this.container.querySelector('#loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        // Implementar notificação de sucesso
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    showError(message) {
        // Implementar notificação de erro
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    // Utility methods
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    getWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(this.addDays(startDate, i));
        }
        return days;
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 6; hour <= 22; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('pt-BR');
    }

    formatTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatDateTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleString('pt-BR');
    }

    formatDateForData(date) {
        return date.toISOString().split('T')[0];
    }

    normalizeLessonStatus(status) {
        if (!status) return '';
        return status.toString().trim().toLowerCase();
    }

    getStatusText(status) {
        switch (this.normalizeLessonStatus(status)) {
            case 'scheduled': return 'Agendada';
            case 'completed': return 'Realizada';
            case 'cancelled': return 'Cancelada';
            default: return 'Indefinido';
        }
    }

    escapeHtml(value) {
        if (value === undefined || value === null) return '';
        return value
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Métodos públicos para eventos
    onBack(callback) {
        this.events.onBack = callback;
    }

    onLessonUpdate(callback) {
        this.events.onLessonUpdate = callback;
    }

    onAttendanceUpdate(callback) {
        this.events.onAttendanceUpdate = callback;
    }
}

// Tornar disponível globalmente para callbacks
window.TurmasScheduleView = TurmasScheduleView;

/**
 * Calendar Controller - MVP Version
 * Controlador para gerenciar o calendário de aulas
 */

class CalendarController {
    constructor(agendaService) {
        this.agendaService = agendaService;
        this.currentDate = new Date();
        this.currentView = 'today'; // today, week, month
        this.currentFilters = {
            instructor: '',
            course: '',
            status: '',
            type: ''
        };
        console.log('📅 CalendarController initialized');
    }

    async initialize() {
        console.log('📅 Initializing CalendarController...');
        
        this.attachEventListeners();
        await this.loadInitialData();
        await this.renderCurrentView();
        
        console.log('✅ CalendarController initialized');
    }

    // Format a Date to local YYYY-MM-DD (avoids UTC drift when using toISOString)
    formatLocalYMD(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    attachEventListeners() {
        // View buttons
        document.getElementById('todayBtn')?.addEventListener('click', () => this.switchView('today'));
        document.getElementById('weekBtn')?.addEventListener('click', () => this.switchView('week'));
        document.getElementById('monthBtn')?.addEventListener('click', () => this.switchView('month'));
        
        // Navigation buttons
        document.getElementById('prevBtn')?.addEventListener('click', () => this.navigatePrevious());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.navigateNext());
        
        // Filter changes
        document.getElementById('instructorFilter')?.addEventListener('change', (e) => {
            this.currentFilters.instructor = e.target.value;
            this.renderCurrentView();
        });
        
        document.getElementById('courseFilter')?.addEventListener('change', (e) => {
            this.currentFilters.course = e.target.value;
            this.renderCurrentView();
        });
        
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.renderCurrentView();
        });
        document.getElementById('typeFilter')?.addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.renderCurrentView();
        });
        
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.agendaService.clearCache();
            this.renderCurrentView();
        });
    }

    async loadInitialData() {
        try {
            // Load filter options
            await Promise.all([
                this.loadInstructorsFilter(),
                this.loadCoursesFilter(),
                this.loadAndUpdateStats()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            window.showFeedback?.('Erro ao carregar dados iniciais', 'error');
        }
    }

    async loadInstructorsFilter() {
        try {
            const response = await this.agendaService.getInstructors();
            const instructors = response?.data || [];
            const select = document.getElementById('instructorFilter');
            
            if (select && instructors.length > 0) {
                // Clear existing options except first
                select.innerHTML = '<option value="">Todos os Instrutores</option>';
                
                instructors.forEach(instructor => {
                    const option = document.createElement('option');
                    option.value = instructor.id;
                    option.textContent = instructor.name || `${instructor.user?.firstName || ''} ${instructor.user?.lastName || ''}`.trim();
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading instructors filter:', error);
        }
    }

    async loadCoursesFilter() {
        try {
            const response = await this.agendaService.getCourses();
            const courses = response?.data || [];
            const select = document.getElementById('courseFilter');
            
            if (select && courses.length > 0) {
                // Clear existing options except first
                select.innerHTML = '<option value="">Todos os Cursos</option>';
                
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading courses filter:', error);
        }
    }

    async loadAndUpdateStats() {
        try {
            const today = this.formatLocalYMD(new Date());
            const response = await this.agendaService.getAgendaStats(today);
            const stats = response?.data || {};
            
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        if (!stats) return;

        const totalClassesEl = document.getElementById('totalClassesToday');
        const totalStudentsEl = document.getElementById('totalStudentsToday');
        const activeInstructorsEl = document.getElementById('activeInstructors');
        const checkedInEl = document.getElementById('checkedInToday');

        if (totalClassesEl) totalClassesEl.textContent = stats.totalClasses || 0;
        if (totalStudentsEl) totalStudentsEl.textContent = stats.totalStudents || 0;
        if (activeInstructorsEl) activeInstructorsEl.textContent = stats.activeInstructors || 0;
        if (checkedInEl) checkedInEl.textContent = stats.checkedIn || 0;
    }

    switchView(view) {
        console.log(`📅 Switching to ${view} view`);
        
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.btn-header').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${view}Btn`)?.classList.add('active');
        
        this.renderCurrentView();
    }

    async renderCurrentView() {
        this.showLoading();
        
        try {
            switch (this.currentView) {
                case 'today':
                    await this.renderTodayView();
                    break;
                case 'week':
                    await this.renderWeekView();
                    break;
                case 'month':
                    await this.renderMonthView();
                    break;
            }
        } catch (error) {
            console.error('Error rendering view:', error);
            this.showError('Erro ao carregar agenda');
        } finally {
            this.hideLoading();
        }
    }

    async renderTodayView() {
        console.log('📅 Rendering today view');

        const today = new Date();
        const todayStr = this.formatLocalYMD(today);

        // Update title
        const titleEl = document.getElementById('calendarTitle');
        const subtitleEl = document.getElementById('calendarSubtitle');

        if (titleEl) titleEl.textContent = 'Hoje';
        if (subtitleEl) subtitleEl.textContent = this.agendaService.formatDate(today);

        // Load today's classes
        const response = await this.agendaService.getClasses(todayStr, todayStr, this.currentFilters);
        const classes = response?.data || [];

        this.renderTodayClasses(classes);
    }

    renderTodayClasses(classes) {
        const container = document.getElementById('calendarContent');

        if (!container) {
            console.error('Calendar content container not found');
            return;
        }

        if (!classes || classes.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('Nenhuma aula programada para hoje');
            return;
        }
        
        // Group classes by time - handle the API response format
        const classesByTime = this.groupClassesByTime(classes);
        
        let html = '<div class="today-schedule">';
        
        Object.keys(classesByTime).sort().forEach(time => {
            const timeClasses = classesByTime[time];
            
            html += `
                <div class="time-slot">
                    <div class="time-header">
                        <div class="time-display">${this.formatTimeFromISO(time)}</div>
                        <div class="classes-count">${timeClasses.length} aula${timeClasses.length > 1 ? 's' : ''}</div>
                    </div>
                    <div class="classes-list">
                        ${timeClasses.map(classItem => this.renderClassCard(classItem)).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        this.attachClassEventListeners();
    }

    groupClassesByTime(classes) {
        const grouped = {};
        
        classes.forEach(classItem => {
            // Extract time from ISO datetime string
            const startTimeISO = classItem.startTime;
            const timeKey = startTimeISO; // Use full ISO string as key for sorting
            
            if (!grouped[timeKey]) {
                grouped[timeKey] = [];
            }
            grouped[timeKey].push(classItem);
        });
        
        return grouped;
    }

    formatTimeFromISO(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderClassCard(classItem) {
        const statusClass = this.getStatusClass(classItem.status);
        const checkedInCount = classItem.attendanceCount || 0;
        const totalStudents = classItem.maxStudents || 0;
        const isVirtual = !!classItem.isVirtual;
        const itemType = classItem.type || (isVirtual ? 'TURMA' : 'CLASS');
        const typeBadge = itemType === 'PERSONAL_SESSION'
            ? '<span class="type-badge type-personal">Personal</span>'
            : (isVirtual ? '<span class="type-badge type-turma">Turma</span>' : '<span class="type-badge type-class">Aula</span>');
        
        return `
            <div class="class-card ${statusClass}" data-class-id="${classItem.id}" data-item-type="${itemType}">
                <div class="class-header">
                    <div class="class-title">
                        <h4>${classItem.title || 'Aula'} ${typeBadge}</h4>
                        <span class="course-name">${classItem.course?.name || 'Curso'}</span>
                    </div>
                    <div class="class-status">
                        <span class="status-badge ${statusClass}">${this.getStatusText(classItem.status)}</span>
                    </div>
                </div>
                
                <div class="class-info">
                    <div class="info-item">
                        <span class="info-icon">👨‍🏫</span>
                        <span class="info-text">${classItem.instructor?.name || 'Instrutor não definido'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">🕐</span>
                        <span class="info-text">${this.formatTimeFromISO(classItem.startTime)} - ${this.formatTimeFromISO(classItem.endTime)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">👥</span>
                        <span class="info-text">${checkedInCount}/${totalStudents} alunos</span>
                    </div>
                    ${classItem.description ? `
                        <div class="info-item">
                            <span class="info-icon">�</span>
                            <span class="info-text">${classItem.description}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="class-actions">
                    <button class="btn-action btn-checkin" onclick="window.agendaModule.openCheckinModal('${classItem.id}')">
                        <span class="btn-icon">🏃</span>
                        <span class="btn-text">Check-in</span>
                    </button>
                    <button class="btn-action btn-details" onclick="window.agendaModule.viewItemDetails('${classItem.id}', '${itemType}')">
                        <span class="btn-icon">👁️</span>
                        <span class="btn-text">Detalhes</span>
                    </button>
                </div>
            </div>
        `;
    }

    async renderWeekView() {
        console.log('📅 Rendering week view');

        const weekDates = this.agendaService.getWeekDates(this.currentDate);
        const startDate = this.formatLocalYMD(weekDates[0]);
        const endDate = this.formatLocalYMD(weekDates[6]);

        // Update title
        const titleEl = document.getElementById('calendarTitle');
        const subtitleEl = document.getElementById('calendarSubtitle');

        if (titleEl) titleEl.textContent = 'Semana';
        if (subtitleEl) subtitleEl.textContent =
            `${this.agendaService.formatDate(weekDates[0])} - ${this.agendaService.formatDate(weekDates[6])}`;

        // Load week's classes (using local YYYY-MM-DD to avoid timezone issues)
        const response = await this.agendaService.getClasses(startDate, endDate, this.currentFilters);
        const classes = response?.data || [];

        this.renderWeekClasses(classes, weekDates);
    }

    renderWeekClasses(classes, weekDates) {
        const container = document.getElementById('calendarContent');

        if (!container) {
            console.error('Calendar content container not found');
            return;
        }

        let html = '<div class="week-view">';
        
        // Week header
        html += '<div class="week-header">';
        weekDates.forEach(date => {
            const isToday = date.toDateString() === new Date().toDateString();
            html += `
                <div class="day-header ${isToday ? 'today' : ''}">
                    <div class="day-name">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                    <div class="day-number">${date.getDate()}</div>
                </div>
            `;
        });
        html += '</div>';
        
        // Week body with time slots
        html += '<div class="week-body">';
        const timeSlots = this.generateTimeSlots();
        
        timeSlots.forEach(time => {
            html += `<div class="time-row">`;
            html += `<div class="time-label">${time}</div>`;
            
            weekDates.forEach(date => {
                const dateStr = this.formatLocalYMD(date);
                const dayClasses = classes.filter(c => {
                    try {
                        const cDateStr = this.formatLocalYMD(new Date(c.startTime));
                        const cTime = new Date(c.startTime).toTimeString().slice(0, 5);
                        return cDateStr === dateStr && cTime === time;
                    } catch (_e) {
                        return false;
                    }
                });
                
                html += `<div class="day-cell">`;
                dayClasses.forEach(classItem => {
                    html += this.renderMiniClassCard(classItem);
                });
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        html += '</div></div>';
        
        container.innerHTML = html;
        this.attachClassEventListeners();
    }

    async renderMonthView() {
        console.log('📅 Rendering month view');

        const monthInfo = this.agendaService.getMonthDates(this.currentDate);
        const startDate = this.formatLocalYMD(monthInfo.firstDay);
        const endDate = this.formatLocalYMD(monthInfo.lastDay);

        // Update title
        const titleEl = document.getElementById('calendarTitle');
        const subtitleEl = document.getElementById('calendarSubtitle');

        if (titleEl) titleEl.textContent =
            this.currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        if (subtitleEl) subtitleEl.textContent =
            `${monthInfo.daysInMonth} dias`;

        // Load month's classes
        const response = await this.agendaService.getClasses(startDate, endDate, this.currentFilters);
        const classes = response?.data || [];

        this.renderMonthClasses(classes, monthInfo);
    }

    renderMonthClasses(classes, monthInfo) {
        const container = document.getElementById('calendarContent');

        if (!container) {
            console.error('Calendar content container not found');
            return;
        }

        // Group classes by local date
        const classesByDate = {};
        classes.forEach(cls => {
            const dateKey = this.formatLocalYMD(new Date(cls.startTime));
            if (!classesByDate[dateKey]) {
                classesByDate[dateKey] = [];
            }
            classesByDate[dateKey].push(cls);
        });

        let html = '<div class="month-view">';
        
        // Month calendar grid
        html += '<div class="month-grid">';
        
        // Days of week header
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        html += '<div class="month-header-row">';
        daysOfWeek.forEach(day => {
            html += `<div class="month-day-header">${day}</div>`;
        });
        html += '</div>';
        
        // Calculate first day of month and generate calendar
        const firstDay = monthInfo.firstDay;
        const lastDay = monthInfo.lastDay;
        const startOfCalendar = new Date(firstDay);
        startOfCalendar.setDate(startOfCalendar.getDate() - firstDay.getDay());
        
        const endOfCalendar = new Date(lastDay);
        endOfCalendar.setDate(endOfCalendar.getDate() + (6 - lastDay.getDay()));
        
        const currentDate = new Date(startOfCalendar);
        const today = new Date();
        
        while (currentDate <= endOfCalendar) {
            const dateStr = this.formatLocalYMD(currentDate);
            const isCurrentMonth = currentDate.getMonth() === firstDay.getMonth();
            const isToday = currentDate.toDateString() === today.toDateString();
            const dayClasses = classesByDate[dateStr] || [];
            
            let cellClass = 'month-day-cell';
            if (!isCurrentMonth) cellClass += ' other-month';
            if (isToday) cellClass += ' today';
            if (dayClasses.length > 0) cellClass += ' has-classes';
            
            html += `
                <div class="${cellClass}" data-date="${dateStr}">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-classes">
                        ${dayClasses.slice(0, 3).map(cls => `
                            <div class="mini-class-event ${this.getStatusClass(cls.status)}" 
                                 title="${cls.title || 'Aula'} - ${cls.course?.name || 'Curso'}"
                                 onclick="window.agendaModule.viewItemDetails('${cls.id}', '${cls.type || (cls.isVirtual ? 'TURMA' : 'CLASS')}')">
                                <span class="class-time">${this.formatTimeFromISO(cls.startTime)}</span>
                                <span class="class-title">${(cls.title || cls.course?.name || 'Aula').substring(0, 20)}</span>
                            </div>
                        `).join('')}
                        ${dayClasses.length > 3 ? `
                            <div class="more-classes" onclick="window.agendaModule.showDayClasses('${dateStr}')">
                                +${dayClasses.length - 3} mais
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        html += '</div>'; // Close month-grid
        
        // Month summary
        html += `
            <div class="month-summary">
                <div class="summary-stats">
                    <div class="summary-item">
                        <span class="summary-number">${classes.length}</span>
                        <span class="summary-label">Total de Aulas</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-number">${Object.keys(classesByDate).length}</span>
                        <span class="summary-label">Dias com Aulas</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-number">${classes.filter(c => c.status === 'COMPLETED').length}</span>
                        <span class="summary-label">Aulas Concluídas</span>
                    </div>
                </div>
            </div>
        `;
        
        html += '</div>'; // Close month-view
        
        container.innerHTML = html;
        this.attachClassEventListeners();
    }

    showDayClasses(dateStr) {
        // Switch to day view for the selected date
        this.currentDate = new Date(dateStr);
        this.switchView('today');
    }

    renderMiniClassCard(classItem) {
        const statusClass = this.getStatusClass(classItem.status);
        const isVirtual = !!classItem.isVirtual;
        const itemType = classItem.type || (isVirtual ? 'TURMA' : 'CLASS');
        const typeIcon = itemType === 'PERSONAL_SESSION' ? '👤' : (isVirtual ? '👥' : '📘');
        
        return `
            <div class="mini-class-card ${statusClass}" data-class-id="${classItem.id}" data-item-type="${classItem.type || (classItem.isVirtual ? 'TURMA' : 'CLASS')}">
                <div class="mini-class-title">${typeIcon} ${classItem.course?.name || classItem.title || 'Aula'}</div>
                <div class="mini-class-info">${classItem.instructor?.name}</div>
            </div>
        `;
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 6; hour <= 22; hour++) {
            for (const minute of [0, 15, 30, 45]) {
                slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }
        return slots;
    }

    attachClassEventListeners() {
        // Add event listeners for class cards
        document.querySelectorAll('.class-card, .mini-class-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-action')) {
                    const classId = card.dataset.classId;
                    const itemType = card.dataset.itemType;
                    this.viewItemDetails(classId, itemType);
                }
            });
        });
    }

    async viewItemDetails(id, type) {
        // Deep-link using hash so SPA router can resolve the first segment and keep params
        if (type === 'PERSONAL_SESSION') {
            const route = `turma-editor/personal/${id}`;
            window.location.hash = `#${route}`;
            // Ensure SPA router loads the route without clobbering subpath
            if (window.router?.navigateTo) window.router.navigateTo('turma-editor');
            return;
        }
        
        // For TURMA and CLASS, go to lesson-details
        // This handles both virtual IDs (turma-...) and regular IDs
        const route = `lesson-details/${id}`;
        window.location.hash = `#${route}`;
        if (window.router?.navigateTo) window.router.navigateTo('lesson-details');
    }
    
    // Legacy method kept for reference or direct calls
    async viewClassDetails(classId) {
        console.log(`📅 Viewing details for class ${classId}`);
        
        try {
            this.showLoading();
            
            // Fetch class details from API
            const response = await this.agendaService.moduleAPI.api.get(`/api/agenda/class/${classId}`);
            
            if (response?.success && response.data) {
                // Route virtual turma classes directly to Turmas editor (no modals per UI standard)
                if (response.data.isVirtual && response.data.turmaId) {
                    // Navigate directly to turma editor; avoid opening modal
                    const route = `turma-editor/${response.data.turmaId}`;
                    window.location.hash = `#${route}`;
                    if (window.router?.navigateTo) window.router.navigateTo('turma-editor');
                    return;
                }
                this.showClassDetailsModal(response.data);
            } else {
                window.showFeedback?.('Erro ao carregar detalhes da aula', 'error');
            }
        } catch (error) {
            console.error('Error fetching class details:', error);
            window.showFeedback?.('Erro ao carregar detalhes da aula', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showClassDetailsModal(classData) {
        const modal = document.createElement('div');
        modal.className = 'class-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>📚 Detalhes da Aula</h2>
                        <button class="modal-close" onclick="this.closest('.class-details-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="class-detail-section">
                            <h3>Informações Gerais</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Título:</label>
                                    <span id="edit-title">${classData.title || 'Não informado'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status:</label>
                                    <span class="status-badge ${this.getStatusClass(classData.status)}" id="edit-status">${this.getStatusText(classData.status)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Horário:</label>
                                    <span>${this.formatTimeFromISO(classData.startTime)} - ${this.formatTimeFromISO(classData.endTime)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Data:</label>
                                    <span>${new Date(classData.startTime).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Capacidade:</label>
                                    <span>${classData.maxStudents || 'Ilimitada'} alunos</span>
                                </div>
                            </div>
                        </div>
                        ${classData.course ? `
                            <div class="class-detail-section">
                                <h3>Curso</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome:</label>
                                        <span>${classData.course.name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Categoria:</label>
                                        <span>${classData.course.category}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        ${classData.instructor ? `
                            <div class="class-detail-section">
                                <h3>Instrutor</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome:</label>
                                        <span>${classData.instructor.name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Email:</label>
                                        <span>${classData.instructor.email}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        ${classData.description ? `
                            <div class="class-detail-section">
                                <h3>Descrição</h3>
                                <p id="edit-description">${classData.description}</p>
                            </div>
                        ` : ''}
                        <div class="class-detail-section">
                            <h3>Presenças (${classData.attendances?.length || 0})</h3>
                            ${this.renderAttendancesList(classData.attendances || [])}
                        </div>
                        <div class="class-detail-section">
                            <button class="btn-primary" id="edit-class-btn">Editar Aula</button>
                            <form id="edit-class-form" style="display:none; margin-top:1em;">
                                <label>Status:
                                    <select name="status" id="edit-status-input">
                                        <option value="SCHEDULED" ${classData.status==='SCHEDULED'?'selected':''}>Agendada</option>
                                        <option value="IN_PROGRESS" ${classData.status==='IN_PROGRESS'?'selected':''}>Em Andamento</option>
                                        <option value="COMPLETED" ${classData.status==='COMPLETED'?'selected':''}>Finalizada</option>
                                        <option value="CANCELLED" ${classData.status==='CANCELLED'?'selected':''}>Cancelada</option>
                                    </select>
                                </label>
                                <label>Notas:<br>
                                    <textarea name="notes" id="edit-notes-input" rows="2">${classData.notes||''}</textarea>
                                </label>
                                <button type="submit" class="btn-primary">Salvar</button>
                                <button type="button" class="btn-secondary" id="cancel-edit-btn">Cancelar</button>
                            </form>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.class-details-modal').remove()">Fechar</button>
                        <button class="btn-primary" onclick="window.agendaModule.openCheckinModal('${classData.id}'); this.closest('.class-details-modal').remove();">
                            🏃 Fazer Check-in
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Edição inline
        const editBtn = modal.querySelector('#edit-class-btn');
        const editForm = modal.querySelector('#edit-class-form');
        const cancelEditBtn = modal.querySelector('#cancel-edit-btn');
        editBtn?.addEventListener('click', () => {
            editForm.style.display = 'block';
            editBtn.style.display = 'none';
        });
        cancelEditBtn?.addEventListener('click', () => {
            editForm.style.display = 'none';
            editBtn.style.display = 'inline-block';
        });
        editForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const status = editForm.querySelector('#edit-status-input').value;
            const notes = editForm.querySelector('#edit-notes-input').value;
            try {
                // PUT para turmaLesson se for virtual, ou para aula normal
                let url = '';
                if (classData.isVirtual && classData.turmaId && classData.turmaLessonId) {
                    url = `/api/turmas/${classData.turmaId}/lessons/${classData.turmaLessonId}`;
                } else {
                    url = `/api/agenda/class/${classData.id}`;
                }
                const result = await this.agendaService.moduleAPI.api.put(url, { status, notes });
                if (result.success) {
                    window.showFeedback?.('Aula atualizada com sucesso', 'success');
                    modal.remove();
                    this.renderCurrentView();
                } else {
                    window.showFeedback?.('Falha ao atualizar aula', 'error');
                }
            } catch (err) {
                window.showFeedback?.('Erro ao atualizar aula', 'error');
            }
        });
    }

    renderAttendancesList(attendances) {
        if (!attendances || attendances.length === 0) {
            return '<p class="empty-message">Nenhuma presença registrada ainda</p>';
        }

        let html = '<div class="attendances-list">';
        attendances.forEach(attendance => {
            html += `
                <div class="attendance-item">
                    <div class="student-info">
                        <span class="student-name">${attendance.student?.name || 'Aluno não identificado'}</span>
                        <span class="student-reg">#${attendance.student?.registrationNumber || 'N/A'}</span>
                    </div>
                    <div class="attendance-status ${attendance.status.toLowerCase()}">
                        ${attendance.status === 'PRESENT' ? '✅ Presente' : '❌ Ausente'}
                    </div>
                    ${attendance.checkInTime ? `
                        <div class="checkin-time">
                            ${new Date(attendance.checkInTime).toLocaleTimeString('pt-BR')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += '</div>';

        return html;
    }

    openCheckinModal(classId) {
        console.log(`📅 Opening check-in for class ${classId}`);
        // Integration with frequency module (check-in system)
        if (window.frequencyModule) {
            // Load frequency module with class context
            window.frequencyModule.openCheckinForClass?.(classId);
        } else if (window.app) {
            // Navigate to frequency module
            window.app.loadModule('frequency');
            // Store class ID for when module loads
            window.sessionStorage?.setItem('pendingCheckinClassId', classId);
        } else {
            window.showFeedback?.('Sistema de check-in não está disponível', 'warning');
        }
    }

    navigatePrevious() {
        switch (this.currentView) {
            case 'today':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() - 7);
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;
        }
        this.renderCurrentView();
    }

    navigateNext() {
        switch (this.currentView) {
            case 'today':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + 7);
                break;
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;
        }
        this.renderCurrentView();
    }

    getStatusClass(status) {
        const classes = {
            'SCHEDULED': 'scheduled',
            'IN_PROGRESS': 'in-progress',
            'COMPLETED': 'completed',
            'CANCELLED': 'cancelled'
        };
        return classes[status] || 'scheduled';
    }

    getStatusText(status) {
        const texts = {
            'SCHEDULED': 'Agendada',
            'IN_PROGRESS': 'Em Andamento',
            'COMPLETED': 'Finalizada',
            'CANCELLED': 'Cancelada'
        };
        return texts[status] || 'Agendada';
    }

    showLoading() {
        document.getElementById('agendaLoading')?.style.setProperty('display', 'flex');
    }

    hideLoading() {
        document.getElementById('agendaLoading')?.style.setProperty('display', 'none');
    }

    showError(message) {
        const container = document.getElementById('calendarContent');
        if (container) {
            container.innerHTML = this.getErrorStateHTML(message);
        } else {
            console.error("Could not find 'calendarContent' to display error:", message);
        }
    }

    getEmptyStateHTML(message) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <div class="empty-message">${message}</div>
                <div class="empty-submessage">As aulas aparecerão aqui quando forem programadas</div>
            </div>
        `;
    }

    getErrorStateHTML(message) {
        return `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button class="btn-retry" onclick="agendaModule.calendarController.renderCurrentView()">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Expose globally
window.CalendarController = CalendarController;

/**
 * Check-in Kiosk Module
 * Sistema de check-in para alunos via matrícula
 * 
 * Seguindo: AGENTS.md v2.0 Premium UI Standards
 * Arquitetura: API-first, Event-driven, Modular
 */

class CheckinKiosk {
    constructor() {
        this.currentStudent = null;
        this.availableClasses = [];
        this.initialized = false;
        
        // API Client
        this.apiClient = null;
        
        // Students cache for instant search
        this.studentsCache = [];
        this.cacheLoaded = false;
        
        // DOM Elements
        this.elements = {};
        
        // State
        this.isLoading = false;
    }

    /**
     * Initialize kiosk
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('🖥️ Inicializando Check-in Kiosk...');
            
            // Wait for API Client
            await this.waitForAPIClient();
            
            // Setup DOM elements
            this.setupElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start clock
            this.startClock();
            
            // Load students cache
            await this.loadStudentsCache();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ Check-in Kiosk inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Check-in Kiosk:', error);
            this.showError('Erro ao inicializar sistema. Tente novamente.');
        }
    }

    /**
     * Wait for API Client
     */
    async waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.apiClient) {
                this.apiClient = window.apiClient;
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.apiClient) {
                        this.apiClient = window.apiClient;
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    /**
     * Load students cache for instant search
     */
    async loadStudentsCache() {
        try {
            console.log('📥 Carregando cache de alunos...');
            
            const response = await this.apiClient.get('/api/attendance/students/all');
            
            if (response.success && response.data) {
                this.studentsCache = response.data;
                this.cacheLoaded = true;
                console.log(`✅ Cache carregado: ${this.studentsCache.length} alunos`);
            } else {
                console.warn('⚠️ Não foi possível carregar cache de alunos');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar cache de alunos:', error);
        }
    }

    /**
     * Refresh students cache
     */
    async refreshStudentsCache() {
        this.cacheLoaded = false;
        await this.loadStudentsCache();
    }

    /**
     * Setup DOM elements
     */
    setupElements() {
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            mainContent: document.getElementById('main-content'),
            lookupStage: document.getElementById('lookup-stage'),
            dashboardStage: document.getElementById('dashboard-stage'),
            
            // Clock
            currentTime: document.getElementById('current-time'),
            
            // Lookup form
            registrationInput: document.getElementById('registration-input'),
            lookupBtn: document.getElementById('lookup-btn'),
            lookupError: document.getElementById('lookup-error'),
            searchResults: document.getElementById('search-results'),
            
            // Student info
            studentAvatar: document.getElementById('student-avatar'),
            studentName: document.getElementById('student-name'),
            studentRegistration: document.getElementById('student-registration'),
            studentLevel: document.getElementById('student-level'),
            
            // Stats
            attendanceRate: document.getElementById('attendance-rate'),
            classesMonth: document.getElementById('classes-month'),
            graduationLevel: document.getElementById('graduation-level'),
            
            // Classes and activity
            availableClasses: document.getElementById('available-classes'),
            recentActivity: document.getElementById('recent-activity'),
            
            // Buttons
            logoutBtn: document.getElementById('logout-btn'),
            
            // Modals
            confirmationModal: document.getElementById('confirmation-modal'),
            successModal: document.getElementById('success-modal'),
            cancelCheckin: document.getElementById('cancel-checkin'),
            confirmCheckin: document.getElementById('confirm-checkin'),
            successOk: document.getElementById('success-ok'),
            
            // Modal content
            confirmClassName: document.getElementById('confirm-class-name'),
            confirmClassTime: document.getElementById('confirm-class-time'),
            confirmInstructor: document.getElementById('confirm-instructor'),
            successClassName: document.getElementById('success-class-name'),
            successTime: document.getElementById('success-time'),
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Registration input with instant search
        let searchTimeout;
        this.elements.registrationInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            this.elements.lookupBtn.disabled = value.length < 1;
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Hide search results if input is empty
            if (value.length === 0) {
                this.hideSearchResults();
                return;
            }
            
            // Instant search for any input (using cache)
            if (this.cacheLoaded) {
                // Instant search with cache
                this.searchStudents(value);
            } else {
                // Debounced API search if cache not loaded
                if (value.length >= 2) {
                    searchTimeout = setTimeout(() => {
                        this.searchStudents(value);
                    }, 300);
                } else {
                    this.hideSearchResults();
                }
            }
        });

        this.elements.registrationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.lookupBtn.disabled) {
                this.lookupStudent();
            }
        });

        // Lookup button
        this.elements.lookupBtn.addEventListener('click', () => {
            this.lookupStudent();
        });

        // Logout button
        this.elements.logoutBtn.addEventListener('click', () => {
            this.logout();
        });

        // Modal buttons
        this.elements.cancelCheckin.addEventListener('click', () => {
            this.hideModal('confirmation');
        });

        this.elements.confirmCheckin.addEventListener('click', () => {
            this.performCheckin();
        });

        this.elements.successOk.addEventListener('click', () => {
            this.hideModal('success');
            this.refreshDashboard();
        });

        // Auto-focus on registration input
        this.elements.registrationInput.focus();
    }

    /**
     * Start clock
     */
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            this.elements.currentTime.textContent = `${timeString} - ${dateString}`;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        setTimeout(() => {
            this.elements.loadingScreen.style.display = 'none';
            this.elements.mainContent.style.display = 'flex';
        }, 1500);
    }

    /**
     * Lookup student by registration or name
     */
    async lookupStudent() {
        const query = this.elements.registrationInput.value.trim();
        
        if (!query || query.length < 1) {
            this.showError('Digite pelo menos 1 caractere');
            return;
        }

        this.setLoading(true);
        this.hideError();
        this.hideSearchResults();

        try {
            console.log('🔍 Buscando aluno:', query);
            
            const response = await this.apiClient.get(`/api/attendance/student/${encodeURIComponent(query)}`);
            
            console.log('🔍 Resposta da API:', response);
            console.log('🔍 Resposta da API (JSON):', JSON.stringify(response, null, 2));
            console.log('🔍 response.data:', response.data);
            console.log('🔍 response.data (JSON):', JSON.stringify(response.data, null, 2));
            
            if (response.success && response.data) {
                console.log('📊 Dados do aluno:', response.data);
                this.currentStudent = response.data;
                console.log('👤 Current student:', this.currentStudent);
                console.log('👤 Current student (JSON):', JSON.stringify(this.currentStudent, null, 2));
                console.log('🆔 Current student ID:', this.currentStudent.id);
                await this.showStudentDashboard();
            } else {
                this.showError('Aluno não encontrado');
            }
            
        } catch (error) {
            console.error('Erro ao buscar aluno:', error);
            this.showError('Erro ao buscar aluno. Verifique os dados e tente novamente.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Search students (multiple results) - Local cache for speed
     */
    async searchStudents(query) {
        if (!query || query.length < 1) {
            this.hideSearchResults();
            return;
        }

        // Use local cache for instant search if available
        if (this.cacheLoaded && this.studentsCache.length > 0) {
            this.searchStudentsLocal(query);
        } else {
            // Fallback to API search
            this.searchStudentsAPI(query);
        }
    }

    /**
     * Local cache search (instant)
     */
    searchStudentsLocal(query) {
        const searchTerm = query.toLowerCase().trim();
        
        const results = this.studentsCache.filter(student => {
            return student.searchString.includes(searchTerm);
        }).slice(0, 8); // Limitar a 8 resultados
        
        // Determine match type for each result
        const processedResults = results.map(student => ({
            ...student,
            matchType: student.registrationNumber.includes(searchTerm) ? 'registration' : 'name'
        }));
        
        this.showSearchResults(processedResults, query);
    }

    /**
     * API search (fallback)
     */
    async searchStudentsAPI(query) {
        try {
            console.log('🔍 Buscando alunos via API:', query);
            
            const response = await this.apiClient.get(`/api/attendance/students/search/${encodeURIComponent(query)}?limit=8`);
            
            if (response.success && response.data) {
                this.showSearchResults(response.data, query);
            } else {
                this.hideSearchResults();
            }
            
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            this.hideSearchResults();
        }
    }

    /**
     * Show search results
     */
    showSearchResults(students, query) {
        const container = this.elements.searchResults;
        
        if (!students || students.length === 0) {
            container.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum resultado</h3>
                    <p>Não encontramos alunos com "${query}"</p>
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        container.innerHTML = `
            <div class="search-results-header">
                ${students.length} aluno(s) encontrado(s)
            </div>
            ${students.map(student => `
                <div class="search-result-item" onclick="window.checkinKiosk.selectStudent('${student.id}', '${student.registrationNumber}')">
                    <div class="search-result-avatar">
                        ${student.avatar ? 
                            `<img src="${student.avatar}" alt="${student.name}">` : 
                            `<div class="default-avatar">${student.name.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-name">${student.name}</div>
                        <div class="search-result-details">
                            <span>📧 ${student.email}</span>
                            <span>🎓 ${student.graduationLevel || 'Iniciante'}</span>
                            <span>🆔 ${student.registrationNumber}</span>
                        </div>
                    </div>
                    <div class="search-result-match ${student.matchType}">
                        ${student.matchType === 'registration' ? '🆔 Matrícula' : '👤 Nome'}
                    </div>
                </div>
            `).join('')}
        `;
        
        container.style.display = 'block';
    }

    /**
     * Hide search results
     */
    hideSearchResults() {
        this.elements.searchResults.style.display = 'none';
    }

    /**
     * Select student from search results
     */
    async selectStudent(studentId, registrationNumber) {
        this.elements.registrationInput.value = registrationNumber;
        this.hideSearchResults();
        await this.lookupStudent();
    }

    /**
     * Show student dashboard
     */
    async showStudentDashboard() {
        try {
            // Load dashboard data
            await this.loadDashboardData();
            
            // Update student info
            this.updateStudentInfo();
            
            // Switch to dashboard stage
            this.switchStage('dashboard');
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showError('Erro ao carregar informações do aluno');
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        const [dashboardResponse, classesResponse] = await Promise.all([
            this.apiClient.get(`/api/attendance/dashboard/${this.currentStudent.id}`),
            this.apiClient.get(`/api/attendance/classes/available?studentId=${this.currentStudent.id}`)
        ]);

        if (!dashboardResponse.success) {
            throw new Error('Erro ao carregar dashboard');
        }

        if (!classesResponse.success) {
            throw new Error('Erro ao carregar aulas');
        }

        this.currentStudent.dashboard = dashboardResponse.data;
        this.availableClasses = classesResponse.data;
        
        console.log('📊 Dashboard data loaded:', this.currentStudent.dashboard);
        console.log('📅 Available classes:', this.availableClasses);
    }

    /**
     * Update student info display
     */
    updateStudentInfo() {
        const { user, registrationNumber, graduationLevel, dashboard } = this.currentStudent;
        
        // Basic info
        this.elements.studentName.textContent = `${user.firstName} ${user.lastName}`;
        this.elements.studentRegistration.textContent = `Matrícula: ${registrationNumber}`;
        this.elements.studentLevel.textContent = `Faixa: ${graduationLevel || 'Iniciante'}`;
        
        // Avatar
        if (user.avatar) {
            this.elements.studentAvatar.src = user.avatar;
        }
        
        // Stats
        this.elements.attendanceRate.textContent = `${dashboard.stats.attendanceRate}%`;
        this.elements.classesMonth.textContent = dashboard.stats.attendanceThisMonth;
        this.elements.graduationLevel.textContent = graduationLevel || 'Iniciante';
        
        // Available classes
        this.renderAvailableClasses();
        
        // Recent activity
        this.renderRecentActivity();
    }

    /**
     * Render available classes
     */
    renderAvailableClasses() {
        const container = this.elements.availableClasses;
        
        if (!this.availableClasses || this.availableClasses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Nenhuma aula disponível</h3>
                    <p>Não há aulas disponíveis para check-in no momento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.availableClasses.map(classInfo => {
            const statusText = {
                'AVAILABLE': 'Disponível',
                'CHECKED_IN': 'Check-in Feito',
                'NOT_YET': 'Ainda não disponível',
                'EXPIRED': 'Expirado'
            };

            const statusClass = classInfo.status.toLowerCase();
            
            return `
                <div class="class-card ${statusClass}">
                    <div class="class-status ${statusClass}">
                        ${statusText[classInfo.status]}
                    </div>
                    <div class="class-name">${classInfo.name}</div>
                    <div class="class-meta">
                        <span><i class="fas fa-clock"></i> ${this.formatTime(classInfo.startTime)} - ${this.formatTime(classInfo.endTime)}</span>
                        <span><i class="fas fa-user"></i> ${classInfo.instructor?.name || 'Instrutor não definido'}</span>
                        <span><i class="fas fa-users"></i> ${classInfo.enrolled}/${classInfo.capacity} alunos</span>
                    </div>
                    ${classInfo.canCheckIn ? `
                        <button class="checkin-btn" onclick="window.checkinKiosk.requestCheckin('${classInfo.id}')">
                            <i class="fas fa-check"></i> Fazer Check-in
                        </button>
                    ` : `
                        <button class="checkin-btn" disabled>
                            ${classInfo.hasCheckedIn ? 'Check-in Realizado' : 'Não Disponível'}
                        </button>
                    `}
                </div>
            `;
        }).join('');
    }

    /**
     * Render recent activity
     */
    renderRecentActivity() {
        const container = this.elements.recentActivity;
        const recentAttendances = this.currentStudent.dashboard.recentAttendances;
        
        if (!recentAttendances || recentAttendances.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>Nenhuma atividade recente</h3>
                    <p>Suas últimas presenças aparecerão aqui</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentAttendances.map(attendance => `
            <div class="activity-item">
                <div class="activity-details">
                    <h4>${attendance.className}</h4>
                    <p>${this.formatDate(attendance.date)} às ${this.formatTime(attendance.checkInTime)}</p>
                </div>
                <div class="activity-status">${attendance.status}</div>
            </div>
        `).join('');
    }

    /**
     * Request check-in for class
     */
    requestCheckin(classId) {
        const classInfo = this.availableClasses.find(c => c.id === classId);
        
        if (!classInfo || !classInfo.canCheckIn) {
            this.showError('Check-in não disponível para esta aula');
            return;
        }

        // Show confirmation modal
        this.elements.confirmClassName.textContent = classInfo.name;
        this.elements.confirmClassTime.textContent = `${this.formatTime(classInfo.startTime)} - ${this.formatTime(classInfo.endTime)}`;
        this.elements.confirmInstructor.textContent = classInfo.instructor?.name || 'Instrutor não definido';
        
        this.currentCheckinClass = classInfo;
        this.showModal('confirmation');
    }

    /**
     * Perform actual check-in
     */
    async performCheckin() {
        if (!this.currentCheckinClass) return;

        this.setLoading(true);
        this.hideModal('confirmation');

        try {
            const checkinData = {
                classId: this.currentCheckinClass.id,
                method: 'MANUAL',
                location: 'KIOSK',
                notes: 'Check-in via kiosk'
            };

            const response = await this.apiClient.post('/api/attendance/checkin', checkinData);

            if (response.success) {
                // Show success modal
                this.elements.successClassName.textContent = this.currentCheckinClass.name;
                this.elements.successTime.textContent = new Date().toLocaleTimeString('pt-BR');
                
                this.showModal('success');
                
                console.log('✅ Check-in realizado com sucesso:', response.data);
            } else {
                this.showError(response.message || 'Erro ao realizar check-in');
            }

        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            this.showError('Erro ao realizar check-in. Tente novamente.');
        } finally {
            this.setLoading(false);
            this.currentCheckinClass = null;
        }
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        try {
            await this.loadDashboardData();
            this.updateStudentInfo();
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
        }
    }

    /**
     * Logout and return to lookup
     */
    logout() {
        this.currentStudent = null;
        this.availableClasses = [];
        this.currentCheckinClass = null;
        
        // Clear form
        this.elements.registrationInput.value = '';
        this.elements.lookupBtn.disabled = true;
        this.hideError();
        this.hideSearchResults();
        
        // Switch to lookup stage
        this.switchStage('lookup');
        
        // Focus on input
        setTimeout(() => {
            this.elements.registrationInput.focus();
        }, 300);
    }

    /**
     * Switch between stages
     */
    switchStage(stage) {
        // Hide all stages
        this.elements.lookupStage.classList.remove('active');
        this.elements.dashboardStage.classList.remove('active');
        
        // Show target stage
        if (stage === 'lookup') {
            this.elements.lookupStage.classList.add('active');
        } else if (stage === 'dashboard') {
            this.elements.dashboardStage.classList.add('active');
        }
    }

    /**
     * Show modal
     */
    showModal(type) {
        if (type === 'confirmation') {
            this.elements.confirmationModal.style.display = 'flex';
        } else if (type === 'success') {
            this.elements.successModal.style.display = 'flex';
        }
    }

    /**
     * Hide modal
     */
    hideModal(type) {
        if (type === 'confirmation') {
            this.elements.confirmationModal.style.display = 'none';
        } else if (type === 'success') {
            this.elements.successModal.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.lookupError.textContent = message;
        this.elements.lookupError.style.display = 'block';
    }

    /**
     * Hide error message
     */
    hideError() {
        this.elements.lookupError.style.display = 'none';
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.elements.lookupBtn.disabled = true;
            this.elements.lookupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        } else {
            const value = this.elements.registrationInput.value.trim();
            this.elements.lookupBtn.disabled = value.length < 2;
            this.elements.lookupBtn.innerHTML = '<i class="fas fa-search"></i> Buscar Aluno';
        }
    }

    /**
     * Format time
     */
    formatTime(timeString) {
        if (!timeString) return '';
        
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return timeString;
        }
    }

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.checkinKiosk = new CheckinKiosk();
    await window.checkinKiosk.init();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.checkinKiosk) {
        window.checkinKiosk.showError('Erro inesperado. Recarregue a página.');
    }
});

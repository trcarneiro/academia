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
     * Enhanced: Animate attendance progress bar
     */
    animateProgressBar(percentage) {
        const progressFill = document.getElementById('attendance-progress-fill');
        if (progressFill) {
            // Delay to allow DOM to render
            setTimeout(() => {
                progressFill.style.width = `${Math.min(percentage, 100)}%`;
            }, 100);
        }
    }

    /**
     * Enhanced: Render AI recommendations
     */
    renderAIRecommendations() {
        const container = document.getElementById('ai-recommendations');
        if (!container || !this.currentStudent) return;

        const recommendations = this.generateRecommendations();
        
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card ${rec.priority}-priority">
                <div class="recommendation-header">
                    <div class="recommendation-icon">
                        <i class="${rec.icon}"></i>
                    </div>
                    <div class="recommendation-content">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Staggered animation for cards
        const cards = container.querySelectorAll('.recommendation-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    /**
     * Enhanced: Generate smart recommendations based on student data
     */
    generateRecommendations() {
        if (!this.currentStudent?.dashboard) return [];

        const dashboard = this.currentStudent.dashboard;
        const stats = dashboard.stats || {};
        const plan = dashboard.plan;
        const recommendations = [];

        // Attendance-based recommendations
        const attendanceRate = stats.attendanceRate || 0;
        
        if (attendanceRate < 70) {
            recommendations.push({
                priority: 'high',
                title: 'Melhore sua Frequência',
                description: `Sua frequência está em ${attendanceRate}%. Tente manter pelo menos 80% para melhor progresso!`,
                icon: 'fas fa-calendar-exclamation'
            });
        } else if (attendanceRate >= 90) {
            recommendations.push({
                priority: 'normal',
                title: 'Excelente Frequência!',
                description: `Parabéns! Sua frequência de ${attendanceRate}% é exemplar. Continue assim!`,
                icon: 'fas fa-trophy'
            });
        }

        // Plan-based recommendations
        if (plan) {
            const planEndDate = plan.endDate ? new Date(plan.endDate) : null;
            const today = new Date();
            const daysUntilExpiry = planEndDate ? Math.ceil((planEndDate - today) / (1000 * 60 * 60 * 24)) : null;

            if (daysUntilExpiry && daysUntilExpiry <= 7) {
                recommendations.push({
                    priority: 'high',
                    title: 'Plano Vencendo',
                    description: `Seu plano vence em ${daysUntilExpiry} dias. Renove para não perder o acesso às aulas!`,
                    icon: 'fas fa-exclamation-triangle'
                });
            } else if (daysUntilExpiry && daysUntilExpiry <= 30) {
                recommendations.push({
                    priority: 'normal',
                    title: 'Renovação Próxima',
                    description: `Seu plano vence em ${daysUntilExpiry} dias. Considere renovar com desconto antecipado!`,
                    icon: 'fas fa-calendar-check'
                });
            }
        } else {
            recommendations.push({
                priority: 'high',
                title: 'Ativar Plano',
                description: 'Você não possui um plano ativo. Adquira um plano para participar das aulas!',
                icon: 'fas fa-credit-card'
            });
        }

        // Progress-based recommendations
        const classesThisMonth = stats.attendanceThisMonth || 0;
        if (classesThisMonth === 0) {
            recommendations.push({
                priority: 'high',
                title: 'Primeira Aula do Mês',
                description: 'Que tal começar o mês com força total? Faça sua primeira aula hoje!',
                icon: 'fas fa-play-circle'
            });
        } else if (classesThisMonth >= 12) {
            recommendations.push({
                priority: 'low',
                title: 'Guerreiro Incansável!',
                description: `${classesThisMonth} aulas este mês! Considere um dia de descanso para recuperação.`,
                icon: 'fas fa-bed'
            });
        }

        // Generic recommendations if none generated
        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'normal',
                title: 'Continue Praticando!',
                description: 'Você está indo bem! Mantenha a consistência nos treinos para evoluir sempre.',
                icon: 'fas fa-fist-raised'
            });
        }

        // Limit to 3 recommendations maximum
        return recommendations.slice(0, 3);
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
            studentPlan: document.getElementById('student-plan'),
            studentPlanValidity: document.getElementById('student-plan-validity'),
            studentCourse: document.getElementById('student-course'),
            studentTurma: document.getElementById('student-turma'),
            
            // Stats
            attendanceRate: document.getElementById('attendance-rate'),
            classesMonth: document.getElementById('classes-month'),
            graduationLevel: document.getElementById('graduation-level'),
            
            // Classes and activity
            availableClasses: document.getElementById('available-classes'),
            upcomingClasses: document.getElementById('upcoming-classes'),
            recentActivity: document.getElementById('recent-activity'),
            // Payments
            paymentsOverdueCount: document.getElementById('payments-overdue-count'),
            paymentsOverdueAmount: document.getElementById('payments-overdue-amount'),
            paymentsLast: document.getElementById('payments-last'),
            paymentsNextDue: document.getElementById('payments-next-due'),
            
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
        if (this.clockInterval) clearInterval(this.clockInterval);

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
            
            if (this.elements.currentTime) {
                this.elements.currentTime.textContent = `${timeString} - ${dateString}`;
            }
        };

        updateClock();
        this.clockInterval = setInterval(updateClock, 1000);
    }

    /**
     * Destroy instance and cleanup
     */
    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        this.initialized = false;
        console.log('🛑 Check-in Kiosk destroyed');
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
    async lookupStudent(overrideQuery = null) {
        const query = overrideQuery || this.elements.registrationInput.value.trim();
        
        if (!query || query.length < 1) {
            this.showError('Digite pelo menos 1 caractere');
            return;
        }

        this.setLoading(true);
        this.hideError();
        this.hideSearchResults();

        try {
            console.log('🔍 Buscando aluno:', query);
            
            // Check if query is a UUID (student ID) or a registration number
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
            const endpoint = isUUID ? `/api/attendance/student/id/${query}` : `/api/attendance/student/${encodeURIComponent(query)}`;
            
            const response = await this.apiClient.get(endpoint);
            
            console.log('🔍 Resposta da API:', response);
            console.log('🔍 Resposta da API (JSON):', JSON.stringify(response, null, 2));
            
            // The actual student data is nested inside the 'data' property of the response
            const studentData = response.data;
            console.log('🔍 Extracted student data:', studentData);

            if (response.success && studentData && Object.keys(studentData).length > 0) {
                console.log('📊 Dados do aluno:', studentData);
                this.currentStudent = studentData;
                console.log('👤 Current student:', this.currentStudent);
                console.log('🆔 Current student ID:', this.currentStudent.id);
                await this.showStudentDashboard();
            } else {
                this.showError('Aluno não encontrado ou dados inválidos recebidos.');
                console.error('Error: Invalid or empty student data received from API.', response);
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
            ${students.map(student => {
                // 🔥 FIX: Show enrollment status in search results
                const enrollmentStatus = student.hasActiveEnrollment 
                    ? `<span class="enrollment-badge enrolled">✅ Matriculado${student.enrollments?.[0] ? `: ${student.enrollments[0].courseName}` : ''}</span>`
                    : `<span class="enrollment-badge not-enrolled">❌ Sem matrícula</span>`;
                
                const planStatus = student.hasActivePlan
                    ? `<span class="plan-badge active">✅ Plano Ativo</span>`
                    : `<span class="plan-badge inactive">❌ Sem plano</span>`;
                
                return `
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
                            <span>🆔 ${student.registrationNumber}</span>
                            <span>📧 ${student.email}</span>
                        </div>
                        <div class="search-result-status">
                            ${enrollmentStatus}
                            ${planStatus}
                        </div>
                    </div>
                    <div class="search-result-match ${student.matchType}">
                        ${student.matchType === 'registration' ? '🆔 Matrícula' : '👤 Nome'}
                    </div>
                </div>
                `;
            }).join('')}
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
        // Use student ID for lookup instead of registration number when it's N/A
        const lookupValue = (registrationNumber === 'N/A') ? studentId : registrationNumber;
        this.elements.registrationInput.value = registrationNumber;
        this.hideSearchResults();
        await this.lookupStudent(lookupValue);
    }

    /**
     * Show student dashboard
     */
    async showStudentDashboard() {
        try {
            // Load dashboard data
            await this.loadDashboardData();
            
            // Check if enhanced dashboard is available
            if (typeof EnhancedKioskDashboard !== 'undefined') {
                // Use enhanced dashboard
                await this.showEnhancedDashboard();
            } else {
                // Fallback to original dashboard
                this.updateStudentInfo();
                this.switchStage('dashboard');
            }
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            this.showError('Erro ao carregar informações do aluno');
        }
    }

    /**
     * Show enhanced dashboard
     */
    async showEnhancedDashboard() {
        try {
            const enhancedDashboard = new EnhancedKioskDashboard();
            
            // Prepare enhanced data structure
            const enhancedData = {
                // Student basic info
                id: this.currentStudent.id,
                name: this.currentStudent.name || 
                      [this.currentStudent.firstName, this.currentStudent.lastName].filter(Boolean).join(' '),
                registrationNumber: this.currentStudent.registrationNumber,
                graduationLevel: this.currentStudent.graduationLevel || 'Iniciante',
                avatar: this.currentStudent.avatar,
                
                // Dashboard data
                dashboard: this.currentStudent.dashboard,
                
                // Available classes for check-in
                availableClasses: this.availableClasses || [],
                
                // API client for dynamic operations
                apiClient: this.apiClient
            };
            
            // Get dashboard container
            const dashboardContainer = document.querySelector('.kiosk-stage[data-stage="dashboard"] .dashboard-content');
            if (dashboardContainer) {
                // Render enhanced dashboard
                dashboardContainer.innerHTML = enhancedDashboard.renderEnhancedDashboard(enhancedData);
                
                // Initialize enhanced dashboard interactions
                enhancedDashboard.initializeInteractions();
            }
            
            // Switch to dashboard stage
            this.switchStage('dashboard');
            
        } catch (error) {
            console.error('Erro ao renderizar dashboard avançado:', error);
            // Fallback to original dashboard
            this.updateStudentInfo();
            this.switchStage('dashboard');
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
        const s = this.currentStudent || {};
        const dashboard = s.dashboard || {};
    const studentDash = dashboard.student || {};
    const plan = dashboard.plan || null;
    const currentCourse = dashboard.currentCourse || null;
    const currentTurma = dashboard.currentTurma || null;
    const payments = dashboard.payments || null;

        // Compute display fields with safe fallbacks
        const displayName = s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || studentDash.name || 'Aluno';
        const registrationNumber = s.registrationNumber ?? studentDash.registrationNumber ?? 'N/A';
        const graduationLevel = s.graduationLevel || studentDash.graduationLevel || 'Iniciante';
        const avatar = s.avatar || studentDash.avatar || null;
        const stats = dashboard.stats || { attendanceRate: 0, totalClassesThisMonth: 0, attendanceThisMonth: 0 };

        // Basic info
        this.elements.studentName.textContent = displayName;
        this.elements.studentRegistration.textContent = `Matrícula: ${registrationNumber}`;
        this.elements.studentLevel.textContent = `Faixa: ${graduationLevel}`;

        // Avatar
        if (avatar) {
            this.elements.studentAvatar.src = avatar;
        }

        // Stats
        this.elements.attendanceRate.textContent = `${stats.attendanceRate ?? 0}%`;
        this.elements.classesMonth.textContent = stats.attendanceThisMonth ?? 0;
        this.elements.graduationLevel.textContent = graduationLevel;

        // Plan and course info
        if (this.elements.studentPlan) {
            const planStatus = plan?.isActive ? '✅ Ativo' : '❌ Inativo';
            const planName = plan?.name || 'Sem plano';
            this.elements.studentPlan.textContent = `Plano: ${planName} ${planStatus}`;
            
            // Adicionar classe CSS baseada no status
            if (plan?.isActive) {
                this.elements.studentPlan.classList.add('plan-active');
                this.elements.studentPlan.classList.remove('plan-inactive');
            } else {
                this.elements.studentPlan.classList.add('plan-inactive');
                this.elements.studentPlan.classList.remove('plan-active');
            }
        }
        if (this.elements.studentPlanValidity) {
            if (!plan) {
                this.elements.studentPlanValidity.textContent = `Validade: Sem plano ativo`;
                this.elements.studentPlanValidity.classList.add('plan-warning');
            } else {
                const start = plan.startDate ? new Date(plan.startDate).toLocaleDateString('pt-BR') : '-';
                const end = plan.endDate ? new Date(plan.endDate).toLocaleDateString('pt-BR') : 'Indeterminado';
                const daysLeft = plan.endDate ? Math.ceil((new Date(plan.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                
                let validityText = `Validade: ${start} até ${end}`;
                if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0) {
                    validityText += ` ⚠️ (${daysLeft} dias restantes)`;
                    this.elements.studentPlanValidity.classList.add('plan-expiring');
                } else if (daysLeft !== null && daysLeft <= 0) {
                    validityText = `❌ Plano expirado em ${end}`;
                    this.elements.studentPlanValidity.classList.add('plan-expired');
                }
                
                this.elements.studentPlanValidity.textContent = validityText;
            }
        }
                if (this.elements.studentCourse) {
                        const fallbackCourse = (dashboard.enrollments && dashboard.enrollments.length > 0)
                            ? dashboard.enrollments[0].course
                            : null;
                        const courseName = currentCourse?.name || fallbackCourse?.name || null;
                        
                        if (courseName) {
                            this.elements.studentCourse.textContent = `Curso: ${courseName}`;
                            this.elements.studentCourse.classList.remove('no-course');
                        } else {
                            this.elements.studentCourse.textContent = `Curso: Nenhum curso matriculado`;
                            this.elements.studentCourse.classList.add('no-course');
                            
                            // Mostrar dica útil
                            if (plan?.features?.courseIds && plan.features.courseIds.length > 0) {
                                this.showEnrollmentHint(plan.features.courseIds);
                            }
                        }
                }
                if (this.elements.studentTurma) {
                        this.elements.studentTurma.textContent = `Turma: ${currentTurma?.name || 'Não matriculado em turma'}`;
                }
        
        // Available classes
        this.renderAvailableClasses();
        
        // Recent activity
        this.renderRecentActivity();

    // Upcoming classes
    this.renderUpcomingClasses();

    // Payments summary
    this.renderPaymentsSummary(payments);
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

        // Group classes by status for better UX
        const grouped = {
            AVAILABLE: this.availableClasses.filter(c => c.status === 'AVAILABLE'),
            CHECKED_IN: this.availableClasses.filter(c => c.status === 'CHECKED_IN'),
            NOT_YET: this.availableClasses.filter(c => c.status === 'NOT_YET'),
            EXPIRED: this.availableClasses.filter(c => c.status === 'EXPIRED')
        };

        const statusConfig = {
            'AVAILABLE': { 
                title: '✅ Disponíveis Agora', 
                subtitle: 'Você pode fazer check-in nestas aulas',
                icon: 'fa-check-circle',
                color: '#10b981',
                defaultOpen: true
            },
            'CHECKED_IN': { 
                title: '✓ Check-ins Realizados', 
                subtitle: 'Você já fez check-in hoje',
                icon: 'fa-calendar-check',
                color: '#3b82f6',
                defaultOpen: true
            },
            'NOT_YET': { 
                title: '⏰ Próximas Aulas', 
                subtitle: 'Check-in ainda não liberado',
                icon: 'fa-clock',
                color: '#f59e0b',
                defaultOpen: false
            },
            'EXPIRED': { 
                title: '⌛ Aulas Encerradas', 
                subtitle: 'Período de check-in expirado',
                icon: 'fa-history',
                color: '#ef4444',
                defaultOpen: false
            }
        };

        let html = '';

        // Render each group
        for (const [status, classes] of Object.entries(grouped)) {
            if (classes.length === 0) continue;

            const config = statusConfig[status];
            const sectionId = `section-${status.toLowerCase()}`;
            const isOpen = config.defaultOpen;

            html += `
                <div class="class-group" data-status="${status}">
                    <div class="class-group-header ${isOpen ? 'open' : ''}" onclick="window.checkinKiosk.toggleGroup('${sectionId}')">
                        <div class="group-title">
                            <i class="fas ${config.icon}" style="color: ${config.color}"></i>
                            <div>
                                <h3>${config.title}</h3>
                                <p>${config.subtitle} (${classes.length})</p>
                            </div>
                        </div>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </div>
                    <div class="class-group-content ${isOpen ? 'open' : ''}" id="${sectionId}">
                        ${classes.map(classInfo => this.renderClassCard(classInfo)).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
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
     * Render upcoming classes from dashboard
     */
    renderUpcomingClasses() {
        const container = this.elements.upcomingClasses;
        const upcoming = this.currentStudent.dashboard?.upcomingClasses || [];

        if (!container) return;

        if (!upcoming || upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>Nenhuma aula futura</h3>
                    <p>Próximas aulas aparecerão aqui</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcoming.map(cls => `
            <div class="class-card not_yet">
                <div class="class-status not_yet">Agendada</div>
                <div class="class-name">${cls.name}</div>
                <div class="class-meta">
                    <span><i class="fas fa-calendar-day"></i> ${this.formatDate(cls.date)}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatTime(cls.startTime)}</span>
                    <span><i class="fas fa-user"></i> ${cls.instructor || 'Instrutor não definido'}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render payments summary
     */
    renderPaymentsSummary(payments) {
        if (!payments) return;
        const fmtBRL = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (this.elements.paymentsOverdueCount) {
            this.elements.paymentsOverdueCount.textContent = payments.overdueCount ?? 0;
        }
        if (this.elements.paymentsOverdueAmount) {
            this.elements.paymentsOverdueAmount.textContent = fmtBRL(payments.overdueAmount);
        }
        if (this.elements.paymentsLast) {
            const lp = payments.lastPayment;
            this.elements.paymentsLast.textContent = lp ? `${fmtBRL(lp.amount)} em ${this.formatDate(lp.paidDate)}` : '—';
        }
        if (this.elements.paymentsNextDue) {
            this.elements.paymentsNextDue.textContent = payments.nextDueDate ? this.formatDate(payments.nextDueDate) : '—';
        }
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
        if (!this.currentStudent?.id) {
            this.showError('Estudante não selecionado');
            return;
        }

        this.setLoading(true);
        this.hideModal('confirmation');

        try {
            const checkinData = {
                classId: this.currentCheckinClass.id,
                studentId: this.currentStudent.id, // ✅ KIOSK: enviar studentId
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
     * Show enrollment hint when student has no courses
     */
    showEnrollmentHint(availableCourseIds) {
        const container = this.elements.aiRecommendations;
        if (!container) return;
        
        container.innerHTML = `
            <div class="recommendation-card enrollment-hint">
                <div class="recommendation-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="recommendation-content">
                    <h4>📚 Matricule-se em um curso!</h4>
                    <p>Seu plano inclui acesso a ${availableCourseIds.length} curso(s).</p>
                    <p><strong>Procure a recepção</strong> para se matricular e começar a treinar!</p>
                </div>
            </div>
        `;
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
     * Toggle class group collapse
     */
    toggleGroup(sectionId) {
        const section = document.getElementById(sectionId);
        const header = section.previousElementSibling;
        
        if (section.classList.contains('open')) {
            section.classList.remove('open');
            header.classList.remove('open');
        } else {
            section.classList.add('open');
            header.classList.add('open');
        }
    }

    /**
     * Render individual class card
     */
    renderClassCard(classInfo) {
        const statusText = {
            'AVAILABLE': '✅ Check-in Liberado',
            'CHECKED_IN': '✓ Check-in Feito',
            'NOT_YET': '⏰ Aguardando Liberação',
            'EXPIRED': '⌛ Período Encerrado'
        };

        const statusClass = classInfo.status.toLowerCase();
        
        // Calculate time remaining until check-in opens (for NOT_YET status)
        let timeInfo = '';
        if (classInfo.status === 'NOT_YET') {
            const startTime = new Date(classInfo.startTime);
            const checkInStart = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 min antes
            const now = new Date();
            const diffMs = checkInStart - now;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            
            if (diffHours > 0) {
                timeInfo = `<div class="time-remaining countdown">⏱️ Check-in abre em ${diffHours}h ${remainingMins}min</div>`;
            } else if (diffMins > 0) {
                timeInfo = `<div class="time-remaining countdown">⏱️ Check-in abre em ${diffMins} minutos</div>`;
            } else {
                timeInfo = `<div class="time-remaining countdown">⏱️ Check-in abrindo...</div>`;
            }
        } else if (classInfo.status === 'AVAILABLE') {
            const startTime = new Date(classInfo.startTime);
            const checkInEnd = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 min depois
            const now = new Date();
            const diffMs = checkInEnd - now;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins > 0) {
                timeInfo = `<div class="time-remaining countdown available">⏳ Janela fecha em ${diffMins} minutos</div>`;
            }
        }
        
        return `
            <div class="class-card ${statusClass}">
                <div class="class-status ${statusClass}">
                    ${statusText[classInfo.status]}
                </div>
                <div class="class-name">${classInfo.name}</div>
                ${timeInfo}
                <div class="class-meta">
                    <span><i class="fas fa-clock"></i> ${this.formatTime(classInfo.startTime)} - ${this.formatTime(classInfo.endTime)}</span>
                    <span><i class="fas fa-user"></i> ${classInfo.instructor?.name || 'Instrutor não definido'}</span>
                    <span><i class="fas fa-users"></i> ${classInfo.enrolled}/${classInfo.capacity} alunos</span>
                </div>
                ${classInfo.canCheckIn ? `
                    <button class="checkin-btn available-pulse" onclick="window.checkinKiosk.requestCheckin('${classInfo.id}')">
                        <i class="fas fa-check-circle"></i> FAZER CHECK-IN AGORA
                    </button>
                ` : `
                    <button class="checkin-btn" disabled>
                        ${classInfo.hasCheckedIn ? '✓ Check-in Realizado' : 
                          classInfo.status === 'NOT_YET' ? '🔒 Aguardando' : 
                          '⌛ Indisponível'}
                    </button>
                `}
            </div>
        `;
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
    // Cleanup previous instance if exists
    if (window.checkinKiosk && typeof window.checkinKiosk.destroy === 'function') {
        window.checkinKiosk.destroy();
    }
    
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

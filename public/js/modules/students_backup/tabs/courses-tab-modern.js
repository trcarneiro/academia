/**
 * Modern Courses Tab Component
 * Ultra-modern UX with smooth animations and real API integration
 */

export class CoursesTab {
    constructor(editorController) {
        this.controller = editorController;
    // Prefer ModuleAPIHelper; fall back to StudentsService.api
    this.api = editorController?.api || editorController?.service?.api || null;
        this.service = editorController?.service || null;
        this.currentStudentId = null;
        this.studentPlan = null;
        this.planCourses = [];
        this.enrollmentProgress = [];
        this.activeCourses = [];
        this.isLoading = false;
    }

    /**
     * Initialize modern courses tab
     */
    init(container, studentId) {
        console.log('🚀 Inicializando aba de Cursos com UX Ultra-Moderna (MODERN VERSION LOADED)...');
        console.log('📍 Student ID:', studentId);
        this.currentStudentId = studentId;
        this.render(container);
        this.loadData();
    }

    /**
     * Render ultra-modern courses tab UI
     */
    render(container) {
        container.innerHTML = `
            <div class="courses-tab-ultra-modern">
                <!-- Floating Header with Glassmorphism -->
                <div class="floating-header">
                    <div class="header-glass">
                        <div class="header-content">
                            <div class="animated-icon">
                                <div class="icon-glow">🎓</div>
                                <div class="icon-particles"></div>
                            </div>
                            <div class="header-text">
                                <h1 class="gradient-text">Cursos & Progressão</h1>
                                <p class="subtitle">Acompanhe sua jornada acadêmica</p>
                            </div>
                        </div>
                        
                        <!-- Course Activation Actions -->
                        <div class="course-actions">
                            <button class="btn-activate-courses" id="btn-activate-courses">
                                <span class="btn-icon">⚡</span>
                                <span class="btn-text">Ativar Cursos dos Planos</span>
                                <div class="btn-ripple"></div>
                            </button>
                            <button class="btn-refresh-courses" id="btn-refresh-courses">
                                <span class="btn-icon">🔄</span>
                                <span class="btn-text">Atualizar</span>
                            </button>
                        </div>
                        
                        <div class="floating-stats" id="floating-stats">
                            <div class="stat-bubble" data-stat="courses">
                                <div class="stat-icon">📚</div>
                                <div class="stat-content">
                                    <span class="stat-value loading-dots">--</span>
                                    <span class="stat-label">Cursos</span>
                                </div>
                            </div>
                            <div class="stat-bubble" data-stat="progress">
                                <div class="stat-icon">📈</div>
                                <div class="stat-content">
                                    <span class="stat-value loading-dots">--%</span>
                                    <span class="stat-label">Progresso</span>
                                </div>
                            </div>
                            <div class="stat-bubble" data-stat="completed">
                                <div class="stat-icon">✅</div>
                                <div class="stat-content">
                                    <span class="stat-value loading-dots">--</span>
                                    <span class="stat-label">Completos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Plan Card with 3D Effects -->
                <div class="plan-card-3d" id="plan-card">
                    <div class="plan-loading-state">
                        <div class="holographic-loader">
                            <div class="loader-rings"></div>
                            <div class="loader-text">Carregando plano...</div>
                        </div>
                    </div>
                </div>

                <!-- Modern Courses Section -->
                <div class="courses-modern-section">
                    <div class="section-header-floating">
                        <div class="section-title">
                            <h2>📚 Biblioteca de Cursos</h2>
                            <div class="title-underline"></div>
                        </div>
                        <div class="view-controls">
                            <div class="segmented-controls" id="courses-segment">
                                <button class="seg-btn active" data-seg="active">Ativos <span class="chip" id="count-active">0</span></button>
                                <button class="seg-btn" data-seg="available">Disponíveis <span class="chip" id="count-available">0</span></button>
                                <button class="seg-btn" data-seg="completed">Concluídos <span class="chip" id="count-completed">0</span></button>
                            </div>
                            <div class="control-group">
                                <button class="view-btn-modern active" data-view="cards">
                                    <svg class="btn-icon" viewBox="0 0 24 24">
                                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zm-10 10h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                                    </svg>
                                    <span>Cards</span>
                                </button>
                                <button class="view-btn-modern" data-view="timeline">
                                    <svg class="btn-icon" viewBox="0 0 24 24">
                                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                                    </svg>
                                    <span>Timeline</span>
                                </button>
                            </div>
                            <div class="filter-controls">
                                <select class="modern-select" id="course-filter">
                                    <option value="active" selected>Ativos</option>
                                    <option value="available">Disponíveis do Plano</option>
                                    <option value="completed">Concluídos</option>
                                    <option value="all">Todos</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Loading State -->
                    <div class="advanced-loading" id="courses-loading">
                        <div class="loading-grid">
                            <div class="course-skeleton-3d"></div>
                            <div class="course-skeleton-3d"></div>
                            <div class="course-skeleton-3d"></div>
                        </div>
                        <div class="loading-progress">
                            <div class="progress-bar-modern">
                                <div class="progress-fill"></div>
                            </div>
                            <span class="loading-text">Carregando seus cursos...</span>
                        </div>
                    </div>

                    <!-- Dynamic Courses Container -->
                    <div class="courses-dynamic-container" id="courses-container" style="display: none;">
                        <!-- Courses will be dynamically loaded here -->
                    </div>

                    <!-- Ultra-Modern Empty State -->
                    <div class="empty-state-ultra" id="empty-state" style="display: none;">
                        <div class="empty-animation-3d">
                            <div class="floating-elements">
                                <div class="float-element">📚</div>
                                <div class="float-element">🎯</div>
                                <div class="float-element">🚀</div>
                            </div>
                            <div class="empty-waves-3d">
                                <div class="wave-3d"></div>
                                <div class="wave-3d"></div>
                                <div class="wave-3d"></div>
                            </div>
                        </div>
                        <div class="empty-content">
                            <h3 class="empty-title">Nenhum curso disponível</h3>
                            <p class="empty-subtitle">Ative um plano para acessar nossa biblioteca de cursos</p>
                                <button class="cta-button-3d" data-action="open-financial">
                                <span class="btn-bg"></span>
                                <span class="btn-content">
                                    <span class="btn-icon">💎</span>
                                    <span class="btn-text">Explorar Planos</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Interactive Progress Dashboard -->
                <div class="progress-dashboard-3d" id="progress-dashboard" style="display: none;">
                    <div class="dashboard-header-glass">
                        <div class="dashboard-title">
                            <h3>📊 Analytics & Progresso</h3>
                            <div class="title-sparkles"></div>
                        </div>
                        <div class="dashboard-actions">
                            <button class="action-btn-3d" data-action="export-progress">
                                <span class="btn-shine"></span>
                                <svg class="action-icon" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                <span>Exportar</span>
                            </button>
                            <button class="action-btn-3d" data-action="share-progress">
                                <span class="btn-shine"></span>
                                <svg class="action-icon" viewBox="0 0 24 24">
                                    <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.6 20.92,19A2.92,2.92 0 0,0 18,16.08Z"/>
                                </svg>
                                <span>Compartilhar</span>
                            </button>
                        </div>
                    </div>
                    <div class="dashboard-content" id="progress-content">
                        <!-- Progress analytics will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.attachModernEventListeners();
        
        // Execute pending configurations after DOM is ready
        if (this.pendingCoursesOnlyConfig) {
            console.log('🎯 Executing pending showCoursesOnly configuration');
            this.pendingCoursesOnlyConfig = false;
            this.showCoursesOnly();
        }
    }

    /**
     * Attach ultra-modern event listeners
     */
    attachModernEventListeners() {
        const container = document.querySelector('.courses-tab-ultra-modern');
        if (!container) return;

        // Activate courses button
        const activateBtn = container.querySelector('#btn-activate-courses');
        if (activateBtn) {
            activateBtn.addEventListener('click', () => {
                this.activateStudentCourses();
            });
        }

        // Refresh courses button
        const refreshBtn = container.querySelector('#btn-refresh-courses');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadActiveCourses();
            });
        }

        // View control buttons with smooth transitions
        const viewButtons = container.querySelectorAll('.view-btn-modern');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
                
                // Update active state with animation
                viewButtons.forEach(b => {
                    b.classList.remove('active');
                    b.style.transform = 'scale(1)';
                });
                e.currentTarget.classList.add('active');
                e.currentTarget.style.transform = 'scale(1.05)';
            });
        });

        // Course filter with real-time updates
        const courseFilter = container.querySelector('#course-filter');
        if (courseFilter) {
            courseFilter.addEventListener('change', (e) => {
                this.filterCourses(e.target.value);
            });
        }

        // Segmented controls for quick context switching
        const seg = container.querySelector('#courses-segment');
        if (seg) {
            seg.addEventListener('click', (ev) => {
                const btn = ev.target.closest('button.seg-btn');
                if (!btn) return;
                seg.querySelectorAll('button.seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.seg;
                if (courseFilter) courseFilter.value = mode;
                this.filterCourses(mode);
            });
        }

        // Add advanced animations
        this.initializeAdvancedAnimations();

        // Delegated actions to ensure correct context
        container.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            const action = actionEl.getAttribute('data-action');
            switch (action) {
                case 'export-progress':
                    this.exportProgress();
                    break;
                case 'share-progress':
                    this.shareProgress();
                    break;
                case 'view-course': {
                    const cid = actionEl.getAttribute('data-course-id');
                    if (cid) this.viewCourseDetails(cid);
                    break;
                }
                case 'deactivate-course': {
                    const cid = actionEl.getAttribute('data-course-id');
                    if (cid) this.deactivateCourse(cid);
                    break;
                }
                case 'open-course': {
                    const cid = actionEl.getAttribute('data-course-id');
                    if (cid) this.openCourse(cid);
                    break;
                }
                case 'flip-back': {
                    // Find the card context and toggle flipped class
                    const card = actionEl.closest('.course-card-3d');
                    if (card) card.classList.toggle('flipped');
                    break;
                }
                case 'retry-load':
                    this.loadData();
                    break;
                case 'open-financial':
                    this.openFinancialTab();
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Open Financial tab safely
     */
    openFinancialTab() {
        try {
            if (typeof window.openFinancialTab === 'function') {
                window.openFinancialTab();
                return;
            }
            if (this.controller?.switchTab) {
                // Common tab id naming fallback
                this.controller.switchTab('financial');
                return;
            }
        } catch (e) {
            console.warn('openFinancialTab fallback failed', e);
        }
        console.log('Navigate to financial tab – handler not found');
    }

    /**
     * Activate student courses based on active subscriptions
     */
    async activateStudentCourses() {
        if (!this.currentStudentId) {
            console.error('No student ID available');
            return;
        }

        const activateBtn = document.querySelector('#btn-activate-courses');
        const originalText = activateBtn.querySelector('.btn-text').textContent;
        
        try {
            // Update button state
            activateBtn.disabled = true;
            activateBtn.querySelector('.btn-text').textContent = 'Ativando...';
            activateBtn.classList.add('loading');

            console.log(`🚀 Ativando cursos para o estudante ${this.currentStudentId}...`);

            const result = await (this.api?.api?.post ? this.api.api.post(`/api/students/${this.currentStudentId}/courses/activate`, {}) : this.api.post(`/api/students/${this.currentStudentId}/courses/activate`, {}));

            if (result?.success) {
                console.log('✅ Cursos ativados com sucesso:', result.data);
                
                // Show success notification
                this.showNotification('success', `${(result.data?.coursesActivated || []).length} cursos ativados com sucesso!`);
                
                // Reload active courses
                await this.loadActiveCourses();
                
                // Update stats
                this.updateStats();

            } else {
                throw new Error(result?.message || 'Erro ao ativar cursos');
            }

        } catch (error) {
            console.error('❌ Erro ao ativar cursos:', error);
            this.showNotification('error', 'Erro ao ativar cursos: ' + error.message);
            try { window.app?.handleError?.(error, 'Students:courses:activate'); } catch (_) {}
        } finally {
            // Restore button state
            activateBtn.disabled = false;
            activateBtn.querySelector('.btn-text').textContent = originalText;
            activateBtn.classList.remove('loading');
        }
    }

    /**
     * Load active courses for the student
     */
    async loadActiveCourses() {
        if (!this.currentStudentId) {
            console.error('No student ID available');
            return;
        }

        try {
            console.log(`📚 Carregando cursos ativos para o estudante ${this.currentStudentId}...`);

            const result = await (this.api?.api?.get ? this.api.api.get(`/api/students/${this.currentStudentId}/courses`) : this.api.get(`/api/students/${this.currentStudentId}/courses`));

            if (result?.success) {
                this.activeCourses = result.data || [];
                console.log('✅ Cursos ativos carregados:', this.activeCourses);
                this.updateCounts();
                
                // Retornar os dados para o Promise.allSettled
                return this.activeCourses;

            } else {
                throw new Error(result?.message || 'Erro ao carregar cursos');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar cursos ativos:', error);
            this.showNotification('error', 'Erro ao carregar cursos: ' + error.message);
            try { window.app?.handleError?.(error, 'Students:courses:list'); } catch (_) {}
        }
    }

    /**
     * Render active courses in the UI
     */
    renderActiveCourses() {
        const coursesContainer = document.querySelector('#courses-container');
        if (!coursesContainer) return;

        if (this.activeCourses.length === 0) {
            coursesContainer.innerHTML = `
                <div class="empty-state-modern">
                    <div class="empty-icon">📚</div>
                    <h3>Nenhum curso ativo</h3>
                    <p>Clique em "Ativar Cursos dos Planos" para ativar os cursos baseados nas subscriptions ativas.</p>
                </div>
            `;
            return;
        }

        const coursesHTML = this.activeCourses.map(courseData => `
            <div class="course-card-modern" data-course-id="${courseData.course.id}">
                <div class="course-header">
                    <div class="course-icon">🎓</div>
                    <div class="course-info">
                        <h3 class="course-name">${courseData.course.name}</h3>
                        <p class="course-description">${courseData.course.description || 'Curso de artes marciais'}</p>
                    </div>
                    <div class="course-status">
                        <span class="status-badge ${courseData.status.toLowerCase()}">${this.getStatusText(courseData.status)}</span>
                    </div>
                </div>
                
                <div class="course-details">
                    <div class="detail-item">
                        <span class="detail-label">Início:</span>
                        <span class="detail-value">${this.formatDate(courseData.startDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Turma:</span>
                        <span class="detail-value">${courseData.class.title || 'Sem título'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Categoria:</span>
                        <span class="detail-value">${courseData.course.category || 'Geral'}</span>
                    </div>
                </div>
                
                <div class="course-actions">
                    <button class="btn-course-action" data-action="view-course" data-course-id="${courseData.course.id}">
                        Ver Detalhes
                    </button>
                    <button class="btn-course-action danger" data-action="deactivate-course" data-course-id="${courseData.course.id}">
                        Desativar
                    </button>
                </div>
            </div>
        `).join('');

        coursesContainer.innerHTML = coursesHTML;
        coursesContainer.style.display = 'block';
    }

    /**
     * Update statistics in the floating stats
     */
    updateStats() {
        const statsContainer = document.querySelector('#floating-stats');
        if (!statsContainer) return;

        const coursesCount = this.activeCourses.length;
        const activeCount = this.activeCourses.filter(c => c.status === 'ACTIVE').length;

        // Update courses stat
        const coursesStat = statsContainer.querySelector('[data-stat="courses"] .stat-content');
        if (coursesStat) {
            coursesStat.innerHTML = `
                <div class="stat-number">${coursesCount}</div>
                <div class="stat-label">Cursos</div>
            `;
        }

        // You can add more stats here as needed
    }

    /**
     * Show notification to user
     */
    showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Get status text in Portuguese
     */
    getStatusText(status) {
        const statusMap = {
            'ACTIVE': 'Ativo',
            'COMPLETED': 'Concluído',
            'SUSPENDED': 'Suspenso',
            'DROPPED': 'Abandonado'
        };
        return statusMap[status] || status;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Switch between different view modes
     */
    switchView(view) {
        const container = document.getElementById('courses-container');
        if (!container) return;

        // Smooth transition out
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.className = `courses-${view}-view`;
            this.renderCoursesInView(view);
            
            // Smooth transition in
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 300);
    }

    /**
     * Initialize advanced animations and effects
     */
    initializeAdvancedAnimations() {
        // Floating header parallax effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.floating-header');
            if (header) {
                const scrollY = window.scrollY;
                header.style.transform = `translateY(${scrollY * 0.5}px)`;
            }
        });

        // Intersection observer for entrance animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    entry.target.style.animationDelay = `${Math.random() * 0.5}s`;
                }
            });
        }, { threshold: 0.1 });

        // Observe elements when they're created
        setTimeout(() => {
            document.querySelectorAll('.course-card-3d, .stat-bubble, .plan-card-3d').forEach(el => {
                observer.observe(el);
            });
        }, 100);
    }

    /**
     * Load data with advanced loading states
     */
    async loadData() {
        this.showAdvancedLoadingState();
        
        try {
            console.log('🚀 Carregando dados com UX ultra-moderna...');
            
            // Parallel loading for optimal performance
            const startTime = Date.now();
            const [planData, progressData, activeCoursesData] = await Promise.allSettled([
                this.loadStudentPlan(),
                this.loadEnrollmentProgress(),
                this.loadActiveCourses()
            ]);

            // Ensure minimum loading time for smooth UX
            const loadTime = Date.now() - startTime;
            const minLoadTime = 1000; // 1 second minimum
            if (loadTime < minLoadTime) {
                await new Promise(resolve => setTimeout(resolve, minLoadTime - loadTime));
            }

            const plan = planData.status === 'fulfilled' ? planData.value : null;
            const progress = progressData.status === 'fulfilled' ? progressData.value : [];
            const activeCourses = activeCoursesData.status === 'fulfilled' ? activeCoursesData.value : [];

            // Garantir que progress e activeCourses são arrays
            const safeProgress = Array.isArray(progress) ? progress : [];
            const safeActiveCourses = Array.isArray(activeCourses) ? activeCourses : [];

            console.log('📊 Dados carregados:', { plan, progress: safeProgress.length, activeCourses: safeActiveCourses.length });

            if (plan) {
                await this.loadPlanCourses();
                this.showProgressDashboard();
            } else if (safeActiveCourses && safeActiveCourses.length > 0) {
                // Se não há plano mas há cursos ativos, mostrar os cursos
                console.log('📚 Mostrando cursos ativos sem plano');
                this.showCoursesOnly();
            } else {
                this.showUltraModernEmptyState();
            }

            this.updateFloatingStats();
                this.updateFloatingStats();
                this.updateCounts();
                this.filterCourses('active');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showAdvancedErrorState();
        }
    }

    /**
     * Load data from bundle (called by editor-controller with complete student data)
     */
    async loadBundleData(studentBundle) {
        this.showAdvancedLoadingState();
        
        try {
            console.log('🚀 Carregando dados do bundle para courses tab...');
            console.log('📦 Bundle recebido:', studentBundle);
            
            // Extract student data from bundle
            this.currentStudentId = studentBundle.id;
            this.studentData = studentBundle;
            
            // Get courses from bundle if available
            const activeCourses = studentBundle.courses || [];
            this.activeCourses = activeCourses;
            console.log('📚 Cursos encontrados no bundle:', activeCourses.length, activeCourses);
            
            // Get subscriptions for plan checking
            const subscriptions = studentBundle.subscriptions || [];
            console.log('💰 Subscriptions encontradas:', subscriptions.length, subscriptions);
            
            // Process the data
            if (subscriptions.length > 0) {
                // Student has subscriptions, show courses interface
                console.log('📚 Estudante com subscriptions ativas, mostrando interface de cursos');
                this.showProgressDashboard();
                this.renderActiveCourses();
            } else if (activeCourses.length > 0) {
                // No subscriptions but has active courses
                console.log('📚 Mostrando cursos ativos sem plano');
                this.showCoursesOnly();
                this.renderActiveCourses();
            } else {
                // No subscriptions and no courses
                console.log('❌ Nenhum curso ou subscription encontrado, mostrando estado vazio');
                this.showUltraModernEmptyState();
            }
            
            this.updateFloatingStats();
            this.hideAdvancedLoadingState();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do bundle:', error);
            this.showAdvancedErrorState();
        }
    }

    /**
     * Show advanced loading state with progress
     */
    showAdvancedLoadingState() {
        this.isLoading = true;
        
        // Animate progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                progressFill.style.width = `${progress}%`;
            }, 200);
        }

        // Animate skeleton loaders
        const skeletons = document.querySelectorAll('.course-skeleton-3d');
        skeletons.forEach((skeleton, index) => {
            skeleton.style.animationDelay = `${index * 0.2}s`;
            skeleton.classList.add('skeleton-pulse');
        });

        // Animate stat bubbles
        const statBubbles = document.querySelectorAll('.stat-bubble');
        statBubbles.forEach(bubble => {
            bubble.classList.add('loading-shimmer');
        });
    }

    /**
     * Hide loading with spectacular entrance animation
     */
    hideAdvancedLoadingState() {
        this.isLoading = false;
        
        setTimeout(() => {
            // Fade out loading elements
            const loadingElement = document.getElementById('courses-loading');
            if (loadingElement) {
                loadingElement.style.opacity = '0';
                
                setTimeout(() => {
                    loadingElement.style.display = 'none';
                    const containerElement = document.getElementById('courses-container');
                    if (containerElement) {
                        containerElement.style.display = 'block';
                        
                        // Spectacular entrance animation
                        this.triggerEntranceAnimation();
                    }
                }, 500);
            }
        }, 300);
    }

    /**
     * Trigger spectacular entrance animation
     */
    triggerEntranceAnimation() {
        const elements = document.querySelectorAll('.course-card-3d');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('spectacular-entrance');
                el.style.animationDelay = `${index * 0.1}s`;
            }, index * 50);
        });
    }

    /**
     * Load student plan with enhanced error handling
     */
    async loadStudentPlan() {
        if (!this.currentStudentId) return null;

        try {
            console.log(`🔄 Carregando plano do aluno ${this.currentStudentId}...`);
            
            const client = this.api?.api || this.api; // ModuleAPIHelper.api or raw client
            const response = await client.get(`/api/students/${this.currentStudentId}/subscription`);
            this.studentPlan = response?.data ?? response;

            // Resolve plan info when backend returns only planId
            if (this.studentPlan && !this.studentPlan.billing_plan) {
                const planId = this.studentPlan.planId || this.studentPlan.plan_id || this.studentPlan.plan?.id;
                if (planId) {
                    try {
                        let plans = null;
                        if (this.controller?.dataService?.getBillingPlans) {
                            plans = await this.controller.dataService.getBillingPlans();
                        } else {
                            const resPlans = await client.get('/api/billing-plans');
                            plans = resPlans?.data ?? resPlans ?? [];
                        }
                        const matched = Array.isArray(plans) ? plans.find(p => p.id === planId) : null;
                        if (matched) {
                            this.studentPlan.billing_plan = matched;
                        }
                    } catch (resolveErr) {
                        console.warn('⚠️ Não foi possível resolver detalhes do plano:', resolveErr);
                    }
                }
            }
            
            console.log('✅ Plano carregado:', this.studentPlan);
            this.renderModern3DPlanCard();
            
            return this.studentPlan;
            
        } catch (error) {
            console.warn('⚠️ Plano não encontrado:', error);
            this.renderNoPlanCard();
            return null;
        }
    }

    /**
     * Load plan courses with progress integration
     */
    async loadPlanCourses() {
        const planId = this.studentPlan?.billing_plan?.id || this.studentPlan?.planId || this.studentPlan?.plan?.id;
        if (!planId) {
            console.log('ℹ️ Sem plano ativo para carregar cursos');
            this.planCourses = [];
            this.renderModern3DCoursesGrid();
            return;
        }

        try {
            console.log(`🔄 Carregando cursos do plano ${planId}...`);
            
            const client = this.api?.api || this.api;
            const response = await client.get('/api/courses', {
                params: { billing_plan_id: planId }
            });
            
            this.planCourses = response.data || response || [];
            console.log(`✅ ${this.planCourses.length} cursos carregados`);
            
            this.renderModern3DCoursesGrid();
            
        } catch (error) {
            console.error('❌ Erro ao carregar cursos:', error);
            this.planCourses = [];
            this.renderModern3DCoursesGrid();
        }
    }

    /**
     * Load enrollment progress with detailed analytics
     */
    async loadEnrollmentProgress() {
        if (!this.currentStudentId) return [];

        try {
            console.log(`🔄 Carregando progresso do aluno ${this.currentStudentId}...`);
            
            const client = this.api?.api || this.api;
            const response = await client.get(`/api/students/${this.currentStudentId}/course-progress`);
            this.enrollmentProgress = response.data || response || [];
            
            console.log(`✅ Progresso de ${this.enrollmentProgress.length} cursos carregado`);
            return this.enrollmentProgress;
            
        } catch (error) {
            console.warn('⚠️ Erro ao carregar progresso:', error);
            this.enrollmentProgress = [];
            return [];
        }
    }

    /**
     * Render modern 3D plan card
     */
    renderModern3DPlanCard() {
        const planCard = document.getElementById('plan-card');
        if (!planCard || !this.studentPlan) return;

        const plan = this.studentPlan.billing_plan || this.studentPlan.plan || null;
        if (!plan) {
            this.renderNoPlanCard();
            return;
        }
        const subscription = this.studentPlan;

        planCard.innerHTML = `
            <div class="plan-card-content-3d">
                <div class="plan-card-bg">
                    <div class="plan-gradient"></div>
                    <div class="plan-particles"></div>
                </div>
                <div class="plan-header">
                    <div class="plan-icon-3d">💎</div>
                    <div class="plan-info">
                        <h3 class="plan-name">${plan.name}</h3>
                        <p class="plan-status active">Plano Ativo</p>
                    </div>
                    <div class="plan-badge">
                        <span class="badge-text">Premium</span>
                    </div>
                </div>
                <div class="plan-details">
                    <div class="detail-item">
                        <span class="detail-icon">💰</span>
                        <span class="detail-label">Valor</span>
                        <span class="detail-value">R$ ${plan.price}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span class="detail-label">Início</span>
                        <span class="detail-value">${new Date(subscription.start_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">⏰</span>
                        <span class="detail-label">Status</span>
                        <span class="detail-value status-${subscription.status}">${subscription.status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render modern 3D courses grid
     */
    renderModern3DCoursesGrid() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        if (this.planCourses.length === 0) {
            this.showUltraModernEmptyState();
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="courses-grid-3d">
                ${this.planCourses.map((course, index) => this.createModern3DCourseCard(course, index)).join('')}
            </div>
        `;

    // Trigger entrance animations
        setTimeout(() => this.triggerEntranceAnimation(), 100);
    // Update counters and apply current filter
    this.updateCounts();
    const courseFilter = document.querySelector('#course-filter');
    const current = courseFilter ? courseFilter.value : 'active';
    this.filterCourses(current);
    }

    /**
     * Create modern 3D course card
     */
    createModern3DCourseCard(course, index) {
    const progress = this.getCourseProgress(course.id);
    const progressPercentage = this.getProgressPercent(progress);
        
        return `
            <div class="course-card-3d" data-course-id="${course.id}" style="animation-delay: ${index * 0.1}s">
                <div class="card-3d-container">
                    <div class="card-face card-front">
                        <div class="course-header-3d">
                            <div class="course-icon-3d">${this.getCourseIcon(course.category)}</div>
                            <div class="course-badge">${course.level || 'Básico'}</div>
                        </div>
                        <div class="course-content-3d">
                            <h4 class="course-title-3d">${course.name}</h4>
                            <p class="course-description-3d">${course.description || 'Descrição do curso'}</p>
                            <div class="course-meta-3d">
                                <span class="meta-item">
                                    <span class="meta-icon">⏱️</span>
                                    <span>${course.duration || '8'} semanas</span>
                                </span>
                                <span class="meta-item">
                                    <span class="meta-icon">👥</span>
                                    <span>${course.enrolled_count || 0} alunos</span>
                                </span>
                            </div>
                        </div>
                        <div class="course-progress-3d">
                            <div class="progress-header">
                                <span class="progress-label">Progresso</span>
                                <span class="progress-value">${progressPercentage}%</span>
                            </div>
                            <div class="progress-bar-3d">
                                <div class="progress-fill-3d" style="width: ${progressPercentage}%">
                                    <div class="progress-glow"></div>
                                </div>
                            </div>
                        </div>
                        <div class="course-actions-3d">
                            <button class="action-btn-primary-3d" data-action="open-course" data-course-id="${course.id}">
                                <span class="btn-bg-3d"></span>
                                <span class="btn-content-3d">
                                    ${progressPercentage > 0 ? '📖 Continuar' : '🚀 Começar'}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div class="card-face card-back">
                        <div class="card-back-content">
                            <h5>Detalhes do Curso</h5>
                            <div class="course-details-3d">
                                <div class="detail-section">
                                    <h6>📚 Módulos</h6>
                                    <ul class="modules-list">
                                        ${this.generateModulesList(course)}
                                    </ul>
                                </div>
                                <div class="detail-section">
                                    <h6>🎯 Objetivos</h6>
                                    <p>${course.objectives || 'Desenvolver conhecimentos práticos na área'}</p>
                                </div>
                            </div>
                            <button class="flip-back-btn" data-action="flip-back">
                                ← Voltar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get course progress for specific course
     */
    getCourseProgress(courseId) {
        const idStr = String(courseId);
        return this.enrollmentProgress.find(p => String(p.course_id ?? p.courseId) === idStr);
    }

    getProgressPercent(progress) {
        if (!progress) return 0;
        return Number(progress.completion_percentage ?? progress.progressPercentage ?? 0) || 0;
    }

    /**
     * Get appropriate icon for course category
     */
    getCourseIcon(category) {
        const icons = {
            'martial-arts': '🥋',
            'self-defense': '🛡️',
            'fitness': '💪',
            'theory': '📖',
            'practical': '⚡',
            'advanced': '🏆'
        };
        return icons[category] || '📚';
    }

    /**
     * Generate modules list for course
     */
    generateModulesList(course) {
        const modules = course.modules || [
            'Introdução e Fundamentos',
            'Técnicas Básicas',
            'Prática Supervisionada',
            'Avaliação Final'
        ];
        
        return modules.map(module => `<li>${module}</li>`).join('');
    }

    /**
     * Update floating stats with real data
     */
    updateFloatingStats() {
        const stats = document.getElementById('floating-stats');
        if (!stats) return;

        const totalCourses = this.planCourses.length;
        const completedCourses = this.enrollmentProgress.filter(p => this.getProgressPercent(p) >= 100).length;
        const averageProgress = totalCourses > 0 ? 
            Math.round(this.enrollmentProgress.reduce((acc, p) => acc + (this.getProgressPercent(p) || 0), 0) / totalCourses) : 0;

        // Animate numbers
        this.animateStatValue('courses', totalCourses);
        this.animateStatValue('progress', averageProgress, '%');
        this.animateStatValue('completed', completedCourses);
    }

    /**
     * Animate stat values with smooth counting
     */
    animateStatValue(statName, targetValue, suffix = '') {
        const statElement = document.querySelector(`[data-stat="${statName}"] .stat-value`);
        if (!statElement) return;

        let currentValue = 0;
        const increment = targetValue / 30; // 30 frames for smooth animation
        
        const animateNumber = () => {
            if (currentValue < targetValue) {
                currentValue = Math.min(currentValue + increment, targetValue);
                statElement.textContent = Math.round(currentValue) + suffix;
                requestAnimationFrame(animateNumber);
            } else {
                statElement.textContent = targetValue + suffix;
                statElement.classList.add('stat-completed');
            }
        };

        statElement.classList.remove('loading-dots');
        animateNumber();
    }

    /**
     * Show ultra-modern empty state
     */
    showUltraModernEmptyState() {
        const container = document.getElementById('courses-container');
        const emptyState = document.getElementById('empty-state');
        
        if (container) container.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.classList.add('animate-in');
        }
    }

    /**
     * Show progress dashboard
     */
    showProgressDashboard() {
        const dashboard = document.getElementById('progress-dashboard');
        if (!dashboard) return;

        dashboard.style.display = 'block';
        dashboard.classList.add('fade-in-up');
        
        this.renderProgressAnalytics();
    }

    /**
     * Show only courses without plan dashboard
     */
    showCoursesOnly() {
        console.log('📚 Exibindo cursos ativos sem dashboard de plano');
        
        // Check if DOM is ready, if not, schedule for when tab is rendered
        const loadingElement = document.getElementById('courses-loading');
        if (!loadingElement) {
            console.log('🎯 DOM not ready, scheduling showCoursesOnly for when tab is rendered');
            this.pendingCoursesOnlyConfig = true;
            return;
        }
        
        // Hide loading state - null safe
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show courses container
        const coursesContainer = document.getElementById('courses-container');
        if (coursesContainer) {
            coursesContainer.style.display = 'block';
            
            // Render active courses
            this.renderActiveCourses();
            
            // Update stats
            this.updateStats();
            this.updateCounts();
            this.filterCourses('active');
            
            // Add entrance animation
            setTimeout(() => {
                this.triggerEntranceAnimation();
            }, 100);
        }
    }

    /**
     * Render progress analytics
     */
    renderProgressAnalytics() {
        const content = document.getElementById('progress-content');
        if (!content) return;

        // Create comprehensive analytics dashboard
        content.innerHTML = `
            <div class="analytics-grid-3d">
                <div class="analytics-card primary">
                    <div class="card-header">
                        <h4>📊 Visão Geral</h4>
                    </div>
                    <div class="analytics-content">
                        <div class="metric-circle">
                            <svg class="progress-ring" width="120" height="120">
                                <circle class="progress-ring-bg" cx="60" cy="60" r="50"/>
                                <circle class="progress-ring-fill" cx="60" cy="60" r="50"/>
                            </svg>
                            <div class="metric-text">
                                <span class="metric-value">${this.calculateOverallProgress()}%</span>
                                <span class="metric-label">Progresso Geral</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-card secondary">
                    <div class="card-header">
                        <h4>🏆 Conquistas</h4>
                    </div>
                    <div class="achievements-list">
                        ${this.generateAchievements()}
                    </div>
                </div>
                
                <div class="analytics-card tertiary">
                    <div class="card-header">
                        <h4>📈 Estatísticas</h4>
                    </div>
                    <div class="stats-grid">
                        ${this.generateDetailedStats()}
                    </div>
                </div>
            </div>
        `;

        // Animate progress ring
        this.animateProgressRing();
    }

    /**
     * Calculate overall progress
     */
    calculateOverallProgress() {
        if (this.enrollmentProgress.length === 0) return 0;
        
        const total = this.enrollmentProgress.reduce((acc, p) => acc + (p.completion_percentage || 0), 0);
        return Math.round(total / this.enrollmentProgress.length);
    }

    /**
     * Generate achievements list
     */
    generateAchievements() {
        const achievements = [
            { icon: '🚀', title: 'Primeiro Curso', condition: this.enrollmentProgress.length > 0 },
            { icon: '📚', title: 'Estudante Dedicado', condition: this.enrollmentProgress.some(p => p.completion_percentage >= 50) },
            { icon: '🏆', title: 'Curso Completo', condition: this.enrollmentProgress.some(p => p.completion_percentage >= 100) },
            { icon: '⚡', title: 'Progresso Rápido', condition: this.calculateOverallProgress() >= 75 }
        ];

        return achievements.map(achievement => `
            <div class="achievement-item ${achievement.condition ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <span class="achievement-title">${achievement.title}</span>
                    <span class="achievement-status">${achievement.condition ? 'Desbloqueado' : 'Bloqueado'}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Generate detailed statistics
     */
    generateDetailedStats() {
        const totalLessons = this.enrollmentProgress.reduce((acc, p) => acc + (p.total_lessons || 0), 0);
        const completedLessons = this.enrollmentProgress.reduce((acc, p) => acc + (p.completed_lessons || 0), 0);
        const studyTime = this.enrollmentProgress.reduce((acc, p) => acc + (p.study_time_minutes || 0), 0);

        return `
            <div class="stat-item">
                <div class="stat-icon">📖</div>
                <div class="stat-content">
                    <span class="stat-number">${completedLessons}/${totalLessons}</span>
                    <span class="stat-label">Aulas Completas</span>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⏰</div>
                <div class="stat-content">
                    <span class="stat-number">${Math.round(studyTime / 60)}h</span>
                    <span class="stat-label">Tempo de Estudo</span>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <span class="stat-number">${this.planCourses.length}</span>
                    <span class="stat-label">Cursos Disponíveis</span>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <span class="stat-number">${this.calculateOverallProgress()}%</span>
                    <span class="stat-label">Progresso Médio</span>
                </div>
            </div>
        `;
    }

    /**
     * Animate progress ring
     */
    animateProgressRing() {
        const ring = document.querySelector('.progress-ring-fill');
        if (!ring) return;

        const progress = this.calculateOverallProgress();
        const circumference = 2 * Math.PI * 50; // r = 50
        const offset = circumference - (progress / 100) * circumference;

        ring.style.strokeDasharray = circumference;
        ring.style.strokeDashoffset = circumference;

        // Animate
        setTimeout(() => {
            ring.style.strokeDashoffset = offset;
        }, 500);
    }

    /**
     * Filter courses based on status
     */
    filterCourses(filter) {
        const libCards = document.querySelectorAll('.course-card-3d');
        const activeCards = document.querySelectorAll('.course-card-modern');

        const decideLib = (courseId) => {
            const p = this.getCourseProgress(courseId);
            const perc = this.getProgressPercent(p);
            switch (filter) {
                case 'all': return true;
                case 'active': return perc > 0 && perc < 100;
                case 'completed': return perc >= 100;
                case 'available': return !p || perc === 0;
                default: return true;
            }
        };

        libCards.forEach(card => {
            const courseId = card.dataset.courseId;
            const show = decideLib(courseId);
            card.style.display = show ? 'block' : 'none';
            card.classList.toggle('filter-in', show);
        });

        activeCards.forEach(card => {
            const show = (filter === 'active' || filter === 'all');
            card.style.display = show ? 'block' : 'none';
            card.classList.toggle('filter-in', show);
        });

        this.updateCounts();
    }

    updateCounts() {
        try {
            const activeCount = this.activeCourses?.length || 0;
            const activeIds = new Set((this.activeCourses || []).map(ac => String(ac.course?.id || ac.courseId)));
            const availableCount = (this.planCourses || []).filter(c => !activeIds.has(String(c.id))).length;
            const completedCount = (this.enrollmentProgress || []).filter(p => this.getProgressPercent(p) >= 100).length;

            const $ = (sel) => document.querySelector(sel);
            const ca = $('#count-active'); if (ca) ca.textContent = activeCount;
            const cv = $('#count-available'); if (cv) cv.textContent = availableCount;
            const cc = $('#count-completed'); if (cc) cc.textContent = completedCount;
        } catch (e) { console.warn('updateCounts failed', e); }
    }

    /**
     * Show advanced error state
     */
    showAdvancedErrorState() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state-3d">
                <div class="error-animation">
                    <div class="error-icon">⚠️</div>
                    <div class="error-waves"></div>
                </div>
                <h3>Oops! Algo deu errado</h3>
                <p>Não foi possível carregar os cursos. Tente novamente.</p>
                <button class="retry-btn-3d" data-action="retry-load">
                    <span class="btn-bg"></span>
                    <span class="btn-content">🔄 Tentar Novamente</span>
                </button>
            </div>
        `;
    }

    /**
     * Export progress functionality
     */
    exportProgress() {
        console.log('📊 Exportando progresso...');
        // Implementation for progress export
    }

    /**
     * Share progress functionality
     */
    shareProgress() {
        console.log('📤 Compartilhando progresso...');
        // Implementation for progress sharing
    }

    /**
     * Open course functionality
     */
    openCourse(courseId) {
        console.log(`🚀 Abrindo curso ${courseId}...`);
        // Implementation for opening course
    }

    /**
     * Flip card functionality
     */
    flipCard(button) {
        const card = button.closest('.course-card-3d');
        if (card) {
            card.classList.toggle('flipped');
        }
    }

    /**
     * View course details
     */
    viewCourseDetails(courseId) {
        console.log(`👁️ Visualizando detalhes do curso ${courseId}...`);
        // Implementation for viewing course details
        // You could navigate to a course details page or open a detailed view
    }

    /**
     * Deactivate a specific course
     */
    async deactivateCourse(courseId) {
        if (!this.currentStudentId) {
            console.error('No student ID available');
            return;
        }

        if (!confirm('Tem certeza que deseja desativar este curso?')) {
            return;
        }

        try {
            console.log(`🚫 Desativando curso ${courseId} para estudante ${this.currentStudentId}...`);

            const result = await (this.api?.api?.delete ? this.api.api.delete(`/api/students/${this.currentStudentId}/courses/${courseId}`) : this.api.delete(`/api/students/${this.currentStudentId}/courses/${courseId}`));

            if (result?.success) {
                console.log('✅ Curso desativado com sucesso');
                this.showNotification('success', 'Curso desativado com sucesso!');
                
                // Reload active courses
                await this.loadActiveCourses();
                
            } else {
                throw new Error(result?.message || 'Erro ao desativar curso');
            }

        } catch (error) {
            console.error('❌ Erro ao desativar curso:', error);
            this.showNotification('error', 'Erro ao desativar curso: ' + error.message);
            try { window.app?.handleError?.(error, 'Students:courses:deactivate'); } catch (_) {}
        }
    }

    /**
     * Add course-specific CSS styles
     */
    addCourseStyles() {
        if (document.getElementById('course-tab-styles')) return;

        const style = document.createElement('style');
        style.id = 'course-tab-styles';
        style.textContent = `
            /* Course Cards */
            .course-card-modern {
                background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .course-card-modern:hover {
                transform: translateY(-4px);
                box-shadow: 0 16px 64px rgba(0, 0, 0, 0.15);
            }

            .course-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;
            }

            .course-icon {
                font-size: 24px;
                margin-right: 16px;
                padding: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .course-info {
                flex: 1;
            }

            .course-name {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 4px 0;
            }

            .course-description {
                font-size: 14px;
                color: #64748b;
                margin: 0;
            }

            .course-status {
                margin-left: 16px;
            }

            .status-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }

            .status-badge.active {
                background: #10b981;
                color: white;
            }

            .status-badge.completed {
                background: #3b82f6;
                color: white;
            }

            .status-badge.suspended {
                background: #f59e0b;
                color: white;
            }

            .status-badge.dropped {
                background: #ef4444;
                color: white;
            }

            .course-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 12px;
                margin-bottom: 16px;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
            }

            .detail-label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
                margin-bottom: 2px;
            }

            .detail-value {
                font-size: 14px;
                color: #1e293b;
                font-weight: 600;
            }

            .course-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .btn-course-action {
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                background: #f1f5f9;
                color: #475569;
            }

            .btn-course-action:hover {
                background: #e2e8f0;
            }

            .btn-course-action.danger {
                background: #fef2f2;
                color: #dc2626;
            }

            .btn-course-action.danger:hover {
                background: #fee2e2;
            }

            /* Notifications */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                min-width: 300px;
                padding: 16px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(10px);
                animation: slideInRight 0.3s ease-out;
            }

            .notification-success {
                background: rgba(16, 185, 129, 0.9);
                color: white;
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .notification-error {
                background: rgba(239, 68, 68, 0.9);
                color: white;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .notification-icon {
                font-size: 20px;
            }

            .notification-message {
                font-weight: 500;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            /* Empty State */
            .empty-state-modern {
                text-align: center;
                padding: 64px 32px;
                color: #64748b;
            }

            .empty-icon {
                font-size: 64px;
                margin-bottom: 24px;
                opacity: 0.6;
            }

            .empty-state-modern h3 {
                font-size: 24px;
                margin-bottom: 12px;
                color: #1e293b;
            }

            .empty-state-modern p {
                font-size: 16px;
                max-width: 400px;
                margin: 0 auto;
                line-height: 1.6;
            }

            /* Loading states */
            .btn-course-action.loading {
                opacity: 0.7;
                pointer-events: none;
            }

            .btn-course-action.loading::after {
                content: '';
                width: 12px;
                height: 12px;
                margin-left: 8px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                display: inline-block;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `;

        document.head.appendChild(style);
    }
}

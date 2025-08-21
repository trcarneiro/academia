/**
 * Modern Courses Tab Component
 * Ultra-modern UX with smooth animations and real API integration
 */

export class CoursesTab {
    constructor(editorController) {
        this.controller = editorController;
        this.api = editorController.api;
        this.service = editorController.service;
        this.currentStudentId = null;
        this.studentPlan = null;
        this.planCourses = [];
        this.enrollmentProgress = [];
        this.isLoading = false;
    }

    /**
     * Initialize modern courses tab
     */
    init(container, studentId) {
        console.log('🚀 Inicializando aba de Cursos com UX Ultra-Moderna...');
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
                                    <option value="all">Todos os cursos</option>
                                    <option value="active">Em andamento</option>
                                    <option value="completed">Concluídos</option>
                                    <option value="available">Disponíveis</option>
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
                            <button class="cta-button-3d" onclick="window.openFinancialTab()">
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
                            <button class="action-btn-3d" onclick="this.exportProgress()">
                                <span class="btn-shine"></span>
                                <svg class="action-icon" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                <span>Exportar</span>
                            </button>
                            <button class="action-btn-3d" onclick="this.shareProgress()">
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
    }

    /**
     * Attach ultra-modern event listeners
     */
    attachModernEventListeners() {
        const container = document.querySelector('.courses-tab-ultra-modern');
        if (!container) return;

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

        // Add advanced animations
        this.initializeAdvancedAnimations();
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
            const [planData, progressData] = await Promise.allSettled([
                this.loadStudentPlan(),
                this.loadEnrollmentProgress()
            ]);

            // Ensure minimum loading time for smooth UX
            const loadTime = Date.now() - startTime;
            const minLoadTime = 1000; // 1 second minimum
            if (loadTime < minLoadTime) {
                await new Promise(resolve => setTimeout(resolve, minLoadTime - loadTime));
            }

            const plan = planData.status === 'fulfilled' ? planData.value : null;
            const progress = progressData.status === 'fulfilled' ? progressData.value : [];

            if (plan) {
                await this.loadPlanCourses();
                this.showProgressDashboard();
            } else {
                this.showUltraModernEmptyState();
            }

            this.updateFloatingStats();
            this.hideAdvancedLoadingState();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
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
            document.getElementById('courses-loading').style.opacity = '0';
            
            setTimeout(() => {
                document.getElementById('courses-loading').style.display = 'none';
                document.getElementById('courses-container').style.display = 'block';
                
                // Spectacular entrance animation
                this.triggerEntranceAnimation();
            }, 500);
            
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
            
            const response = await this.api.get(`/api/students/${this.currentStudentId}/subscription`);
            this.studentPlan = response.data;
            
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
        if (!this.studentPlan?.billing_plan?.id) {
            console.log('ℹ️ Sem plano ativo para carregar cursos');
            return;
        }

        try {
            console.log(`🔄 Carregando cursos do plano ${this.studentPlan.billing_plan.id}...`);
            
            const response = await this.api.get('/api/courses', {
                params: { billing_plan_id: this.studentPlan.billing_plan.id }
            });
            
            this.planCourses = response.data || [];
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
            
            const response = await this.api.get(`/api/students/${this.currentStudentId}/course-progress`);
            this.enrollmentProgress = response.data || [];
            
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

        const plan = this.studentPlan.billing_plan;
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
    }

    /**
     * Create modern 3D course card
     */
    createModern3DCourseCard(course, index) {
        const progress = this.getCourseProgress(course.id);
        const progressPercentage = progress ? progress.completion_percentage : 0;
        
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
                            <button class="action-btn-primary-3d" onclick="this.openCourse(${course.id})">
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
                            <button class="flip-back-btn" onclick="this.flipCard(this)">
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
        return this.enrollmentProgress.find(p => p.course_id === courseId);
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
        const completedCourses = this.enrollmentProgress.filter(p => p.completion_percentage >= 100).length;
        const averageProgress = totalCourses > 0 ? 
            Math.round(this.enrollmentProgress.reduce((acc, p) => acc + (p.completion_percentage || 0), 0) / totalCourses) : 0;

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
        const cards = document.querySelectorAll('.course-card-3d');
        
        cards.forEach(card => {
            const courseId = parseInt(card.dataset.courseId);
            const progress = this.getCourseProgress(courseId);
            let show = false;

            switch (filter) {
                case 'all':
                    show = true;
                    break;
                case 'active':
                    show = progress && progress.completion_percentage > 0 && progress.completion_percentage < 100;
                    break;
                case 'completed':
                    show = progress && progress.completion_percentage >= 100;
                    break;
                case 'available':
                    show = !progress || progress.completion_percentage === 0;
                    break;
            }

            if (show) {
                card.style.display = 'block';
                card.classList.add('filter-in');
            } else {
                card.style.display = 'none';
                card.classList.remove('filter-in');
            }
        });
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
                <button class="retry-btn-3d" onclick="this.loadData()">
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
}

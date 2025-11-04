/**
 * Enhanced Check-in Kiosk Dashboard
 * Premium UX improvements with sales integration
 */

class EnhancedKioskDashboard {
    constructor() {
        this.salesAPI = null;
        this.progressAPI = null;
        this.currentStudent = null;
        this.animationFrameId = null;
    }

    async initialize() {
        console.log('🚀 Initializing Enhanced Kiosk Dashboard...');
        
        // Wait for core APIs
        await this.waitForAPIs();
        
        // Initialize APIs
        this.salesAPI = window.createModuleAPI('Sales');
        this.progressAPI = window.createModuleAPI('Progress');
        
        console.log('✅ Enhanced Dashboard initialized');
    }

    async waitForAPIs() {
        return new Promise(resolve => {
            const check = () => {
                if (window.createModuleAPI && window.app) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    async renderEnhancedDashboard(studentData, dashboardData) {
        console.log('🎨 Rendering enhanced dashboard for:', studentData.name);
        
        this.currentStudent = studentData;
        
        const container = document.getElementById('student-info');
        if (!container) {
            console.error('❌ Student info container not found');
            return;
        }

        container.innerHTML = this.buildEnhancedHTML(studentData, dashboardData);
        
        // Load additional data in parallel
        await this.loadEnhancedData(studentData.id, dashboardData);
        
        // Setup interactions
        this.setupInteractions();
    }

    buildEnhancedHTML(student, dashboard) {
        return `
        <!-- Enhanced Header -->
        <div class="kiosk-header-enhanced">
            <div class="student-profile-section">
                <div class="student-avatar-enhanced">
                    ${student.avatar ? 
                        `<img src="${student.avatar}" alt="${student.name}" class="avatar-img">` : 
                        `<div class="avatar-placeholder">${student.firstName?.charAt(0) || 'A'}</div>`
                    }
                    <div class="status-indicator ${this.getOverallStatus(dashboard)}"></div>
                </div>
                <div class="student-details">
                    <h2 class="student-name-enhanced">${student.name}</h2>
                    <div class="student-badges-enhanced">
                        ${this.generateEnhancedBadges(dashboard)}
                    </div>
                    <div class="student-meta">
                        <span class="join-date">Membro desde ${this.formatJoinDate(student.joinDate)}</span>
                        <span class="student-id">#${student.registrationNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="quick-actions-enhanced">
                <button class="btn-primary-enhanced check-in-quick" onclick="enhancedDashboard.quickCheckin()">
                    <span class="btn-icon">⚡</span>
                    <span class="btn-text">Check-in Rápido</span>
                </button>
            </div>
        </div>

        <!-- Enhanced Stats Grid -->
        <div class="stats-grid-enhanced">
            <!-- Course Progress Card -->
            <div class="stat-card-premium course-progress-enhanced">
                <div class="card-header-enhanced">
                    <div class="header-left">
                        <h3 class="card-title">🎓 Progresso do Curso</h3>
                        <p class="card-subtitle">${dashboard.currentCourse?.name || 'Krav Maga'}</p>
                    </div>
                    <div class="progress-percentage-large" id="course-progress-display">
                        <span class="percentage-number">0</span>
                        <span class="percentage-symbol">%</span>
                    </div>
                </div>
                <div class="progress-visual-enhanced">
                    <div class="progress-track">
                        <div class="progress-fill-animated" id="course-progress-bar"></div>
                    </div>
                    <div class="progress-stats" id="course-stats">
                        <span class="stat-item">
                            <span class="stat-number" id="completed-lessons">0</span>
                            <span class="stat-label">Aulas</span>
                        </span>
                        <span class="stat-item">
                            <span class="stat-number" id="total-hours">0</span>
                            <span class="stat-label">Horas</span>
                        </span>
                    </div>
                </div>
                <div class="next-milestone-enhanced" id="next-milestone">
                    <div class="milestone-icon">🏆</div>
                    <div class="milestone-content">
                        <div class="milestone-title">Próximo Marco</div>
                        <div class="milestone-description">Carregando...</div>
                    </div>
                </div>
            </div>

            <!-- Attendance Analytics -->
            <div class="stat-card-premium attendance-analytics">
                <div class="card-header-enhanced">
                    <div class="header-left">
                        <h3 class="card-title">📊 Frequência</h3>
                        <p class="card-subtitle">Este mês</p>
                    </div>
                    <div class="attendance-score ${this.getAttendanceScoreClass(dashboard.stats?.attendanceRate)}">
                        ${dashboard.stats?.attendanceRate || 0}%
                    </div>
                </div>
                <div class="attendance-visual">
                    <div class="attendance-chart" id="attendance-chart">
                        <div class="chart-bar present" style="height: ${(dashboard.stats?.attendanceThisMonth || 0) * 10}%">
                            <span class="bar-label">${dashboard.stats?.attendanceThisMonth || 0}</span>
                        </div>
                        <div class="chart-bar total" style="height: ${(dashboard.stats?.totalClassesThisMonth || 0) * 10}%">
                            <span class="bar-label">${dashboard.stats?.totalClassesThisMonth || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="attendance-insight">
                    <div class="insight-icon">${this.getInsightIcon(dashboard.stats?.attendanceRate)}</div>
                    <div class="insight-text">${this.generateAttendanceInsight(dashboard.stats)}</div>
                </div>
            </div>

            <!-- Plan Status Enhanced -->
            <div class="stat-card-premium plan-status-enhanced">
                <div class="card-header-enhanced">
                    <div class="header-left">
                        <h3 class="card-title">💎 ${dashboard.plan?.name || 'Sem Plano'}</h3>
                        <p class="card-subtitle">Plano atual</p>
                    </div>
                    <div class="plan-status-indicator ${dashboard.plan?.isActive ? 'active' : 'inactive'}">
                        ${dashboard.plan?.isActive ? '✅' : '❌'}
                    </div>
                </div>
                <div class="plan-details-enhanced">
                    ${this.renderPlanDetails(dashboard.plan)}
                </div>
                <div class="plan-actions-enhanced">
                    ${dashboard.plan?.isActive ? `
                        <button class="btn-outline-enhanced" onclick="enhancedDashboard.showPlanDetails('${student.id}')">
                            📋 Detalhes
                        </button>
                    ` : `
                        <button class="btn-primary-enhanced" onclick="enhancedDashboard.showPlansModal('${student.id}')">
                            ⬆️ Ativar Plano
                        </button>
                    `}
                </div>
            </div>

            <!-- AI Recommendations -->
            <div class="stat-card-premium recommendations-enhanced">
                <div class="card-header-enhanced">
                    <div class="header-left">
                        <h3 class="card-title">💡 Recomendações</h3>
                        <p class="card-subtitle">Personalizadas para você</p>
                    </div>
                    <div class="ai-badge-enhanced">
                        <span class="ai-icon">🤖</span>
                        <span class="ai-text">IA</span>
                    </div>
                </div>
                <div class="recommendations-container" id="recommendations-container">
                    <div class="loading-recommendations">
                        <div class="loading-spinner"></div>
                        <span>Analisando perfil...</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sales & Store Section -->
        <div class="store-section-enhanced">
            <div class="section-header-enhanced">
                <h3 class="section-title">🛒 Loja da Academia</h3>
                <p class="section-subtitle">Equipamentos e produtos exclusivos</p>
            </div>
            <div class="store-grid-enhanced" id="store-grid">
                <!-- Loaded dynamically -->
            </div>
        </div>

        <!-- Upcoming Classes Timeline -->
        <div class="timeline-section-enhanced">
            <div class="section-header-enhanced">
                <h3 class="section-title">📅 Suas Próximas Aulas</h3>
                <p class="section-subtitle">Agenda personalizada</p>
            </div>
            <div class="classes-timeline-enhanced" id="classes-timeline">
                ${this.renderClassesTimeline(dashboard.upcomingClasses)}
            </div>
        </div>

        <!-- Achievements Section -->
        <div class="achievements-section-enhanced">
            <div class="section-header-enhanced">
                <h3 class="section-title">🏆 Conquistas & Marcos</h3>
                <p class="section-subtitle">Seu progresso no Krav Maga</p>
            </div>
            <div class="achievements-grid-enhanced" id="achievements-grid">
                <!-- Loaded dynamically -->
            </div>
        </div>
        `;
    }

    async loadEnhancedData(studentId, dashboardData) {
        console.log('📊 Loading enhanced data...');
        
        // Load in parallel for better performance
        const promises = [
            this.loadCourseProgress(studentId),
            this.loadRecommendations(studentId),
            this.loadStoreProducts(studentId),
            this.loadAchievements(studentId)
        ];

        try {
            await Promise.allSettled(promises);
            console.log('✅ Enhanced data loaded');
        } catch (error) {
            console.error('❌ Error loading enhanced data:', error);
        }
    }

    async loadCourseProgress(studentId) {
        try {
            // Mock progress data for now
            const progress = {
                completionPercentage: 35,
                completedLessons: 14,
                totalLessons: 40,
                hoursCompleted: 28,
                nextMilestone: {
                    title: 'Avaliação Faixa Amarela',
                    description: 'Faltam 6 aulas para a próxima avaliação',
                    progress: 75
                }
            };

            this.updateProgressDisplay(progress);
        } catch (error) {
            console.error('Error loading course progress:', error);
        }
    }

    updateProgressDisplay(progress) {
        const percentage = progress.completionPercentage || 0;
        
        // Animate percentage counter
        this.animateNumber('course-progress-display .percentage-number', 0, percentage, 1000);
        
        // Animate progress bar
        const progressBar = document.getElementById('course-progress-bar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = `${percentage}%`;
            }, 200);
        }
        
        // Update stats
        document.getElementById('completed-lessons').textContent = progress.completedLessons || 0;
        document.getElementById('total-hours').textContent = progress.hoursCompleted || 0;
        
        // Update milestone
        const milestoneElement = document.getElementById('next-milestone');
        if (milestoneElement && progress.nextMilestone) {
            milestoneElement.querySelector('.milestone-title').textContent = progress.nextMilestone.title;
            milestoneElement.querySelector('.milestone-description').textContent = progress.nextMilestone.description;
        }
    }

    async loadRecommendations(studentId) {
        try {
            // Mock recommendations
            const recommendations = [
                {
                    id: 'freq-improve',
                    type: 'frequency',
                    priority: 'high',
                    icon: '📈',
                    title: 'Melhore sua frequência',
                    description: 'Venha mais 1x por semana para atingir seus objetivos',
                    actionable: true,
                    actionText: 'Agendar Aulas'
                },
                {
                    id: 'uniform-needed',
                    type: 'equipment',
                    priority: 'normal',
                    icon: '👕',
                    title: 'Uniforme oficial',
                    description: 'Treine com mais conforto e segurança',
                    actionable: true,
                    actionText: 'Ver Uniformes'
                },
                {
                    id: 'nutrition-tip',
                    type: 'wellness',
                    priority: 'low',
                    icon: '🥗',
                    title: 'Dica de nutrição',
                    description: 'Hidrate-se bem antes e depois dos treinos',
                    actionable: false
                }
            ];

            this.renderRecommendations(recommendations);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.renderRecommendationsFallback();
        }
    }

    renderRecommendations(recommendations) {
        const container = document.getElementById('recommendations-container');
        if (!container) return;

        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item-enhanced ${rec.priority}" data-rec-id="${rec.id}">
                <div class="rec-icon-enhanced">${rec.icon}</div>
                <div class="rec-content-enhanced">
                    <div class="rec-title">${rec.title}</div>
                    <div class="rec-description">${rec.description}</div>
                </div>
                ${rec.actionable ? `
                    <button class="rec-action-btn" onclick="enhancedDashboard.executeRecommendation('${rec.id}')">
                        ${rec.actionText}
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    renderRecommendationsFallback() {
        const container = document.getElementById('recommendations-container');
        if (!container) return;

        container.innerHTML = `
            <div class="recommendation-item-enhanced normal">
                <div class="rec-icon-enhanced">👍</div>
                <div class="rec-content-enhanced">
                    <div class="rec-title">Tudo certo!</div>
                    <div class="rec-description">Continue com o excelente trabalho</div>
                </div>
            </div>
        `;
    }

    async loadStoreProducts(studentId) {
        try {
            // Mock store products
            const products = [
                {
                    id: 'uniform-basic',
                    type: 'uniform',
                    name: 'Uniforme Básico',
                    description: 'Camiseta + Short oficial da academia',
                    price: 89.90,
                    image: '👕',
                    priority: 'high',
                    inStock: true
                },
                {
                    id: 'gloves-training',
                    type: 'equipment',
                    name: 'Luvas de Treino',
                    description: 'Proteção para as mãos durante o treinamento',
                    price: 45.00,
                    image: '🥊',
                    priority: 'normal',
                    inStock: true
                },
                {
                    id: 'supplement-protein',
                    type: 'supplement',
                    name: 'Whey Protein',
                    description: 'Suplemento para recuperação muscular',
                    price: 120.00,
                    image: '💪',
                    priority: 'low',
                    inStock: true
                }
            ];

            this.renderStoreProducts(products);
        } catch (error) {
            console.error('Error loading store products:', error);
            this.renderStoreFallback();
        }
    }

    renderStoreProducts(products) {
        const container = document.getElementById('store-grid');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="store-card-enhanced ${product.priority}" data-product-id="${product.id}">
                <div class="product-image-enhanced">
                    <div class="product-icon">${product.image}</div>
                    ${!product.inStock ? '<div class="out-of-stock-badge">Esgotado</div>' : ''}
                </div>
                <div class="product-info-enhanced">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">R$ ${product.price.toFixed(2)}</div>
                </div>
                <div class="product-actions-enhanced">
                    <button class="btn-product-buy ${!product.inStock ? 'disabled' : ''}" 
                            onclick="enhancedDashboard.showProductModal('${product.id}')"
                            ${!product.inStock ? 'disabled' : ''}>
                        ${product.inStock ? '🛒 Comprar' : 'Indisponível'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderStoreFallback() {
        const container = document.getElementById('store-grid');
        if (!container) return;

        container.innerHTML = `
            <div class="store-card-enhanced normal">
                <div class="product-image-enhanced">
                    <div class="product-icon">🛒</div>
                </div>
                <div class="product-info-enhanced">
                    <h4 class="product-name">Loja em manutenção</h4>
                    <p class="product-description">Produtos disponíveis em breve</p>
                </div>
            </div>
        `;
    }

    renderClassesTimeline(classes) {
        if (!classes || classes.length === 0) {
            return `
                <div class="empty-timeline-enhanced">
                    <div class="empty-icon">📅</div>
                    <h4>Nenhuma aula agendada</h4>
                    <p>Que tal agendar sua próxima aula?</p>
                    <button class="btn-primary-enhanced" onclick="enhancedDashboard.showScheduleModal()">
                        📋 Agendar Aula
                    </button>
                </div>
            `;
        }

        return classes.map((classItem, index) => `
            <div class="timeline-item-enhanced ${index === 0 ? 'next-class' : ''}" data-class-id="${classItem.id}">
                <div class="timeline-marker-enhanced">
                    <div class="marker-dot ${index === 0 ? 'active' : ''}"></div>
                    ${index < classes.length - 1 ? '<div class="marker-line"></div>' : ''}
                </div>
                <div class="timeline-content-enhanced">
                    <div class="class-header-enhanced">
                        <div class="class-info">
                            <h4 class="class-title">${classItem.name || 'Krav Maga'}</h4>
                            <div class="class-meta">
                                <span class="class-time">${this.formatDateTime(classItem.date || classItem.startTime)}</span>
                                <span class="class-instructor">👨‍🏫 ${classItem.instructor || 'Instrutor'}</span>
                            </div>
                        </div>
                        ${index === 0 ? '<div class="next-class-badge">Próxima</div>' : ''}
                    </div>
                    
                    ${index === 0 ? `
                        <div class="class-actions-enhanced">
                            <button class="btn-checkin-enhanced" onclick="enhancedDashboard.quickCheckin('${classItem.id}')">
                                ⚡ Check-in
                            </button>
                            <button class="btn-details-enhanced" onclick="enhancedDashboard.showClassDetails('${classItem.id}')">
                                ℹ️ Detalhes
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadAchievements(studentId) {
        try {
            // Mock achievements
            const achievements = [
                {
                    id: 'first-month',
                    title: 'Primeiro Mês',
                    description: 'Completou o primeiro mês de treinos',
                    icon: '🏅',
                    earned: true,
                    earnedDate: '2025-08-14'
                },
                {
                    id: 'consistency',
                    title: 'Consistente',
                    description: 'Treinou por 4 semanas seguidas',
                    icon: '🔥',
                    earned: true,
                    earnedDate: '2025-09-01'
                },
                {
                    id: 'yellow-belt',
                    title: 'Faixa Amarela',
                    description: 'Próxima meta - Continue treinando!',
                    icon: '🥋',
                    earned: false,
                    progress: 75
                }
            ];

            this.renderAchievements(achievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    renderAchievements(achievements) {
        const container = document.getElementById('achievements-grid');
        if (!container) return;

        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-card-enhanced ${achievement.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon-enhanced">
                    ${achievement.icon}
                    ${achievement.earned ? '<div class="earned-badge">✓</div>' : ''}
                </div>
                <div class="achievement-content">
                    <h4 class="achievement-title">${achievement.title}</h4>
                    <p class="achievement-description">${achievement.description}</p>
                    ${!achievement.earned && achievement.progress ? `
                        <div class="achievement-progress">
                            <div class="progress-bar-small">
                                <div class="progress-fill-small" style="width: ${achievement.progress}%"></div>
                            </div>
                            <span class="progress-text">${achievement.progress}%</span>
                        </div>
                    ` : ''}
                    ${achievement.earned ? `
                        <div class="earned-date">Conquistado em ${this.formatDate(achievement.earnedDate)}</div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Utility methods
    generateEnhancedBadges(dashboard) {
        const badges = [];
        
        // Level badge
        if (dashboard.currentCourse?.level) {
            badges.push(`<span class="badge-enhanced level">${dashboard.currentCourse.level}</span>`);
        }
        
        // Attendance badge
        const rate = dashboard.stats?.attendanceRate || 0;
        if (rate >= 80) badges.push(`<span class="badge-enhanced success">Frequência Alta</span>`);
        else if (rate >= 60) badges.push(`<span class="badge-enhanced warning">Frequência OK</span>`);
        else if (rate > 0) badges.push(`<span class="badge-enhanced danger">Frequência Baixa</span>`);
        
        // Payment status badge
        if (dashboard.payments?.overdueCount === 0) {
            badges.push(`<span class="badge-enhanced success">Em Dia</span>`);
        } else {
            badges.push(`<span class="badge-enhanced danger">${dashboard.payments.overdueCount} Pendente(s)</span>`);
        }
        
        return badges.join('');
    }

    getOverallStatus(dashboard) {
        if (dashboard.payments?.overdueCount > 0) return 'warning';
        if ((dashboard.stats?.attendanceRate || 0) < 60) return 'attention';
        return 'good';
    }

    getAttendanceScoreClass(rate) {
        if (rate >= 80) return 'excellent';
        if (rate >= 60) return 'good';
        if (rate >= 40) return 'average';
        return 'needs-improvement';
    }

    renderPlanDetails(plan) {
        if (!plan) {
            return `
                <div class="no-plan-message">
                    <p>Nenhum plano ativo</p>
                    <small>Ative um plano para acessar todos os benefícios</small>
                </div>
            `;
        }

        return `
            <div class="plan-features">
                ${plan.billingType === 'UNLIMITED' || plan.classesPerWeek === 0 ? `
                    <div class="unlimited-feature">
                        <span class="feature-icon">🚀</span>
                        <span class="feature-text">Aulas Ilimitadas</span>
                    </div>
                ` : `
                    <div class="limited-feature">
                        <span class="feature-icon">📅</span>
                        <span class="feature-text">${plan.classesPerWeek} aulas/semana</span>
                    </div>
                `}
                <div class="plan-validity">
                    <span class="validity-icon">📆</span>
                    <span class="validity-text">
                        ${plan.endDate ? 
                            `Válido até ${this.formatDate(plan.endDate)}` : 
                            'Plano recorrente'
                        }
                    </span>
                </div>
            </div>
        `;
    }

    generateAttendanceInsight(stats) {
        const rate = stats?.attendanceRate || 0;
        
        if (rate >= 80) return 'Excelente! Continue mantendo essa regularidade';
        if (rate >= 60) return 'Bom ritmo! Tente vir mais uma vez por semana';
        if (rate >= 40) return 'Que tal aumentar sua frequência? Seu corpo agradece!';
        return 'Sua frequência está baixa. Vamos reagendar algumas aulas?';
    }

    getInsightIcon(rate) {
        if (rate >= 80) return '🔥';
        if (rate >= 60) return '👍';
        if (rate >= 40) return '⚠️';
        return '🚨';
    }

    // Animation utilities
    animateNumber(selector, start, end, duration) {
        const element = document.querySelector(selector);
        if (!element) return;

        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Date formatting utilities
    formatJoinDate(date) {
        if (!date) return 'Data não informada';
        return new Date(date).toLocaleDateString('pt-BR', {
            month: 'short',
            year: 'numeric'
        });
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    }

    // Interactive methods
    setupInteractions() {
        // Add hover effects and animations
        this.addHoverEffects();
        
        // Setup card interactions
        this.setupCardInteractions();
    }

    addHoverEffects() {
        const cards = document.querySelectorAll('.stat-card-premium, .store-card-enhanced, .achievement-card-enhanced');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    setupCardInteractions() {
        // Add click handlers for interactive elements
        document.querySelectorAll('[data-interactive="true"]').forEach(element => {
            element.addEventListener('click', this.handleInteraction.bind(this));
        });
    }

    handleInteraction(event) {
        const element = event.currentTarget;
        const action = element.dataset.action;
        
        // Add ripple effect
        this.createRippleEffect(element, event);
        
        // Handle specific actions
        switch (action) {
            case 'checkin':
                this.quickCheckin();
                break;
            case 'schedule':
                this.showScheduleModal();
                break;
            default:
                console.log('Unhandled interaction:', action);
        }
    }

    createRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple-effect');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Action methods (to be implemented)
    async quickCheckin(classId = null) {
        console.log('Quick check-in triggered:', classId);
        // Implement quick check-in logic
    }

    async showScheduleModal() {
        console.log('Schedule modal triggered');
        // Implement schedule modal
    }

    async showPlanDetails(studentId) {
        console.log('Plan details for:', studentId);
        // Implement plan details modal
    }

    async showPlansModal(studentId) {
        console.log('Plans selection for:', studentId);
        // Implement plans selection modal
    }

    async executeRecommendation(recId) {
        console.log('Executing recommendation:', recId);
        // Implement recommendation actions
    }

    async showProductModal(productId) {
        console.log('Product modal for:', productId);
        // Implement product purchase modal
    }

    async showClassDetails(classId) {
        console.log('Class details for:', classId);
        // Implement class details modal
    }
}

// Initialize enhanced dashboard
if (typeof window !== 'undefined') {
    window.enhancedDashboard = new EnhancedKioskDashboard();
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.enhancedDashboard.initialize();
        });
    } else {
        window.enhancedDashboard.initialize();
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedKioskDashboard;
}

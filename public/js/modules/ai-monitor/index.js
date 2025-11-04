/**
 * AI Monitor Module - Single File Structure
 * Monitor de Inteligência Artificial para planos de aula
 * Baseado no padrão modular do sistema Academia v2.0
 */

// Global references
let aiMonitorAPI = null;

// DOM elements (cached for performance)
let elements = {};

// Component state
const state = {
    metrics: null,
    missingPlans: [],
    orphanActivities: [],
    loading: false
};

/**
 * Initialize API helper
 */
async function initializeAPI() {
    console.log('🤖 AI Monitor - Initializing API...');
    await waitForAPIClient();
    aiMonitorAPI = window.createModuleAPI('AIMonitor');
    console.log('🤖 AI Monitor - API initialized');
}

/**
 * Check if server is ready for AI Monitor requests
 */
async function waitForServerReady() {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            // Try a simple health check by calling the AI Monitor health endpoint
            const response = await fetch('/api/ai-monitor/health');
            if (response.ok) {
                console.log('🤖 AI Monitor - Server is ready');
                return true;
            }
        } catch (error) {
            console.log(`🤖 AI Monitor - Server not ready yet (attempt ${retries + 1}/${maxRetries}), waiting...`);
            retries++;
            if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 800)); // Wait 800ms between retries
            }
        }
    }
    
    console.warn('🤖 AI Monitor - Server readiness check timed out, proceeding anyway');
    return false;
}

/**
 * Initialize AI Monitor module
 */
async function init(container) {
    try {
        console.log('🤖 AI Monitor - Initializing module...');
        
        // Initialize API
        await initializeAPI();
        
        // Check if server is ready before making requests
        await waitForServerReady();
        
        // Render main interface
        renderMainInterface(container);
        
        // Load initial data sequentially to avoid server overload
        // Quick metrics first (usually fastest)
        await loadQuickMetrics();
        
        // Give server a moment to process
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Load courses data
        await loadCoursesWithMissingPlans();
        
        // Give server another moment before the complex query
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Load orphan activities (most complex query)
        await loadOrphanActivities();

        console.log('✅ AI Monitor - Module initialized successfully');
        
        // Dispatch module loaded event
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: 'ai-monitor' });
        }
        
    } catch (error) {
        console.error('🤖 AI Monitor - Critical error during initialization:', error);
        if (window.app) {
            window.app.handleError(error, 'ai-monitor:init');
        }
        throw error;
    }
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
    elements = {
        container: document.getElementById('ai-monitor-container'),
        quickMetrics: document.getElementById('quick-metrics'),
        missingPlansSection: document.getElementById('missing-plans-section'),
        orphanActivitiesSection: document.getElementById('orphan-activities-section'),
        loadingSpinner: document.getElementById('loading-spinner')
    };
}

/**
 * Load quick metrics data
 */
async function loadQuickMetrics() {
    try {
        console.log('🤖 AI Monitor - Loading quick metrics...');
        
        await aiMonitorAPI.fetchWithStates('/api/ai-monitor/metrics/quick', {
            loadingElement: elements.quickMetrics,
            onSuccess: (data) => {
                state.metrics = data;
                renderQuickMetrics(data);
                console.log('🤖 AI Monitor - Quick metrics loaded:', data);
            },
            onEmpty: () => {
                elements.quickMetrics.innerHTML = `
                    <div class="empty-state">
                        <p>Nenhuma métrica disponível</p>
                    </div>
                `;
            },
            onError: (error) => {
                console.error('🤖 AI Monitor - Error loading metrics:', error);
                window.app.handleError(error, 'AI Monitor - Load Quick Metrics');
            }
        });
    } catch (error) {
        console.error('🤖 AI Monitor - Critical error in loadQuickMetrics:', error);
        window.app.handleError(error, 'AI Monitor - Load Quick Metrics');
    }
}

/**
 * Load courses with missing plans
 */
async function loadCoursesWithMissingPlans() {
    try {
        console.log('🤖 AI Monitor - Loading courses with missing plans...');
        
        await aiMonitorAPI.fetchWithStates('/api/ai-monitor/courses/missing-plans', {
            loadingElement: elements.missingPlansSection,
            onSuccess: (data) => {
                state.missingPlans = data;
                renderMissingPlans(data);
                console.log('🤖 AI Monitor - Missing plans loaded:', data);
            },
            onEmpty: () => {
                elements.missingPlansSection.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">✅</div>
                        <h3>Todos os cursos têm planos!</h3>
                        <p>Parabéns! Todos os cursos possuem planos de aula adequados.</p>
                    </div>
                `;
            },
            onError: (error) => {
                console.error('🤖 AI Monitor - Error loading missing plans:', error);
                window.app.handleError(error, 'AI Monitor - Load Missing Plans');
            }
        });
    } catch (error) {
        console.error('🤖 AI Monitor - Critical error in loadCoursesWithMissingPlans:', error);
        window.app.handleError(error, 'AI Monitor - Load Missing Plans');
    }
}

/**
 * Load orphan activities
 */
async function loadOrphanActivities() {
    try {
        console.log('🤖 AI Monitor - Loading orphan activities...');
        
        await aiMonitorAPI.fetchWithStates('/api/ai-monitor/activities/orphan', {
            loadingElement: elements.orphanActivitiesSection,
            onSuccess: (data) => {
                state.orphanActivities = data;
                renderOrphanActivities(data);
                console.log('🤖 AI Monitor - Orphan activities loaded:', data);
            },
            onEmpty: () => {
                elements.orphanActivitiesSection.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🎯</div>
                        <h3>Todas as atividades estão vinculadas!</h3>
                        <p>Excelente! Todas as atividades estão devidamente associadas a planos de aula.</p>
                    </div>
                `;
            },
            onError: (error) => {
                console.error('🤖 AI Monitor - Error loading orphan activities:', error);
                window.app.handleError(error, 'AI Monitor - Load Orphan Activities');
            }
        });
    } catch (error) {
        console.error('🤖 AI Monitor - Critical error in loadOrphanActivities:', error);
        window.app.handleError(error, 'AI Monitor - Load Orphan Activities');
    }
}

/**
 * Render quick metrics cards with enhanced UX and AI insights
 */
function renderQuickMetrics(metrics) {
    const { courses, plans, activities, orphanActivities, plansCoverage } = metrics;
    
    // Calculate AI-powered insights
    const insights = generateMetricsInsights(metrics);
    
    elements.quickMetrics.innerHTML = `
        <!-- AI Insights Summary -->
        <div class="ai-insights-banner ${insights.priority}">
            <div class="insights-icon">${insights.icon}</div>
            <div class="insights-content">
                <h3>${insights.title}</h3>
                <p>${insights.message}</p>
                ${insights.action ? `<button class="btn btn-sm btn-primary" onclick="${insights.action}">${insights.actionText}</button>` : ''}
            </div>
        </div>

        <!-- Enhanced Stats Grid -->
        <div class="stats-grid-enhanced">
            <div class="stat-card-ai" data-metric="courses" data-trend="${calculateTrend(courses, 'courses')}">
                <div class="stat-header">
                    <div class="stat-icon">🎓</div>
                    <div class="stat-trend ${getTrendClass(courses, 'courses')}">
                        ${getTrendIcon(courses, 'courses')}
                    </div>
                </div>
                <div class="stat-body">
                    <div class="stat-number" data-count="${courses}">${courses}</div>
                    <div class="stat-label">Cursos Ativos</div>
                    <div class="stat-sublabel">${getCoursesSubtext(courses)}</div>
                </div>
                <div class="stat-footer">
                    <button class="stat-action" onclick="navigateTo('courses')">
                        <span>Ver detalhes</span>
                        <i class="arrow">→</i>
                    </button>
                </div>
            </div>
            
            <div class="stat-card-ai" data-metric="plans" data-trend="${calculateTrend(plans, 'plans')}">
                <div class="stat-header">
                    <div class="stat-icon">📚</div>
                    <div class="stat-trend ${getTrendClass(plans, 'plans')}">
                        ${getTrendIcon(plans, 'plans')}
                    </div>
                </div>
                <div class="stat-body">
                    <div class="stat-number" data-count="${plans}">${plans}</div>
                    <div class="stat-label">Planos de Aula</div>
                    <div class="stat-sublabel">${getPlansSubtext(plans, courses)}</div>
                </div>
                <div class="stat-footer">
                    <button class="stat-action" onclick="navigateTo('lesson-plans')">
                        <span>Gerenciar</span>
                        <i class="arrow">→</i>
                    </button>
                </div>
            </div>
            
            <div class="stat-card-ai" data-metric="activities" data-trend="${calculateTrend(activities, 'activities')}">
                <div class="stat-header">
                    <div class="stat-icon">🏃</div>
                    <div class="stat-trend ${getTrendClass(activities, 'activities')}">
                        ${getTrendIcon(activities, 'activities')}
                    </div>
                </div>
                <div class="stat-body">
                    <div class="stat-number" data-count="${activities}">${activities}</div>
                    <div class="stat-label">Atividades</div>
                    <div class="stat-sublabel">${getActivitiesSubtext(activities)}</div>
                </div>
                <div class="stat-footer">
                    <button class="stat-action" onclick="navigateTo('activities')">
                        <span>Explorar</span>
                        <i class="arrow">→</i>
                    </button>
                </div>
            </div>
            
            <div class="stat-card-ai alert-card" data-metric="orphan-activities" data-severity="${getOrphanSeverity(orphanActivities)}">
                <div class="stat-header">
                    <div class="stat-icon">⚠️</div>
                    <div class="alert-badge ${getOrphanSeverity(orphanActivities)}">
                        ${getOrphanBadgeText(orphanActivities)}
                    </div>
                </div>
                <div class="stat-body">
                    <div class="stat-number" data-count="${orphanActivities}">${orphanActivities}</div>
                    <div class="stat-label">Atividades Órfãs</div>
                    <div class="stat-sublabel">${getOrphanSubtext(orphanActivities)}</div>
                </div>
                <div class="stat-footer">
                    ${orphanActivities > 0 ? `
                        <button class="stat-action alert-action" onclick="aiMonitorModule.fixOrphanActivities()">
                            <span>🤖 Resolver com IA</span>
                            <i class="arrow">→</i>
                        </button>
                    ` : `
                        <div class="stat-success">✅ Tudo organizado!</div>
                    `}
                </div>
            </div>
            
            <div class="stat-card-ai coverage-card" data-coverage="${plansCoverage}" data-quality="${getCoverageQuality(plansCoverage)}">
                <div class="stat-header">
                    <div class="stat-icon">📊</div>
                    <div class="coverage-quality ${getCoverageQuality(plansCoverage)}">
                        ${getCoverageQualityText(plansCoverage)}
                    </div>
                </div>
                <div class="stat-body">
                    <div class="stat-number coverage-percentage">${plansCoverage}%</div>
                    <div class="stat-label">Cobertura de Planos</div>
                    <div class="coverage-bar-advanced">
                        <div class="coverage-fill ${getCoverageQuality(plansCoverage)}" 
                             style="width: ${plansCoverage}%"
                             data-percentage="${plansCoverage}">
                        </div>
                        <div class="coverage-target" style="left: 80%"></div>
                    </div>
                </div>
                <div class="stat-footer">
                    ${plansCoverage < 80 ? `
                        <button class="stat-action" onclick="aiMonitorModule.improveCorverage()">
                            <span>🎯 Melhorar cobertura</span>
                            <i class="arrow">→</i>
                        </button>
                    ` : `
                        <div class="stat-success">🏆 Meta atingida!</div>
                    `}
                </div>
            </div>

            <!-- AI Recommendations Card -->
            <div class="stat-card-ai ai-recommendations-card">
                <div class="stat-header">
                    <div class="stat-icon">🧠</div>
                    <div class="ai-badge">AI</div>
                </div>
                <div class="stat-body">
                    <div class="stat-number">${getRecommendationsCount(metrics)}</div>
                    <div class="stat-label">Recomendações IA</div>
                    <div class="stat-sublabel">Baseadas em análise preditiva</div>
                </div>
                <div class="stat-footer">
                    <button class="stat-action ai-action" onclick="aiMonitorModule.showAIRecommendations()">
                        <span>🔮 Ver insights</span>
                        <i class="arrow">→</i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Animate numbers
    animateNumbers();
}

/**
 * Render missing plans section
 */
function renderMissingPlans(courses) {
    if (!courses || courses.length === 0) {
        elements.missingPlansSection.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>Todos os cursos têm planos!</h3>
                <p>Parabéns! Todos os cursos possuem planos de aula adequados.</p>
            </div>
        `;
        return;
    }

    const coursesHtml = courses.map(course => `
        <div class="data-card-premium course-missing-plans" data-course-id="${course.courseId}">
            <div class="course-header">
                <div class="course-info">
                    <h4>${course.courseName}</h4>
                    <div class="course-stats">
                        <span class="stat-item">
                            <span class="stat-icon">📝</span>
                            ${course.totalClassesPlanned} aulas planejadas
                        </span>
                        <span class="stat-item">
                            <span class="stat-icon">📚</span>
                            ${course.lessonPlansCount} planos existentes
                        </span>
                    </div>
                </div>
                <div class="course-coverage">
                    <div class="coverage-percentage">${course.plansCoverage}%</div>
                    <div class="coverage-bar-small">
                        <div class="coverage-fill" style="width: ${course.plansCoverage}%"></div>
                    </div>
                </div>
            </div>
            <div class="course-actions">
                <span class="missing-estimate">~${course.missingPlansEstimate} planos faltando</span>
                <button class="btn btn-primary" onclick="aiMonitorModule.generateMissingPlans('${course.courseId}')">
                    <i class="icon">🤖</i>
                    Gerar Planos com IA
                </button>
            </div>
        </div>
    `).join('');

    elements.missingPlansSection.innerHTML = `
        <div class="section-header">
            <h3>
                <span class="section-icon">⚠️</span>
                Cursos com Planos Incompletos
            </h3>
            <p class="section-description">
                Cursos que precisam de mais planos de aula para cobertura completa
            </p>
        </div>
        <div class="courses-grid">
            ${coursesHtml}
        </div>
    `;
}

/**
 * Render orphan activities section
 */
function renderOrphanActivities(activities) {
    if (!activities || activities.length === 0) {
        elements.orphanActivitiesSection.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>Todas as atividades estão vinculadas!</h3>
                <p>Excelente! Todas as atividades estão devidamente associadas a planos de aula.</p>
            </div>
        `;
        return;
    }

    // Show first 20 activities, with pagination if needed
    const displayActivities = activities.slice(0, 20);
    const hasMore = activities.length > 20;

    const activitiesHtml = displayActivities.map(activity => `
        <div class="data-card-premium orphan-activity" data-activity-id="${activity.activityId}">
            <div class="activity-header">
                <div class="activity-info">
                    <h4>${activity.activityName}</h4>
                    <div class="activity-meta">
                        <span class="activity-type">${activity.activityType}</span>
                        <span class="activity-category">${activity.category}</span>
                    </div>
                </div>
                <div class="activity-actions">
                    <button class="btn btn-outline" onclick="aiMonitorModule.suggestCourse('${activity.activityId}')">
                        <i class="icon">🎯</i>
                        Sugerir Curso
                    </button>
                    <button class="btn btn-primary" onclick="aiMonitorModule.assignToPlan('${activity.activityId}')">
                        <i class="icon">📚</i>
                        Atribuir a Plano
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    elements.orphanActivitiesSection.innerHTML = `
        <div class="section-header">
            <h3>
                <span class="section-icon">🔍</span>
                Atividades Órfãs
                <span class="section-count">(${activities.length})</span>
            </h3>
            <p class="section-description">
                Atividades não associadas a nenhum plano de aula
            </p>
        </div>
        <div class="activities-grid">
            ${activitiesHtml}
        </div>
        ${hasMore ? `
            <div class="load-more-section">
                <button class="btn btn-outline" onclick="aiMonitorModule.loadMoreOrphanActivities()">
                    Carregar mais ${activities.length - 20} atividades
                </button>
            </div>
        ` : ''}
    `;
}

/**
 * Generate missing plans with AI
 */
async function generateMissingPlans(courseId) {
    try {
        console.log('🤖 AI Monitor - Generating missing plans for course:', courseId);
        
        // Find course data
        const course = state.missingPlans.find(c => c.courseId === courseId);
        if (!course) {
            throw new Error('Curso não encontrado');
        }

        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<div class="loading-spinner-small"></div> Gerando...';
        button.disabled = true;

        // Call AI generation endpoint
        const response = await aiMonitorAPI.request(`/api/ai-monitor/generate-plans/${courseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.success) {
            // Show success message
            window.app.showNotification('success', `${response.data.plansGenerated} planos gerados com sucesso!`);
            
            // Refresh data
            await loadQuickMetrics();
            await loadCoursesWithMissingPlans();
        } else {
            throw new Error(response.message || 'Erro ao gerar planos');
        }

    } catch (error) {
        console.error('🤖 AI Monitor - Error generating plans:', error);
        window.app.handleError(error, 'AI Monitor - Generate Plans');
    } finally {
        // Restore button
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

/**
 * Suggest course for orphan activity
 */
async function suggestCourse(activityId) {
    try {
        console.log('🤖 AI Monitor - Suggesting course for activity:', activityId);
        
        const response = await aiMonitorAPI.request(`/api/ai-monitor/suggest-course/${activityId}`, {
            method: 'POST'
        });

        if (response.success) {
            const suggestions = response.data.suggestions;
            
            // Show suggestion modal (implement later)
            window.app.showNotification('info', `${suggestions.length} sugestões encontradas`);
        } else {
            throw new Error(response.message || 'Erro ao buscar sugestões');
        }

    } catch (error) {
        console.error('🤖 AI Monitor - Error suggesting course:', error);
        window.app.handleError(error, 'AI Monitor - Suggest Course');
    }
}

/**
 * Assign activity to plan
 */
async function assignToPlan(activityId) {
    try {
        console.log('🤖 AI Monitor - Assigning activity to plan:', activityId);
        
        // For now, just show a notification - implement plan selection later
        window.app.showNotification('info', 'Funcionalidade de atribuição será implementada em breve');
        
    } catch (error) {
        console.error('🤖 AI Monitor - Error assigning to plan:', error);
        window.app.handleError(error, 'AI Monitor - Assign To Plan');
    }
}

/**
 * Load more orphan activities
 */
function loadMoreOrphanActivities() {
    // For now, just render all activities - implement pagination later
    renderOrphanActivities(state.orphanActivities);
}

/**
 * Render main AI Monitor interface
 */
function renderMainInterface(container) {
    // Use provided container or fallback to module-container
    const targetContainer = container || document.getElementById('module-container') || document.getElementById('main-content');
    
    if (!targetContainer) {
        console.error('🤖 AI Monitor - No container found for rendering');
        return;
    }
    
    targetContainer.innerHTML = `
        <div class="module-isolated-ai-monitor">
            <!-- Header Premium -->
            <div class="module-header-premium">
                <div class="header-content">
                    <div class="header-title">
                        <div class="title-icon">🤖</div>
                        <div class="title-text">
                            <h1>AI Monitor</h1>
                            <p class="subtitle">Monitoramento Inteligente de Planos de Aula</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="aiMonitorModule.refreshData()">
                            <i class="icon">🔄</i>
                            Atualizar
                        </button>
                    </div>
                </div>
                
                <!-- Breadcrumb -->
                <div class="breadcrumb">
                    <a href="#dashboard">Dashboard</a>
                    <span class="breadcrumb-separator">›</span>
                    <span class="breadcrumb-current">AI Monitor</span>
                </div>
            </div>

            <!-- Quick Metrics -->
            <div class="content-section">
                <div id="quick-metrics" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando métricas...</p>
                </div>
            </div>

            <!-- Missing Plans Section -->
            <div class="content-section">
                <div id="missing-plans-section" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando cursos com planos incompletos...</p>
                </div>
            </div>

            <!-- Orphan Activities Section -->
            <div class="content-section">
                <div id="orphan-activities-section" class="loading">
                    <div class="loading-spinner"></div>
                    <p>Carregando atividades órfãs...</p>
                </div>
            </div>
        </div>
    `;

    // Cache elements after rendering
    cacheElements();
}

/**
 * Generate AI-powered insights from metrics
 */
function generateMetricsInsights(metrics) {
    const { courses, plans, activities, orphanActivities, plansCoverage } = metrics;
    
    // Critical issues first
    if (orphanActivities > 5) {
        return {
            priority: 'critical',
            icon: '🚨',
            title: 'Atenção: Muitas atividades órfãs',
            message: `${orphanActivities} atividades precisam ser organizadas para melhorar a qualidade dos planos.`,
            action: 'aiMonitorModule.fixOrphanActivities()',
            actionText: '🤖 Resolver automaticamente'
        };
    }
    
    if (plansCoverage < 50) {
        return {
            priority: 'warning',
            icon: '⚠️',
            title: 'Cobertura de planos insuficiente',
            message: `Com apenas ${plansCoverage}% de cobertura, recomendamos gerar mais planos para seus cursos.`,
            action: 'aiMonitorModule.generateAllMissingPlans()',
            actionText: '📚 Gerar planos em lote'
        };
    }
    
    // Opportunities
    if (plansCoverage >= 80 && orphanActivities === 0) {
        return {
            priority: 'success',
            icon: '🎉',
            title: 'Excelente organização!',
            message: 'Seus planos estão bem estruturados. Continue mantendo essa qualidade.',
            action: null,
            actionText: null
        };
    }
    
    // Default insight
    return {
        priority: 'info',
        icon: '💡',
        title: 'Oportunidades de melhoria',
        message: 'A IA identificou algumas otimizações possíveis em seus planos de aula.',
        action: 'aiMonitorModule.analyzeOptimizations()',
        actionText: '🔍 Ver análise completa'
    };
}

/**
 * AI helper functions for enhanced UX
 */
function calculateTrend(value, type) {
    // Simulate trend calculation - in real implementation, compare with historical data
    const trends = {
        courses: Math.random() > 0.5 ? 'up' : 'stable',
        plans: Math.random() > 0.3 ? 'up' : 'down',
        activities: 'up'
    };
    return trends[type] || 'stable';
}

function getTrendClass(value, type) {
    const trend = calculateTrend(value, type);
    return `trend-${trend}`;
}

function getTrendIcon(value, type) {
    const trend = calculateTrend(value, type);
    const icons = { up: '📈', down: '📉', stable: '➖' };
    return icons[trend];
}

function getCoursesSubtext(courses) {
    if (courses === 0) return 'Nenhum curso configurado';
    if (courses === 1) return 'Pronto para expansão';
    return `${courses > 3 ? 'Portfolio diversificado' : 'Base sólida estabelecida'}`;
}

function getPlansSubtext(plans, courses) {
    if (plans === 0) return 'Nenhum plano criado';
    const ratio = courses > 0 ? (plans / courses).toFixed(1) : 0;
    return `Média de ${ratio} planos por curso`;
}

function getActivitiesSubtext(activities) {
    if (activities === 0) return 'Banco de atividades vazio';
    if (activities < 10) return 'Coleção iniciante';
    if (activities < 50) return 'Boa variedade disponível';
    return 'Rico banco de atividades';
}

function getOrphanSeverity(count) {
    if (count === 0) return 'success';
    if (count <= 3) return 'warning';
    return 'critical';
}

function getOrphanBadgeText(count) {
    if (count === 0) return 'OK';
    if (count <= 3) return 'ALERTA';
    return 'CRÍTICO';
}

function getOrphanSubtext(count) {
    if (count === 0) return 'Todas organizadas';
    if (count === 1) return '1 atividade precisa de curso';
    return `${count} atividades desorganizadas`;
}

function getCoverageQuality(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'fair';
    return 'poor';
}

function getCoverageQualityText(percentage) {
    if (percentage >= 90) return 'EXCELENTE';
    if (percentage >= 80) return 'BOM';
    if (percentage >= 60) return 'REGULAR';
    return 'BAIXO';
}

function getRecommendationsCount(metrics) {
    let count = 0;
    if (metrics.orphanActivities > 0) count++;
    if (metrics.plansCoverage < 80) count++;
    if (metrics.plans === 0) count++;
    return Math.max(count, 1); // Always show at least 1
}

/**
 * Animate numbers with counting effect
 */
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number[data-count]');
    numbers.forEach(element => {
        const target = parseInt(element.getAttribute('data-count'));
        let current = 0;
        const increment = target / 20;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 50);
    });
}

/**
 * AI-powered action handlers
 */
async function fixOrphanActivities() {
    try {
        console.log('🤖 AI Monitor - Auto-fixing orphan activities...');
        
        window.app.showNotification('info', '🤖 IA analisando atividades órfãs...');
        
        const response = await aiMonitorAPI.request('/api/ai-monitor/auto-fix-orphans', {
            method: 'POST'
        });

        if (response.success) {
            window.app.showNotification('success', `✅ ${response.data.fixed} atividades organizadas automaticamente!`);
            await refreshData();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('🤖 AI Monitor - Error fixing orphans:', error);
        window.app.handleError(error, 'AI Monitor - Fix Orphans');
    }
}

async function generateAllMissingPlans() {
    try {
        console.log('🤖 AI Monitor - Generating all missing plans...');
        
        window.app.showNotification('info', '🤖 Gerando planos em lote...');
        
        const response = await aiMonitorAPI.request('/api/ai-monitor/generate-all-plans', {
            method: 'POST'
        });

        if (response.success) {
            window.app.showNotification('success', `✅ ${response.data.generated} planos gerados com sucesso!`);
            await refreshData();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('🤖 AI Monitor - Error generating plans:', error);
        window.app.handleError(error, 'AI Monitor - Generate All Plans');
    }
}

async function showAIRecommendations() {
    try {
        console.log('🤖 AI Monitor - Loading AI recommendations...');
        
        const response = await aiMonitorAPI.request('/api/ai-monitor/recommendations');
        
        if (response.success) {
            renderAIRecommendations(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('🤖 AI Monitor - Error loading recommendations:', error);
        window.app.handleError(error, 'AI Monitor - AI Recommendations');
    }
}

function renderAIRecommendations(recommendations) {
    // Show recommendations in a dedicated section
    window.app.showNotification('info', `🧠 ${recommendations.length} recomendações disponíveis`);
}

/**
 * Navigation helper
 */
function navigateTo(module) {
    if (window.app && window.app.navigateToModule) {
        window.app.navigateToModule(module);
    } else {
        window.location.hash = `#${module}`;
    }
}

/**
 * Refresh all data
 */
async function refreshData() {
    console.log('🤖 AI Monitor - Refreshing all data...');
    
    try {
        await Promise.all([
            loadQuickMetrics(),
            loadCoursesWithMissingPlans(),
            loadOrphanActivities()
        ]);
        
        window.app.showNotification('success', 'Dados atualizados com sucesso!');
    } catch (error) {
        console.error('🤖 AI Monitor - Error refreshing data:', error);
        window.app.handleError(error, 'AI Monitor - Refresh Data');
    }
}

// Public API - Export module functions
const aiMonitorModule = {
    init,
    refreshData,
    generateMissingPlans,
    suggestCourse,
    assignToPlan,
    loadMoreOrphanActivities,
    fixOrphanActivities,
    generateAllMissingPlans,
    showAIRecommendations,
    analyzeOptimizations: () => window.app.showNotification('info', '🔍 Análise de otimizações em desenvolvimento'),
    improveCorverage: () => window.app.showNotification('info', '🎯 Ferramenta de melhoria de cobertura em breve')
};

// Expose globally for onclick handlers
window.aiMonitorModule = aiMonitorModule;

// Export init function for SPA integration
window.initAIMonitorModule = init;

// Auto-initialize when DOM is ready (DISABLED - only manual SPA initialization)
/*
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only auto-init if not being used in SPA mode
        if (!window.location.hash.includes('ai-monitor')) {
            // Longer delay to ensure server is fully ready
            setTimeout(() => init(), 1500);
        }
    });
} else {
    // DOM already loaded
    if (!window.location.hash.includes('ai-monitor')) {
        // Longer delay to ensure server is fully ready
        setTimeout(() => init(), 1500);
    }
}
*/

console.log('🤖 AI Monitor - Module loaded and ready');
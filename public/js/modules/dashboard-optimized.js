(function () {
    // Global module navigation handler
    window.navigateToModule = function (moduleName, params) {
        const contentContainer = document.getElementById('contentContainer');
        if (!contentContainer) return;

        // expose params to the destination module (transient)
        try {
            if (params && typeof params === 'object') {
                window.__MODULE_NAV_PARAMS = { module: moduleName, ...(params || {}) };
                if (moduleName === 'student-editor') window.__STUDENT_EDITOR_PARAMS = { ...(params || {}) };
                window.__NAV_PARAMS = { module: moduleName, ...(params || {}) };
            }
        } catch (e) { console.warn('navigateToModule: could not set params', e); }

        let viewPath = '';
        let scriptPath = '';
        let forceModuleType = false;

        switch (moduleName) {
            case 'students':
                viewPath = '/views/students.html';
                scriptPath = '/js/modules/students/index.js';
                break;
            case 'student-editor':
                viewPath = '/views/student-editor.html';
                scriptPath = '/js/modules/students/student-editor/student-editor.js';
                forceModuleType = true; // ES module with exports/imports
                break;
            case 'plans':
                viewPath = '/views/plans.html';
                scriptPath = '/js/modules/plans.js';
                break;
            case 'courses':
                viewPath = '/modules/courses/courses.html';
                scriptPath = '/js/modules/courses/index.js';
                break;
            case 'course-editor':
                viewPath = '/modules/courses/course-editor.html';
                scriptPath = '/js/modules/courses/controllers/courseFormController.js';
                break;
            case 'knowledge-base':
                viewPath = '/views/knowledge-base.html';
                scriptPath = '/js/modules/knowledge-base.js';
                break;
            case 'classes':
                viewPath = '/views/classes.html';
                scriptPath = '/js/modules/classes.js';
                break;
            case 'evaluations':
                viewPath = '/views/evaluations.html';
                scriptPath = '/js/modules/evaluations.js';
                break;
            case 'progress':
                viewPath = '/views/progress.html';
                scriptPath = '/js/modules/progress.js';
                break;
            case 'financial':
                viewPath = '/views/financial.html';
                scriptPath = '/js/modules/financial.js';
                break;
            case 'financial-responsibles':
                viewPath = '/views/financial-responsibles.html';
                scriptPath = '/js/modules/financial-responsibles.js';
                break;
            case 'course-importer':
                viewPath = '/views/course-importer.html';
                scriptPath = '/js/modules/course-importer.js';
                break;
            case 'techniques':
                viewPath = '/modules/techniques/techniques.html';
                scriptPath = '/modules/techniques/techniques.js';
                forceModuleType = true; // ES module
                break;
            case 'martial-arts':
                viewPath = '/views/martial-arts.html';
                scriptPath = '/js/modules/martial-arts.js';
                break;
            case 'graduations':
                viewPath = '/views/graduations.html';
                scriptPath = '/js/modules/graduations.js';
                break;
            case 'belt-system':
                viewPath = '/views/belt-system.html';
                scriptPath = '/js/modules/belt-system.js';
                break;
            case 'activities':
                viewPath = '/views/modules/activities.html';
                scriptPath = '/js/modules/activities.js';
                forceModuleType = true; // ES module
                break;
            case 'units':
                viewPath = '/views/units.html';
                scriptPath = '/js/modules/units.js';
                break;
            case 'mats':
                viewPath = '/views/mats.html';
                scriptPath = '/js/modules/mats.js';
                break;
            case 'instructors':
                viewPath = '/views/instructors.html';
                scriptPath = '/js/modules/instructors.js';
                break;
            case 'challenges':
                viewPath = '/views/challenges.html';
                scriptPath = '/js/modules/challenges.js';
                break;
            case 'attendance':
                viewPath = '/views/attendance.html';
                scriptPath = '/js/modules/attendance.js';
                break;
            case 'settings':
                viewPath = '/views/settings.html';
                scriptPath = '/js/modules/settings.js';
                break;
            case 'martial-arts-config':
                viewPath = '/views/martial-arts-config.html';
                scriptPath = '/js/config/martial-arts-config.js';
                break;
            case 'organizations':
                viewPath = '/views/organizations.html';
                scriptPath = '/js/modules/organizations.js';
                break;
            case 'lesson-plans':
                viewPath = '/views/lesson-plans.html';
                scriptPath = '/js/modules/lesson-plans.js';
                break;
            case 'plan-editor':
                viewPath = '/views/plan-editor.html';
                scriptPath = '/js/modules/plan-editor.js';
                break;
            default:
                console.error('❌ Unknown module:', moduleName);
                contentContainer.innerHTML = `<div class="error">Módulo desconhecido: ${moduleName}</div>`;
                return;
        }

        // Load HTML
        console.log('navigateToModule ->', moduleName);
        fetch(viewPath)
            .then(response => {
                if (!response.ok) {
                    console.error('Failed to fetch view', viewPath, 'status=', response.status);
                    throw new Error('View fetch failed: ' + response.status);
                }
                return response.text();
            })
            .then(html => {
                contentContainer.innerHTML = html;
                // Load JS
                if (scriptPath) {
                    console.log('Loading script for module', moduleName, { viewPath, scriptPath });
                    const script = document.createElement('script');
                    script.src = scriptPath;
                    script.defer = true;
                    if (forceModuleType || scriptPath.includes('/modules/')) {
                        script.type = 'module';
                    }
                    script.onload = () => {
                        console.log('Module script loaded:', scriptPath);
                        if (moduleName === 'student-editor') {
                            // try to initialize editor
                            setTimeout(() => {
                                if (typeof window.initializeStudentEditor === 'function') {
                                    window.initializeStudentEditor();
                                } else {
                                    console.warn('student-editor script loaded, but initializeStudentEditor not found');
                                }
                            }, 50);
                        }
                    };
                    script.onerror = (e) => {
                        console.error('Error loading module script:', scriptPath, e);
                        try {
                            console.warn('Falling back to full-page view for debugging:', viewPath);
                            window.location.href = viewPath;
                        } catch (err) {
                            console.error('Fallback navigation failed', err);
                        }
                    };
                    document.body.appendChild(script);
                }
            })
            .catch(err => {
                console.error('Erro ao carregar view:', viewPath, err);
                contentContainer.innerHTML = `<div class=\"error\">Erro ao carregar módulo: ${moduleName}</div>`;
            });
    };
    'use strict';

    console.log('📊 Sistema de Gestão de Artes Marciais - Dashboard carregado');

    // Module state
    let dashboardData = {
        students: [],
        classes: [],
        attendance: [],
        // financial data removed - handled by separate module
        lastUpdated: null
    };

    // API availability state
    let apiAvailable = false;
    let lastApiCheck = null;
    const API_CHECK_INTERVAL = 30000; // 30 seconds

    let updateInterval = null;
    let isInitialized = false;

    // Initialize module on page load (robust)
    function bootstrapDashboard() {
        try { initializeDashboardModule(); } catch (e) { console.error('❌ bootstrapDashboard failed', e); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapDashboard);
    } else {
        // DOM already parsed
        bootstrapDashboard();
    }

    // Remove old single-use listener if present
    // document.addEventListener('DOMContentLoaded', function() { initializeDashboardModule(); });

    // Module initialization
    function initializeDashboardModule() {
        console.log('📊 Inicializando Sistema de Gestão de Artes Marciais...');

        if (isInitialized) {
            console.log('⚠️ Dashboard module already initialized');
            return;
        }

        try {
            renderDashboardStructure();
            setupEventListeners();
            loadDashboardData();
            exportGlobalFunctions();
            setupAutoRefresh();

            isInitialized = true;

        } catch (error) {
            console.error('❌ Error initializing dashboard module:', error);
        }
    }

    // Render complete dashboard structure
    function renderDashboardStructure() {
        const container = document.getElementById('dashboardContainer');
        if (!container) {
            console.error('Dashboard container not found');
            return;
        }

        // Inject CSS styles for dashboard
        injectDashboardStyles();

        container.innerHTML = `
            <!-- Enhanced Sidebar -->
            <aside class="dashboard-sidebar" id="dashboardSidebar">
                <div class="sidebar-section">
                    <div class="sidebar-title">Gestão Principal</div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <button class="nav-link active" data-page="dashboard" data-ai-enabled="true" onclick="showDashboard()">
                                    <span class="nav-icon">📊</span>
                                    Dashboard IA
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('students')" data-ai-enabled="true">
                                    <span class="nav-icon">👥</span>
                                    Gestão de Alunos
                                    <span class="badge success">INTEGRADO</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('plans')" data-ai-enabled="true">
                                    <span class="nav-icon">📋</span>
                                    Gestão de Planos
                                    <span class="badge success">INTEGRADO</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('classes')" data-ai-enabled="true">
                                    <span class="nav-icon">🏫</span>
                                    Gestão de Turmas
                                    <span class="badge success">INTEGRADO</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('organizations')" data-ai-enabled="true">
                                    <span class="nav-icon">🏢</span>
                                    Organizações
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('evaluations')" data-ai-enabled="true">
                                    <span class="nav-icon">📝</span>
                                    Avaliações
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('progress')">
                                    <span class="nav-icon">📈</span>
                                    Progresso
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('financial')" data-ai-enabled="false">
                                    <span class="nav-icon">💰</span>
                                    Gestão Financeira
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('financial-responsibles')" data-ai-enabled="false">
                                    <span class="nav-icon">👨‍👩‍👧‍👦</span>
                                    Responsáveis
                                    <span class="badge info" id="responsibles-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('plans')">
                                    <span class="nav-icon">📄</span>
                                    Planos da Academia
                                    <span class="badge info" id="plans-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('courses')" data-ai-enabled="true">
                                    <span class="nav-icon">📚</span>
                                    Cursos
                                    <span class="badge info" id="courses-count">0</span>
                                </button>
                            </li>
                           <li class="nav-item">
                               <button class="nav-link" onclick="navigateToModule('lesson-plans')" data-ai-enabled="true">
                                   <span class="nav-icon">📖</span>
                                   Planos de Aula
                                   <span class="badge info" id="lesson-plans-count">0</span>
                               </button>
                           </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('course-importer')" data-ai-enabled="true">
                                    <span class="nav-icon">📄</span>
                                    Importador PDF
                                    <span class="badge success">IA</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('activities')" data-ai-enabled="true">
                                    <span class="nav-icon">📅</span>
                                    Atividades
                                    <span class="badge success">NOVO</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title">Modalidades & Técnicas</div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('techniques')" data-ai-enabled="true">
                                    <span class="nav-icon">⚔️</span>
                                    Técnicas
                                    <span class="badge success">IA</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('martial-arts')" data-ai-enabled="true">
                                    <span class="nav-icon">🥋</span>
                                    Modalidades
                                    <span class="badge info" id="martial-arts-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('graduations')" data-ai-enabled="true">
                                    <span class="nav-icon">🏅</span>
                                    Graduações
                                    <span class="badge info" id="graduations-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('belt-system')" data-ai-enabled="true">
                                    <span class="nav-icon">🎗️</span>
                                    Sistema de Faixas
                                    <span class="badge warning">NOVO</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title">Infraestrutura</div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('units')" data-ai-enabled="false">
                                    <span class="nav-icon">🏢</span>
                                    Unidades
                                    <span class="badge info" id="units-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('mats')" data-ai-enabled="false">
                                    <span class="nav-icon">🥋</span>
                                    Tatames
                                    <span class="badge info" id="mats-count">0</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('instructors')" data-ai-enabled="false">
                                    <span class="nav-icon">👨‍🏫</span>
                                    Professores
                                    <span class="badge info" id="instructors-count">0</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title">Agentes IA</div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <button class="nav-link" data-page="course-creator" data-ai-enabled="true">
                                    <span class="nav-icon">🎓</span>
                                    Course Creator
                                    <span class="badge ai-powered">AI</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('knowledge-base')" data-ai-enabled="true">
                                    <span class="nav-icon">🧠</span>
                                    Base RAG
                                    <span class="badge success">RAG</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('challenges')" data-ai-enabled="true">
                                    <span class="nav-icon">🏆</span>
                                    Desafios
                                    <span class="badge warning">NOVO</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title">Ferramentas</div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('attendance')">
                                    <span class="nav-icon">📟</span>
                                    Frequência
                                    <span class="badge warning">NOVO</span>
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('settings')">
                                    <span class="nav-icon">⚙️</span>
                                    Configurações
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" onclick="navigateToModule('martial-arts-config')">
                                    <span class="nav-icon">🥋</span>
                                    Config. Modalidades
                                    <span class="badge success">NOVO</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            <!-- Enhanced Main Content -->
            <main class="dashboard-main" id="dashboardMain">
                <!-- Enhanced Header -->
                <header class="dashboard-header">
                    <div class="header-left">
                        <div class="header-title">
                            <span>🥋</span>
                            Academia de Artes Marciais
                        </div>
                        <div class="header-ai-status">
                            <span>🤖</span>
                            5 Agentes Ativos
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="quick-action-btn" onclick="toggleSidebar()">
                            ☰ Menu
                        </button>
                    </div>
                </header>

                <!-- Content Sections Container -->
                <div id="contentContainer">
                    <!-- Dashboard -->
                    <div id="dashboard" class="content-section active">
                        ${renderDashboardContent()}
                    </div>
                </div>
            </main>
        `;
    }

    // Render dashboard content
    function renderDashboardContent() {
        return `
            <!-- Quick Stats Overview -->
            <div class="dashboard-overview">
                <div class="stats-grid">
                    <div class="stat-card primary">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalStudents">0</div>
                            <div class="stat-label">Alunos Ativos</div>
                        </div>
                        <div class="stat-trend positive">
                            <span>API</span>
                        </div>
                    </div>
                    
                    <div class="stat-card success">
                        <div class="stat-icon">🏫</div>
                        <div class="stat-content">
                            <div class="stat-value" id="totalClasses">0</div>
                            <div class="stat-label">Turmas Ativas</div>
                        </div>
                        <div class="stat-trend positive">
                            <span>API</span>
                        </div>
                    </div>
                    
                    <div class="stat-card warning">
                        <div class="stat-icon">📊</div>
                        <div class="stat-content">
                            <div class="stat-value" id="attendanceRate">0%</div>
                            <div class="stat-label">Taxa de Presença</div>
                        </div>
                        <div class="stat-trend positive">
                            <span>API</span>
                        </div>
                    </div>
                    
                    <div class="stat-card info">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-value" id="monthlyRevenue">R$ 0</div>
                            <div class="stat-label">Receita Mensal</div>
                        </div>
                        <div class="stat-trend positive">
                            <span>API</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h3>Ações Rápidas</h3>
                <div class="action-buttons">
                    <button class="action-btn primary" onclick="navigateToModule('students')">
                        <span class="action-icon">➕</span>
                        <span>Novo Aluno</span>
                    </button>
                    <button class="action-btn success" onclick="navigateToModule('classes')">
                        <span class="action-icon">🏫</span>
                        <span>Nova Turma</span>
                    </button>
                    <button class="action-btn warning" onclick="navigateToModule('attendance')">
                        <span class="action-icon">📝</span>
                        <span>Marcar Presença</span>
                    </button>
                    <button class="action-btn info" onclick="navigateToModule('courses')">
                        <span class="action-icon">📚</span>
                        <span>Novo Curso</span>
                    </button>
                    <button class="action-btn secondary" onclick="navigateToModule('techniques')">
                        <span class="action-icon">⚔️</span>
                        <span>Nova Técnica</span>
                    </button>
                    <button class="action-btn success" onclick="navigateToModule('graduations')">
                        <span class="action-icon">🏅</span>
                        <span>Avaliar Graduação</span>
                    </button>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity">
                <h3>Atividade Recente</h3>
                <div class="activity-list" id="activityList">
                    <div class="activity-item">
                        <div class="activity-icon">📭</div>
                        <div class="activity-content">
                            <div class="activity-title">Nenhuma atividade recente</div>
                            <div class="activity-subtitle">Conecte-se à API para ver atividades</div>
                        </div>
                        <div class="activity-time">-</div>
                    </div>
                    
                </div>
            </div>

            <!-- Dashboard Charts -->
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3>Crescimento de Alunos</h3>
                    <div class="chart-placeholder" id="studentsChart">
                        <div class="chart-bars">
                            <div class="chart-bar" style="height: 30%">Jan</div>
                            <div class="chart-bar" style="height: 45%">Fev</div>
                            <div class="chart-bar" style="height: 60%">Mar</div>
                            <div class="chart-bar" style="height: 75%">Abr</div>
                            <div class="chart-bar" style="height: 85%">Mai</div>
                            <div class="chart-bar" style="height: 90%">Jun</div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>Frequência por Turma</h3>
                    <div class="chart-placeholder" id="attendanceChart">
                        <div class="chart-progress">
                            <div class="progress-item">
                                <span>Iniciantes</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 92%"></div>
                                </div>
                                <span>92%</span>
                            </div>
                            <div class="progress-item">
                                <span>Intermediário</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 88%"></div>
                                </div>
                                <span>88%</span>
                            </div>
                            <div class="progress-item">
                                <span>Avançado</span>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 95%"></div>
                                </div>
                                <span>95%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Sidebar toggle
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('quick-action-btn')) {
                toggleSidebar();
            }
        });

        // Navigation links
        document.addEventListener('click', function (e) {
            if (e.target.closest('.nav-link')) {
                const link = e.target.closest('.nav-link');
                const page = link.dataset.page;

                if (page && page !== 'dashboard') {
                    // Update active state
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Financial module removed - handled separately via navigateToModule('financial')
                }
            }
        });
    }

    // Toggle sidebar
    function toggleSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        if (!sidebar) return;

        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

        if (isMobile) {
            // Mobile behavior: slide in/out from left
            sidebar.classList.toggle('mobile-open');
            toggleMobileOverlay();
        } else if (isTablet) {
            // Tablet behavior: expand/collapse height
            sidebar.classList.toggle('expanded');
        } else {
            // Desktop behavior: narrow/wide
            sidebar.classList.toggle('collapsed');
        }
    }

    // Toggle mobile overlay
    function toggleMobileOverlay() {
        let overlay = document.getElementById('mobileOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobileOverlay';
            overlay.className = 'mobile-overlay';
            overlay.onclick = () => {
                const sidebar = document.getElementById('dashboardSidebar');
                if (sidebar) {
                    sidebar.classList.remove('mobile-open');
                    overlay.classList.remove('show');
                }
            };
            document.body.appendChild(overlay);
        }

        const sidebar = document.getElementById('dashboardSidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    // Handle window resize
    function handleResize() {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (window.innerWidth > 768) {
            // Remove mobile classes when switching to desktop/tablet
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }
            if (overlay) {
                overlay.classList.remove('show');
            }
        }
    }

    // Financial section removed - now handled by separate /views/financial.html module

    // Check API availability
    async function checkApiAvailability() {
        const now = Date.now();
        if (lastApiCheck && (now - lastApiCheck) < API_CHECK_INTERVAL) {
            return apiAvailable;
        }

        try {
            const response = await fetch('/health', {
                method: 'GET',
                timeout: 5000
            });
            apiAvailable = response.ok;
            lastApiCheck = now;
            return apiAvailable;
        } catch (error) {
            apiAvailable = false;
            lastApiCheck = now;
            return false;
        }
    }

    // Load dashboard data
    async function loadDashboardData() {
        const isApiAvailable = await checkApiAvailability();

        if (!isApiAvailable) {
            console.log('📡 API not available, using empty state');
            updateWithEmptyState();
            showOfflineIndicator();
            return;
        } else {
            hideOfflineIndicator();
        }

        try {
            await Promise.all([
                fetchStudentsCount(),
                fetchClassesCount(),
                fetchAttendanceRate(),
                fetchMonthlyRevenue()
            ]);

            updateLastRefresh();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show empty state when API fails
            updateWithEmptyState();
        }
    }

    // Fetch students count
    async function fetchStudentsCount() {
        if (!apiAvailable) {
            updateStat('totalStudents', 0);
            return;
        }

        try {
            const response = await fetch('/api/students');
            if (response.ok) {
                const data = await response.json();
                updateStat('totalStudents', data.data?.length || 0);
            } else {
                updateStat('totalStudents', 0);
            }
        } catch (error) {
            updateStat('totalStudents', 0);
        }
    }

    // Fetch classes count
    async function fetchClassesCount() {
        if (!apiAvailable) {
            updateStat('totalClasses', 0);
            return;
        }

        try {
            const response = await fetch('/api/classes');
            if (response.ok) {
                const data = await response.json();
                updateStat('totalClasses', data.data?.length || 0);
            } else {
                updateStat('totalClasses', 0);
            }
        } catch (error) {
            updateStat('totalClasses', 0);
        }
    }

    // Fetch attendance rate
    async function fetchAttendanceRate() {
        if (!apiAvailable) {
            updateStat('attendanceRate', '0%');
            return;
        }

        try {
            // Attendance endpoint not available, using mock calculation
            const studentsResponse = await fetch('/api/students');
            if (studentsResponse.ok) {
                const studentsData = await studentsResponse.json();
                const totalStudents = studentsData.data?.length || 0;
                const mockAttendanceRate = totalStudents > 0 ? Math.round(Math.random() * 30 + 70) : 0; // 70-100% mock rate
                updateStat('attendanceRate', mockAttendanceRate + '%');
            } else {
                updateStat('attendanceRate', '0%');
            }
        } catch (error) {
            updateStat('attendanceRate', '0%');
        }
    }

    // Fetch monthly revenue
    async function fetchMonthlyRevenue() {
        if (!apiAvailable) {
            updateStat('monthlyRevenue', 'R$ 0,00');
            return;
        }

        try {
            const response = await fetch('/api/financial/stats');
            if (response.ok) {
                const data = await response.json();
                const revenue = data.data?.monthlyRevenue || 0;
                // Format currency properlt
                const formatted = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(revenue);

                updateStat('monthlyRevenue', formatted);
            } else {
                updateStat('monthlyRevenue', 'R$ 0,00');
            }
        } catch (error) {
            console.warn('Error fetching revenue:', error);
            updateStat('monthlyRevenue', 'R$ 0,00');
        }
    }

    // Update stat element
    function updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Update with empty state when API fails
    function updateWithEmptyState() {
        updateStat('totalStudents', 0);
        updateStat('totalClasses', 0);
        updateStat('attendanceRate', '0%');
        updateStat('monthlyRevenue', 'R$ 0');
        showNoDataMessage();
    }

    // Update last refresh time
    function updateLastRefresh() {
        dashboardData.lastUpdated = new Date();
        console.log('✅ Dashboard data updated at', dashboardData.lastUpdated.toLocaleTimeString());
    }

    // Setup auto-refresh
    function setupAutoRefresh() {
        // Use intelligent intervals based on API availability
        const interval = apiAvailable ? 5 * 60 * 1000 : 30 * 1000; // 5min vs 30sec

        clearInterval(updateInterval);
        updateInterval = setInterval(() => {
            loadDashboardData();
        }, interval);
    }

    // Load dashboard (main function)
    function loadDashboard() {
        console.log('📊 Loading dashboard...');

        // Ensure structure is rendered
        if (!document.querySelector('.dashboard-header')) {
            renderDashboardStructure();
        }

        // Load data
        loadDashboardData();
    }

    // Export global functions
    function exportGlobalFunctions() {
        window.loadDashboard = loadDashboard;
        window.toggleSidebar = toggleSidebar;
        window.dashboardData = dashboardData;
        window.showNoDataMessage = showNoDataMessage;
        window.handleResize = handleResize;

        // Add resize listener
        window.addEventListener('resize', handleResize);
    }

    // Show no data message function
    function showNoDataMessage() {
        const container = document.getElementById('dashboardContainer');
        if (container && !document.getElementById('apiStatusMessage')) {
            const message = document.createElement('div');
            message.id = 'apiStatusMessage';
            message.style.cssText = `
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid #3B82F6;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                color: #3B82F6;
                text-align: center;
            `;
            message.innerHTML = `
                <strong>📡 Aguardando dados da API</strong><br>
                Conecte o servidor para ver dados reais.
            `;
            container.insertBefore(message, container.firstChild);
        }
    }

    // Inject dashboard CSS styles
    function injectDashboardStyles() {
        if (document.getElementById('dashboardOptimizedStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'dashboardOptimizedStyles';
        styles.textContent = `
            body {
                margin: 0;
                padding: 0;
                overflow: hidden;
            }
            
            .dashboard-container {
                display: flex;
                height: 100vh;
                background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
                color: #F8FAFC;
                font-family: system-ui, -apple-system, sans-serif;
                overflow: hidden;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 2rem;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(20px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }
            
            .header-left {
                display: flex;
                align-items: center;
                gap: 2rem;
            }
            
            .header-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.5rem;
                font-weight: 800;
                color: #F8FAFC;
            }
            
            .header-ai-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #10B981;
                font-size: 0.9rem;
            }
            
            .header-actions {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            
            .quick-action-btn {
                background: #3B82F6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 0.5rem 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9rem;
            }
            
            .quick-action-btn:hover {
                background: #2563EB;
            }
            
            .dashboard-sidebar {
                width: 280px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(20px);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                overflow-y: auto;
                padding: 1rem 0;
                height: 100vh;
                transition: all 0.3s ease;
                flex-shrink: 0;
                position: relative;
            }
            
            .dashboard-sidebar.collapsed {
                width: 60px;
            }
            
            .dashboard-sidebar.collapsed .sidebar-title,
            .dashboard-sidebar.collapsed .sidebar-item-text {
                display: none;
            }
            
            .dashboard-sidebar.collapsed .nav-link {
                justify-content: center;
                padding: 0.75rem;
            }
            
            .dashboard-sidebar.collapsed .nav-link span:not(.nav-icon) {
                display: none;
            }
            
            .dashboard-sidebar.collapsed .badge {
                display: none;
            }
            
            .nav-menu {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .nav-item {
                margin: 0;
            }
            
            .nav-link {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                color: #CBD5E1;
                text-decoration: none;
                border: none;
                background: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
                border-radius: 8px;
                margin: 0.25rem 0.5rem;
            }
            
            .nav-link:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #F8FAFC;
            }
            
            .nav-link.active {
                background: rgba(59, 130, 246, 0.2);
                color: #93C5FD;
                border-left: 3px solid #3B82F6;
            }
            
            .nav-icon {
                font-size: 1.25rem;
                min-width: 1.5rem;
                text-align: center;
            }
            
            .badge {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                margin-left: auto;
            }
            
            .badge.success {
                background: rgba(16, 185, 129, 0.2);
                color: #10B981;
            }
            
            .sidebar-section {
                margin-bottom: 1.5rem;
            }
            
            .sidebar-title {
                color: #64748B;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                padding: 0 1rem;
                margin-bottom: 0.5rem;
            }
            
            .dashboard-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                min-width: 0;
            }
            
            .content-section {
                flex: 1;
                padding: 2rem;
                overflow-y: auto;
                overflow-x: hidden;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
                margin-bottom: 2rem;
                max-width: 100%;
            }
            
            @media (max-width: 768px) {
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                min-height: 80px;
                position: relative;
                overflow: hidden;
            }
            
            .stat-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
                transition: all 0.2s ease;
            }
            
            .stat-icon {
                font-size: 2rem;
                opacity: 0.8;
            }
            
            .stat-content {
                flex: 1;
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: 800;
                margin-bottom: 0.25rem;
            }
            
            .stat-label {
                color: #94A3B8;
                font-size: 0.9rem;
            }
            
            .stat-trend {
                font-size: 0.8rem;
                padding: 0.25rem 0.5rem;
                border-radius: 6px;
                background: rgba(16, 185, 129, 0.1);
                color: #10B981;
            }
            
            .dashboard-actions-section {
                margin: 2rem 0;
            }
            
            .dashboard-actions-section h3 {
                color: #F8FAFC;
                font-size: 1.25rem;
                margin-bottom: 1rem;
                font-weight: 600;
            }
            
            .action-buttons {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-bottom: 2rem;
            }
            
            .action-btn {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid #3B82F6;
                color: #3B82F6;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }
            
            .action-btn.primary {
                background: rgba(59, 130, 246, 0.1);
                border-color: #3B82F6;
                color: #3B82F6;
            }
            
            .action-btn.success {
                background: rgba(16, 185, 129, 0.1);
                border-color: #10B981;
                color: #10B981;
            }
            
            .action-btn.warning {
                background: rgba(245, 158, 11, 0.1);
                border-color: #F59E0B;
                color: #F59E0B;
            }
            
            .action-btn.info {
                background: rgba(14, 165, 233, 0.1);
                border-color: #0EA5E9;
                color: #0EA5E9;
            }
            
            .action-btn.secondary {
                background: rgba(107, 114, 128, 0.1);
                border-color: #6B7280;
                color: #6B7280;
            }
            
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .action-btn.primary:hover {
                background: rgba(59, 130, 246, 0.2);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .action-btn.success:hover {
                background: rgba(16, 185, 129, 0.2);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            
            .action-btn.warning:hover {
                background: rgba(245, 158, 11, 0.2);
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
            }
            
            .action-btn.info:hover {
                background: rgba(14, 165, 233, 0.2);
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
            }
            
            .action-btn.secondary:hover {
                background: rgba(107, 114, 128, 0.2);
                box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
            }
            
            .recent-activity {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .recent-activity h4 {
                color: #F8FAFC;
                font-size: 1.1rem;
                margin-bottom: 1rem;
                font-weight: 600;
            }
            
            .activity-item {
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                color: #CBD5E1;
                font-size: 0.9rem;
            }
            
            .activity-item:last-child {
                border-bottom: none;
            }
            
            /* ================================
               RESPONSIVO - MOBILE & TABLET
               ================================ */
            
            /* Tablet Portrait (768px - 1024px) */
            @media (max-width: 1024px) {
                .dashboard-container {
                    flex-direction: column;
                }
                
                .dashboard-sidebar {
                    width: 100%;
                    height: auto;
                    max-height: 60px;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }
                
                .dashboard-sidebar.expanded {
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .dashboard-sidebar.collapsed {
                    width: 100%;
                    max-height: 60px;
                }
                
                .sidebar-section {
                    margin-bottom: 1rem;
                }
                
                .nav-menu {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    padding: 0 1rem;
                }
                
                .nav-item {
                    flex: 1;
                    min-width: 150px;
                }
                
                .nav-link {
                    justify-content: center;
                    padding: 0.5rem;
                    margin: 0;
                    font-size: 0.875rem;
                }
                
                .dashboard-main {
                    padding: 0;
                }
                
                .dashboard-header {
                    padding: 1rem;
                    flex-direction: column;
                    gap: 1rem;
                    align-items: stretch;
                }
                
                .header-left {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .header-actions {
                    justify-content: center;
                }
            }
            
            /* Mobile (até 768px) */
            @media (max-width: 768px) {
                .dashboard-container {
                    height: 100vh;
                    overflow: hidden;
                }
                
                .dashboard-sidebar {
                    position: fixed;
                    top: 0;
                    left: -100%;
                    width: 280px;
                    height: 100vh;
                    z-index: 1000;
                    transition: left 0.3s ease;
                    max-height: none;
                    overflow-y: auto;
                }
                
                .dashboard-sidebar.mobile-open {
                    left: 0;
                }
                
                .dashboard-sidebar.collapsed {
                    left: -100%;
                    width: 280px;
                }
                
                .mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    display: none;
                }
                
                .mobile-overlay.show {
                    display: block;
                }
                
                .nav-menu {
                    display: block;
                    padding: 0;
                }
                
                .nav-item {
                    flex: none;
                    min-width: auto;
                }
                
                .nav-link {
                    justify-content: flex-start;
                    padding: 0.75rem 1rem;
                    margin: 0.25rem 0.5rem;
                    font-size: 1rem;
                }
                
                .dashboard-main {
                    width: 100%;
                    margin-left: 0;
                }
                
                .dashboard-header {
                    padding: 1rem;
                    flex-direction: row;
                    gap: 1rem;
                    align-items: center;
                }
                
                .header-left {
                    flex-direction: row;
                    gap: 1rem;
                    flex: 1;
                }
                
                .header-title {
                    font-size: 1.25rem;
                }
                
                .header-ai-status {
                    display: none;
                }
                
                .content-section {
                    padding: 1rem;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .stat-card {
                    padding: 1rem;
                }
                
                .action-buttons {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .action-btn {
                    justify-content: center;
                    padding: 1rem;
                }
            }
            
            /* Mobile Small (até 480px) */
            @media (max-width: 480px) {
                .header-title {
                    font-size: 1.1rem;
                }
                
                .quick-action-btn {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                }
                
                .stat-card {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.5rem;
                    padding: 1rem 0.75rem;
                }
                
                .stat-icon {
                    font-size: 1.5rem;
                }
                
                .stat-value {
                    font-size: 1.5rem;
                }
                
                .sidebar-title {
                    font-size: 0.7rem;
                }
                
                .content-section {
                    padding: 0.75rem;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Show/hide offline indicator
    function showOfflineIndicator() {
        hideOfflineIndicator(); // Remove existing first

        const indicator = document.createElement('div');
        indicator.id = 'offlineIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(239, 68, 68, 0.3);
        `;
        indicator.innerHTML = `
            <span>🔴</span>
            <span>API Offline</span>
        `;

        document.body.appendChild(indicator);
    }

    function hideOfflineIndicator() {
        const existing = document.getElementById('offlineIndicator');
        if (existing) {
            existing.remove();
        }
    }

    console.log('✅ Sistema de Gestão de Artes Marciais carregado');

})();
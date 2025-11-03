class SPARouter {
    constructor() {
        this.routes = {};
        // Hybrid Agenda Module Route removed - legacy archived; see earlier redirect route to 'agenda'
        this.moduleStates = new Map();
        this.initializingModules = new Set();
        this.isNavigating = false; // ✅ Prevent concurrent navigation
        this.lastNavigatedModule = null; // ✅ Track last module
    }
    
    /**
     * Mark module initialization complete
     */
    markModuleInitialized(moduleName, instance = null) {
        console.log(`✅ [Router] Marking ${moduleName} as initialized`);
        this.initializingModules.delete(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = false;
        state.isInitialized = true;
        state.instance = instance;
        state.lastError = null;
        state.initPromise = null;
    }
    
    /**
     * Mark module initialization failed
     */
    markModuleInitializationFailed(moduleName, error) {
        console.error(`❌ [Router] Module ${moduleName} initialization failed:`, error);
        this.initializingModules.delete(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = false;
        state.isInitialized = false;
        state.instance = null;
        state.lastError = error;
        state.initPromise = null;
    }

    /**
     * Mark module as initializing
     */
    markModuleInitializing(moduleName) {
        console.log(`🔄 [Router] Marking ${moduleName} as initializing`);
        this.initializingModules.add(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = true;
        state.isInitialized = false;
        state.instance = null;
        state.lastError = null;
    }
    
    /**
     * Get or create module state
     */
    getModuleState(moduleName) {
        if (!this.moduleStates.has(moduleName)) {
            this.moduleStates.set(moduleName, {
                isInitializing: false,
                isInitialized: false,
                instance: null,
                lastError: null,
                initPromise: null
            });
        }
        return this.moduleStates.get(moduleName);
    }
    
    /**
     * Reset module state (for retry scenarios)
     */
    resetModuleState(moduleName) {
        console.log(`🔄 [Router] Resetting state for ${moduleName}`);
        this.initializingModules.delete(moduleName);
        this.moduleStates.delete(moduleName);
    }

    /**
     * Safe module initialization with concurrency protection
     * Returns existing promise if module is initializing, or cached instance if already loaded
     */
    async safeModuleInitialization(moduleName, initializerFn) {
        const state = this.getModuleState(moduleName);
        
        // 1. Check if already initialized - return cached instance
        if (state.isInitialized && state.instance) {
            console.log(`📋 [CACHE] Módulo ${moduleName} já inicializado, reutilizando...`);
            
            // Manage header visibility
            this.manageDefaultHeader(moduleName);
            
            // Reinitialize UI with cached instance if needed
            if (moduleName === 'students') {
                const container = document.getElementById('module-container');
                if (typeof window.initStudentsModule === 'function') {
                    await window.initStudentsModule(container);
                }
            }
            
            return state.instance;
        }
        
        // 2. Check if currently initializing - return existing promise
        if (state.initPromise) {
            console.log(`📋 [CACHE] Módulo ${moduleName} já está carregando, aguardando...`);
            return state.initPromise;
        }
        
        // 3. Start new initialization
        console.log(`📋 [NETWORK] Inicializando módulo ${moduleName}...`);
        this.markModuleInitializing(moduleName);
        
        // Create and store initialization promise
        state.initPromise = initializerFn()
            .then(instance => {
                this.markModuleInitialized(moduleName, instance);
                return instance;
            })
            .catch(error => {
                this.markModuleInitializationFailed(moduleName, error);
                
                // Show error in container
                const container = document.getElementById('module-container');
                if (container) {
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar módulo</h3>
                            <p>${error.message}</p>
                            <button onclick="router.resetModuleState('${moduleName}'); router.navigateTo('${moduleName}')" class="btn btn-primary">
                                Tentar Novamente
                            </button>
                        </div>
                    `;
                }
                
                throw error;
            });
        
        return state.initPromise;
    }

    registerRoute(module, handler) {
        // ✅ PREVENT DUPLICATE ROUTE REGISTRATION
        if (this.routes[module]) {
            console.warn(`⚠️ [Router] Route '${module}' already registered, skipping`);
            return;
        }
        this.routes[module] = handler;
        console.log(`✅ [Router] Route '${module}' registered`);
    }
    // Resolve first path segment from hash, e.g. '#plan-editor/123' -> 'plan-editor'
    getModuleFromHash() {
        const raw = (location.hash || '').slice(1);
        return raw.split('/')[0] || raw;
    }

    navigateTo(module) {
        // ✅ PREVENT CONCURRENT NAVIGATION
        if (this.isNavigating) {
            console.log(`⏸️ [Router] Already navigating, skipping ${module}`);
            return;
        }

        // ✅ PREVENT DUPLICATE NAVIGATION
        if (this.lastNavigatedModule === module) {
            console.log(`⏸️ [Router] Already on ${module}, skipping navigation`);
            return;
        }

        if (this.routes[module]) {
            this.isNavigating = true;
            this.lastNavigatedModule = module;

            try {
                // Remover módulo ativo anterior
                if (this.currentModule) {
                    const prevItem = document.querySelector(`.main-menu li[data-module="${this.currentModule}"]`);
                    if (prevItem) prevItem.classList.remove('active');
                }
                
                // Ativar novo módulo
                this.currentModule = module;
                const newItem = document.querySelector(`.main-menu li[data-module="${module}"]`);
                if (newItem) newItem.classList.add('active');
                
                // ✅ ONLY UPDATE HASH IF NEEDED (prevent loop)
                const currentFirst = (location.hash || '').slice(1).split('/')[0];
                if (currentFirst !== module) {
                    // Temporarily disable hashchange listener
                    this._ignoreNextHashChange = true;
                    location.hash = module;
                }
                
                // Executar handler do módulo
                this.routes[module]();
            } finally {
                // Reset navigation flag immediately - module init handles async loading
                setTimeout(() => {
                    this.isNavigating = false;
                }, 100); // Reduced from 500ms to 100ms
            }
        }
    }

    /**
     * Manage default header visibility for modules
     */
    manageDefaultHeader(moduleName) {
        // Some modules like 'students' manage their own headers (module-header-premium)
        // Hide default header for modules that have their own premium headers
        const defaultHeader = document.querySelector('.module-header');
        if (defaultHeader) {
            const modulesWithOwnHeaders = ['students', 'activities', 'lesson-plans', 'courses', 'packages', 'billing'];
            if (modulesWithOwnHeaders.includes(moduleName)) {
                defaultHeader.style.display = 'none';
            } else {
                defaultHeader.style.display = 'block';
            }
        }
    }

    loadModuleAssets(module) {
        // Always ensure shared utils first
        this.loadJS('js/shared/utils/feedback.js');
        this.loadJS('js/shared/api-client.js');
        
        // Mapeamento de caminhos específicos para cada módulo
        const assetMap = {
            'students': {
                css: 'css/modules/students-enhanced.css',
                js: 'js/modules/students/index.js'
            },
            'student-editor': {
                css: 'css/modules/students-enhanced.css',
                js: 'js/modules/students/index.js'
            },
            'techniques': {
                css: 'css/modules/techniques.css',
                js: 'js/modules/techniques.js'
            },
            'packages': {
                css: 'css/modules/packages.css',
                js: 'js/modules/packages/index.js?v=2.0.1'
            },
            'package-editor': {
                css: 'css/modules/packages.css',
                js: 'js/modules/packages/index.js?v=2.0.1'
            },
            // FIX: plan-editor deve usar o editor de cobrança, não lesson-plans
            'plan-editor': {
                css: 'css/modules/plan-editor-padronizado.css',
                js: 'js/modules/plan-editor.js'
            },
            'activities': {
                css: 'css/modules/activities.css',
                js: 'js/modules/activities/index.js'
            },
            // NEW: activity-editor SPA assets (apenas CSS; HTML já inclui script necessário)
            'activity-editor': {
                css: 'css/modules/activities.css'
            },
            'lesson-plans': {
                css: 'css/modules/lesson-plans.css',
                js: 'js/modules/lesson-plans/index.js'
            },
            'courses': {
                css: 'css/modules/courses/courses.css',
                js: 'js/modules/courses/index.js'
            },
            'course-editor': {
                css: 'css/modules/courses/course-editor.css',
                js: 'js/modules/courses/controllers/courseEditorController.js'
            },
            'ai': {
                css: 'css/modules/ai/ai.css',
                js: 'js/modules/ai.js'
            },
            'rag': {
                css: 'css/modules/ai/ai.css',
                js: 'js/modules/ai.js'
            },
            'turmas': {
                css: 'css/modules/turmas/turma-editor.css',
                js: 'js/modules/turmas/turma-editor.js'
            },
            'turmas-list': {
                css: 'css/modules/turmas.css',
                js: 'js/modules/turmas/index.js'
            },
            'organizations': {
                css: 'css/modules/organizations/organizations.css',
                js: 'js/modules/organizations/index.js'
            },
            'units': {
                css: 'css/modules/units/units.css',
                js: 'js/modules/units/index.js'
            },
            'unit-editor': {
                css: 'css/modules/unit-editor.css'
            },
            'lesson-execution': {
                css: 'css/modules/lesson-execution.css',
                js: 'js/modules/lesson-execution/index.js'
            },
            'instructors': {
                css: 'css/modules/instructors.css',
                js: 'js/modules/instructors/index.js'
            },
            'instructor-editor': {
                css: 'css/modules/instructor-editor.css'
            },
            'checkin-kiosk': {
                css: 'css/modules/checkin-kiosk.css',
                js: [
                    'js/modules/checkin-kiosk/services/FaceRecognitionService.js',
                    'js/modules/checkin-kiosk/services/CameraService.js',
                    'js/modules/checkin-kiosk/services/BiometricService.js',
                    'js/modules/checkin-kiosk/services/AttendanceService.js',
                    'js/modules/checkin-kiosk/views/CameraView.js',
                    'js/modules/checkin-kiosk/views/ConfirmationView.js',
                    'js/modules/checkin-kiosk/views/SuccessView.js',
                    'js/modules/checkin-kiosk/controllers/CheckinController.js',
                    'js/modules/checkin-kiosk/index.js'
                ]
            },
            'agenda': {
                css: 'css/modules/agenda.css',
                js: [
                    'js/modules/agenda/services/agendaService.js',
                    'js/modules/agenda/controllers/calendarController.js',
                    'js/modules/agenda/index.js'
                ]
            },
            'frequency': {
                css: 'css/modules/frequency.css',
                js: [
                    'js/modules/frequency/services/frequencyService.js',
                    'js/modules/frequency/services/validationService.js',
                    'js/modules/frequency/controllers/frequencyController.js',
                    'js/modules/frequency/components/attendanceList.js',
                    'js/modules/frequency/views/checkinView.js',
                    'js/modules/frequency/views/historyView.js',
                    'js/modules/frequency/index.js'
                ]
            },
            'crm': {
                css: 'css/modules/crm.css',
                js: 'js/modules/crm/index.js'
            },
            'settings': {
                css: 'css/modules/settings.css',
                js: 'js/modules/settings.js'
            },
            'ai-monitor': {
                css: 'css/modules/ai-monitor.css',
                js: 'js/modules/ai-monitor/index.js'
            }
        };

        if (assetMap[module]) {
            if (assetMap[module].css) {
                this.loadCSS(assetMap[module].css, module);
            }
            if (assetMap[module].js) {
                if (Array.isArray(assetMap[module].js)) {
                    // Carregar múltiplos arquivos JS em sequência
                    assetMap[module].js.forEach(jsFile => {
                        this.loadJS(jsFile);
                    });
                } else {
                    this.loadJS(assetMap[module].js);
                }
            }
        }
    }

    loadCSS(url, moduleName) {
        // Evitar carregamento duplicado
        if (document.querySelector(`link[href="${url}"]`)) return;
        
        // Sempre carregar o reset primeiro
        this.loadForceReset(moduleName || this.currentModule);
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    loadForceReset(activeModule) {
        // Carregar CSS de reset se não existir
        if (!document.querySelector('link[href="css/force-reset.css"]')) {
            const resetLink = document.createElement('link');
            resetLink.rel = 'stylesheet';
            resetLink.href = 'css/force-reset.css';
            document.head.insertBefore(resetLink, document.head.firstChild);
        }
        
        // Carregar CSS de formulários UX se não existir
        if (!document.querySelector('link[href="css/forms-ux.css"]')) {
            const formsLink = document.createElement('link');
            formsLink.rel = 'stylesheet';
            formsLink.href = 'css/forms-ux.css';
            document.head.appendChild(formsLink);
        }
        
        // Carregar CSS melhorado para estudantes se necessário
        if (activeModule === 'students' && !document.querySelector('link[href="css/modules/students-enhanced.css"]')) {
            const enhancedLink = document.createElement('link');
            enhancedLink.rel = 'stylesheet';
            enhancedLink.href = 'css/modules/students-enhanced.css';
            document.head.appendChild(enhancedLink);
        }
        
        // Carregar CSS de força para tabela de estudantes
        if (activeModule === 'students' && !document.querySelector('link[href="css/students-table-force.css"]')) {
            const forceLink = document.createElement('link');
            forceLink.rel = 'stylesheet';
            forceLink.href = 'css/students-table-force.css';
            document.head.appendChild(forceLink);
        }
    }

    loadJS(url) {
        // Evitar carregamento duplicado
        if (document.querySelector(`script[src="${url}"]`)) return;
        
        const script = document.createElement('script');
        script.src = url;
        
        // Verificar se é um módulo ES6 (baseado no caminho)
        if (url.includes('student-editor') || url.includes('techniques') || 
            url.includes('students/index.js') || url.includes('lesson-plans') ||
            url.includes('services/') || url.includes('controllers/') || 
            url.includes('components/') || url.includes('views/') ||
            url.includes('frequency/') || url.includes('agenda/') ||
            url.includes('activities/') || url.includes('checkin-kiosk/')) {
            script.type = 'module';
        } else {
            script.type = 'application/javascript';
        }
        
        document.body.appendChild(script);
    }

    initEventListeners() {
        // Navegação pelo menu
        document.querySelectorAll('.main-menu li').forEach(item => {
            item.addEventListener('click', () => {
                const module = item.getAttribute('data-module');
                this.navigateTo(module);
            });
        });

        // ✅ FIXED: Prevent hashchange loop
        window.addEventListener('hashchange', () => {
            // Ignore if we just set the hash programmatically
            if (this._ignoreNextHashChange) {
                this._ignoreNextHashChange = false;
                return;
            }

            const module = this.getModuleFromHash();
            
            // Only navigate if module changed
            if (module && this.routes[module] && this.lastNavigatedModule !== module) {
                console.log(`🔗 [Router] Hashchange detected: ${module}`);
                this.navigateTo(module);
            }
        });
    }
}

// ✅ SINGLETON PATTERN - Prevent multiple router instances
if (window.router) {
    console.warn('⚠️ [Router] Router already exists, reusing existing instance');
} else {
    // Inicialização do router
    window.router = new SPARouter();
}

// Use existing router instance
const router = window.router;

// Registro das rotas
router.registerRoute('dashboard', async () => {
    console.log('📊 [Router] Loading dashboard...');
    
    try {
        // Load dashboard HTML
        const response = await fetch('/views/dashboard.html');
        const html = await response.text();
        
        document.getElementById('module-container').innerHTML = html;
        console.log('✅ [Router] Dashboard HTML loaded');
        
        // Initialize dashboard module if available
        if (window.DashboardModule && window.DashboardModule.init) {
            await window.DashboardModule.init();
            console.log('✅ [Router] Dashboard module initialized');
        }
        
        // Initialize Agent Widget (aumentado timeout: 500ms → 1000ms para garantir DOM ready)
        setTimeout(() => {
            if (window.agentDashboardWidget && window.agentDashboardWidget.init) {
                console.log('🤖 [Router] Initializing Agent Widget...');
                const container = document.getElementById('agent-dashboard-widget');
                if (container) {
                    window.agentDashboardWidget.init('agent-dashboard-widget');
                    console.log('✅ [Router] Agent widget initialized');
                } else {
                    console.warn('⚠️ [Router] Agent widget container not found in DOM');
                }
            } else {
                console.warn('⚠️ [Router] agentDashboardWidget not available');
            }
        }, 1000); // Aumentado de 500ms para 1000ms
        
        // Initialize Task Approval Widget (aumentado timeout: 500ms → 1000ms)
        setTimeout(() => {
            if (window.TaskApprovalWidget && window.TaskApprovalWidget.init) {
                console.log('📋 [Router] Initializing Task Approval Widget...');
                const container = document.getElementById('task-approval-widget');
                if (container) {
                    window.TaskApprovalWidget.init(container);
                    console.log('✅ [Router] Task widget initialized');
                } else {
                    console.warn('⚠️ [Router] Task widget container not found');
                }
            } else {
                console.warn('⚠️ [Router] TaskApprovalWidget not available');
            }
        }, 1000); // Aumentado de 500ms para 1000ms
        
        // Update breadcrumb
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.textContent = 'Home / Dashboard';
        }
        
    } catch (error) {
        console.error('❌ [Router] Error loading dashboard:', error);
        document.getElementById('module-container').innerHTML = `
            <div class="welcome-message">
                <h2>Dashboard Principal</h2>
                <p>Selecione um módulo no menu lateral para começar</p>
            </div>
        `;
    }
});

router.registerRoute('students', async () => {
    const moduleName = 'students';
    
    // Use promise-based concurrent protection
    return router.safeModuleInitialization(moduleName, async () => {
        console.log('📋 [NETWORK] Carregando módulo de Estudantes...');
    // Ensure module assets (CSS + JS) are loaded consistently
    try { router.loadModuleAssets('students'); } catch (_) {}
        
        // Header is managed by the students module itself (module-header-premium)
        // document.querySelector('.module-header h1').textContent = 'Gestão de Estudantes';
        // document.querySelector('.breadcrumb').textContent = 'Home / Estudantes';
        
        // Get target container
        const container = document.getElementById('module-container');
        
        // Check if module is available
        if (typeof window.initStudentsModule === 'function') {
            const instance = await window.initStudentsModule(container);
            return instance;
        } else {
            // Load module dynamically with promise
            return new Promise((resolve, reject) => {
                const moduleScript = document.createElement('script');
                moduleScript.type = 'module';
                moduleScript.src = 'js/modules/students/index.js';

                // Save reference to router instance
                const routerInstance = this;

                moduleScript.onload = async () => {
                    try {
                        // Manage header visibility
                        routerInstance.manageDefaultHeader('students');
                        
                        if (typeof window.initStudentsModule === 'function') {
                            const instance = await window.initStudentsModule(container);
                            resolve(instance);
                        } else {
                            throw new Error('Module function not available after script load');
                        }
                    } catch (initError) {
                        reject(initError);
                    }
                };
                
                moduleScript.onerror = () => {
                    reject(new Error('Failed to load module script'));
                };
                
                document.head.appendChild(moduleScript);
            });
        }
    });
});

router.registerRoute('student-editor', () => {
    // Carregar editor de aluno - usando o novo sistema
    console.log('📝 Carregando editor de estudante...');
    try { router.loadModuleAssets('students'); } catch (_) {}
    
    // Extract student ID from hash if present
    const hashParts = location.hash.split('/');
    const studentId = hashParts[1] || null;
    
    // Update header
    document.querySelector('.module-header h1').textContent = studentId ? 'Editar Estudante' : 'Novo Estudante';
    document.querySelector('.breadcrumb').textContent = 'Home / Estudantes / Editor';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Use the new student editor
    if (typeof window.openStudentEditor === 'function') {
        window.openStudentEditor(studentId, container);
    } else {
        console.error('❌ Editor de estudantes não disponível');
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Editor não disponível</h3>
                <p>O editor de estudantes não foi carregado.</p>
                <button onclick="router.navigateTo('students')" class="btn btn-primary">
                    Voltar aos Estudantes
                </button>
            </div>
        `;
    }
});

// Restaurar funcionalidade completa dos módulos
router.registerRoute('packages', () => {
    console.log('� Carregando módulo Packages...');
    
    try {
        // Limpar container
        const container = document.getElementById('module-container');
        if (!container) {
            console.error('❌ Container module-container não encontrado');
            return;
        }
        
        // Carregar assets do módulo
        router.loadModuleAssets('packages');
        
        // Aguardar carregamento do módulo e inicializar
        const initInterval = setInterval(() => {
            if (typeof window.initializePackagesModule === 'function') {
                clearInterval(initInterval);
                
                try {
                    console.log('� Inicializando PackagesModule...');
                    window.initializePackagesModule();
                } catch (err) {
                    console.error('❌ Erro ao inicializar PackagesModule:', err);
                }
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao carregar módulo Packages:', error);
        document.getElementById('module-container').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro de carregamento</h3>
                <p>${error.message}</p>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
            </div>
        `;
    }
});

router.registerRoute('package-editor', () => {
    console.log('📝 Carregando editor de pacote...');
    
    // Extract package ID from hash if present
    const hashParts = location.hash.split('/');
    const packageId = hashParts[1] || null;
    
    // Update header
    document.querySelector('.module-header h1').textContent = packageId ? 'Editar Pacote' : 'Novo Pacote';
    document.querySelector('.breadcrumb').textContent = 'Home / Pacotes / Editor';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    try {
        router.loadModuleAssets('package-editor');
        
        setTimeout(() => {
            if (typeof window.initializePackagesModule === 'function') {
                try {
                    console.log('📝 Inicializando PackageEditor...');
                    window.initializePackagesModule();
                    
                    // Open package editor
                    if (window.packagesModule && typeof window.packagesModule.openPackageEditor === 'function') {
                        window.packagesModule.openPackageEditor(packageId, container);
                    } else {
                        console.error('❌ Editor de pacotes não disponível');
                        container.innerHTML = `
                            <div class="error-state">
                                <div class="error-icon">⚠️</div>
                                <h3>Editor não disponível</h3>
                                <p>O editor de pacotes não foi carregado.</p>
                                <button onclick="router.navigateTo('packages')" class="btn btn-primary">Voltar aos Pacotes</button>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error('❌ Erro ao inicializar PackageEditor:', err);
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro de inicialização</h3>
                            <p>${err.message}</p>
                            <button onclick="router.navigateTo('packages')" class="btn btn-primary">Voltar aos Pacotes</button>
                        </div>
                    `;
                }
            } else {
                console.error('❌ PackagesModule não encontrado');
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Módulo não encontrado</h3>
                        <p>O módulo de pacotes não foi carregado.</p>
                        <button onclick="router.navigateTo('packages')" class="btn btn-primary">Voltar aos Pacotes</button>
                    </div>
                `;
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao carregar editor de pacotes:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro de carregamento</h3>
                <p>${error.message}</p>
                <button onclick="router.navigateTo('packages')" class="btn btn-primary">Voltar aos Pacotes</button>
            </div>
        `;
    }
});

// Legacy routes redirect para packages
router.registerRoute('billing', () => {
    console.log('🔄 Redirecionando /billing → /packages');
    router.navigateTo('packages');
});

router.registerRoute('plans', () => {
    console.log('🔄 Redirecionando /plans → /packages');
    router.navigateTo('packages');
});

router.registerRoute('financial', () => {
    console.log('🔄 Redirecionando /financial → /packages');
    router.navigateTo('packages');
});

router.registerRoute('courses', () => {
    // Carregar HTML do módulo de cursos
    fetch('views/modules/courses/courses.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('courses');
        });
    
    document.querySelector('.module-header h1').textContent = 'Cursos';
    document.querySelector('.breadcrumb').textContent = 'Home / Cursos';
});

router.registerRoute('techniques', () => {
    // Carregar HTML do módulo de técnicas
    fetch('views/techniques.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('techniques');
        });
    
    document.querySelector('.module-header h1').textContent = 'Técnicas';
    document.querySelector('.breadcrumb').textContent = 'Home / Técnicas';
});

router.registerRoute('activities', async () => {
    console.log('🏋️ Carregando módulo de Atividades...');
    
    try {
        // Update header
        document.querySelector('.module-header h1').textContent = 'Atividades';
        document.querySelector('.breadcrumb').textContent = 'Home / Atividades';
        
        // Get target container
        const container = document.getElementById('module-container');
        
        // Check if module is available
        if (typeof window.initActivitiesModule === 'function') {
            await window.initActivitiesModule(container);
        } else {
            // Load module dynamically
            const moduleScript = document.createElement('script');
            moduleScript.type = 'module';
            moduleScript.src = 'js/modules/activities/index.js';
            
            moduleScript.onload = async () => {
                if (typeof window.initActivitiesModule === 'function') {
                    await window.initActivitiesModule(container);
                } else {
                    console.error('❌ Módulo de atividades não foi carregado corretamente');
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar módulo</h3>
                            <p>O módulo de atividades não pôde ser carregado.</p>
                            <button onclick="location.reload()" class="btn btn-primary">
                                Recarregar Página
                            </button>
                        </div>
                    `;
                }
            };
            
            moduleScript.onerror = () => {
                console.error('❌ Erro ao carregar script do módulo de atividades');
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro de carregamento</h3>
                        <p>Não foi possível carregar o módulo de atividades.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Tentar Novamente
                        </button>
                    </div>
                `;
            };
            
            document.head.appendChild(moduleScript);
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de atividades:', error);
        document.getElementById('module-container').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na inicialização</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }
});

// NEW: Rota para editor de atividades (SPA)
router.registerRoute('activity-editor', () => {
    console.log('📝 Carregando editor de atividade...');

    // Extrair ID da atividade do hash (padrão: #activity-editor/<id>)
    const parts = (location.hash || '').split('/');
    const activityId = parts[1] && parts[1] !== 'activity-editor' ? decodeURIComponent(parts[1]) : null;
    
    console.log('🔍 Hash parts:', parts);
    console.log('🔍 Activity ID extracted:', activityId);

    // Garantir que o script do editor que usa window.location.search receba o ID
    try {
        const u = new URL(window.location.href);
        console.log('🔍 Current URL before update:', u.toString());
        
        if (activityId) {
            u.searchParams.set('activityId', activityId);  // Use activityId instead of id
            console.log('🔍 Setting search param activityId to:', activityId);
        } else {
            u.searchParams.delete('activityId');
        }
        
        console.log('🔍 Updated URL:', u.toString());
        
        // Não alterar o hash ao atualizar a busca
        history.replaceState(null, '', u.toString());
        console.log('✅ URL updated with search params');
    } catch (e) { 
        console.warn('Não foi possível ajustar URL search param para activityId', e); 
    }

    // Atualizar header/breadcrumb
    document.querySelector('.module-header h1').textContent = activityId ? 'Editar Atividade' : 'Nova Atividade';
    document.querySelector('.breadcrumb').textContent = 'Home / Atividades / Editor';

    const container = document.getElementById('module-container');

    // Carregar view do editor e injetar conteúdo interno isolado + executar scripts embutidos
    fetch('views/modules/activity-editor.html')
        .then(r => r.text())
        .then(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;

            // Injetar HTML completo para preservar estrutura esperada
            container.innerHTML = html;

            // Carregar assets do editor (CSS)
            router.loadModuleAssets('activity-editor');

            // Executar scripts embutidos (inclui <script type="module">)
            const scripts = tmp.querySelectorAll('script');
            scripts.forEach(orig => {
                const s = document.createElement('script');
                if (orig.type) s.type = orig.type;
                if (orig.src) {
                    s.src = orig.src;
                } else {
                    s.textContent = orig.textContent;
                }
                // Garantir execução após injeção do HTML
                document.body.appendChild(s);
            });

            // Foco no topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        })
        .catch(err => {
            console.error('❌ Erro ao carregar editor de atividade:', err);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro de carregamento</h3>
                    <p>${err.message}</p>
                    <button onclick="router.navigateTo('activities')" class="btn btn-primary">Voltar às Atividades</button>
                </div>
            `;
        });
});

router.registerRoute('lesson-plans', () => {
    console.log('📚 Carregando módulo Planos de Aula...');
    
    // Clear module container first
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = '<div id="lessonPlansContainer" class="lesson-plans-container"></div>';
    
    // Load module assets
    router.loadModuleAssets('lesson-plans');
    
    // Wait for assets and initialize
    setTimeout(() => {
        console.log('🔍 Checking for lesson plans functions...');
        console.log('initLessonPlans:', typeof window.initLessonPlans);
        console.log('testLessonPlansModule:', typeof window.testLessonPlansModule);
        
        // Try test function first
        if (typeof window.testLessonPlansModule === 'function') {
            console.log('🧪 Running test function...');
            window.testLessonPlansModule();
        }
        
        if (typeof window.initLessonPlans === 'function') {
            try {
                const container = document.querySelector('#lessonPlansContainer') ||
                                 document.querySelector('.lesson-plans-container') ||
                                 document.querySelector('.lesson-plans-isolated');
                
                if (container) {
                    console.log('📚 Initializing lesson plans module...');
                    // Pass the resolved container so the module renders inside the router-managed node
                    window.initLessonPlans(container);
                } else {
                    console.error('❌ Lesson plans container not found');
                    moduleContainer.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Container não encontrado</h3>
                            <p>Não foi possível encontrar o container do módulo.</p>
                            <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('❌ Error initializing lesson plans module:', error);
                moduleContainer.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro de inicialização</h3>
                        <p>${error.message}</p>
                        <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                    </div>
                `;
            }
        } else {
            console.error('❌ initLessonPlans function not found');
            moduleContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>A função de inicialização não foi encontrada.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    }, 1000);
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Planos de Aula';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos de Aula';
});

// FIX: Restaurar rota 'plan-editor' para o editor de cobrança
router.registerRoute('plan-editor', () => {
    console.log('🧾 Carregando editor de plano (cobrança)...');

    // Extrair ID do plano do hash (padrão: #plan-editor/<id>)
    const parts = (location.hash || '').split('/');
    const billingPlanId = parts[1] && parts[1] !== 'plan-editor' ? decodeURIComponent(parts[1]) : null;

    // Atualizar header/breadcrumb
    document.querySelector('.module-header h1').textContent = billingPlanId ? 'Editar Plano (Cobrança)' : 'Novo Plano (Cobrança)';
    document.querySelector('.breadcrumb').textContent = 'Home / Cobrança / Editor';

    const container = document.getElementById('module-container');

    // Disponibilizar sessão de edição para o script do editor
    window.EditingSession = {
        _id: billingPlanId,
        getEditingPlanId() { return this._id; },
        setEditingPlanId(id) { this._id = id; },
        clearEditingPlanId() { this._id = null; }
    };

    // Carregar view do editor de cobrança e injetar conteúdo interno
    fetch('views/plan-editor.html')
        .then(r => r.text())
        .then(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const inner = tmp.querySelector('.module-isolated-base');
            container.innerHTML = '';
            if (inner) {
                container.appendChild(inner);
            } else {
                // Fallback: injetar HTML como está
                container.innerHTML = html;
            }
            // Carregar assets do editor de cobrança
            router.loadModuleAssets('plan-editor');
        })
        .catch(err => {
            console.error('❌ Erro ao carregar editor de cobrança:', err);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro de carregamento</h3>
                    <p>${err.message}</p>
                    <button onclick="router.navigateTo('billing')" class="btn btn-primary">Voltar à Cobrança</button>
                </div>
            `;
        });
});

// NEW: Criar rota separada para o editor de Planos de Aula
router.registerRoute('lesson-plan-editor', () => {
    console.log('📝 Carregando editor de Plano de Aula...');

    // Parse ID do hash (padrão: #lesson-plan-editor/<id>)
    const parts = (location.hash || '').split('/');
    const planId = parts[1] && parts[1] !== 'lesson-plan-editor' ? decodeURIComponent(parts[1]) : null;

    // Atualizar header/breadcrumb
    document.querySelector('.module-header h1').textContent = planId ? 'Editar Plano de Aula' : 'Novo Plano de Aula';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos de Aula / Editor';

    const container = document.getElementById('module-container');
    container.innerHTML = '<div id="lessonPlansContainer" class="lesson-plans-container"></div>';

    // Carregar assets do módulo de planos de aula
    router.loadModuleAssets('lesson-plans');

    // Inicializar o módulo e abrir o editor
    setTimeout(() => {
        if (typeof window.initLessonPlans === 'function') {
            try {
                window.initLessonPlans();
                setTimeout(() => {
                    const targetContainer = document.getElementById('lessonPlansContainer') || container;
                    if (typeof window.openLessonPlanEditor === 'function') {
                        window.openLessonPlanEditor(planId, targetContainer);
                    } else if (window.lessonPlansModule?.openEditor) {
                        window.lessonPlansModule.openEditor(planId, targetContainer);
                    } else {
                        throw new Error('Função do editor de planos de aula não encontrada');
                    }
                }, 200);
            } catch (error) {
                console.error('❌ Erro ao inicializar editor de planos de aula:', error);
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro no editor</h3>
                        <p>${error.message}</p>
                        <button onclick="router.navigateTo('lesson-plans')" class="btn btn-primary">Voltar aos Planos</button>
                    </div>
                `;
            }
        } else {
            console.error('❌ Módulo de planos de aula não encontrado');
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>O módulo de planos de aula não foi encontrado.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    }, 300);
});

router.registerRoute('course-editor', () => {
    console.log('📝 Carregando editor de curso...');
    
    // Extract course ID from hash if present
    const hashParts = location.hash.split('/');
    const courseId = hashParts[1] || null;
    
    // Update header
    document.querySelector('.module-header h1').textContent = courseId ? 'Editar Curso' : 'Novo Curso';
    document.querySelector('.breadcrumb').textContent = 'Home / Cursos / Editor';
    
    // Get target container
    const container = document.getElementById('module-container');

    // Propagar ID/mode para o módulo do editor (compatível com courses.js)
    window.currentCourseId = courseId || null;
    window.currentCourseMode = courseId ? 'edit' : 'create';
    
    // Load the editor view and extract inner content
    fetch('views/modules/courses/course-editor.html')
        .then(r => r.text())
        .then(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const inner = tmp.querySelector('.course-editor-isolated');
            if (inner) {
                container.innerHTML = '';
                container.appendChild(inner);
            } else {
                // Fallback: inject as-is
                container.innerHTML = html;
            }
            router.loadModuleAssets('course-editor');
            // Ensure course-editor initialization runs even if script was loaded earlier
            const tryInit = (attempts = 0) => {
                if (typeof window.initializeCourseEditorModule === 'function') {
                    try { window.initializeCourseEditorModule(); } catch (e) { console.error('course-editor init error', e); }
                } else if (attempts < 30) {
                    setTimeout(() => tryInit(attempts + 1), 150);
                }
            };
            tryInit();
        })
        .catch(err => {
            console.error('❌ Erro ao carregar editor de curso:', err);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro de carregamento</h3>
                    <p>${err.message}</p>
                    <button onclick="router.navigateTo('courses')" class="btn btn-primary">Voltar aos Cursos</button>
                </div>
            `;
        });
});

router.registerRoute('ai', () => {
    // Update header
    document.querySelector('.module-header h1').textContent = 'Inteligência Artificial';
    document.querySelector('.breadcrumb').textContent = 'Home / Cursos / IA';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Create clean container for Enhanced AI Module (no old HTML loading)
    container.innerHTML = '<div id="ai-module-container" class="ai-isolated"></div>';
    
    // Load module assets
    router.loadModuleAssets('ai');
    
    // Initialize Enhanced AI Module
    const tryInit = (attempts = 0) => {
        if (typeof window.initializeAIModule === 'function') {
            try { 
                window.initializeAIModule(); 
            } catch (e) { 
                console.error('AI module init error', e); 
            }
        } else if (attempts < 30) {
            setTimeout(() => tryInit(attempts + 1), 150);
        }
    };
    tryInit();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Agents Module Route
router.registerRoute('agents', () => {
    console.log('🤖 Carregando módulo de Agentes...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Agentes Inteligentes';
    document.querySelector('.breadcrumb').textContent = 'Home / Agentes';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Create clean container for Agents Module
    container.innerHTML = '<div id="agents-module-container" class="agents-isolated"></div>';
    
    // Initialize Agents Module
    const tryInit = (attempts = 0) => {
        if (typeof window.AgentsModule?.init === 'function') {
            try {
                const targetContainer = document.getElementById('agents-module-container') || container;
                window.AgentsModule.init(targetContainer);
                console.log('✅ Agents Module initialized');
            } catch (e) {
                console.error('❌ Agents module init error:', e);
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao inicializar Agentes</h3>
                        <p>${e.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">Tentar Novamente</button>
                    </div>
                `;
            }
        } else if (attempts < 30) {
            setTimeout(() => tryInit(attempts + 1), 150);
        } else {
            console.error('❌ Agents Module não carregou após 30 tentativas');
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>O módulo de agentes não foi encontrado.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    };
    tryInit();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Agent Activity Module Route
router.registerRoute('agent-activity', () => {
    console.log('🤖 Carregando módulo de Atividade de Agentes...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Atividade de Agentes';
    document.querySelector('.breadcrumb').textContent = 'Home / Atividade de Agentes';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Create clean container for Agent Activity Module
    container.innerHTML = '<div id="agent-activity-container"></div>';
    
    // Initialize Agent Activity Module
    const tryInit = (attempts = 0) => {
        if (typeof window.agentActivityModule?.init === 'function' && typeof window.createModuleAPI === 'function') {
            try {
                const targetContainer = document.getElementById('agent-activity-container') || container;
                window.agentActivityModule.container = targetContainer;
                window.agentActivityModule.init();
                console.log('✅ Agent Activity Module initialized');
            } catch (e) {
                console.error('❌ Agent Activity module init error:', e);
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao inicializar Atividade de Agentes</h3>
                        <p>${e.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">Tentar Novamente</button>
                    </div>
                `;
            }
        } else if (attempts < 50) {
            setTimeout(() => tryInit(attempts + 1), 100);
        } else {
            console.error('❌ Agent Activity Module não carregou após 50 tentativas');
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>O módulo de atividade de agentes não foi encontrado. Verifique se o arquivo foi carregado corretamente.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    };
    tryInit();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Agent Chat Fullscreen Module Route
router.registerRoute('agent-chat-fullscreen', () => {
    console.log('💬 Carregando Chat com Agentes (Fullscreen)...');
    
    // Hide default header (fullscreen mode)
    const header = document.querySelector('.module-header');
    if (header) header.style.display = 'none';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Load fullscreen HTML via fetch and inject
    container.innerHTML = '<div id="loading-chat-fullscreen" style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 20px;">⏳ Carregando Chat...</div>';
    
    // Fetch and inject HTML
    fetch('views/agent-chat-fullscreen.html')
        .then(response => response.text())
        .then(html => {
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.agent-chat-fullscreen-container');
            
            if (content) {
                container.innerHTML = '';
                container.appendChild(content);
                
                // Force reinitialize module after DOM is ready
                setTimeout(() => {
                    if (window.AgentChatFullscreen?.init) {
                        window.AgentChatFullscreen.init();
                    }
                }, 100);
                
                console.log('✅ Agent Chat Fullscreen HTML injected');
            } else {
                container.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>❌ Erro ao carregar chat</h2><p>Conteúdo não encontrado</p></div>';
            }
        })
        .catch(error => {
            console.error('Error loading chat fullscreen:', error);
            container.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>❌ Erro ao carregar chat</h2><p>' + error.message + '</p></div>';
        });
    
    console.log('✅ Agent Chat Fullscreen loading...');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// AI Monitor Module Route
router.registerRoute('ai-monitor', () => {
    console.log('🤖 Carregando módulo AI Monitor...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'AI Monitor';
    document.querySelector('.breadcrumb').textContent = 'Home / IA / AI Monitor';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Clear container
    container.innerHTML = '<div id="ai-monitor-loading">Carregando AI Monitor...</div>';
    
    // Load module assets
    router.loadModuleAssets('ai-monitor');
    
    // Initialize AI Monitor Module
    const tryInit = (attempts = 0) => {
        console.log(`🤖 AI Monitor - Tentativa de inicialização ${attempts + 1}/30`);
        
        if (typeof window.initAIMonitorModule === 'function') {
            try {
                console.log('🤖 AI Monitor - Inicializando módulo...');
                window.initAIMonitorModule();
            } catch (e) {
                console.error('❌ AI Monitor - Erro na inicialização:', e);
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao inicializar AI Monitor</h3>
                        <p>${e.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">Tentar Novamente</button>
                    </div>
                `;
            }
        } else if (attempts < 30) {
            setTimeout(() => tryInit(attempts + 1), 200);
        } else {
            console.error('❌ AI Monitor - Timeout na inicialização');
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⏰</div>
                    <h3>Timeout na inicialização</h3>
                    <p>O módulo AI Monitor não foi carregado a tempo.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Tentar Novamente</button>
                </div>
            `;
        }
    };
    
    // Start initialization with small delay
    setTimeout(() => tryInit(), 300);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// RAG Module Route - Redirects to AI module (RAG integrated in AI module)
router.registerRoute('rag', () => {
    console.log('🧠 RAG route - redirecting to AI module...');
    router.navigateTo('ai');
});

// Turmas Module Route
router.registerRoute('turmas', () => {
    console.log('👥 Carregando módulo Turmas...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Gestão de Turmas';
    document.querySelector('.breadcrumb').textContent = 'Home / Turmas';
    
    // Load turmas module assets and initialize the proper listing module
    const moduleContainer = document.getElementById('module-container');
    
    try {
        // Load turmas module assets (will load the proper index.js with listing view)
        router.loadModuleAssets('turmas-list');
        
        // Initialize the turmas module for listing
        setTimeout(() => {
            if (typeof window.turmasModule === 'object' && window.turmasModule.init) {
                window.turmasModule.init().catch(error => {
                    console.error('❌ Error initializing turmas module:', error);
                    moduleContainer.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar módulo</h3>
                            <p>Não foi possível inicializar o módulo de turmas.</p>
                            <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                        </div>
                    `;
                });
            } else {
                console.error('❌ Turmas module not found or not properly exported');
                moduleContainer.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Módulo não encontrado</h3>
                        <p>O módulo de turmas não foi carregado corretamente.</p>
                        <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                    </div>
                `;
            }
        }, 100);
    } catch (error) {
        console.error('❌ Error loading turmas module assets:', error);
        moduleContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar assets</h3>
                <p>Não foi possível carregar os recursos do módulo de turmas.</p>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
            </div>
        `;
    }
});

// Turma Editor Route
router.registerRoute('turma-editor', () => {
    console.log('📝 Carregando editor de turma...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Editor de Turma';
    document.querySelector('.breadcrumb').textContent = 'Home / Turmas / Editor';
    
    const moduleContainer = document.getElementById('module-container');
    
    // Extract turma ID from hash if available
    const urlParams = new URLSearchParams(window.location.search);
    const hashParts = window.location.hash.slice(1).split('/');
    const turmaId = hashParts[1] !== 'personal' ? hashParts[1] : null;
    const isPersonalSession = hashParts[1] === 'personal';
    const personalSessionId = isPersonalSession ? hashParts[2] : null;
    
    // Load turma editor HTML
    fetch('/views/modules/turmas/turma-editor.html')
        .then(response => response.text())
        .then(html => {
            moduleContainer.innerHTML = html;

            // Helper to load scripts in order
            function loadScript(src) {
                return new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
                    const s = document.createElement('script');
                    s.src = src;
                    s.onload = resolve;
                    s.onerror = reject;
                    document.body.appendChild(s);
                });
            }

            // Ensure centralized API client is present, then load courses.js, then turma-editor.js
            // If the module version doesn't expose the picker in time, try loading the legacy
            // top-level /js/courses.js as a fallback so other modules that expect window.openCoursePicker can function reliably.
            loadScript('/js/shared/api-client.js').then(() => loadScript('/js/modules/courses.js')).then(() => {
                // If the shared picker wasn't exposed by the modules file, attempt to load the
                // top-level courses.js as a fallback. This helps environments where one path
                // is present but the other is used by legacy code.
                return new Promise((resolve) => {
                    // Small grace period for the module to run and expose globals
                    setTimeout(() => {
                        if (window.openCoursePicker) {
                            resolve();
                        } else {
                            // Try loading the legacy script; ignore errors and continue
                            loadScript('/js/courses.js').then(() => resolve()).catch(() => resolve());
                        }
                    }, 50);
                });
            }).then(() => {
                loadScript('/js/modules/turmas/turma-editor.js').then(() => {
                    console.log('✅ Turma editor script loaded');
                    
                    // Wait a bit for the module to initialize
                    setTimeout(() => {
                        // Check for personal session route pattern
                        const hashParts = window.location.hash.slice(1).split('/');
                        const isPersonalRoute = hashParts[1] === 'personal';
                        const sessionId = isPersonalRoute ? hashParts[2] : null;
                        
                        // Initialize turma editor
                        if (typeof window.turmaEditor === 'object' && window.turmaEditor.initialize) {
                            window.turmaEditor.initialize(turmaId || personalSessionId).then(() => {
                                // If this is a personal session route, switch to personal tab
                                if (isPersonalSession) {
                                    const personalTabBtn = document.getElementById('tab-btn-personal');
                                    if (personalTabBtn) {
                                        personalTabBtn.click();
                                        console.log('🎯 Switched to Personal tab for session:', personalSessionId);
                                    }
                                }
                            }).catch(error => {
                                console.error('❌ Error initializing turma editor:', error);
                            });
                        } else if (typeof window.initializeTurmaEditor === 'function') {
                            window.initializeTurmaEditor(turmaId || personalSessionId).then(() => {
                                // If this is a personal session route, switch to personal tab
                                if (isPersonalSession) {
                                    const personalTabBtn = document.getElementById('tab-btn-personal');
                                    if (personalTabBtn) {
                                        personalTabBtn.click();
                                        console.log('🎯 Switched to Personal tab for session:', personalSessionId);
                                    }
                                }
                            }).catch(error => {
                                console.error('❌ Error initializing turma editor:', error);
                            });
                        } else {
                            console.error('❌ Turma editor initialization function not found');
                        }
                    }, 100); // Small delay to allow module initialization
                }).catch(() => {
                    console.error('❌ Error loading turma editor script');
                    moduleContainer.innerHTML = `
                        <div class="error-container">
                            <h3>Erro ao carregar editor</h3>
                            <p>Não foi possível carregar o script do editor de turma.</p>
                            <button onclick="location.reload()" class="btn btn-primary">Recarregar</button>
                        </div>
                    `;
                });
            }).catch(() => {
                console.error('❌ Error loading courses.js script');
                moduleContainer.innerHTML = `
                    <div class="error-container">
                        <h3>Erro ao carregar dependências</h3>
                        <p>Não foi possível carregar o seletor de cursos (courses.js).</p>
                        <button onclick="location.reload()" class="btn btn-primary">Recarregar</button>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('❌ Error loading turma editor HTML:', error);
            moduleContainer.innerHTML = `
                <div class="error-container">
                    <h3>Erro ao carregar editor</h3>
                    <p>Não foi possível carregar a interface do editor de turma.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar</button>
                </div>
            `;
        });
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Editor de Turma';
    document.querySelector('.breadcrumb').textContent = 'Home / Turmas / Editor';
});

// Organizations Module Routes
router.registerRoute('organizations', async () => {
    console.log('🏫 Carregando módulo de Organizações...');
    
    try {
        // Update header
        document.querySelector('.module-header h1').textContent = 'Gestão de Organizações';
        document.querySelector('.breadcrumb').textContent = 'Home / Organizações';
        
        // Get target container
        const container = document.getElementById('module-container');
        
        // Check if module is available
        if (typeof window.initOrganizationsModule === 'function') {
            window.organizationsModuleInitialized = true;
            await window.initOrganizationsModule(container);
        } else {
            // Load module dynamically
            const moduleScript = document.createElement('script');
            moduleScript.src = 'js/modules/organizations/index.js';
            
            moduleScript.onload = async () => {
                // Wait a bit for script to execute
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (typeof window.initOrganizationsModule === 'function') {
                    window.organizationsModuleInitialized = true;
                    await window.initOrganizationsModule(container);
                } else {
                    console.error('❌ Módulo de organizações não foi carregado corretamente');
                    container.innerHTML = `
                        <div class="error-state-premium">
                            <div class="error-icon">❌</div>
                            <h3>Erro ao carregar organizações</h3>
                            <p>O módulo de organizações não foi carregado corretamente</p>
                            <button class="btn-primary-premium" onclick="window.location.reload()">
                                🔄 Recarregar Página
                            </button>
                        </div>
                    `;
                }
            };
            
            moduleScript.onerror = () => {
                console.error('❌ Erro ao carregar script do módulo de organizações');
                container.innerHTML = `
                    <div class="error-state-premium">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar organizações</h3>
                        <p>Não foi possível carregar o script do módulo</p>
                        <button class="btn-primary-premium" onclick="window.location.reload()">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                `;
            };
            
            document.head.appendChild(moduleScript);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar módulo de organizações:', error);
        const container = document.getElementById('module-container');
        container.innerHTML = `
            <div class="error-state-premium">
                <div class="error-icon">❌</div>
                <h3>Erro ao carregar organizações</h3>
                <p>${error.message}</p>
                <button class="btn-primary-premium" onclick="window.location.reload()">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
});

// Units Module Routes
router.registerRoute('units', async () => {
    console.log('🏢 Carregando módulo de Unidades...');
    
    try {
        // Update header
        document.querySelector('.module-header h1').textContent = 'Gestão de Unidades';
        document.querySelector('.breadcrumb').textContent = 'Home / Unidades';
        
        // Get target container and ensure clean state per AGENTS.md modular isolation
        const container = document.getElementById('module-container');
        if (container) {
            // Clean only when not already hosting instructors content to avoid wiping fresh render
            const alreadyScoped = container.querySelector('#module-content.module-isolated-instructors');
            if (!alreadyScoped) {
                container.innerHTML = '';
                container.className = 'module-content';
                container.removeAttribute('data-module');
            }
        }
        
        // Check if module is available
        if (typeof window.initUnitsModule === 'function') {
            await window.initUnitsModule(container);
        } else {
            // Load module dynamically
            const moduleScript = document.createElement('script');
            moduleScript.src = 'js/modules/units/index.js';
            
            moduleScript.onload = async () => {
                // Wait a bit for script to execute
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (typeof window.initUnitsModule === 'function') {
                    await window.initUnitsModule(container);
                } else {
                    console.error('❌ Módulo de unidades não foi carregado corretamente');
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar módulo</h3>
                            <p>O módulo de unidades não pôde ser carregado.</p>
                            <button onclick="location.reload()" class="btn btn-primary">
                                Recarregar Página
                            </button>
                        </div>
                    `;
                }
            };
            
            moduleScript.onerror = () => {
                console.error('❌ Erro ao carregar script do módulo de unidades');
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro de carregamento</h3>
                        <p>Não foi possível carregar o módulo de unidades.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Tentar Novamente
                        </button>
                    </div>
                `;
            };
            
            document.head.appendChild(moduleScript);
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de unidades:', error);
        document.getElementById('module-container').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na inicialização</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }
});

router.registerRoute('unit-editor', () => {
    console.log('📝 Carregando editor de unidade...');
    
    // Extract unit ID from hash if present
    const hashParts = location.hash.split('/');
    const unitId = hashParts[1] || null;
    
    // Update header
    document.querySelector('.module-header h1').textContent = unitId ? 'Editar Unidade' : 'Nova Unidade';
    document.querySelector('.breadcrumb').textContent = 'Home / Unidades / Editor';
    
    // Load unit editor HTML
    fetch('views/modules/units/unit-editor.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            
            // Load CSS
            if (!document.querySelector('link[href="css/modules/units.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'css/modules/units.css';
                document.head.appendChild(cssLink);
            }
            
            if (!document.querySelector('link[href="css/modules/unit-editor.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'css/modules/unit-editor.css';
                document.head.appendChild(cssLink);
            }
            
            // Load JavaScript
            if (!document.querySelector('script[src="js/modules/units/unit-editor.js"]')) {
                const script = document.createElement('script');
                script.src = 'js/modules/units/unit-editor.js';
                script.type = 'application/javascript';
                script.onload = () => {
                    // Initialize the unit editor after script loads
                    setTimeout(() => {
                        if (window.unitEditor && window.unitEditor.initialize) {
                            window.unitEditor.initialize(unitId);
                        } else {
                            console.error('❌ Unit editor functions not found');
                        }
                    }, 100);
                };
                document.head.appendChild(script);
            } else {
                // Script already loaded, just initialize
                setTimeout(() => {
                    if (window.unitEditor && window.unitEditor.initialize) {
                        window.unitEditor.initialize(unitId);
                    } else {
                        console.error('❌ Unit editor functions not found');
                    }
                }, 100);
            }
        })
        .catch(error => {
            console.error('❌ Erro ao carregar editor de unidade:', error);
            document.getElementById('module-container').innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao carregar editor</h3>
                    <p>Não foi possível carregar o editor de unidades.</p>
                    <button onclick="router.navigateTo('units')" class="btn btn-primary">
                        Voltar às Unidades
                    </button>
                </div>
            `;
        });
});

// Instructors Module Routes
router.registerRoute('instructors', async () => {
    console.log('👨‍🏫 Carregando módulo de Instrutores...');
    
    try {
        // Update header
        document.querySelector('.module-header h1').textContent = 'Gestão de Instrutores';
        document.querySelector('.breadcrumb').textContent = 'Home / Instrutores';
        
        // Get target container and ensure clean state per AGENTS.md modular isolation
        const container = document.getElementById('module-container');
        if (container) {
            // Aggressive container cleaning to ensure modular isolation
            container.innerHTML = '';
            container.className = 'module-content';
            container.removeAttribute('data-module');
            // Remove any stuck CSS classes
            container.removeAttribute('style');
            // Force cleanup of any embedded content
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
        
    // Ensure assets are loaded (CSS/JS) per module registry
    try { router.loadModuleAssets && router.loadModuleAssets('instructors'); } catch(_) {}

    // Check if module is available
        if (typeof window.initInstructorsModule === 'function') {
            await window.initInstructorsModule(container);
        } else {
            // Load all module files directly in the HTML head to ensure they're available
            const scriptsToLoad = [
                'js/modules/instructors/services/InstructorsService.js',
                'js/modules/instructors/views/InstructorsListView.js', 
                'js/modules/instructors/controllers/InstructorsController.js',
                'js/modules/instructors/index.js'
            ];
            
            // Check if scripts are already loaded
            const alreadyLoaded = scriptsToLoad.every(src => {
                return Array.from(document.scripts).some(script => script.src.includes(src));
            });
            
            if (!alreadyLoaded) {
                console.log('Loading instructors module scripts...');
                for (const src of scriptsToLoad) {
                    const script = document.createElement('script');
                    script.src = src;
                    document.head.appendChild(script);
                }
                
                // Wait a bit for scripts to load
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Try to initialize
            let retries = 0;
            while (retries < 10) {
                if (typeof window.initInstructorsModule === 'function') {
                    await window.initInstructorsModule(container);
                    break;
                } else {
                    console.log(`Waiting for initInstructorsModule... attempt ${retries + 1}`);
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            if (retries >= 10) {
                console.error('❌ Módulo de instrutores não foi carregado corretamente após múltiplas tentativas');
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro ao carregar módulo</h3>
                        <p>O módulo de instrutores não pôde ser carregado após múltiplas tentativas.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Recarregar Página
                        </button>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de instrutores:', error);
        document.getElementById('module-container').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na inicialização</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }
});

router.registerRoute('hybrid-agenda', async () => {
    console.warn('ℹ️ Rota antiga "hybrid-agenda" acessada. Redirecionando para a nova Agenda...');
    const container = document.getElementById('module-container');
    if (container) {
        container.innerHTML = `
            <div class="data-card-premium" style="padding:24px; margin:16px 0;">
                <h3>Agenda unificada disponível</h3>
                <p>O módulo antigo de Agenda Híbrida foi descontinuado. Você será redirecionado para a nova Agenda.</p>
                <button class="btn btn-primary" onclick="router.navigateTo('agenda')">Ir para Agenda</button>
            </div>
        `;
    }
    setTimeout(() => router.navigateTo('agenda'), 600);
});

// Check-in Kiosk Route
router.registerRoute('checkin-kiosk', async () => {
    console.log('🖥️ Inicializando Kiosk de Check-in...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container not found');
        return;
    }

    // Update header
    document.querySelector('.module-header h1').textContent = '📸 Check-in Kiosk';
    document.querySelector('.breadcrumb').textContent = 'Home / Check-in Kiosk';

    // Clear container
    container.innerHTML = '<div class="loading-spinner"><p>⏳ Carregando módulo...</p></div>';

    try {
        // 1. Load CheckinKiosk module assets (in order)
        console.log('📦 Loading CheckinKiosk assets...');
        await loadScriptsSequentially([
            'js/modules/checkin-kiosk/services/FaceRecognitionService.js',
            'js/modules/checkin-kiosk/services/CameraService.js',
            'js/modules/checkin-kiosk/services/BiometricService.js',
            'js/modules/checkin-kiosk/services/AttendanceService.js',
            'js/modules/checkin-kiosk/views/CameraView.js',
            'js/modules/checkin-kiosk/views/ConfirmationView.js',
            'js/modules/checkin-kiosk/views/SuccessView.js',
            'js/modules/checkin-kiosk/controllers/CheckinController.js',
            'js/modules/checkin-kiosk/index.js'
        ]);
        console.log('✅ CheckinKiosk assets loaded');

        // 2. Load face-api.js library
        if (typeof faceapi === 'undefined') {
            console.log('⏳ Loading face-api.js...');
            await loadExternalScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
            console.log('✅ face-api.js loaded');
        }

        // 3. Initialize CheckinKiosk
        console.log('🎬 Initializing CheckinKiosk.init()...');
        await initializeCheckinKiosk(container);
        console.log('✅ CheckinKiosk initialized successfully');

    } catch (error) {
        console.error('❌ CheckinKiosk initialization failed:', error);
        container.innerHTML = `
            <div class="error-state">
                <h2>❌ Erro ao Carregar</h2>
                <p>${error.message || 'Falha desconhecida ao inicializar Check-in Kiosk'}</p>
                <button onclick="location.reload()">Recarregar Página</button>
            </div>
        `;
    }
});

/**
 * Initialize CheckinKiosk module
 */
async function initializeCheckinKiosk(container) {
    if (typeof window.CheckinKiosk === 'undefined') {
        throw new Error('CheckinKiosk module not loaded - window.CheckinKiosk is undefined');
    }

    try {
        console.log('🎬 Initializing CheckinKiosk.init()...');
        await window.CheckinKiosk.init('module-container');
        console.log('✅ CheckinKiosk initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing CheckinKiosk:', error);
        throw error; // Re-throw to be handled by caller
    }
}

// Import Module Route
router.registerRoute('import', async () => {
    console.log('🔄 Inicializando módulo de importação...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando módulo de importação...</p>
        </div>
    `;

    try {
        // Verificar se o módulo está disponível
        if (typeof window.initImportModule === 'function') {
            await window.initImportModule(container);
            console.log('✅ Módulo de importação inicializado com sucesso');
        } else {
            console.log('⏳ Aguardando carregamento do módulo de importação...');
            
            // Aguardar até 10 segundos pelo carregamento do módulo
            let attempts = 0;
            const maxAttempts = 100; // 10 segundos (100 * 100ms)
            
            while (!window.initImportModule && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.initImportModule) {
                await window.initImportModule(container);
                console.log('✅ Módulo de importação inicializado com sucesso (após aguardar)');
            } else {
                throw new Error('Módulo de importação não foi carregado após 10 segundos');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de importação:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na inicialização</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Recarregar Página
                </button>
            </div>
        `;
    }
});

// Lesson Execution Module Route (Activity Tracking Live Interface)
router.registerRoute('lesson-execution/:lessonId', async (params) => {
    console.log('🎯 Inicializando módulo de execução de aula ao vivo...', params);
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    // Clear container and show loading
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando execução de aula ao vivo...</p>
        </div>
    `;
    
    try {
        // Load module assets
        router.loadModuleAssets('lesson-execution');
        
        // Wait for module to be available
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.initLessonExecution && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.initLessonExecution) {
            await window.initLessonExecution(params.lessonId, container);
            console.log('✅ Módulo de execução de aula inicializado com sucesso');
        } else {
            throw new Error('Módulo de execução de aula não foi carregado após 10 segundos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de execução de aula:', error);
        container.innerHTML = `
            <div class="error-state data-card-premium">
                <div class="error-icon">⚠️</div>
                <h3>Erro na inicialização</h3>
                <p>${error.message}</p>
                <button onclick="router.navigateTo('frequency')" class="btn btn-primary">
                    ← Voltar para Frequência
                </button>
                <button onclick="location.reload()" class="btn btn-secondary">
                    🔄 Recarregar Página
                </button>
            </div>
        `;
    }
});

// Agenda Module Route
router.registerRoute('agenda', async () => {
    console.log('🔄 Inicializando módulo de agenda...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    // Clear container first
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando agenda...</p>
        </div>
    `;

    try {
        // Load module assets
        router.loadModuleAssets('agenda');
        
        // Wait for module to be available
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.agendaModule && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.agendaModule) {
            // Initialize agenda module
            await window.agendaModule.initialize();
            
            // Clear container and show agenda
            container.innerHTML = '';
            await window.agendaModule.onShow();
            
            console.log('✅ Módulo de agenda inicializado com sucesso');
        } else {
            throw new Error('Módulo de agenda não foi carregado após 10 segundos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de agenda:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na Agenda</h3>
                <p>Falha ao carregar o módulo de agenda: ${error.message}</p>
                <button onclick="router.navigateTo('agenda')" class="btn btn-primary">
                    🔄 Tentar Novamente
                </button>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-secondary">
                    🏠 Voltar ao Dashboard
                </button>
            </div>
        `;
    }
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Agenda';
    document.querySelector('.breadcrumb').textContent = 'Home / Agenda';
});

// Frequency Module Route
router.registerRoute('frequency', async () => {
    console.log('📊 Inicializando módulo de frequência...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    // Clear container first
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando módulo de frequência...</p>
        </div>
    `;

    try {
        // Load module assets
        router.loadModuleAssets('frequency');
        
        // Wait for module to be available
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.initFrequencyModule && !window.frequencyModule && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.initFrequencyModule) {
            // Use SPA initialization function if available
            await window.initFrequencyModule(container);
            console.log('✅ Módulo de frequência inicializado com sucesso (via initFrequencyModule)');
        } else if (window.frequencyModule) {
            // Fallback: use module's initialize method
            await window.frequencyModule.initialize();
            
            // Get the controller and initialize with container
            if (window.frequencyModule.controller) {
                container.innerHTML = '<div id="frequency-container"></div>';
                const frequencyContainer = container.querySelector('#frequency-container');
                await window.frequencyModule.controller.initialize(frequencyContainer, window.apiClient);
            }
            
            console.log('✅ Módulo de frequência inicializado com sucesso (via frequencyModule)');
        } else {
            throw new Error('Módulo de frequência não foi carregado após 10 segundos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de frequência:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na Frequência</h3>
                <p>Falha ao carregar o módulo de frequência: ${error.message}</p>
                <button onclick="router.navigateTo('frequency')" class="btn btn-primary">
                    🔄 Tentar Novamente
                </button>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-secondary">
                    🏠 Voltar ao Dashboard
                </button>
            </div>
        `;
    }
    
    // Update header
    const headerH1 = document.querySelector('.module-header h1');
    const breadcrumb = document.querySelector('.breadcrumb');
    if (headerH1) headerH1.textContent = 'Gestão de Frequência';
    if (breadcrumb) breadcrumb.textContent = 'Home / Frequência';
});

// Graduation Module Route
router.registerRoute('graduation', async () => {
    console.log('🎓 Inicializando módulo de Graduação...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    // Clear container first
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando módulo de graduação...</p>
        </div>
    `;

    try {
        // Helper to load scripts
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) { 
                    console.log(`✅ Script já carregado: ${src}`);
                    resolve(); 
                    return; 
                }
                const s = document.createElement('script');
                s.src = src;
                s.onload = () => {
                    console.log(`✅ Script carregado: ${src}`);
                    resolve();
                };
                s.onerror = () => {
                    console.error(`❌ Erro ao carregar script: ${src}`);
                    reject(new Error(`Falha ao carregar ${src}`));
                };
                document.body.appendChild(s);
            });
        }
        
        // API client should already be loaded, but verify
        if (!window.createModuleAPI) {
            console.warn('⚠️ API Client not found, loading...');
            await loadScript('/js/shared/api-client.js');
        }
        
        // Load view HTML
        const viewResponse = await fetch('/views/graduation.html');
        if (!viewResponse.ok) {
            throw new Error(`HTTP ${viewResponse.status}: ${viewResponse.statusText}`);
        }
        const viewHTML = await viewResponse.text();
        
        // Insert view into container
        container.innerHTML = viewHTML;
        
        // Load module JavaScript
        await loadScript('/js/modules/graduation/index.js');
        
        // Wait for module to be available
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds (50 * 100ms)
        
        while (!window.graduationModule && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.graduationModule) {
            throw new Error('Módulo de graduação não foi carregado após 5 segundos');
        }
        
        // Initialize module
        await window.graduationModule.init();
        console.log('✅ Módulo de graduação inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de graduação:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro na Graduação</h3>
                <p>Falha ao carregar o módulo de graduação: ${error.message}</p>
                <button onclick="router.navigateTo('graduation')" class="btn btn-primary">
                    🔄 Tentar Novamente
                </button>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-secondary">
                    🏠 Voltar ao Dashboard
                </button>
            </div>
        `;
    }
    
    // Update header
    const headerH1 = document.querySelector('.module-header h1');
    const breadcrumb = document.querySelector('.breadcrumb');
    if (headerH1) headerH1.textContent = 'Gestão de Graduação';
    if (breadcrumb) breadcrumb.textContent = 'Home / Graduação';
});

// CRM Module Route
router.registerRoute('crm', async () => {
    console.log('🎯 Inicializando módulo de CRM...');
    
    const container = document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container module-container não encontrado');
        return;
    }
    
    // Clear container first
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando CRM...</p>
        </div>
    `;

    try {
        // Load module assets
        router.loadModuleAssets('crm');
        
        // Wait for CRM module to be available
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        
        while (!window.crm && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.crm) {
            // Set container
            window.crm.container = container;
            
            // Initialize CRM module
            await window.crm.init();
            
            console.log('✅ Módulo de CRM inicializado com sucesso');
        } else {
            throw new Error('Módulo de CRM não foi carregado após 10 segundos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de CRM:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro no CRM</h3>
                <p>Falha ao carregar o módulo de CRM: ${error.message}</p>
                <button onclick="router.navigateTo('crm')" class="btn btn-primary">
                    🔄 Tentar Novamente
                </button>
                <button onclick="router.navigateTo('dashboard')" class="btn btn-secondary">
                    🏠 Voltar ao Dashboard
                </button>
            </div>
        `;
    }
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'CRM & Leads';
    document.querySelector('.breadcrumb').textContent = 'Home / CRM & Leads';
});

// (Legacy) Hybrid Agenda: fully archived; see earlier route redirecting to 'agenda'

// Settings Module Route
router.registerRoute('settings', async () => {
    console.log('⚙️ Carregando módulo de Configurações...');

    // Update header
    document.querySelector('.module-header h1').textContent = 'Configurações';
    document.querySelector('.breadcrumb').textContent = 'Home / Configurações';

    const container = document.getElementById('module-container');
    if (!container) return;
    container.innerHTML = '<div class="settings-loading"><div class="loading-spinner">⚙️</div><p>Carregando configurações...</p></div>';

    try {
        // Load HTML view
        const resp = await fetch('views/settings.html');
        const html = await resp.text();

        // Extract isolated content if full HTML was returned
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const isolated = tmp.querySelector('.settings-isolated');
        container.innerHTML = '';
        if (isolated) {
            container.appendChild(isolated);
        } else {
            // Fallback: inject as-is
            container.innerHTML = html;
        }

        // Ensure assets
        router.loadModuleAssets('settings');

        // Initialize module
        const tryInit = (attempts = 0) => {
            if (typeof window.loadSettings === 'function') {
                try { window.loadSettings(); } catch (e) { console.error('settings init error', e); }
            } else if (attempts < 30) {
                setTimeout(() => tryInit(attempts + 1), 150);
            }
        };
        tryInit();
    } catch (error) {
        console.error('❌ Erro ao carregar Configurações:', error);
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar configurações</h3>
                <p>${error && error.message ? error.message : 'Tente novamente'}</p>
            </div>
        `;

    }
});

// ============================================================================
// UTILITY FUNCTIONS FOR CHECKIN-KIOSK MODULE LOADING
// ============================================================================

/**
 * Load external scripts sequentially (waits for each to complete)
 * @param {string[]} urls - Array of script URLs
 */
async function loadScriptsSequentially(urls) {
    for (const url of urls) {
        await loadScript(url);
    }
}

/**
 * Load a single script and wait for it to complete
 * @param {string} url - Script URL
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        // Avoid duplicate loading
        if (document.querySelector(`script[src="${url}"]`)) {
            console.log(`✓ Script already loaded: ${url}`);
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.type = 'application/javascript';
        
        script.onload = () => {
            console.log(`✓ Script loaded: ${url}`);
            resolve();
        };
        
        script.onerror = () => {
            const error = new Error(`Failed to load script: ${url}`);
            console.error('❌', error.message);
            reject(error);
        };
        
        document.body.appendChild(script);
    });
}

/**
 * Load external script (like face-api.js)
 * @param {string} url - External script URL
 */
function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log(`✓ External script loaded: ${url}`);
            resolve();
        };
        
        script.onerror = () => {
            const error = new Error(`Failed to load external script: ${url}`);
            console.error('❌', error.message);
            reject(error);
        };
        
        document.head.appendChild(script);
    });
}

// ✅ PREVENT MULTIPLE INITIALIZATIONS
if (!window._routerInitialized) {
    // Inicializar router quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Inicializando SPA Router...');
        router.initEventListeners();

        // 🔥 ALWAYS START AT DASHBOARD (ignore hash from previous session)
        console.log('🏠 [Router] Forcing initial navigation to dashboard');
        window.location.hash = '#dashboard';
        router.navigateTo('dashboard');
        
        // Mark as initialized
        window._routerInitialized = true;
    });
} else {
    console.log('✅ Router já inicializado, pulando inicialização');
}

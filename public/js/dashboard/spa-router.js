class SPARouter {
    constructor() {
        this.routes = {};
        this.currentModule = null;
        this.isNavigating = false; // Add navigation lock
        
        // Global module state management
        this.moduleStates = new Map();
        this.initializingModules = new Set();
        
        this.initEventListeners();
        this.navigateTo(this.getModuleFromHash() || 'dashboard');
    }
    
    /**
     * Get or initialize module state
     */
    getModuleState(moduleName) {
        if (!this.moduleStates.has(moduleName)) {
            this.moduleStates.set(moduleName, {
                isInitialized: false,
                isInitializing: false,
                initPromise: null,
                instance: null,
                container: null,
                lastError: null,
                initCount: 0
            });
        }
        return this.moduleStates.get(moduleName);
    }
    
    /**
     * Check if module is currently initializing
     */
    isModuleInitializing(moduleName) {
        return this.initializingModules.has(moduleName);
    }
    
    /**
     * Mark module as initializing
     */
    markModuleInitializing(moduleName) {
        console.log(`🔄 [Router] Marking ${moduleName} as initializing...`);
        this.initializingModules.add(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = true;
        state.initCount++;
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
            
            // Update header for cached modules
            if (moduleName === 'students') {
                document.querySelector('.module-header h1').textContent = 'Gestão de Estudantes';
                document.querySelector('.breadcrumb').textContent = 'Home / Estudantes';
                
                // Reinitialize UI with cached instance
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
        this.routes[module] = handler;
    }

    // Resolve first path segment from hash, e.g. '#plan-editor/123' -> 'plan-editor'
    getModuleFromHash() {
        const raw = (location.hash || '').slice(1);
        return raw.split('/')[0] || raw;
    }

    navigateTo(module) {
        if (this.routes[module]) {
            // Remover módulo ativo anterior
            if (this.currentModule) {
                const prevItem = document.querySelector(`.main-menu li[data-module="${this.currentModule}"]`);
                if (prevItem) prevItem.classList.remove('active');
            }
            
            // Ativar novo módulo
            this.currentModule = module;
            const newItem = document.querySelector(`.main-menu li[data-module="${module}"]`);
            if (newItem) newItem.classList.add('active');
            
            // Atualizar URL somente se o primeiro segmento for diferente (não clobber IDs)
            const currentFirst = (location.hash || '').slice(1).split('/')[0];
            if (currentFirst !== module) {
                location.hash = module;
            }
            
            // Executar handler do módulo
            this.routes[module]();
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
                js: 'js/modules/students/student-editor/student-editor.js'
            },
            'techniques': {
                css: 'css/modules/techniques.css',
                js: 'js/modules/techniques.js'
            },
            'packages': {
                css: 'css/modules/packages.css',
                js: 'js/modules/packages/index.js'
            },
            'package-editor': {
                css: 'css/modules/packages.css',
                js: 'js/modules/packages/index.js'
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
                js: 'js/modules/lesson-plans/lesson-plans.js'
            },
            'courses': {
                css: 'css/modules/courses/courses.css',
                js: 'js/modules/courses.js'
            },
            'course-editor': {
                css: 'css/modules/courses/course-editor.css',
                js: 'js/modules/course-editor.js'
            },
            'ai': {
                css: 'css/modules/ai/ai.css',
                js: 'js/modules/ai.js'
            },
            'rag': {
                css: 'css/modules/rag/rag.css',
                js: 'js/modules/rag/index.js'
            },
            'turmas': {
                css: 'css/modules/turmas-consolidated.css',
                js: 'js/modules/turmas-consolidated.js'
            },
            'organizations': {
                css: 'css/modules/organizations/organizations.css',
                js: 'js/modules/organizations/index.js'
            },
            'units': {
                css: 'css/modules/units.css',
                js: 'js/modules/units/index.js'
            },
            'unit-editor': {
                css: 'css/modules/unit-editor.css'
            },
            'instructors': {
                css: 'css/modules/instructors.css',
                js: 'js/modules/instructors/index.js'
            },
            'instructor-editor': {
                css: 'css/modules/instructor-editor.css'
            },
            'agenda': {
                css: 'css/modules/agenda.css',
                js: [
                    'js/modules/agenda/services/agendaService.js',
                    'js/modules/agenda/controllers/calendarController.js',
                    'js/modules/agenda/index.js'
                ]
            },
            'settings': {
                css: 'css/modules/settings.css',
                js: 'js/modules/settings.js'
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
            url.includes('services/')) {
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

        // Navegação pelo botão voltar/avancar
        window.addEventListener('hashchange', () => {
            const module = this.getModuleFromHash();
            if (module && this.routes[module]) {
                this.navigateTo(module);
            }
        });
    }
}

// Inicialização do router
const router = new SPARouter();

// Tornar router globalmente acessível
window.router = router;

// Registro das rotas
router.registerRoute('dashboard', () => {
    document.getElementById('module-container').innerHTML = `
        <div class="welcome-message">
            <h2>Dashboard Principal</h2>
            <p>Selecione um módulo no menu lateral para começar</p>
        </div>
    `;
    document.querySelector('.module-header h1').textContent = 'Dashboard';
    document.querySelector('.breadcrumb').textContent = 'Home / Dashboard';
});

router.registerRoute('students', async () => {
    const moduleName = 'students';
    
    // Use promise-based concurrent protection
    return router.safeModuleInitialization(moduleName, async () => {
        console.log('📋 [NETWORK] Carregando módulo de Estudantes...');
        
        // Update header
        document.querySelector('.module-header h1').textContent = 'Gestão de Estudantes';
        document.querySelector('.breadcrumb').textContent = 'Home / Estudantes';
        
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
                
                moduleScript.onload = async () => {
                    try {
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
        if (typeof window.initializeLessonPlansModule === 'function') {
            try {
                const container = document.querySelector('#lessonPlansContainer') ||
                                 document.querySelector('.lesson-plans-container') ||
                                 document.querySelector('.lesson-plans-isolated');
                
                if (container) {
                    console.log('📚 Initializing lesson plans module...');
                    window.initializeLessonPlansModule();
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
            console.error('❌ initializeLessonPlansModule function not found');
            moduleContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>A função de inicialização não foi encontrada.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    }, 150);
    
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
        if (typeof window.initializeLessonPlansModule === 'function') {
            try {
                window.initializeLessonPlansModule();
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
    console.log('🤖 Carregando módulo de IA...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Inteligência Artificial';
    document.querySelector('.breadcrumb').textContent = 'Home / Cursos / IA';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    // Load the AI view
    fetch('views/modules/ai/ai.html')
        .then(r => r.text())
        .then(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const inner = tmp.querySelector('.ai-isolated');
            if (inner) {
                container.innerHTML = '';
                container.appendChild(inner);
            } else {
                // Fallback: inject as-is
                container.innerHTML = html;
            }
            
            router.loadModuleAssets('ai');
            
            // Initialize AI module
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
        })
        .catch(err => {
            console.error('❌ Erro ao carregar módulo de IA:', err);
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

// RAG Module Route
router.registerRoute('rag', () => {
    console.log('🧠 Carregando módulo RAG...');
    
    // Clear module container first
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = '<div id="ragContainer" class="rag-container"></div>';
    
    // Load module assets
    router.loadModuleAssets('rag');
    
    // Wait for assets and initialize
    setTimeout(() => {
        if (typeof window.ragModule?.init === 'function') {
            try {
                const container = document.querySelector('#ragContainer') ||
                                 document.querySelector('.rag-container') ||
                                 document.querySelector('.rag-isolated');
                
                if (container) {
                    console.log('🧠 Initializing RAG module...');
                    window.ragModule.init();
                } else {
                    console.error('❌ RAG container not found');
                    moduleContainer.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Container não encontrado</h3>
                            <p>Não foi possível encontrar o container do módulo RAG.</p>
                            <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('❌ Error initializing RAG module:', error);
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
            console.error('❌ RAG module not found');
            moduleContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não carregado</h3>
                    <p>A função de inicialização do RAG não foi encontrada.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar Página</button>
                </div>
            `;
        }
    }, 150);
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'RAG Knowledge System';
    document.querySelector('.breadcrumb').textContent = 'Home / RAG System';
});

// Turmas Module Route
router.registerRoute('turmas', () => {
    // Prevent multiple rapid calls
    if (router.isNavigating) {
        console.log('👥 Navigation already in progress, ignoring...');
        return;
    }
    
    console.log('👥 Carregando módulo Turmas...');
    router.isNavigating = true;
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Gestão de Turmas';
    document.querySelector('.breadcrumb').textContent = 'Home / Turmas';
    
    // Clear module container first
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = '<div id="turmasContainer" class="turmas-container"></div>';
    
    // Load module assets (CSS and JS)
    router.loadModuleAssets('turmas');
    
    // Wait for assets and initialize
    setTimeout(() => {
        if (typeof window.initializeTurmasModule === 'function') {
            window.initializeTurmasModule().then(() => {
                router.isNavigating = false;
            }).catch(error => {
                router.isNavigating = false;
                console.error('❌ Error initializing turmas:', error);
                moduleContainer.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro de inicialização</h3>
                        <p>${error.message}</p>
                        <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                    </div>
                `;
            });
        } else {
            router.isNavigating = false;
            console.error('❌ initializeTurmasModule not found');
            moduleContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Módulo não encontrado</h3>
                    <p>Função de inicialização não disponível.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Recarregar</button>
                </div>
            `;
        }
    }, 200);
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
    const turmaId = hashParts[1] || urlParams.get('id');
    
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

            // Load courses.js first, then turma-editor.js. If the module version doesn't expose the
            // picker in time, try loading the legacy top-level /js/courses.js as a fallback so
            // other modules that expect window.openCoursePicker can function reliably.
            loadScript('/js/modules/courses.js').then(() => {
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
                        // Initialize turma editor
                        if (typeof window.turmaEditor === 'object' && window.turmaEditor.initialize) {
                            window.turmaEditor.initialize(turmaId).catch(error => {
                                console.error('❌ Error initializing turma editor:', error);
                            });
                        } else if (typeof window.initializeTurmaEditor === 'function') {
                            window.initializeTurmaEditor(turmaId).catch(error => {
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
    // Prevent multiple rapid calls
    if (router.isNavigating) {
        console.log('🏫 Navigation already in progress, ignoring organizations...');
        return;
    }
    
    console.log('🏫 Carregando módulo de Organizações...');
    router.isNavigating = true;
    
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
            router.isNavigating = false;
        } else {
            // Load module dynamically
            const moduleScript = document.createElement('script');
            moduleScript.type = 'module';
            moduleScript.src = 'js/modules/organizations/index.js';
            
            moduleScript.onload = async () => {
                if (typeof window.initOrganizationsModule === 'function') {
                    window.organizationsModuleInitialized = true;
                    await window.initOrganizationsModule(container);
                    router.isNavigating = false;
                } else {
                    router.isNavigating = false;
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
                router.isNavigating = false;
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
        router.isNavigating = false;
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
            moduleScript.type = 'module';
            moduleScript.src = 'js/modules/units/index.js';
            
            moduleScript.onload = async () => {
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

router.registerRoute('instructor-editor', () => {
    console.log('📝 Carregando editor de instrutor...');
    
    // Extract instructor ID from hash if present
    const hashParts = location.hash.split('/');
    const instructorId = hashParts[1] || null;
    
    // Update header
    document.querySelector('.module-header h1').textContent = instructorId ? 'Editar Instrutor' : 'Novo Instrutor';
    document.querySelector('.breadcrumb').textContent = 'Home / Instrutores / Editor';
    
    // Load instructor editor HTML
    fetch('views/modules/instructors/instructor-editor.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            
            // Load CSS
            if (!document.querySelector('link[href="css/modules/instructors.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'css/modules/instructors.css';
                document.head.appendChild(cssLink);
            }
            
            if (!document.querySelector('link[href="css/modules/instructor-editor.css"]')) {
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'css/modules/instructor-editor.css';
                document.head.appendChild(cssLink);
            }
            
            // Load JavaScript
            if (!document.querySelector('script[src="js/modules/instructors/instructor-editor.js"]')) {
                const script = document.createElement('script');
                script.src = 'js/modules/instructors/instructor-editor.js';
                script.type = 'application/javascript';
                document.head.appendChild(script);
            }
        })
        .catch(error => {
            console.error('❌ Erro ao carregar editor de instrutor:', error);
            document.getElementById('module-container').innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro ao carregar editor</h3>
                    <p>Não foi possível carregar o editor de instrutores.</p>
                    <button onclick="router.navigateTo('instructors')" class="btn btn-primary">
                        Voltar aos Instrutores
                    </button>
                </div>
            `;
        });
});

// Frequency Module Route
router.registerRoute('frequency', async () => {
    console.log('📊 Carregando módulo de Frequência...');
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Gestão de Frequência';
    document.querySelector('.breadcrumb').textContent = 'Home / Frequência';
    
    // Get target container
    const container = document.getElementById('module-container');
    
    try {
        // Check if initialization function is available
        if (typeof window.initFrequencyModule === 'function') {
            await window.initFrequencyModule(container);
        } else {
            // Wait for module to load and try again
            let attempts = 0;
            const maxAttempts = 20;
            
            while (!window.initFrequencyModule && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (window.initFrequencyModule) {
                await window.initFrequencyModule(container);
            } else {
                throw new Error('Módulo de frequência não foi carregado após 10 segundos');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de frequência:', error);
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

// Check-in Kiosk Route
router.registerRoute('checkin-kiosk', () => {
    console.log('🖥️ Redirecionando para Kiosk de Check-in...');
    
    // Redirect to standalone kiosk page
    window.open('/views/checkin-kiosk.html', '_blank');
    
    // Show info in current page
    const container = document.getElementById('module-container');
    container.innerHTML = `
        <div class="kiosk-redirect-info">
            <div class="kiosk-icon">🖥️</div>
            <h2>Kiosk de Check-in</h2>
            <p>O kiosk foi aberto em uma nova janela/aba.</p>
            <div class="kiosk-features">
                <h3>Funcionalidades do Kiosk:</h3>
                <ul>
                    <li>✅ Busca por matrícula</li>
                    <li>📊 Dashboard do aluno</li>
                    <li>📅 Aulas disponíveis</li>
                    <li>⚡ Check-in rápido</li>
                    <li>📱 Interface touch-friendly</li>
                </ul>
            </div>
            <div class="kiosk-actions">
                <button onclick="window.open('/views/checkin-kiosk.html', '_blank')" class="btn btn-primary">
                    🖥️ Abrir Kiosk Novamente
                </button>
                <button onclick="router.navigateTo('frequency')" class="btn btn-secondary">
                    📊 Ir para Frequência
                </button>
            </div>
        </div>
    `;
    
    // Update header
    document.querySelector('.module-header h1').textContent = 'Kiosk de Check-in';
    document.querySelector('.breadcrumb').textContent = 'Home / Frequência / Kiosk';
});

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
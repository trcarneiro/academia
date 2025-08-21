class SPARouter {
    constructor() {
        this.routes = {};
        this.currentModule = null;
        this.initEventListeners();
        this.navigateTo(this.getModuleFromHash() || 'dashboard');
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
            'plans': {
                css: 'css/modules/plans.css',
                js: 'js/modules/plans.js'
            },
            'plan-editor': {
                css: 'css/modules/plan-editor-padronizado.css',
                js: 'js/modules/plan-editor.js'
            },
            'activities': {
                css: 'css/modules/activities.css',
                js: 'js/modules/activities.js'
            },
            'lesson-plans': {
                css: 'css/modules/lesson-plans.css',
                js: 'js/modules/lesson-plans.js'
            },
            'courses': {
                css: 'css/modules/courses/courses.css',
                js: 'js/modules/courses.js'
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
    console.log('📋 Carregando módulo de Estudantes...');
    
    try {
        // Update header
        document.querySelector('.module-header h1').textContent = 'Gestão de Estudantes';
        document.querySelector('.breadcrumb').textContent = 'Home / Estudantes';
        
        // Get target container
        const container = document.getElementById('module-container');
        
        // Check if module is available
        if (typeof window.initStudentsModule === 'function') {
            await window.initStudentsModule(container);
        } else {
            // Load module dynamically
            const moduleScript = document.createElement('script');
            moduleScript.type = 'module';
            moduleScript.src = 'js/modules/students/index.js';
            
            moduleScript.onload = async () => {
                if (typeof window.initStudentsModule === 'function') {
                    await window.initStudentsModule(container);
                } else {
                    console.error('❌ Módulo de estudantes não foi carregado corretamente');
                    container.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⚠️</div>
                            <h3>Erro ao carregar módulo</h3>
                            <p>O módulo de estudantes não pôde ser carregado.</p>
                            <button onclick="location.reload()" class="btn btn-primary">
                                Recarregar Página
                            </button>
                        </div>
                    `;
                }
            };
            
            moduleScript.onerror = () => {
                console.error('❌ Erro ao carregar script do módulo de estudantes');
                container.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Erro de carregamento</h3>
                        <p>Não foi possível carregar o módulo de estudantes.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Tentar Novamente
                        </button>
                    </div>
                `;
            };
            
            document.head.appendChild(moduleScript);
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de estudantes:', error);
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
router.registerRoute('plans', () => {
    // Carregar HTML do módulo de planos
    fetch('views/plans.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('plans');
            
            // Inicializar módulo após carregamento (similar ao students)
            const initInterval = setInterval(() => {
                if (typeof window.initializePlansModule === 'function') {
                    clearInterval(initInterval);
                    
                    const container = document.querySelector('#plansContainer') ||
                                     document.querySelector('.module-isolated-container') ||
                                     document.querySelector('.plans-isolated');
                    
                    console.log('Plans container:', container);
                    console.log('initializePlansModule function exists:', typeof window.initializePlansModule === 'function');
                    
                    if (container) {
                        try {
                            console.log('Initializing plans module...');
                            window.initializePlansModule();
                        } catch (err) {
                            console.error('Error initializing plans module:', err);
                        }
                    } else {
                        console.error('Plans container not found');
                    }
                }
            }, 100);
        });
    
    document.querySelector('.module-header h1').textContent = 'Planos';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos';
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

router.registerRoute('activities', () => {
    // Carregar HTML do módulo de atividades
    fetch('views/modules/activities.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('activities');
        });
    
    document.querySelector('.module-header h1').textContent = 'Atividades';
    document.querySelector('.breadcrumb').textContent = 'Home / Atividades';
});

router.registerRoute('lesson-plans', () => {
    // NÃO carregar HTML estático - usar apenas o módulo JavaScript
    // Clear module container first
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = '<div id="lessonPlansContainer" class="lesson-plans-container"></div>';
    
    // Load module assets
    router.loadModuleAssets('lesson-plans');
    
    // Aguardar o carregamento dos assets e inicializar o módulo
    setTimeout(() => {
        if (typeof window.initializeLessonPlansModule === 'function') {
            try {
                // Procurar pelo container do módulo
                const container = document.querySelector('#lessonPlansContainer') ||
                                 document.querySelector('.lesson-plans-container') ||
                                 document.querySelector('.lesson-plans-isolated');
                
                if (container) {
                    console.log('Initializing lesson plans module...');
                    window.initializeLessonPlansModule();
                } else {
                    console.error('Lesson plans container not found');
                }
            } catch (error) {
                console.error('Error initializing lesson plans module:', error);
            }
        } else {
            console.error('initializeLessonPlansModule function not found');
        }
    }, 100);
    
    document.querySelector('.module-header h1').textContent = 'Planos de Aula';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos de Aula';
});

router.registerRoute('plan-editor', () => {
    console.log('📝 Carregando editor de plano...');

    // Parse id from hash (pattern: #plan-editor/<id>)
    const parts = location.hash.split('/');
    const planId = parts[1] && parts[1] !== 'plan-editor' ? parts[1] : null;

    // Update header/breadcrumb to keep sidebar layout consistent
    document.querySelector('.module-header h1').textContent = planId ? 'Editar Plano' : 'Novo Plano';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos / Editor';

    const container = document.getElementById('module-container');

    // Provide EditingSession for the editor script to consume
    window.EditingSession = {
        _id: planId,
        getEditingPlanId() { return this._id; },
        setEditingPlanId(id) { this._id = id; },
        clearEditingPlanId() { this._id = null; }
    };

    // Load the editor view and extract inner content
    fetch('views/plan-editor.html')
        .then(r => r.text())
        .then(html => {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const inner = tmp.querySelector('.module-isolated-base');
            if (inner) {
                container.innerHTML = '';
                container.appendChild(inner);
            } else {
                // Fallback: inject as-is
                container.innerHTML = html;
            }
            router.loadModuleAssets('plan-editor');
            // Ensure plan-editor initialization runs even if script was loaded earlier
            const tryInit = (attempts = 0) => {
                if (typeof window.initializePlanEditor === 'function') {
                    try { window.initializePlanEditor(); } catch (e) { console.error('plan-editor init error', e); }
                } else if (attempts < 30) {
                    setTimeout(() => tryInit(attempts + 1), 150);
                }
            };
            tryInit();
        })
        .catch(err => {
            console.error('❌ Erro ao carregar editor de planos:', err);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro de carregamento</h3>
                    <p>${err.message}</p>
                    <button onclick="router.navigateTo('plans')" class="btn btn-primary">Voltar aos Planos</button>
                </div>
            `;
        });
});
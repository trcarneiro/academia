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
router.registerRoute('billing', () => {
    console.log('💰 Carregando módulo de Cobrança...');
    
    // Carregar HTML do módulo de planos de cobrança
    fetch('views/plans.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('plans');
            
            // Inicializar módulo após carregamento
            const initInterval = setInterval(() => {
                if (typeof window.initializePlansModule === 'function') {
                    clearInterval(initInterval);
                    
                    const container = document.querySelector('#plansContainer') ||
                                     document.querySelector('.module-isolated-container') ||
                                     document.querySelector('.plans-isolated');
                    
                    console.log('💰 Plans container:', container);
                    console.log('💰 initializePlansModule function exists:', typeof window.initializePlansModule === 'function');
                    
                    if (container) {
                        try {
                            console.log('💰 Initializing billing plans module...');
                            window.initializePlansModule();
                        } catch (err) {
                            console.error('❌ Error initializing billing plans module:', err);
                        }
                    } else {
                        console.error('❌ Billing plans container not found');
                    }
                }
            }, 100);
        })
        .catch(err => {
            console.error('❌ Erro ao carregar módulo de cobrança:', err);
            document.getElementById('module-container').innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Erro de carregamento</h3>
                    <p>${err.message}</p>
                    <button onclick="router.navigateTo('dashboard')" class="btn btn-primary">Voltar ao Dashboard</button>
                </div>
            `;
        });
    
    document.querySelector('.module-header h1').textContent = 'Planos de Cobrança';
    document.querySelector('.breadcrumb').textContent = 'Home / Cobrança';
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

    // Garantir que o script do editor que usa window.location.search receba o ID
    try {
        const u = new URL(window.location.href);
        if (activityId) {
            u.searchParams.set('id', activityId);
        } else {
            u.searchParams.delete('id');
        }
        // Não alterar o hash ao atualizar a busca
        history.replaceState(null, '', u.toString());
    } catch (e) { console.warn('Não foi possível ajustar URL search param para activityId', e); }

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
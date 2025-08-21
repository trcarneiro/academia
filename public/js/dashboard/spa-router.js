class SPARouter {
    constructor() {
        this.routes = {};
        this.currentModule = null;
        this.initEventListeners();
        this.navigateTo(location.hash.slice(1) || 'dashboard');
    }

    registerRoute(module, handler) {
        this.routes[module] = handler;
    }

    navigateTo(module) {
        if (this.routes[module]) {
            // Remover módulo ativo anterior
            if (this.currentModule) {
                document.querySelector(`.main-menu li[data-module="${this.currentModule}"]`)
                    .classList.remove('active');
            }
            
            // Ativar novo módulo
            this.currentModule = module;
            document.querySelector(`.main-menu li[data-module="${module}"]`)
                .classList.add('active');
            
            // Atualizar URL
            location.hash = module;
            
            // Executar handler do módulo
            this.routes[module]();
        }
    }

    loadModuleAssets(module) {
        // Mapeamento de caminhos específicos para cada módulo
        const assetMap = {
            'students': {
                css: 'css/modules/students.css',
                js: 'js/modules/students/index.js'  // Atualizado para usar index.js
            },
            'student-editor': {
                css: 'css/modules/students.css',
                js: 'js/modules/students/student-editor/student-editor.js'
            },
            'techniques': {
                css: 'css/modules/techniques.css',
                js: 'js/modules/techniques.js'
            },
            'plans': {
                css: 'css/modules/plans.css',
                js: 'js/modules/plans.js'
            }
        };

        if (assetMap[module]) {
            if (assetMap[module].css) {
                this.loadCSS(assetMap[module].css);
            }
            if (assetMap[module].js) {
                this.loadJS(assetMap[module].js);
            }
        }
    }

    loadCSS(url) {
        // Evitar carregamento duplicado
        if (document.querySelector(`link[href="${url}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }

    loadJS(url) {
        // Evitar carregamento duplicado
        if (document.querySelector(`script[src="${url}"]`)) return;
        
        const script = document.createElement('script');
        script.src = url;
        
        // Verificar se é um módulo ES6 (baseado no caminho)
        if (url.includes('student-editor') || url.includes('techniques') || url.includes('students/index.js')) {
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
            const module = location.hash.slice(1);
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

router.registerRoute('students', () => {
    // Carregar lista de alunos
    fetch('views/students.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('students');
            
            // Inicializar módulo após carregamento
            const initInterval = setInterval(() => {
                if (window.studentsModuleLoaded && typeof window.initStudentsList === 'function') {
                    clearInterval(initInterval);
                    
                    const container = document.querySelector('#studentsContainer') ||
                                     document.querySelector('#studentsList') ||
                                     document.querySelector('[data-students-target]');
                    
                    console.log('Students container:', container);
                    console.log('initStudentsList function exists:', typeof window.initStudentsList === 'function');
                    
                    if (container) {
                        try {
                            console.log('Initializing students list module...');
                            window.initStudentsList(container);
                        } catch (err) {
                            console.error('Error initializing students list:', err);
                        }
                    } else {
                        console.error('Students container not found');
                    }
                }
            }, 100);
        });
    
    document.querySelector('.module-header h1').textContent = 'Alunos';
    document.querySelector('.breadcrumb').textContent = 'Home / Alunos';
});

router.registerRoute('student-editor', () => {
    // Carregar editor de aluno
    fetch('views/student-editor.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('student-editor');
        });
    
    document.querySelector('.module-header h1').textContent = 'Editor de Aluno';
    document.querySelector('.breadcrumb').textContent = 'Home / Alunos / Editor';
});

// Restaurar funcionalidade completa dos módulos
router.registerRoute('plans', () => {
    // Carregar HTML do módulo de planos
    fetch('views/plans.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('module-container').innerHTML = html;
            router.loadModuleAssets('plans');
        });
    
    document.querySelector('.module-header h1').textContent = 'Planos';
    document.querySelector('.breadcrumb').textContent = 'Home / Planos';
});

router.registerRoute('courses', () => {
    // Carregar HTML do módulo de cursos
    fetch('views/courses.html')
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
    // Tela consolidada com todos os módulos
    document.getElementById('module-container').innerHTML = `
        <div class="consolidation-view">
            <h2>Centro de Atividades</h2>
            <p>Gerencie todos os recursos em um único lugar</p>
            
            <div class="modules-grid">
                <div class="module-card" data-module="activities" onclick="router.navigateTo('activities')">
                    <h3>🏋️ Atividades</h3>
                    <p>Gerenciamento principal</p>
                </div>
                <div class="module-card" data-module="plans" onclick="router.navigateTo('plans')">
                    <h3>📋 Planos</h3>
                    <p>Gerencie planos de pagamento</p>
                </div>
                <div class="module-card" data-module="courses" onclick="router.navigateTo('courses')">
                    <h3>🎓 Cursos</h3>
                    <p>Organize cursos oferecidos</p>
                </div>
                <div class="module-card" data-module="techniques" onclick="router.navigateTo('techniques')">
                    <h3>🥋 Técnicas</h3>
                    <p>Registre técnicas ensinadas</p>
                </div>
                <div class="module-card" data-module="students" onclick="router.navigateTo('students')">
                    <h3>👨‍🎓 Alunos</h3>
                    <p>Gestão de alunos</p>
                </div>
                <div class="module-card" data-module="financial" onclick="router.navigateTo('financial')">
                    <h3>💰 Financeiro</h3>
                    <p>Controle financeiro</p>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('.module-header h1').textContent = 'Atividades';
    document.querySelector('.breadcrumb').textContent = 'Home / Atividades';
});
/**
 * Sistema de Navegação Modular
 * Seguindo diretrizes do CLAUDE.md
 */

class ModularSystem {
    constructor() {
        this.currentModule = null;
        this.modules = new Map();
        this.isInitialized = false;
        
        this.moduleRoutes = {
            'dashboard': '/views/dashboard.html',
            'students': '/views/students.html',
            'student-editor': '/views/student-editor.html',
            'courses': '/modules/courses/courses.html',
            'course-editor': '/modules/courses/course-editor.html',
            'plans': '/views/plans.html',
            'plan-editor': '/views/plan-editor.html',
            'lessons': '/views/lessons.html',
            'lesson-plans': '/views/lesson-plans.html',
            'attendance': '/views/attendance.html',
            'reports': '/views/reports.html',
            'financial': '/views/financial.html',
            'organizations': '/views/organizations.html',
            'settings': '/views/settings.html'
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Sistema Modular...');
        
        try {
            await this.loadSidebar();
            await this.loadInitialModule();
            this.hideLoading();
            this.isInitialized = true;
            
            console.log('✅ Sistema Modular inicializado');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showError('Erro ao inicializar o sistema');
        }
    }

    async loadSidebar() {
        // Implementar carregamento da sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = `
                <div class="sidebar-header">
                    <h2>🥋 Krav Academy</h2>
                </div>
                <nav class="sidebar-nav">
                    <a href="#" onclick="navigateToModule('dashboard')" class="nav-item">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                    <a href="#" onclick="navigateToModule('students')" class="nav-item">
                        <span class="nav-icon">👥</span>
                        <span class="nav-text">Estudantes</span>
                    </a>
                    <a href="#" onclick="navigateToModule('courses')" class="nav-item">
                        <span class="nav-icon">📚</span>
                        <span class="nav-text">Cursos</span>
                    </a>
                    <a href="#" onclick="navigateToModule('plans')" class="nav-item">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">Planos</span>
                    </a>
                </nav>
            `;
        }
    }

    async loadInitialModule() {
        // Carregar dashboard por padrão
        await this.navigateToModule('dashboard');
    }

    async navigateToModule(moduleName, queryParams = '') {
        console.log('🔄 Navigating to:', moduleName, queryParams ? 'with params: ' + queryParams : '');
        
        if (this.currentModule === moduleName) return;
        
        try {
            // Limpar módulo anterior
            if (this.modules.has(this.currentModule)) {
                await this.unloadModule(this.currentModule);
            }

            // Carregar novo módulo
            const route = this.moduleRoutes[moduleName];
            if (!route) {
                console.error('❌ Unknown module:', moduleName);
                return;
            }

            await this.loadModuleContent(moduleName, route);
            
            this.currentModule = moduleName;
            console.log(`✅ Módulo ${moduleName} carregado`);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar módulo ${moduleName}:`, error);
            this.showError(`Erro ao carregar ${moduleName}`);
        }
    }

    async loadModuleContent(moduleName, url) {
        console.log('🔧 Loading module content:', moduleName, url);

        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Extract body content from the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyContent = doc.body.innerHTML;
            
            console.log('📄 Extracted body content preview:', bodyContent.substring(0, 200) + '...');
            
            // Get main content area
            const contentContainer = document.getElementById('mainContent');
            
            if (!contentContainer) {
                console.error('❌ Content container not found');
                return;
            }

            // Clear existing content
            contentContainer.innerHTML = bodyContent;

            // Wait for DOM to be ready
            await this.waitForDOM();

            // Load module assets
            await this.loadModuleAssets(moduleName);

        } catch (error) {
            console.error('❌ Error loading module:', error);
        }
    }

    async waitForDOM() {
        return new Promise(resolve => {
            let cycles = 0;
            const maxCycles = 3;
            
            function checkAndWait() {
                cycles++;
                const content = document.getElementById('mainContent');
                const hasContent = content && content.innerHTML.length > 100;
                
                console.log(`🔍 DOM cycle ${cycles}: Content length = ${hasContent ? content.innerHTML.length : 0}`);
                
                if (cycles >= maxCycles && hasContent) {
                    resolve();
                } else {
                    requestAnimationFrame(() => {
                        if (cycles < maxCycles) {
                            checkAndWait();
                        } else {
                            resolve();
                        }
                    });
                }
            }
            
            requestAnimationFrame(checkAndWait);
        });
    }

    async loadModuleAssets(moduleName) {
        console.log('🔌 Loading assets for module:', moduleName);

        // Load CSS (handle special cases)
        let cssPath = `/css/modules/${moduleName}.css`;
        if (moduleName === 'course-editor') {
            // Real file lives under /modules/courses
            cssPath = '/modules/courses/course-editor.css';
        } else if (moduleName === 'courses') {
            cssPath = '/modules/courses/courses.css';
        }
        if (!document.querySelector(`link[href="${cssPath}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }

        // Load JS
        let jsPath = `/js/modules/${moduleName}.js`;
        if (moduleName === 'student-editor') {
            jsPath = '/js/modules/student-editor/main.js';
        }

        if (!document.querySelector(`script[src="${jsPath}"]`)) {
            const script = document.createElement('script');
            script.src = jsPath;
            if (moduleName === 'student-editor') script.type = 'module';
            script.onload = () => this.initializeModule(moduleName);
            script.onerror = (error) => {
                console.error(`❌ Erro ao carregar JS do módulo ${moduleName}:`, error);
                setTimeout(()=>{
                    if (typeof window.initializeCourseEditorModule === 'function' && moduleName==='course-editor') {
                        console.warn('⚠️ Tentando inicializar course-editor apesar do erro de carregamento');
                        window.initializeCourseEditorModule();
                    }
                }, 300);
            };
            document.head.appendChild(script);
        } else {
            this.initializeModule(moduleName);
        }
    }

    async initializeModule(moduleName) {
        console.log(`✅ Module ${moduleName} JS loaded successfully`);
        if (moduleName === 'student-editor') {
            setTimeout(() => {
                console.log('🔧 Auto-inicializando Student Editor Module...');
                if (typeof window.initializeStudentEditor === 'function') {
                    window.initializeStudentEditor();
                } else {
                    console.error('❌ initializeStudentEditor function not found');
                    console.warn('⚠️ Tentando recarregar módulo student-editor...');
                    location.reload();
                }
            }, 100);
            return;
        }

        const initFunctions = {
            'students': 'initializeStudentsModule',
            'courses': 'initializeCoursesModule',
            'course-editor': 'initializeCourseEditorModule',
            'plans': 'initializePlansModule',
            'plan-editor': 'initializePlanEditor',
            'lessons': 'initializeLessonsModule',
            'lesson-plans': 'initializeLessonPlansModule'
        };
        const initFunctionName = initFunctions[moduleName];
        if (initFunctionName && typeof window[initFunctionName] === 'function') {
            setTimeout(() => {
                console.log(`🔧 Auto-inicializando ${moduleName} Module...`);
                window[initFunctionName]();
            }, 100);
        } else if (initFunctionName && typeof window[initFunctionName] !== 'function') {
            console.warn(`⚠️ Função ${initFunctionName} não encontrada para módulo ${moduleName}`);
        }
    }

    async unloadModule(moduleName) {
        // Cleanup do módulo anterior se necessário
        if (moduleName && this.modules.has(moduleName)) {
            const module = this.modules.get(moduleName);
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
            this.modules.delete(moduleName);
        }
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (app) app.style.display = 'flex';
    }

    showError(message) {
        console.error('❌', message);
        // Implementar sistema de notificação se necessário
        alert(`Erro: ${message}`);
    }
}

// **FUNÇÕES GLOBAIS PARA COMPATIBILIDADE**
window.navigateToModule = function(moduleName, queryParams = '') {
    if (window.modularSystem) {
        return window.modularSystem.navigateToModule(moduleName, queryParams);
    } else {
        console.error('❌ Sistema modular não inicializado');
    }
};

window.loadModule = window.navigateToModule; // Alias

// **INICIALIZAR QUANDO DOM ESTIVER PRONTO**
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM ready, initializing Modular System...');
    window.modularSystem = new ModularSystem();
});

// **EXPORTAR PARA USO EM OUTROS MÓDULOS**
export default ModularSystem;

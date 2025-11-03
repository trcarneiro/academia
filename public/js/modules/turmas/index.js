// Módulo de Turmas - Sistema de Academia Krav Maga v2.0
// Gestão de execução de cronogramas de cursos com datas específicas
import { safeNavigateTo, safeRegisterRoutes } from '../../shared/utils/navigation.js';

// Aguardar a disponibilidade dos recursos necessários
async function waitForDependencies() {
    while (!window.app || !window.createModuleAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Inicializar API helper
let turmasAPI = null;
async function initializeAPI() {
    await waitForDependencies();
    turmasAPI = window.createModuleAPI('Turmas');
}

// Módulo Turmas principal
class TurmasModule {
    constructor() {
        this.name = 'turmas';
        this.controller = null;
        this.service = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('👥 [Turmas] Iniciando módulo...');
            
            // Carregar dependências dinamicamente para evitar erros de import
            await this.loadDependencies();
            
            console.log('👥 [Turmas] Dependências carregadas, inicializando API...');
            await initializeAPI();
            
            console.log('👥 [Turmas] API inicializada, criando serviços...');
            // Inicializar serviços
            const { TurmasService } = await import('./services/TurmasService.js');
            const { TurmasController } = await import('./controllers/TurmasController.js');
            
            this.service = new TurmasService(turmasAPI);
            this.controller = new TurmasController(this.service);
            
            // Expor controller globalmente para onclick handlers
            window.turmasController = this.controller;
            
            // Garantir CSS de edição inline carregado
            this.loadModuleCSS();
            
            this.isInitialized = true;
            console.log('👥 [Turmas] Módulo inicializado com sucesso!');
            
            // Comunicar integração com app principal
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { 
                    name: this.name,
                    controller: this.controller 
                });
            }
            
            // NÃO mostrar lista automaticamente - apenas inicializar
            // A lista será mostrada quando o router navegar para #turmas
            console.log('👥 [Turmas] Módulo pronto - aguardando navegação do router');
            
        } catch (error) {
            console.error('❌ [Turmas] Erro ao inicializar módulo:', error);
            if (window.app) {
                window.app.handleError(error, 'Turmas Module Init');
            }
        }
    }

    async loadDependencies() {
        // Pré-carregar as views para evitar erros de import
        try {
            await Promise.all([
                import('./views/TurmasListView.js'),
                import('./views/TurmasDetailView.js'),
                import('./views/TurmasScheduleView.js'),
                import('./views/TurmasStudentsView.js'),
                import('./views/TurmasAttendanceView.js'),
                import('./views/TurmasReportsView.js')
            ]);
            console.log('👥 [Turmas] Views carregadas com sucesso');
        } catch (error) {
            console.error('❌ [Turmas] Erro ao carregar views:', error);
        }
    }

    registerRoutes() {
        const routes = {
            // Rota principal - lista de turmas
            'turmas': () => this.controller.showList(),
            
            // Gestão de turmas
            'turmas/create': () => this.controller.showCreate(),
            'turmas/edit': (id) => this.controller.showEdit(id),
            'turmas/view': (id) => this.controller.showView(id),
            
            // Cronograma e aulas
            'turmas/schedule': (id) => this.controller.showSchedule(id),
            'turmas/lesson': (turmaId, lessonId) => this.controller.showLesson(turmaId, lessonId),
            
            // Gestão de alunos
            'turmas/students': (id) => this.controller.showStudents(id),
            'turmas/attendance': (id) => this.controller.showAttendance(id),
            
            // Relatórios
            'turmas/reports': (id) => this.controller.showReports(id)
        };

        // Registrar rotas no sistema de navegação
        safeRegisterRoutes(routes, { context: 'turmas:registerRoutes' });
    }

    loadModuleCSS() {
        const cssFiles = [
            '/css/modules/turmas.css',
            '/css/modules/turmas-editable.css'
        ];
        
        cssFiles.forEach(cssPath => {
            // Verificar se o CSS já foi carregado
            if (!document.querySelector(`link[href="${cssPath}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                link.onload = () => console.log(`📚 CSS ${cssPath} carregado`);
                link.onerror = () => console.warn(`⚠️ Falha ao carregar CSS ${cssPath}`);
                document.head.appendChild(link);
            }
        });
    }

    // Métodos públicos para integração com outros módulos
    async createTurma(courseId, config = {}) {
        if (!this.isInitialized) {
            throw new Error('Módulo Turmas não inicializado');
        }
        return await this.service.create({
            courseId,
            ...config
        });
    }

    async getTurmasByCourse(courseId) {
        if (!this.isInitialized) {
            throw new Error('Módulo Turmas não inicializado');
        }
        return await this.service.getByCourse(courseId);
    }

    async getTurmasByInstructor(instructorId) {
        if (!this.isInitialized) {
            throw new Error('Módulo Turmas não inicializado');
        }
        return await this.service.getByInstructor(instructorId);
    }

    // Integração com módulo de frequência
    async markAttendance(turmaId, lessonId, studentId, status) {
        if (!this.isInitialized) {
            throw new Error('Módulo Turmas não inicializado');
        }
        return await this.service.markAttendance(turmaId, {
            lessonId,
            studentId,
            status
        });
    }

    // Método para navegação externa
    navigateToTurma(turmaId, view = 'view') {
        const methodName = `show${view.charAt(0).toUpperCase() + view.slice(1)}`;
        const fallback = () => {
            const controller = this.controller;
            if (controller && typeof controller[methodName] === 'function') {
                return controller[methodName](turmaId);
            }
            return controller?.showView?.(turmaId);
        };

        safeNavigateTo(`turmas/${view}/${turmaId}`, {
            fallback,
            context: 'turmas-module:navigateToTurma'
        });
    }

    // Cleanup
    destroy() {
        this.isInitialized = false;
        this.controller = null;
        this.service = null;
        
        if (window.app) {
            window.app.dispatchEvent('module:unloaded', { name: this.name });
        }
    }
}

// Inicializar módulo
const turmasModule = new TurmasModule();

// Exposição global para integração
window.turmasModule = turmasModule;
window.turmas = turmasModule;
// window.turmasController é definido no init() após criar o controller interno

export default turmasModule;

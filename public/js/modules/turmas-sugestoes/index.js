// Módulo de Sugestões de Horários
import { safeNavigateTo } from '../../shared/utils/navigation.js';

async function waitForDependencies() {
    while (!window.app || !window.createModuleAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

let moduleAPI = null;
async function initializeAPI() {
    await waitForDependencies();
    moduleAPI = window.createModuleAPI('HorariosSugeridos');
}

class TurmasSugestoesModule {
    constructor() {
        this.name = 'turmas-sugestoes';
        this.container = null;
        this.listView = null;
        this.formView = null;
    }

    async init() {
        await initializeAPI();
        
        // Load views
        const { SuggestionListView } = await import('./views/list-view.js');
        const { SuggestionFormView } = await import('./views/suggestion-form.js');
        
        this.listView = new SuggestionListView(moduleAPI, this);
        this.formView = new SuggestionFormView(moduleAPI, this);
        
        window.turmasSugestoes = this;
        
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: this.name });
        }
    }

    registerRoutes() {
        return {
            'turmas-sugestoes': () => this.showList(),
            'turmas-sugestoes/new': () => this.showForm(),
            'turmas-sugestoes/view': (id) => this.showView(id)
        };
    }

    async showList() {
        this.container = document.getElementById('app-content');
        await this.listView.render(this.container);
    }

    async showForm() {
        this.container = document.getElementById('app-content');
        await this.formView.render(this.container);
    }
    
    async showView(id) {
        // TODO: Implement detail view if needed, or reuse list with expanded item
        this.showList();
    }
}

export const turmasSugestoes = new TurmasSugestoesModule();

import { CoursesService } from './services/courses-service.js';

const CoursesModule = {
    container: null,
    service: null,
    currentView: null,

    async init() {
        console.log('📚 Initializing Courses Module v2.0');
        
        // 1. Initialize Service
        this.service = new CoursesService();
        await this.service.init();

        // 2. Load CSS
        this.loadCSS();

        // 3. Find Container
        this.container = document.getElementById('content-area') || 
                         document.getElementById('app-content') ||
                         document.getElementById('main-content');
                         
        if (!this.container) {
            console.error('❌ Container not found');
            return;
        }

        // 4. Register Global Access
        window.coursesModule = this;
        
        // 5. Initial Navigation
        this.navigate('list');

        // 6. Dispatch Event
        if (window.app?.dispatchEvent) {
            window.app.dispatchEvent('module:loaded', { name: 'courses' });
        }
    },

    loadCSS() {
        const id = 'courses-css';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = '/css/modules/courses.css';
            document.head.appendChild(link);
        }
    },

    async navigate(viewName, params = {}) {
        console.log(`🧭 Navigating to ${viewName}`, params);
        
        // Clear current view
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
        }
        
        // Load new view
        try {
            let ViewClass;
            
            if (viewName === 'list') {
                const module = await import('./views/list-view.js');
                ViewClass = module.ListView;
            } else if (viewName === 'editor') {
                const module = await import('./views/editor-view.js');
                ViewClass = module.EditorView;
            } else {
                throw new Error(`Unknown view: ${viewName}`);
            }

            this.currentView = new ViewClass(this.container, this.service);
            await this.currentView.render(params);

        } catch (error) {
            console.error(`❌ Failed to load view ${viewName}:`, error);
            this.container.innerHTML = `<div class="error-state">
                <h3>Error Loading View</h3>
                <p>${error.message}</p>
                <button onclick="coursesModule.navigate('list')" class="btn-primary">Back to List</button>
            </div>`;
        }
    }
};

export default CoursesModule;

if (typeof window !== 'undefined') {
    window.CoursesModule = CoursesModule;
}


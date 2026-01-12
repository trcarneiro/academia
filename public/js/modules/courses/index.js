import { CoursesService } from './services/courses-service.js';

const CoursesModule = {
    container: null,
    service: null,
    currentView: null,
    isInitialized: false,
    isNavigating: false, // Guard against concurrent navigation

    async init() {
        // Guard against re-initialization
        if (this.isInitialized && this.container) {
            console.log('📚 Courses Module already initialized, skipping');
            return;
        }

        console.log('📚 Initializing Courses Module v2.0');

        // 1. Initialize Service
        this.service = new CoursesService();
        await this.service.init();

        // 2. Load CSS
        this.loadCSS();

        // 3. Find Container
        this.container = document.getElementById('module-container') ||
            document.getElementById('content-area') ||
            document.getElementById('app-content') ||
            document.getElementById('main-content');

        if (!this.container) {
            console.error('❌ Container not found');
            return;
        }

        // 4. Register Global Access
        window.coursesModule = this;

        // 5. Mark as initialized (before navigation)
        this.isInitialized = true;

        // 6. Initial Navigation
        // Check if we have an ID in the hash (e.g. #courses/edit/123)
        const hash = window.location.hash;
        if (hash.includes('/edit/')) {
            const id = hash.split('/edit/')[1];
            this.navigate('editor', { id });
        } else if (hash.includes('/new')) {
            this.navigate('editor', { id: null });
        } else {
            this.navigate('list');
        }

        // 7. Dispatch Event
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
        // Guard against concurrent navigation
        if (this.isNavigating) {
            console.log(`⚠️ Skipping navigation to ${viewName} - already navigating`);
            return;
        }
        this.isNavigating = true;

        console.log(`🧭 Navigating to ${viewName}`, params);

        // Clear current view
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
            this.currentView = null;
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
        } finally {
            // Reset navigation guard
            this.isNavigating = false;
        }
    }
};

export default CoursesModule;

if (typeof window !== 'undefined') {
    window.CoursesModule = CoursesModule;
    // Auto-init if container exists (First Load)
    if (document.getElementById('module-container')) {
        CoursesModule.init();
    }
}


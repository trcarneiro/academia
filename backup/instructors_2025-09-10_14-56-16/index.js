/**
 * Instructors Module
 * Following Activities module pattern (GOLD STANDARD)
 */

// Prevent multiple declarations
if (typeof window.InstructorsModule !== 'undefined') {
    console.log('👨‍🏫 Instructors Module already loaded, skipping...');
} else {

const InstructorsModule = {
    // Module properties
    moduleAPI: null,
    controller: null,
    container: null,
    initialized: false,
    _isInitializing: false,

    /**
     * Initialize the module (Activities pattern)
     */
    async init() {
        try {
            // Strong protection against multiple initializations
            if (this.initialized) {
                console.log('👨‍🏫 Instructors Module already initialized, skipping...');
                return this;
            }
            
            if (this._isInitializing) {
                console.log('👨‍🏫 Instructors Module initialization in progress, skipping...');
                return this;
            }
            
            this._isInitializing = true;
            console.log('👨‍🏫 Instructors Module - Starting...');
            
            // Ensure we have a container
            if (!this.container) {
                throw new Error('Container not set before initialization');
            }
            
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Initialize API client
            await this.initializeAPI();
            
            // Load and render template
            await this.loadTemplate();
            
            // Initialize controller
            await this.initializeController();
            
            // Register module globally (Activities pattern)
            window.instructorsModule = this;
            
            // Dispatch module loaded event
            if (window.app) {
                window.app.dispatchEvent('module:loaded', { name: 'instructors' });
            }
            
            this._isInitializing = false;
            this.initialized = true;
            console.log('✅ Instructors Module - Loaded');
            
        } catch (error) {
            this._isInitializing = false; // Reset flag on error
            console.error('❌ Error initializing Instructors Module:', error);
            if (window.app && typeof window.app.handleError === 'function') {
                window.app.handleError(error, { module: 'instructors', context: 'module-initialization' });
            }
            throw error;
        }
    },

    /**
     * Wait for required dependencies (Activities pattern)
     */
    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds
            
            const checkDependencies = () => {
                if (window.createModuleAPI && window.InstructorsController) {
                    resolve();
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error('Required dependencies not available after timeout'));
                    } else {
                        console.log(`[Instructors] Waiting for dependencies... attempt ${attempts}`);
                        setTimeout(checkDependencies, 100);
                    }
                }
            };
            
            checkDependencies();
        });
    },

    /**
     * Initialize API client (Activities pattern)
     */
    async initializeAPI() {
        this.moduleAPI = window.createModuleAPI('Instructors');
        console.log('[Instructors] API initialized:', !!this.moduleAPI);
    },

    /**
     * Load HTML template (Activities pattern)
     */
    async loadTemplate() {
        try {
            const response = await fetch('/js/modules/instructors/views/instructors-list.html');
            if (!response.ok) {
                throw new Error(`Failed to load template: ${response.status}`);
            }
            
            const html = await response.text();
            this.container.innerHTML = html;
            
            console.log('[Instructors] Template loaded successfully');
        } catch (error) {
            console.error('[Instructors] Error loading template:', error);
            
            // Fallback: create basic structure
            this.container.innerHTML = `
                <div class="module-header-premium">
                    <h1 class="module-title-premium">👨‍🏫 Gestão de Instrutores</h1>
                </div>
                <!-- Content will be added by controller -->
            `;
        }
    },

    /**
     * Initialize controller (Activities pattern)
     */
    async initializeController() {
        this.controller = new InstructorsController();
        await this.controller.initialize(this.container);
        
        // Make controller globally accessible
        window.instructorsController = this.controller;
        
        console.log('[Instructors] Controller initialized successfully');
    },

    /**
     * Refresh module data (Activities pattern)
     */
    async refresh() {
        if (this.controller && this.controller.initialized) {
            await this.controller.refresh();
        }
    },

    /**
     * Handle module navigation (Activities pattern)
     */
    async onShow() {
        console.log('[Instructors] Module becoming visible');
        
        // Refresh data when module becomes visible
        if (this.initialized && this.controller) {
            await this.controller.refresh();
        }
    },

    /**
     * Clean up when module is hidden (Activities pattern)
     */
    onHide() {
        console.log('[Instructors] Module being hidden');
    },

    /**
     * Public API for external access (Activities pattern)
     */
    getController() {
        return this.controller;
    },

    isInitialized() {
        return this.initialized;
    }
};

// Export module following Activities pattern
window.InstructorsModule = InstructorsModule;

/**
 * Global initialization function for SPA router compatibility
 * Following Activities pattern
 */
window.initInstructorsModule = async function(container) {
    try {
        console.log('🔧 initInstructorsModule called...');
        
        if (!container) {
            throw new Error('Container element is required');
        }

        // Strong protection against multiple initializations
        if (window.InstructorsModule && window.InstructorsModule.initialized) {
            console.log('👨‍🏫 Instructors Module already initialized, using existing instance...');
            
            // Just update the container reference and refresh if needed
            window.InstructorsModule.container = container;
            if (window.InstructorsModule.controller) {
                // Don't re-render, just ensure the controller knows about the new container
                window.InstructorsModule.controller.container = container;
            }
            
            return window.InstructorsModule;
        }

        // Check if initialization is in progress
        if (window.InstructorsModule && window.InstructorsModule._isInitializing) {
            console.log('👨‍🏫 Instructors Module initialization in progress, waiting...');
            
            // Wait for initialization to complete
            let attempts = 0;
            while (window.InstructorsModule._isInitializing && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            return window.InstructorsModule;
        }

        // Set container and initialize
        window.InstructorsModule.container = container;
        await window.InstructorsModule.init();
        
        console.log('✅ Instructors Module initialized successfully');
        return window.InstructorsModule;
        
    } catch (error) {
        console.error('❌ Error in initInstructorsModule:', error);
        
        if (window.app && typeof window.app.handleError === 'function') {
            window.app.handleError(error, { module: 'instructors', context: 'global-initialization' });
        }
        
        throw error;
    }
};

} // End of multiple declaration prevention

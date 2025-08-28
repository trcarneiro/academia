/**
 * Main Application Module
 * Orchestrates the entire application initialization and coordination
 */

class AcademyApp {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
        this.config = {
            apiUrl: '/api',
            appName: 'Krav Maga Academy',
            version: '2.0.0'
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.log('⚠️ App already initialized');
            return;
        }

        console.log('🚀 Initializing Krav Maga Academy System...');
        
        try {
            // Initialize core systems
            await this.initializeCore();
            
            // Load modules
            await this.loadModules();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup app-wide event listeners
            this.setupEventListeners();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ Krav Maga Academy System initialized successfully');
            
            // Dispatch initialization complete event
            this.dispatchEvent('app:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Initialize core systems
     */
    async initializeCore() {
        console.log('🔧 Initializing core systems...');
        
        // Core systems should already be loaded via script tags
        // Just verify they're available
        if (typeof navigationSystem === 'undefined') {
            throw new Error('Navigation system not loaded');
        }
        
        if (typeof apiClient === 'undefined') {
            throw new Error('API client not loaded');
        }
        
        if (typeof DOMHelpers === 'undefined') {
            throw new Error('DOM helpers not loaded');
        }
        
        console.log('✅ Core systems verified');
    }

    /**
     * Load application modules
     */
    async loadModules() {
        console.log('📦 Loading application modules...');
        
        const moduleList = [
            'students',
            'classes', 
            'financial',
            'attendance',
            'dashboard',
            'plans',
            'activities',
            'lesson-plans',
            'rag'
        ];

        // Register available modules
        for (const moduleName of moduleList) {
            if (window[moduleName] || window[`${moduleName}Module`]) {
                this.modules.set(moduleName, window[moduleName] || window[`${moduleName}Module`]);
                console.log(`✅ Module loaded: ${moduleName}`);
            } else {
                console.log(`ℹ️ Module not available: ${moduleName}`);
            }
        }

        console.log(`📦 ${this.modules.size} modules loaded`);
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('❌ Global error:', event.error);
            this.handleError(event.error, 'Global Error');
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'Promise Rejection');
            event.preventDefault();
        });
    }

    /**
     * Setup application-wide event listeners
     */
    setupEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.showToast('Conexão restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            console.log('📴 Connection lost');
            this.showToast('Conexão perdida', 'warning');
        });

        // Handle visibility change (tab focus)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.onAppFocus();
            } else {
                this.onAppBlur();
            }
        });

        // Handle page refresh warning for unsaved changes
        window.addEventListener('beforeunload', (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
                event.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
                return event.returnValue;
            }
        });
    }

    /**
     * Handle application focus
     */
    onAppFocus() {
        console.log('👁️ App focused');
        // Refresh data if needed
        this.refreshIfStale();
    }

    /**
     * Handle application blur
     */
    onAppBlur() {
        console.log('👁️‍🗨️ App blurred');
        // Auto-save if needed
        this.autoSave();
    }

    /**
     * Check if data is stale and refresh
     */
    refreshIfStale() {
        const lastRefresh = localStorage.getItem('lastDataRefresh');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (!lastRefresh || (now - parseInt(lastRefresh)) > fiveMinutes) {
            console.log('🔄 Refreshing stale data...');
            this.refreshCurrentPageData();
            localStorage.setItem('lastDataRefresh', now.toString());
        }
    }

    /**
     * Refresh current page data
     */
    refreshCurrentPageData() {
        if (typeof navigationSystem !== 'undefined') {
            const currentPage = navigationSystem.getCurrentPage();
            navigationSystem.loadPageData(currentPage);
        }
    }

    /**
     * Auto-save functionality
     */
    autoSave() {
        // Let modules handle their own auto-save
        this.dispatchEvent('app:autosave');
    }

    /**
     * Check for unsaved changes
     */
    hasUnsavedChanges() {
        // Let modules report if they have unsaved changes
        const event = new CustomEvent('app:check-unsaved');
        document.dispatchEvent(event);
        return event.detail?.hasUnsaved || false;
    }

    /**
     * Handle errors gracefully
     */
    handleError(error, context = '') {
        const errorInfo = {
            message: error.message || 'Erro desconhecido',
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log error details
        console.error('❌ Error handled:', errorInfo);

        // Show user-friendly message
        this.showToast('Ocorreu um erro. Tente novamente.', 'error');

        // Report error to monitoring service if available
        if (window.reportError) {
            window.reportError(errorInfo);
        }
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const errorHTML = `
            <div style="
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: linear-gradient(135deg, #1e293b, #334155); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                z-index: 10000;
                font-family: system-ui, sans-serif;
            ">
                <div style="
                    background: rgba(239, 68, 68, 0.1); 
                    border: 1px solid #ef4444; 
                    border-radius: 12px; 
                    padding: 2rem; 
                    max-width: 500px; 
                    text-align: center;
                    color: #f8fafc;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <h2 style="color: #ef4444; margin-bottom: 1rem;">Erro de Inicialização</h2>
                    <p style="margin-bottom: 1.5rem; color: #cbd5e1;">
                        Não foi possível inicializar o sistema. Verifique sua conexão e tente novamente.
                    </p>
                    <button onclick="window.location.reload()" style="
                        background: #3b82f6; 
                        color: white; 
                        border: none; 
                        padding: 0.75rem 1.5rem; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-size: 1rem;
                    ">
                        🔄 Tentar Novamente
                    </button>
                    <details style="margin-top: 1rem; text-align: left;">
                        <summary style="cursor: pointer; color: #94a3b8;">Detalhes técnicos</summary>
                        <pre style="
                            background: rgba(0,0,0,0.3); 
                            padding: 1rem; 
                            border-radius: 6px; 
                            margin-top: 0.5rem; 
                            font-size: 0.875rem; 
                            overflow: auto;
                        ">${error.message}</pre>
                    </details>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Try to use existing toast system
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: system-ui, sans-serif;
            max-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Dispatch custom app event
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Register module
     */
    registerModule(name, module) {
        this.modules.set(name, module);
        console.log(`📦 Module registered: ${name}`);
    }

    /**
     * Get app configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update app configuration
     */
    updateConfig(updates) {
        Object.assign(this.config, updates);
    }
}

// Create global app instance
const app = new AcademyApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for ES6 modules
export default app;

// Global access
window.app = app;
window.AcademyApp = AcademyApp;
/**
 * AI Dashboard Module - Student Data Agent Interface
 * Provides dashboard for accessing student data via MCP server
 * UPDATED: AGENTS.md v2.1 - AcademyApp integration
 */

import { AIController } from './controllers/ai-controller.js';
import { AIService } from './services/ai-service.js';
import { AIView } from './views/ai-view.js';

class AIDashboardModule {
    constructor(app) {
        this.app = app;
        this.service = new AIService(app);
        this.view = new AIView(app);
        this.controller = new AIController(app, this.service, this.view);
        
        this.init();
    }

    async init() {
        console.log('AI Dashboard Module: Initializing...');
        
        try {
            // Register module with SPA router
            if (window.app && window.app.registerModule) {
                window.app.registerModule('ai-dashboard', {
                    name: 'AI Dashboard',
                    icon: 'brain',
                    permission: 'STUDENT_VIEW',
                    component: 'ai-dashboard-container'
                });
            }

            this.setupRoutes();
            this.setupEventListeners();
            
            // Dispatch module loaded event (AcademyApp integration)
            window.app?.dispatchEvent('module:loaded', { name: 'ai' });
            
            console.log('AI Dashboard Module: Initialized successfully');
        } catch (error) {
            console.error('AI Dashboard Module: Initialization failed', error);
            window.app?.handleError?.(error, 'AI:init');
        }
    }

    setupRoutes() {
        // Add SPA routes for AI Dashboard module
        if (window.app && window.app.router) {
            window.app.router.addRoute('/ai-dashboard', {
                component: 'ai-dashboard-container',
                title: 'AI Dashboard',
                requiresAuth: true,
                permission: 'STUDENT_VIEW'
            });

            window.app.router.addRoute('/ai-dashboard/student/:id', {
                component: 'ai-dashboard-student-detail',
                title: 'Student Detail - AI Dashboard',
                requiresAuth: true,
                permission: 'STUDENT_VIEW'
            });
        }
    }

    setupEventListeners() {
        // Listen for student ID input changes
        document.addEventListener('ai-student-id-change', (event) => {
            this.controller.handleStudentIdChange(event.detail.studentId);
        });

        // Listen for tool execution requests
        document.addEventListener('ai-execute-tool', (event) => {
            this.controller.handleToolExecution(event.detail.tool, event.detail.parameters);
        });
    }

    // Public API for other modules
    async getStudentData(studentId, options = {}) {
        try {
            return await this.service.getStudentData(studentId, options);
        } catch (error) {
            window.app?.handleError?.(error, 'AI:getStudentData');
            throw error;
        }
    }

    async getCourseData(courseId, options = {}) {
        try {
            return await this.service.getCourseData(courseId, options);
        } catch (error) {
            window.app?.handleError?.(error, 'AI:getCourseData');
            throw error;
        }
    }

    async executeQuery(query, options = {}) {
        try {
            return await this.service.executeQuery(query, options);
        } catch (error) {
            window.app?.handleError?.(error, 'AI:executeQuery');
            throw error;
        }
    }

    async getSystemAnalytics(options = {}) {
        try {
            return await this.service.getSystemAnalytics(options);
        } catch (error) {
            window.app?.handleError?.(error, 'AI:getSystemAnalytics');
            throw error;
        }
    }
}

// Expose globally for AcademyApp compatibility
window.ai = window.aiModule = AIDashboardModule;

// Global initialization function for SPA router
window.initializeAIModule = function() {
    console.log('🤖 Initializing AI Module...');
    
    const container = document.getElementById('ai-module-container') || document.getElementById('module-container');
    
    if (!container) {
        console.error('❌ AI Module: Container not found');
        return;
    }
    
    // Create instance
    const aiModule = new AIDashboardModule(window.app || {});
    
    // Render AI view into container
    if (aiModule.view && typeof aiModule.view.render === 'function') {
        aiModule.view.container = container;
        aiModule.view.render();
        
        // Load initial data (empty state for agents)
        if (aiModule.view.loadAgents) {
            aiModule.view.loadAgents();
        }
    }
    
    // Store instance globally
    window.aiModuleInstance = aiModule;
    
    console.log('✅ AI Module initialized successfully');
};

// Export for use in other files
export { AIDashboardModule };
export default AIDashboardModule;

/**
 * AI Dashboard Module - Student Data Agent Interface
 * Provides dashboard for accessing student data via MCP server
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

    init() {
        console.log('AI Dashboard Module initialized');
        
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
        return await this.service.getStudentData(studentId, options);
    }

    async getCourseData(courseId, options = {}) {
        return await this.service.getCourseData(courseId, options);
    }

    async executeQuery(query, options = {}) {
        return await this.service.executeQuery(query, options);
    }

    async getSystemAnalytics(options = {}) {
        return await this.service.getSystemAnalytics(options);
    }
}

// Export for use in other files
export { AIDashboardModule };
export default AIDashboardModule;

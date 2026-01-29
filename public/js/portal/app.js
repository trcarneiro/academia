import Router from './router.js';
import API from './api.js';
import { NotificationManager } from './components/notifications.js';

class App {
    constructor() {
        this.router = new Router();
        this.api = new API();
        this.notificationManager = null;
        this.init();
    }

    async init() {
        console.log('Portal App Initialized');

        // Public Routes
        this.router.addRoute('/', async (container) => {
            const { renderLanding } = await import('./pages/landing.js');
            renderLanding(container);
        });
        this.router.addRoute('/register', async (container) => {
            const { renderRegister } = await import('./pages/register.js');
            renderRegister(container);
        });
        this.router.addRoute('/login', async (container) => {
            const { renderLogin } = await import('./pages/login.js');
            renderLogin(container);
        });
        this.router.addRoute('/checkout', async (container) => {
            const { renderCheckout } = await import('./pages/checkout.js');
            renderCheckout(container);
        });
        this.router.addRoute('/success', async (container) => {
            const { renderSuccess } = await import('./pages/success.js');
            renderSuccess(container);
        });

        // Protected Routes
        this.router.addRoute('/dashboard', async (container) => {
            const { renderDashboard } = await import('./pages/dashboard.js');
            await renderDashboard(container);
            this.initNotifications();
        });
        this.router.addRoute('/schedule', async (container) => {
            const { render: renderSchedule } = await import('./pages/schedule.js');
            await renderSchedule(container);
            this.initNotifications();
        });
        this.router.addRoute('/payments', async (container) => {
            const { render: renderPayments } = await import('./pages/payments.js');
            await renderPayments(container);
            this.initNotifications();
        });
        this.router.addRoute('/courses', async (container) => {
            const { render: renderCourses } = await import('./pages/courses.js');
            await renderCourses(container);
            this.initNotifications();
        });
        this.router.addRoute('/profile', async (container) => {
            const { renderProfile } = await import('./pages/profile.js');
            await renderProfile(container);
            this.initNotifications();
        });
        this.router.addRoute('/crm-config', async (container) => {
            const { renderCrmConfig } = await import('./pages/crm-config.js');
            await renderCrmConfig(container);
            this.initNotifications();
        });
        this.router.addRoute('/technique/:id', async (container, params) => {
            const { render: renderTechnique } = await import('./pages/technique.js');
            await renderTechnique(container, params);
            this.initNotifications();
        });

        // Admin Routes
        this.router.addRoute('/admin/notifications', async (container) => {
            const { renderAdminNotifications } = await import('./pages/admin/notifications.js');
            await renderAdminNotifications(container);
            this.initNotifications();
        });
        this.router.addRoute('/ranking', async (container) => {
            const { render: renderRanking } = await import('./pages/ranking.js');
            await renderRanking(container);
            this.initNotifications();
        });
        this.router.addRoute('/chat', async (container) => {
            const { render: renderChat } = await import('./pages/chat.js');
            await renderChat(container);
            this.initNotifications();
        });
    }

    initNotifications() {
        // Initialize only if button exists and not already initialized for this page
        if (document.querySelector('.notification-btn')) {
            this.notificationManager = new NotificationManager();
        }
    }
}

window.app = new App();
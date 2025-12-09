import { renderNavBottom } from './components/nav-bottom.js';

export default class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.appContainer = document.getElementById('app');
        
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    async handleRoute() {
        let hash = window.location.hash.slice(1) || '/';
        console.log('Navigating to:', hash);
        
        // Handle dynamic routes
        let handler = this.routes[hash];
        let params = {};

        if (!handler) {
            // Try to match dynamic routes
            for (const route in this.routes) {
                if (route.includes(':')) {
                    const routeParts = route.split('/');
                    const hashParts = hash.split('/');
                    
                    if (routeParts.length === hashParts.length) {
                        let match = true;
                        const currentParams = {};
                        
                        for (let i = 0; i < routeParts.length; i++) {
                            if (routeParts[i].startsWith(':')) {
                                currentParams[routeParts[i].slice(1)] = hashParts[i];
                            } else if (routeParts[i] !== hashParts[i]) {
                                match = false;
                                break;
                            }
                        }
                        
                        if (match) {
                            handler = this.routes[route];
                            params = currentParams;
                            break;
                        }
                    }
                }
            }
        }
        
        if (handler) {
            this.currentRoute = hash;
            await handler(this.appContainer, params);
            renderNavBottom(hash);
        } else {
            console.warn('Route not found:', hash);
            // Default to landing or 404
            if (this.routes['/']) {
                await this.routes['/'](this.appContainer);
                renderNavBottom('/');
            }
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}

// Export a singleton instance for use in pages
export const router = {
    navigate: (path) => {
        window.location.hash = path;
    }
};
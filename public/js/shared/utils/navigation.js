// Shared navigation helpers ensuring graceful fallbacks across modules
// This file centralizes navigation utilities so modules can interact with the
// SPA router without assuming it is already available on the window object.

const pendingRoutes = [];
let pendingRoutesTimer = null;

function startPendingRoutesWatcher() {
    if (pendingRoutesTimer) return;

    pendingRoutesTimer = setInterval(() => {
        if (window.router && typeof window.router.registerRoute === 'function') {
            while (pendingRoutes.length > 0) {
                const { route, handler } = pendingRoutes.shift();
                try {
                    window.router.registerRoute(route, handler);
                } catch (error) {
                    console.error(`⚠️ [Navigation] Failed to register pending route "${route}"`, error);
                }
            }
            clearInterval(pendingRoutesTimer);
            pendingRoutesTimer = null;
        }
    }, 150);
}

/**
 * Safely registers a route with the SPA router. If the router is not yet
 * available, the registration is queued and retried automatically.
 */
export function safeRegisterRoute(route, handler, { context = 'navigation' } = {}) {
    if (!route || typeof handler !== 'function') {
        console.warn('⚠️ [Navigation] Invalid route registration attempt', { route, handler });
        return false;
    }

    try {
        if (window.router && typeof window.router.registerRoute === 'function') {
            window.router.registerRoute(route, handler);
            return true;
        }

        pendingRoutes.push({ route, handler });
        startPendingRoutesWatcher();
        return false;
    } catch (error) {
        console.error(`❌ [Navigation] Failed to register route "${route}" (${context})`, error);
        return false;
    }
}

/**
 * Registers a map of routes using {@link safeRegisterRoute}.
 */
export function safeRegisterRoutes(routeMap = {}, options = {}) {
    return Object.entries(routeMap).map(([route, handler]) =>
        safeRegisterRoute(route, handler, options)
    );
}

function normalizeTarget(target = '') {
    if (!target) return { hash: '', module: '' };

    const trimmed = target.replace(/^#/, '').trim();
    const hash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const module = trimmed;
    return { hash, module };
}

/**
 * Attempts to navigate using the SPA router or falls back to legacy navigation
 * helpers. When all strategies fail, the provided fallback function is executed.
 */
export function safeNavigateTo(target, { fallback, context = 'navigation' } = {}) {
    const { hash, module } = normalizeTarget(target);

    try {
        if (window.router && typeof window.router.navigateTo === 'function') {
            window.router.navigateTo(module);
            return true;
        }

        if (typeof window.navigateTo === 'function') {
            window.navigateTo(hash);
            return true;
        }

        if (typeof window.showSection === 'function') {
            window.showSection(module || hash.replace('/', ''));
            return true;
        }

        if (hash) {
            window.location.hash = module;
            return true;
        }
    } catch (error) {
        console.error(`❌ [Navigation] Failed to navigate to "${target}" (${context})`, error);
    }

    if (typeof fallback === 'function') {
        try {
            fallback();
        } catch (fallbackError) {
            console.error(`❌ [Navigation] Fallback navigation failed (${context})`, fallbackError);
        }
    }

    return false;
}

/**
 * Convenience helper for modules that just need to go back to their list view.
 */
export function safeNavigateToList(moduleName, { fallback, context } = {}) {
    return safeNavigateTo(moduleName, {
        fallback,
        context: context || `${moduleName}:list`
    });
}

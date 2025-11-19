/**
 * Dashboard Presentation Controller
 * Minimal placeholder while the new dashboard experience is under construction.
 */

window.initializeDashboardChat = async function() {
    try {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }

        window.app?.dispatchEvent('module:loaded', {
            name: 'DashboardChat',
            context: 'presentation-only'
        });

        console.log('[Dashboard] Tela de apresentação carregada');
    } catch (error) {
        console.error('[Dashboard] Erro ao preparar tela de apresentação:', error);
        window.app?.handleError?.(error, { module: 'DashboardChat', context: 'init' });
    }
};

// Expose minimal API for potential feature detection
window.dashboardChat = Object.freeze({
    isPresentationOnly: true
});


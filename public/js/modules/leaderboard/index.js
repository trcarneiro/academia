
import { LeaderboardController } from './leaderboard-controller.js';

// Load module styles
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = '/css/modules/leaderboard.css';
document.head.appendChild(styleLink);

let moduleAPI = null;
let controller = null;
let currentContainer = null;

async function initializeAPI() {
    if (!window.createModuleAPI) {
        // Fallback to window.apiClient if factory not present
        if (window.apiClient) {
            moduleAPI = window.apiClient;
            return;
        }
        throw new Error('API client not found');
    }
    // Using 'Gamification' as context for logs/metrics
    moduleAPI = window.createModuleAPI('Gamification');
}

// Global init function called by router
window.initLeaderboardModule = async function (container) {
    if (container) currentContainer = container;
    console.log('🏆 Initializing Leaderboard Module...');

    try {
        await initializeAPI();
        controller = new LeaderboardController(moduleAPI);

        // Expose refresh capability
        window.leaderboardModule.refresh = async () => {
            if (currentContainer && controller) {
                await controller.render(currentContainer);
            }
        };

        if (container) {
            await controller.render(container);
        }
    } catch (err) {
        console.error('Failed to init leaderboard:', err);
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Erro ao carregar o módulo de Ranking.</p>
                </div>
            `;
        }
    }
};

// Global namespace
window.leaderboardModule = {
    init: window.initLeaderboardModule,
    refresh: () => console.warn('Leaderboard not initialized yet')
};

console.log('✅ Leaderboard module loaded');

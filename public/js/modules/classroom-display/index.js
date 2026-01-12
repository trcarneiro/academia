/**
 * Classroom Display Module
 * Optimized for large TV/monitors in the classroom
 * Shows current activity, timer, and next activity
 * 
 * Features:
 * - High contrast for visibility from distance
 * - Auto-refresh every 10 seconds
 * - Full-screen mode support
 * - No user interaction required
 */

// Load module-specific styles
const moduleStyles = document.createElement('link');
moduleStyles.rel = 'stylesheet';
moduleStyles.href = '/css/modules/classroom-display.css';
document.head.appendChild(moduleStyles);

let moduleAPI = null;
let refreshInterval = null;
let currentClassData = null;

async function initializeAPI() {
    if (!window.createModuleAPI) {
        throw new Error('API client not loaded');
    }
    moduleAPI = window.createModuleAPI('ClassroomDisplay');
}

/**
 * Initialize the Classroom Display module
 */
window.initClassroomDisplay = async function (container, options = {}) {
    console.log('📺 [ClassroomDisplay] Initializing...');

    const { classId, roomId } = options;

    try {
        await initializeAPI();
        await renderDisplay(container, classId || roomId);

        // Start auto-refresh (every 10 seconds)
        startAutoRefresh(container, classId || roomId);

        window.app?.dispatchEvent?.('module:loaded', { name: 'classroom-display' });
    } catch (err) {
        console.error('ClassroomDisplay init error:', err);
        container.innerHTML = `
            <div class="display-error">
                <div class="error-icon">⚠️</div>
                <h2>Erro ao carregar display</h2>
                <p>${err.message}</p>
            </div>
        `;
    }
};

async function renderDisplay(container, classId) {
    container.innerHTML = `
        <div class="classroom-display-container" data-module="classroom-display">
            <!-- Academy Header -->
            <header class="display-header">
                <div class="academy-logo">🥋</div>
                <h1 class="academy-name">ACADEMIA KRAV MAGA</h1>
                <div class="current-time" id="display-clock">--:--</div>
            </header>

            <!-- Class Info Banner -->
            <div class="class-banner" id="class-banner">
                <div class="loading-display">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando aula...</span>
                </div>
            </div>

            <!-- Main Activity Display -->
            <div class="activity-display" id="activity-display">
                <!-- Current activity will be shown here -->
            </div>

            <!-- Progress Bar -->
            <div class="class-progress" id="class-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-times">
                    <span class="start-time" id="progress-start">--:--</span>
                    <span class="current-marker" id="progress-now">AGORA</span>
                    <span class="end-time" id="progress-end">--:--</span>
                </div>
            </div>

            <!-- Next Activity Preview -->
            <div class="next-activity-preview" id="next-activity">
                <!-- Next activity will be shown here -->
            </div>
        </div>
    `;

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load initial data
    await loadDisplayData(container, classId);
}

function updateClock() {
    const clock = document.getElementById('display-clock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

async function loadDisplayData(container, classId) {
    try {
        // If no specific class ID, get the current active class for the room/organization
        const endpoint = classId
            ? `/api/classroom-display/${classId}`
            : '/api/classroom-display/current';

        const response = await moduleAPI.fetchWithStates(endpoint, {
            onError: (err) => console.error('Load error:', err)
        });

        currentClassData = response?.data || response || {};

        renderClassBanner(currentClassData.class);
        renderCurrentActivity(currentClassData.currentActivity);
        renderNextActivity(currentClassData.nextActivity);
        updateProgressBar(currentClassData.class);

    } catch (err) {
        console.error('Error loading display data:', err);

        // Show "no class" state
        renderNoClass();
    }
}

function renderClassBanner(classData) {
    const banner = document.getElementById('class-banner');
    if (!banner) return;

    if (!classData) {
        banner.innerHTML = `
            <div class="no-class-banner">
                <span>Nenhuma aula em andamento</span>
            </div>
        `;
        return;
    }

    banner.innerHTML = `
        <h2 class="class-title">${classData.title || classData.course?.name || 'Aula'}</h2>
        <div class="class-instructor">
            <i class="fas fa-user-tie"></i>
            <span>Instrutor: ${classData.instructor?.name || 'Prof.'}</span>
        </div>
    `;
}

function renderCurrentActivity(activity) {
    const display = document.getElementById('activity-display');
    if (!display) return;

    if (!activity) {
        display.innerHTML = `
            <div class="no-activity">
                <div class="activity-icon">☕</div>
                <h2>Aguardando próxima atividade</h2>
            </div>
        `;
        return;
    }

    const elapsed = activity.elapsed || 0;
    const duration = activity.duration || 0;
    const remaining = Math.max(0, duration - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    display.innerHTML = `
        <div class="current-activity">
            <div class="activity-label">ATIVIDADE ATUAL</div>
            <div class="activity-box">
                <h2 class="activity-name">${activity.name || 'Atividade'}</h2>
                <div class="activity-timer">
                    <div class="timer-icon">⏱️</div>
                    <div class="timer-value" id="activity-timer">
                        ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
                    </div>
                    <div class="timer-label">restantes</div>
                </div>
            </div>
        </div>
    `;

    // Start countdown timer
    startActivityTimer(remaining);
}

function renderNextActivity(activity) {
    const preview = document.getElementById('next-activity');
    if (!preview) return;

    if (!activity) {
        preview.innerHTML = '';
        preview.style.display = 'none';
        return;
    }

    preview.style.display = 'flex';
    preview.innerHTML = `
        <div class="next-activity-content">
            <div class="next-label">PRÓXIMA ATIVIDADE</div>
            <div class="next-name">${activity.name || 'Próxima'}</div>
            <div class="next-duration">(${activity.duration || '?'} minutos)</div>
        </div>
    `;
}

function updateProgressBar(classData) {
    if (!classData) return;

    const progressFill = document.getElementById('progress-fill');
    const startElem = document.getElementById('progress-start');
    const endElem = document.getElementById('progress-end');

    if (!progressFill) return;

    const now = new Date();
    const start = new Date(classData.startTime);
    const end = new Date(classData.endTime);

    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    progressFill.style.width = `${progress}%`;

    if (startElem) {
        startElem.textContent = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    if (endElem) {
        endElem.textContent = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}

function renderNoClass() {
    const banner = document.getElementById('class-banner');
    const display = document.getElementById('activity-display');
    const progress = document.getElementById('class-progress');
    const next = document.getElementById('next-activity');

    if (banner) {
        banner.innerHTML = `
            <div class="no-class-message">
                <h2>🏋️ Bem-vindo à Academia!</h2>
            </div>
        `;
    }

    if (display) {
        display.innerHTML = `
            <div class="no-class-display">
                <div class="rest-icon">☕</div>
                <h2>Nenhuma aula em andamento</h2>
                <p>A próxima aula será exibida automaticamente</p>
            </div>
        `;
    }

    if (progress) progress.style.display = 'none';
    if (next) next.style.display = 'none';
}

let activityTimerInterval = null;

function startActivityTimer(remainingSeconds) {
    // Clear any existing timer
    if (activityTimerInterval) {
        clearInterval(activityTimerInterval);
    }

    let remaining = remainingSeconds;

    activityTimerInterval = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
            clearInterval(activityTimerInterval);
            // Timer ended - will refresh on next auto-refresh
            return;
        }

        const timerElem = document.getElementById('activity-timer');
        if (timerElem) {
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            timerElem.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            // Add warning class when less than 1 minute
            if (remaining < 60) {
                timerElem.classList.add('timer-warning');
            }
        }
    }, 1000);
}

function startAutoRefresh(container, classId) {
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    // Refresh every 10 seconds
    refreshInterval = setInterval(() => {
        loadDisplayData(container, classId);
    }, 10000);
}

// Cleanup function
window.cleanupClassroomDisplay = function () {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (activityTimerInterval) {
        clearInterval(activityTimerInterval);
        activityTimerInterval = null;
    }
};

// Export for SPA router
window.classroomDisplayModule = {
    init: window.initClassroomDisplay,
    cleanup: window.cleanupClassroomDisplay
};

console.log('✅ Classroom Display module loaded');

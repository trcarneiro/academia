/**
 * SuccessView.js
 * Renders success screen after check-in completion
 * Features: Gamification stats, App CTA, Large Reset Button
 */

class SuccessView {
    constructor(container, callbacks = {}) {
        this.container = container;
        this.onReset = callbacks.onReset || (() => { });
    }

    /**
     * Render success view
     * @param {Object} data - { student, course, progress, timestamp }
     * @param {number} autoResetSeconds - Time to auto-reset
     */
    render(data, autoResetSeconds = 8) {
        const { student, course, progress, gamification, timestamp } = data;

        // Safe data access
        const firstName = student.firstName || (student.name ? student.name.split(' ')[0] : 'Aluno');
        const streak = gamification ? gamification.streak : (student.currentStreak || 0);
        const level = gamification ? gamification.level : (student.globalLevel || 1);
        // Total classes (increment current if not updated yet server-side, typically server returns current)
        const totalClasses = (student.stats?.totalAttendances || 0);

        // Format time
        const timeObj = new Date(timestamp);
        const timeStr = timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        this.container.innerHTML = `
            <div class="success-screen">
                <!-- Header -->
                <div class="success-header">
                    <div class="success-icon-large pulse-animation">
                        ✅
                    </div>
                    <h1>CHECK-IN CONFIRMADO!</h1>
                    <p class="checkin-time">${timeStr} • ${course.name}</p>
                </div>

                <!-- Student & Motivation Card -->
                <div class="student-motivation-card">
                    <div class="student-info">
                        ${student.avatarUrl
                ? `<img src="${student.avatarUrl}" alt="${firstName}" class="student-avatar" />`
                : `<div class="student-avatar-placeholder">${firstName[0]}</div>`
            }
                        <div class="student-greeting">
                            <h2>Olá, ${firstName}! 👋</h2>
                            <p>Bom treino!</p>
                        </div>
                    </div>

                    <!-- XP Toast if available -->
                    ${gamification && gamification.xpAwarded > 0 ? `
                    <div class="xp-toast-container">
                        <div class="xp-toast">
                            <span class="xp-plus">+</span>
                            <span class="xp-value">${gamification.xpAwarded} XP</span>
                        </div>
                        ${gamification.levelUp ? `<div class="level-up-badge">LEVEL UP! ⬆️</div>` : ''}
                    </div>
                    ` : ''}

                    <!-- Gamification Stats -->
                    <div class="stats-row">
                        <div class="stat-item fire">
                            <span class="stat-icon">🔥</span>
                            <div class="stat-data">
                                <span class="stat-value">${streak}</span>
                                <span class="stat-label">Sequência</span>
                            </div>
                        </div>
                        
                        <div class="stat-item star">
                            <span class="stat-icon">⭐</span>
                            <div class="stat-data">
                                <span class="stat-value">${level}</span>
                                <span class="stat-label">Nível</span>
                            </div>
                        </div>

                         ${gamification && gamification.newAchievements && gamification.newAchievements.length > 0 ? `
                        <div class="stat-item trophy highlight-gold">
                            <span class="stat-icon">🏆</span>
                            <div class="stat-data">
                                <span class="stat-value">${gamification.newAchievements.length}</span>
                                <span class="stat-label">Conquista!</span>
                            </div>
                        </div>
                        ` : `
                        <div class="stat-item medal">
                            <span class="stat-icon">🥋</span>
                            <div class="stat-data">
                                <span class="stat-value">${totalClasses}</span>
                                <span class="stat-label">Treinos</span>
                            </div>
                        </div>
                        `}
                    </div>
                    
                    ${gamification && gamification.newAchievements && gamification.newAchievements.length > 0 ? `
                    <div class="achievements-unlocked">
                        <p>🎉 Você desbloqueou novas conquistas!</p>
                    </div>
                    ` : ''}
                </div>

                <!-- App CTA (Motivation) -->
                <div class="app-cta">
                    <p>📲 <strong>Acompanhe seu progresso completo no App</strong></p>
                </div>

                <!-- Big Action Button -->
                <div class="success-actions">
                    <button id="reset-btn" class="btn-new-checkin">
                        <span class="btn-icon">↩️</span>
                        NOVO CHECK-IN
                    </button>
                    <p class="auto-reset-text">Voltando em <span id="countdown">${autoResetSeconds}</span>s</p>
                </div>
            </div>

            <style>
                .success-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 2rem;
                    text-align: center;
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    color: #166534;
                    animation: fadeIn 0.5s ease-out;
                }

                .success-header h1 {
                    font-size: 2.5rem;
                    margin: 1rem 0 0.5rem;
                    color: #15803d;
                    font-weight: 800;
                }

                .checkin-time {
                    font-size: 1.2rem;
                    opacity: 0.8;
                    margin-bottom: 2rem;
                }

                .success-icon-large {
                    font-size: 5rem;
                    line-height: 1;
                    margin-bottom: 0.5rem;
                    display: inline-block;
                }

                .pulse-animation {
                    animation: pulse-green 2s infinite;
                }

                .student-motivation-card {
                    background: white;
                    border-radius: 20px;
                    padding: 1.5rem;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    margin-bottom: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .student-info {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #f0f0f0;
                    padding-bottom: 1rem;
                }

                .student-avatar, .student-avatar-placeholder {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                
                .student-avatar-placeholder {
                    background: #dcfce7;
                    color: #166534;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .student-greeting {
                    text-align: left;
                }
                .student-greeting h2 { margin: 0; font-size: 1.5rem; color: #333; }
                .student-greeting p { margin: 0; color: #666; }

                /* XP TOAST */
                .xp-toast-container {
                    background: #e0f2fe;
                    margin: 0 -1.5rem 1.5rem -1.5rem;
                    padding: 0.8rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    border-top: 1px solid #bae6fd;
                    border-bottom: 1px solid #bae6fd;
                    animation: slideDown 0.5s ease-out;
                }

                .xp-toast {
                    display: flex;
                    align-items: center;
                    color: #0369a1;
                    font-weight: 800;
                    font-size: 1.4rem;
                }
                
                .xp-plus { margin-right: 2px; }
                
                .level-up-badge {
                    background: #fbbf24;
                    color: #78350f;
                    font-size: 0.8rem;
                    font-weight: 800;
                    padding: 0.2rem 0.6rem;
                    border-radius: 10px;
                    text-transform: uppercase;
                    animation: bounce 1s infinite;
                }

                .stats-row {
                    display: flex;
                    justify-content: space-around;
                    gap: 1rem;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #f8fafc;
                    padding: 0.8rem;
                    border-radius: 12px;
                    flex: 1;
                    transition: transform 0.2s;
                }
                
                .stat-item.highlight-gold {
                    background: #fef3c7;
                    border: 1px solid #fcd34d;
                    transform: scale(1.05);
                }

                .stat-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
                .stat-value { font-size: 1.25rem; font-weight: 700; color: #333; }
                .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .achievements-unlocked {
                    margin-top: 1rem;
                    color: #d97706;
                    font-weight: 600;
                    font-size: 0.9rem;
                    animation: pulse 2s infinite;
                }

                .app-cta {
                    margin-bottom: 2rem;
                    color: #15803d;
                    font-size: 1.1rem;
                    animation: bounce 2s infinite;
                }

                .btn-new-checkin {
                    background: #2563eb; /* Blue for action distinct from success green */
                    color: white;
                    border: none;
                    padding: 1.2rem 3rem;
                    border-radius: 50px;
                    font-size: 1.3rem;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .btn-new-checkin:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
                    background: #1d4ed8;
                }
                
                .btn-new-checkin:active {
                    transform: translateY(0);
                }

                .auto-reset-text {
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    opacity: 0.7;
                }

                @keyframes pulse-green {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slideDown {
                    from { height: 0; opacity: 0; padding: 0; margin: 0; }
                    to { height: auto; opacity: 1; }
                }
            </style>
        `;

        this.setupEvents(autoResetSeconds);
    }

    setupEvents(autoResetSeconds) {
        const resetBtn = this.container.querySelector('#reset-btn');
        const countdownEl = this.container.querySelector('#countdown');

        // Manual reset
        resetBtn?.addEventListener('click', () => {
            this.onReset();
        });

        // Auto reset countdown
        let remaining = autoResetSeconds;
        const interval = setInterval(() => {
            remaining--;

            if (countdownEl) {
                countdownEl.textContent = remaining;
            }

            if (remaining <= 0) {
                clearInterval(interval);
                this.onReset();
            }
        }, 1000);

        // Save interval to clear if needed (e.g. manual click)
        this.resetInterval = interval;
        resetBtn?.addEventListener('click', () => clearInterval(interval));
    }

    showError(error) {
        // Fallback for error state (keep simple)
        this.container.innerHTML = `
            <div class="error-screen">
                <h1>❌ Erro</h1>
                <p>${error.message || 'Erro deconhecido'}</p>
                <button id="retry-btn">Tentar Novamente</button>
            </div>
            <style>
                .error-screen { 
                    display: flex; flex-direction: column; align-items: center; 
                    justify-content: center; height: 100%; color: #ef4444; 
                }
                button { padding: 1rem 2rem; margin-top: 1rem; cursor: pointer; }
            </style>
        `;
        this.container.querySelector('#retry-btn')?.addEventListener('click', () => this.onReset());
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuccessView;
}

import { DashboardService } from './services/dashboard-service.js';

const ClassDashboardModule = {
    container: null,
    service: null,
    clockInterval: null,
    classTimerInterval: null,
    
    // State
    lessonData: null,
    classState: {
        isActive: false,
        elapsedSeconds: 0,
        totalDurationSeconds: 0,
        currentPhaseIndex: 0,
        phases: [] // { id, name, durationSeconds, startSeconds, endSeconds, content }
    },
    
    async init() {
        console.log('📺 Initializing Class Dashboard (TV Mode)');
        
        // 1. Initialize Service
        this.service = new DashboardService();
        await this.service.init();

        // 2. Load CSS
        this.loadCSS();

        // 3. Find Container
        this.container = document.getElementById('module-container') || 
                         document.getElementById('content-area');
                         
        if (!this.container) {
            console.error('❌ Container not found');
            return;
        }

        // 4. Register Global Access
        window.classDashboard = this;
        
        // 5. Load Data & Setup State
        await this.loadClassData();

        // 6. Render Skeleton
        this.render();

        // 7. Start Timers
        this.startClock();
        this.startClassTimer();
        
        // 8. Dispatch Event
        if (window.app?.dispatchEvent) {
            window.app.dispatchEvent('module:loaded', { name: 'classDashboard' });
        }
    },

    async loadClassData() {
        // Fetch data from service
        this.lessonData = await this.service.getLessonData('current');
        
        // Process phases into linear timeline
        const phases = [];
        let accumulatedTime = 0;

        // Warmup
        const warmupDur = (this.lessonData.phases.warmup.duration || 10) * 60;
        phases.push({
            id: 'warmup',
            name: 'Warmup',
            durationSeconds: warmupDur,
            startSeconds: accumulatedTime,
            endSeconds: accumulatedTime + warmupDur,
            content: this.lessonData.phases.warmup
        });
        accumulatedTime += warmupDur;

        // Technique
        const techDur = (this.lessonData.phases.technique.duration || 40) * 60;
        phases.push({
            id: 'technique',
            name: 'Technique',
            durationSeconds: techDur,
            startSeconds: accumulatedTime,
            endSeconds: accumulatedTime + techDur,
            content: this.lessonData.phases.technique
        });
        accumulatedTime += techDur;

        // Cooldown
        const coolDur = (this.lessonData.phases.cooldown.duration || 10) * 60;
        phases.push({
            id: 'cooldown',
            name: 'Cooldown',
            durationSeconds: coolDur,
            startSeconds: accumulatedTime,
            endSeconds: accumulatedTime + coolDur,
            content: this.lessonData.phases.cooldown
        });
        accumulatedTime += coolDur;

        this.classState.phases = phases;
        this.classState.totalDurationSeconds = accumulatedTime;
        this.classState.isActive = true;
    },

    loadCSS() {
        const id = 'class-dashboard-css';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = '/css/modules/class-dashboard.css';
            document.head.appendChild(link);
        }
    },

    render() {
        this.container.innerHTML = `
            <div class="module-isolated-class-dashboard">
                <header class="dashboard-header">
                    <h1>
                        <i class="fas fa-tv"></i>
                        <span>${this.lessonData.title}</span>
                        <span class="instructor-badge">Instr: ${this.lessonData.instructor}</span>
                    </h1>
                    <div class="dashboard-clock" id="dashboard-clock">00:00:00</div>
                    <div class="header-controls">
                        <button class="btn-control" onclick="classDashboard.resetTimer()">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                        <button class="btn-control" onclick="classDashboard.nextPhase()">
                            <i class="fas fa-step-forward"></i> Next
                        </button>
                        <button class="btn-fullscreen" onclick="classDashboard.toggleFullscreen()">
                            <i class="fas fa-expand"></i> Fullscreen
                        </button>
                    </div>
                </header>

                <div class="dashboard-grid">
                    <!-- Main Content -->
                    <main class="dashboard-main">
                        <!-- Timeline -->
                        <div class="timeline-container">
                            <div class="timeline-bar" id="timeline-bar">
                                <!-- Segments rendered via JS -->
                            </div>
                            <div class="timeline-marker" id="timeline-marker"></div>
                        </div>

                        <!-- Current Phase Display -->
                        <div class="phase-card" id="phase-card">
                            <!-- Dynamic Content -->
                        </div>
                    </main>

                    <!-- Sidebar -->
                    <aside class="dashboard-sidebar">
                        <h2 class="sidebar-title">Students (${this.lessonData.students.length})</h2>
                        <div id="student-list">
                            ${this.renderStudentList()}
                        </div>
                    </aside>
                </div>
            </div>
        `;
        
        this.renderTimelineSegments();
        this.updatePhaseDisplay();
    },

    renderTimelineSegments() {
        const bar = document.getElementById('timeline-bar');
        if (!bar) return;

        const total = this.classState.totalDurationSeconds;
        
        bar.innerHTML = this.classState.phases.map(phase => {
            const widthPct = (phase.durationSeconds / total) * 100;
            let colorClass = '';
            if (phase.id === 'warmup') colorClass = 'segment-warmup';
            if (phase.id === 'technique') colorClass = 'segment-tech';
            if (phase.id === 'cooldown') colorClass = 'segment-cooldown';
            
            return `<div class="timeline-segment ${colorClass}" style="width: ${widthPct}%" title="${phase.name}"></div>`;
        }).join('');
    },

    renderStudentList() {
        return this.lessonData.students.map(student => `
            <div class="student-card ${student.status === 'injury' ? 'alert' : ''}">
                <span class="student-name">${student.name}</span>
                <div class="student-badges">
                    ${student.status === 'injury' ? `<span class="badge badge-injury">${student.note}</span>` : ''}
                    ${student.status === 'new' ? `<span class="badge badge-new">New</span>` : ''}
                </div>
            </div>
        `).join('');
    },

    startClock() {
        const clockEl = document.getElementById('dashboard-clock');
        if (this.clockInterval) clearInterval(this.clockInterval);
        
        this.clockInterval = setInterval(() => {
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleTimeString();
            }
        }, 1000);
    },

    startClassTimer() {
        if (this.classTimerInterval) clearInterval(this.classTimerInterval);
        
        this.classTimerInterval = setInterval(() => {
            if (!this.classState.isActive) return;

            this.classState.elapsedSeconds++;
            
            // Check if class finished
            if (this.classState.elapsedSeconds > this.classState.totalDurationSeconds) {
                this.classState.elapsedSeconds = this.classState.totalDurationSeconds;
                this.classState.isActive = false;
            }

            this.updateTimerUI();
        }, 1000);
    },

    updateTimerUI() {
        // 1. Update Timeline Marker
        const marker = document.getElementById('timeline-marker');
        if (marker) {
            const pct = (this.classState.elapsedSeconds / this.classState.totalDurationSeconds) * 100;
            marker.style.left = `${pct}%`;
        }

        // 2. Determine Current Phase
        const currentPhase = this.classState.phases.find(p => 
            this.classState.elapsedSeconds >= p.startSeconds && 
            this.classState.elapsedSeconds < p.endSeconds
        ) || this.classState.phases[this.classState.phases.length - 1];

        // 3. Update Phase Display if changed
        if (currentPhase && this.classState.currentPhaseIndex !== this.classState.phases.indexOf(currentPhase)) {
            this.classState.currentPhaseIndex = this.classState.phases.indexOf(currentPhase);
            this.updatePhaseDisplay();
        }

        // 4. Update Phase Timer
        const phaseTimerEl = document.getElementById('phase-timer-display');
        if (phaseTimerEl && currentPhase) {
            const phaseElapsed = this.classState.elapsedSeconds - currentPhase.startSeconds;
            const phaseRemaining = currentPhase.durationSeconds - phaseElapsed;
            
            // Format MM:SS
            const m = Math.floor(phaseRemaining / 60).toString().padStart(2, '0');
            const s = (phaseRemaining % 60).toString().padStart(2, '0');
            phaseTimerEl.textContent = `${m}:${s}`;

            // Alert if < 1 min
            if (phaseRemaining < 60) {
                phaseTimerEl.classList.add('timer-alert');
            } else {
                phaseTimerEl.classList.remove('timer-alert');
            }
        }
    },

    updatePhaseDisplay() {
        const container = document.getElementById('phase-card');
        if (!container) return;

        const phase = this.classState.phases[this.classState.currentPhaseIndex];
        if (!phase) return;

        let contentHtml = '';
        
        if (phase.id === 'warmup') {
            contentHtml = `
                <ul class="exercise-list">
                    ${phase.content.exercises.map(ex => `<li><i class="fas fa-running"></i> ${ex}</li>`).join('')}
                </ul>
            `;
        } else if (phase.id === 'technique') {
            contentHtml = `
                <div class="technique-display">
                    <div class="tech-primary">
                        <span class="label">PRIMARY</span>
                        <h3>${phase.content.primary}</h3>
                    </div>
                    <div class="tech-secondary">
                        <span class="label">SECONDARY</span>
                        <h4>${phase.content.secondary}</h4>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <ul class="exercise-list">
                    ${phase.content.exercises.map(ex => `<li><i class="fas fa-spa"></i> ${ex}</li>`).join('')}
                </ul>
            `;
        }

        container.innerHTML = `
            <div class="phase-header">
                <div class="phase-title">${phase.name}</div>
                <div class="phase-timer" id="phase-timer-display">--:--</div>
            </div>
            <div class="phase-content">
                ${contentHtml}
            </div>
        `;
        
        // Update border color based on phase
        container.className = 'phase-card'; // reset
        container.classList.add(`border-${phase.id}`);
    },

    resetTimer() {
        this.classState.elapsedSeconds = 0;
        this.classState.isActive = true;
        this.updateTimerUI();
        this.updatePhaseDisplay();
    },

    nextPhase() {
        const currentPhaseIndex = this.classState.currentPhaseIndex;
        const nextPhaseIndex = currentPhaseIndex + 1;
        
        if (nextPhaseIndex < this.classState.phases.length) {
            const nextPhase = this.classState.phases[nextPhaseIndex];
            this.classState.elapsedSeconds = nextPhase.startSeconds;
            this.updateTimerUI();
        }
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    },

    destroy() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        if (this.classTimerInterval) clearInterval(this.classTimerInterval);
    }
};

export default ClassDashboardModule;
                                <div class="student-badges">
                                    <span class="badge badge-injury">Knee</span>
                                </div>
                            </div>
                            <div class="student-card">
                                <span class="student-name">Maria Santos</span>
                                <div class="student-badges">
                                    <span class="badge badge-new">New</span>
                                </div>
                            </div>
                            <div class="student-card">
                                <span class="student-name">Pedro Costa</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;
    },

    startClock() {
        const clockEl = document.getElementById('dashboard-clock');
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleTimeString();
            }
        }, 1000);
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    },

    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
};

export default ClassDashboardModule;

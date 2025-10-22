/**
 * Student Progress Module
 * Módulo de visualização de progresso do aluno com heatmap e indicadores de grau
 * 
 * Features:
 * - Heatmap de execuções de atividades
 * - Indicadores circulares de progresso por grau
 * - Estatísticas por categoria
 * - Tendência de performance
 */

// Prevent re-declaration
if (typeof window.StudentProgressModule !== 'undefined') {
    console.log('StudentProgress module already loaded');
} else {

const StudentProgressModule = {
    container: null,
    moduleAPI: null,
    currentStudentId: null,
    currentCourseId: null,
    stats: null,
    heatmapData: null,

    /**
     * Initialize module
     */
    async init(container, studentId, courseId) {
        console.log('🎯 Initializing StudentProgress module...');
        
        this.container = container;
        this.currentStudentId = studentId;
        this.currentCourseId = courseId;

        await this.initializeAPI();
        await this.loadData();
        this.render();

        // Register globally
        window.studentProgress = this;
        window.app?.dispatchEvent('module:loaded', { name: 'studentProgress' });

        console.log('✅ StudentProgress module initialized');
    },

    /**
     * Setup API client
     */
    async initializeAPI() {
        if (typeof window.waitForAPIClient === 'function') {
            await window.waitForAPIClient();
        }
        this.moduleAPI = window.createModuleAPI ? window.createModuleAPI('StudentProgress') : null;
    },

    /**
     * Load student stats and heatmap data
     */
    async loadData() {
        try {
            this.showLoading();

            // Fetch stats
            const statsResponse = await this.moduleAPI.request(
                `/api/lesson-activity-executions/student/${this.currentStudentId}/stats?courseId=${this.currentCourseId}`
            );

            if (statsResponse.success) {
                this.stats = statsResponse.data;
            }

            // Fetch heatmap data
            const heatmapResponse = await this.moduleAPI.request(
                `/api/lesson-activity-executions/student/${this.currentStudentId}/heatmap?courseId=${this.currentCourseId}`
            );

            if (heatmapResponse.success) {
                this.heatmapData = heatmapResponse.data;
            }

            console.log('📊 Data loaded:', { stats: this.stats, heatmap: this.heatmapData });

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(error);
        }
    },

    /**
     * Render complete interface
     */
    render() {
        if (!this.stats || !this.heatmapData) {
            this.showEmpty();
            return;
        }

        this.container.innerHTML = `
            <div class="module-isolated-progress-container">
                <!-- Header -->
                <div class="module-header-premium">
                    <h1><i class="fas fa-chart-line"></i> Progresso do Aluno</h1>
                    <nav class="breadcrumb">
                        <a href="#students">Alunos</a> > 
                        <span>Progresso</span>
                    </nav>
                </div>

                <!-- Degree Progress Section -->
                <div class="degree-progress-section">
                    <h2><i class="fas fa-trophy"></i> Progresso de Graduação</h2>
                    <div class="degree-indicators">
                        ${this.renderDegreeIndicators()}
                    </div>
                </div>

                <!-- Category Stats Section -->
                <div class="category-stats-section">
                    <h2><i class="fas fa-tasks"></i> Estatísticas por Categoria</h2>
                    <div class="category-grid">
                        ${this.renderCategoryStats()}
                    </div>
                </div>

                <!-- Performance Trend Section -->
                <div class="performance-trend-section">
                    <h2><i class="fas fa-trending-up"></i> Tendência de Performance</h2>
                    <div class="trend-card">
                        ${this.renderPerformanceTrend()}
                    </div>
                </div>

                <!-- Heatmap Section -->
                <div class="heatmap-section">
                    <h2><i class="fas fa-th"></i> Heatmap de Execuções</h2>
                    <div class="heatmap-container">
                        ${this.renderHeatmap()}
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    },

    /**
     * Render degree progress indicators (circular progress bars)
     */
    renderDegreeIndicators() {
        const degrees = [
            { number: 1, percentage: 20, color: '#FFD700' },
            { number: 2, percentage: 40, color: '#FFA500' },
            { number: 3, percentage: 60, color: '#FF6347' },
            { number: 4, percentage: 80, color: '#DC143C' }
        ];

        const currentDegree = this.stats.currentDegree || 0;
        const degreeProgress = this.stats.degreeProgress || 0;

        return degrees.map(degree => {
            const isCompleted = currentDegree > degree.number;
            const isCurrent = currentDegree === degree.number;
            const progress = isCurrent ? degreeProgress : (isCompleted ? 100 : 0);

            return `
                <div class="degree-indicator ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                    <div class="circular-progress" data-progress="${progress}" data-color="${degree.color}">
                        <svg width="120" height="120">
                            <circle class="bg-circle" cx="60" cy="60" r="52" />
                            <circle class="progress-circle" cx="60" cy="60" r="52" 
                                    stroke="${degree.color}"
                                    stroke-dasharray="${2 * Math.PI * 52}"
                                    stroke-dashoffset="${2 * Math.PI * 52 * (1 - progress / 100)}" />
                        </svg>
                        <div class="progress-text">
                            <div class="degree-number">${degree.number}º</div>
                            <div class="degree-percentage">${Math.round(progress)}%</div>
                        </div>
                    </div>
                    <div class="degree-label">
                        ${degree.number}º Grau (${degree.percentage}%)
                        ${isCompleted ? '<i class="fas fa-check-circle"></i>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render category statistics
     */
    renderCategoryStats() {
        if (!this.stats.categoryStats || this.stats.categoryStats.length === 0) {
            return '<p class="empty-state">Nenhuma atividade registrada ainda</p>';
        }

        const categoryNames = {
            'posturas': 'POSTURAS',
            'socos': 'SOCOS',
            'chutes': 'CHUTES',
            'defesas': 'DEFESAS',
            'quedas': 'QUEDAS',
            'combinacoes': 'COMBINAÇÕES'
        };

        const categoryIcons = {
            'posturas': '🥋',
            'socos': '👊',
            'chutes': '🦵',
            'defesas': '🛡️',
            'quedas': '🤸',
            'combinacoes': '⚡'
        };

        return this.stats.categoryStats.map(category => {
            const categoryKey = category.categoryId.toLowerCase();
            const name = categoryNames[categoryKey] || category.categoryId;
            const icon = categoryIcons[categoryKey] || '📋';
            const progress = category.progress || 0;

            return `
                <div class="category-card">
                    <div class="category-header">
                        <span class="category-icon">${icon}</span>
                        <h3>${name}</h3>
                    </div>
                    <div class="category-stats">
                        <div class="stat-row">
                            <span class="stat-label">Repetições:</span>
                            <span class="stat-value">${category.totalRepetitions} / ${category.minimumRequired}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Atividades:</span>
                            <span class="stat-value">${category.activitiesCompleted}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Rating Médio:</span>
                            <span class="stat-value">${this.renderStars(category.averageRating)}</span>
                        </div>
                    </div>
                    <div class="category-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(100, progress)}%">
                                ${Math.round(progress)}%
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render performance trend
     */
    renderPerformanceTrend() {
        const trendIcons = {
            'improving': '<i class="fas fa-arrow-trend-up" style="color: #10B981;"></i>',
            'stable': '<i class="fas fa-arrow-right" style="color: #F59E0B;"></i>',
            'declining': '<i class="fas fa-arrow-trend-down" style="color: #EF4444;"></i>',
            'insufficient_data': '<i class="fas fa-question-circle" style="color: #6B7280;"></i>'
        };

        const trendMessages = {
            'improving': 'Performance em crescimento! Continue assim! 🚀',
            'stable': 'Performance estável. Mantenha o foco! 💪',
            'declining': 'Performance em queda. Converse com seu instrutor. 🤔',
            'insufficient_data': 'Dados insuficientes para análise (mínimo 5 execuções)'
        };

        const trend = this.stats.recentTrend || 'insufficient_data';

        return `
            <div class="trend-content">
                <div class="trend-icon">
                    ${trendIcons[trend]}
                </div>
                <div class="trend-info">
                    <div class="trend-message">${trendMessages[trend]}</div>
                    <div class="trend-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total de Repetições:</span>
                            <span class="stat-value">${this.stats.totalRepetitions}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Atividades Completadas:</span>
                            <span class="stat-value">${this.stats.totalActivitiesCompleted}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Rating Recente:</span>
                            <span class="stat-value">${this.renderStars(this.stats.recentAverageRating)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render heatmap of activity executions
     */
    renderHeatmap() {
        if (!this.heatmapData.uniqueDates || this.heatmapData.uniqueDates.length === 0) {
            return '<p class="empty-state">Nenhuma execução registrada no período</p>';
        }

        const activities = this.heatmapData.uniqueActivities.slice(0, 20); // Limite de 20 atividades
        const dates = this.heatmapData.uniqueDates.slice(-30); // Últimos 30 dias

        return `
            <div class="heatmap-grid">
                <!-- Header: Datas -->
                <div class="heatmap-header">
                    <div class="heatmap-corner"></div>
                    ${dates.map(date => `
                        <div class="heatmap-date">${this.formatDate(date)}</div>
                    `).join('')}
                </div>

                <!-- Body: Atividades × Datas -->
                ${activities.map(activity => `
                    <div class="heatmap-row">
                        <div class="heatmap-activity-label">${activity}</div>
                        ${dates.map(date => {
                            const cell = this.getHeatmapCell(activity, date);
                            const intensity = cell ? Math.min(10, cell.repetitions) : 0;
                            const colorClass = `heat-${Math.ceil(intensity / 2)}`;
                            
                            return `
                                <div class="heatmap-cell ${colorClass}" 
                                     data-activity="${activity}"
                                     data-date="${date}"
                                     data-reps="${cell ? cell.repetitions : 0}"
                                     data-rating="${cell ? (cell.rating || 'N/A') : 'N/A'}"
                                     title="${activity} - ${date}: ${cell ? cell.repetitions + ' reps' : 'Não executado'}">
                                    ${cell ? cell.repetitions : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>

            <!-- Legenda -->
            <div class="heatmap-legend">
                <span>Menos</span>
                <div class="legend-cells">
                    <div class="legend-cell heat-0"></div>
                    <div class="legend-cell heat-1"></div>
                    <div class="legend-cell heat-2"></div>
                    <div class="legend-cell heat-3"></div>
                    <div class="legend-cell heat-4"></div>
                    <div class="legend-cell heat-5"></div>
                </div>
                <span>Mais</span>
            </div>
        `;
    },

    /**
     * Helper: Get heatmap cell data for activity × date
     */
    getHeatmapCell(activity, date) {
        if (!this.heatmapData.heatmapData) return null;

        for (const lessonNumber in this.heatmapData.heatmapData) {
            const lesson = this.heatmapData.heatmapData[lessonNumber];
            if (lesson[activity]) {
                const execution = lesson[activity].find(ex => ex.date === date);
                if (execution) return execution;
            }
        }

        return null;
    },

    /**
     * Helper: Render star rating
     */
    renderStars(rating) {
        if (!rating) return 'N/A';
        
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #FFD700;"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #FFD700;"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #D1D5DB;"></i>';
        }

        return `${stars} <span style="margin-left: 5px;">${rating.toFixed(1)}</span>`;
    },

    /**
     * Helper: Format date for heatmap
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        return `${day}/${month}`;
    },

    /**
     * Attach event listeners
     */
    attachEvents() {
        // Hover effect on heatmap cells
        const cells = this.container.querySelectorAll('.heatmap-cell');
        cells.forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const activity = e.target.dataset.activity;
                const date = e.target.dataset.date;
                const reps = e.target.dataset.reps;
                const rating = e.target.dataset.rating;

                // Show tooltip (could be implemented with a tooltip library)
                console.log(`${activity} - ${date}: ${reps} reps, rating: ${rating}`);
            });
        });
    },

    /**
     * Show loading state
     */
    showLoading() {
        this.container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Carregando dados de progresso...</p>
            </div>
        `;
    },

    /**
     * Show empty state
     */
    showEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line fa-3x"></i>
                <p>Nenhum dado de progresso disponível</p>
                <p class="hint">Complete atividades em aulas para ver estatísticas aqui</p>
            </div>
        `;
    },

    /**
     * Show error state
     */
    showError(error) {
        this.container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <p>Erro ao carregar dados de progresso</p>
                <p class="error-message">${error.message || 'Erro desconhecido'}</p>
                <button onclick="window.studentProgress.loadData()">Tentar Novamente</button>
            </div>
        `;
    }
};

// Export to window
window.StudentProgressModule = StudentProgressModule;

} // end if

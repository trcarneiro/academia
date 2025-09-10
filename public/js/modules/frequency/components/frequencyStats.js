/**
 * FrequencyStats - Componente para exibir estatísticas de frequência
 */

export class FrequencyStats {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showCharts: true,
            showTrends: true,
            refreshInterval: 300000, // 5 minutos
            ...options
        };
        
        this.statsData = {};
        this.refreshTimer = null;
        
        console.log('📊 FrequencyStats initialized');
    }

    /**
     * Renderizar estatísticas
     */
    render(statsData = {}) {
        this.statsData = statsData;
        
        this.container.innerHTML = this.getHTML();
        this.bindEvents();
        this.renderCharts();
        this.startAutoRefresh();
    }

    /**
     * HTML das estatísticas
     */
    getHTML() {
        return `
            <div class="frequency-stats-container">
                <!-- Cards de Estatísticas Principais -->
                <div class="stats-cards-grid">
                    ${this.renderMainStatsCards()}
                </div>

                <!-- Gráficos e Tendências -->
                ${this.options.showCharts ? `
                    <div class="charts-section">
                        <div class="charts-grid">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h4>📈 Frequência Semanal</h4>
                                    <div class="chart-controls">
                                        <select id="weekly-period">
                                            <option value="4">Últimas 4 semanas</option>
                                            <option value="8">Últimas 8 semanas</option>
                                            <option value="12">Últimas 12 semanas</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="chart-content" id="weekly-chart">
                                    <!-- Gráfico será renderizado aqui -->
                                </div>
                            </div>

                            <div class="chart-container">
                                <div class="chart-header">
                                    <h4>🕒 Distribuição por Horário</h4>
                                </div>
                                <div class="chart-content" id="hourly-chart">
                                    <!-- Gráfico será renderizado aqui -->
                                </div>
                            </div>
                        </div>

                        <div class="charts-grid">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h4>🎓 Frequência por Curso</h4>
                                </div>
                                <div class="chart-content" id="course-chart">
                                    <!-- Gráfico será renderizado aqui -->
                                </div>
                            </div>

                            <div class="chart-container">
                                <div class="chart-header">
                                    <h4>📱 Dispositivos Utilizados</h4>
                                </div>
                                <div class="chart-content" id="device-chart">
                                    <!-- Gráfico será renderizado aqui -->
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Rankings e Listas -->
                <div class="rankings-section">
                    <div class="rankings-grid">
                        <div class="ranking-container">
                            <div class="ranking-header">
                                <h4>🏆 Top Alunos (Mês)</h4>
                            </div>
                            <div class="ranking-content" id="top-students">
                                <!-- Ranking será renderizado aqui -->
                            </div>
                        </div>

                        <div class="ranking-container">
                            <div class="ranking-header">
                                <h4>📅 Frequência Recente</h4>
                            </div>
                            <div class="ranking-content" id="recent-activity">
                                <!-- Atividade recente será renderizada aqui -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alertas e Insights -->
                ${this.options.showTrends ? `
                    <div class="insights-section">
                        <div class="insights-header">
                            <h4>💡 Insights e Alertas</h4>
                            <span class="last-update" id="last-update">
                                Atualizado: ${new Date().toLocaleTimeString('pt-BR')}
                            </span>
                        </div>
                        <div class="insights-content" id="insights-list">
                            <!-- Insights serão renderizados aqui -->
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Renderizar cards principais
     */
    renderMainStatsCards() {
        const stats = this.statsData;
        
        return `
            <div class="stat-card-enhanced">
                <div class="stat-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.todayCount || 0}</div>
                    <div class="stat-label">Presenças Hoje</div>
                    <div class="stat-trend ${this.getTrendClass(stats.todayTrend)}">
                        ${this.getTrendIcon(stats.todayTrend)} ${stats.todayTrend || 0}%
                    </div>
                </div>
            </div>

            <div class="stat-card-enhanced">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.weekCount || 0}</div>
                    <div class="stat-label">Esta Semana</div>
                    <div class="stat-trend ${this.getTrendClass(stats.weekTrend)}">
                        ${this.getTrendIcon(stats.weekTrend)} ${stats.weekTrend || 0}%
                    </div>
                </div>
            </div>

            <div class="stat-card-enhanced">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.monthCount || 0}</div>
                    <div class="stat-label">Este Mês</div>
                    <div class="stat-trend ${this.getTrendClass(stats.monthTrend)}">
                        ${this.getTrendIcon(stats.monthTrend)} ${stats.monthTrend || 0}%
                    </div>
                </div>
            </div>

            <div class="stat-card-enhanced">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.averageDaily || 0}</div>
                    <div class="stat-label">Média Diária</div>
                    <div class="stat-additional">
                        ${stats.activeStudents || 0} alunos ativos
                    </div>
                </div>
            </div>

            <div class="stat-card-enhanced">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.peakHour || '--:--'}</div>
                    <div class="stat-label">Horário de Pico</div>
                    <div class="stat-additional">
                        ${stats.peakCount || 0} check-ins
                    </div>
                </div>
            </div>

            <div class="stat-card-enhanced">
                <div class="stat-icon">📱</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.digitalCheckIns || 0}%</div>
                    <div class="stat-label">Check-ins Digitais</div>
                    <div class="stat-additional">
                        ${stats.qrScans || 0} via QR Code
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar gráficos
     */
    renderCharts() {
        if (!this.options.showCharts) return;

        // Gráfico semanal
        this.renderWeeklyChart();
        
        // Gráfico de horários
        this.renderHourlyChart();
        
        // Gráfico por curso
        this.renderCourseChart();
        
        // Gráfico de dispositivos
        this.renderDeviceChart();
    }

    /**
     * Gráfico de frequência semanal
     */
    renderWeeklyChart() {
        const container = document.getElementById('weekly-chart');
        if (!container) return;

        const weeklyData = this.statsData.weekly || [];
        
        // Implementação simplificada - usar biblioteca de gráficos em produção
        const bars = weeklyData.map((week, index) => {
            const percentage = Math.max(5, (week.count / Math.max(...weeklyData.map(w => w.count))) * 100);
            
            return `
                <div class="chart-bar-container">
                    <div class="chart-bar" style="height: ${percentage}%">
                        <div class="bar-value">${week.count}</div>
                    </div>
                    <div class="bar-label">${week.label}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="simple-bar-chart">
                ${bars}
            </div>
        `;
    }

    /**
     * Gráfico de distribuição horária
     */
    renderHourlyChart() {
        const container = document.getElementById('hourly-chart');
        if (!container) return;

        const hourlyData = this.statsData.hourly || [];
        
        const timeSlots = hourlyData.map(slot => {
            const intensity = Math.max(10, (slot.count / Math.max(...hourlyData.map(h => h.count))) * 100);
            
            return `
                <div class="time-slot" style="opacity: ${intensity / 100}">
                    <div class="slot-time">${slot.hour}h</div>
                    <div class="slot-count">${slot.count}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="hourly-heatmap">
                ${timeSlots}
            </div>
        `;
    }

    /**
     * Gráfico por curso
     */
    renderCourseChart() {
        const container = document.getElementById('course-chart');
        if (!container) return;

        const courseData = this.statsData.courses || [];
        
        const courseBars = courseData.map(course => {
            const percentage = Math.max(5, (course.count / Math.max(...courseData.map(c => c.count))) * 100);
            
            return `
                <div class="course-bar">
                    <div class="course-name">${course.name}</div>
                    <div class="course-progress">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                        <span class="progress-value">${course.count}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="course-chart">
                ${courseBars}
            </div>
        `;
    }

    /**
     * Gráfico de dispositivos
     */
    renderDeviceChart() {
        const container = document.getElementById('device-chart');
        if (!container) return;

        const deviceData = this.statsData.devices || [];
        
        const deviceItems = deviceData.map(device => {
            const percentage = Math.max(5, (device.count / Math.max(...deviceData.map(d => d.count))) * 100);
            const icon = this.getDeviceIcon(device.type);
            
            return `
                <div class="device-item">
                    <div class="device-icon">${icon}</div>
                    <div class="device-info">
                        <div class="device-name">${device.name}</div>
                        <div class="device-progress">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="device-count">${device.count}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="device-chart">
                ${deviceItems}
            </div>
        `;
    }

    /**
     * Renderizar ranking de alunos
     */
    renderTopStudents() {
        const container = document.getElementById('top-students');
        if (!container) return;

        const topStudents = this.statsData.topStudents || [];
        
        const studentItems = topStudents.map((student, index) => {
            const position = index + 1;
            const medal = this.getPositionMedal(position);
            
            return `
                <div class="ranking-item">
                    <div class="ranking-position">
                        <span class="position-medal">${medal}</span>
                        <span class="position-number">${position}</span>
                    </div>
                    <div class="ranking-student">
                        <div class="student-name">${student.name}</div>
                        <div class="student-belt">${student.belt || 'Sem graduação'}</div>
                    </div>
                    <div class="ranking-stats">
                        <div class="stat-value">${student.attendanceCount}</div>
                        <div class="stat-label">presenças</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = studentItems || '<div class="no-data">Nenhum dado disponível</div>';
    }

    /**
     * Renderizar atividade recente
     */
    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recentActivity = this.statsData.recentActivity || [];
        
        const activityItems = recentActivity.map(activity => {
            const timeAgo = this.getTimeAgo(activity.time);
            
            return `
                <div class="activity-item">
                    <div class="activity-time">${timeAgo}</div>
                    <div class="activity-details">
                        <div class="activity-student">${activity.studentName}</div>
                        <div class="activity-session">${activity.sessionName}</div>
                    </div>
                    <div class="activity-status">
                        ${this.getStatusIcon(activity.status)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activityItems || '<div class="no-data">Nenhuma atividade recente</div>';
    }

    /**
     * Renderizar insights
     */
    renderInsights() {
        if (!this.options.showTrends) return;

        const container = document.getElementById('insights-list');
        if (!container) return;

        const insights = this.generateInsights();
        
        const insightItems = insights.map(insight => {
            const iconClass = this.getInsightIcon(insight.type);
            const severityClass = this.getInsightSeverity(insight.severity);
            
            return `
                <div class="insight-item ${severityClass}">
                    <div class="insight-icon">${iconClass}</div>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-description">${insight.description}</div>
                        ${insight.action ? `
                            <div class="insight-action">
                                <button class="btn-insight" onclick="${insight.action}">
                                    ${insight.actionLabel}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = insightItems || '<div class="no-insights">Nenhum insight disponível</div>';
    }

    /**
     * Gerar insights automáticos
     */
    generateInsights() {
        const insights = [];
        const stats = this.statsData;

        // Insight sobre tendência
        if (stats.weekTrend && stats.weekTrend < -10) {
            insights.push({
                type: 'trend',
                severity: 'warning',
                title: 'Queda na Frequência',
                description: `A frequência desta semana está ${Math.abs(stats.weekTrend)}% menor que a semana anterior.`,
                action: 'analyzeFrequencyDrop()',
                actionLabel: 'Analisar Causas'
            });
        }

        // Insight sobre horário de pico
        if (stats.peakHour && stats.peakCount > stats.averageDaily * 0.3) {
            insights.push({
                type: 'schedule',
                severity: 'info',
                title: 'Horário de Pico Identificado',
                description: `${stats.peakHour} concentra ${stats.peakCount} check-ins. Considere otimizar a capacidade.`,
                action: 'optimizeSchedule()',
                actionLabel: 'Ver Sugestões'
            });
        }

        // Insight sobre dispositivos
        if (stats.digitalCheckIns && stats.digitalCheckIns > 80) {
            insights.push({
                type: 'technology',
                severity: 'success',
                title: 'Alta Adoção Digital',
                description: `${stats.digitalCheckIns}% dos check-ins são digitais. Excelente engajamento!`,
                action: null,
                actionLabel: null
            });
        }

        return insights;
    }

    /**
     * Bind eventos
     */
    bindEvents() {
        // Período do gráfico semanal
        document.getElementById('weekly-period')?.addEventListener('change', (e) => {
            this.updateWeeklyPeriod(e.target.value);
        });

        // Refresh manual
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-stats')) {
                this.refreshStats();
            }
        });
    }

    /**
     * Atualizar período semanal
     */
    async updateWeeklyPeriod(weeks) {
        try {
            // Buscar dados para o novo período
            const newData = await this.fetchWeeklyData(weeks);
            this.statsData.weekly = newData;
            
            // Re-renderizar gráfico
            this.renderWeeklyChart();
            
        } catch (error) {
            console.error('Error updating weekly period:', error);
        }
    }

    /**
     * Buscar dados semanais (mock)
     */
    async fetchWeeklyData(weeks) {
        // Mock data - em produção fazer chamada real
        const data = [];
        for (let i = weeks - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            
            data.push({
                label: `Sem ${weeks - i}`,
                count: Math.floor(Math.random() * 100) + 50,
                week: date.toISOString().split('T')[0]
            });
        }
        return data;
    }

    /**
     * Refresh das estatísticas
     */
    async refreshStats() {
        try {
            console.log('🔄 Refreshing frequency stats...');
            
            // Em produção, buscar dados atualizados da API
            const updatedStats = await this.fetchUpdatedStats();
            
            // Atualizar dados
            this.statsData = { ...this.statsData, ...updatedStats };
            
            // Re-renderizar componentes
            this.renderCharts();
            this.renderTopStudents();
            this.renderRecentActivity();
            this.renderInsights();
            
            // Atualizar timestamp
            const lastUpdateEl = document.getElementById('last-update');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;
            }
            
        } catch (error) {
            console.error('Error refreshing stats:', error);
        }
    }

    /**
     * Buscar estatísticas atualizadas (mock)
     */
    async fetchUpdatedStats() {
        // Mock data - em produção fazer chamada real para API
        return {
            todayCount: Math.floor(Math.random() * 50) + 20,
            todayTrend: (Math.random() - 0.5) * 20,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Iniciar refresh automático
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(() => {
            this.refreshStats();
        }, this.options.refreshInterval);
    }

    /**
     * Parar refresh automático
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Utilitários
     */
    getTrendClass(trend) {
        if (trend > 0) return 'trend-up';
        if (trend < 0) return 'trend-down';
        return 'trend-neutral';
    }

    getTrendIcon(trend) {
        if (trend > 0) return '📈';
        if (trend < 0) return '📉';
        return '➡️';
    }

    getDeviceIcon(deviceType) {
        const icons = {
            'mobile': '📱',
            'desktop': '💻',
            'kiosk': '🖥️'
        };
        return icons[deviceType] || '💻';
    }

    getPositionMedal(position) {
        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        return medals[position] || '🏅';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Agora';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d`;
    }

    getStatusIcon(status) {
        const icons = {
            'CONFIRMED': '✅',
            'PENDING': '⏳',
            'CANCELLED': '❌'
        };
        return icons[status] || '❓';
    }

    getInsightIcon(type) {
        const icons = {
            'trend': '📊',
            'schedule': '🕒',
            'technology': '📱',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getInsightSeverity(severity) {
        return `insight-${severity}`;
    }

    /**
     * Destructor
     */
    destroy() {
        this.stopAutoRefresh();
    }

    /**
     * Atualizar dados
     */
    updateData(newStatsData) {
        this.statsData = { ...this.statsData, ...newStatsData };
        this.render(this.statsData);
    }
}

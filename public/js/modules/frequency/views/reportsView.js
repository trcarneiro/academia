/**
 * ReportsView - View para relatórios de frequência
 */

export class ReportsView {
    constructor() {
        this.template = null;
    }

    /**
     * Renderizar view de relatórios
     */
    render(statsData = {}) {
        return `
            <div class="frequency-reports-view">
                <!-- Header da Página -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title">
                            <h1>📈 Relatórios de Frequência</h1>
                            <p>Análises detalhadas e insights sobre a frequência dos alunos</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" id="export-pdf">
                                📄 Exportar PDF
                            </button>
                            <button class="btn-secondary" id="schedule-report">
                                📅 Agendar Relatório
                            </button>
                            <button class="btn-primary" id="refresh-reports">
                                🔄 Atualizar Dados
                            </button>
                        </div>
                    </div>
                    
                    <!-- Breadcrumb Navigation -->
                    <nav class="breadcrumb-nav">
                        <span class="breadcrumb-item">Academia</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item">✅ Frequência</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item active">📈 Relatórios</span>
                    </nav>
                </div>

                <!-- Report Controls -->
                <div class="report-controls data-card-premium">
                    <div class="controls-header">
                        <h4>⚙️ Configurações do Relatório</h4>
                    </div>
                    
                    <div class="controls-content">
                        <div class="control-row">
                            <div class="control-group">
                                <label for="report-period">📅 Período</label>
                                <select id="report-period" class="control-select">
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="30" selected>Últimos 30 dias</option>
                                    <option value="90">Últimos 3 meses</option>
                                    <option value="365">Último ano</option>
                                    <option value="custom">Período customizado</option>
                                </select>
                            </div>
                            
                            <div class="control-group" id="custom-range" style="display: none;">
                                <label>Período Customizado</label>
                                <div class="date-range">
                                    <input type="date" id="start-date" class="control-input">
                                    <span>até</span>
                                    <input type="date" id="end-date" class="control-input">
                                </div>
                            </div>
                            
                            <div class="control-group">
                                <label for="report-grouping">📊 Agrupar por</label>
                                <select id="report-grouping" class="control-select">
                                    <option value="day">Dia</option>
                                    <option value="week" selected>Semana</option>
                                    <option value="month">Mês</option>
                                    <option value="course">Curso</option>
                                    <option value="student">Aluno</option>
                                </select>
                            </div>
                            
                            <div class="control-group">
                                <label for="report-filter">🔍 Filtrar por</label>
                                <select id="report-filter" class="control-select">
                                    <option value="">Todos os dados</option>
                                    <option value="course">Curso específico</option>
                                    <option value="instructor">Instrutor específico</option>
                                    <option value="belt">Graduação específica</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="control-actions">
                            <button class="btn-secondary" id="reset-controls">
                                🔄 Resetar
                            </button>
                            <button class="btn-primary" id="generate-report">
                                📊 Gerar Relatório
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Statistics -->
                <div class="reports-stats">
                    <div id="frequency-stats-container">
                        <!-- FrequencyStats component será renderizado aqui -->
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="charts-header">
                        <h4>📊 Análises Gráficas</h4>
                        <div class="chart-toggle">
                            <button class="chart-tab active" data-chart="overview">Visão Geral</button>
                            <button class="chart-tab" data-chart="trends">Tendências</button>
                            <button class="chart-tab" data-chart="comparison">Comparações</button>
                            <button class="chart-tab" data-chart="detailed">Detalhado</button>
                        </div>
                    </div>
                    
                    <!-- Overview Charts -->
                    <div class="chart-panel active" id="overview-panel">
                        <div class="charts-grid">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h5>📈 Evolução da Frequência</h5>
                                    <div class="chart-actions">
                                        <button class="btn-icon" onclick="toggleChartType('evolution')">🔄</button>
                                        <button class="btn-icon" onclick="exportChart('evolution')">📥</button>
                                    </div>
                                </div>
                                <div class="chart-content" id="evolution-chart">
                                    ${this.renderEvolutionChart(statsData)}
                                </div>
                            </div>
                            
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h5>🎯 Distribuição por Curso</h5>
                                    <div class="chart-actions">
                                        <button class="btn-icon" onclick="toggleChartType('distribution')">🔄</button>
                                        <button class="btn-icon" onclick="exportChart('distribution')">📥</button>
                                    </div>
                                </div>
                                <div class="chart-content" id="distribution-chart">
                                    ${this.renderDistributionChart(statsData)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="charts-grid">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h5>🕒 Padrões de Horário</h5>
                                </div>
                                <div class="chart-content" id="hourly-patterns-chart">
                                    ${this.renderHourlyPatternsChart(statsData)}
                                </div>
                            </div>
                            
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h5>📱 Dispositivos Utilizados</h5>
                                </div>
                                <div class="chart-content" id="devices-chart">
                                    ${this.renderDevicesChart(statsData)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Trends Panel -->
                    <div class="chart-panel" id="trends-panel" style="display: none;">
                        <div class="trends-content">
                            <div class="trend-analysis">
                                <h5>📊 Análise de Tendências</h5>
                                <div class="trend-insights" id="trend-insights">
                                    ${this.renderTrendInsights(statsData)}
                                </div>
                            </div>
                            
                            <div class="forecasting">
                                <h5>🔮 Previsões</h5>
                                <div class="forecast-content" id="forecast-content">
                                    ${this.renderForecast(statsData)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comparison Panel -->
                    <div class="chart-panel" id="comparison-panel" style="display: none;">
                        <div class="comparison-content">
                            <div class="comparison-controls">
                                <h5>⚖️ Comparações</h5>
                                <div class="comparison-options">
                                    <select id="comparison-type">
                                        <option value="period">Períodos</option>
                                        <option value="courses">Cursos</option>
                                        <option value="instructors">Instrutores</option>
                                        <option value="students">Alunos</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="comparison-results" id="comparison-results">
                                ${this.renderComparison(statsData)}
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Panel -->
                    <div class="chart-panel" id="detailed-panel" style="display: none;">
                        <div class="detailed-content">
                            <div class="detailed-metrics">
                                <h5>🔍 Métricas Detalhadas</h5>
                                <div class="metrics-grid" id="detailed-metrics">
                                    ${this.renderDetailedMetrics(statsData)}
                                </div>
                            </div>
                            
                            <div class="correlation-analysis">
                                <h5>🔗 Análise de Correlações</h5>
                                <div class="correlation-content" id="correlation-content">
                                    ${this.renderCorrelationAnalysis(statsData)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Items and Recommendations -->
                <div class="recommendations-section">
                    <div class="recommendations-grid">
                        <div class="recommendation-panel data-card-premium">
                            <h4>💡 Recomendações</h4>
                            <div class="recommendations-list" id="recommendations-list">
                                ${this.renderRecommendations(statsData)}
                            </div>
                        </div>
                        
                        <div class="alerts-panel data-card-premium">
                            <h4>⚠️ Alertas e Notificações</h4>
                            <div class="alerts-list" id="alerts-list">
                                ${this.renderAlerts(statsData)}
                            </div>
                        </div>
                        
                        <div class="goals-panel data-card-premium">
                            <h4>🎯 Metas e Objetivos</h4>
                            <div class="goals-content" id="goals-content">
                                ${this.renderGoals(statsData)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export and Sharing -->
                <div class="export-section">
                    <div class="export-panel data-card-premium">
                        <h4>📤 Exportar e Compartilhar</h4>
                        <div class="export-options">
                            <div class="export-format">
                                <label>Formato:</label>
                                <select id="export-format">
                                    <option value="pdf">PDF Completo</option>
                                    <option value="excel">Planilha Excel</option>
                                    <option value="csv">Dados CSV</option>
                                    <option value="png">Imagens PNG</option>
                                </select>
                            </div>
                            
                            <div class="export-content">
                                <label>Conteúdo:</label>
                                <div class="content-checkboxes">
                                    <label><input type="checkbox" checked> Estatísticas principais</label>
                                    <label><input type="checkbox" checked> Gráficos</label>
                                    <label><input type="checkbox"> Dados detalhados</label>
                                    <label><input type="checkbox"> Recomendações</label>
                                </div>
                            </div>
                            
                            <div class="export-actions">
                                <button class="btn-secondary" id="preview-export">
                                    👁️ Visualizar
                                </button>
                                <button class="btn-primary" id="download-report">
                                    📥 Baixar Relatório
                                </button>
                                <button class="btn-outline" id="share-report">
                                    🔗 Compartilhar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar gráfico de evolução
     */
    renderEvolutionChart(data) {
        // Implementação simplificada - usar biblioteca de gráficos em produção
        const evolutionData = data.evolution || [];
        
        const bars = evolutionData.map((item, index) => {
            const percentage = Math.max(5, (item.value / Math.max(...evolutionData.map(d => d.value))) * 100);
            
            return `
                <div class="evolution-bar">
                    <div class="bar-fill" style="height: ${percentage}%">
                        <span class="bar-value">${item.value}</span>
                    </div>
                    <div class="bar-label">${item.label}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="evolution-chart">
                ${bars || '<div class="no-chart-data">Dados insuficientes</div>'}
            </div>
        `;
    }

    /**
     * Renderizar gráfico de distribuição
     */
    renderDistributionChart(data) {
        const distributionData = data.distribution || [];
        
        const total = distributionData.reduce((sum, item) => sum + item.value, 0);
        
        const slices = distributionData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
            
            return `
                <div class="pie-slice" style="
                    background-color: ${colors[index % colors.length]};
                    flex: ${percentage};
                ">
                    <span class="slice-label">${item.label}</span>
                    <span class="slice-value">${percentage.toFixed(1)}%</span>
                </div>
            `;
        }).join('');

        return `
            <div class="distribution-chart">
                <div class="pie-chart">
                    ${slices || '<div class="no-chart-data">Dados insuficientes</div>'}
                </div>
                <div class="pie-legend">
                    ${distributionData.map((item, index) => `
                        <div class="legend-item">
                            <div class="legend-color" style="background-color: ${['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'][index % 5]}"></div>
                            <span class="legend-label">${item.label}: ${item.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renderizar padrões de horário
     */
    renderHourlyPatternsChart(data) {
        const hourlyData = data.hourly || [];
        
        const heatmap = Array.from({ length: 24 }, (_, hour) => {
            const hourData = hourlyData.find(h => h.hour === hour) || { count: 0 };
            const intensity = hourlyData.length > 0 ? 
                (hourData.count / Math.max(...hourlyData.map(h => h.count))) : 0;
            
            return `
                <div class="hour-cell" style="opacity: ${0.1 + intensity * 0.9}" title="${hour}h: ${hourData.count} check-ins">
                    <div class="hour-label">${hour}h</div>
                    <div class="hour-count">${hourData.count}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="hourly-heatmap">
                ${heatmap}
            </div>
        `;
    }

    /**
     * Renderizar gráfico de dispositivos
     */
    renderDevicesChart(data) {
        const devicesData = data.devices || [];
        
        const deviceBars = devicesData.map(device => {
            const percentage = devicesData.length > 0 ? 
                (device.count / Math.max(...devicesData.map(d => d.count))) * 100 : 0;
            
            const deviceIcons = { mobile: '📱', desktop: '💻', kiosk: '🖥️' };
            
            return `
                <div class="device-bar">
                    <div class="device-info">
                        <span class="device-icon">${deviceIcons[device.type] || '💻'}</span>
                        <span class="device-name">${device.name}</span>
                    </div>
                    <div class="device-progress">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                        <span class="progress-value">${device.count}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="devices-chart">
                ${deviceBars || '<div class="no-chart-data">Dados insuficientes</div>'}
            </div>
        `;
    }

    /**
     * Renderizar insights de tendências
     */
    renderTrendInsights(data) {
        const trends = data.trends || [];
        
        return trends.map(trend => `
            <div class="trend-insight ${trend.type}">
                <div class="trend-icon">${this.getTrendIcon(trend.direction)}</div>
                <div class="trend-content">
                    <div class="trend-title">${trend.title}</div>
                    <div class="trend-description">${trend.description}</div>
                    <div class="trend-value">${trend.value}</div>
                </div>
            </div>
        `).join('') || '<div class="no-insights">Nenhuma tendência identificada</div>';
    }

    /**
     * Renderizar previsões
     */
    renderForecast(data) {
        const forecasts = data.forecasts || [];
        
        return forecasts.map(forecast => `
            <div class="forecast-item">
                <div class="forecast-period">${forecast.period}</div>
                <div class="forecast-prediction">
                    <span class="prediction-value">${forecast.predicted}</span>
                    <span class="prediction-label">${forecast.metric}</span>
                </div>
                <div class="forecast-confidence">
                    Confiança: ${forecast.confidence}%
                </div>
            </div>
        `).join('') || '<div class="no-forecast">Dados insuficientes para previsão</div>';
    }

    /**
     * Renderizar comparações
     */
    renderComparison(data) {
        return `
            <div class="comparison-chart">
                <div class="comparison-placeholder">
                    📊 Selecione um tipo de comparação acima para visualizar os dados
                </div>
            </div>
        `;
    }

    /**
     * Renderizar métricas detalhadas
     */
    renderDetailedMetrics(data) {
        const metrics = [
            { label: 'Taxa de Frequência Média', value: '87.3%', icon: '📊' },
            { label: 'Tempo Médio por Check-in', value: '2.3s', icon: '⏱️' },
            { label: 'Pico de Frequência', value: '18:30', icon: '🔥' },
            { label: 'Variação Semanal', value: '+12%', icon: '📈' },
            { label: 'Dispositivo Preferido', value: 'Mobile', icon: '📱' },
            { label: 'Curso Mais Popular', value: 'Krav Maga', icon: '🥋' }
        ];

        return metrics.map(metric => `
            <div class="metric-card">
                <div class="metric-icon">${metric.icon}</div>
                <div class="metric-content">
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-value">${metric.value}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderizar análise de correlações
     */
    renderCorrelationAnalysis(data) {
        const correlations = [
            { factor1: 'Horário', factor2: 'Frequência', correlation: 0.78, strength: 'Forte' },
            { factor1: 'Dia da Semana', factor2: 'Presença', correlation: 0.65, strength: 'Moderada' },
            { factor1: 'Curso', factor2: 'Dispositivo', correlation: 0.42, strength: 'Fraca' }
        ];

        return correlations.map(corr => `
            <div class="correlation-item">
                <div class="correlation-factors">
                    ${corr.factor1} ↔ ${corr.factor2}
                </div>
                <div class="correlation-strength ${corr.strength.toLowerCase()}">
                    ${corr.strength} (${corr.correlation})
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderizar recomendações
     */
    renderRecommendations(data) {
        const recommendations = [
            {
                type: 'optimization',
                icon: '⚡',
                title: 'Otimizar Horários de Pico',
                description: 'Considere aumentar a capacidade entre 18h-20h'
            },
            {
                type: 'technology',
                icon: '📱',
                title: 'Promover Check-in Digital',
                description: 'Implemente QR codes para facilitar o processo'
            },
            {
                type: 'engagement',
                icon: '🎯',
                title: 'Melhorar Engajamento',
                description: 'Foque em alunos com baixa frequência'
            }
        ];

        return recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-icon">${rec.icon}</div>
                <div class="recommendation-content">
                    <div class="recommendation-title">${rec.title}</div>
                    <div class="recommendation-description">${rec.description}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderizar alertas
     */
    renderAlerts(data) {
        const alerts = [
            {
                type: 'warning',
                icon: '⚠️',
                message: 'Queda de 15% na frequência esta semana',
                action: 'Investigar causas'
            },
            {
                type: 'info',
                icon: 'ℹ️',
                message: 'Novo pico de horário identificado',
                action: 'Ajustar programação'
            }
        ];

        return alerts.map(alert => `
            <div class="alert-item alert-${alert.type}">
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-action">${alert.action}</div>
                </div>
            </div>
        `).join('') || '<div class="no-alerts">Nenhum alerta ativo</div>';
    }

    /**
     * Renderizar metas
     */
    renderGoals(data) {
        const goals = [
            { name: 'Taxa de Frequência', current: 87, target: 90, unit: '%' },
            { name: 'Check-ins Digitais', current: 75, target: 85, unit: '%' },
            { name: 'Tempo de Resposta', current: 2.3, target: 2.0, unit: 's' }
        ];

        return goals.map(goal => {
            const progress = Math.min(100, (goal.current / goal.target) * 100);
            const status = progress >= 100 ? 'achieved' : progress >= 80 ? 'close' : 'behind';
            
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-values">
                            ${goal.current}${goal.unit} / ${goal.target}${goal.unit}
                        </div>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar ${status}">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-percentage">${progress.toFixed(1)}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Alternar painel de gráficos
     */
    switchChartPanel(panelType) {
        // Esconder todos os painéis
        document.querySelectorAll('.chart-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        // Mostrar painel selecionado
        const targetPanel = document.getElementById(`${panelType}-panel`);
        if (targetPanel) {
            targetPanel.style.display = 'block';
        }

        // Atualizar tabs
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelector(`[data-chart="${panelType}"]`)?.classList.add('active');
    }

    /**
     * Utilitários
     */
    getTrendIcon(direction) {
        const icons = {
            'up': '📈',
            'down': '📉',
            'stable': '➡️'
        };
        return icons[direction] || '📊';
    }

    /**
     * Gerar relatório
     */
    generateReport(options) {
        console.log('📊 Generating report with options:', options);
        
        // Em produção, fazer chamada para API para gerar relatório
        return {
            success: true,
            message: 'Relatório gerado com sucesso',
            downloadUrl: '/reports/frequency_report.pdf'
        };
    }

    /**
     * Exportar gráfico
     */
    exportChart(chartId) {
        console.log(`📥 Exporting chart: ${chartId}`);
        
        // Em produção, implementar exportação real do gráfico
        const canvas = document.createElement('canvas');
        const link = document.createElement('a');
        link.download = `${chartId}_chart.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    /**
     * Atualizar dados do relatório
     */
    updateReportData(newData) {
        console.log('🔄 Updating report data...');
        
        // Re-renderizar gráficos com novos dados
        document.getElementById('evolution-chart').innerHTML = this.renderEvolutionChart(newData);
        document.getElementById('distribution-chart').innerHTML = this.renderDistributionChart(newData);
        document.getElementById('hourly-patterns-chart').innerHTML = this.renderHourlyPatternsChart(newData);
        document.getElementById('devices-chart').innerHTML = this.renderDevicesChart(newData);
        
        // Atualizar insights
        document.getElementById('trend-insights').innerHTML = this.renderTrendInsights(newData);
        document.getElementById('recommendations-list').innerHTML = this.renderRecommendations(newData);
        document.getElementById('alerts-list').innerHTML = this.renderAlerts(newData);
    }
}

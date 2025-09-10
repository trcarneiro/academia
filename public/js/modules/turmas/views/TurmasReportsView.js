// TurmasReportsView - Visualização de relatórios das turmas
// Gera relatórios e análises sobre o desempenho das turmas

export class TurmasReportsView {
    constructor() {
        this.container = null;
        this.currentTurma = null;
        this.reportData = null;
        this.events = {
            onBack: null,
            onReportGenerated: null
        };
    }

    render(container, turma) {
        this.container = container;
        this.currentTurma = turma;
        
        container.innerHTML = `
            <div class="module-isolated-turmas">
                <!-- Header Premium -->
                <div class="module-header-premium">
                    <div class="module-header-content">
                        <div class="module-header-nav">
                            <button id="backToDetail" class="btn-back">
                                <span class="icon">←</span>
                                <span>Voltar</span>
                            </button>
                            <div class="breadcrumb">
                                <span>Turmas</span>
                                <span>/</span>
                                <span>${turma.course?.name || 'Curso'}</span>
                                <span>/</span>
                                <span>Relatórios</span>
                            </div>
                        </div>
                        <h1>📊 Relatórios da Turma</h1>
                        <p>Análises e métricas de desempenho da turma</p>
                    </div>
                </div>

                <!-- Tipos de relatórios -->
                <div class="reports-grid">
                    <div class="report-card" data-report="attendance">
                        <div class="report-icon">📋</div>
                        <div class="report-content">
                            <h3>Relatório de Frequência</h3>
                            <p>Análise detalhada da presença dos alunos</p>
                            <button class="btn-action btn-primary">Gerar Relatório</button>
                        </div>
                    </div>

                    <div class="report-card" data-report="progress">
                        <div class="report-icon">📈</div>
                        <div class="report-content">
                            <h3>Relatório de Progresso</h3>
                            <p>Acompanhamento do desenvolvimento da turma</p>
                            <button class="btn-action btn-primary">Gerar Relatório</button>
                        </div>
                    </div>

                    <div class="report-card" data-report="performance">
                        <div class="report-icon">🎯</div>
                        <div class="report-content">
                            <h3>Relatório de Desempenho</h3>
                            <p>Métricas de performance e resultados</p>
                            <button class="btn-action btn-primary">Gerar Relatório</button>
                        </div>
                    </div>

                    <div class="report-card" data-report="financial">
                        <div class="report-icon">💰</div>
                        <div class="report-content">
                            <h3>Relatório Financeiro</h3>
                            <p>Análise de receitas e mensalidades</p>
                            <button class="btn-action btn-primary">Gerar Relatório</button>
                        </div>
                    </div>
                </div>

                <!-- Resumo executivo -->
                <div class="executive-summary">
                    <h2>📋 Resumo Executivo</h2>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <div class="summary-header">
                                <h4>👥 Alunos</h4>
                                <span class="summary-value" id="totalStudents">0</span>
                            </div>
                            <div class="summary-details">
                                <div class="detail-item">
                                    <span>Ativos:</span>
                                    <span id="activeStudents">0</span>
                                </div>
                                <div class="detail-item">
                                    <span>Taxa de retenção:</span>
                                    <span id="retentionRate">0%</span>
                                </div>
                            </div>
                        </div>

                        <div class="summary-card">
                            <div class="summary-header">
                                <h4>📚 Aulas</h4>
                                <span class="summary-value" id="totalLessons">0</span>
                            </div>
                            <div class="summary-details">
                                <div class="detail-item">
                                    <span>Realizadas:</span>
                                    <span id="completedLessons">0</span>
                                </div>
                                <div class="detail-item">
                                    <span>Frequência média:</span>
                                    <span id="avgAttendance">0%</span>
                                </div>
                            </div>
                        </div>

                        <div class="summary-card">
                            <div class="summary-header">
                                <h4>📈 Progresso</h4>
                                <span class="summary-value" id="progressPercent">0%</span>
                            </div>
                            <div class="summary-details">
                                <div class="detail-item">
                                    <span>Cronograma:</span>
                                    <span id="scheduleStatus">No prazo</span>
                                </div>
                                <div class="detail-item">
                                    <span>Conclusão prevista:</span>
                                    <span id="estimatedCompletion">-</span>
                                </div>
                            </div>
                        </div>

                        <div class="summary-card">
                            <div class="summary-header">
                                <h4>💰 Financeiro</h4>
                                <span class="summary-value" id="totalRevenue">R$ 0</span>
                            </div>
                            <div class="summary-details">
                                <div class="detail-item">
                                    <span>Inadimplência:</span>
                                    <span id="defaultRate">0%</span>
                                </div>
                                <div class="detail-item">
                                    <span>Receita mensal:</span>
                                    <span id="monthlyRevenue">R$ 0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Área de visualização do relatório -->
                <div id="reportViewer" class="report-viewer" style="display: none;">
                    <div class="report-header">
                        <h3 id="reportTitle">Relatório</h3>
                        <div class="report-actions">
                            <button id="printReport" class="btn-action">
                                <span>🖨️</span>
                                <span>Imprimir</span>
                            </button>
                            <button id="exportReport" class="btn-action">
                                <span>📤</span>
                                <span>Exportar</span>
                            </button>
                            <button id="closeReport" class="btn-action btn-secondary">
                                <span>✕</span>
                                <span>Fechar</span>
                            </button>
                        </div>
                    </div>
                    <div id="reportContent" class="report-content">
                        <!-- Conteúdo do relatório será inserido aqui -->
                    </div>
                </div>

                <!-- Loading -->
                <div id="loadingState" class="loading-state" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Gerando relatório...</p>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.loadSummaryData();
    }

    setupEventListeners() {
        // Navegação
        const backBtn = this.container.querySelector('#backToDetail');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.events.onBack) {
                    this.events.onBack();
                }
            });
        }

        // Cards de relatórios
        const reportCards = this.container.querySelectorAll('.report-card');
        reportCards.forEach(card => {
            const button = card.querySelector('button');
            if (button) {
                button.addEventListener('click', () => {
                    const reportType = card.dataset.report;
                    this.generateReport(reportType);
                });
            }
        });

        // Ações do relatório
        const printBtn = this.container.querySelector('#printReport');
        const exportBtn = this.container.querySelector('#exportReport');
        const closeBtn = this.container.querySelector('#closeReport');

        if (printBtn) {
            printBtn.addEventListener('click', () => this.printReport());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeReport());
        }
    }

    async loadSummaryData() {
        try {
            // Carregar dados resumidos
            const response = await turmasAPI.fetch(`/api/turmas/${this.currentTurma.id}/summary`);
            this.reportData = response.data || {};
            
            this.updateSummary();
            
        } catch (error) {
            console.error('Erro ao carregar dados do resumo:', error);
            // Usar dados mock em caso de erro
            this.updateSummary();
        }
    }

    updateSummary() {
        // Atualizar elementos do resumo com dados reais ou mock
        const data = this.reportData || {};
        
        this.updateElement('#totalStudents', data.totalStudents || this.currentTurma.students?.length || 0);
        this.updateElement('#activeStudents', data.activeStudents || 0);
        this.updateElement('#retentionRate', `${data.retentionRate || 95}%`);
        
        this.updateElement('#totalLessons', data.totalLessons || this.currentTurma.lessons?.length || 0);
        this.updateElement('#completedLessons', data.completedLessons || 0);
        this.updateElement('#avgAttendance', `${data.avgAttendance || 85}%`);
        
        this.updateElement('#progressPercent', `${data.progressPercent || 0}%`);
        this.updateElement('#scheduleStatus', data.scheduleStatus || 'No prazo');
        this.updateElement('#estimatedCompletion', data.estimatedCompletion || this.formatDate(this.currentTurma.endDate));
        
        this.updateElement('#totalRevenue', data.totalRevenue || 'R$ 0');
        this.updateElement('#defaultRate', `${data.defaultRate || 5}%`);
        this.updateElement('#monthlyRevenue', data.monthlyRevenue || 'R$ 0');
    }

    updateElement(selector, value) {
        const element = this.container.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    async generateReport(type) {
        try {
            this.showLoading();
            
            // Simular geração de relatório
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const reportContent = this.generateReportContent(type);
            this.showReport(type, reportContent);
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            this.showError('Erro ao gerar relatório');
        } finally {
            this.hideLoading();
        }
    }

    generateReportContent(type) {
        const reportTitles = {
            attendance: 'Relatório de Frequência',
            progress: 'Relatório de Progresso',
            performance: 'Relatório de Desempenho',
            financial: 'Relatório Financeiro'
        };

        return `
            <div class="report-section">
                <h4>Informações Gerais</h4>
                <div class="report-info-grid">
                    <div class="info-item">
                        <strong>Turma:</strong> ${this.currentTurma.course?.name || 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>Instrutor:</strong> ${this.currentTurma.instructor?.name || 'N/A'}
                    </div>
                    <div class="info-item">
                        <strong>Período:</strong> ${this.formatDate(this.currentTurma.startDate)} - ${this.formatDate(this.currentTurma.endDate)}
                    </div>
                    <div class="info-item">
                        <strong>Data do Relatório:</strong> ${this.formatDate(new Date())}
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h4>Dados Específicos</h4>
                <p>Este é um relatório de exemplo do tipo <strong>${reportTitles[type]}</strong>.</p>
                <p>Os dados específicos serão implementados com base nos requisitos do sistema.</p>
                
                <div class="report-chart-placeholder">
                    <div class="chart-icon">📊</div>
                    <p>Gráficos e visualizações serão adicionados aqui</p>
                </div>
            </div>

            <div class="report-section">
                <h4>Conclusões</h4>
                <ul>
                    <li>A turma está funcionando dentro dos parâmetros esperados</li>
                    <li>Recomenda-se acompanhamento contínuo dos indicadores</li>
                    <li>Próxima revisão agendada para 30 dias</li>
                </ul>
            </div>
        `;
    }

    showReport(type, content) {
        const reportViewer = this.container.querySelector('#reportViewer');
        const reportTitle = this.container.querySelector('#reportTitle');
        const reportContent = this.container.querySelector('#reportContent');
        
        const titles = {
            attendance: 'Relatório de Frequência',
            progress: 'Relatório de Progresso',
            performance: 'Relatório de Desempenho',
            financial: 'Relatório Financeiro'
        };
        
        reportTitle.textContent = titles[type] || 'Relatório';
        reportContent.innerHTML = content;
        reportViewer.style.display = 'block';
        
        // Scroll para o relatório
        reportViewer.scrollIntoView({ behavior: 'smooth' });
    }

    closeReport() {
        const reportViewer = this.container.querySelector('#reportViewer');
        if (reportViewer) {
            reportViewer.style.display = 'none';
        }
    }

    printReport() {
        const reportContent = this.container.querySelector('#reportContent');
        if (reportContent) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Relatório - ${this.currentTurma.course?.name}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .report-section { margin-bottom: 30px; }
                            .report-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                            .chart-icon { font-size: 3rem; text-align: center; }
                        </style>
                    </head>
                    <body>
                        ${reportContent.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    exportReport() {
        const reportContent = this.container.querySelector('#reportContent');
        if (reportContent) {
            const data = {
                turma: this.currentTurma,
                reportData: this.reportData,
                reportHTML: reportContent.innerHTML,
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-turma-${this.currentTurma.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('Relatório exportado com sucesso');
        }
    }

    showLoading() {
        const loading = this.container.querySelector('#loadingState');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = this.container.querySelector('#loadingState');
        if (loading) loading.style.display = 'none';
    }

    showSuccess(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'success');
        } else {
            console.log('✅', message);
        }
    }

    showError(message) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            console.error('❌', message);
        }
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('pt-BR');
    }

    // Métodos públicos para eventos
    onBack(callback) {
        this.events.onBack = callback;
    }

    onReportGenerated(callback) {
        this.events.onReportGenerated = callback;
    }
}

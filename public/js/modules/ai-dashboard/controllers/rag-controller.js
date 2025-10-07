/**
 * RAG Controller - Handles business logic for RAG module
 * Manages data flow between service and view
 */

class RAGController {
    constructor(app, service, view) {
        this.app = app;
        this.service = service;
        this.view = view;
        this.currentStudentId = '1'; // Default student ID
        this.isLoading = false;
        this.currentData = null;
        
        this.init();
    }

    init() {
        console.log('RAG Controller initialized');
        
        // Load default student data
        this.loadStudentData(this.currentStudentId);
        
        // Set up periodic data refresh
        this.setupPeriodicRefresh();
        
        // Listen for app state changes
        this.listenAppStateChanges();
    }

    /**
     * Handle student ID changes
     * @param {string} studentId - New student ID
     */
    async handleStudentIdChange(studentId) {
        if (!studentId || studentId.trim() === '') {
            this.view.showError('Por favor, informe um ID de aluno válido');
            return;
        }

        this.currentStudentId = studentId.trim();
        this.view.showLoading('Carregando dados do aluno...');
        
        try {
            await this.loadStudentData(this.currentStudentId);
            this.view.showSuccess(`Dados do aluno ${this.currentStudentId} carregados com sucesso`);
        } catch (error) {
            console.error('Error loading student data:', error);
            this.view.showError(`Erro ao carregar dados do aluno: ${error.message}`);
        }
    }

    /**
     * Load student data
     * @param {string} studentId - Student ID to load
     */
    async loadStudentData(studentId) {
        try {
            this.isLoading = true;
            
            // Get student data
            const studentData = await this.service.getStudentData(studentId, {
                includeHistory: true
            });
            
            // Format student data
            const formattedStudent = this.service.formatStudentData(studentData);
            
            if (!formattedStudent) {
                throw new Error('Dados do aluno não encontrados');
            }
            
            // Get course data for student's subscriptions
            const coursePromises = formattedStudent.subscriptions.map(subscription => 
                this.service.getCourseData(subscription.plan.courseId || subscription.courseId)
            );
            
            const courseData = await Promise.all(coursePromises);
            const formattedCourses = courseData.map(course => 
                course ? this.service.formatCourseData(course) : null
            );
            
            // Get system analytics
            const analytics = await this.service.getSystemAnalytics({
                metrics: ['students', 'courses', 'attendance']
            });
            
            // Store current data
            this.currentData = {
                student: formattedStudent,
                courses: formattedCourses.filter(Boolean),
                analytics: analytics,
                rawStudentData: studentData,
                loadedAt: new Date().toISOString()
            };
            
            // Update view
            this.view.updateStudentData(this.currentData);
            this.view.updateAnalytics(this.currentData.analytics);
            
            // Generate initial RAG insights
            await this.generateRAGInsights();
            
        } catch (error) {
            console.error('Error loading student data:', error);
            throw error;
        } finally {
            this.isLoading = false;
            this.view.hideLoading();
        }
    }

    /**
     * Handle tool execution requests
     * @param {string} tool - Tool to execute
     * @param {Object} parameters - Tool parameters
     */
    async handleToolExecution(tool, parameters = {}) {
        this.view.showLoading(`Executando ${tool}...`);
        
        try {
            let result;
            
            switch (tool) {
                case 'getStudentData':
                    result = await this.service.getStudentData(parameters.studentId, parameters);
                    break;
                case 'getCourseData':
                    result = await this.service.getCourseData(parameters.courseId, parameters);
                    break;
                case 'executeQuery':
                    result = await this.service.executeQuery(parameters.query, parameters);
                    break;
                case 'getSystemAnalytics':
                    result = await this.service.getSystemAnalytics(parameters);
                    break;
                default:
                    throw new Error(`Unknown tool: ${tool}`);
            }
            
            // Process and display result
            this.view.displayToolResult(tool, result);
            
            // Generate RAG insights for the result
            await this.generateRAGInsights();
            
            return result;
            
        } catch (error) {
            console.error('Error executing tool:', error);
            this.view.showError(`Erro ao executar ${tool}: ${error.message}`);
            throw error;
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Generate RAG insights based on current data
     */
    async generateRAGInsights() {
        if (!this.currentData) {
            return;
        }
        
        try {
            // Generate prompt for student analysis
            const context = {
                student: this.currentData.student,
                subscriptions: this.currentData.student.subscriptions,
                courseProgress: this.currentData.student.courseProgress,
                attendance: this.currentData.student.recentAttendance
            };
            
            const prompt = this.service.generatePrompt('analyze_student', context);
            
            // Execute query to get insights (simulated RAG response)
            const insights = await this.executeQueryForInsights(prompt);
            
            // Process and display insights
            this.view.displayRAGInsights(insights);
            
        } catch (error) {
            console.error('Error generating RAG insights:', error);
            this.view.showError('Erro ao gerar insights: ' + error.message);
        }
    }

    /**
     * Execute query to generate insights (placeholder for actual RAG service)
     * @param {string} prompt - Prompt to execute
     * @returns {Object} Processed insights
     */
    async executeQueryForInsights(prompt) {
        // This is a placeholder - in real implementation, this would call
        // an actual RAG service like OpenAI, Anthropic, etc.
        
        const mockResponse = `
Análise do Aluno ${this.currentData.student.name}:

Insights:
- O aluno está ativo no sistema com ${this.currentData.student.subscriptionsCount} assinaturas ativas
- Progresso médio de ${this.currentData.student.averageProgress}% nos cursos
- Categoria: ${this.currentData.student.category}
- Status: ${this.currentData.student.isActive}

Recomendações:
- Manter frequência regular de aulas para manter o engajamento
- Considerar novos cursos baseados no progresso atual
- Monitorar frequência para identificar padrões de comparecimento

Tendências:
- Atividade consistente nas últimas semanas
- Boa progressão nos cursos matriculados
`;

        return this.service.processRAGResponse(mockResponse, {
            student: this.currentData.student,
            subscriptions: this.currentData.student.subscriptions,
            courseProgress: this.currentData.student.courseProgress
        });
    }

    /**
     * Test MCP server connection
     */
    async testConnection() {
        this.view.showLoading('Testando conexão com MCP server...');
        
        try {
            const isConnected = await this.service.testConnection();
            
            if (isConnected) {
                this.view.showSuccess('Conexão com MCP server estabelecida com sucesso');
                return true;
            } else {
                this.view.showError('Falha ao conectar com MCP server');
                return false;
            }
        } catch (error) {
            console.error('Connection test error:', error);
            this.view.showError('Erro ao testar conexão: ' + error.message);
            return false;
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Refresh current data
     */
    async refreshData() {
        if (this.isLoading) {
            return;
        }
        
        this.view.showLoading('Atualizando dados...');
        
        try {
            await this.loadStudentData(this.currentStudentId);
            this.view.showSuccess('Dados atualizados com sucesso');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.view.showError('Erro ao atualizar dados: ' + error.message);
        }
    }

    /**
     * Set up periodic data refresh
     */
    setupPeriodicRefresh() {
        // Refresh data every 5 minutes
        setInterval(() => {
            if (this.currentData) {
                this.refreshData();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Listen for app state changes
     */
    listenAppStateChanges() {
        // Listen for authentication changes
        document.addEventListener('auth-changed', (event) => {
            if (event.detail.isAuthenticated) {
                // User logged in, refresh data
                this.refreshData();
            } else {
                // User logged out, clear data
                this.currentData = null;
                this.view.clearData();
            }
        });

        // Listen for theme changes
        document.addEventListener('theme-changed', (event) => {
            this.view.applyTheme(event.detail.theme);
        });
    }

    /**
     * Export current data
     * @param {string} format - Export format (json, csv, pdf)
     */
    exportData(format = 'json') {
        if (!this.currentData) {
            this.view.showError('Nenhum dado disponível para exportar');
            return;
        }

        try {
            let content;
            let filename;
            let mimeType;

            switch (format) {
                case 'json':
                    content = JSON.stringify(this.currentData, null, 2);
                    filename = `aluno_${this.currentStudentId}_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                case 'csv':
                    content = this.generateCSVExport();
                    filename = `aluno_${this.currentStudentId}_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                default:
                    throw new Error('Formato não suportado');
            }

            // Create download link
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.view.showSuccess(`Dados exportados como ${filename}`);

        } catch (error) {
            console.error('Export error:', error);
            this.view.showError('Erro ao exportar dados: ' + error.message);
        }
    }

    /**
     * Generate CSV export content
     * @returns {string} CSV content
     */
    generateCSVExport() {
        const student = this.currentData.student;
        const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Categoria', 'Status', 'Data Nascimento'];
        const values = [
            student.id,
            student.name,
            student.email,
            student.phone,
            student.category,
            student.isActive,
            student.formattedBirthDate
        ];

        let csv = headers.join(',') + '\n';
        csv += values.map(v => `"${v}"`).join(',') + '\n\n';

        // Add subscriptions
        csv += 'Assinaturas\n';
        csv += 'ID,Plano,Preço,Status,Data Início\n';
        student.subscriptions.forEach(sub => {
            csv += `${sub.id},"${sub.plan.name}","${sub.formattedPrice}",${sub.status},"${sub.formattedStartDate}"\n`;
        });

        // Add course progress
        csv += '\nProgresso dos Cursos\n';
        csv += 'ID do Curso,Nome do Curso,Progresso,Aulas Assistidas/Total\n';
        student.courseProgress.forEach(course => {
            csv += `"${course.courseId}","${course.courseName}",${course.progressPercentage},"${course.totalClasses}"\n`;
        });

        return csv;
    }

    /**
     * Get current student ID
     * @returns {string} Current student ID
     */
    getCurrentStudentId() {
        return this.currentStudentId;
    }

    /**
     * Get current data
     * @returns {Object} Current data
     */
    getCurrentData() {
        return this.currentData;
    }
}

export { RAGController };
export default RAGController;

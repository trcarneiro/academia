/**
 * AI Service - Handles API communication and data processing for AI Dashboard
 * Manages MCP server interactions and data formatting
 */

class AIService {
    constructor(app) {
        this.app = app;
        this.baseUrl = '/api/mcp';
        this.defaultOptions = {
            includeHistory: true,
            formatOutput: true,
            permissions: ['STUDENT_VIEW']
        };
    }

    /**
     * Get student data from MCP server
     * @param {string} studentId - Student ID to retrieve
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Formatted student data
     */
    async getStudentData(studentId, options = {}) {
        try {
            const config = { ...this.defaultOptions, ...options };
            
            // Validate input
            if (!studentId || studentId.trim() === '') {
                throw new Error('Student ID is required');
            }

            // Call MCP server
            const response = await this.fetchFromMCP('getStudentData', {
                studentId: studentId.trim(),
                includeHistory: config.includeHistory
            });

            // Format and return data
            return this.formatStudentData(response.data);
        } catch (error) {
            console.error('Error getting student data:', error);
            throw new Error(`Failed to retrieve student data: ${error.message}`);
        }
    }

    /**
     * Get course data from MCP server
     * @param {string} courseId - Course ID to retrieve
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Formatted course data
     */
    async getCourseData(courseId, options = {}) {
        try {
            const config = { ...this.defaultOptions, ...options };
            
            // Validate input
            if (!courseId || courseId.trim() === '') {
                throw new Error('Course ID is required');
            }

            // Call MCP server
            const response = await this.fetchFromMCP('getCourseData', {
                courseId: courseId.trim(),
                includeStudents: config.includeStudents || false
            });

            // Format and return data
            return this.formatCourseData(response.data);
        } catch (error) {
            console.error('Error getting course data:', error);
            throw new Error(`Failed to retrieve course data: ${error.message}`);
        }
    }

    /**
     * Execute custom query via MCP server
     * @param {string} query - SQL query to execute
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Query results
     */
    async executeQuery(query, options = {}) {
        try {
            const config = { ...this.defaultOptions, ...options };
            
            // Validate input
            if (!query || query.trim() === '') {
                throw new Error('Query is required');
            }

            // Call MCP server
            const response = await this.fetchFromMCP('executeQuery', {
                query: query.trim(),
                parameters: config.parameters || {},
                limit: config.limit || 100
            });

            // Format and return data
            return this.formatQueryResults(response.data);
        } catch (error) {
            console.error('Error executing query:', error);
            throw new Error(`Failed to execute query: ${error.message}`);
        }
    }

    /**
     * Get system analytics from MCP server
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Analytics data
     */
    async getSystemAnalytics(options = {}) {
        try {
            const config = { ...this.defaultOptions, ...options };
            
            // Call MCP server
            const response = await this.fetchFromMCP('getSystemAnalytics', {
                metrics: config.metrics || ['students', 'courses', 'attendance'],
                timeRange: config.timeRange || '30d'
            });

            // Format and return data
            return this.formatAnalytics(response.data);
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw new Error(`Failed to retrieve analytics: ${error.message}`);
        }
    }

    /**
     * Fetch data from MCP server
     * @param {string} tool - MCP tool to call
     * @param {Object} parameters - Tool parameters
     * @returns {Promise<Object>} API response
     */
    async fetchFromMCP(tool, parameters = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/${tool}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                },
                body: JSON.stringify({
                    tool: tool,
                    parameters: parameters,
                    timestamp: new Date().toISOString(),
                    requestId: this.generateRequestId()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'MCP server error');
            }

            return data;
        } catch (error) {
            console.error('MCP server request failed:', error);
            throw error;
        }
    }

    /**
     * Format student data for display
     * @param {Object} data - Raw student data from MCP
     * @returns {Object} Formatted student data
     */
    formatStudentData(data) {
        if (!data || !data.student) {
            return null;
        }

        const student = data.student;
        const subscriptions = data.subscriptions || [];
        const attendance = data.attendance || [];

        return {
            id: student.id,
            fullName: `${student.firstName} ${student.lastName}`.trim(),
            email: student.email || '',
            phone: student.phone || '',
            birthDate: student.birthDate,
            formattedBirthDate: this.formatDate(student.birthDate),
            category: student.category || 'STANDARD',
            isActive: student.isActive || false,
            emergencyContact: student.emergencyContact || '',
            emergencyPhone: student.emergencyPhone || '',
            medicalConditions: student.medicalConditions || [],
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,

            // Subscription data
            subscriptions: subscriptions.map(sub => ({
                id: sub.id,
                planId: sub.planId,
                courseId: sub.courseId,
                plan: sub.plan,
                status: sub.status,
                startDate: sub.startDate,
                endDate: sub.endDate,
                isCurrent: this.isCurrentSubscription(sub),
                formattedStartDate: this.formatDate(sub.startDate),
                formattedEndDate: this.formatDate(sub.endDate)
            })),

            // Attendance data
            recentAttendance: attendance.slice(0, 20).map(record => ({
                id: record.id,
                classId: record.classId,
                class: record.class,
                status: record.status,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                notes: record.notes,
                createdAt: record.createdAt,
                formattedDate: this.formatDate(record.createdAt),
                formattedCheckIn: this.formatDateTime(record.checkInTime)
            })),

            // Calculated metrics
            subscriptionsCount: subscriptions.filter(sub => this.isCurrentSubscription(sub)).length,
            totalCourses: new Set(subscriptions.map(s => s.courseId)).size,
            averageProgress: this.calculateAverageProgress(subscriptions),
            attendanceRate: this.calculateAttendanceRate(attendance)
        };
    }

    /**
     * Format course data for display
     * @param {Object} data - Raw course data from MCP
     * @returns {Object} Formatted course data
     */
    formatCourseData(data) {
        if (!data || !data.course) {
            return null;
        }

        const course = data.course;
        const students = data.students || [];

        return {
            id: course.id,
            name: course.name,
            description: course.description || '',
            level: course.level || 'BEGINNER',
            category: course.category || 'GENERAL',
            duration: course.duration,
            formattedDuration: this.formatDuration(course.duration),
            price: course.price,
            formattedPrice: this.formatCurrency(course.price),
            maxStudents: course.maxStudents || 20,
            enrolledStudentsCount: students.length,
            upcomingClassesCount: students.length * 4, // Estimate
            isActive: course.isActive || false,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,

            // Student list
            enrolledStudents: students.map(student => ({
                id: student.id,
                fullName: `${student.firstName} ${student.lastName}`.trim(),
                email: student.email,
                progress: student.progress || 0,
                joinDate: student.joinDate
            })),

            // Course image
            imageUrl: course.imageUrl || '/images/default-course.jpg'
        };
    }

    /**
     * Format query results for display
     * @param {Object} data - Raw query results from MCP
     * @returns {Object} Formatted query results
     */
    formatQueryResults(data) {
        if (!data) {
            return { rows: [], columns: [] };
        }

        return {
            rows: data.rows || [],
            columns: data.columns || [],
            rowCount: data.rowCount || 0,
            query: data.query,
            executionTime: data.executionTime || 0
        };
    }

    /**
     * Format analytics data for display
     * @param {Object} data - Raw analytics data from MCP
     * @returns {Object} Formatted analytics data
     */
    formatAnalytics(data) {
        if (!data) {
            return {
                students: { total: 0, active: 0 },
                courses: { total: 0, active: 0 },
                attendance: { total: 0, last30Days: 0 }
            };
        }

        return {
            students: {
                total: data.studentsTotal || 0,
                active: data.studentsActive || 0,
                growth: data.studentsGrowth || 0
            },
            courses: {
                total: data.coursesTotal || 0,
                active: data.coursesActive || 0,
                popular: data.coursesPopular || []
            },
            attendance: {
                total: data.attendanceTotal || 0,
                last30Days: data.attendanceLast30Days || 0,
                rate: data.attendanceRate || 0
            },
            revenue: {
                total: data.revenueTotal || 0,
                monthly: data.revenueMonthly || 0,
                growth: data.revenueGrowth || 0
            }
        };
    }

    /**
     * Generate prompt for RAG operations
     * @param {string} action - Action type (analyze_student, recommend_courses, etc.)
     * @param {Object} context - Context data for the prompt
     * @returns {string} Generated prompt
     */
    generatePrompt(action, context) {
        const prompts = {
            analyze_student: `
Analisar o aluno ${context.student.fullName} com base nas seguintes informações:
- Categoria: ${context.student.category}
- Status: ${context.student.isActive ? 'Ativo' : 'Inativo'}
- Assinaturas ativas: ${context.subscriptions.filter(s => this.isCurrentSubscription(s)).length}
- Progresso médio: ${this.calculateAverageProgress(context.subscriptions).toFixed(1)}%

Dados de frequência recente:
${context.attendance.slice(0, 5).map(a => 
    `- ${a.formattedDate}: ${a.status}` 
).join('\n')}

Forneça insights sobre o engajamento do aluno, tendências e recomendações personalizadas.
`,

            recommend_courses: `
Baseado no perfil do aluno ${context.student.fullName}:
- Categoria: ${context.student.category}
- Cursos atualmente inscritos: ${context.subscriptions.map(s => s.plan?.name).join(', ') || 'Nenhum'}
- Nível de experiência estimado: ${this.estimateExperienceLevel(context.student)}

Sugira cursos complementares que ajudariam no desenvolvimento do aluno, considerando:
1. Pré-requisitos
2. Disponibilidade
3. Interesses baseados no histórico
4. Objetivos de progressão
`,

            analyze_attendance: `
Analisar padrões de frequência do aluno ${context.student.fullName}:
- Total de registros: ${context.attendance.length}
- Frequência nos últimos 30 dias: ${this.calculateAttendanceRate(context.attendance).toFixed(1)}%
- Status mais comum: ${this.getMostCommonStatus(context.attendance)}

Identifique tendências, ausências recorrentes e oportunidades de melhora no engajamento.
`,

            general_insights: `
Com base em todos os dados disponíveis do aluno ${context.student.fullName},
forneça insights abrangentes sobre:
1. Desempenho geral
2. Engajamento com a academia
3. Potenciais riscos de abandono
4. Oportunidades de crescimento
5. Recomendações para instrutores
`,

            compare_students: `
Comparar o desempenho do aluno ${context.student.fullName} com da turma:
- Média da turma: {class_metrics}
- Posição do aluno: {student_position}
- Pontos fortes: {strengths}
- Áreas de melhoria: {improvement_areas}

Forneça uma análise comparativa construtiva e acionável.
`,

            predict_retention: `
Prever probabilidade de retenção do aluno ${context.student.fullName} com base em:
- Histórico de frequência: ${context.attendance.length} registros
- Consistência: {consistency_score}%
- Engajamento: {engagement_score}%
- Progresso em cursos: {progress_score}%

Forneça uma avaliação de risco e estratégias para melhorar retenção.
`,

            suggest_schedule: `
Sugira um otimizado cronograma de aulas para o aluno ${context.student.fullName}:
- Horários disponíveis: {available_times}
- Preferências declaradas: {preferences}
- Cursos atuais: {current_courses}
- Meta de progresso: {progress_goal}

Recomende dias e horários ótimos considerando:
1. Disponibilidade
2. Mix de tipos de aula
3. Frequência ideal
4. Recuperação de conteúdo
`,

            analyze_progress: `
Analisar progresso do aluno ${context.student.fullName} em seus cursos atuais:
- Cursos: ${context.subscriptions.map(s => s.plan?.name).join(', ')}
- Progresso médio: ${this.calculateAverageProgress(context.subscriptions).toFixed(1)}%
- Metas atingidas: {achieved_goals}

Identifique:
1. Habilidades dominadas
2. Habilidades que precisam de atenção
3. Próximos marcos
4. Estratégias aceleradas de aprendizado
`,

            generate_report: `
Gerar relatório completo do aluno ${context.student.fullName} para período {period}:
- Desempenho geral: {overall_performance}
- Frequência: {attendance_stats}
- Progresso acadêmico: {academic_progress}
- Feedback instrutores: {instructor_feedback}

Organize como:
1. Resumo executivo
2. Métricas-chave
3. Análise de tendências
4. Próximos passos recomendados
`
        };

        return prompts[action] || prompts.general_insights;
    }

    /**
     * Process RAG response and extract insights
     * @param {string} response - Raw RAG response
     * @param {Object} context - Context data
     * @returns {Object} Processed insights
     */
    processRAGResponse(response, context) {
        // This is a placeholder implementation
        // In a real implementation, this would parse structured responses from LLM
        
        return {
            rawResponse: response,
            processedAt: new Date().toISOString(),
            summary: this.extractSummary(response),
            insights: this.extractInsights(response),
            recommendations: this.extractRecommendations(response),
            sentiment: this.analyzeSentiment(response),
            confidence: this.assessConfidence(response, context),
            actionableItems: this.extractActionableItems(response)
        };
    }

    // Helper methods for data formatting
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    formatCurrency(amount) {
        if (!amount) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }

    formatDuration(minutes) {
        if (!minutes) return '0 min';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}min`;
        }
        return `${mins}min`;
    }

    isCurrentSubscription(subscription) {
        if (!subscription) return false;
        const now = new Date();
        const startDate = new Date(subscription.startDate);
        const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
        
        return startDate <= now && (!endDate || endDate >= now);
    }

    calculateAverageProgress(subscriptions) {
        if (!subscriptions || subscriptions.length === 0) return 0;
        
        const progress = subscriptions
            .filter(sub => sub.progress !== undefined)
            .reduce((sum, sub) => sum + (sub.progress || 0), 0);
        
        return progress / subscriptions.length;
    }

    calculateAttendanceRate(attendance) {
        if (!attendance || attendance.length === 0) return 0;
        
        const presentCount = attendance.filter(record => 
            ['PRESENT', 'LATE'].includes(record.status)
        ).length;
        
        return (presentCount / attendance.length) * 100;
    }

    getMostCommonStatus(attendance) {
        if (!attendance || attendance.length === 0) return 'N/A';
        
        const statusCounts = attendance.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    estimateExperienceLevel(student) {
        // Simple logic to estimate experience based on student data
        if (!student) return 'Iniciante';
        
        const age = this.calculateAge(student.birthDate);
        const isAdult = age >= 18;
        const category = student.category;
        
        if (category === 'CHILD') return 'Iniciante';
        if (category === 'TEENAGER') return isAdult ? 'Intermediário' : 'Iniciante a Intermediário';
        if (category === 'ADULT') return isAdult ? 'Intermediário' : 'Iniciante';
        
        return 'Iniciante';
    }

    calculateAge(birthDate) {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    extractSummary(response) {
        // Extract summary from RAG response
        const summaryMatch = response.match(/Resumo:?\s*([\s\S]*?)(?=\n\n|$)/i);
        return summaryMatch ? summaryMatch[1].trim() : response.split('\n')[0] || response;
    }

    extractInsights(response) {
        // Extract insights from RAG response
        const insights = [];
        const lines = response.split('\n');
        
        lines.forEach(line => {
            if (line.includes('insight') || line.includes('trend') || line.includes('observação')) {
                insights.push(line.replace(/[-*]\s*/, '').trim());
            }
        });
        
        return insights.length > 0 ? insights : [response];
    }

    extractRecommendations(response) {
        // Extract recommendations from RAG response
        const recommendations = [];
        const lines = response.split('\n');
        
        lines.forEach(line => {
            if (line.includes('recomendação') || line.includes('sugestão') || line.includes('recomendo')) {
                recommendations.push(line.replace(/[-*]\s*/, '').trim());
            }
        });
        
        return recommendations.length > 0 ? recommendations : ['Continue com o plano atual e avaliar periodicamente.'];
    }

    analyzeSentiment(response) {
        // Simple sentiment analysis
        const positiveWords = ['excelente', 'bom', 'ótimo', 'positivo', 'grande', 'bom', 'maravilhoso'];
        const negativeWords = ['pobre', 'ruim', 'fracas', 'preocupante', 'baixo', 'difícil'];
        
        const lowerResponse = response.toLowerCase();
        let score = 0;
        
        positiveWords.forEach(word => {
            if (lowerResponse.includes(word)) score += 1;
        });
        
        negativeWords.forEach(word => {
            if (lowerResponse.includes(word)) score -= 1;
        });
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    assessConfidence(response, context) {
        // Simple confidence assessment based on data completeness
        if (!context || !context.student) return 0.3;
        
        let confidence = 0.5; // Base confidence
        
        if (context.student.fullName) confidence += 0.1;
        if (context.subscriptions && context.subscriptions.length > 0) confidence += 0.2;
        if (context.attendance && context.attendance.length > 0) confidence += 0.2;
        
        return Math.min(confidence, 1.0);
    }

    extractActionableItems(response) {
        // Extract actionable items from RAG response
        const items = [];
        const lines = response.split('\n');
        
        lines.forEach(line => {
            if (line.includes('-') || line.includes('*') || line.includes('•')) {
                const item = line.replace(/^[-*•]\s*/, '').trim();
                if (item && item.length > 10) {
                    items.push(item);
                }
            }
        });
        
        return items.slice(0, 5); // Return top 5 actionable items
    }

    getAuthToken() {
        // Get authentication token from app or localStorage
        return this.app?.auth?.getToken?.() || localStorage.getItem('authToken') || '';
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export { AIService };
export default AIService;

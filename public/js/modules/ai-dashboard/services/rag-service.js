/**
 * RAG Service - Handles MCP server communication
 * Provides API methods for RAG module data access
 */

class RAGService {
    constructor(app) {
        this.app = app;
        this.baseApi = '/api/rag';
        this.tools = ['getStudentData', 'getCourseData', 'executeQuery', 'getSystemAnalytics'];
    }

    /**
     * Get student data from MCP server
     * @param {string} studentId - Student ID to retrieve
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Student data
     */
    async getStudentData(studentId, options = {}) {
        const { includeHistory = false, organizationId } = options;
        
        try {
            const response = await fetch(`${this.baseApi}/student/${studentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({
                    includeHistory,
                    organizationId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error fetching student data:', error);
            throw error;
        }
    }

    /**
     * Get course data from MCP server
     * @param {string} courseId - Course ID to retrieve
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Course data
     */
    async getCourseData(courseId, options = {}) {
        const { includeStudents = false, organizationId } = options;
        
        try {
            const response = await fetch(`${this.baseApi}/course/${courseId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({
                    includeStudents,
                    organizationId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error fetching course data:', error);
            throw error;
        }
    }

    /**
     * Execute custom query via MCP server
     * @param {string} query - Query to execute
     * @param {Object} options - Additional options
     * @returns {Promise<Array>} Query results
     */
    async executeQuery(query, options = {}) {
        const { organizationId, limit = 100 } = options;
        
        try {
            const response = await fetch(`${this.baseApi}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({
                    query,
                    organizationId,
                    limit
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }

    /**
     * Get system analytics from MCP server
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Analytics data
     */
    async getSystemAnalytics(options = {}) {
        const { organizationId, timeRange = '30_days', metrics } = options;
        
        try {
            const response = await fetch(`${this.baseApi}/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                },
                body: JSON.stringify({
                    organizationId,
                    timeRange,
                    metrics
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    }

    /**
     * Get available tools from MCP server
     * @returns {Promise<Array>} Available tools
     */
    async getAvailableTools() {
        try {
            const response = await fetch(`${this.baseApi}/tools`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error fetching available tools:', error);
            throw error;
        }
    }

    /**
     * Test MCP server connection
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseApi}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.app.getToken()}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Format student data for display
     * @param {Object} studentData - Raw student data
     * @returns {Object} Formatted student data
     */
    formatStudentData(studentData) {
        if (!studentData || !studentData.success) {
            return null;
        }

        const { data } = studentData;
        const student = data.student;
        const subscriptions = data.subscriptions || [];
        const courseProgress = data.courseProgress || [];

        return {
            ...student,
            fullName: `${student.name}`,
            formattedBirthDate: student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '',
            subscriptionsCount: subscriptions.length,
            totalCourses: courseProgress.length,
            averageProgress: courseProgress.length > 0 
                ? Math.round(courseProgress.reduce((sum, course) => sum + course.progressPercentage, 0) / courseProgress.length)
                : 0,
            isActive: student.isActive ? 'Ativo' : 'Inativo',
            category: this.formatCategory(student.category),
            subscriptions: subscriptions.map(sub => ({
                ...sub,
                formattedPrice: `R$ ${sub.plan.price?.toFixed(2) || '0,00'}`,
                formattedStartDate: new Date(sub.startDate).toLocaleDateString('pt-BR')
            })),
            courseProgress: courseProgress.map(course => ({
                ...course,
                progressPercentage: `${course.progressPercentage}%`,
                totalClasses: `${course.attendedClasses}/${course.totalClasses}`
            }))
        };
    }

    /**
     * Format course data for display
     * @param {Object} courseData - Raw course data
     * @returns {Object} Formatted course data
     */
    formatCourseData(courseData) {
        if (!courseData || !courseData.success) {
            return null;
        }

        const { data } = courseData;
        const course = data.course;
        const upcomingClasses = data.upcomingClasses || [];
        const enrolledStudents = data.enrolledStudents || [];

        return {
            ...course,
            formattedDuration: `${course.duration} aulas`,
            level: this.formatLevel(course.level),
            category: this.formatCategory(course.category),
            upcomingClassesCount: upcomingClasses.length,
            enrolledStudentsCount: enrolledStudents.length,
            upcomingClasses: upcomingClasses.map(cls => ({
                ...cls,
                formattedDate: new Date(cls.date).toLocaleDateString('pt-BR'),
                formattedTime: `${cls.startTime} - ${cls.endTime}`
            })),
            enrolledStudents: enrolledStudents.map(student => ({
                ...student,
                formattedStartDate: new Date(student.startDate).toLocaleDateString('pt-BR')
            }))
        };
    }

    /**
     * Format category for display
     * @param {string} category - Raw category
     * @returns {string} Formatted category
     */
    formatCategory(category) {
        const categoryMap = {
            'ADULT': 'Adulto',
            'FEMALE': 'Feminino',
            'SENIOR': 'Sênior',
            'CHILD': 'Criança',
            'INICIANTE1': 'Iniciante 1',
            'INICIANTE2': 'Iniciante 2',
            'INICIANTE3': 'Iniciante 3',
            'HEROI1': 'Herói 1',
            'HEROI2': 'Herói 2',
            'HEROI3': 'Herói 3',
            'MASTER_1': 'Mestre 1',
            'MASTER_2': 'Mestre 2',
            'MASTER_3': 'Mestre 3'
        };

        return categoryMap[category] || category;
    }

    /**
     * Format level for display
     * @param {string} level - Raw level
     * @returns {string} Formatted level
     */
    formatLevel(level) {
        const levelMap = {
            'BEGINNER': 'Iniciante',
            'INTERMEDIATE': 'Intermediário',
            'ADVANCED': 'Avançado',
            'EXPERT': 'Especialista',
            'MASTER': 'Mestre'
        };

        return levelMap[level] || level;
    }

    /**
     * Generate RAG prompt for agent actions
     * @param {string} action - Action to perform
     * @param {Object} context - Context data
     * @returns {string} Generated prompt
     */
    generatePrompt(action, context) {
        const prompts = {
            'analyze_student': `
Analyze the following student data and provide insights:
- Student: ${context.student?.name || 'Unknown'}
- Category: ${context.student?.category || 'Unknown'}
- Active subscriptions: ${context.subscriptions?.length || 0}
- Course progress: ${context.courseProgress?.length || 0} courses
- Attendance history: ${context.attendance?.length || 0} records

Provide actionable insights and recommendations based on this data.
`,
            'recommend_courses': `
Based on the following student profile, recommend appropriate courses:
- Student: ${context.student?.name || 'Unknown'}
- Current level: ${context.student?.globalLevel || 1}
- Category: ${context.student?.category || 'Unknown'}
- Progress: ${context.courseProgress?.map(cp => cp.courseName).join(', ') || 'None'}

Suggest courses that would be appropriate for this student's current level and interests.
`,
            'analyze_attendance': `
Analyze attendance patterns for this student:
- Student: ${context.student?.name || 'Unknown'}
- Total attendances: ${context.attendance?.length || 0}
- Recent activity: ${context.attendance?.slice(0, 5).map(a => a.class?.title).join(', ') || 'None'}

Identify patterns, trends, and provide recommendations for improvement.
`
        };

        return prompts[action] || `Analyze the following data: ${JSON.stringify(context, null, 2)}`;
    }

    /**
     * Process RAG response
     * @param {string} response - Raw RAG response
     * @param {Object} context - Context data
     * @returns {Object} Processed response
     */
    processRAGResponse(response, context) {
        try {
            // Basic response processing
            const processed = {
                rawResponse: response,
                processedAt: new Date().toISOString(),
                context: context,
                insights: [],
                recommendations: [],
                summary: ''
            };

            // Extract insights and recommendations (simplified)
            if (response.includes('recomendação') || response.includes('recomendações')) {
                processed.recommendations = this.extractRecommendations(response);
            }

            if (response.includes('insight') || response.includes('análise')) {
                processed.insights = this.extractInsights(response);
            }

            processed.summary = this.generateSummary(response);

            return processed;
        } catch (error) {
            console.error('Error processing RAG response:', error);
            return {
                rawResponse: response,
                processedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Extract recommendations from RAG response
     * @param {string} response - RAG response
     * @returns {Array} Recommendations
     */
    extractRecommendations(response) {
        const recommendations = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            if (line.includes('-') || line.includes('•') || line.includes('*')) {
                const recommendation = line.replace(/[-•*]\s*/, '').trim();
                if (recommendation.length > 10) {
                    recommendations.push(recommendation);
                }
            }
        }

        return recommendations;
    }

    /**
     * Extract insights from RAG response
     * @param {string} response - RAG response
     * @returns {Array} Insights
     */
    extractInsights(response) {
        const insights = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            if (line.toLowerCase().includes('insight') || 
                line.toLowerCase().includes('padrão') || 
                line.toLowerCase().includes('tendência')) {
                const insight = line.replace(/(insight|padrão|tendência):\s*/i, '').trim();
                if (insight.length > 10) {
                    insights.push(insight);
                }
            }
        }

        return insights;
    }

    /**
     * Generate summary from RAG response
     * @param {string} response - RAG response
     * @returns {string} Summary
     */
    generateSummary(response) {
        const sentences = response.split(/[.!?]+/);
        const validSentences = sentences.filter(s => s.trim().length > 20);
        
        if (validSentences.length > 0) {
            return validSentences[0].trim() + '.';
        }
        
        return response.substring(0, 100) + '...';
    }
}

export { RAGService };
export default RAGService;

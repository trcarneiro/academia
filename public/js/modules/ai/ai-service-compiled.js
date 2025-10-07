/**
 * AI Service - Handles API communication and data processing for AI Dashboard
 * Compiled version for compatibility
 */

/**
 * Constructor function for AIService
 */
function AIService() {
    this.app = arguments[0] || {};
    this.baseUrl = '/api/mcp';
    this.defaultOptions = {
        includeHistory: true,
        formatOutput: true,
        permissions: ['STUDENT_VIEW']
    };
    
    // Bind methods
    this.getStudentData = this._getStudentData.bind(this);
    this.getCourseData = this._getCourseData.bind(this);
    this.executeQuery = this._executeQuery.bind(this);
    this.getSystemAnalytics = this._getSystemAnalytics.bind(this);
    this.testConnection = this._testConnection.bind(this);
    this.formatStudentData = this._formatStudentData.bind(this);
    this.formatCourseData = this._formatCourseData.bind(this);
    this.formatQueryResults = this._formatQueryResults.bind(this);
    this.formatAnalytics = this._formatAnalytics.bind(this);
    this.generatePrompt = this._generatePrompt.bind(this);
    this.processRAGResponse = this._processRAGResponse.bind(this);
}

/**
 * Get student data from MCP server
 * @param {string} studentId - Student ID to retrieve
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Formatted student data
 */
AIService.prototype._getStudentData = async function(studentId, options) {
    try {
        const config = { ...this.defaultOptions, ...options };
        
        if (!studentId || studentId.trim() === '') {
            throw new Error('Student ID is required');
        }

        const response = await this._fetchFromMCP('getStudentData', {
            studentId: studentId.trim(),
            includeHistory: config.includeHistory
        });

        return this._formatStudentData(response.data);
    } catch (error) {
        console.error('Error getting student data:', error);
        throw new Error(`Failed to retrieve student data: ${error.message}`);
    }
};

/**
 * Get course data from MCP server
 * @param {string} courseId - Course ID to retrieve
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Formatted course data
 */
AIService.prototype._getCourseData = async function(courseId, options) {
    try {
        const config = { ...this.defaultOptions, ...options };
        
        if (!courseId || courseId.trim() === '') {
            throw new Error('Course ID is required');
        }

        const response = await this._fetchFromMCP('getCourseData', {
            courseId: courseId.trim(),
            includeStudents: config.includeStudents || false
        });

        return this._formatCourseData(response.data);
    } catch (error) {
        console.error('Error getting course data:', error);
        throw new Error(`Failed to retrieve course data: ${error.message}`);
    }
};

/**
 * Execute custom query via MCP server
 * @param {string} query - SQL query to execute
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Query results
 */
AIService.prototype._executeQuery = async function(query, options) {
    try {
        const config = { ...this.defaultOptions, ...options };
        
        if (!query || query.trim() === '') {
            throw new Error('Query is required');
        }

        const response = await this._fetchFromMCP('executeQuery', {
            query: query.trim(),
            parameters: config.parameters || {},
            limit: config.limit || 100
        });

        return this._formatQueryResults(response.data);
    } catch (error) {
        console.error('Error executing query:', error);
        throw new Error(`Failed to execute query: ${error.message}`);
    }
};

/**
 * Get system analytics from MCP server
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Analytics data
 */
AIService.prototype._getSystemAnalytics = async function(options) {
    try {
        const config = { ...this.defaultOptions, ...options };
        
        const response = await this._fetchFromMCP('getSystemAnalytics', {
            metrics: config.metrics || ['students', 'courses', 'attendance'],
            timeRange: config.timeRange || '30d'
        });

        return this._formatAnalytics(response.data);
    } catch (error) {
        console.error('Error getting analytics:', error);
        throw new Error(`Failed to retrieve analytics: ${error.message}`);
    }
};

/**
 * Test MCP server connection
 * @returns {Promise<boolean>} Connection status
 */
AIService.prototype._testConnection = async function() {
    try {
        await this._fetchFromMCP('testConnection', {});
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Fetch data from MCP server
 * @param {string} tool - MCP tool to call
 * @param {Object} parameters - Tool parameters
 * @returns {Promise<Object>} API response
 */
AIService.prototype._fetchFromMCP = async function(tool, parameters = {}) {
    try {
        const response = await fetch(`${this.baseUrl}/${tool}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this._getAuthToken()}`,
            },
            body: JSON.stringify({
                tool: tool,
                parameters: parameters,
                timestamp: new Date().toISOString(),
                requestId: this._generateRequestId()
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
};

/**
 * Format student data for display
 * @param {Object} data - Raw student data from MCP
 * @returns {Object} Formatted student data
 */
AIService.prototype._formatStudentData = function(data) {
    if (!data || !data.student) {
        return null;
    }

    const student = data.student;
    const subscriptions = data.subscriptions || [];
    const attendance = data.attendance || [];

    return {
        id: student.id,
        fullName: (student.firstName || '') + ' ' + (student.lastName || '')).trim() || 'Sem nome',
        email: student.email || '',
        phone: student.phone || '',
        birthDate: student.birthDate,
        formattedBirthDate: this._formatDate(student.birthDate),
        category: student.category || 'STANDARD',
        isActive: student.isActive || false,
        emergencyContact: student.emergencyContact || '',
        emergencyPhone: student.emergencyPhone || '',
        medicalConditions: student.medicalConditions || [],
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,

        subscriptions: subscriptions.map(sub => ({
            id: sub.id,
            planId: sub.planId,
            courseId: sub.courseId,
            plan: sub.plan,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            isCurrent: this._isCurrentSubscription(sub),
            formattedStartDate: this._formatDate(sub.startDate),
            formattedEndDate: this._formatDate(sub.endDate)
        })),

        recentAttendance: attendance.slice(0, 20).map(record => ({
            id: record.id,
            classId: record.classId,
            class: record.class,
            status: record.status,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            notes: record.notes,
            createdAt: record.createdAt,
            formattedDate: this._formatDate(record.createdAt),
            formattedCheckIn: this._formatDateTime(record.checkInTime)
        })),

        subscriptionsCount: subscriptions.filter(sub => this._isCurrentSubscription(sub)).length,
        totalCourses: new Set(subscriptions.map(s => s.courseId)).size,
        averageProgress: this._calculateAverageProgress(subscriptions),
        attendanceRate: this._calculateAttendanceRate(attendance)
    };
};

/**
 * Format course data for display
 * @param {Object} data - Raw course data from MCP
 * @returns {Object} Formatted course data
 */
AIService.prototype._formatCourseData = function(data) {
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

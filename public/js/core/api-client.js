/**
 * API Client Module
 * Centralized API communication with error handling and standardization
 */

// Constants for API configuration
const API_CONFIG = {
    BASE_URL: '',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json'
    }
};

const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    SERVER: 'SERVER',
    VALIDATION: 'VALIDATION'
};

const EVENT_TYPES = {
    API_REQUEST: 'API_REQUEST',
    API_RESPONSE: 'API_RESPONSE',
    API_ERROR: 'API_ERROR'
};

// Simple timing utils
const TimingUtils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = API_CONFIG.RETRY_DELAY;
        this.defaultHeaders = { ...API_CONFIG.DEFAULT_HEADERS };
        };
    }

    /**
     * Generic API request method
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ API Response: ${url}`, data);
            return data;
        } catch (error) {
            console.error(`❌ API Error: ${url}`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ====== STUDENTS API ======
    async getStudents() {
        return this.get('/students');
    }

    async getStudent(id) {
        return this.get(`/students/${id}`);
    }

    async createStudent(studentData) {
        return this.post('/students', studentData);
    }

    async updateStudent(id, studentData) {
        return this.put(`/students/${id}`, studentData);
    }

    async deleteStudent(id) {
        return this.delete(`/students/${id}`);
    }

    // ====== CLASSES API ======
    async getClasses() {
        return this.get('/classes');
    }

    async getClass(id) {
        return this.get(`/classes/${id}`);
    }

    async createClass(classData) {
        return this.post('/classes', classData);
    }

    async updateClass(id, classData) {
        return this.put(`/classes/${id}`, classData);
    }

    async deleteClass(id) {
        return this.delete(`/classes/${id}`);
    }

    // ====== COURSES API ======
    async getCourses() {
        return this.get('/courses');
    }

    async getCourse(id) {
        return this.get(`/courses/${id}`);
    }

    async createCourse(courseData) {
        return this.post('/courses', courseData);
    }

    // ====== FINANCIAL API ======
    async getFinancialResponsibles() {
        return this.get('/financial-responsibles');
    }

    async getFinancialResponsible(id) {
        return this.get(`/financial-responsibles/${id}`);
    }

    async createFinancialResponsible(data) {
        return this.post('/financial-responsibles', data);
    }

    async updateFinancialResponsible(id, data) {
        return this.put(`/financial-responsibles/${id}`, data);
    }

    async getSubscriptions() {
        return this.get('/financial/subscriptions');
    }

    async createSubscription(data) {
        return this.post('/financial/subscriptions', data);
    }

    // ====== ATTENDANCE API ======
    async getAttendance(params = {}) {
        return this.get('/attendance', params);
    }

    async recordAttendance(data) {
        return this.post('/attendance', data);
    }

    // ====== PROGRESS API ======
    async getProgress(studentId) {
        return this.get(`/students/${studentId}/progress`);
    }

    async updateProgress(studentId, progressData) {
        return this.put(`/students/${studentId}/progress`, progressData);
    }

    // ====== DIAGNOSTIC API ======
    async getDiagnostic() {
        return this.get('/diagnostic');
    }

    async getSystemStatus() {
        return this.get('/diagnostic/status');
    }

    // ====== UTILITY METHODS ======
    
    /**
     * Handle API errors with user-friendly messages
     */
    handleError(error, context = '') {
        const message = error.message || 'Erro desconhecido';
        console.error(`❌ ${context} Error:`, error);
        
        // User-friendly error messages
        if (message.includes('404')) {
            return 'Recurso não encontrado';
        } else if (message.includes('500')) {
            return 'Erro interno do servidor';
        } else if (message.includes('network') || message.includes('fetch')) {
            return 'Erro de conexão com o servidor';
        } else {
            return 'Erro na operação';
        }
    }

    /**
     * Show loading state for API calls
     */
    async withLoading(promise, loadingElement = null) {
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }

        try {
            const result = await promise;
            return result;
        } finally {
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }

    /**
     * Retry API call with exponential backoff
     */
    async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                console.log(`🔄 Retrying request in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }
}

// Create singleton instance
const apiClient = new APIClient();

// Export for ES6 modules
export default apiClient;

// Global access for legacy compatibility
window.apiClient = apiClient;
window.API = apiClient;
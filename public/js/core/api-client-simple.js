/**
 * API Client - Simplified version for module compatibility
 */

// Simple API client without imports for now
class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }
    
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body = null,
            ...fetchOptions
        } = options;
        
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const requestConfig = {
            method,
            headers: {
                ...this.defaultHeaders,
                ...headers
            },
            ...fetchOptions
        };
        
        if (body) {
            requestConfig.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }
        
        try {
            const response = await fetch(url, requestConfig);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('Content-Type') || '';
            
            if (contentType.includes('application/json')) {
                const data = await response.json();
                return { data, status: response.status };
            } else {
                const data = await response.text();
                return { data, status: response.status };
            }
            
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
    
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url, { method: 'GET' });
    }
    
    async post(endpoint, data = {}) {
        return this.request(endpoint, { method: 'POST', body: data });
    }
    
    async put(endpoint, data = {}) {
        return this.request(endpoint, { method: 'PUT', body: data });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // Students API
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
    
    // Classes API
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
    
    // Attendance API
    async getAttendance() {
        return this.get('/attendance');
    }
    
    async createAttendance(attendanceData) {
        return this.post('/attendance', attendanceData);
    }
    
    async updateAttendance(id, attendanceData) {
        return this.put(`/attendance/${id}`, attendanceData);
    }
    
    async deleteAttendance(id) {
        return this.delete(`/attendance/${id}`);
    }
    
    // System API
    async getStats() {
        return this.get('/stats');
    }
    
    async getHealth() {
        return this.get('/health');
    }
}

// Create instance
const apiClient = new APIClient();

// Export for module use
export { apiClient, APIClient };
export default apiClient;

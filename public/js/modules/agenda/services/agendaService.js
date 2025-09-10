/**
 * Agenda Service - MVP Version
 * Serviço para gerenciar dados da agenda
 */

class AgendaService {
    constructor(moduleAPI) {
        this.moduleAPI = moduleAPI;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        console.log('📅 AgendaService initialized');
    }

    /**
     * Get classes for today
     */
    async getTodayClasses() {
        const cacheKey = 'today-classes';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await this.moduleAPI.api.get(`/api/agenda/classes?startDate=${today}&endDate=${today}`);
            
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Error fetching today classes:', error);
            throw error;
        }
    }

    /**
     * Get classes for specific date range
     */
    async getClasses(startDate, endDate, filters = {}) {
        const cacheKey = `classes-${startDate}-${endDate}-${JSON.stringify(filters)}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                ...filters
            });

            const response = await this.moduleAPI.api.get(`/api/agenda/classes?${params}`);
            
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Error fetching classes:', error);
            throw error;
        }
    }

    /**
     * Get turmas (classes) with schedules
     */
    async getTurmasWithSchedules() {
        const cacheKey = 'turmas-schedules';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.moduleAPI.api.get('/api/agenda/turmas/schedules');
            
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Error fetching turmas schedules:', error);
            throw error;
        }
    }

    /**
     * Get instructors list
     */
    async getInstructors() {
        const cacheKey = 'instructors';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.moduleAPI.api.get('/api/instructors');
            
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Error fetching instructors:', error);
            throw error;
        }
    }

    /**
     * Get courses list
     */
    async getCourses() {
        const cacheKey = 'courses';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.moduleAPI.api.get('/api/courses');
            
            this.setCache(cacheKey, response);
            return response;
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    }

    /**
     * Get agenda statistics
     */
    async getAgendaStats(date = null) {
        try {
            const dateParam = date ? `?date=${date}` : '';
            const response = await this.moduleAPI.api.get(`/api/agenda/stats${dateParam}`);
            
            // Transform the response to match expected format
            if (response?.data) {
                return {
                    success: true,
                    data: {
                        totalClasses: response.data.totalClasses || 0,
                        totalStudents: response.data.totalAttendances || 0,
                        activeInstructors: response.data.activeInstructors || 0,
                        checkedIn: response.data.totalAttendances || 0
                    }
                };
            }
            
            return response;
        } catch (error) {
            console.error('Error fetching agenda stats:', error);
            throw error;
        }
    }

    /**
     * Get check-ins for specific date
     */
    async getCheckins(date) {
        try {
            const response = await this.moduleAPI.api.get(`/api/agenda/checkins?date=${date}`);
            return response;
        } catch (error) {
            console.error('Error fetching checkins:', error);
            throw error;
        }
    }

    /**
     * Cache management
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clearCache() {
        this.cache.clear();
        console.log('📅 Cache cleared');
    }

    /**
     * Utility methods
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(dateTime) {
        return new Date(dateTime).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Generate week dates
     */
    getWeekDates(date) {
        const current = new Date(date);
        const week = [];
        
        // Get Monday of current week
        const monday = new Date(current);
        monday.setDate(current.getDate() - current.getDay() + 1);
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            week.push(day);
        }
        
        return week;
    }

    /**
     * Generate month dates
     */
    getMonthDates(date) {
        const current = new Date(date);
        const year = current.getFullYear();
        const month = current.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        return {
            firstDay,
            lastDay,
            daysInMonth: lastDay.getDate()
        };
    }
}

// Expose globally
window.AgendaService = AgendaService;

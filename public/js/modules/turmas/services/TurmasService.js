// TurmasService - Serviço para comunicação com API de Turmas
// Gerencia todas as operações de dados relacionadas às turmas

export class TurmasService {
    constructor(apiClient) {
        this.api = apiClient;
        this.baseURL = '/api/turmas';
        // Simple in-memory cache for support lists to avoid repetitive network calls
        // Structure: { key: { timestamp: number, data: any } }
        this._cache = new Map();
        // Default TTL (ms) - 2 minutes is enough for support reference lists (instructors, units, courses)
        this.DEFAULT_TTL = 2 * 60 * 1000;
    }

    // ===== Generic Cache Helpers =====
    _getCache(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        const isExpired = (Date.now() - entry.timestamp) > (entry.ttl || this.DEFAULT_TTL);
        if (isExpired) {
            this._cache.delete(key);
            return null;
        }
        return entry.data;
    }

    _setCache(key, data, ttl = this.DEFAULT_TTL) {
        this._cache.set(key, { data, ttl, timestamp: Date.now() });
    }

    invalidateCache(keys = []) {
        if (!keys.length) {
            this._cache.clear();
            return;
        }
        keys.forEach(k => this._cache.delete(k));
    }

    // ===== CRUD Básico =====
    
    async list(filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = params.toString() ? `${this.baseURL}?${params}` : this.baseURL;
        
        return await this.api.fetchWithStates(url, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getById(id) {
        return await this.api.fetchWithStates(`${this.baseURL}/${id}`, {
            method: 'GET'
        });
    }

    async create(data) {
        return await this.api.saveWithFeedback(this.baseURL, data, {
            method: 'POST'
        });
    }

    async update(id, data) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${id}`, data, {
            method: 'PUT'
        });
    }

    async delete(id) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${id}`, {}, {
            method: 'DELETE'
        });
    }

    // ===== Cronograma e Aulas =====
    
    async generateSchedule(turmaId) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/schedule`, {}, {
            method: 'POST'
        });
    }

    async getLessons(turmaId, filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = params.toString() 
            ? `${this.baseURL}/${turmaId}/lessons?${params}`
            : `${this.baseURL}/${turmaId}/lessons`;
        
        return await this.api.fetchWithStates(url, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async updateLessonStatus(turmaId, lessonId, status) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/lessons/${lessonId}`, { status }, {
            method: 'PUT'
        });
    }

    // ===== Gestão de Alunos =====
    
    async getStudents(turmaId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/students`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async addStudent(turmaId, studentId) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/students`, { studentId }, {
            method: 'POST'
        });
    }

    async removeStudent(turmaId, studentId) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/students/${studentId}`, {}, {
            method: 'DELETE'
        });
    }

    // ===== Frequência =====
    
    async getAttendance(turmaId, filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = params.toString() 
            ? `${this.baseURL}/${turmaId}/attendance?${params}`
            : `${this.baseURL}/${turmaId}/attendance`;
        
        return await this.api.fetchWithStates(url, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async markAttendance(turmaId, attendanceData) {
        return await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/attendance`, attendanceData, {
            method: 'POST'
        });
    }

    // ===== Relatórios =====
    
    async getReports(turmaId, filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = params.toString() 
            ? `${this.baseURL}/${turmaId}/reports?${params}`
            : `${this.baseURL}/${turmaId}/reports`;
        
        return await this.api.fetchWithStates(url, {
            method: 'GET'
        });
    }

    // ===== Busca e Filtros =====
    
    async search(query, filters = {}) {
        const params = new URLSearchParams({ q: query });
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(`filters[${key}]`, value);
            }
        });
        
        return await this.api.fetchWithStates(`${this.baseURL}/search?${params}`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getByInstructor(instructorId, filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        
        const url = params.toString() 
            ? `${this.baseURL}/by-instructor/${instructorId}?${params}`
            : `${this.baseURL}/by-instructor/${instructorId}`;
        
        return await this.api.fetchWithStates(url, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getByCourse(courseId) {
        return await this.api.fetchWithStates(`${this.baseURL}?courseId=${courseId}`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    // ===== Operações administrativas =====
    async clearAllEndDates() {
        return await this.api.saveWithFeedback(`${this.baseURL}/clear-end-dates`, {}, {
            method: 'POST'
        });
    }

    // ===== Dados de Apoio =====
    
    async getCourses({ force = false } = {}) {
        const cacheKey = 'courses';
        if (!force) {
            const cached = this._getCache(cacheKey);
            if (cached) return cached;
        }
        const result = await this.api.fetchWithStates('/api/courses', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
        if (result && result.success) this._setCache(cacheKey, result);
        return result;
    }

    async getInstructors({ force = false } = {}) {
        const cacheKey = 'instructors';
        if (!force) {
            const cached = this._getCache(cacheKey);
            if (cached) return cached;
        }
        console.log('🔄 [TurmasService] Buscando instrutores...');
        const result = await this.api.fetchWithStates('/api/instructors', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
        if (result && result.success) this._setCache(cacheKey, result);
        console.log('👨‍🏫 [TurmasService] Instrutores retornados:', result);
        return result;
    }

    async getStudents({ force = false } = {}) {
        const cacheKey = 'students';
        if (!force) {
            const cached = this._getCache(cacheKey);
            if (cached) return cached;
        }
        const result = await this.api.fetchWithStates('/api/students', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
        if (result && result.success) this._setCache(cacheKey, result);
        return result;
    }

    async getOrganizations({ force = false } = {}) {
        const cacheKey = 'organizations';
        if (!force) {
            const cached = this._getCache(cacheKey);
            if (cached) return cached;
        }
        const result = await this.api.fetchWithStates('/api/organizations', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
        if (result && result.success) this._setCache(cacheKey, result);
        return result;
    }

    async getUnits({ force = false } = {}) {
        const cacheKey = 'units';
        if (!force) {
            const cached = this._getCache(cacheKey);
            if (cached) return cached;
        }
        console.log('🔄 [TurmasService] Buscando unidades...');
        const result = await this.api.fetchWithStates('/api/units', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
        if (result && result.success) this._setCache(cacheKey, result);
        console.log('🏢 [TurmasService] Unidades retornadas:', result);
        return result;
    }

    // ===== Utilitários =====
    
    formatTurmaData(turma) {
        if (!turma) return null;
        
        // Normalize type field (classType vs type)
        const normalizedType = turma.classType || turma.type;
        const normalized = { ...turma, type: normalizedType, classType: normalizedType };

        return {
            ...normalized,
            startDateFormatted: this.formatDate(normalized.startDate),
            endDateFormatted: normalized.endDate ? this.formatDate(normalized.endDate) : null,
            statusText: this.getStatusText(normalized.status),
            typeText: this.getTypeText(normalized.classType),
            progressPercentage: this.calculateProgress(normalized)
        };
    }

    formatDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'SCHEDULED': 'Agendado',
            'IN_PROGRESS': 'Em Andamento',
            'COMPLETED': 'Concluído',
            'CANCELLED': 'Cancelado',
            'SUSPENDED': 'Suspenso'
        };
        return statusMap[status] || status;
    }

    getTypeText(type) {
        const typeMap = {
            'COLLECTIVE': 'Coletiva',
            'PRIVATE': 'Particular',
            'SEMI_PRIVATE': 'Semi-Particular'
        };
        return typeMap[type] || type;
    }

    calculateProgress(turma) {
        if (!turma.lessons || turma.lessons.length === 0) return 0;
        
        const completedLessons = turma.lessons.filter(lesson => 
            lesson.status === 'COMPLETED'
        ).length;
        
        return Math.round((completedLessons / turma.lessons.length) * 100);
    }

    validateTurmaData(data) {
        const errors = [];
        
        if (!data.name || data.name.trim() === '') {
            errors.push('Nome da turma é obrigatório');
        }
        
        if (!data.courseId) {
            errors.push('Curso é obrigatório');
        }
        
        if (!data.instructorId) {
            errors.push('Instrutor é obrigatório');
        }
        
        if (!data.startDate) {
            errors.push('Data de início é obrigatória');
        }
        
        if (!data.type || !['COLLECTIVE', 'PRIVATE'].includes(data.type)) {
            errors.push('Tipo de turma deve ser Coletivo ou Particular');
        }
        
        if (!data.schedule || !data.schedule.daysOfWeek || data.schedule.daysOfWeek.length === 0) {
            errors.push('Dias da semana são obrigatórios');
        }
        
        if (!data.schedule || !data.schedule.time) {
            errors.push('Horário é obrigatório');
        }
        
        return errors;
    }

    // ===== Gestão de Cursos da Turma =====

    async getTurmaCourses(turmaId) {
        // Provide lightweight caching similar to support lists to avoid redundant rapid calls
        const cacheKey = `turma-courses:${turmaId}`;
        const cached = this._getCache(cacheKey);
        if (cached) {
            console.debug(`[TurmasService] Cache hit for ${cacheKey}`);
            return cached;
        }

        const result = await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/courses`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });

        // Cache only successful responses
        if (result && result.success) {
            // Shorter TTL (30s) for courses association since it can change more often
            this._setCache(cacheKey, result, 30 * 1000);
        }
        return result;
    }

    async addCourseToTurma(turmaId, courseId) {
        const resp = await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/courses`, { courseId }, {
            method: 'POST'
        });
        // Invalidate courses cache for this turma so UI refetches fresh list
        this.invalidateCache([`turma-courses:${turmaId}`]);
        return resp;
    }

    async removeCourseFromTurma(turmaId, courseId) {
        const resp = await this.api.saveWithFeedback(`${this.baseURL}/${turmaId}/courses/${courseId}`, {}, {
            method: 'DELETE'
        });
        // Invalidate cache to reflect removal
        this.invalidateCache([`turma-courses:${turmaId}`]);
        return resp;
    }

    async getAvailableCourses(options) {
        // Alias for compatibility; pass through options to allow force refresh
        return await this.getCourses(options);
    }
}

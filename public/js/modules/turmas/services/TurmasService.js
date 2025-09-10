// TurmasService - Serviço para comunicação com API de Turmas
// Gerencia todas as operações de dados relacionadas às turmas

export class TurmasService {
    constructor(apiClient) {
        this.api = apiClient;
        this.baseURL = '/api/turmas';
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
        return await this.api.fetchWithStates(this.baseURL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async update(id, data) {
        return await this.api.fetchWithStates(`${this.baseURL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async delete(id) {
        return await this.api.fetchWithStates(`${this.baseURL}/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== Cronograma e Aulas =====
    
    async generateSchedule(turmaId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/schedule`, {
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
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/lessons/${lessonId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
            headers: {
                'Content-Type': 'application/json'
            }
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
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/students`, {
            method: 'POST',
            body: JSON.stringify({ studentId }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async removeStudent(turmaId, studentId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/students/${studentId}`, {
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
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/attendance`, {
            method: 'POST',
            body: JSON.stringify(attendanceData),
            headers: {
                'Content-Type': 'application/json'
            }
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

    // ===== Dados de Apoio =====
    
    async getCourses() {
        return await this.api.fetchWithStates('/api/courses', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getInstructors() {
        return await this.api.fetchWithStates('/api/instructors', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getStudents() {
        return await this.api.fetchWithStates('/api/students', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getOrganizations() {
        return await this.api.fetchWithStates('/api/organizations', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getUnits() {
        return await this.api.fetchWithStates('/api/units', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    // ===== Utilitários =====
    
    formatTurmaData(turma) {
        if (!turma) return null;
        
        return {
            ...turma,
            startDateFormatted: this.formatDate(turma.startDate),
            endDateFormatted: turma.endDate ? this.formatDate(turma.endDate) : null,
            statusText: this.getStatusText(turma.status),
            typeText: this.getTypeText(turma.type),
            progressPercentage: this.calculateProgress(turma)
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
            'COLLECTIVE': 'Coletivo',
            'PRIVATE': 'Particular'
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
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/courses`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async addCourseToTurma(turmaId, courseId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/courses`, {
            method: 'POST',
            body: JSON.stringify({ courseId }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async removeCourseFromTurma(turmaId, courseId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/courses/${courseId}`, {
            method: 'DELETE'
        });
    }

    async getTurmaCourses(turmaId) {
        return await this.api.fetchWithStates(`${this.baseURL}/${turmaId}/courses`, {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }

    async getCourses() {
        return await this.api.fetchWithStates('/api/courses', {
            method: 'GET',
            onEmpty: () => ({ success: true, data: [] })
        });
    }
}

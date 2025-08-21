/**
 * Students Service
 * Handles all API communication for students module
 */

export class StudentsService {
    constructor(moduleAPIHelper) {
        // Use a propriedade 'api' do ModuleAPIHelper que contém o API Client real
        this.api = moduleAPIHelper.api || moduleAPIHelper;
    }

    /**
     * Get all students
     */
    async getStudents() {
        try {
            const response = await this.api.get('/api/students');
            return response.data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar estudantes:', error);
            throw new Error('Erro ao carregar lista de estudantes');
        }
    }

    /**
     * Get single student by ID
     */
    async getStudent(id) {
        try {
            const response = await this.api.get(`/api/students/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar estudante:', error);
            throw new Error('Erro ao carregar dados do estudante');
        }
    }

    /**
     * Create new student
     */
    async createStudent(studentData) {
        try {
            const response = await this.api.post('/api/students', studentData);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao criar estudante:', error);
            throw new Error('Erro ao criar estudante');
        }
    }

    /**
     * Update existing student
     */
    async updateStudent(id, studentData) {
        try {
            const response = await this.api.put(`/api/students/${id}`, studentData);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao atualizar estudante:', error);
            throw new Error('Erro ao atualizar estudante');
        }
    }

    /**
     * Delete student
     */
    async deleteStudent(id) {
        try {
            await this.api.delete(`/api/students/${id}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao excluir estudante:', error);
            throw new Error('Erro ao excluir estudante');
        }
    }

    /**
     * Get student subscription
     */
    async getStudentSubscription(id) {
        try {
            const response = await this.api.get(`/api/students/${id}/subscription`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar assinatura:', error);
            throw new Error('Erro ao carregar assinatura do estudante');
        }
    }

    /**
     * Update student subscription
     */
    async updateStudentSubscription(id, subscriptionData) {
        try {
            const response = await this.api.put(`/api/students/${id}/subscription`, subscriptionData);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao atualizar assinatura:', error);
            throw new Error('Erro ao atualizar assinatura');
        }
    }

    /**
     * Get student financial history
     */
    async getStudentFinancialHistory(id) {
        try {
            // Alinha com backend: usar financial-summary e extrair payments
            const response = await this.api.get(`/api/students/${id}/financial-summary`);
            const data = response.data;
            if (data && Array.isArray(data.payments)) return data.payments;
            if (Array.isArray(data)) return data;
            return [];
        } catch (error) {
            console.warn('⚠️ Endpoint de histórico financeiro não disponível, usando dados mock:', error.message);
            // Retorna dados mock para desenvolvimento
            return [
                {
                    id: 1,
                    date: '2025-01-10',
                    type: 'payment',
                    description: 'Mensalidade Janeiro',
                    amount: 150.00,
                    status: 'paid',
                    method: 'PIX'
                },
                {
                    id: 2,
                    date: '2024-12-10',
                    type: 'payment',
                    description: 'Mensalidade Dezembro',
                    amount: 150.00,
                    status: 'paid',
                    method: 'Cartão'
                },
                {
                    id: 3,
                    date: '2024-11-10',
                    type: 'payment',
                    description: 'Mensalidade Novembro',
                    amount: 150.00,
                    status: 'overdue',
                    method: 'Pendente'
                }
            ];
        }
    }

    /**
     * Get student attendance history
     */
    async getStudentAttendanceHistory(id) {
        try {
            const response = await this.api.get(`/api/students/${id}/attendances`);
            return response.data || [];
        } catch (error) {
            console.warn('⚠️ Endpoint de presenças não disponível, usando dados mock:', error.message);
            // Retorna dados mock para desenvolvimento
            return [
                {
                    id: 1,
                    date: '2025-01-15',
                    activity: 'Treino Krav Maga',
                    status: 'presente',
                    instructor: 'Professor Silva'
                },
                {
                    id: 2,
                    date: '2025-01-12',
                    activity: 'Defesa Pessoal',
                    status: 'presente',
                    instructor: 'Professor Santos'
                }
            ];
        }
    }

    /**
     * Get available plans for subscription
     */
    async getAvailablePlans() {
        try {
            const response = await this.api.get('/api/billing-plans');
            return response.data || [];
        } catch (error) {
            console.warn('⚠️ Endpoint de planos não disponível, usando dados mock:', error.message);
            // Retorna dados mock para desenvolvimento
            return [
                {
                    id: 1,
                    name: 'Plano Básico',
                    price: 150.00,
                    duration: 'Mensal',
                    features: ['Acesso completo', 'Treinos ilimitados']
                },
                {
                    id: 2,
                    name: 'Plano Premium',
                    price: 250.00,
                    duration: 'Mensal',
                    features: ['Acesso completo', 'Treinos ilimitados', 'Personal Trainer']
                }
            ];
        }
    }

    /**
     * Get student's course progress
     */
    async getStudentCourseProgress(id) {
        try {
            const response = await this.api.get(`/api/students/${id}/course-progress`);
            return response.data || [];
        } catch (error) {
            console.warn('⚠️ Endpoint de progresso de cursos não disponível:', error.message);
            return [];
        }
    }

    /**
     * Get courses included in a billing plan
     */
    async getPlanCourses(planId) {
        try {
            const response = await this.api.get(`/api/plans/${planId}/courses`);
            return response.data || [];
        } catch (error) {
            console.warn('⚠️ Endpoint de cursos do plano não disponível:', error.message);
            // Fallback para buscar todos os cursos
            return this.getAllCourses();
        }
    }

    /**
     * Get all available courses
     */
    async getAllCourses() {
        try {
            const response = await this.api.get('/api/courses');
            return response.data || [];
        } catch (error) {
            console.warn('⚠️ Endpoint de cursos não disponível:', error.message);
            return [];
        }
    }
}

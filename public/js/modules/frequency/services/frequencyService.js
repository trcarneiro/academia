/**
 * FrequencyService - Serviço central de frequência
 * Responsável por todas as operações de check-in e validações
 */

export class FrequencyService {
    constructor(validationService) {
        this.validationService = validationService;
        this.moduleAPI = null;
        this.cache = new Map();
        this.initAPI();
    }

    /**
     * Inicializar cliente da API usando createModuleAPI (AGENTS.md v2.1)
     */
    async initAPI() {
        // Aguardar API client estar disponível
        while (!window.createModuleAPI) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.moduleAPI = window.createModuleAPI('Frequency');
    }

    /**
     * Realizar check-in principal
     * @param {Object} data - { studentId, sessionId, context }
     * @returns {Promise<Object>} Resultado do check-in
     */
    async checkin(data) {
        try {
            console.log('👥 Processing check-in:', data);

            // Validar dados de entrada
            await this.validationService.validate(data);

            // Carregar contexto completo
            const context = await this.loadContext(data.studentId, data.sessionId);

            // Verificar regras de negócio
            await this.validateBusinessRules(context);

            // Verificar duplicidade
            const duplicate = await this.isDuplicate(context);
            if (duplicate) {
                return this.buildDuplicateResponse(duplicate);
            }

            // Persistir registro de frequência
            const record = await this.persistAttendance(context);

            // Calcular streak (se aplicável)
            const streak = await this.calculateStreak(data.studentId);

            // Disparar evento
            this.dispatchCheckinEvent(record);

            // Log de sucesso
            window.app?.log?.('checkin.success', {
                studentId: data.studentId,
                sessionId: data.sessionId,
                latencyMs: Date.now() - context.startTime
            });

            return this.buildSuccessResponse(record, streak);

        } catch (error) {
            console.error('❌ Check-in failed:', error);
            
            // Log estruturado
            window.app?.log?.('checkin.failure', {
                studentId: data.studentId,
                sessionId: data.sessionId,
                error: error.message
            });

            // Se offline, adicionar à fila
            if (!navigator.onLine) {
                window.frequencyModule?.addToOfflineQueue(data);
                throw new Error('Sem conexão. Check-in salvo para processamento posterior.');
            }

            throw error;
        }
    }

    /**
     * Carregar contexto completo para validação
     */
    async loadContext(studentId, sessionId) {
        const startTime = Date.now();

        try {
            // Carregar dados em paralelo
            const [student, session, activePlans] = await Promise.all([
                this.getStudent(studentId),
                this.getSession(sessionId),
                this.getActivePlans(studentId)
            ]);

            return {
                startTime,
                student,
                session,
                activePlans,
                studentId,
                sessionId
            };

        } catch (error) {
            throw new Error(`Erro ao carregar contexto: ${error.message}`);
        }
    }

    /**
     * Validar regras de negócio
     */
    async validateBusinessRules(context) {
        const { student, session, activePlans } = context;

        // R1: Aluno precisa de plano ativo
        if (!activePlans || activePlans.length === 0) {
            throw new Error('PLAN_REQUIRED: Aluno sem plano ativo');
        }

        // R2: Sessão compatível com curso do plano
        const validPlan = activePlans.find(plan => 
            plan.courses && plan.courses.some(course => course.id === session.courseId)
        );

        if (!validPlan) {
            throw new Error('PLAN_MISMATCH: Sessão não compatível com planos ativos');
        }

        // R4: Janela válida (não retroativa > 24h)
        const sessionStart = new Date(session.startAt);
        const now = new Date();
        const hoursDiff = (now - sessionStart) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            throw new Error('SESSION_EXPIRED: Não é possível registrar presença em sessão antiga');
        }

        // R5: Sessão não cancelada
        if (session.status === 'CANCELLED') {
            throw new Error('SESSION_CANCELLED: Sessão foi cancelada');
        }

        return true;
    }

    /**
     * Verificar se já existe registro duplicado
     */
    async isDuplicate(context) {
        try {
            const response = await this.moduleAPI.request(
                `/api/frequency/attendance/check-duplicate?studentId=${context.studentId}&sessionId=${context.sessionId}`
            );

            if (response.data && response.data.exists) {
                return response.data.record;
            }

            return null;

        } catch (error) {
            console.warn('Error checking duplicate:', error);
            return null;
        }
    }

    /**
     * Persistir registro de frequência
     */
    async persistAttendance(context) {
        const payload = {
            studentId: context.studentId,
            sessionId: context.sessionId,
            courseId: context.session.courseId,
            planId: context.activePlans[0].id,
            checkedAt: new Date().toISOString(),
            source: 'SELF', // TODO: detectar contexto (OPERATOR, API)
            status: 'PRESENT',
            integrity: {
                duplicationGuard: this.generateIntegrityHash(context),
                version: 1
            },
            meta: {
                device: this.detectDevice(),
                latencyMs: Date.now() - context.startTime
            }
        };

        const response = await this.moduleAPI.request('/api/frequency/attendance/checkin', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.data || !response.data.success) {
            throw new Error(response.data?.error || 'Falha ao registrar frequência');
        }

        return response.data.attendance;
    }

    /**
     * Calcular streak do aluno
     */
    async calculateStreak(studentId) {
        try {
            const response = await this.moduleAPI.request(`/api/frequency/attendance/streak/${studentId}`);
            return response.data?.streak || 0;
        } catch (error) {
            console.warn('Failed to calculate streak:', error);
            return 0;
        }
    }

    /**
     * Gerar hash de integridade
     */
    generateIntegrityHash(context) {
        const date = new Date().toISOString().split('T')[0];
        const data = `${context.studentId}:${context.sessionId}:${date}`;
        
        // Simples hash (em produção usar crypto.subtle)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * Detectar dispositivo
     */
    detectDevice() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    /**
     * Disparar evento de check-in
     */
    dispatchCheckinEvent(record) {
        const event = new CustomEvent('FREQUENCY:CHECKIN_RECORDED', {
            detail: {
                attendanceId: record.id,
                studentId: record.studentId,
                sessionId: record.sessionId,
                timestamp: record.checkedAt
            }
        });

        window.dispatchEvent(event);
    }

    /**
     * Construir resposta de duplicata
     */
    buildDuplicateResponse(existingRecord) {
        // Log de duplicata
        window.app?.log?.('checkin.duplicate', {
            studentId: existingRecord.studentId,
            sessionId: existingRecord.sessionId
        });

        return {
            status: 'ok',
            duplicate: true,
            attendanceId: existingRecord.id,
            originalTime: existingRecord.checkedAt,
            message: `Presença já registrada às ${new Date(existingRecord.checkedAt).toLocaleTimeString()}`
        };
    }

    /**
     * Construir resposta de sucesso
     */
    buildSuccessResponse(record, streak) {
        return {
            status: 'ok',
            duplicate: false,
            attendanceId: record.id,
            streak: streak,
            message: 'Presença registrada com sucesso!',
            nextRecommendedSession: null // TODO: implementar recomendação
        };
    }

    /**
     * Buscar aluno por ID
     */
    async getStudent(studentId) {
        const cacheKey = `student_${studentId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.moduleAPI.request(`/api/students/${studentId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error('Aluno não encontrado');
            }

            const student = response.data.data;
            this.cache.set(cacheKey, student);
            
            // Cache por 5 minutos
            setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
            
            return student;

        } catch (error) {
            throw new Error(`Erro ao buscar aluno: ${error.message}`);
        }
    }

    /**
     * Buscar sessão por ID
     */
    async getSession(sessionId) {
        try {
            const response = await this.moduleAPI.request(`/api/sessions/${sessionId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error('Sessão não encontrada');
            }

            return response.data.data;

        } catch (error) {
            throw new Error(`Erro ao buscar sessão: ${error.message}`);
        }
    }

    /**
     * Buscar planos ativos do aluno
     */
    async getActivePlans(studentId) {
        try {
            const response = await this.moduleAPI.request(`/api/students/${studentId}/active-plans`);
            
            if (!response.data || !response.data.success) {
                return [];
            }

            return response.data.data || [];

        } catch (error) {
            console.warn('Error fetching active plans:', error);
            return [];
        }
    }

    /**
     * Buscar sessões ativas (próximas 30min)
     */
    async getActiveSessions() {
        try {
            const now = new Date();
            const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // -15min
            const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);   // +30min

            const response = await this.moduleAPI.request(
                `/api/sessions/active?start=${windowStart.toISOString()}&end=${windowEnd.toISOString()}`
            );

            if (!response.data || !response.data.success) {
                return [];
            }

            return response.data.data || [];

        } catch (error) {
            console.error('Error fetching active sessions:', error);
            return [];
        }
    }

    /**
     * Buscar histórico de frequência do aluno
     */
    async getStudentAttendance(studentId, options = {}) {
        try {
            const params = new URLSearchParams({
                page: options.page || 1,
                limit: options.limit || 20,
                ...options.filters
            });

            const response = await this.moduleAPI.request(
                `/api/frequency/attendance/student/${studentId}?${params}`
            );

            if (!response.data || !response.data.success) {
                return { records: [], total: 0 };
            }

            return response.data.data;

        } catch (error) {
            console.error('Error fetching student attendance:', error);
            return { records: [], total: 0 };
        }
    }

    /**
     * Buscar estatísticas de frequência
     */
    async getFrequencyStats(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await this.moduleAPI.request(`/api/frequency/stats?${params}`);

            if (!response.data || !response.data.success) {
                return {};
            }

            return response.data.data;

        } catch (error) {
            console.error('Error fetching frequency stats:', error);
            return {};
        }
    }
}

/**
 * ValidationService - Validações de entrada e regras de negócio
 * Centraliza todas as validações do módulo de frequência
 */

export class ValidationService {
    constructor() {
        this.rules = this.initializeRules();
    }

    /**
     * Inicializar regras de validação
     */
    initializeRules() {
        return {
            // R1: Aluno precisa de plano ativo
            PLAN_REQUIRED: {
                severity: 'BLOCK',
                message: 'Aluno deve ter ao menos um plano ativo'
            },
            
            // R2: Sessão compatível com curso do plano
            PLAN_MISMATCH: {
                severity: 'BLOCK', 
                message: 'Sessão não pertence aos cursos do plano ativo'
            },
            
            // R3: Evitar duplicidade
            DUPLICATE_CHECKIN: {
                severity: 'BLOCK',
                message: 'Presença já registrada para esta sessão'
            },
            
            // R4: Janela válida
            SESSION_WINDOW: {
                severity: 'BLOCK',
                message: 'Fora da janela permitida para check-in'
            },
            
            // R5: Sessão não cancelada
            SESSION_CANCELLED: {
                severity: 'BLOCK',
                message: 'Sessão foi cancelada'
            },
            
            // R6: Planos multi-curso
            COURSE_WHITELIST: {
                severity: 'BLOCK',
                message: 'Curso não autorizado no plano'
            },
            
            // R7: Limite diário
            DAILY_LIMIT: {
                severity: 'WARN',
                message: 'Limite diário de presenças atingido'
            },
            
            // R8: Integridade dos logs
            INTEGRITY_MISMATCH: {
                severity: 'BLOCK',
                message: 'Falha na verificação de integridade'
            }
        };
    }

    /**
     * Validar dados de entrada
     * @param {Object} data - Dados do check-in
     * @returns {Promise<boolean>} True se válido
     */
    async validate(data) {
        console.log('🔍 Validating check-in data:', data);

        // Validações básicas de formato
        this.validateFormat(data);

        // Validações de negócio serão feitas no service
        return true;
    }

    /**
     * Validar formato dos dados
     */
    validateFormat(data) {
        const errors = [];

        // Validar studentId
        if (!data.studentId) {
            errors.push('studentId é obrigatório');
        } else if (!this.isValidUUID(data.studentId)) {
            errors.push('studentId deve ser um UUID válido');
        }

        // Validar sessionId
        if (!data.sessionId) {
            errors.push('sessionId é obrigatório');
        } else if (!this.isValidUUID(data.sessionId)) {
            errors.push('sessionId deve ser um UUID válido');
        }

        // Validar context (opcional)
        if (data.context) {
            this.validateContext(data.context, errors);
        }

        if (errors.length > 0) {
            throw new Error(`Dados inválidos: ${errors.join(', ')}`);
        }
    }

    /**
     * Validar contexto adicional
     */
    validateContext(context, errors) {
        // Validar device
        if (context.device && !['kiosk', 'mobile', 'desktop'].includes(context.device)) {
            errors.push('device deve ser: kiosk, mobile ou desktop');
        }

        // Validar trigger
        if (context.trigger && !['manual', 'auto'].includes(context.trigger)) {
            errors.push('trigger deve ser: manual ou auto');
        }
    }

    /**
     * Verificar se é UUID válido (simplificado)
     */
    isValidUUID(str) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    /**
     * Validar janela de tempo para check-in
     */
    validateTimeWindow(sessionStart, currentTime = new Date()) {
        const sessionDate = new Date(sessionStart);
        const timeDiff = Math.abs(currentTime - sessionDate);
        
        // Permitir check-in 15min antes até 30min depois
        const maxBefore = 15 * 60 * 1000; // 15min em ms
        const maxAfter = 30 * 60 * 1000;  // 30min em ms
        
        if (currentTime < sessionDate && (sessionDate - currentTime) > maxBefore) {
            throw new Error('CHECK_TOO_EARLY: Check-in muito cedo');
        }
        
        if (currentTime > sessionDate && (currentTime - sessionDate) > maxAfter) {
            throw new Error('CHECK_TOO_LATE: Check-in muito tarde');
        }
        
        return true;
    }

    /**
     * Validar plano ativo
     */
    validateActivePlan(student, plans) {
        if (!plans || plans.length === 0) {
            throw new Error('PLAN_REQUIRED: Nenhum plano ativo encontrado');
        }

        const now = new Date();
        const activePlans = plans.filter(plan => {
            const startDate = new Date(plan.startDate);
            const endDate = new Date(plan.endDate);
            return now >= startDate && now <= endDate && plan.status === 'ACTIVE';
        });

        if (activePlans.length === 0) {
            throw new Error('PLAN_EXPIRED: Todos os planos estão expirados');
        }

        return activePlans;
    }

    /**
     * Validar compatibilidade sessão-plano
     */
    validateSessionPlanCompatibility(session, activePlans) {
        const sessionCourseId = session.courseId;

        const compatiblePlan = activePlans.find(plan => {
            // Se o plano não tem cursos específicos, aceita qualquer curso
            if (!plan.courses || plan.courses.length === 0) {
                return true;
            }

            // Verificar se o curso da sessão está na lista do plano
            return plan.courses.some(course => course.id === sessionCourseId);
        });

        if (!compatiblePlan) {
            throw new Error('PLAN_MISMATCH: Sessão não compatível com planos ativos');
        }

        return compatiblePlan;
    }

    /**
     * Validar limite diário de check-ins
     */
    async validateDailyLimit(studentId, dailyAttendance, maxDaily = 5) {
        if (dailyAttendance >= maxDaily) {
            const warning = {
                code: 'DAILY_LIMIT',
                severity: 'WARN',
                message: `Limite diário de ${maxDaily} presenças atingido`,
                current: dailyAttendance,
                max: maxDaily
            };

            console.warn('⚠️ Daily limit warning:', warning);
            
            // Não bloquear, apenas avisar
            return warning;
        }

        return null;
    }

    /**
     * Validar integridade do registro
     */
    validateIntegrity(record, expectedHash) {
        if (record.integrity && record.integrity.duplicationGuard !== expectedHash) {
            throw new Error('INTEGRITY_MISMATCH: Hash de integridade não confere');
        }

        return true;
    }

    /**
     * Sanitizar dados de entrada
     */
    sanitizeInput(data) {
        return {
            studentId: this.sanitizeUUID(data.studentId),
            sessionId: this.sanitizeUUID(data.sessionId),
            context: data.context ? this.sanitizeContext(data.context) : {}
        };
    }

    /**
     * Sanitizar UUID
     */
    sanitizeUUID(uuid) {
        if (!uuid) return null;
        return uuid.toString().toLowerCase().trim();
    }

    /**
     * Sanitizar contexto
     */
    sanitizeContext(context) {
        const sanitized = {};

        if (context.device) {
            sanitized.device = context.device.toString().toLowerCase().trim();
        }

        if (context.trigger) {
            sanitized.trigger = context.trigger.toString().toLowerCase().trim();
        }

        return sanitized;
    }

    /**
     * Validar rate limiting
     */
    validateRateLimit(clientId, maxRequests = 20, windowMs = 60000) {
        const now = Date.now();
        const windowKey = `rate_limit_${clientId}_${Math.floor(now / windowMs)}`;
        
        // Simular rate limiting (em produção usar Redis ou similar)
        const stored = sessionStorage.getItem(windowKey);
        const requests = stored ? parseInt(stored) : 0;

        if (requests >= maxRequests) {
            throw new Error('RATE_LIMIT: Muitas tentativas, tente novamente em 1 minuto');
        }

        // Incrementar contador
        sessionStorage.setItem(windowKey, (requests + 1).toString());
        
        return true;
    }

    /**
     * Criar resposta de erro estruturada
     */
    createErrorResponse(code, message, details = {}) {
        const rule = this.rules[code];
        
        return {
            error: true,
            code: code,
            message: message || rule?.message || 'Erro de validação',
            severity: rule?.severity || 'BLOCK',
            details: details,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validar sessão ativa
     */
    validateActiveSession(session) {
        if (!session) {
            throw new Error('SESSION_NOT_FOUND: Sessão não encontrada');
        }

        if (session.status === 'CANCELLED') {
            throw new Error('SESSION_CANCELLED: Sessão foi cancelada');
        }

        if (session.status === 'COMPLETED') {
            throw new Error('SESSION_COMPLETED: Sessão já foi finalizada');
        }

        // Validar janela de tempo
        this.validateTimeWindow(session.startAt);

        return true;
    }

    /**
     * Obter informações da regra
     */
    getRuleInfo(code) {
        return this.rules[code] || {
            severity: 'UNKNOWN',
            message: 'Regra não definida'
        };
    }

    /**
     * Validar dados do estudante
     */
    validateStudent(student) {
        if (!student) {
            throw new Error('STUDENT_NOT_FOUND: Estudante não encontrado');
        }

        if (student.status === 'INACTIVE') {
            throw new Error('STUDENT_INACTIVE: Estudante inativo');
        }

        if (student.status === 'SUSPENDED') {
            throw new Error('STUDENT_SUSPENDED: Estudante suspenso');
        }

        return true;
    }
}

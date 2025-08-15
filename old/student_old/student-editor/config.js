/**
 * Student Editor - Configuration and Constants
 * Configurações e constantes para o módulo de edição de estudantes
 */

// Configurações da API
export const API_CONFIG = {
    baseUrl: '/api',
    endpoints: {
        students: '/students',
        plans: '/plans',
        subscriptions: '/subscriptions',
        payments: '/payments'
    },
    timeout: 10000, // 10 segundos
    retries: 3
};

// Configurações de validação
export const VALIDATION_CONFIG = {
    name: {
        minLength: 2,
        maxLength: 100,
        required: true
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        required: true
    },
    phone: {
        minLength: 10,
        maxLength: 11,
        pattern: /^\d{10,11}$/
    },
    cpf: {
        length: 11,
        pattern: /^\d{11}$/
    }
};

// Status disponíveis para estudantes
export const STUDENT_STATUS = {
    ATIVO: {
        value: 'ativo',
        label: '✅ Ativo',
        color: '#10B981'
    },
    INATIVO: {
        value: 'inativo',
        label: '⏸️ Inativo',
        color: '#6B7280'
    },
    SUSPENSO: {
        value: 'suspenso',
        label: '⛔ Suspenso',
        color: '#EF4444'
    },
    INADIMPLENTE: {
        value: 'inadimplente',
        label: '💰 Inadimplente',
        color: '#F59E0B'
    }
};

// Status de pagamento
export const PAYMENT_STATUS = {
    PAID: {
        value: 'paid',
        label: 'Em dia',
        color: '#10B981',
        icon: '✅'
    },
    PENDING: {
        value: 'pending',
        label: 'Pendente',
        color: '#F59E0B',
        icon: '⏳'
    },
    OVERDUE: {
        value: 'overdue',
        label: 'Atrasado',
        color: '#EF4444',
        icon: '⚠️'
    },
    CANCELLED: {
        value: 'cancelled',
        label: 'Cancelado',
        color: '#6B7280',
        icon: '❌'
    }
};

// Status de assinatura
export const SUBSCRIPTION_STATUS = {
    ACTIVE: {
        value: 'active',
        label: 'ATIVO',
        color: '#10B981'
    },
    INACTIVE: {
        value: 'inactive',
        label: 'INATIVO',
        color: '#EF4444'
    },
    SUSPENDED: {
        value: 'suspended',
        label: 'SUSPENSO',
        color: '#F59E0B'
    },
    CANCELLED: {
        value: 'cancelled',
        label: 'CANCELADO',
        color: '#6B7280'
    }
};

// Configurações de localStorage
export const STORAGE_CONFIG = {
    prefix: 'academia_student_editor_',
    keys: {
        profile: 'profile_data',
        financial: 'financial_data',
        settings: 'user_settings'
    },
    expiration: 24 * 60 * 60 * 1000 // 24 horas em millisegundos
};

// Configurações de auto-save
export const AUTOSAVE_CONFIG = {
    interval: 30000, // 30 segundos
    enabled: true,
    maxRetries: 3
};

// Mensagens do sistema
export const MESSAGES = {
    loading: {
        default: 'Carregando...',
        student: 'Carregando dados do estudante...',
        saving: 'Salvando alterações...',
        deleting: 'Removendo dados...',
        plans: 'Carregando planos disponíveis...',
        subscription: 'Processando assinatura...'
    },
    success: {
        saved: 'Alterações salvas com sucesso!',
        created: 'Criado com sucesso!',
        updated: 'Atualizado com sucesso!',
        deleted: 'Removido com sucesso!',
        subscriptionCreated: 'Assinatura criada com sucesso!',
        subscriptionCancelled: 'Assinatura cancelada com sucesso!'
    },
    error: {
        generic: 'Ocorreu um erro inesperado',
        network: 'Erro de conexão. Verifique sua internet.',
        validation: 'Existem campos inválidos no formulário',
        notFound: 'Registro não encontrado',
        permission: 'Você não tem permissão para esta ação',
        serverError: 'Erro interno do servidor'
    },
    confirmation: {
        save: 'Salvar as alterações realizadas?',
        delete: 'Tem certeza que deseja remover este registro?',
        cancel: 'Cancelar a operação atual?',
        leave: 'Sair sem salvar as alterações?'
    }
};

// Configurações de formatação
export const FORMAT_CONFIG = {
    currency: {
        locale: 'pt-BR',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    },
    date: {
        locale: 'pt-BR',
        options: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
    },
    phone: {
        mask: '(##) #####-####',
        pattern: /^(\d{2})(\d{5})(\d{4})$/
    },
    cpf: {
        mask: '###.###.###-##',
        pattern: /^(\d{3})(\d{3})(\d{3})(\d{2})$/
    }
};

// Configurações de debounce
export const DEBOUNCE_CONFIG = {
    search: 300,
    validation: 500,
    autosave: 1000,
    api: 200
};

// Limites e restrições
export const LIMITS = {
    fileUpload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    },
    text: {
        name: 100,
        email: 150,
        phone: 20,
        address: 500,
        notes: 1000
    },
    api: {
        requestsPerMinute: 60,
        maxRetries: 3,
        timeout: 30000
    }
};

// Configurações de tema
export const THEME_CONFIG = {
    colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4'
    },
    breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1200px'
    }
};

// Configurações de desenvolvimento
export const DEV_CONFIG = {
    debug: process.env.NODE_ENV === 'development',
    mockApi: false,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    performanceMonitoring: true
};

// Utilitários de exportação
export const UTILS = {
    // Formatar moeda
    formatCurrency: (value) => {
        return new Intl.NumberFormat(FORMAT_CONFIG.currency.locale, {
            style: 'currency',
            currency: FORMAT_CONFIG.currency.currency,
            minimumFractionDigits: FORMAT_CONFIG.currency.minimumFractionDigits,
            maximumFractionDigits: FORMAT_CONFIG.currency.maximumFractionDigits
        }).format(value);
    },

    // Formatar data
    formatDate: (date) => {
        return new Intl.DateTimeFormat(FORMAT_CONFIG.date.locale, FORMAT_CONFIG.date.options).format(new Date(date));
    },

    // Formatar telefone
    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(FORMAT_CONFIG.phone.pattern);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return phone;
    },

    // Formatar CPF
    formatCPF: (cpf) => {
        const cleaned = cpf.replace(/\D/g, '');
        const match = cleaned.match(FORMAT_CONFIG.cpf.pattern);
        if (match) {
            return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
        }
        return cpf;
    },

    // Debounce function
    debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    },

    // Validar email
    isValidEmail: (email) => {
        return VALIDATION_CONFIG.email.pattern.test(email);
    },

    // Validar CPF (algoritmo básico)
    isValidCPF: (cpf) => {
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length !== 11) return false;
        
        // Verificar se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleaned)) return false;
        
        // Algoritmo de validação do CPF
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleaned.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleaned.charAt(10))) return false;
        
        return true;
    },

    // Gerar ID único
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Storage helpers
    setStorage: (key, value, expiration = STORAGE_CONFIG.expiration) => {
        const item = {
            value,
            timestamp: Date.now(),
            expiration
        };
        localStorage.setItem(STORAGE_CONFIG.prefix + key, JSON.stringify(item));
    },

    getStorage: (key) => {
        try {
            const item = localStorage.getItem(STORAGE_CONFIG.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            if (Date.now() - parsed.timestamp > parsed.expiration) {
                localStorage.removeItem(STORAGE_CONFIG.prefix + key);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.error('Erro ao acessar localStorage:', error);
            return null;
        }
    },

    removeStorage: (key) => {
        localStorage.removeItem(STORAGE_CONFIG.prefix + key);
    },

    clearStorage: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_CONFIG.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
};

// Exportar configuração principal
export default {
    API_CONFIG,
    VALIDATION_CONFIG,
    STUDENT_STATUS,
    PAYMENT_STATUS,
    SUBSCRIPTION_STATUS,
    STORAGE_CONFIG,
    AUTOSAVE_CONFIG,
    MESSAGES,
    FORMAT_CONFIG,
    DEBOUNCE_CONFIG,
    LIMITS,
    THEME_CONFIG,
    DEV_CONFIG,
    UTILS
};

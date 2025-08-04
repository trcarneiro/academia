/* ===== CORE CONSTANTS ===== */
/* Following Claude.md isolated modularity principles */

// API Configuration
export const API_CONFIG = {
    BASE_URL: window.location.origin,
    ENDPOINTS: {
        // Students
        STUDENTS: '/api/students',
        STUDENT_BY_ID: '/api/students/:id',
        STUDENTS_SEARCH: '/api/students/search',
        
        // Classes
        CLASSES: '/api/classes',
        CLASS_BY_ID: '/api/classes/:id',
        CLASS_STUDENTS: '/api/classes/:id/students',
        
        // Attendance
        ATTENDANCE: '/api/attendance',
        ATTENDANCE_BY_ID: '/api/attendance/:id',
        ATTENDANCE_STUDENT: '/api/attendance/student/:id',
        ATTENDANCE_CLASS: '/api/attendance/class/:id',
        
        // Financial
        FINANCIAL: '/api/financial',
        FINANCIAL_RESPONSIBLES: '/api/financial/responsibles',
        SUBSCRIPTIONS: '/api/subscriptions',
        
        // System
        HEALTH: '/api/health',
        STATS: '/api/stats',
        SETTINGS: '/api/settings'
    },
    
    // Request configuration
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// UI Configuration
export const UI_CONFIG = {
    // Layout
    SIDEBAR_WIDTH: 280,
    SIDEBAR_COLLAPSED_WIDTH: 60,
    HEADER_HEIGHT: 60,
    HEADER_MOBILE_HEIGHT: 56,
    
    // Breakpoints
    BREAKPOINTS: {
        SM: 640,
        MD: 768,
        LG: 1024,
        XL: 1280,
        XXL: 1536
    },
    
    // Animation durations
    ANIMATIONS: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500
    },
    
    // Z-index scale
    Z_INDEX: {
        DROPDOWN: 1000,
        STICKY: 1020,
        FIXED: 1030,
        MODAL_BACKDROP: 1040,
        MODAL: 1050,
        POPOVER: 1060,
        TOOLTIP: 1070,
        TOAST: 1080
    }
};

// Module configuration
export const MODULE_CONFIG = {
    // Available modules
    MODULES: {
        DASHBOARD: 'dashboard',
        STUDENTS: 'students',
        CLASSES: 'classes',
        ATTENDANCE: 'attendance',
        FINANCIAL: 'financial',
        SUBSCRIPTIONS: 'subscriptions',
        FINANCIAL_RESPONSIBLES: 'financial-responsibles',
        SETTINGS: 'settings'
    },
    
    // Module loading states
    LOADING_STATES: {
        IDLE: 'idle',
        LOADING: 'loading',
        LOADED: 'loaded',
        ERROR: 'error'
    },
    
    // Module priorities (for loading order)
    PRIORITIES: {
        DASHBOARD: 1,
        STUDENTS: 2,
        CLASSES: 3,
        ATTENDANCE: 4,
        FINANCIAL: 5,
        SUBSCRIPTIONS: 6,
        FINANCIAL_RESPONSIBLES: 7,
        SETTINGS: 8
    }
};

// Application states
export const APP_STATES = {
    INITIALIZING: 'initializing',
    READY: 'ready',
    ERROR: 'error',
    OFFLINE: 'offline'
};

// Event types
export const EVENT_TYPES = {
    // App events
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    APP_OFFLINE: 'app:offline',
    APP_ONLINE: 'app:online',
    
    // Navigation events
    NAVIGATION_CHANGE: 'navigation:change',
    SIDEBAR_TOGGLE: 'sidebar:toggle',
    SIDEBAR_COLLAPSE: 'sidebar:collapse',
    
    // Module events
    MODULE_LOAD: 'module:load',
    MODULE_LOADED: 'module:loaded',
    MODULE_ERROR: 'module:error',
    MODULE_ACTIVATE: 'module:activate',
    MODULE_DEACTIVATE: 'module:deactivate',
    
    // Data events
    DATA_LOAD: 'data:load',
    DATA_LOADED: 'data:loaded',
    DATA_ERROR: 'data:error',
    DATA_REFRESH: 'data:refresh',
    
    // UI events
    UI_SHOW_TOAST: 'ui:show-toast',
    UI_HIDE_TOAST: 'ui:hide-toast',
    UI_SHOW_MODAL: 'ui:show-modal',
    UI_HIDE_MODAL: 'ui:hide-modal',
    UI_SHOW_LOADING: 'ui:show-loading',
    UI_HIDE_LOADING: 'ui:hide-loading'
};

// Storage keys
export const STORAGE_KEYS = {
    // Application settings
    APP_SETTINGS: 'krav_academy_settings',
    USER_PREFERENCES: 'krav_academy_user_prefs',
    
    // Navigation state
    SIDEBAR_STATE: 'krav_academy_sidebar_state',
    ACTIVE_MODULE: 'krav_academy_active_module',
    
    // Data cache
    STUDENTS_CACHE: 'krav_academy_students_cache',
    CLASSES_CACHE: 'krav_academy_classes_cache',
    ATTENDANCE_CACHE: 'krav_academy_attendance_cache',
    
    // Session data
    SESSION_DATA: 'krav_academy_session',
    LAST_ACTIVITY: 'krav_academy_last_activity'
};

// Error types
export const ERROR_TYPES = {
    NETWORK: 'network',
    TIMEOUT: 'timeout',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    SERVER: 'server',
    CLIENT: 'client',
    MODULE: 'module',
    DATA: 'data',
    UI: 'ui'
};

// Toast types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info'
};

// Modal sizes
export const MODAL_SIZES = {
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl',
    FULL: 'full'
};

// Loading states
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Date/Time formats
export const DATE_FORMATS = {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD/MM/YYYY HH:mm',
    TIME: 'HH:mm',
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DISPLAY: 'DD/MM/YYYY às HH:mm'
};

// Validation rules
export const VALIDATION_RULES = {
    // General
    REQUIRED: 'required',
    EMAIL: 'email',
    PHONE: 'phone',
    CPF: 'cpf',
    
    // String lengths
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
    
    // Student specific
    STUDENT_CODE_LENGTH: 6,
    STUDENT_NAME_MIN: 2,
    STUDENT_NAME_MAX: 100,
    
    // Class specific
    CLASS_NAME_MIN: 3,
    CLASS_NAME_MAX: 50,
    
    // Password (if needed)
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128
};

// System limits
export const SYSTEM_LIMITS = {
    MAX_STUDENTS: 1000,
    MAX_CLASSES: 50,
    MAX_ATTENDANCE_RECORDS: 10000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_UPLOAD_FILES: 5,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    CACHE_EXPIRY: 15 * 60 * 1000, // 15 minutes
    RETRY_LIMIT: 3,
    PAGINATION_SIZE: 20
};

// Feature flags
export const FEATURE_FLAGS = {
    ENABLE_DARK_MODE: true,
    ENABLE_OFFLINE_MODE: false,
    ENABLE_PUSH_NOTIFICATIONS: false,
    ENABLE_REAL_TIME_UPDATES: false,
    ENABLE_ADVANCED_ANALYTICS: false,
    ENABLE_BULK_OPERATIONS: true,
    ENABLE_EXPORT_FEATURES: true,
    ENABLE_BACKUP_SYSTEM: false,
    ENABLE_AUDIT_LOG: false
};

// Default values
export const DEFAULTS = {
    PAGINATION: {
        PAGE: 1,
        LIMIT: 20,
        MAX_LIMIT: 100
    },
    
    SIDEBAR: {
        COLLAPSED: false,
        MOBILE_OPEN: false
    },
    
    THEME: {
        MODE: 'light',
        PRIMARY_COLOR: '#1e40af',
        ACCENT_COLOR: '#f59e0b'
    },
    
    LOCALE: {
        LANGUAGE: 'pt-BR',
        TIMEZONE: 'America/Sao_Paulo',
        CURRENCY: 'BRL'
    }
};

// Regular expressions
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/,
    CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
    STUDENT_CODE: /^[A-Z0-9]{6}$/,
    NUMERIC: /^\d+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    ALPHA: /^[a-zA-Z]+$/,
    SLUG: /^[a-z0-9-]+$/
};

// Icons mapping
export const ICONS = {
    // Navigation
    DASHBOARD: '📊',
    STUDENTS: '👥',
    CLASSES: '🏫',
    ATTENDANCE: '📋',
    FINANCIAL: '💰',
    SUBSCRIPTIONS: '💳',
    FINANCIAL_RESPONSIBLES: '👨‍👩‍👧‍👦',
    SETTINGS: '⚙️',
    
    // Actions
    ADD: '➕',
    EDIT: '✏️',
    DELETE: '🗑️',
    SAVE: '💾',
    CANCEL: '❌',
    SEARCH: '🔍',
    FILTER: '🔎',
    EXPORT: '📤',
    IMPORT: '📥',
    REFRESH: '🔄',
    
    // Status
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    INFO: 'ℹ️',
    LOADING: '⏳',
    
    // System
    MENU: '☰',
    CLOSE: '✕',
    BACK: '←',
    FORWARD: '→',
    UP: '↑',
    DOWN: '↓',
    
    // Data
    PRESENT: '✓',
    ABSENT: '✗',
    LATE: '⏰',
    PAID: '💵',
    PENDING: '⏳',
    OVERDUE: '⚠️'
};

// System messages
export const MESSAGES = {
    LOADING: 'Carregando...',
    LOADING_MODULE: 'Carregando módulo...',
    LOADING_DATA: 'Carregando dados...',
    SAVE_SUCCESS: 'Salvo com sucesso!',
    SAVE_ERROR: 'Erro ao salvar.',
    DELETE_SUCCESS: 'Removido com sucesso!',
    DELETE_ERROR: 'Erro ao remover.',
    NETWORK_ERROR: 'Erro de conexão.',
    GENERIC_ERROR: 'Ocorreu um erro inesperado.',
    NO_DATA: 'Nenhum dado encontrado.',
    PERMISSION_DENIED: 'Acesso negado.',
    SESSION_EXPIRED: 'Sessão expirada.',
    OFFLINE: 'Você está offline.',
    ONLINE: 'Conexão restabelecida.'
};

// Module metadata
export const MODULE_METADATA = {
    [MODULE_CONFIG.MODULES.DASHBOARD]: {
        title: 'Dashboard',
        icon: ICONS.DASHBOARD,
        description: 'Visão geral do sistema',
        priority: MODULE_CONFIG.PRIORITIES.DASHBOARD,
        requiredPermissions: [],
        dependencies: []
    },
    
    [MODULE_CONFIG.MODULES.STUDENTS]: {
        title: 'Alunos',
        icon: ICONS.STUDENTS,
        description: 'Gestão de alunos',
        priority: MODULE_CONFIG.PRIORITIES.STUDENTS,
        requiredPermissions: ['students.read'],
        dependencies: []
    },
    
    [MODULE_CONFIG.MODULES.CLASSES]: {
        title: 'Turmas',
        icon: ICONS.CLASSES,
        description: 'Gestão de turmas',
        priority: MODULE_CONFIG.PRIORITIES.CLASSES,
        requiredPermissions: ['classes.read'],
        dependencies: []
    },
    
    [MODULE_CONFIG.MODULES.ATTENDANCE]: {
        title: 'Presença',
        icon: ICONS.ATTENDANCE,
        description: 'Controle de presença',
        priority: MODULE_CONFIG.PRIORITIES.ATTENDANCE,
        requiredPermissions: ['attendance.read'],
        dependencies: [MODULE_CONFIG.MODULES.STUDENTS, MODULE_CONFIG.MODULES.CLASSES]
    },
    
    [MODULE_CONFIG.MODULES.FINANCIAL]: {
        title: 'Financeiro',
        icon: ICONS.FINANCIAL,
        description: 'Gestão financeira',
        priority: MODULE_CONFIG.PRIORITIES.FINANCIAL,
        requiredPermissions: ['financial.read'],
        dependencies: [MODULE_CONFIG.MODULES.STUDENTS]
    },
    
    [MODULE_CONFIG.MODULES.SUBSCRIPTIONS]: {
        title: 'Assinaturas',
        icon: ICONS.SUBSCRIPTIONS,
        description: 'Gestão de assinaturas',
        priority: MODULE_CONFIG.PRIORITIES.SUBSCRIPTIONS,
        requiredPermissions: ['subscriptions.read'],
        dependencies: [MODULE_CONFIG.MODULES.STUDENTS]
    },
    
    [MODULE_CONFIG.MODULES.FINANCIAL_RESPONSIBLES]: {
        title: 'Responsáveis Financeiros',
        icon: ICONS.FINANCIAL_RESPONSIBLES,
        description: 'Gestão de responsáveis',
        priority: MODULE_CONFIG.PRIORITIES.FINANCIAL_RESPONSIBLES,
        requiredPermissions: ['financial.read'],
        dependencies: [MODULE_CONFIG.MODULES.STUDENTS]
    },
    
    [MODULE_CONFIG.MODULES.SETTINGS]: {
        title: 'Configurações',
        icon: ICONS.SETTINGS,
        description: 'Configurações do sistema',
        priority: MODULE_CONFIG.PRIORITIES.SETTINGS,
        requiredPermissions: ['settings.read'],
        dependencies: []
    }
};

// Export everything as default for legacy compatibility
export default {
    API_CONFIG,
    UI_CONFIG,
    MODULE_CONFIG,
    APP_STATES,
    EVENT_TYPES,
    STORAGE_KEYS,
    ERROR_TYPES,
    TOAST_TYPES,
    MODAL_SIZES,
    LOADING_STATES,
    DATE_FORMATS,
    VALIDATION_RULES,
    SYSTEM_LIMITS,
    FEATURE_FLAGS,
    DEFAULTS,
    REGEX,
    ICONS,
    MESSAGES,
    MODULE_METADATA
};

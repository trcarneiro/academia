/**
 * Role-Based Access Control (RBAC) for Frontend
 * Controla acesso a módulos baseado no perfil do usuário
 */

const ROLE_PERMISSIONS = {
    'SUPER_ADMIN': ['*'], // Acesso total
    'ADMIN': [
        'dashboard',
        'students',
        'quickEnrollment',
        'crm',
        'packages',
        'activities',
        'lesson-plans',
        'courses',
        'turmas',
        'organizations',
        'units',
        'instructors',
        'instructor-dashboard',
        'classroom-display',
        'checkin-kiosk',
        'agenda',
        'frequency',
        'student-progress',
        'graduation',
        'ai',
        'agents',
        'agent-chat-fullscreen',
        'agent-activity',
        'marketing',
        'import',
        'reports',
        'settings'
    ],
    'MANAGER': [
        'dashboard',
        'students',
        'quickEnrollment',
        'crm',
        'packages',
        'instructors',
        'agenda',
        'frequency',
        'student-progress',
        'reports'
    ],
    'INSTRUCTOR': [
        'dashboard',
        'students',
        'lesson-plans',
        'courses',
        'turmas',
        'instructor-dashboard',
        'classroom-display',
        'checkin-kiosk',
        'agenda',
        'frequency',
        'student-progress',
        'graduation'
    ],
    'STUDENT': [
        'dashboard',
        'student-progress',
        'graduation'
    ]
};

/**
 * Verifica se o usuário tem permissão para acessar um módulo
 * @param {string} userRole - Role do usuário (SUPER_ADMIN, ADMIN, etc.)
 * @param {string} moduleName - Nome do módulo a ser acessado
 * @returns {boolean} - true se tem permissão, false caso contrário
 */
function canAccessModule(userRole, moduleName) {
    if (!userRole) return false;

    const permissions = ROLE_PERMISSIONS[userRole] || [];

    // SUPER_ADMIN tem acesso a tudo
    if (permissions.includes('*')) return true;

    // Verifica se o módulo está na lista de permissões
    return permissions.includes(moduleName);
}

/**
 * Obtém o usuário atual do localStorage
 * @returns {Object|null} - Objeto do usuário ou null
 */
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
    }
}

/**
 * Filtra itens do menu baseado nas permissões do usuário
 * @param {string} userRole - Role do usuário
 * @returns {Array} - Lista de módulos acessíveis
 */
function getAccessibleModules(userRole) {
    if (!userRole) return [];

    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (permissions.includes('*')) {
        // SUPER_ADMIN: retorna todos os módulos
        return Object.keys(ROLE_PERMISSIONS).flatMap(role => ROLE_PERMISSIONS[role]).filter(m => m !== '*');
    }

    return permissions;
}

/**
 * Oculta itens do menu que o usuário não tem permissão
 */
function applyMenuPermissions() {
    const user = getCurrentUser();
    if (!user || !user.role) {
        console.warn('Usuário não autenticado ou sem role definido');
        return;
    }

    const menuItems = document.querySelectorAll('.sidebar li[data-module]');

    menuItems.forEach(item => {
        const moduleName = item.getAttribute('data-module');

        if (!canAccessModule(user.role, moduleName)) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });
}

/**
 * Guard para navegação - verifica permissão antes de navegar
 * @param {string} moduleName - Nome do módulo
 * @param {Function} callback - Função a ser executada se tiver permissão
 */
function guardNavigation(moduleName, callback) {
    const user = getCurrentUser();

    if (!user) {
        console.error('Usuário não autenticado');
        window.location.href = '/login.html';
        return;
    }

    if (!canAccessModule(user.role, moduleName)) {
        console.warn(`Acesso negado ao módulo: ${moduleName}`);

        if (window.app && window.app.showToast) {
            window.app.showToast('Você não tem permissão para acessar este módulo', 'error');
        }

        // Redireciona para dashboard
        if (window.router && window.router.navigateTo) {
            window.router.navigateTo('dashboard');
        }

        return;
    }

    // Usuário tem permissão, executa callback
    if (typeof callback === 'function') {
        callback();
    }
}

/**
 * Verifica se o usuário é admin ou super admin
 * @returns {boolean}
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
}

/**
 * Verifica se o usuário é instrutor
 * @returns {boolean}
 */
function isInstructor() {
    const user = getCurrentUser();
    return user && user.role === 'INSTRUCTOR';
}

/**
 * Verifica se o usuário é aluno
 * @returns {boolean}
 */
function isStudent() {
    const user = getCurrentUser();
    return user && user.role === 'STUDENT';
}

// Exportar funções para uso global
window.RoleGuard = {
    canAccessModule,
    getCurrentUser,
    getAccessibleModules,
    applyMenuPermissions,
    guardNavigation,
    isAdmin,
    isInstructor,
    isStudent,
    ROLE_PERMISSIONS
};

// Aplicar permissões ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Aplicando permissões de menu...');
    applyMenuPermissions();
});

console.log('✅ Role Guard carregado');

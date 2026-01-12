/**
 * Permissions Context
 * 
 * Sistema de controle de permissões para o frontend.
 * Carrega e cacheia permissões do usuário logado e fornece
 * métodos para verificar acesso a módulos e ações.
 * 
 * @module shared/permissions-context
 * @version 1.0.0
 */

(function () {
    'use strict';

    // Evitar re-declaração
    if (window.PermissionsContext) {
        console.log('[Permissions] Context already initialized');
        return;
    }

    // Cache de permissões
    let cachedPermissions = null;
    let cacheExpiry = 0;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * PermissionsContext
     * Gerencia permissões do usuário no frontend
     */
    const PermissionsContext = {

        /**
         * Estado atual das permissões
         */
        _state: {
            role: null,
            permissions: [],
            moduleAccess: {},
            loaded: false,
            loading: false
        },

        /**
         * Inicializa o contexto de permissões
         * Deve ser chamado após login ou no carregamento da página
         */
        async init() {
            if (this._state.loading) {
                // Aguardar carregamento em andamento
                return this.waitForLoad();
            }

            // Verificar cache
            if (cachedPermissions && Date.now() < cacheExpiry) {
                this._state = { ...cachedPermissions, loaded: true, loading: false };
                return this._state;
            }

            this._state.loading = true;

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('[Permissions] No token found, skipping permission load');
                    this._state.loading = false;
                    return null;
                }

                const response = await fetch('/api/auth/permissions', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        console.log('[Permissions] Unauthorized, clearing cache');
                        this.clear();
                        return null;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    this._state = {
                        role: result.data.role,
                        permissions: result.data.permissions || [],
                        moduleAccess: result.data.moduleAccess || {},
                        loaded: true,
                        loading: false
                    };

                    // Cachear
                    cachedPermissions = { ...this._state };
                    cacheExpiry = Date.now() + CACHE_TTL;

                    console.log(`[Permissions] Loaded for role: ${this._state.role}`);

                    // Disparar evento
                    window.dispatchEvent(new CustomEvent('permissions:loaded', {
                        detail: this._state
                    }));

                    return this._state;
                }

            } catch (error) {
                console.error('[Permissions] Error loading permissions:', error);
                this._state.loading = false;
            }

            return null;
        },

        /**
         * Aguarda o carregamento das permissões
         */
        async waitForLoad() {
            if (this._state.loaded) return this._state;

            return new Promise((resolve) => {
                const check = () => {
                    if (this._state.loaded || !this._state.loading) {
                        resolve(this._state);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        },

        /**
         * Limpa o cache de permissões
         */
        clear() {
            cachedPermissions = null;
            cacheExpiry = 0;
            this._state = {
                role: null,
                permissions: [],
                moduleAccess: {},
                loaded: false,
                loading: false
            };
        },

        /**
         * Recarrega permissões do servidor
         */
        async reload() {
            this.clear();
            return this.init();
        },

        // ========================================
        // MÉTODOS DE VERIFICAÇÃO
        // ========================================

        /**
         * Verifica se usuário tem uma permissão específica
         * @param {string} module - Nome do módulo (ex: 'students')
         * @param {string} action - Ação (ex: 'create', 'edit', 'delete', 'view')
         * @returns {boolean}
         */
        can(module, action) {
            if (!this._state.loaded) {
                console.warn('[Permissions] Permissions not loaded yet');
                return false;
            }

            // Super admin pode tudo
            if (this._state.role === 'SUPER_ADMIN') return true;

            // Verificar no moduleAccess
            const modulePerms = this._state.moduleAccess[module];
            if (modulePerms && modulePerms[action]) {
                return true;
            }

            // Verificar na lista de permissions
            return this._state.permissions.some(
                p => p.module === module && p.action === action
            );
        },

        /**
         * Verifica se usuário pode acessar um módulo (qualquer ação)
         * @param {string} module - Nome do módulo
         * @returns {boolean}
         */
        canAccessModule(module) {
            if (!this._state.loaded) return false;
            if (this._state.role === 'SUPER_ADMIN') return true;

            const modulePerms = this._state.moduleAccess[module];
            return modulePerms && Object.values(modulePerms).some(v => v === true);
        },

        /**
         * Retorna o scope de uma permissão
         * @param {string} module 
         * @param {string} action 
         * @returns {'ALL'|'OWN'|'TEAM'|'NONE'}
         */
        getScope(module, action) {
            if (!this._state.loaded) return 'NONE';
            if (this._state.role === 'SUPER_ADMIN') return 'ALL';

            const perm = this._state.permissions.find(
                p => p.module === module && p.action === action
            );

            return perm ? perm.scope : 'NONE';
        },

        /**
         * Verifica se usuário é admin (SUPER_ADMIN ou ADMIN)
         * @returns {boolean}
         */
        isAdmin() {
            return ['SUPER_ADMIN', 'ADMIN'].includes(this._state.role);
        },

        /**
         * Verifica se usuário é super admin
         * @returns {boolean}
         */
        isSuperAdmin() {
            return this._state.role === 'SUPER_ADMIN';
        },

        /**
         * Verifica se usuário é manager ou superior
         * @returns {boolean}
         */
        isManager() {
            return ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(this._state.role);
        },

        /**
         * Verifica se usuário é instrutor
         * @returns {boolean}
         */
        isInstructor() {
            return this._state.role === 'INSTRUCTOR';
        },

        /**
         * Verifica se usuário é aluno
         * @returns {boolean}
         */
        isStudent() {
            return this._state.role === 'STUDENT';
        },

        /**
         * Retorna o role do usuário
         * @returns {string|null}
         */
        getRole() {
            return this._state.role;
        },

        /**
         * Retorna todas as permissões carregadas
         * @returns {Array}
         */
        getPermissions() {
            return this._state.permissions;
        },

        /**
         * Retorna acesso por módulo
         * @returns {Object}
         */
        getModuleAccess() {
            return this._state.moduleAccess;
        },

        // ========================================
        // HELPERS DE UI
        // ========================================

        /**
         * Oculta elementos que o usuário não tem permissão para ver
         * @param {string} module 
         * @param {string} action 
         * @param {string|Element} selector - Seletor CSS ou elemento
         */
        hideIfNoPermission(module, action, selector) {
            const elements = typeof selector === 'string'
                ? document.querySelectorAll(selector)
                : [selector];

            const hasPermission = this.can(module, action);

            elements.forEach(el => {
                if (el) {
                    el.style.display = hasPermission ? '' : 'none';
                }
            });
        },

        /**
         * Desabilita elementos que o usuário não tem permissão
         * @param {string} module 
         * @param {string} action 
         * @param {string|Element} selector
         */
        disableIfNoPermission(module, action, selector) {
            const elements = typeof selector === 'string'
                ? document.querySelectorAll(selector)
                : [selector];

            const hasPermission = this.can(module, action);

            elements.forEach(el => {
                if (el) {
                    el.disabled = !hasPermission;
                    if (!hasPermission) {
                        el.title = 'Você não tem permissão para esta ação';
                        el.classList.add('permission-disabled');
                    }
                }
            });
        },

        /**
         * Aplica permissões em um container
         * Procura por elementos com data-permission="module:action"
         * @param {Element} container 
         */
        applyToContainer(container) {
            const elements = container.querySelectorAll('[data-permission]');

            elements.forEach(el => {
                const permission = el.dataset.permission;
                if (!permission) return;

                const [module, action] = permission.split(':');
                const mode = el.dataset.permissionMode || 'hide'; // 'hide' ou 'disable'

                if (mode === 'disable') {
                    this.disableIfNoPermission(module, action, el);
                } else {
                    this.hideIfNoPermission(module, action, el);
                }
            });
        },

        /**
         * Filtra itens de menu baseado em permissões
         * @param {Array} menuItems - Array de {module, label, icon, ...}
         * @returns {Array} - Items filtrados
         */
        filterMenuItems(menuItems) {
            return menuItems.filter(item => {
                if (!item.module) return true; // Items sem módulo sempre aparecem
                return this.canAccessModule(item.module);
            });
        },

        /**
         * Gera HTML de mensagem de acesso negado
         * @param {string} module 
         * @param {string} action 
         * @returns {string}
         */
        getAccessDeniedHTML(module, action) {
            return `
                <div class="permission-denied-container">
                    <div class="permission-denied-icon">🔒</div>
                    <h3>Acesso Negado</h3>
                    <p>Você não tem permissão para ${this._getActionLabel(action)} em ${this._getModuleLabel(module)}.</p>
                    <p class="permission-denied-hint">Entre em contato com o administrador se precisar de acesso.</p>
                </div>
            `;
        },

        /**
         * Retorna label amigável para ação
         * @private
         */
        _getActionLabel(action) {
            const labels = {
                view: 'visualizar',
                create: 'criar',
                edit: 'editar',
                delete: 'excluir',
                manage: 'gerenciar'
            };
            return labels[action] || action;
        },

        /**
         * Retorna label amigável para módulo
         * @private
         */
        _getModuleLabel(module) {
            const labels = {
                students: 'Alunos',
                instructors: 'Instrutores',
                turmas: 'Turmas',
                courses: 'Cursos',
                packages: 'Pacotes',
                financial: 'Financeiro',
                settings: 'Configurações',
                organizations: 'Organizações',
                users: 'Usuários',
                dashboard: 'Dashboard',
                agenda: 'Agenda',
                reports: 'Relatórios',
                crm: 'CRM',
                marketing: 'Marketing'
            };
            return labels[module] || module;
        }
    };

    // Expor globalmente
    window.PermissionsContext = PermissionsContext;

    // Auto-inicializar removido para evitar condições de corrida com a restauração de sessão
    // A inicialização agora depende dos eventos de autenticação (auth:login)
    /*
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Inicializar somente se houver token
            if (localStorage.getItem('token')) {
                PermissionsContext.init();
            }
        });
    } else {
        if (localStorage.getItem('token')) {
            PermissionsContext.init();
        }
    }
    */

    // Recarregar permissões no login
    window.addEventListener('auth:login', () => {
        PermissionsContext.reload();
    });

    window.addEventListener('auth:session_restored', () => {
        PermissionsContext.reload();
    });

    // Limpar permissões no logout
    window.addEventListener('auth:logout', () => {
        PermissionsContext.clear();
    });

    console.log('[Permissions] Context initialized');

})();

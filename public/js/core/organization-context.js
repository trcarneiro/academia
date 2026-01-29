/**
 * 🏢 Organization Context Manager
 * 
 * Sistema centralizado para gerenciar o contexto de organização ativa.
 * Resolve o problema de múltiplas fontes de verdade para organizationId.
 * 
 * @version 1.0.0
 * @author Academia System
 */

(function () {
  'use strict';

  // Prevent double loading
  if (window.OrganizationContext) {
    console.log('⚠️ OrganizationContext already loaded');
    return;
  }

  const DEV_ORG_ID = 'b03d6cc5-7d58-437e-87a7-834226931d2a'; // Academia Demo

  class OrganizationContext {
    constructor() {
      this.currentOrgId = null;
      this.currentOrgSlug = null;
      this.currentOrgData = null;
      this.userOrganizations = [];
      this.listeners = new Set();
      this.isInitialized = false;

      console.log('🏢 OrganizationContext initialized');
    }

    /**
     * Inicializa o contexto de organização
     * Deve ser chamado após autenticação do usuário
     */
    async initialize(user) {
      if (this.isInitialized) {
        console.log('ℹ️ OrganizationContext already initialized');
        return;
      }

      try {
        console.log('🔄 Initializing organization context...');

        // 1. Buscar organizações do usuário
        await this.loadUserOrganizations(user);

        // 2. Determinar organização ativa (pode ser null se for primeira entrada)
        const activeOrgId = this.resolveActiveOrganization(user);

        // 3. Carregar dados completos da organização (se tiver uma)
        if (activeOrgId) {
          await this.setActiveOrganization(activeOrgId, false); // false = não notificar ainda
        }

        this.isInitialized = true;
        console.log('✅ Organization context initialized:', {
          orgId: this.currentOrgId,
          orgSlug: this.currentOrgSlug,
          totalOrgs: this.userOrganizations.length,
          needsSelection: !activeOrgId || this.userOrganizations.length > 1
        });

        // Notify listeners
        this.notifyListeners('initialized');

      } catch (error) {
        console.error('❌ Failed to initialize organization context:', error);

        // Fallback: usar Smart Defence em desenvolvimento
        const isDevelopment = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
        if (isDevelopment) {
          console.log('🔧 [DEV] Using Smart Defence as fallback');
          this.currentOrgId = DEV_ORG_ID;
          this.currentOrgSlug = 'smart-defence';
          this.persistToStorage();
        }
      }
    }

    /**
     * Carrega todas as organizações do usuário
     */
    async loadUserOrganizations(user) {
      try {
        // Se tiver API client disponível
        if (window.createModuleAPI) {
          const api = window.createModuleAPI('OrganizationContext');
          const response = await api.request('/api/organizations', {
            method: 'GET'
          });

          if (response.success && response.data) {
            this.userOrganizations = response.data;
            console.log(`📋 Loaded ${this.userOrganizations.length} organizations for user`);
            return;
          }
        }

        // Fallback: usar metadados do usuário
        if (user?.user_metadata?.organizationId) {
          this.userOrganizations = [{
            id: user.user_metadata.organizationId,
            name: user.user_metadata.organizationName || 'Minha Academia',
            slug: user.user_metadata.organizationSlug || 'academia',
            isActive: true
          }];
        }

      } catch (error) {
        console.error('❌ Error loading user organizations:', error);
        this.userOrganizations = [];
      }
    }

    /**
     * Resolve qual organização deve ser ativa
     * Prioridade:
     * 1. localStorage (última seleção do usuário)
     * 2. sessionStorage (sessão atual)
     * 3. user_metadata (do Supabase)
     * 4. Primeira organização disponível
     * 5. DEV_ORG_ID (desenvolvimento)
     */
    resolveActiveOrganization(user) {
      // 1. Check localStorage
      const storedOrgId = localStorage.getItem('activeOrganizationId');
      if (storedOrgId) {
        if (this.isValidOrganization(storedOrgId)) {
          console.log('✅ Using organization from localStorage:', storedOrgId);
          return storedOrgId;
        } else {
          // 🛡️ PROTEÇÃO: Limpar organizationId inválida do cache
          console.warn('⚠️ organizationId inválida no localStorage, limpando cache...', storedOrgId);
          localStorage.removeItem('activeOrganizationId');
          // Continua para próxima prioridade
        }
      }

      // 2. Check sessionStorage
      const sessionOrgId = sessionStorage.getItem('activeOrganizationId');
      if (sessionOrgId) {
        if (this.isValidOrganization(sessionOrgId)) {
          console.log('✅ Using organization from sessionStorage:', sessionOrgId);
          return sessionOrgId;
        } else {
          // 🛡️ PROTEÇÃO: Limpar organizationId inválida do cache
          console.warn('⚠️ organizationId inválida no sessionStorage, limpando cache...', sessionOrgId);
          sessionStorage.removeItem('activeOrganizationId');
          // Continua para próxima prioridade
        }
      }

      // 3. Check user metadata
      const userOrgId = user?.user_metadata?.organizationId || user?.app_metadata?.organizationId;
      if (userOrgId && this.isValidOrganization(userOrgId)) {
        console.log('✅ Using organization from user metadata:', userOrgId);
        return userOrgId;
      }

      // 4. First available organization
      if (this.userOrganizations.length > 0) {
        const firstOrg = this.userOrganizations[0];
        console.log('✅ Using first available organization:', firstOrg.id);
        return firstOrg.id;
      }

      // 5. Development fallback
      const isDevelopment = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (isDevelopment) {
        console.log('🔧 [DEV] Using Smart Defence as fallback');
        return DEV_ORG_ID;
      }

      console.warn('⚠️ No organization found for user');
      return null;
    }

    /**
     * Verifica se um organizationId é válido para o usuário
     */
    isValidOrganization(orgId) {
      if (!orgId) return false;

      // Em desenvolvimento, sempre permitir DEV_ORG_ID
      const isDevelopment = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (isDevelopment && orgId === DEV_ORG_ID) {
        return true;
      }

      // Verificar se está na lista de organizações do usuário
      return this.userOrganizations.some(org => org.id === orgId);
    }

    /**
     * Define a organização ativa
     */
    async setActiveOrganization(orgId, notify = true) {
      if (!orgId) {
        console.error('❌ Cannot set null organization');
        return false;
      }

      // Validar se usuário tem acesso
      if (!this.isValidOrganization(orgId)) {
        console.error('❌ User does not have access to organization:', orgId);
        return false;
      }

      try {
        // Buscar dados completos da organização
        const orgData = this.userOrganizations.find(org => org.id === orgId);

        if (!orgData) {
          // Tentar buscar da API
          if (window.createModuleAPI) {
            const api = window.createModuleAPI('OrganizationContext');
            const response = await api.request(`/api/organizations/${orgId}`);

            if (response.success && response.data) {
              this.currentOrgData = response.data;
              this.currentOrgSlug = response.data.slug;
            }
          }
        } else {
          this.currentOrgData = orgData;
          this.currentOrgSlug = orgData.slug;
        }

        this.currentOrgId = orgId;
        this.persistToStorage();

        console.log('✅ Active organization set:', {
          id: this.currentOrgId,
          slug: this.currentOrgSlug,
          name: this.currentOrgData?.name
        });

        // Notify listeners
        if (notify) {
          this.notifyListeners('changed', {
            orgId: this.currentOrgId,
            orgSlug: this.currentOrgSlug,
            orgData: this.currentOrgData
          });
        }

        return true;

      } catch (error) {
        console.error('❌ Error setting active organization:', error);
        return false;
      }
    }

    /**
     * Persiste o estado atual em localStorage e sessionStorage
     */
    persistToStorage() {
      if (this.currentOrgId) {
        localStorage.setItem('activeOrganizationId', this.currentOrgId);
        sessionStorage.setItem('activeOrganizationId', this.currentOrgId);

        // Backward compatibility
        localStorage.setItem('organizationId', this.currentOrgId);
        window.currentOrganizationId = this.currentOrgId;
      }

      if (this.currentOrgSlug) {
        localStorage.setItem('activeOrganizationSlug', this.currentOrgSlug);
        sessionStorage.setItem('activeOrganizationSlug', this.currentOrgSlug);

        // Backward compatibility
        window.currentOrganizationSlug = this.currentOrgSlug;
      }
    }

    /**
     * Retorna o organizationId ativo
     */
    getActiveOrganizationId() {
      return this.currentOrgId;
    }

    /**
     * Retorna o slug da organização ativa
     */
    getActiveOrganizationSlug() {
      return this.currentOrgSlug;
    }

    /**
     * Retorna os dados completos da organização ativa
     */
    getActiveOrganizationData() {
      return this.currentOrgData;
    }

    /**
     * Retorna todas as organizações do usuário
     */
    getUserOrganizations() {
      return this.userOrganizations;
    }

    /**
     * Verifica se o usuário tem múltiplas organizações
     */
    hasMultipleOrganizations() {
      return this.userOrganizations.length > 1;
    }

    /**
     * Registra um listener para mudanças de organização
     */
    addListener(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      }
    }

    /**
     * Notifica todos os listeners
     */
    notifyListeners(event, data = {}) {
      this.listeners.forEach(callback => {
        try {
          callback({
            event,
            orgId: this.currentOrgId,
            orgSlug: this.currentOrgSlug,
            orgData: this.currentOrgData,
            ...data
          });
        } catch (error) {
          console.error('❌ Error in organization listener:', error);
        }
      });

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('organization:changed', {
        detail: {
          event,
          orgId: this.currentOrgId,
          orgSlug: this.currentOrgSlug,
          orgData: this.currentOrgData,
          ...data
        }
      }));
    }

    /**
     * Limpa o contexto de organização (usado no logout)
     */
    clear() {
      this.currentOrgId = null;
      this.currentOrgSlug = null;
      this.currentOrgData = null;
      this.userOrganizations = [];
      this.isInitialized = false;

      // Clear storage
      ['activeOrganizationId', 'activeOrganizationSlug', 'organizationId'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear window globals
      delete window.currentOrganizationId;
      delete window.currentOrganizationSlug;

      console.log('🧹 Organization context cleared');
      this.notifyListeners('cleared');
    }

    /**
     * Helper para usar em API calls
     * Retorna um objeto com headers corretos
     */
    getApiHeaders() {
      return {
        'X-Organization-Id': this.currentOrgId || '',
        'X-Organization-Slug': this.currentOrgSlug || ''
      };
    }
  }

  // Create singleton instance
  window.OrganizationContext = new OrganizationContext();

  // Expose helper function
  window.getOrganizationId = () => window.OrganizationContext.getActiveOrganizationId();
  window.getOrganizationSlug = () => window.OrganizationContext.getActiveOrganizationSlug();
  window.getOrganizationData = () => window.OrganizationContext.getActiveOrganizationData();

  console.log('✅ OrganizationContext loaded globally');

})();

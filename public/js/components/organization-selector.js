/**
 * 🏢 Organization Selector Component
 * 
 * Componente de seleção de organização que aparece no header
 * Permite ao usuário trocar entre organizações quando tem acesso a múltiplas
 * 
 * @version 1.0.0
 */

(function() {
  'use strict';

  if (window.OrganizationSelector) {
    console.log('⚠️ OrganizationSelector already loaded');
    return;
  }

  class OrganizationSelector {
    constructor() {
      this.container = null;
      this.isOpen = false;
      this.unsubscribe = null;
    }

    /**
     * Renderiza o seletor no header
     */
    render(containerElement) {
      if (!containerElement) {
        console.error('❌ OrganizationSelector: Container element required');
        return;
      }

      this.container = containerElement;
      
      // Aguardar OrganizationContext estar inicializado
      const checkContext = setInterval(() => {
        if (window.OrganizationContext?.isInitialized) {
          clearInterval(checkContext);
          this.renderSelector();
          this.setupListeners();
        }
      }, 100);

      // Timeout após 5 segundos
      setTimeout(() => clearInterval(checkContext), 5000);
    }

    /**
     * Renderiza o HTML do seletor
     */
    renderSelector() {
      const context = window.OrganizationContext;
      const organizations = context.getUserOrganizations();
      const activeOrg = context.getActiveOrganizationData();
      const hasMultiple = context.hasMultipleOrganizations();

      // Se usuário tem apenas uma organização, mostrar nome sem dropdown
      if (!hasMultiple || organizations.length === 0) {
        this.container.innerHTML = `
          <div class="org-selector-single">
            <span class="org-icon">🏢</span>
            <span class="org-name">${activeOrg?.name || 'Carregando...'}</span>
          </div>
        `;
        return;
      }

      // Usuário tem múltiplas organizações - mostrar dropdown
      this.container.innerHTML = `
        <div class="org-selector-dropdown">
          <button class="org-selector-trigger" id="org-selector-trigger" type="button">
            <span class="org-icon">🏢</span>
            <span class="org-name">${activeOrg?.name || 'Selecionar Organização'}</span>
            <svg class="org-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <div class="org-selector-menu" id="org-selector-menu" style="display: none;">
            <div class="org-menu-header">
              <span class="org-menu-title">Minhas Organizações</span>
              <span class="org-menu-count">${organizations.length} total</span>
            </div>
            <ul class="org-menu-list">
              ${organizations.map(org => `
                <li class="org-menu-item ${org.id === activeOrg?.id ? 'active' : ''}" data-org-id="${org.id}">
                  <div class="org-item-info">
                    <span class="org-item-name">${org.name}</span>
                    <span class="org-item-slug">${org.slug}</span>
                  </div>
                  ${org.id === activeOrg?.id ? '<span class="org-item-check">✓</span>' : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;

      this.setupDropdownBehavior();
    }

    /**
     * Configura comportamento do dropdown
     */
    setupDropdownBehavior() {
      const trigger = document.getElementById('org-selector-trigger');
      const menu = document.getElementById('org-selector-menu');
      
      if (!trigger || !menu) return;

      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });

      // Selecionar organização
      menu.querySelectorAll('.org-menu-item').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const orgId = item.dataset.orgId;
          await this.selectOrganization(orgId);
        });
      });

      // Fechar ao clicar fora
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.container.contains(e.target)) {
          this.closeDropdown();
        }
      });
    }

    /**
     * Toggle dropdown
     */
    toggleDropdown() {
      const menu = document.getElementById('org-selector-menu');
      if (!menu) return;

      this.isOpen = !this.isOpen;
      menu.style.display = this.isOpen ? 'block' : 'none';
      
      const trigger = document.getElementById('org-selector-trigger');
      if (trigger) {
        trigger.classList.toggle('open', this.isOpen);
      }
    }

    /**
     * Fecha dropdown
     */
    closeDropdown() {
      const menu = document.getElementById('org-selector-menu');
      if (menu) {
        menu.style.display = 'none';
        this.isOpen = false;
        
        const trigger = document.getElementById('org-selector-trigger');
        if (trigger) {
          trigger.classList.remove('open');
        }
      }
    }

    /**
     * Seleciona uma organização
     */
    async selectOrganization(orgId) {
      if (!orgId) return;

      const context = window.OrganizationContext;
      
      // Mostrar loading
      const trigger = document.getElementById('org-selector-trigger');
      if (trigger) {
        trigger.classList.add('loading');
      }

      try {
        // Mudar organização
        const success = await context.setActiveOrganization(orgId);
        
        if (success) {
          console.log('✅ Organization changed successfully');
          
          // Fechar dropdown
          this.closeDropdown();
          
          // Recarregar página para aplicar novo contexto
          // TODO: Implementar reload suave apenas dos módulos afetados
          window.location.reload();
        } else {
          console.error('❌ Failed to change organization');
          alert('Erro ao trocar organização. Tente novamente.');
        }
      } catch (error) {
        console.error('❌ Error changing organization:', error);
        alert('Erro ao trocar organização. Tente novamente.');
      } finally {
        if (trigger) {
          trigger.classList.remove('loading');
        }
      }
    }

    /**
     * Configura listeners para mudanças de organização
     */
    setupListeners() {
      // Escutar mudanças de organização
      this.unsubscribe = window.OrganizationContext.addListener((event) => {
        console.log('🔄 Organization changed:', event);
        
        // Re-renderizar seletor
        if (event.event === 'changed' || event.event === 'initialized') {
          this.renderSelector();
        }
      });
    }

    /**
     * Destruir componente
     */
    destroy() {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // Export globally
  window.OrganizationSelector = OrganizationSelector;

  // Auto-initialize if container exists
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('organization-selector-container');
    if (container) {
      const selector = new OrganizationSelector();
      selector.render(container);
      window.orgSelector = selector;
    }
  });

  console.log('✅ OrganizationSelector component loaded');

})();

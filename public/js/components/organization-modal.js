/**
 * 🏢 Organization Selection Modal
 * 
 * Modal que aparece na primeira entrada ou quando usuário tem múltiplas organizações
 * Força seleção explícita antes de acessar o sistema
 * 
 * @version 1.0.0
 */

(function() {
  'use strict';

  if (window.OrganizationModal) {
    console.log('⚠️ OrganizationModal already loaded');
    return;
  }

  class OrganizationModal {
    constructor() {
      this.modal = null;
      this.isOpen = false;
      this.organizations = [];
      this.onSelect = null;
    }

    /**
     * Verifica se deve mostrar o modal
     * @returns {boolean}
     */
    shouldShow() {
      const context = window.OrganizationContext;
      if (!context || !context.isInitialized) return false;

      const organizations = context.getUserOrganizations();
      const hasActiveOrg = context.getActiveOrganizationId();
      const selectionCompleted = localStorage.getItem('organizationSelectionCompleted');

      // Não mostrar se já foi completado e tem apenas 1 organização
      if (selectionCompleted === 'true' && organizations.length === 1) {
        return false;
      }

      // Mostrar se:
      // 1. Não tem organização ativa (primeira entrada absoluta)
      if (!hasActiveOrg) {
        return true;
      }

      // 2. Tem múltiplas organizações e seleção nunca foi confirmada explicitamente
      if (organizations.length > 1 && selectionCompleted !== 'true') {
        return true;
      }

      return false;
    }

    /**
     * Mostra o modal de seleção
     * @param {Function} callback - Callback após seleção
     */
    async show(callback) {
      const context = window.OrganizationContext;
      if (!context || !context.isInitialized) {
        console.error('❌ OrganizationContext not initialized');
        return;
      }

      this.organizations = context.getUserOrganizations();
      this.onSelect = callback;

      // Criar modal se não existir
      if (!this.modal) {
        this.createModal();
      }

      // Renderizar lista de organizações
      this.renderOrganizations();

      // Mostrar modal
      this.modal.classList.add('active');
      this.isOpen = true;

      // Prevenir fechar com ESC ou clicando fora (seleção obrigatória)
      document.body.style.overflow = 'hidden';

      console.log('✅ Organization selection modal opened');
    }

    /**
     * Cria estrutura HTML do modal
     */
    createModal() {
      const modalHTML = `
        <div class="org-modal-overlay">
          <div class="org-modal-container">
            <div class="org-modal-header">
              <div class="org-modal-icon">🏢</div>
              <h2 class="org-modal-title">Selecione sua Organização</h2>
              <p class="org-modal-subtitle">
                ${this.organizations.length === 1 
                  ? 'Confirme a organização que deseja acessar' 
                  : 'Você tem acesso a múltiplas organizações. Selecione uma para continuar.'}
              </p>
            </div>

            <div class="org-modal-body">
              <div class="org-modal-list" id="org-modal-list">
                <!-- Organizações serão renderizadas aqui -->
              </div>
            </div>

            <div class="org-modal-footer">
              <p class="org-modal-help">
                💡 Você pode trocar de organização a qualquer momento clicando no seletor no header.
              </p>
            </div>
          </div>
        </div>
      `;

      // Adicionar ao body
      const modalElement = document.createElement('div');
      modalElement.className = 'org-modal';
      modalElement.id = 'organization-modal';
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement);

      this.modal = modalElement;
    }

    /**
     * Renderiza lista de organizações
     */
    renderOrganizations() {
      const listContainer = document.getElementById('org-modal-list');
      if (!listContainer) return;

      listContainer.innerHTML = this.organizations.map(org => `
        <div class="org-modal-card" data-org-id="${org.id}">
          <div class="org-modal-card-icon">🏢</div>
          <div class="org-modal-card-content">
            <h3 class="org-modal-card-title">${org.name}</h3>
            <p class="org-modal-card-slug">${org.slug}</p>
            ${org.city ? `<p class="org-modal-card-location">📍 ${org.city}, ${org.state}</p>` : ''}
          </div>
          <div class="org-modal-card-arrow">→</div>
        </div>
      `).join('');

      // Adicionar eventos de clique
      listContainer.querySelectorAll('.org-modal-card').forEach(card => {
        card.addEventListener('click', async () => {
          const orgId = card.dataset.orgId;
          await this.selectOrganization(orgId, card);
        });

        // Adicionar efeito hover
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateX(8px)';
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateX(0)';
        });
      });
    }

    /**
     * Seleciona uma organização
     * @param {string} orgId 
     * @param {HTMLElement} cardElement 
     */
    async selectOrganization(orgId, cardElement) {
      if (!orgId) return;

      try {
        // Adicionar estado de loading no card
        cardElement.classList.add('loading');
        const arrow = cardElement.querySelector('.org-modal-card-arrow');
        if (arrow) {
          arrow.textContent = '⏳';
        }

        // Desabilitar todos os outros cards
        document.querySelectorAll('.org-modal-card').forEach(card => {
          if (card !== cardElement) {
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
          }
        });

        // Setar organização ativa
        const context = window.OrganizationContext;
        const success = await context.setActiveOrganization(orgId);

        if (success) {
          console.log('✅ Organization selected:', orgId);

          // Marcar seleção como completa
          localStorage.setItem('organizationSelectionCompleted', 'true');

          // Adicionar classe de sucesso
          cardElement.classList.remove('loading');
          cardElement.classList.add('selected');
          if (arrow) {
            arrow.textContent = '✓';
          }

          // Aguardar animação
          await new Promise(resolve => setTimeout(resolve, 500));

          // Fechar modal
          this.close();

          // Executar callback
          if (this.onSelect) {
            this.onSelect(orgId);
          }

          // Recarregar página para aplicar novo contexto
          setTimeout(() => {
            window.location.reload();
          }, 300);

        } else {
          console.error('❌ Failed to select organization');
          
          // Remover loading e reabilitar
          cardElement.classList.remove('loading');
          document.querySelectorAll('.org-modal-card').forEach(card => {
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
          });
          if (arrow) {
            arrow.textContent = '→';
          }

          alert('Erro ao selecionar organização. Tente novamente.');
        }

      } catch (error) {
        console.error('❌ Error selecting organization:', error);
        
        // Remover loading
        cardElement.classList.remove('loading');
        document.querySelectorAll('.org-modal-card').forEach(card => {
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
        });
        
        alert('Erro ao selecionar organização. Tente novamente.');
      }
    }

    /**
     * Fecha o modal
     */
    close() {
      if (this.modal) {
        this.modal.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = 'auto';
        console.log('✅ Organization modal closed');
      }
    }

    /**
     * Remove o modal do DOM
     */
    destroy() {
      if (this.modal) {
        this.modal.remove();
        this.modal = null;
        this.isOpen = false;
        document.body.style.overflow = 'auto';
      }
    }
  }

  // Expor globalmente
  window.OrganizationModal = OrganizationModal;
  console.log('✅ OrganizationModal component loaded');

})();

/**
 * Dashboard Widget for Agent Interactions
 * Shows agent reports, suggestions, and permission requests
 */

// Prevent re-declaration
if (typeof window.AgentDashboardWidget !== 'undefined') {
    console.log('✅ Agent Dashboard Widget already loaded');
} else {

const AgentDashboardWidget = {
    container: null,
    moduleAPI: null,
    interactions: [],
    pendingPermissions: [],
    refreshInterval: null,
    
    async init(containerId = 'agent-dashboard-widget') {
        console.log('🚀 Initializing Agent Dashboard Widget...');
        
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('❌ Widget container not found:', containerId);
            return;
        }
        
        await this.initializeAPI();
        await this.loadInteractions();
        this.render();
        this.setupEvents();
        this.startAutoRefresh();
        
        console.log('✅ Agent Dashboard Widget initialized');
    },
    
    async initializeAPI() {
        // Wait for API client to be available
        await new Promise((resolve) => {
            const check = () => {
                if (window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
        
        this.moduleAPI = window.createModuleAPI('AgentWidget');
    },
    
    async loadInteractions() {
        try {
            const response = await this.moduleAPI.request('/api/agents/orchestrator/interactions', {
                method: 'GET'
            });
            
            if (response.success) {
                this.interactions = response.data.interactions || [];
                this.pendingPermissions = response.data.pendingPermissions || [];
            }
        } catch (error) {
            console.error('❌ Error loading interactions:', error);
        }
    },
    
    render() {
        if (!this.container) return;
        
        const hasPending = this.pendingPermissions.length > 0;
        const recentInteractions = this.interactions.slice(0, 5);
        
        this.container.innerHTML = `
            <div class="widget-agent-interactions">
                <!-- Widget Header -->
                <div class="widget-header">
                    <h3>🤖 Assistentes IA</h3>
                    ${hasPending ? `<span class="badge-alert pulse">${this.pendingPermissions.length} pendente(s)</span>` : ''}
                </div>
                
                <!-- Pending Permissions -->
                ${this.renderPendingPermissions()}
                
                <!-- Recent Interactions -->
                ${this.renderRecentInteractions(recentInteractions)}
                
                <!-- Widget Footer -->
                <div class="widget-footer">
                    <button class="btn-link" onclick="window.agentDashboardWidget.handleAction('view-all')">
                        Ver todas as interações →
                    </button>
                </div>
            </div>
        `;
    },
    
    renderPendingPermissions() {
        if (this.pendingPermissions.length === 0) {
            return '';
        }
        
        return `
            <div class="permissions-section">
                <h4>⚠️ Aguardando Aprovação</h4>
                ${this.pendingPermissions.map(perm => `
                    <div class="permission-card">
                        <div class="permission-header">
                            <span class="agent-icon">${this.getAgentIcon(perm.agentType)}</span>
                            <strong>${perm.agentName}</strong>
                            <span class="time-ago">${this.formatTimeAgo(perm.createdAt)}</span>
                        </div>
                        <p class="permission-action">${perm.action}</p>
                        <div class="permission-actions">
                            <button class="btn-approve" onclick="window.agentDashboardWidget.handlePermission('${perm.id}', 'approve')">
                                ✅ Aprovar
                            </button>
                            <button class="btn-deny" onclick="window.agentDashboardWidget.handlePermission('${perm.id}', 'deny')">
                                ❌ Recusar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    renderRecentInteractions(interactions) {
        if (interactions.length === 0) {
            return `
                <div class="empty-state">
                    <p>Nenhuma interação recente com agentes</p>
                    <button class="btn-secondary" onclick="window.location.hash = '#agents'">
                        Gerenciar Agentes
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="interactions-section">
                <h4>📊 Atividade Recente</h4>
                <div class="interactions-list">
                    ${interactions.map(int => this.renderInteractionItem(int)).join('')}
                </div>
            </div>
        `;
    },
    
    renderInteractionItem(interaction) {
        const typeConfig = {
            'REPORT': { icon: '📋', class: 'info' },
            'SUGGESTION': { icon: '💡', class: 'warning' },
            'REQUEST': { icon: '❓', class: 'primary' },
            'ERROR': { icon: '❌', class: 'danger' }
        };
        
        const config = typeConfig[interaction.type] || { icon: '📝', class: 'default' };
        
        return `
            <div class="interaction-item ${config.class}">
                <div class="interaction-icon">${config.icon}</div>
                <div class="interaction-content">
                    <div class="interaction-header">
                        <strong>${interaction.agentName}</strong>
                        <span class="time-ago">${this.formatTimeAgo(interaction.createdAt)}</span>
                    </div>
                    <p class="interaction-message">${interaction.message}</p>
                    ${interaction.action ? `
                        <button class="btn-action-link" onclick="window.agentDashboardWidget.handleInteractionAction('${interaction.id}')">
                            ${interaction.action.label || 'Ver detalhes'} →
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    setupEvents() {
        // Events are handled via onclick in HTML
    },
    
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(async () => {
            await this.loadInteractions();
            this.render();
        }, 30000);
    },
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },
    
    async handlePermission(permissionId, action) {
        try {
            const approved = action === 'approve';
            
            const response = await this.moduleAPI.request(`/api/agents/orchestrator/permissions/${permissionId}`, {
                method: 'PATCH',
                body: JSON.stringify({ approved })
            });
            
            if (response.success) {
                window.app?.showToast?.(
                    approved ? '✅ Permissão aprovada' : '❌ Permissão recusada',
                    'success'
                );
                
                await this.loadInteractions();
                this.render();
            } else {
                throw new Error(response.message || 'Falha ao processar permissão');
            }
        } catch (error) {
            console.error('❌ Error handling permission:', error);
            window.app?.handleError?.(error, { module: 'agent-widget', context: 'permission' });
        }
    },
    
    handleAction(action) {
        switch(action) {
            case 'view-all':
                window.location.hash = '#agents';
                break;
            default:
                console.warn('⚠️ Unknown action:', action);
        }
    },
    
    handleInteractionAction(interactionId) {
        console.log('🔍 View interaction details:', interactionId);
        // TODO: Navigate to detailed view or show modal
        window.location.hash = `#agents/interaction/${interactionId}`;
    },
    
    getAgentIcon(type) {
        const icons = {
            'ADMINISTRATIVE': '🔧',
            'MARKETING': '📧',
            'PEDAGOGICAL': '📚',
            'FINANCIAL': '💳',
            'SUPPORT': '🎧'
        };
        return icons[type] || '🤖';
    },
    
    formatTimeAgo(date) {
        if (!date) return '';
        
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        const intervals = {
            ano: 31536000,
            mês: 2592000,
            semana: 604800,
            dia: 86400,
            hora: 3600,
            minuto: 60
        };
        
        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);
            if (interval >= 1) {
                return `há ${interval} ${name}${interval > 1 ? 's' : ''}`;
            }
        }
        
        return 'agora';
    }
};

// Export to global
window.agentDashboardWidget = AgentDashboardWidget;
window.AgentDashboardWidget = AgentDashboardWidget;

} // end if

/**
 * Phase 1: Google Ads Real-time Sync Dashboard - Implementation Guide
 * 
 * Arquivo: public/js/modules/crm/index.js
 * Inserir os seguintes métodos antes da seção de EVENT SETUP (linha ~2275)
 * 
 * ⚠️ INSTRUÇÕES:
 * 1. Copiar os métodos abaixo
 * 2. Colar após a linha 1920 (método loadSyncedCampaigns) 
 * 3. Adicionar a chamada em renderSettings() (linha ~1368, após "<!-- CSV Import Section -->")
 * 4. Testar no navegador: http://localhost:3000/#/crm/settings
 */

// ========================================================================
// PHASE 1: GOOGLE ADS SYNC DASHBOARD
// ========================================================================

/**
 * Render Google Ads Sync Status Dashboard
 * Shows: Last sync time, campaigns/keywords/conversions synced, sync stats
 */
renderSyncStatusDashboard() {
    return `
        <!-- Google Ads Sync Status Section -->
        <div class="data-card-premium">
            <div class="card-header">
                <h2><i class="fas fa-sync-alt"></i> Google Ads Sync Status</h2>
                <div id="sync-status-badge">
                    <span class="badge badge-info" id="sync-badge-text">
                        <i class="fas fa-clock"></i> Carregando...
                    </span>
                </div>
            </div>

            <div class="sync-status-container">
                <!-- Sync Metrics -->
                <div class="sync-metrics-grid">
                    <div class="sync-metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-label">Campanhas Sincronizadas</div>
                            <div class="metric-value" id="campaigns-synced-count">0</div>
                            <div class="metric-time" id="campaigns-last-sync">Nunca</div>
                        </div>
                    </div>

                    <div class="sync-metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-key"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-label">Palavras-chave Sincronizadas</div>
                            <div class="metric-value" id="keywords-synced-count">0</div>
                            <div class="metric-time" id="keywords-last-sync">Nunca</div>
                        </div>
                    </div>

                    <div class="sync-metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-label">Conversões Enviadas</div>
                            <div class="metric-value" id="conversions-synced-count">0</div>
                            <div class="metric-time" id="conversions-last-sync">Nunca</div>
                        </div>
                    </div>

                    <div class="sync-metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-label">Última Sincronização</div>
                            <div class="metric-value" id="last-sync-time">--</div>
                            <div class="metric-time" id="sync-status-text">Nunca sincronizado</div>
                        </div>
                    </div>
                </div>

                <!-- Sync Actions -->
                <div class="sync-actions">
                    <button id="btn-manual-sync" class="btn-primary" onclick="crm.manualSyncGoogleAds()">
                        <i class="fas fa-sync"></i>
                        Sincronizar Agora
                    </button>
                    <button class="btn-secondary" onclick="crm.viewSyncHistory()">
                        <i class="fas fa-history"></i>
                        Ver Histórico
                    </button>
                    <label class="checkbox-container">
                        <input type="checkbox" id="auto-sync-enabled" onchange="crm.toggleAutoSync()">
                        <span>Auto-sync a cada 6 horas</span>
                    </label>
                </div>

                <!-- Sync Progress -->
                <div id="sync-progress-container" style="display: none;">
                    <div class="sync-progress">
                        <div class="progress-item">
                            <span>Sincronizando campanhas...</span>
                            <div class="progress-bar">
                                <div id="campaigns-progress" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="progress-item">
                            <span>Sincronizando palavras-chave...</span>
                            <div class="progress-bar">
                                <div id="keywords-progress" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="progress-item">
                            <span>Enviando conversões...</span>
                            <div class="progress-bar">
                                <div id="conversions-progress" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Campaign Performance (Top 5 by ROI) -->
                <div id="campaigns-performance-section" style="display: none;">
                    <h3><i class="fas fa-chart-bar"></i> Top 5 Campanhas por ROI</h3>
                    <div id="campaigns-roi-table"></div>
                </div>
            </div>
        </div>
    `;
},

/**
 * Load sync status data from backend
 */
async loadSyncStatus() {
    try {
        const response = await this.moduleAPI.request('/api/crm/google-ads/sync-status');
        
        if (!response.success) {
            console.warn('Failed to load sync status:', response.message);
            return null;
        }

        const data = response.data || {};
        
        // Update UI with sync data
        this.updateSyncStatusUI(data);
        return data;
    } catch (error) {
        console.error('Error loading sync status:', error);
        return null;
    }
},

/**
 * Update sync status UI
 */
updateSyncStatusUI(syncData) {
    // Update metric cards
    const campaignsSynced = syncData.campaignsSynced || 0;
    const keywordsSynced = syncData.keywordsSynced || 0;
    const conversionsSynced = syncData.conversionsSynced || 0;
    const lastSyncTime = syncData.lastSyncTime;
    const autoSyncEnabled = syncData.autoSyncEnabled || false;

    // Campaigns
    document.getElementById('campaigns-synced-count').textContent = campaignsSynced;
    if (syncData.campaignsLastSync) {
        document.getElementById('campaigns-last-sync').textContent = 
            this.formatTimeAgo(new Date(syncData.campaignsLastSync));
    }

    // Keywords
    document.getElementById('keywords-synced-count').textContent = keywordsSynced;
    if (syncData.keywordsLastSync) {
        document.getElementById('keywords-last-sync').textContent = 
            this.formatTimeAgo(new Date(syncData.keywordsLastSync));
    }

    // Conversions
    document.getElementById('conversions-synced-count').textContent = conversionsSynced;
    if (syncData.conversionsLastSync) {
        document.getElementById('conversions-last-sync').textContent = 
            this.formatTimeAgo(new Date(syncData.conversionsLastSync));
    }

    // Last sync
    if (lastSyncTime) {
        document.getElementById('last-sync-time').textContent = this.formatTime(new Date(lastSyncTime));
        document.getElementById('sync-status-text').textContent = 
            `Há ${this.formatTimeAgo(new Date(lastSyncTime))}`;
        
        // Update badge
        const badge = document.getElementById('sync-badge-text');
        badge.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Sincronizado`;
    } else {
        document.getElementById('sync-badge-text').innerHTML = 
            `<i class="fas fa-exclamation-circle" style="color: #f59e0b;"></i> Nunca sincronizado`;
    }

    // Auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync-enabled');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.checked = autoSyncEnabled;
    }

    // Load top campaigns by ROI
    if (syncData.topCampaigns && syncData.topCampaigns.length > 0) {
        this.renderTopCampaignsByROI(syncData.topCampaigns);
    }
},

/**
 * Manual sync trigger
 */
async manualSyncGoogleAds() {
    try {
        const btn = document.getElementById('btn-manual-sync');
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';

        // Show progress container
        const progressContainer = document.getElementById('sync-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }

        // Call backend sync endpoint
        const response = await this.moduleAPI.request('/api/crm/google-ads/sync', {
            method: 'POST'
        });

        if (response.success) {
            this.showNotification('✅ Sincronização concluída com sucesso!', 'success');
            
            // Reload sync status
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s for DB
            await this.loadSyncStatus();
        } else {
            this.showNotification(
                `❌ Erro na sincronização: ${response.message}`,
                'error'
            );
        }
    } catch (error) {
        console.error('Error during manual sync:', error);
        this.showNotification('❌ Erro ao sincronizar', 'error');
    } finally {
        const btn = document.getElementById('btn-manual-sync');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync"></i> Sincronizar Agora';
        }
        
        const progressContainer = document.getElementById('sync-progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }
},

/**
 * Toggle auto-sync
 */
async toggleAutoSync() {
    try {
        const checkbox = document.getElementById('auto-sync-enabled');
        const enabled = checkbox.checked;

        const response = await this.moduleAPI.request('/api/crm/google-ads/auto-sync', {
            method: 'POST',
            body: JSON.stringify({ enabled })
        });

        if (!response.success) {
            checkbox.checked = !enabled; // Revert
            this.showNotification(
                `Erro ao ${enabled ? 'ativar' : 'desativar'} auto-sync`,
                'error'
            );
        }
    } catch (error) {
        console.error('Error toggling auto-sync:', error);
        this.showNotification('Erro ao alterar auto-sync', 'error');
    }
},

/**
 * Render top campaigns by ROI
 */
renderTopCampaignsByROI(campaigns) {
    const section = document.getElementById('campaigns-performance-section');
    if (!section) return;

    section.style.display = 'block';
    const table = document.getElementById('campaigns-roi-table');

    if (campaigns.length === 0) {
        table.innerHTML = '<p class="empty-state">Nenhuma campanha para exibir</p>';
        return;
    }

    table.innerHTML = `
        <table class="data-table campaigns-roi-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Campanha</th>
                    <th>Impressões</th>
                    <th>Cliques</th>
                    <th>Custo</th>
                    <th>Conversões</th>
                    <th>ROI</th>
                </tr>
            </thead>
            <tbody>
                ${campaigns.map((c, idx) => {
                    const roiClass = c.roi > 100 ? 'roi-positive' : (c.roi > 0 ? 'roi-neutral' : 'roi-negative');
                    return `
                        <tr>
                            <td>${idx + 1}</td>
                            <td><strong>${c.name}</strong></td>
                            <td>${this.formatNumber(c.impressions || 0)}</td>
                            <td>${this.formatNumber(c.clicks || 0)}</td>
                            <td>R$ ${(c.cost || 0).toFixed(2)}</td>
                            <td>${this.formatNumber(c.conversions || 0)}</td>
                            <td><span class="badge ${roiClass}">${c.roi?.toFixed(1) || 0}%</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
},

/**
 * View sync history
 */
viewSyncHistory() {
    this.showNotification('📋 Histórico de sincronizações (em desenvolvimento)', 'info');
    // TODO: Implementar modal com histórico de syncs
},

/**
 * Format time ago (e.g., "2 hours ago")
 */
formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // segundos
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return date.toLocaleDateString('pt-BR');
},

/**
 * Format time (e.g., "16/10/2025 14:30")
 */
formatTime(date) {
    return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
},

/**
 * Format number with thousands separator
 */
formatNumber(num) {
    return num.toLocaleString('pt-BR');
},

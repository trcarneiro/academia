(function() {
    'use strict';
    
    // Module state
    let currentSettings = {};
    let isDirty = false;
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeSettingsModule();
    });
    
    // Module initialization
    function initializeSettingsModule() {
        console.log('⚙️ Initializing Settings Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load settings if container exists
            if (document.getElementById('settings-container')) {
                loadSettings();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing settings module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Save button
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSettings);
        }
        
        // Reset button
        const resetBtn = document.getElementById('resetSettingsBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetSettings);
        }
        
        // Theme change handler
        document.addEventListener('change', function(e) {
            if (e.target.id === 'theme') {
                applyTheme(e.target.value);
            }
            
            // Mark as dirty when any form field changes
            if (e.target.closest('#settings-container')) {
                isDirty = true;
                updateSaveButtonState();
            }
        });
        
        // Form input handlers
        document.addEventListener('input', function(e) {
            if (e.target.closest('#settings-container')) {
                isDirty = true;
                updateSaveButtonState();
            }
        });
        
        // Warning before leaving with unsaved changes
        window.addEventListener('beforeunload', function(e) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
            }
        });
    }
    
    // ==========================================
    // SETTINGS FUNCTIONS
    // ==========================================
    
    function loadSettings() {
        console.log('⚙️ Loading settings data...');
        fetchSettingsData();
    }
    
    function renderSettings(settings) {
        const container = document.getElementById('settings-container');
        if (!container) {
            console.warn('Settings container not found');
            return;
        }
        
        currentSettings = settings;
        isDirty = false;
        
        container.innerHTML = `
            <div class="settings-form">
                <div class="settings-section">
                    <h3>🏢 Informações da Academia</h3>
                    <div class="form-group">
                        <label for="academy-name">Nome da Academia</label>
                        <input type="text" id="academy-name" value="${settings.academyName || ''}" 
                               class="form-control" placeholder="Digite o nome da academia">
                    </div>
                    
                    <div class="form-group">
                        <label for="academy-address">Endereço</label>
                        <input type="text" id="academy-address" value="${settings.academyAddress || ''}" 
                               class="form-control" placeholder="Digite o endereço completo">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="academy-phone">Telefone</label>
                            <input type="text" id="academy-phone" value="${settings.academyPhone || ''}" 
                                   class="form-control" placeholder="(11) 99999-9999">
                        </div>
                        
                        <div class="form-group">
                            <label for="academy-email">Email</label>
                            <input type="email" id="academy-email" value="${settings.academyEmail || ''}" 
                                   class="form-control" placeholder="contato@academia.com">
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>🎨 Aparência</h3>
                    <div class="form-group">
                        <label for="theme">Tema</label>
                        <select id="theme" class="form-control">
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>🌙 Escuro</option>
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>☀️ Claro</option>
                            <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>🔄 Automático</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="language">Idioma</label>
                        <select id="language" class="form-control">
                            <option value="pt-BR" ${settings.language === 'pt-BR' ? 'selected' : ''}>🇧🇷 Português (Brasil)</option>
                            <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>🇺🇸 English (US)</option>
                            <option value="es-ES" ${settings.language === 'es-ES' ? 'selected' : ''}>🇪🇸 Español</option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>🔔 Notificações</h3>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="notifications" ${settings.notifications ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Habilitar Notificações
                        </label>
                        <small class="form-text">Receba notificações sobre pagamentos, presenças e eventos</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="emailNotifications" ${settings.emailNotifications ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Notificações por Email
                        </label>
                        <small class="form-text">Receba notificações importantes por email</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="smsNotifications" ${settings.smsNotifications ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Notificações por SMS
                        </label>
                        <small class="form-text">Receba notificações urgentes por SMS</small>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>💾 Backup e Segurança</h3>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoBackup" ${settings.autoBackup ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Backup Automático
                        </label>
                        <small class="form-text">Crie backups automáticos dos dados diariamente</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="backupFrequency">Frequência do Backup</label>
                        <select id="backupFrequency" class="form-control" ${!settings.autoBackup ? 'disabled' : ''}>
                            <option value="daily" ${settings.backupFrequency === 'daily' ? 'selected' : ''}>Diário</option>
                            <option value="weekly" ${settings.backupFrequency === 'weekly' ? 'selected' : ''}>Semanal</option>
                            <option value="monthly" ${settings.backupFrequency === 'monthly' ? 'selected' : ''}>Mensal</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="twoFactorAuth" ${settings.twoFactorAuth ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Autenticação de Dois Fatores
                        </label>
                        <small class="form-text">Adicione uma camada extra de segurança</small>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button type="button" class="btn btn-primary" id="saveSettingsBtn" disabled>
                        💾 Salvar Configurações
                    </button>
                    <button type="button" class="btn btn-secondary" id="resetSettingsBtn">
                        🔄 Restaurar Padrões
                    </button>
                    <button type="button" class="btn btn-danger" id="exportSettingsBtn">
                        📤 Exportar Configurações
                    </button>
                </div>
            </div>
        `;
        
        // Re-setup event listeners for new elements
        setupFormEventListeners();
        
        // Apply current theme
        applyTheme(settings.theme || 'dark');
    }
    
    function setupFormEventListeners() {
        // Auto-backup checkbox handler
        const autoBackupCheckbox = document.getElementById('autoBackup');
        const backupFrequencySelect = document.getElementById('backupFrequency');
        
        if (autoBackupCheckbox && backupFrequencySelect) {
            autoBackupCheckbox.addEventListener('change', function() {
                backupFrequencySelect.disabled = !this.checked;
            });
        }
        
        // Export settings button
        const exportBtn = document.getElementById('exportSettingsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportSettings);
        }
    }
    
    function saveSettings() {
        console.log('💾 Saving settings...');
        
        const settings = {
            academyName: document.getElementById('academy-name')?.value || '',
            academyAddress: document.getElementById('academy-address')?.value || '',
            academyPhone: document.getElementById('academy-phone')?.value || '',
            academyEmail: document.getElementById('academy-email')?.value || '',
            theme: document.getElementById('theme')?.value || 'dark',
            language: document.getElementById('language')?.value || 'pt-BR',
            notifications: document.getElementById('notifications')?.checked || false,
            emailNotifications: document.getElementById('emailNotifications')?.checked || false,
            smsNotifications: document.getElementById('smsNotifications')?.checked || false,
            autoBackup: document.getElementById('autoBackup')?.checked || false,
            backupFrequency: document.getElementById('backupFrequency')?.value || 'daily',
            twoFactorAuth: document.getElementById('twoFactorAuth')?.checked || false
        };
        
        submitSettings(settings);
    }
    
    function resetSettings() {
        console.log('🔄 Resetting settings to defaults...');
        
        if (isDirty) {
            if (!confirm('Você tem alterações não salvas. Deseja realmente restaurar os padrões?')) {
                return;
            }
        }
        
        const defaultSettings = {
            academyName: 'Krav Maga Academy',
            academyAddress: '',
            academyPhone: '',
            academyEmail: '',
            theme: 'dark',
            language: 'pt-BR',
            notifications: true,
            emailNotifications: false,
            smsNotifications: false,
            autoBackup: false,
            backupFrequency: 'daily',
            twoFactorAuth: false
        };
        
        renderSettings(defaultSettings);
        
        if (typeof showToast === 'function') {
            showToast('Configurações restauradas para os padrões', 'info');
        }
    }
    
    function exportSettings() {
        console.log('📤 Exporting settings...');
        
        const settingsData = {
            ...currentSettings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(settingsData, null, 2)], { 
            type: 'application/json' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `academy_settings_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Configurações exportadas com sucesso!', 'success');
        }
    }
    
    function updateSaveButtonState() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            saveBtn.disabled = !isDirty;
            saveBtn.textContent = isDirty ? '💾 Salvar Alterações' : '💾 Salvar Configurações';
        }
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchSettingsData() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderSettings(data.data);
                } else {
                    console.error('Failed to fetch settings data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Settings API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching settings data:', error);
            
            // Fallback to default settings
            const defaultSettings = {
                academyName: 'Krav Maga Academy',
                academyAddress: '',
                academyPhone: '',
                academyEmail: '',
                theme: 'dark',
                language: 'pt-BR',
                notifications: true,
                emailNotifications: false,
                smsNotifications: false,
                autoBackup: false,
                backupFrequency: 'daily',
                twoFactorAuth: false
            };
            
            renderSettings(defaultSettings);
        }
    }
    
    async function submitSettings(settings) {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('✅ Settings saved successfully');
                    
                    currentSettings = settings;
                    isDirty = false;
                    updateSaveButtonState();
                    
                    if (typeof showToast === 'function') {
                        showToast('Configurações salvas com sucesso!', 'success');
                    }
                    
                    // Apply theme immediately if changed
                    applyTheme(settings.theme);
                    
                } else {
                    console.error('Failed to save settings:', result.message);
                    
                    if (typeof showToast === 'function') {
                        showToast('Erro ao salvar configurações', 'error');
                    }
                }
            } else {
                console.error('Settings submission failed:', response.status);
                
                if (typeof showToast === 'function') {
                    showToast('Erro ao salvar configurações', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting settings:', error);
            
            if (typeof showToast === 'function') {
                showToast('Erro ao salvar configurações', 'error');
            }
        }
    }
    
    // ==========================================
    // THEME FUNCTIONS
    // ==========================================
    
    function applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('theme-dark', 'theme-light', 'theme-auto');
        
        // Apply new theme
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
            body.classList.add(`theme-${theme}`);
        }
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'light' ? '#ffffff' : '#0f172a';
        }
        
        console.log(`🎨 Applied theme: ${theme}`);
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function showErrorState() {
        const container = document.getElementById('settings-container');
        if (container) {
            container.innerHTML = `
                <div class="settings-error-state">
                    <div class="error-icon">⚙️</div>
                    <h3>Erro ao carregar configurações</h3>
                    <p>Não foi possível carregar as configurações do sistema.</p>
                    <button class="btn btn-primary" onclick="loadSettings()">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
    
    // ==========================================
    // GLOBAL EXPORTS
    // ==========================================
    
    function exportGlobalFunctions() {
        window.loadSettings = loadSettings;
        window.renderSettings = renderSettings;
        window.saveSettings = saveSettings;
        window.resetSettings = resetSettings;
        window.exportSettings = exportSettings;
        window.fetchSettingsData = fetchSettingsData;
        window.submitSettings = submitSettings;
        window.applyTheme = applyTheme;
    }
    
    console.log('⚙️ Settings Module loaded');
    
})();
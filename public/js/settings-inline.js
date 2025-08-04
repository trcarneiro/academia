// ==========================================
// SETTINGS SYSTEM - EXTRACTED FROM INDEX.HTML
// ==========================================

// Settings functions
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
    
    container.innerHTML = `
        <div class="settings-form">
            <div class="form-group">
                <label for="academy-name">Nome da Academia</label>
                <input type="text" id="academy-name" value="${settings.academyName || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="academy-address">Endereço</label>
                <input type="text" id="academy-address" value="${settings.academyAddress || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="academy-phone">Telefone</label>
                <input type="text" id="academy-phone" value="${settings.academyPhone || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label for="academy-email">Email</label>
                <input type="email" id="academy-email" value="${settings.academyEmail || ''}" class="form-control">
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="notifications" ${settings.notifications ? 'checked' : ''}>
                    Habilitar Notificações
                </label>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="autoBackup" ${settings.autoBackup ? 'checked' : ''}>
                    Backup Automático
                </label>
            </div>
            
            <div class="form-group">
                <label for="theme">Tema</label>
                <select id="theme" class="form-control">
                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Escuro</option>
                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Claro</option>
                    <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Automático</option>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-primary" onclick="saveSettings()">💾 Salvar Configurações</button>
                <button type="button" class="btn btn-secondary" onclick="resetSettings()">🔄 Restaurar Padrões</button>
            </div>
        </div>
    `;
}

function saveSettings() {
    console.log('💾 Saving settings...');
    
    const settings = {
        academyName: document.getElementById('academy-name')?.value || '',
        academyAddress: document.getElementById('academy-address')?.value || '',
        academyPhone: document.getElementById('academy-phone')?.value || '',
        academyEmail: document.getElementById('academy-email')?.value || '',
        notifications: document.getElementById('notifications')?.checked || false,
        autoBackup: document.getElementById('autoBackup')?.checked || false,
        theme: document.getElementById('theme')?.value || 'dark'
    };
    
    submitSettings(settings);
}

function resetSettings() {
    console.log('🔄 Resetting settings to defaults...');
    
    const defaultSettings = {
        academyName: 'Krav Maga Academy',
        academyAddress: '',
        academyPhone: '',
        academyEmail: '',
        notifications: true,
        autoBackup: false,
        theme: 'dark'
    };
    
    renderSettings(defaultSettings);
    
    if (typeof showToast === 'function') {
        showToast('Configurações restauradas para os padrões', 'info');
    }
}

async function fetchSettingsData() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderSettings(data.data);
            } else {
                console.error('Failed to fetch settings data:', data.message);
            }
        } else {
            console.error('Settings API request failed:', response.status);
        }
    } catch (error) {
        console.error('Error fetching settings data:', error);
        
        // Fallback to default settings
        const defaultSettings = {
            academyName: 'Krav Maga Academy',
            academyAddress: '',
            academyPhone: '',
            academyEmail: '',
            notifications: true,
            autoBackup: false,
            theme: 'dark'
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
                
                if (typeof showToast === 'function') {
                    showToast('Configurações salvas com sucesso!', 'success');
                }
                
                // Apply theme immediately if changed
                applyTheme(settings.theme);
                
            } else {
                console.error('Failed to save settings:', result.message);
            }
        } else {
            console.error('Settings submission failed:', response.status);
        }
    } catch (error) {
        console.error('Error submitting settings:', error);
        
        if (typeof showToast === 'function') {
            showToast('Erro ao salvar configurações', 'error');
        }
    }
}

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
    
    console.log(`🎨 Applied theme: ${theme}`);
}

// Global exports
window.loadSettings = loadSettings;
window.renderSettings = renderSettings;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.fetchSettingsData = fetchSettingsData;
window.submitSettings = submitSettings;
window.applyTheme = applyTheme;

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚙️ Settings system loaded');
    
    if (document.getElementById('settings-container')) {
        loadSettings();
    }
});

console.log('⚙️ Settings inline system initialized');
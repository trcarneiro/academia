// public/js/settings.js

// ========================================
// Functions for Settings
// ========================================

export function loadSettings() {
    console.log('loadSettings called');
    // Mock data for settings
    const settings = {
        academyName: 'Academia Krav Maga',
        notifications: true
    };
    renderSettings(settings);
}

export function renderSettings(settings) {
    console.log('renderSettings called with:', settings);
    const container = document.getElementById('settings-container');
    if (!container) {
        console.error('Settings container not found');
        return;
    }
    container.innerHTML = `
        <div class="settings-form">
            <label for="academy-name">Nome da Academia</label>
            <input type="text" id="academy-name" value="${settings.academyName}">
            <label for="notifications">Habilitar Notificações</label>
            <input type="checkbox" id="notifications" ${settings.notifications ? 'checked' : ''}>
            <button onclick="saveSettings()">Salvar Configurações</button>
        </div>
    `;
}

export function saveSettings() {
    const academyName = document.getElementById('academy-name').value;
    const notifications = document.getElementById('notifications').checked;
    console.log('Saving settings:', { academyName, notifications });
    // In a real app, make an API call to save the settings
    alert('Configurações salvas com sucesso!');
}

(function () {
  let moduleAPI = null;
  const containerId = 'settings-container';

  async function waitForAPI() {
    let tries = 0;
    while (!window.createModuleAPI && tries < 100) {
      await new Promise(function (r) { setTimeout(r, 100); });
      tries++;
    }
    if (!window.createModuleAPI) throw new Error('API client not available');
    moduleAPI = window.createModuleAPI('Settings');
  }

  function renderForm(data) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const s = data || {};
    const theme = s.theme || {};
    const branding = s.branding || {};
    const asaas = s.asaas || {};
    var html = '';
    html += '<form class="settings-form" id="settingsForm">';
    html += '  <section class="settings-section">';
    html += '    <h3>🎨 Tema</h3>';
    html += '    <div class="form-row">';
    html += '      <div class="form-group">';
    html += '        <label for="primaryColor">Cor Primária</label>';
    html += '        <input class="form-control" id="primaryColor" name="theme.primaryColor" type="color" value="' + (theme.primaryColor || '#667eea') + '" />';
    html += '        <small class="form-text">Aplica em var(--primary-color)</small>';
    html += '      </div>';
    html += '      <div class="form-group">';
    html += '        <label for="secondaryColor">Cor Secundária</label>';
    html += '        <input class="form-control" id="secondaryColor" name="theme.secondaryColor" type="color" value="' + (theme.secondaryColor || '#764ba2') + '" />';
    html += '        <small class="form-text">Aplica em var(--secondary-color)</small>';
    html += '      </div>';
    html += '    </div>';
    html += '    <div class="form-row">';
    html += '      <div class="form-group">';
    html += '        <label for="gradientPrimary">Gradiente Primário</label>';
    html += '        <input class="form-control" id="gradientPrimary" name="theme.gradientPrimary" type="text" placeholder="linear-gradient(135deg, ... )" value="' + (theme.gradientPrimary || '') + '" />';
    html += '        <small class="form-text">Se vazio, será derivado automaticamente</small>';
    html += '      </div>';
    html += '      <div class="form-group">';
    html += '        <label class="checkbox-label">';
    html += '          <input type="checkbox" id="darkMode" name="theme.darkMode" ' + (theme.darkMode ? 'checked' : '') + ' />';
    html += '          <span class="checkmark"></span>';
    html += '          Ativar modo escuro';
    html += '        </label>';
    html += '      </div>';
    html += '    </div>';
    html += '  </section>';

    html += '  <section class="settings-section">';
    html += '    <h3>🏷️ Branding</h3>';
    html += '    <div class="form-row">';
    html += '      <div class="form-group">';
    html += '        <label for="appName">Nome do App</label>';
    html += '        <input class="form-control" id="appName" name="branding.appName" type="text" required value="' + (branding.appName || 'Krav Maga Academy') + '" />';
    html += '      </div>';
    html += '      <div class="form-group">';
    html += '        <label for="logoUrl">Logo URL</label>';
    html += '        <input class="form-control" id="logoUrl" name="branding.logoUrl" type="url" placeholder="https://..." value="' + (branding.logoUrl || '') + '" />';
    html += '      </div>';
    html += '    </div>';
    html += '    <div class="form-row">';
    html += '      <div class="form-group">';
    html += '        <label for="contactEmail">Email de Contato</label>';
    html += '        <input class="form-control" id="contactEmail" name="branding.contactEmail" type="email" placeholder="email@dominio.com" value="' + (branding.contactEmail || '') + '" />';
    html += '      </div>';
    html += '      <div class="form-group">';
    html += '        <label for="contactPhone">Telefone</label>';
    html += '        <input class="form-control" id="contactPhone" name="branding.contactPhone" type="tel" placeholder="(00) 00000-0000" value="' + (branding.contactPhone || '') + '" />';
    html += '      </div>';
    html += '    </div>';
    html += '  </section>';
    html += '  <section class="settings-section">';
    html += '    <h3>🔌 Integrações</h3>';
    html += '    <div class="integration-card asaas-card">';
    html += '      <div class="card-header">';
    html += '        <div class="card-icon">💳</div>';
    html += '        <div class="card-title">';
    html += '          <h4>Asaas (Pagamentos)</h4>';
    html += '          <p>Configure o ambiente de integração</p>';
    html += '        </div>';
    html += '        <div class="card-status status-' + ((asaas && asaas.environment === 'production') ? 'success' : 'warning') + '">';
    html += '          ' + ((asaas && asaas.environment === 'production') ? 'PRODUÇÃO (BETA)' : 'SANDBOX (TESTE)') + '';
    html += '        </div>';
    html += '      </div>';
    html += '      ';
    html += '      <div class="form-row">';
    html += '        <div class="form-group full-width">';
    html += '          <label class="checkbox-label">';
    html += '            <input type="checkbox" name="asaas.environment" ' + ((asaas && asaas.environment === 'production') ? 'checked' : '') + ' />';
    html += '            <span class="checkmark"></span>';
    html += '            <span class="checkbox-text">';
    html += '              <strong>Ambiente de Produção</strong>';
    html += '              <br><small>Habilite para processar pagamentos reais. Desabilite para testes.</small>';
    html += '            </span>';
    html += '          </label>';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </section>';
    html += '</form>';

    el.innerHTML = html;

    const saveBtn = document.getElementById('saveSettingsBtn');
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (saveBtn) saveBtn.disabled = true;

    const form = document.getElementById('settingsForm');
    if (form && saveBtn) form.addEventListener('input', function () { saveBtn.disabled = false; });

    if (saveBtn) saveBtn.onclick = async function () { await saveSettings(); };
    if (resetBtn) resetBtn.onclick = function () { resetSettings(); };
  }

  function toPayload() {
    const form = document.getElementById('settingsForm');
    if (!form) return {};
    const fd = new FormData(form);
    const out = {};
    for (var pair of fd.entries()) {
      const k = pair[0];
      const v = pair[1];
      const value = String(v);
      const inputEl = form.querySelector('[name="' + k + '"]');
      const isCheckbox = inputEl && inputEl.type === 'checkbox';
      const path = k.split('.');
      var ref = out;
      for (var i = 0; i < path.length; i++) {
        const key = path[i];
        if (i === path.length - 1) {
          ref[key] = isCheckbox ? (value === 'on') : value;
        } else {
          ref[key] = ref[key] || {};
          ref = ref[key];
        }
      }
    }
    // Ensure unchecked checkboxes are represented as false
    const checkboxes = form.querySelectorAll('input[type="checkbox"][name]');
    checkboxes.forEach(function (cb) {
      const name = cb.name;
      const path = name.split('.');
      var ref = out;
      for (var i = 0; i < path.length; i++) {
        const key = path[i];
        if (i === path.length - 1) {
          if (typeof ref[key] === 'undefined') ref[key] = !!cb.checked;
        } else {
          ref[key] = ref[key] || {};
          ref = ref[key];
        }
      }
    });
    return out;
  }

  async function saveSettings() {
    const payload = toPayload();
    try {
      const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Falha ao salvar');
      if (window.DesignTokens) {
        window.DesignTokens.applyTheme(json.data && json.data.theme);
        window.DesignTokens.applyBranding(json.data && json.data.branding);
      }
      const saveBtn = document.getElementById('saveSettingsBtn');
      if (saveBtn) saveBtn.disabled = true;
      if (window.showToast) window.showToast('Configurações salvas', 'success');
      document.dispatchEvent(new CustomEvent('settings:saved'));
    } catch (e) {
      console.error(e);
      if (window.showToast) window.showToast('Erro ao salvar configurações', 'error');
    }
  }

  async function resetSettings() {
    const defaults = { theme: { primaryColor: '#667eea', secondaryColor: '#764ba2', gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', darkMode: false }, branding: { appName: 'Krav Maga Academy', logoUrl: '', contactEmail: '', contactPhone: '' } };
    renderForm(defaults);
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) saveBtn.disabled = false;
  }

  async function loadSettings() {
    await waitForAPI();
    const container = document.getElementById(containerId);
    await moduleAPI.fetchWithStates('/api/settings', {
      loadingElement: container,
      onSuccess: function (data) { renderForm(data); },
      onEmpty: function () { renderForm({}); },
      onError: function (err) {
        if (container) container.innerHTML = '<div class="settings-error-state"><div class="error-icon">⚠️</div><h3>Erro ao carregar configurações</h3><p>' + ((err && err.message) || 'Tente novamente') + '</p></div>';
        if (window.app && window.app.handleError) window.app.handleError(err, 'Settings:load');
      }
    });
  }

  window.loadSettings = loadSettings;
  window.saveSettings = saveSettings;
  window.resetSettings = resetSettings;
})();

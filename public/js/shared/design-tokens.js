// Design Tokens Applier - applies runtime theme/branding from /api/settings
(function(){
  const STATE = { loaded: false, applying: false, settings: null };

  async function fetchSettings() {
    try {
if (window.createModuleAPI) { const api = window.createModuleAPI('DesignTokens'); const r = await api.request('/api/settings'); if (r && r.success) return r.data; } const orgId = (localStorage.getItem('organizationId')||'').replace('"',''); const res = await fetch('/api/settings', { headers: orgId ? { 'x-organization-id': orgId } : {} });
      const json = await res.json();
      if (json && json.success) return json.data;
    } catch (e) {
      console.warn('[DesignTokens] Failed to fetch settings', e);
    }
    return null;
  }

  function applyTheme(theme){
    if (!theme) return;
    const root = document.documentElement;
    // Primary tokens
    if (theme.primaryColor) root.style.setProperty('--primary-color', theme.primaryColor);
    if (theme.secondaryColor) root.style.setProperty('--secondary-color', theme.secondaryColor);
    if (theme.gradientPrimary) root.style.setProperty('--gradient-primary', theme.gradientPrimary);

    // Derive official premium system colors from tokens when present
    // The design system uses these keys heavily across modules
    if (theme.primaryColor) {
      // keep info color as is to avoid broad UI side effects
    }

    // Dark mode toggle via data-theme
    if (typeof theme.darkMode === 'boolean') {
      if (theme.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }

  function applyBranding(branding){
    if (!branding) return;
    // App name in header/sidebar when present
    const logoEls = document.querySelectorAll('.top-bar .logo, .sidebar-header h2');
    logoEls.forEach(el => {
      if (branding.appName) el.textContent = branding.appName;
    });
    if (branding.logoUrl) {
      // If a dedicated logo img exists, set it
      document.querySelectorAll('img.app-logo').forEach(img => { img.src = branding.logoUrl; });
    }
  }

  async function init(){
    if (STATE.loaded || STATE.applying) return;
    STATE.applying = true;
    const settings = await fetchSettings();
    STATE.settings = settings;
    if (settings) {
      applyTheme(settings.theme);
      applyBranding(settings.branding);
    }
    STATE.loaded = true;
    STATE.applying = false;
    window.dispatchEvent(new CustomEvent('design-tokens:applied', { detail: { settings }}));
  }

  // Public API
  window.DesignTokens = {
    init,
    applyTheme,
    applyBranding,
    getSettings(){ return STATE.settings; }
  };

  // Auto-init after DOMContentLoaded for safety
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

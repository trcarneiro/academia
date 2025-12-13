class AcademyApp {
  constructor() {
    this.modules = new Map();
    this.config = {
      apiUrl: '/api',
      appName: 'Krav Maga Academy',
      version: '2.0.0'
    };
  }

  async init() {
    console.log('🚀 Initializing AcademyApp...');
    this.initializeOrganizationContext();
    await this.loadSystemVersion();
    await this.loadModules();
    console.log('✅ AcademyApp initialized');
  }

  async loadSystemVersion() {
    try {
      const response = await fetch('/version');
      const data = await response.json();
      
      if (data.success) {
        const versionEl = document.getElementById('systemVersion');
        if (versionEl) {
          versionEl.querySelector('.version-number').textContent = `v${data.version}`;
          versionEl.querySelector('.environment-badge').textContent = data.environment.toUpperCase();
          
          // Color coding for environment
          if (data.environment === 'production') {
             versionEl.querySelector('.environment-badge').style.color = '#28a745'; // Green
          } else {
             versionEl.querySelector('.environment-badge').style.color = '#ffc107'; // Yellow/Orange
          }
        }
        this.config.version = data.version;
        console.log(`ℹ️ System Version: ${data.version} (${data.environment})`);
      }
    } catch (error) {
      console.warn('Failed to load system version:', error);
    }
  }

  initializeOrganizationContext() {
    // 🔧 TEMPORARY: Populate organization context for dev until Supabase auth is integrated
    // TODO: Remove this when proper auth/session is implemented
    try {
      const orgId = localStorage.getItem('activeOrganizationId') || 
                    sessionStorage.getItem('activeOrganizationId') ||
                    window.currentOrganizationId;
      
      if (!orgId) {
        // Fallback to Smart Defence organization for development/demo
        // This is ONLY for local development with single org
        const DEV_ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Smart Defence
        localStorage.setItem('activeOrganizationId', DEV_ORG_ID);
        window.currentOrganizationId = DEV_ORG_ID;
        console.log('🔧 [DEV MODE] Organization context initialized with Smart Defence:', DEV_ORG_ID);
      } else {
        window.currentOrganizationId = orgId;
        console.log('✅ Organization context initialized:', orgId);
      }
      
      // Also add helper to ensure org is available (useful for modules needing guarantee)
      window.ensureOrganizationContext = async () => {
        let attempts = 0;
        while (attempts < 50 && !window.currentOrganizationId) {
          await new Promise(resolve => setTimeout(resolve, 10));
          attempts++;
        }
        return window.currentOrganizationId;
      };
      
    } catch (err) {
      console.warn('⚠️ Error initializing organization context:', err.message);
    }
  }

  async loadModules() {
    console.log('📦 Loading application modules...');

    // Load auth module
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
      console.log('✅ Auth module loaded');
    } else {
      console.log('ℹ️ Auth module not available');
    }

    // Load other modules
    const moduleList = [
      'students', 'classes', 'packages', 'attendance', 'dashboard', 'activities', 'lesson-plans', 'courses', 'frequency', 'import', 'asaas-import', 'ai', 'agents', 'agent-activity', 'agent-chat-fullscreen', 'turmas', 'organizations', 'units', 'instructors', 'agenda', 'crm', 'checkin-kiosk', 'student-progress', 'turmas-sugestoes'
    ];

    moduleList.forEach(moduleName => {
      if (typeof window[moduleName] !== 'undefined') {
        if (typeof window[moduleName].init === 'function') {
          try {
            window[moduleName].init();
            console.log(`✅ Module loaded: ${moduleName}`);
          } catch (error) {
            console.error(`❌ Error initializing ${moduleName}:`, error);
          }
        } else {
          console.warn(`⚠️ Module ${moduleName} exists but has no init() method`);
        }
      } else {
        console.log(`ℹ️ Module not available: ${moduleName}`);
      }
    });
  }
}

// Global instance
window.AcademyApp = new AcademyApp();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.AcademyApp.init();
});

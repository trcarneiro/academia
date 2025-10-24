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
    await this.loadModules();
    console.log('✅ AcademyApp initialized');
  }

  initializeOrganizationContext() {
    // 🔧 TEMPORARY: Populate organization context for dev until Supabase auth is integrated
    // TODO: Remove this when proper auth/session is implemented
    try {
      const orgId = localStorage.getItem('activeOrganizationId') || 
                    sessionStorage.getItem('activeOrganizationId') ||
                    window.currentOrganizationId;
      
      if (!orgId) {
        // Fallback to dev organization for development/demo
        // This is ONLY for local development with single org
        const DEV_ORG_ID = '452c0b35-1822-4890-851e-922356c812fb';
        localStorage.setItem('activeOrganizationId', DEV_ORG_ID);
        window.currentOrganizationId = DEV_ORG_ID;
        console.log('🔧 [DEV MODE] Organization context initialized with fallback org:', DEV_ORG_ID);
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
      'students', 'classes', 'packages', 'attendance', 'dashboard', 'activities', 'lesson-plans', 'courses', 'frequency', 'import', 'ai', 'turmas', 'organizations', 'units', 'instructors', 'agenda', 'crm', 'checkin-kiosk', 'student-progress'
    ];

    moduleList.forEach(moduleName => {
      if (typeof window[moduleName] !== 'undefined') {
        window[moduleName].init();
        console.log(`✅ Module loaded: ${moduleName}`);
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

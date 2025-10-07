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
    await this.loadModules();
    console.log('✅ AcademyApp initialized');
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
      'students', 'classes', 'packages', 'attendance', 'dashboard', 'activities', 'lesson-plans', 'courses', 'frequency', 'import', 'rag', 'ai', 'ai-dashboard', 'ai-monitor', 'turmas', 'organizations', 'units', 'instructors', 'agenda', 'crm'
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

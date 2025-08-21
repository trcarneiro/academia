/**
 * Módulo para registro e carregamento de módulos
 * Versão mínima funcional
 */
const ModuleLoader = {
  modules: {},
  
  register: function(name, module) {
    this.modules[name] = module;
    console.log(`[ModuleLoader] Módulo registrado: ${name}`);
  },
  
  init: function(name) {
    if (this.modules[name] && this.modules[name].init) {
      this.modules[name].init();
    }
  }
};

// Expor globalmente para acesso entre módulos
window.ModuleLoader = ModuleLoader;
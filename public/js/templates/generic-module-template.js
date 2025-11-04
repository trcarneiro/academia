/**
 * Generic Module Template
 * Template para implementar anti-duplicação em qualquer módulo
 * 
 * USAGE INSTRUCTIONS:
 * 1. Replace 'MODULE_NAME' with your actual module name (e.g., 'turmas', 'courses')
 * 2. Replace 'ModuleController' with your actual controller class
 * 3. Update the initialization logic in performInitialization()
 * 4. Update the global exports section
 * 
 * FEATURES:
 * - Anti-duplication protection
 * - Proper error handling
 * - Cache management
 * - Debug utilities
 */

import { moduleRegistry } from '../shared/module-manager.js';

// ==============================================
// MODULE CONFIGURATION
// ==============================================

const MODULE_NAME = 'REPLACE_WITH_MODULE_NAME'; // e.g., 'turmas'
const moduleManager = moduleRegistry.getOrCreate(MODULE_NAME);

// Module-specific variables
let moduleAPI = null;
let mainController = null;

// ==============================================
// CORE INITIALIZATION LOGIC
// ==============================================

/**
 * Main module initialization function
 * This function will be called by the SPA router
 */
async function initModule(targetContainer) {
    return moduleManager.safeInit(performInitialization, targetContainer);
}

/**
 * Internal initialization logic
 * Replace this with your actual module initialization
 */
async function performInitialization(targetContainer) {
    try {
        // 1. Wait for dependencies
        await waitForDependencies();
        
        // 2. Initialize API client
        moduleAPI = window.createModuleAPI(MODULE_NAME);
        
        // 3. Initialize controllers
        // mainController = new ModuleController(moduleAPI);
        
        // 4. Render initial interface
        // await mainController.render(targetContainer);
        
        // 5. Return module instance
        return {
            controller: mainController,
            api: moduleAPI,
            render: (container) => mainController.render(container)
        };
        
    } catch (error) {
        console.error(`❌ Erro ao inicializar módulo ${MODULE_NAME}:`, error);
        throw error;
    }
}

/**
 * Wait for required dependencies to be available
 */
function waitForDependencies() {
    return new Promise((resolve) => {
        const checkDependencies = () => {
            if (window.createModuleAPI && window.app) {
                resolve();
            } else {
                setTimeout(checkDependencies, 100);
            }
        };
        checkDependencies();
    });
}

// ==============================================
// MODULE-SPECIFIC FUNCTIONS
// ==============================================

/**
 * Navigate to specific views within the module
 * Example: openModuleEditor, openModuleList, etc.
 */
async function openModuleView(viewName, params = {}) {
    const state = moduleManager.getState();
    if (!state.isInitialized || !mainController) {
        console.error(`❌ Módulo ${MODULE_NAME} não está inicializado`);
        return;
    }
    
    // Example: await mainController.showView(viewName, params);
}

// ==============================================
// DEBUGGING AND UTILITIES
// ==============================================

/**
 * Get module state for debugging
 */
function getModuleState() {
    return {
        ...moduleManager.getState(),
        hasController: !!mainController,
        hasAPI: !!moduleAPI
    };
}

/**
 * Reset module state
 */
function resetModuleState() {
    moduleManager.reset();
    mainController = null;
    moduleAPI = null;
}

/**
 * Force module re-initialization
 */
async function forceReinit(targetContainer) {
    resetModuleState();
    return initModule(targetContainer);
}

// ==============================================
// GLOBAL EXPORTS
// ==============================================

// Primary initialization function
window[`init${MODULE_NAME.charAt(0).toUpperCase() + MODULE_NAME.slice(1)}Module`] = initModule;

// Navigation functions
window[`open${MODULE_NAME.charAt(0).toUpperCase() + MODULE_NAME.slice(1)}View`] = openModuleView;

// Debug utilities
window[`get${MODULE_NAME.charAt(0).toUpperCase() + MODULE_NAME.slice(1)}State`] = getModuleState;
window[`reset${MODULE_NAME.charAt(0).toUpperCase() + MODULE_NAME.slice(1)}State`] = resetModuleState;
window[`reset_${MODULE_NAME}`] = resetModuleState; // For error retry buttons

// Export for module imports
export {
    initModule,
    openModuleView,
    getModuleState,
    resetModuleState,
    forceReinit
};

// ==============================================
// GENERALIZATION STRATEGY
// ==============================================

/**
 * STEP 1: Copy this template
 * STEP 2: Replace MODULE_NAME with your module name
 * STEP 3: Import your controllers
 * STEP 4: Update performInitialization() with your logic
 * STEP 5: Add module-specific navigation functions
 * STEP 6: Update SPA router to use new initialization function
 * 
 * EXAMPLE FOR TURMAS MODULE:
 * 
 * const MODULE_NAME = 'turmas';
 * import { TurmasController } from './controllers/turmas-controller.js';
 * 
 * async function performInitialization(targetContainer) {
 *     await waitForDependencies();
 *     moduleAPI = window.createModuleAPI('Turmas');
 *     mainController = new TurmasController(moduleAPI);
 *     await mainController.render(targetContainer);
 *     return { controller: mainController, api: moduleAPI };
 * }
 * 
 * window.initTurmasModule = initModule;
 * window.openTurmasEditor = openModuleView;
 * 
 * EXAMPLE FOR COURSES MODULE:
 * 
 * const MODULE_NAME = 'courses';
 * import { CoursesController } from './controllers/courses-controller.js';
 * 
 * // ... similar pattern
 * 
 * window.initCoursesModule = initModule;
 * window.openCourseEditor = openModuleView;
 */

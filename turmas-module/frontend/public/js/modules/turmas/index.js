// Entry point for the "turmas" module
// This module integrates with the AcademyApp and initializes the necessary components for managing class schedules.

let moduleAPI = null;

async function initializeAPI() {
    await waitForAPIClient();
    moduleAPI = window.createModuleAPI('turmas');
}

async function loadTurmasModule() {
    await initializeAPI();
    
    // Register the module with the AcademyApp
    window.myTurmasModule = {
        initialize: loadTurmasModule,
        // Additional module methods can be added here
    };
    
    // Dispatch event indicating the module has been loaded
    window.app.dispatchEvent('module:loaded', { name: 'turmas' });
}

// Initialize the module when the script is loaded
loadTurmasModule();
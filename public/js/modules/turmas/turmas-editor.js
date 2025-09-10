/**
 * Turmas Editor Module - Entry Point
 * Refactored according to GUIDELINES2.md
 * 
 * Features:
 * - Modern SPA architecture
 * - API Client integration
 * - Design System compliant
 * - Proper error handling
 * - Responsive design
 */

import { TurmasEditorController } from './controllers/TurmasEditorController.js';

// ==============================================
// MODULE INITIALIZATION
// ==============================================

let turmasEditorAPI = null;
let editorController = null;

/**
 * Wait for API Client to be available
 */
function waitForAPIClient() {
    return new Promise((resolve) => {
        if (window.createModuleAPI) {
            resolve();
        } else {
            const checkAPI = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(checkAPI);
                    resolve();
                }
            }, 100);
        }
    });
}

/**
 * Initialize Turmas Editor Module
 */
async function initTurmasEditorModule(targetContainer, turmaId = null) {
    console.log('📝 [TurmasEditor] Initializing module...', { turmaId });
    
    try {
        // Wait for API Client
        await waitForAPIClient();
        
        // Initialize API
        turmasEditorAPI = window.createModuleAPI('TurmasEditor');
        console.log('✅ [TurmasEditor] API Client initialized');
        
        // Initialize controller
        editorController = new TurmasEditorController(turmasEditorAPI);
        
        // Render editor
        await editorController.render(targetContainer, turmaId);
        
        console.log('✅ [TurmasEditor] Module initialized successfully');
        
        // Integrate with AcademyApp
        if (window.app) {
            window.app.dispatchEvent('module:loaded', { name: 'turmas-editor' });
        }
        
        return editorController;
        
    } catch (error) {
        console.error('❌ [TurmasEditor] Initialization error:', error);
        
        // Show error in container
        if (targetContainer) {
            targetContainer.innerHTML = `
                <div class="module-isolated-turmas-editor">
                    <div class="module-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao Inicializar Editor</h3>
                        <p>${error.message}</p>
                        <button class="btn-action-secondary" onclick="location.reload()">
                            <i class="icon">🔄</i>
                            <span>Tentar Novamente</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Handle error globally
        if (window.app && window.app.handleError) {
            window.app.handleError(error, 'TurmasEditor:init');
        }
        
        throw error;
    }
}

/**
 * Navigate to turma editor
 */
window.navigateToTurmaEditor = async function(turmaId = null) {
    console.log('[TurmasEditor] Navigating to editor...', { turmaId });
    
    try {
        // Find target container
        const container = document.getElementById('main-content') || 
                          document.getElementById('turma-editor-container') ||
                          document.querySelector('.turma-editor-container');
        
        if (!container) {
            throw new Error('Container para editor de turma não encontrado');
        }
        
        // Destroy previous controller if exists
        if (editorController) {
            editorController.destroy();
            editorController = null;
        }
        
        // Initialize module
        await initTurmasEditorModule(container, turmaId);
        
    } catch (error) {
        console.error('[TurmasEditor] Navigation error:', error);
        
        if (window.app && window.app.handleError) {
            window.app.handleError(error, 'TurmasEditor:navigate');
        }
        
        // Fallback navigation
        if (window.router) {
            window.router.navigate('turmas');
        }
    }
};

/**
 * Public API
 */
const turmasEditorModule = {
    name: 'turmas-editor',
    version: '2.0.0',
    init: initTurmasEditorModule,
    navigateToEditor: window.navigateToTurmaEditor,
    getController: () => editorController,
    destroy: () => {
        if (editorController) {
            editorController.destroy();
            editorController = null;
        }
        turmasEditorAPI = null;
        console.log('📝 [TurmasEditor] Module destroyed');
    }
};

// Expose globally for integration
window.turmasEditorModule = turmasEditorModule;

console.log('📝 [TurmasEditor] Module loaded and ready');

export default turmasEditorModule;
export { initTurmasEditorModule, turmasEditorModule };
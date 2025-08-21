/**
 * Activities Module - Main Entry Point
 * Guidelines.MD Compliant Implementation
 * 
 * Features:
 * - Complete CRUD operations for activities
 * - Modern SPA architecture
 * - API Client integration
 * - Responsive design
 * - Real-time search/filtering
 * - Activity type management
 */

import { ActivitiesListController } from './controllers/list-controller.js';
import { ActivityEditorController } from './controllers/editor-controller.js';

// ==============================================
// MODULE INITIALIZATION
// ==============================================

let activitiesAPI = null;
let listController = null;
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
 * Initialize Activities Module
 */
async function initActivitiesModule(targetContainer) {
    console.log('🏋️ Inicializando módulo de Atividades...');
    
    try {
        // Wait for API Client
        await waitForAPIClient();
        activitiesAPI = window.createModuleAPI('Activities');
        
        // Initialize controllers
        listController = new ActivitiesListController(activitiesAPI);
        editorController = new ActivityEditorController(activitiesAPI);
        
        // Load activities list by default
        await listController.render(targetContainer);
        
        console.log('✅ Módulo de Atividades inicializado com sucesso');
        
        return {
            listController,
            editorController,
            api: activitiesAPI
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de Atividades:', error);
        showErrorState(targetContainer, error.message);
    }
}

/**
 * Navigate to activity editor
 */
async function openActivityEditor(activityId = null, targetContainer) {
    if (!editorController) {
        console.error('❌ Editor controller não inicializado');
        return;
    }
    
    await editorController.render(targetContainer, activityId);
}

/**
 * Navigate back to activities list
 */
async function openActivitiesList(targetContainer) {
    if (!listController) {
        console.error('❌ List controller não inicializado');
        return;
    }
    
    await listController.render(targetContainer);
}

/**
 * Show error state
 */
function showErrorState(container, message) {
    container.innerHTML = `
        <div class="module-isolated-container" data-module="activities">
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Erro ao carregar módulo</div>
                <div class="error-message">${message}</div>
                <button class="btn-form btn-primary-form" onclick="location.reload()">
                    Tentar novamente
                </button>
            </div>
        </div>
    `;
}

// Global exports for SPA router
window.openActivityEditor = openActivityEditor;
window.openActivitiesList = openActivitiesList;

export {
    initActivitiesModule,
    openActivityEditor,
    openActivitiesList
};

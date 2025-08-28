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
// CSS LOADING
// ==============================================

/**
 * Load module CSS dynamically
 */
function loadModuleCSS() {
    const cssId = 'activities-module-css';
    if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = '/css/modules/activities.css';
        document.head.appendChild(link);
        console.log('🎨 Activities CSS carregado');
    }
}

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
    console.log('🏋️ Container recebido:', targetContainer);
    console.log('🏋️ API Client disponível:', typeof window.createModuleAPI);
    
    try {
        // Load module CSS
        loadModuleCSS();
        
        // Wait for API Client
        await waitForAPIClient();
        activitiesAPI = window.createModuleAPI('Activities');
        console.log('🏋️ API Client inicializado:', activitiesAPI);
        
        // Initialize controllers
        listController = new ActivitiesListController(activitiesAPI);
        editorController = new ActivityEditorController(activitiesAPI);
        console.log('🏋️ Controllers inicializados');
        
        // Load activities list by default
        await listController.render(targetContainer);
        console.log('✅ Lista de atividades renderizada');
        
        console.log('✅ Módulo de Atividades inicializado com sucesso');
        
        return {
            listController,
            editorController,
            api: activitiesAPI
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de Atividades:', error);
        console.error('❌ Stack trace:', error.stack);
        showErrorState(targetContainer, error.message);
        throw error; // Re-throw para debugging
    }
}

/**
 * Navigate to activity editor
 */
async function openActivityEditor(activityId = null, targetContainer = null) {
    if (!editorController) {
        console.error('❌ Editor controller não inicializado');
        return;
    }
    
    // Use o container principal se não especificado
    const container = targetContainer || document.getElementById('module-container');
    if (!container) {
        console.error('❌ Container não encontrado');
        return;
    }
    
    console.log('🏋️ Abrindo editor de atividade:', activityId ? `editando ID ${activityId}` : 'nova atividade');
    console.log('🏋️ Container:', container);
    
    // Limpar o list controller se estiver ativo
    if (listController) {
        listController.cleanup();
    }
    
    await editorController.render(container, activityId);
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
window.initActivitiesModule = initActivitiesModule;
window.openActivityEditor = openActivityEditor;
window.openActivitiesList = openActivitiesList;

export {
    initActivitiesModule,
    openActivityEditor,
    openActivitiesList
};

/**
 * Students Module - Main Entry Point
 * Guidelines.MD Compliant Implementation
 * 
 * Features:
 * - Complete CRUD operations
 * - Modern SPA architecture
 * - API Client integration
 * - Responsive design
 * - Real-time search/filtering
 */

import { StudentsListController } from './controllers/list-controller.js';
import { StudentEditorController } from './controllers/editor-controller.js';

// ==============================================
// MODULE INITIALIZATION
// ==============================================

let studentsAPI = null;
let listController = null;
let editorController = null;
let isModuleInitialized = false;
let initializationPromise = null;

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
 * Initialize Students Module with anti-duplication protection
 */
async function initStudentsModule(targetContainer) {
    // 1. If already initialized, just render the interface
    if (isModuleInitialized && listController && editorController) {
        console.log('🎓 [CACHE] Módulo de Estudantes já inicializado, renderizando interface...');
        await listController.render(targetContainer);
        return {
            listController,
            editorController,
            api: studentsAPI,
            fromCache: true
        };
    }
    
    // 2. If currently initializing, return existing promise
    if (initializationPromise) {
        console.log('🎓 [CACHE] Módulo de Estudantes já está inicializando, aguardando...');
        return initializationPromise;
    }
    
    // 3. Start new initialization
    console.log('🎓 [NETWORK] Inicializando módulo de Estudantes...');
    
    initializationPromise = performInitialization(targetContainer)
        .then(result => {
            isModuleInitialized = true;
            initializationPromise = null; // Clear promise on success
            return result;
        })
        .catch(error => {
            initializationPromise = null; // Clear promise on error to allow retry
            throw error;
        });
    
    return initializationPromise;
}

/**
 * Internal initialization logic
 */
async function performInitialization(targetContainer) {
    try {
        // Wait for API Client
        await waitForAPIClient();
        studentsAPI = window.createModuleAPI('Students');
        
        // Initialize controllers
        listController = new StudentsListController(studentsAPI);
        editorController = new StudentEditorController(studentsAPI);
        
        // Load students list by default
        await listController.render(targetContainer);
        
        console.log('✅ Módulo de Estudantes inicializado com sucesso');

        // Notify core app that module is ready (AGENTS.md compliance)
        try {
            window.app?.dispatchEvent?.('module:loaded', { name: 'students' });
        } catch (_) { /* noop */ }
        
        return {
            listController,
            editorController,
            api: studentsAPI,
            fromCache: false
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de Estudantes:', error);
        showErrorState(targetContainer, error.message);
        // Report to global error handler (AGENTS.md compliance)
        try {
            window.app?.handleError?.(error, 'Students:init');
        } catch (_) { /* noop */ }
        throw error;
    }
}

/**
 * Navigate to student editor
 */
async function openStudentEditor(studentId = null, targetContainer) {
    if (!editorController) {
        console.error('❌ Editor controller não inicializado');
        return;
    }
    
    // Expose editor controller globally for testing
    window.currentStudentEditor = editorController;
    
    await editorController.render(targetContainer, studentId);
}

/**
 * Navigate back to students list
 */
async function openStudentsList(targetContainer) {
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
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Erro no Módulo de Estudantes</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
                Recarregar Página
            </button>
        </div>
    `;
}

/**
 * Get module state for debugging
 */
function getModuleState() {
    return {
        isInitialized: isModuleInitialized,
        hasPromise: !!initializationPromise,
        hasControllers: !!(listController && editorController),
        hasAPI: !!studentsAPI
    };
}

/**
 * Reset module state (for testing/debugging)
 */
function resetModuleState() {
    console.log('🔄 Resetando estado do módulo de Estudantes...');
    isModuleInitialized = false;
    initializationPromise = null;
    listController = null;
    editorController = null;
    studentsAPI = null;
}

// ==============================================
// GLOBAL EXPORTS
// ==============================================

// Make functions available globally for SPA router
window.initStudentsModule = initStudentsModule;
window.openStudentEditor = openStudentEditor;
window.openStudentsList = openStudentsList;

// Debugging utilities
window.getStudentsModuleState = getModuleState;
window.resetStudentsModuleState = resetModuleState;

// Expose module for AcademyApp + ModuleLoader (AGENTS.md compliance)
window.students = {
    init: initStudentsModule,
    openEditor: openStudentEditor,
    openList: openStudentsList
};
try {
    window.ModuleLoader?.register?.('students', window.students);
} catch (_) { /* noop */ }

// Export for module imports
export {
    initStudentsModule,
    openStudentEditor,
    openStudentsList,
    getModuleState,
    resetModuleState,
    StudentsListController,
    StudentEditorController
};

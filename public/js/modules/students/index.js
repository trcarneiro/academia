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
 * Initialize Students Module
 */
async function initStudentsModule(targetContainer) {
    console.log('🎓 Inicializando módulo de Estudantes...');
    
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
        
        return {
            listController,
            editorController,
            api: studentsAPI
        };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo de Estudantes:', error);
        showErrorState(targetContainer, error.message);
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

// ==============================================
// GLOBAL EXPORTS
// ==============================================

// Make functions available globally for SPA router
window.initStudentsModule = initStudentsModule;
window.openStudentEditor = openStudentEditor;
window.openStudentsList = openStudentsList;

// Export for module imports
export {
    initStudentsModule,
    openStudentEditor,
    openStudentsList,
    StudentsListController,
    StudentEditorController
};

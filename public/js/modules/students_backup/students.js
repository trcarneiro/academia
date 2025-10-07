/**
 * Students Module Entry Point - Guidelines.MD Compliant
 * 
 * This file serves as the main entry point for the students module.
 * It imports and initializes the complete students management system.
 * 
 * Architecture:
 * - MVC pattern with Controllers, Views, and Services
 * - Component-based UI with reusable parts
 * - API Client integration following Guidelines.MD
 * - Comprehensive CRUD operations
 * 
 * Features:
 * - Students list with search/filters
 * - Student editor with tabs (Profile, Financial, Documents, History)
 * - Real-time validation
 * - Auto-save functionality
 * - Responsive design
 */

import { initStudentsModule } from './index.js';

// Initialize the students module when this file is loaded
window.studentsModuleReady = false;

/**
 * Initialize students module in target container
 */
async function initStudents(targetContainer) {
    console.log('🎓 Carregando módulo de Estudantes...');
    
    try {
        const moduleInstance = await initStudentsModule(targetContainer);
        window.studentsModuleReady = true;
        
        console.log('✅ Módulo de Estudantes carregado com sucesso');
        return moduleInstance;
        
    } catch (error) {
        console.error('❌ Erro ao carregar módulo de Estudantes:', error);
        throw error;
    }
}

// Export for SPA router
window.initStudents = initStudents;

// Export for ES6 imports
export { initStudents };

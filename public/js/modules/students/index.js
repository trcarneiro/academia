/*
 Students Module - Premium UX following Activities patterns
 - Enhanced list and editor with Activities-level UX
 - Premium design components and comprehensive functionality
 - Full responsive design and accessibility features

 Exports globals for SPA Router: initStudentsModule, openStudentEditor
*/

import { StudentsListController } from './controllers/list-controller.js';
import { StudentEditorController } from './controllers/editor-controller.js';
import { PersonalTrainingController } from './controllers/personal-controller.js';

// Load module-specific styles
const moduleStyles = document.createElement('link');
moduleStyles.rel = 'stylesheet';
moduleStyles.href = '/js/modules/students/styles/students.css';
document.head.appendChild(moduleStyles);

// Load personal training styles
const personalStyles = document.createElement('link');
personalStyles.rel = 'stylesheet';
personalStyles.href = '/css/modules/personal-training.css';
document.head.appendChild(personalStyles);

// Defensive globals
window.app = window.app || {
	dispatchEvent: () => {},
	handleError: (err, ctx) => console.error('AppError', ctx, err)
};

let moduleAPI = null;
let listController = null;
let editorController = null;
let personalController = null;

async function initializeAPI() {
	// createModuleAPI is provided by public/js/shared/api-client.js
	if (!window.createModuleAPI) {
		throw new Error('API client not loaded');
	}
	moduleAPI = window.createModuleAPI('Students');
}

function loadModuleCSS() {
	// Load premium CSS v2.0 for enhanced UX
	const cssFiles = [
		'/css/modules/students-enhanced.css',
		'/css/modules/students-premium.css'
	];
	
	cssFiles.forEach(href => {
		if (!document.querySelector(`link[href="${href}"]`)) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = href;
			document.head.appendChild(link);
			console.log(`✅ CSS carregado: ${href}`);
		}
	});
}

// Public API consumed by SPA Router
window.initStudentsModule = async function initStudentsModule(container) {
	console.log('🎓 [NETWORK] Inicializando módulo de Estudantes...');
	try {
		loadModuleCSS();
		await initializeAPI();
		
		// Initialize controllers
		listController = new StudentsListController(moduleAPI);
		editorController = new StudentEditorController(moduleAPI);
		personalController = new PersonalTrainingController(moduleAPI);
		// Render list by default
		if (container) {
			await listController.render(container);
		}
		window.app.dispatchEvent?.('module:loaded', { name: 'students' });
		// Expose controllers globally
		window.studentEditor = editorController;
		window.personalController = personalController;
		
		return { listController, editorController, personalController, api: moduleAPI };
	} catch (err) {
		window.app.handleError(err, 'students:init');
		// Minimal error state
		if (container) {
			container.innerHTML = '<div class="error-state">Erro ao inicializar Estudantes</div>';
		}
		throw err;
	}
};

// Export as standard module format for app.js
window.students = {
	init: async function() {
		console.log('🎓 [APP.JS] Inicializando módulo Students via app.js...');
		loadModuleCSS();
		await initializeAPI();
		
		// Initialize controllers but don't render yet (SPA Router will handle rendering)
		listController = new StudentsListController(moduleAPI);
		editorController = new StudentEditorController(moduleAPI);
		personalController = new PersonalTrainingController(moduleAPI);
		
		// Expose controllers globally
		window.studentEditor = editorController;
		window.personalController = personalController;
		
		window.app.dispatchEvent?.('module:loaded', { name: 'students' });
	}
};

// Optional: allow opening editor directly
window.openStudentEditor = async function openStudentEditor(studentId, container) {
	try {
		loadModuleCSS();
		await initializeAPI();
		if (!editorController) editorController = new StudentEditorController(moduleAPI);
		// Expose editor globally
		window.studentEditor = editorController;
		await editorController.render(container, studentId || null);
	} catch (err) {
		window.app.handleError(err, 'students:open-editor');
		container.innerHTML = '<div class="error-state">Erro ao abrir editor</div>';
	}
};

// Expose module globally for simple actions
window.studentsModule = { 
	init: window.initStudentsModule, 
	openEditor: window.openStudentEditor,
	startPersonal: (studentId) => {
		if (window.personalController) {
			return window.personalController.createPersonalClass(studentId);
		}
	},
	schedulePersonal: (studentId, studentData) => {
		if (window.personalController) {
			return window.personalController.showPersonalScheduling({ student_id: studentId }, studentData);
		}
	}
};

// Compatibility with AcademyApp - expose as window.students
window.students = window.studentsModule;

console.log('✅ Students module (Activities-style) loaded');

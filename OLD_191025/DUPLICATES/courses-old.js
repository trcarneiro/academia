// Courses Manager Module - Isolated (CLAUDE.md compliant)
(function(window) {
    'use strict';
    
    console.log('📚 Courses Manager - Starting...');

    // Load the main courses module
    function loadMainCoursesModule() {
        if (document.querySelector('script[src*="courses.js"]')) {
            console.log('📚 Main courses module already loaded');
            initializeAfterLoad();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/js/modules/courses.js';
        script.onload = () => {
            console.log('📚 Main courses module loaded successfully');
            initializeAfterLoad();
        };
        script.onerror = () => {
            console.error('❌ Failed to load main courses module');
            showFallbackError();
        };
        document.head.appendChild(script);
    }

    function initializeAfterLoad() {
        // Wait a bit for the module to be ready
        setTimeout(() => {
            if (typeof window.initializeCoursesModule === 'function') {
                console.log('📚 Initializing courses module...');
                window.initializeCoursesModule();
                setupActionHandlers();
            } else {
                console.warn('⚠️ initializeCoursesModule not found, using fallback');
                showFallbackError();
            }
        }, 100);
    }

    function setupActionHandlers() {
        // Handle data-action attributes for buttons
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.getAttribute('data-action');
            const argsAttr = target.getAttribute('data-args');
            let args = [];
            
            try {
                if (argsAttr) args = JSON.parse(argsAttr);
            } catch (e) {
                console.warn('Invalid data-args JSON:', argsAttr);
            }

            console.log('🎯 Action triggered:', action, args);

            switch (action) {
                case 'openNewCourseForm':
                    window.openNewCourseForm();
                    break;
                default:
                    if (typeof window[action] === 'function') {
                        window[action](...args);
                    } else {
                        console.warn('Unknown action:', action);
                    }
                    break;
            }
        });
    }

    function showFallbackError() {
        const container = document.querySelector('.courses-isolated');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc2626;">
                    <h2>❌ Erro ao Carregar Módulo de Cursos</h2>
                    <p>Não foi possível carregar o sistema de gestão de cursos.</p>
                    <button onclick="location.reload()" class="btn btn-primary">🔄 Tentar Novamente</button>
                </div>
            `;
        }
    }

    // Navigation helpers
    window.openAddCoursePage = function() {
        if (window.navigateToModule) {
            window.navigateToModule('course-editor');
        } else {
            window.location.href = '/modules/courses/course-editor.html';
        }
    };

    window.openNewCourseForm = window.openAddCoursePage;

    // Auto-initialize
    if (document.readyState !== 'loading') {
        loadMainCoursesModule();
    } else {
        document.addEventListener('DOMContentLoaded', loadMainCoursesModule);
    }

    console.log('📚 Courses Manager - Loaded');

})(window);

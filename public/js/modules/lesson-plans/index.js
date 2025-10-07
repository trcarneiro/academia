/**
 * Lesson Plans Module - Entry Point
 * 
 * This is the main entry point for the lesson-plans module, following the
 * Activities module pattern for consistency and AcademyApp integration.
 */

console.log('📚 Lesson Plans Module (Entry Point) - Starting...');

// Load the main lesson-plans functionality
(function() {
    'use strict';
    
    // Function to dynamically load the main lesson-plans.js file
    function loadLessonPlansScript() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.lessonPlansModule) {
                console.log('✅ Lesson Plans Module already loaded');
                resolve();
                return;
            }
            
            // Create script tag to load lesson-plans.js
            const script = document.createElement('script');
            script.src = '/js/modules/lesson-plans/lesson-plans.js';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Lesson Plans script loaded');
                
                // Wait for module to be available
                let checkCount = 0;
                const maxChecks = 50;
                
                function waitForModule() {
                    if (window.lessonPlansModule || checkCount >= maxChecks) {
                        if (window.lessonPlansModule) {
                            console.log('✅ Lesson Plans Module initialized successfully');
                            resolve();
                        } else {
                            console.warn('⚠️ Lesson Plans Module not found after script load');
                            reject(new Error('Module not available'));
                        }
                        return;
                    }
                    
                    checkCount++;
                    setTimeout(waitForModule, 100);
                }
                
                waitForModule();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load lesson-plans.js');
                reject(new Error('Script load failed'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // Load the script
    loadLessonPlansScript().catch(error => {
        console.error('❌ Error loading Lesson Plans module:', error);
    });
    
})();

console.log('📚 Lesson Plans Entry Point - Setup completed');

// ============================================================================
// GLOBAL HELPER FUNCTIONS FOR COURSES & FINANCIAL TABS
// ============================================================================

/**
 * Link a lesson plan to a course
 */
window.linkLessonPlanToCourse = async function(lessonPlanId, courseId, courseName) {
    if (!confirm(`Vincular este plano de aula ao curso "${courseName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/lesson-plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ lessonPlanId })
        });

        if (!response.ok) {
            throw new Error('Erro ao vincular plano de aula');
        }

        window.app?.showToast?.('Plano de aula vinculado com sucesso!', 'success');
        
        // Reload courses tab
        if (window.lessonPlanEditor) {
            await window.lessonPlanEditor.loadCoursesData(lessonPlanId);
        }

    } catch (error) {
        console.error('❌ Erro ao vincular plano de aula:', error);
        window.app?.handleError?.(error, 'lesson-plans:link-course');
        window.app?.showToast?.('Erro ao vincular plano de aula ao curso', 'error');
    }
};

/**
 * Remove a lesson plan from a course
 */
window.removeLessonPlanFromCourse = async function(courseId, lessonPlanId) {
    if (!confirm('Tem certeza que deseja desvincular este plano de aula do curso?')) {
        return;
    }

    try {
        const response = await fetch(`/api/courses/${courseId}/lesson-plans/${lessonPlanId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao desvincular plano de aula');
        }

        window.app?.showToast?.('Plano de aula desvinculado com sucesso!', 'success');
        
        // Reload courses tab
        if (window.lessonPlanEditor) {
            await window.lessonPlanEditor.loadCoursesData(lessonPlanId);
        }

    } catch (error) {
        console.error('❌ Erro ao desvincular plano de aula:', error);
        window.app?.handleError?.(error, 'lesson-plans:unlink-course');
        window.app?.showToast?.('Erro ao desvincular plano de aula', 'error');
    }
};

/**
 * Open course details (navigate to course editor)
 */
window.openCourseDetails = function(courseId) {
    if (window.router) {
        window.router.navigate(`/courses/edit/${courseId}`);
    } else {
        window.location.href = `/courses/edit/${courseId}`;
    }
};

/**
 * Open courses manager
 */
window.openCoursesManager = function() {
    if (window.router) {
        window.router.navigate('/courses');
    } else {
        window.location.href = '/courses';
    }
};

// Temporary test function to verify loading
window.testLessonPlansModule = function() {
    console.log('🧪 Test function called - module loading works!');
    
    // Check if lesson-plans.js was loaded
    console.log('lessonPlansModule available:', !!window.lessonPlansModule);
    console.log('initLessonPlans available:', typeof window.initLessonPlans);
    
    // Try to list available functions
    const lessonPlansFunctions = [];
    for (let prop in window) {
        if (prop.includes('lesson') || prop.includes('LessonPlan')) {
            lessonPlansFunctions.push(prop + ': ' + typeof window[prop]);
        }
    }
    console.log('Lesson plans related functions:', lessonPlansFunctions);
    
    return true;
};
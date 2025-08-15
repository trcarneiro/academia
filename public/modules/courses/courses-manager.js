// Courses Manager Module - Isolated (CLAUDE.md compliant)
(function(window) {
    'use strict';
    
    let _courses = [];
    let _currentCourse = null;

    async function loadCoursesList() {
        try {
            const response = await fetch('/api/courses');
            const result = await response.json();
            _courses = result.data || [];
            renderCoursesTable(_courses);
            updateCoursesStats(_courses);
        } catch (error) {
            renderCoursesError(error.message);
        }
    }

    function renderCoursesTable(courses) {
        const tableBody = document.getElementById('courses-table-body');
        if (!tableBody) return;
        if (courses.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:2rem;">Nenhum curso encontrado</td></tr>`;
            return;
        }
        tableBody.innerHTML = courses.map(course => `
            <tr ondblclick="window.location.href='/modules/courses/course-editor.html?id=${course.id}'">
                <td>${course.name || '-'}</td>
                <td>${course.level || '-'}</td>
                <td>${course.instructor || '-'}</td>
                <td>${course.duration || '-'}h</td>
                <td>${course.status === 'active' ? 'Ativo' : 'Inativo'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="window.location.href='/modules/courses/course-editor.html?id=${course.id}'">Editar</button>
                </td>
            </tr>
        `).join('');
    }

    function updateCoursesStats(courses) {
        document.getElementById('totalCoursesCount').textContent = courses.length;
        document.getElementById('activeCoursesCount').textContent = courses.filter(c => c.status === 'active').length;
        const avg = courses.length ? (courses.reduce((sum, c) => sum + (c.duration || 0), 0) / courses.length).toFixed(1) : 0;
        document.getElementById('avgCourseDuration').textContent = avg + 'h';
    }

    function renderCoursesError(msg) {
        const tableBody = document.getElementById('courses-table-body');
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:2rem;">${msg}</td></tr>`;
    }

    window.openAddCoursePage = function() {
        navigateToModule('course-editor');
    };
    window.loadCoursesList = loadCoursesList;

    // Auto-load on page ready
    if (document.readyState !== 'loading') loadCoursesList();
    else document.addEventListener('DOMContentLoaded', loadCoursesList);

})(window);

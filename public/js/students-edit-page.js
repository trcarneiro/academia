/**
 * @fileoverview Student Edit Page Utilities - Modular
 * @version 1.0.0
 * @author Academia Team
 * @description
 * Utilities for the student edit page, separated for modularity.
 */

/**
 * Updates the header of the edit page with student information.
 * @param {object} student - The student object.
 */
export function updateEditPageHeader(student) {
    const user = student.user || {};
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Aluno sem nome';
    const studentId = student.id;
    const category = student.category || 'N/A';
    
    document.getElementById('editPageStudentName').textContent = fullName;
    document.getElementById('editPageStudentId').textContent = `ID: ${studentId}`;
    document.getElementById('editPageStudentCategory').textContent = `Categoria: ${category}`;
}

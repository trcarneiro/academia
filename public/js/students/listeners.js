// Event bindings for students list
import { switchStudentView } from './index.js';

export function initStudentEventListeners() {
  const studentSearch = document.getElementById('studentSearch');
  const tableViewBtn = document.getElementById('tableViewBtn');
  const gridViewBtn = document.getElementById('gridViewBtn');

  if (studentSearch) studentSearch.addEventListener('keyup', filterStudents);
  if (tableViewBtn) tableViewBtn.addEventListener('click', () => switchStudentView('table'));
  if (gridViewBtn) gridViewBtn.addEventListener('click', () => switchStudentView('grid'));

  const studentsTableBody = document.getElementById('studentsTableBody');
  const studentsGrid = document.getElementById('studentsGrid');
  if (studentsTableBody) studentsTableBody.addEventListener('dblclick', handleStudentDoubleClick);
  if (studentsGrid) studentsGrid.addEventListener('dblclick', handleStudentDoubleClick);
}

let searchDebounceTimer;
const SEARCH_DEBOUNCE_DELAY = 300;

function filterStudents(event) {
  const searchTerm = event.target.value.toLowerCase().trim();
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => performStudentSearch(searchTerm), SEARCH_DEBOUNCE_DELAY);
}

function performStudentSearch(searchTerm) {
  // Reuse a global source of truth if exposed on window (keeps compatibility)
  const data = window.allStudents || [];
  if (!searchTerm) {
    window.renderStudentsTable?.(data);
    window.renderStudentsGrid?.(data);
    return;
  }
  const filtered = data.filter((student) => {
    const user = student.user || {};
    const text = [user.firstName||'', user.lastName||'', user.email||'', user.phone||'', user.cpf||'', student.category||'', student.id||'']
      .join(' ').toLowerCase();
    return text.includes(searchTerm);
  });
  window.renderStudentsTable?.(filtered);
  window.renderStudentsGrid?.(filtered);
}

function handleStudentDoubleClick(event) {
  const target = event.target.closest('[data-student-id]');
  if (target) {
    const studentId = target.dataset.studentId;
    window.openStudentEditPage?.(studentId);
  }
}

// Students List Controller (module entry)
// Responsible only for list UI + navigation to editor

import { fetchStudents } from './service.js';
import { renderStudentsTable } from './view-table.js';
import { renderStudentsGrid } from './view-grid.js';
import { initStudentEventListeners } from './listeners.js';

let allStudents = [];
let currentView = 'table';

export async function loadAndRenderStudents() {
  showStudentsLoadingState();
  try {
    const result = await fetchStudents();
    allStudents = result || [];
    renderStudentsTable(allStudents);
    renderStudentsGrid(allStudents);
    hideStudentsLoadingState();
    updateStudentsCounter();
  } catch (error) {
    showStudentsErrorState(error.message || 'Erro ao carregar alunos');
  }
}

export function setAllStudents(students) {
  allStudents = students;
}

export function switchStudentView(view) {
  if (currentView === view) return;
  currentView = view;
  const table = document.getElementById('studentsTable');
  const grid = document.getElementById('studentsGrid');
  const tableBtn = document.getElementById('tableViewBtn');
  const gridBtn = document.getElementById('gridViewBtn');
  if (view === 'table') {
    tableBtn?.classList.add('active');
    gridBtn?.classList.remove('active');
    table && (table.style.display = '');
    grid && (grid.style.display = 'none');
  } else {
    tableBtn?.classList.remove('active');
    gridBtn?.classList.add('active');
    table && (table.style.display = 'none');
    grid && (grid.style.display = '');
  }
}

export { renderStudentsTable, renderStudentsGrid, initStudentEventListeners };

// Legacy window hooks for HTML inline usage
window.loadAndRenderStudents = loadAndRenderStudents;

// Helpers kept local to this module
function showStudentsLoadingState() {
  const tableBody = document.getElementById('studentsTableBody');
  const grid = document.getElementById('studentsGrid');
  const loadingHTML = `
    <div style="text-align: center; padding: 3rem; color: #6B7280;">
      <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #374151; border-top: 3px solid #3B82F6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
      <div>Carregando alunos...</div>
    </div>`;
  if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">${loadingHTML}</td></tr>`;
  if (grid) grid.innerHTML = loadingHTML;
}

function hideStudentsLoadingState() {
  // Intencionalmente vazio; as views sobrescrevem o conteúdo
}

function showStudentsErrorState(message) {
  const tableBody = document.getElementById('studentsTableBody');
  const grid = document.getElementById('studentsGrid');
  const errorHTML = `
    <div style="text-align: center; padding: 3rem; color: #EF4444;">
      <div style="font-size: 1.5rem; margin-bottom: 1rem;">❌</div>
      <div style="font-weight: 600; margin-bottom: 0.5rem;">Erro ao carregar alunos</div>
      <div style="font-size: 0.9rem; color: #9CA3AF;">${message}</div>
      <button onclick="loadAndRenderStudents()" style="margin-top: 1rem; background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">🔄 Tentar novamente</button>
    </div>`;
  if (tableBody) tableBody.innerHTML = `<tr><td colspan="7">${errorHTML}</td></tr>`;
  if (grid) grid.innerHTML = errorHTML;
}

function updateStudentsCounter() {
  const total = allStudents.length;
  const active = allStudents.filter(s => s.isActive).length;
  const counters = document.querySelectorAll('[data-students-counter]');
  counters.forEach((el) => (el.textContent = `${active}/${total}`));
}

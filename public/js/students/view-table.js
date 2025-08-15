// Table view renderer for students

export function renderStudentsTable(students) {
  const tableBody = document.getElementById('studentsTableBody');
  if (!tableBody) return false;
  if (!students || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
          <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">👥</div>
          <div>Nenhum aluno encontrado</div>
        </td>
      </tr>`;
    return true;
  }

  const html = students.map((student) => {
    const user = student.user || {};
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
    const category = student.category || 'N/A';
    const status = student.isActive ? 'Ativo' : 'Inativo';
    const statusColor = student.isActive ? '#10B981' : '#EF4444';
    const financialResponsible = student.financialResponsible?.name || 'Próprio aluno';

    return `
      <tr data-student-id="${student.id}" role="button" tabindex="0"
          aria-label="Editar aluno ${fullName}" style="cursor: pointer; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'"
          onmouseout="this.style.backgroundColor='transparent'"
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openStudentEditPage('${student.id}');}"
          onclick="openStudentEditPage('${student.id}')">
        <td style="font-family: monospace; font-size: 0.85rem;" aria-label="ID do aluno">${student.id.split('-')[0]}...</td>
        <td style="font-weight: 500; color: #F8FAFC;" aria-label="Nome completo">${fullName}</td>
        <td style="font-family: monospace; font-size: 0.85rem;" aria-label="CPF">${user.cpf || 'N/A'}</td>
        <td>
          <span style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${category}</span>
        </td>
        <td style="color: #94A3B8;">${financialResponsible}</td>
        <td>
          <span style="color: ${statusColor}; font-weight: 500;">●</span>
          <span style="color: ${statusColor}; margin-left: 0.25rem;">${status}</span>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem;" role="group" aria-label="Ações do aluno ${fullName}">
            <button onclick="event.stopPropagation(); openStudentEditPage('${student.id}')" style="background: #3B82F6; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;" title="Editar">✏️</button>
            <button onclick="event.stopPropagation(); confirmQuickCheckin('${student.id}', '${fullName}', '${student.id.split('-')[0]}')" style="background: #10B981; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;" title="Check-in rápido">✅</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tableBody.innerHTML = html;
  return true;
}

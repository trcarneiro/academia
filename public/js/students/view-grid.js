// Grid view renderer for students

export function renderStudentsGrid(students) {
  const grid = document.getElementById('studentsGrid');
  if (!grid) return false;

  if (!students || students.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #6B7280; grid-column: 1 / -1;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">👥</div>
        <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Nenhum aluno encontrado</div>
        <div style="font-size: 0.9rem;">Adicione seu primeiro aluno para começar</div>
      </div>`;
    return true;
  }

  const html = students.map((student) => {
    const user = student.user || {};
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não disponível';
    const category = student.category || 'N/A';
    const status = student.isActive ? 'Ativo' : 'Inativo';
    const statusColor = student.isActive ? '#10B981' : '#EF4444';
    const avatar = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3B82F6&color=fff&size=80`;

    return `
      <div data-student-id="${student.id}"
           style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6)); border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;"
           onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#3B82F6';"
           onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#334155';">
        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
          <img src="${avatar}" alt="${fullName}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #3B82F6; margin-right: 1rem;">
          <div style="flex: 1;">
            <h4 style="color: #F8FAFC; margin: 0; font-size: 1rem; font-weight: 600;">${fullName}</h4>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <span style="color: ${statusColor}; font-weight: 500;">●</span>
              <span style="color: ${statusColor}; font-size: 0.85rem;">${status}</span>
            </div>
          </div>
        </div>
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #94A3B8; font-size: 0.85rem;">Categoria:</span>
            <span style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${category}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94A3B8; font-size: 0.85rem;">ID:</span>
            <span style="color: #E5E7EB; font-size: 0.85rem; font-family: monospace;">${student.id.split('-')[0]}...</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button onclick="event.stopPropagation(); openStudentEditPage('${student.id}')" style="flex: 1; background: #3B82F6; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;" title="Editar aluno">✏️ Editar</button>
          <button onclick="event.stopPropagation(); confirmQuickCheckin('${student.id}', '${fullName}', '${student.id.split('-')[0]}')" style="background: #10B981; color: white; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="Check-in rápido">✅</button>
        </div>
      </div>`;
  }).join('');

  grid.innerHTML = html;
  return true;
}

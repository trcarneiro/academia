
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  
  if (!courseId) {
    showError('ID do curso não fornecido na URL.');
    return;
  }

  try {
    const response = await fetch(`/api/courses/${courseId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Curso não encontrado');
    }
    
    const course = result.data;
    
    // Preencher detalhes do curso
    document.getElementById('course-title').textContent = course.name;
    document.getElementById('course-description').textContent = course.description;
    document.getElementById('course-level').textContent = getLevelLabel(course.level);
    document.getElementById('course-duration').textContent = course.duration;
    
    const statusElement = document.getElementById('course-status');
    statusElement.textContent = getStatusLabel(course.status);
    statusElement.className = `status-badge ${course.status.toLowerCase()}`;

    // Adicionar botão de edição
    const editButton = document.getElementById('edit-course-btn');
    editButton.onclick = () => {
        window.location.href = `/views/course-editor.html?id=${courseId}`;
    };
    
  } catch (error) {
    showError(`Erro ao carregar curso: ${error.message}`);
  }
});

function showError(message) {
  const container = document.querySelector('.view-course-container');
  container.innerHTML = `<div class="error-state">${message}</div>`;
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Ativo',
        'draft': 'Rascunho',
    };
    return labels[status] || status;
}

function getLevelLabel(level) {
    const labels = {
        'BEGINNER': 'Iniciante',
        'INTERMEDIATE': 'Intermediário',
        'ADVANCED': 'Avançado',
        'EXPERT': 'Especialista',
        'MASTER': 'Mestre',
    };
    return labels[level] || level;
}

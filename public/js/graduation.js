// public/js/graduation.js

// ========================================
// Functions for Graduation
// ========================================

export function loadGraduation() {
    console.log('loadGraduation called');
    // Mock data for graduation
    const graduation = {
        nextGraduationDate: '2024-12-15',
        eligibleStudents: [
            { id: 1, name: 'João da Silva' },
            { id: 3, name: 'Carlos Pereira' }
        ]
    };
    renderGraduation(graduation);
}

export function renderGraduation(graduation) {
    console.log('renderGraduation called with:', graduation);
    const container = document.getElementById('graduation-container');
    if (!container) {
        console.error('Graduation container not found');
        return;
    }
    container.innerHTML = `
        <p>Próxima Graduação: ${graduation.nextGraduationDate}</p>
        <h4>Alunos Elegíveis</h4>
        <ul>
            ${graduation.eligibleStudents.map(student => `<li>${student.name}</li>`).join('')}
        </ul>
        <button onclick="startGraduation()">Iniciar Processo de Graduação</button>
    `;
}

export function startGraduation() {
    console.log('Starting graduation process...');
    // In a real app, this would trigger a more complex workflow
    alert('Processo de graduação iniciado!');
}

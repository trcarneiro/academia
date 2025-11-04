// Script para debug das técnicas no navegador
// Execute este código no console do navegador:

console.log('=== DEBUG TÉCNICAS ===');

// 1. Verificar se as técnicas foram carregadas
console.log('loadedTechniques:', window.loadedTechniques);
console.log('Número de técnicas carregadas:', window.loadedTechniques ? window.loadedTechniques.length : 'loadedTechniques é undefined');

// 2. Verificar o mapeamento atual
console.log('scheduleTechniquesMap:', window.scheduleTechniquesMap);

// 3. Verificar se o cronograma está visível
const scheduleContainer = document.getElementById('schedule-container');
console.log('Schedule container encontrado:', !!scheduleContainer);
console.log('Schedule container visível:', scheduleContainer && scheduleContainer.style.display !== 'none');

// 4. Verificar as aulas geradas
const lessonElements = document.querySelectorAll('.lesson-item');
console.log('Número de aulas no DOM:', lessonElements.length);

if (lessonElements.length > 0) {
    const firstLesson = lessonElements[0];
    console.log('Primeira aula HTML:', firstLesson.outerHTML.substring(0, 200) + '...');
    
    // Verificar se tem técnicas na primeira aula
    const techniquesList = firstLesson.querySelector('.techniques-list');
    console.log('Lista de técnicas encontrada na primeira aula:', !!techniquesList);
    
    if (techniquesList) {
        console.log('Conteúdo da lista de técnicas:', techniquesList.innerHTML);
    }
}

// 5. Forçar nova atribuição e renderização
if (window.forceRegenerateSchedule) {
    console.log('Forçando nova geração do cronograma...');
    window.forceRegenerateSchedule();
} else {
    console.log('Função forceRegenerateSchedule não encontrada');
}

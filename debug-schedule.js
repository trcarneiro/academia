// Debug script para testar o cronograma
// Cole este código no console do navegador

console.log('🔧 DEBUGGING SCHEDULE...');

// 1. Verificar se as técnicas estão carregadas
console.log('📚 loadedTechniques:', window.loadedTechniques || 'UNDEFINED');

// 2. Forçar carregamento das técnicas
const mockTechniques = [
  { id: 1, name: 'Jab Básico', title: 'Jab Básico', complexity: 'EASY', difficulty: 'Iniciante' },
  { id: 2, name: 'Cross Básico', title: 'Cross Básico', complexity: 'EASY', difficulty: 'Iniciante' },
  { id: 3, name: 'Defesa contra Estrangulamento', title: 'Defesa contra Estrangulamento', complexity: 'MEDIUM', difficulty: 'Intermediário' },
  { id: 4, name: 'Chute Frontal', title: 'Chute Frontal', complexity: 'MEDIUM', difficulty: 'Intermediário' },
  { id: 5, name: 'Técnicas de Solo', title: 'Técnicas de Solo', complexity: 'HARD', difficulty: 'Avançado' }
];

// Forçar técnicas globais
if (typeof loadedTechniques !== 'undefined') {
  loadedTechniques = mockTechniques;
  console.log('✅ loadedTechniques forçadas:', loadedTechniques);
}

// 3. Verificar scheduleTechniquesMap
if (typeof scheduleTechniquesMap !== 'undefined') {
  console.log('📋 scheduleTechniquesMap atual:', scheduleTechniquesMap);
}

// 4. Forçar atribuição de técnicas
function forceAssignTechniques() {
  const totalLessons = 32;
  const assignments = {};
  
  for (let lesson = 1; lesson <= totalLessons; lesson++) {
    const lessonTechniques = [];
    const numTechniques = Math.min(3, mockTechniques.length);
    
    for (let i = 0; i < numTechniques; i++) {
      const techIndex = (lesson * i) % mockTechniques.length;
      lessonTechniques.push(mockTechniques[techIndex]);
    }
    
    assignments[lesson.toString()] = lessonTechniques;
  }
  
  return assignments;
}

const forceAssigned = forceAssignTechniques();
console.log('🎯 Técnicas forçadas:', forceAssigned);

// 5. Atualizar scheduleTechniquesMap se existir
if (typeof scheduleTechniquesMap !== 'undefined') {
  scheduleTechniquesMap.clear();
  Object.keys(forceAssigned).forEach(lessonNum => {
    scheduleTechniquesMap.set(lessonNum, forceAssigned[lessonNum]);
  });
  console.log('📌 scheduleTechniquesMap atualizado:', scheduleTechniquesMap);
}

// 6. Tentar renderizar novamente
if (typeof generateScheduleAutomatically === 'function') {
  console.log('🔄 Regenerando cronograma...');
  generateScheduleAutomatically();
} else if (typeof window.forceRegenerateSchedule === 'function') {
  window.forceRegenerateSchedule();
} else {
  console.log('⚠️ Função de regeneração não encontrada');
}

console.log('🏁 Debug completo!');

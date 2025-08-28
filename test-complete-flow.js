// Teste de importação com as correções
const testData = {
  techniques: [
    {
      id: "teste-tecnica-nova-123",
      title: "Técnica de Teste - Verificação do Sistema",
      description: "Esta é uma técnica de teste para verificar se o sistema está criando atividades automaticamente",
      type: "TECHNIQUE",
      difficulty: "BEGINNER",
      defaultParams: {
        repetitions: {
          "Adulto Masculino": 10,
          "Adulto Feminino": 8
        },
        duration: "3 minutos",
        precision: "80%"
      }
    }
  ]
};

console.log('🚀 Iniciando teste de importação...');

try {
  console.log('📤 Enviando técnica para importação...');
  
  const response = await fetch('http://localhost:3000/api/courses/import-techniques', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  console.log('📥 Resposta recebida:', response.status);
  
  if (response.ok) {
    const result = await response.json();
    console.log('✅ Importação bem-sucedida:', result);
    
    // Aguardar um pouco para o processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se a atividade foi criada
    console.log('🔍 Verificando atividades criadas...');
    const activitiesResponse = await fetch('http://localhost:3000/api/activities');
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('🏋️ Atividades encontradas:', activities.length);
      
      // Procurar pela nossa técnica
      const newActivity = activities.find(act => 
        act.refTechnique && act.refTechnique.id === testData.techniques[0].id
      );
      
      if (newActivity) {
        console.log('🎉 SUCESSO! Atividade criada automaticamente:', newActivity.title);
        console.log('🔗 Técnica referenciada:', newActivity.refTechnique.title);
      } else {
        console.log('❌ Atividade não foi criada automaticamente');
        console.log('📋 Atividades disponíveis:', activities.map(a => a.title));
      }
    } else {
      console.log('❌ Erro ao buscar atividades:', activitiesResponse.status);
    }
    
  } else {
    const error = await response.text();
    console.log('❌ Erro na importação:', error);
  }
  
} catch (error) {
  console.error('💥 Erro durante teste:', error);
}

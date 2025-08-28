// Teste de importação de técnicas
const testTechnique = {
  techniques: [
    {
      id: "test-technique-123",
      title: "Técnica de Teste",
      description: "Uma técnica de teste para verificar o sistema",
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

async function testImport() {
  try {
    const response = await fetch('http://localhost:3000/api/courses/import-techniques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTechnique)
    });

    const result = await response.json();
    console.log('Import Result:', result);

    // Verificar se a atividade foi criada
    const activitiesResponse = await fetch('http://localhost:3000/api/activities');
    const activities = await activitiesResponse.json();
    console.log('Activities:', activities);

  } catch (error) {
    console.error('Error:', error);
  }
}

testImport();

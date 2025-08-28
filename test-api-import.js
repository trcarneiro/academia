const fetch = require('node-fetch');

async function testTechniqueImport() {
  try {
    console.log('🧪 Testing technique import via API...');
    
    const testTechnique = {
      id: 'test-cotovelada-lateral',
      title: 'Test Cotovelada Lateral',
      description: 'Golpe com cotovelo lateral, visando a cabeça ou costelas do agressor.',
      type: 'TECHNIQUE',
      difficulty: 'BEGINNER',
      defaultParams: {
        repetitions: {
          'Adulto Masculino': 30,
          'Adulto Feminino': 25
        },
        duration: '2 minutos',
        precision: '80%'
      }
    };
    
    const response = await fetch('http://localhost:3000/api/courses/import-techniques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techniques: [testTechnique] })
    });
    
    const result = await response.json();
    console.log('📊 API Response:', result);
    
    if (response.ok && result.success) {
      console.log('✅ Import successful!');
      console.log('• Imported:', result.data.imported);
      console.log('• Updated:', result.data.updated);
      console.log('• Skipped:', result.data.skipped);
      console.log('• Total:', result.data.total);
    } else {
      console.log('❌ Import failed:', result.error || result.details);
    }
    
  } catch (error) {
    console.error('❌ Error testing import:', error);
  }
}

testTechniqueImport();

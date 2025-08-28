const fs = require('fs');
const fetch = require('node-fetch');

async function importAllTechniques() {
  try {
    console.log('🚀 Iniciando importação de todas as 60 técnicas...');
    
    // Read the techniques file
    const techniquesData = JSON.parse(fs.readFileSync('Tecnicas.json', 'utf8'));
    console.log(`📂 Carregadas ${techniquesData.length} técnicas do arquivo`);
    
    let imported = 0;
    let updated = 0;
    let failed = 0;
    
    // Process each technique
    for (const technique of techniquesData) {
      try {
        console.log(`\n🔄 Processando: ${technique.title}`);
        
        // Map difficulty to enum format
        const difficultyMap = {
          'Iniciante': 'BEGINNER',
          'Intermediário': 'INTERMEDIATE',
          'Avançado': 'ADVANCED'
        };
        
        const mappedTechnique = {
          id: technique.id,
          title: technique.title,
          description: technique.description,
          type: technique.type,
          difficulty: difficultyMap[technique.difficulty] || 'BEGINNER',
          defaultParams: technique.defaultParams
        };
        
        // Import via API
        const response = await fetch('http://localhost:3000/api/courses/import-techniques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ techniques: [mappedTechnique] })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          if (result.data.imported > 0) {
            console.log(`✅ Nova técnica criada: ${technique.id}`);
            imported++;
          } else if (result.data.updated > 0) {
            console.log(`🔄 Técnica atualizada: ${technique.id}`);
            updated++;
          } else {
            console.log(`⏭️ Técnica ignorada: ${technique.id}`);
          }
        } else {
          console.error(`❌ Falha ao importar ${technique.id}:`, result.error || result.details);
          failed++;
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro processando ${technique.id}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`• Total processadas: ${techniquesData.length}`);
    console.log(`• Novas técnicas: ${imported}`);
    console.log(`• Técnicas atualizadas: ${updated}`);
    console.log(`• Falhas: ${failed}`);
    console.log(`• Taxa de sucesso: ${Math.round(((imported + updated) / techniquesData.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Erro geral na importação:', error);
  }
}

importAllTechniques();

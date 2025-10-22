import fs from 'fs';
import path from 'path';

/**
 * Script para corrigir JSON do curso Krav Maga Faixa Branca
 * 
 * Correções aplicadas:
 * 1. Remove comentários JSON (sintaxe inválida)
 * 2. Adiciona arrays 'activities' nas lições (necessário para importer v2.0)
 * 3. Mapeia atividades baseado nos nomes das lições
 * 4. Distribui repetições planejadas entre atividades
 */

// Mapeamento de palavras-chave para categorias
const categoryKeywords = {
  posturas: ['guarda', 'posição', 'postura', 'ortodoxa', 'canhota', 'boxe', 'luta'],
  socos: ['jab', 'direto', 'gancho', 'uppercut', 'soco', 'cotovelada'],
  chutes: ['chute', 'joelhada', 'frontal', 'lateral', 'circular', 'baixo'],
  defesas: ['defesa', 'bloqueio', 'proteção', 'estrangulamento', 'agarramento', '360'],
  quedas: ['queda', 'rolamento', 'tombo', 'amortecimento'],
  combinacoes: ['combinação', 'sequência', 'encadeamento']
};

/**
 * Infere categoria baseado no nome da atividade
 */
function inferCategory(activityName: string): string {
  const lowerName = activityName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  // Default: socos (mais comum em Krav Maga)
  return 'socos';
}

/**
 * Gera ID único e válido para técnica
 * Remove acentos, caracteres especiais, normaliza hífens
 */
function generateTechniqueId(activityName: string): string {
  return activityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove TODOS os caracteres especiais (+, /, ., etc)
    .replace(/\s+/g, '-') // Espaços → hífens
    .replace(/-+/g, '-') // Múltiplos hífens → um só
    .replace(/^-|-$/g, ''); // Remove hífens nas pontas
}

/**
 * Extrai atividades do nome da lição
 * Exemplo: "Aula 1 - Fundamentos: Guarda de Boxe, Jab"
 * → ["Guarda de Boxe", "Jab"]
 */
function extractActivities(lessonName: string, totalReps: number): any[] {
  // Remover número e prefixo da aula
  const cleaned = lessonName.replace(/^Aula \d+ - /, '');
  
  // Separar por : para pegar apenas as técnicas
  const parts = cleaned.split(':');
  let techniquesText = parts.length > 1 ? parts[1] : parts[0];
  
  // Remover texto entre parênteses (são módulos teóricos, não atividades físicas)
  techniquesText = techniquesText.replace(/\(.*?\)/g, '');
  
  // Separar por vírgula e limpar
  const techniques = techniquesText
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  // Se não encontrou técnicas, tentar extrair de outra forma
  if (techniques.length === 0) {
    // Para aulas de revisão ou teste
    if (/revisão|teste|mini-teste/i.test(lessonName)) {
      return [{
        name: 'Revisão Geral de Técnicas',
        category: 'combinacoes',
        minimumRepetitions: Math.floor(totalReps * 0.8),
        recommendedRepetitions: totalReps,
        intensity: 'MODERATE'
      }];
    }
    
    // Para simulações
    if (/simulação/i.test(lessonName)) {
      return [{
        name: 'Simulação de Combate Realista',
        category: 'combinacoes',
        minimumRepetitions: Math.floor(totalReps * 0.8),
        recommendedRepetitions: totalReps,
        intensity: 'HIGH'
      }];
    }
  }
  
  // Distribuir repetições entre as técnicas
  const repsPerActivity = Math.floor(totalReps / Math.max(techniques.length, 1));
  
  return techniques.map(name => {
    const category = inferCategory(name);
    const techniqueId = generateTechniqueId(name); // Usar função melhorada
    
    return {
      name,
      category,
      techniqueId, // Adicionar ID para debug
      minimumRepetitions: Math.floor(repsPerActivity * 0.7), // 70% do planejado
      recommendedRepetitions: repsPerActivity,
      intensity: category === 'combinacoes' ? 'HIGH' : 'MODERATE'
    };
  });
}

/**
 * Remove comentários JSON (múltiplos passes para garantir limpeza completa)
 */
function removeComments(jsonString: string): string {
  let cleaned = jsonString;
  
  // Pass 1: Remove comentários de linha única em propriedades: , // ...
  cleaned = cleaned.replace(/,\s*\/\/.*$/gm, ',');
  
  // Pass 2: Remove comentários de linha única sozinhos: // ... (sem vírgula antes)
  // Importante: fazer isso linha por linha para não quebrar o JSON
  const lines = cleaned.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    // Remove linhas que são apenas comentários
    return !trimmed.startsWith('//');
  });
  
  cleaned = cleanedLines.join('\n');
  
  // Pass 3: Remove comentários inline no meio de linhas (após valores)
  // Ex: "value": 123 // comment
  cleaned = cleaned.replace(/\s*\/\/.*$/gm, '');
  
  return cleaned;
}

/**
 * Processa o arquivo JSON
 */
async function fixCourseJSON() {
  const inputPath = path.join(process.cwd(), 'cursos', 'cursokravmagafaixabranca.json');
  const outputPath = path.join(process.cwd(), 'cursos', 'cursokravmagafaixabranca-FIXED.json');
  
  console.log('📖 Lendo arquivo:', inputPath);
  
  // Ler arquivo
  const rawContent = fs.readFileSync(inputPath, 'utf8');
  
  console.log('🧹 Removendo comentários...');
  const cleanedContent = removeComments(rawContent);
  
  console.log('🔍 Parseando JSON...');
  const data = JSON.parse(cleanedContent);
  
  console.log('✨ Adicionando atividades às lições...');
  let totalActivitiesAdded = 0;
  
  data.course.lessons.forEach((lesson: any) => {
    const activities = extractActivities(
      lesson.name,
      lesson.totalRepetitionsPlanned || 100
    );
    
    lesson.activities = activities;
    totalActivitiesAdded += activities.length;
    
    console.log(`  ✓ Aula ${lesson.lessonNumber}: ${activities.length} atividades`);
  });
  
  console.log(`\n✅ Total de atividades adicionadas: ${totalActivitiesAdded}`);
  
  // Salvar arquivo corrigido
  console.log('\n💾 Salvando arquivo corrigido:', outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  
  console.log('\n🎉 SUCESSO! Arquivo corrigido salvo em:');
  console.log(`   ${outputPath}`);
  console.log('\n📊 Resumo das correções:');
  console.log(`   - Comentários removidos: ✓`);
  console.log(`   - Atividades adicionadas: ${totalActivitiesAdded}`);
  console.log(`   - Lições processadas: ${data.course.lessons.length}`);
  console.log('\n💡 Próximo passo:');
  console.log('   Use o endpoint POST /api/courses/import com o arquivo -FIXED.json');
}

// Executar
fixCourseJSON().catch(error => {
  console.error('❌ Erro ao processar arquivo:', error);
  process.exit(1);
});

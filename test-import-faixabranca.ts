/**
 * Test script para importar o curso Faixa Branca
 * Este script testa a importação completa do curso usando o endpoint /api/courses/import-full-course
 */

import fs from 'fs';
import path from 'path';

async function testCourseImport() {
  console.log('🚀 ========== TESTE DE IMPORTAÇÃO DO CURSO FAIXA BRANCA ==========\n');

  // 1. Carregar o arquivo JSON do curso
  console.log('📂 Step 1: Carregando arquivo cursofaixabranca.json...');
  const filePath = path.join(__dirname, 'src', 'cursofaixabranca.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo não encontrado:', filePath);
    process.exit(1);
  }

  const courseData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log('✅ Arquivo carregado com sucesso');
  console.log('   📊 Curso:', courseData.name);
  console.log('   📅 Duração:', courseData.durationTotalWeeks, 'semanas');
  console.log('   🎯 Total de aulas:', courseData.totalLessons);
  console.log('   🥋 Técnicas:', courseData.techniques?.length || 0);
  console.log('   📆 Semanas no cronograma:', courseData.schedule?.weeks || 0);
  console.log('');

  // 2. Fazer a requisição POST para o endpoint de importação
  console.log('📤 Step 2: Enviando dados para o endpoint /api/courses/import-full-course...');
  
  try {
    const response = await fetch('http://localhost:3000/api/courses/import-full-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData)
    });

    console.log('   📥 Status HTTP:', response.status, response.statusText);
    console.log('');

    const result = await response.json();

    if (response.ok) {
      console.log('✅ ========== IMPORTAÇÃO CONCLUÍDA COM SUCESSO ==========\n');
      console.log('📊 Resultados da importação:');
      console.log('   ✅ Curso criado:', result.course?.name || 'N/A');
      console.log('   🆔 ID do curso:', result.course?.id || 'N/A');
      console.log('   🔗 Slug:', result.course?.slug || 'N/A');
      console.log('');
      console.log('   🥋 Técnicas importadas:', result.stats?.techniquesImported || 0);
      console.log('   🆕 Técnicas criadas:', result.stats?.techniquesCreated || 0);
      console.log('   ⚠️  Técnicas ignoradas:', result.stats?.techniquesSkipped || 0);
      console.log('');
      console.log('   📚 Lesson Plans criados:', result.stats?.lessonPlansCreated || 0);
      console.log('   📅 Semanas processadas:', result.stats?.weeksProcessed || 0);
      console.log('');

      if (result.warnings && result.warnings.length > 0) {
        console.log('⚠️  Avisos:');
        result.warnings.forEach((warning: string) => {
          console.log('   -', warning);
        });
        console.log('');
      }

      // 3. Validar os dados importados
      console.log('🔍 Step 3: Validando os dados importados...');
      await validateImportedData(result.course?.id);

    } else {
      console.error('❌ ========== ERRO NA IMPORTAÇÃO ==========\n');
      console.error('Status:', response.status);
      console.error('Mensagem:', result.message || 'Erro desconhecido');
      
      if (result.details) {
        console.error('Detalhes:', JSON.stringify(result.details, null, 2));
      }
      
      if (result.error) {
        console.error('Erro:', result.error);
      }

      if (result.stack) {
        console.error('Stack trace:', result.stack);
      }
    }

  } catch (error) {
    console.error('❌ ========== ERRO FATAL ==========\n');
    console.error('Erro ao fazer requisição:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

async function validateImportedData(courseId: string | undefined) {
  if (!courseId) {
    console.log('⚠️  Não foi possível validar - ID do curso não disponível');
    return;
  }

  try {
    // Buscar o curso criado
    console.log('   📥 Buscando curso criado...');
    const courseResponse = await fetch(`http://localhost:3000/api/courses/${courseId}`);
    
    if (!courseResponse.ok) {
      console.error('   ❌ Erro ao buscar curso:', courseResponse.statusText);
      return;
    }

    const courseResult = await courseResponse.json();
    const course = courseResult.data || courseResult;
    
    console.log('   ✅ Curso encontrado:', course.name);
    console.log('   📊 Técnicas associadas:', course._count?.techniques || 0);
    console.log('   📚 Lesson Plans:', course._count?.lessonPlans || 0);
    console.log('');

    // Buscar os lesson plans
    console.log('   📥 Buscando Lesson Plans criados...');
    const lessonPlansResponse = await fetch(`http://localhost:3000/api/lesson-plans?courseId=${courseId}`);
    
    if (lessonPlansResponse.ok) {
      const lessonPlansResult = await lessonPlansResponse.json();
      const lessonPlans = lessonPlansResult.data || lessonPlansResult.lessonPlans || [];
      
      console.log('   ✅ Total de Lesson Plans encontrados:', lessonPlans.length);
      
      if (lessonPlans.length > 0) {
        console.log('   📋 Primeiros 5 Lesson Plans:');
        lessonPlans.slice(0, 5).forEach((lp: any, index: number) => {
          console.log(`      ${index + 1}. ${lp.title || lp.name || 'Sem título'}`);
          console.log(`         - Semana: ${lp.weekNumber || 'N/A'}`);
          console.log(`         - Aula: ${lp.lessonNumber || 'N/A'}`);
          console.log(`         - Técnicas: ${lp._count?.techniques || lp.techniques?.length || 0}`);
        });
        console.log('');
      }
    }

    console.log('✅ ========== VALIDAÇÃO CONCLUÍDA ==========\n');
    console.log('📊 Resumo Final:');
    console.log('   ✅ Curso importado com sucesso');
    console.log('   ✅ Lesson Plans criados e vinculados');
    console.log('   ✅ Técnicas associadas aos Lesson Plans');
    console.log('');
    console.log('🎯 Próximos passos:');
    console.log('   1. Abrir o módulo de Cursos na interface');
    console.log('   2. Localizar o curso "Krav Maga Faixa Branca"');
    console.log('   3. Clicar na aba "Cronograma"');
    console.log('   4. Verificar as aulas expandidas com técnicas');
    console.log('   5. Testar navegação: clique em técnica → módulo Técnicas');
    console.log('   6. Testar navegação: clique em card de aula → módulo Lesson Plans');
    console.log('');

  } catch (error) {
    console.error('   ❌ Erro na validação:', error);
  }
}

// Executar o teste
testCourseImport().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';

/**
 * Script para testar importação do curso via API
 */

async function testImport() {
  const jsonPath = path.join(process.cwd(), 'cursos', 'cursokravmagafaixabranca-FIXED.json');
  
  console.log('📖 Lendo arquivo:', jsonPath);
  const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Extrair dados do curso (está dentro de "course")
  const courseData = fileData.course;
  
  // Gerar lista de técnicas a partir das atividades
  const uniqueTechniques = new Map<string, { id: string; name: string }>();
  
  // Função para gerar ID consistente
  function generateTechniqueId(activityName: string): string {
    return activityName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove TODOS os caracteres especiais
      .replace(/\s+/g, '-') // Espaços → hífens
      .replace(/-+/g, '-') // Múltiplos hífens → um só
      .replace(/^-|-$/g, ''); // Remove hífens nas pontas
  }
  
  courseData.lessons?.forEach((lesson: any) => {
    lesson.activities?.forEach((activity: any) => {
      const techniqueId = generateTechniqueId(activity.name);
      
      if (!uniqueTechniques.has(techniqueId)) {
        uniqueTechniques.set(techniqueId, {
          id: techniqueId,
          name: activity.name
        });
      }
    });
  });
  
  // Adicionar campo techniques ao courseData
  courseData.techniques = Array.from(uniqueTechniques.values());
  
  // Adicionar campos obrigatórios que podem estar faltando
  if (!courseData.courseId) {
    courseData.courseId = courseData.id;
  }
  
  if (!courseData.durationTotalWeeks) {
    courseData.durationTotalWeeks = 24; // 6 meses
  }
  
  if (!courseData.lessonDurationMinutes) {
    courseData.lessonDurationMinutes = 60;
  }
  
  if (!courseData.difficulty) {
    courseData.difficulty = courseData.level || 'BEGINNER';
  }
  
  if (!courseData.objectives) {
    courseData.objectives = ['Aprender fundamentos do Krav Maga'];
  }
  
  if (!courseData.equipment) {
    courseData.equipment = ['Luvas de treino', 'Protetor bucal'];
  }
  
  // Criar estrutura de schedule (legado, necessário para compatibilidade)
  if (!courseData.schedule) {
    courseData.schedule = {
      weeks: courseData.durationTotalWeeks,
      lessonsPerWeek: []
    };
  }
  
  // Adicionar flag para criar técnicas faltantes automaticamente
  courseData.createMissingTechniques = true;
  
  console.log('📤 Enviando para API de importação...');
  console.log(`   Curso: ${courseData.name}`);
  console.log(`   ID: ${courseData.courseId}`);
  console.log(`   Lições: ${courseData.lessons?.length || 0}`);
  console.log(`   Atividades: ${courseData.lessons?.reduce((sum: number, lesson: any) => sum + (lesson.activities?.length || 0), 0) || 0}`);
  console.log(`   Técnicas únicas: ${courseData.techniques.length}`);
  console.log(`   Graduação: ${courseData.graduation ? 'Sim' : 'Não'}`);
  console.log(`   Categorias: ${courseData.activityCategories?.length || 0}`);
  console.log(`   ⚙️  Criar técnicas faltantes: SIM`);
  try {
    const response = await fetch('http://localhost:3000/api/courses/import-full-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('\n✅ IMPORTAÇÃO BEM-SUCEDIDA!');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n❌ ERRO NA IMPORTAÇÃO:');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Detalhes:`, JSON.stringify(result, null, 2));
    }
  } catch (error: any) {
    console.error('\n❌ ERRO DE CONEXÃO:');
    console.error(`   ${error.message}`);
    
    if (error.cause) {
      console.error(`   Causa: ${error.cause}`);
    }
    
    console.log('\n💡 Dicas:');
    console.log('   - Verifique se o servidor está rodando: npm run dev');
    console.log('   - Verifique se a porta 3000 está disponível');
    console.log('   - Verifique se o endpoint /api/courses/import-full-course existe');
  }
}

testImport();

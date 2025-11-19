// Script para testar as novas rotas de check-in
const organizationId = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
const pedroId = 'dc9c17ff-582c-45c6-bc46-7eee1cee4564';

const baseUrl = 'http://localhost:3000/api';

async function testCourseProgress() {
  console.log('\n🧪 Testando /api/students/:id/course-progress\n');
  
  try {
    const response = await fetch(`${baseUrl}/students/${pedroId}/course-progress`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data.hasCourse) {
      console.log('\n✅ Pedro Teste - Progresso do Curso:');
      console.log(`   Curso: ${data.data.course.name}`);
      console.log(`   Progresso: ${data.data.percentage}%`);
      console.log(`   Atividades: ${data.data.completedActivities}/${data.data.totalActivities}`);
      console.log(`   Média: ${data.data.averageRating.toFixed(2)}/10`);
      console.log(`   Graduação: ${data.data.isEligibleForGraduation ? '✅ PRONTO' : '❌ NÃO PRONTO'}`);
      console.log(`   Status: ${data.data.eligibilityStatus}`);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function testTurmasAvailable() {
  console.log('\n🧪 Testando /api/turmas/available-now\n');
  
  try {
    const response = await fetch(`${baseUrl}/turmas/available-now?organizationId=${organizationId}&studentId=${pedroId}`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Turmas Disponíveis:');
      console.log(`   Abertas AGORA: ${data.data.openNow.length}`);
      console.log(`   Próximas: ${data.data.upcoming.length}`);
      console.log(`   Dia atual: ${data.data.currentDay}`);
      console.log(`   Horário atual: ${data.data.currentTime}`);
      
      if (data.data.openNow.length > 0) {
        console.log('\n📍 Turmas para Check-in AGORA:');
        data.data.openNow.forEach(turma => {
          console.log(`   • ${turma.name} - ${turma.startTime} às ${turma.endTime}`);
          console.log(`     Instrutor: ${turma.instructor}`);
          console.log(`     Local: ${turma.room}`);
          console.log(`     Vagas: ${turma.availableSlots}/${turma.maxStudents}`);
        });
      }
      
      if (data.data.upcoming.length > 0) {
        console.log('\n⏰ Próximas Turmas:');
        data.data.upcoming.slice(0, 3).forEach(turma => {
          console.log(`   • ${turma.name} - ${turma.startTime} (abre em ${turma.opensIn})`);
          console.log(`     Instrutor: ${turma.instructor}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function main() {
  console.log('🚀 Testando APIs de Check-in v2.0\n');
  console.log('Pedro Teste ID:', pedroId);
  console.log('Organization ID:', organizationId);
  
  await testCourseProgress();
  await testTurmasAvailable();
  
  console.log('\n✅ Testes concluídos!\n');
}

main();

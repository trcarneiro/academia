import fetch from 'node-fetch';

const url = 'http://localhost:3000/api/turmas/available-now';
const params = new URLSearchParams({
  organizationId: 'ff5ee00e-d8a3-4291-9428-d28b852fb472',
  studentId: 'dc9c17ff-582c-45c6-bc46-7eee1cee4564'
});

console.log('🧪 Testando API com nova lógica (TurmaLesson)...\n');

try {
  const response = await fetch(`${url}?${params}`);
  const data = await response.json();
  
  console.log('✅ Resposta da API:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.success && data.data) {
    console.log('\n📊 Resumo:');
    console.log(`  - openNow: ${data.data.total?.openNow || 0}`);
    console.log(`  - upcoming: ${data.data.total?.upcoming || 0}`);
    
    if (data.data.openNow?.length > 0) {
      console.log('\n🎉 SUCESSO! Turmas com check-in aberto:');
      data.data.openNow.forEach((turma, i) => {
        console.log(`  ${i + 1}. ${turma.name} - ${turma.startTime}`);
        console.log(`     lessonId: ${turma.lessonId}`);
      });
    } else {
      console.log('\n⚠️ Nenhuma turma com check-in aberto no momento');
    }
  }
} catch (error) {
  console.error('❌ Erro ao chamar API:', error);
}

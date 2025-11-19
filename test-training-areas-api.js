// Script de teste: Verificar API de Training Areas
const headers = {
    'x-organization-id': 'ff5ee00e-d8a3-4291-9428-d28b852fb472'
};

console.log('🔍 Testando endpoint /api/training-areas...\n');

fetch('http://localhost:3001/api/training-areas', {
    headers: headers
})
.then(response => response.json())
.then(data => {
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.length > 0) {
        console.log('\n🎯 Training Areas encontradas:');
        data.data.forEach(area => {
            console.log(`  • ${area.name} - Capacidade: ${area.capacity} pessoas`);
            console.log(`    ID: ${area.id}`);
            console.log(`    Unit: ${area.unit?.name || 'N/A'}\n`);
        });
    } else {
        console.log('\n⚠️ Nenhuma área de treino encontrada!');
    }
})
.catch(error => {
    console.error('❌ Erro ao buscar training areas:', error);
});

// Teste diagnóstico para verificar se APIs estão funcionando
console.log('🔍 Iniciando diagnóstico do sistema...');

async function diagnosticoCompleto() {
    const baseURL = 'http://localhost:3000';
    
    console.log('🌐 Testando conectividade...');
    
    try {
        // Teste 1: Health Check
        console.log('📊 Teste 1: Health Check...');
        const healthResponse = await fetch(`${baseURL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health:', healthData);
        
        // Teste 2: API de Alunos
        console.log('👥 Teste 2: API de Alunos...');
        const studentsResponse = await fetch(`${baseURL}/api/students`);
        const studentsData = await studentsResponse.json();
        console.log('📋 Students:', studentsData);
        
        // Teste 3: API de Organizações
        console.log('🏢 Teste 3: API de Organizações...');
        const orgsResponse = await fetch(`${baseURL}/api/organizations`);
        const orgsData = await orgsResponse.json();
        console.log('📋 Organizations:', orgsData);
        
        // Teste 4: API de Cursos
        console.log('📚 Teste 4: API de Cursos...');
        const coursesResponse = await fetch(`${baseURL}/api/courses`);
        const coursesData = await coursesResponse.json();
        console.log('📋 Courses:', coursesData);
        
        console.log('✅ Diagnóstico completo!');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
}

// Executar diagnóstico
diagnosticoCompleto();

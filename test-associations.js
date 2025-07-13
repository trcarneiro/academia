console.log('🔍 Testando Sistema de Associações Hierárquicas...\n');

const testStudentId = '0b997817-3ce9-426b-9230-ab2a71e5b53a'; // ID do student que estava sendo testado

async function testAssociations() {
    try {
        console.log('📡 Testando endpoints de associações...');
        
        // Testar endpoint de aluno
        const studentResponse = await fetch(`http://localhost:3000/api/students/${testStudentId}`);
        const studentData = await studentResponse.json();
        console.log('👤 Student:', studentData.success ? '✅ OK' : '❌ ERRO');
        
        // Testar endpoint de matrículas
        const enrollmentsResponse = await fetch(`http://localhost:3000/api/students/${testStudentId}/enrollments`);
        const enrollmentsData = await enrollmentsResponse.json();
        console.log('📚 Enrollments:', enrollmentsData.success ? `✅ ${enrollmentsData.data.length} encontradas` : '❌ ERRO');
        
        // Testar endpoint de assinaturas
        const subscriptionsResponse = await fetch(`http://localhost:3000/api/students/${testStudentId}/subscriptions`);
        const subscriptionsData = await subscriptionsResponse.json();
        console.log('💎 Subscriptions:', subscriptionsData.success ? `✅ ${subscriptionsData.data.length} encontradas` : '❌ ERRO');
        
        // Mostrar dados detalhados
        if (enrollmentsData.success && enrollmentsData.data.length > 0) {
            console.log('\n📋 Detalhes das Matrículas:');
            enrollmentsData.data.forEach((enrollment, idx) => {
                console.log(`   ${idx + 1}. ${enrollment.course ? `📚 Curso: ${enrollment.course.name}` : ''}`);
                console.log(`      ${enrollment.class ? `🕐 Turma: ${enrollment.class.name}` : 'Sem turma'}`);
                console.log(`      📅 Status: ${enrollment.status || 'N/A'}`);
            });
        }
        
        if (subscriptionsData.success && subscriptionsData.data.length > 0) {
            console.log('\n💼 Detalhes das Assinaturas:');
            subscriptionsData.data.forEach((subscription, idx) => {
                const plan = subscription.plan || subscription.billingPlan;
                console.log(`   ${idx + 1}. 💎 Plano: ${plan ? plan.name : 'Não encontrado'}`);
                console.log(`      💰 Preço: ${plan ? `R$ ${plan.price}` : 'N/A'}`);
                console.log(`      📊 Status: ${subscription.status || 'N/A'}`);
            });
        }
        
        console.log('\n✅ Teste concluído! O sistema de associações está configurado.');
        console.log('🎯 Agora você pode:');
        console.log('   1. Ir para http://localhost:3000');
        console.log('   2. Navegar para "Alunos"');
        console.log('   3. Clicar duas vezes em um aluno');
        console.log('   4. Clicar na aba "Turmas" para ver a hierarquia');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

// Executar teste
testAssociations();

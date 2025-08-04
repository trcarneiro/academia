const https = require('https');
const http = require('http');

console.log('🔍 Verificando dados do sistema...\n');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function checkSystem() {
    try {
        // Testar endpoint de alunos
        const data = await makeRequest('http://localhost:3000/api/students');
        
        if (data.success && data.data.length > 0) {
            console.log('✅ Sistema funcionando!');
            console.log(`📊 Total de alunos: ${data.data.length}`);
            
            // Pegar o primeiro aluno
            const firstStudent = data.data[0];
            console.log(`\n👤 Testando com aluno: ${firstStudent.user?.firstName || 'N/A'} ${firstStudent.user?.lastName || 'N/A'}`);
            
            // Testar endpoints de associações
            const enrollmentsData = await makeRequest(`http://localhost:3000/api/students/${firstStudent.id}/enrollments`);
            const subscriptionsData = await makeRequest(`http://localhost:3000/api/students/${firstStudent.id}/subscription`);
            
            console.log(`📚 Matrículas: ${enrollmentsData.success ? enrollmentsData.data.length : 'Erro'}`);
            console.log(`💎 Assinaturas: ${subscriptionsData.success ? subscriptionsData.data.length : 'Erro'}`);
            
            if (enrollmentsData.success && enrollmentsData.data.length > 0) {
                console.log('\n🔗 Estrutura hierárquica detectada:');
                enrollmentsData.data.forEach((enrollment, idx) => {
                    if (enrollment.course) {
                        console.log(`   📚 Curso ${idx + 1}: ${enrollment.course.name}`);
                    }
                    if (enrollment.class) {
                        console.log(`   🕐 Turma ${idx + 1}: ${enrollment.class.name}`);
                    }
                });
            }
            
            if (subscriptionsData.success && subscriptionsData.data.length > 0) {
                console.log('\n💎 Planos encontrados:');
                subscriptionsData.data.forEach((sub, idx) => {
                    if (sub.billingPlan) {
                        console.log(`   💼 Plano ${idx + 1}: ${sub.billingPlan.name}`);
                    }
                });
            }
            
        } else {
            console.log('⚠️ Nenhum aluno encontrado no sistema');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar sistema:', error.message);
    }
}

checkSystem();

/**
 * Script de Teste Completo de Todos os Módulos
 * Testa CRUD (Create, Read, Update, Delete) de cada entidade
 * 
 * Uso: node scripts/test-all-modules.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ORG_ID = 'ff5ee00e-d8a3-4291-9428-d28b852fb472'; // Organização de teste

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n📦 ${msg}\n${'='.repeat(60)}${colors.reset}`)
};

// Helper para fazer requisições HTTP
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const hasBody = data !== null && Object.keys(data).length > 0;
        const options = {
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'x-organization-id': ORG_ID,
                ...(hasBody ? { 'Content-Type': 'application/json' } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (hasBody) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Resultados dos testes
const results = {
    passed: 0,
    failed: 0,
    errors: []
};

async function testEndpoint(name, method, path, data = null, expectedStatus = [200, 201]) {
    try {
        const res = await request(method, path, data);
        const statusOk = Array.isArray(expectedStatus) 
            ? expectedStatus.includes(res.status)
            : res.status === expectedStatus;
        
        if (statusOk && res.data.success !== false) {
            log.success(`${name}: ${method} ${path} → ${res.status}`);
            results.passed++;
            return res.data;
        } else {
            log.error(`${name}: ${method} ${path} → ${res.status} - ${res.data.message || JSON.stringify(res.data).substring(0, 100)}`);
            results.failed++;
            results.errors.push({ name, method, path, status: res.status, error: res.data.message || res.data });
            return null;
        }
    } catch (err) {
        log.error(`${name}: ${method} ${path} → ERRO: ${err.message}`);
        results.failed++;
        results.errors.push({ name, method, path, error: err.message });
        return null;
    }
}

// ==============================================
// TESTES POR MÓDULO
// ==============================================

async function testStudents() {
    log.header('MÓDULO: ALUNOS (Students)');
    
    // 1. Listar alunos
    const list = await testEndpoint('Listar alunos', 'GET', '/api/students');
    
    // 2. Criar aluno de teste
    const testStudent = {
        firstName: 'Teste',
        lastName: 'Automático',
        email: `teste.auto.${Date.now()}@test.com`,
        phone: '11999990000',
        cpf: `${Date.now()}`.substring(0, 11),
        birthDate: '1990-01-15',
        beltLevel: 'WHITE',
        status: 'ACTIVE'
    };
    
    const created = await testEndpoint('Criar aluno', 'POST', '/api/students', testStudent, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const studentId = created.data?.id || created.id;
        
        // 3. Buscar por ID
        await testEndpoint('Buscar aluno por ID', 'GET', `/api/students/${studentId}`);
        
        // 4. Atualizar aluno
        await testEndpoint('Atualizar aluno', 'PUT', `/api/students/${studentId}`, {
            firstName: 'Teste Atualizado',
            lastName: 'Automático',
            phone: '11888880000'
        });
        
        // 5. Deletar aluno
        await testEndpoint('Deletar aluno', 'DELETE', `/api/students/${studentId}`);
    } else {
        log.warn('Não foi possível testar GET/PUT/DELETE - criação falhou');
    }
}

async function testInstructors() {
    log.header('MÓDULO: INSTRUTORES (Instructors)');
    
    // 1. Listar
    const list = await testEndpoint('Listar instrutores', 'GET', '/api/instructors');
    
    // 2. Criar
    const testInstructor = {
        name: `Instrutor Teste ${Date.now()}`,
        email: `instrutor.teste.${Date.now()}@test.com`,
        phone: '11999991111',
        specializations: ['Krav Maga', 'Defesa Pessoal'],
        certifications: ['Faixa Preta'],
        martialArts: ['Krav Maga'],
        experience: '5 anos',
        maxStudentsPerClass: 20,
        hourlyRate: 150.00
    };
    
    const created = await testEndpoint('Criar instrutor', 'POST', '/api/instructors', testInstructor, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const instructorId = created.data?.id || created.id;
        
        await testEndpoint('Buscar instrutor por ID', 'GET', `/api/instructors/${instructorId}`);
        
        await testEndpoint('Atualizar instrutor', 'PUT', `/api/instructors/${instructorId}`, {
            name: 'Instrutor Atualizado',
            hourlyRate: 180.00
        });
        
        await testEndpoint('Deletar instrutor', 'DELETE', `/api/instructors/${instructorId}`);
    }
}

async function testCourses() {
    log.header('MÓDULO: CURSOS (Courses)');
    
    // 1. Listar
    await testEndpoint('Listar cursos', 'GET', '/api/courses');
    
    // 2. Criar
    const testCourse = {
        name: `Curso Teste ${Date.now()}`,
        description: 'Curso de teste automático',
        level: 'BEGINNER',
        duration: 60,
        maxStudents: 20,
        status: 'ACTIVE'
    };
    
    const created = await testEndpoint('Criar curso', 'POST', '/api/courses', testCourse, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const courseId = created.data?.id || created.id;
        
        await testEndpoint('Buscar curso por ID', 'GET', `/api/courses/${courseId}`);
        
        await testEndpoint('Atualizar curso', 'PUT', `/api/courses/${courseId}`, {
            name: `Curso Atualizado ${Date.now()}`,
            description: 'Descrição atualizada'
        });
        
        await testEndpoint('Deletar curso', 'DELETE', `/api/courses/${courseId}`);
    }
}

async function testTurmas() {
    log.header('MÓDULO: TURMAS');
    
    // 1. Listar
    const list = await testEndpoint('Listar turmas', 'GET', '/api/turmas');
    
    // Para criar turma, precisamos de curso, instrutor e unidade existentes
    const courses = await request('GET', '/api/courses');
    const instructors = await request('GET', '/api/instructors');
    const units = await request('GET', '/api/units');
    
    if (courses.data?.data?.length > 0 && instructors.data?.data?.length > 0 && units.data?.data?.length > 0) {
        const courseId = courses.data.data[0].id;
        const instructorId = instructors.data.data[0].id;
        const unitId = units.data.data[0].id;
        
        const testTurma = {
            name: `Turma Teste ${Date.now()}`,
            courseId: courseId,
            instructorId: instructorId,
            organizationId: ORG_ID,
            unitId: unitId,
            type: 'COLLECTIVE',
            startDate: new Date().toISOString(),
            maxStudents: 20,
            schedule: {
                daysOfWeek: [1, 3, 5],
                time: '19:00',
                duration: 60
            }
        };
        
        const created = await testEndpoint('Criar turma', 'POST', '/api/turmas', testTurma, [200, 201]);
        
        if (created?.data?.id || created?.id) {
            const turmaId = created.data?.id || created.id;
            
            await testEndpoint('Buscar turma por ID', 'GET', `/api/turmas/${turmaId}`);
            
            await testEndpoint('Atualizar turma', 'PUT', `/api/turmas/${turmaId}`, {
                name: 'Turma Atualizada',
                maxStudents: 25
            });
            
            await testEndpoint('Deletar turma', 'DELETE', `/api/turmas/${turmaId}`);
        }
    } else {
        log.warn('Não há cursos, instrutores ou unidades para criar turma de teste');
    }
}

async function testUnits() {
    log.header('MÓDULO: UNIDADES (Units)');
    
    await testEndpoint('Listar unidades', 'GET', '/api/units');
    
    const testUnit = {
        name: `Unidade Teste ${Date.now()}`,
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        phone: '11999992222',
        email: `unidade.${Date.now()}@test.com`,
        status: 'ACTIVE',
        organizationId: ORG_ID  // Campo obrigatório
    };
    
    const created = await testEndpoint('Criar unidade', 'POST', '/api/units', testUnit, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const unitId = created.data?.id || created.id;
        
        await testEndpoint('Buscar unidade por ID', 'GET', `/api/units/${unitId}`);
        await testEndpoint('Atualizar unidade', 'PUT', `/api/units/${unitId}`, { name: 'Unidade Atualizada' });
        await testEndpoint('Deletar unidade', 'DELETE', `/api/units/${unitId}`);
    }
}

async function testPackages() {
    log.header('MÓDULO: PACOTES/PLANOS (Packages)');
    
    await testEndpoint('Listar pacotes', 'GET', '/api/packages');
    
    const testPackage = {
        name: `Plano Teste ${Date.now()}`,
        description: 'Plano de teste automático',
        price: 199.90,
        duration: 30,
        classesPerWeek: 3,
        status: 'ACTIVE'
    };
    
    const created = await testEndpoint('Criar pacote', 'POST', '/api/packages', testPackage, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const packageId = created.data?.id || created.id;
        
        await testEndpoint('Buscar pacote por ID', 'GET', `/api/packages/${packageId}`);
        await testEndpoint('Atualizar pacote', 'PUT', `/api/packages/${packageId}`, { price: 249.90 });
        await testEndpoint('Deletar pacote', 'DELETE', `/api/packages/${packageId}`);
    }
}

async function testActivities() {
    log.header('MÓDULO: ATIVIDADES (Activities)');
    
    await testEndpoint('Listar atividades', 'GET', '/api/activities');
    
    const testActivity = {
        title: `Atividade Teste ${Date.now()}`,
        description: 'Atividade de teste',
        type: 'TECHNIQUE',  // Valores válidos: TECHNIQUE, STRETCH, DRILL, EXERCISE, GAME, CHALLENGE, ASSESSMENT
        equipment: [],
        adaptations: []
    };
    
    const created = await testEndpoint('Criar atividade', 'POST', '/api/activities', testActivity, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const activityId = created.data?.id || created.id;
        
        await testEndpoint('Buscar atividade por ID', 'GET', `/api/activities/${activityId}`);
        await testEndpoint('Atualizar atividade', 'PUT', `/api/activities/${activityId}`, { title: 'Atividade Atualizada' });
        await testEndpoint('Deletar atividade', 'DELETE', `/api/activities/${activityId}`);
    }
}

async function testLeads() {
    log.header('MÓDULO: CRM/LEADS');
    
    await testEndpoint('Listar leads', 'GET', '/api/crm/leads');
    
    const testLead = {
        name: `Lead Teste ${Date.now()}`,
        email: `lead.${Date.now()}@test.com`,
        phone: '11999993333',
        utmSource: 'WEBSITE',
        stage: 'NEW',
        message: 'Lead de teste automático'
    };
    
    const created = await testEndpoint('Criar lead', 'POST', '/api/crm/leads', testLead, [200, 201]);
    
    if (created?.data?.id || created?.id) {
        const leadId = created.data?.id || created.id;
        
        await testEndpoint('Buscar lead por ID', 'GET', `/api/crm/leads/${leadId}`);
        await testEndpoint('Atualizar lead', 'PUT', `/api/crm/leads/${leadId}`, { stage: 'CONTACTED' });
        await testEndpoint('Deletar lead', 'DELETE', `/api/crm/leads/${leadId}`);
    }
}

async function testOrganizations() {
    log.header('MÓDULO: ORGANIZAÇÕES');
    
    await testEndpoint('Listar organizações', 'GET', '/api/organizations');
    await testEndpoint('Buscar organização atual', 'GET', `/api/organizations/${ORG_ID}`);
}

async function testHealth() {
    log.header('HEALTH CHECKS');
    
    await testEndpoint('Health básico', 'GET', '/health');
    await testEndpoint('Health detalhado', 'GET', '/health/detailed');
    // API Docs pode estar desabilitado no ambiente de teste
    // await testEndpoint('API Docs', 'GET', '/docs/json', null, [200, 302]);
}

// ==============================================
// EXECUÇÃO PRINCIPAL
// ==============================================

async function runAllTests() {
    console.log(`\n${colors.cyan}${'='.repeat(60)}`);
    console.log(`🧪 TESTE COMPLETO DE TODOS OS MÓDULOS`);
    console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);
    console.log(`🔗 Server: ${BASE_URL}`);
    console.log(`🏢 Org ID: ${ORG_ID}`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);
    
    // Testar se servidor está online
    try {
        await request('GET', '/health');
        log.success('Servidor está online!');
    } catch (err) {
        log.error(`Servidor offline! Erro: ${err.message}`);
        log.info('Execute: npm run dev');
        process.exit(1);
    }
    
    // Executar todos os testes
    await testHealth();
    await testOrganizations();
    await testStudents();
    await testInstructors();
    await testCourses();
    await testTurmas();
    await testUnits();
    await testPackages();
    await testActivities();
    await testLeads();
    
    // Resumo final
    console.log(`\n${colors.cyan}${'='.repeat(60)}`);
    console.log(`📊 RESUMO DOS TESTES`);
    console.log(`${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}✅ Passou: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Falhou: ${results.failed}${colors.reset}`);
    console.log(`📈 Taxa de sucesso: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
        console.log(`\n${colors.red}❌ ERROS ENCONTRADOS:${colors.reset}`);
        results.errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err.name}: ${err.method} ${err.path}`);
            console.log(`   Status: ${err.status || 'N/A'}`);
            console.log(`   Erro: ${typeof err.error === 'object' ? JSON.stringify(err.error).substring(0, 200) : err.error}`);
        });
    }
    
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    
    process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
    log.error(`Erro fatal: ${err.message}`);
    process.exit(1);
});

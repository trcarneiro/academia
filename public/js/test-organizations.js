/**
 * Script para criar uma organização de teste
 * e validar o sistema completo
 */

async function testOrganizationsSystem() {
    console.log('🧪 Iniciando teste do sistema de organizações...');
    
    try {
        // 1. Testar criação de organização
        console.log('📝 1. Testando criação de organização...');
        
        const testOrganization = {
            name: 'Academia Krav Maga Brasil',
            slug: 'krav-maga-brasil',
            description: 'Academia especializada em Krav Maga e defesa pessoal',
            email: 'contato@kravmagabrasil.com.br',
            phone: '(11) 99999-9999',
            website: 'https://kravmagabrasil.com.br',
            address: 'Rua das Artes Marciais, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            country: 'Brazil',
            maxStudents: 150,
            maxStaff: 12,
            isActive: true
        };
        
        const createResponse = await fetch('/api/organizations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testOrganization)
        });
        
        if (!createResponse.ok) {
            throw new Error(`Erro ao criar organização: ${createResponse.status}`);
        }
        
        const createResult = await createResponse.json();
        console.log('✅ Organização criada:', createResult);
        
        const organizationId = createResult.data.id;
        
        // 2. Testar listagem de organizações
        console.log('📋 2. Testando listagem de organizações...');
        
        const listResponse = await fetch('/api/organizations');
        if (!listResponse.ok) {
            throw new Error(`Erro ao listar organizações: ${listResponse.status}`);
        }
        
        const listResult = await listResponse.json();
        console.log('✅ Organizações listadas:', listResult.data.length, 'encontrada(s)');
        
        // 3. Testar busca por ID
        console.log('🔍 3. Testando busca por ID...');
        
        const getResponse = await fetch(`/api/organizations/${organizationId}`);
        if (!getResponse.ok) {
            throw new Error(`Erro ao buscar organização: ${getResponse.status}`);
        }
        
        const getResult = await getResponse.json();
        console.log('✅ Organização encontrada:', getResult.data.name);
        
        // 4. Testar atualização
        console.log('📝 4. Testando atualização...');
        
        const updateData = {
            description: 'Academia especializada em Krav Maga, defesa pessoal e fitness',
            maxStudents: 200
        };
        
        const updateResponse = await fetch(`/api/organizations/${organizationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Erro ao atualizar organização: ${updateResponse.status}`);
        }
        
        const updateResult = await updateResponse.json();
        console.log('✅ Organização atualizada:', updateResult.data.maxStudents === 200);
        
        // 5. Testar sistema completo
        console.log('🎯 5. Sistema completo validado!');
        
        return {
            success: true,
            organizationId,
            message: 'Sistema de organizações funcionando perfeitamente',
            details: {
                created: !!createResult.success,
                listed: listResult.data.length > 0,
                retrieved: !!getResult.success,
                updated: !!updateResult.success
            }
        };
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testStudentCreationWithOrganization() {
    console.log('👤 Testando criação de estudante com organização...');
    
    try {
        // Primeiro listar organizações disponíveis
        const orgsResponse = await fetch('/api/organizations');
        const orgsResult = await orgsResponse.json();
        
        if (!orgsResult.success || orgsResult.data.length === 0) {
            throw new Error('Nenhuma organização encontrada');
        }
        
        const orgId = orgsResult.data[0].id;
        console.log('🏢 Usando organização:', orgsResult.data[0].name);
        
        // Criar dados de teste do estudante
        const testStudent = {
            firstName: 'João',
            lastName: 'Silva',
            email: 'joao.silva@email.com',
            phone: '(11) 98765-4321',
            birthDate: '1990-05-15',
            address: 'Rua dos Estudantes, 456',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '12345-678',
            emergencyContact: 'Maria Silva',
            emergencyPhone: '(11) 87654-3210',
            medicalInfo: 'Nenhuma restrição',
            password: 'senha123',
            organizationId: orgId
        };
        
        console.log('📝 Enviando dados do estudante...');
        
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testStudent)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Estudante criado com sucesso:', result.data.firstName);
            return { success: true, student: result.data };
        } else {
            console.error('❌ Erro ao criar estudante:', result);
            return { success: false, error: result };
        }
        
    } catch (error) {
        console.error('❌ Erro no teste de estudante:', error);
        return { success: false, error: error.message };
    }
}

// Executar testes quando solicitado
window.testOrganizationsSystem = testOrganizationsSystem;
window.testStudentCreationWithOrganization = testStudentCreationWithOrganization;

console.log('🧪 Scripts de teste carregados. Use:');
console.log('- testOrganizationsSystem() para testar CRUD de organizações');
console.log('- testStudentCreationWithOrganization() para testar criação de estudante');

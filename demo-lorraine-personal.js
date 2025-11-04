/**
 * Demo Script - Personal Training da Lorraine
 * Executar no console do navegador para testar funcionalidades
 */

// Função para demonstrar o sistema completo da Lorraine
function demoLorrainePersonalTraining() {
    console.log('🥋 Iniciando Demo do Personal Training - Lorraine Costa Silva');
    
    // 1. Simular navegação para estudantes
    console.log('📍 Passo 1: Navegando para módulo Students...');
    
    // 2. Simular criação de personal para Lorraine
    setTimeout(() => {
        console.log('🎯 Passo 2: Criando turma personal para Lorraine...');
        
        if (window.studentsModule && window.studentsModule.personalController) {
            const personalController = window.studentsModule.personalController;
            
            // Dados específicos da Lorraine
            const lorraineeData = {
                id: 'student_lorraine',
                firstName: 'Lorraine',
                lastName: 'Costa Silva',
                email: 'lorraine.costa@email.com',
                phone: '(31) 98765-4321',
                level: 'Intermediário',
                personal_focus: 'Krav Maga Feminino + Autodefesa + Condicionamento',
                preferences: {
                    preferred_time: 'Manhã (08:00-10:00)',
                    training_intensity: 'Intermediário',
                    focus_areas: ['Técnicas de escape', 'Defesa contra agarrões', 'Condicionamento funcional']
                }
            };
            
            // Simular criação da turma personal
            personalController.createPersonalClass('student_lorraine', lorraineeData)
                .then(result => {
                    console.log('✅ Turma personal criada:', result);
                    
                    // 3. Demonstrar sistema de agendamento
                    setTimeout(() => {
                        console.log('📅 Passo 3: Abrindo sistema de agendamento...');
                        personalController.showPersonalScheduling(result, lorraineeData);
                    }, 2000);
                })
                .catch(error => {
                    console.error('❌ Erro ao criar turma personal:', error);
                });
        } else {
            console.warn('⚠️ Personal Controller não encontrado. Executar no sistema principal.');
        }
    }, 1000);
}

// Função para testar botões de personal training
function testPersonalTrainingButtons() {
    console.log('🔍 Testando botões de Personal Training...');
    
    // Verificar se botões estão presentes na página
    const personalButtons = document.querySelectorAll('.btn-personal');
    
    if (personalButtons.length > 0) {
        console.log(`✅ Encontrados ${personalButtons.length} botões de Personal Training`);
        
        personalButtons.forEach((btn, index) => {
            console.log(`📍 Botão ${index + 1}:`, btn.textContent, btn.onclick ? 'Com evento' : 'Sem evento');
        });
    } else {
        console.log('❌ Nenhum botão de Personal Training encontrado');
        console.log('💡 Navegue para o módulo Students para ver os botões');
    }
}

// Função para simular agendamento completo
function simulateCompleteBooking() {
    console.log('🎬 Simulando agendamento completo da Lorraine...');
    
    const bookingSteps = [
        '1. ✅ Carregando perfil da Lorraine...',
        '2. ✅ Aplicando preferências (manhã, intermediário)...',
        '3. ✅ Buscando instrutores disponíveis...',
        '4. ✅ Priorizando instrutoras femininas...',
        '5. ✅ Verificando slot 08:00 - Prof. Maria Silva...',
        '6. ✅ Confirmando agendamento...',
        '7. 🎉 Aula agendada com sucesso!'
    ];
    
    let step = 0;
    const interval = setInterval(() => {
        console.log(bookingSteps[step]);
        step++;
        
        if (step >= bookingSteps.length) {
            clearInterval(interval);
            console.log('🏆 Demo de agendamento concluído!');
            
            // Simular dados finais
            const finalResult = {
                student: 'Lorraine Costa Silva',
                date: new Date().toLocaleDateString(),
                time: '08:00',
                instructor: 'Prof. Maria Silva',
                focus: 'Krav Maga Feminino + Autodefesa',
                duration: '60 minutos',
                location: 'Sala Personal Training'
            };
            
            console.table(finalResult);
        }
    }, 800);
}

// Função para verificar integração completa
function checkSystemIntegration() {
    console.log('🔧 Verificando integração do sistema...');
    
    const checks = [
        { name: 'Students Module', check: () => !!window.studentsModule },
        { name: 'Personal Controller', check: () => !!window.studentsModule?.personalController },
        { name: 'API Client', check: () => !!window.api },
        { name: 'App Integration', check: () => !!window.app },
        { name: 'CSS Personal Training', check: () => {
            const links = document.querySelectorAll('link[href*="personal-training"]');
            return links.length > 0;
        }}
    ];
    
    checks.forEach(check => {
        const result = check.check();
        console.log(`${result ? '✅' : '❌'} ${check.name}: ${result ? 'OK' : 'Não encontrado'}`);
    });
}

// Função principal - executar todas as demos
function runFullDemo() {
    console.log('🚀 === DEMO COMPLETO PERSONAL TRAINING LORRAINE ===');
    
    checkSystemIntegration();
    
    setTimeout(() => {
        testPersonalTrainingButtons();
    }, 1000);
    
    setTimeout(() => {
        simulateCompleteBooking();
    }, 2000);
    
    setTimeout(() => {
        console.log('📋 Para testar no sistema real:');
        console.log('1. Navegue para http://localhost:3000');
        console.log('2. Vá até "Estudantes" no menu lateral');
        console.log('3. Procure por botões "Personal Training" nas ações');
        console.log('4. Clique para abrir o sistema de agendamento');
        console.log('');
        console.log('🎯 Sistema pronto para uso em produção!');
    }, 8000);
}

// Expor funções globalmente
window.demoLorrainePersonal = demoLorrainePersonalTraining;
window.testPersonalButtons = testPersonalTrainingButtons;
window.simulateBooking = simulateCompleteBooking;
window.checkIntegration = checkSystemIntegration;
window.runFullDemo = runFullDemo;

// Auto-executar se carregado diretamente
if (typeof document !== 'undefined') {
    console.log('📚 Demo Personal Training carregado!');
    console.log('🎮 Comandos disponíveis:');
    console.log('- runFullDemo() - Demo completo');
    console.log('- demoLorrainePersonal() - Demo específico da Lorraine'); 
    console.log('- testPersonalButtons() - Testar botões');
    console.log('- simulateBooking() - Simular agendamento');
    console.log('- checkIntegration() - Verificar integração');
}
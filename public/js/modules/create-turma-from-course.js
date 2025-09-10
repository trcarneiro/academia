// Funcionalidade para criar turmas a partir de cursos
(function() {
    'use strict';
    
    console.log('👥 Create Turma from Course - Loading...');
    
    // Função global para criar turma a partir de curso
    window.createTurmaFromCourse = async function(courseId, courseName) {
        try {
            if (!confirm(`Criar uma nova turma para o curso "${courseName}"?`)) {
                return;
            }
            
            // Mostrar notificação
            if (window.showNotification) {
                window.showNotification('Criando turma...', 'info');
            } else {
                console.log('📝 Criando turma...');
            }
            
            // Criar turma com dados básicos
            const turmaData = {
                name: `Turma ${courseName} - ${new Date().toLocaleDateString('pt-BR')}`,
                courseId: courseId,
                type: 'COLLECTIVE',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString(), // 90 days
                maxStudents: 20,
                instructorId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce',
                organizationId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce',
                unitId: 'ba8a4a0b-4445-4d17-8808-4d1cfcfee6ce',
                schedule: {
                    daysOfWeek: [1, 3, 5], // Segunda, Quarta, Sexta
                    time: '19:00',
                    duration: 90
                }
            };
            
            console.log('[CreateTurma] Sending data:', turmaData);
            
            const response = await fetch('/api/turmas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(turmaData)
            });
            
            const result = await response.json();
            console.log('[CreateTurma] Response:', result);
            
            if (result.success) {
                if (window.showNotification) {
                    window.showNotification('✅ Turma criada com sucesso!', 'success');
                } else {
                    alert('✅ Turma criada com sucesso!');
                }
                
                // Redirecionar para o módulo de turmas após 1 segundo
                setTimeout(() => {
                    if (window.router && typeof window.router.navigateTo === 'function') {
                        window.router.navigateTo('turmas');
                    } else {
                        window.location.hash = 'turmas';
                    }
                }, 1000);
            } else {
                throw new Error(result.error || 'Erro ao criar turma');
            }
            
        } catch (error) {
            console.error('❌ Error creating turma:', error);
            if (window.showNotification) {
                window.showNotification('❌ Erro ao criar turma: ' + error.message, 'error');
            } else {
                alert('❌ Erro ao criar turma: ' + error.message);
            }
        }
    };
    
    console.log('👥 Create Turma from Course - Loaded');
})();

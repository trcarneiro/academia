// Teste automático da aba de cursos
console.log('🧪 Iniciando teste da aba de cursos...');

// Aguardar o carregamento da página
setTimeout(() => {
    try {
        // Buscar o botão da aba de cursos
        const coursesTabBtn = document.querySelector('[data-tab="courses"]');
        
        if (coursesTabBtn) {
            console.log('✅ Botão da aba Cursos encontrado, clicando...');
            coursesTabBtn.click();
            
            // Aguardar e verificar se a API foi chamada
            setTimeout(() => {
                const coursesContent = document.querySelector('#courses-content');
                if (coursesContent) {
                    console.log('✅ Container de cursos encontrado');
                    console.log('📄 Conteúdo:', coursesContent.innerHTML.substring(0, 200) + '...');
                } else {
                    console.error('❌ Container de cursos não encontrado');
                }
            }, 3000);
            
        } else {
            console.error('❌ Botão da aba Cursos não encontrado');
            console.log('🔍 Botões disponíveis:', 
                [...document.querySelectorAll('[data-tab]')].map(b => b.dataset.tab)
            );
        }
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}, 5000);

class UIController {
    constructor() {
        this.initMenuToggle();
        this.initResponsiveBehavior();
    }

    initMenuToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    initResponsiveBehavior() {
        // Fechar menu ao clicar fora em dispositivos móveis
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (window.innerWidth <= 992 && 
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                e.target !== menuToggle) {
                sidebar.classList.remove('active');
            }
        });

        // Atualizar comportamento ao redimensionar a janela
        window.addEventListener('resize', () => {
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth > 992 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
});
class UIController {
    constructor() {
        console.log('🎮 UI Controller inicializado');
        this.initMenuToggle();
        this.initResponsiveBehavior();
        this.initMenuNavigation();
    }

    initMenuToggle() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }

    initResponsiveBehavior() {
        // Comportamento responsivo do menu
        const handleResize = () => {
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth <= 768) {
                sidebar.classList.add('mobile');
            } else {
                sidebar.classList.remove('mobile', 'active');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Executar na inicialização
    }

    initMenuNavigation() {
        // Navegação do menu lateral
        const menuItems = document.querySelectorAll('.main-menu li[data-module]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Remove active de todos os itens
                menuItems.forEach(i => i.classList.remove('active'));
                
                // Adiciona active no item clicado
                item.classList.add('active');
                
                // Emite evento para o router
                const module = item.dataset.module;
                if (window.router) {
                    window.router.navigateTo(module);
                }
            });
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
});
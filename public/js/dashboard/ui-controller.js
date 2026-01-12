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
        const overlay = document.querySelector('.sidebar-overlay');

        // Restore collapsed state from localStorage (Desktop only)
        if (sidebar && window.innerWidth > 992) {
            const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
            if (isCollapsed) {
                sidebar.classList.add('collapsed');
            }
        }

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    // Mobile: Toggle Off-canvas
                    sidebar.classList.toggle('active');
                } else {
                    // Desktop: Toggle Collapse
                    sidebar.classList.toggle('collapsed');
                    // Save preference
                    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
                }
            });
        }

        if (overlay && sidebar) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }
    }

    initResponsiveBehavior() {
        // Comportamento responsivo do menu
        const handleResize = () => {
            const sidebar = document.querySelector('.sidebar');
            // 🔒 Guard: Only run if sidebar exists (not on login page)
            if (!sidebar) return;

            // Breakpoint aligned with CSS (992px)
            if (window.innerWidth <= 992) {
                document.body.classList.add('mobile-view');
                sidebar.classList.remove('collapsed'); // Reset collaspe on mobile
            } else {
                document.body.classList.remove('mobile-view', 'active');
                sidebar.classList.remove('active'); // Reset off-canvas on desktop

                // Restore collapse state if returning to desktop
                const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                if (isCollapsed) {
                    sidebar.classList.add('collapsed');
                }
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
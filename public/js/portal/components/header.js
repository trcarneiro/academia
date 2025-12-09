import { router } from '../router.js';

export function renderHeader(user) {
    const header = document.createElement('header');
    header.className = 'portal-header';
    
    // Load CSS if not present
    if (!document.querySelector('link[href="/css/portal/components/header.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/portal/components/header.css';
        document.head.appendChild(link);
    }
    
    const userName = user ? user.name.split(' ')[0] : 'Aluno';
    const userAvatar = user && user.photo ? user.photo : `https://ui-avatars.com/api/?name=${userName}&background=random`;
    const userBelt = user && user.belt ? user.belt : 'Faixa Branca';

    header.innerHTML = `
        <div class="header-content">
            <div class="user-info">
                <img src="${userAvatar}" alt="Foto" class="user-avatar">
                <div class="user-text">
                    <span class="greeting">Olá, ${userName}</span>
                    <span class="status-badge">${userBelt}</span>
                </div>
            </div>
            <div class="header-actions">
                <button id="btn-logout" class="btn-icon" aria-label="Sair">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Logout Logic
    header.querySelector('#btn-logout').addEventListener('click', () => {
        if(confirm('Deseja realmente sair?')) {
            localStorage.removeItem('portal_token');
            localStorage.removeItem('portal_user');
            router.navigate('/login');
        }
    });

    return header;
}

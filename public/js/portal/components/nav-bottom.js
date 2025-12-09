export function renderNavBottom(activeRoute) {
    // Check if nav already exists
    let nav = document.getElementById('nav-bottom');
    
    // If we are on a public page, remove nav if it exists
    const publicRoutes = ['/', '/register', '/checkout', '/success', '/login'];
    if (publicRoutes.includes(activeRoute)) {
        if (nav) nav.remove();
        document.body.classList.remove('has-nav-bottom');
        return;
    }

    // Load CSS
    if (!document.querySelector('link[href="/css/portal/components/nav-bottom.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/portal/components/nav-bottom.css';
        document.head.appendChild(link);
    }

    document.body.classList.add('has-nav-bottom');

    if (!nav) {
        nav = document.createElement('nav');
        nav.id = 'nav-bottom';
        nav.className = 'nav-bottom';
        document.body.appendChild(nav);
    }

    // Normalize route for comparison (remove query params if any)
    const route = activeRoute.split('?')[0];

    nav.innerHTML = `
        <a href="#/dashboard" class="nav-item ${route === '/dashboard' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>Início</span>
        </a>
        <a href="#/schedule" class="nav-item ${route === '/schedule' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
            <span>Agenda</span>
        </a>
        <a href="#/ranking" class="nav-item ${route === '/ranking' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M5 16h3v5H5zm5.5-4.5h3V21h-3zM16 9h3v12h-3zM12 3L2 8v2h20V8z"/></svg>
            <span>Ranking</span>
        </a>
        <a href="#/chat" class="nav-item ${route === '/chat' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
            <span>Chat</span>
        </a>
        <a href="#/profile" class="nav-item ${route === '/profile' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span>Perfil</span>
        </a>
    `;
}

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
        <a href="#/history" class="nav-item ${route === '/history' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
            <span>Histórico</span>
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
        <a href="#/crm-config" class="nav-item ${route === '/crm-config' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
            <span>Config CRM</span>
        </a>
        <a href="#/admin/notifications" class="nav-item ${route === '/admin/notifications' ? 'active' : ''}">
            <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
            <span>Broadcast</span>
        </a>
    `;
}

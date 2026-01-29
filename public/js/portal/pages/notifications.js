import { api } from '../api.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    const user = JSON.parse(localStorage.getItem('portal_user') || '{}');

    container.innerHTML = `
        <div class="notifications-page">
            <div id="header-container"></div>
            <main class="notifications-content">
                <div class="page-header">
                    <h2>Notificações</h2>
                    <button id="btn-read-all" class="btn-text">Marcar todas como lidas</button>
                </div>
                <div id="notifications-list" class="notifications-list">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Carregando mensagens...</p>
                    </div>
                </div>
            </main>
        </div>
    `;

    const headerContainer = container.querySelector('#header-container');
    headerContainer.appendChild(renderHeader(user));

    // Load styles
    if (!document.getElementById('notifications-styles')) {
        const style = document.createElement('style');
        style.id = 'notifications-styles';
        style.textContent = `
            .notifications-page { padding-bottom: 80px; background: #f9fafb; min-height: 100vh; }
            .notifications-content { padding: 20px; max-width: 600px; margin: 0 auto; }
            .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .page-header h2 { margin: 0; font-size: 1.5rem; color: #111827; }
            .btn-text { background: none; border: none; color: #4f46e5; font-weight: 500; cursor: pointer; font-size: 0.9rem; }
            .notifications-list { display: flex; flex-direction: column; gap: 12px; }
            .notification-item { background: white; padding: 16px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #e5e7eb; transition: transform 0.1s; cursor: pointer; }
            .notification-item.unread { border-left-color: #4f46e5; background: #f0f4ff; }
            .notification-item.MARKETING { border-left-color: #f59e0b; }
            .notification-item:active { transform: scale(0.98); }
            .notification-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .notification-title { font-weight: 700; color: #111827; font-size: 1rem; }
            .notification-time { font-size: 0.75rem; color: #9ca3af; }
            .notification-body { color: #4b5563; font-size: 0.9rem; line-height: 1.5; }
            .loading-state, .empty-state { text-align: center; padding: 40px 20px; color: #6b7280; }
            .empty-state-icon { font-size: 3rem; margin-bottom: 12px; display: block; }
        `;
        document.head.appendChild(style);
    }

    const listContainer = container.querySelector('#notifications-list');
    const readAllBtn = container.querySelector('#btn-read-all');

    async function loadNotifications() {
        try {
            const response = await api.request('GET', '/notifications'); // Note: base is /api/portal, so this hits /api/portal/notifications
            if (response.success) {
                const { notifications, unreadCount } = response.data;

                if (notifications.length === 0) {
                    listContainer.innerHTML = `
                        <div class="empty-state">
                            <span class="empty-state-icon">🔔</span>
                            <p>Nenhuma notificação por enquanto.</p>
                        </div>
                    `;
                    return;
                }

                listContainer.innerHTML = notifications.map(n => `
                    <div class="notification-item ${n.read ? '' : 'unread'} ${n.type}" data-id="${n.id}">
                        <div class="notification-header">
                            <span class="notification-title">${n.title}</span>
                            <span class="notification-time">${formatDate(n.createdAt)}</span>
                        </div>
                        <div class="notification-body">${n.message}</div>
                    </div>
                `).join('');

                // Add click events
                listContainer.querySelectorAll('.notification-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const id = item.dataset.id;
                        if (item.classList.contains('unread')) {
                            await api.request('POST', `/notifications/${id}/read`);
                            item.classList.remove('unread');
                        }
                    });
                });
            }
        } catch (error) {
            listContainer.innerHTML = '<p class="empty-state">Erro ao carregar notificações.</p>';
        }
    }

    readAllBtn.addEventListener('click', async () => {
        try {
            await api.request('POST', '/notifications/read-all');
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    });

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMin < 1) return 'Agora';
        if (diffMin < 60) return `${diffMin} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        if (diffDays === 1) return 'Ontem';
        return date.toLocaleDateString();
    }

    loadNotifications();
}

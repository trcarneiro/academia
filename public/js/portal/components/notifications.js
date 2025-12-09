export class NotificationManager {
    constructor() {
        this.badge = document.querySelector('.notification-badge');
        this.btn = document.querySelector('.notification-btn');
        this.container = null;
        this.notifications = [];
        this.unreadCount = 0;
        
        this.init();
    }

    init() {
        if (!this.btn) return; // Not logged in or header not ready

        this.setupUI();
        this.startPolling();
        this.btn.addEventListener('click', () => this.togglePanel());
    }

    setupUI() {
        // Create panel if not exists
        if (!document.getElementById('notification-panel')) {
            const panel = document.createElement('div');
            panel.id = 'notification-panel';
            panel.className = 'notification-panel hidden';
            panel.innerHTML = `
                <div class="notification-header">
                    <h3>Notificações</h3>
                    <button class="mark-all-read">Marcar todas como lidas</button>
                </div>
                <div class="notification-list"></div>
            `;
            document.body.appendChild(panel);
            
            this.container = panel;
            this.list = panel.querySelector('.notification-list');
            
            panel.querySelector('.mark-all-read').addEventListener('click', () => this.markAllRead());
            
            // Close on click outside
            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !this.btn.contains(e.target)) {
                    panel.classList.add('hidden');
                }
            });
        }
    }

    async startPolling() {
        await this.checkNotifications();
        setInterval(() => this.checkNotifications(), 60000); // Check every minute
    }

    async checkNotifications() {
        try {
            const response = await fetch('/api/portal/notifications');
            const data = await response.json();
            
            if (data.success) {
                this.notifications = data.notifications;
                this.unreadCount = data.unreadCount;
                this.updateBadge();
                this.renderList();
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    updateBadge() {
        if (this.badge) {
            this.badge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            this.badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    renderList() {
        if (!this.list) return;

        if (this.notifications.length === 0) {
            this.list.innerHTML = '<div class="empty-notifications">Nenhuma notificação</div>';
            return;
        }

        this.list.innerHTML = this.notifications.map(n => `
            <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                <div class="notification-icon">${n.icon || '📢'}</div>
                <div class="notification-content">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-message">${n.message}</div>
                    <div class="notification-time">${new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');

        this.list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => this.handleNotificationClick(item.dataset.id));
        });
    }

    async handleNotificationClick(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        if (!notification.read) {
            await this.markAsRead(id);
        }

        if (notification.link) {
            window.location.hash = '#' + notification.link;
            this.container.classList.add('hidden');
        }
    }

    async markAsRead(id) {
        try {
            await fetch(`/api/portal/notifications/${id}/read`, { method: 'POST' });
            this.checkNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    async markAllRead() {
        try {
            await fetch('/api/portal/notifications/read-all', { method: 'POST' });
            this.checkNotifications();
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    }

    togglePanel() {
        this.container.classList.toggle('hidden');
        
        // Position panel
        const rect = this.btn.getBoundingClientRect();
        this.container.style.top = `${rect.bottom + 10}px`;
        this.container.style.right = `${window.innerWidth - rect.right}px`;
    }
}
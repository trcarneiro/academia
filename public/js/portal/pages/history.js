import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/history.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'history-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'history-content';
    content.innerHTML = `
        <div class="history-summary">
            <div class="summary-card">
                <h3 id="total-classes">-</h3>
                <p>Aulas Realizadas</p>
            </div>
            <div class="summary-card">
                <h3 id="attendance-rate">-</h3>
                <p>Frequência</p>
            </div>
        </div>

        <div id="history-list" class="history-list">
            <div class="loading-spinner"></div>
        </div>
    `;
    container.appendChild(content);

    await loadHistory();
}

async function loadHistory() {
    const listEl = document.getElementById('history-list');

    try {
        const response = await api.request('GET', '/schedule/history');

        if (response.success) {
            updateSummary(response.data);
            renderList(response.data);
        } else {
            listEl.innerHTML = '<p class="error-message">Erro ao carregar histórico.</p>';
        }
    } catch (error) {
        console.error(error);
        listEl.innerHTML = '<p class="error-message">Erro de conexão.</p>';
    }
}

function updateSummary(history) {
    if (!history || history.length === 0) {
        document.getElementById('total-classes').textContent = '0';
        document.getElementById('attendance-rate').textContent = '0%';
        return;
    }

    const total = history.length;
    const present = history.filter(h => h.status === 'PRESENT' || h.status === 'LATE').length;
    const rate = Math.round((present / total) * 100);

    document.getElementById('total-classes').textContent = total;
    document.getElementById('attendance-rate').textContent = `${rate}%`;
}

function renderList(history) {
    const listEl = document.getElementById('history-list');

    if (!history || history.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📜</div>
                <h3>Histórico Vazio</h3>
                <p>Você ainda não participou de nenhuma aula.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = history.map(item => {
        const statusClass = getStatusClass(item.status);
        const statusLabel = getStatusLabel(item.status);

        return `
            <div class="history-card ${statusClass}">
                <div class="card-date">
                    <span class="day">${formatDay(item.date)}</span>
                    <span class="month">${formatMonth(item.date)}</span>
                </div>
                <div class="card-info">
                    <h4>${item.title || item.turmaName || 'Aula'}</h4>
                    <div class="class-meta">
                        <span>⏰ ${formatTime(item.date)}</span>
                        <span>👤 ${item.instructorName}</span>
                    </div>
                </div>
                <div class="card-status">
                    ${statusLabel}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'PRESENT': return 'status-present';
        case 'LATE': return 'status-late';
        case 'ABSENT': return 'status-absent';
        default: return '';
    }
}

function getStatusLabel(status) {
    switch (status) {
        case 'PRESENT': return 'PRESENTE';
        case 'LATE': return 'ATRASADO';
        case 'ABSENT': return 'FALTA';
        default: return status;
    }
}

function formatDay(dateStr) {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
}

function formatMonth(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[date.getMonth()];
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

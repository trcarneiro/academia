import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/schedule.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'schedule-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'schedule-content';
    content.innerHTML = `
        <div class="schedule-tabs">
            <button class="tab-btn active" data-tab="upcoming">Minhas Aulas</button>
            <button class="tab-btn" data-tab="available">Turmas Disponíveis</button>
        </div>

        <div id="schedule-list" class="schedule-list">
            <div class="loading-spinner"></div>
        </div>
    `;
    container.appendChild(content);

    setupTabs();
    await loadUpcomingClasses();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const type = tab.dataset.tab;
            if (type === 'upcoming') loadUpcomingClasses();
            else loadAvailableClasses();
        });
    });
}

async function loadUpcomingClasses() {
    const listEl = document.getElementById('schedule-list');
    listEl.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await api.request('GET', '/schedule');
        if (response.success) {
            renderUpcomingList(response.data);
        } else {
            listEl.innerHTML = '<p class="error-message">Erro ao carregar agenda.</p>';
        }
    } catch (error) {
        console.error(error);
        listEl.innerHTML = '<p class="error-message">Erro de conexão.</p>';
    }
}

async function loadAvailableClasses() {
    const listEl = document.getElementById('schedule-list');
    listEl.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await api.request('GET', '/schedule/available');
        if (response.success) {
            renderAvailableList(response.data);
        } else {
            listEl.innerHTML = '<p class="error-message">Erro ao carregar turmas.</p>';
        }
    } catch (error) {
        console.error(error);
        listEl.innerHTML = '<p class="error-message">Erro de conexão.</p>';
    }
}

function renderUpcomingList(lessons) {
    const listEl = document.getElementById('schedule-list');
    if (!lessons || lessons.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>Nenhuma aula agendada</h3>
                <p>Matricule-se em uma turma para ver suas aulas aqui.</p>
                <button class="btn-primary" id="btn-go-available">Ver turmas disponíveis</button>
            </div>
        `;
        
        const btn = document.getElementById('btn-go-available');
        if (btn) {
            btn.addEventListener('click', () => {
                document.querySelector('[data-tab=available]').click();
            });
        }
        return;
    }

    listEl.innerHTML = lessons.map(lesson => `
        <div class="class-card">
            <div class="class-date-badge">
                <span class="day">${formatDay(lesson.scheduledDate)}</span>
                <span class="month">${formatMonth(lesson.scheduledDate)}</span>
            </div>
            <div class="class-info">
                <h3>${lesson.turma?.name || 'Aula'}</h3>
                <p class="class-meta">
                    <span>📍 ${lesson.turma?.unit?.name || 'Unidade Principal'}</span>
                    <span>⏰ ${formatTime(lesson.scheduledDate)}</span>
                </p>
                <p class="instructor-name">👤 ${lesson.turma?.instructor?.firstName || ''} ${lesson.turma?.instructor?.lastName || ''}</p>
            </div>
        </div>
    `).join('');
}

function renderAvailableList(classes) {
    const listEl = document.getElementById('schedule-list');
    if (!classes || classes.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏋️</div>
                <h3>Nenhuma turma disponível</h3>
                <p>No momento não há turmas abertas para matrícula.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = classes.map(turma => `
        <div class="class-card available">
            <div class="class-info">
                <h3>${turma.name}</h3>
                <p class="class-meta">
                    <span>📍 ${turma.unit?.name || 'Unidade Principal'}</span>
                </p>
                <p class="schedule-info">${formatSchedule(turma)}</p>
                <p class="instructor-name">👤 ${turma.instructor?.firstName || ''} ${turma.instructor?.lastName || ''}</p>
            </div>
            <button class="btn-enroll" data-id="${turma.id}">Matricular</button>
        </div>
    `).join('');

    // Add event listeners
    listEl.querySelectorAll('.btn-enroll').forEach(btn => {
        btn.addEventListener('click', () => enroll(btn.dataset.id));
    });
}

async function enroll(turmaId) {
    if (!confirm('Deseja se matricular nesta turma?')) return;

    const btn = document.querySelector(`[data-id="${turmaId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Aguarde...';
    }

    try {
        const response = await api.request('POST', `/schedule/enroll/${turmaId}`);
        if (response.success) {
            alert('Matrícula realizada com sucesso!');
            document.querySelector('[data-tab=upcoming]').click();
        } else {
            alert(response.message || 'Erro ao realizar matrícula');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Matricular';
            }
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao realizar matrícula');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Matricular';
        }
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

function formatSchedule(turma) {
    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    if (turma.dayOfWeek !== undefined && turma.startTime) {
        return `${daysMap[turma.dayOfWeek]} às ${turma.startTime}`;
    }
    
    if (turma.schedule && typeof turma.schedule === 'object') {
        if (turma.schedule.days && turma.schedule.time) {
            const days = turma.schedule.days.map(d => daysMap[d]).join(', ');
            return `${days} às ${turma.schedule.time}`;
        }
    }
    
    return turma.schedule || 'Consulte horários';
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}


// Basic API Helper (assuming api-client.js provides a comprehensive wrapper, but defining fetchWithAuth if simplistic)
// Note: The HTML imports /js/shared/api-client.js which likely attaches to window or exports.
// We will assume a simple fetch wrapper for now if api-client isn't globally available as a module.
// However, looking at index.html, api-client.js is a script tag.

const API_BASE = '/api';

async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('activeOrganizationId'); // Assuming single org context for instructor usually

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId || '',
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        window.location.href = '/login.html';
        return;
    }

    return response.json();
}

// Controller
class InstructorPortal {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();

        // Set date input to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateFilter').value = today;

        // Load User Info (Stub or from localStorage)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.firstName) {
            document.getElementById('welcomeMsg').textContent = `Olá, ${user.firstName}`;
        }

        await this.loadClasses(today);
    }

    setupEventListeners() {
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.loadClasses(e.target.value);
        });
    }

    async loadClasses(date) {
        const grid = document.getElementById('classesGrid');
        grid.innerHTML = '<p>Carregando...</p>';

        try {
            const res = await fetchWithAuth(`/instructors/me/classes?date=${date}`);

            if (!res.success) {
                grid.innerHTML = `<p class="error">Erro ao carregar aulas: ${res.message || 'Erro desconhecido'}</p>`;
                return;
            }

            const classes = res.data;

            if (classes.length === 0) {
                grid.innerHTML = '<div class="empty-state">Nenhuma aula encontrada para esta data.</div>';
                return;
            }

            grid.innerHTML = classes.map(c => this.renderClassCard(c)).join('');

            // Add click listeners to cards
            document.querySelectorAll('.class-card').forEach(card => {
                card.addEventListener('click', () => this.openClassDetail(card.dataset.id));
            });

        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p class="error">Erro de conexão.</p>';
        }
    }

    renderClassCard(c) {
        const startTime = new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="class-card" data-id="${c.id}">
                <div class="class-status">${c.status}</div>
                <div class="class-time"><i class="far fa-clock"></i> ${startTime} - ${endTime}</div>
                <div class="class-title">${c.title}</div>
                <div class="class-location"><i class="fas fa-map-marker-alt"></i> ${c.location || 'Sem local'}</div>
                <div class="class-stats">
                    <div class="stat-item" title="Alunos inscritos"><i class="fas fa-users"></i> ${c.enrolledCount}</div>
                    <div class="stat-item" title="Check-ins realizados"><i class="fas fa-check-circle"></i> ${c.checkInCount}</div>
                </div>
            </div>
        `;
    }

    async openClassDetail(classId) {
        const modal = document.getElementById('classModal');
        const content = document.getElementById('modalDetails');
        const list = document.getElementById('studentList');

        modal.style.display = 'flex';
        content.innerHTML = 'Carregando detalhes...';
        list.innerHTML = '';

        try {
            const res = await fetchWithAuth(`/instructors/classes/${classId}`);

            if (!res.success) {
                content.innerHTML = 'Erro ao carregar detalhes.';
                return;
            }

            const { class: cls, students } = res.data;

            content.innerHTML = `
                <p><strong>Horário:</strong> ${new Date(cls.startTime).toLocaleTimeString()} - ${new Date(cls.endTime).toLocaleTimeString()}</p>
                <p><strong>Plano de Aula:</strong> ${cls.lessonPlan ? cls.lessonPlan.title : 'Nenhum vinculado'}</p>
                <!-- Add more details if needed -->
            `;

            if (students.length === 0) {
                list.innerHTML = '<p>Nenhum aluno inscrito nesta aula.</p>';
            } else {
                list.innerHTML = students.map(s => `
                    <div class="student-item">
                        <div class="student-info">
                            <img src="${s.avatarUrl || 'https://ui-avatars.com/api/?name=' + s.name}" class="student-avatar" alt="${s.name}">
                            <div>
                                <div style="font-weight:600">${s.name}</div>
                                <div style="font-size:0.8rem; color:#666">ID: ...${s.studentId.substr(-4)}</div>
                            </div>
                        </div>
                        <div class="checkin-action">
                            <label class="switch">
                                <input type="checkbox" class="checkin-toggle" data-class="${cls.id}" data-student="${s.studentId}" ${s.checkedIn ? 'checked' : ''}>
                                <span class="slider round">Check-in</span>
                            </label>
                        </div>
                    </div>
                `).join('');

                // Add listeners to toggles
                document.querySelectorAll('.checkin-toggle').forEach(toggle => {
                    toggle.addEventListener('change', (e) => this.handleCheckIn(e));
                });
            }

        } catch (error) {
            console.error(error);
            content.innerHTML = 'Erro ao carregar detalhes.';
        }
    }

    async handleCheckIn(e) {
        const checkbox = e.target;
        const classId = checkbox.dataset.class;
        const studentId = checkbox.dataset.student;
        const status = checkbox.checked;

        // Optimistic UI handled by checkbox state, but we should handle failure
        try {
            const res = await fetchWithAuth(`/instructors/classes/${classId}/check-in`, {
                method: 'POST',
                body: JSON.stringify({ studentId, status })
            });

            if (!res.success) {
                checkbox.checked = !status; // Revert
                alert('Erro ao realizar check-in');
            } else {
                // Success feedback (optional, simple toast)
                // console.log('Check-in updated');
            }

        } catch (error) {
            checkbox.checked = !status; // Revert
            console.error(error);
            alert('Erro de conexão');
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new InstructorPortal();
});

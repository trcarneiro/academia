import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/courses.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'courses-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'courses-content';
    content.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando seu progresso...</p>
        </div>
    `;
    container.appendChild(content);

    await loadCourses(content);
}

async function loadCourses(content) {
    let currentCourse = null;
    let journey = [];
    let userRank = null;

    try {
        // Fetch current course
        const courseRes = await api.request('GET', '/courses/current');
        if (courseRes.success) {
            currentCourse = courseRes.data;
        }

        // Fetch journey if we have a course
        if (currentCourse) {
            const journeyRes = await api.request('GET', `/courses/${currentCourse.id}/journey`);
            if (journeyRes.success) {
                journey = journeyRes.data || [];
            }
        }

        // Fetch ranking preview
        const rankRes = await api.request('GET', '/courses/ranking');
        if (rankRes.success) {
            userRank = rankRes.data?.userRank;
        }

        renderCourses(content, currentCourse, journey, userRank);

    } catch (error) {
        console.error('Error loading courses:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Ops! Algo deu errado</h3>
                <p>Não foi possível carregar seus cursos.</p>
                <button class="btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

function renderCourses(content, currentCourse, journey, userRank) {
    if (!currentCourse) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎓</div>
                <h3>Nenhum curso ativo</h3>
                <p>Você ainda não está matriculado em nenhum curso.</p>
            </div>
        `;
        return;
    }

    const progress = calculateProgress(journey);

    content.innerHTML = `
        <div class="courses-container">
            <!-- Header Section -->
            <div class="current-course-header">
                <div class="course-badge-large">🥋</div>
                <div class="course-info">
                    <h1>${currentCourse.name}</h1>
                    <p class="course-description">${currentCourse.description || 'Curso de Krav Maga'}</p>
                    
                    <div class="course-progress-large">
                        <div class="progress-stats">
                            <span>Progresso Geral</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Journey Grid -->
            <div class="journey-section">
                <div class="journey-header">
                    <h2>Sua Jornada</h2>
                </div>

                <div class="journey-grid">
                    ${journey.length > 0 ? journey.map(tech => renderTechniqueCard(tech)).join('') : '<p class="no-techniques">Nenhuma técnica disponível ainda.</p>'}
                </div>
            </div>

            <!-- Ranking Preview -->
            <div class="ranking-preview">
                <div class="ranking-info">
                    <h3>Ranking da Turma</h3>
                    <p>Veja sua posição em relação aos outros alunos</p>
                    <div class="current-rank">
                        <span class="rank-number">#${userRank?.position || '-'}</span>
                        <span class="rank-label">Sua Posição</span>
                    </div>
                </div>
                <button class="view-ranking-btn" id="btn-view-ranking">
                    Ver Ranking Completo →
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('btn-view-ranking')?.addEventListener('click', () => {
        router.navigate('/ranking');
    });

    // Technique card click handlers
    content.querySelectorAll('.technique-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            if (id) {
                router.navigate(`/technique/${id}`);
            }
        });
    });
}

function renderTechniqueCard(tech) {
    const statusClass = (tech.status || 'LOCKED').toLowerCase().replace('_', '-');
    const statusLabel = {
        'COMPLETED': 'Concluído',
        'IN_PROGRESS': 'Em Andamento',
        'LOCKED': 'Bloqueado'
    }[tech.status] || 'Bloqueado';

    const icon = tech.status === 'LOCKED' ? '🔒' : '🥊';

    return `
        <div class="technique-card ${statusClass}" data-id="${tech.id}">
            <div class="technique-status status-${statusClass}">
                ${statusLabel}
            </div>
            <div class="technique-icon">${icon}</div>
            <h3 class="technique-title">${tech.name}</h3>
            <div class="technique-meta">
                <span class="meta-item">${tech.difficulty || 'Iniciante'}</span>
            </div>
        </div>
    `;
}

function calculateProgress(journey) {
    if (!journey || !journey.length) return 0;
    const completed = journey.filter(t => t.status === 'COMPLETED').length;
    return Math.round((completed / journey.length) * 100);
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

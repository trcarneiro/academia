import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/ranking.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'ranking-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'ranking-content';
    content.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando ranking...</p>
        </div>
    `;
    container.appendChild(content);

    await loadRanking(content);
}

async function loadRanking(content) {
    try {
        const response = await api.request('GET', '/courses/ranking');
        
        if (response.success) {
            renderRanking(content, response.data?.ranking || [], response.data?.userRank);
        } else {
            content.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">🏆</div>
                    <h3>Erro ao carregar ranking</h3>
                    <p>Não foi possível carregar a classificação atual.</p>
                    <button class="btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading ranking:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Erro de conexão</h3>
                <p>Verifique sua conexão e tente novamente.</p>
                <button class="btn-primary" onclick="window.location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

function renderRanking(content, rankingData, userRank) {
    if (!rankingData || rankingData.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <h3>Ranking em Construção</h3>
                <p>O ranking será exibido quando houver dados suficientes.</p>
            </div>
        `;
        return;
    }

    const topThree = rankingData.slice(0, 3);
    const restOfList = rankingData.slice(3);

    content.innerHTML = `
        <div class="ranking-container">
            <div class="ranking-header">
                <h1>Ranking da Turma</h1>
                <p>Os alunos mais dedicados deste mês</p>
            </div>

            <div class="top-three">
                ${renderPodiumSpot(topThree[1], 2, 'second')}
                ${renderPodiumSpot(topThree[0], 1, 'first')}
                ${renderPodiumSpot(topThree[2], 3, 'third')}
            </div>

            ${userRank ? `
            <div class="your-position">
                <span class="label">Sua Posição:</span>
                <span class="position">#${userRank.position}</span>
                <span class="points">${userRank.points || 0} pontos</span>
            </div>
            ` : ''}

            <div class="ranking-list">
                ${restOfList.map((student, index) => renderRankingItem(student, index + 4)).join('')}
            </div>
        </div>
    `;
}

function renderPodiumSpot(student, rank, positionClass) {
    if (!student) return `<div class="podium-spot ${positionClass} empty"></div>`;

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const initials = student.name ? student.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

    return `
        <div class="podium-spot ${positionClass}">
            <div class="medal">${medals[rank]}</div>
            <div class="avatar">
                ${student.photoUrl ? 
                    `<img src="${student.photoUrl}" alt="${student.name}">` : 
                    `<span class="initials">${initials}</span>`
                }
            </div>
            <div class="student-name">${student.name || 'Aluno'}</div>
            <div class="student-points">${student.points || 0} pts</div>
        </div>
    `;
}

function renderRankingItem(student, position) {
    const initials = student.name ? student.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

    return `
        <div class="ranking-item">
            <div class="position">${position}</div>
            <div class="avatar-small">
                ${student.photoUrl ? 
                    `<img src="${student.photoUrl}" alt="${student.name}">` : 
                    `<span class="initials">${initials}</span>`
                }
            </div>
            <div class="student-info">
                <span class="name">${student.name || 'Aluno'}</span>
                <span class="belt">${student.belt || 'Faixa Branca'}</span>
            </div>
            <div class="points">${student.points || 0} pts</div>
        </div>
    `;
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

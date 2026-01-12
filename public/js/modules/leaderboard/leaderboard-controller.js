
export class LeaderboardController {
    constructor(api) {
        this.api = api;
        this.container = null;
        this.data = [];
    }

    async render(container) {
        this.container = container;
        this.renderHTML();
        await this.loadData();
    }

    renderHTML() {
        this.container.innerHTML = `
            <div class="leaderboard-container">
                <div class="leaderboard-header">
                    <div class="leaderboard-title">
                        <h1><i class="fas fa-trophy"></i> Ranking da Academia</h1>
                        <p class="leaderboard-subtitle">Top alunos por XP e engajamento</p>
                    </div>
                    <div class="leaderboard-filters">
                        <!-- Future: Month/Week implementation -->
                        <span class="badge badge-primary">Geral</span>
                    </div>
                </div>

                <div id="leaderboard-content">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i> Carregando ranking...
                    </div>
                </div>
            </div>
        `;
    }

    async loadData() {
        try {
            const orgId = window.organizationContext?.getActiveOrganizationId();
            if (!orgId) {
                throw new Error('Organização não selecionada');
            }

            // Using fetchWithStates from API wrapper if available, or fetch direct
            const result = await this.api.fetchWithStates(`/api/gamification/leaderboard?organizationId=${orgId}&limit=50`, {
                loadingElement: null // We handle loading state manually
            });

            if (result.success && result.data) {
                this.data = result.data;
                this.renderContent();
            } else {
                throw new Error(result.error || 'Falha ao carregar dados');
            }
        } catch (error) {
            console.error('Leaderboard load error:', error);
            const content = this.container.querySelector('#leaderboard-content');
            if (content) {
                content.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Não foi possível carregar o ranking.</p>
                        <button class="btn btn-secondary" onclick="window.leaderboardModule.refresh()">Tentar Novamente</button>
                    </div>
                `;
            }
        }
    }

    renderContent() {
        if (!this.data || this.data.length === 0) {
            this.container.querySelector('#leaderboard-content').innerHTML = `
                <div class="empty-leaderboard">
                    <i class="fas fa-medal"></i>
                    <p>Nenhum dado de ranking disponível ainda.</p>
                </div>
            `;
            return;
        }

        const top3 = this.data.slice(0, 3);
        const rest = this.data.slice(3);

        let html = '';

        // Podium
        if (top3.length > 0) {
            html += '<div class="podium-section">';
            // Order for podium visually: 2, 1, 3
            if (top3[1]) html += this.createPodiumCard(top3[1], 2);
            if (top3[0]) html += this.createPodiumCard(top3[0], 1);
            if (top3[2]) html += this.createPodiumCard(top3[2], 3);
            html += '</div>';
        }

        // List
        if (rest.length > 0) {
            html += `
                <div class="ranking-list-section">
                    <div class="ranking-header">
                        <div>Pos</div>
                        <div>Aluno</div>
                        <div>XP</div>
                        <div>Nível</div>
                        <div>Streak</div>
                    </div>
                    <div class="ranking-items">
                        ${rest.map((student, index) => this.createListItem(student, index + 4)).join('')}
                    </div>
                </div>
            `;
        }

        this.container.querySelector('#leaderboard-content').innerHTML = html;
    }

    createPodiumCard(student, rank) {
        const avatarUrl = student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;

        return `
            <div class="podium-card podium-rank-${rank}">
                <div class="podium-avatar-wrapper">
                    <img src="${avatarUrl}" class="podium-avatar" alt="${student.name}">
                    ${rank === 1 ? '<i class="fas fa-crown podium-crown"></i>' : ''}
                    <div class="podium-medal rank-badge-${rank}">${rank}</div>
                </div>
                <div class="podium-name">${student.name}</div>
                <div class="podium-stats">
                    <div class="stat-pill xp-stat">
                        <i class="fas fa-star"></i> ${student.totalXP.toLocaleString()} XP
                    </div>
                    <div class="stat-pill level-stat">
                        Level ${student.level}
                    </div>
                    <div class="stat-pill streak-stat">
                        <i class="fas fa-fire"></i> ${student.streak} dias
                    </div>
                </div>
            </div>
        `;
    }

    createListItem(student, rank) {
        const avatarUrl = student.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;

        return `
            <div class="ranking-item">
                <div class="rank-number ${rank <= 10 ? 'rank-top-10' : ''}">#${rank}</div>
                <div class="user-info">
                    <img src="${avatarUrl}" class="list-avatar" alt="${student.name}">
                    <div class="user-details">
                        <div class="user-name">${student.name}</div>
                        <!-- <div class="user-belt"><span class="belt-dot" style="background: red;"></span> Faixa Vermelha</div> -->
                    </div>
                </div>
                <div class="stat-value xp-value">${student.totalXP.toLocaleString()}</div>
                <div class="stat-value">Lvl ${student.level}</div>
                <div class="stat-value streak-value"><i class="fas fa-fire"></i> ${student.streak}</div>
            </div>
        `;
    }
}

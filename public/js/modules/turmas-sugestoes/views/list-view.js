export class SuggestionListView {
    constructor(api, module) {
        this.api = api;
        this.module = module;
        this.container = null;
    }

    async render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="module-header-content">
                    <div class="module-breadcrumb">
                        <span class="breadcrumb-item">Início</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">Sugestões de Horários</span>
                    </div>
                    <div class="module-header-actions">
                        <button class="btn-action-premium" onclick="window.turmasSugestoes.showForm()">
                            <i class="icon">➕</i>
                            <span>Sugerir Novo Horário</span>
                        </button>
                    </div>
                </div>
                <h1 class="module-title">💡 Sugestões da Comunidade</h1>
                <p class="module-subtitle">Vote nos horários que você gostaria de ver na academia</p>
            </div>

            <div class="module-filters-premium">
                <div class="filters-row">
                    <div class="filter-group">
                        <label>Dia da Semana</label>
                        <select id="filterDay" class="form-select-premium">
                            <option value="">Todos</option>
                            <option value="1">Segunda</option>
                            <option value="2">Terça</option>
                            <option value="3">Quarta</option>
                            <option value="4">Quinta</option>
                            <option value="5">Sexta</option>
                            <option value="6">Sábado</option>
                            <option value="0">Domingo</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Status</label>
                        <select id="filterStatus" class="form-select-premium">
                            <option value="PENDING">Em Análise</option>
                            <option value="APPROVED">Aprovadas</option>
                            <option value="FULFILLED">Atendidas</option>
                            <option value="REJECTED">Rejeitadas</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="data-container-premium">
                <div class="data-content" id="suggestionsList">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;

        this.attachEvents();
        await this.loadData();
    }

    attachEvents() {
        this.container.querySelector('#filterDay').addEventListener('change', () => this.loadData());
        this.container.querySelector('#filterStatus').addEventListener('change', () => this.loadData());
    }

    async loadData() {
        const day = this.container.querySelector('#filterDay').value;
        const status = this.container.querySelector('#filterStatus').value;
        
        const list = this.container.querySelector('#suggestionsList');
        list.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const params = new URLSearchParams();
            if (day) params.append('dayOfWeek', day);
            if (status) params.append('status', status);

            const response = await this.api.request('GET', `/api/horarios-sugeridos?${params.toString()}`);
            
            if (response.success) {
                this.renderList(response.data);
            } else {
                list.innerHTML = '<div class="error-state">Erro ao carregar sugestões</div>';
            }
        } catch (e) {
            console.error(e);
            list.innerHTML = '<div class="error-state">Erro ao carregar sugestões</div>';
        }
    }

    renderList(suggestions) {
        const list = this.container.querySelector('#suggestionsList');
        
        if (suggestions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💡</div>
                    <h3>Nenhuma sugestão encontrada</h3>
                    <p>Seja o primeiro a sugerir um novo horário!</p>
                    <button class="btn-primary" onclick="window.turmasSugestoes.showForm()">Sugerir Horário</button>
                </div>
            `;
            return;
        }

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        list.innerHTML = `
            <div class="suggestions-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px;">
                ${suggestions.map(s => `
                    <div class="suggestion-card" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eee;">
                        <div class="card-header" style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                            <span class="day-badge" style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-weight: 600;">
                                ${days[s.dayOfWeek]}
                            </span>
                            <span class="votes-badge" style="display: flex; align-items: center; gap: 5px; font-weight: bold; color: #666;">
                                👍 ${s.votes}
                            </span>
                        </div>
                        
                        <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">${s.startTime} - ${s.endTime}</h3>
                        <p style="color: #666; margin: 0 0 15px 0;">${s.courseType || 'Geral'} • ${s.level || 'Todos os níveis'}</p>
                        
                        ${s.notes ? `<p style="font-size: 0.9rem; color: #888; font-style: italic; margin-bottom: 15px;">"${s.notes}"</p>` : ''}
                        
                        <div class="card-footer" style="border-top: 1px solid #eee; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
                            <div class="author" style="font-size: 0.85rem; color: #888;">
                                Sugerido por ${s.student?.user?.firstName || 'Aluno'}
                            </div>
                            <button class="btn-vote" onclick="window.turmasSugestoes.listView.vote('${s.id}')" 
                                style="background: #f3f4f6; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; color: #4b5563; transition: all 0.2s;">
                                👍 Apoiar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async vote(id) {
        try {
            const user = JSON.parse(localStorage.getItem('portal_user') || localStorage.getItem('user') || '{}');
            const studentId = user.studentId || user.id;
            
            if (!studentId) {
                alert('Erro: Usuário não identificado');
                return;
            }

            const res = await this.api.request('POST', `/api/horarios-sugeridos/${id}/support`, { studentId });
            if (res.success) {
                this.loadData();
            } else {
                alert('Erro ao votar: ' + (res.message || 'Tente novamente'));
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao processar voto');
        }
    }
}

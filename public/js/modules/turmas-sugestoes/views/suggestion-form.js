export class SuggestionFormView {
    constructor(api, module) {
        this.api = api;
        this.module = module;
        this.container = null;
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="module-header-content">
                    <div class="module-breadcrumb">
                        <span class="breadcrumb-item" onclick="window.turmasSugestoes.showList()" style="cursor: pointer;">Sugestões</span>
                        <span class="breadcrumb-separator">›</span>
                        <span class="breadcrumb-item active">Nova Sugestão</span>
                    </div>
                </div>
                <h1 class="module-title">Sugerir Novo Horário</h1>
                <p class="module-subtitle">Ajude-nos a criar a grade perfeita para você</p>
            </div>

            <div class="data-card-premium" style="max-width: 800px; margin: 0 auto;">
                <form id="suggestionForm" class="premium-form">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Dia da Semana</label>
                            <select name="dayOfWeek" class="form-input-premium" required>
                                <option value="">Selecione...</option>
                                <option value="1">Segunda-feira</option>
                                <option value="2">Terça-feira</option>
                                <option value="3">Quarta-feira</option>
                                <option value="4">Quinta-feira</option>
                                <option value="5">Sexta-feira</option>
                                <option value="6">Sábado</option>
                                <option value="0">Domingo</option>
                            </select>
                        </div>

                        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                            <div class="form-group">
                                <label>Horário Início</label>
                                <input type="time" name="startTime" class="form-input-premium" required>
                            </div>
                            <div class="form-group">
                                <label>Horário Fim</label>
                                <input type="time" name="endTime" class="form-input-premium" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Tipo de Aula</label>
                            <select name="courseType" class="form-input-premium" required>
                                <option value="">Selecione...</option>
                                <option value="KRAV_MAGA">Krav Maga Regular</option>
                                <option value="DEFESA_PESSOAL">Defesa Pessoal</option>
                                <option value="COMBATE">Combate Avançado</option>
                                <option value="KIDS">Kids / Teens</option>
                                <option value="FITNESS">Fitness / Condicionamento</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Nível Sugerido</label>
                            <select name="level" class="form-input-premium" required>
                                <option value="INICIANTE">Iniciante (Faixa Branca/Amarela)</option>
                                <option value="INTERMEDIARIO">Intermediário (Laranja/Verde)</option>
                                <option value="AVANCADO">Avançado (Azul+)</option>
                                <option value="TODOS">Todos os Níveis</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Observações (Opcional)</label>
                            <textarea name="notes" class="form-input-premium" rows="3" placeholder="Ex: Gostaria de aulas focadas em defesa contra faca..."></textarea>
                        </div>
                    </div>

                    <div class="form-actions" style="margin-top: 30px; display: flex; justify-content: flex-end; gap: 15px;">
                        <button type="button" class="btn-secondary-premium" onclick="window.turmasSugestoes.showList()">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary-premium">
                            Enviar Sugestão
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.attachEvents();
    }

    attachEvents() {
        const form = this.container.querySelector('#suggestionForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(new FormData(form));
        });
    }

    async handleSubmit(formData) {
        try {
            const user = JSON.parse(localStorage.getItem('portal_user') || localStorage.getItem('user') || '{}');
            const studentId = user.studentId || user.id;

            if (!studentId) {
                alert('Erro: Usuário não identificado');
                return;
            }

            const data = {
                studentId,
                dayOfWeek: parseInt(formData.get('dayOfWeek')),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                courseType: formData.get('courseType'),
                level: formData.get('level'),
                notes: formData.get('notes')
            };

            const btn = this.container.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = 'Enviando...';

            const response = await this.api.request('POST', '/api/horarios-sugeridos', data);

            if (response.success) {
                alert('Sugestão enviada com sucesso!');
                window.turmasSugestoes.showList();
            } else {
                alert('Erro ao enviar sugestão: ' + (response.message || 'Tente novamente'));
                btn.disabled = false;
                btn.innerText = originalText;
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao processar envio');
            const btn = this.container.querySelector('button[type="submit"]');
            btn.disabled = false;
            btn.innerText = 'Enviar Sugestão';
        }
    }
}

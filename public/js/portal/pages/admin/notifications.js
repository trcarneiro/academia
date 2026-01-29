import { renderNavBottom } from '../../components/nav-bottom.js';
import { renderHeader } from '../../components/header.js';

export async function renderAdminNotifications(container) {
    const token = localStorage.getItem('portal_token');

    async function apiRequest(method, endpoint, data = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data) config.body = JSON.stringify(data);

        const response = await fetch(`/api/admin/broadcast${endpoint}`, config);
        return await response.json();
    }

    container.innerHTML = `
        <div class="page-admin-notifications">
            <header id="header-container"></header>
            
            <main class="content-container">
                <div class="card">
                    <h2>📢 Enviar Nova Notificação</h2>
                    <p>Envie avisos importantes para todos os alunos ou segmentos.</p>
                    
                    <form id="broadcast-form">
                        <div class="form-group">
                            <label>Título</label>
                            <input type="text" id="title" placeholder="Ex: Aviso de Feriado" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Mensagem</label>
                            <textarea id="message" rows="4" placeholder="Escreva sua mensagem aqui..." required></textarea>
                        </div>

                        <div class="form-group">
                            <label>Destinatários</label>
                            <select id="segment">
                                <option value="ALL">Todos os Alunos</option>
                                <option value="ACTIVE">Apenas Ativos</option>
                                <option value="INACTIVE">Apenas Inativos</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Canais de Envio</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="channels" value="PUSH" checked disabled> In-App (Sininho)</label>
                                <label><input type="checkbox" name="channels" value="EMAIL"> E-mail (Simulado)</label>
                            </div>
                        </div>

                        <button type="submit" class="btn-primary">Enviar Broadcast 🚀</button>
                    </form>
                </div>

                <div class="card history">
                    <h3>Histórico de Envios</h3>
                    <div id="history-list">
                        <p class="loading-state">Carregando histórico...</p>
                    </div>
                </div>
            </main>

            <div id="nav-bottom-container"></div>
        </div>
    `;

    renderHeader('Central de Notificações');
    renderNavBottom('/admin/notifications');

    // Add styles
    if (!document.getElementById('admin-notifications-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-notifications-styles';
        style.textContent = `
            .page-admin-notifications { padding-bottom: 80px; }
            .content-container { padding: 20px; max-width: 600px; margin: 0 auto; }
            .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .form-group { margin-bottom: 15px; }
            .form-group label { display: block; font-weight: 600; margin-bottom: 5px; color: #444; }
            .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
            .checkbox-group { display: flex; gap: 15px; margin-top: 5px; }
            .checkbox-group label { font-weight: 400; display: flex; align-items: center; gap: 5px; cursor: pointer; }
            .checkbox-group input { width: auto; }
            .btn-primary { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
            .history h3 { margin-bottom: 15px; font-size: 1.1rem; }
            .loading-state, .empty-state { color: #888; font-style: italic; text-align: center; padding: 20px; }
            .history-item { border-bottom: 1px solid #eee; padding: 15px 0; }
            .history-item:last-child { border-bottom: none; }
            .history-item h4 { margin: 0 0 5px 0; font-size: 1rem; color: #1f2937; }
            .history-item p { margin: 0; color: #4b5563; font-size: 0.9rem; line-height: 1.4; }
            .history-item .meta { font-size: 0.8rem; color: #9ca3af; margin-top: 10px; display: flex; justify-content: space-between; }
        `;
        document.head.appendChild(style);
    }

    async function loadHistory() {
        const historyList = document.getElementById('history-list');
        try {
            const result = await apiRequest('GET', '/');
            if (!result.success) throw new Error(result.message);

            const broadcasts = result.data;
            if (broadcasts.length === 0) {
                historyList.innerHTML = '<p class="empty-state">Nenhum envio realizado.</p>';
                return;
            }

            historyList.innerHTML = broadcasts.map(b => `
                <div class="history-item">
                    <h4>${b.title}</h4>
                    <p>${b.message}</p>
                    <div class="meta">
                        <span>🗓️ ${new Date(b.sentAt || b.createdAt).toLocaleDateString()}</span>
                        <span>👥 Segmento: ${b.segment}</span>
                        <span>✅ ${b.stats?.sent || 0} enviados</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            historyList.innerHTML = `<p class="empty-state" style="color: red;">Erro ao carregar histórico: ${error.message}</p>`;
        }
    }

    // Initial Load
    loadHistory();

    // Handle Form Submit
    document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = 'Enviando...';
        btn.disabled = true;

        const title = document.getElementById('title').value;
        const message = document.getElementById('message').value;
        const segment = document.getElementById('segment').value;

        const channels = Array.from(e.target.querySelectorAll('input[name="channels"]:checked')).map(cb => cb.value);

        try {
            const result = await apiRequest('POST', '/', { title, message, segment, channels });
            if (!result.success) throw new Error(result.message);

            alert(`✅ Broadcast enviado com sucesso!\nPara ${result.data.stats?.sent || 0} alunos.`);
            e.target.reset();
            loadHistory();
        } catch (error) {
            alert(`❌ Erro ao enviar: ${error.message}`);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

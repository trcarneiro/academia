import { renderNavBottom } from '../components/nav-bottom.js';
import { renderHeader } from '../components/header.js';

export async function renderCrmConfig(container) {
    container.innerHTML = `
        <div class="page-crm-config">
            <header id="header-container"></header>
            
            <main class="content-container">
                <div class="config-card">
                    <h2>🔗 Links do CRM</h2>
                    <p>Use estes links para divulgar a página de matrícula ou acessar o painel de vendas.</p>
                    
                    <div class="link-group">
                        <label>Página de Agendamento (Público)</label>
                        <div class="input-with-copy">
                            <input type="text" readonly value="${window.location.origin}/trial-booking.html">
                            <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Copiar</button>
                        </div>
                        <a href="/trial-booking.html" target="_blank" class="preview-link">Abrir página agendamento</a>
                    </div>

                    <div class="link-group">
                        <label>Dashboard de Vendas (Interno)</label>
                        <div class="input-with-copy">
                            <input type="text" readonly value="${window.location.origin}/portal/index.html#/dashboard">
                            <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">Copiar</button>
                        </div>
                        <a href="#/dashboard" class="preview-link">Ir para Dashboard</a>
                    </div>
                </div>

                <div class="config-card info">
                    <h3>💡 Dica</h3>
                    <p>O link de agendamento pode ser enviado via WhatsApp ou colocado na bio do Instagram.</p>
                </div>
            </main>

            <div id="nav-bottom-container"></div>
        </div>
    `;

    renderHeader('Configurações CRM');
    renderNavBottom('/crm-config');

    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .page-crm-config {
            padding-bottom: 80px;
        }
        .content-container {
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        .config-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .config-card.info {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
        }
        .config-card h2 {
            font-size: 1.2rem;
            margin-bottom: 10px;
            color: #333;
        }
        .config-card p {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 20px;
        }
        .link-group {
            margin-bottom: 20px;
        }
        .link-group label {
            display: block;
            font-weight: 600;
            font-size: 0.85rem;
            margin-bottom: 8px;
            color: #444;
        }
        .input-with-copy {
            display: flex;
            gap: 8px;
            margin-bottom: 8px;
        }
        .input-with-copy input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: monospace;
            background: #f9f9f9;
        }
        .input-with-copy button {
            padding: 0 15px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        .preview-link {
            display: inline-block;
            font-size: 0.85rem;
            color: #2563eb;
            text-decoration: none;
        }
    `;
    document.head.appendChild(style);
}

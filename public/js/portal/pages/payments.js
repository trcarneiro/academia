import { api } from '../api.js';
import { router } from '../router.js';
import { renderHeader } from '../components/header.js';

export async function render(container) {
    loadCSS('/css/portal/pages/payments.css');

    // Check Auth
    const token = localStorage.getItem('portal_token');
    if (!token) {
        router.navigate('/login');
        return;
    }

    // Get User Data
    const user = JSON.parse(localStorage.getItem('portal_user') || 'null');

    container.innerHTML = '';
    container.className = 'payments-page';

    // Render Header
    const header = renderHeader(user);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'payments-content';
    content.innerHTML = `
        <div class="payments-summary" id="payments-summary">
            <div class="summary-loading">Carregando...</div>
        </div>

        <div class="payments-list" id="payments-list">
            <div class="loading-spinner"></div>
        </div>
    `;
    container.appendChild(content);

    await loadPayments();
}

async function loadPayments() {
    const listEl = document.getElementById('payments-list');
    const summaryEl = document.getElementById('payments-summary');
    
    try {
        const response = await api.request('GET', '/financial');
        if (response.success) {
            renderSummary(response.data, summaryEl);
            renderList(response.data.payments || response.data, listEl);
        } else {
            listEl.innerHTML = '<p class="error-message">Erro ao carregar pagamentos.</p>';
            summaryEl.innerHTML = '';
        }
    } catch (error) {
        console.error(error);
        listEl.innerHTML = '<p class="error-message">Erro de conexão.</p>';
        summaryEl.innerHTML = '';
    }
}

function renderSummary(data, summaryEl) {
    const payments = data.payments || data;
    
    // Calculate totals
    let pending = 0;
    let overdue = 0;
    let paid = 0;

    payments.forEach(p => {
        const amount = parseFloat(p.amount) || 0;
        if (p.status === 'PENDING') pending += amount;
        else if (p.status === 'OVERDUE') overdue += amount;
        else if (p.status === 'RECEIVED' || p.status === 'CONFIRMED') paid += amount;
    });

    summaryEl.innerHTML = `
        <div class="summary-card pending">
            <span class="summary-label">Pendente</span>
            <span class="summary-value">R$ ${formatCurrency(pending)}</span>
        </div>
        <div class="summary-card overdue">
            <span class="summary-label">Vencido</span>
            <span class="summary-value">R$ ${formatCurrency(overdue)}</span>
        </div>
        <div class="summary-card paid">
            <span class="summary-label">Pago</span>
            <span class="summary-value">R$ ${formatCurrency(paid)}</span>
        </div>
    `;
}

function renderList(payments, listEl) {
    if (!payments || payments.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💳</div>
                <h3>Nenhum pagamento</h3>
                <p>Você não tem pagamentos registrados.</p>
            </div>
        `;
        return;
    }

    const sorted = [...payments].sort((a, b) => {
        // Priority: OVERDUE > PENDING > others, then by dueDate
        const order = { OVERDUE: 0, PENDING: 1, RECEIVED: 2, CONFIRMED: 2 };
        const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (diff !== 0) return diff;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    listEl.innerHTML = sorted.map(payment => {
        const statusMap = {
            'PENDING': { label: 'Pendente', class: 'pending' },
            'RECEIVED': { label: 'Pago', class: 'paid' },
            'CONFIRMED': { label: 'Pago', class: 'paid' },
            'OVERDUE': { label: 'Vencido', class: 'overdue' }
        };
        const status = statusMap[payment.status] || { label: payment.status, class: '' };
        const isPending = payment.status === 'PENDING' || payment.status === 'OVERDUE';

        return `
            <div class="payment-card ${status.class}">
                <div class="payment-info">
                    <h3>${payment.description || 'Mensalidade'}</h3>
                    <p class="due-date">Vencimento: ${formatDate(payment.dueDate)}</p>
                    <span class="payment-status ${status.class}">${status.label}</span>
                </div>
                <div class="payment-amount">
                    <span class="amount-value">R$ ${formatCurrency(payment.amount)}</span>
                    ${isPending ? `<button class="btn-pay" data-id="${payment.id}" data-url="${payment.invoiceUrl || ''}">Pagar</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to pay buttons
    listEl.querySelectorAll('.btn-pay').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (url) {
                window.open(url, '_blank');
            } else {
                fetchPaymentDetails(btn.dataset.id);
            }
        });
    });
}

async function fetchPaymentDetails(id) {
    try {
        const response = await api.request('GET', `/financial/${id}`);
        
        if (response.success && response.data) {
            const payment = response.data;
            if (payment.invoiceUrl) {
                window.open(payment.invoiceUrl, '_blank');
            } else if (payment.pixCode) {
                // Copy PIX code
                await navigator.clipboard.writeText(payment.pixCode);
                alert('Código PIX copiado para a área de transferência!');
            } else {
                alert('Link de pagamento indisponível. Entre em contato com a academia.');
            }
        } else {
            alert('Erro ao buscar detalhes do pagamento.');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao buscar detalhes do pagamento.');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
    return parseFloat(value || 0).toFixed(2).replace('.', ',');
}

function loadCSS(href) {
    if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

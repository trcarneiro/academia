// /public/js/modules/discounts/index.js

if (typeof window.DiscountsModule !== 'undefined') {
    console.log('DiscountsModule already loaded');
} else {

const DiscountsModule = {
    container: null,
    data: [],
    moduleAPI: null,
    
    async init() {
        await this.initializeAPI();
        await this.loadData();
        this.render();
        this.setupEvents();
        
        window.discountsModule = this;
        window.app?.dispatchEvent('module:loaded', { name: 'discounts' });
    },
    
    async initializeAPI() {
        await waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('Discounts');
    },
    
    async loadData() {
        await this.moduleAPI.fetchWithStates('/api/discounts', {
            loadingElement: this.container,
            onSuccess: (data) => { this.data = data.data; },
            onEmpty: () => this.showEmpty(),
            onError: (error) => this.showError(error)
        });
    },
    
    render() {
        this.container.innerHTML = `
            <div class="module-header-premium">
                <div class="header-content">
                    <h1>Descontos e Promoções</h1>
                    <nav class="breadcrumb">Home > Comercial > Descontos</nav>
                </div>
                <button id="btn-new-discount" class="btn-premium-primary">
                    <i class="fas fa-plus"></i> Novo Desconto
                </button>
            </div>
            <div class="data-card-premium">
                ${this.renderList()}
            </div>
        `;
    },

    renderList() {
        if (!this.data || this.data.length === 0) return this.renderEmptyState();
        
        return `
            <table class="premium-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Gatilho</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.data.map(d => `
                        <tr class="data-row" data-id="${d.id}">
                            <td>
                                <div class="fw-bold">${d.name}</div>
                                <div class="text-muted small">${d.description || ''}</div>
                            </td>
                            <td>${d.type === 'PERCENTAGE' ? 'Porcentagem' : 'Valor Fixo'}</td>
                            <td>${d.type === 'PERCENTAGE' ? d.value + '%' : 'R$ ' + parseFloat(d.value).toFixed(2)}</td>
                            <td>
                                <span class="badge badge-soft">${d.triggerType}</span>
                                ${d.triggerValue ? `<span class="small text-muted">(${d.triggerValue})</span>` : ''}
                            </td>
                            <td>
                                <span class="status-badge ${d.isActive ? 'status-active' : 'status-inactive'}">
                                    ${d.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td>
                                <button class="btn-icon btn-edit" data-id="${d.id}"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon btn-delete" data-id="${d.id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-tags empty-icon"></i>
                <h3>Nenhum desconto cadastrado</h3>
                <p>Crie descontos para aplicar em planos e matrículas.</p>
                <button class="btn-premium-secondary" onclick="document.getElementById('btn-new-discount').click()">
                    Criar Primeiro Desconto
                </button>
            </div>
        `;
    },
    
    setupEvents() {
        this.container.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');
            const btnNew = e.target.closest('#btn-new-discount');
            
            if (btnEdit) this.openEditor(btnEdit.dataset.id);
            if (btnDelete) this.deleteDiscount(btnDelete.dataset.id);
            if (btnNew) this.openEditor();
        });
    },

    async openEditor(id = null) {
        const discount = id ? this.data.find(d => d.id === id) : null;
        
        const { value: formValues } = await Swal.fire({
            title: id ? 'Editar Desconto' : 'Novo Desconto',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Nome (ex: Pagamento à Vista)" value="${discount?.name || ''}">
                <input id="swal-desc" class="swal2-input" placeholder="Descrição" value="${discount?.description || ''}">
                <select id="swal-type" class="swal2-input">
                    <option value="PERCENTAGE" ${discount?.type === 'PERCENTAGE' ? 'selected' : ''}>Porcentagem (%)</option>
                    <option value="FIXED_AMOUNT" ${discount?.type === 'FIXED_AMOUNT' ? 'selected' : ''}>Valor Fixo (R$)</option>
                </select>
                <input id="swal-value" type="number" class="swal2-input" placeholder="Valor" value="${discount?.value || ''}">
                <select id="swal-trigger" class="swal2-input">
                    <option value="MANUAL" ${discount?.triggerType === 'MANUAL' ? 'selected' : ''}>Manual (Selecionar na venda)</option>
                    <option value="PAYMENT_METHOD" ${discount?.triggerType === 'PAYMENT_METHOD' ? 'selected' : ''}>Método de Pagamento</option>
                    <option value="COUPON" ${discount?.triggerType === 'COUPON' ? 'selected' : ''}>Cupom</option>
                    <option value="CAMPAIGN" ${discount?.triggerType === 'CAMPAIGN' ? 'selected' : ''}>Campanha Automática</option>
                </select>
                <input id="swal-trigger-val" class="swal2-input" placeholder="Valor do Gatilho (ex: PIX, BLACKFRIDAY)" value="${discount?.triggerValue || ''}">
            `,
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    description: document.getElementById('swal-desc').value,
                    type: document.getElementById('swal-type').value,
                    value: Number(document.getElementById('swal-value').value),
                    triggerType: document.getElementById('swal-trigger').value,
                    triggerValue: document.getElementById('swal-trigger-val').value
                }
            }
        });

        if (formValues) {
            try {
                if (id) {
                    await this.moduleAPI.request(`/api/discounts/${id}`, { method: 'PUT', body: JSON.stringify(formValues) });
                } else {
                    await this.moduleAPI.request('/api/discounts', { method: 'POST', body: JSON.stringify(formValues) });
                }
                await this.loadData();
                this.render();
                Swal.fire('Sucesso', 'Desconto salvo com sucesso', 'success');
            } catch (error) {
                Swal.fire('Erro', 'Falha ao salvar desconto', 'error');
            }
        }
    },

    async deleteDiscount(id) {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação não pode ser desfeita!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!'
        });

        if (result.isConfirmed) {
            try {
                await this.moduleAPI.request(`/api/discounts/${id}`, { method: 'DELETE' });
                await this.loadData();
                this.render();
                Swal.fire('Excluído!', 'O desconto foi removido.', 'success');
            } catch (error) {
                Swal.fire('Erro', 'Falha ao excluir desconto', 'error');
            }
        }
    },
    
    showEmpty() {
        this.container.innerHTML = this.renderEmptyState();
    },
    
    showError(error) {
        this.container.innerHTML = `<div class="error-state">Erro ao carregar dados: ${error.message}</div>`;
    }
};

window.DiscountsModule = DiscountsModule;
}

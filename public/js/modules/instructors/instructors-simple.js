/**
 * MÓDULO SIMPLIFICADO DE INSTRUTORES
 * Solução para complexidade desnecessária e problemas de duplicação
 */

class SimpleInstructorsModule {
    constructor() {
        this.container = null;
        this.instructors = [];
        this.initialized = false;
    }

    /**
     * Inicializar módulo
     */
    async init(container) {
        if (this.initialized) {
            console.log('👨‍🏫 Simple Instructors: já inicializado');
            return;
        }

        console.log('👨‍🏫 Simple Instructors: Inicializando...');
        this.container = container;
        
        try {
            await this.loadInstructors();
            this.render();
            this.setupEvents();
            this.initialized = true;
            console.log('✅ Simple Instructors: Pronto');
        } catch (error) {
            console.error('❌ Simple Instructors: Erro na inicialização:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Carregar dados dos instrutores
     */
    async loadInstructors() {
        try {
            const response = await fetch('/api/instructors');
            const data = await response.json();
            
            if (data.success) {
                this.instructors = data.data || [];
                console.log(`📊 Carregados ${this.instructors.length} instrutores`);
            } else {
                throw new Error(data.error || 'Erro ao carregar instrutores');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar instrutores:', error);
            throw error;
        }
    }

    /**
     * Renderizar interface
     */
    render() {
        if (!this.container) return;

        const activeCount = this.instructors.filter(i => i.isActive).length;
        
        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>👨‍🏫 Instrutores</h1>
                <button id="btn-add-instructor" class="btn-primary">
                    <i class="fas fa-plus"></i> Novo Instrutor
                </button>
            </div>

            <div class="stats-grid">
                <div class="stat-card-enhanced">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${this.instructors.length}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
                <div class="stat-card-enhanced">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${activeCount}</div>
                        <div class="stat-label">Ativos</div>
                    </div>
                </div>
            </div>

            <div class="data-card-premium">
                ${this.renderTable()}
            </div>
        `;
    }

    /**
     * Renderizar tabela de instrutores
     */
    renderTable() {
        if (this.instructors.length === 0) {
            return `
                <div class="empty-state-premium">
                    <div class="empty-icon-premium">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h3>Nenhum instrutor encontrado</h3>
                    <p>Cadastre o primeiro instrutor do sistema.</p>
                    <button id="btn-add-first" class="btn-primary">
                        <i class="fas fa-plus"></i> Adicionar Primeiro Instrutor
                    </button>
                </div>
            `;
        }

        return `
            <div class="table-container-premium">
                <table class="table-premium">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.instructors.map(instructor => this.renderRow(instructor)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Renderizar linha da tabela
     */
    renderRow(instructor) {
        const statusClass = instructor.isActive ? 'status-active' : 'status-inactive';
        const statusText = instructor.isActive ? 'Ativo' : 'Inativo';

        return `
            <tr class="table-row-premium" data-id="${instructor.id}">
                <td>
                    <div class="user-info-premium">
                        <div class="user-avatar-premium">
                            <span>${instructor.name.charAt(0)}</span>
                        </div>
                        <span class="user-name-premium">${instructor.name}</span>
                    </div>
                </td>
                <td>${instructor.email}</td>
                <td>${instructor.phone || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="table-actions-premium">
                        <button class="btn-icon edit-btn" title="Editar" data-id="${instructor.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" title="Excluir" data-id="${instructor.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderizar estado de erro
     */
    renderError(message) {
        this.container.innerHTML = `
            <div class="error-state-premium">
                <div class="error-icon-premium">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar instrutores</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">
                    Tentar Novamente
                </button>
            </div>
        `;
    }

    /**
     * Configurar eventos
     */
    setupEvents() {
        if (!this.container) return;

        // Botão adicionar (cabeçalho)
        const addBtn = this.container.querySelector('#btn-add-instructor');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openEditor());
        }

        // Botão adicionar primeiro
        const addFirstBtn = this.container.querySelector('#btn-add-first');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => this.openEditor());
        }

        // Botões de editar
        this.container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.openEditor(id);
            });
        });

        // Botões de excluir
        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.deleteInstructor(id);
            });
        });

        // Duplo clique na linha
        this.container.querySelectorAll('.table-row-premium').forEach(row => {
            row.addEventListener('dblclick', () => {
                const id = row.dataset.id;
                this.openEditor(id);
            });
        });
    }

    /**
     * Abrir editor (CORRIGIDO)
     */
    openEditor(instructorId = null) {
        console.log('🔄 Abrindo editor para:', instructorId ? `editar ${instructorId}` : 'criar novo');
        
        // Usar o editor na pasta public (acessível pelo servidor)
        const baseUrl = window.location.origin;
        let editorUrl;
        
        if (instructorId) {
            editorUrl = `${baseUrl}/instructor-editor.html?id=${instructorId}&mode=edit`;
        } else {
            editorUrl = `${baseUrl}/instructor-editor.html?mode=create`;
        }
        
        console.log('🚀 Navegando para:', editorUrl);
        window.location.href = editorUrl;
    }

    /**
     * Excluir instrutor
     */
    async deleteInstructor(instructorId) {
        const instructor = this.instructors.find(i => i.id === instructorId);
        const confirmMsg = `Tem certeza que deseja excluir o instrutor "${instructor?.name || 'Selecionado'}"?`;
        
        if (!confirm(confirmMsg)) return;

        try {
            console.log('🗑️ Excluindo instrutor:', instructorId);
            
            const response = await fetch(`/api/instructors/${instructorId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Instrutor excluído com sucesso');
                
                // Remover da lista local e re-renderizar
                this.instructors = this.instructors.filter(i => i.id !== instructorId);
                this.render();
                this.setupEvents();
                
                // Mostrar mensagem de sucesso
                this.showMessage('Instrutor excluído com sucesso!', 'success');
            } else {
                throw new Error(result.error || 'Erro ao excluir instrutor');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir:', error);
            this.showMessage('Erro ao excluir instrutor: ' + error.message, 'error');
        }
    }

    /**
     * Mostrar mensagem
     */
    showMessage(message, type = 'info') {
        // Criar ou encontrar container de mensagens
        let messageContainer = document.querySelector('.message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        messageContainer.appendChild(messageEl);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    /**
     * Recarregar dados
     */
    async reload() {
        try {
            await this.loadInstructors();
            this.render();
            this.setupEvents();
        } catch (error) {
            this.renderError(error.message);
        }
    }
}

// Função de inicialização global para compatibilidade
async function initSimpleInstructorsModule(container) {
    if (!window.simpleInstructorsModule) {
        window.simpleInstructorsModule = new SimpleInstructorsModule();
    }
    
    await window.simpleInstructorsModule.init(container);
    
    // Tornar controller globalmente acessível para compatibilidade
    window.instructorsController = window.simpleInstructorsModule;
    
    return window.simpleInstructorsModule;
}

// Fazer disponível globalmente
window.SimpleInstructorsModule = SimpleInstructorsModule;
window.initSimpleInstructorsModule = initSimpleInstructorsModule;

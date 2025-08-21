/**
 * Student Editor - Main Controller
 * Arquivo principal que gerencia as abas e inicialização
 */

class StudentEditor {
    constructor() {
        this.currentStudentId = null;
        this.studentData = null;
        this.activeTab = 'profile';
        this.tabs = {};
        this.isInitialized = false;
        
        // Inicializar de forma assíncrona
        this.init().then(() => {
            this.isInitialized = true;
        }).catch(error => {
            console.error('❌ Falha na inicialização:', error);
        });
    }

    async init() {
        console.log('🚀 Iniciando Student Editor...');
        
        try {
            // Extrair ID do estudante da URL
            if (!this.extractStudentId()) {
                return; // Não continuar se não houver ID
            }
            
            // Configurar navegação de abas
            this.setupTabNavigation();
            
            // Configurar eventos globais
            this.setupGlobalEvents();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Carregar dados do estudante
            await this.loadStudentData();
            
            console.log('✅ Student Editor inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro fatal na inicialização:', error);
            this.showError('Erro ao inicializar o editor de estudante');
        }
    }

    extractStudentId() {
        console.log('🔍 Tentando recuperar dados do localStorage...');
        
        try {
            // Prefer params provided by the module loader / SPA navigation
            const navParams = (window.__STUDENT_EDITOR_PARAMS || window.__MODULE_NAV_PARAMS || window.__NAV_PARAMS);
            if (navParams && (navParams.studentId || navParams.id)) {
                const idFromParams = navParams.studentId || navParams.id;
                console.log('🔍 Encontrado parâmetro de navegação:', idFromParams);
                this.currentStudentId = idFromParams;
                this.mode = navParams.mode || 'edit';
                // clear transient globals so subsequent opens don't reuse stale params
                try { delete window.__STUDENT_EDITOR_PARAMS; delete window.__MODULE_NAV_PARAMS; delete window.__NAV_PARAMS; } catch(e){}
                return true;
            }

            // Primeiro verificar dados de navegação
            const editorMode = localStorage.getItem('studentEditorMode');
            console.log('🔍 studentEditorMode data:', editorMode);
            
            if (editorMode) {
                const data = JSON.parse(editorMode);
                console.log('📊 Dados do editor:', data);
                
                if (data.mode === 'create') {
                    console.log('➕ Modo CREATE detectado - novo estudante');
                    this.currentStudentId = null; // Novo aluno
                    this.mode = 'create';
                    return true;
                } else if (data.mode === 'edit' && data.studentId) {
                    console.log('✏️ Modo EDIT detectado:', data.studentId);
                    this.currentStudentId = data.studentId;
                    this.mode = 'edit';
                    return true;
                }
            }

            // Fallback: Tentar pegar da URL
            const urlParams = new URLSearchParams(window.location.search);
            let studentId = urlParams.get('id');
            
            // Fallback: localStorage antigo
            if (!studentId) {
                const storedData = localStorage.getItem('student_navigation');
                console.log('🔍 student_navigation data:', storedData);
                if (storedData) {
                    const navData = JSON.parse(storedData);
                    console.log('📊 Parsed student_navigation:', navData);
                    if (navData.mode === 'edit' && navData.studentId) {
                        studentId = navData.studentId;
                        this.mode = 'edit';
                        console.log(`📋 ID do estudante recuperado do localStorage (student_navigation): ${studentId}`);
                    }
                }
            }

            this.currentStudentId = studentId;
            
        } catch (error) {
            console.warn('⚠️ Erro ao acessar localStorage:', error);
        }
        
        if (!this.currentStudentId && this.mode !== 'create') {
            console.error('❌ ID do estudante não encontrado e não está em modo CREATE');
            this.showError('Dados de navegação não encontrados. Redirecionando...');
            setTimeout(() => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.navigateToModule ? window.navigateToModule('students') : (window.location.href = '/');
                }
            }, 2000);
            return false;
        }
        
        if (this.mode === 'create') {
            console.log('➕ Modo CREATE - preparando para novo estudante');
        } else {
            console.log(`📋 Modo EDIT - ID do estudante: ${this.currentStudentId}`);
        }
        
        return true;
    }

    async initializeComponents() {
        try {
            console.log('🔧 Iniciando carregamento dos componentes...');
            
            // Importar e inicializar aba de perfil
            console.log('📥 Importando ProfileTab...');
            const { ProfileTab } = await import('./profile-tab.js');
            console.log('✅ ProfileTab importado com sucesso');
            this.tabs.profile = new ProfileTab(this);
            console.log('✅ ProfileTab inicializado');
            
            // Importar e inicializar aba financeira
            console.log('📥 Importando FinancialTab...');
            const { FinancialTab } = await import('./financial-tab.js');
            console.log('✅ FinancialTab importado com sucesso');
            this.tabs.financial = new FinancialTab(this);
            console.log('✅ FinancialTab inicializado');
            
            console.log('✅ Todos os componentes inicializados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar componentes:', error);
            this.showError('Erro ao carregar componentes da página');
            throw error; // Re-throw para parar o processo de inicialização
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.page-tab');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = button.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        console.log(`🔄 Mudando para aba: ${tabName}`);
        
        // Atualizar botões
        document.querySelectorAll('.page-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Atualizar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        this.activeTab = tabName;
        
        // Notificar a aba ativa
        if (this.tabs[tabName] && typeof this.tabs[tabName].onTabActivated === 'function') {
            this.tabs[tabName].onTabActivated();
        }
    }

    setupGlobalEvents() {
        // Botão voltar
        document.getElementById('back-to-list-btn')?.addEventListener('click', () => {
            window.location.href = '/views/students.html';
        });
        
        // Botão salvar global
        document.getElementById('save-student-btn')?.addEventListener('click', () => {
            this.saveAllChanges();
        });
        
        // Fechar loading ao clicar fora
        document.getElementById('loadingState')?.addEventListener('click', (e) => {
            if (e.target.id === 'loadingState') {
                this.hideLoading();
            }
        });
    }

    async loadStudentData() {
        if (!this.currentStudentId) return;
        
        this.showLoading('Carregando dados do estudante...');
        
        try {
            const response = await fetch(`/api/students/${this.currentStudentId}`);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const payload = await response.json();
            // Normalizar para obter o objeto do estudante
            const student = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
            
            // Adicionar campos de conveniência no topo (para abas que esperam formato simples)
            const user = (student && student.user) || {};
            const normalized = {
                ...student,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                phone: user.phone || '',
                status: student?.isActive ? 'active' : 'inactive'
            };

            this.studentData = normalized;
            console.log('📊 Dados do estudante carregados:', this.studentData);
            
            // Atualizar header
            this.updateHeader();
            
            // Notificar todas as abas sobre os dados carregados
            Object.values(this.tabs).forEach(tab => {
                if (typeof tab.onDataLoaded === 'function') {
                    tab.onDataLoaded(this.studentData);
                }
            });
            
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do estudante:', error);
            this.showError('Erro ao carregar dados do estudante');
            this.hideLoading();
        }
    }

    updateHeader() {
        if (!this.studentData) return;
        
        const nameElement = document.getElementById('editPageStudentName');
        const idElement = document.getElementById('editPageStudentId');
        const categoryElement = document.getElementById('editPageStudentCategory');
        
        const user = this.studentData.user || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Nome não informado';
        const statusText = this.studentData.isActive ? 'Ativo' : 'Inativo';
        
        if (nameElement) nameElement.textContent = fullName;
        if (idElement) idElement.textContent = `ID: ${this.studentData.id || '--'}`;
        if (categoryElement) categoryElement.textContent = `Status: ${statusText}`;
    }

    async saveAllChanges() {
        // Coletar dados das abas primeiro
        let collectedData = {};
        try {
            for (const [tabName, tab] of Object.entries(this.tabs)) {
                if (typeof tab.collectData === 'function') {
                    const tabData = await tab.collectData();
                    collectedData = { ...collectedData, ...tabData };
                }
            }
        } catch (error) {
            console.error('❌ Erro ao coletar dados das abas:', error);
            this.showError('Corrija os erros nos formulários antes de salvar');
            return;
        }

        // CREATE: quando ainda não existe ID
        if (!this.currentStudentId) {
            this.showLoading('Criando aluno...');
            
            console.log('📤 CREATE - Enviando dados para API:');
            console.log(JSON.stringify(collectedData, null, 2));
            
            try {
                const response = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(collectedData)
                });
                
                console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('📡 API Error Response:', errorText);
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                const created = await response.json();
                // Normalizar resposta de criação
                const createdStudent = created && created.data ? created.data : created;
                this.studentData = createdStudent || collectedData;
                this.currentStudentId = (createdStudent && createdStudent.id) ? createdStudent.id : this.currentStudentId;
                this.mode = 'edit';

                // Atualizar header e estado de navegação
                this.updateHeader();
                localStorage.setItem('studentEditorMode', JSON.stringify({
                    mode: 'edit',
                    studentId: this.currentStudentId,
                    timestamp: Date.now()
                }));

                this.showSuccess('Aluno criado com sucesso!');
                setTimeout(() => this.loadStudentData(), 500);
            } catch (error) {
                console.error('❌ Erro ao criar aluno:', error);
                this.showError('Erro ao criar aluno');
            }
            this.hideLoading();
            return;
        }

        // EDIT: atualizar aluno existente
        if (!this.studentData) {
            // Fallback: se por algum motivo studentData não foi carregado, usar apenas os dados coletados
            this.studentData = {};
        }

        this.showLoading('Salvando alterações...');
        try {
            const allData = { ...this.studentData, ...collectedData };
            const response = await fetch(`/api/students/${this.currentStudentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allData)
            });
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            this.showSuccess('Alterações salvas com sucesso!');
            setTimeout(() => this.loadStudentData(), 500);
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            this.showError('Erro ao salvar alterações');
        }
        this.hideLoading();
    }

    // Métodos de UI
    showLoading(message = 'Carregando...') {
        const loadingState = document.getElementById('loadingState');
        const loadingMessage = document.getElementById('loadingStateMessage');
        
        if (loadingState) {
            if (loadingMessage) loadingMessage.textContent = message;
            loadingState.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    showError(message) {
        console.error('❌', message);
        
        // Tentar usar sistema de notificação mais elegante
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #EF4444, #DC2626);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        errorNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorNotification);
        
        // Remover após 4 segundos
        setTimeout(() => {
            if (errorNotification.parentElement) {
                errorNotification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    errorNotification.remove();
                }, 300);
            }
        }, 4000);
        
        // Fallback para alert se necessário
        if (!document.body) {
            alert('Erro: ' + message);
        }
    }

    showSuccess(message) {
        console.log('✅', message);
        
        // Criar notificação de sucesso elegante
        const successNotification = document.createElement('div');
        successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;
        
        successNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">✅</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successNotification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (successNotification.parentElement) {
                successNotification.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    successNotification.remove();
                }, 300);
            }
        }, 3000);
    }

    // Método para limpar a instância (útil para navegação)
    destroy() {
        console.log('🗑️ Destruindo instância do Student Editor...');
        
        // Remover event listeners se necessário
        const tabButtons = document.querySelectorAll('.page-tab');
        tabButtons.forEach(button => {
            button.removeEventListener('click', () => {});
        });
        
        // Limpar dados
        this.currentStudentId = null;
        this.studentData = null;
        this.tabs = {};
        this.isInitialized = false;
        
        console.log('✅ Student Editor destruído com sucesso');
    }
}

// Função de inicialização global para compatibilidade
window.initializeStudentEditor = () => {
    // Limpar instância anterior se existir
    if (window.studentEditor && typeof window.studentEditor.destroy === 'function') {
        window.studentEditor.destroy();
    }
    
    console.log('🔧 Inicializando Student Editor...');
    window.studentEditor = new StudentEditor();
};

// Evitar inicialização automática - deixar apenas para chamada manual via index.html
// Isso evita múltiplas instâncias
console.log('📦 Student Editor Module carregado (aguardando inicialização manual)...');

// Removed export statement to prevent module loading errors
// StudentEditor is already globally available via window.StudentEditor

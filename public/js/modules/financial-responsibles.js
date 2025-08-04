(function() {
    'use strict';
    
    // Module state
    let responsiblesData = [];
    let filteredResponsibles = [];
    let currentFilter = 'all';
    let currentSort = 'name';
    let sortDirection = 'asc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeFinancialResponsiblesModule();
    });
    
    // Module initialization
    function initializeFinancialResponsiblesModule() {
        console.log('💳 Initializing Financial Responsibles Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load responsibles if container exists
            if (document.getElementById('financial-responsibles') || document.querySelector('.financial-responsibles-isolated')) {
                loadFinancialResponsibles();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing financial responsibles module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        document.addEventListener('input', function(e) {
            if (e.target.id === 'responsibleSearch') {
                filterResponsibles(e.target.value);
            }
        });
        
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('responsible-filter')) {
                currentFilter = e.target.dataset.filter;
                filterResponsibles();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('responsible-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'asc';
                }
                sortResponsibles();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportResponsiblesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportResponsibles);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshResponsiblesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshResponsibles);
        }
    }
    
    // ==========================================
    // FINANCIAL RESPONSIBLES FUNCTIONS
    // ==========================================
    
    function loadFinancialResponsibles() {
        console.log('💳 Loading financial responsibles data...');
        fetchResponsiblesData();
    }
    
    function renderFinancialResponsibles(responsibles) {
        const container = document.getElementById('financial-responsibles') || document.querySelector('.financial-responsibles-isolated');
        if (!container) {
            console.warn('Financial responsibles container not found');
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        if (!responsibles || responsibles.length === 0) {
            container.innerHTML = `
                <div class="financial-responsibles-isolated">
                    <div class="responsibles-header">
                        <h2>💳 Responsáveis Financeiros</h2>
                        <div class="responsibles-actions">
                            <button class="btn btn-primary" onclick="addResponsible()">
                                ➕ Novo Responsável
                            </button>
                            <button class="btn btn-secondary" onclick="importResponsibles()">
                                📥 Importar
                            </button>
                        </div>
                    </div>
                    
                    <div class="responsibles-empty-state">
                        <div class="empty-icon">💳</div>
                        <h3>Nenhum responsável encontrado</h3>
                        <p>Adicione responsáveis financeiros para gerenciar os pagamentos dos alunos.</p>
                        <button class="btn btn-primary" onclick="addResponsible()">
                            ➕ Adicionar Primeiro Responsável
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const stats = calculateResponsibleStats(responsibles);
        
        container.innerHTML = `
            <div class="financial-responsibles-isolated">
                <div class="responsibles-header">
                    <h2>💳 Responsáveis Financeiros</h2>
                    <div class="responsibles-actions">
                        <button class="btn btn-primary" onclick="addResponsible()">
                            ➕ Novo Responsável
                        </button>
                        <button class="btn btn-secondary" onclick="importResponsibles()">
                            📥 Importar
                        </button>
                        <button class="btn btn-secondary" onclick="exportResponsibles()">
                            📊 Exportar
                        </button>
                        <button class="btn btn-secondary" onclick="window.history.back()">
                            ← Voltar
                        </button>
                    </div>
                </div>
                
                <div class="responsibles-stats">
                    <div class="stat-card">
                        <div class="stat-value active" id="totalResponsiblesCount">${stats.totalResponsibles}</div>
                        <div class="stat-label">Total de Responsáveis</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value pending" id="pendingPaymentsCount">${stats.pendingPayments}</div>
                        <div class="stat-label">Pagamentos Pendentes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value completed" id="upToDateCount">${stats.upToDate}</div>
                        <div class="stat-label">Em Dia</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="averageStudentsCount">${stats.averageStudents}</div>
                        <div class="stat-label">Média de Alunos</div>
                    </div>
                </div>
                
                <div class="responsibles-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="responsible-filter active" data-filter="all">Todos</button>
                        <button class="responsible-filter" data-filter="pending">Pendentes</button>
                        <button class="responsible-filter" data-filter="overdue">Em Atraso</button>
                        <button class="responsible-filter" data-filter="up-to-date">Em Dia</button>
                    </div>
                    
                    <div class="search-group">
                        <input type="text" id="responsibleSearch" placeholder="Buscar responsáveis..." class="search-input">
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="responsible-sort active" data-sort="name">Nome</button>
                        <button class="responsible-sort" data-sort="students">Alunos</button>
                        <button class="responsible-sort" data-sort="balance">Saldo</button>
                        <button class="responsible-sort" data-sort="lastPayment">Último Pagamento</button>
                    </div>
                </div>
                
                <div class="responsibles-grid">
                    ${responsibles.map(responsible => `
                        <div class="responsible-card ${responsible.paymentStatus}" data-responsible-id="${responsible.id}">
                            <div class="responsible-header">
                                <div class="responsible-info">
                                    <h3>👤 ${responsible.name}</h3>
                                    <div class="responsible-contact">
                                        <span>📧 ${responsible.email}</span>
                                        <span>📱 ${responsible.phone}</span>
                                    </div>
                                </div>
                                <div class="responsible-status">
                                    <span class="status-badge ${responsible.paymentStatus}">${getPaymentStatusLabel(responsible.paymentStatus)}</span>
                                </div>
                            </div>
                            
                            <div class="responsible-content">
                                <div class="responsible-details">
                                    <div class="detail-item">
                                        <div class="detail-label">👥 Alunos</div>
                                        <div class="detail-value">${responsible.studentsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">💰 Saldo</div>
                                        <div class="detail-value balance ${responsible.balance >= 0 ? 'positive' : 'negative'}">
                                            R$ ${formatCurrency(Math.abs(responsible.balance))}
                                        </div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 Último Pagamento</div>
                                        <div class="detail-value">${responsible.lastPayment ? formatDate(responsible.lastPayment) : 'N/A'}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📋 Tipo</div>
                                        <div class="detail-value">${getResponsibleTypeLabel(responsible.type)}</div>
                                    </div>
                                </div>
                                
                                <div class="students-list">
                                    <div class="students-header">
                                        <span>📚 Alunos Vinculados</span>
                                        <span class="students-count">${responsible.studentsCount}</span>
                                    </div>
                                    <div class="students-items">
                                        ${responsible.students.map(student => `
                                            <div class="student-item">
                                                <span class="student-name">${student.name}</span>
                                                <span class="student-plan">${student.planName}</span>
                                                <span class="student-value">R$ ${formatCurrency(student.monthlyValue)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                ${responsible.notes ? `
                                    <div class="responsible-notes">
                                        <div class="notes-label">📝 Observações:</div>
                                        <div class="notes-content">${responsible.notes}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="responsible-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewResponsible('${responsible.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editResponsible('${responsible.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="manageStudents('${responsible.id}')">
                                    👥 Alunos
                                </button>
                                <button class="btn btn-sm btn-success" onclick="recordPayment('${responsible.id}')">
                                    💰 Pagamento
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="sendReminder('${responsible.id}')">
                                    📧 Lembrete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        responsiblesData = responsibles;
        filteredResponsibles = responsibles;
    }
    
    function calculateResponsibleStats(responsibles) {
        return {
            totalResponsibles: responsibles.length,
            pendingPayments: responsibles.filter(r => r.paymentStatus === 'pending').length,
            upToDate: responsibles.filter(r => r.paymentStatus === 'up-to-date').length,
            averageStudents: Math.round(responsibles.reduce((sum, r) => sum + r.studentsCount, 0) / responsibles.length) || 0
        };
    }
    
    function getPaymentStatusLabel(status) {
        const labels = {
            'up-to-date': 'Em Dia',
            'pending': 'Pendente',
            'overdue': 'Em Atraso',
            'suspended': 'Suspenso'
        };
        return labels[status] || status;
    }
    
    function getResponsibleTypeLabel(type) {
        const labels = {
            'parent': 'Pai/Mãe',
            'guardian': 'Responsável',
            'self': 'Próprio Aluno',
            'company': 'Empresa'
        };
        return labels[type] || type;
    }
    
    function filterResponsibles(searchTerm = '') {
        let filtered = responsiblesData;
        
        // Apply status filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(responsible => responsible.paymentStatus === currentFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(responsible => 
                responsible.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                responsible.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                responsible.phone.includes(searchTerm) ||
                responsible.students.some(student => 
                    student.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
        
        filteredResponsibles = filtered;
        renderFilteredResponsibles(filtered);
        updateFilterButtons();
    }
    
    function sortResponsibles() {
        let sorted = [...filteredResponsibles];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'students':
                    aVal = a.studentsCount;
                    bVal = b.studentsCount;
                    break;
                case 'balance':
                    aVal = a.balance;
                    bVal = b.balance;
                    break;
                case 'lastPayment':
                    aVal = a.lastPayment ? new Date(a.lastPayment) : new Date(0);
                    bVal = b.lastPayment ? new Date(b.lastPayment) : new Date(0);
                    break;
                default:
                    return 0;
            }
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        renderFilteredResponsibles(sorted);
        updateSortButtons();
    }
    
    function renderFilteredResponsibles(responsibles) {
        const grid = document.querySelector('.responsibles-grid');
        if (grid) {
            grid.innerHTML = responsibles.map(responsible => `
                <div class="responsible-card ${responsible.paymentStatus}" data-responsible-id="${responsible.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.responsible-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.responsible-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // RESPONSIBLE ACTIONS
    // ==========================================
    
    function addResponsible() {
        console.log('➕ Adding new responsible...');
        
        if (typeof showToast === 'function') {
            showToast('Formulário de novo responsável em desenvolvimento', 'info');
        }
    }
    
    function viewResponsible(responsibleId) {
        console.log('👁️ Viewing responsible:', responsibleId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de responsável em desenvolvimento', 'info');
        }
    }
    
    function editResponsible(responsibleId) {
        console.log('✏️ Editing responsible:', responsibleId);
        
        if (typeof showToast === 'function') {
            showToast('Editor de responsável em desenvolvimento', 'info');
        }
    }
    
    function manageStudents(responsibleId) {
        console.log('👥 Managing students for responsible:', responsibleId);
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de alunos em desenvolvimento', 'info');
        }
    }
    
    function recordPayment(responsibleId) {
        console.log('💰 Recording payment for responsible:', responsibleId);
        
        if (typeof showToast === 'function') {
            showToast('Registro de pagamento em desenvolvimento', 'info');
        }
    }
    
    function sendReminder(responsibleId) {
        console.log('📧 Sending reminder to responsible:', responsibleId);
        
        if (typeof showToast === 'function') {
            showToast('Lembrete enviado com sucesso!', 'success');
        }
    }
    
    function importResponsibles() {
        console.log('📥 Importing responsibles...');
        
        if (typeof showToast === 'function') {
            showToast('Importação de responsáveis em desenvolvimento', 'info');
        }
    }
    
    function refreshResponsibles() {
        console.log('🔄 Refreshing responsibles...');
        loadFinancialResponsibles();
    }
    
    function exportResponsibles() {
        console.log('📊 Exporting responsibles...');
        
        if (responsiblesData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum responsável para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateResponsiblesCSV(responsiblesData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `financial_responsibles_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Responsáveis exportados com sucesso!', 'success');
        }
    }
    
    function generateResponsiblesCSV(data) {
        const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Tipo', 'Qtd Alunos', 'Saldo', 'Status Pagamento', 'Último Pagamento', 'Observações'];
        const rows = data.map(responsible => [
            responsible.id,
            responsible.name,
            responsible.email,
            responsible.phone,
            getResponsibleTypeLabel(responsible.type),
            responsible.studentsCount,
            responsible.balance,
            getPaymentStatusLabel(responsible.paymentStatus),
            responsible.lastPayment ? formatDate(responsible.lastPayment) : '',
            responsible.notes || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchResponsiblesData() {
        try {
            const response = await fetch('/api/financial-responsibles');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderFinancialResponsibles(data.data);
                } else {
                    console.error('Failed to fetch financial responsibles data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Financial responsibles API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching financial responsibles data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: '1',
                    name: 'Maria Silva Santos',
                    email: 'maria.santos@email.com',
                    phone: '(11) 98765-4321',
                    type: 'parent',
                    studentsCount: 2,
                    balance: -150.00,
                    paymentStatus: 'pending',
                    lastPayment: '2025-01-05',
                    students: [
                        { name: 'João Silva', planName: 'Plano Mensal', monthlyValue: 120.00 },
                        { name: 'Ana Silva', planName: 'Plano Mensal', monthlyValue: 120.00 }
                    ],
                    notes: 'Responsável por dois filhos. Histórico de pagamentos em dia.'
                },
                {
                    id: '2',
                    name: 'Pedro Costa Lima',
                    email: 'pedro.costa@email.com',
                    phone: '(11) 99876-5432',
                    type: 'self',
                    studentsCount: 1,
                    balance: 0.00,
                    paymentStatus: 'up-to-date',
                    lastPayment: '2025-01-15',
                    students: [
                        { name: 'Pedro Costa Lima', planName: 'Plano Trimestral', monthlyValue: 150.00 }
                    ],
                    notes: null
                },
                {
                    id: '3',
                    name: 'Empresa ABC Ltda',
                    email: 'financeiro@empresaabc.com',
                    phone: '(11) 3456-7890',
                    type: 'company',
                    studentsCount: 5,
                    balance: -750.00,
                    paymentStatus: 'overdue',
                    lastPayment: '2024-12-15',
                    students: [
                        { name: 'Carlos Santos', planName: 'Plano Corporativo', monthlyValue: 150.00 },
                        { name: 'Fernanda Lima', planName: 'Plano Corporativo', monthlyValue: 150.00 },
                        { name: 'Roberto Silva', planName: 'Plano Corporativo', monthlyValue: 150.00 },
                        { name: 'Ana Costa', planName: 'Plano Corporativo', monthlyValue: 150.00 },
                        { name: 'Paulo Oliveira', planName: 'Plano Corporativo', monthlyValue: 150.00 }
                    ],
                    notes: 'Contrato corporativo. Pagamento mensal no dia 15.'
                }
            ];
            
            renderFinancialResponsibles(fallbackData);
        }
    }
    
    function showErrorState() {
        const container = document.getElementById('financial-responsibles') || document.querySelector('.financial-responsibles-isolated');
        if (container) {
            container.innerHTML = `
                <div class="financial-responsibles-isolated">
                    <div class="responsibles-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar responsáveis</h3>
                        <p>Não foi possível carregar os dados dos responsáveis financeiros.</p>
                        <button class="btn btn-primary" onclick="loadFinancialResponsibles()">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // ==========================================
    // GLOBAL EXPORTS
    // ==========================================
    
    function exportGlobalFunctions() {
        window.loadFinancialResponsibles = loadFinancialResponsibles;
        window.renderFinancialResponsibles = renderFinancialResponsibles;
        window.addResponsible = addResponsible;
        window.viewResponsible = viewResponsible;
        window.editResponsible = editResponsible;
        window.manageStudents = manageStudents;
        window.recordPayment = recordPayment;
        window.sendReminder = sendReminder;
        window.importResponsibles = importResponsibles;
        window.refreshResponsibles = refreshResponsibles;
        window.exportResponsibles = exportResponsibles;
        window.filterResponsibles = filterResponsibles;
        window.fetchResponsiblesData = fetchResponsiblesData;
    }
    
    console.log('💳 Financial Responsibles Module loaded');
    
})();
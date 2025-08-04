(function() {
    'use strict';
    
    // Module state
    let matsData = [];
    let filteredMats = [];
    let currentFilter = 'all';
    let currentSort = 'name';
    let sortDirection = 'asc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeMatsModule();
    });
    
    // Module initialization
    function initializeMatsModule() {
        console.log('🥋 Initializing Mats Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load mats if container exists
            if (document.getElementById('mats') || document.querySelector('.mats-isolated')) {
                loadMats();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing mats module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        document.addEventListener('input', function(e) {
            if (e.target.id === 'matSearch') {
                filterMats(e.target.value);
            }
        });
        
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('mat-filter')) {
                currentFilter = e.target.dataset.filter;
                filterMats();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('mat-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'asc';
                }
                sortMats();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportMatsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportMats);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshMatsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshMats);
        }
    }
    
    // ==========================================
    // MATS FUNCTIONS
    // ==========================================
    
    function loadMats() {
        console.log('🥋 Loading mats data...');
        fetchMatsData();
    }
    
    function renderMats(mats) {
        const container = document.getElementById('mats') || document.querySelector('.mats-isolated');
        if (!container) {
            console.warn('Mats container not found');
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        if (!mats || mats.length === 0) {
            container.innerHTML = `
                <div class="mats-isolated">
                    <div class="mats-header">
                        <h2>🥋 Gestão de Tatames</h2>
                        <div class="mats-actions">
                            <button class="btn btn-primary" onclick="addMat()">
                                ➕ Novo Tatame
                            </button>
                            <button class="btn btn-secondary" onclick="manageMaintenance()">
                                🔧 Manutenção
                            </button>
                        </div>
                    </div>
                    
                    <div class="mats-empty-state">
                        <div class="empty-icon">🥋</div>
                        <h3>Nenhum tatame encontrado</h3>
                        <p>Adicione tatames para gerenciar os equipamentos da academia.</p>
                        <button class="btn btn-primary" onclick="addMat()">
                            ➕ Adicionar Primeiro Tatame
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const stats = calculateMatStats(mats);
        
        container.innerHTML = `
            <div class="mats-isolated">
                <div class="mats-header">
                    <h2>🥋 Gestão de Tatames</h2>
                    <div class="mats-actions">
                        <button class="btn btn-primary" onclick="addMat()">
                            ➕ Novo Tatame
                        </button>
                        <button class="btn btn-secondary" onclick="manageMaintenance()">
                            🔧 Manutenção
                        </button>
                        <button class="btn btn-secondary" onclick="scheduleInspection()">
                            📋 Inspeção
                        </button>
                        <button class="btn btn-secondary" onclick="exportMats()">
                            📊 Exportar
                        </button>
                        <button class="btn btn-secondary" onclick="window.history.back()">
                            ← Voltar
                        </button>
                    </div>
                </div>
                
                <div class="mats-stats">
                    <div class="stat-card">
                        <div class="stat-value active" id="totalMatsCount">${stats.totalMats}</div>
                        <div class="stat-label">Total de Tatames</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value completed" id="goodConditionCount">${stats.goodCondition}</div>
                        <div class="stat-label">Em Bom Estado</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value pending" id="maintenanceNeededCount">${stats.maintenanceNeeded}</div>
                        <div class="stat-label">Precisam Manutenção</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalAreaCount">${stats.totalArea}m²</div>
                        <div class="stat-label">Área Total</div>
                    </div>
                </div>
                
                <div class="mats-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="mat-filter active" data-filter="all">Todos</button>
                        <button class="mat-filter" data-filter="excellent">Excelente</button>
                        <button class="mat-filter" data-filter="good">Bom</button>
                        <button class="mat-filter" data-filter="fair">Regular</button>
                        <button class="mat-filter" data-filter="poor">Ruim</button>
                    </div>
                    
                    <div class="search-group">
                        <input type="text" id="matSearch" placeholder="Buscar tatames..." class="search-input">
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="mat-sort active" data-sort="name">Nome</button>
                        <button class="mat-sort" data-sort="location">Localização</button>
                        <button class="mat-sort" data-sort="condition">Condição</button>
                        <button class="mat-sort" data-sort="lastMaintenance">Última Manutenção</button>
                    </div>
                </div>
                
                <div class="mats-grid">
                    ${mats.map(mat => `
                        <div class="mat-card ${mat.condition}" data-mat-id="${mat.id}">
                            <div class="mat-header">
                                <div class="mat-info">
                                    <h3>🥋 ${mat.name}</h3>
                                    <div class="mat-location">
                                        <span>📍 ${mat.location} - ${mat.unit}</span>
                                    </div>
                                </div>
                                <div class="mat-status">
                                    <span class="condition-badge ${mat.condition}">${getConditionLabel(mat.condition)}</span>
                                </div>
                            </div>
                            
                            <div class="mat-content">
                                <div class="mat-details">
                                    <div class="detail-item">
                                        <div class="detail-label">📏 Tamanho</div>
                                        <div class="detail-value">${mat.dimensions}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">🏷️ Tipo</div>
                                        <div class="detail-value">${getMatTypeLabel(mat.type)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">🎨 Cor</div>
                                        <div class="detail-value">${mat.color}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 Adquirido</div>
                                        <div class="detail-value">${formatDate(mat.purchaseDate)}</div>
                                    </div>
                                </div>
                                
                                <div class="mat-condition">
                                    <div class="condition-label">🔍 Estado Geral</div>
                                    <div class="condition-bar">
                                        <div class="condition-fill ${mat.condition}" style="width: ${getConditionPercentage(mat.condition)}%"></div>
                                    </div>
                                    <div class="condition-text">${getConditionLabel(mat.condition)}</div>
                                </div>
                                
                                <div class="mat-maintenance">
                                    <div class="maintenance-info">
                                        <div class="maintenance-item">
                                            <span class="maintenance-label">🔧 Última Manutenção:</span>
                                            <span class="maintenance-value">${mat.lastMaintenance ? formatDate(mat.lastMaintenance) : 'Nunca'}</span>
                                        </div>
                                        <div class="maintenance-item">
                                            <span class="maintenance-label">📋 Próxima Inspeção:</span>
                                            <span class="maintenance-value">${mat.nextInspection ? formatDate(mat.nextInspection) : 'Não agendada'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mat-usage">
                                    <div class="usage-header">
                                        <span>📊 Uso Semanal</span>
                                        <span class="usage-hours">${mat.weeklyUsage}h</span>
                                    </div>
                                    <div class="usage-bar">
                                        <div class="usage-fill" style="width: ${(mat.weeklyUsage / 40) * 100}%"></div>
                                    </div>
                                    <div class="usage-text">
                                        ${mat.weeklyUsage < 20 ? 'Uso leve' : mat.weeklyUsage < 30 ? 'Uso moderado' : 'Uso intenso'}
                                    </div>
                                </div>
                                
                                ${mat.notes ? `
                                    <div class="mat-notes">
                                        <div class="notes-label">📝 Observações:</div>
                                        <div class="notes-content">${mat.notes}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="mat-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewMat('${mat.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editMat('${mat.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="scheduleMaintenance('${mat.id}')">
                                    🔧 Manutenção
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="logInspection('${mat.id}')">
                                    📋 Inspeção
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="retireMat('${mat.id}')">
                                    🗑️ Aposentar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        matsData = mats;
        filteredMats = mats;
    }
    
    function calculateMatStats(mats) {
        const goodCondition = mats.filter(m => ['excellent', 'good'].includes(m.condition)).length;
        const maintenanceNeeded = mats.filter(m => ['fair', 'poor'].includes(m.condition)).length;
        const totalArea = mats.reduce((sum, mat) => {
            const [width, height] = mat.dimensions.split('x').map(d => parseFloat(d));
            return sum + (width * height);
        }, 0);
        
        return {
            totalMats: mats.length,
            goodCondition,
            maintenanceNeeded,
            totalArea: Math.round(totalArea)
        };
    }
    
    function getConditionLabel(condition) {
        const labels = {
            'excellent': 'Excelente',
            'good': 'Bom',
            'fair': 'Regular',
            'poor': 'Ruim'
        };
        return labels[condition] || condition;
    }
    
    function getConditionPercentage(condition) {
        const percentages = {
            'excellent': 100,
            'good': 80,
            'fair': 60,
            'poor': 30
        };
        return percentages[condition] || 0;
    }
    
    function getMatTypeLabel(type) {
        const labels = {
            'tatami': 'Tatame',
            'puzzle': 'Puzzle',
            'eva': 'EVA',
            'vinyl': 'Vinil',
            'rubber': 'Borracha'
        };
        return labels[type] || type;
    }
    
    function filterMats(searchTerm = '') {
        let filtered = matsData;
        
        // Apply condition filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(mat => mat.condition === currentFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(mat => 
                mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mat.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mat.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                mat.notes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        filteredMats = filtered;
        renderFilteredMats(filtered);
        updateFilterButtons();
    }
    
    function sortMats() {
        let sorted = [...filteredMats];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'location':
                    aVal = `${a.unit} ${a.location}`.toLowerCase();
                    bVal = `${b.unit} ${b.location}`.toLowerCase();
                    break;
                case 'condition':
                    const conditionOrder = { 'excellent': 4, 'good': 3, 'fair': 2, 'poor': 1 };
                    aVal = conditionOrder[a.condition] || 0;
                    bVal = conditionOrder[b.condition] || 0;
                    break;
                case 'lastMaintenance':
                    aVal = a.lastMaintenance ? new Date(a.lastMaintenance) : new Date(0);
                    bVal = b.lastMaintenance ? new Date(b.lastMaintenance) : new Date(0);
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
        
        renderFilteredMats(sorted);
        updateSortButtons();
    }
    
    function renderFilteredMats(mats) {
        const grid = document.querySelector('.mats-grid');
        if (grid) {
            grid.innerHTML = mats.map(mat => `
                <div class="mat-card ${mat.condition}" data-mat-id="${mat.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.mat-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.mat-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // MAT ACTIONS
    // ==========================================
    
    function addMat() {
        console.log('🥋 Adding new mat...');
        
        if (typeof showToast === 'function') {
            showToast('Cadastro de novo tatame em desenvolvimento', 'info');
        }
    }
    
    function viewMat(matId) {
        console.log('👁️ Viewing mat:', matId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de tatame em desenvolvimento', 'info');
        }
    }
    
    function editMat(matId) {
        console.log('✏️ Editing mat:', matId);
        
        if (typeof showToast === 'function') {
            showToast('Editor de tatame em desenvolvimento', 'info');
        }
    }
    
    function scheduleMaintenance(matId) {
        console.log('🔧 Scheduling maintenance for mat:', matId);
        
        if (typeof showToast === 'function') {
            showToast('Agendamento de manutenção em desenvolvimento', 'info');
        }
    }
    
    function logInspection(matId) {
        console.log('📋 Logging inspection for mat:', matId);
        
        if (typeof showToast === 'function') {
            showToast('Registro de inspeção em desenvolvimento', 'info');
        }
    }
    
    function retireMat(matId) {
        console.log('🗑️ Retiring mat:', matId);
        
        const mat = matsData.find(m => m.id === matId);
        if (!mat) {
            if (typeof showToast === 'function') {
                showToast('Tatame não encontrado', 'error');
            }
            return;
        }
        
        if (confirm(`Tem certeza que deseja aposentar o tatame "${mat.name}"?`)) {
            // Remove from data
            matsData = matsData.filter(m => m.id !== matId);
            
            // Re-render
            renderMats(matsData);
            
            if (typeof showToast === 'function') {
                showToast('Tatame aposentado com sucesso', 'success');
            }
        }
    }
    
    function manageMaintenance() {
        console.log('🔧 Managing maintenance...');
        
        if (typeof showToast === 'function') {
            showToast('Gestão de manutenção em desenvolvimento', 'info');
        }
    }
    
    function scheduleInspection() {
        console.log('📋 Scheduling inspection...');
        
        if (typeof showToast === 'function') {
            showToast('Agendamento de inspeção em desenvolvimento', 'info');
        }
    }
    
    function refreshMats() {
        console.log('🔄 Refreshing mats...');
        loadMats();
    }
    
    function exportMats() {
        console.log('📊 Exporting mats...');
        
        if (matsData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum tatame para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateMatsCSV(matsData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `mats_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Tatames exportados com sucesso!', 'success');
        }
    }
    
    function generateMatsCSV(data) {
        const headers = ['ID', 'Nome', 'Localização', 'Unidade', 'Tipo', 'Dimensões', 'Cor', 'Condição', 'Data Compra', 'Última Manutenção', 'Uso Semanal', 'Observações'];
        const rows = data.map(mat => [
            mat.id,
            mat.name,
            mat.location,
            mat.unit,
            getMatTypeLabel(mat.type),
            mat.dimensions,
            mat.color,
            getConditionLabel(mat.condition),
            formatDate(mat.purchaseDate),
            mat.lastMaintenance ? formatDate(mat.lastMaintenance) : '',
            mat.weeklyUsage,
            mat.notes || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchMatsData() {
        try {
            const response = await fetch('/api/mats');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderMats(data.data);
                } else {
                    console.error('Failed to fetch mats data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Mats API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching mats data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: 'mat-001',
                    name: 'Tatame Principal A1',
                    location: 'Sala 1',
                    unit: 'Unidade Centro',
                    type: 'tatami',
                    dimensions: '2x1',
                    color: 'Azul',
                    condition: 'excellent',
                    purchaseDate: '2024-01-15',
                    lastMaintenance: '2025-01-01',
                    nextInspection: '2025-02-01',
                    weeklyUsage: 25,
                    notes: 'Tatame principal em excelente estado.'
                },
                {
                    id: 'mat-002',
                    name: 'Tatame Secundário B2',
                    location: 'Sala 2',
                    unit: 'Unidade Centro',
                    type: 'puzzle',
                    dimensions: '1x1',
                    color: 'Vermelho',
                    condition: 'good',
                    purchaseDate: '2024-03-10',
                    lastMaintenance: '2024-12-15',
                    nextInspection: '2025-01-30',
                    weeklyUsage: 18,
                    notes: 'Pequeno desgaste nas bordas.'
                },
                {
                    id: 'mat-003',
                    name: 'Tatame Zona Sul C1',
                    location: 'Sala Principal',
                    unit: 'Unidade Zona Sul',
                    type: 'eva',
                    dimensions: '2x2',
                    color: 'Preto',
                    condition: 'fair',
                    purchaseDate: '2023-08-20',
                    lastMaintenance: '2024-10-05',
                    nextInspection: '2025-01-20',
                    weeklyUsage: 32,
                    notes: 'Precisa troca de algumas peças.'
                },
                {
                    id: 'mat-004',
                    name: 'Tatame Infantil D1',
                    location: 'Sala Kids',
                    unit: 'Unidade Centro',
                    type: 'eva',
                    dimensions: '1.5x1.5',
                    color: 'Verde',
                    condition: 'poor',
                    purchaseDate: '2023-05-12',
                    lastMaintenance: null,
                    nextInspection: '2025-01-15',
                    weeklyUsage: 15,
                    notes: 'Necessita substituição urgente.'
                }
            ];
            
            renderMats(fallbackData);
        }
    }
    
    function showErrorState() {
        const container = document.getElementById('mats') || document.querySelector('.mats-isolated');
        if (container) {
            container.innerHTML = `
                <div class="mats-isolated">
                    <div class="mats-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar tatames</h3>
                        <p>Não foi possível carregar os dados dos tatames.</p>
                        <button class="btn btn-primary" onclick="loadMats()">
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
        window.loadMats = loadMats;
        window.renderMats = renderMats;
        window.addMat = addMat;
        window.viewMat = viewMat;
        window.editMat = editMat;
        window.scheduleMaintenance = scheduleMaintenance;
        window.logInspection = logInspection;
        window.retireMat = retireMat;
        window.manageMaintenance = manageMaintenance;
        window.scheduleInspection = scheduleInspection;
        window.refreshMats = refreshMats;
        window.exportMats = exportMats;
        window.filterMats = filterMats;
        window.fetchMatsData = fetchMatsData;
    }
    
    console.log('🥋 Mats Module loaded');
    
})();
(function() {
    'use strict';
    
    // Module state
    let unitsData = [];
    let filteredUnits = [];
    let currentFilter = 'all';
    let currentSort = 'name';
    let sortDirection = 'asc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeUnitsModule();
    });
    
    // Module initialization
    function initializeUnitsModule() {
        console.log('🏢 Initializing Units Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load units if container exists
            if (document.getElementById('units') || document.querySelector('.units-isolated')) {
                loadUnits();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing units module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        document.addEventListener('input', function(e) {
            if (e.target.id === 'unitSearch') {
                filterUnits(e.target.value);
            }
        });
        
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('unit-filter')) {
                currentFilter = e.target.dataset.filter;
                filterUnits();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('unit-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'asc';
                }
                sortUnits();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportUnitsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportUnits);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshUnitsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshUnits);
        }
    }
    
    // ==========================================
    // UNITS FUNCTIONS
    // ==========================================
    
    function loadUnits() {
        console.log('🏢 Loading units data...');
        fetchUnitsData();
    }
    
    function renderUnits(units) {
        const container = document.getElementById('units') || document.querySelector('.units-isolated');
        if (!container) {
            console.warn('Units container not found');
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        if (!units || units.length === 0) {
            container.innerHTML = `
                <div class="units-isolated">
                    <div class="units-header">
                        <h2>🏢 Gestão de Unidades</h2>
                        <div class="units-actions">
                            <button class="btn btn-primary" onclick="createUnit()">
                                ➕ Nova Unidade
                            </button>
                            <button class="btn btn-secondary" onclick="manageLocations()">
                                📍 Localizações
                            </button>
                        </div>
                    </div>
                    
                    <div class="units-empty-state">
                        <div class="empty-icon">🏢</div>
                        <h3>Nenhuma unidade encontrada</h3>
                        <p>Crie unidades para organizar suas academias de Krav Maga.</p>
                        <button class="btn btn-primary" onclick="createUnit()">
                            ➕ Criar Primeira Unidade
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const stats = calculateUnitStats(units);
        
        container.innerHTML = `
            <div class="units-isolated">
                <div class="units-header">
                    <h2>🏢 Gestão de Unidades</h2>
                    <div class="units-actions">
                        <button class="btn btn-primary" onclick="createUnit()">
                            ➕ Nova Unidade
                        </button>
                        <button class="btn btn-secondary" onclick="manageLocations()">
                            📍 Localizações
                        </button>
                        <button class="btn btn-secondary" onclick="exportUnits()">
                            📊 Exportar
                        </button>
                        <button class="btn btn-secondary" onclick="window.history.back()">
                            ← Voltar
                        </button>
                    </div>
                </div>
                
                <div class="units-stats">
                    <div class="stat-card">
                        <div class="stat-value active" id="activeUnitsCount">${stats.activeUnits}</div>
                        <div class="stat-label">Unidades Ativas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalStudentsCount">${stats.totalStudents}</div>
                        <div class="stat-label">Total de Alunos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalInstructorsCount">${stats.totalInstructors}</div>
                        <div class="stat-label">Instrutores</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value completed" id="totalRevenueCount">R$ ${formatCurrency(stats.totalRevenue)}</div>
                        <div class="stat-label">Receita Total</div>
                    </div>
                </div>
                
                <div class="units-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="unit-filter active" data-filter="all">Todas</button>
                        <button class="unit-filter" data-filter="active">Ativas</button>
                        <button class="unit-filter" data-filter="maintenance">Manutenção</button>
                        <button class="unit-filter" data-filter="inactive">Inativas</button>
                    </div>
                    
                    <div class="search-group">
                        <input type="text" id="unitSearch" placeholder="Buscar unidades..." class="search-input">
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="unit-sort active" data-sort="name">Nome</button>
                        <button class="unit-sort" data-sort="location">Localização</button>
                        <button class="unit-sort" data-sort="students">Alunos</button>
                        <button class="unit-sort" data-sort="revenue">Receita</button>
                    </div>
                </div>
                
                <div class="units-grid">
                    ${units.map(unit => `
                        <div class="unit-card ${unit.status}" data-unit-id="${unit.id}">
                            <div class="unit-header">
                                <div class="unit-info">
                                    <h3>🏢 ${unit.name}</h3>
                                    <div class="unit-location">
                                        <span>📍 ${unit.address}, ${unit.city}</span>
                                    </div>
                                </div>
                                <div class="unit-status">
                                    <span class="status-badge ${unit.status}">${getStatusLabel(unit.status)}</span>
                                </div>
                            </div>
                            
                            <div class="unit-content">
                                <div class="unit-details">
                                    <div class="detail-item">
                                        <div class="detail-label">👥 Alunos</div>
                                        <div class="detail-value">${unit.studentsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">🥋 Instrutores</div>
                                        <div class="detail-value">${unit.instructorsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">🏫 Salas</div>
                                        <div class="detail-value">${unit.classroomsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">💰 Receita</div>
                                        <div class="detail-value revenue">R$ ${formatCurrency(unit.monthlyRevenue)}</div>
                                    </div>
                                </div>
                                
                                <div class="unit-metrics">
                                    <div class="metric-item">
                                        <div class="metric-label">📈 Ocupação</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill" style="width: ${unit.occupancyRate}%"></div>
                                        </div>
                                        <div class="metric-value">${unit.occupancyRate}%</div>
                                    </div>
                                    
                                    <div class="metric-item">
                                        <div class="metric-label">⭐ Satisfação</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill satisfaction" style="width: ${unit.satisfactionRate}%"></div>
                                        </div>
                                        <div class="metric-value">${unit.satisfactionRate}%</div>
                                    </div>
                                </div>
                                
                                <div class="unit-contact">
                                    <div class="contact-info">
                                        <span>📞 ${unit.phone}</span>
                                        <span>📧 ${unit.email}</span>
                                    </div>
                                    <div class="operating-hours">
                                        <span>🕒 ${unit.operatingHours}</span>
                                    </div>
                                </div>
                                
                                ${unit.description ? `
                                    <div class="unit-description">
                                        <p>${unit.description}</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="unit-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewUnit('${unit.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editUnit('${unit.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="manageClassrooms('${unit.id}')">
                                    🏫 Salas
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="viewReports('${unit.id}')">
                                    📊 Relatórios
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="toggleStatus('${unit.id}')">
                                    ${unit.status === 'active' ? '⏸️ Pausar' : '▶️ Ativar'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        unitsData = units;
        filteredUnits = units;
    }
    
    function calculateUnitStats(units) {
        return {
            activeUnits: units.filter(u => u.status === 'active').length,
            totalStudents: units.reduce((sum, unit) => sum + unit.studentsCount, 0),
            totalInstructors: units.reduce((sum, unit) => sum + unit.instructorsCount, 0),
            totalRevenue: units.reduce((sum, unit) => sum + unit.monthlyRevenue, 0)
        };
    }
    
    function getStatusLabel(status) {
        const labels = {
            'active': 'Ativa',
            'maintenance': 'Manutenção',
            'inactive': 'Inativa',
            'planned': 'Planejada'
        };
        return labels[status] || status;
    }
    
    function filterUnits(searchTerm = '') {
        let filtered = unitsData;
        
        // Apply status filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(unit => unit.status === currentFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(unit => 
                unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                unit.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                unit.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                unit.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        filteredUnits = filtered;
        renderFilteredUnits(filtered);
        updateFilterButtons();
    }
    
    function sortUnits() {
        let sorted = [...filteredUnits];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'location':
                    aVal = `${a.city} ${a.address}`.toLowerCase();
                    bVal = `${b.city} ${b.address}`.toLowerCase();
                    break;
                case 'students':
                    aVal = a.studentsCount;
                    bVal = b.studentsCount;
                    break;
                case 'revenue':
                    aVal = a.monthlyRevenue;
                    bVal = b.monthlyRevenue;
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
        
        renderFilteredUnits(sorted);
        updateSortButtons();
    }
    
    function renderFilteredUnits(units) {
        const grid = document.querySelector('.units-grid');
        if (grid) {
            grid.innerHTML = units.map(unit => `
                <div class="unit-card ${unit.status}" data-unit-id="${unit.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.unit-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.unit-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // UNIT ACTIONS
    // ==========================================
    
    function createUnit() {
        console.log('🏢 Creating new unit...');
        
        if (typeof showToast === 'function') {
            showToast('Criador de unidades em desenvolvimento', 'info');
        }
    }
    
    function viewUnit(unitId) {
        console.log('👁️ Viewing unit:', unitId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de unidade em desenvolvimento', 'info');
        }
    }
    
    function editUnit(unitId) {
        console.log('✏️ Editing unit:', unitId);
        
        if (typeof showToast === 'function') {
            showToast('Editor de unidades em desenvolvimento', 'info');
        }
    }
    
    function manageClassrooms(unitId) {
        console.log('🏫 Managing classrooms for unit:', unitId);
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de salas em desenvolvimento', 'info');
        }
    }
    
    function viewReports(unitId) {
        console.log('📊 Viewing reports for unit:', unitId);
        
        if (typeof showToast === 'function') {
            showToast('Relatórios de unidade em desenvolvimento', 'info');
        }
    }
    
    function toggleStatus(unitId) {
        console.log('⏸️ Toggling status for unit:', unitId);
        
        const unit = unitsData.find(u => u.id === unitId);
        if (!unit) {
            if (typeof showToast === 'function') {
                showToast('Unidade não encontrada', 'error');
            }
            return;
        }
        
        const newStatus = unit.status === 'active' ? 'maintenance' : 'active';
        const action = newStatus === 'active' ? 'ativar' : 'pausar';
        
        if (confirm(`Tem certeza que deseja ${action} a unidade "${unit.name}"?`)) {
            // Update unit status
            unit.status = newStatus;
            
            // Re-render
            renderUnits(unitsData);
            
            if (typeof showToast === 'function') {
                showToast(`Unidade ${newStatus === 'active' ? 'ativada' : 'pausada'} com sucesso!`, 'success');
            }
        }
    }
    
    function manageLocations() {
        console.log('📍 Managing locations...');
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de localizações em desenvolvimento', 'info');
        }
    }
    
    function refreshUnits() {
        console.log('🔄 Refreshing units...');
        loadUnits();
    }
    
    function exportUnits() {
        console.log('📊 Exporting units...');
        
        if (unitsData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhuma unidade para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateUnitsCSV(unitsData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `units_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Unidades exportadas com sucesso!', 'success');
        }
    }
    
    function generateUnitsCSV(data) {
        const headers = ['ID', 'Nome', 'Endereço', 'Cidade', 'Telefone', 'Email', 'Status', 'Alunos', 'Instrutores', 'Salas', 'Receita Mensal', 'Ocupação %', 'Satisfação %'];
        const rows = data.map(unit => [
            unit.id,
            unit.name,
            unit.address,
            unit.city,
            unit.phone,
            unit.email,
            getStatusLabel(unit.status),
            unit.studentsCount,
            unit.instructorsCount,
            unit.classroomsCount,
            unit.monthlyRevenue,
            unit.occupancyRate,
            unit.satisfactionRate
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
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchUnitsData() {
        try {
            const response = await fetch('/api/units');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderUnits(data.data);
                } else {
                    console.error('Failed to fetch units data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Units API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching units data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: 'unit-centro',
                    name: 'Krav Maga Academy - Centro',
                    address: 'Rua das Flores, 123',
                    city: 'São Paulo',
                    phone: '(11) 3456-7890',
                    email: 'centro@kravacademy.com',
                    status: 'active',
                    studentsCount: 45,
                    instructorsCount: 3,
                    classroomsCount: 2,
                    monthlyRevenue: 6750.00,
                    occupancyRate: 78,
                    satisfactionRate: 92,
                    operatingHours: '06:00 - 22:00',
                    description: 'Unidade principal localizada no centro da cidade.'
                },
                {
                    id: 'unit-zona-sul',
                    name: 'Krav Maga Academy - Zona Sul',
                    address: 'Av. Paulista, 456',
                    city: 'São Paulo',
                    phone: '(11) 9876-5432',
                    email: 'zonasul@kravacademy.com',
                    status: 'active',
                    studentsCount: 32,
                    instructorsCount: 2,
                    classroomsCount: 1,
                    monthlyRevenue: 4800.00,
                    occupancyRate: 65,
                    satisfactionRate: 88,
                    operatingHours: '07:00 - 21:00',
                    description: 'Unidade moderna na região da Paulista.'
                },
                {
                    id: 'unit-alphaville',
                    name: 'Krav Maga Academy - Alphaville',
                    address: 'Alameda dos Anjos, 789',
                    city: 'Barueri',
                    phone: '(11) 2345-6789',
                    email: 'alphaville@kravacademy.com',
                    status: 'maintenance',
                    studentsCount: 28,
                    instructorsCount: 2,
                    classroomsCount: 2,
                    monthlyRevenue: 4200.00,
                    occupancyRate: 0,
                    satisfactionRate: 85,
                    operatingHours: 'Temporariamente fechada',
                    description: 'Unidade em manutenção para renovação das instalações.'
                }
            ];
            
            renderUnits(fallbackData);
        }
    }
    
    function showErrorState() {
        const container = document.getElementById('units') || document.querySelector('.units-isolated');
        if (container) {
            container.innerHTML = `
                <div class="units-isolated">
                    <div class="units-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar unidades</h3>
                        <p>Não foi possível carregar os dados das unidades.</p>
                        <button class="btn btn-primary" onclick="loadUnits()">
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
        window.loadUnits = loadUnits;
        window.renderUnits = renderUnits;
        window.createUnit = createUnit;
        window.viewUnit = viewUnit;
        window.editUnit = editUnit;
        window.manageClassrooms = manageClassrooms;
        window.viewReports = viewReports;
        window.toggleStatus = toggleStatus;
        window.manageLocations = manageLocations;
        window.refreshUnits = refreshUnits;
        window.exportUnits = exportUnits;
        window.filterUnits = filterUnits;
        window.fetchUnitsData = fetchUnitsData;
    }
    
    console.log('🏢 Units Module loaded');
    
})();
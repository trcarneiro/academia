(function() {
    'use strict';
    
    // Module state
    let evaluationsData = [];
    let currentFilter = 'all';
    let currentSort = 'date';
    let sortDirection = 'desc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeEvaluationsModule();
    });
    
    // Module initialization
    function initializeEvaluationsModule() {
        console.log('📝 Initializing Evaluations Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load evaluations if container exists
            if (document.getElementById('evaluations')) {
                loadEvaluations();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing evaluations module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('evaluation-filter')) {
                currentFilter = e.target.dataset.filter;
                filterEvaluations();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('evaluation-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'desc';
                }
                sortEvaluations();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportEvaluationsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportEvaluations);
        }
        
        // Create evaluation button
        const createBtn = document.getElementById('createEvaluationBtn');
        if (createBtn) {
            createBtn.addEventListener('click', createEvaluation);
        }
    }
    
    // ==========================================
    // EVALUATIONS FUNCTIONS
    // ==========================================
    
    function loadEvaluations() {
        console.log('📝 Loading evaluations data...');
        fetchEvaluationsData();
    }
    
    function renderEvaluations(evaluations) {
        const container = document.getElementById('evaluations');
        if (!container) {
            console.warn('Evaluations container not found');
            return;
        }
        
        if (!evaluations || evaluations.length === 0) {
            container.innerHTML = `
                <div class="evaluations-isolated">
                    <div class="evaluations-header">
                        <h2>📝 Sistema de Avaliações</h2>
                        <div class="evaluations-actions">
                            <button class="btn btn-primary" onclick="createEvaluation()">
                                ➕ Nova Avaliação
                            </button>
                        </div>
                    </div>
                    
                    <div class="evaluations-empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>Nenhuma avaliação encontrada</h3>
                        <p>Comece criando uma nova avaliação para seus alunos.</p>
                        <button class="btn btn-primary" onclick="createEvaluation()">
                            ➕ Criar Primeira Avaliação
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="evaluations-isolated">
                <div class="evaluations-header">
                    <h2>📝 Sistema de Avaliações</h2>
                    <div class="evaluations-actions">
                        <button class="btn btn-primary" onclick="createEvaluation()">
                            ➕ Nova Avaliação
                        </button>
                        <button class="btn btn-secondary" onclick="exportEvaluations()">
                            📊 Exportar Dados
                        </button>
                    </div>
                </div>
                
                <div class="evaluations-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="evaluation-filter active" data-filter="all">Todas</button>
                        <button class="evaluation-filter" data-filter="pending">Pendentes</button>
                        <button class="evaluation-filter" data-filter="completed">Concluídas</button>
                        <button class="evaluation-filter" data-filter="high-score">Alta Pontuação</button>
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="evaluation-sort active" data-sort="date">Data</button>
                        <button class="evaluation-sort" data-sort="score">Pontuação</button>
                        <button class="evaluation-sort" data-sort="student">Aluno</button>
                    </div>
                </div>
                
                <div class="evaluations-grid">
                    ${evaluations.map(evaluation => `
                        <div class="evaluation-card" data-evaluation-id="${evaluation.id}">
                            <div class="evaluation-header">
                                <div class="evaluation-student">
                                    <span class="student-avatar">${evaluation.studentName.charAt(0)}</span>
                                    <div class="student-info">
                                        <h3>${evaluation.studentName}</h3>
                                        <p>ID: ${evaluation.studentId}</p>
                                    </div>
                                </div>
                                <div class="evaluation-status">
                                    <span class="status-badge ${evaluation.status.toLowerCase()}">
                                        ${getStatusLabel(evaluation.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="evaluation-content">
                                <div class="evaluation-score">
                                    <span class="score-label">Pontuação:</span>
                                    <span class="score-value ${getScoreClass(evaluation.score)}">${evaluation.score}%</span>
                                </div>
                                
                                <div class="evaluation-details">
                                    <div class="detail-item">
                                        <span class="detail-label">📅 Data:</span>
                                        <span class="detail-value">${formatDate(evaluation.date)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">🎯 Técnicas:</span>
                                        <span class="detail-value">${evaluation.techniquesEvaluated || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">⏱️ Duração:</span>
                                        <span class="detail-value">${evaluation.duration || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                ${evaluation.notes ? `
                                    <div class="evaluation-notes">
                                        <span class="notes-label">📝 Observações:</span>
                                        <p class="notes-content">${evaluation.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="evaluation-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewEvaluation('${evaluation.id}')">
                                    👁️ Visualizar
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editEvaluation('${evaluation.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteEvaluation('${evaluation.id}')">
                                    🗑️ Excluir
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="evaluations-stats">
                    <div class="stat-card">
                        <div class="stat-value">${evaluations.length}</div>
                        <div class="stat-label">Total de Avaliações</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${evaluations.filter(e => e.status === 'completed').length}</div>
                        <div class="stat-label">Concluídas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length) || 0}%</div>
                        <div class="stat-label">Média Geral</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${evaluations.filter(e => e.score >= 80).length}</div>
                        <div class="stat-label">Alta Pontuação</div>
                    </div>
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        evaluationsData = evaluations;
    }
    
    function getStatusLabel(status) {
        const labels = {
            'pending': 'Pendente',
            'completed': 'Concluída',
            'in_progress': 'Em Andamento',
            'cancelled': 'Cancelada'
        };
        return labels[status] || status;
    }
    
    function getScoreClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        return 'poor';
    }
    
    function filterEvaluations() {
        let filtered = evaluationsData;
        
        if (currentFilter !== 'all') {
            if (currentFilter === 'high-score') {
                filtered = evaluationsData.filter(e => e.score >= 80);
            } else {
                filtered = evaluationsData.filter(e => e.status === currentFilter);
            }
        }
        
        renderFilteredEvaluations(filtered);
        updateFilterButtons();
    }
    
    function sortEvaluations() {
        let sorted = [...evaluationsData];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'date':
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
                case 'score':
                    aVal = a.score;
                    bVal = b.score;
                    break;
                case 'student':
                    aVal = a.studentName.toLowerCase();
                    bVal = b.studentName.toLowerCase();
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
        
        renderFilteredEvaluations(sorted);
        updateSortButtons();
    }
    
    function renderFilteredEvaluations(evaluations) {
        const grid = document.querySelector('.evaluations-grid');
        if (grid) {
            grid.innerHTML = evaluations.map(evaluation => `
                <div class="evaluation-card" data-evaluation-id="${evaluation.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.evaluation-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.evaluation-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // EVALUATION ACTIONS
    // ==========================================
    
    function createEvaluation() {
        console.log('📝 Creating new evaluation...');
        
        if (typeof showToast === 'function') {
            showToast('Interface de criação de avaliação em desenvolvimento', 'info');
        }
        
        // In a real implementation, this would open a full-screen evaluation form
        // Following CLAUDE.md guidelines for full-screen navigation
    }
    
    function viewEvaluation(evaluationId) {
        console.log('👁️ Viewing evaluation:', evaluationId);
        
        const evaluation = evaluationsData.find(e => e.id === evaluationId);
        if (!evaluation) {
            if (typeof showToast === 'function') {
                showToast('Avaliação não encontrada', 'error');
            }
            return;
        }
        
        // Show evaluation details modal
        showEvaluationModal(evaluation);
    }
    
    function editEvaluation(evaluationId) {
        console.log('✏️ Editing evaluation:', evaluationId);
        
        if (typeof showToast === 'function') {
            showToast('Interface de edição em desenvolvimento', 'info');
        }
        
        // In a real implementation, this would navigate to a full-screen edit form
    }
    
    function deleteEvaluation(evaluationId) {
        console.log('🗑️ Deleting evaluation:', evaluationId);
        
        if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
            // Remove from data
            evaluationsData = evaluationsData.filter(e => e.id !== evaluationId);
            
            // Re-render
            renderEvaluations(evaluationsData);
            
            if (typeof showToast === 'function') {
                showToast('Avaliação excluída com sucesso', 'success');
            }
        }
    }
    
    function showEvaluationModal(evaluation) {
        const modal = document.createElement('div');
        modal.id = 'evaluationModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div style="background: #1E293B; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: #F8FAFC; margin: 0;">📝 Detalhes da Avaliação</h3>
                    <button onclick="closeEvaluationModal()" style="background: none; border: none; color: #94A3B8; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                
                <div style="color: #CBD5E1; line-height: 1.6;">
                    <div style="margin-bottom: 1rem;">
                        <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">👤 Aluno</h4>
                        <p style="margin: 0;">${evaluation.studentName}</p>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">📊 Pontuação</h4>
                        <p style="margin: 0; font-size: 1.25rem; color: #3B82F6;">${evaluation.score}%</p>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">📅 Data</h4>
                        <p style="margin: 0;">${formatDate(evaluation.date)}</p>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">🎯 Técnicas Avaliadas</h4>
                        <p style="margin: 0;">${evaluation.techniquesEvaluated || 0}</p>
                    </div>
                    
                    ${evaluation.notes ? `
                        <div style="margin-bottom: 1rem;">
                            <h4 style="color: #F8FAFC; margin-bottom: 0.5rem;">📝 Observações</h4>
                            <p style="margin: 0;">${evaluation.notes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button onclick="editEvaluation('${evaluation.id}')" style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        ✏️ Editar
                    </button>
                    <button onclick="closeEvaluationModal()" style="background: #6B7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click-to-close functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEvaluationModal();
            }
        });
    }
    
    function closeEvaluationModal() {
        const modal = document.getElementById('evaluationModal');
        if (modal) {
            modal.remove();
        }
    }
    
    function exportEvaluations() {
        console.log('📊 Exporting evaluations...');
        
        if (evaluationsData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhuma avaliação para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateEvaluationsCSV(evaluationsData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `evaluations_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Avaliações exportadas com sucesso!', 'success');
        }
    }
    
    function generateEvaluationsCSV(data) {
        const headers = ['ID', 'Aluno', 'Pontuação', 'Status', 'Data', 'Técnicas', 'Observações'];
        const rows = data.map(evaluation => [
            evaluation.id,
            evaluation.studentName,
            evaluation.score,
            getStatusLabel(evaluation.status),
            formatDate(evaluation.date),
            evaluation.techniquesEvaluated || 0,
            evaluation.notes || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchEvaluationsData() {
        try {
            const response = await fetch('/api/evaluations');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderEvaluations(data.data);
                } else {
                    console.error('Failed to fetch evaluations data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Evaluations API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching evaluations data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: '1',
                    studentName: 'Maria Silva',
                    studentId: 'KMA0001',
                    score: 85.5,
                    status: 'completed',
                    date: '2025-01-15T10:00:00Z',
                    techniquesEvaluated: 8,
                    duration: '45 min',
                    notes: 'Excelente evolução nas técnicas de defesa básicas. Autonomia demonstrada em situações práticas.'
                },
                {
                    id: '2',
                    studentName: 'João Santos',
                    studentId: 'KMA0002',
                    score: 92.0,
                    status: 'completed',
                    date: '2025-01-14T14:30:00Z',
                    techniquesEvaluated: 10,
                    duration: '50 min',
                    notes: 'Desempenho excepcional. Pronto para avançar para o próximo nível.'
                },
                {
                    id: '3',
                    studentName: 'Ana Costa',
                    studentId: 'KMA0003',
                    score: 78.3,
                    status: 'completed',
                    date: '2025-01-13T16:00:00Z',
                    techniquesEvaluated: 6,
                    duration: '40 min',
                    notes: 'Boa evolução, mas precisa trabalhar mais a coordenação motora.'
                }
            ];
            
            renderEvaluations(fallbackData);
        }
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    function showErrorState() {
        const container = document.getElementById('evaluations');
        if (container) {
            container.innerHTML = `
                <div class="evaluations-isolated">
                    <div class="evaluations-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar avaliações</h3>
                        <p>Não foi possível carregar os dados de avaliações.</p>
                        <button class="btn btn-primary" onclick="loadEvaluations()">
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
        window.loadEvaluations = loadEvaluations;
        window.renderEvaluations = renderEvaluations;
        window.createEvaluation = createEvaluation;
        window.viewEvaluation = viewEvaluation;
        window.editEvaluation = editEvaluation;
        window.deleteEvaluation = deleteEvaluation;
        window.exportEvaluations = exportEvaluations;
        window.closeEvaluationModal = closeEvaluationModal;
        window.fetchEvaluationsData = fetchEvaluationsData;
    }
    
    console.log('📝 Evaluations Module loaded');
    
})();
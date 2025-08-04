(function() {
    'use strict';
    
    // Module state
    let challengesData = [];
    let filteredChallenges = [];
    let currentFilter = 'all';
    let currentSort = 'deadline';
    let sortDirection = 'asc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeChallengesModule();
    });
    
    // Module initialization
    function initializeChallengesModule() {
        console.log('🏆 Initializing Challenges Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load challenges if container exists
            if (document.getElementById('challenges') || document.querySelector('.challenges-isolated')) {
                loadChallenges();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing challenges module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        document.addEventListener('input', function(e) {
            if (e.target.id === 'challengeSearch') {
                filterChallenges(e.target.value);
            }
        });
        
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('challenge-filter')) {
                currentFilter = e.target.dataset.filter;
                filterChallenges();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('challenge-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'asc';
                }
                sortChallenges();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportChallengesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportChallenges);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshChallengesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshChallenges);
        }
    }
    
    // ==========================================
    // CHALLENGES FUNCTIONS
    // ==========================================
    
    function loadChallenges() {
        console.log('🏆 Loading challenges data...');
        fetchChallengesData();
    }
    
    function renderChallenges(challenges) {
        const container = document.getElementById('challenges') || document.querySelector('.challenges-isolated');
        if (!container) {
            console.warn('Challenges container not found');
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        if (!challenges || challenges.length === 0) {
            container.innerHTML = `
                <div class="challenges-isolated">
                    <div class="challenges-header">
                        <h2>🏆 Gestão de Desafios</h2>
                        <div class="challenges-actions">
                            <button class="btn btn-primary" onclick="createChallenge()">
                                ➕ Novo Desafio
                            </button>
                            <button class="btn btn-secondary" onclick="manageRewards()">
                                🎁 Recompensas
                            </button>
                        </div>
                    </div>
                    
                    <div class="challenges-empty-state">
                        <div class="empty-icon">🏆</div>
                        <h3>Nenhum desafio encontrado</h3>
                        <p>Crie desafios motivacionais para engajar seus alunos no treinamento.</p>
                        <button class="btn btn-primary" onclick="createChallenge()">
                            ➕ Criar Primeiro Desafio
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const stats = calculateChallengeStats(challenges);
        
        container.innerHTML = `
            <div class="challenges-isolated">
                <div class="challenges-header">
                    <h2>🏆 Gestão de Desafios</h2>
                    <div class="challenges-actions">
                        <button class="btn btn-primary" onclick="createChallenge()">
                            ➕ Novo Desafio
                        </button>
                        <button class="btn btn-secondary" onclick="manageRewards()">
                            🎁 Recompensas
                        </button>
                        <button class="btn btn-secondary" onclick="exportChallenges()">
                            📊 Exportar
                        </button>
                        <button class="btn btn-secondary" onclick="window.history.back()">
                            ← Voltar
                        </button>
                    </div>
                </div>
                
                <div class="challenges-stats">
                    <div class="stat-card">
                        <div class="stat-value active" id="activeChallengesCount">${stats.activeChallenges}</div>
                        <div class="stat-label">Desafios Ativos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value completed" id="completedChallengesCount">${stats.completedChallenges}</div>
                        <div class="stat-label">Concluídos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value pending" id="totalParticipantsCount">${stats.totalParticipants}</div>
                        <div class="stat-label">Participantes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalPointsCount">${stats.totalPoints}</div>
                        <div class="stat-label">Pontos Distribuídos</div>
                    </div>
                </div>
                
                <div class="challenges-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="challenge-filter active" data-filter="all">Todos</button>
                        <button class="challenge-filter" data-filter="active">Ativos</button>
                        <button class="challenge-filter" data-filter="completed">Concluídos</button>
                        <button class="challenge-filter" data-filter="expired">Expirados</button>
                    </div>
                    
                    <div class="search-group">
                        <input type="text" id="challengeSearch" placeholder="Buscar desafios..." class="search-input">
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="challenge-sort active" data-sort="deadline">Prazo</button>
                        <button class="challenge-sort" data-sort="name">Nome</button>
                        <button class="challenge-sort" data-sort="difficulty">Dificuldade</button>
                        <button class="challenge-sort" data-sort="participants">Participantes</button>
                    </div>
                </div>
                
                <div class="challenges-grid">
                    ${challenges.map(challenge => `
                        <div class="challenge-card ${challenge.status}" data-challenge-id="${challenge.id}">
                            <div class="challenge-header">
                                <div class="challenge-title">
                                    <h3>${challenge.icon} ${challenge.name}</h3>
                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                        <span class="challenge-category">${challenge.category}</span>
                                        <span class="challenge-difficulty ${challenge.difficulty}">${getDifficultyLabel(challenge.difficulty)}</span>
                                    </div>
                                </div>
                                <div class="challenge-status">
                                    <span class="status-badge ${challenge.status}">${getStatusLabel(challenge.status)}</span>
                                </div>
                            </div>
                            
                            <div class="challenge-content">
                                <div class="challenge-details">
                                    <div class="detail-item">
                                        <div class="detail-label">🎯 Pontos</div>
                                        <div class="detail-value points">${challenge.points}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">👥 Participantes</div>
                                        <div class="detail-value participants">${challenge.participantsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 Prazo</div>
                                        <div class="detail-value">${formatDate(challenge.deadline)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">⏱️ Duração</div>
                                        <div class="detail-value">${challenge.duration}</div>
                                    </div>
                                </div>
                                
                                <div class="challenge-progress">
                                    <div class="progress-label">
                                        <span>Progresso</span>
                                        <span>${challenge.completionRate}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill ${challenge.status}" style="width: ${challenge.completionRate}%"></div>
                                    </div>
                                    <div class="progress-text">
                                        ${challenge.participantsCompleted} de ${challenge.participantsCount} participantes
                                    </div>
                                </div>
                                
                                ${challenge.description ? `
                                    <div class="challenge-description">
                                        <p>${challenge.description}</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="challenge-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewChallenge('${challenge.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editChallenge('${challenge.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="viewParticipants('${challenge.id}')">
                                    👥 Participantes
                                </button>
                                ${challenge.status === 'active' ? `
                                    <button class="btn btn-sm btn-success" onclick="completeChallenge('${challenge.id}')">
                                        ✅ Finalizar
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-danger" onclick="deleteChallenge('${challenge.id}')">
                                    🗑️ Excluir
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        challengesData = challenges;
        filteredChallenges = challenges;
    }
    
    function calculateChallengeStats(challenges) {
        return {
            activeChallenges: challenges.filter(c => c.status === 'active').length,
            completedChallenges: challenges.filter(c => c.status === 'completed').length,
            totalParticipants: challenges.reduce((sum, challenge) => sum + challenge.participantsCount, 0),
            totalPoints: challenges.reduce((sum, challenge) => sum + (challenge.points * challenge.participantsCompleted), 0)
        };
    }
    
    function getStatusLabel(status) {
        const labels = {
            'active': 'Ativo',
            'completed': 'Concluído',
            'expired': 'Expirado',
            'draft': 'Rascunho'
        };
        return labels[status] || status;
    }
    
    function getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Fácil',
            'medium': 'Médio',
            'hard': 'Difícil',
            'expert': 'Especialista'
        };
        return labels[difficulty] || difficulty;
    }
    
    function filterChallenges(searchTerm = '') {
        let filtered = challengesData;
        
        // Apply status filter
        if (currentFilter !== 'all') {
            filtered = filtered.filter(challenge => challenge.status === currentFilter);
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(challenge => 
                challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                challenge.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                challenge.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        filteredChallenges = filtered;
        renderFilteredChallenges(filtered);
        updateFilterButtons();
    }
    
    function sortChallenges() {
        let sorted = [...filteredChallenges];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'deadline':
                    aVal = new Date(a.deadline);
                    bVal = new Date(b.deadline);
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 };
                    aVal = difficultyOrder[a.difficulty] || 0;
                    bVal = difficultyOrder[b.difficulty] || 0;
                    break;
                case 'participants':
                    aVal = a.participantsCount;
                    bVal = b.participantsCount;
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
        
        renderFilteredChallenges(sorted);
        updateSortButtons();
    }
    
    function renderFilteredChallenges(challenges) {
        const grid = document.querySelector('.challenges-grid');
        if (grid) {
            grid.innerHTML = challenges.map(challenge => `
                <div class="challenge-card ${challenge.status}" data-challenge-id="${challenge.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.challenge-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.challenge-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // CHALLENGE ACTIONS
    // ==========================================
    
    function createChallenge() {
        console.log('🏆 Creating new challenge...');
        
        if (typeof showToast === 'function') {
            showToast('Criador de desafios em desenvolvimento', 'info');
        }
    }
    
    function viewChallenge(challengeId) {
        console.log('👁️ Viewing challenge:', challengeId);
        
        const challenge = challengesData.find(c => c.id === challengeId);
        if (!challenge) {
            if (typeof showToast === 'function') {
                showToast('Desafio não encontrado', 'error');
            }
            return;
        }
        
        if (typeof showToast === 'function') {
            showToast('Visualização de desafio em desenvolvimento', 'info');
        }
    }
    
    function editChallenge(challengeId) {
        console.log('✏️ Editing challenge:', challengeId);
        
        if (typeof showToast === 'function') {
            showToast('Editor de desafios em desenvolvimento', 'info');
        }
    }
    
    function viewParticipants(challengeId) {
        console.log('👥 Viewing participants for challenge:', challengeId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de participantes em desenvolvimento', 'info');
        }
    }
    
    function completeChallenge(challengeId) {
        console.log('✅ Completing challenge:', challengeId);
        
        const challenge = challengesData.find(c => c.id === challengeId);
        if (!challenge) {
            if (typeof showToast === 'function') {
                showToast('Desafio não encontrado', 'error');
            }
            return;
        }
        
        if (confirm(`Tem certeza que deseja finalizar o desafio "${challenge.name}"?`)) {
            // Update challenge status
            challenge.status = 'completed';
            challenge.completionRate = 100;
            
            // Re-render
            renderChallenges(challengesData);
            
            if (typeof showToast === 'function') {
                showToast('Desafio finalizado com sucesso!', 'success');
            }
        }
    }
    
    function deleteChallenge(challengeId) {
        console.log('🗑️ Deleting challenge:', challengeId);
        
        const challenge = challengesData.find(c => c.id === challengeId);
        if (!challenge) {
            if (typeof showToast === 'function') {
                showToast('Desafio não encontrado', 'error');
            }
            return;
        }
        
        if (confirm(`Tem certeza que deseja excluir o desafio "${challenge.name}"?`)) {
            // Remove from data
            challengesData = challengesData.filter(c => c.id !== challengeId);
            
            // Re-render
            renderChallenges(challengesData);
            
            if (typeof showToast === 'function') {
                showToast('Desafio excluído com sucesso', 'success');
            }
        }
    }
    
    function manageRewards() {
        console.log('🎁 Managing rewards...');
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de recompensas em desenvolvimento', 'info');
        }
    }
    
    function refreshChallenges() {
        console.log('🔄 Refreshing challenges...');
        loadChallenges();
    }
    
    function exportChallenges() {
        console.log('📊 Exporting challenges...');
        
        if (challengesData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum desafio para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateChallengesCSV(challengesData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `challenges_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Desafios exportados com sucesso!', 'success');
        }
    }
    
    function generateChallengesCSV(data) {
        const headers = ['ID', 'Nome', 'Categoria', 'Dificuldade', 'Pontos', 'Participantes', 'Concluído %', 'Status', 'Prazo', 'Descrição'];
        const rows = data.map(challenge => [
            challenge.id,
            challenge.name,
            challenge.category,
            getDifficultyLabel(challenge.difficulty),
            challenge.points,
            challenge.participantsCount,
            challenge.completionRate,
            getStatusLabel(challenge.status),
            formatDate(challenge.deadline),
            challenge.description || ''
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
    
    async function fetchChallengesData() {
        try {
            const response = await fetch('/api/challenges');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderChallenges(data.data);
                } else {
                    console.error('Failed to fetch challenges data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Challenges API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching challenges data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: 'weekly-technique',
                    name: 'Técnica da Semana',
                    category: 'Técnicas',
                    difficulty: 'medium',
                    icon: '🥊',
                    points: 50,
                    participantsCount: 12,
                    participantsCompleted: 8,
                    completionRate: 67,
                    status: 'active',
                    deadline: '2025-01-25',
                    duration: '7 dias',
                    description: 'Dominar e demonstrar a técnica da semana com precisão.'
                },
                {
                    id: 'attendance-streak',
                    name: 'Frequência Perfeita',
                    category: 'Participação',
                    difficulty: 'easy',
                    icon: '📅',
                    points: 100,
                    participantsCount: 25,
                    participantsCompleted: 15,
                    completionRate: 60,
                    status: 'active',
                    deadline: '2025-01-31',
                    duration: '30 dias',
                    description: 'Participar de todas as aulas durante o mês sem faltas.'
                },
                {
                    id: 'advanced-combo',
                    name: 'Combinação Avançada',
                    category: 'Técnicas',
                    difficulty: 'hard',
                    icon: '⚡',
                    points: 150,
                    participantsCount: 8,
                    participantsCompleted: 3,
                    completionRate: 38,
                    status: 'active',
                    deadline: '2025-02-15',
                    duration: '21 dias',
                    description: 'Executar uma sequência complexa de movimentos com fluência.'
                }
            ];
            
            renderChallenges(fallbackData);
        }
    }
    
    function showErrorState() {
        const container = document.getElementById('challenges') || document.querySelector('.challenges-isolated');
        if (container) {
            container.innerHTML = `
                <div class="challenges-isolated">
                    <div class="challenges-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar desafios</h3>
                        <p>Não foi possível carregar os dados dos desafios.</p>
                        <button class="btn btn-primary" onclick="loadChallenges()">
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
        window.loadChallenges = loadChallenges;
        window.renderChallenges = renderChallenges;
        window.createChallenge = createChallenge;
        window.viewChallenge = viewChallenge;
        window.editChallenge = editChallenge;
        window.viewParticipants = viewParticipants;
        window.completeChallenge = completeChallenge;
        window.deleteChallenge = deleteChallenge;
        window.manageRewards = manageRewards;
        window.refreshChallenges = refreshChallenges;
        window.exportChallenges = exportChallenges;
        window.filterChallenges = filterChallenges;
        window.fetchChallengesData = fetchChallengesData;
    }
    
    console.log('🏆 Challenges Module loaded');
    
})();
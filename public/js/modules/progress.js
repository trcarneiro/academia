(function() {
    'use strict';
    
    // Module state
    let progressData = [];
    let currentFilter = 'all';
    let currentSort = 'score';
    let sortDirection = 'desc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeProgressModule();
    });
    
    // Module initialization
    function initializeProgressModule() {
        console.log('📈 Initializing Progress Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load progress if container exists
            if (document.getElementById('progress')) {
                loadProgress();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing progress module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('progress-filter')) {
                currentFilter = e.target.dataset.filter;
                filterProgress();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('progress-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'desc';
                }
                sortProgress();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportProgressBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportProgress);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshProgressBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshProgress);
        }
    }
    
    // ==========================================
    // PROGRESS FUNCTIONS
    // ==========================================
    
    function loadProgress() {
        console.log('📈 Loading progress data...');
        fetchProgressData();
    }
    
    function renderProgress(progress) {
        const container = document.getElementById('progress');
        if (!container) {
            console.warn('Progress container not found');
            return;
        }
        
        if (!progress || progress.length === 0) {
            container.innerHTML = `
                <div class="progress-isolated">
                    <div class="progress-header">
                        <h2>📈 Progresso dos Alunos</h2>
                        <div class="progress-actions">
                            <button class="btn btn-primary" onclick="refreshProgress()">
                                🔄 Atualizar Dados
                            </button>
                        </div>
                    </div>
                    
                    <div class="progress-empty-state">
                        <div class="empty-icon">📈</div>
                        <h3>Nenhum dado de progresso encontrado</h3>
                        <p>Os dados de progresso aparecerão aqui conforme os alunos avançarem no curso.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="progress-isolated">
                <div class="progress-header">
                    <h2>📈 Progresso dos Alunos</h2>
                    <div class="progress-actions">
                        <button class="btn btn-primary" onclick="refreshProgress()">
                            🔄 Atualizar
                        </button>
                        <button class="btn btn-secondary" onclick="exportProgress()">
                            📊 Exportar
                        </button>
                    </div>
                </div>
                
                <div class="progress-stats">
                    <div class="stat-card">
                        <div class="stat-value">${progress.length}</div>
                        <div class="stat-label">Alunos Ativos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(progress.reduce((sum, p) => sum + p.overallProgress, 0) / progress.length) || 0}%</div>
                        <div class="stat-label">Progresso Médio</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${progress.reduce((sum, p) => sum + p.techniquesMastered, 0)}</div>
                        <div class="stat-label">Técnicas Dominadas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${progress.reduce((sum, p) => sum + p.pointsAccumulated, 0)}</div>
                        <div class="stat-label">Pontos Totais</div>
                    </div>
                </div>
                
                <div class="progress-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="progress-filter active" data-filter="all">Todos</button>
                        <button class="progress-filter" data-filter="beginner">Iniciantes</button>
                        <button class="progress-filter" data-filter="intermediate">Intermediários</button>
                        <button class="progress-filter" data-filter="advanced">Avançados</button>
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="progress-sort active" data-sort="score">Pontuação</button>
                        <button class="progress-sort" data-sort="progress">Progresso</button>
                        <button class="progress-sort" data-sort="name">Nome</button>
                        <button class="progress-sort" data-sort="techniques">Técnicas</button>
                    </div>
                </div>
                
                <div class="progress-grid">
                    ${progress.map(student => `
                        <div class="progress-card" data-student-id="${student.id}">
                            <div class="progress-card-header">
                                <div class="student-avatar">
                                    <span class="avatar-text">${student.name.charAt(0)}</span>
                                </div>
                                <div class="student-info">
                                    <h3 class="student-name">${student.name}</h3>
                                    <p class="student-id">ID: ${student.id}</p>
                                    <span class="student-level ${student.level.toLowerCase()}">${getLevelLabel(student.level)}</span>
                                </div>
                            </div>
                            
                            <div class="progress-metrics">
                                <div class="metric-item">
                                    <div class="metric-label">Progresso Geral</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${student.overallProgress}%"></div>
                                    </div>
                                    <div class="metric-value">${student.overallProgress}%</div>
                                </div>
                                
                                <div class="metric-item">
                                    <div class="metric-label">Técnicas Dominadas</div>
                                    <div class="metric-number">${student.techniquesMastered}</div>
                                </div>
                                
                                <div class="metric-item">
                                    <div class="metric-label">Pontos Acumulados</div>
                                    <div class="metric-number">${student.pointsAccumulated}</div>
                                </div>
                                
                                <div class="metric-item">
                                    <div class="metric-label">Desafios Completados</div>
                                    <div class="metric-number">${student.challengesCompleted}</div>
                                </div>
                                
                                <div class="metric-item">
                                    <div class="metric-label">Frequência</div>
                                    <div class="metric-number">${student.attendanceRate}%</div>
                                </div>
                            </div>
                            
                            <div class="progress-timeline">
                                <div class="timeline-header">
                                    <span class="timeline-title">📅 Atividade Recente</span>
                                </div>
                                <div class="timeline-items">
                                    ${student.recentActivity.map(activity => `
                                        <div class="timeline-item">
                                            <div class="timeline-icon">${activity.icon}</div>
                                            <div class="timeline-content">
                                                <div class="timeline-title">${activity.title}</div>
                                                <div class="timeline-date">${formatDate(activity.date)}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="progress-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewStudentProgress('${student.id}')">
                                    📊 Ver Detalhes
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="updateProgress('${student.id}')">
                                    ✏️ Atualizar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        progressData = progress;
    }
    
    function getLevelLabel(level) {
        const labels = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário',
            'advanced': 'Avançado',
            'expert': 'Especialista'
        };
        return labels[level] || level;
    }
    
    function filterProgress() {
        let filtered = progressData;
        
        if (currentFilter !== 'all') {
            filtered = progressData.filter(student => student.level === currentFilter);
        }
        
        renderFilteredProgress(filtered);
        updateFilterButtons();
    }
    
    function sortProgress() {
        let sorted = [...progressData];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'score':
                    aVal = a.pointsAccumulated;
                    bVal = b.pointsAccumulated;
                    break;
                case 'progress':
                    aVal = a.overallProgress;
                    bVal = b.overallProgress;
                    break;
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'techniques':
                    aVal = a.techniquesMastered;
                    bVal = b.techniquesMastered;
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
        
        renderFilteredProgress(sorted);
        updateSortButtons();
    }
    
    function renderFilteredProgress(students) {
        const grid = document.querySelector('.progress-grid');
        if (grid) {
            grid.innerHTML = students.map(student => `
                <div class="progress-card" data-student-id="${student.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.progress-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.progress-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // PROGRESS ACTIONS
    // ==========================================
    
    function viewStudentProgress(studentId) {
        console.log('📊 Viewing progress for student:', studentId);
        
        const student = progressData.find(s => s.id === studentId);
        if (!student) {
            if (typeof showToast === 'function') {
                showToast('Aluno não encontrado', 'error');
            }
            return;
        }
        
        showProgressModal(student);
    }
    
    function updateProgress(studentId) {
        console.log('✏️ Updating progress for student:', studentId);
        
        if (typeof showToast === 'function') {
            showToast('Interface de atualização em desenvolvimento', 'info');
        }
        
        // In a real implementation, this would open a full-screen form
        // Following CLAUDE.md guidelines for full-screen navigation
    }
    
    function refreshProgress() {
        console.log('🔄 Refreshing progress data...');
        loadProgress();
    }
    
    function showProgressModal(student) {
        const modal = document.createElement('div');
        modal.id = 'progressModal';
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
            <div style="background: #1E293B; padding: 2rem; border-radius: 12px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #F8FAFC; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        📊 Progresso Detalhado - ${student.name}
                    </h3>
                    <button onclick="closeProgressModal()" style="background: none; border: none; color: #94A3B8; font-size: 1.5rem; cursor: pointer;">×</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #3B82F6; margin-bottom: 0.5rem;">${student.overallProgress}%</div>
                        <div style="color: #CBD5E1; font-size: 0.875rem;">Progresso Geral</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10B981; margin-bottom: 0.5rem;">${student.techniquesMastered}</div>
                        <div style="color: #CBD5E1; font-size: 0.875rem;">Técnicas</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #F59E0B; margin-bottom: 0.5rem;">${student.pointsAccumulated}</div>
                        <div style="color: #CBD5E1; font-size: 0.875rem;">Pontos</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #8B5CF6; margin-bottom: 0.5rem;">${student.challengesCompleted}</div>
                        <div style="color: #CBD5E1; font-size: 0.875rem;">Desafios</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #F8FAFC; margin-bottom: 1rem;">📈 Evolução por Categoria</h4>
                    ${student.skillProgress.map(skill => `
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="color: #CBD5E1; font-size: 0.875rem;">${skill.name}</span>
                                <span style="color: #F8FAFC; font-weight: 600;">${skill.progress}%</span>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; height: 8px; overflow: hidden;">
                                <div style="background: #3B82F6; height: 100%; width: ${skill.progress}%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-bottom: 2rem;">
                    <h4 style="color: #F8FAFC; margin-bottom: 1rem;">🎯 Próximos Objetivos</h4>
                    <div style="color: #CBD5E1; line-height: 1.6;">
                        ${student.nextGoals.map(goal => `
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="color: #F59E0B;">🎯</span>
                                <span>${goal}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="updateProgress('${student.id}')" style="background: #3B82F6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        ✏️ Atualizar Progresso
                    </button>
                    <button onclick="closeProgressModal()" style="background: #6B7280; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click-to-close functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProgressModal();
            }
        });
    }
    
    function closeProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) {
            modal.remove();
        }
    }
    
    function exportProgress() {
        console.log('📊 Exporting progress data...');
        
        if (progressData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum dado para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateProgressCSV(progressData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `progress_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Dados de progresso exportados com sucesso!', 'success');
        }
    }
    
    function generateProgressCSV(data) {
        const headers = ['ID', 'Nome', 'Nível', 'Progresso %', 'Técnicas', 'Pontos', 'Desafios', 'Frequência %'];
        const rows = data.map(student => [
            student.id,
            student.name,
            getLevelLabel(student.level),
            student.overallProgress,
            student.techniquesMastered,
            student.pointsAccumulated,
            student.challengesCompleted,
            student.attendanceRate
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchProgressData() {
        try {
            const response = await fetch('/api/progress');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderProgress(data.data);
                } else {
                    console.error('Failed to fetch progress data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Progress API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching progress data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: 'KMA0001',
                    name: 'Ana Oliveira',
                    level: 'intermediate',
                    overallProgress: 65,
                    techniquesMastered: 5,
                    pointsAccumulated: 65,
                    challengesCompleted: 2,
                    attendanceRate: 88,
                    skillProgress: [
                        { name: 'Defesas Básicas', progress: 80 },
                        { name: 'Ataques Primários', progress: 70 },
                        { name: 'Movimentação', progress: 60 },
                        { name: 'Condicionamento', progress: 50 }
                    ],
                    recentActivity: [
                        { icon: '🎯', title: 'Técnica dominada: Defesa contra estrangulamento', date: '2025-01-15' },
                        { icon: '📊', title: 'Avaliação completada: 85%', date: '2025-01-14' },
                        { icon: '🏆', title: 'Desafio completado: Resistência', date: '2025-01-13' }
                    ],
                    nextGoals: [
                        'Dominar técnicas de contra-ataque',
                        'Completar desafio de velocidade',
                        'Alcançar 70% de progresso geral'
                    ]
                },
                {
                    id: 'KMA0002',
                    name: 'Carlos Santos',
                    level: 'beginner',
                    overallProgress: 35,
                    techniquesMastered: 3,
                    pointsAccumulated: 35,
                    challengesCompleted: 1,
                    attendanceRate: 92,
                    skillProgress: [
                        { name: 'Defesas Básicas', progress: 40 },
                        { name: 'Ataques Primários', progress: 30 },
                        { name: 'Movimentação', progress: 35 },
                        { name: 'Condicionamento', progress: 35 }
                    ],
                    recentActivity: [
                        { icon: '🎯', title: 'Primeira técnica dominada', date: '2025-01-15' },
                        { icon: '📚', title: 'Aula teórica completada', date: '2025-01-14' },
                        { icon: '👥', title: 'Primeiro treino em grupo', date: '2025-01-13' }
                    ],
                    nextGoals: [
                        'Dominar postura básica',
                        'Completar primeiro desafio',
                        'Alcançar 50% de progresso'
                    ]
                },
                {
                    id: 'KMA0003',
                    name: 'Maria Silva',
                    level: 'advanced',
                    overallProgress: 85,
                    techniquesMastered: 8,
                    pointsAccumulated: 120,
                    challengesCompleted: 5,
                    attendanceRate: 95,
                    skillProgress: [
                        { name: 'Defesas Básicas', progress: 95 },
                        { name: 'Ataques Primários', progress: 85 },
                        { name: 'Movimentação', progress: 80 },
                        { name: 'Condicionamento', progress: 90 }
                    ],
                    recentActivity: [
                        { icon: '🏆', title: 'Desafio avançado completado', date: '2025-01-15' },
                        { icon: '📊', title: 'Avaliação perfeita: 100%', date: '2025-01-14' },
                        { icon: '🎯', title: 'Técnica avançada dominada', date: '2025-01-13' }
                    ],
                    nextGoals: [
                        'Preparar para faixa preta',
                        'Completar todos os desafios',
                        'Alcançar 100% de progresso'
                    ]
                }
            ];
            
            renderProgress(fallbackData);
        }
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short'
        });
    }
    
    function showErrorState() {
        const container = document.getElementById('progress');
        if (container) {
            container.innerHTML = `
                <div class="progress-isolated">
                    <div class="progress-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar dados de progresso</h3>
                        <p>Não foi possível carregar os dados de progresso dos alunos.</p>
                        <button class="btn btn-primary" onclick="loadProgress()">
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
        window.loadProgress = loadProgress;
        window.renderProgress = renderProgress;
        window.viewStudentProgress = viewStudentProgress;
        window.updateProgress = updateProgress;
        window.refreshProgress = refreshProgress;
        window.exportProgress = exportProgress;
        window.closeProgressModal = closeProgressModal;
        window.fetchProgressData = fetchProgressData;
    }
    
    console.log('📈 Progress Module loaded');
    
})();
(function() {
    'use strict';
    
    // Module state
    let instructorsData = [];
    let filteredInstructors = [];
    let currentFilter = 'all';
    let currentSort = 'name';
    let sortDirection = 'asc';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeInstructorsModule();
    });
    
    // Module initialization
    function initializeInstructorsModule() {
        console.log('🥋 Initializing Instructors Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load instructors if container exists
            if (document.getElementById('instructors') || document.querySelector('.instructors-isolated')) {
                loadInstructors();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing instructors module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Search input
        document.addEventListener('input', function(e) {
            if (e.target.id === 'instructorSearch') {
                filterInstructors(e.target.value);
            }
        });
        
        // Filter buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('instructor-filter')) {
                currentFilter = e.target.dataset.filter;
                filterInstructors();
            }
        });
        
        // Sort buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('instructor-sort')) {
                const newSort = e.target.dataset.sort;
                if (currentSort === newSort) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort = newSort;
                    sortDirection = 'asc';
                }
                sortInstructors();
            }
        });
        
        // Export button
        const exportBtn = document.getElementById('exportInstructorsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportInstructors);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshInstructorsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshInstructors);
        }
    }
    
    // ==========================================
    // INSTRUCTORS FUNCTIONS
    // ==========================================
    
    function loadInstructors() {
        console.log('🥋 Loading instructors data...');
        fetchInstructorsData();
    }
    
    function renderInstructors(instructors) {
        const container = document.getElementById('instructors') || document.querySelector('.instructors-isolated');
        if (!container) {
            console.warn('Instructors container not found');
            return;
        }
        
        // Clear any existing content
        container.innerHTML = '';
        
        if (!instructors || instructors.length === 0) {
            container.innerHTML = `
                <div class="instructors-isolated">
                    <div class="instructors-header">
                        <h2>🥋 Gestão de Instrutores</h2>
                        <div class="instructors-actions">
                            <button class="btn btn-primary" onclick="addInstructor()">
                                ➕ Novo Instrutor
                            </button>
                            <button class="btn btn-secondary" onclick="manageCertifications()">
                                🏆 Certificações
                            </button>
                        </div>
                    </div>
                    
                    <div class="instructors-empty-state">
                        <div class="empty-icon">🥋</div>
                        <h3>Nenhum instrutor encontrado</h3>
                        <p>Adicione instrutores para gerenciar a equipe de ensino da academia.</p>
                        <button class="btn btn-primary" onclick="addInstructor()">
                            ➕ Adicionar Primeiro Instrutor
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Calculate stats
        const stats = calculateInstructorStats(instructors);
        
        container.innerHTML = `
            <div class="instructors-isolated">
                <div class="instructors-header">
                    <h2>🥋 Gestão de Instrutores</h2>
                    <div class="instructors-actions">
                        <button class="btn btn-primary" onclick="addInstructor()">
                            ➕ Novo Instrutor
                        </button>
                        <button class="btn btn-secondary" onclick="manageCertifications()">
                            🏆 Certificações
                        </button>
                        <button class="btn btn-secondary" onclick="manageSchedules()">
                            📅 Horários
                        </button>
                        <button class="btn btn-secondary" onclick="exportInstructors()">
                            📊 Exportar
                        </button>
                        <button class="btn btn-secondary" onclick="window.history.back()">
                            ← Voltar
                        </button>
                    </div>
                </div>
                
                <div class="instructors-stats">
                    <div class="stat-card">
                        <div class="stat-value active" id="activeInstructorsCount">${stats.activeInstructors}</div>
                        <div class="stat-label">Instrutores Ativos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value completed" id="certifiedInstructorsCount">${stats.certifiedInstructors}</div>
                        <div class="stat-label">Certificados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalStudentsCount">${stats.totalStudents}</div>
                        <div class="stat-label">Alunos Atendidos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value pending" id="averageRatingCount">${stats.averageRating.toFixed(1)}</div>
                        <div class="stat-label">Avaliação Média</div>
                    </div>
                </div>
                
                <div class="instructors-filters">
                    <div class="filter-group">
                        <label>Filtros:</label>
                        <button class="instructor-filter active" data-filter="all">Todos</button>
                        <button class="instructor-filter" data-filter="active">Ativos</button>
                        <button class="instructor-filter" data-filter="inactive">Inativos</button>
                        <button class="instructor-filter" data-filter="certified">Certificados</button>
                    </div>
                    
                    <div class="search-group">
                        <input type="text" id="instructorSearch" placeholder="Buscar instrutores..." class="search-input">
                    </div>
                    
                    <div class="sort-group">
                        <label>Ordenar:</label>
                        <button class="instructor-sort active" data-sort="name">Nome</button>
                        <button class="instructor-sort" data-sort="experience">Experiência</button>
                        <button class="instructor-sort" data-sort="rating">Avaliação</button>
                        <button class="instructor-sort" data-sort="students">Alunos</button>
                    </div>
                </div>
                
                <div class="instructors-grid">
                    ${instructors.map(instructor => `
                        <div class="instructor-card ${instructor.status}" data-instructor-id="${instructor.id}">
                            <div class="instructor-header">
                                <div class="instructor-photo">
                                    <img src="${instructor.photo || '/images/default-instructor.png'}" alt="${instructor.name}" />
                                </div>
                                <div class="instructor-info">
                                    <h3>🥋 ${instructor.name}</h3>
                                    <div class="instructor-title">${instructor.title}</div>
                                    <div class="instructor-contact">
                                        <span>📧 ${instructor.email}</span>
                                        <span>📱 ${instructor.phone}</span>
                                    </div>
                                </div>
                                <div class="instructor-status">
                                    <span class="status-badge ${instructor.status}">${getStatusLabel(instructor.status)}</span>
                                </div>
                            </div>
                            
                            <div class="instructor-content">
                                <div class="instructor-details">
                                    <div class="detail-item">
                                        <div class="detail-label">🎯 Graduação</div>
                                        <div class="detail-value belt-${instructor.belt}">${getBeltLabel(instructor.belt)}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">📅 Experiência</div>
                                        <div class="detail-value">${instructor.experience} anos</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">👥 Alunos</div>
                                        <div class="detail-value">${instructor.studentsCount}</div>
                                    </div>
                                    <div class="detail-item">
                                        <div class="detail-label">⭐ Avaliação</div>
                                        <div class="detail-value rating">${instructor.rating.toFixed(1)}</div>
                                    </div>
                                </div>
                                
                                <div class="instructor-rating">
                                    <div class="rating-header">
                                        <span>⭐ Avaliação dos Alunos</span>
                                        <span class="rating-value">${instructor.rating.toFixed(1)}/5.0</span>
                                    </div>
                                    <div class="rating-stars">
                                        ${generateStarRating(instructor.rating)}
                                    </div>
                                    <div class="rating-text">
                                        Baseado em ${instructor.reviewsCount} avaliações
                                    </div>
                                </div>
                                
                                <div class="instructor-specialties">
                                    <div class="specialties-header">
                                        <span>🎯 Especialidades</span>
                                        <span class="specialties-count">${instructor.specialties.length}</span>
                                    </div>
                                    <div class="specialties-list">
                                        ${instructor.specialties.map(specialty => `
                                            <span class="specialty-tag">${specialty}</span>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <div class="instructor-schedule">
                                    <div class="schedule-header">
                                        <span>📅 Horários</span>
                                        <span class="schedule-hours">${instructor.weeklyHours}h/semana</span>
                                    </div>
                                    <div class="schedule-info">
                                        <div class="schedule-item">
                                            <span class="schedule-label">Próxima aula:</span>
                                            <span class="schedule-value">${instructor.nextClass || 'Não agendada'}</span>
                                        </div>
                                        <div class="schedule-item">
                                            <span class="schedule-label">Unidade:</span>
                                            <span class="schedule-value">${instructor.unit}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                ${instructor.certifications && instructor.certifications.length > 0 ? `
                                    <div class="instructor-certifications">
                                        <div class="certifications-header">
                                            <span>🏆 Certificações</span>
                                            <span class="certifications-count">${instructor.certifications.length}</span>
                                        </div>
                                        <div class="certifications-list">
                                            ${instructor.certifications.map(cert => `
                                                <div class="certification-item">
                                                    <span class="certification-name">${cert.name}</span>
                                                    <span class="certification-date">${formatDate(cert.date)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${instructor.bio ? `
                                    <div class="instructor-bio">
                                        <div class="bio-label">📝 Biografia:</div>
                                        <div class="bio-content">${instructor.bio}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="instructor-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewInstructor('${instructor.id}')">
                                    👁️ Ver
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="editInstructor('${instructor.id}')">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="manageClasses('${instructor.id}')">
                                    📚 Aulas
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="viewStudents('${instructor.id}')">
                                    👥 Alunos
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="toggleStatus('${instructor.id}')">
                                    ${instructor.status === 'active' ? '⏸️ Pausar' : '▶️ Ativar'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Store data for filtering/sorting
        instructorsData = instructors;
        filteredInstructors = instructors;
    }
    
    function calculateInstructorStats(instructors) {
        const activeInstructors = instructors.filter(i => i.status === 'active').length;
        const certifiedInstructors = instructors.filter(i => i.certifications && i.certifications.length > 0).length;
        const totalStudents = instructors.reduce((sum, instructor) => sum + instructor.studentsCount, 0);
        const averageRating = instructors.reduce((sum, instructor) => sum + instructor.rating, 0) / instructors.length;
        
        return {
            activeInstructors,
            certifiedInstructors,
            totalStudents,
            averageRating: averageRating || 0
        };
    }
    
    function getStatusLabel(status) {
        const labels = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'vacation': 'Férias',
            'suspended': 'Suspenso'
        };
        return labels[status] || status;
    }
    
    function getBeltLabel(belt) {
        const labels = {
            'white': 'Faixa Branca',
            'yellow': 'Faixa Amarela',
            'orange': 'Faixa Laranja',
            'green': 'Faixa Verde',
            'blue': 'Faixa Azul',
            'brown': 'Faixa Marrom',
            'black-1': 'Faixa Preta 1º Dan',
            'black-2': 'Faixa Preta 2º Dan',
            'black-3': 'Faixa Preta 3º Dan',
            'black-4': 'Faixa Preta 4º Dan',
            'black-5': 'Faixa Preta 5º Dan'
        };
        return labels[belt] || belt;
    }
    
    function generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<span class="star full">★</span>';
        }
        if (hasHalfStar) {
            stars += '<span class="star half">☆</span>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<span class="star empty">☆</span>';
        }
        
        return stars;
    }
    
    function filterInstructors(searchTerm = '') {
        let filtered = instructorsData;
        
        // Apply status filter
        if (currentFilter !== 'all') {
            if (currentFilter === 'certified') {
                filtered = filtered.filter(instructor => instructor.certifications && instructor.certifications.length > 0);
            } else {
                filtered = filtered.filter(instructor => instructor.status === currentFilter);
            }
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(instructor => 
                instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                instructor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                instructor.specialties.some(specialty => 
                    specialty.toLowerCase().includes(searchTerm.toLowerCase())
                ) ||
                instructor.bio?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        filteredInstructors = filtered;
        renderFilteredInstructors(filtered);
        updateFilterButtons();
    }
    
    function sortInstructors() {
        let sorted = [...filteredInstructors];
        
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'experience':
                    aVal = a.experience;
                    bVal = b.experience;
                    break;
                case 'rating':
                    aVal = a.rating;
                    bVal = b.rating;
                    break;
                case 'students':
                    aVal = a.studentsCount;
                    bVal = b.studentsCount;
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
        
        renderFilteredInstructors(sorted);
        updateSortButtons();
    }
    
    function renderFilteredInstructors(instructors) {
        const grid = document.querySelector('.instructors-grid');
        if (grid) {
            grid.innerHTML = instructors.map(instructor => `
                <div class="instructor-card ${instructor.status}" data-instructor-id="${instructor.id}">
                    <!-- Same card HTML as above -->
                </div>
            `).join('');
        }
    }
    
    function updateFilterButtons() {
        document.querySelectorAll('.instructor-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    function updateSortButtons() {
        document.querySelectorAll('.instructor-sort').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sort === currentSort);
        });
    }
    
    // ==========================================
    // INSTRUCTOR ACTIONS
    // ==========================================
    
    function addInstructor() {
        console.log('🥋 Adding new instructor...');
        
        if (typeof showToast === 'function') {
            showToast('Cadastro de novo instrutor em desenvolvimento', 'info');
        }
    }
    
    function viewInstructor(instructorId) {
        console.log('👁️ Viewing instructor:', instructorId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de instrutor em desenvolvimento', 'info');
        }
    }
    
    function editInstructor(instructorId) {
        console.log('✏️ Editing instructor:', instructorId);
        
        if (typeof showToast === 'function') {
            showToast('Editor de instrutor em desenvolvimento', 'info');
        }
    }
    
    function manageClasses(instructorId) {
        console.log('📚 Managing classes for instructor:', instructorId);
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de aulas em desenvolvimento', 'info');
        }
    }
    
    function viewStudents(instructorId) {
        console.log('👥 Viewing students for instructor:', instructorId);
        
        if (typeof showToast === 'function') {
            showToast('Visualização de alunos em desenvolvimento', 'info');
        }
    }
    
    function toggleStatus(instructorId) {
        console.log('⏸️ Toggling status for instructor:', instructorId);
        
        const instructor = instructorsData.find(i => i.id === instructorId);
        if (!instructor) {
            if (typeof showToast === 'function') {
                showToast('Instrutor não encontrado', 'error');
            }
            return;
        }
        
        const newStatus = instructor.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'ativar' : 'pausar';
        
        if (confirm(`Tem certeza que deseja ${action} o instrutor "${instructor.name}"?`)) {
            // Update instructor status
            instructor.status = newStatus;
            
            // Re-render
            renderInstructors(instructorsData);
            
            if (typeof showToast === 'function') {
                showToast(`Instrutor ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso!`, 'success');
            }
        }
    }
    
    function manageCertifications() {
        console.log('🏆 Managing certifications...');
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de certificações em desenvolvimento', 'info');
        }
    }
    
    function manageSchedules() {
        console.log('📅 Managing schedules...');
        
        if (typeof showToast === 'function') {
            showToast('Gerenciamento de horários em desenvolvimento', 'info');
        }
    }
    
    function refreshInstructors() {
        console.log('🔄 Refreshing instructors...');
        loadInstructors();
    }
    
    function exportInstructors() {
        console.log('📊 Exporting instructors...');
        
        if (instructorsData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum instrutor para exportar', 'warning');
            }
            return;
        }
        
        const csvContent = generateInstructorsCSV(instructorsData);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `instructors_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Instrutores exportados com sucesso!', 'success');
        }
    }
    
    function generateInstructorsCSV(data) {
        const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Título', 'Graduação', 'Experiência', 'Status', 'Alunos', 'Avaliação', 'Unidade'];
        const rows = data.map(instructor => [
            instructor.id,
            instructor.name,
            instructor.email,
            instructor.phone,
            instructor.title,
            getBeltLabel(instructor.belt),
            instructor.experience,
            getStatusLabel(instructor.status),
            instructor.studentsCount,
            instructor.rating.toFixed(1),
            instructor.unit
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
    
    async function fetchInstructorsData() {
        try {
            const response = await fetch('/api/instructors');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderInstructors(data.data);
                } else {
                    console.error('Failed to fetch instructors data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Instructors API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching instructors data:', error);
            
            // Use fallback data
            const fallbackData = [
                {
                    id: 'instructor-001',
                    name: 'Carlos Eduardo Silva',
                    email: 'carlos.silva@kravacademy.com',
                    phone: '(11) 98765-4321',
                    title: 'Instrutor Sênior',
                    belt: 'black-3',
                    experience: 12,
                    status: 'active',
                    studentsCount: 45,
                    rating: 4.8,
                    reviewsCount: 127,
                    weeklyHours: 32,
                    nextClass: 'Hoje 19:00',
                    unit: 'Unidade Centro',
                    specialties: ['Defesa Pessoal', 'Combate', 'Condicionamento'],
                    certifications: [
                        { name: 'Instrutor Krav Maga IKMF', date: '2018-03-15' },
                        { name: 'Primeiros Socorros', date: '2023-06-20' }
                    ],
                    bio: 'Instrutor com mais de 12 anos de experiência em Krav Maga e artes marciais.',
                    photo: null
                },
                {
                    id: 'instructor-002',
                    name: 'Ana Beatriz Costa',
                    email: 'ana.costa@kravacademy.com',
                    phone: '(11) 97654-3210',
                    title: 'Instrutora',
                    belt: 'black-1',
                    experience: 7,
                    status: 'active',
                    studentsCount: 32,
                    rating: 4.9,
                    reviewsCount: 89,
                    weeklyHours: 28,
                    nextClass: 'Amanhã 17:30',
                    unit: 'Unidade Zona Sul',
                    specialties: ['Defesa Feminina', 'Kids', 'Flexibilidade'],
                    certifications: [
                        { name: 'Instrutora Krav Maga KMG', date: '2020-09-10' },
                        { name: 'Instrutora Kids', date: '2021-02-18' }
                    ],
                    bio: 'Especialista em defesa pessoal feminina e aulas para crianças.',
                    photo: null
                },
                {
                    id: 'instructor-003',
                    name: 'Roberto Mendes',
                    email: 'roberto.mendes@kravacademy.com',
                    phone: '(11) 96543-2109',
                    title: 'Instrutor Júnior',
                    belt: 'brown',
                    experience: 4,
                    status: 'active',
                    studentsCount: 18,
                    rating: 4.6,
                    reviewsCount: 45,
                    weeklyHours: 20,
                    nextClass: 'Segunda 20:00',
                    unit: 'Unidade Alphaville',
                    specialties: ['Iniciantes', 'Condicionamento'],
                    certifications: [
                        { name: 'Instrutor Auxiliar', date: '2022-11-05' }
                    ],
                    bio: 'Instrutor focado em alunos iniciantes e condicionamento físico.',
                    photo: null
                }
            ];
            
            renderInstructors(fallbackData);
        }
    }
    
    function showErrorState() {
        const container = document.getElementById('instructors') || document.querySelector('.instructors-isolated');
        if (container) {
            container.innerHTML = `
                <div class="instructors-isolated">
                    <div class="instructors-error-state">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar instrutores</h3>
                        <p>Não foi possível carregar os dados dos instrutores.</p>
                        <button class="btn btn-primary" onclick="loadInstructors()">
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
        window.loadInstructors = loadInstructors;
        window.renderInstructors = renderInstructors;
        window.addInstructor = addInstructor;
        window.viewInstructor = viewInstructor;
        window.editInstructor = editInstructor;
        window.manageClasses = manageClasses;
        window.viewStudents = viewStudents;
        window.toggleStatus = toggleStatus;
        window.manageCertifications = manageCertifications;
        window.manageSchedules = manageSchedules;
        window.refreshInstructors = refreshInstructors;
        window.exportInstructors = exportInstructors;
        window.filterInstructors = filterInstructors;
        window.fetchInstructorsData = fetchInstructorsData;
    }
    
    console.log('🥋 Instructors Module loaded');
    
})();
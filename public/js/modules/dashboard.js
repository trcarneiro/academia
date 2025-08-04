(function() {
    'use strict';
    
    // Module state
    let dashboardData = {
        students: [],
        classes: [],
        attendance: [],
        financial: {},
        lastUpdated: null
    };
    
    let updateInterval = null;
    let isInitialized = false;
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeDashboardModule();
    });
    
    // Module initialization
    function initializeDashboardModule() {
        console.log('📊 Initializing Dashboard Module...');
        
        if (isInitialized) {
            console.log('⚠️ Dashboard module already initialized');
            return;
        }
        
        try {
            setupEventListeners();
            
            // Auto-load dashboard if container exists (support both old and new structure)
            if (document.getElementById('dashboard') || document.querySelector('.dashboard-isolated')) {
                loadDashboard();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
            // Set up auto-refresh
            setupAutoRefresh();
            
            isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error initializing dashboard module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Attendance details toggle
        const attendanceCard = document.querySelector('.metric-card[data-action="toggle-attendance-details"]');
        if (attendanceCard) {
            attendanceCard.addEventListener('click', toggleAttendanceDetails);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshDashboard);
        }
        
        // Auto-refresh toggle
        const autoRefreshToggle = document.getElementById('autoRefreshToggle');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', toggleAutoRefresh);
        }
    }
    
    // ==========================================
    // DASHBOARD FUNCTIONS
    // ==========================================
    
    function loadDashboard() {
        console.log('📊 Loading dashboard data...');
        showLoadingState();
        fetchDashboardData();
    }
    
    function renderDashboard(data) {
        console.log('📊 Rendering dashboard with data:', data);
        
        try {
            // Update metrics
            updateMetrics(data);
            
            // Update recent activities
            updateRecentActivities(data);
            
            // Update charts if they exist
            updateCharts(data);
            
            // Update last updated time
            updateLastUpdatedTime();
            
            hideLoadingState();
            
        } catch (error) {
            console.error('❌ Error rendering dashboard:', error);
            showErrorState();
        }
    }
    
    function updateMetrics(data) {
        const metrics = {
            totalStudents: data.students?.length || 0,
            activeStudents: data.students?.filter(s => s.user?.isActive).length || 0,
            attendanceRate: calculateAttendanceRate(data.attendance),
            currentLesson: getCurrentLessonProgress(data.classes)
        };
        
        // Update metric cards
        updateMetricCard('total-students', metrics.totalStudents);
        updateMetricCard('active-students', metrics.activeStudents);
        updateMetricCard('attendance-rate', `${metrics.attendanceRate}%`);
        updateMetricCard('current-lesson', metrics.currentLesson);
        
        // Update trends
        updateTrends(data);
    }
    
    function updateMetricCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
    
    function updateTrends(data) {
        // Calculate trends based on historical data
        const trends = calculateTrends(data);
        
        // Update trend indicators
        Object.entries(trends).forEach(([metric, trend]) => {
            const trendElement = document.querySelector(`#${metric}`);
            if (trendElement) {
                const trendContainer = trendElement.closest('.metric-card')?.querySelector('.metric-trend');
                if (trendContainer) {
                    trendContainer.innerHTML = `<span>${trend.arrow}</span> ${trend.text}`;
                    trendContainer.className = `metric-trend ${trend.class}`;
                }
            }
        });
    }
    
    function calculateAttendanceRate(attendanceData) {
        if (!attendanceData || attendanceData.length === 0) return 85;
        
        const present = attendanceData.filter(a => a.status === 'present').length;
        const total = attendanceData.length;
        
        return Math.round((present / total) * 100);
    }
    
    function getCurrentLessonProgress(classesData) {
        if (!classesData || classesData.length === 0) return '15/48';
        
        // Calculate based on actual class data
        const totalLessons = 48; // Default course length
        const completedLessons = classesData.filter(c => c.status === 'completed').length;
        
        return `${completedLessons}/${totalLessons}`;
    }
    
    function calculateTrends(data) {
        // Mock trend calculation - in real app, this would compare with historical data
        return {
            'total-students': {
                arrow: '↗',
                text: '+2 este mês',
                class: 'positive'
            },
            'active-students': {
                arrow: '↗',
                text: '100% taxa',
                class: 'positive'
            },
            'attendance-rate': {
                arrow: '↗',
                text: '+5% vs mês anterior',
                class: 'positive'
            },
            'current-lesson': {
                arrow: '↗',
                text: '31% completo',
                class: 'positive'
            }
        };
    }
    
    function updateRecentActivities(data) {
        const activitiesContainer = document.querySelector('.smart-card');
        if (!activitiesContainer) return;
        
        const activities = generateRecentActivities(data);
        const activitiesHTML = activities.map(activity => 
            `<p style="margin: 0.5rem 0;">${activity.icon} <strong>${activity.title}</strong>${activity.subtitle ? ` - ${activity.subtitle}` : ''} (${activity.time})</p>`
        ).join('');
        
        const activitiesContent = activitiesContainer.querySelector('div[style*="color: #CBD5E1"]');
        if (activitiesContent) {
            activitiesContent.innerHTML = activitiesHTML;
        }
    }
    
    function generateRecentActivities(data) {
        const activities = [];
        
        // Add recent student activities
        if (data.students && data.students.length > 0) {
            const recentStudents = data.students.slice(-3);
            recentStudents.forEach(student => {
                activities.push({
                    icon: '👤',
                    title: `Novo aluno: ${student.nome || 'Aluno'}`,
                    time: 'Recente'
                });
            });
        }
        
        // Add recent attendance
        if (data.attendance && data.attendance.length > 0) {
            activities.push({
                icon: '📊',
                title: 'Presença registrada',
                subtitle: `${data.attendance.filter(a => a.status === 'present').length} presentes hoje`,
                time: 'Hoje'
            });
        }
        
        // Add default activities if no data
        if (activities.length === 0) {
            activities.push(
                {
                    icon: '🎯',
                    title: 'Aula 15 - Defesas Básicas',
                    time: 'Hoje'
                },
                {
                    icon: '📝',
                    title: 'Avaliação Maria Silva',
                    subtitle: '85.5%',
                    time: 'Ontem'
                },
                {
                    icon: '👤',
                    title: 'Novo aluno: Carlos Rodrigues',
                    time: '2 dias atrás'
                },
                {
                    icon: '🥋',
                    title: 'Técnica dominada: Ana Oliveira',
                    subtitle: '5 técnicas',
                    time: '3 dias atrás'
                }
            );
        }
        
        return activities.slice(0, 5); // Limit to 5 activities
    }
    
    function updateCharts(data) {
        // Placeholder for chart updates
        // In a real implementation, this would update Chart.js or similar
        console.log('📈 Charts updated (placeholder)');
    }
    
    function updateLastUpdatedTime() {
        dashboardData.lastUpdated = new Date();
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `Última atualização: ${dashboardData.lastUpdated.toLocaleTimeString('pt-BR')}`;
        }
    }
    
    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    
    function toggleAttendanceDetails() {
        console.log('📊 Toggling attendance details...');
        
        const detailsContainer = document.getElementById('attendanceDetails');
        
        if (detailsContainer) {
            detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
        } else {
            // Create and show attendance details modal or section
            showAttendanceDetailsModal();
        }
    }
    
    function showAttendanceDetailsModal() {
        // Create a simple modal for attendance details
        const modal = document.createElement('div');
        modal.id = 'attendanceDetailsModal';
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
            <div style="background: #1E293B; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%;">
                <h3 style="color: #F8FAFC; margin-bottom: 1rem;">📊 Detalhes da Frequência</h3>
                <div style="color: #CBD5E1; line-height: 1.6;">
                    <p>• Taxa atual: 85%</p>
                    <p>• Presentes hoje: 12 alunos</p>
                    <p>• Ausentes: 3 alunos</p>
                    <p>• Média semanal: 82%</p>
                    <p>• Tendência: +5% vs mês anterior</p>
                </div>
                <button onclick="closeAttendanceModal()" style="
                    background: #3B82F6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">Fechar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click-to-close functionality
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAttendanceModal();
            }
        });
    }
    
    function closeAttendanceModal() {
        const modal = document.getElementById('attendanceDetailsModal');
        if (modal) {
            modal.remove();
        }
    }
    
    function refreshDashboard() {
        console.log('🔄 Refreshing dashboard...');
        loadDashboard();
    }
    
    function toggleAutoRefresh() {
        const toggle = document.getElementById('autoRefreshToggle');
        if (toggle && toggle.checked) {
            setupAutoRefresh();
        } else {
            clearAutoRefresh();
        }
    }
    
    function setupAutoRefresh() {
        clearAutoRefresh();
        updateInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard...');
            fetchDashboardData();
        }, 30000); // 30 seconds
    }
    
    function clearAutoRefresh() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchDashboardData() {
        try {
            const [studentsResponse, attendanceResponse, classesResponse] = await Promise.all([
                fetch('/api/students').catch(() => ({ ok: false })),
                fetch('/api/attendance').catch(() => ({ ok: false })),
                fetch('/api/classes').catch(() => ({ ok: false }))
            ]);
            
            const data = {
                students: [],
                attendance: [],
                classes: [],
                financial: {}
            };
            
            if (studentsResponse.ok) {
                const studentsResult = await studentsResponse.json();
                if (studentsResult.success) {
                    data.students = studentsResult.data;
                }
            }
            
            if (attendanceResponse.ok) {
                const attendanceResult = await attendanceResponse.json();
                if (attendanceResult.success) {
                    data.attendance = attendanceResult.data;
                }
            }
            
            if (classesResponse.ok) {
                const classesResult = await classesResponse.json();
                if (classesResult.success) {
                    data.classes = classesResult.data;
                }
            }
            
            dashboardData = { ...dashboardData, ...data };
            renderDashboard(dashboardData);
            
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error);
            
            // Use fallback/mock data
            const fallbackData = {
                students: [
                    { nome: 'João Silva', user: { isActive: true } },
                    { nome: 'Maria Santos', user: { isActive: true } },
                    { nome: 'Pedro Costa', user: { isActive: true } },
                    { nome: 'Ana Oliveira', user: { isActive: true } }
                ],
                attendance: [
                    { status: 'present', date: new Date().toISOString() },
                    { status: 'present', date: new Date().toISOString() },
                    { status: 'absent', date: new Date().toISOString() }
                ],
                classes: [
                    { status: 'completed', name: 'Aula 1' },
                    { status: 'completed', name: 'Aula 2' }
                ]
            };
            
            dashboardData = { ...dashboardData, ...fallbackData };
            renderDashboard(dashboardData);
        }
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function showLoadingState() {
        const metricsGrid = document.querySelector('.metric-grid');
        if (metricsGrid) {
            metricsGrid.style.opacity = '0.5';
        }
    }
    
    function hideLoadingState() {
        const metricsGrid = document.querySelector('.metric-grid');
        if (metricsGrid) {
            metricsGrid.style.opacity = '1';
        }
    }
    
    function showErrorState() {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            const errorMessage = document.createElement('div');
            errorMessage.id = 'dashboardError';
            errorMessage.style.cssText = `
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #EF4444;
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                color: #EF4444;
                text-align: center;
            `;
            errorMessage.innerHTML = `
                <strong>⚠️ Erro ao carregar dados</strong><br>
                Usando dados de fallback. Tente atualizar a página.
            `;
            
            // Remove existing error message
            const existingError = document.getElementById('dashboardError');
            if (existingError) {
                existingError.remove();
            }
            
            dashboard.insertBefore(errorMessage, dashboard.firstChild);
        }
    }
    
    // ==========================================
    // GLOBAL EXPORTS
    // ==========================================
    
    function exportGlobalFunctions() {
        window.loadDashboard = loadDashboard;
        window.renderDashboard = renderDashboard;
        window.refreshDashboard = refreshDashboard;
        window.toggleAttendanceDetails = toggleAttendanceDetails;
        window.closeAttendanceModal = closeAttendanceModal;
        window.fetchDashboardData = fetchDashboardData;
        window.updateMetrics = updateMetrics;
        window.setupAutoRefresh = setupAutoRefresh;
        window.clearAutoRefresh = clearAutoRefresh;
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        clearAutoRefresh();
    });
    
    console.log('📊 Dashboard Module loaded');
    
})();
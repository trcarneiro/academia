(function() {
    'use strict';
    
    // Module state
    const DashboardModule = {
        data: {
            students: [],
            classes: [],
            attendance: [],
            financial: {},
            lastUpdated: null
        },
        
        init: function() {
            console.log('📊 Initializing Premium Dashboard...');
            this.setupGlobalFunctions();
            this.loadDashboard();
            this.setupAutoRefresh();
            this.initAgentWidget();
        },

        initAgentWidget: function() {
            const check = () => {
                if (window.agentDashboardWidget && window.agentDashboardWidget.init) {
                    window.agentDashboardWidget.init('agent-dashboard-widget');
                } else {
                    setTimeout(check, 500);
                }
            };
            check();
        },

        setupGlobalFunctions: function() {
            window.refreshDashboard = () => this.loadDashboard();
            window.generateReport = () => this.generateReport();
            
            // Navigation helper if not already defined
            if (!window.navigateToModule) {
                window.navigateToModule = (moduleName, params) => {
                    console.log(`Navigate to ${moduleName}`, params);
                    // Dispatch event for main app to handle
                    const event = new CustomEvent('navigate', { 
                        detail: { module: moduleName, params: params } 
                    });
                    window.dispatchEvent(event);
                    
                    // Fallback: Try to find sidebar link
                    const link = document.querySelector(`[data-target="${moduleName}"]`) || 
                                 document.querySelector(`a[href="#${moduleName}"]`);
                    if (link) link.click();
                };
            }
        },

        loadDashboard: async function() {
            const container = document.getElementById('dashboardContainer') || 
                              document.getElementById('dashboard');
            
            if (!container) return;

            // If HTML not loaded (check for new class)
            if (!container.querySelector('.dashboard-grid')) {
                try {
                    // Add cache buster to force load new HTML
                    const response = await fetch('/views/dashboard.html?v=' + new Date().getTime());
                    const html = await response.text();
                    container.innerHTML = html;
                } catch (error) {
                    console.error('Failed to load dashboard HTML', error);
                    return;
                }
            }

            this.showLoading();
            await this.fetchData();
            this.render();
            this.hideLoading();
        },

        fetchData: async function() {
            try {
                const [students, attendance, classes] = await Promise.all([
                    fetch('/api/students').then(r => r.json()).catch(() => ({ success: false })),
                    fetch('/api/attendance/stats').then(r => r.json()).catch(() => ({ success: false })),
                    fetch('/api/classes').then(r => r.json()).catch(() => ({ success: false }))
                ]);

                this.data.students = students.success ? students.data : [];
                this.data.attendance = attendance.success ? attendance.data : [];
                this.data.classes = classes.success ? classes.data : [];
                this.data.lastUpdated = new Date();

            } catch (error) {
                console.error('Error fetching data', error);
                // Keep existing data or show error
            }
        },

        render: function() {
            this.updateHeader();
            this.updateStats();
            this.updateAIBriefing();
            this.updateAgenda();
            this.updateRetention();
        },

        updateHeader: function() {
            const timeEl = document.getElementById('lastUpdated');
            if (timeEl) {
                timeEl.textContent = `Atualizado às ${new Date().toLocaleTimeString()}`;
            }
        },

        updateStats: function() {
            // 1. Total Students
            const total = this.data.students.length;
            this.setElementText('totalStudents', total || '--');

            // 2. Active Students
            const active = this.data.students.filter(s => s.user?.isActive !== false).length;
            this.setElementText('activeStudents', active || '--');

            // 3. Revenue (Estimate: Active * 150)
            const estRevenue = active * 150; // Mock value
            this.setElementText('monthlyRevenue', `R$ ${estRevenue.toLocaleString('pt-BR')}`);

            // 4. Today's Attendance
            // Mock or calculate from attendance data
            const today = new Date().toISOString().split('T')[0];
            const presentToday = this.data.attendance.filter(a => a.date?.startsWith(today)).length;
            this.setElementText('todayAttendances', presentToday || '0');
        },

        updateAIBriefing: function() {
            const el = document.getElementById('aiBriefingText');
            if (!el) return;

            const activeCount = this.data.students.filter(s => s.user?.isActive !== false).length;
            const totalCount = this.data.students.length;
            
            // Simple logic to generate a "briefing"
            let message = `Você tem ${activeCount} alunos ativos de um total de ${totalCount}. `;
            
            if (activeCount < totalCount * 0.8) {
                message += "A taxa de retenção requer atenção. ";
            } else {
                message += "A academia está com ótima saúde! ";
            }

            message += "Não há pendências urgentes no financeiro.";
            
            el.textContent = message;
        },

        updateAgenda: function() {
            const list = document.getElementById('agendaList');
            if (!list) return;

            // Mock agenda items for now, or use classes data
            const items = [
                { time: '18:00', title: 'Krav Maga Iniciante', subtitle: 'Instrutor João', status: 'Confirmada' },
                { time: '19:00', title: 'Defesa Pessoal Avançada', subtitle: 'Instrutor Carlos', status: 'Confirmada' },
                { time: '20:00', title: 'Treino Livre', subtitle: 'Supervisão Ana', status: 'Aguardando' }
            ];

            list.innerHTML = items.map(item => `
                <div class="agenda-item">
                    <div class="agenda-time">${item.time}</div>
                    <div class="agenda-info">
                        <div class="agenda-title">${item.title}</div>
                        <div class="agenda-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="agenda-status">${item.status}</div>
                </div>
            `).join('');
        },

        updateRetention: function() {
            const list = document.getElementById('retentionList');
            if (!list) return;

            // Find students with no attendance in last 30 days (Mock logic)
            // In real app, we would check attendance dates
            const atRisk = this.data.students.slice(0, 3).map(s => ({
                name: s.nome || 'Aluno',
                daysAbsent: Math.floor(Math.random() * 20) + 10
            }));

            if (atRisk.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:10px; color:#64748B">Nenhum aluno em risco! 🎉</div>';
                return;
            }

            list.innerHTML = atRisk.map(student => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                    <div>
                        <div style="font-weight:600; color:#334155">${student.name}</div>
                        <div style="font-size:0.85rem; color:#EF4444">${student.daysAbsent} dias ausente</div>
                    </div>
                    <button class="btn-ai-action" style="padding:4px 8px; font-size:0.8rem" onclick="navigateToModule('students', {id: '${student.id}'})">Ver</button>
                </div>
            `).join('');
        },

        generateReport: function() {
            alert('Gerando relatório detalhado com IA... (Funcionalidade em breve)');
        },

        setElementText: function(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        },

        showLoading: function() {
            // Optional: Add loading class
        },

        hideLoading: function() {
            // Optional: Remove loading class
        },

        setupAutoRefresh: function() {
            setInterval(() => this.fetchData().then(() => this.render()), 60000);
        }
    };

    // Expose to window
    window.DashboardModule = DashboardModule;

    // Auto-init
    document.addEventListener('DOMContentLoaded', () => {
        DashboardModule.init();
    });

})();

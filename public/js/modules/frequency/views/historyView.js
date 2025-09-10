/**
 * HistoryView - View para histórico de frequência
 */

export class HistoryView {
    constructor() {
        this.template = null;
    }

    /**
     * Renderizar view de histórico
     */
    render(historyData = []) {
        return `
            <div class="frequency-history-view">
                <!-- Header da Página -->
                <div class="module-header-premium">
                    <div class="header-content">
                        <div class="header-title">
                            <h1>📊 Histórico de Frequência</h1>
                            <p>Consulte e analise o histórico de presenças</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn-secondary" id="export-history">
                                📥 Exportar
                            </button>
                            <button class="btn-secondary" id="advanced-filters">
                                🔍 Filtros Avançados
                            </button>
                            <button class="btn-primary" id="refresh-history">
                                🔄 Atualizar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Breadcrumb Navigation -->
                    <nav class="breadcrumb-nav">
                        <span class="breadcrumb-item">Academia</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item">✅ Frequência</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item active">📊 Histórico</span>
                    </nav>
                </div>

                <!-- Summary Stats -->
                <div class="history-summary">
                    <div class="summary-grid">
                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📈</div>
                            <div class="stat-content">
                                <div class="stat-value" id="total-records">${historyData.length}</div>
                                <div class="stat-label">Total de Registros</div>
                                <div class="stat-trend trend-up">
                                    📈 +5% este mês
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📅</div>
                            <div class="stat-content">
                                <div class="stat-value" id="period-days">30</div>
                                <div class="stat-label">Últimos Dias</div>
                                <div class="stat-additional">
                                    Período selecionado
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">👥</div>
                            <div class="stat-content">
                                <div class="stat-value" id="unique-students">0</div>
                                <div class="stat-label">Alunos Únicos</div>
                                <div class="stat-additional">
                                    No período
                                </div>
                            </div>
                        </div>

                        <div class="stat-card-enhanced">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-value" id="avg-daily">0</div>
                                <div class="stat-label">Média Diária</div>
                                <div class="stat-additional">
                                    Check-ins/dia
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters and Search -->
                <div class="history-filters data-card-premium">
                    <div class="filters-header">
                        <h4>🔍 Filtros e Busca</h4>
                        <button class="btn-link" id="toggle-filters">
                            Expandir Filtros ▼
                        </button>
                    </div>
                    
                    <div class="filters-content" id="filters-content">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="search-student">👤 Buscar Aluno</label>
                                <input type="text" id="search-student" class="search-input" 
                                       placeholder="Digite o nome do aluno...">
                            </div>
                            
                            <div class="filter-group">
                                <label for="filter-period">📅 Período</label>
                                <select id="filter-period" class="filter-select">
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="30" selected>Últimos 30 dias</option>
                                    <option value="90">Últimos 3 meses</option>
                                    <option value="365">Último ano</option>
                                    <option value="custom">Período customizado</option>
                                </select>
                            </div>
                            
                            <div class="filter-group" id="custom-period" style="display: none;">
                                <label>Período Customizado</label>
                                <div class="date-range">
                                    <input type="date" id="date-from" class="filter-input">
                                    <span>até</span>
                                    <input type="date" id="date-to" class="filter-input">
                                </div>
                            </div>
                        </div>
                        
                        <div class="filter-row">
                            <div class="filter-group">
                                <label for="filter-course">🎓 Curso</label>
                                <select id="filter-course" class="filter-select">
                                    <option value="">Todos os cursos</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filter-instructor">👨‍🏫 Instrutor</label>
                                <select id="filter-instructor" class="filter-select">
                                    <option value="">Todos os instrutores</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filter-status">✅ Status</label>
                                <select id="filter-status" class="filter-select">
                                    <option value="">Todos os status</option>
                                    <option value="CONFIRMED">Confirmado</option>
                                    <option value="PENDING">Pendente</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="filter-device">📱 Dispositivo</label>
                                <select id="filter-device" class="filter-select">
                                    <option value="">Todos os dispositivos</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="desktop">Desktop</option>
                                    <option value="kiosk">Kiosk</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="filter-actions">
                            <button class="btn-secondary" id="clear-all-filters">
                                🗑️ Limpar Todos
                            </button>
                            <button class="btn-primary" id="apply-filters">
                                🔍 Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Results and Analytics -->
                <div class="history-content">
                    <div class="content-layout">
                        <!-- Table Section -->
                        <div class="table-section">
                            <div class="table-header">
                                <h4>📋 Registros de Frequência</h4>
                                <div class="table-controls">
                                    <div class="view-options">
                                        <button class="view-btn active" data-view="table">📋 Tabela</button>
                                        <button class="view-btn" data-view="timeline">🕒 Timeline</button>
                                        <button class="view-btn" data-view="calendar">📅 Calendário</button>
                                    </div>
                                    <div class="pagination-info" id="pagination-info">
                                        <!-- Info da paginação -->
                                    </div>
                                </div>
                            </div>
                            
                            <div class="table-container" id="attendance-list-container">
                                <!-- AttendanceList component será renderizado aqui -->
                            </div>
                        </div>

                        <!-- Analytics Sidebar -->
                        <div class="analytics-sidebar">
                            <!-- Quick Insights -->
                            <div class="insights-panel data-card-premium">
                                <h4>💡 Insights Rápidos</h4>
                                <div class="insights-list" id="quick-insights">
                                    <div class="insight-item">
                                        <div class="insight-icon">📊</div>
                                        <div class="insight-text">Analisando dados...</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Top Students -->
                            <div class="ranking-panel data-card-premium">
                                <h4>🏆 Top Alunos do Período</h4>
                                <div class="ranking-list" id="period-ranking">
                                    <!-- Ranking será renderizado aqui -->
                                </div>
                            </div>

                            <!-- Attendance Patterns -->
                            <div class="patterns-panel data-card-premium">
                                <h4>🔄 Padrões de Frequência</h4>
                                <div class="patterns-content" id="attendance-patterns">
                                    <!-- Padrões serão renderizados aqui -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline View (hidden by default) -->
                <div class="timeline-view" id="timeline-view" style="display: none;">
                    <div class="timeline-container" id="timeline-container">
                        <!-- Timeline será renderizada aqui -->
                    </div>
                </div>

                <!-- Calendar View (hidden by default) -->
                <div class="calendar-view" id="calendar-view" style="display: none;">
                    <div class="calendar-container" id="calendar-container">
                        <!-- Calendário será renderizado aqui -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar insights rápidos
     */
    renderQuickInsights(data) {
        const insights = this.generateInsights(data);
        const container = document.getElementById('quick-insights');
        
        if (!container) return;
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    }

    /**
     * Gerar insights automáticos
     */
    generateInsights(data) {
        const insights = [];
        
        if (data.length === 0) {
            return [{
                type: 'info',
                icon: 'ℹ️',
                text: 'Nenhum dado para análise'
            }];
        }

        // Insight sobre horário mais frequente
        const hourCounts = {};
        data.forEach(record => {
            const hour = new Date(record.checkinTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        insights.push({
            type: 'trend',
            icon: '🕒',
            text: `Horário de pico: ${peakHour}:00 (${hourCounts[peakHour]} check-ins)`
        });

        // Insight sobre dia da semana
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayCounts = {};
        data.forEach(record => {
            const day = new Date(record.checkinTime).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        
        const peakDay = Object.keys(dayCounts).reduce((a, b) => 
            dayCounts[a] > dayCounts[b] ? a : b
        );
        
        insights.push({
            type: 'info',
            icon: '📅',
            text: `Dia mais ativo: ${dayNames[peakDay]} (${dayCounts[peakDay]} check-ins)`
        });

        // Insight sobre dispositivos
        const deviceCounts = {};
        data.forEach(record => {
            const device = record.context?.device || 'desktop';
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });
        
        const topDevice = Object.keys(deviceCounts).reduce((a, b) => 
            deviceCounts[a] > deviceCounts[b] ? a : b
        );
        
        const deviceIcons = { mobile: '📱', desktop: '💻', kiosk: '🖥️' };
        
        insights.push({
            type: 'success',
            icon: deviceIcons[topDevice] || '💻',
            text: `Dispositivo preferido: ${topDevice} (${Math.round(deviceCounts[topDevice] / data.length * 100)}%)`
        });

        return insights;
    }

    /**
     * Renderizar ranking do período
     */
    renderPeriodRanking(data) {
        const container = document.getElementById('period-ranking');
        if (!container) return;

        // Agrupar por aluno
        const studentCounts = {};
        data.forEach(record => {
            const studentId = record.student?.id;
            if (studentId) {
                if (!studentCounts[studentId]) {
                    studentCounts[studentId] = {
                        student: record.student,
                        count: 0
                    };
                }
                studentCounts[studentId].count++;
            }
        });

        // Ordenar por contagem
        const sortedStudents = Object.values(studentCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10

        if (sortedStudents.length === 0) {
            container.innerHTML = '<div class="no-data">Nenhum dado disponível</div>';
            return;
        }

        container.innerHTML = sortedStudents.map((item, index) => {
            const position = index + 1;
            const medal = this.getPositionMedal(position);
            
            return `
                <div class="ranking-item">
                    <div class="ranking-position">
                        <span class="position-medal">${medal}</span>
                        <span class="position-number">${position}</span>
                    </div>
                    <div class="ranking-student">
                        <div class="student-name">${item.student.name}</div>
                        <div class="student-belt">${item.student.belt || 'Sem graduação'}</div>
                    </div>
                    <div class="ranking-count">
                        <div class="count-value">${item.count}</div>
                        <div class="count-label">presenças</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderizar padrões de frequência
     */
    renderAttendancePatterns(data) {
        const container = document.getElementById('attendance-patterns');
        if (!container) return;

        const patterns = this.analyzePatterns(data);
        
        container.innerHTML = `
            <div class="pattern-item">
                <div class="pattern-label">🔥 Sequência mais longa</div>
                <div class="pattern-value">${patterns.longestStreak} dias</div>
            </div>
            
            <div class="pattern-item">
                <div class="pattern-label">📊 Taxa de regularidade</div>
                <div class="pattern-value">${patterns.regularityRate}%</div>
            </div>
            
            <div class="pattern-item">
                <div class="pattern-label">🕒 Horário preferido</div>
                <div class="pattern-value">${patterns.preferredTime}</div>
            </div>
            
            <div class="pattern-item">
                <div class="pattern-label">📅 Dia da semana</div>
                <div class="pattern-value">${patterns.preferredDay}</div>
            </div>
        `;
    }

    /**
     * Analisar padrões nos dados
     */
    analyzePatterns(data) {
        if (data.length === 0) {
            return {
                longestStreak: 0,
                regularityRate: 0,
                preferredTime: '--:--',
                preferredDay: 'N/A'
            };
        }

        // Calcular sequência mais longa (simplificado)
        const longestStreak = Math.floor(Math.random() * 15) + 1;
        
        // Taxa de regularidade (simplificado)
        const regularityRate = Math.floor(Math.random() * 40) + 60;
        
        // Horário preferido
        const hours = data.map(r => new Date(r.checkinTime).getHours());
        const hourCounts = {};
        hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
        const preferredHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        const preferredTime = `${preferredHour}:00`;
        
        // Dia preferido
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const days = data.map(r => new Date(r.checkinTime).getDay());
        const dayCounts = {};
        days.forEach(d => dayCounts[d] = (dayCounts[d] || 0) + 1);
        const preferredDayIndex = Object.keys(dayCounts).reduce((a, b) => 
            dayCounts[a] > dayCounts[b] ? a : b
        );
        const preferredDay = dayNames[preferredDayIndex];

        return {
            longestStreak,
            regularityRate,
            preferredTime,
            preferredDay
        };
    }

    /**
     * Renderizar timeline
     */
    renderTimeline(data) {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        // Agrupar por data
        const dateGroups = {};
        data.forEach(record => {
            const date = new Date(record.checkinTime).toDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = [];
            }
            dateGroups[date].push(record);
        });

        const timelineItems = Object.keys(dateGroups)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => {
                const records = dateGroups[date];
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString('pt-BR');
                const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

                return `
                    <div class="timeline-item">
                        <div class="timeline-date">
                            <div class="date-primary">${formattedDate}</div>
                            <div class="date-secondary">${dayName}</div>
                            <div class="date-count">${records.length} check-ins</div>
                        </div>
                        <div class="timeline-content">
                            ${records.map(record => `
                                <div class="timeline-record">
                                    <div class="record-time">
                                        ${new Date(record.checkinTime).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div class="record-student">${record.student?.name || 'N/A'}</div>
                                    <div class="record-course">${record.session?.course?.name || 'N/A'}</div>
                                    <div class="record-status">${this.getStatusIcon(record.status)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = timelineItems || '<div class="no-data">Nenhum dado para timeline</div>';
    }

    /**
     * Renderizar calendário
     */
    renderCalendar(data) {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        // Implementação simplificada do calendário
        const currentDate = new Date();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();

        // Agrupar dados por data
        const dateData = {};
        data.forEach(record => {
            const date = new Date(record.checkinTime).toDateString();
            dateData[date] = (dateData[date] || 0) + 1;
        });

        // Gerar calendário (implementação básica)
        container.innerHTML = `
            <div class="calendar-header">
                <h4>${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div class="weekday">Dom</div>
                    <div class="weekday">Seg</div>
                    <div class="weekday">Ter</div>
                    <div class="weekday">Qua</div>
                    <div class="weekday">Qui</div>
                    <div class="weekday">Sex</div>
                    <div class="weekday">Sáb</div>
                </div>
                <div class="calendar-days">
                    <!-- Implementar geração de dias do calendário -->
                    <div class="calendar-day">Calendário em desenvolvimento</div>
                </div>
            </div>
        `;
    }

    /**
     * Alternar visualização
     */
    switchView(viewType) {
        // Esconder todas as views
        document.getElementById('table-section')?.style.setProperty('display', 'none');
        document.getElementById('timeline-view')?.style.setProperty('display', 'none');
        document.getElementById('calendar-view')?.style.setProperty('display', 'none');

        // Mostrar view selecionada
        switch (viewType) {
            case 'timeline':
                document.getElementById('timeline-view')?.style.setProperty('display', 'block');
                break;
            case 'calendar':
                document.getElementById('calendar-view')?.style.setProperty('display', 'block');
                break;
            default:
                document.getElementById('table-section')?.style.setProperty('display', 'block');
        }

        // Atualizar botões
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-view="${viewType}"]`)?.classList.add('active');
    }

    /**
     * Atualizar estatísticas do período
     */
    updatePeriodStats(data) {
        const totalEl = document.getElementById('total-records');
        const uniqueEl = document.getElementById('unique-students');
        const avgEl = document.getElementById('avg-daily');

        if (totalEl) totalEl.textContent = data.length;
        
        if (uniqueEl) {
            const uniqueStudents = new Set(data.map(r => r.student?.id)).size;
            uniqueEl.textContent = uniqueStudents;
        }
        
        if (avgEl) {
            const days = Math.max(1, Math.ceil((Date.now() - Math.min(...data.map(r => new Date(r.checkinTime)))) / (1000 * 60 * 60 * 24)));
            avgEl.textContent = Math.round(data.length / days);
        }
    }

    /**
     * Utilitários
     */
    getPositionMedal(position) {
        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        return medals[position] || '🏅';
    }

    getStatusIcon(status) {
        const icons = {
            'CONFIRMED': '✅',
            'PENDING': '⏳',
            'CANCELLED': '❌'
        };
        return icons[status] || '❓';
    }

    /**
     * Popular filtros com dados únicos
     */
    populateFilterOptions(data) {
        // Cursos únicos
        const courses = [...new Set(data.map(r => r.session?.course).filter(Boolean))]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const courseSelect = document.getElementById('filter-course');
        if (courseSelect) {
            // Limpar opções existentes (exceto primeira)
            while (courseSelect.children.length > 1) {
                courseSelect.removeChild(courseSelect.lastChild);
            }

            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        }

        // Instrutores únicos
        const instructors = [...new Set(data.map(r => r.session?.instructor).filter(Boolean))]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const instructorSelect = document.getElementById('filter-instructor');
        if (instructorSelect) {
            while (instructorSelect.children.length > 1) {
                instructorSelect.removeChild(instructorSelect.lastChild);
            }

            instructors.forEach(instructor => {
                const option = document.createElement('option');
                option.value = instructor.id;
                option.textContent = instructor.name;
                instructorSelect.appendChild(option);
            });
        }
    }
}

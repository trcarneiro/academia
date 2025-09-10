/**
 * AttendanceList - Componente para exibir lista de presenças
 */

export class AttendanceList {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            showFilters: true,
            showPagination: true,
            pageSize: 20,
            showExport: true,
            ...options
        };
        
        this.attendanceData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.currentFilters = {};
        
        console.log('📊 AttendanceList initialized');
    }

    /**
     * Renderizar lista
     */
    render(attendanceData = []) {
        this.attendanceData = attendanceData;
        this.filteredData = [...attendanceData];
        
        this.container.innerHTML = this.getHTML();
        this.bindEvents();
        this.applyFilters();
    }

    /**
     * HTML da lista
     */
    getHTML() {
        return `
            <div class="attendance-list-container data-card-premium">
                ${this.options.showFilters ? this.getFiltersHTML() : ''}
                
                <div class="list-header">
                    <div class="list-title">
                        <h3>📊 Histórico de Presenças</h3>
                        <div class="list-stats">
                            <span id="total-records">0 registros</span>
                            ${this.options.showExport ? `
                                <button class="btn-export" id="export-attendance">
                                    📥 Exportar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="list-content">
                    <div id="attendance-table-container">
                        <!-- Tabela será renderizada aqui -->
                    </div>
                    
                    ${this.options.showPagination ? `
                        <div class="pagination-container" id="pagination">
                            <!-- Paginação será renderizada aqui -->
                        </div>
                    ` : ''}
                </div>

                <div class="empty-state" id="empty-state" style="display: none;">
                    <div class="empty-icon">📭</div>
                    <h4>Nenhuma presença encontrada</h4>
                    <p>Não há registros de presença para os filtros aplicados.</p>
                </div>
            </div>
        `;
    }

    /**
     * HTML dos filtros
     */
    getFiltersHTML() {
        return `
            <div class="filters-container module-filters-premium">
                <div class="filters-row">
                    <div class="filter-group">
                        <label for="filter-student">👤 Aluno</label>
                        <select id="filter-student" class="filter-select">
                            <option value="">Todos os alunos</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filter-course">🎓 Curso</label>
                        <select id="filter-course" class="filter-select">
                            <option value="">Todos os cursos</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="filter-date-from">📅 De</label>
                        <input type="date" id="filter-date-from" class="filter-input">
                    </div>
                    
                    <div class="filter-group">
                        <label for="filter-date-to">📅 Até</label>
                        <input type="date" id="filter-date-to" class="filter-input">
                    </div>
                    
                    <div class="filter-group">
                        <label for="filter-status">✅ Status</label>
                        <select id="filter-status" class="filter-select">
                            <option value="">Todos</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="PENDING">Pendente</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>
                </div>
                
                <div class="filters-actions">
                    <button class="btn-secondary" id="clear-filters">
                        🗑️ Limpar Filtros
                    </button>
                    <button class="btn-primary" id="apply-filters">
                        🔍 Aplicar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar tabela
     */
    renderTable() {
        const container = document.getElementById('attendance-table-container');
        if (!container) return;

        if (this.filteredData.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        // Calcular dados da página atual
        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        container.innerHTML = `
            <div class="table-responsive">
                <table class="attendance-table">
                    <thead>
                        <tr>
                            <th>📅 Data/Hora</th>
                            <th>👤 Aluno</th>
                            <th>🎓 Curso</th>
                            <th>🏃 Sessão</th>
                            <th>✅ Status</th>
                            <th>📱 Dispositivo</th>
                            <th>⚙️ Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(record => this.renderTableRow(record)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Atualizar estatísticas
        this.updateStats();
        
        // Renderizar paginação
        if (this.options.showPagination) {
            this.renderPagination();
        }
    }

    /**
     * Renderizar linha da tabela
     */
    renderTableRow(record) {
        const checkinTime = new Date(record.checkinTime);
        const formattedTime = checkinTime.toLocaleString('pt-BR');
        
        const statusClass = this.getStatusClass(record.status);
        const statusIcon = this.getStatusIcon(record.status);
        
        return `
            <tr class="attendance-row" data-id="${record.id}">
                <td class="time-cell">
                    <div class="time-primary">${formattedTime}</div>
                    ${record.session?.startAt ? `
                        <div class="time-secondary">
                            Sessão: ${new Date(record.session.startAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    ` : ''}
                </td>
                
                <td class="student-cell">
                    <div class="student-info">
                        <div class="student-name">${record.student?.name || 'N/A'}</div>
                        <div class="student-belt">${record.student?.belt || 'Sem graduação'}</div>
                    </div>
                </td>
                
                <td class="course-cell">
                    <div class="course-name">${record.session?.course?.name || 'N/A'}</div>
                </td>
                
                <td class="session-cell">
                    <div class="session-info">
                        <div class="session-type">${record.session?.type || 'Aula'}</div>
                        ${record.session?.instructor ? `
                            <div class="session-instructor">👨‍🏫 ${record.session.instructor.name}</div>
                        ` : ''}
                    </div>
                </td>
                
                <td class="status-cell">
                    <span class="status-badge ${statusClass}">
                        ${statusIcon} ${this.getStatusText(record.status)}
                    </span>
                </td>
                
                <td class="device-cell">
                    <div class="device-info">
                        <div class="device-type">${this.getDeviceIcon(record.context?.device)} ${record.context?.device || 'Desktop'}</div>
                        ${record.context?.trigger ? `
                            <div class="device-trigger">${record.context.trigger === 'auto' ? '🤖 Auto' : '👋 Manual'}</div>
                        ` : ''}
                    </div>
                </td>
                
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="viewAttendance('${record.id}')" title="Ver detalhes">
                            👁️
                        </button>
                        ${record.status === 'PENDING' ? `
                            <button class="btn-icon btn-confirm" onclick="confirmAttendance('${record.id}')" title="Confirmar">
                                ✅
                            </button>
                        ` : ''}
                        ${record.canCancel ? `
                            <button class="btn-icon btn-cancel" onclick="cancelAttendance('${record.id}')" title="Cancelar">
                                ❌
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Obter classe CSS do status
     */
    getStatusClass(status) {
        const classes = {
            'CONFIRMED': 'status-confirmed',
            'PENDING': 'status-pending',
            'CANCELLED': 'status-cancelled'
        };
        return classes[status] || 'status-unknown';
    }

    /**
     * Obter ícone do status
     */
    getStatusIcon(status) {
        const icons = {
            'CONFIRMED': '✅',
            'PENDING': '⏳',
            'CANCELLED': '❌'
        };
        return icons[status] || '❓';
    }

    /**
     * Obter texto do status
     */
    getStatusText(status) {
        const texts = {
            'CONFIRMED': 'Confirmado',
            'PENDING': 'Pendente',
            'CANCELLED': 'Cancelado'
        };
        return texts[status] || 'Desconhecido';
    }

    /**
     * Obter ícone do dispositivo
     */
    getDeviceIcon(device) {
        const icons = {
            'mobile': '📱',
            'desktop': '💻',
            'kiosk': '🖥️'
        };
        return icons[device] || '💻';
    }

    /**
     * Renderizar paginação
     */
    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        const pages = [];
        const current = this.currentPage;
        
        // Botão anterior
        if (current > 1) {
            pages.push(`<button class="page-btn" data-page="${current - 1}">« Anterior</button>`);
        }

        // Páginas numeradas (simplificado)
        for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
            const activeClass = i === current ? 'active' : '';
            pages.push(`<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`);
        }

        // Botão próximo
        if (current < totalPages) {
            pages.push(`<button class="page-btn" data-page="${current + 1}">Próximo »</button>`);
        }

        container.innerHTML = `
            <div class="pagination-info">
                Página ${current} de ${totalPages} (${this.filteredData.length} registros)
            </div>
            <div class="pagination-buttons">
                ${pages.join('')}
            </div>
        `;
    }

    /**
     * Bind eventos
     */
    bindEvents() {
        // Filtros
        if (this.options.showFilters) {
            document.getElementById('apply-filters')?.addEventListener('click', () => {
                this.applyFilters();
            });

            document.getElementById('clear-filters')?.addEventListener('click', () => {
                this.clearFilters();
            });

            // Auto-aplicar alguns filtros
            ['filter-student', 'filter-course', 'filter-status'].forEach(id => {
                document.getElementById(id)?.addEventListener('change', () => {
                    this.applyFilters();
                });
            });
        }

        // Paginação
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn') && e.target.dataset.page) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderTable();
            }
        });

        // Export
        document.getElementById('export-attendance')?.addEventListener('click', () => {
            this.exportData();
        });

        // Popular filtros iniciais
        this.populateFilterOptions();
    }

    /**
     * Popular opções dos filtros
     */
    populateFilterOptions() {
        // Estudantes únicos
        const students = [...new Set(this.attendanceData.map(r => r.student).filter(Boolean))]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const studentSelect = document.getElementById('filter-student');
        if (studentSelect) {
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                studentSelect.appendChild(option);
            });
        }

        // Cursos únicos
        const courses = [...new Set(this.attendanceData.map(r => r.session?.course).filter(Boolean))]
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const courseSelect = document.getElementById('filter-course');
        if (courseSelect) {
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        }
    }

    /**
     * Aplicar filtros
     */
    applyFilters() {
        this.currentFilters = this.getFilterValues();
        
        this.filteredData = this.attendanceData.filter(record => {
            // Filtro por estudante
            if (this.currentFilters.student && record.student?.id !== this.currentFilters.student) {
                return false;
            }

            // Filtro por curso
            if (this.currentFilters.course && record.session?.course?.id !== this.currentFilters.course) {
                return false;
            }

            // Filtro por data
            if (this.currentFilters.dateFrom) {
                const recordDate = new Date(record.checkinTime);
                const filterDate = new Date(this.currentFilters.dateFrom);
                if (recordDate < filterDate) return false;
            }

            if (this.currentFilters.dateTo) {
                const recordDate = new Date(record.checkinTime);
                const filterDate = new Date(this.currentFilters.dateTo);
                filterDate.setHours(23, 59, 59);
                if (recordDate > filterDate) return false;
            }

            // Filtro por status
            if (this.currentFilters.status && record.status !== this.currentFilters.status) {
                return false;
            }

            return true;
        });

        // Reset página
        this.currentPage = 1;
        
        // Re-renderizar
        this.renderTable();
    }

    /**
     * Obter valores dos filtros
     */
    getFilterValues() {
        return {
            student: document.getElementById('filter-student')?.value || '',
            course: document.getElementById('filter-course')?.value || '',
            dateFrom: document.getElementById('filter-date-from')?.value || '',
            dateTo: document.getElementById('filter-date-to')?.value || '',
            status: document.getElementById('filter-status')?.value || ''
        };
    }

    /**
     * Limpar filtros
     */
    clearFilters() {
        document.getElementById('filter-student').value = '';
        document.getElementById('filter-course').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-status').value = '';
        
        this.applyFilters();
    }

    /**
     * Mostrar estado vazio
     */
    showEmptyState() {
        document.getElementById('attendance-table-container').style.display = 'none';
        document.getElementById('pagination')?.style.setProperty('display', 'none');
        document.getElementById('empty-state').style.display = 'flex';
    }

    /**
     * Esconder estado vazio
     */
    hideEmptyState() {
        document.getElementById('attendance-table-container').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
    }

    /**
     * Atualizar estatísticas
     */
    updateStats() {
        const totalEl = document.getElementById('total-records');
        if (totalEl) {
            const total = this.filteredData.length;
            totalEl.textContent = `${total} registro${total !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Exportar dados
     */
    exportData() {
        try {
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `presencas_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            console.log('📥 Attendance data exported');
            
        } catch (error) {
            console.error('Export error:', error);
        }
    }

    /**
     * Gerar CSV
     */
    generateCSV() {
        const headers = ['Data/Hora', 'Aluno', 'Curso', 'Sessão', 'Status', 'Dispositivo'];
        const rows = this.filteredData.map(record => [
            new Date(record.checkinTime).toLocaleString('pt-BR'),
            record.student?.name || '',
            record.session?.course?.name || '',
            record.session?.type || '',
            this.getStatusText(record.status),
            record.context?.device || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Atualizar dados
     */
    updateData(newData) {
        this.attendanceData = newData;
        this.applyFilters();
        this.populateFilterOptions();
    }

    /**
     * Refresh da lista
     */
    refresh() {
        this.renderTable();
    }
}

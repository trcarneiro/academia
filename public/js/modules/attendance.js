(function() {
    'use strict';
    
    // Module state
    let attendanceData = [];
    let currentFilter = 'all';
    
    // Initialize module on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeAttendanceModule();
    });
    
    // Module initialization
    function initializeAttendanceModule() {
        console.log('📋 Initializing Attendance Module...');
        
        try {
            setupEventListeners();
            
            // Auto-load attendance if container exists
            if (document.getElementById('attendance-container')) {
                loadAttendance();
            }
            
            // Export functions to global scope
            exportGlobalFunctions();
            
        } catch (error) {
            console.error('❌ Error initializing attendance module:', error);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.attendance-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                currentFilter = this.dataset.filter;
                filterAttendanceData();
            });
        });
        
        // Export button
        const exportBtn = document.getElementById('exportAttendanceBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportAttendance);
        }
        
        // Check-in form
        const checkInForm = document.getElementById('checkInForm');
        if (checkInForm) {
            checkInForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleCheckInSubmit();
            });
        }
    }
    
    // ==========================================
    // ATTENDANCE FUNCTIONS
    // ==========================================
    
    function loadAttendance() {
        console.log('📋 Loading attendance data...');
        fetchAttendanceData();
    }
    
    function renderAttendance(attendance) {
        const container = document.getElementById('attendance-container');
        if (!container) {
            console.warn('Attendance container not found');
            return;
        }
        
        if (!attendance || attendance.length === 0) {
            container.innerHTML = `
                <div class="attendance-empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>Nenhum registro de presença</h3>
                    <p>Não há dados de presença para exibir no momento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="attendance-header">
                <h3>📋 Controle de Presença</h3>
                <div class="attendance-filters">
                    <button class="attendance-filter active" data-filter="all">Todos</button>
                    <button class="attendance-filter" data-filter="present">Presentes</button>
                    <button class="attendance-filter" data-filter="absent">Ausentes</button>
                </div>
            </div>
            
            <div class="attendance-table-container">
                <table class="attendance-table">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Data</th>
                            <th>Horário</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-tbody">
                        ${attendance.map(record => `
                            <tr class="attendance-row" data-status="${record.status.toLowerCase()}">
                                <td class="student-name">${record.studentName}</td>
                                <td class="attendance-date">${formatDate(record.date)}</td>
                                <td class="attendance-time">${formatTime(record.date)}</td>
                                <td class="attendance-status">
                                    <span class="status-badge ${record.status.toLowerCase()}">
                                        ${record.status === 'present' ? 'Presente' : 'Ausente'}
                                    </span>
                                </td>
                                <td class="attendance-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="editAttendance('${record.id}')">
                                        ✏️ Editar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="attendance-actions">
                <button class="btn btn-primary" onclick="openCheckInModal()">
                    ➕ Registrar Presença
                </button>
                <button class="btn btn-secondary" onclick="exportAttendance()">
                    📊 Exportar Dados
                </button>
            </div>
        `;
        
        // Store data for filtering
        attendanceData = attendance;
    }
    
    function checkIn(studentId) {
        if (!studentId) {
            const studentIdInput = document.getElementById('studentId');
            studentId = studentIdInput?.value;
        }
        
        if (!studentId) {
            console.warn('No student ID provided for check-in');
            if (typeof showToast === 'function') {
                showToast('Selecione um aluno para registrar presença', 'warning');
            }
            return;
        }
        
        console.log('Check-in for student:', studentId);
        
        const attendanceRecord = {
            studentId: studentId,
            date: new Date().toISOString(),
            status: 'present'
        };
        
        submitAttendance(attendanceRecord);
    }
    
    function openCheckInModal() {
        // This would open a modal or redirect to check-in page
        console.log('Opening check-in interface...');
        
        if (typeof showToast === 'function') {
            showToast('Interface de check-in em desenvolvimento', 'info');
        }
    }
    
    function editAttendance(recordId) {
        console.log('Editing attendance record:', recordId);
        
        if (typeof showToast === 'function') {
            showToast('Edição de presença em desenvolvimento', 'info');
        }
    }
    
    function handleCheckInSubmit() {
        const form = document.getElementById('checkInForm');
        const formData = new FormData(form);
        
        const attendanceRecord = {
            studentId: formData.get('studentId'),
            date: new Date().toISOString(),
            status: 'present',
            notes: formData.get('notes') || ''
        };
        
        submitAttendance(attendanceRecord);
    }
    
    function exportAttendance() {
        console.log('Exporting attendance data...');
        
        if (attendanceData.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nenhum dado para exportar', 'warning');
            }
            return;
        }
        
        // Create CSV content
        const csvContent = generateCSVContent(attendanceData);
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (typeof showToast === 'function') {
            showToast('Dados exportados com sucesso!', 'success');
        }
    }
    
    function generateCSVContent(data) {
        const headers = ['Aluno', 'Data', 'Horário', 'Status', 'Observações'];
        const rows = data.map(record => [
            record.studentName,
            formatDate(record.date),
            formatTime(record.date),
            record.status === 'present' ? 'Presente' : 'Ausente',
            record.notes || ''
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
    
    function filterAttendanceData() {
        const filteredData = currentFilter === 'all' 
            ? attendanceData 
            : attendanceData.filter(record => record.status === currentFilter);
        
        const tbody = document.getElementById('attendance-tbody');
        if (tbody) {
            tbody.innerHTML = filteredData.map(record => `
                <tr class="attendance-row" data-status="${record.status.toLowerCase()}">
                    <td class="student-name">${record.studentName}</td>
                    <td class="attendance-date">${formatDate(record.date)}</td>
                    <td class="attendance-time">${formatTime(record.date)}</td>
                    <td class="attendance-status">
                        <span class="status-badge ${record.status.toLowerCase()}">
                            ${record.status === 'present' ? 'Presente' : 'Ausente'}
                        </span>
                    </td>
                    <td class="attendance-actions">
                        <button class="btn btn-sm btn-secondary" onclick="editAttendance('${record.id}')">
                            ✏️ Editar
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        // Update filter buttons
        document.querySelectorAll('.attendance-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
        });
    }
    
    // ==========================================
    // API FUNCTIONS
    // ==========================================
    
    async function fetchAttendanceData() {
        try {
            const response = await fetch('/api/attendance');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    renderAttendance(data.data);
                } else {
                    console.error('Failed to fetch attendance data:', data.message);
                    showErrorState();
                }
            } else {
                console.error('Attendance API request failed:', response.status);
                showErrorState();
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            
            // Fallback to mock data
            const mockData = [
                { 
                    id: '1',
                    studentName: 'João Silva', 
                    date: '2025-01-15T10:00:00Z', 
                    status: 'present',
                    notes: ''
                },
                { 
                    id: '2',
                    studentName: 'Maria Santos', 
                    date: '2025-01-15T10:05:00Z', 
                    status: 'present',
                    notes: ''
                },
                { 
                    id: '3',
                    studentName: 'Pedro Costa', 
                    date: '2025-01-15T10:10:00Z', 
                    status: 'absent',
                    notes: 'Justificativa médica'
                }
            ];
            
            renderAttendance(mockData);
        }
    }
    
    async function submitAttendance(attendanceRecord) {
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(attendanceRecord)
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('✅ Attendance submitted successfully');
                    
                    if (typeof showToast === 'function') {
                        showToast('Presença registrada com sucesso!', 'success');
                    }
                    
                    // Refresh attendance data
                    loadAttendance();
                } else {
                    console.error('Failed to submit attendance:', result.message);
                    
                    if (typeof showToast === 'function') {
                        showToast('Erro ao registrar presença', 'error');
                    }
                }
            } else {
                console.error('Attendance submission failed:', response.status);
                
                if (typeof showToast === 'function') {
                    showToast('Erro ao registrar presença', 'error');
                }
            }
        } catch (error) {
            console.error('Error submitting attendance:', error);
            
            if (typeof showToast === 'function') {
                showToast('Erro ao registrar presença', 'error');
            }
        }
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    function showErrorState() {
        const container = document.getElementById('attendance-container');
        if (container) {
            container.innerHTML = `
                <div class="attendance-error-state">
                    <div class="error-icon">❌</div>
                    <h3>Erro ao carregar dados</h3>
                    <p>Não foi possível carregar os dados de presença.</p>
                    <button class="btn btn-primary" onclick="loadAttendance()">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
    
    // ==========================================
    // GLOBAL EXPORTS
    // ==========================================
    
    function exportGlobalFunctions() {
        window.loadAttendance = loadAttendance;
        window.renderAttendance = renderAttendance;
        window.checkIn = checkIn;
        window.exportAttendance = exportAttendance;
        window.fetchAttendanceData = fetchAttendanceData;
        window.submitAttendance = submitAttendance;
        window.openCheckInModal = openCheckInModal;
        window.editAttendance = editAttendance;
    }
    
    console.log('📋 Attendance Module loaded');
    
})();
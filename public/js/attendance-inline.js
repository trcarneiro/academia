// ==========================================
// ATTENDANCE SYSTEM - EXTRACTED FROM INDEX.HTML
// ==========================================

// Attendance functions
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
    
    container.innerHTML = `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Data</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${attendance.map(record => `
                    <tr>
                        <td>${record.studentName}</td>
                        <td>${record.date}</td>
                        <td class="status ${record.status.toLowerCase()}">${record.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="attendance-actions">
            <button class="btn btn-primary" onclick="checkIn()">Registrar Presença</button>
            <button class="btn btn-secondary" onclick="exportAttendance()">Exportar Dados</button>
        </div>
    `;
}

function checkIn() {
    const studentId = document.getElementById('studentId')?.value;
    if (studentId) {
        console.log('Check-in for student:', studentId);
        
        const attendanceData = {
            studentId: studentId,
            date: new Date().toISOString(),
            status: 'presente'
        };
        
        submitAttendance(attendanceData);
    } else {
        console.warn('No student ID provided for check-in');
    }
}

function exportAttendance() {
    console.log('Exporting attendance data...');
    
    if (typeof showToast === 'function') {
        showToast('Exportação de presença em desenvolvimento', 'info');
    }
}

async function fetchAttendanceData() {
    try {
        const response = await fetch('/api/attendance');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderAttendance(data.data);
            } else {
                console.error('Failed to fetch attendance data:', data.message);
            }
        } else {
            console.error('Attendance API request failed:', response.status);
        }
    } catch (error) {
        console.error('Error fetching attendance data:', error);
        
        // Fallback to mock data
        const mockData = [
            { studentName: 'João Silva', date: '2025-01-15', status: 'Presente' },
            { studentName: 'Maria Santos', date: '2025-01-15', status: 'Presente' },
            { studentName: 'Pedro Costa', date: '2025-01-15', status: 'Ausente' }
        ];
        
        renderAttendance(mockData);
    }
}

async function submitAttendance(attendanceData) {
    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attendanceData)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('✅ Attendance submitted successfully');
                
                if (typeof showToast === 'function') {
                    showToast('Presença registrada com sucesso!', 'success');
                }
                
                loadAttendance();
            } else {
                console.error('Failed to submit attendance:', result.message);
            }
        } else {
            console.error('Attendance submission failed:', response.status);
        }
    } catch (error) {
        console.error('Error submitting attendance:', error);
        
        if (typeof showToast === 'function') {
            showToast('Erro ao registrar presença', 'error');
        }
    }
}

// Global exports
window.loadAttendance = loadAttendance;
window.renderAttendance = renderAttendance;
window.checkIn = checkIn;
window.exportAttendance = exportAttendance;
window.fetchAttendanceData = fetchAttendanceData;
window.submitAttendance = submitAttendance;

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Attendance system loaded');
    
    if (document.getElementById('attendance-container')) {
        loadAttendance();
    }
});

console.log('📋 Attendance inline system initialized');
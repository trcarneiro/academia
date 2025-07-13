// public/js/attendance.js

// ========================================
// Functions for Attendance Tracking
// ========================================

export function loadAttendance() {
    console.log('loadAttendance called');
    // Mock data for attendance
    const attendance = [
        { studentName: 'João da Silva', date: '2024-07-15', status: 'Presente' },
        { studentName: 'Maria Oliveira', date: '2024-07-15', status: 'Ausente' }
    ];
    renderAttendance(attendance);
}

export function renderAttendance(attendance) {
    console.log('renderAttendance called with:', attendance);
    const container = document.getElementById('attendance-container');
    if (!container) {
        console.error('Attendance container not found');
        return;
    }
    container.innerHTML = `
        <table>
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
                        <td>${record.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <button onclick="checkIn()">Registrar Presença</button>
    `;
}

export function checkIn() {
    const studentId = prompt("ID do Aluno para Check-in:");
    if (studentId) {
        console.log(`Checking in student ${studentId}`);
        // In a real app, make API call here
        alert('Presença registrada com sucesso!');
        loadAttendance(); // Refresh the attendance list
    }
}

// This file contains functions to render the UI for the "turmas" module, including displaying class schedules and attendance information.

async function renderClassSchedules(schedules) {
    const container = document.getElementById('class-schedule-container');
    container.innerHTML = '';

    if (schedules.length === 0) {
        container.innerHTML = '<p>No class schedules available.</p>';
        return;
    }

    schedules.forEach(schedule => {
        const scheduleCard = document.createElement('div');
        scheduleCard.className = 'class-schedule-card';
        scheduleCard.innerHTML = `
            <h3>${schedule.title}</h3>
            <p>Date: ${new Date(schedule.date).toLocaleDateString()}</p>
            <p>Type: ${schedule.type}</p>
            <p>Attendance: ${schedule.attendance ? 'Tracked' : 'Not Tracked'}</p>
        `;
        container.appendChild(scheduleCard);
    });
}

async function renderAttendanceInfo(attendanceData) {
    const attendanceContainer = document.getElementById('attendance-info-container');
    attendanceContainer.innerHTML = '';

    if (attendanceData.length === 0) {
        attendanceContainer.innerHTML = '<p>No attendance records available.</p>';
        return;
    }

    attendanceData.forEach(record => {
        const recordItem = document.createElement('div');
        recordItem.className = 'attendance-record';
        recordItem.innerHTML = `
            <p>Student: ${record.studentName}</p>
            <p>Class: ${record.classTitle}</p>
            <p>Status: ${record.status}</p>
        `;
        attendanceContainer.appendChild(recordItem);
    });
}

export { renderClassSchedules, renderAttendanceInfo };
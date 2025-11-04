import { createElement } from 'some-ui-library'; // Replace with actual UI library if needed

export function TurmasComponent({ classData, onAttendanceTrack }) {
    const component = createElement('div', { className: 'turmas-component' });

    classData.forEach((turma) => {
        const classCard = createElement('div', { className: 'class-card' });
        const classTitle = createElement('h3', { className: 'class-title' }, turma.title);
        const classDate = createElement('p', { className: 'class-date' }, `Date: ${turma.date}`);
        const attendanceButton = createElement('button', {
            className: 'attendance-button',
            onclick: () => onAttendanceTrack(turma.id),
        }, 'Track Attendance');

        classCard.appendChild(classTitle);
        classCard.appendChild(classDate);
        classCard.appendChild(attendanceButton);
        component.appendChild(classCard);
    });

    return component;
}
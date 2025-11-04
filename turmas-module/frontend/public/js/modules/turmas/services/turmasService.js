export class TurmasService {
    constructor() {
        this.apiEndpoint = '/api/turmas';
    }

    async fetchClassSchedules(startDate) {
        return await fetchWithStates(`${this.apiEndpoint}/schedules?startDate=${startDate}`, {
            loadingElement: document.getElementById('container'),
            onSuccess: (data) => data,
            onEmpty: () => [],
            onError: (error) => {
                window.app.handleError(error, 'fetchClassSchedules');
            }
        });
    }

    async trackAttendance(classId, studentId, positionExecuted) {
        return await fetchWithStates(`${this.apiEndpoint}/attendance`, {
            method: 'POST',
            body: JSON.stringify({ classId, studentId, positionExecuted }),
            loadingElement: document.getElementById('container'),
            onSuccess: (data) => data,
            onEmpty: () => [],
            onError: (error) => {
                window.app.handleError(error, 'trackAttendance');
            }
        });
    }

    async createCollectiveClass(classData) {
        return await fetchWithStates(`${this.apiEndpoint}/collective`, {
            method: 'POST',
            body: JSON.stringify(classData),
            loadingElement: document.getElementById('container'),
            onSuccess: (data) => data,
            onEmpty: () => [],
            onError: (error) => {
                window.app.handleError(error, 'createCollectiveClass');
            }
        });
    }

    async createPrivateClass(classData) {
        return await fetchWithStates(`${this.apiEndpoint}/private`, {
            method: 'POST',
            body: JSON.stringify(classData),
            loadingElement: document.getElementById('container'),
            onSuccess: (data) => data,
            onEmpty: () => [],
            onError: (error) => {
                window.app.handleError(error, 'createPrivateClass');
            }
        });
    }
}
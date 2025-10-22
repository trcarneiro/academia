/**
 * AttendanceService.js
 * Handles attendance recording and history
 */

class AttendanceService {
    constructor(moduleAPI) {
        this.moduleAPI = moduleAPI;
    }

    /**
     * Complete check-in for student in course
     * @param {Object} data - { studentId, courseId, method }
     * @returns {Promise<Object>} Attendance record
     */
    async completeCheckin(data) {
        try {
            console.log('📍 Recording attendance...');

            const payload = {
                studentId: data.studentId,
                courseId: data.courseId || data.classId,
                method: data.method || 'biometric',
                faceConfidence: data.faceConfidence || 0,
                timestamp: new Date().toISOString(),
            };

            const response = await this.moduleAPI.request('/api/checkin', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (response.success) {
                console.log('✅ Attendance recorded');
            }

            return response;
        } catch (error) {
            console.error('Error completing checkin:', error);
            throw error;
        }
    }

    /**
     * Get today's attendance history
     * @returns {Promise<Array>} Attendance records
     */
    async getTodayHistory() {
        try {
            const response = await this.moduleAPI.request('/api/checkin/today', {
                method: 'GET',
            });

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching history:', error);
            return [];
        }
    }

    /**
     * Format attendance record for display
     * @param {Object} record - Attendance record
     * @returns {string} Formatted string
     */
    formatRecord(record) {
        const time = new Date(record.timestamp).toLocaleTimeString('pt-BR');
        return `${time} - ${record.studentName} (${record.courseName})`;
    }

    /**
     * Group records by time
     * @param {Array} records - Attendance records
     * @returns {Object} Grouped records
     */
    groupByTime(records) {
        const grouped = {};

        records.forEach((record) => {
            const hour = new Date(record.timestamp).getHours();
            const key = `${hour}:00`;

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(record);
        });

        return grouped;
    }

    /**
     * Get attendance statistics for today
     * @param {Array} records - Attendance records
     * @returns {Object} Statistics
     */
    getStatistics(records) {
        return {
            totalCheckins: records.length,
            biometricCount: records.filter((r) => r.method === 'biometric').length,
            manualCount: records.filter((r) => r.method === 'manual').length,
            averageConfidence:
                records.reduce((sum, r) => sum + (r.faceConfidence || 0), 0) /
                Math.max(1, records.length),
        };
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttendanceService;
}


export interface ScheduleSlot {
    dayOfWeek: number;
    startTime: string;
    duration: number;
}

/**
 * Normalizes different schedule formats into a standard array of slots.
 * Formats supported:
 * 1. Array of slots: [{ dayOfWeek: 2, startTime: "18:00", duration: 60 }, ...]
 * 2. Single object: { daysOfWeek: [2, 4], time: "18:00", duration: 60 }
 * 3. Single object (alt): { days: [2, 4], startTime: "18:00", duration: 60 }
 */
export function normalizeSchedule(schedule: any): ScheduleSlot[] {
    if (!schedule) return [];

    let scheduleData = schedule;
    if (typeof schedule === 'string') {
        try {
            scheduleData = JSON.parse(schedule);
        } catch (e) {
            return [];
        }
    }

    if (Array.isArray(scheduleData)) {
        return scheduleData.map(slot => ({
            dayOfWeek: Number(slot.dayOfWeek),
            startTime: slot.startTime || "00:00",
            duration: slot.duration || 60
        }));
    }

    if (scheduleData && typeof scheduleData === 'object') {
        const days = scheduleData.days || scheduleData.daysOfWeek || [];
        const startTime = scheduleData.startTime || scheduleData.time;
        const duration = scheduleData.duration || 60;

        if (Array.isArray(days) && startTime) {
            return days.map(day => ({
                dayOfWeek: Number(day),
                startTime: startTime,
                duration: duration
            }));
        }
    }

    return [];
}

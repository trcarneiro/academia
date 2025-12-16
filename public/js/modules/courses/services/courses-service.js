/**
 * Courses Service
 * Handles all API interactions for the Courses module
 * Follows the API Client pattern from AGENTS.md
 */
export class CoursesService {
    constructor() {
        this.moduleAPI = null;
    }

    /**
     * Initialize the API client
     * Must be called before any other methods
     */
    async init() {
        await this.waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('Courses');
    }

    /**
     * Wait for the global API client to be available
     */
    waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) return resolve();
            const check = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * Fetch all courses with automatic UI state management
     * @param {Object} options - Options for fetchWithStates (loadingElement, onSuccess, etc.)
     */
    async getAll(options) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.fetchWithStates('/api/courses', options);
    }

    /**
     * Get a single course by ID
     * @param {string} id 
     */
    async getById(id) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/courses/${id}`);
    }

    /**
     * Create a new course
     * @param {Object} data 
     */
    async create(data) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request('/api/courses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update an existing course
     * @param {string} id 
     * @param {Object} data 
     */
    async update(id, data) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete a course
     * @param {string} id 
     */
    async delete(id) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/courses/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Get techniques associated with a course
     * @param {string} courseId 
     */
    async getCourseTechniques(courseId) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/courses/${courseId}/techniques`);
    }

    /**
     * Save techniques for a course
     * @param {string} courseId 
     * @param {Array} techniques - Array of technique objects
     */
    async saveCourseTechniques(courseId, techniques) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/courses/${courseId}/techniques`, {
            method: 'POST',
            body: JSON.stringify({
                replace: true,
                techniques: techniques.map((t, index) => ({
                    id: t.technique?.id || t.id, // Handle both raw technique and courseTechnique structure
                    orderIndex: index + 1,
                    isRequired: true
                }))
            })
        });
    }

    /**
     * Search for techniques
     * @param {string} query 
     */
    async searchTechniques(query) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/techniques/search?q=${encodeURIComponent(query)}`);
    }

    // --- Lesson Plans ---

    /**
     * Get lesson plans for a course
     * @param {string} courseId 
     */
    async getLessonPlans(courseId) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/lesson-plans?courseId=${courseId}&pageSize=100`);
    }

    /**
     * Create a lesson plan
     * @param {Object} data 
     */
    async createLessonPlan(data) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request('/api/lesson-plans', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update a lesson plan
     * @param {string} id 
     * @param {Object} data 
     */
    async updateLessonPlan(id, data) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/lesson-plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete a lesson plan
     * @param {string} id 
     */
    async deleteLessonPlan(id) {
        if (!this.moduleAPI) await this.init();
        return this.moduleAPI.request(`/api/lesson-plans/${id}`, {
            method: 'DELETE'
        });
    }
}

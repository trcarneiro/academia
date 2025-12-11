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
        return this.moduleAPI.request(\/api/courses/\\);
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
        return this.moduleAPI.request(\/api/courses/\\, {
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
        return this.moduleAPI.request(\/api/courses/\\, {
            method: 'DELETE'
        });
    }
}

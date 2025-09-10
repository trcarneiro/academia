// Courses Service - AGENTS.md v2.0 Compliant
// API-First service for course management

class CoursesService {
    constructor() {
        this.api = null;
        this.cache = new Map();
        this.init();
    }

    async init() {
        // AGENTS.md: Use centralized API client
        this.api = window.createModuleAPI('Courses');
        if (!this.api) {
            throw new Error('API Client not available - check AcademyApp initialization');
        }
    }

    /**
     * Get all courses - AGENTS.md fetchWithStates pattern
     */
    async getCourses(options = {}) {
        const {
            targetElement,
            onSuccess,
            onEmpty,
            onError,
            useCache = true
        } = options;

        // Check cache first
        if (useCache && this.cache.has('courses')) {
            const cached = this.cache.get('courses');
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
                if (onSuccess) onSuccess(cached.data);
                return cached.data;
            }
        }

        return this.api.fetchWithStates('/api/courses', {
            targetElement,
            onSuccess: (data) => {
                // Cache result
                this.cache.set('courses', {
                    data,
                    timestamp: Date.now()
                });
                if (onSuccess) onSuccess(data);
            },
            onEmpty,
            onError
        });
    }

    /**
     * Get course by ID
     */
    async getCourseById(id, options = {}) {
        const {
            targetElement,
            onSuccess,
            onError
        } = options;

        return this.api.fetchWithStates(`/api/courses/${id}`, {
            targetElement,
            onSuccess,
            onError
        });
    }

    /**
     * Create new course
     */
    async createCourse(courseData, options = {}) {
        const {
            targetElement,
            onSuccess,
            onError
        } = options;

        // Clear cache
        this.cache.delete('courses');

        return this.api.request('/api/courses', {
            method: 'POST',
            body: JSON.stringify(courseData),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (onSuccess) onSuccess(response);
            return response;
        }).catch(error => {
            if (onError) onError(error);
            throw error;
        });
    }

    /**
     * Update course
     */
    async updateCourse(id, courseData, options = {}) {
        const {
            targetElement,
            onSuccess,
            onError
        } = options;

        // Clear cache
        this.cache.delete('courses');

        return this.api.request(`/api/courses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(courseData),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (onSuccess) onSuccess(response);
            return response;
        }).catch(error => {
            if (onError) onError(error);
            throw error;
        });
    }

    /**
     * Delete course
     */
    async deleteCourse(id, options = {}) {
        const {
            onSuccess,
            onError
        } = options;

        // Clear cache
        this.cache.delete('courses');

        return this.api.request(`/api/courses/${id}`, {
            method: 'DELETE'
        }).then(response => {
            if (onSuccess) onSuccess(response);
            return response;
        }).catch(error => {
            if (onError) onError(error);
            throw error;
        });
    }

    /**
     * Import course from file
     */
    async importCourse(formData, options = {}) {
        const {
            targetElement,
            onSuccess,
            onError
        } = options;

        // Clear cache
        this.cache.delete('courses');

        return this.api.request('/api/courses/import', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (onSuccess) onSuccess(response);
            return response;
        }).catch(error => {
            if (onError) onError(error);
            throw error;
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
const coursesService = new CoursesService();
export default coursesService;

// Make available globally for other modules
window.coursesService = coursesService;

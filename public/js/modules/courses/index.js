// Courses Module - Main Entry Point
// Follows AGENTS.md v2.0 - Full compliance with AcademyApp integration

const CoursesModule = {
    name: 'courses',
    version: '2.0.0',
    description: 'Course management module - AGENTS.md compliant',
    isInitialized: false,

    /**
     * Initialize the courses module - AGENTS.md compliance
     */
    async init() {
        console.log('📚 Initializing Courses Module...');

        if (this.isInitialized) {
            console.log('📚 Courses Module already initialized');
            return;
        }

        try {
            // AGENTS.md: Register module globally
            window.coursesModule = this;

            // AGENTS.md: Initialize API client
            this.api = window.createModuleAPI('Courses');
            if (!this.api) {
                throw new Error('API Client not available - check AcademyApp initialization');
            }

            // AGENTS.md: Load services and controllers
            await this.loadServices();
            await this.loadControllers();

            // AGENTS.md: Setup routes and features
            this.setupRoutes();
            this.setupFeatures();

            // AGENTS.md: Load module CSS
            this.loadModuleCSS();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ Courses Module initialized successfully');

            // AGENTS.md: Dispatch module loaded event
            if (window.app && window.app.dispatchEvent) {
                window.app.dispatchEvent('module:loaded', {
                    name: 'courses',
                    module: this
                });
            }

        } catch (error) {
            console.error('❌ Failed to initialize Courses Module:', error);
            
            // AGENTS.md: Use app error handling
            if (window.app && window.app.handleError) {
                window.app.handleError(error, 'Initializing Courses Module');
            }
        }
    },

    /**
     * Load services - AGENTS.md pattern
     */
    async loadServices() {
        try {
            // Import courses service
            const serviceModule = await import('./services/courses-service.js');
            this.coursesService = serviceModule.default;
            console.log('📦 Courses service loaded');
        } catch (error) {
            console.error('Failed to load courses service:', error);
            throw error;
        }
    },

    /**
     * Load controllers - AGENTS.md pattern
     */
    async loadControllers() {
        try {
            // Import main controller (auto-initializes via DOM ready)
            await import('./controllers/coursesController.js');
            
            // Import course details controller for details view
            await import('./controllers/course-details-controller.js');
            
            console.log('🎮 Courses controllers loaded');
        } catch (error) {
            console.error('Failed to load courses controllers:', error);
            throw error;
        }
    },

    /**
     * Load module CSS - AGENTS.md pattern
     */
    loadModuleCSS() {
        // Load main courses CSS
        const existingLink = document.querySelector('link[href*="courses.css"]');
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/modules/courses.css';
            document.head.appendChild(link);
            console.log('🎨 Courses CSS loaded');
        }

        // Load courses premium CSS (with modal styles)
        const existingPremiumLink = document.querySelector('link[href*="courses-premium.css"]');
        if (!existingPremiumLink) {
            const premiumLink = document.createElement('link');
            premiumLink.rel = 'stylesheet';
            premiumLink.href = '/css/modules/courses-premium.css';
            document.head.appendChild(premiumLink);
            console.log('🎨 Courses Premium CSS loaded');
        }

        // Load course details CSS
        const existingDetailsLink = document.querySelector('link[href*="course-details.css"]');
        if (!existingDetailsLink) {
            const detailsLink = document.createElement('link');
            detailsLink.rel = 'stylesheet';
            detailsLink.href = '/css/modules/course-details.css';
            document.head.appendChild(detailsLink);
            console.log('🎨 Course Details CSS loaded');
        }
    },

    /**
     * Setup module routes - AGENTS.md compliance
     */
    setupRoutes() {
        console.log('🔗 Setting up courses routes...');
        // Setup hash routing for courses
    },

    /**
     * Setup module features - AGENTS.md compliance
     */
    setupFeatures() {
        console.log('🚀 Setting up courses features...');
        // Initialize courses page if currently viewing
        this.initializeIfOnCoursesPage();
    },

    /**
     * Initialize if on courses page - AGENTS.md pattern
     */
    async initializeIfOnCoursesPage() {
        const currentRoute = window.location.hash;
        
        if (currentRoute.includes('courses') || currentRoute.includes('curso')) {
            console.log('📚 On courses page - initializing...');
            
            try {
                await this.loadCourses();
            } catch (error) {
                console.error('Failed to load courses on page:', error);
            }
        }
    },

    /**
     * Load courses - AGENTS.md fetchWithStates pattern
     */
    async loadCourses(options = {}) {
        try {
            // Use the service for consistent API calls
            if (this.coursesService) {
                return await this.coursesService.getCourses(options);
            } else {
                // Fallback to direct API call
                return await this.api.fetchWithStates('/api/courses', {
                    onSuccess: (data) => {
                        console.log(`📚 Loaded ${data.length} courses`);
                    },
                    onEmpty: () => console.log('📭 No courses found'),
                    onError: (error) => console.error('❌ Error loading courses:', error),
                    ...options
                });
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            throw error;
        }
    },

    /**
     * Navigation helpers - AGENTS.md patterns
     */
    navigateToCourses() {
        window.location.hash = 'courses';
    },

    /**
     * Navigate to course form - AGENTS.md pattern
     */
    navigateToCourseForm(courseId = null) {
        if (courseId) {
            window.location.hash = `course-editor/${courseId}`;
        } else {
            window.location.hash = 'course-editor';
        }
    },

    /**
     * Navigate to course details - AGENTS.md pattern
     */
    navigateToCourseDetails(courseId) {
        if (!courseId) {
            console.error('Course ID required for navigation');
            return;
        }
        window.location.hash = `course-details/${courseId}`;
    },

    /**
     * Public API for other modules - AGENTS.md
     */
    async getCourses() {
        return this.coursesService?.getCourses();
    },

    async getCourseById(id) {
        return this.coursesService?.getCourseById(id);
    },

    // Module health check
    isReady() {
        return this.isInitialized && this.api !== null;
    }
};

// AGENTS.md: Auto-initialize when module is loaded
CoursesModule.init();


// AGENTS.md: Export for global access
window.coursesModule = CoursesModule;


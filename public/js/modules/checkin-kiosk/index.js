/**
 * /public/js/modules/checkin-kiosk/index.js
 * CheckinKiosk Module - Entry Point
 * 
 * Features:
 * - Face detection + recognition (face-api.js)
 * - Live camera feed with face overlay
 * - Biometric matching against student database
 * - Manual search fallback
 * - Today's attendance history
 * - Premium UI with full-screen design
 */

if (typeof window.CheckinKiosk !== 'undefined') {
    console.log('⚠️ CheckinKiosk module already loaded');
} else {

const CheckinKiosk = {
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    container: null,
    controller: null,
    moduleAPI: null,
    isInitialized: false,

    // ========================================================================
    // LIFECYCLE
    // ========================================================================

    /**
     * Initialize module
     */
    async init(containerId = 'app-container') {
        try {
            console.log('🚀 Initializing CheckinKiosk module...');

            // 1. Get container
            this.container = document.getElementById(containerId);
            if (!this.container) {
                throw new Error(`Container #${containerId} not found`);
            }

            // 2. Wait for API client
            await this.initializeAPI();

            // 2.1 Load CSS
            this.loadCSS();

            // 3. Initialize controller
            this.controller = new CheckinController(this.container, this.moduleAPI);
            await this.controller.init();

            // 4. Mark as initialized
            this.isInitialized = true;

            // 5. Register globally
            window.CheckinKiosk = this;

            // 6. Dispatch module loaded event
            window.app?.dispatchEvent('module:loaded', { name: 'CheckinKiosk' });

            console.log('✅ CheckinKiosk initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing CheckinKiosk:', error);
            window.app?.handleError(error, { 
                module: 'CheckinKiosk', 
                context: 'init',
                fatal: true 
            });
            throw error;
        }
    },

    /**
     * Initialize API client
     */
    async initializeAPI() {
        console.log('⏳ Waiting for API client...');

        // Wait for global API client
        let attempts = 0;
        while (!window.createModuleAPI && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.createModuleAPI) {
            throw new Error('API client not available');
        }

        this.moduleAPI = window.createModuleAPI('CheckinKiosk');
        console.log('✅ API client initialized');
    },

    loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/css/modules/checkin-kiosk-v3.css';
        document.head.appendChild(link);
    },

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Reset to camera view
     */
    reset() {
        if (this.controller) {
            this.controller.reset();
        }
    },

    /**
     * Stop camera and detection
     */
    stop() {
        if (this.controller) {
            this.controller.stopDetection();
            this.controller.cameraService.stopCamera();
        }
    },

    /**
     * Resume camera and detection
     */
    resume() {
        if (this.controller && !this.controller.detectionRunning) {
            this.controller.startDetection();
        }
    },

    /**
     * Get current state
     */
    getState() {
        return this.controller?.state || 'UNKNOWN';
    },

    /**
     * Destroy module
     */
    destroy() {
        try {
            if (this.controller) {
                this.controller.destroy();
            }
            this.isInitialized = false;
            console.log('✅ CheckinKiosk destroyed');
        } catch (error) {
            console.error('Error destroying CheckinKiosk:', error);
        }
    },

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Handle app focus
     */
    onFocus() {
        this.resume();
    },

    /**
     * Handle app blur
     */
    onBlur() {
        this.stop();
    },

    /**
     * Handle window resize
     */
    onResize() {
        // Responsive behavior
        if (this.controller?.cameraView) {
            // Could adjust camera constraints here if needed
        }
    },

    // ========================================================================
    // DEBUGGING
    // ========================================================================

    /**
     * Get debug info
     */
    debug() {
        return {
            initialized: this.isInitialized,
            state: this.getState(),
            cameraRunning: this.controller?.cameraService?.isActive(),
            detectionRunning: this.controller?.detectionRunning,
            currentMatch: this.controller?.currentMatch,
        };
    },

    /**
     * Test face detection (for debugging)
     */
    async testFaceDetection() {
        if (!this.controller?.cameraService.isActive()) {
            console.error('Camera not running');
            return;
        }

        const canvas = this.controller.cameraService.captureFrame();
        if (!canvas) {
            console.error('Failed to capture frame');
            return;
        }

        const face = await this.controller.faceService.detectFace(canvas);
        console.log('Face detection result:', face);
        return face;
    },
};

// ============================================================================
// MODULE REGISTRATION
// ============================================================================

window.CheckinKiosk = CheckinKiosk;

// Auto-register with AcademyApp
if (window.app && typeof window.app.registerModule === 'function') {
    window.app.registerModule('CheckinKiosk', CheckinKiosk);
}

console.log('📦 CheckinKiosk module loaded (awaiting init call)');

} // end if

/**
 * CheckinController.js
 * Main orchestrator for checkin kiosk
 * Manages: Camera, Face detection, Confirmation, Attendance
 */

class CheckinController {
    constructor(container, moduleAPI) {
        this.container = container;
        this.moduleAPI = moduleAPI;

        // Services
        this.faceService = new FaceRecognitionService();
        this.cameraService = new CameraService();
        this.biometricService = new BiometricService(moduleAPI);
        this.attendanceService = new AttendanceService(moduleAPI);

        // Views
        this.cameraView = null;
        this.confirmationView = null;
        this.successView = null;

        // State
        this.state = 'IDLE'; // IDLE, DETECTING, CONFIRMING, SUCCESS
        this.currentMatch = null;
        this.detectionRunning = false;
        this.detectionTimeout = null;
    }

    /**
     * Initialize controller
     */
    async init() {
        try {
            console.log('🚀 Initializing CheckinController...');

            // 1. Load face-api models
            await this.faceService.init();

            // 2. Load students cache for autocomplete (PRIORITY!)
            console.log('📥 Pre-loading students for instant search...');
            await this.biometricService.loadStudentsCache();

            // 3. Setup camera view
            this.cameraView = new CameraView(this.container, {
                onManualSearch: (query) => this.handleManualSearch(query),
                onAutocomplete: (query) => this.handleAutocomplete(query),
                onStudentSelect: (student) => this.showConfirmation(student), // NOVO: vai direto para dashboard
            });

            // 4. Render camera view
            this.renderCameraView();

            // 5. Get video element and start camera
            const videoElement = this.container.querySelector('#checkin-video');
            try {
                await this.cameraService.startCamera(videoElement);
                
                // 6. Start face detection loop (only if camera is available)
                this.startDetection();
                console.log('✅ Camera started, face detection active');
            } catch (cameraError) {
                console.warn('⚠️ Camera not available, continuing with manual search only');
                console.log('📝 Manual search is still functional');
                
                // Show friendly message instead of error
                const cameraSection = this.container.querySelector('.camera-section');
                if (cameraSection) {
                    cameraSection.innerHTML = `
                        <div class="no-camera-message">
                            <i class="fas fa-video-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                            <h3 style="color: #64748b; margin-bottom: 0.5rem;">Câmera não disponível</h3>
                            <p style="color: #94a3b8;">Use a busca manual abaixo para fazer check-in</p>
                        </div>
                    `;
                }
            }

            // 7. Load and display today's history (always do this)
            await this.loadAndDisplayHistory();

            console.log('✅ CheckinController initialized');
        } catch (error) {
            console.error('❌ Error initializing controller:', error);
            
            // Show error with retry option
            this.cameraView?.showError(error.message, async () => {
                console.log('🔄 Retrying initialization...');
                await this.init(); // Retry
            });
            
            window.app?.handleError(error, { module: 'CheckinKiosk', context: 'init' });
        }
    }

    /**
     * Render camera view
     */
    renderCameraView() {
        this.cameraView.render();
        this.state = 'IDLE';
    }

    /**
     * Start continuous face detection
     */
    startDetection() {
        if (this.detectionRunning) {
            console.warn('Detection already running');
            return;
        }

        this.detectionRunning = true;
        console.log('🎬 Starting face detection...');

        this.cameraService.detectContinuous(async (canvas) => {
            await this.processFaceFrame(canvas);
        }, 500); // 500ms interval = 2fps for efficiency
    }

    /**
     * Stop face detection
     */
    stopDetection() {
        this.cameraService.stopDetection();
        this.detectionRunning = false;

        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
        }

        console.log('🛑 Face detection stopped');
    }

    /**
     * Process each frame for face detection
     */
    async processFaceFrame(canvas) {
        if (this.state !== 'IDLE' || !this.detectionRunning) {
            return;
        }

        try {
            // 1. Detect face in frame
            const face = await this.faceService.detectFace(canvas);

            // 2. Update UI
            this.cameraView.updateDetectionStatus(face);

            if (!face) {
                this.currentMatch = null;
                return;
            }

            // 3. Check quality threshold
            const quality = this.faceService.getQualityScore(face);
            if (quality < 50) {
                return; // Poor quality, keep trying
            }

            // 4. Try to find matching student
            const match = await this.faceService.findMatch(face.descriptor, this.moduleAPI, 0.65);

            if (match && (!this.currentMatch || match.studentId !== this.currentMatch.studentId)) {
                // 5. New match found!
                this.currentMatch = match;
                this.cameraView.showMatch(match);

                console.log(`🎯 Match found: ${match.name} (${match.similarity}%)`);

                // 6. Log attempt
                await this.biometricService.logAttempt({
                    studentId: match.studentId,
                    success: true,
                    similarity: match.similarity,
                });

                // 7. Show confirmation screen
                await this.showConfirmation(match);
            }
        } catch (error) {
            console.error('Error processing frame:', error);
        }
    }

    /**
     * Show confirmation screen after face match or manual selection
     */
    async showConfirmation(match) {
        try {
            this.state = 'CONFIRMING';
            this.stopDetection();

            console.log('📋 Showing confirmation screen...');

            // 1. Fetch student details with subscriptions
            const studentResponse = await this.moduleAPI.request(
                `/api/students/${match.studentId}`,
                { method: 'GET' }
            );

            if (!studentResponse.success) {
                throw new Error('Failed to fetch student details');
            }

            const student = studentResponse.data;

            // 2. Fetch available courses
            const coursesResponse = await this.moduleAPI.request(
                `/api/students/${match.studentId}/available-courses`,
                { method: 'GET' }
            );

            const courses = coursesResponse.success ? coursesResponse.data : [];

            // 3. Render confirmation view with REAL data
            this.confirmationView = new ConfirmationView(this.container, {
                onConfirm: (courseId) => this.completeCheckin(match.studentId, courseId),
                onReject: () => this.rejectMatch(),
            });

            this.confirmationView.render(
                student, // Pass full student object
                courses.map((c) => ({
                    id: c.id,
                    name: c.name,
                    time: c.startTime || 'Horário flexível',
                    instructor: c.instructorName || 'A definir',
                }))
            );
        } catch (error) {
            console.error('Error showing confirmation:', error);
            this.handleConfirmationError(error);
        }
    }

    /**
     * Complete check-in after course selection
     */
    async completeCheckin(studentId, courseId) {
        try {
            this.confirmationView?.showConfirmLoading();
            this.confirmationView?.disable();

            console.log('📍 Completing check-in...');

            // 1. Record attendance
            const response = await this.attendanceService.completeCheckin({
                studentId: studentId,
                courseId: courseId,
                method: 'biometric',
                faceConfidence: this.currentMatch?.similarity || 0,
            });

            if (!response.success) {
                throw new Error(response.message || 'Failed to record attendance');
            }

            // 2. Show success screen
            this.state = 'SUCCESS';
            this.successView = new SuccessView(this.container, {
                onReset: () => this.reset(),
            });

            const student = await this.biometricService.getStudentDetails(studentId);
            const course = await this.getCourseDetails(courseId);

            this.successView.render({
                studentName: student.name,
                courseName: course.name,
                timestamp: new Date().toISOString(),
            });

            console.log('✅ Check-in completed');

            // 3. Refresh history
            await this.loadAndDisplayHistory();
        } catch (error) {
            console.error('Error completing check-in:', error);
            this.successView?.showError({ message: error.message });
            window.app?.handleError(error, { module: 'CheckinKiosk', context: 'completeCheckin' });
        }
    }

    /**
     * Reject match and go back to camera
     */
    rejectMatch() {
        console.log('❌ Match rejected by user');
        this.currentMatch = null;
        this.state = 'IDLE';
        this.renderCameraView();
        this.startDetection();
    }

    /**
     * Handle autocomplete suggestions
     */
    async handleAutocomplete(query) {
        try {
            console.log(`🔍 Autocomplete for: "${query}"`);
            
            // Use the same search method
            const results = await this.biometricService.searchManual(query);
            
            console.log(`📊 Autocomplete results: ${results.length} found`);
            
            return results;
        } catch (error) {
            console.error('❌ Autocomplete error:', error);
            return [];
        }
    }

    /**
     * Handle manual search
     */
    async handleManualSearch(query) {
        try {
            this.cameraView?.disable();

            console.log(`🔍 Manual search: ${query}`);

            // 1. Search students
            const results = await this.biometricService.searchManual(query);

            if (results.length === 0) {
                this.cameraView?.enable();
                alert('Nenhum aluno encontrado');
                return;
            }

            // 2. If single result, show confirmation
            if (results.length === 1) {
                const student = results[0];
                const match = {
                    studentId: student.id,
                    name: student.name,
                    similarity: 100,
                    photoUrl: student.facePhotoUrl,
                };

                await this.showConfirmation(match);
            } else {
                // 3. Multiple results - show selection
                this.showSelectionList(results);
            }
        } catch (error) {
            console.error('Error in manual search:', error);
            this.cameraView?.enable();
        }
    }

    /**
     * Show selection list for multiple results
     */
    showSelectionList(students) {
        const listHTML = students
            .map(
                (s) => `
            <div class="student-option" data-student-id="${s.id}">
                <div class="student-name">${s.name}</div>
                <div class="student-matric">📋 ${s.matricula || s.id}</div>
            </div>
        `
            )
            .join('');

        this.container.innerHTML = `
            <div class="module-header-premium">
                <h1>👥 SELECIONE O ALUNO</h1>
            </div>
            <div class="student-list">
                ${listHTML}
            </div>
            <button class="btn-secondary" onclick="window.CheckinKiosk.controller.cancel()">
                Cancelar
            </button>
        `;

        // Add click listeners
        students.forEach((s) => {
            this.container.querySelector(`[data-student-id="${s.id}"]`)?.addEventListener('click', async () => {
                const match = {
                    studentId: s.id,
                    name: s.name,
                    similarity: 100,
                    photoUrl: s.facePhotoUrl,
                };
                await this.showConfirmation(match);
            });
        });
    }

    /**
     * Load and display today's history
     */
    async loadAndDisplayHistory() {
        try {
            const history = await this.attendanceService.getTodayHistory();
            this.cameraView?.updateHistory(history);
        } catch (error) {
            console.warn('Error loading history:', error);
        }
    }

    /**
     * Get course details by ID
     */
    async getCourseDetails(courseId) {
        try {
            const response = await this.moduleAPI.request(`/api/courses/${courseId}`, {
                method: 'GET',
            });

            if (response.success) {
                return response.data;
            }

            return { name: 'Desconhecido' };
        } catch (error) {
            console.error('Error fetching course:', error);
            return { name: 'Desconhecido' };
        }
    }

    /**
     * Handle confirmation error
     */
    handleConfirmationError(error) {
        this.state = 'IDLE';
        this.cameraView?.showError(error.message);
        setTimeout(() => {
            this.renderCameraView();
            this.startDetection();
        }, 3000);
    }

    /**
     * Reset to initial state
     */
    reset() {
        console.log('🔄 Resetting to camera view...');
        this.state = 'IDLE';
        this.currentMatch = null;
        this.renderCameraView();
        this.startDetection();
    }

    /**
     * Cancel current operation
     */
    cancel() {
        this.reset();
    }

    /**
     * Cleanup on destroy
     */
    destroy() {
        this.stopDetection();
        this.cameraService.stopCamera();
        console.log('🛑 Controller destroyed');
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CheckinController;
}

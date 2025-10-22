/**
 * CameraService.js
 * Manages camera access, video streaming, and frame capture
 * Handles: getUserMedia, frame capture, continuous detection loop, error handling
 */

class CameraService {
    constructor() {
        this.videoElement = null;
        this.stream = null;
        this.isRunning = false;
        this.frameInterval = null;
        this.frameRate = 30; // FPS for detection loop
    }

    /**
     * Request camera access and start video stream
     * @param {HTMLVideoElement} videoElement - Video element to display stream
     * @returns {Promise<void>}
     */
    async startCamera(videoElement) {
        if (this.isRunning) {
            console.log('⚠️ Camera already running');
            return;
        }

        this.videoElement = videoElement;

        try {
            console.log('📷 Requesting camera access...');
            console.log(`🌐 User Agent: ${navigator.userAgent}`);

            // Detect platform
            const isAndroid = /Android/.test(navigator.userAgent);
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
            const isMobile = isAndroid || isIOS;
            const platform = isAndroid ? 'Android' : isIOS ? 'iOS' : 'Desktop';

            console.log(`📱 Platform: ${platform}`);
            console.log(`✅ mediaDevices API available: ${!!navigator.mediaDevices?.getUserMedia}`);

            // Verify API exists
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('🚨 getUserMedia API não disponível neste navegador.\n\nUse um navegador moderno com suporte a câmera (Chrome, Firefox, Edge, Safari).');
            }

            // Build constraints based on platform
            const videoConstraints = {
                facingMode: 'user', // Front camera
            };

            // Mobile optimization
            if (isMobile) {
                console.log('📱 Using mobile camera constraints...');
                videoConstraints.width = { ideal: 640, max: 1280 };
                videoConstraints.height = { ideal: 480, max: 720 };
                // Try to enable autofocus via advanced
                videoConstraints.advanced = [{ focusMode: 'continuous' }, { focusMode: 'auto' }];
            } else {
                console.log('💻 Using desktop camera constraints...');
                videoConstraints.width = { ideal: 1280 };
                videoConstraints.height = { ideal: 720 };
            }

            // Try multiple constraint combinations - MOST PERMISSIVE FIRST
            let stream = null;
            const constraintVariants = [
                // 1. Any video (most permissive - Android fallback)
                { video: true, audio: false },
                // 2. Simplified constraints for mobile
                { video: { facingMode: 'user' }, audio: false },
                // 3. Full constraints with size limits
                { video: videoConstraints, audio: false },
                // 4. Without facingMode (some devices don't support)
                { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
            ];

            let lastError = null;
            for (let i = 0; i < constraintVariants.length; i++) {
                const constraints = constraintVariants[i];
                try {
                    console.log(`🔄 [${i + 1}/${constraintVariants.length}] Tentando constraints:`, JSON.stringify(constraints));
                    
                    // Set timeout for getUserMedia
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error(`getUserMedia timeout após 10s com variante ${i + 1}`)), 10000);
                    });
                    
                    stream = await Promise.race([
                        navigator.mediaDevices.getUserMedia(constraints),
                        timeoutPromise
                    ]);
                    
                    console.log(`✅ Camera acessada com sucesso (variante ${i + 1}):`, JSON.stringify(constraints));
                    break;
                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️ [${i + 1}/${constraintVariants.length}] Falhou:`, error.name, error.message);
                    
                    // Log specific Android-related issues
                    if (isAndroid && error.name === 'NotReadableError') {
                        console.error('🤖 Android NotReadableError - câmera pode estar em uso por outro app');
                    }
                    if (isAndroid && error.name === 'NotAllowedError') {
                        console.error('🤖 Android NotAllowedError - permissão negada pelo usuário');
                    }
                }
            }

            if (!stream) {
                console.error('❌ Todas as variantes de constraint falharam!');
                throw lastError || new Error('Não foi possível acessar câmera com nenhuma configuração');
            }

            this.stream = stream;
            console.log(`📊 Stream obtido com resolução:`, {
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length,
            });

            // Attach stream to video element
            this.videoElement.srcObject = this.stream;
            console.log('📺 Stream anexado ao elemento video');

            // Add necessary attributes for iOS
            this.videoElement.setAttribute('playsinline', 'true');
            this.videoElement.setAttribute('webkit-playsinline', 'true');
            this.videoElement.setAttribute('crossorigin', 'anonymous');
            this.videoElement.setAttribute('muted', 'true');

            // Wait for video to load metadata and start playing
            console.log('⏳ Aguardando metadata do video...');
            await new Promise((resolve, reject) => {
                const onLoadedMetadata = () => {
                    console.log('✅ Metadata carregado');
                    this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.videoElement.play()
                        .then(() => {
                            console.log('▶️ Video iniciando playback');
                            resolve();
                        })
                        .catch((playError) => {
                            console.warn('⚠️ Erro ao fazer play (mas continuando):', playError.name, playError.message);
                            resolve(); // Resolve anyway - some mobile browsers auto-play
                        });
                };

                const onError = () => {
                    console.error('❌ Erro ao carregar video');
                    this.videoElement.removeEventListener('error', onError);
                    this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    reject(new Error('Erro ao carregar stream de video'));
                };

                this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
                this.videoElement.addEventListener('error', onError);

                // Timeout safety - 10s para Android poder processar
                setTimeout(() => {
                    this.videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    this.videoElement.removeEventListener('error', onError);
                    reject(new Error('⏱️ Timeout - câmera demorou mais de 10s para responder. Pode ser um problema de hardware ou permissão.'));
                }, 10000);
            });

            this.isRunning = true;
            console.log('✅ Câmera iniciada com sucesso!');
            console.log(`📐 Resolução final: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
        } catch (error) {
            console.error('❌ Erro ao acessar câmera:', error.name, error.message);
            console.error('📋 Stack:', error.stack);

            // Provide user-friendly error messages with more details
            let userMessage = 'Câmera não disponível';
            let detailMessage = '';

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                userMessage = 'Permissão de câmera negada';
                detailMessage = '\n\n📱 Android: Configurações > Apps > Navegador > Permissões > Câmera\n\n🍎 iOS: Configurações > Navegador > Câmera';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                userMessage = 'Nenhuma câmera encontrada';
                detailMessage = '\n\n🔍 Use a busca manual abaixo para fazer check-in sem câmera.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                userMessage = 'Câmera em uso ou indisponível';
                detailMessage = '\n\n• Feche outros apps usando câmera\n• Reinicie o navegador\n• Verifique conexão de rede se for remoto';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintError') {
                userMessage = 'Câmera incompatível com este navegador';
                detailMessage = '\n\nTentando fallback automático... Se persistir, use outro navegador.';
            } else if (error.message.includes('timeout')) {
                userMessage = 'Câmera respondeu muito lentamente';
                detailMessage = '\n\n• Verifique permissões\n• Feche outros apps\n• Tente novamente em alguns segundos';
            } else if (error.message.includes('getUserMedia API')) {
                userMessage = 'Navegador não suporta câmera';
                detailMessage = '\n\nUse: Chrome, Firefox, Edge, Safari (iOS 11+)';
            }

            throw new Error(userMessage + detailMessage);
        }
    }

    /**
     * Capture current video frame as canvas
     * @returns {HTMLCanvasElement|null} Canvas with current frame
     */
    captureFrame() {
        if (!this.videoElement || this.videoElement.videoWidth === 0) {
            return null;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Failed to get 2D context');
                return null;
            }

            // Draw current video frame
            ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

            return canvas;
        } catch (error) {
            console.error('Error capturing frame:', error);
            return null;
        }
    }

    /**
     * Start continuous face detection loop
     * @param {Function} callback - Callback function that receives canvas frame
     * @param {number} interval - Interval in milliseconds (default: 33ms for 30fps)
     * @returns {void}
     */
    async detectContinuous(callback, interval = null) {
        if (!this.isRunning) {
            throw new Error('Camera not running. Call startCamera() first.');
        }

        if (this.frameInterval) {
            console.warn('Detection loop already running');
            return;
        }

        // Calculate interval from frame rate if not provided
        const detectionInterval = interval || Math.round(1000 / this.frameRate);

        console.log(`🎬 Starting continuous detection at ${this.frameRate}fps`);

        this.frameInterval = setInterval(async () => {
            if (!this.isRunning) {
                this.stopDetection();
                return;
            }

            try {
                const canvas = this.captureFrame();
                if (canvas) {
                    await callback(canvas);
                }
            } catch (error) {
                console.error('Error in detection loop:', error);
            }
        }, detectionInterval);
    }

    /**
     * Stop continuous detection loop (but keep camera running)
     * @returns {void}
     */
    stopDetection() {
        if (this.frameInterval) {
            clearInterval(this.frameInterval);
            this.frameInterval = null;
            console.log('🛑 Detection loop stopped');
        }
    }

    /**
     * Stop camera and cleanup resources
     * @returns {void}
     */
    stopCamera() {
        // Stop detection loop first
        this.stopDetection();

        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach((track) => {
                track.stop();
            });
            this.stream = null;
        }

        // Clear video source
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }

        this.isRunning = false;
        console.log('🛑 Camera stopped and resources cleaned up');
    }

    /**
     * Check if camera is currently running
     * @returns {boolean}
     */
    isActive() {
        return this.isRunning;
    }

    /**
     * Get current video dimensions
     * @returns {Object|null} { width, height }
     */
    getVideoDimensions() {
        if (!this.videoElement) return null;

        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
        };
    }

    /**
     * Set frame rate for detection loop
     * @param {number} fps - Frames per second (1-60)
     */
    setFrameRate(fps) {
        if (fps < 1 || fps > 60) {
            console.warn('Frame rate must be between 1-60');
            return;
        }
        this.frameRate = fps;
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraService;
}

/**
 * FaceRecognitionService.js
 * Face detection and matching using face-api.js
 * Handles: Face detection, embedding extraction, matching against database
 */

// Cache configuration
const EMBEDDINGS_CACHE_TTL = 60000; // 60 seconds cache for embeddings
const EMPTY_CACHE_TTL = 300000;     // 5 minutes cache for empty results (avoid hammering server)
const MIN_REQUEST_INTERVAL = 1000;  // Minimum 1 second between API calls

class FaceRecognitionService {
    constructor() {
        this.isReady = false;
        this.modelsReady = false;
        // Use CDN models path instead of local (faster + reliable)
        this.modelsPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        // Embeddings cache to avoid repeated API calls
        this._embeddingsCache = null;
        this._embeddingsCacheTime = 0;
        this._embeddingsRequestInProgress = null; // Track in-flight requests
        this._lastRequestTime = 0;
        this._emptyResultCached = false; // Track if we got empty results
        this._emptyResultTime = 0;
    }

    /**
     * Initialize and load all required models
     */
    async init() {
        if (this.isReady) {
            console.log('✅ Face-api already initialized');
            return;
        }

        try {
            console.log('📦 Loading face-api.js models from CDN...');

            // Ensure face-api is available
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded. Add <script src="/vendor/face-api.min.js"></script>');
            }

            // Load all required models from CDN
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath),
                faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath),
            ]);

            this.modelsReady = true;
            this.isReady = true;
            console.log('✅ Face-api models loaded successfully from CDN');
        } catch (error) {
            console.error('❌ Error loading face-api models:', error);
            throw new Error(`Face-api initialization failed: ${error.message}`);
        }
    }

    /**
     * Pre-load embeddings cache for faster first match
     * Call this during initialization
     * @param {Object} moduleAPI - API client
     */
    async preloadEmbeddings(moduleAPI) {
        try {
            console.log('📥 Pre-loading face embeddings...');
            await this._fetchEmbeddings(moduleAPI);
        } catch (error) {
            console.warn('⚠️ Could not preload embeddings:', error.message);
        }
    }

    /**
     * Detect a single face in canvas
     * @param {HTMLCanvasElement} canvas - Canvas element with image
     * @returns {Object|null} Face detection object with box, landmarks, descriptor, confidence
     */
    async detectFace(canvas) {
        if (!this.isReady) {
            throw new Error('FaceRecognitionService not initialized. Call init() first.');
        }

        try {
            const detections = await faceapi
                .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                return null;
            }

            return {
                box: detections.detection.box,
                landmarks: detections.landmarks,
                descriptor: detections.descriptor,
                confidence: detections.detection.score,
            };
        } catch (error) {
            console.error('Error detecting face:', error);
            return null;
        }
    }

    /**
     * Find matching student by face descriptor
     * @param {Float32Array} faceDescriptor - Face embedding vector
     * @param {Object} moduleAPI - API client
     * @param {number} threshold - Similarity threshold (0-1, default 0.60)
     * @returns {Object|null} Match object with studentId, name, similarity, photoUrl
     */
    async findMatch(faceDescriptor, moduleAPI, threshold = 0.60) {
        try {
            // 1. Get embeddings (with caching and request deduplication)
            const embeddings = await this._getEmbeddingsWithCache(moduleAPI);

            if (!embeddings || embeddings.length === 0) {
                // Only log occasionally to avoid console spam
                if (!this._lastNoEmbeddingsLog || Date.now() - this._lastNoEmbeddingsLog > 5000) {
                    console.warn('⚠️ No embeddings found in database');
                    this._lastNoEmbeddingsLog = Date.now();
                }
                return null;
            }

            // 2. Compare with all embeddings (local operation, fast)
            let bestMatch = null;
            let bestDistance = Infinity;

            for (const embed of embeddings) {
                try {
                    // Convert embedding array back to Float32Array
                    const embeddingVector = new Float32Array(embed.embedding);

                    // Calculate Euclidean distance
                    const distance = faceapi.euclideanDistance(
                        faceDescriptor,
                        embeddingVector
                    );

                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = embed;
                    }
                } catch (err) {
                    // Silent fail for individual embedding comparison
                    continue;
                }
            }

            // 3. Check if best match exceeds threshold
            // Distance is in range 0-128, convert to similarity 0-1
            const similarity = Math.max(0, 1 - (bestDistance / 128));

            if (similarity >= threshold) {
                console.log(`🎯 Match: ${bestMatch?.name} (${Math.round(similarity * 100)}%)`);
                return {
                    studentId: bestMatch.studentId, // Use studentId from API response
                    name: bestMatch.name,
                    similarity: Math.round(similarity * 100),
                    photoUrl: bestMatch.facePhotoUrl,
                    distance: bestDistance,
                };
            }

            // No match - silent return (reduces console noise)
            return null;
        } catch (error) {
            console.error('Error finding match:', error);
            throw error;
        }
    }

    /**
     * Get embeddings with caching and request deduplication
     * Prevents multiple concurrent API calls for the same data
     * @param {Object} moduleAPI - API client
     * @returns {Array|null} Cached or fresh embeddings data
     * @private
     */
    async _getEmbeddingsWithCache(moduleAPI) {
        const now = Date.now();

        // Return cached data if still valid
        if (this._embeddingsCache && (now - this._embeddingsCacheTime) < EMBEDDINGS_CACHE_TTL) {
            return this._embeddingsCache;
        }

        // If we know embeddings are empty, don't keep hitting the server
        if (this._emptyResultCached && (now - this._emptyResultTime) < EMPTY_CACHE_TTL) {
            return []; // Return empty, no need to fetch again
        }

        // If a request is already in progress, wait for it instead of making a new one
        if (this._embeddingsRequestInProgress) {
            return this._embeddingsRequestInProgress;
        }

        // Throttle requests - minimum interval between API calls
        if ((now - this._lastRequestTime) < MIN_REQUEST_INTERVAL) {
            return this._embeddingsCache || []; // Return stale cache or empty
        }

        // Make the request and track it
        this._lastRequestTime = now;
        this._embeddingsRequestInProgress = this._fetchEmbeddings(moduleAPI);

        try {
            const result = await this._embeddingsRequestInProgress;
            return result;
        } finally {
            this._embeddingsRequestInProgress = null;
        }
    }

    /**
     * Fetch embeddings from API
     * @param {Object} moduleAPI - API client
     * @returns {Array|null} Embeddings data
     * @private
     */
    async _fetchEmbeddings(moduleAPI) {
        try {
            console.log('🔍 Fetching face embeddings from server...');

            // Use extended timeout for embeddings (can be large payload)
            const response = await moduleAPI.request('/api/biometric/students/embeddings', {
                method: 'GET',
                timeout: 30000, // 30 seconds - embeddings can be large
                retries: 1,    // Only 1 retry to avoid cascade
            });

            if (!response.success || !response.data) {
                // Mark as empty result to avoid hammering server
                this._emptyResultCached = true;
                this._emptyResultTime = Date.now();
                console.warn('⚠️ No face embeddings registered. Face recognition disabled until students register their faces.');
                return [];
            }

            // Check if result is empty
            if (response.data.length === 0) {
                this._emptyResultCached = true;
                this._emptyResultTime = Date.now();
                console.warn('⚠️ No face embeddings registered. Face recognition disabled until students register their faces.');
                return [];
            }

            // Cache the successful response
            this._embeddingsCache = response.data;
            this._embeddingsCacheTime = Date.now();
            this._emptyResultCached = false; // Clear empty flag

            console.log(`✅ Cached ${response.data.length} embeddings`);
            return response.data;
        } catch (error) {
            console.error('Error fetching embeddings:', error);
            // On error, set empty cache to avoid hammering a broken endpoint
            this._emptyResultCached = true;
            this._emptyResultTime = Date.now();
            // Return stale cache on error if available
            return this._embeddingsCache || [];
        }
    }

    /**
     * Force refresh the embeddings cache
     * Call this after a new student face is registered
     */
    invalidateCache() {
        this._embeddingsCache = null;
        this._embeddingsCacheTime = 0;
        this._emptyResultCached = false;
        this._emptyResultTime = 0;
        console.log('🔄 Embeddings cache invalidated');
    }

    /**
     * Save face embedding for a student
     * @param {string} studentId - Student ID
     * @param {HTMLCanvasElement} canvas - Canvas with face photo
     * @param {Object} moduleAPI - API client
     * @returns {Object} API response
     */
    async saveEmbedding(studentId, canvas, moduleAPI) {
        try {
            console.log('💾 Extracting face embedding...');

            // 1. Detect face in canvas
            const detections = await faceapi
                .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                throw new Error('No face detected in image');
            }

            // 2. Convert descriptor to array
            const embedding = Array.from(detections.descriptor);

            // 3. Get JPEG version of canvas as photo
            const photoUrl = canvas.toDataURL('image/jpeg', 0.9);

            console.log('📤 Uploading embedding to server...');

            // 4. Save to database via API
            const response = await moduleAPI.request(
                `/api/biometric/students/${studentId}/face-embedding`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        embedding: embedding,
                        photoUrl: photoUrl,
                    }),
                }
            );

            if (response.success) {
                console.log('✅ Face embedding saved successfully');
            } else {
                throw new Error(response.message || 'Failed to save embedding');
            }

            return response;
        } catch (error) {
            console.error('Error saving embedding:', error);
            throw error;
        }
    }

    /**
     * Get quality score for detected face (0-100)
     * @param {Object} face - Face detection object
     * @returns {number} Quality score
     */
    getQualityScore(face) {
        if (!face) return 0;

        // Confidence score (0-1) * 100
        const confidence = Math.round(face.confidence * 100);

        // Check face box size (should be reasonable)
        const boxArea = face.box.width * face.box.height;
        const sizeScore = Math.min(100, (boxArea / 10000) * 100);

        // Combined score (weighted average)
        return Math.round((confidence * 0.7 + sizeScore * 0.3));
    }

    /**
     * Normalize similarity score for display
     * @param {number} similarity - Raw similarity (0-1)
     * @returns {number} Display score (0-100)
     */
    normalizeSimilarity(similarity) {
        return Math.round(similarity * 100);
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaceRecognitionService;
}

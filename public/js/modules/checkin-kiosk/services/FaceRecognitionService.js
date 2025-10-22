/**
 * FaceRecognitionService.js
 * Face detection and matching using face-api.js
 * Handles: Face detection, embedding extraction, matching against database
 */

class FaceRecognitionService {
    constructor() {
        this.isReady = false;
        this.modelsReady = false;
        // Use CDN models path instead of local (faster + reliable)
        this.modelsPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
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
     * @param {number} threshold - Similarity threshold (0-1, default 0.65)
     * @returns {Object|null} Match object with studentId, name, similarity, photoUrl
     */
    async findMatch(faceDescriptor, moduleAPI, threshold = 0.65) {
        try {
            console.log('🔍 Searching for matching face...');

            // 1. Fetch all embeddings from database
            const response = await moduleAPI.request('/api/biometric/students/embeddings', {
                method: 'GET',
            });

            if (!response.success || !response.data || response.data.length === 0) {
                console.warn('No embeddings found in database');
                return null;
            }

            // 2. Compare with all embeddings
            let bestMatch = null;
            let bestDistance = Infinity;

            for (const embed of response.data) {
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
                    console.warn('Error comparing embedding:', err);
                    continue;
                }
            }

            // 3. Check if best match exceeds threshold
            // Distance is in range 0-128, convert to similarity 0-1
            const similarity = Math.max(0, 1 - (bestDistance / 128));

            console.log(`🎯 Best match: ${bestMatch?.name} (similarity: ${similarity.toFixed(2)})`);

            if (similarity >= threshold) {
                return {
                    studentId: bestMatch.id,
                    name: bestMatch.name,
                    similarity: Math.round(similarity * 100),
                    photoUrl: bestMatch.facePhotoUrl,
                    distance: bestDistance,
                };
            }

            console.warn(`❌ No match found above threshold (${threshold})`);
            return null;
        } catch (error) {
            console.error('Error finding match:', error);
            throw error;
        }
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

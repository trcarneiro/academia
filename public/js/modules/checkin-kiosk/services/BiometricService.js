/**
 * BiometricService.js
 * Handles biometric data operations, matching, and audit logging
 * Includes: Face matching, attempt logging, manual search fallback
 */

class BiometricService {
    constructor(moduleAPI) {
        this.moduleAPI = moduleAPI;
        this.studentsCache = []; // Cache completo para autocomplete
        this.cacheLoaded = false;
    }

    /**
     * Load ALL students for autocomplete (called on init)
     * @returns {Promise<void>}
     */
    async loadStudentsCache() {
        try {
            console.log('📥 Loading students cache for autocomplete...');
            
            const response = await this.moduleAPI.request('/api/students', {
                method: 'GET',
            });

            if (response.success && response.data) {
                // Store basic info for fast search
                this.studentsCache = response.data.map(student => ({
                    id: student.id,
                    name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Sem nome',
                    firstName: student.user?.firstName || '',
                    lastName: student.user?.lastName || '',
                    matricula: student.registrationNumber || '',
                    cpf: student.cpf || student.user?.cpf || '',
                    email: student.user?.email || '',
                    avatarUrl: student.user?.avatarUrl || '',
                }));
                
                this.cacheLoaded = true;
                console.log(`✅ Loaded ${this.studentsCache.length} students for autocomplete`);
            } else {
                console.warn('⚠️ Failed to load students cache');
            }
        } catch (error) {
            console.error('❌ Error loading students cache:', error);
        }
    }

    /**
     * Log biometric recognition attempt
     * @param {Object} data - { studentId, success, similarity, timestamp }
     * @returns {Promise<Object>} API response
     */
    async logAttempt(data) {
        try {
            const payload = {
                studentId: data.studentId,
                success: data.success,
                similarity: data.similarity || 0,
                timestamp: new Date().toISOString(),
            };

            const response = await this.moduleAPI.request('/api/biometric/attempts', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            console.log('📝 Biometric attempt logged');
            return response;
        } catch (error) {
            console.error('Error logging biometric attempt:', error);
            // Don't throw - logging failure shouldn't block checkin
            return { success: false };
        }
    }

    /**
     * Manual search fallback - LOCAL AUTOCOMPLETE (instant!)
     * @param {string} query - Search term (name, matrícula, CPF)
     * @returns {Promise<Array>} Matching students
     */
    async searchManual(query) {
        try {
            if (!query || query.trim().length < 2) {
                console.warn('⚠️ Query muito curto, precisa de pelo menos 2 caracteres');
                return [];
            }

            // Se cache não carregou, carregar agora
            if (!this.cacheLoaded) {
                await this.loadStudentsCache();
            }

            const queryLower = query.toLowerCase().trim();
            console.log(`� Searching locally for: "${query}"`);

            // Busca LOCAL - instantânea!
            const results = this.studentsCache.filter(student => {
                const nameMatch = student.name.toLowerCase().includes(queryLower);
                const firstNameMatch = student.firstName.toLowerCase().includes(queryLower);
                const lastNameMatch = student.lastName.toLowerCase().includes(queryLower);
                const matriculaMatch = student.matricula && student.matricula.toLowerCase().includes(queryLower);
                const cpfMatch = student.cpf && student.cpf.replace(/\D/g, '').includes(queryLower.replace(/\D/g, ''));
                
                return nameMatch || firstNameMatch || lastNameMatch || matriculaMatch || cpfMatch;
            });
            
            console.log(`✅ Found ${results.length} results locally:`, results.slice(0, 5).map(r => r.name));
            return results;
        } catch (error) {
            console.error('❌ Error searching students:', error);
            return [];
        }
    }

    /**
     * Get FULL student details (called when student is selected)
     * @param {string} studentId - Student UUID
     * @returns {Promise<Object>} Full student data
     */
    async getStudentDetails(studentId) {
        try {
            console.log(`📋 Fetching full details for student: ${studentId}`);
            
            const response = await this.moduleAPI.request(`/api/students/${studentId}`, {
                method: 'GET',
            });

            if (response.success && response.data) {
                console.log('✅ Full student data loaded');
                return response.data;
            }

            console.warn('⚠️ Failed to load student details');
            return null;
        } catch (error) {
            console.error('❌ Error fetching student details:', error);
            return null;
        }
    }

    /**
     * Get today's checkins
     * @returns {Promise<Array>} Checkin history
     */
    async getTodayCheckins() {
        try {
            const response = await this.moduleAPI.request('/api/checkin/today', {
                method: 'GET',
            });

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching today checkins:', error);
            return [];
        }
    }

    /**
     * Get eligible courses for a student
     * @param {string} studentId - Student ID
     * @returns {Promise<Array>} Available courses today
     */
    async getStudentCourses(studentId) {
        try {
            const response = await this.moduleAPI.request(
                `/api/students/${studentId}/available-courses`,
                {
                    method: 'GET',
                }
            );

            if (response.success && response.data) {
                return response.data;
            }

            return [];
        } catch (error) {
            console.error('Error fetching student courses:', error);
            return [];
        }
    }

    /**
     * Get student details (name, photo, plans)
     * @param {string} studentId - Student ID
     * @returns {Promise<Object>} Student data
     */
    async getStudentDetails(studentId) {
        try {
            const response = await this.moduleAPI.request(`/api/students/${studentId}`, {
                method: 'GET',
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Student not found');
        } catch (error) {
            console.error('Error fetching student details:', error);
            throw error;
        }
    }

    /**
     * Calculate biometric confidence score
     * @param {number} similarity - Similarity percentage (0-100)
     * @returns {Object} { level, message, color }
     */
    getConfidenceLevel(similarity) {
        if (similarity >= 90) {
            return {
                level: 'EXCELLENT',
                message: '✅ Identificação excelente',
                color: '#00d084',
            };
        }
        if (similarity >= 80) {
            return {
                level: 'GOOD',
                message: '✅ Identificação boa',
                color: '#00d084',
            };
        }
        if (similarity >= 70) {
            return {
                level: 'FAIR',
                message: '⚠️ Identificação aceitável',
                color: '#f4a740',
            };
        }
        if (similarity >= 60) {
            return {
                level: 'POOR',
                message: '❌ Identificação fraca',
                color: '#e63946',
            };
        }

        return {
            level: 'FAILED',
            message: '❌ Não identificado',
            color: '#e63946',
        };
    }

    /**
     * Validate biometric match quality
     * @param {Object} match - Match object from FaceRecognitionService
     * @returns {Object} Validation result
     */
    validateMatch(match) {
        if (!match) {
            return {
                valid: false,
                reason: 'No match found',
            };
        }

        if (match.similarity < 60) {
            return {
                valid: false,
                reason: 'Similarity too low',
            };
        }

        if (!match.studentId || !match.name) {
            return {
                valid: false,
                reason: 'Invalid match data',
            };
        }

        return {
            valid: true,
            match: match,
        };
    }

    /**
     * Check daily attempt rate (prevent brute force)
     * @param {string} studentId - Student ID
     * @returns {Promise<Object>} Rate limit info
     */
    async checkAttemptRate(studentId) {
        try {
            // This would normally check database
            // For now, client-side implementation
            const key = `biometric_attempts_${studentId}`;
            const now = Date.now();
            const attempts = JSON.parse(localStorage.getItem(key) || '[]');

            // Remove attempts older than 1 minute
            const recentAttempts = attempts.filter((t) => now - t < 60000);

            if (recentAttempts.length >= 5) {
                return {
                    allowed: false,
                    reason: 'Too many attempts. Please try again in a moment.',
                    remainingTime: 60,
                };
            }

            return { allowed: true };
        } catch (error) {
            console.error('Error checking attempt rate:', error);
            return { allowed: true }; // Don't block on error
        }
    }

    /**
     * Record attempt attempt (for rate limiting)
     * @param {string} studentId - Student ID
     */
    recordAttempt(studentId) {
        try {
            const key = `biometric_attempts_${studentId}`;
            const attempts = JSON.parse(localStorage.getItem(key) || '[]');
            attempts.push(Date.now());
            localStorage.setItem(key, JSON.stringify(attempts));
        } catch (error) {
            console.error('Error recording attempt:', error);
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiometricService;
}

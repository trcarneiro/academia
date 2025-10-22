/**
 * BiometricService.js
 * Handles biometric data operations, matching, and audit logging
 * Includes: Face matching, attempt logging, manual search fallback
 */

class BiometricService {
    constructor(moduleAPI) {
        this.moduleAPI = moduleAPI;
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
     * Manual search fallback
     * @param {string} query - Search term (name, matrícula, CPF)
     * @returns {Promise<Array>} Matching students
     */
    async searchManual(query) {
        try {
            if (!query || query.trim().length < 2) {
                console.warn('⚠️ Query muito curto, precisa de pelo menos 2 caracteres');
                return [];
            }

            console.log(`🔍 Searching for: "${query}"`);

            // Busca pelo endpoint correto com query parameter na URL
            const response = await this.moduleAPI.request(`/api/students?search=${encodeURIComponent(query)}`, {
                method: 'GET',
            });

            console.log('📊 Search response:', response);

            if (response.success && response.data) {
                const results = Array.isArray(response.data) ? response.data : [response.data];
                
                // Map student data to expected format with user info
                const formattedResults = results.map(student => ({
                    id: student.id,
                    name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Sem nome',
                    firstName: student.user?.firstName || '',
                    lastName: student.user?.lastName || '',
                    cpf: student.user?.cpf || '',
                    matricula: student.registrationNumber || student.user?.cpf || '',
                    email: student.user?.email || '',
                    phone: student.user?.phone || '',
                    ...student
                }));
                
                console.log(`✅ Found ${formattedResults.length} results:`, formattedResults.map(r => r.name));
                return formattedResults;
            }

            console.warn('⚠️ No results found or invalid response format');
            return [];
        } catch (error) {
            console.error('❌ Error searching students:', error);
            return [];
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

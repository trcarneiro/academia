/**
 * AI Generation Service for Lesson Plans
 * 
 * Handles all AI-related operations for generating lesson plans
 * Supports multiple AI providers: Gemini, Anthropic (Claude), OpenAI (GPT-4)
 */

class AIGenerationService {
    constructor(moduleAPI) {
        this.api = moduleAPI;
        this.defaultProvider = 'gemini';
        this.config = this.loadConfiguration();
    }

    /**
     * Generate a single lesson plan
     * @param {string} courseId - Course ID
     * @param {number} lessonNumber - Lesson number (1-based)
     * @param {object} options - Generation options
     * @returns {Promise<object>} Generation result
     */
    async generateSingleLesson(courseId, lessonNumber, options = {}) {
        console.log(`🤖 Generating lesson ${lessonNumber} for course ${courseId}`);
        
        try {
            const requestData = {
                courseId,
                lessonNumber,
                provider: options.provider || this.config.provider || this.defaultProvider,
                useRag: options.useRag !== false,
                includeAdaptations: options.includeAdaptations !== false,
                generateVariations: options.generateVariations || false,
                weekNumber: Math.ceil(lessonNumber / 2)
            };

            const response = await this.api.request('/api/ai/generate-single-lesson', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            if (response.success) {
                console.log(`✅ Lesson ${lessonNumber} generated successfully`);
                return {
                    success: true,
                    lessonNumber,
                    data: response.data,
                    provider: requestData.provider
                };
            } else {
                throw new Error(response.error || 'Failed to generate lesson');
            }
        } catch (error) {
            console.error(`❌ Error generating lesson ${lessonNumber}:`, error);
            return {
                success: false,
                lessonNumber,
                error: error.message
            };
        }
    }

    /**
     * Generate multiple lessons in batch (sequential)
     * @param {string} courseId - Course ID
     * @param {number[]} lessonNumbers - Array of lesson numbers
     * @param {object} options - Generation options
     * @param {function} onProgress - Progress callback (current, total, message)
     * @returns {Promise<object[]>} Array of generation results
     */
    async generateBatchLessons(courseId, lessonNumbers, options = {}, onProgress = null) {
        console.log(`🚀 Batch generation: ${lessonNumbers.length} lessons for course ${courseId}`);
        
        const results = [];
        const total = lessonNumbers.length;
        let completed = 0;

        for (const lessonNumber of lessonNumbers) {
            // Update progress
            if (onProgress) {
                onProgress(completed + 1, total, `Gerando Aula ${lessonNumber}...`);
            }

            // Generate single lesson
            const result = await this.generateSingleLesson(courseId, lessonNumber, options);
            results.push(result);

            completed++;

            // Delay between requests to avoid API rate limits
            if (completed < total) {
                await this.delay(options.delayBetweenRequests || 1000);
            }
        }

        console.log(`✅ Batch generation completed: ${results.filter(r => r.success).length}/${total} successful`);
        return results;
    }

    /**
     * Analyze course and identify missing lesson plans
     * @param {string} courseId - Course ID
     * @returns {Promise<object>} Analysis result with existing and missing plans
     */
    async analyzeCourse(courseId) {
        console.log(`🔍 Analyzing course ${courseId}...`);
        
        try {
            // Get course details
            const courseResponse = await this.api.request(`/api/courses/${courseId}`);
            if (!courseResponse.success) {
                throw new Error('Failed to load course details');
            }
            const course = courseResponse.data;

            // Get existing lesson plans
            const plansResponse = await this.api.request(`/api/lesson-plans?courseId=${courseId}`);
            const existingPlans = plansResponse.success ? plansResponse.data : [];

            // Calculate missing plans
            const totalLessons = course.totalLessons || 24;
            const existingNumbers = existingPlans.map(p => p.lessonNumber).filter(Boolean);
            const missingNumbers = [];

            for (let i = 1; i <= totalLessons; i++) {
                if (!existingNumbers.includes(i)) {
                    missingNumbers.push(i);
                }
            }

            const analysis = {
                course: {
                    id: course.id,
                    name: course.name,
                    totalLessons: totalLessons,
                    level: course.level,
                    duration: course.duration
                },
                existing: {
                    count: existingPlans.length,
                    plans: existingPlans.map(p => ({
                        id: p.id,
                        lessonNumber: p.lessonNumber,
                        title: p.title,
                        weekNumber: p.weekNumber,
                        versions: p.versions?.length || 1
                    }))
                },
                missing: {
                    count: missingNumbers.length,
                    numbers: missingNumbers
                },
                coverage: totalLessons > 0 ? Math.round((existingPlans.length / totalLessons) * 100) : 0
            };

            console.log(`📊 Analysis complete: ${analysis.existing.count}/${totalLessons} plans (${analysis.coverage}% coverage)`);
            return { success: true, data: analysis };

        } catch (error) {
            console.error('❌ Error analyzing course:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get activities count (for synchronization info)
     * @returns {Promise<number>} Activities count
     */
    async getActivitiesCount() {
        try {
            const response = await this.api.request('/api/activities');
            return response.success ? response.data.length : 0;
        } catch (error) {
            console.error('Error getting activities count:', error);
            return 0;
        }
    }

    /**
     * Load configuration from localStorage
     * @returns {object} Configuration object
     */
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('lesson_plans_ai_config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading AI configuration:', error);
        }

        return {
            provider: 'gemini',
            useRag: true,
            includeAdaptations: true,
            generateVariations: false
        };
    }

    /**
     * Save configuration to localStorage
     * @param {object} config - Configuration to save
     */
    saveConfiguration(config) {
        try {
            this.config = { ...this.config, ...config };
            localStorage.setItem('lesson_plans_ai_config', JSON.stringify(this.config));
            console.log('💾 AI configuration saved');
        } catch (error) {
            console.error('Error saving AI configuration:', error);
        }
    }

    /**
     * Delay utility
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get provider display name
     * @param {string} provider - Provider key
     * @returns {string} Display name
     */
    getProviderName(provider) {
        const names = {
            'gemini': 'Google Gemini',
            'anthropic': 'Anthropic (Claude)',
            'openai': 'OpenAI (GPT-4)'
        };
        return names[provider] || provider;
    }

    /**
     * Validate generation options
     * @param {object} options - Options to validate
     * @returns {object} Validated options with defaults
     */
    validateOptions(options = {}) {
        return {
            provider: options.provider || this.config.provider || this.defaultProvider,
            useRag: options.useRag !== false,
            includeAdaptations: options.includeAdaptations !== false,
            generateVariations: options.generateVariations || false,
            delayBetweenRequests: options.delayBetweenRequests || 1000
        };
    }
}

// Export for use in lesson-plans module
window.AIGenerationService = AIGenerationService;

console.log('✅ AI Generation Service loaded');

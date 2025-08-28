/**
 * Course RAG Integration Module
 * Integrates with the existing RAG system to generate lesson plans from course schedules
 */

(function() {
    'use strict';

    console.log('🧠 Course RAG Integration - Starting...');

    // Module state
    let isInitialized = false;
    let ragAPI = null;
    let activitiesAPI = null;
    let lessonPlansAPI = null;

    // Initialize module
    window.initializeCourseRAGIntegration = initializeCourseRAGIntegration;

    async function initializeCourseRAGIntegration() {
        if (isInitialized) {
            console.log('ℹ️ Course RAG Integration already initialized');
            return;
        }

        console.log('🔧 Initializing Course RAG Integration...');

        // Wait for RAG module to be available
        await waitForRAGModule();
        
        // Initialize API clients
        ragAPI = window.createModuleAPI ? window.createModuleAPI('RAG') : null;
        activitiesAPI = window.createModuleAPI ? window.createModuleAPI('Activities') : null;
        lessonPlansAPI = window.createModuleAPI ? window.createModuleAPI('LessonPlans') : null;

        isInitialized = true;
        console.log('✅ Course RAG Integration initialized');
    }

    async function waitForRAGModule() {
        return new Promise((resolve) => {
            const checkRAG = () => {
                if (window.ragModule || window.createModuleAPI) {
                    resolve();
                } else {
                    setTimeout(checkRAG, 100);
                }
            };
            checkRAG();
        });
    }

    /**
     * Main RAG Integration Class
     */
    class CourseRAGIntegration {
        constructor() {
            this.providers = {
                claude: 'Anthropic Claude',
                openai: 'OpenAI GPT',
                gemini: 'Google Gemini'
            };
        }

        /**
         * Generate lesson plans from course data using RAG
         */
        async generateLessonPlansFromCourse(courseId, options = {}) {
            console.log('🚀 Starting RAG lesson plan generation for course:', courseId);

            try {
                // 1. Validate prerequisites
                await this.validatePrerequisites(courseId);

                // 2. Gather course data
                const courseData = await this.gatherCourseData(courseId);
                console.log('📊 Course data gathered:', courseData);

                // 3. Generate plans for each schedule item
                const generatedPlans = await this.generatePlansFromSchedule(courseData, options);

                // 4. Process and save results if not dry run
                if (!options.dryRun) {
                    await this.saveLessonPlans(generatedPlans, courseId, options.replaceExisting);
                }

                return {
                    success: true,
                    plansGenerated: generatedPlans.length,
                    plans: generatedPlans,
                    courseId: courseId
                };

            } catch (error) {
                console.error('❌ Error in RAG lesson plan generation:', error);
                throw error;
            }
        }

        /**
         * Validate that we have all necessary data for generation
         */
        async validatePrerequisites(courseId) {
            const errors = [];

            // Check if course exists
            try {
                const courseResponse = await fetch(`/api/courses/${courseId}`);
                if (!courseResponse.ok) {
                    errors.push('Curso não encontrado');
                }
            } catch (error) {
                errors.push('Erro ao acessar dados do curso');
            }

            // Check if RAG module is available
            if (!window.ragModule && !ragAPI) {
                errors.push('Módulo RAG não disponível');
            }

            if (errors.length > 0) {
                throw new Error(`Pré-requisitos não atendidos: ${errors.join(', ')}`);
            }
        }

        /**
         * Gather all course-related data needed for generation
         */
        async gatherCourseData(courseId) {
            const data = {};

            // Get course basic info
            try {
                const courseResponse = await fetch(`/api/courses/${courseId}`);
                const courseResult = await courseResponse.json();
                data.course = courseResult.data;
            } catch (error) {
                console.warn('Could not load course data:', error);
                data.course = { id: courseId, name: 'Curso Desconhecido' };
            }

            // Get course schedule from UI or stored data
            data.schedule = this.getCurrentScheduleFromUI();

            // Get selected techniques from UI or course data
            data.techniques = await this.getSelectedTechniques(courseId);

            // Get existing lesson plans
            try {
                const plansResponse = await fetch(`/api/lesson-plans?courseId=${courseId}`);
                const plansResult = await plansResponse.json();
                data.existingPlans = plansResult.data || [];
            } catch (error) {
                console.warn('Could not load existing lesson plans:', error);
                data.existingPlans = [];
            }

            return data;
        }

        /**
         * Get current schedule from the UI
         */
        getCurrentScheduleFromUI() {
            const totalWeeks = parseInt(document.getElementById('totalWeeks')?.value) || 18;
            const lessonsPerWeek = parseInt(document.getElementById('lessonsPerWeek')?.value) || 2;
            
            // Try to get from schedule grid first
            const scheduleItems = document.querySelectorAll('.schedule-item');
            if (scheduleItems.length > 0) {
                const schedule = [];
                scheduleItems.forEach((item, index) => {
                    const week = item.querySelector('.schedule-week')?.textContent?.match(/\d+/)?.[0] || (index + 1);
                    const lessons = item.querySelector('.schedule-lessons')?.textContent?.match(/\d+/)?.[0] || lessonsPerWeek;
                    const focus = item.querySelector('.schedule-focus')?.textContent || `Foco da semana ${week}`;
                    
                    schedule.push({
                        week: parseInt(week),
                        lessons: parseInt(lessons),
                        focus: focus.split(', '),
                        objectives: [`Objetivo principal da semana ${week}`]
                    });
                });
                return { weeks: totalWeeks, lessonsPerWeek: schedule };
            }

            // Generate default schedule
            const defaultSchedule = [];
            for (let week = 1; week <= totalWeeks; week++) {
                defaultSchedule.push({
                    week: week,
                    lessons: lessonsPerWeek,
                    focus: [`Semana ${week} - Desenvolvimento progressivo`],
                    objectives: [`Objetivos da semana ${week}`]
                });
            }

            return { weeks: totalWeeks, lessonsPerWeek: defaultSchedule };
        }

        /**
         * Get selected techniques from UI or course data
         */
        async getSelectedTechniques(courseId) {
            const techniques = [];

            // Get from UI selected techniques
            const selectedCards = document.querySelectorAll('#selectedTechniques .technique-card');
            selectedCards.forEach(card => {
                const name = card.querySelector('h4')?.textContent;
                const category = card.querySelector('.technique-category')?.textContent;
                if (name) {
                    techniques.push({ name, category, source: 'ui' });
                }
            });

            // If no UI techniques, try to get from activities API
            if (techniques.length === 0) {
                try {
                    const activitiesResponse = await fetch('/api/activities');
                    const activitiesResult = await activitiesResponse.json();
                    if (activitiesResult.success && activitiesResult.data) {
                        activitiesResult.data.slice(0, 10).forEach(activity => {
                            techniques.push({
                                name: activity.title || activity.name,
                                category: activity.category || 'general',
                                description: activity.description,
                                source: 'activities'
                            });
                        });
                    }
                } catch (error) {
                    console.warn('Could not load activities:', error);
                }
            }

            return techniques;
        }

        /**
         * Generate plans from schedule using RAG
         */
        async generatePlansFromSchedule(courseData, options) {
            const { schedule, course, techniques } = courseData;
            const generatedPlans = [];
            const provider = options.provider || 'claude';

            let lessonCounter = 1;

            for (const weekData of schedule.lessonsPerWeek) {
                for (let lessonInWeek = 1; lessonInWeek <= weekData.lessons; lessonInWeek++) {
                    console.log(`🎯 Generating lesson ${lessonCounter} (Week ${weekData.week}, Lesson ${lessonInWeek})`);

                    // Build RAG prompt for this specific lesson
                    const ragPrompt = this.buildLessonPlanPrompt({
                        lessonNumber: lessonCounter,
                        weekNumber: weekData.week,
                        lessonInWeek: lessonInWeek,
                        weekFocus: weekData.focus,
                        weekObjectives: weekData.objectives,
                        availableTechniques: techniques,
                        courseContext: course,
                        duration: options.lessonDuration || 60,
                        includeWarmup: options.includeWarmup !== false,
                        includeCooldown: options.includeCooldown !== false,
                        customInstructions: options.customInstructions || ''
                    });

                    // Generate with RAG
                    let ragResponse;
                    try {
                        ragResponse = await this.callRAGProvider(provider, ragPrompt);
                    } catch (error) {
                        console.warn(`⚠️ RAG generation failed for lesson ${lessonCounter}, using fallback`);
                        ragResponse = this.generateFallbackLessonPlan(weekData, lessonCounter);
                    }

                    // Convert RAG response to lesson plan format
                    const lessonPlan = this.parseRAGResponseToLessonPlan(ragResponse, {
                        lessonNumber: lessonCounter,
                        weekNumber: weekData.week,
                        course: course
                    });

                    generatedPlans.push(lessonPlan);
                    lessonCounter++;

                    // Add delay to avoid rate limits
                    await this.delay(500);
                }
            }

            return generatedPlans;
        }

        /**
         * Build RAG prompt for lesson plan generation
         */
        buildLessonPlanPrompt(data) {
            const techniquesText = data.availableTechniques
                .map(t => `- ${t.name} (${t.category})`)
                .join('\n');

            return `
Crie um plano de aula estruturado para Krav Maga com as seguintes especificações:

**INFORMAÇÕES DA AULA:**
- Número da Aula: ${data.lessonNumber}
- Semana: ${data.weekNumber}
- Aula da Semana: ${data.lessonInWeek}
- Duração: ${data.duration} minutos

**FOCO DA SEMANA:**
${data.weekFocus.join(', ')}

**OBJETIVOS:**
${data.weekObjectives.join(', ')}

**TÉCNICAS DISPONÍVEIS:**
${techniquesText}

**CONTEXTO DO CURSO:**
- Nome: ${data.courseContext.name || 'Krav Maga'}
- Nível: ${data.courseContext.level || 'Iniciante'}
- Descrição: ${data.courseContext.description || 'Curso básico de Krav Maga'}

**INSTRUÇÕES ESPECÍFICAS:**
${data.customInstructions}

**ESTRUTURA REQUERIDA:**
Retorne um plano estruturado em JSON com os seguintes campos:
- title: Título da aula
- objectives: Array de objetivos específicos da aula
- warmup: Descrição do aquecimento (${data.includeWarmup ? '10-15 min' : 'não incluir'})
- techniques: Descrição das técnicas principais (25-35 min)
- practice: Descrição da prática/sparring (15-20 min)
- cooldown: Descrição do alongamento final (${data.includeCooldown ? '5-10 min' : 'não incluir'})
- equipment: Array de equipamentos necessários
- safety: Considerações de segurança
- notes: Observações adicionais para o instrutor

Foque em progressão gradual, segurança e aplicação prática das técnicas.
            `.trim();
        }

        /**
         * Call RAG provider to generate content
         */
        async callRAGProvider(provider, prompt) {
            // Use existing RAG module if available
            if (window.ragModule) {
                return await window.ragModule.generateContent('lesson-plan', {
                    prompt: prompt,
                    provider: provider,
                    context: 'course-generation'
                });
            }

            // Fallback to direct API call
            const response = await fetch('/api/rag/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'lesson-plan',
                    prompt: prompt,
                    provider: provider
                })
            });

            if (!response.ok) {
                throw new Error(`RAG API error: ${response.status}`);
            }

            return await response.json();
        }

        /**
         * Generate fallback lesson plan when RAG fails
         */
        generateFallbackLessonPlan(weekData, lessonNumber) {
            return {
                title: `Aula ${lessonNumber} - ${weekData.focus.join(', ')}`,
                objectives: weekData.objectives || [`Objetivo da aula ${lessonNumber}`],
                warmup: 'Aquecimento geral: corrida leve, alongamentos dinâmicos (10 min)',
                techniques: `Técnicas principais baseadas no foco: ${weekData.focus.join(', ')} (30 min)`,
                practice: 'Prática em duplas das técnicas aprendidas (15 min)',
                cooldown: 'Alongamento final e relaxamento (5 min)',
                equipment: ['Tatame', 'Luvas de treino'],
                safety: 'Verificar equipamentos e espaço antes do início',
                notes: `Plano gerado automaticamente para aula ${lessonNumber}`,
                ragGenerated: false
            };
        }

        /**
         * Parse RAG response to lesson plan format
         */
        parseRAGResponseToLessonPlan(ragResponse, metadata) {
            // Try to parse structured response
            let planData;
            
            try {
                if (typeof ragResponse === 'string') {
                    // Try to extract JSON from response
                    const jsonMatch = ragResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        planData = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('No JSON found in response');
                    }
                } else {
                    planData = ragResponse;
                }
            } catch (error) {
                console.warn('Could not parse RAG response as JSON, using text parsing');
                planData = this.parseTextResponse(ragResponse);
            }

            return {
                courseId: metadata.course.id,
                lessonNumber: metadata.lessonNumber,
                weekNumber: metadata.weekNumber,
                title: planData.title || `Aula ${metadata.lessonNumber}`,
                description: planData.description || '',
                objectives: Array.isArray(planData.objectives) ? planData.objectives : [planData.objectives || 'Objetivo principal'],
                warmup: planData.warmup || '',
                techniques: planData.techniques || '',
                simulations: planData.practice || '',
                cooldown: planData.cooldown || '',
                equipment: Array.isArray(planData.equipment) ? planData.equipment : [],
                duration: 60,
                difficulty: metadata.course.level || 'BEGINNER',
                notes: planData.notes || `Gerado automaticamente pelo RAG em ${new Date().toLocaleDateString()}`,
                ragGenerated: true,
                ragProvider: 'claude' // TODO: get from options
            };
        }

        /**
         * Parse text response when JSON parsing fails
         */
        parseTextResponse(textResponse) {
            const text = typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse);
            
            return {
                title: this.extractSection(text, 'título', 'title') || 'Aula sem título',
                objectives: [this.extractSection(text, 'objetivo', 'objective') || 'Objetivo geral'],
                warmup: this.extractSection(text, 'aquecimento', 'warmup') || 'Aquecimento padrão',
                techniques: this.extractSection(text, 'técnica', 'technique') || 'Técnicas principais',
                practice: this.extractSection(text, 'prática', 'practice') || 'Prática das técnicas',
                cooldown: this.extractSection(text, 'alongamento', 'cooldown') || 'Alongamento final',
                equipment: ['Equipamentos básicos'],
                safety: 'Cuidados gerais de segurança',
                notes: 'Plano extraído de resposta em texto'
            };
        }

        /**
         * Extract section from text response
         */
        extractSection(text, ...keywords) {
            for (const keyword of keywords) {
                const regex = new RegExp(`${keyword}[:\\s]*([^\\n\\r]{10,200})`, 'i');
                const match = text.match(regex);
                if (match) {
                    return match[1].trim();
                }
            }
            return null;
        }

        /**
         * Save generated lesson plans
         */
        async saveLessonPlans(plans, courseId, replaceExisting = false) {
            console.log(`💾 Saving ${plans.length} lesson plans for course ${courseId}`);

            if (replaceExisting) {
                // Delete existing plans first
                try {
                    await fetch(`/api/lesson-plans?courseId=${courseId}`, { method: 'DELETE' });
                } catch (error) {
                    console.warn('Could not delete existing plans:', error);
                }
            }

            const savedPlans = [];
            
            for (const plan of plans) {
                try {
                    const response = await fetch('/api/lesson-plans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(plan)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        savedPlans.push(result.data);
                        console.log(`✅ Saved lesson plan ${plan.lessonNumber}`);
                    } else {
                        console.warn(`⚠️ Failed to save lesson plan ${plan.lessonNumber}`);
                    }
                } catch (error) {
                    console.error(`❌ Error saving lesson plan ${plan.lessonNumber}:`, error);
                }
            }

            return savedPlans;
        }

        /**
         * Utility function to add delay
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // Expose the RAG integration class globally
    window.CourseRAGIntegration = CourseRAGIntegration;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCourseRAGIntegration);
    } else {
        initializeCourseRAGIntegration();
    }

    console.log('🧠 Course RAG Integration - Loaded');

})();

/**
 * Dashboard Service
 * Handles data fetching for the Class Dashboard
 */
export class DashboardService {
    constructor() {
        this.moduleAPI = null;
    }

    async init() {
        await this.waitForAPIClient();
        this.moduleAPI = window.createModuleAPI('ClassDashboard');
    }

    waitForAPIClient() {
        return new Promise((resolve) => {
            if (window.createModuleAPI) return resolve();
            const check = setInterval(() => {
                if (window.createModuleAPI) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
    }

    /**
     * Get current lesson plan data
     * @param {string} lessonId 
     */
    async getLessonData(lessonId) {
        try {
            if (lessonId && lessonId !== 'current') {
                // Try to fetch real data from API
                const response = await this.moduleAPI.request(`/api/agenda/class/${lessonId}`);
                if (response.success && response.data) {
                    const lesson = response.data;
                    const plan = lesson.lessonPlan || {};
                    
                    return {
                        title: lesson.title || "Aula sem título",
                        instructor: lesson.instructor?.name || "Instrutor",
                        phases: {
                            warmup: {
                                duration: plan.warmup?.duration || 15,
                                exercises: plan.warmup?.description ? [plan.warmup.description] : ["Aquecimento Geral"]
                            },
                            technique: {
                                duration: plan.technique?.duration || 40,
                                primary: plan.technique?.description || "Técnica do dia",
                                secondary: ""
                            },
                            cooldown: {
                                duration: plan.cooldown?.duration || 5,
                                exercises: plan.cooldown?.description ? [plan.cooldown.description] : ["Alongamento"]
                            }
                        },
                        students: lesson.attendances || []
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to fetch lesson data, using mock:', error);
        }

        // Mock data fallback
        return {
            title: "Defesa Pessoal - Nível 1",
            instructor: "Mestre Kobi",
            phases: {
                warmup: {
                    duration: 15,
                    exercises: ["Corrida", "Polichinelos", "Flexões"]
                },
                technique: {
                    duration: 40,
                    primary: "Defesa de Estrangulamento Frontal",
                    secondary: "Contra-ataque simultâneo"
                },
                cooldown: {
                    duration: 5,
                    exercises: ["Alongamento", "Respiração"]
                }
            },
            students: []
        };
    }
}
            students: [
                { name: "João Silva", status: "injury", note: "Joelho direito" },
                { name: "Maria Santos", status: "new", note: "Primeira aula" },
                { name: "Pedro Costa", status: "regular" }
            ]
        };
    }
}

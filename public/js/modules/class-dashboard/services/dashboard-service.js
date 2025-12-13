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
        // Mock data for now, will connect to real API later
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
            students: [
                { name: "João Silva", status: "injury", note: "Joelho direito" },
                { name: "Maria Santos", status: "new", note: "Primeira aula" },
                { name: "Pedro Costa", status: "regular" }
            ]
        };
    }
}

const API_BASE_URL = ''; // A API está na mesma origem

async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error fetching ${endpoint}:`, error);
        // Retornar um objeto de erro padronizado
        return { success: false, message: error.message, data: null };
    }
}

// Funções da API de Alunos
export const getStudents = () => fetchAPI('/api/students');
export const getStudentById = (id) => fetchAPI(`/api/students/${id}`);
// ...outras funções de alunos

// Funções da API de Planos
export const getBillingPlans = () => fetchAPI('/api/billing-plans');
export const getPlanById = (id) => fetchAPI(`/api/billing-plans/${id}`);
// ...outras funções de planos

// ==========================================
// FINANCIAL & PLANS MODULE
// ==========================================

// This module handles plan management, subscriptions, and financial responsibles.

import { showToast } from './ui.js';
import { currentEditingStudentId, allStudents } from './store.js';

/**
 * Loads the content for the "Plans" tab on the student edit page.
 */
export async function loadPlansTabContent() {
    const content = document.getElementById('page-tab-plans');
    if (!content) return;

    const studentId = window.currentEditingStudentId; // Assumes global state for now
    if (!studentId) {
        content.innerHTML = `<div class="error-message">Erro: ID do aluno não encontrado.</div>`;
        return;
    }

    content.innerHTML = `<div class="loading-message">Carregando planos...</div>`;

    try {
        const [plansResponse, subscriptionResponse] = await Promise.all([
            fetch('/api/billing-plans'),
            fetch(`/api/students/${studentId}/subscription`)
        ]);

        const plansResult = await plansResponse.json();
        const availablePlans = (plansResult.success && plansResult.data) ? plansResult.data.filter(p => p.isActive) : [];

        let currentPlan = null;
        if (subscriptionResponse.ok) {
            const subscriptionResult = await subscriptionResponse.json();
            if (subscriptionResult.success && subscriptionResult.data) {
                currentPlan = subscriptionResult.data.plan;
            }
        }
        
        // Render the UI
        renderPlansUI(content, availablePlans, currentPlan, studentId);

    } catch (error) {
        console.error('Erro ao carregar aba de planos:', error);
        content.innerHTML = `<div class="error-message">Não foi possível carregar os planos. Tente novamente.</div>`;
    }
}

/**
 * Renders the entire UI for the plans tab.
 * @param {HTMLElement} container - The container element to render into.
 * @param {Array} availablePlans - List of all available plans.
 * @param {object|null} currentPlan - The student's current active plan.
 * @param {string} studentId - The current student's ID.
 */
function renderPlansUI(container, availablePlans, currentPlan, studentId) {
    const hasActiveSubscription = !!currentPlan;

    // A simplified version of the original complex HTML generation.
    // In a real-world scenario, a templating engine or framework would be used.
    container.innerHTML = `
        <div class="plans-header">
            <h3>Gestão de Planos</h3>
            <div class="action-buttons">
                ${!hasActiveSubscription ? `
                    <button class="btn btn-primary" onclick="window.showQuickPlanSelector()">🚀 Assinar Plano Agora</button>
                ` : `
                    <button class="btn btn-secondary" onclick="window.showPlanChangeOptions()">🔄 Trocar Plano</button>
                    <button class="btn btn-danger" onclick="window.showPlanCancellation()">🛑 Gerenciar Plano</button>
                `}
            </div>
        </div>

        <div class="current-plan-status ${hasActiveSubscription ? 'active' : 'inactive'}">
            ${hasActiveSubscription ? renderCurrentPlan(currentPlan) : renderNoPlanState(availablePlans)}
        </div>

        <div id="allPlansSection" class="all-plans-section" style="${hasActiveSubscription ? '' : 'display: none;'}">
            <h4>Todos os Planos Disponíveis</h4>
            <div class="plans-grid">
                ${availablePlans.map(plan => renderPlanCard(plan, currentPlan)).join('')}
            </div>
        </div>

        ${!hasActiveSubscription ? `
            <div id="quickPlanSelector" class="quick-plan-selector">
                <h4>⚡ Escolha seu Plano Ideal</h4>
                <div class="plans-grid">
                    ${availablePlans.map(plan => renderPlanCard(plan, null, true)).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function renderCurrentPlan(plan) {
    return `
        <h4>${plan.name}</h4>
        <p>${plan.description}</p>
        <div class="plan-details">
            <span>Valor: R$ ${plan.price}</span>
            <span>Categoria: ${plan.category}</span>
        </div>
    `;
}

function renderNoPlanState(availablePlans) {
    return `
        <h4>Nenhum Plano Ativo</h4>
        <p>Este aluno não possui um plano de pagamento ativo.</p>
        <p>✅ ${availablePlans.length} planos disponíveis.</p>
    `;
}

function renderPlanCard(plan, currentPlan, isQuickSelect = false) {
    const isCurrent = currentPlan && currentPlan.id === plan.id;
    const buttonText = isCurrent ? '✅ Plano Atual' : (currentPlan ? '🔄 Trocar para Este' : '🚀 Assinar Plano');
    const onclickAction = isCurrent ? '' : `window.assignPlanToStudent('${plan.id}')`;

    return `
        <div class="plan-card ${isCurrent ? 'current' : ''}">
            <h5>${plan.name}</h5>
            <p>R$ ${plan.price} / mês</p>
            <button class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}" ${isCurrent ? 'disabled' : ''} onclick="${onclickAction}">
                ${buttonText}
            </button>
        </div>
    `;
}


/**
 * Assigns a plan to the current student.
 * @param {string} planId - The ID of the plan to assign.
 */
export async function assignPlanToStudent(planId) {
    const studentId = window.currentEditingStudentId;
    if (!studentId || !planId) {
        window.showToast('Erro: Informações do aluno ou plano ausentes.', 'error');
        return;
    }

    const confirmation = confirm(`Tem certeza que deseja ${window.currentPlan ? 'trocar para' : 'assinar'} este plano?`);
    if (!confirmation) return;

    try {
        // This endpoint should handle both new subscriptions and plan changes.
        const response = await fetch(`/api/students/${studentId}/subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId })
        });

        const result = await response.json();
        if (result.success) {
            window.showToast('Plano atualizado com sucesso!', 'success');
            loadPlansTabContent(); // Refresh the tab
        } else {
            throw new Error(result.message || 'Falha ao atualizar plano.');
        }
    } catch (error) {
        console.error('Erro ao atribuir plano:', error);
        window.showToast(`Erro: ${error.message}`, 'error');
    }
}

/**
 * Initiates the plan cancellation flow.
 */
export async function showPlanCancellation() {
    // Simplified logic. The original had checks for usage history.
    const confirmation = confirm('Tem certeza que deseja desativar o plano atual? Esta ação não pode ser desfeita.');
    if (confirmation) {
        deactivateStudentPlan();
    }
}

/**
 * Deactivates the current student's active plan.
 */
async function deactivateStudentPlan() {
    const studentId = window.currentEditingStudentId;
    try {
        const response = await fetch(`/api/students/${studentId}/subscription/deactivate`, {
            method: 'PUT'
        });
        const result = await response.json();
        if (result.success) {
            window.showToast('Plano desativado com sucesso.', 'success');
            loadPlansTabContent();
        } else {
            throw new Error(result.message || 'Falha ao desativar plano.');
        }
    } catch (error) {
        console.error('Erro ao desativar plano:', error);
        window.showToast(`Erro: ${error.message}`, 'error');
    }
}

// Attach functions to window for inline HTML onclick handlers
window.assignPlanToStudent = assignPlanToStudent;
window.showPlanCancellation = showPlanCancellation;
window.showQuickPlanSelector = () => document.getElementById('quickPlanSelector')?.scrollIntoView({ behavior: 'smooth' });
window.showPlanChangeOptions = () => document.getElementById('allPlansSection')?.scrollIntoView({ behavior: 'smooth' });

// ==========================================
// FINANCIAL RESPONSIBLES
// ==========================================

let financialResponsibles = [];

/**
 * Loads the list of financial responsibles from the server.
 */
export async function loadFinancialResponsibles() {
    try {
        const response = await fetch('/api/financial-responsibles');
        const data = await response.json();
        
        if (data.success) {
            financialResponsibles = data.data;
            updateFinancialResponsiblesOptions();
        } else {
            console.error('Erro ao carregar responsáveis financeiros:', data.message);
        }
    } catch (error) {
        console.error('Erro ao carregar responsáveis financeiros:', error);
    }
}

/**
 * Populates the select dropdowns for financial responsibles.
 */
function updateFinancialResponsiblesOptions() {
    const addSelect = document.getElementById('studentFinancialResponsible');
    const editSelect = document.getElementById('editStudentFinancialResponsible');
    
    const optionsHTML = '<option value="">Selecione um responsável (opcional)</option>' +
        financialResponsibles.map(responsible => 
            `<option value="${responsible.id}">${responsible.name} - ${responsible.relationshipType || 'Não informado'}</option>`
        ).join('');
    
    if (addSelect) addSelect.innerHTML = optionsHTML;
    if (editSelect) editSelect.innerHTML = optionsHTML;
}

/**
 * Handles the submission of the "edit responsible" form.
 */
export async function editResponsible() {
    const form = document.getElementById('editResponsibleForm');
    const responsibleId = document.getElementById('editResponsibleId').value;
    
    const responsibleData = {
        name: document.getElementById('editResponsibleName').value.trim(),
        email: document.getElementById('editResponsibleEmail').value.trim(),
        phone: document.getElementById('editResponsiblePhone').value.trim(),
        birthDate: document.getElementById('editResponsibleBirthDate').value || null,
        relationshipType: document.getElementById('editResponsibleRelationType').value || null
    };

    if (!responsibleData.name || !responsibleData.email) {
        window.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        window.showToast('⏳ Atualizando responsável...', 'info');
        
        const response = await fetch(`/api/financial-responsibles/${responsibleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responsibleData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            window.showToast('✅ Responsável atualizado com sucesso!', 'success');
            window.closeModal('editResponsibleModal');
            // Assuming a function to refresh the list exists and is exposed globally
            window.loadFinancialResponsiblesList?.(); 
        } else {
            throw new Error(data.message || 'Erro ao atualizar responsável');
        }
    } catch (error) {
        console.error('Erro ao editar responsável:', error);
        window.showToast(`Erro ao atualizar responsável: ${error.message}`, 'error');
    }
}

/**
 * Creates a new subscription for the current student.
 */
export async function createNewSubscription() {
    if (!currentEditingStudentId) {
        showToast('Nenhum aluno selecionado para adicionar plano.', 'error');
        return;
    }
    const planId = document.getElementById('student-plan-select').value;
    if (!planId) {
        showToast('Por favor, selecione um plano.', 'error');
        return;
    }
    await assignPlanToStudent(planId);
}

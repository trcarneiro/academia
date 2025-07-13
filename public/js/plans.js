// ==========================================
// BILLING PLANS MANAGEMENT MODULE
// ==========================================

// Module-level state
let allPlans = []; // Cache for billing plans
let currentEditingPlanId = null;
let currentEditingPlan = null;

/**
 * Initializes all event listeners for the plans section.
 */
export function initPlanEventListeners() {
    // Plan table event delegation
    const plansTableBody = document.getElementById('plansTableBody');
    if (plansTableBody) plansTableBody.addEventListener('click', handlePlanTableClick);

    // Plan modal listeners
    const closePlanModalBtn = document.getElementById('closePlanModalBtn');
    if (closePlanModalBtn) closePlanModalBtn.addEventListener('click', closePlanModal);

    // Initialize form handlers
    initPlanFormHandlers();

    console.log('✅ Plan event listeners initialized');
}

/**
 * Loads and renders the billing plans list dynamically from the API.
 */
export async function loadAndRenderPlans() {
    console.log('🔄 Loading billing plans from API...');
    
    // Show loading state
    showPlansLoadingState();
    
    try {
        const response = await fetch('/api/billing-plans');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to load billing plans');
        }
        
        // Store plans in cache
        allPlans = result.data || [];
        console.log(`✅ Loaded ${allPlans.length} billing plans from API`);
        
        // Render the plans table
        renderPlansTable(allPlans);
        
        // Hide loading state
        hidePlansLoadingState();
        
        // Update counters and other UI elements
        updatePlansCounter();
        updatePlansStats();
        
    } catch (error) {
        console.error('❌ Error loading billing plans:', error);
        showPlansErrorState(error.message);
    }
}

/**
 * Renders the billing plans table with the provided data.
 * @param {Array} plans - Array of plan objects to render.
 */
function renderPlansTable(plans) {
    const tableBody = document.getElementById('plansTableBody');
    if (!tableBody) return;
    
    if (plans.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">💳</div>
                    <div>Nenhum plano de pagamento encontrado</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        Clique em "Novo Plano" para criar o primeiro plano
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const html = plans.map(plan => {
        const name = plan.name || 'Nome não disponível';
        const description = plan.description || '';
        const price = formatCurrency(plan.price || 0);
        const billingType = formatBillingType(plan.billingType || 'MONTHLY');
        const classesPerWeek = plan.classesPerWeek || 0;
        const status = plan.isActive ? 'Ativo' : 'Inativo';
        const statusColor = plan.isActive ? '#10B981' : '#EF4444';
        const subscriptionsCount = plan._count?.subscriptions || 0;
        
        return `
            <tr class="plan-row" data-plan-id="${plan.id}" style="cursor: pointer; transition: background-color 0.2s ease;" 
                onmouseover="this.style.backgroundColor='rgba(59, 130, 246, 0.1)'" 
                onmouseout="this.style.backgroundColor='transparent'"
                ondblclick="editPlan('${plan.id}')">
                <td style="padding: 1rem; color: #F8FAFC; font-weight: 500;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></div>
                        <div>
                            <div style="font-weight: 600;">${name}</div>
                            ${description ? `<div style="font-size: 0.875rem; color: #94A3B8; margin-top: 0.25rem;">${description.substring(0, 50)}${description.length > 50 ? '...' : ''}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 1rem; color: #94A3B8;">
                    <div style="color: #F8FAFC; font-weight: 600; font-size: 1.125rem;">${price}</div>
                    <div style="font-size: 0.75rem; color: #94A3B8;">${billingType}</div>
                </td>
                <td style="padding: 1rem; color: #94A3B8; text-align: center;">
                    <div style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; display: inline-block;">
                        ${billingType}
                    </div>
                </td>
                <td style="padding: 1rem; color: #94A3B8; text-align: center;">
                    <div style="color: #F8FAFC; font-weight: 600;">${classesPerWeek}</div>
                    <div style="font-size: 0.75rem; color: #94A3B8;">aulas/semana</div>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${status}
                    </span>
                </td>
                <td style="padding: 1rem; color: #94A3B8; text-align: center;">
                    <div style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; font-weight: 600; display: inline-block;">
                        ${subscriptionsCount} alunos
                    </div>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="action-btn" data-action="edit" data-plan-id="${plan.id}" 
                                style="background: rgba(245, 158, 11, 0.1); color: #F59E0B; border: 1px solid #F59E0B; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Editar plano">
                            ✏️
                        </button>
                        <button class="action-btn" data-action="toggle" data-plan-id="${plan.id}" 
                                style="background: rgba(${plan.isActive ? '239, 68, 68' : '16, 185, 129'}, 0.1); color: ${plan.isActive ? '#EF4444' : '#10B981'}; border: 1px solid ${plan.isActive ? '#EF4444' : '#10B981'}; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="${plan.isActive ? 'Desativar' : 'Ativar'} plano">
                            ${plan.isActive ? '🚫' : '✅'}
                        </button>
                        <button class="action-btn" data-action="view" data-plan-id="${plan.id}" 
                                style="background: rgba(59, 130, 246, 0.1); color: #3B82F6; border: 1px solid #3B82F6; padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" 
                                title="Ver detalhes">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = html;
    
    console.log(`✅ Rendered ${plans.length} billing plans in table`);
}

/**
 * Handles clicks on the plan table (event delegation).
 * @param {Event} event - The click event.
 */
function handlePlanTableClick(event) {
    const actionBtn = event.target.closest('.action-btn');
    const planRow = event.target.closest('.plan-row');
    
    if (actionBtn) {
        event.stopPropagation();
        const action = actionBtn.dataset.action;
        const planId = actionBtn.dataset.planId;
        
        switch (action) {
            case 'edit':
                editPlan(planId);
                break;
            case 'toggle':
                togglePlanStatus(planId);
                break;
            case 'view':
                viewPlanDetails(planId);
                break;
        }
    } else if (planRow) {
        // Double-click to open edit modal
        const planId = planRow.dataset.planId;
        editPlan(planId);
    }
}

/**
 * Opens the plan creation/edit modal.
 * @param {string} planId - Optional plan ID for editing.
 */
async function editPlan(planId = null) {
    const isEditing = !!planId;
    let planData = null;
    
    if (isEditing) {
        // Find plan in cache or fetch from API
        planData = allPlans.find(p => p.id === planId);
        if (!planData) {
            try {
                const response = await fetch(`/api/billing-plans/${planId}`);
                const result = await response.json();
                if (result.success) {
                    planData = result.data;
                } else {
                    throw new Error('Plan not found');
                }
            } catch (error) {
                window.showToast('Erro ao carregar dados do plano', 'error');
                return;
            }
        }
    }
    
    await openPlanModal(planData);
}

/**
 * Opens the plan creation/edit modal.
 * @param {Object} planData - Optional plan data for editing.
 */
async function openPlanModal(planData = null) {
    const isEditing = !!planData;
    const title = isEditing ? 'Editar Plano' : 'Novo Plano';
    
    const modalHtml = `
        <div id="planModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: #0F172A; border-radius: 16px; width: 90%; max-width: 700px; max-height: 90vh; overflow-y: auto; border: 1px solid #334155;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, ${isEditing ? '#F59E0B' : '#8B5CF6'}, ${isEditing ? '#D97706' : '#7C3AED'}); padding: 2rem; border-radius: 16px 16px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h2 style="margin: 0; color: white; font-size: 1.5rem;">${isEditing ? '✏️' : '💳'} ${title}</h2>
                            <p style="margin: 0.5rem 0 0 0; color: rgba(255,255,255,0.8);">${isEditing ? 'Edite as informações do plano' : 'Crie um novo plano de pagamento'}</p>
                        </div>
                        <button onclick="closePlanModal()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; font-size: 1.5rem;">✕</button>
                    </div>
                </div>
                
                <!-- Content -->
                <div style="padding: 2rem;">
                    <form id="planForm">
                        ${isEditing ? `<input type="hidden" id="planId" value="${planData.id}">` : ''}
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Nome do Plano *</label>
                                <input type="text" id="planName" required 
                                       value="${planData?.name || ''}"
                                       style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                       placeholder="Ex: Plano Premium">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Valor *</label>
                                <input type="number" id="planPrice" required step="0.01" min="0" 
                                       value="${planData?.price || ''}"
                                       style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                       placeholder="150.00">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Descrição</label>
                            <textarea id="planDescription" rows="3" 
                                      style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC; resize: vertical;" 
                                      placeholder="Descrição do plano de pagamento...">${planData?.description || ''}</textarea>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Frequência *</label>
                                <select id="planBillingType" required style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                    <option value="MONTHLY" ${planData?.billingType === 'MONTHLY' ? 'selected' : ''}>Mensal</option>
                                    <option value="QUARTERLY" ${planData?.billingType === 'QUARTERLY' ? 'selected' : ''}>Trimestral</option>
                                    <option value="YEARLY" ${planData?.billingType === 'YEARLY' ? 'selected' : ''}>Anual</option>
                                    <option value="LIFETIME" ${planData?.billingType === 'LIFETIME' ? 'selected' : ''}>Vitalício</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Aulas/Semana</label>
                                <input type="number" id="planClassesPerWeek" min="1" max="7" 
                                       value="${planData?.classesPerWeek || '2'}"
                                       style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                       placeholder="2">
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Aulas Máximas</label>
                                <input type="number" id="planMaxClasses" min="1" 
                                       value="${planData?.maxClasses || ''}"
                                       style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;" 
                                       placeholder="Ilimitado">
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Categoria</label>
                                <select id="planCategory" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                    <option value="ADULT" ${planData?.category === 'ADULT' ? 'selected' : ''}>Adulto</option>
                                    <option value="CHILD" ${planData?.category === 'CHILD' ? 'selected' : ''}>Criança</option>
                                    <option value="TEEN" ${planData?.category === 'TEEN' ? 'selected' : ''}>Adolescente</option>
                                    <option value="SENIOR" ${planData?.category === 'SENIOR' ? 'selected' : ''}>Idoso</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 0.5rem; color: #CBD5E1; font-weight: 600;">Status</label>
                                <select id="planStatus" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border: 1px solid #374151; border-radius: 8px; color: #F8FAFC;">
                                    <option value="true" ${planData?.isActive !== false ? 'selected' : ''}>Ativo</option>
                                    <option value="false" ${planData?.isActive === false ? 'selected' : ''}>Inativo</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: #CBD5E1; cursor: pointer;">
                                <input type="checkbox" id="planHasPersonalTraining" ${planData?.hasPersonalTraining ? 'checked' : ''} 
                                       style="width: 16px; height: 16px; accent-color: #8B5CF6;">
                                <span>Inclui Personal Training</span>
                            </label>
                        </div>
                        
                        <div style="margin-bottom: 2rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; color: #CBD5E1; cursor: pointer;">
                                <input type="checkbox" id="planHasNutrition" ${planData?.hasNutrition ? 'checked' : ''} 
                                       style="width: 16px; height: 16px; accent-color: #8B5CF6;">
                                <span>Inclui Acompanhamento Nutricional</span>
                            </label>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" onclick="closePlanModal()" style="background: #374151; color: #F8FAFC; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
                            <button type="submit" style="background: ${isEditing ? '#F59E0B' : '#8B5CF6'}; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                ${isEditing ? '✏️ Atualizar Plano' : '💳 Criar Plano'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('planModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    currentEditingPlanId = planData?.id || null;
    currentEditingPlan = planData;
    
    console.log(`✅ Plan modal opened for ${isEditing ? 'editing' : 'creation'}`);
}

/**
 * Closes the plan modal.
 */
function closePlanModal() {
    const modal = document.getElementById('planModal');
    if (modal) {
        modal.remove();
    }
    currentEditingPlanId = null;
    currentEditingPlan = null;
}

/**
 * Toggles the status of a plan.
 * @param {string} planId - The ID of the plan to toggle.
 */
async function togglePlanStatus(planId) {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) {
        window.showToast('Plano não encontrado', 'error');
        return;
    }
    
    const newStatus = !plan.isActive;
    const action = newStatus ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${action} este plano?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/billing-plans/${planId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast(`Plano ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            // Refresh the plans list
            await loadAndRenderPlans();
        } else {
            throw new Error(result.message || `Erro ao ${action} plano`);
        }
    } catch (error) {
        console.error(`Error toggling plan status:`, error);
        window.showToast(`Erro ao ${action} plano: ` + error.message, 'error');
    }
}

/**
 * Views plan details.
 * @param {string} planId - The ID of the plan to view.
 */
function viewPlanDetails(planId) {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) {
        window.showToast('Plano não encontrado', 'error');
        return;
    }
    
    // For now, open edit modal in view mode
    // This could be enhanced to show a detailed view modal
    editPlan(planId);
}

/**
 * Creates a new plan.
 */
async function createNewPlan() {
    await openPlanModal();
}

// Utility functions for formatting
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatBillingType(billingType) {
    const typeMap = {
        'MONTHLY': 'Mensal',
        'QUARTERLY': 'Trimestral',
        'YEARLY': 'Anual',
        'LIFETIME': 'Vitalício'
    };
    return typeMap[billingType] || 'Mensal';
}

// Utility functions for loading states
function showPlansLoadingState() {
    const tableBody = document.getElementById('plansTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: #8B5CF6;">
                        <div style="width: 16px; height: 16px; border: 2px solid #8B5CF6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Carregando planos...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hidePlansLoadingState() {
    // Loading state is automatically hidden when table is re-rendered
}

function showPlansErrorState(message) {
    const tableBody = document.getElementById('plansTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #EF4444;">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div>Erro ao carregar planos</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
                        ${message}
                    </div>
                </td>
            </tr>
        `;
    }
}

function updatePlansCounter() {
    const counterEl = document.getElementById('plansCounter');
    if (counterEl) {
        counterEl.textContent = `${allPlans.length} plano${allPlans.length !== 1 ? 's' : ''}`;
    }
}

function updatePlansStats() {
    // Update stats if there are any dashboard elements
    const activePlans = allPlans.filter(p => p.isActive).length;
    const totalRevenue = allPlans.reduce((sum, p) => sum + (p.price * (p._count?.subscriptions || 0)), 0);
    
    const activePlansEl = document.getElementById('activePlansCount');
    const totalRevenueEl = document.getElementById('totalRevenueCount');
    
    if (activePlansEl) activePlansEl.textContent = activePlans;
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
}

/**
 * Initializes plan form submissions.
 */
export function initPlanFormHandlers() {
    // The form handler will be attached when the modal is created
    // We need to use event delegation since the form is created dynamically
    document.addEventListener('submit', async function(e) {
        if (e.target.id === 'planForm') {
            e.preventDefault();
            await handlePlanFormSubmit(e);
        }
    });
    
    console.log('✅ Plan form handlers initialized');
}

/**
 * Handles plan form submission.
 * @param {Event} event - The form submission event.
 */
async function handlePlanFormSubmit(event) {
    event.preventDefault();
    
    const planId = document.getElementById('planId')?.value;
    const isEditing = !!planId;
    
    const formData = {
        name: document.getElementById('planName').value,
        description: document.getElementById('planDescription').value,
        price: parseFloat(document.getElementById('planPrice').value),
        billingType: document.getElementById('planBillingType').value,
        classesPerWeek: parseInt(document.getElementById('planClassesPerWeek').value) || 2,
        maxClasses: parseInt(document.getElementById('planMaxClasses').value) || null,
        category: document.getElementById('planCategory').value,
        isActive: document.getElementById('planStatus').value === 'true',
        hasPersonalTraining: document.getElementById('planHasPersonalTraining').checked,
        hasNutrition: document.getElementById('planHasNutrition').checked
    };
    
    try {
        const url = isEditing ? `/api/billing-plans/${planId}` : '/api/billing-plans';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.showToast(`Plano ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            closePlanModal();
            
            // Auto-refresh plans list
            await loadAndRenderPlans();
        } else {
            throw new Error(result.message || `Erro ao ${isEditing ? 'atualizar' : 'criar'} plano`);
        }
    } catch (error) {
        console.error('Error saving plan:', error);
        window.showToast('Erro ao salvar plano: ' + error.message, 'error');
    }
}

// Legacy function compatibility
export function loadPlans() {
    return loadAndRenderPlans();
}

// Global function exposure for HTML onclick handlers
window.loadAndRenderPlans = loadAndRenderPlans;
window.createNewPlan = createNewPlan;
window.editPlan = editPlan;
window.closePlanModal = closePlanModal;
window.togglePlanStatus = togglePlanStatus;
window.viewPlanDetails = viewPlanDetails;
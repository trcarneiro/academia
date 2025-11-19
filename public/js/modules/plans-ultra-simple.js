// ==============================================
// PLANS MODULE - VERSÃO ULTRA SIMPLES
// ==============================================

console.log('🚀 Plans Ultra Simple carregando...');

// Função ultra simples para carregar e exibir planos
async function loadAndShowPlans() {
    console.log('📊 Carregando planos de forma simples...');
    
    try {
        // 1. Buscar dados da API (modo mais simples)
        const response = await window.fetchWithOrganization('/api/billing-plans');
        const result = await response.json();
        
        console.log('✅ Dados recebidos:', result);
        
        if (!result.success || !result.data) {
            throw new Error('Dados inválidos da API');
        }
        
        const plans = result.data;
        console.log('📋 Planos encontrados:', plans.length);
        
        // 2. Encontrar onde colocar os dados (modo mais simples)
        let container = document.querySelector('#plansTableBody') || 
                       document.querySelector('tbody') ||
                       document.querySelector('.table-container');
        
        if (!container) {
            console.log('🏗️ Criando tabela simples...');
            container = createSimpleTable();
        }
        
        // 3. Mostrar os dados (modo mais simples)
        displayPlansSimple(plans, container);
        
        // 4. Atualizar estatísticas (modo mais simples)
        updateStatsSimple(plans);
        
        console.log('✅ Planos exibidos com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showError('Erro ao carregar planos: ' + error.message);
    }
}

// Criar tabela simples se não existir
function createSimpleTable() {
    console.log('🔨 Criando tabela simples...');
    
    // Encontrar onde inserir
    let target = document.querySelector('#app') || 
                 document.querySelector('.spa-content') || 
                 document.querySelector('main') || 
                 document.body;
    
    // Limpar conteúdo se for o body
    if (target === document.body) {
        target.innerHTML = '';
    }
    
    // Criar HTML simples
    target.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>📋 Gestão de Planos</h1>
            
            <!-- Estatísticas -->
            <div id="statsContainer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="totalPlans" style="font-size: 32px; font-weight: bold;">0</div>
                    <div>Total de Planos</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="activePlans" style="font-size: 32px; font-weight: bold;">0</div>
                    <div>Planos Ativos</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="totalRevenue" style="font-size: 32px; font-weight: bold;">R$ 0</div>
                    <div>Receita Mensal</div>
                </div>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div id="avgPrice" style="font-size: 32px; font-weight: bold;">R$ 0</div>
                    <div>Preço Médio</div>
                </div>
            </div>
            
            <!-- Tabela -->
            <div style="background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                <table id="plansTable" style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f8f9fa;">
                        <tr>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Nome</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Categoria</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Preço</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Tipo</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Aulas/Semana</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>
                            <th style="padding: 15px; text-align: left; border-bottom: 1px solid #ddd;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="plansTableBody">
                        <tr>
                            <td colspan="7" style="padding: 40px; text-align: center; color: #666;">
                                Carregando planos...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div id="errorContainer" style="display: none; background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <div id="errorMessage"></div>
                <button onclick="loadAndShowPlans()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Tentar Novamente
                </button>
            </div>
        </div>
    `;
    
    return document.getElementById('plansTableBody');
}

// Exibir planos de forma simples
function displayPlansSimple(plans, container) {
    console.log('🎨 Exibindo', plans.length, 'planos...');
    
    if (plans.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 40px; text-align: center; color: #666;">
                    📭 Nenhum plano encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    const rows = plans.map(plan => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px; font-weight: 600;">${plan.name || 'Sem nome'}</td>
            <td style="padding: 15px;">
                <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${getCategoryName(plan.category)}
                </span>
            </td>
            <td style="padding: 15px; color: #28a745; font-weight: 600;">
                R$ ${formatPrice(plan.price)}
            </td>
            <td style="padding: 15px;">${getBillingTypeName(plan.billingType)}</td>
            <td style="padding: 15px; text-align: center;">${plan.classesPerWeek || 0}x</td>
            <td style="padding: 15px;">
                <span style="background: ${plan.isActive ? '#d4edda' : '#f8d7da'}; color: ${plan.isActive ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${plan.isActive ? '✅ Ativo' : '❌ Inativo'}
                </span>
            </td>
            <td style="padding: 15px;">
                <button onclick="toggleStatus('${plan.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Ativar/Desativar">
                    ${plan.isActive ? '⏸️' : '▶️'}
                </button>
                <button onclick="editPlan('${plan.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Editar">
                    ✏️
                </button>
                <button onclick="deletePlan('${plan.id}')" style="background: none; border: none; cursor: pointer; font-size: 16px; margin: 0 5px;" title="Excluir">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = rows;
}

// Atualizar estatísticas de forma simples
function updateStatsSimple(plans) {
    console.log('📊 Atualizando estatísticas...');
    
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.isActive).length;
    const totalRevenue = plans.filter(p => p.isActive).reduce((sum, p) => sum + (p.price || 0), 0);
    const avgPrice = totalPlans > 0 ? totalRevenue / activePlans : 0;
    
    // Atualizar elementos
    updateElement('totalPlans', totalPlans);
    updateElement('activePlans', activePlans);
    updateElement('totalRevenue', 'R$ ' + formatPrice(totalRevenue));
    updateElement('avgPrice', 'R$ ' + formatPrice(avgPrice));
}

// Funções auxiliares simples
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatPrice(price) {
    if (!price) return '0,00';
    return parseFloat(price).toFixed(2).replace('.', ',');
}

function getCategoryName(category) {
    const names = {
        'ADULT': 'Adulto',
        'FEMALE': 'Feminino', 
        'SENIOR': 'Senior',
        'CHILD': 'Infantil'
    };
    return names[category] || category || 'Geral';
}

function getBillingTypeName(type) {
    const names = {
        'MONTHLY': 'Mensal',
        'QUARTERLY': 'Trimestral',
        'YEARLY': 'Anual',
        'WEEKLY': 'Semanal'
    };
    return names[type] || type || 'Mensal';
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    if (errorContainer) errorContainer.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
}

// Funções de ação (placeholder)
function toggleStatus(planId) {
    console.log('🔄 Toggle status:', planId);
    alert('Toggle status: ' + planId);
}

function editPlan(planId) {
    console.log('✏️ Edit plan:', planId);
    alert('Edit plan: ' + planId);
}

function deletePlan(planId) {
    console.log('🗑️ Delete plan:', planId);
    if (confirm('Excluir plano?')) {
        alert('Delete plan: ' + planId);
    }
}

// Expor funções globalmente
window.loadAndShowPlans = loadAndShowPlans;
window.toggleStatus = toggleStatus;
window.editPlan = editPlan;
window.deletePlan = deletePlan;

// Auto-inicializar de forma simples
console.log('⏰ Aguardando DOM...');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadAndShowPlans, 100);
    });
} else {
    setTimeout(loadAndShowPlans, 100);
}

console.log('✅ Plans Ultra Simple carregado!');

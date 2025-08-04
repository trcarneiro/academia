// Simple Plans Module for Testing
console.log('🚀 Simple Plans Module Loading...');

// Export functions immediately
window.openAddPlanPage = function() {
    console.log('✅ openAddPlanPage called');
    alert('Nova página de plano seria aberta aqui');
};

window.loadPaymentPlansList = function() {
    console.log('✅ loadPaymentPlansList called');
    alert('Lista de planos seria carregada aqui');
};

window.filterPlans = function() {
    console.log('✅ filterPlans called');
};

window.editPlan = function(planId) {
    console.log('✅ editPlan called with ID:', planId);
    alert('Editando plano: ' + planId);
};

window.deletePlan = function(planId) {
    console.log('✅ deletePlan called with ID:', planId);
    alert('Deletando plano: ' + planId);
};

window.initializePlansModule = function() {
    console.log('✅ Plans Module Initialized');
};

console.log('📊 Simple Plans Module Functions Exported:', {
    openAddPlanPage: typeof window.openAddPlanPage,
    loadPaymentPlansList: typeof window.loadPaymentPlansList,
    filterPlans: typeof window.filterPlans,
    editPlan: typeof window.editPlan,
    deletePlan: typeof window.deletePlan
});

console.log('🎉 Simple Plans Module Ready!');
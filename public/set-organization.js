/**
 * 🔧 Quick Fix: Set Organization ID in Browser
 * 
 * PROBLEMA: API Client não encontra organizationId → não envia header → backend retorna []
 * SOLUÇÃO: Configurar organizationId no localStorage
 * 
 * COMO USAR:
 * 1. Abra o console do browser (F12)
 * 2. Cole e execute este código
 * 3. Recarregue a página (F5)
 */

// Organization ID da Academia Demo (onde estão os cursos e pacotes)
const ACADEMIA_DEMO_ORG_ID = 'a55ad715-2eb0-493c-996c-bb0f60bacec9';

// Configurar no localStorage (persiste entre sessões)
localStorage.setItem('activeOrganizationId', ACADEMIA_DEMO_ORG_ID);

// Configurar no sessionStorage (backup)
sessionStorage.setItem('activeOrganizationId', ACADEMIA_DEMO_ORG_ID);

// Configurar também como variável global (se precisar)
window.currentOrganizationId = ACADEMIA_DEMO_ORG_ID;

console.log('✅ Organization ID configurado!');
console.log('📍 Org ID:', ACADEMIA_DEMO_ORG_ID);
console.log('💾 localStorage:', localStorage.getItem('activeOrganizationId'));
console.log('💾 sessionStorage:', sessionStorage.getItem('activeOrganizationId'));
console.log('🌍 window.currentOrganizationId:', window.currentOrganizationId);
console.log('');
console.log('🔄 RECARREGUE A PÁGINA (F5) para aplicar!');

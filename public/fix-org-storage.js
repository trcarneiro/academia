/**
 * Script de Correção Automática - organizationId Inválida
 * 
 * Este script detecta e corrige automaticamente organizationId inválida
 * no localStorage/sessionStorage do navegador.
 * 
 * COMO USAR:
 * 1. Abra o Console do navegador (F12)
 * 2. Cole todo este código
 * 3. Pressione Enter
 * 4. A página recarregará automaticamente com a org correta
 */

(function autoFixOrganization() {
  console.log('%c🔧 CORREÇÃO AUTOMÁTICA DE ORGANIZAÇÃO', 'background: #667eea; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  
  const WRONG_ORG = '452c0b35-1822-4890-851e-922356c812fb';
  const CORRECT_ORG = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
  
  // Verificar estado atual
  const currentLocal = localStorage.getItem('activeOrganizationId');
  const currentSession = sessionStorage.getItem('activeOrganizationId');
  
  console.log('\n📊 ESTADO ATUAL:');
  console.log('localStorage:', currentLocal);
  console.log('sessionStorage:', currentSession);
  
  let needsFix = false;
  
  // Verificar se precisa correção
  if (currentLocal === WRONG_ORG) {
    console.warn('❌ localStorage tem organizationId INVÁLIDA!');
    needsFix = true;
  }
  
  if (currentSession === WRONG_ORG) {
    console.warn('❌ sessionStorage tem organizationId INVÁLIDA!');
    needsFix = true;
  }
  
  if (!needsFix && currentLocal === CORRECT_ORG) {
    console.log('✅ Tudo correto! organizationId já está válida.');
    return;
  }
  
  // Aplicar correção
  if (needsFix || !currentLocal) {
    console.log('\n🔨 APLICANDO CORREÇÃO...');
    
    // Limpar valores inválidos
    if (currentLocal === WRONG_ORG || !currentLocal) {
      localStorage.removeItem('activeOrganizationId');
      console.log('🧹 localStorage limpo');
    }
    
    if (currentSession === WRONG_ORG || !currentSession) {
      sessionStorage.removeItem('activeOrganizationId');
      console.log('🧹 sessionStorage limpo');
    }
    
    // Definir org correta
    localStorage.setItem('activeOrganizationId', CORRECT_ORG);
    sessionStorage.setItem('activeOrganizationId', CORRECT_ORG);
    
    console.log('✅ organizationId correta definida:', CORRECT_ORG);
    
    console.log('\n📊 NOVO ESTADO:');
    console.log('localStorage:', localStorage.getItem('activeOrganizationId'));
    console.log('sessionStorage:', sessionStorage.getItem('activeOrganizationId'));
    
    console.log('\n🔄 Recarregando página em 2 segundos...');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
  }
})();

/**
 * QUICK FIX - Corrigir Organization ID no Browser
 * 
 * INSTRUÇÕES:
 * 1. Abra o Console do navegador (F12)
 * 2. Cole este código completo
 * 3. Pressione Enter
 * 4. Recarregue a página (F5)
 */

console.log('%c🔧 CORRIGINDO ORGANIZATION ID', 'background: #667eea; color: white; padding: 10px; font-size: 16px; font-weight: bold;');

const WRONG_ORG = '452c0b35-1822-4890-851e-922356c812fb';
const CORRECT_ORG = 'ff5ee00e-d8a3-4291-9428-d28b852fb472';

// Verificar estado atual
const currentLocal = localStorage.getItem('activeOrganizationId');
const currentSession = sessionStorage.getItem('activeOrganizationId');

console.log('📊 Estado Atual:');
console.log('  localStorage:', currentLocal);
console.log('  sessionStorage:', currentSession);

if (currentLocal === WRONG_ORG) {
  localStorage.setItem('activeOrganizationId', CORRECT_ORG);
  console.log('✅ localStorage corrigido!');
}

if (currentSession === WRONG_ORG) {
  sessionStorage.setItem('activeOrganizationId', CORRECT_ORG);
  console.log('✅ sessionStorage corrigido!');
}

if (!currentLocal || currentLocal === WRONG_ORG) {
  localStorage.setItem('activeOrganizationId', CORRECT_ORG);
  console.log('✅ Organization ID definida no localStorage!');
}

console.log('\n📊 Novo Estado:');
console.log('  localStorage:', localStorage.getItem('activeOrganizationId'));
console.log('  sessionStorage:', sessionStorage.getItem('activeOrganizationId'));

console.log('\n🎉 Correção concluída! Recarregue a página (F5) para aplicar.');

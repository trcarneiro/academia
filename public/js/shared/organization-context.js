/**
 * Organization Context Helper
 * Utilitário para garantir que todas as requisições incluam organizationId
 * @version 1.0
 * @date 2025-11-11
 */

/**
 * Retorna o organizationId atual do contexto
 * @returns {string} UUID da organização ativa
 */
function getActiveOrganizationId() {
    // Tenta obter do localStorage (primeira prioridade)
    const orgId = localStorage.getItem('activeOrganizationId');
    if (orgId) {
        return orgId;
    }
    
    // Fallback para window.currentOrganizationId
    if (window.currentOrganizationId) {
        return window.currentOrganizationId;
    }
    
    // Fallback final para Smart Defence (organização padrão)
    console.warn('⚠️ No active organization found, using default Smart Defence');
    return 'ff5ee00e-d8a3-4291-9428-d28b852fb472';
}

/**
 * Retorna headers padrão com organizationId incluído
 * @param {Object} additionalHeaders - Headers adicionais opcionais
 * @returns {Object} Headers completos com x-organization-id
 */
function getOrganizationHeaders(additionalHeaders = {}) {
    return {
        'Content-Type': 'application/json',
        'x-organization-id': getActiveOrganizationId(),
        ...additionalHeaders
    };
}

/**
 * Wrapper para fetch com organizationId automático
 * @param {string} url - URL da API
 * @param {Object} options - Opções do fetch
 * @returns {Promise<Response>} Promise com resposta
 */
async function fetchWithOrganization(url, options = {}) {
    const orgId = getActiveOrganizationId();
    
    const enhancedOptions = {
        ...options,
        headers: {
            'x-organization-id': orgId,
            ...(options.headers || {})
        }
    };
    
    // Se tem body e não tem Content-Type, adiciona
    if (options.body && !enhancedOptions.headers['Content-Type']) {
        enhancedOptions.headers['Content-Type'] = 'application/json';
    }
    
    console.log(`🌐 [Org: ${orgId.substring(0, 8)}...] ${options.method || 'GET'} ${url}`);
    
    return fetch(url, enhancedOptions);
}

/**
 * Verifica se o contexto de organização está disponível
 * Aguarda até 5 segundos se necessário
 * @returns {Promise<boolean>} True se organização disponível
 */
async function ensureOrganizationContext() {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos (50 x 100ms)
    
    while (attempts < maxAttempts) {
        const orgId = localStorage.getItem('activeOrganizationId') || window.currentOrganizationId;
        if (orgId) {
            console.log('✅ Organization context available:', orgId.substring(0, 8) + '...');
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    console.warn('⚠️ Organization context not available after 5s, using default');
    return false;
}

/**
 * Adiciona listener para mudança de organização
 * @param {Function} callback - Função a ser chamada quando organização mudar
 */
function onOrganizationChange(callback) {
    window.addEventListener('organizationChanged', (event) => {
        const { orgId, orgName, orgSlug } = event.detail;
        console.log(`🔄 Organization changed to: ${orgName} (${orgId})`);
        callback({ orgId, orgName, orgSlug });
    });
}

// Exporta para uso global
if (typeof window !== 'undefined') {
    window.getActiveOrganizationId = getActiveOrganizationId;
    window.getOrganizationHeaders = getOrganizationHeaders;
    window.fetchWithOrganization = fetchWithOrganization;
    window.ensureOrganizationContext = ensureOrganizationContext;
    window.onOrganizationChange = onOrganizationChange;
    
    console.log('✅ Organization context helper loaded');
}

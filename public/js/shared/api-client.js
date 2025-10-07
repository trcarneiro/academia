/**
 * API Client Centralizado - Guidelines.MD Compliance
 * Padroniza acesso à API para todos os módulos
 * @version 2.0
 * @date 2025-08-17
 */

// Estados padrão para UI (Guidelines.MD requirement)
const UI_STATES = {
    LOADING: 'loading',
    SUCCESS: 'success', 
    ERROR: 'error',
    EMPTY: 'empty'
};

// ==============================================
// API CLIENT PRINCIPAL
// ==============================================

class ApiClient {
    constructor(baseURL = '', options = {}) {
        this.baseURL = baseURL;
        this.defaultOptions = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            ...options
        };
        this.cache = new Map();
    }

    /**
     * GET request
     */
    async get(url, options = {}) {
        return this.request('GET', url, null, options);
    }

    /**
     * POST request
     */
    async post(url, data, options = {}) {
        return this.request('POST', url, data, options);
    }

    /**
     * PUT request
     */
    async put(url, data, options = {}) {
        return this.request('PUT', url, data, options);
    }

    /**
     * DELETE request
     */
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }

    /**
     * PATCH request
     */
    async patch(url, data, options = {}) {
        return this.request('PATCH', url, data, options);
    }

    /**
     * Main request method with Guidelines.MD response normalization
     */
    async request(method, url, data = null, options = {}) {
        const config = { ...this.defaultOptions, ...options };
        const fullURL = this.buildURL(url);
        const cacheKey = this.buildCacheKey(method, fullURL, data);

        // Check cache for GET requests
        if (method === 'GET' && config.cache && this.cache.has(cacheKey)) {
            const cachedData = this.cache.get(cacheKey);
            if (!this.isCacheExpired(cachedData.timestamp, config.cacheTTL || 300000)) {
                console.log('📋 Using cached response for:', url);
                return this.normalizeResponse(cachedData.data);
            }
        }

        let lastError;
        const maxRetries = config.retries || 1;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.executeRequest(method, fullURL, data, config);
                
                // Cache successful GET responses
                if (method === 'GET' && config.cache) {
                    this.cache.set(cacheKey, {
                        data: response,
                        timestamp: Date.now()
                    });
                }

                return this.normalizeResponse(response);
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries && this.shouldRetry(error)) {
                    console.warn(`🔄 Retry ${attempt}/${maxRetries} for ${url}:`, error.message);
                    await this.delay(config.retryDelay * attempt);
                    continue;
                }
                
                break;
            }
        }

        throw lastError;
    }

    /**
     * Normaliza resposta da API (Guidelines.MD compliance)
     */
    normalizeResponse(response) {
        // Se resposta já está no formato padrão Guidelines.MD
        if (response && typeof response === 'object' && 'success' in response) {
            return {
                success: response.success,
                data: response.data || null,
                message: response.message || '',
                pagination: response.pagination || null,
                meta: response.meta || null
            };
        }

        // Se response tem propriedade data que indica sucesso
        if (response && response.data !== undefined) {
            return {
                success: true,
                data: response.data,
                message: response.message || 'Success',
                pagination: response.pagination || null,
                meta: response.meta || null
            };
        }

        // Normalizar resposta simples
        return {
            success: true,
            data: response,
            message: 'Success',
            pagination: null,
            meta: null
        };
    }

    /**
     * Execute the actual HTTP request
     */
    async executeRequest(method, url, data, config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
            // Inject organization headers from storage (if available)
            const orgHeaders = {};
            try {
                const ls = (typeof window !== 'undefined') ? window.localStorage : null;
                const ss = (typeof window !== 'undefined') ? window.sessionStorage : null;
                let orgId = (ls?.getItem('activeOrganizationId')) || (ss?.getItem('activeOrganizationId')) || (typeof window !== 'undefined' ? window.currentOrganizationId : null);
                const orgSlug = (ls?.getItem('activeOrganizationSlug')) || (ss?.getItem('activeOrganizationSlug')) || (typeof window !== 'undefined' ? window.currentOrganizationSlug : null);
                
                // 🔧 TEMPORARY FIX: Hardcoded fallback para única org na base
                // TODO: Remover quando integração com Supabase login estiver completa
                // Ver task em AGENTS.md > "Integrar organizationId do Supabase no API Client"
                if (!orgId && !orgSlug) {
                    orgId = 'a55ad715-2eb0-493c-996c-bb0f60bacec9'; // Academia Demo
                    console.warn('⚠️ Using hardcoded organization ID (temporary fix)');
                }
                
                if (orgId) orgHeaders['X-Organization-Id'] = orgId;
                else if (orgSlug) orgHeaders['X-Organization-Slug'] = orgSlug;
            } catch (_) {}

            const fetchOptions = {
                method,
                signal: controller.signal,
                headers: {
                    ...orgHeaders,
                    ...config.headers
                }
            };

            // Only add Content-Type for methods that send data
            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                fetchOptions.headers['Content-Type'] = 'application/json';
                fetchOptions.body = JSON.stringify(data);
            }

            console.log(`🌐 ${method} ${url}`, data ? { body: data } : '');

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                // Parse error body to extract server message when available
                let serverMsg = '';
                try {
                    const ct = response.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const j = await response.json();
                        serverMsg = j?.message || JSON.stringify(j);
                    } else if (ct.includes('text/')) {
                        serverMsg = await response.text();
                    }
                } catch (_) {}
                const msg = serverMsg || `HTTP ${response.status}: ${response.statusText}`;
                throw new ApiError(msg, response.status, url);
            }

            const responseData = await this.parseResponse(response);
            
            console.log(`✅ ${method} ${url} completed successfully`);
            
            return responseData;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new ApiError(`Request timeout (${config.timeout}ms)`, 408, url);
            }
            
            if (error instanceof ApiError) {
                throw error;
            }
            
            throw new ApiError(`Network error: ${error.message}`, 0, url);
        }
    }

    /**
     * Parse response based on content type
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        console.log('🔧 parseResponse - Content-Type:', contentType);
        
        if (contentType?.includes('application/json')) {
            const text = await response.text();
            console.log('🔧 parseResponse - Raw text:', text);
            
            const json = JSON.parse(text);
            console.log('🔧 parseResponse - Parsed JSON:', json);
            
            return json;
        }
        
        if (contentType?.includes('text/')) {
            return await response.text();
        }
        
        return await response.blob();
    }

    /**
     * Build full URL
     */
    buildURL(url) {
        if (url.startsWith('http')) {
            return url;
        }
        
        return `${this.baseURL}${url}`;
    }

    /**
     * Build cache key
     */
    buildCacheKey(method, url, data) {
        const dataHash = data ? btoa(JSON.stringify(data)).slice(0, 10) : '';
        return `${method}:${url}:${dataHash}`;
    }

    /**
     * Check if cache is expired
     */
    isCacheExpired(timestamp, ttl) {
        return Date.now() - timestamp > ttl;
    }

    /**
     * Check if request should be retried
     */
    shouldRetry(error) {
        if (error instanceof ApiError) {
            // Retry on server errors (5xx) and some client errors
            return error.status >= 500 || error.status === 408 || error.status === 429;
        }
        
        // Retry on network errors
        return error.name === 'TypeError' || error.name === 'AbortError';
    }

    /**
     * Delay utility for retries
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ API cache cleared');
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// ==============================================
// MODULE API HELPER - Guidelines.MD Pattern
// ==============================================

class ModuleAPIHelper {
    constructor(moduleName, apiClient) {
        this.moduleName = moduleName;
        this.api = apiClient;
        this.currentRequests = new Set();
    }

    /**
     * Buscar dados com UI states automáticos (Guidelines.MD compliance)
     */
    async fetchWithStates(endpoint, options = {}) {
        const { 
            loadingElement,
            targetElement,
            onLoading,
            onSuccess,
            onError,
            onEmpty,
            params,
            headers
        } = options;

        try {
            // Estado: Loading
            this._setState(UI_STATES.LOADING, { loadingElement, onLoading });
            
            // Build URL with query params when provided
            let url = endpoint;
            if (params && typeof params === 'object') {
                const usp = new URLSearchParams();
                Object.entries(params).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && String(v) !== '') usp.append(k, String(v));
                });
                const qs = usp.toString();
                if (qs) url += (endpoint.includes('?') ? '&' : '?') + qs;
            }
            
            const result = await this.api.get(url, { headers });
            
            if (!result.success) {
                throw new Error(result.message || 'API returned error');
            }

            const data = result.data;

            // Estado: Empty ou Success
            if (!data || (Array.isArray(data) && data.length === 0)) {
                this._setState(UI_STATES.EMPTY, { targetElement, onEmpty });
            } else {
                // Passar apenas os dados (data) ao callback onSuccess
                this._setState(UI_STATES.SUCCESS, { targetElement, onSuccess, data: data });
            }

            return result;

        } catch (error) {
            console.error(`❌ ${this.moduleName} fetch error:`, error);
            this._setState(UI_STATES.ERROR, { targetElement, onError, error });
            throw error;
        }
    }

    /**
     * Salvar dados com feedback automático
     */
    async saveWithFeedback(endpoint, data, options = {}) {
        const { method = 'POST', onSuccess, onError } = options;

        try {
            console.log(`💾 ${this.moduleName} saving data...`);
            
            const result = await this.api[method.toLowerCase()](endpoint, data);
            
            if (onSuccess) onSuccess(result.data);
            console.log(`✅ ${this.moduleName} data saved successfully`);
            
            return result;

        } catch (error) {
            console.error(`❌ ${this.moduleName} save error:`, error);
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Aplicar estado na UI (Guidelines.MD compliance)
     */
    _setState(state, options = {}) {
        const { loadingElement, targetElement, onLoading, onSuccess, onError, onEmpty, data, error } = options;

        switch (state) {
            case UI_STATES.LOADING:
                if (onLoading) onLoading();
                if (loadingElement) this._showLoading(loadingElement);
                break;

            case UI_STATES.SUCCESS:
                if (onSuccess) onSuccess(data);
                break;

            case UI_STATES.ERROR:
                if (onError) {
                    onError(error);
                    // If consumer handles error, don't overwrite with default UI
                } else if (targetElement) {
                    this._showError(targetElement, error);
                }
                break;

            case UI_STATES.EMPTY:
                if (onEmpty) {
                    onEmpty();
                    // If consumer renders custom empty, skip default UI to avoid overwrite
                } else if (targetElement) {
                    this._showEmpty(targetElement);
                }
                break;
        }
    }

    _showLoading(element) {
        if (element) {
            element.innerHTML = `
                <div class="module-isolated-loading-state">
                    <div class="module-isolated-spinner"></div>
                    <span>Carregando ${this.moduleName.toLowerCase()}...</span>
                </div>
            `;
        }
    }

    _showError(element, error) {
        if (element) {
            element.innerHTML = `
                <div class="module-isolated-error-state">
                    <span class="module-isolated-error-icon">❌</span>
                    <span class="module-isolated-error-message">${error?.message || 'Erro ao carregar dados'}</span>
                    <button onclick="location.reload()" class="module-isolated-btn-secondary module-isolated-btn-sm">
                        🔄 Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    _showEmpty(element) {
        if (element) {
            element.innerHTML = `
                <div class="module-isolated-empty-state">
                    <span class="module-isolated-empty-icon">📭</span>
                    <span class="module-isolated-empty-message">Nenhum ${this.moduleName.toLowerCase()} encontrado</span>
                </div>
            `;
        }
    }
}

// ==============================================
// API ERROR CLASS
// ==============================================

class ApiError extends Error {
    constructor(message, status = 0, url = '') {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.url = url;
    }

    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    get isServerError() {
        return this.status >= 500;
    }

    get isNetworkError() {
        return this.status === 0;
    }

    toString() {
        return `${this.name}: ${this.message} (${this.status}) - ${this.url}`;
    }
}

// ==============================================
// INSTÂNCIA GLOBAL E HELPERS
// ==============================================

// Instância global da API
const apiClient = new ApiClient();

// Exposição global (Guidelines.MD compliance)
if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
    window.ApiError = ApiError;
    window.ModuleAPIHelper = ModuleAPIHelper;
    window.apiClient = apiClient;
    window.UI_STATES = UI_STATES;

    // Helper factory para módulos
    window.createModuleAPI = function(moduleName, options = {}) {
        const moduleAPI = new ModuleAPIHelper(moduleName, apiClient);
        
        // Se foram fornecidos headers padrão, override o método request
        if (options.defaultHeaders) {
            const originalRequest = moduleAPI.api.request.bind(moduleAPI.api);
            moduleAPI.api.request = async function(method, url, data = null, requestOptions = {}) {
                const mergedOptions = {
                    ...requestOptions,
                    headers: {
                        ...options.defaultHeaders,
                        ...requestOptions.headers
                    }
                };
                return originalRequest(method, url, data, mergedOptions);
            };
        }
        
        return moduleAPI;
    };

    // Wait for API client to be ready
    window.waitForAPIClient = async function() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds (50 * 100ms)
        
        while (!window.createModuleAPI && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.createModuleAPI) {
            throw new Error('API client not available after waiting 5 seconds');
        }
        
        return true;
    };

    console.log('🌐 API Client carregado - Guidelines.MD compliance');
}

// ==============================================
// DEFAULT EXPORT (removed for browser usage)
// ==============================================

// Removed ESM exports to avoid SyntaxError in non-module script loading.
// The API is exposed via globals on window (ApiClient, ApiError, ModuleAPIHelper, UI_STATES, apiClient).
// If module exports are needed in build tools, add a separate ESM build file.

// export default ApiClient;
// export { ApiClient, ApiError, ModuleAPIHelper, UI_STATES };

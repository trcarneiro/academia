/**
 * API Client Centralizado - Guidelines.MD Compliance v1.0
 * Padroniza acesso à API para todos os módulos
 * 
 * Baseado em Guidelines.MD:
 * - API-First approach
 * - Modular architecture  
 * - Consistent error handling
 * - Loading states management
 */

(function() {
    'use strict';

    // ==============================================
    // CONFIGURAÇÃO E CONSTANTES
    // ==============================================
    
    const API_CONFIG = {
        baseURL: window.location.origin,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const UI_STATES = {
        LOADING: 'loading',
        SUCCESS: 'success', 
        ERROR: 'error',
        EMPTY: 'empty'
    };

    // ==============================================
    // API CLIENT PRINCIPAL
    // ==============================================
    
    class APIClient {
        constructor(config = {}) {
            this.config = { ...API_CONFIG, ...config };
            this.requestQueue = new Map();
            this.interceptors = {
                request: [],
                response: []
            };
        }

        /**
         * Requisição GET padronizada
         */
        async get(endpoint, options = {}) {
            return this._request('GET', endpoint, null, options);
        }

        /**
         * Requisição POST padronizada  
         */
        async post(endpoint, data, options = {}) {
            return this._request('POST', endpoint, data, options);
        }

        /**
         * Requisição PUT padronizada
         */
        async put(endpoint, data, options = {}) {
            return this._request('PUT', endpoint, data, options);
        }

        /**
         * Requisição DELETE padronizada
         */
        async delete(endpoint, options = {}) {
            return this._request('DELETE', endpoint, null, options);
        }

        /**
         * Requisição PATCH padronizada
         */
        async patch(endpoint, data, options = {}) {
            return this._request('PATCH', endpoint, data, options);
        }

        /**
         * Método interno para fazer requisições
         */
        async _request(method, endpoint, data, options = {}) {
            const url = `${this.config.baseURL}${endpoint}`;
            const requestKey = `${method}:${url}:${JSON.stringify(data || {})}`;

            // Evitar requisições duplicadas (debounce)
            if (this.requestQueue.has(requestKey)) {
                console.log(`📋 Reusing existing request: ${method} ${endpoint}`);
                return this.requestQueue.get(requestKey);
            }

            const requestConfig = {
                method,
                headers: { ...this.config.headers, ...options.headers },
                signal: options.signal || AbortSignal.timeout(this.config.timeout)
            };

            if (data && method !== 'GET') {
                requestConfig.body = JSON.stringify(data);
            }

            // Aplicar interceptors de request
            for (const interceptor of this.interceptors.request) {
                requestConfig = await interceptor(requestConfig) || requestConfig;
            }

            const requestPromise = this._executeRequest(url, requestConfig, requestKey);
            this.requestQueue.set(requestKey, requestPromise);

            try {
                const result = await requestPromise;
                return result;
            } finally {
                // Limpar da queue após completar
                setTimeout(() => this.requestQueue.delete(requestKey), 1000);
            }
        }

        /**
         * Executa a requisição HTTP
         */
        async _executeRequest(url, config, requestKey) {
            console.log(`🌐 API Request: ${config.method} ${url}`);

            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new APIError(
                        `HTTP ${response.status}: ${response.statusText}`,
                        response.status,
                        url,
                        config.method
                    );
                }

                const contentType = response.headers.get('content-type');
                let result;

                if (contentType?.includes('application/json')) {
                    result = await response.json();
                } else {
                    result = await response.text();
                }

                // Aplicar interceptors de response
                for (const interceptor of this.interceptors.response) {
                    result = await interceptor(result, response) || result;
                }

                console.log(`✅ API Success: ${config.method} ${url}`);
                return this._normalizeResponse(result);

            } catch (error) {
                console.error(`❌ API Error: ${config.method} ${url}`, error);
                throw this._handleError(error, url, config.method);
            }
        }

        /**
         * Normaliza resposta da API (Guidelines.MD compliance)
         */
        _normalizeResponse(response) {
            // Se resposta já está no formato padrão
            if (response && typeof response === 'object' && 'success' in response) {
                return {
                    success: response.success,
                    data: response.data || null,
                    message: response.message || '',
                    pagination: response.pagination || null,
                    meta: response.meta || null,
                    timestamp: new Date().toISOString()
                };
            }

            // Normalizar resposta simples
            return {
                success: true,
                data: response,
                message: 'Success',
                pagination: null,
                meta: null,
                timestamp: new Date().toISOString()
            };
        }

        /**
         * Tratamento centralizado de erros
         */
        _handleError(error, url, method) {
            if (error instanceof APIError) {
                return error;
            }

            if (error.name === 'AbortError') {
                return new APIError('Request timeout', 408, url, method);
            }

            if (error.name === 'TypeError') {
                return new APIError('Network error', 0, url, method);
            }

            return new APIError(error.message || 'Unknown error', 500, url, method);
        }

        /**
         * Adicionar interceptor de request
         */
        addRequestInterceptor(interceptor) {
            this.interceptors.request.push(interceptor);
        }

        /**
         * Adicionar interceptor de response
         */
        addResponseInterceptor(interceptor) {
            this.interceptors.response.push(interceptor);
        }
    }

    // ==============================================
    // CLASSE DE ERRO PERSONALIZADA
    // ==============================================
    
    class APIError extends Error {
        constructor(message, status = 500, url = '', method = '') {
            super(message);
            this.name = 'APIError';
            this.status = status;
            this.url = url;
            this.method = method;
            this.timestamp = new Date().toISOString();
        }

        get isNetworkError() {
            return this.status === 0;
        }

        get isTimeout() {
            return this.status === 408;
        }

        get isServerError() {
            return this.status >= 500;
        }

        get isClientError() {
            return this.status >= 400 && this.status < 500;
        }

        get isUnauthorized() {
            return this.status === 401;
        }

        get isForbidden() {
            return this.status === 403;
        }

        get isNotFound() {
            return this.status === 404;
        }
    }

    // ==============================================
    // HELPER PARA MÓDULOS
    // ==============================================
    
    class ModuleAPIHelper {
        constructor(moduleName, apiClient) {
            this.moduleName = moduleName;
            this.api = apiClient;
            this.currentRequests = new Set();
        }

        /**
         * Buscar dados com UI states automáticos
         */
        async fetchWithStates(endpoint, options = {}) {
            const { 
                loadingElement,
                targetElement,
                onLoading,
                onSuccess,
                onError,
                onEmpty,
                transform
            } = options;

            const requestId = `${this.moduleName}:${endpoint}:${Date.now()}`;
            this.currentRequests.add(requestId);

            try {
                // Estado: Loading
                this._setState(UI_STATES.LOADING, { 
                    loadingElement, 
                    targetElement, 
                    onLoading 
                });
                
                const result = await this.api.get(endpoint);
                
                if (!result.success) {
                    throw new Error(result.message || 'API returned error');
                }

                let data = result.data;

                // Aplicar transformação se fornecida
                if (transform && typeof transform === 'function') {
                    data = transform(data);
                }

                // Estado: Empty ou Success
                if (!data || (Array.isArray(data) && data.length === 0)) {
                    this._setState(UI_STATES.EMPTY, { 
                        targetElement, 
                        onEmpty 
                    });
                } else {
                    this._setState(UI_STATES.SUCCESS, { 
                        targetElement, 
                        onSuccess, 
                        data 
                    });
                }

                return { ...result, data };

            } catch (error) {
                console.error(`❌ ${this.moduleName} fetch error:`, error);
                this._setState(UI_STATES.ERROR, { 
                    targetElement, 
                    onError, 
                    error 
                });
                throw error;
            } finally {
                this.currentRequests.delete(requestId);
            }
        }

        /**
         * Criar dados
         */
        async create(endpoint, data, options = {}) {
            try {
                const result = await this.api.post(endpoint, data);
                console.log(`✅ ${this.moduleName} created:`, result.data);
                return result;
            } catch (error) {
                console.error(`❌ ${this.moduleName} create error:`, error);
                throw error;
            }
        }

        /**
         * Atualizar dados
         */
        async update(endpoint, data, options = {}) {
            try {
                const result = await this.api.put(endpoint, data);
                console.log(`✅ ${this.moduleName} updated:`, result.data);
                return result;
            } catch (error) {
                console.error(`❌ ${this.moduleName} update error:`, error);
                throw error;
            }
        }

        /**
         * Deletar dados
         */
        async delete(endpoint, options = {}) {
            try {
                const result = await this.api.delete(endpoint);
                console.log(`✅ ${this.moduleName} deleted`);
                return result;
            } catch (error) {
                console.error(`❌ ${this.moduleName} delete error:`, error);
                throw error;
            }
        }

        /**
         * Aplicar estado na UI
         */
        _setState(state, options = {}) {
            const { 
                loadingElement, 
                targetElement, 
                onLoading, 
                onSuccess, 
                onError, 
                onEmpty, 
                data, 
                error 
            } = options;

            switch (state) {
                case UI_STATES.LOADING:
                    if (onLoading) onLoading();
                    if (loadingElement) this._showLoading(loadingElement);
                    if (targetElement && targetElement !== loadingElement) {
                        this._showLoading(targetElement);
                    }
                    break;

                case UI_STATES.SUCCESS:
                    if (onSuccess) onSuccess(data);
                    break;

                case UI_STATES.ERROR:
                    if (onError) onError(error);
                    if (targetElement) this._showError(targetElement, error);
                    break;

                case UI_STATES.EMPTY:
                    if (onEmpty) onEmpty();
                    if (targetElement) this._showEmpty(targetElement);
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
                const errorMessage = error?.message || 'Erro ao carregar dados';
                const isNetworkError = error?.isNetworkError;
                
                element.innerHTML = `
                    <div class="module-isolated-error-state">
                        <div class="module-isolated-error-icon">❌</div>
                        <h3>Ops! Algo deu errado</h3>
                        <p>${errorMessage}</p>
                        ${isNetworkError ? '<p class="module-isolated-text-muted">Verifique sua conexão com a internet</p>' : ''}
                        <button 
                            onclick="location.reload()" 
                            class="module-isolated-btn-secondary">
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
                        <div class="module-isolated-empty-icon">📭</div>
                        <h3>Nenhum dado encontrado</h3>
                        <p>Não há ${this.moduleName.toLowerCase()} para exibir no momento.</p>
                    </div>
                `;
            }
        }

        /**
         * Cancelar todas as requisições pendentes
         */
        cancelAllRequests() {
            this.currentRequests.clear();
            console.log(`🚫 ${this.moduleName} requests cancelled`);
        }
    }

    // ==============================================
    // UTILITÁRIOS ADICIONAIS
    // ==============================================
    
    /**
     * Cache simples para endpoints
     */
    class APICache {
        constructor(ttl = 5 * 60 * 1000) { // 5 minutos padrão
            this.cache = new Map();
            this.ttl = ttl;
        }

        set(key, data) {
            this.cache.set(key, {
                data,
                timestamp: Date.now()
            });
        }

        get(key) {
            const item = this.cache.get(key);
            if (!item) return null;

            if (Date.now() - item.timestamp > this.ttl) {
                this.cache.delete(key);
                return null;
            }

            return item.data;
        }

        clear() {
            this.cache.clear();
        }

        has(key) {
            return this.cache.has(key) && !this._isExpired(key);
        }

        _isExpired(key) {
            const item = this.cache.get(key);
            return item && (Date.now() - item.timestamp > this.ttl);
        }
    }

    // ==============================================
    // INSTÂNCIA GLOBAL E EXPOSIÇÃO
    // ==============================================
    
    // Instância global da API
    const apiClient = new APIClient();
    const apiCache = new APICache();

    // Adicionar interceptor de cache
    apiClient.addResponseInterceptor((response, httpResponse) => {
        if (httpResponse.request?.method === 'GET') {
            const cacheKey = httpResponse.url;
            apiCache.set(cacheKey, response);
        }
        return response;
    });

    // Exposição global (Guidelines.MD compliance)
    window.APIClient = APIClient;
    window.APIError = APIError;
    window.ModuleAPIHelper = ModuleAPIHelper;
    window.APICache = APICache;
    window.UI_STATES = UI_STATES;
    
    // Instâncias prontas para uso
    window.apiClient = apiClient;
    window.apiCache = apiCache;

    // Helper factory para módulos
    window.createModuleAPI = function(moduleName) {
        return new ModuleAPIHelper(moduleName, apiClient);
    };

    // Utilitário para criar endpoints padronizados
    window.createEndpoints = function(basePath) {
        return {
            list: () => basePath,
            get: (id) => `${basePath}/${id}`,
            create: () => basePath,
            update: (id) => `${basePath}/${id}`,
            delete: (id) => `${basePath}/${id}`,
            custom: (path) => `${basePath}${path}`
        };
    };

    console.log('🌐 API Client carregado - Guidelines.MD compliance v1.0');
    console.log('📋 Módulos podem usar: window.createModuleAPI("ModuleName")');

})();

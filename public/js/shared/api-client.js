/**
 * @fileoverview API Client Utility
 * @version 1.0.0
 * @description HTTP client wrapper with error handling and retry logic
 */

// ==============================================
// API CLIENT
// ==============================================

export class ApiClient {
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
     * Main request method
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
                return cachedData.data;
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

                return response;
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
     * Execute the actual HTTP request
     */
    async executeRequest(method, url, data, config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        try {
            const fetchOptions = {
                method,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...config.headers
                }
            };

            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                fetchOptions.body = JSON.stringify(data);
            }

            console.log(`🌐 ${method} ${url}`, data ? { body: data } : '');

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new ApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    url
                );
            }

            const responseData = await this.parseResponse(response);
            
            console.log(`✅ ${method} ${url} completed successfully`);
            
            return {
                success: true,
                data: responseData,
                status: response.status,
                headers: response.headers
            };

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
        
        if (contentType?.includes('application/json')) {
            return await response.json();
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
// API ERROR CLASS
// ==============================================

export class ApiError extends Error {
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
// DEFAULT EXPORT
// ==============================================

export default ApiClient;

/**
 * Student Data Service
 * Sistema centralizado de cache e deduplicação para dados de estudantes
 * 
 * Features:
 * - In-memory caching com TTL
 * - Promise deduplication (in-flight requests)
 * - Bundle loading (Promise.all)
 * - Selective refresh
 * - Cache invalidation
 * - Performance monitoring
 */

class StudentDataService {
    constructor(moduleAPIHelper) {
        // Use a propriedade 'api' do ModuleAPIHelper que contém o API Client real
        this.api = moduleAPIHelper.api || moduleAPIHelper;
        
        // In-memory cache
        this.cache = new Map();
        
        // In-flight requests (Promise deduplication)
        this.inFlight = new Map();
        
        // Cache configuration
        this.config = {
            ttl: 5 * 60 * 1000, // 5 minutes
            maxEntries: 100,
            enableLogging: true
        };
        
        // Performance metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            fetches: 0,
            bundles: 0
        };
        
        this._setupPeriodicCleanup();
    }

    // ==============================================
    // CORE DATA METHODS
    // ==============================================

    /**
     * Get student basic data
     */
    async getStudent(id) {
        const cacheKey = `student:${id}`;
        return this._getCachedOrFetch(cacheKey, () => this._fetchStudent(id));
    }

    /**
     * Get student subscription
     */
    async getSubscription(id) {
        const cacheKey = `subscription:${id}`;
        return this._getCachedOrFetch(cacheKey, () => this._fetchSubscription(id));
    }

    /**
     * Get student attendances
     */
    async getAttendances(id) {
        const cacheKey = `attendances:${id}`;
        return this._getCachedOrFetch(cacheKey, () => this._fetchAttendances(id));
    }

    /**
     * Get financial summary
     */
    async getFinancialSummary(id) {
        const cacheKey = `financial:${id}`;
        return this._getCachedOrFetch(cacheKey, () => this._fetchFinancialSummary(id));
    }

    /**
     * Get billing plans (global cache)
     */
    async getBillingPlans() {
        const cacheKey = 'billing-plans';
        return this._getCachedOrFetch(cacheKey, () => this._fetchBillingPlans());
    }

    async getCourses(id) {
        const cacheKey = `courses:${id}`;
        return this._getCachedOrFetch(cacheKey, () => this._fetchCourses(id));
    }

    // ==============================================
    // BUNDLE LOADING
    // ==============================================

    /**
     * Prefetch all student data in a single bundle
     * Uses Promise.all for parallel loading
     */
    async prefetchStudent(id) {
        const bundleKey = `bundle:${id}`;
        
        // Check if bundle is in cache
        if (this._isInCache(bundleKey)) {
            this._log(`📦 [CACHE] Bundle para estudante ${id} encontrado`);
            return this._getFromCache(bundleKey);
        }

        // Check if bundle is already being fetched
        if (this.inFlight.has(bundleKey)) {
            this._log(`📦 [IN-FLIGHT] Bundle para estudante ${id} já está carregando...`);
            return this.inFlight.get(bundleKey);
        }

        this._log(`📦 [NETWORK] Carregando bundle para estudante ${id}...`);
        this.metrics.bundles++;

        // Create bundle promise
        const bundlePromise = this._createStudentBundle(id)
            .then(bundle => {
                // Store individual items in cache
                this._storeInCache(`student:${id}`, bundle.student);
                this._storeInCache(`subscription:${id}`, bundle.subscription);
                this._storeInCache(`attendances:${id}`, bundle.attendances);
                this._storeInCache(`financial:${id}`, bundle.financial);
                this._storeInCache(`billing-plans`, bundle.billingPlans);
                this._storeInCache(`courses:${id}`, bundle.courses);
                
                // Store bundle itself
                this._storeInCache(bundleKey, bundle);
                
                this._log(`✅ Bundle para estudante ${id} carregado com sucesso`);
                return bundle;
            })
            .catch(error => {
                this._log(`❌ Erro ao carregar bundle para estudante ${id}:`, error);
                throw error;
            })
            .finally(() => {
                // Clean up in-flight
                this.inFlight.delete(bundleKey);
            });

        // Store in-flight promise
        this.inFlight.set(bundleKey, bundlePromise);
        
        return bundlePromise;
    }

    /**
     * Internal bundle creation with Promise.all
     */
    async _createStudentBundle(id) {
        try {
            const [student, subscription, attendances, financial, billingPlans, courses] = await Promise.all([
                this._fetchStudent(id),
                this._fetchSubscription(id),
                this._fetchAttendances(id),
                this._fetchFinancialSummary(id),
                this._fetchBillingPlans(),
                this._fetchCourses(id)
            ]);

            return {
                student,
                subscription,
                attendances,
                financial,
                billingPlans,
                courses,
                timestamp: Date.now(),
                bundleId: id
            };
        } catch (error) {
            console.error(`❌ Erro ao criar bundle para estudante ${id}:`, error);
            throw error;
        }
    }

    // ==============================================
    // SELECTIVE REFRESH
    // ==============================================

    /**
     * Refresh specific data keys for a student
     * @param {string} id - Student ID
     * @param {string[]} keysToRefresh - ['student', 'subscription', 'attendances', 'financial', 'courses']
     */
    async refreshStudent(id, keysToRefresh = ['student']) {
        this._log(`🔄 Atualizando dados para estudante ${id}:`, keysToRefresh);

        const refreshPromises = [];
        const refreshedData = {};

        for (const key of keysToRefresh) {
            const cacheKey = `${key}:${id}`;
            
            // Invalidate cache
            this._invalidateKey(cacheKey);
            
            // Create refresh promise
            let refreshPromise;
            switch (key) {
                case 'student':
                    refreshPromise = this.getStudent(id);
                    break;
                case 'subscription':
                    refreshPromise = this.getSubscription(id);
                    break;
                case 'attendances':
                    refreshPromise = this.getAttendances(id);
                    break;
                case 'financial':
                    refreshPromise = this.getFinancialSummary(id);
                    break;
                case 'courses':
                    refreshPromise = this.getCourses(id);
                    break;
                default:
                    continue;
            }
            
            refreshPromises.push(
                refreshPromise.then(data => {
                    refreshedData[key] = data;
                    return data;
                })
            );
        }

        await Promise.all(refreshPromises);
        
        // Invalidate bundle cache
        this._invalidateKey(`bundle:${id}`);
        
        this._log(`✅ Dados atualizados para estudante ${id}`);
        return refreshedData;
    }

    // ==============================================
    // CACHE MANAGEMENT
    // ==============================================

    /**
     * Generic cached-or-fetch pattern
     */
    async _getCachedOrFetch(cacheKey, fetchFn) {
        // Check cache first
        if (this._isInCache(cacheKey)) {
            this.metrics.hits++;
            this._log(`💾 [CACHE] ${cacheKey}`);
            return this._getFromCache(cacheKey);
        }

        // Check in-flight requests
        if (this.inFlight.has(cacheKey)) {
            this._log(`⏳ [IN-FLIGHT] ${cacheKey}`);
            return this.inFlight.get(cacheKey);
        }

        // Fetch from network
        this.metrics.misses++;
        this._log(`🌐 [NETWORK] ${cacheKey}`);
        
        const fetchPromise = fetchFn()
            .then(data => {
                this._storeInCache(cacheKey, data);
                return data;
            })
            .finally(() => {
                this.inFlight.delete(cacheKey);
            });

        this.inFlight.set(cacheKey, fetchPromise);
        return fetchPromise;
    }

    /**
     * Check if key is in cache and not expired
     */
    _isInCache(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        const isExpired = Date.now() - item.timestamp > this.config.ttl;
        if (isExpired) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * Get data from cache
     */
    _getFromCache(key) {
        const item = this.cache.get(key);
        return item ? item.data : null;
    }

    /**
     * Store data in cache
     */
    _storeInCache(key, data) {
        // Implement LRU eviction if needed
        if (this.cache.size >= this.config.maxEntries) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Invalidate specific cache key
     */
    _invalidateKey(key) {
        this.cache.delete(key);
        this.inFlight.delete(key);
        this._log(`🗑️ Cache invalidado: ${key}`);
    }

    /**
     * Invalidate all cache for a student
     */
    invalidateStudent(id) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(`:${id}`) || key === `bundle:${id}`) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this._invalidateKey(key));
        this._log(`🗑️ Cache completo invalidado para estudante ${id}`);
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        this.inFlight.clear();
        this._log(`🗑️ Cache completo limpo`);
    }

    // ==============================================
    // API METHODS
    // ==============================================

    async _fetchStudent(id) {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/students/${id}`);
        return response.data;
    }

    async _fetchSubscription(id) {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/students/${id}/subscription`);
        return response.data;
    }

    async _fetchAttendances(id) {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/students/${id}/attendances`);
        return response.data;
    }

    async _fetchFinancialSummary(id) {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/students/${id}/financial-summary`);
        return response.data;
    }

    async _fetchBillingPlans() {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/billing-plans`);
        return response.data;
    }

    async _fetchCourses(id) {
        this.metrics.fetches++;
        const response = await this.api.get(`/api/students/${id}/courses`);
        return response.data;
    }

    // ==============================================
    // UTILITIES
    // ==============================================

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            inFlightCount: this.inFlight.size,
            hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0
        };
    }

    /**
     * Setup periodic cleanup of expired entries
     */
    _setupPeriodicCleanup() {
        setInterval(() => {
            const now = Date.now();
            const keysToDelete = [];
            
            for (const [key, item] of this.cache.entries()) {
                if (now - item.timestamp > this.config.ttl) {
                    keysToDelete.push(key);
                }
            }
            
            keysToDelete.forEach(key => this.cache.delete(key));
            
            if (keysToDelete.length > 0) {
                this._log(`🧹 Limpeza automática: ${keysToDelete.length} entradas expiradas removidas`);
            }
        }, this.config.ttl / 2); // Run cleanup at half TTL interval
    }

    /**
     * Logging utility
     */
    _log(message, ...args) {
        if (this.config.enableLogging) {
            console.log(`🎓 [StudentDataService] ${message}`, ...args);
        }
    }
}

// Factory function
function createStudentDataService(moduleAPIHelper) {
    return new StudentDataService(moduleAPIHelper);
}

export {
    StudentDataService,
    createStudentDataService
};

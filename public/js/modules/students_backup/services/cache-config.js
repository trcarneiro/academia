/**
 * Cache Configuration and Management
 * Centralized cache settings and invalidation strategies
 */

export const CacheConfig = {
    // TTL Settings (in milliseconds)
    ttl: {
        student: 5 * 60 * 1000,       // 5 minutes
        subscription: 10 * 60 * 1000,  // 10 minutes
        attendances: 2 * 60 * 1000,    // 2 minutes (more dynamic)
        financial: 5 * 60 * 1000,      // 5 minutes
        billingPlans: 30 * 60 * 1000,  // 30 minutes (rarely changes)
        bundle: 5 * 60 * 1000          // 5 minutes
    },
    
    // Cache size limits
    limits: {
        maxEntries: 100,
        maxMemoryMB: 50
    },
    
    // Features
    features: {
        enableLogging: true,
        enableMetrics: true,
        enableCompression: false,
        autoCleanup: true
    }
};

/**
 * Cache Invalidation Events
 * Define when cache should be invalidated
 */
export const CacheEvents = {
    // Student events
    STUDENT_UPDATED: 'student:updated',
    STUDENT_DELETED: 'student:deleted',
    STUDENT_SUBSCRIPTION_CHANGED: 'student:subscription:changed',
    
    // Attendance events
    ATTENDANCE_RECORDED: 'attendance:recorded',
    ATTENDANCE_UPDATED: 'attendance:updated',
    
    // Financial events
    PAYMENT_RECEIVED: 'payment:received',
    SUBSCRIPTION_ACTIVATED: 'subscription:activated',
    SUBSCRIPTION_CANCELLED: 'subscription:cancelled',
    
    // Global events
    BILLING_PLANS_UPDATED: 'billing-plans:updated'
};

/**
 * Cache Invalidation Rules
 * Map events to cache keys that should be invalidated
 */
export const InvalidationRules = {
    [CacheEvents.STUDENT_UPDATED]: (studentId) => [
        `student:${studentId}`,
        `bundle:${studentId}`
    ],
    
    [CacheEvents.STUDENT_SUBSCRIPTION_CHANGED]: (studentId) => [
        `subscription:${studentId}`,
        `financial:${studentId}`,
        `bundle:${studentId}`
    ],
    
    [CacheEvents.ATTENDANCE_RECORDED]: (studentId) => [
        `attendances:${studentId}`,
        `bundle:${studentId}`
    ],
    
    [CacheEvents.PAYMENT_RECEIVED]: (studentId) => [
        `financial:${studentId}`,
        `subscription:${studentId}`,
        `bundle:${studentId}`
    ],
    
    [CacheEvents.BILLING_PLANS_UPDATED]: () => [
        'billing-plans'
        // Also invalidate all bundles since they contain billing plans
    ]
};

/**
 * Cache Event Manager
 * Handles cache invalidation based on events
 */
export class CacheEventManager {
    constructor(dataService) {
        this.dataService = dataService;
        this.listeners = new Map();
        
        this.setupEventListeners();
    }
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Listen to custom cache events
        Object.values(CacheEvents).forEach(event => {
            document.addEventListener(event, (e) => {
                this.handleCacheEvent(event, e.detail);
            });
        });
        
        // Listen to API response events for automatic invalidation
        this.setupAPIEventListeners();
    }
    
    /**
     * Setup API event listeners for automatic invalidation
     */
    setupAPIEventListeners() {
        // Listen to successful API operations
        document.addEventListener('api:student:updated', (e) => {
            this.invalidateForEvent(CacheEvents.STUDENT_UPDATED, e.detail.studentId);
        });
        
        document.addEventListener('api:subscription:changed', (e) => {
            this.invalidateForEvent(CacheEvents.STUDENT_SUBSCRIPTION_CHANGED, e.detail.studentId);
        });
        
        document.addEventListener('api:attendance:recorded', (e) => {
            this.invalidateForEvent(CacheEvents.ATTENDANCE_RECORDED, e.detail.studentId);
        });
        
        document.addEventListener('api:payment:received', (e) => {
            this.invalidateForEvent(CacheEvents.PAYMENT_RECEIVED, e.detail.studentId);
        });
    }
    
    /**
     * Handle cache invalidation events
     */
    handleCacheEvent(event, data) {
        console.log(`🗑️ [CacheEvent] Handling ${event}:`, data);
        this.invalidateForEvent(event, data);
    }
    
    /**
     * Invalidate cache based on event and data
     */
    invalidateForEvent(event, data) {
        const rule = InvalidationRules[event];
        if (!rule) return;
        
        const keysToInvalidate = typeof rule === 'function' ? rule(data) : rule;
        
        keysToInvalidate.forEach(key => {
            this.dataService._invalidateKey(key);
        });
        
        console.log(`🗑️ [CacheInvalidation] Invalidated ${keysToInvalidate.length} keys for event ${event}`);
    }
    
    /**
     * Emit cache event
     */
    emit(event, data) {
        const customEvent = new CustomEvent(event, { detail: data });
        document.dispatchEvent(customEvent);
    }
}

/**
 * Cache Performance Monitor
 * Track cache performance and provide insights
 */
export class CachePerformanceMonitor {
    constructor() {
        this.metrics = {
            hits: 0,
            misses: 0,
            invalidations: 0,
            fetches: 0,
            bundleLoads: 0,
            errors: 0,
            totalResponseTime: 0,
            avgResponseTime: 0
        };
        
        this.startTime = Date.now();
        this.reportInterval = null;
        
        if (CacheConfig.features.enableMetrics) {
            this.startPeriodicReporting();
        }
    }
    
    /**
     * Record cache hit
     */
    recordHit() {
        this.metrics.hits++;
        this.updateHitRate();
    }
    
    /**
     * Record cache miss
     */
    recordMiss() {
        this.metrics.misses++;
        this.updateHitRate();
    }
    
    /**
     * Record cache invalidation
     */
    recordInvalidation() {
        this.metrics.invalidations++;
    }
    
    /**
     * Record API fetch
     */
    recordFetch(responseTime) {
        this.metrics.fetches++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.fetches;
    }
    
    /**
     * Record bundle load
     */
    recordBundleLoad() {
        this.metrics.bundleLoads++;
    }
    
    /**
     * Record error
     */
    recordError() {
        this.metrics.errors++;
    }
    
    /**
     * Update hit rate
     */
    updateHitRate() {
        const total = this.metrics.hits + this.metrics.misses;
        this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    }
    
    /**
     * Get performance report
     */
    getReport() {
        const uptime = Date.now() - this.startTime;
        
        return {
            ...this.metrics,
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime)
        };
    }
    
    /**
     * Format uptime for display
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    /**
     * Start periodic reporting
     */
    startPeriodicReporting() {
        this.reportInterval = setInterval(() => {
            const report = this.getReport();
            console.log('📊 [CacheMetrics] Performance Report:', report);
        }, 60000); // Report every minute
    }
    
    /**
     * Stop periodic reporting
     */
    stopPeriodicReporting() {
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }
}

// Global cache utilities
export const CacheUtils = {
    /**
     * Format cache key for consistency
     */
    formatKey: (type, id) => `${type}:${id}`,
    
    /**
     * Extract type and ID from cache key
     */
    parseKey: (key) => {
        const [type, id] = key.split(':');
        return { type, id };
    },
    
    /**
     * Check if cache key matches pattern
     */
    keyMatches: (key, pattern) => {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return regex.test(key);
        }
        return key === pattern;
    }
};

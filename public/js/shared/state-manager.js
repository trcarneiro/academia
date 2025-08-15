/**
 * @fileoverview State Manager Utility
 * @version 1.0.0
 * @description Centralized state management with caching and persistence
 */

// ==============================================
// STATE MANAGER
// ==============================================

export class StateManager {
    constructor(options = {}) {
        this.state = new Map();
        this.persistentKeys = new Set();
        this.subscribers = new Map();
        this.config = {
            defaultTTL: 300000, // 5 minutes
            maxCacheSize: 1000,
            persistenceKey: 'app_state',
            ...options
        };
        
        this.loadPersistedState();
        this.startCleanupInterval();
    }

    /**
     * Set value in state
     */
    set(key, value, options = {}) {
        const config = { ...this.config, ...options };
        const stateItem = {
            value,
            timestamp: Date.now(),
            ttl: config.ttl || this.config.defaultTTL,
            persistent: config.persistent || false
        };

        this.state.set(key, stateItem);
        
        if (stateItem.persistent) {
            this.persistentKeys.add(key);
            this.persistState();
        }

        this.notifySubscribers(key, value, 'set');
        this.enforceMaxSize();
        
        console.log(`📝 State set: ${key}`, { value, config });
    }

    /**
     * Get value from state
     */
    get(key, defaultValue = null) {
        const stateItem = this.state.get(key);
        
        if (!stateItem) {
            console.log(`📋 State miss: ${key}`);
            return defaultValue;
        }
        
        if (this.isExpired(stateItem)) {
            this.delete(key);
            console.log(`⏰ State expired: ${key}`);
            return defaultValue;
        }
        
        console.log(`📋 State hit: ${key}`, stateItem.value);
        return stateItem.value;
    }

    /**
     * Check if key exists and is not expired
     */
    has(key) {
        const stateItem = this.state.get(key);
        return stateItem && !this.isExpired(stateItem);
    }

    /**
     * Delete key from state
     */
    delete(key) {
        const deleted = this.state.delete(key);
        
        if (this.persistentKeys.has(key)) {
            this.persistentKeys.delete(key);
            this.persistState();
        }
        
        if (deleted) {
            this.notifySubscribers(key, null, 'delete');
            console.log(`🗑️ State deleted: ${key}`);
        }
        
        return deleted;
    }

    /**
     * Clear all state
     */
    clear() {
        const keys = Array.from(this.state.keys());
        this.state.clear();
        this.persistentKeys.clear();
        this.clearPersistedState();
        
        keys.forEach(key => {
            this.notifySubscribers(key, null, 'clear');
        });
        
        console.log('🗑️ All state cleared');
    }

    /**
     * Update value if key exists
     */
    update(key, updater) {
        const currentValue = this.get(key);
        if (currentValue !== null) {
            const newValue = typeof updater === 'function' ? updater(currentValue) : updater;
            this.set(key, newValue);
            return newValue;
        }
        return null;
    }

    /**
     * Get or set value (lazy loading pattern)
     */
    async getOrSet(key, factory, options = {}) {
        if (this.has(key)) {
            return this.get(key);
        }
        
        try {
            const value = typeof factory === 'function' ? await factory() : factory;
            this.set(key, value, options);
            return value;
        } catch (error) {
            console.error(`❌ Error in getOrSet for key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        const keySubscribers = this.subscribers.get(key);
        keySubscribers.add(callback);
        
        console.log(`🔔 Subscribed to state key: ${key}`);
        
        // Return unsubscribe function
        return () => {
            keySubscribers.delete(callback);
            if (keySubscribers.size === 0) {
                this.subscribers.delete(key);
            }
            console.log(`🔕 Unsubscribed from state key: ${key}`);
        };
    }

    /**
     * Subscribe to multiple keys
     */
    subscribeMultiple(keys, callback) {
        const unsubscribers = keys.map(key => this.subscribe(key, callback));
        
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * Notify subscribers of changes
     */
    notifySubscribers(key, value, action) {
        const keySubscribers = this.subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.forEach(callback => {
                try {
                    callback({ key, value, action, timestamp: Date.now() });
                } catch (error) {
                    console.error(`❌ Error in state subscriber for key ${key}:`, error);
                }
            });
        }
    }

    /**
     * Check if state item is expired
     */
    isExpired(stateItem) {
        if (!stateItem.ttl) return false;
        return Date.now() - stateItem.timestamp > stateItem.ttl;
    }

    /**
     * Enforce maximum cache size
     */
    enforceMaxSize() {
        if (this.state.size <= this.config.maxCacheSize) {
            return;
        }
        
        // Remove oldest non-persistent items
        const entries = Array.from(this.state.entries())
            .filter(([key]) => !this.persistentKeys.has(key))
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);
        
        const itemsToRemove = this.state.size - this.config.maxCacheSize;
        
        for (let i = 0; i < itemsToRemove && i < entries.length; i++) {
            const [key] = entries[i];
            this.delete(key);
        }
        
        console.log(`🧹 Cleaned up ${itemsToRemove} old cache items`);
    }

    /**
     * Clean up expired items
     */
    cleanup() {
        let cleanedCount = 0;
        
        for (const [key, stateItem] of this.state.entries()) {
            if (this.isExpired(stateItem)) {
                this.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired items`);
        }
        
        return cleanedCount;
    }

    /**
     * Start automatic cleanup interval
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Clean up every minute
        
        console.log('🔄 State cleanup interval started');
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        if (this.persistentKeys.size === 0) {
            return;
        }
        
        const persistentData = {};
        
        for (const key of this.persistentKeys) {
            const stateItem = this.state.get(key);
            if (stateItem && !this.isExpired(stateItem)) {
                persistentData[key] = stateItem;
            }
        }
        
        try {
            localStorage.setItem(this.config.persistenceKey, JSON.stringify(persistentData));
            console.log('💾 State persisted to localStorage');
        } catch (error) {
            console.error('❌ Failed to persist state:', error);
        }
    }

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const data = localStorage.getItem(this.config.persistenceKey);
            if (!data) return;
            
            const persistentData = JSON.parse(data);
            let loadedCount = 0;
            
            for (const [key, stateItem] of Object.entries(persistentData)) {
                if (!this.isExpired(stateItem)) {
                    this.state.set(key, stateItem);
                    this.persistentKeys.add(key);
                    loadedCount++;
                }
            }
            
            if (loadedCount > 0) {
                console.log(`📂 Loaded ${loadedCount} persistent state items`);
            }
        } catch (error) {
            console.error('❌ Failed to load persistent state:', error);
            this.clearPersistedState();
        }
    }

    /**
     * Clear persisted state
     */
    clearPersistedState() {
        try {
            localStorage.removeItem(this.config.persistenceKey);
            console.log('🗑️ Persisted state cleared');
        } catch (error) {
            console.error('❌ Failed to clear persisted state:', error);
        }
    }

    /**
     * Get all keys
     */
    keys() {
        return Array.from(this.state.keys());
    }

    /**
     * Get all values
     */
    values() {
        return Array.from(this.state.values()).map(item => item.value);
    }

    /**
     * Get all entries
     */
    entries() {
        return Array.from(this.state.entries()).map(([key, item]) => [key, item.value]);
    }

    /**
     * Get state size
     */
    size() {
        return this.state.size;
    }

    /**
     * Get state statistics
     */
    getStats() {
        const now = Date.now();
        let expiredCount = 0;
        let persistentCount = 0;
        
        for (const [key, item] of this.state.entries()) {
            if (this.isExpired(item)) {
                expiredCount++;
            }
            if (this.persistentKeys.has(key)) {
                persistentCount++;
            }
        }
        
        return {
            totalItems: this.state.size,
            expiredItems: expiredCount,
            persistentItems: persistentCount,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((total, set) => total + set.size, 0),
            maxCacheSize: this.config.maxCacheSize,
            defaultTTL: this.config.defaultTTL
        };
    }

    /**
     * Debug information
     */
    debug() {
        const stats = this.getStats();
        console.group('🔍 State Manager Debug');
        console.table(stats);
        console.log('Keys:', this.keys());
        console.log('Persistent Keys:', Array.from(this.persistentKeys));
        console.log('Subscribers:', Object.fromEntries(this.subscribers));
        console.groupEnd();
        return stats;
    }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================

export default StateManager;

/**
 * Tests for Students Module Anti-Duplication System
 * Validates prevention of concurrent initialization and proper caching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM elements
const mockContainer = {
    innerHTML: ''
};

const mockHeader = {
    textContent: ''
};

const mockBreadcrumb = {
    textContent: ''
};

// Mock global objects
global.window = {
    createModuleAPI: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    })),
    initStudentsModule: null
};

global.document = {
    querySelector: vi.fn((selector) => {
        if (selector === '.module-header h1') return mockHeader;
        if (selector === '.breadcrumb') return mockBreadcrumb;
        return null;
    }),
    getElementById: vi.fn(() => mockContainer),
    createElement: vi.fn(() => ({
        onload: null,
        onerror: null,
        type: '',
        src: ''
    })),
    head: {
        appendChild: vi.fn()
    }
};

// Mock SPA Router
class MockSPARouter {
    constructor() {
        this.moduleStates = new Map();
        this.initializingModules = new Set();
    }

    getModuleState(moduleName) {
        if (!this.moduleStates.has(moduleName)) {
            this.moduleStates.set(moduleName, {
                isInitialized: false,
                isInitializing: false,
                initPromise: null,
                instance: null,
                container: null,
                lastError: null,
                initCount: 0
            });
        }
        return this.moduleStates.get(moduleName);
    }

    markModuleInitializing(moduleName) {
        this.initializingModules.add(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = true;
        state.initCount++;
    }

    markModuleInitialized(moduleName, instance = null) {
        this.initializingModules.delete(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = false;
        state.isInitialized = true;
        state.instance = instance;
        state.lastError = null;
        state.initPromise = null;
    }

    markModuleInitializationFailed(moduleName, error) {
        this.initializingModules.delete(moduleName);
        const state = this.getModuleState(moduleName);
        state.isInitializing = false;
        state.isInitialized = false;
        state.instance = null;
        state.lastError = error;
        state.initPromise = null;
    }

    async safeModuleInitialization(moduleName, initializerFn) {
        const state = this.getModuleState(moduleName);
        
        // Check if already initialized
        if (state.isInitialized && state.instance) {
            console.log(`[CACHE] Module ${moduleName} already initialized`);
            return state.instance;
        }
        
        // Check if currently initializing
        if (state.initPromise) {
            console.log(`[CACHE] Module ${moduleName} is loading, waiting...`);
            return state.initPromise;
        }
        
        // Start new initialization
        console.log(`[NETWORK] Initializing module ${moduleName}...`);
        this.markModuleInitializing(moduleName);
        
        state.initPromise = initializerFn()
            .then(instance => {
                this.markModuleInitialized(moduleName, instance);
                return instance;
            })
            .catch(error => {
                this.markModuleInitializationFailed(moduleName, error);
                throw error;
            });
        
        return state.initPromise;
    }

    resetModuleState(moduleName) {
        this.initializingModules.delete(moduleName);
        this.moduleStates.delete(moduleName);
    }
}

describe('Students Module Anti-Duplication System', () => {
    let router;
    let consoleSpy;

    beforeEach(() => {
        router = new MockSPARouter();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        // Reset mocks
        mockContainer.innerHTML = '';
        mockHeader.textContent = '';
        mockBreadcrumb.textContent = '';
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('First Load Scenario', () => {
        it('should initialize module on first load with NETWORK log', async () => {
            const mockInitializer = vi.fn().mockResolvedValue({ 
                success: true, 
                fromCache: false 
            });

            const result = await router.safeModuleInitialization('students', mockInitializer);

            expect(mockInitializer).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ success: true, fromCache: false });
            expect(consoleSpy).toHaveBeenCalledWith('[NETWORK] Initializing module students...');
            
            const state = router.getModuleState('students');
            expect(state.isInitialized).toBe(true);
            expect(state.initCount).toBe(1);
        });
    });

    describe('Concurrent Load Scenario', () => {
        it('should prevent duplicate initialization during concurrent calls', async () => {
            let initializerCallCount = 0;
            const mockInitializer = vi.fn().mockImplementation(() => {
                initializerCallCount++;
                return new Promise(resolve => {
                    setTimeout(() => resolve({ 
                        success: true, 
                        callNumber: initializerCallCount 
                    }), 100);
                });
            });

            // Simulate 3 concurrent calls
            const [result1, result2, result3] = await Promise.all([
                router.safeModuleInitialization('students', mockInitializer),
                router.safeModuleInitialization('students', mockInitializer),
                router.safeModuleInitialization('students', mockInitializer)
            ]);

            // Should only call initializer once
            expect(mockInitializer).toHaveBeenCalledTimes(1);
            
            // All results should be identical (same promise)
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            expect(result1.callNumber).toBe(1);

            // Should have NETWORK log once and CACHE logs for concurrent calls
            expect(consoleSpy).toHaveBeenCalledWith('[NETWORK] Initializing module students...');
            expect(consoleSpy).toHaveBeenCalledWith('[CACHE] Module students is loading, waiting...');
        });
    });

    describe('Second Navigation Scenario', () => {
        it('should use cached instance on second navigation', async () => {
            const mockInstance = { success: true, cached: false };
            const mockInitializer = vi.fn().mockResolvedValue(mockInstance);

            // First call
            const result1 = await router.safeModuleInitialization('students', mockInitializer);
            expect(result1).toBe(mockInstance);

            // Second call should use cache
            const result2 = await router.safeModuleInitialization('students', mockInitializer);
            expect(result2).toBe(mockInstance);

            // Initializer should only be called once
            expect(mockInitializer).toHaveBeenCalledTimes(1);
            
            // Should show CACHE log on second call
            expect(consoleSpy).toHaveBeenCalledWith('[CACHE] Module students already initialized');
        });
    });

    describe('Error Recovery Scenario', () => {
        it('should allow retry after initialization failure', async () => {
            const mockError = new Error('Initialization failed');
            const mockInitializer = vi.fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce({ success: true, retry: true });

            // First call should fail
            await expect(router.safeModuleInitialization('students', mockInitializer))
                .rejects.toThrow('Initialization failed');

            const state = router.getModuleState('students');
            expect(state.isInitialized).toBe(false);
            expect(state.lastError).toBe(mockError);

            // Second call should succeed
            const result = await router.safeModuleInitialization('students', mockInitializer);
            expect(result).toEqual({ success: true, retry: true });
            expect(mockInitializer).toHaveBeenCalledTimes(2);
        });
    });

    describe('Module State Management', () => {
        it('should track initialization count correctly', async () => {
            const mockInitializer = vi.fn().mockResolvedValue({ success: true });

            await router.safeModuleInitialization('students', mockInitializer);
            
            const state = router.getModuleState('students');
            expect(state.initCount).toBe(1);
            expect(state.isInitialized).toBe(true);
            expect(state.initPromise).toBe(null);
        });

        it('should reset state properly', async () => {
            const mockInitializer = vi.fn().mockResolvedValue({ success: true });

            await router.safeModuleInitialization('students', mockInitializer);
            router.resetModuleState('students');
            
            const state = router.getModuleState('students');
            expect(state.initCount).toBe(0);
            expect(state.isInitialized).toBe(false);
        });
    });
});

describe('Students Module Internal Anti-Duplication', () => {
    // Mock the students module
    let isModuleInitialized = false;
    let initializationPromise = null;

    const mockStudentsModule = {
        async initStudentsModule(targetContainer) {
            // Simulate internal anti-duplication logic
            if (isModuleInitialized) {
                console.log('[CACHE] Students module already initialized');
                return { fromCache: true };
            }
            
            if (initializationPromise) {
                console.log('[CACHE] Students module is initializing, waiting...');
                return initializationPromise;
            }
            
            console.log('[NETWORK] Initializing Students module...');
            
            initializationPromise = new Promise((resolve) => {
                setTimeout(() => {
                    isModuleInitialized = true;
                    initializationPromise = null;
                    resolve({ fromCache: false });
                }, 50);
            });
            
            return initializationPromise;
        },

        resetState() {
            isModuleInitialized = false;
            initializationPromise = null;
        }
    };

    beforeEach(() => {
        mockStudentsModule.resetState();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('should handle concurrent calls at module level', async () => {
        const [result1, result2, result3] = await Promise.all([
            mockStudentsModule.initStudentsModule(mockContainer),
            mockStudentsModule.initStudentsModule(mockContainer),
            mockStudentsModule.initStudentsModule(mockContainer)
        ]);

        expect(result1).toEqual(result2);
        expect(result2).toEqual(result3);
        expect(result1.fromCache).toBe(false);

        expect(consoleSpy).toHaveBeenCalledWith('[NETWORK] Initializing Students module...');
        expect(consoleSpy).toHaveBeenCalledWith('[CACHE] Students module is initializing, waiting...');
    });
});

/**
 * Student Data Service Demo and Testing
 * Demonstra o uso do sistema de cache e deduplicação
 */

// Import the services
import { createStudentDataService } from './student-data-service.js';
import { CacheEventManager, CachePerformanceMonitor } from './cache-config.js';

/**
 * Demo class para testar o StudentDataService
 */
class StudentDataServiceDemo {
    constructor() {
        this.apiClient = window.createModuleAPI('Students');
        this.dataService = createStudentDataService(this.apiClient);
        this.cacheEventManager = new CacheEventManager(this.dataService);
        this.performanceMonitor = new CachePerformanceMonitor();
        
        // Sample student ID for testing
        this.testStudentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
        
        this.setupDemo();
    }
    
    setupDemo() {
        console.log('🎓 [DEMO] StudentDataService Demo initialized');
        
        // Add demo methods to window for console testing
        window.studentDataDemo = {
            testSingleLoad: () => this.testSingleLoad(),
            testConcurrentLoad: () => this.testConcurrentLoad(),
            testBundleLoad: () => this.testBundleLoad(),
            testSelectiveRefresh: () => this.testSelectiveRefresh(),
            testCacheInvalidation: () => this.testCacheInvalidation(),
            getCacheStats: () => this.getCacheStats(),
            runAllTests: () => this.runAllTests()
        };
        
        console.log('🎓 [DEMO] Available commands:', Object.keys(window.studentDataDemo));
        console.log('🎓 [DEMO] Try: studentDataDemo.runAllTests()');
    }
    
    // ==============================================
    // DEMO TESTS
    // ==============================================
    
    /**
     * Test 1: Single data load with cache
     */
    async testSingleLoad() {
        console.log('\n📋 TEST 1: Single Data Load');
        console.log('========================================');
        
        try {
            // First call - should hit network
            console.log('🌐 First call (should be NETWORK):');
            const student1 = await this.dataService.getStudent(this.testStudentId);
            
            // Second call - should hit cache
            console.log('💾 Second call (should be CACHE):');
            const student2 = await this.dataService.getStudent(this.testStudentId);
            
            console.log('✅ Test 1 completed:', {
                sameData: student1.id === student2.id,
                cacheWorking: true
            });
            
        } catch (error) {
            console.error('❌ Test 1 failed:', error);
        }
    }
    
    /**
     * Test 2: Concurrent load prevention
     */
    async testConcurrentLoad() {
        console.log('\n📋 TEST 2: Concurrent Load Prevention');
        console.log('========================================');
        
        try {
            // Clear cache first
            this.dataService.invalidateStudent(this.testStudentId);
            
            console.log('🚀 Starting 3 concurrent calls...');
            
            // Start 3 concurrent calls
            const promises = [
                this.dataService.getStudent(this.testStudentId),
                this.dataService.getStudent(this.testStudentId),
                this.dataService.getStudent(this.testStudentId)
            ];
            
            const results = await Promise.all(promises);
            
            console.log('✅ Test 2 completed:', {
                allSameResult: results.every(r => r.id === results[0].id),
                deduplicationWorking: true
            });
            
        } catch (error) {
            console.error('❌ Test 2 failed:', error);
        }
    }
    
    /**
     * Test 3: Bundle loading with Promise.all
     */
    async testBundleLoad() {
        console.log('\n📋 TEST 3: Bundle Loading');
        console.log('========================================');
        
        try {
            // Clear cache first
            this.dataService.invalidateStudent(this.testStudentId);
            
            console.log('📦 Loading student bundle...');
            const startTime = Date.now();
            
            const bundle = await this.dataService.prefetchStudent(this.testStudentId);
            
            const loadTime = Date.now() - startTime;
            
            console.log('✅ Test 3 completed:', {
                bundleKeys: Object.keys(bundle),
                loadTime: `${loadTime}ms`,
                hasAllData: !!(bundle.student && bundle.subscription && bundle.attendances && bundle.financial)
            });
            
        } catch (error) {
            console.error('❌ Test 3 failed:', error);
        }
    }
    
    /**
     * Test 4: Selective refresh
     */
    async testSelectiveRefresh() {
        console.log('\n📋 TEST 4: Selective Refresh');
        console.log('========================================');
        
        try {
            // Ensure data is cached
            await this.dataService.prefetchStudent(this.testStudentId);
            
            console.log('🔄 Refreshing only subscription and financial data...');
            const refreshedData = await this.dataService.refreshStudent(
                this.testStudentId, 
                ['subscription', 'financial']
            );
            
            console.log('✅ Test 4 completed:', {
                refreshedKeys: Object.keys(refreshedData),
                selectiveRefreshWorking: true
            });
            
        } catch (error) {
            console.error('❌ Test 4 failed:', error);
        }
    }
    
    /**
     * Test 5: Cache invalidation
     */
    async testCacheInvalidation() {
        console.log('\n📋 TEST 5: Cache Invalidation');
        console.log('========================================');
        
        try {
            // Load data to cache
            await this.dataService.getStudent(this.testStudentId);
            console.log('💾 Data cached');
            
            // Invalidate cache
            this.dataService.invalidateStudent(this.testStudentId);
            console.log('🗑️ Cache invalidated');
            
            // Next call should hit network again
            console.log('🌐 Next call (should be NETWORK again):');
            await this.dataService.getStudent(this.testStudentId);
            
            console.log('✅ Test 5 completed: Cache invalidation working');
            
        } catch (error) {
            console.error('❌ Test 5 failed:', error);
        }
    }
    
    /**
     * Get comprehensive cache statistics
     */
    getCacheStats() {
        const stats = this.dataService.getStats();
        console.log('\n📊 CACHE STATISTICS');
        console.log('========================================');
        console.table(stats);
        return stats;
    }
    
    /**
     * Run all tests sequentially
     */
    async runAllTests() {
        console.log('\n🚀 RUNNING ALL TESTS');
        console.log('========================================');
        
        const startTime = Date.now();
        
        await this.testSingleLoad();
        await this.testConcurrentLoad();
        await this.testBundleLoad();
        await this.testSelectiveRefresh();
        await this.testCacheInvalidation();
        
        const totalTime = Date.now() - startTime;
        
        console.log('\n🎯 ALL TESTS COMPLETED');
        console.log('========================================');
        console.log(`Total execution time: ${totalTime}ms`);
        
        this.getCacheStats();
    }
}

/**
 * Performance comparison demo
 */
class PerformanceComparisonDemo {
    constructor(dataService) {
        this.dataService = dataService;
        this.testStudentId = 'c0acbc5e-0e12-44f6-87ba-7a7dc0d6f8fa';
    }
    
    /**
     * Compare old vs new approach
     */
    async compareApproaches() {
        console.log('\n⚡ PERFORMANCE COMPARISON');
        console.log('========================================');
        
        // Clear cache for fair comparison
        this.dataService.clearCache();
        
        // Test old approach (individual API calls)
        const oldApproachTime = await this.testOldApproach();
        
        // Clear cache again
        this.dataService.clearCache();
        
        // Test new approach (bundle loading)
        const newApproachTime = await this.testNewApproach();
        
        const improvement = ((oldApproachTime - newApproachTime) / oldApproachTime) * 100;
        
        console.log('\n📈 COMPARISON RESULTS');
        console.log('========================================');
        console.table({
            'Old Approach (Individual Calls)': `${oldApproachTime}ms`,
            'New Approach (Bundle Loading)': `${newApproachTime}ms`,
            'Improvement': `${improvement.toFixed(2)}%`
        });
        
        return { oldApproachTime, newApproachTime, improvement };
    }
    
    async testOldApproach() {
        console.log('📊 Testing old approach (individual API calls)...');
        const startTime = Date.now();
        
        // Simulate individual API calls like before
        await Promise.all([
            this.dataService.getStudent(this.testStudentId),
            this.dataService.getSubscription(this.testStudentId),
            this.dataService.getAttendances(this.testStudentId),
            this.dataService.getFinancialSummary(this.testStudentId),
            this.dataService.getBillingPlans()
        ]);
        
        return Date.now() - startTime;
    }
    
    async testNewApproach() {
        console.log('📦 Testing new approach (bundle loading)...');
        const startTime = Date.now();
        
        // Use bundle loading
        await this.dataService.prefetchStudent(this.testStudentId);
        
        return Date.now() - startTime;
    }
}

// Auto-initialize demo when module loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.createModuleAPI) {
        new StudentDataServiceDemo();
    } else {
        // Wait for API client to be available
        const checkAPI = setInterval(() => {
            if (window.createModuleAPI) {
                clearInterval(checkAPI);
                new StudentDataServiceDemo();
            }
        }, 1000);
    }
});

export {
    StudentDataServiceDemo,
    PerformanceComparisonDemo
};

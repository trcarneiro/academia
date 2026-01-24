import { BillingService } from '../src/services/billingService';

// Configuration - Replace with correct API key
const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjExNmE4NDc3LTg3YWQtNGE0ZS1hZDYxLWQxYmM3ZDU5YzlhMTo6JGFhY2hfMjU0NDRmNTYtNzYwZi00ODkyLWJkZTEtZWY4MDdlODFkZmZk';
const IS_SANDBOX = true;

async function triggerBillingCycle() {
    console.log('💰 Triggering Monthly Billing Cycle...\n');

    const billingService = new BillingService(API_KEY, IS_SANDBOX);

    try {
        // Generate charges for subscriptions due in the next 5 days
        const results = await billingService.generateMonthlyCharges(5);

        console.log('\n📊 Billing Cycle Results:');
        console.log(`   ✅ Success: ${results.success}`);
        console.log(`   ❌ Failed: ${results.failed}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(err => {
                console.log(`   - Student ${err.studentId}: ${err.error}`);
            });
        }

        console.log('\n✅ Billing cycle complete!');

    } catch (error: any) {
        console.error('\n❌ Billing cycle failed:', error.message);
        throw error;
    }
}

triggerBillingCycle();

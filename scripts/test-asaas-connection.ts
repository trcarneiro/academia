import { AsaasService } from '../src/services/asaasService';

// Sandbox API Key
const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjExNmE4NDc3LTg3YWQtNGE0ZS1hZDYxLWQxYmM3ZDU5YzlhMTo6JGFhY2hfMjU0NDRmNTYtNzYwZi00ODkyLWJkZTEtZWY4MDdlODFkZmZk';

async function testConnection() {
    console.log('🧪 Testing Asaas Sandbox Connection...');

    const asaas = new AsaasService(API_KEY, true); // true = sandbox

    try {
        // 1. Check Customers
        console.log('Fetching customers...');
        const customers = await asaas.listCustomers({ limit: 5 });
        console.log(`✅  Customers found: ${customers.totalCount}`);
        if (customers.data.length > 0) {
            console.log('Example Customer:', {
                id: customers.data[0].id,
                name: customers.data[0].name,
                email: customers.data[0].email
            });
        }

        // 2. Check Subscriptions
        console.log('\nFetching subscriptions...');
        const subscriptions = await asaas.listSubscriptions({ limit: 5 });
        console.log(`✅  Subscriptions found: ${subscriptions.totalCount}`);
        if (subscriptions.data.length > 0) {
            console.log('Example Subscription:', {
                id: subscriptions.data[0].id,
                customer: subscriptions.data[0].customer,
                value: subscriptions.data[0].value,
                billingType: subscriptions.data[0].billingType,
                status: subscriptions.data[0].status
            });
        } else {
            console.log('ℹ️   No subscriptions found in Sandbox. We might need to create seed data.');
        }

    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testConnection();

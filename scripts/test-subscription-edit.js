const axios = require('axios');

// Test data
const TEST_STUDENT_ID = '0b997817-3ce9-426b-9230-ab2a71e5b53a';
const TEST_SUBSCRIPTION_ID = '2adebdd4-4185-43b7-b0e6-95d7bc41f950';
const TEST_PLAN_ID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Valid UUID format
const BASE_URL = 'http://localhost:3000/api';

async function testSubscriptionEdit() {
  try {
    console.log('🚀 Starting subscription edit test...');

    // 1. Check if plan exists, create if needed
    try {
      await axios.get(`${BASE_URL}/financial/plans/${TEST_PLAN_ID}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Plan not found, creating test plan first...');
        await createTestPlan();
      } else {
        throw error;
      }
    }

    // 2. Get current subscription data with retry logic
    let currentSub;
    try {
      const response = await axios.get(
        `${BASE_URL}/financial/subscriptions/${TEST_SUBSCRIPTION_ID}`
      );
      currentSub = response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Subscription not found, creating test subscription first...');
        await createTestSubscription();
        currentSub = (await axios.get(
          `${BASE_URL}/financial/subscriptions/${TEST_SUBSCRIPTION_ID}`
        )).data;
      } else {
        throw error;
      }
    }

    if (!currentSub) {
      throw new Error('Failed to get or create test subscription');
    }

    console.log('📅 Original start date:', currentSub.startDate);
    console.log('🔄 Original auto-renew:', currentSub.autoRenew);

    // 3. Prepare test data with tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testStartDate = tomorrow.toISOString().split('T')[0];

    // 4. Update subscription
    const updateData = {
      startDate: testStartDate,
      autoRenew: !currentSub.autoRenew // Toggle auto-renew
    };

    console.log('🔄 Updating with:', updateData);

    const { data: updatedSub } = await axios.put(
      `${BASE_URL}/financial/subscriptions/${TEST_SUBSCRIPTION_ID}`,
      updateData
    );

    // 5. Verify changes
    if (!updatedSub) {
      throw new Error('No response data from update');
    }

    console.log('✅ Updated subscription:', {
      startDate: updatedSub.startDate,
      autoRenew: updatedSub.autoRenew
    });

    if (updatedSub.startDate && new Date(updatedSub.startDate).toISOString().includes(testStartDate)) {
      console.log('✅ Date update successful');
    } else {
      console.error('❌ Date update failed');
    }

    if (updatedSub.autoRenew === updateData.autoRenew) {
      console.log('✅ Auto-renew update successful');
    } else {
      console.error('❌ Auto-renew update failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function createTestPlan() {
  const planData = {
    id: TEST_PLAN_ID,
    organizationId: '0671e975-8f7e-48da-91ed-329ef45cb7b2',
    name: 'Test Plan',
    description: 'Test plan for subscription editing',
    price: 100,
    billingType: 'MONTHLY',
    classesPerWeek: 2,
    isActive: true
  };

  await axios.post(
    `${BASE_URL}/financial/plans`,
    planData
  );
}

async function createTestSubscription() {
  const subscriptionData = {
    id: TEST_SUBSCRIPTION_ID,
    studentId: TEST_STUDENT_ID,
    planId: TEST_PLAN_ID,
    startDate: new Date().toISOString(),
    autoRenew: false,
    status: 'active'
  };

  await axios.post(
    `${BASE_URL}/financial/subscriptions`,
    subscriptionData
  );
}

testSubscriptionEdit();

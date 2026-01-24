
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function listPlans() {
    const { data: plans, error } = await supabase
        .from('BillingPlan')
        .select('id, name, price');

    if (error) {
        console.error('Error fetching plans:', error);
        return;
    }

    console.log('Plans found:');
    plans.forEach(p => console.log(`- ID: ${p.id}, Name: ${p.name}, Price: ${p.price}`));
}

listPlans();

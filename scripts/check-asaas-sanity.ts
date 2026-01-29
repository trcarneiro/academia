import { AsaasService } from '../src/services/asaasService';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
    const apiKey = process.env.ASAAS_API_KEY;
    const baseUrl = process.env.ASAAS_BASE_URL;

    if (!apiKey) {
        console.error('❌ ASAAS_API_KEY não encontrada no .env');
        return;
    }

    const isSandbox = apiKey.includes('test') || (baseUrl && baseUrl.includes('sandbox'));
    console.log(`🔍 Verificando Asaas (${isSandbox ? 'SANDBOX' : 'PRODUÇÃO'})...`);
    console.log(`🔗 URL Base: ${baseUrl}`);

    // Create service instance (passing explicitly what's in env)
    // Note: Our AsaasService uses baseUrl logic based on isSandbox
    const asaas = new AsaasService(apiKey, isSandbox);

    try {
        console.log('\n--- 💳 PAGAMENTOS RECENTES ---');
        const payments = await asaas.listPayments({ limit: 5 });
        if (payments.data && payments.data.length > 0) {
            payments.data.forEach((p: any) => {
                console.log(`[${p.dateCreated}] ID: ${p.id} | Valor: R$ ${p.value} | Status: ${p.status} | Ref: ${p.externalReference || 'N/A'}`);
            });
        } else {
            console.log('Nenhum pagamento encontrado.');
        }

        console.log('\n--- 👥 CUSTOMERS RECENTES ---');
        const customers = await asaas.listCustomers({ limit: 5 });
        if (customers.data && customers.data.length > 0) {
            customers.data.forEach((c: any) => {
                console.log(`[${c.dateCreated}] ID: ${c.id} | Nome: ${c.name} | Email: ${c.email}`);
            });
        } else {
            console.log('Nenhum cliente encontrado.');
        }

    } catch (error: any) {
        console.error('❌ Erro ao consultar Asaas:', error.message);
    }
}

run();

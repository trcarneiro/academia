/**
 * Script para sincronizar assinaturas do Asaas
 * 
 * Este script:
 * 1. Busca todos os clientes do Asaas com assinaturas ativas
 * 2. Atualiza o plano e valor do aluno conforme a assinatura
 * 3. Define apenas alunos com assinatura como ativos
 * 4. Matricula todos no curso de Faixa Branca de Krav Maga
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuração do Asaas - Pegar da linha de comando ou .env
const ASAAS_API_KEY = process.argv[2] || process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://www.asaas.com/api/v3';

if (!ASAAS_API_KEY) {
    console.error('❌ Chave API do Asaas não configurada!');
    console.log('\nUso: node scripts/sync-asaas-subscriptions.js <ASAAS_API_KEY>');
    console.log('Ou configure a variável ASAAS_API_KEY no arquivo .env');
    process.exit(1);
}

console.log(`🔑 Usando chave API: ${ASAAS_API_KEY.substring(0, 15)}...`);

async function asaasRequest(endpoint, options = {}) {
    const url = `${ASAAS_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'accept': 'application/json',
            'access_token': ASAAS_API_KEY,
            'User-Agent': 'KravMagaAcademy/1.0',
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Asaas API error: ${response.status} - ${errorText}`);
    }
    
    return response.json();
}

async function getAllAsaasCustomers() {
    console.log('📥 Buscando todos os clientes do Asaas...');
    let allCustomers = [];
    let offset = 0;
    const limit = 100;
    
    while (true) {
        const data = await asaasRequest(`/customers?offset=${offset}&limit=${limit}`);
        allCustomers = allCustomers.concat(data.data || []);
        
        if (!data.hasMore) break;
        offset += limit;
    }
    
    console.log(`   ✅ ${allCustomers.length} clientes encontrados no Asaas`);
    return allCustomers;
}

async function getCustomerSubscriptions(customerId) {
    try {
        const data = await asaasRequest(`/subscriptions?customer=${customerId}`);
        return data.data || [];
    } catch (error) {
        return [];
    }
}

async function main() {
    console.log('🚀 Sincronização de Assinaturas Asaas\n');
    console.log('='.repeat(60));
    
    try {
        // 1. Buscar organização
        const organization = await prisma.organization.findFirst({
            where: { isActive: true }
        });
        
        if (!organization) {
            throw new Error('Nenhuma organização ativa encontrada');
        }
        
        console.log(`📍 Organização: ${organization.name} (${organization.id})\n`);
        
        // 2. Buscar/Criar curso de Faixa Branca
        let faixaBrancaCourse = await prisma.course.findFirst({
            where: {
                organizationId: organization.id,
                name: { contains: 'Faixa Branca', mode: 'insensitive' }
            }
        });
        
        if (!faixaBrancaCourse) {
            faixaBrancaCourse = await prisma.course.findFirst({
                where: {
                    organizationId: organization.id,
                    name: { contains: 'Krav', mode: 'insensitive' }
                }
            });
        }
        
        if (!faixaBrancaCourse) {
            console.log('📚 Criando curso de Faixa Branca...');
            faixaBrancaCourse = await prisma.course.create({
                data: {
                    name: 'Krav Maga - Faixa Branca',
                    description: 'Curso básico de Krav Maga para iniciantes - Faixa Branca',
                    organizationId: organization.id,
                    isActive: true,
                    level: 'BEGINNER',
                    durationMonths: 6
                }
            });
        }
        
        console.log(`📚 Curso: ${faixaBrancaCourse.name} (${faixaBrancaCourse.id})\n`);
        
        // 3. Buscar clientes do Asaas
        const asaasCustomers = await getAllAsaasCustomers();
        
        // 4. Processar cada cliente
        let stats = {
            total: 0,
            comAssinatura: 0,
            semAssinatura: 0,
            alunosCriados: 0,
            alunosAtualizados: 0,
            matriculados: 0,
            desativados: 0,
            erros: 0
        };
        
        console.log('\n📊 Processando clientes...\n');
        
        for (const asaasCustomer of asaasCustomers) {
            stats.total++;
            
            try {
                // Buscar assinaturas do cliente
                const subscriptions = await getCustomerSubscriptions(asaasCustomer.id);
                const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');
                
                // Buscar AsaasCustomer no banco pelo asaasId
                let asaasCustomerRecord = await prisma.asaasCustomer.findFirst({
                    where: {
                        asaasId: asaasCustomer.id,
                        organizationId: organization.id
                    },
                    include: { student: { include: { user: true } } }
                });
                
                // Buscar aluno pelo email se não encontrou pelo asaasId
                let student = asaasCustomerRecord?.student;
                
                if (!student && asaasCustomer.email) {
                    student = await prisma.student.findFirst({
                        where: {
                            user: { email: asaasCustomer.email },
                            organizationId: organization.id
                        },
                        include: { user: true }
                    });
                }
                
                if (!student) {
                    // Criar aluno se não existir
                    const nameParts = (asaasCustomer.name || 'Cliente Asaas').split(' ');
                    const firstName = nameParts[0] || 'Aluno';
                    const lastName = nameParts.slice(1).join(' ') || 'Asaas';
                    const email = asaasCustomer.email || `asaas_${asaasCustomer.id.replace('cus_', '')}@temp.local`;
                    
                    console.log(`   ➕ Criando: ${asaasCustomer.name} (${email})`);
                    
                    const user = await prisma.user.create({
                        data: {
                            firstName,
                            lastName,
                            email,
                            password: 'asaas-temp-password', // Temporary password, should be changed on first login
                            organizationId: organization.id,
                            role: 'STUDENT',
                            isActive: !!activeSubscription
                        }
                    });
                    
                    student = await prisma.student.create({
                        data: {
                            userId: user.id,
                            organizationId: organization.id,
                            isActive: !!activeSubscription,
                            enrollmentDate: new Date()
                        },
                        include: { user: true }
                    });
                    
                    // Criar registro AsaasCustomer vinculado ao student
                    asaasCustomerRecord = await prisma.asaasCustomer.create({
                        data: {
                            asaasId: asaasCustomer.id,
                            studentId: student.id,
                            organizationId: organization.id,
                            name: asaasCustomer.name || 'Cliente Asaas',
                            cpfCnpj: asaasCustomer.cpfCnpj,
                            email: asaasCustomer.email,
                            phone: asaasCustomer.phone,
                            mobilePhone: asaasCustomer.mobilePhone,
                            postalCode: asaasCustomer.postalCode,
                            address: asaasCustomer.address,
                            addressNumber: asaasCustomer.addressNumber,
                            province: asaasCustomer.province,
                            city: asaasCustomer.city != null ? String(asaasCustomer.city) : null,
                            state: asaasCustomer.state,
                            isActive: true
                        }
                    });
                    
                    stats.alunosCriados++;
                } else if (!asaasCustomerRecord) {
                    // Student existe mas não tem AsaasCustomer vinculado
                    // Verificar se já existe AsaasCustomer para este student
                    const existingAsaasCustomer = await prisma.asaasCustomer.findFirst({
                        where: { studentId: student.id }
                    });
                    
                    if (!existingAsaasCustomer) {
                        asaasCustomerRecord = await prisma.asaasCustomer.create({
                            data: {
                                asaasId: asaasCustomer.id,
                                studentId: student.id,
                                organizationId: organization.id,
                                name: asaasCustomer.name || 'Cliente Asaas',
                                cpfCnpj: asaasCustomer.cpfCnpj,
                                email: asaasCustomer.email,
                                phone: asaasCustomer.phone,
                                mobilePhone: asaasCustomer.mobilePhone,
                                isActive: true
                            }
                        });
                    } else {
                        asaasCustomerRecord = existingAsaasCustomer;
                    }
                }
                
                if (activeSubscription) {
                    stats.comAssinatura++;
                    
                    const subscriptionValue = activeSubscription.value;
                    const billingCycle = activeSubscription.cycle || 'MONTHLY';
                    
                    console.log(`   ✅ ${asaasCustomer.name}: ${billingCycle} R$ ${subscriptionValue}`);
                    
                    // Buscar ou criar BillingPlan com o valor da assinatura
                    let billingPlan = await prisma.billingPlan.findFirst({
                        where: {
                            organizationId: organization.id,
                            price: subscriptionValue
                        }
                    });
                    
                    if (!billingPlan) {
                        const cycleName = billingCycle === 'MONTHLY' ? 'Mensal' : 
                                         billingCycle === 'WEEKLY' ? 'Semanal' :
                                         billingCycle === 'YEARLY' ? 'Anual' : billingCycle;
                        
                        billingPlan = await prisma.billingPlan.create({
                            data: {
                                name: `Plano ${cycleName} R$ ${subscriptionValue}`,
                                description: `Plano importado do Asaas - ${billingCycle}`,
                                price: subscriptionValue,
                                billingType: billingCycle === 'MONTHLY' ? 'MONTHLY' : 
                                            billingCycle === 'WEEKLY' ? 'WEEKLY' :
                                            billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
                                organizationId: organization.id,
                                isActive: true,
                                classesPerWeek: 3,
                                duration: billingCycle === 'YEARLY' ? 12 : 
                                         billingCycle === 'QUARTERLY' ? 3 : 1
                            }
                        });
                        console.log(`      📦 Plano criado: ${billingPlan.name}`);
                    }
                    
                    // Criar ou atualizar StudentSubscription
                    let studentSubscription = await prisma.studentSubscription.findFirst({
                        where: {
                            studentId: student.id,
                            organizationId: organization.id,
                            status: 'ACTIVE'
                        }
                    });
                    
                    if (!studentSubscription) {
                        studentSubscription = await prisma.studentSubscription.create({
                            data: {
                                organizationId: organization.id,
                                studentId: student.id,
                                planId: billingPlan.id,
                                asaasCustomerId: asaasCustomerRecord.id,
                                status: 'ACTIVE',
                                startDate: new Date(activeSubscription.dateCreated || new Date()),
                                currentPrice: subscriptionValue,
                                billingType: billingPlan.billingType,
                                nextBillingDate: activeSubscription.nextDueDate ? new Date(activeSubscription.nextDueDate) : null,
                                asaasSubscriptionId: activeSubscription.id,
                                isActive: true,
                                autoRenew: true
                            }
                        });
                    } else {
                        await prisma.studentSubscription.update({
                            where: { id: studentSubscription.id },
                            data: {
                                planId: billingPlan.id,
                                currentPrice: subscriptionValue,
                                asaasSubscriptionId: activeSubscription.id,
                                nextBillingDate: activeSubscription.nextDueDate ? new Date(activeSubscription.nextDueDate) : null
                            }
                        });
                    }
                    
                    // Ativar aluno
                    await prisma.student.update({
                        where: { id: student.id },
                        data: { isActive: true }
                    });
                    
                    await prisma.user.update({
                        where: { id: student.userId },
                        data: { isActive: true }
                    });
                    
                    stats.alunosAtualizados++;
                    
                    // Matricular no curso de Faixa Branca se ainda não estiver
                    const existingEnrollment = await prisma.studentCourse.findFirst({
                        where: {
                            studentId: student.id,
                            courseId: faixaBrancaCourse.id
                        }
                    });
                    
                    if (!existingEnrollment) {
                        await prisma.studentCourse.create({
                            data: {
                                studentId: student.id,
                                courseId: faixaBrancaCourse.id,
                                startDate: new Date(),
                                status: 'ACTIVE',
                                isActive: true
                            }
                        });
                        console.log(`      📝 Matriculado em: ${faixaBrancaCourse.name}`);
                        stats.matriculados++;
                    }
                    
                } else {
                    stats.semAssinatura++;
                    
                    console.log(`   ❌ ${asaasCustomer.name}: Sem assinatura → DESATIVADO`);
                    
                    // Desativar aluno sem assinatura
                    await prisma.student.update({
                        where: { id: student.id },
                        data: { isActive: false }
                    });
                    
                    await prisma.user.update({
                        where: { id: student.userId },
                        data: { isActive: false }
                    });
                    
                    // Cancelar assinaturas ativas no sistema
                    await prisma.studentSubscription.updateMany({
                        where: {
                            studentId: student.id,
                            status: 'ACTIVE'
                        },
                        data: {
                            status: 'CANCELLED',
                            isActive: false
                        }
                    });
                    
                    stats.desativados++;
                }
                
            } catch (error) {
                console.error(`   ⚠️ Erro com ${asaasCustomer.name}: ${error.message}`);
                stats.erros++;
            }
        }
        
        // 5. Resumo
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DA SINCRONIZAÇÃO\n');
        console.log(`   Total de clientes Asaas:     ${stats.total}`);
        console.log(`   Com assinatura ativa:        ${stats.comAssinatura}`);
        console.log(`   Sem assinatura:              ${stats.semAssinatura}`);
        console.log(`   Alunos criados:              ${stats.alunosCriados}`);
        console.log(`   Alunos atualizados:          ${stats.alunosAtualizados}`);
        console.log(`   Matriculados no curso:       ${stats.matriculados}`);
        console.log(`   Desativados:                 ${stats.desativados}`);
        console.log(`   Erros:                       ${stats.erros}`);
        console.log('='.repeat(60));
        
        // Mostrar alunos ativos finais
        const activeStudents = await prisma.student.count({
            where: { organizationId: organization.id, isActive: true }
        });
        console.log(`\n✅ Total de alunos ATIVOS: ${activeStudents}`);
        
    } catch (error) {
        console.error('\n❌ Erro fatal:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();

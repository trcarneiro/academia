#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const FinancialService = require('./src/services/financialService').FinancialService;

const prisma = new PrismaClient();

async function testAutoEnrollment() {
    try {
        console.log('🧪 Testando matrícula automática...');
        
        // Buscar organização
        const org = await prisma.organization.findFirst();
        if (!org) {
            throw new Error('Organização não encontrada');
        }
        
        // Criar instância do serviço financeiro
        const financialService = new FinancialService(org.id);
        
        // Aplicar matrículas retroativas para o aluno específico
        const studentId = '0b997817-3ce9-426b-9230-ab2a71e5b53a';
        console.log(`🎯 Aplicando matrículas automáticas para aluno ${studentId}`);
        
        const result = await financialService.applyRetroactiveCourseEnrollments(studentId);
        
        console.log('✅ Resultado:', result);
        
        // Verificar matrículas criadas
        const enrollments = await prisma.courseEnrollment.findMany({
            where: { studentId },
            include: {
                course: {
                    select: { id: true, name: true }
                }
            }
        });
        
        console.log('📚 Matrículas encontradas:');
        enrollments.forEach(enrollment => {
            console.log(`- ${enrollment.course.name} (${enrollment.course.id})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAutoEnrollment();
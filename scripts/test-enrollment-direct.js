#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAutomaticEnrollments() {
    try {
        console.log('🧪 Criando matrículas automáticas diretamente...');
        
        const studentId = '0b997817-3ce9-426b-9230-ab2a71e5b53a';
        const planId = 'e02b47b1-0ee8-4ea3-b1c3-1be0d8c29879';
        
        // Buscar plano e seus cursos
        const plan = await prisma.billingPlan.findUnique({
            where: { id: planId }
        });
        
        if (!plan) {
            throw new Error('Plano não encontrado');
        }
        
        console.log('📋 Plano encontrado:', plan.name);
        console.log('🎓 Features:', plan.features);
        
        // Extrair courseIds
        const features = plan.features;
        let courseIds = [];
        
        if (features && features.courseIds && Array.isArray(features.courseIds)) {
            courseIds = features.courseIds;
        } else if (plan.courseId) {
            courseIds = [plan.courseId];
        }
        
        console.log('📚 Cursos do plano:', courseIds);
        
        // Buscar dados do aluno
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
        });
        
        if (!student) {
            throw new Error('Aluno não encontrado');
        }
        
        console.log('👤 Aluno encontrado:', `${student.user.firstName} ${student.user.lastName}`);
        
        // Criar matrículas
        for (const courseId of courseIds) {
            try {
                // Verificar se já existe
                const existing = await prisma.courseEnrollment.findFirst({
                    where: {
                        studentId: studentId,
                        courseId: courseId,
                        status: 'ACTIVE'
                    }
                });
                
                if (existing) {
                    console.log(`⚠️ Matrícula já existe para curso ${courseId}`);
                    continue;
                }
                
                // Buscar curso
                const course = await prisma.course.findUnique({
                    where: { id: courseId }
                });
                
                if (!course) {
                    console.log(`❌ Curso ${courseId} não encontrado`);
                    continue;
                }
                
                // Calcular data de término
                const expectedEndDate = new Date();
                expectedEndDate.setDate(expectedEndDate.getDate() + (course.duration * 7));
                
                // Criar matrícula
                const enrollment = await prisma.courseEnrollment.create({
                    data: {
                        studentId: studentId,
                        courseId: courseId,
                        status: 'ACTIVE',
                        category: student.category,
                        gender: student.gender || 'MASCULINO',
                        enrolledAt: new Date(),
                        expectedEndDate: expectedEndDate
                    }
                });
                
                console.log(`✅ Matrícula criada: ${course.name} (${courseId})`);
                
            } catch (courseError) {
                console.error(`❌ Erro ao criar matrícula no curso ${courseId}:`, courseError.message);
            }
        }
        
        // Verificar matrículas finais
        const finalEnrollments = await prisma.courseEnrollment.findMany({
            where: { studentId },
            include: {
                course: {
                    select: { id: true, name: true }
                }
            }
        });
        
        console.log('🎯 Matrículas finais do aluno:');
        finalEnrollments.forEach(enrollment => {
            console.log(`- ${enrollment.course.name} (Status: ${enrollment.status})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAutomaticEnrollments();
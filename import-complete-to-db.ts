import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importCompleteStudentsToDatabase() {
    try {
        console.log('🚀 Starting COMPLETE students import to database...');
        
        // Ler o arquivo JSON mais recente (281 alunos)
        const jsonFile = 'asaas-complete-2025-09-05T03-10-47-493Z.json';
        const jsonPath = path.join(process.cwd(), jsonFile);
        
        if (!fs.existsSync(jsonPath)) {
            throw new Error(`File not found: ${jsonPath}`);
        }
        
        const studentsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📊 Found ${studentsData.length} students to import`);
        
        // Buscar organização (primeira disponível)
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            throw new Error('No organization found in database');
        }
        console.log(`🏢 Using organization: ${organization.name}`);
        
        let imported = 0;
        let skipped = 0;
        let errors = 0;
        
        // Processar em lotes para evitar problemas de memória
        const batchSize = 10;
        const totalBatches = Math.ceil(studentsData.length / batchSize);
        
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startIndex = batchIndex * batchSize;
            const endIndex = Math.min(startIndex + batchSize, studentsData.length);
            const batch = studentsData.slice(startIndex, endIndex);
            
            console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${startIndex + 1}-${endIndex})`);
            
            for (const studentData of batch) {
                try {
                    console.log(`👤 Processing: ${studentData.name}`);
                    
                    // Verificar se o usuário já existe (por organizationId + email)
                    const existingUser = await prisma.user.findUnique({
                        where: { 
                            organizationId_email: {
                                organizationId: organization.id,
                                email: studentData.email
                            }
                        }
                    });
                    
                    if (existingUser) {
                        console.log(`⏭️ User already exists: ${studentData.email}`);
                        skipped++;
                        continue;
                    }
                    
                    // Criar usuário e estudante em uma transação
                    const result = await prisma.$transaction(async (tx) => {
                        // Separar firstName e lastName
                        const nameParts = studentData.name.trim().split(' ');
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        
                        // Criar usuário
                        const user = await tx.user.create({
                            data: {
                                firstName: firstName,
                                lastName: lastName,
                                email: studentData.email,
                                password: 'temp123', // Senha temporária
                                role: 'STUDENT',
                                organizationId: organization.id,
                                isActive: true,
                                phone: studentData.phone,
                                cpf: studentData.document,
                                createdAt: new Date(studentData.enrollmentDate)
                            }
                        });
                        
                        // Criar estudante
                        const student = await tx.student.create({
                            data: {
                                userId: user.id,
                                organizationId: organization.id,
                                enrollmentDate: new Date(studentData.enrollmentDate),
                                isActive: studentData.status === 'ACTIVE',
                                emergencyContact: JSON.stringify(studentData.emergencyContact),
                                medicalConditions: JSON.stringify(studentData.medicalInfo),
                                category: 'ADULT', // Categoria padrão
                                totalXP: 0,
                                globalLevel: 1
                            }
                        });
                        
                        return { user, student };
                    });
                    
                    console.log(`✅ Created: ${result.user.firstName} ${result.user.lastName} (${result.user.email})`);
                    imported++;
                    
                } catch (error) {
                    console.error(`❌ Error processing ${studentData.name}:`, error.message);
                    errors++;
                }
            }
            
            // Pequena pausa entre lotes
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('\n📋 COMPLETE IMPORT SUMMARY');
        console.log('==========================');
        console.log(`📊 Total Students: ${studentsData.length}`);
        console.log(`✅ Imported: ${imported}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        
        // Verificar total no banco
        const totalStudents = await prisma.student.count();
        console.log(`\n🎓 Total students in database: ${totalStudents}`);
        
        console.log('\n🎉 Complete import finished successfully!');
        
        // Estatísticas adicionais
        if (imported > 0) {
            console.log('\n📈 Additional Statistics:');
            console.log(`- Success rate: ${((imported / studentsData.length) * 100).toFixed(1)}%`);
            console.log(`- Students with email: ${studentsData.filter(s => !s.email.includes('@kravmaga.com.br')).length}`);
            console.log(`- Generated emails: ${studentsData.filter(s => s.email.includes('@kravmaga.com.br')).length}`);
        }
        
    } catch (error) {
        console.error('❌ Fatal error during import:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar o script
if (require.main === module) {
    importCompleteStudentsToDatabase();
}

export default importCompleteStudentsToDatabase;

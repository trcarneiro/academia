const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importStudentsToDatabase() {
    console.log('🚀 Iniciando importação direta no PostgreSQL...');
    
    try {
        // Primeiro, vamos buscar uma organização existente
        const organization = await prisma.organization.findFirst();
        if (!organization) {
            throw new Error('Nenhuma organização encontrada. Crie uma organização primeiro.');
        }
        
        console.log(`🏢 Usando organização: ${organization.name} (${organization.id})`);

        const studentsData = [
            {
                firstName: "Eduardo Jose",
                lastName: "Maria Filho",
                email: "eduardo.filho@gmail.com",
                phone: "(31) 99999-9999",
                cpf: "12345678901"
            },
            {
                firstName: "Nathalia",
                lastName: "Sena Goulart",
                email: "nathalia.sena.goulart@gmail.com",
                phone: "(31) 99928-2615",
                cpf: "80123456789"
            },
            {
                firstName: "João Álvaro",
                lastName: "Barral Morais",
                email: "joaoalvaro866@gmail.com",
                phone: "(38) 99727-4912",
                cpf: "50123456789"
            },
            {
                firstName: "José Breno",
                lastName: "Silva Arantes",
                email: "brenoharantes@hotmail.com",
                phone: "(31) 99891-0737",
                cpf: "30123456789"
            },
            {
                firstName: "Luiz G V",
                lastName: "Soares",
                email: "gustavo@ontic.com.br",
                phone: "(31) 98507-9796",
                cpf: "40123456789"
            },
            {
                firstName: "Vera M V",
                lastName: "Prates",
                email: "tpratesnogueira@gmail.com",
                phone: "(31) 98456-6615",
                cpf: "15023456789"
            },
            {
                firstName: "Christian",
                lastName: "Costa Silva",
                email: "christianeletronica1303@gmail.com",
                phone: "(31) 97179-0902",
                cpf: "40223456789"
            },
            {
                firstName: "Rodrigo Augusto",
                lastName: "Barbosa Martins",
                email: "henriquecesarb2@gmail.com",
                phone: "(31) 97237-1005",
                cpf: "23923456789"
            },
            {
                firstName: "Flavia",
                lastName: "Ribeiro",
                email: "flavia.ribeiro@gmail.com",
                phone: "(31) 99999-8888",
                cpf: "11122334455"
            },
            {
                firstName: "Victoria",
                lastName: "Daros Silva",
                email: "victoriadaros@gmail.com",
                phone: "(31) 99974-7668",
                cpf: "30223456789"
            }
        ];

        console.log(`📊 Inserindo ${studentsData.length} alunos na base de dados...`);

        let inserted = 0;
        let skipped = 0;

        for (const studentData of studentsData) {
            try {
                // Verificar se já existe usuário com este email
                const existingUser = await prisma.user.findFirst({
                    where: {
                        organizationId: organization.id,
                        email: studentData.email
                    }
                });

                if (existingUser) {
                    console.log(`⏭️ Usuário já existe: ${studentData.firstName} ${studentData.lastName} (${studentData.email})`);
                    skipped++;
                    continue;
                }

                // Criar usuário primeiro
                const user = await prisma.user.create({
                    data: {
                        organizationId: organization.id,
                        email: studentData.email,
                        password: "$2b$10$defaultHashForImportedUsers", // Hash padrão - usuário deve redefinir senha
                        role: "STUDENT",
                        firstName: studentData.firstName,
                        lastName: studentData.lastName,
                        phone: studentData.phone,
                        cpf: studentData.cpf,
                        isActive: true,
                        emailVerified: false
                    }
                });

                // Criar student associado ao usuário
                const student = await prisma.student.create({
                    data: {
                        organizationId: organization.id,
                        userId: user.id,
                        category: "ADULT",
                        gender: "MASCULINO",
                        age: 25, // Idade padrão
                        physicalCondition: "INICIANTE",
                        enrollmentDate: new Date(),
                        isActive: true
                    }
                });

                console.log(`✅ Inserido: ${user.firstName} ${user.lastName} (ID User: ${user.id}, ID Student: ${student.id})`);
                inserted++;

            } catch (error) {
                console.error(`❌ Erro ao inserir ${studentData.firstName} ${studentData.lastName}:`, error.message);
                skipped++;
            }
        }

        console.log('\n📋 RELATÓRIO DA IMPORTAÇÃO');
        console.log('========================');
        console.log(`✅ Inseridos: ${inserted}`);
        console.log(`⏭️ Ignorados: ${skipped}`);
        console.log(`📊 Total: ${studentsData.length}`);

        // Verificar total de alunos na base
        const totalStudents = await prisma.student.count({
            where: { organizationId: organization.id }
        });
        console.log(`\n📈 Total de alunos na organização: ${totalStudents}`);

        console.log('\n🎉 Importação concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    importStudentsToDatabase()
        .then(() => {
            console.log('✅ Script concluído');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha no script:', error);
            process.exit(1);
        });
}

module.exports = { importStudentsToDatabase };

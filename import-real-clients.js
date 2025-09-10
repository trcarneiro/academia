const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

class RealClientImporter {
    constructor() {
        this.processed = 0;
        this.skipped = 0;
        this.errors = 0;
        this.organization = null;
    }

    async importRealClients() {
        console.log('🚀 Importando CLIENTES REAIS do Asaas...');
        console.log('========================================');
        
        try {
            // Buscar organização
            this.organization = await prisma.organization.findFirst();
            if (!this.organization) {
                throw new Error('Nenhuma organização encontrada');
            }
            
            console.log(`🏢 Organização: ${this.organization.name}`);
            
            // Processar arquivo CSV real
            const csvFile = 'clientes-real.csv';
            if (!fs.existsSync(csvFile)) {
                throw new Error(`Arquivo ${csvFile} não encontrado`);
            }

            const students = await this.parseCSV(csvFile);
            console.log(`📊 Total de registros encontrados: ${students.length}`);
            
            // Importar para o banco
            await this.importToDB(students);
            
            this.showSummary();
            
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            throw error;
        } finally {
            await prisma.$disconnect();
        }
    }

    async parseCSV(filePath) {
        console.log(`📁 Processando arquivo: ${filePath}`);
        
        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    // Processar linha do CSV
                    const student = this.processCSVRow(data);
                    if (student) {
                        results.push(student);
                    }
                })
                .on('end', () => {
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    processCSVRow(row) {
        try {
            // Campos do CSV real
            const nome = row['Nome']?.trim();
            const email = row['Email']?.trim();
            const celular = row['Celular']?.trim();
            const cpfCnpj = row['CPF ou CNPJ']?.trim();
            const rua = row['Rua']?.trim();
            const numero = row['Número']?.trim();
            const complemento = row['Complemento']?.trim();
            const bairro = row['Bairro']?.trim();
            const cidade = row['Cidade']?.trim();
            const cep = row['CEP']?.trim();
            const estado = row['Estado']?.trim();

            // Validações básicas
            if (!nome || nome.length < 2) {
                return null; // Pular registros sem nome
            }

            // Separar nome em firstName e lastName
            const nameParts = nome.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || firstName;

            // Gerar email se não existir
            let finalEmail = email;
            if (!finalEmail || !finalEmail.includes('@')) {
                const emailBase = firstName.toLowerCase().replace(/[^a-z]/g, '');
                finalEmail = `${emailBase}${this.processed + 1}@academia.temp`;
            }

            // Formatar telefone
            let phone = null;
            if (celular && celular.length >= 10) {
                const cleaned = celular.replace(/\D/g, '');
                if (cleaned.length === 11) {
                    phone = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
                } else if (cleaned.length === 10) {
                    phone = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
                }
            }

            // Montar endereço
            let address = null;
            if (rua) {
                address = rua;
                if (numero) address += `, ${numero}`;
                if (complemento) address += `, ${complemento}`;
                if (bairro) address += `, ${bairro}`;
            }

            return {
                firstName,
                lastName,
                email: finalEmail,
                phone,
                cpf: cpfCnpj && cpfCnpj.length >= 11 ? cpfCnpj.replace(/\D/g, '') : null,
                address,
                city: cidade || 'Belo Horizonte',
                state: estado || 'MG',
                zipCode: cep ? cep.replace(/\D/g, '') : null,
                originalName: nome,
                rawData: row
            };
            
        } catch (error) {
            console.error('❌ Erro ao processar linha:', error);
            return null;
        }
    }

    async importToDB(students) {
        console.log(`\n🔄 Importando ${students.length} alunos para o banco...`);
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            
            try {
                // Verificar duplicados
                const existing = await prisma.user.findFirst({
                    where: {
                        organizationId: this.organization.id,
                        OR: [
                            { email: student.email },
                            ...(student.cpf ? [{ cpf: student.cpf }] : [])
                        ]
                    }
                });

                if (existing) {
                    console.log(`⏭️ Já existe: ${student.originalName} (${student.email})`);
                    this.skipped++;
                    continue;
                }

                // Criar usuário
                const user = await prisma.user.create({
                    data: {
                        organizationId: this.organization.id,
                        email: student.email,
                        password: "$2b$10$defaultHashForImportedUsers",
                        role: "STUDENT",
                        firstName: student.firstName,
                        lastName: student.lastName,
                        phone: student.phone,
                        cpf: student.cpf,
                        isActive: true,
                        emailVerified: false
                    }
                });

                // Criar student
                const studentRecord = await prisma.student.create({
                    data: {
                        organizationId: this.organization.id,
                        userId: user.id,
                        category: "ADULT",
                        gender: "MASCULINO",
                        age: 25,
                        physicalCondition: "INICIANTE",
                        enrollmentDate: new Date(),
                        isActive: true
                    }
                });

                console.log(`✅ [${i + 1}/${students.length}] ${student.originalName}`);
                this.processed++;

            } catch (error) {
                console.error(`❌ Erro ao importar ${student.originalName}:`, error.message);
                this.errors++;
            }
        }
    }

    showSummary() {
        console.log('\n📋 RELATÓRIO FINAL DA IMPORTAÇÃO');
        console.log('================================');
        console.log(`✅ Importados: ${this.processed}`);
        console.log(`⏭️ Ignorados: ${this.skipped}`);
        console.log(`❌ Erros: ${this.errors}`);
        console.log(`📊 Total processado: ${this.processed + this.skipped + this.errors}`);
        
        console.log('\n🎉 Importação dos CLIENTES REAIS concluída!');
    }
}

// Executar importação
async function main() {
    const importer = new RealClientImporter();
    await importer.importRealClients();
}

if (require.main === module) {
    main()
        .then(() => {
            console.log('✅ Script concluído com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha no script:', error);
            process.exit(1);
        });
}

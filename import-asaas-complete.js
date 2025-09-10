const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Configuração para processamento do CSV real
const ENCODING = 'utf8';
const CSV_SEPARATOR = ',';

class AsaasRealParser {
    constructor() {
        this.students = [];
        this.errors = [];
        this.summary = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            totalValue: 0
        };
    }

    // Processar linha do CSV real
    parseCSVRow(row, index) {
        try {
            // Campos do CSV real
            const identificadorExterno = row['Identificador externo'] || '';
            const nome = row['Nome'] || `Aluno ${index}`;
            const email = row['Email'] || '';
            const celular = row['Celular'] || '';
            const cpf = row['CPF ou CNPJ'] || '';
            const rua = row['Rua'] || '';
            const numero = row['Número'] || '';
            const complemento = row['Complemento'] || '';
            const bairro = row['Bairro'] || '';
            const cidade = row['Cidade'] || 'Belo Horizonte - Minas Gerais';
            const cep = row['CEP'] || '';
            const estado = row['Estado'] || 'MG';
            const valorPago = row['Valor pago'] || 'R$ 0,00';
            const valorVencer = row['Valor a vencer'] || 'R$ 0,00';

            // Validações básicas
            if (!nome || nome.trim() === '') {
                throw new Error(`Nome vazio na linha ${index}`);
            }

            // Gerar email se não existir
            let finalEmail = email;
            if (!email || email.trim() === '') {
                const nomeSlug = nome.toLowerCase()
                    .replace(/[àáâãäå]/g, 'a')
                    .replace(/[èéêë]/g, 'e')
                    .replace(/[ìíîï]/g, 'i')
                    .replace(/[òóôõö]/g, 'o')
                    .replace(/[ùúûü]/g, 'u')
                    .replace(/[ç]/g, 'c')
                    .replace(/[^a-z0-9]/g, '')
                    .substring(0, 10);
                finalEmail = `${nomeSlug}${index}@kravmaga.com.br`;
            }

            // Processar telefone
            const phone = this.formatPhone(celular);

            // Processar endereço
            const endereco = [rua, numero, complemento].filter(Boolean).join(', ');
            const enderecoCompleto = [endereco, bairro, cidade].filter(Boolean).join(' - ');

            // Processar valores
            const valorPagoNum = this.parseMonetaryValue(valorPago);
            const valorVencerNum = this.parseMonetaryValue(valorVencer);
            const mensalidade = Math.max(valorPagoNum, valorVencerNum, 199.90);

            // Gerar matrícula
            const registration = this.generateRegistration(identificadorExterno, nome, index);

            return {
                name: nome.trim(),
                email: finalEmail.toLowerCase(),
                phone: phone,
                document: this.formatDocument(cpf),
                registration: registration,
                address: enderecoCompleto,
                city: cidade.includes('Belo Horizonte') ? 'Belo Horizonte' : cidade,
                state: estado || 'MG',
                zipCode: this.formatZipCode(cep),
                neighborhood: bairro,
                status: 'ACTIVE',
                belt: 'BRANCA',
                enrollmentDate: new Date().toISOString().split('T')[0],
                monthlyFee: mensalidade,
                paymentMethod: 'ASAAS',
                asaasData: {
                    identificadorExterno: identificadorExterno || nome,
                    valorPago: valorPagoNum,
                    valorAVencer: valorVencerNum,
                    valorTotal: valorPagoNum + valorVencerNum,
                    rawData: row,
                    importedAt: new Date().toISOString()
                },
                emergencyContact: {
                    name: '',
                    phone: '',
                    relationship: ''
                },
                medicalInfo: {
                    conditions: '',
                    medications: '',
                    allergies: '',
                    observations: ''
                }
            };

        } catch (error) {
            throw new Error(`Erro ao processar linha ${index}: ${error.message}`);
        }
    }

    // Formatar telefone brasileiro
    formatPhone(phone) {
        if (!phone) return null;
        
        const cleaned = phone.toString().replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            return `(${cleaned.substring(0,2)}) ${cleaned.substring(2,7)}-${cleaned.substring(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.substring(0,2)}) ${cleaned.substring(2,6)}-${cleaned.substring(6)}`;
        }
        
        return phone;
    }

    // Formatar documento (CPF/CNPJ)
    formatDocument(doc) {
        if (!doc) return null;
        
        const cleaned = doc.toString().replace(/\D/g, '');
        
        if (cleaned.length === 11) {
            // CPF
            return `${cleaned.substring(0,3)}.${cleaned.substring(3,6)}.${cleaned.substring(6,9)}-${cleaned.substring(9)}`;
        } else if (cleaned.length === 14) {
            // CNPJ
            return `${cleaned.substring(0,2)}.${cleaned.substring(2,5)}.${cleaned.substring(5,8)}/${cleaned.substring(8,12)}-${cleaned.substring(12)}`;
        }
        
        return cleaned;
    }

    // Formatar CEP
    formatZipCode(cep) {
        if (!cep) return null;
        
        const cleaned = cep.toString().replace(/\D/g, '');
        
        if (cleaned.length === 8) {
            return `${cleaned.substring(0,5)}-${cleaned.substring(5)}`;
        }
        
        return cleaned;
    }

    // Converter valor monetário
    parseMonetaryValue(value) {
        if (!value) return 0;
        
        const cleaned = value.toString()
            .replace('R$', '')
            .replace(/\s/g, '')
            .replace(',', '.');
        
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    // Gerar matrícula única
    generateRegistration(identificador, nome, index) {
        if (identificador && identificador.trim() !== '') {
            return `AS${identificador.substring(0, 8)}`;
        }
        
        const nomeCode = nome.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '');
        const indexCode = index.toString().padStart(4, '0');
        return `AS${nomeCode}${indexCode}`;
    }

    // Processar CSV completo
    async processCSV(csvFilePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            
            console.log(`🔄 Starting CSV processing from: ${csvFilePath}`);
            
            fs.createReadStream(csvFilePath, { encoding: ENCODING })
                .pipe(csv({ separator: CSV_SEPARATOR }))
                .on('data', (row) => {
                    this.summary.total++;
                    
                    try {
                        const student = this.parseCSVRow(row, this.summary.total);
                        
                        if (student) {
                            results.push(student);
                            this.summary.processed++;
                            console.log(`✅ Processed: ${student.name} (${student.email})`);
                        } else {
                            this.summary.skipped++;
                            console.log(`⏭️ Skipped line ${this.summary.total} (empty or invalid)`);
                        }
                        
                    } catch (error) {
                        this.summary.errors++;
                        this.errors.push(`Line ${this.summary.total}: ${error.message}`);
                        console.log(`❌ Error line ${this.summary.total}: ${error.message}`);
                    }
                })
                .on('end', () => {
                    this.students = results;
                    console.log(`📋 CSV processing completed. Processed ${results.length} students.`);
                    resolve(results);
                })
                .on('error', (error) => {
                    console.error('❌ CSV parsing error:', error);
                    reject(error);
                });
        });
    }

    // Gerar relatório
    generateReport() {
        return {
            summary: this.summary,
            errors: this.errors,
            samples: this.students.slice(0, 3),
            timestamp: new Date().toISOString()
        };
    }

    // Gerar SQL de inserção
    generateSQL() {
        const sqlStatements = this.students.map(student => {
            const escapedName = student.name.replace(/'/g, "''");
            const escapedEmail = student.email.replace(/'/g, "''");
            const escapedAddress = (student.address || '').replace(/'/g, "''");
            
            return `-- ${escapedName}\nINSERT INTO students (name, email, phone, registration, address, monthly_fee, status) VALUES ('${escapedName}', '${escapedEmail}', '${student.phone || ''}', '${student.registration}', '${escapedAddress}', ${student.monthlyFee}, '${student.status}');`;
        });
        
        return sqlStatements.join('\n\n');
    }
}

// Função principal
async function main() {
    try {
        console.log('🚀 Starting Asaas COMPLETE Student Import');
        console.log('=========================================');
        
        const csvFile = 'clientes-real.csv';
        
        if (!fs.existsSync(csvFile)) {
            throw new Error(`CSV file not found: ${csvFile}`);
        }
        
        console.log(`📊 Processing file: ${csvFile}`);
        
        const parser = new AsaasRealParser();
        await parser.processCSV(csvFile);
        
        // Gerar arquivos de saída
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPrefix = `asaas-complete-${timestamp}`;
        
        // JSON com dados estruturados
        const jsonFile = `${outputPrefix}.json`;
        fs.writeFileSync(jsonFile, JSON.stringify(parser.students, null, 2));
        
        // SQL para inserção
        const sqlFile = `${outputPrefix}.sql`;
        fs.writeFileSync(sqlFile, parser.generateSQL());
        
        // Relatório detalhado
        const reportFile = `${outputPrefix}-report.json`;
        fs.writeFileSync(reportFile, JSON.stringify(parser.generateReport(), null, 2));
        
        // Sumário final
        console.log('\n📋 COMPLETE IMPORT SUMMARY');
        console.log('==========================');
        console.log(`📊 Total Lines: ${parser.summary.total}`);
        console.log(`✅ Processed: ${parser.summary.processed}`);
        console.log(`⏭️ Skipped: ${parser.summary.skipped}`);
        console.log(`❌ Errors: ${parser.summary.errors}`);
        console.log(`💰 Total Students: ${parser.students.length}`);
        
        console.log('\n📁 Generated Files:');
        console.log(`- ${jsonFile} (JSON data)`);
        console.log(`- ${sqlFile} (SQL script)`);
        console.log(`- ${reportFile} (detailed report)`);
        
        if (parser.errors.length > 0) {
            console.log('\n⚠️ Errors found:');
            parser.errors.slice(0, 10).forEach(error => console.log(`  ${error}`));
            if (parser.errors.length > 10) {
                console.log(`  ... and ${parser.errors.length - 10} more errors`);
            }
        }
        
        console.log('\n🎉 Complete import processing finished!');
        console.log('\nNext steps:');
        console.log('1. Review the generated files');
        console.log('2. Run the database import script');
        console.log('3. Test the imported data in the application');
        
    } catch (error) {
        console.error('❌ Fatal error during import:', error);
        process.exit(1);
    }
}

// Executar o script
if (require.main === module) {
    main();
}

module.exports = AsaasRealParser;

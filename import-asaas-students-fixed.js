const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Configuração para processamento do CSV brasileiro
const ENCODING = 'utf8';
const CSV_SEPARATOR = ',';

class AsaasParserFixed {
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

    // Mapeamento correto das colunas conforme dados reais
    parseCSVRow(row) {
        // Debug: vamos ver as chaves do objeto
        console.log('📋 Row keys:', Object.keys(row));
        console.log('📋 First row data:', row);
        
        // Detectar automaticamente as colunas baseado no conteúdo
        const keys = Object.keys(row);
        
        // Buscar email válido
        const emailKey = keys.find(key => {
            const value = row[key];
            return value && typeof value === 'string' && value.includes('@');
        });
        
        // Buscar telefone (formato brasileiro)
        const phoneKey = keys.find(key => {
            const value = row[key];
            return value && /^(\(\d{2}\)|\d{2})\s?9?\d{4,5}[\-\s]?\d{4}$/.test(value.toString());
        });
        
        // Buscar nome (string sem @ e sem números apenas)
        const nameKey = keys.find(key => {
            const value = row[key];
            return value && 
                   typeof value === 'string' && 
                   !value.includes('@') && 
                   !value.startsWith('R$') &&
                   !/^\d+$/.test(value) &&
                   value.length > 3;
        });
        
        // Buscar identificador/código
        const idKey = keys.find(key => {
            const value = row[key];
            return value && (value.toString().startsWith('AS') || /^\d{3,}$/.test(value));
        });

        const email = emailKey ? row[emailKey] : null;
        const phone = phoneKey ? this.formatPhone(row[phoneKey]) : null;
        const name = nameKey ? row[nameKey] : email; // fallback para email se não encontrar nome
        const externalId = idKey ? row[idKey] : null;

        return {
            name: name || 'Nome não informado',
            email: email || `temp${Date.now()}@kravmaga.com.br`,
            phone: phone,
            document: this.extractDocument(row),
            registration: this.generateRegistration(externalId, email),
            address: this.extractAddress(row),
            city: 'Belo Horizonte',
            state: 'MG',
            zipCode: this.extractZipCode(row),
            neighborhood: null,
            status: 'ACTIVE',
            belt: 'BRANCA',
            enrollmentDate: new Date().toISOString().split('T')[0],
            monthlyFee: 299.99,
            paymentMethod: 'ASAAS',
            asaasData: {
                identificadorExterno: externalId || name,
                empresa: this.extractCompany(row),
                valorVencido: 0,
                valorPago: 0,
                valorAVencer: 0,
                valorTotal: 0,
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
            },
            source: 'ASAAS_IMPORT',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    formatPhone(phone) {
        if (!phone) return null;
        
        // Remove caracteres especiais
        const cleaned = phone.toString().replace(/\D/g, '');
        
        // Formato brasileiro
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        
        return phone;
    }

    extractDocument(row) {
        const values = Object.values(row);
        for (const value of values) {
            if (value && typeof value === 'string') {
                const cleaned = value.replace(/\D/g, '');
                if (cleaned.length === 11 || cleaned.length === 14) {
                    return cleaned;
                }
            }
        }
        return null;
    }

    extractZipCode(row) {
        const values = Object.values(row);
        for (const value of values) {
            if (value && /\d{5}[\-]?\d{3}/.test(value.toString())) {
                return value.toString().replace(/\D/g, '');
            }
        }
        return null;
    }

    extractAddress(row) {
        const values = Object.values(row);
        for (const value of values) {
            if (value && typeof value === 'string' && 
                (value.includes('Belo Horizonte') || value.includes('MG') || value.includes('Rua') || value.includes('Avenida'))) {
                return value;
            }
        }
        return null;
    }

    extractCompany(row) {
        const values = Object.values(row);
        for (const value of values) {
            if (value && typeof value === 'string' && /^\d{1,4}$/.test(value)) {
                return value;
            }
        }
        return '';
    }

    generateRegistration(externalId, email) {
        if (externalId && externalId.toString().startsWith('AS')) {
            return externalId.toString();
        }
        
        if (email) {
            const prefix = email.split('@')[0].slice(0, 6).toUpperCase();
            const timestamp = Date.now().toString().slice(-4);
            return `AS${prefix}${timestamp}`;
        }
        
        return `AS${Date.now().toString().slice(-8)}`;
    }

    async processCSV(filePath) {
        console.log(`🔄 Starting CSV processing from: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found: ${filePath}`);
        }

        return new Promise((resolve, reject) => {
            const results = [];
            
            fs.createReadStream(filePath)
                .pipe(csv({
                    separator: CSV_SEPARATOR,
                    skipEmptyLines: true,
                    skipLinesWithError: true
                }))
                .on('data', (row) => {
                    this.summary.total++;
                    
                    try {
                        // Skip empty rows
                        if (Object.values(row).every(val => !val || val.trim() === '')) {
                            this.summary.skipped++;
                            return;
                        }

                        const student = this.parseCSVRow(row);
                        
                        // Validação básica
                        if (!student.email || !student.name) {
                            this.errors.push(`Row ${this.summary.total}: Missing required fields`);
                            this.summary.errors++;
                            return;
                        }

                        results.push(student);
                        this.summary.processed++;
                        
                        console.log(`✅ Processed: ${student.name} (${student.email})`);
                        
                    } catch (error) {
                        this.errors.push(`Row ${this.summary.total}: ${error.message}`);
                        this.summary.errors++;
                        console.log(`❌ Error processing row ${this.summary.total}: ${error.message}`);
                    }
                })
                .on('end', () => {
                    this.students = results;
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    generateSQL() {
        const sqlStatements = this.students.map(student => {
            const values = [
                this.escapeSQL(student.name),
                this.escapeSQL(student.email),
                student.phone ? this.escapeSQL(student.phone) : 'NULL',
                student.document ? this.escapeSQL(student.document) : 'NULL',
                this.escapeSQL(student.registration),
                student.address ? this.escapeSQL(student.address) : 'NULL',
                student.city ? this.escapeSQL(student.city) : 'NULL',
                student.state ? this.escapeSQL(student.state) : 'NULL',
                student.zipCode ? this.escapeSQL(student.zipCode) : 'NULL',
                this.escapeSQL(student.status),
                this.escapeSQL(student.belt),
                this.escapeSQL(student.enrollmentDate),
                student.monthlyFee,
                this.escapeSQL(student.paymentMethod),
                this.escapeSQL(JSON.stringify(student.asaasData)),
                this.escapeSQL(student.source),
                this.escapeSQL(student.createdAt),
                this.escapeSQL(student.updatedAt)
            ];

            return `INSERT INTO students (name, email, phone, document, registration, address, city, state, zip_code, status, belt, enrollment_date, monthly_fee, payment_method, asaas_data, source, created_at, updated_at) VALUES (${values.join(', ')});`;
        });

        return sqlStatements.join('\n');
    }

    escapeSQL(value) {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'number') return value;
        return `'${value.toString().replace(/'/g, "''")}'`;
    }

    generateReport() {
        return {
            summary: this.summary,
            errors: this.errors,
            sampleStudents: this.students.slice(0, 5),
            timestamp: new Date().toISOString()
        };
    }
}

// Função principal
async function main() {
    try {
        console.log('🚀 Starting Asaas Student Import (Fixed Version)');
        console.log('================================================');
        
        // Procurar arquivos CSV disponíveis
        const files = fs.readdirSync('.').filter(f => f.endsWith('.csv'));
        console.log('📁 CSV files found:', files);
        
        if (files.length === 0) {
            console.log('❌ No CSV files found. Please place your Asaas export file in this directory.');
            return;
        }
        
        // Usar o primeiro arquivo CSV encontrado
        const csvFile = files[0];
        console.log(`📊 Processing file: ${csvFile}`);
        
        const parser = new AsaasParserFixed();
        await parser.processCSV(csvFile);
        
        // Gerar arquivos de saída
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPrefix = `asaas-students-fixed-${timestamp}`;
        
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
        console.log('\n📋 IMPORT SUMMARY (FIXED)');
        console.log('========================');
        console.log(`📊 Total Lines: ${parser.summary.total}`);
        console.log(`✅ Processed: ${parser.summary.processed}`);
        console.log(`⏭️ Skipped: ${parser.summary.skipped}`);
        console.log(`❌ Errors: ${parser.summary.errors}`);
        console.log(`💰 Total Value: R$ ${parser.summary.totalValue.toFixed(2)}`);
        console.log(`📈 Average Monthly Fee: R$ 299,99`);
        
        console.log('\n📁 Generated Files:');
        console.log(`- ${jsonFile} (JSON data)`);
        console.log(`- ${sqlFile} (SQL script)`);
        console.log(`- ${reportFile} (detailed report)`);
        
        if (parser.errors.length > 0) {
            console.log('\n⚠️ Errors found:');
            parser.errors.forEach(error => console.log(`  ${error}`));
        }
        
        console.log('\n🎉 Fixed import completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Review the generated files');
        console.log('2. Run the SQL script in your database');
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

module.exports = AsaasParserFixed;

/**
 * 🛡️ SISTEMA DE BACKUP AUTOMÁTICO
 * Protege alterações e permite rollback seguro
 */

const fs = require('fs');
const path = require('path');

class BackupSystem {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.ensureBackupDir();
    }
    
    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    
    // Criar backup antes de alterações
    createBackup(filePath, description = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(filePath);
        const backupPath = path.join(
            this.backupDir, 
            `${timestamp}_${fileName}.backup`
        );
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const backupInfo = {
                timestamp,
                originalPath: filePath,
                description,
                content
            };
            
            fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2));
            console.log(`✅ Backup criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error(`❌ Erro ao criar backup: ${error.message}`);
            return null;
        }
    }
    
    // Restaurar backup
    restoreBackup(backupPath) {
        try {
            const backupInfo = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            fs.writeFileSync(backupInfo.originalPath, backupInfo.content);
            console.log(`✅ Backup restaurado: ${backupInfo.originalPath}`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao restaurar backup: ${error.message}`);
            return false;
        }
    }
    
    // Listar backups disponíveis
    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = files
                .filter(f => f.endsWith('.backup'))
                .map(f => {
                    const backupPath = path.join(this.backupDir, f);
                    const info = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                    return {
                        file: f,
                        path: backupPath,
                        timestamp: info.timestamp,
                        originalPath: info.originalPath,
                        description: info.description
                    };
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
            return backups;
        } catch (error) {
            console.error(`❌ Erro ao listar backups: ${error.message}`);
            return [];
        }
    }
}

module.exports = BackupSystem;

// Exemplo de uso:
if (require.main === module) {
    const backup = new BackupSystem();
    
    // Criar backup do arquivo principal
    const mainFile = path.join(__dirname, 'public/index.html');
    backup.createBackup(mainFile, 'Backup antes de implementar módulos isolados');
    
    // Listar backups existentes
    console.log('\n📋 Backups disponíveis:');
    backup.listBackups().forEach(b => {
        console.log(`- ${b.timestamp}: ${b.description}`);
    });
}
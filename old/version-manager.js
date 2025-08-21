#!/usr/bin/env node
/**
 * 🔄 GERENCIADOR DE VERSÕES E ROLLBACK
 * Permite versionamento seguro e rollback automático
 */

const fs = require('fs');
const path = require('path');
const BackupSystem = require('./backup-system');

class VersionManager {
    constructor() {
        this.backup = new BackupSystem();
        this.versionFile = path.join(__dirname, 'version.json');
        this.mainFiles = [
            'public/index.html',
            'public/js/modules/plans-manager.js',
            'public/css/modules/plans-styles.css'
        ];
    }
    
    // Criar nova versão
    createVersion(description) {
        const version = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            description,
            files: {}
        };
        
        // Backup de todos os arquivos principais
        this.mainFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const backupPath = this.backup.createBackup(fullPath, description);
                version.files[filePath] = backupPath;
            }
        });
        
        // Salvar informações da versão
        this.saveVersionInfo(version);
        console.log(`✅ Versão ${version.id} criada: ${description}`);
        return version.id;
    }
    
    // Salvar informações da versão
    saveVersionInfo(version) {
        let versions = [];
        if (fs.existsSync(this.versionFile)) {
            versions = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
        }
        
        versions.push(version);
        fs.writeFileSync(this.versionFile, JSON.stringify(versions, null, 2));
    }
    
    // Listar versões disponíveis
    listVersions() {
        if (!fs.existsSync(this.versionFile)) {
            return [];
        }
        
        const versions = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
        return versions.sort((a, b) => b.id - a.id);
    }
    
    // Fazer rollback para versão específica
    rollbackToVersion(versionId) {
        const versions = this.listVersions();
        const version = versions.find(v => v.id === versionId);
        
        if (!version) {
            console.error(`❌ Versão ${versionId} não encontrada`);
            return false;
        }
        
        console.log(`🔄 Fazendo rollback para versão ${versionId}: ${version.description}`);
        
        // Restaurar todos os arquivos da versão
        Object.entries(version.files).forEach(([filePath, backupPath]) => {
            if (fs.existsSync(backupPath)) {
                this.backup.restoreBackup(backupPath);
                console.log(`✅ Restaurado: ${filePath}`);
            } else {
                console.warn(`⚠️ Backup não encontrado: ${backupPath}`);
            }
        });
        
        console.log(`✅ Rollback para versão ${versionId} concluído`);
        return true;
    }
    
    // Verificar integridade do sistema
    checkIntegrity() {
        console.log('🔍 Verificando integridade do sistema...');
        
        const issues = [];
        
        // Verificar arquivos principais
        this.mainFiles.forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (!fs.existsSync(fullPath)) {
                issues.push(`Arquivo faltando: ${filePath}`);
            }
        });
        
        // Verificar estrutura de módulos
        const moduleDir = path.join(__dirname, 'public/js/modules');
        if (!fs.existsSync(moduleDir)) {
            issues.push('Diretório de módulos não encontrado');
        }
        
        if (issues.length === 0) {
            console.log('✅ Sistema íntegro');
            return true;
        } else {
            console.log('❌ Problemas encontrados:');
            issues.forEach(issue => console.log(`  - ${issue}`));
            return false;
        }
    }
}

// CLI Interface
if (require.main === module) {
    const vm = new VersionManager();
    const [,, command, ...args] = process.argv;
    
    switch (command) {
        case 'create':
            const description = args.join(' ') || 'Nova versão';
            vm.createVersion(description);
            break;
            
        case 'list':
            console.log('\n📋 Versões disponíveis:');
            vm.listVersions().forEach(v => {
                console.log(`${v.id}: ${v.description} (${new Date(v.timestamp).toLocaleString()})`);
            });
            break;
            
        case 'rollback':
            const versionId = parseInt(args[0]);
            if (versionId) {
                vm.rollbackToVersion(versionId);
            } else {
                console.error('❌ Especifique o ID da versão');
            }
            break;
            
        case 'check':
            vm.checkIntegrity();
            break;
            
        default:
            console.log(`
🔄 Gerenciador de Versões

Comandos:
  create [descrição]  - Criar nova versão
  list               - Listar versões
  rollback [id]      - Rollback para versão
  check              - Verificar integridade

Exemplos:
  node version-manager.js create "Implementação módulos isolados"
  node version-manager.js list
  node version-manager.js rollback 1625123456789
  node version-manager.js check
            `);
    }
}

module.exports = VersionManager;
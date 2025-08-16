/**
 * SCRIPT DE MIGRAÇÃO AUTOMÁTICA
 * Converte módulos existentes para o sistema padronizado
 */

class ModuleMigrator {
    
    /**
     * Migra um módulo existente para o padrão CLAUDE.md
     */
    static async migrateModule(moduleName, config = {}) {
        console.log(`🔄 Starting migration for module: ${moduleName}`);
        
        const {
            title = moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
            icon = '📋',
            hasStats = true,
            hasTable = true,
            customActions = []
        } = config;
        
        try {
            // 1. Generate new standardized files
            const moduleConfig = {
                title: title,
                subtitle: `Gerencie ${title.toLowerCase()} da academia`,
                icon: icon,
                buttons: [
                    { text: `Novo ${title}`, type: 'module-isolated-btn-primary', action: `openNew${title}Form` },
                    ...customActions
                ],
                stats: hasStats ? this.generateDefaultStats(moduleName) : [],
                tableConfig: hasTable ? this.generateDefaultTable(moduleName) : null
            };
            
            // 2. Generate files
            const html = ModuleTemplateGenerator.generateHTML(moduleName, moduleConfig);
            const css = this.generateMigrationCSS(moduleName);
            const js = this.generateMigrationJS(moduleName, config);
            
            console.log(`✅ Generated standardized files for ${moduleName}`);
            
            return {
                html,
                css,
                js,
                backupNeeded: true,
                instructions: this.generateMigrationInstructions(moduleName)
            };
            
        } catch (error) {
            console.error(`❌ Migration failed for ${moduleName}:`, error);
            throw error;
        }
    }
    
    /**
     * Gera estatísticas padrão para um módulo
     */
    static generateDefaultStats(moduleName) {
        const defaultStats = {
            plans: [
                { title: 'Planos Ativos', icon: '💰', value: '0', subtitle: 'planos em uso', id: 'activePlansCount' },
                { title: 'Receita Total', icon: '💵', value: 'R$ 0', subtitle: 'receita mensal', id: 'totalRevenue' },
                { title: 'Valor Médio', icon: '📊', value: 'R$ 0', subtitle: 'por plano', id: 'avgPlanValue' },
                { title: 'Modalidades', icon: '🥋', value: '0', subtitle: 'modalidades ativas', id: 'modalitiesCount' }
            ],
            students: [
                { title: 'Alunos Ativos', icon: '👥', value: '0', subtitle: 'matriculados', id: 'activeStudentsCount' },
                { title: 'Novos este Mês', icon: '📈', value: '0', subtitle: 'matrículas', id: 'newStudentsCount' },
                { title: 'Frequência Média', icon: '📊', value: '0%', subtitle: 'presença', id: 'avgAttendance' },
                { title: 'Turmas Ativas', icon: '🥋', value: '0', subtitle: 'em andamento', id: 'activeClassesCount' }
            ],
            courses: [
                { title: 'Cursos Ativos', icon: '📚', value: '0', subtitle: 'em andamento', id: 'activeCoursesCount' },
                { title: 'Total de Aulas', icon: '🎯', value: '0', subtitle: 'programadas', id: 'totalLessonsCount' },
                { title: 'Modalidades', icon: '🥋', value: '0', subtitle: 'diferentes', id: 'modalitiesCount' },
                { title: 'Instrutores', icon: '👨‍🏫', value: '0', subtitle: 'ativos', id: 'instructorsCount' }
            ]
        };
        
        return defaultStats[moduleName] || defaultStats.plans;
    }
    
    /**
     * Gera configuração de tabela padrão
     */
    static generateDefaultTable(moduleName) {
        const defaultTables = {
            plans: {
                title: 'Lista de Planos',
                columns: ['Plano', 'Modalidades', 'Duração', 'Valor', 'Status', 'Ações'],
                actions: [
                    { text: '🔍 Filtros', type: 'module-isolated-btn-secondary', action: 'openFilters' },
                    { text: '📊 Relatório', type: 'module-isolated-btn-secondary', action: 'openReport' }
                ]
            },
            students: {
                title: 'Lista de Alunos',
                columns: ['Aluno', 'Plano', 'Status', 'Última Aula', 'Ações'],
                actions: [
                    { text: '🔍 Filtros', type: 'module-isolated-btn-secondary', action: 'openFilters' },
                    { text: '📊 Relatório', type: 'module-isolated-btn-secondary', action: 'openReport' }
                ]
            },
            courses: {
                title: 'Lista de Cursos',
                columns: ['Curso', 'Modalidade', 'Duração', 'Nível', 'Status', 'Ações'],
                actions: [
                    { text: '🔍 Filtros', type: 'module-isolated-btn-secondary', action: 'openFilters' },
                    { text: '📊 Relatório', type: 'module-isolated-btn-secondary', action: 'openReport' }
                ]
            }
        };
        
        return defaultTables[moduleName] || defaultTables.plans;
    }
    
    /**
     * Gera CSS específico para migração
     */
    static generateMigrationCSS(moduleName) {
        return `
/* ${moduleName.toUpperCase()} MODULE - Migrated to Standard System */
/* Base styles imported from module-system.css */

/* Preserve existing specific customizations */
.${moduleName}-isolated .${moduleName}-isolated-page-header {
    background: var(--primary-gradient) !important;
}

/* Module-specific customizations can be added here */

/* Legacy compatibility - remove after full migration */
.${moduleName}-isolated .legacy-support {
    /* Add any backward compatibility rules here */
}
`;
    }
    
    /**
     * Gera JavaScript para migração
     */
    static generateMigrationJS(moduleName, config) {
        const apiEndpoint = config.apiEndpoint || `/api/${moduleName}`;
        const hasStats = config.hasStats !== false;
        const hasTable = config.hasTable !== false;
        
        return ModuleTemplateGenerator.generateJS(moduleName, {
            apiEndpoint,
            hasStats,
            hasTable
        });
    }
    
    /**
     * Gera instruções de migração
     */
    static generateMigrationInstructions(moduleName) {
        return `
# INSTRUÇÕES DE MIGRAÇÃO - ${moduleName.toUpperCase()}

## 📋 Checklist de Migração

### 1. Backup dos Arquivos Originais
- [ ] Backup de views/${moduleName}.html
- [ ] Backup de css/modules/${moduleName}.css  
- [ ] Backup de js/modules/${moduleName}.js

### 2. Implementar Novos Arquivos
- [ ] Substituir HTML por views/${moduleName}-standardized.html
- [ ] Substituir CSS por css/modules/${moduleName}-standardized.css
- [ ] Substituir JS por js/modules/${moduleName}-standardized.js

### 3. Atualizar Referências
- [ ] Atualizar imports no HTML principal
- [ ] Atualizar referências de navegação
- [ ] Testar todas as funcionalidades

### 4. Verificar Funcionalidades
- [ ] Layout full-width funcionando
- [ ] Estatísticas sendo calculadas
- [ ] Tabela sendo populada
- [ ] Ações (criar, editar, excluir) funcionando
- [ ] Responsividade móvel

### 5. Teste Final
- [ ] Teste em desktop
- [ ] Teste em mobile
- [ ] Teste de navegação entre módulos
- [ ] Teste de performance

## 🎯 Benefícios Pós-Migração
- ✅ Visual consistente com outros módulos
- ✅ Código mais limpo e manutenível  
- ✅ Responsividade automática
- ✅ Sistema de componentes reutilizáveis
- ✅ Fácil customização de cores/layout
`;
    }
    
    /**
     * Valida se um módulo pode ser migrado
     */
    static validateMigration(moduleName) {
        const requiredElements = [
            `${moduleName}-isolated`,
            `${moduleName}TableBody`,
            // Add more validation rules
        ];
        
        const issues = [];
        
        requiredElements.forEach(selector => {
            if (!document.querySelector(`.${selector}`) && !document.getElementById(selector)) {
                issues.push(`Missing required element: ${selector}`);
            }
        });
        
        return {
            canMigrate: issues.length === 0,
            issues: issues,
            recommendations: this.getMigrationRecommendations(moduleName)
        };
    }
    
    static getMigrationRecommendations(moduleName) {
        return [
            `Considere migrar o módulo ${moduleName} para o sistema padronizado`,
            `Use o gerador de templates para acelerar o processo`,
            `Mantenha backups dos arquivos originais`,
            `Teste extensivamente após a migração`
        ];
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleMigrator;
} else {
    window.ModuleMigrator = ModuleMigrator;
}

console.log('🔄 Module Migrator loaded');

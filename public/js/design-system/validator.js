/**
 * Design System Validator
 * Valida conformidade com Guidelines.MD
 */

class DesignSystemValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    // Testar se Design System está carregado
    testDesignSystemLoaded() {
        const test = {
            name: 'Design System CSS carregado',
            type: 'critical'
        };

        try {
            const root = document.documentElement;
            const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
            
            if (primaryColor && (primaryColor === '#4f46e5' || primaryColor === 'rgb(79, 70, 229)' || primaryColor === '#667eea' || primaryColor === 'rgb(102, 126, 234)')) {
                test.status = 'passed';
                test.message = 'Variáveis CSS do Design System carregadas';
                this.results.passed++;
            } else if (primaryColor) {
                test.status = 'warning';
                test.message = `Variável encontrada mas valor inesperado: ${primaryColor}`;
                this.results.warnings++;
            } else {
                test.status = 'failed';
                test.message = 'Variáveis CSS não encontradas ou incorretas';
                this.results.failed++;
            }
        } catch (error) {
            test.status = 'failed';
            test.message = `Erro ao verificar CSS: ${error.message}`;
            this.results.failed++;
        }

        this.results.tests.push(test);
    }

    // Testar componentes Guidelines.MD
    testComponentsPresent() {
        const requiredComponents = [
            'module-isolated-btn-primary',
            'module-isolated-card',
            'module-isolated-table',
            'module-isolated-container',
            'module-isolated-status-active'
        ];

        requiredComponents.forEach(className => {
            const test = {
                name: `Componente .${className}`,
                type: 'component'
            };

            // Criar elemento temporário para testar CSS
            const testElement = document.createElement('div');
            testElement.className = className;
            document.body.appendChild(testElement);
            
            const styles = getComputedStyle(testElement);
            const hasStyles = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
                             styles.background !== 'rgba(0, 0, 0, 0)' ||
                             styles.padding !== '0px';
            
            document.body.removeChild(testElement);

            if (hasStyles) {
                test.status = 'passed';
                test.message = 'Componente com estilos aplicados';
                this.results.passed++;
            } else {
                test.status = 'failed';
                test.message = 'Componente sem estilos ou não encontrado';
                this.results.failed++;
            }

            this.results.tests.push(test);
        });
    }

    // Testar responsividade Guidelines.MD (1/2/4 colunas)
    testResponsiveGrid() {
        const test = {
            name: 'Grid responsivo Guidelines.MD',
            type: 'responsive'
        };

        try {
            const gridElement = document.createElement('div');
            gridElement.className = 'module-isolated-grid';
            document.body.appendChild(gridElement);

            const styles = getComputedStyle(gridElement);
            const isGrid = styles.display === 'grid';
            
            document.body.removeChild(gridElement);

            if (isGrid) {
                test.status = 'passed';
                test.message = 'Grid CSS aplicado corretamente';
                this.results.passed++;
            } else {
                test.status = 'failed';
                test.message = 'Grid CSS não aplicado';
                this.results.failed++;
            }
        } catch (error) {
            test.status = 'failed';
            test.message = `Erro ao testar grid: ${error.message}`;
            this.results.failed++;
        }

        this.results.tests.push(test);
    }

    // Testar módulos migrados
    testModuleMigration() {
        const modules = ['plans', 'students'];
        
        modules.forEach(moduleName => {
            const test = {
                name: `Módulo ${moduleName} migrado`,
                type: 'module'
            };

            // Buscar container tanto pelo ID quanto pela visualização atual
            let container = document.querySelector(`#${moduleName}Container`);
            if (!container) {
                // Se não encontrar pelo ID, buscar no conteúdo ativo
                const activeView = document.querySelector('.view-content > div:not([style*="display: none"])');
                if (activeView && activeView.innerHTML.includes(`${moduleName}Container`)) {
                    container = activeView.querySelector('.module-isolated-container');
                }
            }
            
            if (container && container.classList.contains('module-isolated-container')) {
                test.status = 'passed';
                test.message = 'Container usando Design System';
                this.results.passed++;
            } else if (container) {
                test.status = 'warning';
                test.message = 'Container encontrado mas não migrado';
                this.results.warnings++;
            } else {
                test.status = 'failed';
                test.message = 'Container não encontrado ou módulo não ativo';
                this.results.failed++;
            }

            this.results.tests.push(test);
        });
    }

    // Executar todos os testes
    runAllTests() {
        console.log('🧪 Iniciando validação do Design System...');
        
        this.testDesignSystemLoaded();
        this.testComponentsPresent();
        this.testResponsiveGrid();
        this.testModuleMigration();

        this.displayResults();
        return this.results;
    }

    // Exibir resultados
    displayResults() {
        console.log('\n📊 RESULTADOS DA VALIDAÇÃO:');
        console.log(`✅ Testes aprovados: ${this.results.passed}`);
        console.log(`❌ Testes falharam: ${this.results.failed}`);
        console.log(`⚠️ Avisos: ${this.results.warnings}`);
        
        console.log('\n📋 DETALHES:');
        this.results.tests.forEach(test => {
            const icon = test.status === 'passed' ? '✅' : 
                        test.status === 'failed' ? '❌' : '⚠️';
            console.log(`${icon} ${test.name}: ${test.message}`);
        });

        // Score geral
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const score = Math.round((this.results.passed / total) * 100);
        
        console.log(`\n🎯 SCORE GERAL: ${score}%`);
        
        if (score >= 90) {
            console.log('🎉 Excelente! Design System em conformidade com Guidelines.MD');
        } else if (score >= 70) {
            console.log('👍 Bom! Algumas melhorias necessárias');
        } else {
            console.log('⚠️ Atenção! Várias correções necessárias');
        }
    }
}

// Função global para executar validação
window.validateDesignSystem = function() {
    const validator = new DesignSystemValidator();
    return validator.runAllTests();
};

// Auto-executar quando Design System carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.validateDesignSystem(), 1000);
    });
} else {
    setTimeout(() => window.validateDesignSystem(), 1000);
}

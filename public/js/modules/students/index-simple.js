/**
 * SOLUÇÃO: Converter Students Module para SEM imports ES6
 * 
 * MOTIVO: Firefox/Chrome está falhando ao importar os controllers
 * PROBLEMA: type="module" com imports nem sempre funciona bem
 * 
 * AÇÃO: Usar este arquivo como index.js alternativo
 */

// ============================================================================
// STUDENTS MODULE - SEM ES6 IMPORTS (funciona 100% em todos os navegadores)
// ============================================================================

console.log('🎓 [STUDENTS] Iniciando módulo sem ES6 imports...');

// Defensive globals
window.app = window.app || {
    dispatchEvent: () => {},
    handleError: (err, ctx) => console.error('AppError', ctx, err)
};

let moduleAPI = null;
let listController = null;
let editorController = null;
let personalController = null;

// ============================================================================
// 1. INICIALIZAÇÃO DO API CLIENT
// ============================================================================

async function initializeAPI() {
    // createModuleAPI is provided by public/js/shared/api-client.js
    if (!window.createModuleAPI) {
        throw new Error('API client not loaded');
    }
    moduleAPI = window.createModuleAPI('Students');
}

// ============================================================================
// 2. CARREGAMENTO DE CSS
// ============================================================================

function loadModuleCSS() {
    const cssFiles = [
        '/css/modules/students-enhanced.css',
        '/css/modules/students-premium.css'
    ];
    
    cssFiles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
            console.log(`✅ CSS carregado: ${href}`);
        }
    });
}

// ============================================================================
// 3. RENDER SIMPLES - SEM CONTROLLERS COMPLEXOS
// ============================================================================

async function renderStudentsList(container) {
    console.log('🎓 [STUDENTS] Renderizando lista...');
    
    // Mostrar loading
    container.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
            <div>Carregando estudantes...</div>
        </div>
    `;
    
    try {
        // Buscar dados - organizationId obtido automaticamente do localStorage ou sessionStorage
        const orgId = localStorage.getItem('activeOrganizationId') || 
                      sessionStorage.getItem('activeOrganizationId') || 
                      window.currentOrganizationId;
        const response = await fetch('/api/students', {
            headers: {
                'x-organization-id': orgId || ''
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const json = await response.json();
        const students = json.data || [];
        
        console.log(`✅ Carregados ${students.length} estudantes`);
        
        if (students.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📭</div>
                    <div>Nenhum estudante cadastrado</div>
                </div>
            `;
            return;
        }
        
        // Renderizar tabela
        let html = `
            <div class="module-header-premium">
                <h1>👥 Estudantes</h1>
                <nav class="breadcrumb">Home > Estudantes</nav>
            </div>
            
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px; font-size: 14px; color: #666;">
                    Total: <strong>${students.length}</strong> estudantes
                </div>
                
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 2px solid #667eea;">
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Nome</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Email</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Telefone</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.forEach(student => {
            const name = student.user?.firstName || 'N/A';
            const email = student.user?.email || 'N/A';
            const phone = student.user?.phone || 'N/A';
            const status = student.isActive ? '✅ Ativo' : '⏸️ Inativo';
            
            html += `
                <tr style="border-bottom: 1px solid #eee; hover {background: #f9f9f9;}">
                    <td style="padding: 12px;">${name}</td>
                    <td style="padding: 12px;">${email}</td>
                    <td style="padding: 12px;">${phone}</td>
                    <td style="padding: 12px;">${status}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
        console.log('✅ Lista renderizada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao carregar estudantes:', error);
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #c00;">
                <div style="font-size: 32px; margin-bottom: 10px;">❌</div>
                <div>Erro ao carregar estudantes</div>
                <div style="font-size: 12px; margin-top: 10px; color: #666;">${error.message}</div>
            </div>
        `;
    }
}

// ============================================================================
// 4. INICIALIZAÇÃO DO MÓDULO
// ============================================================================

window.initStudentsModule = async function initStudentsModule(container) {
    console.log('🎓 [NETWORK] Inicializando módulo de Estudantes (versão simples)...');
    try {
        loadModuleCSS();
        await renderStudentsList(container);
        
        window.app?.dispatchEvent?.('module:loaded', { name: 'students' });
        
        return { api: moduleAPI };
    } catch (err) {
        console.error('❌ Erro ao inicializar Students:', err);
        container.innerHTML = '<div class="error-state">Erro ao inicializar Estudantes</div>';
        throw err;
    }
};

// ============================================================================
// 5. REGISTRO GLOBAL
// ============================================================================

window.studentsModule = { 
    init: window.initStudentsModule, 
};

window.students = window.studentsModule;

console.log('✅ Students module (versão simples sem imports) carregado');

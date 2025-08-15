@echo off
:: Script para mover arquivos sem uso para a pasta OLD
:: Criado em 10/08/2025

echo Movendo arquivos sem uso para a pasta OLD...
echo.

:: Criar pasta OLD se não existir
if not exist "OLD" mkdir "OLD"

:: Mover arquivos especificados
move "*.log" "OLD\" 2>nul
move "*.tmp" "OLD\" 2>nul
move "*.bak" "OLD\" 2>nul
move "*.old" "OLD\" 2>nul
move "*.backup" "OLD\" 2>nul

:: Mover arquivos específicos identificados como sem uso
:: Arquivos de teste e debug
move "auto-test-navigation.html" "OLD\" 2>nul
move "backup-students-put.ts" "OLD\" 2>nul
move "check-db.js" "OLD\" 2>nul
move "check-org.js" "OLD\" 2>nul
move "create-org.js" "OLD\" 2>nul
move "create-test-course-for-api.js" "OLD\" 2>nul
move "create-test-course.js" "OLD\" 2>nul
move "debug-courses.html" "OLD\" 2>nul
move "debug-student-editor.html" "OLD\" 2>nul
move "debug-tabs-isolated.html" "OLD\" 2>nul
move "demo-courses-design.html" "OLD\" 2>nul
move "fix-courses-module-plan.md" "OLD\" 2>nul
move "mock-server.js" "OLD\" 2>nul
move "profile-tab-patch.js" "OLD\" 2>nul
move "server-complete.js" "OLD\" 2>nul
move "simple-dashboard-server.js" "OLD\" 2>nul
move "test-api.js" "OLD\" 2>nul
move "test-create-student.js" "OLD\" 2>nul
move "test-courses-complete.html" "OLD\" 2>nul
move "test-courses-enhanced.html" "OLD\" 2>nul
move "test-courses-final.html" "OLD\" 2>nul
move "test-courses-fix.html" "OLD\" 2>nul
move "test-courses-frontend.html" "OLD\" 2>nul
move "test-courses.html" "OLD\" 2>nul
move "test-css-fixed-final.html" "OLD\" 2>nul
move "test-layout-fixed.html" "OLD\" 2>nul
move "test-menu-integration.html" "OLD\" 2>nul
move "test-navigation-auto.js" "OLD\" 2>nul
move "test-organizations-crud.html" "OLD\" 2>nul
move "test-refactored-system.html" "OLD\" 2>nul
move "test-server.js" "OLD\" 2>nul
move "test-student-creation-direct.js" "OLD\" 2>nul
move "test-student-creation-fixed.js" "OLD\" 2>nul
move "test-student-editor-fix.html" "OLD\" 2>nul
move "test-student-editor-integration.html" "OLD\" 2>nul
move "test-student-final.js" "OLD\" 2>nul
move "test-student-navigation.html" "OLD\" 2>nul
move "test-students-final.js" "OLD\" 2>nul
move "test-tabs-correction-final.html" "OLD\" 2>nul
move "test-tabs-fix-final.html" "OLD\" 2>nul

:: Mover arquivos de documentação antiga
move "AUDITORIA_ESTUDANTES_COMPLETA.md" "OLD\" 2>nul
move "CLAUDE.md" "OLD\" 2>nul
move "CORRECAO_CRITICA_PASSWORD.md" "OLD\" 2>nul
move "CSS_STANDARDIZATION_REPORT.md" "OLD\" 2>nul
move "DASHBOARD_INTEGRATION_SUCCESS.md" "OLD\" 2>nul
move "FINANCIAL_MODULE_ARCHITECTURE.md" "OLD\" 2>nul
move "FORMATTING_FIX_REPORT.md" "OLD\" 2>nul
move "JAVASCRIPT_FIXES_REPORT.md" "OLD\" 2>nul
move "LAYOUT_FIXES_REPORT.md" "OLD\" 2>nul
move "MODAL_POSITIONING_FIX.md" "OLD\" 2>nul
move "MODULE_SYSTEM_ANALYSIS.md" "OLD\" 2>nul
move "MULTIPLE_INSTANCE_FIX.md" "OLD\" 2>nul
move "NAVIGATION_FIX_REPORT.md" "OLD\" 2>nul
move "PROJECT.md" "OLD\" 2>nul
move "PROMPT_IMPROVEMENT_RULE.md" "OLD\" 2>nul
move "REFACTORED_SYSTEM_GUIDE.md" "OLD\" 2>nul
move "RESTART-GUIDE.md" "OLD\" 2>nul
move "SISTEMA_CORRIGIDO_FINAL.md" "OLD\" 2>nul
move "STUDENT_SYSTEM_CORRECTION_PLAN.md" "OLD\" 2>nul
move "TEST-GUIDE.md" "OLD\" 2>nul
move "TEST-STUDENTS-PLANS-GUIDE.md" "OLD\" 2>nul

:: Mover capturas de tela
for %%f in ("Captura de tela *.png") do move "%%f" "OLD\" 2>nul

echo.
echo Arquivos movidos com sucesso para a pasta OLD!
echo.
pause
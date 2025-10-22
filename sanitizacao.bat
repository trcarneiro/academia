@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     SANITIZAÇÃO - MENU PRINCIPAL                             ║
REM ║          Coordenador de Fases (Recomendado)                  ║
REM ║                 Data: 19/10/2025                             ║
REM ╚══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
cd /d "h:\projetos\academia"

color 0F
title SANITIZACAO - MENU PRINCIPAL

:menu
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     SANITIZAÇÃO - ACADEMIA KRAV MAGA V2.0                 ║
echo ║          Menu de Coordenação de Fases                      ║
echo ║                  Data: 19/10/2025                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo FASES DE SANITIZAÇÃO:
echo.
echo   [1] FASE 1 - AUDITORIA (Identificar arquivos)
echo       - Varre todos os arquivos
echo       - Categoriza por tipo
echo       - Gera relatório em Markdown/JSON
echo       - NÃO move nada
echo       Status: RECOMENDADO PRIMEIRO
echo.

echo   [2] FASE 2 - PREVIEW (Visualizar movimento)
echo       - Mostra o que SERIA movido
echo       - Não mexe em nada
echo       - Permite verificar antes
echo       Status: RECOMENDADO SEGUNDO
echo.

echo   [3] FASE 3A - BACKUP (Cópia de Segurança)
echo       - Cria cópia completa de segurança
echo       - Backup de src, public, node_modules, .git, etc
echo       - Essencial fazer ANTES de mover
echo       Status: RECOMENDADO TERCEIRO
echo.

echo   [4] FASE 3B - MOVER (Movimento Real)
echo       - Executa movimento de arquivos
echo       - Move para OLD_191025 com subpastas
echo       - ATENÇÃO: Sem possibilidade de desfazer!
echo       Status: SÓ FAZER APÓS BACKUP!
echo.

echo   [5] FASE 4 - LIMPEZA FINAL (Remover Vazios)
echo       - Remove pastas vazias
echo       - Gera relatório final
echo       Status: FAZER POR ÚLTIMO
echo.

echo   [6] EXECUTAR TODAS AS FASES (Automaticamente)
echo       - Executa fases 1 a 5 em sequência
echo       - Com confirmações entre fases
echo       Status: MAIS RÁPIDO
echo.

echo   [0] SAIR
echo.

set /p CHOICE="Digite sua opção (0-6): "

if "%CHOICE%"=="1" (
    cls
    echo Iniciando FASE 1 - AUDITORIA...
    echo.
    call powershell -ExecutionPolicy Bypass -File "scripts\audit-sanitization.ps1"
    echo.
    pause
    goto menu
)

if "%CHOICE%"=="2" (
    cls
    echo Iniciando FASE 2 - PREVIEW...
    echo.
    call move-files-preview.bat
    echo.
    goto menu
)

if "%CHOICE%"=="3" (
    cls
    echo Iniciando FASE 3A - BACKUP...
    echo.
    call backup-before-move.bat
    echo.
    goto menu
)

if "%CHOICE%"=="4" (
    cls
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║ AVISO CRÍTICO - FASE 3B MOVIMENTO REAL                     ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Você está prestes a MOVER arquivos para OLD_191025
    echo.
    echo ESTE PROCESSO PODE NÃO SER REVERSÍVEL!
    echo.
    echo Recomendações:
    echo   1. Certifique-se de ter feito BACKUP (FASE 3A)
    echo   2. Feche todos os programas que usam esses arquivos
    echo   3. Tenha certeza antes de prosseguir
    echo.
    set /p CONFIRM="Tem certeza que deseja continuar? (S/N): "
    if /i "%CONFIRM%"=="S" (
        cls
        echo Iniciando FASE 3B - MOVIMENTO REAL...
        echo.
        call move-files-execute.bat
        echo.
        pause
    ) else (
        echo Operação cancelada
        pause
    )
    goto menu
)

if "%CHOICE%"=="5" (
    cls
    echo Iniciando FASE 4 - LIMPEZA FINAL...
    echo.
    call cleanup-final.bat
    echo.
    pause
    goto menu
)

if "%CHOICE%"=="6" (
    cls
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║ EXECUTAR TODAS AS FASES (Automaticamente)                 ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Isto executará TODAS as 5 fases em sequência:
    echo   1. AUDITORIA
    echo   2. PREVIEW
    echo   3. BACKUP
    echo   4. MOVIMENTO REAL
    echo   5. LIMPEZA FINAL
    echo.
    echo ATENÇÃO: Isso pode levar varios minutos!
    echo.
    set /p CONFIRM="Deseja continuar? (S/N): "
    
    if /i "%CONFIRM%"=="S" (
        cls
        echo ════════════════════════════════════════════════════════════
        echo FASE 1 - AUDITORIA
        echo ════════════════════════════════════════════════════════════
        call powershell -ExecutionPolicy Bypass -File "scripts\audit-sanitization.ps1"
        pause
        
        cls
        echo ════════════════════════════════════════════════════════════
        echo FASE 2 - PREVIEW
        echo ════════════════════════════════════════════════════════════
        call move-files-preview.bat
        pause
        
        cls
        echo ════════════════════════════════════════════════════════════
        echo FASE 3A - BACKUP
        echo ════════════════════════════════════════════════════════════
        call backup-before-move.bat
        pause
        
        cls
        echo ════════════════════════════════════════════════════════════
        echo FASE 3B - MOVIMENTO REAL
        echo ════════════════════════════════════════════════════════════
        call move-files-execute.bat
        pause
        
        cls
        echo ════════════════════════════════════════════════════════════
        echo FASE 4 - LIMPEZA FINAL
        echo ════════════════════════════════════════════════════════════
        call cleanup-final.bat
        pause
        
        cls
        echo ╔════════════════════════════════════════════════════════════╗
        echo ║ TODAS AS FASES FORAM CONCLUÍDAS COM SUCESSO!             ║
        echo ╚════════════════════════════════════════════════════════════╝
        echo.
        echo PRÓXIMOS PASSOS:
        echo   1. Testar a aplicação: npm run dev
        echo   2. Rodar testes: npm run test
        echo   3. Fazer commit: git commit -m "Sanitizacao completa"
        echo   4. Remover BACKUP_SEGURANCA_* se quiser liberar espaço
        echo.
        pause
    )
    
    goto menu
)

if "%CHOICE%"=="0" (
    cls
    echo.
    echo Até logo!
    echo.
    exit /b 0
)

echo Opção inválida! Digite 0-6
pause
goto menu

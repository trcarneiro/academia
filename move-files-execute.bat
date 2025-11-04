@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     SANITIZAÇÃO - Mover Arquivos para OLD_191025             ║
REM ║               VERSÃO: EXECUTAR (REAL)                        ║
REM ║                 Data: 19/10/2025                             ║
REM ╚══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
cd /d "h:\projetos\academia"

REM Cores e formatação
color 0A
title SANITIZACAO - Mover Arquivos (MODO REAL)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     FASE 3: MOVIMENTO REAL DE ARQUIVOS                   ║
echo ║     Para: OLD_191025                                       ║
echo ║     Data: %date% %time%                                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Criar pasta OLD_191025
if not exist "OLD_191025" (
    echo [CRIANDO] Pasta OLD_191025...
    mkdir "OLD_191025"
    if errorlevel 1 (
        echo [ERRO] Falha ao criar pasta OLD_191025
        pause
        exit /b 1
    )
    echo [OK] Pasta criada com sucesso
    echo.
)

REM Criar subpastas
echo [ESTRUTURA] Criando estrutura de pastas...
for %%D in (BACKUP_FILES TEMP_LOGS DUPLICATES GENERATED_DOCS OLD_MODULES ARCHIVES DEPENDENCIES IDE_BUILD) do (
    if not exist "OLD_191025\%%D" (
        mkdir "OLD_191025\%%D"
        echo   - OLD_191025\%%D criada
    )
)
echo.

REM Contar arquivos antes
for /f %%A in ('dir /s /b | find /c /v ""') do set BEFORE_COUNT=%%A
echo [ESTATISTICAS] Arquivos antes: !BEFORE_COUNT!
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 1: BACKUP_FILES
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] BACKUP_FILES...
set COUNT=0

for /r "public\js\modules" %%F in (*-backup.js *-old.js *-ultra-simple.js *-simple-test.js) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\BACKUP_FILES\" >nul 2>&1
        set /a COUNT+=1
    )
)

for /r "." %%F in (*.bak *.backup) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\BACKUP_FILES\" >nul 2>&1
        set /a COUNT+=1
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para BACKUP_FILES
) else (
    echo [INFO] Nenhum arquivo BACKUP_FILES encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 2: TEMP_LOGS
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] TEMP_LOGS...
set COUNT=0

for /r "." %%F in (*.log *.tmp *.temp) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\TEMP_LOGS\" >nul 2>&1
        set /a COUNT+=1
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para TEMP_LOGS
) else (
    echo [INFO] Nenhum arquivo TEMP_LOGS encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 3: DUPLICATES
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] DUPLICATES...
set COUNT=0

for /r "public\js\modules" %%F in (*copy*.js *-copy*.js) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\DUPLICATES\" >nul 2>&1
        set /a COUNT+=1
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para DUPLICATES
) else (
    echo [INFO] Nenhum arquivo DUPLICATES encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 4: GENERATED_DOCS
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] GENERATED_DOCS...
set COUNT=0

REM Exceções para NÃO mover
set KEEP_DOCS=AGENTS.md AGENTS.md.bak AUDIT_REPORT.md

for /r "." %%F in (*COMPLETE*.md *REPORT*.md *SUMMARY*.md *FIX*.md *DEBUG*.md) do (
    set SKIP=0
    for %%K in (!KEEP_DOCS!) do (
        if "%%~nxF"=="%%K" set SKIP=1
    )
    
    if !SKIP! equ 0 (
        if exist "%%F" (
            echo   - Movendo: %%~nxF
            move "%%F" "OLD_191025\GENERATED_DOCS\" >nul 2>&1
            set /a COUNT+=1
        )
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para GENERATED_DOCS
) else (
    echo [INFO] Nenhum arquivo GENERATED_DOCS encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 5: OLD_MODULES
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] OLD_MODULES...
set COUNT=0

for /r "public\js\modules" %%F in (*-old.js *-backup.js *-refactored.js *-enhanced.js) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\OLD_MODULES\" >nul 2>&1
        set /a COUNT+=1
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para OLD_MODULES
) else (
    echo [INFO] Nenhum arquivo OLD_MODULES encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 6: ARCHIVES
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] ARCHIVES...
set COUNT=0

for /r "." %%F in (*.zip *.rar *.tar *.gz) do (
    if exist "%%F" (
        echo   - Movendo: %%~nxF
        move "%%F" "OLD_191025\ARCHIVES\" >nul 2>&1
        set /a COUNT+=1
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! arquivos movidos para ARCHIVES
) else (
    echo [INFO] Nenhum arquivo ARCHIVES encontrado
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 7: PASTAS ANTIGAS
REM ═══════════════════════════════════════════════════════════════
echo [MOVENDO] Pastas antigas...
set COUNT=0

for /d %%D in (*-old *_old *-backup *_backup *-deprecated backup backups) do (
    if exist "%%D" (
        if not "%%D"=="OLD_191025" (
            echo   - Movendo pasta: %%D
            move "%%D" "OLD_191025\IDE_BUILD\"  >nul 2>&1
            set /a COUNT+=1
        )
    )
)

if !COUNT! gtr 0 (
    echo [OK] !COUNT! pastas movidas
) else (
    echo [INFO] Nenhuma pasta antiga encontrada
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM SUMÁRIO FINAL
REM ═══════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║             MOVIMENTO CONCLUÍDO COM SUCESSO!              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [INFORMACOES] Pasta OLD_191025 criada com sucesso
echo [INFORMACOES] Estrutura de subpastas organizadas:
echo   - BACKUP_FILES: Arquivos .bak e -backup
echo   - TEMP_LOGS: Logs e arquivos temporários
echo   - DUPLICATES: Cópias e versões antigas
echo   - GENERATED_DOCS: Documentação gerada
echo   - OLD_MODULES: Módulos antigos
echo   - ARCHIVES: Arquivos compactados
echo   - DEPENDENCIES: Dependências antigas
echo   - IDE_BUILD: Pastas de IDE e build
echo.

echo [PROXIMO PASSO] Execute cleanup-final.bat para remover pastas vazias
echo.

pause

@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     SANITIZAÇÃO - Preview de Movimento (SIMULADO)            ║
REM ║          Veja o que SERIA movido SEM MOVER                   ║
REM ║                 Data: 19/10/2025                             ║
REM ╚══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
cd /d "h:\projetos\academia"

color 0B
title SANITIZACAO - PREVIEW (MODO SIMULADO)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     FASE 2: PREVIEW DE MOVIMENTO (SEM MOVER NADA)         ║
echo ║     Veja o que SERIA movido para OLD_191025               ║
echo ║     Data: %date% %time%                                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [AVISO] Este é um modo SIMULADO - nenhum arquivo será movido!
echo [AVISO] Use este para verificar antes de executar o movimento real
echo.

set TOTAL_COUNT=0

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 1: BACKUP_FILES
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: BACKUP_FILES
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /r "public\js\modules" %%F in (*-backup.js *-old.js *-ultra-simple.js *-simple-test.js) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\BACKUP_FILES\
        set /a COUNT+=1
    )
)

for /r "." %%F in (*.bak *.backup) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\BACKUP_FILES\
        set /a COUNT+=1
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo encontrado nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 2: TEMP_LOGS
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: TEMP_LOGS
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /r "." %%F in (*.log *.tmp *.temp) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\TEMP_LOGS\
        set /a COUNT+=1
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo encontrado nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 3: DUPLICATES
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: DUPLICATES
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /r "public\js\modules" %%F in (*copy*.js *-copy*.js *_copy*.js) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\DUPLICATES\
        set /a COUNT+=1
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo encontrado nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 4: GENERATED_DOCS
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: GENERATED_DOCS
echo ════════════════════════════════════════════════════════════
echo [AVISO] Documentos críticos NÃO serão movidos:
echo   - AGENTS.md (Mestre do projeto)
echo   - AGENTS.md.bak (Backup mestre)
echo   - AUDIT_REPORT.md (Auditoria oficial)
echo.
set COUNT=0

for /r "." %%F in (*COMPLETE*.md *REPORT*.md *SUMMARY*.md *FIX*.md *DEBUG*.md) do (
    if exist "%%F" (
        if not "%%~nxF"=="AGENTS.md" (
            if not "%%~nxF"=="AGENTS.md.bak" (
                if not "%%~nxF"=="AUDIT_REPORT.md" (
                    echo   [MOVER] %%~nxF
                    echo           Caminho: %%F
                    echo           Destino: OLD_191025\GENERATED_DOCS\
                    set /a COUNT+=1
                )
            )
        )
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo para mover nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 5: OLD_MODULES
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: OLD_MODULES
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /r "public\js\modules" %%F in (*-old.js *-backup.js *-refactored.js *-enhanced.js *-simple.js) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\OLD_MODULES\
        set /a COUNT+=1
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo encontrado nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 6: ARCHIVES
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: ARCHIVES
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /r "." %%F in (*.zip *.rar *.tar *.gz) do (
    if exist "%%F" (
        echo   [MOVER] %%~nxF
        echo           Caminho: %%F
        echo           Destino: OLD_191025\ARCHIVES\
        set /a COUNT+=1
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhum arquivo encontrado nesta categoria
) else (
    echo.
    echo   Total nesta categoria: !COUNT! arquivos
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM CATEGORIA 7: PASTAS ANTIGAS
REM ═══════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════
echo [PREVIEW] CATEGORIA: PASTAS ANTIGAS
echo ════════════════════════════════════════════════════════════
set COUNT=0

for /d %%D in (*-old *_old *-backup *_backup *-deprecated backup backups) do (
    if exist "%%D" (
        if not "%%D"=="OLD_191025" (
            echo   [MOVER] %%D\ (PASTA)
            echo           Caminho: %%D
            echo           Destino: OLD_191025\IDE_BUILD\
            set /a COUNT+=1
        )
    )
)

if !COUNT! equ 0 (
    echo   [INFO] Nenhuma pasta antiga encontrada
) else (
    echo.
    echo   Total nesta categoria: !COUNT! pastas
    set /a TOTAL_COUNT+=!COUNT!
)
echo.

REM ═══════════════════════════════════════════════════════════════
REM SUMÁRIO FINAL
REM ═══════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               RESUMO DO PREVIEW (SIMULADO)                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [RESUMO] Total de itens a mover: !TOTAL_COUNT!
echo.

echo [ESTRUTURA] Será criada a seguinte estrutura:
echo.
echo   OLD_191025\
echo   ├── BACKUP_FILES\       (Arquivos .bak, -backup.js, etc)
echo   ├── TEMP_LOGS\          (*.log, *.tmp, *.temp)
echo   ├── DUPLICATES\         (Arquivos duplicados)
echo   ├── GENERATED_DOCS\     (Documentos gerados)
echo   ├── OLD_MODULES\        (Módulos JS antigos)
echo   ├── ARCHIVES\           (*.zip, *.rar, etc)
echo   ├── DEPENDENCIES\       (Dependências antigas)
echo   └── IDE_BUILD\          (IDE e build artefatos)
echo.

echo [PROXIMO PASSO]
echo   1. Revise a lista acima
echo   2. Se tudo estiver correto, execute: move-files-execute.bat
echo   3. Se quiser fazer backup primeiro: backup-before-move.bat
echo.

pause

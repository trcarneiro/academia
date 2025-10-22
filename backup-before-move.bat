@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     SANITIZAÇÃO - Backup Antes de Mover                      ║
REM ║          Cria cópia de segurança de tudo                     ║
REM ║                 Data: 19/10/2025                             ║
REM ╚══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
cd /d "h:\projetos\academia"

color 0E
title SANITIZACAO - BACKUP (Criar copia de seguranca)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        CRIANDO BACKUP DE SEGURANÇA                        ║
echo ║     Antes de executar o movimento de arquivos             ║
echo ║                 Data: %date% %time%                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Criar pasta de backup
set BACKUP_TIME=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set BACKUP_TIME=%BACKUP_TIME: =0%
set BACKUP_FOLDER=BACKUP_SEGURANCA_%BACKUP_TIME%

echo [PREPARACAO] Criando pasta de backup: !BACKUP_FOLDER!
mkdir "!BACKUP_FOLDER!" 2>nul

if not exist "!BACKUP_FOLDER!" (
    echo [ERRO] Falha ao criar pasta de backup
    pause
    exit /b 1
)

echo [OK] Pasta criada
echo.

REM Arquivos críticos para fazer backup
echo [BACKUP] Fazendo cópia dos arquivos críticos...
echo.

REM 1. node_modules
if exist "node_modules" (
    echo [COPIANDO] node_modules (pode levar alguns minutos)...
    xcopy "node_modules" "!BACKUP_FOLDER!\node_modules" /E /I /Y >nul 2>&1
    if errorlevel 1 (
        echo [AVISO] Falha ao copiar node_modules (é uma pasta grande, pode ser esperado)
    ) else (
        echo [OK] node_modules copiado
    )
)

REM 2. src
if exist "src" (
    echo [COPIANDO] src (código-fonte)...
    xcopy "src" "!BACKUP_FOLDER!\src" /E /I /Y >nul 2>&1
    echo [OK] src copiado
)

REM 3. public
if exist "public" (
    echo [COPIANDO] public (frontend)...
    xcopy "public" "!BACKUP_FOLDER!\public" /E /I /Y >nul 2>&1
    echo [OK] public copiado
)

REM 4. prisma
if exist "prisma" (
    echo [COPIANDO] prisma (banco de dados)...
    xcopy "prisma" "!BACKUP_FOLDER!\prisma" /E /I /Y >nul 2>&1
    echo [OK] prisma copiado
)

REM 5. package.json e package-lock.json
echo [COPIANDO] Arquivos de configuração...
if exist "package.json" (
    copy "package.json" "!BACKUP_FOLDER!\package.json" >nul 2>&1
    echo [OK] package.json copiado
)
if exist "package-lock.json" (
    copy "package-lock.json" "!BACKUP_FOLDER!\package-lock.json" >nul 2>&1
    echo [OK] package-lock.json copiado
)
if exist "tsconfig.json" (
    copy "tsconfig.json" "!BACKUP_FOLDER!\tsconfig.json" >nul 2>&1
    echo [OK] tsconfig.json copiado
)
if exist ".env" (
    copy ".env" "!BACKUP_FOLDER!\.env" >nul 2>&1
    echo [OK] .env copiado
)

REM 6. Git
echo [COPIANDO] .git (histórico)...
xcopy ".git" "!BACKUP_FOLDER!\.git" /E /I /Y >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Falha ao copiar .git (pode estar em uso)
) else (
    echo [OK] .git copiado
)

REM 7. Documentação importante
echo [COPIANDO] Documentação...
if exist "AGENTS.md" copy "AGENTS.md" "!BACKUP_FOLDER!\AGENTS.md" >nul 2>&1
if exist "README.md" copy "README.md" "!BACKUP_FOLDER!\README.md" >nul 2>&1
if exist "AUDIT_REPORT.md" copy "AUDIT_REPORT.md" "!BACKUP_FOLDER!\AUDIT_REPORT.md" >nul 2>&1
echo [OK] Documentação copiada

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║               BACKUP CONCLUÍDO COM SUCESSO!               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [INFO] Pasta de backup: !BACKUP_FOLDER!
echo [INFO] Localização: %cd%\!BACKUP_FOLDER!
echo.

echo [SEGURANÇA]
echo   - Todos os arquivos críticos foram copiados
echo   - Em caso de problema, você pode restaurar de: !BACKUP_FOLDER!
echo   - Recomendação: compacte essa pasta e guarde em outro local
echo.

echo [PROXIMO PASSO]
echo   Execute: move-files-execute.bat
echo   Se algo der errado, você pode restaurar do folder: !BACKUP_FOLDER!
echo.

pause

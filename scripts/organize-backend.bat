@echo off
setlocal enabledelayedexpansion

echo.
echo === Academia - Organizador de Backend (Legacy -> old\backend_legacy) ===
echo.
if /I "%~1"=="/?" goto :usage
if /I "%~1"=="-?" goto :usage

rem Descobrir raiz do projeto (pasta acima de /scripts)
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%\.." >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Nao foi possivel acessar a raiz a partir de: %SCRIPT_DIR%
  echo        Execute este script dentro de h:\projetos\academia\scripts
  exit /b 1
)
set "ROOT=%CD%"
popd >nul
echo Raiz do projeto: %ROOT%

rem Definir pasta destino com sufixo se ja existir
set "OLD_BASE=%ROOT%\old\backend_legacy"
set "OLD_DIR=%OLD_BASE%"
if exist "%OLD_DIR%" (
  set /a N=1
  :FindSuffix
  set "TRY=%OLD_BASE%_!N!"
  if exist "!TRY!" (set /a N+=1 & goto FindSuffix)
  set "OLD_DIR=!TRY!"
)
echo Pasta de legado destino: %OLD_DIR%
echo.

rem Config log e opcoes
set "LOG=%OLD_DIR%\move.log"
set "MOVED=0"
set "SKIPPED=0"
set "ERRORS=0"
set "DRYRUN=0"
if /I "%~1"=="/D" set "DRYRUN=1"
set "MOVE_CMD=move /Y"
if "%DRYRUN%"=="1" (
  echo [INFO] Modo DRY-RUN ativo. Nada sera movido, apenas simulado.
  set "MOVE_CMD=echo [DRYRUN] move"
)

rem Criar estrutura destino
mkdir "%OLD_DIR%" 2>nul
mkdir "%OLD_DIR%\routes" 2>nul
mkdir "%OLD_DIR%\controllers" 2>nul
mkdir "%OLD_DIR%\servers" 2>nul
mkdir "%OLD_DIR%\misc" 2>nul
mkdir "%OLD_DIR%\logs" 2>nul

rem Cabecalho do log
(
  echo. 
  echo ==== %DATE% %TIME% - Inicio da execucao ====
) >>"%LOG%"

rem ----------------------------
rem Sub-rotina: mover se existir (corrigida)
rem ----------------------------
:moveIfExists

rem %1=SRC  %2=DEST_DIR  %3=descricao
set "SRC=%~1"
set "DEST=%~2"
set "DESC=%~3"
set "LOG=%OLD_DIR%\move.log"

rem Evitar mover algo que ja esta na pasta de legado
set "_CHECK=!SRC:%OLD_DIR%=!"
if /I not "!_CHECK!"=="!SRC!" (
  echo [SKIP] !DESC! ja esta em %OLD_DIR%.
  echo [SKIP] !DESC! ja esta em %OLD_DIR%.>>"%LOG%"
  set /a SKIPPED+=1
  goto :eof
)

if exist "%SRC%\*" (
  rem É pasta
  mkdir "%DEST%" 2>nul
  echo [MOVE] %DESC%>>"%LOG%"
  rem FIX: garantir que o echo DEBUG tambem redirecione para o log
  echo [DEBUG] %MOVE_CMD% "%SRC%" "%DEST%\" >>"%LOG%"
  %MOVE_CMD% "%SRC%" "%DEST%\" >>"%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERRO] Falha ao mover %DESC%
    echo [ERRO] Falha ao mover %DESC%>>"%LOG%"
    set /a ERRORS+=1
  ) else (
    echo [OK ] %DESC%
    echo [OK ] %DESC%>>"%LOG%"
    if not "%DRYRUN%"=="1" set /a MOVED+=1
  )
  goto :eof
)
if exist "%SRC%" (
  rem É arquivo (ou wildcard)
  mkdir "%DEST%" 2>nul
  echo [MOVE] %DESC%>>"%LOG%"
  rem Padronizar espaco antes do redirecionamento de log
  echo [DEBUG] %MOVE_CMD% "%SRC%" "%DEST%" >>"%LOG%"
  %MOVE_CMD% "%SRC%" "%DEST%" >>"%LOG%" 2>&1
  if errorlevel 1 (
    echo [ERRO] Falha ao mover %DESC%
    echo [ERRO] Falha ao mover %DESC%>>"%LOG%"
    set /a ERRORS+=1
  ) else (
    echo [OK ] %DESC%
    echo [OK ] %DESC%>>"%LOG%"
    if not "%DRYRUN%"=="1" set /a MOVED+=1
  )
) else (
  echo [SKIP] %DESC% nao encontrado.
  echo [SKIP] %DESC% nao encontrado.>>"%LOG%"
  set /a SKIPPED+=1
)
goto :eof

rem ----------------------------
rem 1) Servidores Express/legado
rem ----------------------------
call :moveIfExists "%ROOT%\servers"                       "%OLD_DIR%\servers"          "servers"
call :moveIfExists "%ROOT%\src\server-express.ts"         "%OLD_DIR%\servers"  "src\server-express.ts"
call :moveIfExists "%ROOT%\src\express-app.ts"            "%OLD_DIR%\servers"  "src\express-app.ts"

rem Variações comuns
call :moveIfExists "%ROOT%\src\server-legacy.ts"          "%OLD_DIR%\servers"  "src\server-legacy.ts"
call :moveIfExists "%ROOT%\src\legacy-server.ts"          "%OLD_DIR%\servers"  "src\legacy-server.ts"
rem Outros servidores JS na raiz
call :moveIfExists "%ROOT%\server-complete.js"             "%OLD_DIR%\servers"  "server-complete.js"
call :moveIfExists "%ROOT%\simple-dashboard-server.js"     "%OLD_DIR%\servers"  "simple-dashboard-server.js"
call :moveIfExists "%ROOT%\mock-server.js"                 "%OLD_DIR%\servers"  "mock-server.js"
call :moveIfExists "%ROOT%\test-server.js"                 "%OLD_DIR%\servers"  "test-server.js"

rem ----------------------------
rem 2) Rotas legadas (billing_plans e afins)
rem ----------------------------
call :moveIfExists "%ROOT%\src\routes\billing_plans.ts"   "%OLD_DIR%\routes"   "src\routes\billing_plans.ts"
call :moveIfExists "%ROOT%\src\routes\billingPlans.ts"    "%OLD_DIR%\routes"   "src\routes\billingPlans.ts"
call :moveIfExists "%ROOT%\src\routes\legacy"             "%OLD_DIR%\routes"   "src\routes\legacy"
call :moveIfExists "%ROOT%\src\routes\billing"            "%OLD_DIR%\routes"   "src\routes\billing"

rem ----------------------------
rem 3) Controllers/misc legados
rem ----------------------------
call :moveIfExists "%ROOT%\src\controllers\billingPlansController.ts" "%OLD_DIR%\controllers" "src\controllers\billingPlansController.ts"
call :moveIfExists "%ROOT%\src\controllers\billing_plans.controller.ts" "%OLD_DIR%\controllers" "src\controllers\billing_plans.controller.ts"
call :moveIfExists "%ROOT%\src\controllers\legacy" "%OLD_DIR%\controllers" "src\controllers\legacy"
call :moveIfExists "%ROOT%\src\middlewares\express" "%OLD_DIR%\misc" "src\middlewares\express"
call :moveIfExists "%ROOT%\src\utils\express" "%OLD_DIR%\misc" "src\utils\express"
call :moveIfExists "%ROOT%\src\prisma-client.ts" "%OLD_DIR%\misc" "src\prisma-client.ts"
call :moveIfExists "%ROOT%\src\db\prisma.ts" "%OLD_DIR%\misc" "src\db\prisma.ts"
call :moveIfExists "%ROOT%\src\routes\students.ts.backup" "%OLD_DIR%\misc" "src\routes\students.ts.backup"
call :moveIfExists "%ROOT%\backups" "%OLD_DIR%\misc" "backups"

rem ----------------------------
rem 4) Logs da raiz -> old/logs
rem ----------------------------
call :moveIfExists "%ROOT%\*.log" "%OLD_DIR%\logs" "root *.log"


echo.
echo === Concluido. Itens legados, se existentes, foram movidos para:
echo     %OLD_DIR%
echo.
echo Proximos passos:
echo  - Garanta que o servidor ativo seja: %ROOT%\src\server.ts (Fastify)
echo  - Reinicie: npm run dev
echo  - Testes rapidos:
echo      GET  http://localhost:3000/health
echo      GET  http://localhost:3000/api/plans/<PLAN_ID>/courses
echo.
echo [Dica] Para restaurar algo, recupere de:
echo        %OLD_DIR%
echo.

echo === Resumo ===
echo  Movidos: %MOVED%   Skips: %SKIPPED%   Erros: %ERRORS%
echo  Log: %LOG%

(
  echo ==== %DATE% %TIME% - Fim da execucao ====
  echo Movidos: %MOVED%   Skips: %SKIPPED%   Erros: %ERRORS%
) >>"%LOG%"

endlocal

:usage
echo Uso: %~nx0 [/D]
echo    /D   Executa em modo simulacao (DRY-RUN), apenas loga os movimentos.
exit /b 0
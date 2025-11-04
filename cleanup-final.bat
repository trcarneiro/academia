@echo off
REM ╔══════════════════════════════════════════════════════════════╗
REM ║     SANITIZAÇÃO - Limpeza Final                              ║
REM ║          Remove pastas vazias e organiza                     ║
REM ║                 Data: 19/10/2025                             ║
REM ╚══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion
cd /d "h:\projetos\academia"

color 0C
title SANITIZACAO - LIMPEZA FINAL

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     FASE 4: LIMPEZA FINAL                                  ║
echo ║     Remove pastas vazias e organiza                        ║
echo ║                 Data: %date% %time%                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set REMOVED=0

REM Remover pastas vazias recursivamente
echo [LIMPEZA] Removendo pastas vazias...
echo.

REM Função para remover pastas vazias
:RemoveEmptyFolders
for /d /r "." %%D in (*) do (
    dir /b /ad "%%D" 2>nul | find . >nul
    if errorlevel 1 (
        if not "%%D"=="." (
            if not "%%D"==".git" (
                if not "%%D"=="node_modules" (
                    if not "%%D"=="OLD_191025" (
                        echo   [REMOVENDO] %%D
                        rmdir /s /q "%%D" 2>nul
                        set /a REMOVED+=1
                    )
                )
            )
        )
    )
)

echo.
echo [RESULTADO] !REMOVED! pastas vazias removidas
echo.

REM Gerar relatório de organização
echo [ORGANIZACAO] Gerando relatório de organização...

set REPORT_FILE=SANITIZATION_ORGANIZATION_%date:~-4%%date:~-10,2%%date:~-7,2%.txt

(
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║     RELATÓRIO DE ORGANIZAÇÃO - SANITIZAÇÃO FASE 4        ║
    echo ║                 Data: %date% %time%                        ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo ESTRUTURA FINAL DO PROJETO:
    echo.
    echo academia/
    echo ├── src/                        [PRODUÇÃO - Backend TypeScript]
    echo ├── public/                     [PRODUÇÃO - Frontend + Arquivos Estáticos]
    echo ├── prisma/                     [PRODUÇÃO - Schema Database]
    echo ├── scripts/                    [PRODUÇÃO - Scripts de Utilitários]
    echo ├── tests/                      [PRODUÇÃO - Testes Unitários]
    echo ├── dev/                        [PRODUÇÃO - Documentação Desenvolvimento]
    echo │
    echo ├── OLD_191025/                 [ARQUIVOS MOVIDOS - LIMPEZA]
    echo │   ├── BACKUP_FILES/           (Arquivos .bak e -backup)
    echo │   ├── TEMP_LOGS/              (Logs e arquivos temporários)
    echo │   ├── DUPLICATES/             (Duplicatas e cópias)
    echo │   ├── GENERATED_DOCS/         (Documentação gerada temporária)
    echo │   ├── OLD_MODULES/            (Módulos JS antigos)
    echo │   ├── ARCHIVES/               (Compactados)
    echo │   ├── DEPENDENCIES/           (Dependências antigas)
    echo │   └── IDE_BUILD/              (Artefatos IDE e build)
    echo │
    echo ├── BACKUP_SEGURANCA_*/         [BACKUP - Cópias de Segurança]
    echo │
    echo ├── .git/                       [PRODUÇÃO - Histórico GIT]
    echo ├── .github/                    [PRODUÇÃO - Workflows CI/CD]
    echo ├── .gitignore                  [PRODUÇÃO - Config GIT]
    echo ├── package.json                [PRODUÇÃO - Dependências]
    echo ├── package-lock.json           [PRODUÇÃO - Lock Dependências]
    echo ├── tsconfig.json               [PRODUÇÃO - Config TypeScript]
    echo ├── AGENTS.md                   [PRODUÇÃO - Guia Master]
    echo ├── README.md                   [PRODUÇÃO - Documentação]
    echo └── .env                        [PRODUÇÃO - Variáveis Ambiente]
    echo.
    echo ════════════════════════════════════════════════════════════
    echo TAMANHO DOS DIRETÓRIOS PRINCIPAIS:
    echo ════════════════════════════════════════════════════════════
    echo.
) > !REPORT_FILE!

REM Calcular tamanhos
for /d %%D in (src public prisma scripts tests dev OLD_191025) do (
    if exist "%%D" (
        echo [%%D] >> !REPORT_FILE!
        dir /s "%%D" 2>nul | find "bytes" | tail -1 >> !REPORT_FILE!
    )
)

echo.
echo ════════════════════════════════════════════════════════════
echo PRÓXIMOS PASSOS RECOMENDADOS:
echo ════════════════════════════════════════════════════════════
echo.
echo 1. VERIFICAÇÃO (obrigatório):
echo    - Testar se aplicação ainda funciona: npm run dev
echo    - Rodar testes: npm run test
echo    - Compilar TypeScript: npm run build
echo.
echo 2. BACKUP (recomendado):
echo    - Copiar pasta BACKUP_SEGURANCA_* para outro HD/Cloud
echo    - Arquivar com ZIP e guardar
echo    - Remover depois de confirmar que tudo funciona
echo.
echo 3. VERSIONAMENTO (importante):
echo    - git status
echo    - git add -A
echo    - git commit -m "Sanitizacao fase 1: movimento de arquivos para OLD_191025"
echo.
echo 4. LIMPEZA (optional):
echo    - Remover BACKUP_SEGURANCA_* se quiser liberar espaço
echo    - Comprimir OLD_191025 com ZIP se quiser arquivar
echo.
echo ════════════════════════════════════════════════════════════
echo INFORMAÇÕES SOBRE OLD_191025:
echo ════════════════════════════════════════════════════════════
echo.
echo Essa pasta contém:
echo   - Versões antigas de módulos
echo   - Arquivos de backup e temporários
echo   - Documentação gerada automaticamente
echo   - Arquivos duplicados
echo.
echo Você pode:
echo   - MANTER: Para futuras referências (ocupa espaço)
echo   - ARQUIVAR: Copiar para ZIP e deletar (economiza espaço)
echo   - DELETAR: Remover completamente (libera espaço imediatamente)
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo Relatório salvo em: !REPORT_FILE!
echo.

echo [OK] Limpeza finalizada com sucesso
echo.

pause

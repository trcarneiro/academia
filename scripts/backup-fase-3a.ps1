# Script de Backup de Seguranca - Academia Krav Maga
# Versao: 1.0
# Data: 19/10/2025
# Objetivo: Fazer backup completo antes de sanitizacao

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "`n" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  FASE 3A - BACKUP DE SEGURANCA                     " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "`n" -ForegroundColor Green

# 1. Criar pasta com timestamp
Write-Host "[1/5] Criando pasta de backup com timestamp..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupFolder = Join-Path $rootPath "BACKUP_SEGURANCA_$timestamp"

if (Test-Path $backupFolder) {
    Write-Host "  [AVISO] Pasta ja existe: $backupFolder" -ForegroundColor Yellow
}

New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
Write-Host "  [OK] Pasta criada: $backupFolder`n" -ForegroundColor Green

# 2. Definir arquivos/pastas criticas para backup
$itemsToBackup = @(
    "src",
    "public",
    "prisma",
    "scripts",
    "tests",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".env",
    ".env.example",
    "README.md",
    "AGENTS.md",
    "AUDIT_REPORT.md",
    ".gitignore",
    ".git"
)

Write-Host "[2/5] Copiando arquivos criticos..." -ForegroundColor Cyan

$totalSize = 0
$itemsCopied = 0
$itemsFailed = 0

foreach ($item in $itemsToBackup) {
    $sourcePath = Join-Path $rootPath $item
    $destinationPath = Join-Path $backupFolder $item
    
    if (Test-Path $sourcePath) {
        try {
            if ((Get-Item $sourcePath) -is [System.IO.DirectoryInfo]) {
                # E uma pasta - copiar com robocopy
                Write-Host "  [DIR] Copiando: $item" -ForegroundColor Yellow
                
                $robocopyResult = robocopy $sourcePath $destinationPath /E /R:3 /W:1 /NJH /NJS 2>&1
                $itemsCopied++
                
                # Calcular tamanho
                $size = (Get-ChildItem $sourcePath -Recurse | Measure-Object -Property Length -Sum).Sum
                $totalSize += $size
                $sizeMB = [math]::Round($size / 1MB, 2)
                Write-Host "    Tamanho: $sizeMB MB" -ForegroundColor Green
            } else {
                # E um arquivo - copiar direto
                Write-Host "  [FILE] Copiando: $item" -ForegroundColor Yellow
                Copy-Item -Path $sourcePath -Destination $destinationPath -Force | Out-Null
                $itemsCopied++
                
                $size = (Get-Item $sourcePath).Length
                $totalSize += $size
                $sizeMB = [math]::Round($size / 1MB, 2)
                Write-Host "    Tamanho: $sizeMB MB" -ForegroundColor Green
            }
        } catch {
            Write-Host "  [ERRO] Falha ao copiar $item : $_" -ForegroundColor Red
            $itemsFailed++
        }
    } else {
        Write-Host "  [SKIP] Nao encontrado: $item" -ForegroundColor Yellow
    }
}

Write-Host "`n"

# 3. Copiar node_modules (com cuidado)
Write-Host "[3/5] Copiando node_modules (pode levar alguns minutos)..." -ForegroundColor Cyan

$nodeModulesSource = Join-Path $rootPath "node_modules"
if (Test-Path $nodeModulesSource) {
    try {
        Write-Host "  [DIR] Copiando: node_modules" -ForegroundColor Yellow
        $robocopyResult = robocopy $nodeModulesSource (Join-Path $backupFolder "node_modules") /E /R:1 /W:1 /NJH /NJS 2>&1
        
        $size = (Get-ChildItem $nodeModulesSource -Recurse | Measure-Object -Property Length -Sum).Sum
        $totalSize += $size
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host "    Tamanho: $sizeMB MB" -ForegroundColor Green
        $itemsCopied++
    } catch {
        Write-Host "  [AVISO] Problema ao copiar node_modules (pode ser pulado)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] node_modules nao encontrado" -ForegroundColor Yellow
}

Write-Host "`n"

# 4. Verificar integridade
Write-Host "[4/5] Verificando integridade do backup..." -ForegroundColor Cyan

$backupFileCount = (Get-ChildItem $backupFolder -Recurse -File).Count
Write-Host "  [OK] Total de arquivos no backup: $backupFileCount" -ForegroundColor Green

$backupTotalSize = [math]::Round($totalSize / 1GB, 2)
Write-Host "  [OK] Tamanho total: $backupTotalSize GB" -ForegroundColor Green

Write-Host "`n"

# 5. Gerar relatorio
Write-Host "[5/5] Gerando relatorio de backup..." -ForegroundColor Cyan

$reportPath = Join-Path $backupFolder "BACKUP_RELATORIO.txt"
$reportContent = @"
RELATORIO DE BACKUP DE SEGURANCA
Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
Pasta Original: $rootPath
Pasta de Backup: $backupFolder

=== RESUMO ===
Total de itens copiados: $itemsCopied
Total de itens que falharam: $itemsFailed
Tamanho total do backup: $backupTotalSize GB
Arquivos no backup: $backupFileCount

=== ESTRUTURA DO BACKUP ===
$backupFolder\
  ├── src/
  ├── public/
  ├── prisma/
  ├── scripts/
  ├── tests/
  ├── node_modules/
  ├── package.json
  ├── package-lock.json
  ├── tsconfig.json
  ├── .env
  ├── .git/
  ├── AGENTS.md
  └── AUDIT_REPORT.md

=== COMO RESTAURAR ===
Se algo der errado durante a sanitizacao:

1. Abra o Power Shell como administrador
2. Execute:
   xcopy "$backupFolder\src" "$rootPath\src" /E /I /Y
   xcopy "$backupFolder\public" "$rootPath\public" /E /I /Y
   xcopy "$backupFolder\prisma" "$rootPath\prisma" /E /I /Y
   
3. Ou, restaurar tudo de uma vez:
   robocopy "$backupFolder" "$rootPath" /E /R:3 /W:1

=== ARQUIVOS IMPORTANTES ===
- Todos os arquivos de configuracao (.env, tsconfig.json, package.json)
- Codigo-fonte completo (src/, public/)
- Historico Git (.git/)
- Dependencias (node_modules/)
- Banco de dados (prisma/)

=== PROXIMO PASSO ===
Se tudo estiver bem, execute: move-files-execute.bat

SE ALGUMA COISA DER ERRADO:
1. Feche a aplicacao
2. Restaure de: $backupFolder
3. Execute npm install para sincronizar
4. Reinicie o servidor

Backup criado com sucesso em: $(Get-Date)
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "`n"
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  BACKUP CONCLUIDO COM SUCESSO!                     " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "`n"

Write-Host "Informacoes:" -ForegroundColor Cyan
Write-Host "  Pasta de Backup: $backupFolder" -ForegroundColor Yellow
Write-Host "  Tamanho Total: $backupTotalSize GB" -ForegroundColor Yellow
Write-Host "  Arquivos: $backupFileCount" -ForegroundColor Yellow
Write-Host "`n"

Write-Host "Relatorio:" -ForegroundColor Cyan
Write-Host "  $reportPath`n" -ForegroundColor Yellow

Write-Host "AVISO IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Esta pasta de backup pode ser compactada com ZIP" -ForegroundColor White
Write-Host "  para economizar espaco ou copiar para outro local." -ForegroundColor White
Write-Host "`n"

Write-Host "Proximo passo: Execute move-files-execute.bat para mover arquivos" -ForegroundColor Cyan
Write-Host "             ou guarde este backup em local seguro antes de continuar`n" -ForegroundColor Cyan

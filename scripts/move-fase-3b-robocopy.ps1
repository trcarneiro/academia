# Script de Movimento com RoboCopy - Fase 3B v3
# Versao: 3.0 - Usando robocopy nativo
# Data: 19/10/2025

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "`n"
Write-Host "=====================================================`n" -ForegroundColor Cyan
Write-Host "  FASE 3B - MOVIMENTO COM ROBOCOPY" -ForegroundColor Cyan
Write-Host "  Movendo diretorios e arquivos para OLD_191025" -ForegroundColor Cyan
Write-Host "`n=====================================================`n" -ForegroundColor Cyan

# Confirmacao
Write-Host "Tem certeza que deseja continuar? (Digite 'SIM' para confirmar): " -ForegroundColor Yellow -NoNewline
$confirmacao = Read-Host

if ($confirmacao -ne "SIM") {
    Write-Host "`n[CANCELADO] Movimento foi cancelado pelo usuario`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n"

# Criar estrutura
Write-Host "[1/3] Criando estrutura OLD_191025..." -ForegroundColor Cyan
$oldFolder = Join-Path $rootPath "OLD_191025"

foreach ($folder in "DEPENDENCIES", "GENERATED_DOCS", "BACKUP_FILES", "DUPLICATES") {
    New-Item -ItemType Directory -Path (Join-Path $oldFolder $folder) -Force | Out-Null
}

Write-Host "  [OK] Estrutura criada`n" -ForegroundColor Green

# Lista de diretorios a mover (principal volume)
$dirsToMove = @(
    @{ Source = "node_modules"; Dest = "DEPENDENCIES" },
    @{ Source = "dist"; Dest = "DEPENDENCIES" },
    @{ Source = "build"; Dest = "DEPENDENCIES" },
    @{ Source = ".next"; Dest = "DEPENDENCIES" },
    @{ Source = ".vscode"; Dest = "BACKUP_FILES" }
)

# Mover diretorios
Write-Host "[2/3] Movendo diretorios inteiros com robocopy..." -ForegroundColor Cyan

$totalMoved = 0
foreach ($dirInfo in $dirsToMove) {
    $sourcePath = Join-Path $rootPath $dirInfo.Source
    
    if (Test-Path $sourcePath -PathType Container) {
        $destSubFolder = Join-Path $oldFolder $dirInfo.Dest
        $destPath = Join-Path $destSubFolder $dirInfo.Source
        Write-Host "  [DIR] Movendo: $($dirInfo.Source)" -ForegroundColor Yellow
        
        # Usar robocopy para mover (mais confiavel que Move-Item)
        & robocopy "$sourcePath" "$destPath" /E /MOVE /R:1 /W:1 /NP /NJS /NJH | Out-Null
        
        if ($LASTEXITCODE -le 7) {  # 0-7 sao codigos de sucesso
            Write-Host "    [OK] Movido com sucesso" -ForegroundColor Green
            $totalMoved++
        } else {
            Write-Host "    [AVISO] Codigo de retorno: $LASTEXITCODE" -ForegroundColor Yellow
        }
    }
}

Write-Host "  Total: $totalMoved diretorios movidos`n" -ForegroundColor Green

# Mover arquivos soltos
Write-Host "[3/3] Movendo arquivos soltos..." -ForegroundColor Cyan

$filesToMove = @(
    @{ Pattern = "*-backup.js"; Dest = "BACKUP_FILES" },
    @{ Pattern = "*.bak"; Dest = "BACKUP_FILES" },
    @{ Pattern = "FIX_*.md"; Dest = "GENERATED_DOCS" },
    @{ Pattern = "*_COMPLETE.md"; Dest = "GENERATED_DOCS" },
    @{ Pattern = "*copy*.js"; Dest = "DUPLICATES" }
)

$archivesMoved = 0
foreach ($fileInfo in $filesToMove) {
    $files = Get-ChildItem -Path $rootPath -File -Filter $fileInfo.Pattern -Recurse -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notlike "*OLD_191025*" -and $_.FullName -notlike "*BACKUP_*" }
    
    if ($files.Count -gt 0) {
        Write-Host "  [FILES] Movendo $($files.Count) arquivo(s) com padrao: $($fileInfo.Pattern)" -ForegroundColor Yellow
        
        foreach ($file in $files) {
            $dest = Join-Path $oldFolder $fileInfo.Dest $file.Name
            Move-Item -Path $file.FullName -Destination $dest -Force -ErrorAction SilentlyContinue
            $archivesMoved++
        }
        
        Write-Host "    [OK] $($files.Count) arquivos movidos" -ForegroundColor Green
    }
}

Write-Host "  Total: $archivesMoved arquivos movidos`n" -ForegroundColor Green

# Relatorio final
Write-Host "`n"
Write-Host "=====================================================`n" -ForegroundColor Green
Write-Host "  FASE 3B - MOVIMENTO CONCLUIDO!" -ForegroundColor Green
Write-Host "`n=====================================================`n" -ForegroundColor Green

# Contar resultado
$oldFolderCount = (Get-ChildItem -Path $oldFolder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
$oldFolderSize = (Get-ChildItem -Path $oldFolder -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$sizeGB = [math]::Round($oldFolderSize / 1GB, 2)

Write-Host "Resultado Final:" -ForegroundColor Cyan
Write-Host "  Diretorios movidos: $totalMoved" -ForegroundColor Yellow
Write-Host "  Arquivos soltos movidos: $archivesMoved" -ForegroundColor Yellow
Write-Host "  Total de arquivos em OLD_191025: $oldFolderCount" -ForegroundColor Yellow
Write-Host "  Tamanho: $sizeGB GB`n" -ForegroundColor Yellow

Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Verificar se projeto ainda funciona: npm run dev" -ForegroundColor White
Write-Host "  2. Fazer commit: git add -A && git commit -m 'Sanitizacao fase 3b'" -ForegroundColor White
Write-Host "  3. Opcional: Compactar OLD_191025 com ZIP`n" -ForegroundColor White

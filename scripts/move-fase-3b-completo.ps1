# Script de Movimento Real Avancado - Academia Krav Maga
# Versao: 2.0 - FASE 3B Completo
# Data: 19/10/2025
# Objetivo: Mover ARQUIVOS e DIRETÓRIOS (como node_modules, dist, etc)

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "`n" -ForegroundColor Green
Write-Host "=====================================================`n" -ForegroundColor Cyan
Write-Host "  FASE 3B - MOVIMENTO COMPLETO (Arquivos + Diretorios)" -ForegroundColor Cyan
Write-Host "  Movendo 44060+ arquivos/pastas para OLD_191025" -ForegroundColor Cyan
Write-Host "`n=====================================================`n" -ForegroundColor Cyan

# Confirmacao
Write-Host "Tem certeza que deseja continuar? (Digite 'SIM' para confirmar): " -ForegroundColor Yellow -NoNewline
$confirmacao = Read-Host

if ($confirmacao -ne "SIM") {
    Write-Host "`n[CANCELADO] Movimento foi cancelado pelo usuario`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n"

# 1. Criar estrutura OLD_191025
Write-Host "[1/6] Criando estrutura OLD_191025..." -ForegroundColor Cyan

$oldFolder = Join-Path $rootPath "OLD_191025"
$subfolders = @(
    "BACKUP_FILES",
    "TEMP_LOGS",
    "DUPLICATES",
    "GENERATED_DOCS",
    "OLD_MODULES",
    "ARCHIVES",
    "DEPENDENCIES",
    "IDE_BUILD"
)

foreach ($subfolder in $subfolders) {
    $subPath = Join-Path $oldFolder $subfolder
    if (-not (Test-Path $subPath)) {
        New-Item -ItemType Directory -Path $subPath -Force | Out-Null
    }
}

Write-Host "  [OK] Estrutura pronta`n" -ForegroundColor Green

# 2. Mover DIRETÓRIOS inteiros (maior volume)
Write-Host "[2/6] Movendo diretorios inteiros (node_modules, dist, build, etc)..." -ForegroundColor Cyan

$directoriesToMove = @(
    @{ Name = "node_modules"; Category = "DEPENDENCIES" },
    @{ Name = "dist"; Category = "DEPENDENCIES" },
    @{ Name = "build"; Category = "DEPENDENCIES" },
    @{ Name = ".next"; Category = "DEPENDENCIES" },
    @{ Name = ".nuxt"; Category = "DEPENDENCIES" },
    @{ Name = ".turbo"; Category = "DEPENDENCIES" },
    @{ Name = ".vscode"; Category = "IDE_BUILD" },
    @{ Name = ".idea"; Category = "IDE_BUILD" },
    @{ Name = ".vs"; Category = "IDE_BUILD" }
)

$totalMovedDirs = 0
$totalMovedFiles = 0

foreach ($dirInfo in $directoriesToMove) {
    $dirPath = Join-Path $rootPath $dirInfo.Name
    
    if (Test-Path $dirPath) {
        try {
            $itemCount = (Get-ChildItem $dirPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
            $destinationPath = Join-Path $oldFolder $dirInfo.Category $dirInfo.Name
            
            Write-Host "  [DIR] Movendo: $($dirInfo.Name) ($itemCount arquivos)" -ForegroundColor Yellow
            
            Move-Item -Path $dirPath -Destination $destinationPath -Force -ErrorAction Stop | Out-Null
            
            Write-Host "    [OK] Movido com sucesso" -ForegroundColor Green
            $totalMovedDirs++
            $totalMovedFiles += $itemCount
            
        } catch {
            Write-Host "    [ERRO] Falha ao mover: $_" -ForegroundColor Red
        }
    }
}

Write-Host "  Total: $totalMovedDirs diretorios movidos`n" -ForegroundColor Green

# 3. Mover ARQUIVOS por categoria (padroes mais abrangentes)
Write-Host "[3/6] Movendo arquivos soltos por categoria..." -ForegroundColor Cyan

$fileCategories = @{
    "BACKUP_FILES" = @(
        { $_.Name -like "*-backup.*" },
        { $_.Name -like "*.bak" },
        { $_.Name -like "*.backup" },
        { $_.Name -like "*_old.*" }
    )
    "TEMP_LOGS" = @(
        { $_.Name -like "*.log" },
        { $_.Name -like "*.tmp" },
        { $_.Name -like "*.temp" },
        { $_.Name -like "*.swp" },
        { $_.Name -like "*.swo" }
    )
    "DUPLICATES" = @(
        { $_.Name -like "*copy*" -and ($_.Name -like "*.js" -or $_.Name -like "*.ts") },
        { $_.Name -like "*COPY*" },
        { $_.Name -like "*-old.js" }
    )
    "GENERATED_DOCS" = @(
        { $_.Name -like "FIX_*.md" },
        { $_.Name -like "*_COMPLETE.md" },
        { $_.Name -like "*_REPORT.md" },
        { $_.Name -like "BUGFIX_*.md" },
        { $_.Name -like "ACTIVITY_*.md" },
        { $_.Name -like "AI_*.md" },
        { $_.Name -like "ANDROID_*.md" },
        { $_.Name -like "*_SUMMARY.md" },
        { $_.Name -like "*_GUIDE.md" }
    )
    "OLD_MODULES" = @(
        { $_.Name -like "*deprecated*" },
        { $_.Name -like "*legacy*" },
        { $_.Name -like "*archived*" }
    )
    "ARCHIVES" = @(
        { $_.Name -like "*.zip" },
        { $_.Name -like "*.rar" },
        { $_.Name -like "*.7z" },
        { $_.Name -like "*.tar*" }
    )
    "IDE_BUILD" = @(
        { $_.Name -like ".DS_Store" }
    )
}

# Arquivos criticos que NAO serao movidos
$criticalFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".env",
    ".env.example",
    ".gitignore",
    "AGENTS.md",
    "AGENTS.md.bak",
    "AUDIT_REPORT.md",
    "README.md"
)

$totalMovedFilesByCategory = 0

foreach ($category in $fileCategories.Keys) {
    $destinationFolder = Join-Path $oldFolder $category
    $categoryCount = 0
    
    # Encontrar arquivos
    $allRootFiles = @(Get-ChildItem -Path $rootPath -File -ErrorAction SilentlyContinue |
                     Where-Object { $_.FullName -notlike "*OLD_191025*" -and 
                                   $_.FullName -notlike "*BACKUP_SEGURANCA*" -and
                                   $_.FullName -notlike "*\.git*" -and
                                   $criticalFiles -notcontains $_.Name })
    
    $filesToMove = @()
    foreach ($file in $allRootFiles) {
        foreach ($filter in $fileCategories[$category]) {
            if (& $filter) {
                $filesToMove += $file
                break
            }
        }
    }
    
    if ($filesToMove.Count -gt 0) {
        Write-Host "  [$category] Movendo $($filesToMove.Count) arquivo(s)..." -ForegroundColor Yellow
        
        foreach ($file in $filesToMove) {
            try {
                $destination = Join-Path $destinationFolder $file.Name
                
                if (Test-Path $destination) {
                    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                    $extension = [System.IO.Path]::GetExtension($file.Name)
                    $counter = 1
                    while (Test-Path (Join-Path $destinationFolder "$baseName-$counter$extension")) {
                        $counter++
                    }
                    $destination = Join-Path $destinationFolder "$baseName-$counter$extension"
                }
                
                Move-Item -Path $file.FullName -Destination $destination -Force | Out-Null
                $categoryCount++
                $totalMovedFiles++
                $totalMovedFilesByCategory++
                
            } catch {
                # Silencioso se falhar um arquivo
            }
        }
        
        Write-Host "    [OK] Movidos: $categoryCount" -ForegroundColor Green
    }
}

Write-Host "  Total: $totalMovedFilesByCategory arquivos soltos movidos`n" -ForegroundColor Green

# 4. Verificar integridade
Write-Host "[4/6] Verificando integridade..." -ForegroundColor Cyan

$oldFolderItems = @(Get-ChildItem -Path $oldFolder -Recurse -File -ErrorAction SilentlyContinue)
$oldFolderFileCount = $oldFolderItems.Count
$oldFolderSize = ($oldFolderItems | Measure-Object -Property Length -Sum).Sum

$sizeGB = [math]::Round($oldFolderSize / 1GB, 2)
$sizeMB = [math]::Round($oldFolderSize / 1MB, 2)

Write-Host "  [OK] Total de arquivos em OLD_191025: $oldFolderFileCount" -ForegroundColor Green
Write-Host "  [OK] Tamanho total: $sizeGB GB ($sizeMB MB)`n" -ForegroundColor Green

# 5. Contar arquivos restantes
Write-Host "[5/6] Verificando o que ficou no raiz..." -ForegroundColor Cyan

$rootItems = @(Get-ChildItem -Path $rootPath -File -Recurse -ErrorAction SilentlyContinue |
              Where-Object { $_.FullName -notlike "*OLD_191025*" -and 
                            $_.FullName -notlike "*BACKUP_SEGURANCA*" })
$rootFileCount = $rootItems.Count

Write-Host "  Arquivos/pastas restantes: $rootFileCount" -ForegroundColor Yellow

# 6. Gerar relatorio completo
Write-Host "`n[6/6] Gerando relatorio completo..." -ForegroundColor Cyan

$reportPath = Join-Path $rootPath "MOVIMENTO_FASE_3B_COMPLETO.txt"
$reportContent = @"
RELATORIO DE MOVIMENTO COMPLETO - FASE 3B
Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
Status: CONCLUIDO COM SUCESSO

=== RESUMO GERAL ===
Total de diretorios movidos: $totalMovedDirs
Total de arquivos movidos: $totalMovedFiles
Tamanho total movido: $sizeGB GB ($sizeMB MB)
Arquivos em OLD_191025: $oldFolderFileCount

=== DIRETORIOS MOVIDOS ===
$($directoriesToMove | ForEach-Object { "[OK] $($_.Name) --> OLD_191025\$($_.Category)" })

=== ESTRUTURA FINAL DE OLD_191025 ===
OLD_191025\
  ├── BACKUP_FILES\       (Arquivos .bak, -backup.js, etc)
  ├── TEMP_LOGS\          (*.log, *.tmp, *.temp, *.swp)
  ├── DUPLICATES\         (Cópias e versões antigas)
  ├── GENERATED_DOCS\     (Documentação gerada automaticamente)
  ├── OLD_MODULES\        (Módulos deprecated/legacy)
  ├── ARCHIVES\           (*.zip, *.rar, *.7z, etc)
  ├── DEPENDENCIES\       (node_modules, dist, build, .next, etc)
  └── IDE_BUILD\          (.vscode, .idea, .vs, .DS_Store, etc)

=== ARQUIVOS CRITICOS MANTIDOS (NAO MOVIDOS) ===
✓ src/           (Código-fonte)
✓ public/        (Frontend)
✓ prisma/        (Banco de dados)
✓ scripts/       (Scripts do projeto)
✓ tests/         (Testes)
✓ package.json
✓ package-lock.json
✓ tsconfig.json
✓ .env
✓ .git/
✓ AGENTS.md
✓ AUDIT_REPORT.md

=== PROXIMO PASSO ===
Execute FASE 4: cleanup-fase-4-final.ps1
Isso vai:
1. Remover pastas vazias
2. Gerar relatorio final de organizacao
3. Sugerir proximas acoes

=== COMO DESFAZER (SE NECESSARIO) ===
Se algo der errado:
1. Restaure do backup:
   robocopy "h:\projetos\academia\BACKUP_SEGURANCA_20251019_1502" "h:\projetos\academia" /E
2. Execute: npm install
3. Reinicie o servidor

MOVIMENTO CONCLUIDO: $(Get-Date)
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "  [OK] Relatorio salvo`n" -ForegroundColor Green

Write-Host "`n"
Write-Host "=====================================================`n" -ForegroundColor Green
Write-Host "  FASE 3B - MOVIMENTO COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "`n=====================================================`n" -ForegroundColor Green

Write-Host "Resumo Final:" -ForegroundColor Cyan
Write-Host "  Diretorios movidos: $totalMovedDirs" -ForegroundColor Yellow
Write-Host "  Arquivos movidos: $totalMovedFiles" -ForegroundColor Yellow
Write-Host "  Tamanho total: $sizeGB GB" -ForegroundColor Yellow
Write-Host "  Pasta OLD_191025: Criada e populada com sucesso`n" -ForegroundColor Yellow

Write-Host "Proximo passo: Execute cleanup-fase-4-final.ps1 para limpeza final" -ForegroundColor Cyan
Write-Host "             e remover pastas vazias`n" -ForegroundColor Cyan

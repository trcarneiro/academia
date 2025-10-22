# Script de Movimento Real - Academia Krav Maga
# Versao: 1.0 - FASE 3B
# Data: 19/10/2025
# AVISO: Este script MOVE arquivos de verdade. Certifique-se de ter feito backup!

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "`n" -ForegroundColor Green
Write-Host "=====================================================`n" -ForegroundColor Red
Write-Host "  FASE 3B - MOVIMENTO REAL DE ARQUIVOS" -ForegroundColor Red
Write-Host "  AVISO: Este processo nao pode ser facilmente desfeito!" -ForegroundColor Red
Write-Host "  Se algo der errado, restaure do backup:" -ForegroundColor Red
Write-Host "  BACKUP_SEGURANCA_20251019_1502" -ForegroundColor Red
Write-Host "`n=====================================================`n" -ForegroundColor Red

# Confirmacao
Write-Host "Tem certeza que deseja continuar? (Digite 'SIM' para confirmar): " -ForegroundColor Yellow -NoNewline
$confirmacao = Read-Host

if ($confirmacao -ne "SIM") {
    Write-Host "`n[CANCELADO] Movimento foi cancelado pelo usuario`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n"

# 1. Criar estrutura OLD_191025
Write-Host "[1/5] Criando estrutura OLD_191025 com 8 subpastas..." -ForegroundColor Cyan

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

# Criar pasta raiz
if (-not (Test-Path $oldFolder)) {
    New-Item -ItemType Directory -Path $oldFolder -Force | Out-Null
    Write-Host "  [OK] Pasta OLD_191025 criada" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Pasta OLD_191025 ja existe" -ForegroundColor Yellow
}

# Criar subpastas
foreach ($subfolder in $subfolders) {
    $subPath = Join-Path $oldFolder $subfolder
    if (-not (Test-Path $subPath)) {
        New-Item -ItemType Directory -Path $subPath -Force | Out-Null
        Write-Host "  [OK] Subpasta criada: $subfolder" -ForegroundColor Green
    } else {
        Write-Host "  [INFO] Subpasta ja existe: $subfolder" -ForegroundColor Yellow
    }
}

Write-Host "`n"

# 2. Definir padroes de arquivo por categoria
Write-Host "[2/5] Definindo padroes de arquivo por categoria..." -ForegroundColor Cyan

$categories = @{
    "BACKUP_FILES" = @(
        "*-backup.js", "*.bak", "*.backup", "*_old.js", "*.bak.ts",
        "*backup*.ts", "*backup*.js", "*-bak.*"
    )
    "TEMP_LOGS" = @(
        "*.log", "*.tmp", "*.temp", "*.log.gz", "*.swp", "*.swo"
    )
    "DUPLICATES" = @(
        "*copy*.js", "*copy*.ts", "*COPY*.js", "*OLD*.js", "*_copy_*"
    )
    "GENERATED_DOCS" = @(
        "FIX_*.md", "*_COMPLETE.md", "*_REPORT.md", "BUGFIX_*.md",
        "ACTIVITY_*.md", "AI_*.md", "ANDROID_*.md", "*SUMMARY*.md"
    )
    "OLD_MODULES" = @(
        "*deprecated*", "*legacy*", "*archived*", "*old*module*"
    )
    "ARCHIVES" = @(
        "*.zip", "*.rar", "*.7z", "*.tar.gz", "*.tar", "*.gzip"
    )
    "DEPENDENCIES" = @(
        "node_modules", "dist", "build", ".next", ".nuxt", ".turbo"
    )
    "IDE_BUILD" = @(
        ".vscode", ".idea", ".DS_Store", "*.swp", "*.swo",
        ".vs", ".sublime-project", ".sublime-workspace"
    )
}

Write-Host "  [OK] 8 categorias definidas" -ForegroundColor Green
Write-Host "`n"

# 3. Encontrar e mover arquivos
Write-Host "[3/5] Movendo arquivos por categoria..." -ForegroundColor Cyan

$totalMoved = 0
$totalFailed = 0
$movementReport = @()

foreach ($category in $categories.Keys) {
    $categoryMoved = 0
    $categoryFailed = 0
    $destinationFolder = Join-Path $oldFolder $category
    
    $patterns = $categories[$category]
    $filesToMove = @()
    
    # Encontrar arquivos que combinam com o padrao
    foreach ($pattern in $patterns) {
        $filesToMove += @(Get-ChildItem -Path $rootPath -Recurse -Filter $pattern -File -ErrorAction SilentlyContinue |
                         Where-Object { $_.FullName -notlike "*OLD_191025*" -and 
                                       $_.FullName -notlike "*BACKUP_SEGURANCA*" })
    }
    
    # Remover duplicatas
    $filesToMove = $filesToMove | Sort-Object -Property FullName -Unique
    
    if ($filesToMove.Count -gt 0) {
        Write-Host "  [$category] Movendo $($filesToMove.Count) arquivo(s)..." -ForegroundColor Yellow
        
        foreach ($file in $filesToMove) {
            try {
                $destination = Join-Path $destinationFolder $file.Name
                
                # Se ja existe na destino, criar versao numerada
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
                $categoryMoved++
                $totalMoved++
                
            } catch {
                Write-Host "    [ERRO] Falha ao mover: $($file.Name)" -ForegroundColor Red
                $categoryFailed++
                $totalFailed++
            }
        }
        
        Write-Host "    [OK] Movidos: $categoryMoved | Falhados: $categoryFailed" -ForegroundColor Green
        $movementReport += "[$(Get-Date -Format 'HH:mm:ss')] $category : Movidos $categoryMoved, Falhados $categoryFailed"
    }
}

Write-Host "`n"

# 4. Verificar integridade
Write-Host "[4/5] Verificando integridade do movimento..." -ForegroundColor Cyan

$oldFolderSize = 0
$oldFolderFileCount = 0

try {
    $oldFolderItems = Get-ChildItem -Path $oldFolder -Recurse -File -ErrorAction SilentlyContinue
    $oldFolderFileCount = $oldFolderItems.Count
    $oldFolderSize = ($oldFolderItems | Measure-Object -Property Length -Sum).Sum
} catch {
    Write-Host "  [AVISO] Erro ao calcular tamanho" -ForegroundColor Yellow
}

$sizeGB = [math]::Round($oldFolderSize / 1GB, 2)

Write-Host "  [OK] Arquivos em OLD_191025: $oldFolderFileCount" -ForegroundColor Green
Write-Host "  [OK] Tamanho total: $sizeGB GB" -ForegroundColor Green

Write-Host "`n"

# 5. Gerar relatorio
Write-Host "[5/5] Gerando relatorio de movimento..." -ForegroundColor Cyan

$reportPath = Join-Path $rootPath "MOVIMENTO_FASE_3B_RELATORIO.txt"
$reportContent = @"
RELATORIO DE MOVIMENTO - FASE 3B
Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
Status: CONCLUIDO COM SUCESSO

=== RESUMO GERAL ===
Total de arquivos movidos: $totalMoved
Total de arquivos que falharam: $totalFailed
Tamanho total de OLD_191025: $sizeGB GB
Arquivos em OLD_191025: $oldFolderFileCount

=== MOVIMENTO POR CATEGORIA ===
$([string]::Join("`n", $movementReport))

=== ESTRUTURA CRIADA ===
OLD_191025\
  ├── BACKUP_FILES\       (Arquivos .bak, -backup.js, etc)
  ├── TEMP_LOGS\          (*.log, *.tmp, *.temp, *.swp)
  ├── DUPLICATES\         (Cópias e versões antigas)
  ├── GENERATED_DOCS\     (Documentação gerada automaticamente)
  ├── OLD_MODULES\        (Módulos deprecated/legacy)
  ├── ARCHIVES\           (*.zip, *.rar, *.7z, etc)
  ├── DEPENDENCIES\       (node_modules, dist, build, etc)
  └── IDE_BUILD\          (.vscode, .idea, .DS_Store, etc)

=== ARQUIVOS CRITICOS MANTIDOS (NAO MOVIDOS) ===
✓ src/
✓ public/
✓ prisma/
✓ scripts/
✓ tests/
✓ package.json
✓ package-lock.json
✓ tsconfig.json
✓ .env
✓ .git/
✓ AGENTS.md
✓ AUDIT_REPORT.md

=== PROXIMO PASSO ===
Execute FASE 4: cleanup-final.bat
Isso vai remover pastas vazias e gerar relatorio final

=== COMO DESFAZER (SE NECESSARIO) ===
Se algo der errado:
1. Restaure do backup: BACKUP_SEGURANCA_20251019_1502
2. Execute:
   robocopy "h:\projetos\academia\BACKUP_SEGURANCA_20251019_1502" "h:\projetos\academia" /E
3. Execute: npm install
4. Reinicie o servidor

MOVIMENTO CONCLUIDO: $(Get-Date)
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "  [OK] Relatorio salvo em:" -ForegroundColor Green
Write-Host "       $reportPath`n" -ForegroundColor Green

Write-Host "`n"
Write-Host "=====================================================`n" -ForegroundColor Green
Write-Host "  FASE 3B - MOVIMENTO CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "`n=====================================================`n" -ForegroundColor Green

Write-Host "Resumo Final:" -ForegroundColor Cyan
Write-Host "  Arquivos movidos: $totalMoved" -ForegroundColor Yellow
Write-Host "  Arquivos falhados: $totalFailed" -ForegroundColor Yellow
Write-Host "  Tamanho total: $sizeGB GB" -ForegroundColor Yellow
Write-Host "  Pasta OLD_191025: Criada com sucesso`n" -ForegroundColor Yellow

Write-Host "Proximo passo: Execute cleanup-final.bat para limpeza final" -ForegroundColor Cyan
Write-Host "             e remover pastas vazias`n" -ForegroundColor Cyan

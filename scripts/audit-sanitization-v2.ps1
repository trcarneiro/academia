# Script de Auditoria - Academia Krav Maga
# Versao: 2.0 (Simplificada e Robusta)
# Data: 19/10/2025

param(
    [string]$rootPath = "h:\projetos\academia"
)

Write-Host "=== AUDITORIA DE SANITIZACAO - FASE 1 ===" -ForegroundColor Green
Write-Host "Caminho: $rootPath`n" -ForegroundColor Yellow

# 1. Contar arquivos totais
Write-Host "[1/4] Contando arquivos..." -ForegroundColor Cyan
$allFiles = @(Get-ChildItem -Path $rootPath -Recurse -File -ErrorAction SilentlyContinue)
$totalCount = $allFiles.Count
Write-Host "  TOTAL: $totalCount arquivos`n" -ForegroundColor Green

# 2. Categorizar arquivos
Write-Host "[2/4] Categorizando arquivos..." -ForegroundColor Cyan

$categories = @{
    "BACKUP_FILES"   = @("*-backup.js", "*.bak", "*.backup", "*_old.js", "*.bak.ts")
    "TEMP_LOGS"      = @("*.log", "*.tmp", "*.temp", "*.log.gz")
    "DUPLICATES"     = @("*copy*.js", "*copy*.ts", "*OLD*.js", "*COPY*.js")
    "GENERATED_DOCS" = @("FIX_*.md", "*_COMPLETE.md", "*_REPORT.md", "BUGFIX_*.md")
    "OLD_MODULES"    = @("*deprecated*", "*legacy*", "*archived*")
    "ARCHIVES"       = @("*.zip", "*.rar", "*.7z", "*.tar.gz")
    "DEPENDENCIES"   = @("node_modules", "dist", "build", ".next", ".nuxt")
    "IDE_BUILD"      = @(".vscode", ".idea", ".DS_Store", "*.swp", "*.swo")
}

$categorizedFiles = @{}
foreach ($category in $categories.Keys) {
    $categorizedFiles[$category] = @()
}

foreach ($file in $allFiles) {
    $fileName = $file.Name
    $fullPath = $file.FullName
    
    $categorized = $false
    foreach ($category in $categories.Keys) {
        foreach ($pattern in $categories[$category]) {
            if ($fileName -like $pattern -or $fullPath -like "*$pattern*") {
                $categorizedFiles[$category] += $file
                $categorized = $true
                break
            }
        }
        if ($categorized) { break }
    }
}

# 3. Gerar relatorio
Write-Host "[3/4] Gerando relatorio..." -ForegroundColor Cyan

$report = "AUDITORIA DE SANITIZACAO - ACADEMIA`n"
$report += "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')`n`n"

$report += "=== RESUMO GERAL ===`n"
$report += "Total de arquivos: $totalCount`n"

$moveCount = 0
foreach ($category in $categories.Keys) {
    if ($categorizedFiles[$category].Count -gt 0) {
        $moveCount += $categorizedFiles[$category].Count
    }
}

$report += "Arquivos para mover: $moveCount`n`n"

$report += "=== ARQUIVOS POR CATEGORIA ===`n`n"

foreach ($category in $categories.Keys) {
    $count = $categorizedFiles[$category].Count
    if ($count -gt 0) {
        $report += "$category`: $count arquivos`n"
    }
}

$report += "`n=== CRITICAS (NAO SERÃO MOVIDAS) ===`n"
$report += "- AGENTS.md`n"
$report += "- AGENTS.md.bak`n"
$report += "- AUDIT_REPORT.md`n"
$report += "- src/`n"
$report += "- public/`n"
$report += "- prisma/`n"
$report += "- package.json`n"
$report += "- .git/`n"

# 4. Salvar relatorio
Write-Host "[4/4] Salvando relatorio..." -ForegroundColor Cyan

$reportPath = Join-Path $rootPath "AUDIT_SANITIZATION_REPORT.txt"
$report | Out-File -FilePath $reportPath -Encoding UTF8 -Force

Write-Host "`n=== RELATORIO GERADO ===`n" -ForegroundColor Green
Write-Host "Arquivo: $reportPath" -ForegroundColor Yellow
Write-Host "`nConteudo:`n" -ForegroundColor White
Write-Host $report -ForegroundColor White

Write-Host "`nProximo passo: Execute move-files-preview.bat para visualizar o movimento`n" -ForegroundColor Cyan

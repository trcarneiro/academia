# SCRIPT DE LIMPEZA - MÓDULO AI LEGADO
# Remove arquivos e pastas antigas da estrutura multi-file

Write-Host "🧹 Iniciando limpeza do módulo AI legado..." -ForegroundColor Cyan

$basePath = "public\js\modules\ai"

# Arquivos para deletar
$filesToDelete = @(
    "$basePath\index-legacy.js",
    "$basePath\ai-service-compiled.js"
)

# Pastas para deletar
$foldersToDelete = @(
    "$basePath\controllers",
    "$basePath\services",
    "$basePath\views"
)

# Deletar arquivos
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Deletado: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Não encontrado: $file" -ForegroundColor Yellow
    }
}

# Deletar pastas
foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Remove-Item $folder -Recurse -Force
        Write-Host "✅ Deletado: $folder" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Não encontrado: $folder" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Limpeza concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Arquivos restantes no módulo AI:" -ForegroundColor Cyan
Get-ChildItem $basePath -Recurse | Select-Object FullName

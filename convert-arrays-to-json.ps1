# Script PowerShell para converter arrays para Json no schema Prisma
# Apenas converte String[] e Json[] em definições de campos (não em enums)

$schemaPath = "prisma\schema.prisma"
$content = Get-Content $schemaPath -Raw

# Contar erros antes
Write-Host "🔍 Contando erros antes da conversão..." -ForegroundColor Cyan
$errorsBefore = (npx prisma validate 2>&1 | Select-String "Validation Error Count:").ToString()
Write-Host $errorsBefore

# Converter String[] para Json @default("[]") 
# Regex: busca por linhas com "  fieldName String[]" (início com 2+ espaços)
$content = $content -replace '(?m)^(\s+\w+\s+)String\[\](\s*)$', '$1Json @default("[]")$2'

# Converter Json[] para Json @default("[]")
$content = $content -replace '(?m)^(\s+\w+\s+)Json\[\](\s*)$', '$1Json @default("[]")$2'

# Salvar
Set-Content $schemaPath -Value $content -NoNewline

Write-Host "✅ Conversões aplicadas!" -ForegroundColor Green
Write-Host "   - String[] → Json @default(`"[]`")" -ForegroundColor Yellow
Write-Host "   - Json[] → Json @default(`"[]`")" -ForegroundColor Yellow

# Contar erros depois
Write-Host "`n🔍 Contando erros após conversão..." -ForegroundColor Cyan
$errorsAfter = (npx prisma validate 2>&1 | Select-String "Validation Error Count:").ToString()
Write-Host $errorsAfter

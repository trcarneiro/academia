# Script para remover @relation inválidos de campos Json no schema Prisma
# Remove @relation de campos Json que não são relationships válidas

$schemaPath = "prisma/schema.prisma"
$content = Get-Content $schemaPath -Raw

Write-Host "🔧 Removendo @relation inválidos de campos Json..." -ForegroundColor Cyan

# Pattern: Json @default("[]") @relation("...")
# Substitui por: Json @default("[]")
$content = $content -replace '(Json\s+@default\(\"[^\"]+\"\))\s+@relation\(\"[^\"]+\"\)', '$1'

# Salvar o arquivo corrigido
Set-Content $schemaPath -Value $content -NoNewline

Write-Host "✅ Schema corrigido!" -ForegroundColor Green
Write-Host "📝 Arquivo: $schemaPath" -ForegroundColor Yellow

# Executar validação
Write-Host "`n🧪 Testando validação do schema..." -ForegroundColor Cyan
npx prisma validate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Schema válido! Gerando Prisma Client..." -ForegroundColor Green
    npx prisma generate
} else {
    Write-Host "`n❌ Ainda há erros no schema." -ForegroundColor Red
}

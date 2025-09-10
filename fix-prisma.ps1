# Script para forçar regeneração do Prisma
Write-Host "🔄 Iniciando regeneração do Prisma..." -ForegroundColor Cyan

# Navegar para o diretório do projeto
Set-Location "h:\projetos\academia"

# Parar todos os processos Node
Write-Host "⏹️ Parando processos Node..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Limpar cache do Prisma
Write-Host "🧹 Limpando cache do Prisma..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "prisma\generated" -Recurse -Force -ErrorAction SilentlyContinue

# Aplicar schema no banco
Write-Host "📊 Aplicando schema no banco..." -ForegroundColor Green
npx prisma db push --force-reset --accept-data-loss

# Regenerar client
Write-Host "🔧 Regenerando client Prisma..." -ForegroundColor Green
npx prisma generate

# Verificar se foi regenerado
Write-Host "✅ Verificando se o client foi regenerado..." -ForegroundColor Green
$clientFile = "node_modules\.prisma\client\index.d.ts"
if (Test-Path $clientFile) {
    Write-Host "✅ Client regenerado com sucesso!" -ForegroundColor Green
    
    # Procurar pelos novos campos
    $hasCreditsValidity = Select-String -Path $clientFile -Pattern "creditsValidity" -Quiet
    $hasPricePerClass = Select-String -Path $clientFile -Pattern "pricePerClass" -Quiet
    
    if ($hasCreditsValidity -and $hasPricePerClass) {
        Write-Host "✅ Novos campos encontrados no client!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Novos campos NÃO encontrados no client!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Falha ao regenerar client!" -ForegroundColor Red
}

Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
npm run dev

# Script para forçar regeneração do Prisma Client
# Solução para arquivo .dll.node travado no Windows

Write-Host "🔄 Forçando regeneração do Prisma Client..." -ForegroundColor Cyan

# 1. Parar qualquer processo Node.js
Write-Host "1️⃣ Parando processos Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Remover pasta .prisma
Write-Host "2️⃣ Removendo pasta .prisma..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Pasta .prisma removida" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Pasta .prisma não existe" -ForegroundColor Gray
}

# 3. Regenerar Prisma Client
Write-Host "3️⃣ Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prisma Client regenerado com sucesso!" -ForegroundColor Green
    Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Execute: npm run dev" -ForegroundColor White
    Write-Host "   2. Teste a matrícula do aluno no navegador" -ForegroundColor White
} else {
    Write-Host "`n❌ Erro ao regenerar Prisma Client" -ForegroundColor Red
    Write-Host "   Tente fechar TODAS as janelas do VS Code e executar novamente" -ForegroundColor Yellow
}

Write-Host "`n🔍 Schema atual (StudentCourse):" -ForegroundColor Cyan
Select-String -Path "prisma\schema.prisma" -Pattern "model StudentCourse" -Context 0,20 | ForEach-Object { $_.Context.PostContext }

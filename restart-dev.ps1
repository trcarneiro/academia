# Script para reiniciar o servidor de desenvolvimento
# Mata todos os processos Node.js e reinicia o servidor

Write-Host "🔄 Reiniciando servidor de desenvolvimento..." -ForegroundColor Cyan

# Matar todos os processos Node.js
Write-Host "🚫 Matando processos Node.js..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Processos Node.js finalizados" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Nenhum processo Node.js encontrado" -ForegroundColor Gray
}

# Alternativa usando taskkill
try {
    taskkill /f /im node.exe 2>$null
} catch {
    # Ignora erro se não houver processos
}

# Matar processos na porta 3000 especificamente
Write-Host "🚫 Liberando porta 3000..." -ForegroundColor Yellow
try {
    $port3000 = netstat -ano | Select-String ":3000" | ForEach-Object {
        $line = $_.Line -split '\s+'
        $pid = $line[-1]
        if ($pid -match '^\d+$') {
            taskkill /pid $pid /f 2>$null
        }
    }
    Write-Host "✅ Porta 3000 liberada" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Porta 3000 já estava livre" -ForegroundColor Gray
}

# Aguardar um momento para garantir que os processos foram finalizados
Start-Sleep -Seconds 2

# Limpar cache do npm (opcional)
Write-Host "🧹 Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Reiniciar o servidor
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host "📍 Pasta atual: $(Get-Location)" -ForegroundColor Gray
Write-Host "⏱️ Aguarde alguns segundos para o servidor inicializar..." -ForegroundColor Gray
Write-Host ""

# Executar npm run dev
npm run dev
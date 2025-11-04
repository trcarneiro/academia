# ======================================================================
# Script: Confiar em Certificado SSL Self-Signed
# Propósito: Adicionar certificado às autoridades confiáveis do Windows
# Data: 18 de outubro de 2025
# ======================================================================

# Verificar se está rodando como Administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️ Este script precisa ser executado como Administrador!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Cyan
    Write-Host "1. Feche este PowerShell" -ForegroundColor White
    Write-Host "2. Clique com botão direito no PowerShell" -ForegroundColor White
    Write-Host "3. Selecione 'Executar como Administrador'" -ForegroundColor White
    Write-Host "4. Execute novamente: npm run cert:trust" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "🔒 Adicionando certificado às autoridades confiáveis..." -ForegroundColor Cyan
Write-Host ""

# Caminho do certificado
$certsPath = Join-Path $PSScriptRoot "..\certs"
$crtPath = Join-Path $certsPath "server.crt"

if (-not (Test-Path $crtPath)) {
    Write-Host "❌ Certificado não encontrado: $crtPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Execute primeiro: npm run cert:generate" -ForegroundColor Yellow
    exit 1
}

try {
    # Importar certificado
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($crtPath)
    
    Write-Host "📋 Detalhes do Certificado:" -ForegroundColor Cyan
    Write-Host "   Subject: $($cert.Subject)" -ForegroundColor Gray
    Write-Host "   Issuer: $($cert.Issuer)" -ForegroundColor Gray
    Write-Host "   Válido de: $($cert.NotBefore.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
    Write-Host "   Válido até: $($cert.NotAfter.ToString('dd/MM/yyyy HH:mm'))" -ForegroundColor Gray
    Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
    Write-Host ""
    
    # Adicionar ao Trusted Root Certification Authorities (Local Machine)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store(
        "Root", "LocalMachine"
    )
    $store.Open("ReadWrite")
    
    # Verificar se já existe
    $existing = $store.Certificates | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
    
    if ($existing) {
        Write-Host "ℹ️ Certificado já está nas autoridades confiáveis!" -ForegroundColor Yellow
        Write-Host "   Nenhuma ação necessária." -ForegroundColor Gray
    } else {
        $store.Add($cert)
        Write-Host "✅ Certificado adicionado às autoridades confiáveis com sucesso!" -ForegroundColor Green
        Write-Host "   Localização: Trusted Root Certification Authorities (Local Machine)" -ForegroundColor Gray
    }
    
    $store.Close()
    
    Write-Host ""
    Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
    Write-Host "1. Feche TODOS os navegadores abertos (importante!)" -ForegroundColor White
    Write-Host "2. Reinicie o servidor: npm run dev" -ForegroundColor White
    Write-Host "3. Abra o navegador e acesse: https://192.168.100.37:3000" -ForegroundColor White
    Write-Host "4. Verifique se o cadeado verde aparece (HTTPS funcionando)" -ForegroundColor White
    Write-Host "5. Teste a câmera no Check-in Kiosk" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 DICA: Se ainda aparecer aviso de segurança:" -ForegroundColor Yellow
    Write-Host "   - Limpe o cache do navegador (Ctrl+Shift+Delete)" -ForegroundColor Gray
    Write-Host "   - Reinicie o navegador completamente" -ForegroundColor Gray
    Write-Host "   - Ou clique em 'Avançado' e 'Prosseguir'" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Erro ao adicionar certificado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host ""
    Write-Host "💡 Alternativa Manual:" -ForegroundColor Cyan
    Write-Host "1. Pressione Win+R" -ForegroundColor White
    Write-Host "2. Digite: certmgr.msc" -ForegroundColor White
    Write-Host "3. Navegue: Autoridades de Certificação Raiz Confiáveis → Certificados" -ForegroundColor White
    Write-Host "4. Clique com botão direito → Todas as Tarefas → Importar" -ForegroundColor White
    Write-Host "5. Selecione: $crtPath" -ForegroundColor White
    Write-Host ""
    
    exit 1
}

Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""

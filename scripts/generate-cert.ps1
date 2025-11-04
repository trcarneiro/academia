# ======================================================================
# Script: Gerar Certificado SSL Self-Signed para Academia Krav Maga
# Propósito: Permitir acesso à câmera via HTTPS em rede local
# Data: 18 de outubro de 2025
# ======================================================================

Write-Host "🔒 Gerando certificado SSL self-signed..." -ForegroundColor Cyan
Write-Host ""

# Obter IP local da máquina
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }).IPAddress

if (-not $localIP) {
    Write-Host "⚠️ Não foi possível detectar IP local. Usando 192.168.100.37 como padrão." -ForegroundColor Yellow
    $localIP = "192.168.100.37"
}

Write-Host "📍 IP Local detectado: $localIP" -ForegroundColor Green
Write-Host ""

# Criar pasta para certificados
$certsPath = Join-Path $PSScriptRoot "..\certs"
if (-not (Test-Path $certsPath)) {
    New-Item -ItemType Directory -Force -Path $certsPath | Out-Null
    Write-Host "✅ Pasta 'certs' criada" -ForegroundColor Green
}

# Gerar certificado self-signed
Write-Host "🔧 Gerando certificado..." -ForegroundColor Cyan

try {
    $cert = New-SelfSignedCertificate `
        -DnsName $localIP, "localhost", "127.0.0.1" `
        -CertStoreLocation "cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(1) `
        -FriendlyName "Academia Krav Maga Dev Certificate" `
        -KeyLength 2048 `
        -KeyAlgorithm RSA `
        -HashAlgorithm SHA256 `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

    Write-Host "✅ Certificado gerado com sucesso!" -ForegroundColor Green
    Write-Host "   Thumbprint: $($cert.Thumbprint)" -ForegroundColor Gray
    Write-Host ""

    # Exportar certificado (.pfx)
    $pfxPath = Join-Path $certsPath "server.pfx"
    $password = ConvertTo-SecureString -String "academia2025" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
    Write-Host "✅ Arquivo PFX exportado: $pfxPath" -ForegroundColor Green

    # Exportar certificado público (.crt)
    $crtPath = Join-Path $certsPath "server.crt"
    Export-Certificate -Cert $cert -FilePath $crtPath | Out-Null
    Write-Host "✅ Arquivo CRT exportado: $crtPath" -ForegroundColor Green

    Write-Host ""
    Write-Host "⚠️ ATENÇÃO: Você precisa converter .pfx para .pem e .key" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opção 1: Usar OpenSSL (se instalado)" -ForegroundColor Cyan
    Write-Host "  openssl pkcs12 -in certs/server.pfx -nocerts -out certs/server.key -nodes -passin pass:academia2025" -ForegroundColor Gray
    Write-Host "  openssl pkcs12 -in certs/server.pfx -clcerts -nokeys -out certs/server.pem -passin pass:academia2025" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Opção 2: Instalar OpenSSL" -ForegroundColor Cyan
    Write-Host "  Download: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Gray
    Write-Host "  Ou via Chocolatey: choco install openssl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Opção 3: Usar script automático (se OpenSSL disponível)" -ForegroundColor Cyan
    Write-Host "  npm run cert:convert" -ForegroundColor Gray
    Write-Host ""
    
    # Tentar converter automaticamente se OpenSSL estiver disponível
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($opensslPath) {
        Write-Host "🔧 OpenSSL detectado! Convertendo automaticamente..." -ForegroundColor Cyan
        
        $keyPath = Join-Path $certsPath "server.key"
        $pemPath = Join-Path $certsPath "server.pem"
        
        & openssl pkcs12 -in $pfxPath -nocerts -out $keyPath -nodes -passin pass:academia2025 2>$null
        & openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $pemPath -passin pass:academia2025 2>$null
        
        if ((Test-Path $keyPath) -and (Test-Path $pemPath)) {
            Write-Host "✅ Conversão concluída com sucesso!" -ForegroundColor Green
            Write-Host "   server.key: $keyPath" -ForegroundColor Gray
            Write-Host "   server.pem: $pemPath" -ForegroundColor Gray
            Write-Host ""
            Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
            Write-Host "1. Confiar no certificado: npm run cert:trust" -ForegroundColor White
            Write-Host "2. Reiniciar servidor: npm run dev" -ForegroundColor White
            Write-Host "3. Acessar: https://$localIP:3000" -ForegroundColor White
        } else {
            Write-Host "❌ Erro na conversão. Execute os comandos OpenSSL manualmente." -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "📋 RESUMO:" -ForegroundColor Cyan
    Write-Host "  📁 Pasta certificados: $certsPath" -ForegroundColor White
    Write-Host "  🔑 Senha PFX: academia2025" -ForegroundColor White
    Write-Host "  📍 IPs incluídos: $localIP, localhost, 127.0.0.1" -ForegroundColor White
    Write-Host "  📅 Validade: 1 ano (até $(Get-Date).AddYears(1).ToString('dd/MM/yyyy'))" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "❌ Erro ao gerar certificado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

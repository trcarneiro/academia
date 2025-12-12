
# Script de Diagnóstico Remoto
$ErrorActionPreference = "Stop"

function Load-EnvFile {
    if (-not (Test-Path ".env")) { throw ".env não encontrado" }
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $envVars[$matches[1].Trim()] = $matches[2].Trim().Trim('"').Trim("'")
        }
    }
    return $envVars
}

$env = Load-EnvFile
$REMOTE_IP = $env['REMOTE_SERVER_IP']
$REMOTE_USER = $env['REMOTE_SERVER_USER']
$REMOTE_PASS = $env['REMOTE_SERVER_PASSWORD']
$REMOTE_PORT = $env['REMOTE_SERVER_PORT']

function Invoke-RemoteCommand {
    param([string]$Command)
    Write-Host "Executando: $Command" -ForegroundColor Cyan
    # Usando echo y para aceitar fingerprint se necessario
    echo y | plink -batch -pw $REMOTE_PASS -P $REMOTE_PORT "$REMOTE_USER@$REMOTE_IP" $Command
}

Write-Host "--- DIAGNÓSTICO DO SERVIDOR ---" -ForegroundColor Green

Write-Host "`n1. PROCESSOS PM2"
Invoke-RemoteCommand "pm2 list"

Write-Host "`n2. PORTAS OUVINDO (Procurando :3000)"
Invoke-RemoteCommand "netstat -tlpn | grep 3000"

Write-Host "`n3. LOGS RECENTES"
Invoke-RemoteCommand "pm2 logs academia --lines 50 --nostream"

Write-Host "`n4. TESTE LOCAL (HTTP)"
Invoke-RemoteCommand "curl -I http://localhost:3000"

Write-Host "`n5. ARQUIVO .ENV"
Invoke-RemoteCommand "ls -la /var/www/academia/.env"


$ErrorActionPreference = "Stop"

function Load-EnvFile {
    if (-not (Test-Path ".env")) { throw ".env não encontrado!" }
    $envVars = @{}
    Get-Content ".env" -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $envVars[$matches[1].Trim()] = $matches[2].Trim().Trim('"').Trim("'")
        }
    }
    return $envVars
}

$env = Load-EnvFile
$REMOTE_USER = $env['REMOTE_SERVER_USER']
$REMOTE_IP = $env['REMOTE_SERVER_IP']
$REMOTE_PORT = $env['REMOTE_SERVER_PORT']
$REMOTE_PASSWORD = $env['REMOTE_SERVER_PASSWORD']

Write-Host "Tentando recuperar serviço em $REMOTE_IP..."

# Tenta reiniciar com o nome CORRETO descoberto no diagnóstico
$cmd = "pm2 restart academia-backend || pm2 restart academia"

# Verifica se subiu
$cmdCheck = "sleep 5 && curl -I http://localhost:3000"

$fullCmd = "$cmd && $cmdCheck"

$args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $fullCmd)

Start-Process -FilePath "plink" -ArgumentList $args -NoNewWindow -Wait

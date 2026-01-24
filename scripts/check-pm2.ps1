
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

Write-Host "Verificando PM2 EM $REMOTE_IP..."

$cmd = "pm2 list && echo '--- LOGS ---' && pm2 logs --lines 20 --nostream"

$args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cmd)

Start-Process -FilePath "plink" -ArgumentList $args -NoNewWindow -Wait


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

Write-Host "Investigando logs em $REMOTE_IP..."

$commands = @(
    "echo '--- PROCESSOS NODE ---'",
    "ps aux | grep node",
    "echo '--- ARQUIVOS DE LOG ---'",
    "ls -la /root/.pm2/logs/",
    "echo '--- LOG DE ERRO (academia-backend) ---'",
    "tail -n 50 /root/.pm2/logs/academia-backend-error.log || echo 'Log nao encontrado'",
    "echo '--- LOG DE ERRO (academia) ---'",
    "tail -n 50 /root/.pm2/logs/academia-error.log || echo 'Log nao encontrado'"
)

$remoteCmd = $commands -join " && "
$args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $remoteCmd)

try {
    Start-Process -FilePath "plink" -ArgumentList $args -NoNewWindow -Wait
}
catch {
    Write-Error "Falha ao conectar: $_"
}

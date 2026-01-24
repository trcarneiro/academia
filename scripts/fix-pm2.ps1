
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
$REMOTE_PATH = $env['REMOTE_SERVER_PATH']

Write-Host "Aplicando correção no PM2 em $REMOTE_IP..."

# Comandos para corrigir o PM2
$commands = @(
    "echo '--- PARANDO PROCESSOS ANTIGOS ---'",
    "pm2 delete academia-backend || true",
    "pm2 delete academia || true",
    
    "echo '--- INICIANDO NOVO PROCESSO ---'",
    "cd $REMOTE_PATH",
    # Inicia apontando explicitamente para o dist/server.js
    "NODE_ENV=production pm2 start dist/server.js --name academia-backend --update-env",
    
    "echo '--- SALVANDO ---'",
    "pm2 save",
    
    "echo '--- VERIFICANDO ---'",
    "sleep 2",
    "pm2 list",
    "curl -I http://localhost:3000 || echo 'Falha ao conectar localmente'"
)

$remoteCmd = $commands -join " && "
$args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $remoteCmd)

try {
    Start-Process -FilePath "plink" -ArgumentList $args -NoNewWindow -Wait
    Write-Host "Comando de recuperação enviado com sucesso."
}
catch {
    Write-Error "Falha ao conectar: $_"
}

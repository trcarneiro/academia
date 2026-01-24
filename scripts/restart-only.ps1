
$ErrorActionPreference = "Stop"

# Carregar variáveis do .env
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

Write-Host "Tentando reiniciar o serviço academia em $REMOTE_IP..."

# Tenta reiniciar usando diretório completo para pegar o contexto do PM2 se necessário
# Ou apenas pm2 restart se estiver no PATH global
$cmd = "pm2 restart academia || pm2 start /var/www/academia/ecosystem.config.js || systemctl restart academia"

$args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cmd)

try {
    Start-Process -FilePath "plink" -ArgumentList $args -NoNewWindow -Wait
    Write-Host "Comando enviado."
}
catch {
    Write-Error "Falha ao conectar: $_"
}

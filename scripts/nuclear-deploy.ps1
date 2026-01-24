
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

Write-Host "INICIANDO DEPLOY NUCLEAR EM $REMOTE_IP..."

# 1. DELETE remoto
Write-Host "1. Apagando dist remota..."
$cleanCmd = "rm -rf $REMOTE_PATH/dist"
$argsClean = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cleanCmd)
Start-Process -FilePath "plink" -ArgumentList $argsClean -NoNewWindow -Wait

# 2. UPLOAD Recursivo
Write-Host "2. Enviando dist limpa e compilada..."
# pscp -r -v dist root@IP:/var/www/academia/dist
# Nota: pscp copia O DIRETORIO se o destino não terminar em /. Vamos garantir.
# Se eu mandar 'dist', ele cria 'dist' no destino.
# Destino deve ser /var/www/academia/
$argsUpload = @("-r", "-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "dist", "$REMOTE_USER@${REMOTE_IP}:$REMOTE_PATH/")
Start-Process -FilePath "pscp" -ArgumentList $argsUpload -NoNewWindow -Wait

# 3. RESTART
Write-Host "3. Reiniciando serviço..."
$restartCmd = "pm2 restart academia-backend || pm2 restart academia"
$argsRestart = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $restartCmd)
Start-Process -FilePath "plink" -ArgumentList $argsRestart -NoNewWindow -Wait

Write-Host "Deploy Nuclear Concluído."

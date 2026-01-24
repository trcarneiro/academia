
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
$REMOTE_PATH = $env['REMOTE_SERVER_PATH'] 
$REMOTE_PORT = $env['REMOTE_SERVER_PORT']
$REMOTE_PASSWORD = $env['REMOTE_SERVER_PASSWORD']

Write-Host "Puxando arquivos de emergência para $REMOTE_IP (ALVO DUPLO)..."

$files = @(
    # TARGET 1: DIST
    @{
        Local  = "dist/public/js/modules/checkin-kiosk/views/CameraView.v2.js"
        Remote = "$REMOTE_PATH/dist/public/js/modules/checkin-kiosk/views/"
    },
    @{
        Local  = "dist/public/js/modules/checkin-kiosk/controllers/CheckinController.v2.js"
        Remote = "$REMOTE_PATH/dist/public/js/modules/checkin-kiosk/controllers/"
    },
    @{
        Local  = "dist/public/js/dashboard/spa-router.js"
        Remote = "$REMOTE_PATH/dist/public/js/dashboard/"
    },

    # TARGET 2: PUBLIC ROOT (Fallback for Weird Nginx Config)
    @{
        Local  = "dist/public/js/modules/checkin-kiosk/views/CameraView.v2.js"
        Remote = "$REMOTE_PATH/public/js/modules/checkin-kiosk/views/"
    },
    @{
        Local  = "dist/public/js/modules/checkin-kiosk/controllers/CheckinController.v2.js"
        Remote = "$REMOTE_PATH/public/js/modules/checkin-kiosk/controllers/"
    },
    @{
        Local  = "dist/public/js/dashboard/spa-router.js"
        Remote = "$REMOTE_PATH/public/js/dashboard/"
    }
)

foreach ($file in $files) {
    if (-not (Test-Path $file.Local)) {
        Write-Error "Arquivo local não encontrado: $($file.Local)"
        continue
    }

    Write-Host "Enviando $($file.Local) para $($file.Remote)..."
    
    # Criar diretório remoto se não existir
    $mkdirCmd = "mkdir -p $($file.Remote)"
    $plinkArgs = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $mkdirCmd)
    Start-Process -FilePath "plink" -ArgumentList $plinkArgs -NoNewWindow -Wait

    # Usar pscp
    $args = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, $file.Local, "$REMOTE_USER@${REMOTE_IP}:$($file.Remote)")
    
    $process = Start-Process -FilePath "pscp" -ArgumentList $args -NoNewWindow -PassThru -Wait
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Sucesso" -ForegroundColor Green
    }
    else {
        Write-Error "❌ Falha (Exit Code: $($process.ExitCode))"
    }
}

Write-Host "Verificando processos PM2..."
$listArgs = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", "pm2 list")
Start-Process -FilePath "plink" -ArgumentList $listArgs -NoNewWindow -Wait

Write-Host "Tentando reiniciar..."
$restartArgs = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", "cd $REMOTE_PATH && pm2 restart ecosystem.config.js || pm2 restart academia || pm2 restart all")
# Tenta reiniciar tudo se falhar o específico
Start-Process -FilePath "plink" -ArgumentList $restartArgs -NoNewWindow -Wait
Write-Host "Fim do script."

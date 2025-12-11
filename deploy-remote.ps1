# 🚀 Script de Deploy Remoto - Academia Krav Maga v2.0
# Deploy do Windows para servidor Linux via SSH

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Step { param($msg) Write-Host "`n[STEP] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }

# Carregar variáveis do .env
function Load-EnvFile {
    Write-Step "Carregando configurações do .env..."
    
    if (-not (Test-Path ".env")) {
        Write-Error "Arquivo .env não encontrado!"
        exit 1
    }
    
    $envVars = @{}
    $lines = Get-Content ".env" -Encoding UTF8
    
    foreach ($line in $lines) {
        if ($line -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            if ($key) {
                $envVars[$key] = $value
            }
        }
    }
    
    Write-Host "  Encontradas $($envVars.Count) variáveis." -ForegroundColor DarkGray
    return $envVars
}

$env = Load-EnvFile

# Configurações do servidor remoto
$REMOTE_USER = $env['REMOTE_SERVER_USER']
$REMOTE_IP = $env['REMOTE_SERVER_IP']
$REMOTE_PATH = $env['REMOTE_SERVER_PATH']
$REMOTE_PORT = $env['REMOTE_SERVER_PORT']
$REMOTE_PASSWORD = $env['REMOTE_SERVER_PASSWORD']

if ([string]::IsNullOrWhiteSpace($REMOTE_IP)) {
    Write-Error "REMOTE_SERVER_IP nao encontrado no .env"
    exit 1
}

Write-Host "----------------------------------------" -ForegroundColor Magenta
Write-Host "Deploy Academia Krav Maga v2.0" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Magenta
Write-Host "📍 Servidor: $REMOTE_USER@$REMOTE_IP"
Write-Host "📂 Destino: $REMOTE_PATH"
Write-Host ""

if ($DryRun) {
    Write-Warning "MODO DRY-RUN ATIVADO - Nenhuma alteração será feita"
}

# Verificar se plink/pscp estão disponíveis (PuTTY)
$hasPlink = Get-Command plink -ErrorAction SilentlyContinue
$hasPscp = Get-Command pscp -ErrorAction SilentlyContinue

if (-not $hasPlink -or -not $hasPscp) {
    Write-Warning "PuTTY não encontrado. Instalando..."
    Write-Host "Por favor, instale o PuTTY: https://www.putty.org/"
    Write-Host "Ou use: winget install PuTTY.PuTTY"
    exit 1
}

# 1. BUILD LOCAL
if (-not $SkipBuild) {
    Write-Step "Compilando aplicação localmente..."
    
    try {
        npm run build
        Write-Success "Build concluído com sucesso"
    } catch {
        Write-Error "Falha no build: $_"
        exit 1
    }
} else {
    Write-Warning "Build ignorado (-SkipBuild)"
}

# 2. TESTES
if (-not $SkipTests) {
    Write-Step "Executando testes..."
    
    try {
        npm run test -- --run
        Write-Success "Testes passaram"
    } catch {
        Write-Error "Testes falharam: $_"
        $continue = Read-Host "Continuar mesmo assim? (s/n)"
        if ($continue -ne 's') { exit 1 }
    }
} else {
    Write-Warning "Testes ignorados (-SkipTests)"
}

# 3. CRIAR ARQUIVO DE EXCLUSÃO
Write-Step "Preparando arquivos para upload..."

$excludeFile = ".deploy-exclude.txt"
@"
node_modules/
.git/
dist-simple/
logs/
backups/
backup/
tests/
.env.local
.env.backup
*.log
*.md
.github/
.vscode/
coverage/
"@ | Out-File -FilePath $excludeFile -Encoding UTF8

Write-Success "Lista de exclusao criada"

# 4. FUNÇÃO PARA EXECUTAR COMANDOS SSH
function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [switch]$Silent = $false
    )
    
    if ($DryRun) {
        Write-Host "  [DRY-RUN] $Command" -ForegroundColor DarkGray
        return
    }
    
    if (-not $Silent) {
        Write-Host "  -> Executando: $Command" -ForegroundColor DarkGray
    }
    
    if ([string]::IsNullOrWhiteSpace($REMOTE_IP)) {
        throw "REMOTE_SERVER_IP nao definido no .env"
    }

    $password = $REMOTE_PASSWORD
    $plinkCmd = "plink"
    $args = @("-batch", "-pw", $password, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $Command)
    
    # Executar plink e capturar saída
    $process = Start-Process -FilePath $plinkCmd -ArgumentList $args -NoNewWindow -PassThru -Wait
    
    if ($process.ExitCode -ne 0) {
        throw "Erro ao executar comando remoto (Exit Code: $($process.ExitCode))"
    }
}

# 5. VERIFICAR CONEXÃO
Write-Step "Verificando conexão SSH..."

try {
    Invoke-RemoteCommand "echo 'Conexão OK'" -Silent
    Write-Success "Conectado ao servidor"
} catch {
    Write-Error "Falha na conexão SSH: $_"
    exit 1
}

# 6. BACKUP REMOTO
Write-Step "Criando backup no servidor..."

$backupDir = "$REMOTE_PATH/backups/backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
Invoke-RemoteCommand "mkdir -p $backupDir"
Invoke-RemoteCommand "cp $REMOTE_PATH/.env $backupDir/.env 2>/dev/null || true"
Invoke-RemoteCommand "cp -r $REMOTE_PATH/dist $backupDir/dist 2>/dev/null || true"

Write-Success "Backup criado em $backupDir"

# 7. SINCRONIZAR ARQUIVOS
Write-Step "Enviando arquivos para o servidor..."

if (-not $DryRun) {
    # Usando rsync via WSL se disponível, senão usa pscp
    $hasWsl = Get-Command wsl -ErrorAction SilentlyContinue
    
    if ($hasWsl) {
        Write-Host "  Usando rsync (WSL)..." -ForegroundColor DarkGray
        
        $wslPath = wsl wslpath -a (Get-Location).Path
        
        wsl rsync -avz --delete `
            --exclude-from=".deploy-exclude.txt" `
            -e "ssh -p $REMOTE_PORT" `
            "$wslPath/" `
            "$REMOTE_USER@${REMOTE_IP}:$REMOTE_PATH/"
    } else {
        Write-Host "  Usando pscp (PuTTY)..." -ForegroundColor DarkGray
        
        # Upload dos arquivos essenciais
        $filesToUpload = @(
            "dist/*",
            "public/*",
            "prisma/*",
            "package.json",
            "package-lock.json",
            ".env"
        )
        
        foreach ($file in $filesToUpload) {
            pscp -batch -pw $REMOTE_PASSWORD -P $REMOTE_PORT -r $file "$REMOTE_USER@${REMOTE_IP}:$REMOTE_PATH/"
        }
    }
    
    Write-Success "Arquivos sincronizados"
} else {
    Write-Host "  [DRY-RUN] Sincronização de arquivos" -ForegroundColor DarkGray
}

# 8. INSTALAR DEPENDÊNCIAS NO SERVIDOR
Write-Step "Instalando dependências no servidor..."

Invoke-RemoteCommand "cd $REMOTE_PATH && npm ci --production --silent"
Write-Success "Dependências instaladas"

# 9. GERAR PRISMA CLIENT
Write-Step "Gerando Prisma Client..."

Invoke-RemoteCommand "cd $REMOTE_PATH && npx prisma generate"
Write-Success "Prisma Client gerado"

# 10. EXECUTAR MIGRATIONS
Write-Step "Executando migrations do banco de dados..."

Invoke-RemoteCommand "cd $REMOTE_PATH && npx prisma db push --skip-generate"
Write-Success "Migrations aplicadas"

# 11. REINICIAR SERVIÇO
Write-Step "Reiniciando serviço..."

# Verifica se está usando PM2 ou systemd
$pm2Status = Invoke-RemoteCommand "which pm2" -Silent

if ($pm2Status) {
    Write-Host "  Usando PM2..." -ForegroundColor DarkGray
    Invoke-RemoteCommand "cd $REMOTE_PATH && pm2 restart academia || pm2 start ecosystem.config.js"
    Invoke-RemoteCommand "pm2 save"
} else {
    Write-Host "  Usando systemd..." -ForegroundColor DarkGray
    Invoke-RemoteCommand "sudo systemctl restart academia"
}

Write-Success "Serviço reiniciado"

# 12. VERIFICAR STATUS
Write-Step "Verificando status do serviço..."

Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://$REMOTE_IP:3000/health" -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Aplicação respondendo corretamente!"
    } else {
        Write-Warning "Aplicação respondeu com status: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Não foi possível verificar o health check: $_"
}

# 13. LOGS
Write-Step "Últimas linhas do log:"
Invoke-RemoteCommand "cd $REMOTE_PATH && (pm2 logs academia --lines 10 --nostream || journalctl -u academia -n 10 --no-pager)"

# RESUMO
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Host "URL: http://$REMOTE_IP:3000"
Write-Host "Logs: ssh $REMOTE_USER@$REMOTE_IP -p $REMOTE_PORT 'pm2 logs academia'"
Write-Host "Restart: ssh $REMOTE_USER@$REMOTE_IP -p $REMOTE_PORT 'pm2 restart academia'"
Write-Host ""

# Limpar arquivo temporário
Remove-Item $excludeFile -ErrorAction SilentlyContinue

Write-Host "Deploy finalizado em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Magenta

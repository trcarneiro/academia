
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

Write-Host "Diagnosing server $REMOTE_IP..."

# 1. Check disk space (common cause for random crashes)
Write-Host "--- DISK USAGE ---"
$cmdDisk = "df -h"
$argsDisk = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cmdDisk)
Start-Process -FilePath "plink" -ArgumentList $argsDisk -NoNewWindow -Wait

# 2. Check PM2 List
Write-Host "`n--- PM2 LIST ---"
$cmdList = "pm2 list"
$argsList = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cmdList)
Start-Process -FilePath "plink" -ArgumentList $argsList -NoNewWindow -Wait

# 3. Check logs (last 50 lines)
Write-Host "`n--- PM2 LOGS (Last 50) ---"
$cmdLogs = "pm2 logs academia --lines 50 --nostream" 
# Note: --nostream is implied if not following, but let's be sure. plink closes after command usually.
$argsLogs = @("-batch", "-pw", $REMOTE_PASSWORD, "-P", $REMOTE_PORT, "$REMOTE_USER@$REMOTE_IP", $cmdLogs)
Start-Process -FilePath "plink" -ArgumentList $argsLogs -NoNewWindow -Wait

Write-Host "Diagnosis complete."

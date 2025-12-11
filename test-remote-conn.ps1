
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim().Trim('"').Trim("'")
    }
}

$REMOTE_USER = $envVars['REMOTE_SERVER_USER']
$REMOTE_IP = $envVars['REMOTE_SERVER_IP']
$REMOTE_PASSWORD = $envVars['REMOTE_SERVER_PASSWORD']

Write-Host "Testing connection to Supabase from Remote Server..."
$cmd = "nslookup aws-0-us-east-2.pooler.supabase.com"
echo y | plink -ssh -pw $REMOTE_PASSWORD $REMOTE_USER@$REMOTE_IP $cmd

$ErrorActionPreference = "Stop"

# 1. Ler a chave pública gerada
$KeyPath = "$env:USERPROFILE\.ssh\id_rsa_academia.pub"
if (-not (Test-Path $KeyPath)) {
    Write-Error "Chave pública não encontrada em $KeyPath"
    exit 1
}
$PublicKey = Get-Content $KeyPath -Raw
$PublicKey = $PublicKey.Trim()

# 2. Instruções para o usuário
Write-Host "🔑 Configurando acesso SSH sem senha..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------"
Write-Host "Vou conectar ao servidor para instalar a chave."
Write-Host "Quando pedir a senha, digite (ou cole):" -ForegroundColor Yellow
Write-Host "Ojqemgeowt*a1" -ForegroundColor Green
Write-Host "--------------------------------------------------"

# 3. Copiar a chave para o servidor
# Usamos ssh simples para executar o comando de append
$RemoteCommand = "mkdir -p ~/.ssh && echo '$PublicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"

ssh root@64.227.28.147 $RemoteCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Chave copiada com sucesso!" -ForegroundColor Green
    
    # 4. Testar a conexão
    Write-Host "🔄 Testando conexão automática..."
    ssh -i "$env:USERPROFILE\.ssh\id_rsa_academia" -o BatchMode=yes -o ConnectTimeout=5 root@64.227.28.147 "echo '🎉 Sucesso! Acesso SSH configurado.'"
} else {
    Write-Host "`n❌ Falha ao copiar a chave. Verifique a senha e tente novamente." -ForegroundColor Red
}
